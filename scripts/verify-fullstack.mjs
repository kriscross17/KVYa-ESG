import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const officesPath = path.join(root, 'dummy-data', 'post-offices-140.json');
const offices = JSON.parse(fs.readFileSync(officesPath, 'utf8'));
const required = ['officeCode', 'name', 'state', 'district', 'region', 'latitude', 'longitude', 'pincode', 'tier', 'dummy'];
if (offices.length < 100) throw new Error(`Expected 100+ dummy offices, found ${offices.length}`);
const names = new Set();
const codes = new Set();
const pins = new Set();
for (const office of offices) {
  for (const field of required) if (!(field in office)) throw new Error(`Missing ${field} in ${office.name || office.officeCode}`);
  if (names.has(office.name)) throw new Error(`Duplicate office name: ${office.name}`);
  names.add(office.name);
  if (codes.has(office.officeCode)) throw new Error(`Duplicate office code: ${office.officeCode}`);
  codes.add(office.officeCode);
  if (pins.has(String(office.pincode))) throw new Error(`Duplicate pincode in demo office master: ${office.pincode}`);
  pins.add(String(office.pincode));
  if (office.dummy !== true) throw new Error(`Office ${office.name} is not marked dummy=true`);
  if (!/^\d{6}$/.test(String(office.pincode))) throw new Error(`Invalid 6-digit pincode for ${office.name}: ${office.pincode}`);
  if (office.latitude < 6 || office.latitude > 38 || office.longitude < 68 || office.longitude > 98) throw new Error(`Out-of-bounds coordinates for ${office.name}`);
}

const csvPath = path.join(root, 'dummy-data', 'post-offices-140.csv');
const csvLines = fs.readFileSync(csvPath, 'utf8').trim().split(/\r?\n/);
if (csvLines.length !== offices.length + 1) throw new Error(`CSV/JSON row count mismatch: ${csvLines.length - 1} vs ${offices.length}`);
for (let i = 1; i < csvLines.length; i++) {
  const cols = csvLines[i].split(',');
  if (cols.length < 10) throw new Error(`Malformed CSV row ${i}`);
}

const constants = fs.readFileSync(path.join(root, 'src', 'data', 'constants.js'), 'utf8');
if (!constants.includes("post-offices-140.json")) throw new Error('Frontend constants are not using the shared office dataset');
const seed = fs.readFileSync(path.join(root, 'backend', 'prisma', 'seed.js'), 'utf8');
if (!seed.includes("dummy-data/post-offices-140.json")) throw new Error('Backend seed is not using the shared office dataset');
const schema = fs.readFileSync(path.join(root, 'backend', 'prisma', 'schema.prisma'), 'utf8');
for (const field of ['officeCode', 'pincode', 'tier']) if (!schema.includes(`  ${field}`)) throw new Error(`Backend Office model is missing ${field}`);
const appSource = fs.readFileSync(path.join(root, 'backend', 'src', 'app.js'), 'utf8');
if (!appSource.includes("app.get('/api/esg/network',authenticate,requireRoles('MANAGER','ADMIN')")) throw new Error('Network ESG endpoint is not manager/admin protected');
if (!appSource.includes("app.get('/api/reports/network',authenticate,requireRoles('MANAGER','ADMIN')")) throw new Error('Network report endpoint is not manager/admin protected');
if (!appSource.includes("function canAccess(user,s){return user.role!=='OPERATOR'||s.operatorId===user.id;}")) throw new Error('Operator submission access is not owner-scoped');
console.log(`PASS: ${offices.length} shared dummy offices; frontend/backend point to the same JSON source.`);
