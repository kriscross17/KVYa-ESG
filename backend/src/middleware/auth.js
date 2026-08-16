import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';

export async function authenticate(req,res,next){
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return res.status(401).json({error:'Authentication required'});
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({where:{id:payload.userId},select:{id:true,email:true,name:true,role:true,officeId:true}});
    if (!user) return res.status(401).json({error:'User no longer exists'});
    req.user=user; next();
  } catch { return res.status(401).json({error:'Invalid or expired token'}); }
}

export function requireRoles(...roles){
  return (req,res,next)=>roles.includes(req.user.role) ? next() : res.status(403).json({error:'Insufficient permissions'});
}
