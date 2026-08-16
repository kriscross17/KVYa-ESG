import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { prisma } from './prisma.js';
import { authenticate, requireRoles } from './middleware/auth.js';
import { calculateEsg } from './services/esg.js';
import { normalizedBuilding, normalizedOperational, validateMetrics, validateSubmissionCompleteness, validateStatusTransition } from './services/submissionValidation.js';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const uploadDir=path.resolve(__dirname,'..',process.env.UPLOAD_DIR||'uploads');
fs.mkdirSync(uploadDir,{recursive:true});
const upload=multer({dest:uploadDir,limits:{fileSize:10*1024*1024},fileFilter:(_req,file,cb)=>{const allowed=new Set(['application/pdf','image/jpeg','image/png','image/webp']);if(!allowed.has(file.mimetype))return cb(new Error('Unsupported file type'));cb(null,true);}});
const app=express();
app.use(helmet());
const allowedOrigins=(process.env.CORS_ORIGIN||'http://localhost:5173').split(',').map(s=>s.trim());
app.use(cors({origin:(origin,callback)=>{if(!origin||allowedOrigins.includes(origin))return callback(null,true);return callback(new Error('CORS origin not allowed'));}}));
app.use(express.json({limit:'2mb'}));

const loginAttempts = new Map();
function loginRateLimit(req){
  const key=req.ip||'unknown';
  const now=Date.now();
  const current=loginAttempts.get(key);
  if(!current||now-current.startedAt>15*60*1000){loginAttempts.set(key,{startedAt:now,count:1});return true;}
  current.count+=1;
  return current.count<=20;
}

app.get('/api/health',async(_req,res)=>{ try{await prisma.$queryRaw`SELECT 1`;res.json({ok:true,service:'sih-brsr-api',database:'connected'});}catch{res.status(503).json({ok:false,service:'sih-brsr-api',database:'unavailable'});} });

app.post('/api/auth/login',async(req,res)=>{
  if(!loginRateLimit(req))return res.status(429).json({error:'Too many login attempts. Please try again later.'});
  const parsed=z.object({email:z.string().email(),password:z.string().min(1)}).safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:'Valid email and password are required'});
  const user=await prisma.user.findUnique({where:{email:parsed.data.email.toLowerCase()},include:{office:true}});
  if(!user||!(await bcrypt.compare(parsed.data.password,user.passwordHash)))return res.status(401).json({error:'Invalid credentials'});
  const token=jwt.sign({userId:user.id,role:user.role},process.env.JWT_SECRET,{expiresIn:'8h'});
  res.json({token,user:{id:user.id,email:user.email,name:user.name,role:user.role,officeId:user.officeId,office:user.office ? {id:user.office.id,name:user.office.name,state:user.office.state,district:user.office.district,region:user.office.region} : null}});
});
app.get('/api/auth/me',authenticate,async(req,res)=>{ const user=await prisma.user.findUnique({where:{id:req.user.id},include:{office:true}}); res.json({user:{id:user.id,email:user.email,name:user.name,role:user.role,officeId:user.officeId,office:user.office ? {id:user.office.id,name:user.office.name,state:user.office.state,district:user.office.district,region:user.office.region} : null}}); });
app.get('/api/offices',authenticate,async(req,res)=>{ const where=req.user.role==='OPERATOR'?{id:req.user.officeId||'__none__'}:{}; res.json(await prisma.office.findMany({where,orderBy:{name:'asc'}})); });
app.get('/api/offices/:id',authenticate,async(req,res)=>{const office=await prisma.office.findUnique({where:{id:req.params.id},include:{submissions:{include:{buildingData:true,operationalData:true},orderBy:{updatedAt:'desc'}}}}); if(!office)return res.status(404).json({error:'Office not found'}); if(req.user.role==='OPERATOR'&&office.id!==req.user.officeId)return res.status(403).json({error:'You cannot access another office'}); res.json(office);});

const submissionInclude={office:true,operator:{select:{id:true,name:true,email:true}},buildingData:true,operationalData:true,evidence:true,history:{orderBy:{createdAt:'asc'}},auditLogs:{orderBy:{createdAt:'desc'}}};
const eventClients = new Set();
app.get('/api/events/ticket',authenticate,(req,res)=>{
  const ticket=jwt.sign({userId:req.user.id,role:req.user.role,officeId:req.user.officeId||null,purpose:'sse'},process.env.JWT_SECRET,{expiresIn:'60s'});
  res.setHeader('Cache-Control','no-store');
  res.json({ticket});
});
app.get('/api/events', async (req,res)=>{
  try {
    const ticket=typeof req.query.ticket==='string'?req.query.ticket:'';
    const payload=jwt.verify(ticket,process.env.JWT_SECRET);
    if(payload.purpose!=='sse') return res.status(401).end();
    const user=await prisma.user.findUnique({where:{id:payload.userId},select:{id:true,role:true,officeId:true}});
    if(!user)return res.status(401).end();
    res.setHeader('Content-Type','text/event-stream');
    res.setHeader('Cache-Control','no-cache, no-transform');
    res.setHeader('Connection','keep-alive');
    res.setHeader('X-Accel-Buffering','no');
    res.flushHeaders?.();
    res.write(`event: connected\ndata: ${JSON.stringify({at:new Date().toISOString()})}\n\n`);
    const client={res,user}; eventClients.add(client);
    const heartbeat=setInterval(()=>res.write(': heartbeat\n\n'),25000);
    req.on('close',()=>{clearInterval(heartbeat);eventClients.delete(client);});
  } catch { res.status(401).end(); }
});
function emitSubmissionUpdated(app,payload){
  for(const client of eventClients){
    const user=client.user;
    if(user.role!=='OPERATOR'||user.officeId===payload?.submission?.officeId){
      try{client.res.write(`event: submission.updated\ndata: ${JSON.stringify(payload)}\n\n`);}catch{eventClients.delete(client);}
    }
  }
}
function canAccess(user,s){return user.role!=='OPERATOR'||s.operatorId===user.id;}

app.get('/api/submissions',authenticate,async(req,res)=>{
  const where=req.user.role==='OPERATOR'?{operatorId:req.user.id}:{ };
  if(req.query.status){
    const allowed=['DRAFT','PENDING_REVIEW','APPROVED','REJECTED','RETURNED'];
    if(!allowed.includes(req.query.status)) return res.status(400).json({error:'Invalid submission status'});
    where.status=req.query.status;
  }
  const rows=await prisma.submission.findMany({where,include:submissionInclude,orderBy:{updatedAt:'desc'}});
  res.json(rows.map(s=>({...s,esg:calculateEsg(s)})));
});
app.get('/api/submissions/:id',authenticate,async(req,res)=>{const s=await prisma.submission.findUnique({where:{id:req.params.id},include:submissionInclude});if(!s||!canAccess(req.user,s))return res.status(404).json({error:'Submission not found'});res.json({...s,esg:calculateEsg(s)});});

const submissionSchema=z.object({officeId:z.string().optional(),postOffice:z.string().optional(),reportingPeriod:z.string().trim().min(1).max(40),status:z.enum(['DRAFT','PENDING_REVIEW']).optional(),clientId:z.string().max(100).optional(),buildingData:z.record(z.any()).optional(),operationalData:z.record(z.any()).optional()});

app.post('/api/submissions',authenticate,requireRoles('OPERATOR','ADMIN'),async(req,res)=>{
  const parsed=submissionSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Invalid submission payload',details:parsed.error.flatten()});
  const d=parsed.data;
  let officeId=req.user.role==='OPERATOR'?(req.user.officeId||d.officeId):d.officeId;
  if(!officeId&&d.postOffice){const office=await prisma.office.findUnique({where:{name:d.postOffice}});officeId=office?.id;}
  if(!officeId)return res.status(400).json({error:'Office could not be resolved'});
  if(req.user.role==='OPERATOR'&&d.officeId&&req.user.officeId&&d.officeId!==req.user.officeId)return res.status(403).json({error:'You cannot create a submission for another office'});
  const b=normalizedBuilding(d.buildingData),o=normalizedOperational(d.operationalData),errors=validateMetrics(b,o);
  if(d.status==='PENDING_REVIEW') errors.push(...validateSubmissionCompleteness(b,o));
  if(errors.length)return res.status(422).json({error:'Validation failed',details:errors});
  const existing=d.clientId?await prisma.submission.findUnique({where:{clientId:d.clientId}}):null;
  if(existing){if(!canAccess(req.user,existing))return res.status(403).json({error:'You cannot access this submission'});return res.status(200).json({...existing,esg:calculateEsg(existing)});}
  const status=d.status==='PENDING_REVIEW'?'PENDING_REVIEW':'DRAFT';
  const s=await prisma.submission.create({data:{id:d.clientId||undefined,clientId:d.clientId||null,officeId,operatorId:req.user.id,reportingPeriod:d.reportingPeriod,status,buildingData:{create:b},operationalData:{create:o},history:{create:{status,actorId:req.user.id}},auditLogs:{create:{userId:req.user.id,action:'CREATE'}}},include:submissionInclude});
  emitSubmissionUpdated(req.app,{submission:{id:s.id,officeId:s.officeId,status:s.status,reason:'CREATE'}});
  res.status(201).json({...s,esg:calculateEsg(s)});
});

app.put('/api/submissions/:id',authenticate,async(req,res)=>{
  const s=await prisma.submission.findUnique({where:{id:req.params.id},include:{buildingData:true,operationalData:true}});if(!s||!canAccess(req.user,s))return res.status(404).json({error:'Submission not found'});
  const requested=req.body.status||null;
  const transitionError=validateStatusTransition(req.user.role,s.status,requested,req.body.comment||'');
  const isManagerAction=['APPROVED','REJECTED','RETURNED'].includes(requested);
  if(transitionError)return res.status(req.user.role==='OPERATOR'?409:400).json({error:transitionError});
  const b=!isManagerAction&&req.body.buildingData?normalizedBuilding(req.body.buildingData):undefined;
  const o=!isManagerAction&&req.body.operationalData?normalizedOperational(req.body.operationalData):undefined;
  const errors=validateMetrics(b||s.buildingData||{},o||s.operationalData||{});
  if(requested==='SUBMIT'||requested==='PENDING_REVIEW'||requested==='RESUBMIT') errors.push(...validateSubmissionCompleteness(b||s.buildingData||{},o||s.operationalData||{}));
  if(errors.length)return res.status(422).json({error:'Validation failed',details:errors});
  let status=s.status;
  if(requested==='SUBMIT'||requested==='PENDING_REVIEW'||requested==='RESUBMIT')status='PENDING_REVIEW';else if(isManagerAction)status=requested;
  const comment=req.body.comment??null;const now=new Date();
  const updated=await prisma.$transaction(async tx=>{
    const data={status,managerComment:isManagerAction?comment:null,submittedAt:status==='PENDING_REVIEW'?now:s.submittedAt,reviewedAt:isManagerAction?now:s.reviewedAt,version:{increment:1}};
    const u=await tx.submission.update({where:{id:s.id},data});
    if(b)await tx.buildingData.upsert({where:{submissionId:s.id},update:b,create:{submissionId:s.id,...b}});
    if(o)await tx.operationalData.upsert({where:{submissionId:s.id},update:o,create:{submissionId:s.id,...o}});
    if(status!==s.status)await tx.submissionHistory.create({data:{submissionId:s.id,status,comment,actorId:req.user.id}});
    await tx.auditLog.create({data:{submissionId:s.id,userId:req.user.id,action:status!==s.status?`STATUS_${status}`:'UPDATE',metadata:{version:u.version}}});
    return tx.submission.findUnique({where:{id:s.id},include:submissionInclude});
  });
  emitSubmissionUpdated(req.app,{submission:{id:updated.id,officeId:updated.officeId,status:updated.status,reason:'UPDATE'}});
  res.json({...updated,esg:calculateEsg(updated)});
});

const ALLOWED_EVIDENCE_TYPES = new Set(['application/pdf','image/jpeg','image/png','image/webp']);
async function hasValidFileSignature(filePath, mimeType) {
  const handle = await fs.promises.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(12);
    const { bytesRead } = await handle.read(buffer, 0, 12, 0);
    if (mimeType === 'application/pdf') return buffer.subarray(0, bytesRead).toString('ascii', 0, 4) === '%PDF';
    if (mimeType === 'image/jpeg') return bytesRead >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (mimeType === 'image/png') return bytesRead >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    if (mimeType === 'image/webp') return bytesRead >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    return false;
  } finally {
    await handle.close();
  }
}
app.post('/api/evidence',authenticate,requireRoles('OPERATOR','ADMIN'),upload.single('file'),async(req,res)=>{
  const removeUploadedFile=()=>{if(req.file?.path){try{fs.unlinkSync(req.file.path);}catch{}}};
  if(!req.file)return res.status(400).json({error:'File is required'});
  try {
    const submissionId=typeof req.body.submissionId==='string'?req.body.submissionId:'';
    const s=await prisma.submission.findUnique({where:{id:submissionId}});
    if(!s||!canAccess(req.user,s)){removeUploadedFile();return res.status(404).json({error:'Submission not found'});}
    if(req.user.role==='OPERATOR'&&!['DRAFT','RETURNED'].includes(s.status)){removeUploadedFile();return res.status(409).json({error:'Evidence can only be added to drafts or returned submissions'});}
    if(!ALLOWED_EVIDENCE_TYPES.has(req.file.mimetype)){removeUploadedFile();return res.status(415).json({error:'Unsupported evidence file type'});}
    if(!(await hasValidFileSignature(req.file.path, req.file.mimetype))){removeUploadedFile();return res.status(415).json({error:'File contents do not match the declared evidence type'});}
    const confidence=req.body.ocrConfidence===''||req.body.ocrConfidence==null?null:Number(req.body.ocrConfidence);
    if(confidence!==null&&(!Number.isFinite(confidence)||confidence<0||confidence>100)){removeUploadedFile();return res.status(422).json({error:'OCR confidence must be between 0 and 100'});}
    const ev=await prisma.evidence.create({data:{submissionId,filename:req.file.originalname,storedFilename:req.file.filename,mimeType:req.file.mimetype,sizeBytes:req.file.size,category:req.body.category||null,ocrText:req.body.ocrText||null,ocrConfidence:confidence}});
    await prisma.auditLog.create({data:{submissionId,userId:req.user.id,action:'EVIDENCE_UPLOAD',metadata:{evidenceId:ev.id,filename:ev.filename}}});
    emitSubmissionUpdated(req.app,{submission:{id:s.id,officeId:s.officeId,reason:'EVIDENCE_UPLOAD'}});
    res.status(201).json(ev);
  } catch (error) {
    removeUploadedFile();
    throw error;
  }
});
app.get('/api/evidence/:submissionId',authenticate,async(req,res)=>{const s=await prisma.submission.findUnique({where:{id:req.params.submissionId}});if(!s||!canAccess(req.user,s))return res.status(404).json({error:'Submission not found'});res.json(await prisma.evidence.findMany({where:{submissionId:s.id},orderBy:{uploadedAt:'desc'}}));});

app.get('/api/esg/network',authenticate,requireRoles('MANAGER','ADMIN'),async(_req,res)=>{const offices=await prisma.office.findMany({include:{submissions:{where:{status:'APPROVED'},include:{buildingData:true,operationalData:true}}},orderBy:{name:'asc'}});res.json(offices.map(o=>{const scores=o.submissions.map(calculateEsg);const avg=scores.length?Math.round(scores.reduce((a,x)=>a+x.score,0)/scores.length):null;return {...o,approvedCount:o.submissions.length,esgScore:avg,status:avg==null?'NO_DATA':avg<60?'ATTENTION':avg<80?'PENDING':'APPROVED'};}));});
app.get('/api/reports/network',authenticate,requireRoles('MANAGER','ADMIN'),async(_req,res)=>{const rows=await prisma.submission.findMany({where:{status:'APPROVED'},include:submissionInclude});const scores=rows.map(calculateEsg);res.json({generatedAt:new Date().toISOString(),approvedSubmissions:rows.length,averageEsg:scores.length?Math.round(scores.reduce((a,x)=>a+x.score,0)/scores.length):0,submissions:rows.map(s=>({...s,esg:calculateEsg(s)}))});});

app.post('/api/sync',authenticate,async(req,res)=>{
  const operations=Array.isArray(req.body.operations)?req.body.operations:[];
  if(operations.length>50)return res.status(400).json({error:'Maximum 50 operations per sync batch'});
  const results=[];
  for(const op of operations){
    if(!op?.id||typeof op.id!=='string'||!op?.operation){results.push({id:op?.id||null,status:'error',error:'Invalid operation'});continue;}
    const done=await prisma.syncOperation.findUnique({where:{id:op.id}});
    if(done){if(done.userId!==req.user.id){results.push({id:op.id,status:'error',error:'Sync operation belongs to another user'});}else{results.push({id:op.id,status:'duplicate',result:done.result});}continue;}
    try{
      if(op.operation!=='UPSERT_SUBMISSION') throw new Error(`Unsupported operation: ${op.operation}`);
      const payload=op.data&&typeof op.data==='object'?op.data:{};
      const requestedStatus=['DRAFT','PENDING_REVIEW','APPROVED','REJECTED','RETURNED'].includes(payload.status)?payload.status:'DRAFT';
      const officeId=req.user.role==='OPERATOR'?(req.user.officeId||payload.officeId):payload.officeId;
      if(!officeId) throw new Error('No office assigned');
      const b=normalizedBuilding(payload.buildingData||{}),o=normalizedOperational(payload.operationalData||{});
      const errors=validateMetrics(b,o); if(['PENDING_REVIEW','APPROVED','REJECTED','RETURNED'].includes(requestedStatus)) errors.push(...validateSubmissionCompleteness(b,o)); if(errors.length) throw new Error(errors.join('; '));
      let result;
      const existing=payload.id?await prisma.submission.findUnique({where:{id:String(payload.id)},include:{buildingData:true,operationalData:true}}):null;
      if(existing){
        if(!canAccess(req.user,existing)) throw new Error('You cannot modify this submission');
        const transitionError=validateStatusTransition(req.user.role,existing.status,requestedStatus, payload.managerComment||'');
        if(transitionError) throw new Error(transitionError);
        const isManagerSync=['APPROVED','REJECTED','RETURNED'].includes(requestedStatus);
        const status=req.user.role==='OPERATOR'?(requestedStatus==='PENDING_REVIEW'?'PENDING_REVIEW':existing.status):requestedStatus;
        result=await prisma.$transaction(async tx=>{
          const updated=await tx.submission.update({where:{id:existing.id},data:{managerComment:payload.managerComment??existing.managerComment,status,submittedAt:status==='PENDING_REVIEW'?new Date():existing.submittedAt,reviewedAt:['APPROVED','REJECTED','RETURNED'].includes(status)?new Date():existing.reviewedAt,version:{increment:1}}});
          if(!isManagerSync) {
            await tx.buildingData.upsert({where:{submissionId:existing.id},update:b,create:{submissionId:existing.id,...b}});
            await tx.operationalData.upsert({where:{submissionId:existing.id},update:o,create:{submissionId:existing.id,...o}});
          }
          if(status!==existing.status) await tx.submissionHistory.create({data:{submissionId:existing.id,status,comment:payload.managerComment||null,actorId:req.user.id}});
          await tx.auditLog.create({data:{submissionId:existing.id,userId:req.user.id,action:'SYNC_UPDATE',metadata:{operationId:op.id}}});
          return updated;
        });
      } else {
        if(req.user.role==='OPERATOR'&&!req.user.officeId) throw new Error('Operator has no assigned office');
        const status=req.user.role==='OPERATOR'?(requestedStatus==='PENDING_REVIEW'?'PENDING_REVIEW':'DRAFT'):'DRAFT';
        result=await prisma.submission.create({data:{id:payload.id?String(payload.id):undefined,clientId:payload.clientId?String(payload.clientId):null,officeId,operatorId:req.user.id,reportingPeriod:String(payload.reportingPeriod||'FY 2025-26'),status,buildingData:{create:b},operationalData:{create:o},history:{create:{status,actorId:req.user.id}},auditLogs:{create:{userId:req.user.id,action:'SYNC_CREATE',metadata:{operationId:op.id}}}}});
      }
      await prisma.syncOperation.create({data:{id:op.id,userId:req.user.id,operation:op.operation,result:{submissionId:result.id,status:result.status}}});
      emitSubmissionUpdated(req.app,{submission:{id:result.id,officeId:result.officeId,status:result.status}});
      results.push({id:op.id,status:'ok',result:{submissionId:result.id,status:result.status}});
    }catch(e){results.push({id:op.id,status:'error',error:e instanceof Error?e.message:'Sync operation failed'});}
  }
  res.json({results});
});

app.get('/api/evidence/file/:id',authenticate,async(req,res)=>{
  const ev=await prisma.evidence.findUnique({where:{id:req.params.id},include:{submission:true}});
  if(!ev||!canAccess(req.user,ev.submission)) return res.status(404).json({error:'Evidence not found'});
  const filePath=path.join(uploadDir,ev.storedFilename);
  if(!fs.existsSync(filePath)) return res.status(404).json({error:'Evidence file is unavailable'});
  res.setHeader('Content-Type',ev.mimeType); res.setHeader('Content-Disposition',`inline; filename*=UTF-8''${encodeURIComponent(ev.filename)}`); res.sendFile(filePath);
});
app.use((err,_req,res,_next)=>{if(err instanceof multer.MulterError)return res.status(400).json({error:err.code==='LIMIT_FILE_SIZE'?'Evidence file exceeds 10 MB limit':'Evidence upload failed'});if(err?.message==='Unsupported file type')return res.status(415).json({error:err.message});console.error(err);res.status(err.status||500).json({error:'Internal server error'});});
export default app;
