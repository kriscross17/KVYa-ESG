import 'dotenv/config';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient, Role, SubmissionStatus } from '@prisma/client';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dummyCandidates = [
  path.resolve(__dirname, '../../dummy-data/post-offices-140.json'),
  path.resolve(__dirname, '../dummy-data/post-offices-140.json'),
];

const dummyPath = dummyCandidates.find((candidate) => fs.existsSync(candidate));

if (!dummyPath) {
  throw new Error(
    `Dummy data file not found. Tried:\n${dummyCandidates.join('\n')}`
  );
}

const offices = JSON.parse(fs.readFileSync(dummyPath, 'utf8'));

async function main() {
  const passwordHash = await bcrypt.hash('SIH@2026', 12);
  const officeRows = [];
  for (const office of offices) {
    officeRows.push(await prisma.office.upsert({
      where: { name: office.name },
      update: { officeCode: office.officeCode, state: office.state, district: office.district, region: office.region, pincode: office.pincode, tier: office.tier, latitude: office.latitude, longitude: office.longitude },
      create: { officeCode: office.officeCode, name: office.name, state: office.state, district: office.district, region: office.region, pincode: office.pincode, tier: office.tier, latitude: office.latitude, longitude: office.longitude },
    }));
  }

  const manager = await prisma.user.upsert({
    where: { email: 'manager@sih.local' },
    update: { name: 'SIH Manager', passwordHash, role: Role.MANAGER },
    create: { email: 'manager@sih.local', name: 'SIH Manager', passwordHash, role: Role.MANAGER },
  });
  await prisma.user.upsert({
    where: { email: 'admin@sih.local' },
    update: { name: 'SIH Administrator', passwordHash, role: Role.ADMIN },
    create: { email: 'admin@sih.local', name: 'SIH Administrator', passwordHash, role: Role.ADMIN },
  });

  for (let i = 0; i < officeRows.length; i++) {
    await prisma.user.upsert({
      where: { email: `operator${i + 1}@sih.local` },
      update: { name: `Operator ${i + 1}`, passwordHash, role: Role.OPERATOR, officeId: officeRows[i].id },
      create: { email: `operator${i + 1}@sih.local`, name: `Operator ${i + 1}`, passwordHash, role: Role.OPERATOR, officeId: officeRows[i].id },
    });
  }

  if (await prisma.submission.count() === 0) {
    const operators = await prisma.user.findMany({ where: { role: Role.OPERATOR }, orderBy: { email: 'asc' } });
    const demoCount = Math.min(140, officeRows.length, operators.length);
    for (let i = 0; i < demoCount; i++) {
      const approved = i % 5 !== 3 && i % 11 !== 0;
      const returned = i % 11 === 0;
      const status = returned ? SubmissionStatus.RETURNED : approved ? SubmissionStatus.APPROVED : SubmissionStatus.PENDING_REVIEW;
      const comment = status === SubmissionStatus.RETURNED ? 'Please verify water and waste figures against evidence.' : null;
      const s = await prisma.submission.create({
        data: {
          officeId: officeRows[i].id, operatorId: operators[i].id, reportingPeriod: 'FY 2025-26', status, managerComment: comment,
          submittedAt: new Date(), reviewedAt: approved || status === SubmissionStatus.RETURNED ? new Date() : null,
          buildingData: { create: { buildingType: 'Standard Office', areaSqFt: 5000 + i * 1000, electricityConsumption: 50000 + i * 3000, waterUsage: 300 + i * 20, wasteGenerated: 200 + i * 10, renewableEnergy: 8000 + i * 500, fuelConsumption: 150 + i * 10, greenCover: 3000 + i * 100 } },
          operationalData: { create: { totalEmployees: 40 + i, femaleEmployees: 12 + i % 5, digitalTransactionsPct: Math.min(95, 75 + (i % 20)), energyUsageKwh: 15000 + i * 800, trainingHoursPerEmployee: 12 + i % 8, communityProgramsCount: 4 + i % 4, grievancesResolved: 8 + i % 5, grievancesTotal: 10 + i % 5 } },
          history: { create: [{ status: SubmissionStatus.DRAFT }, { status: SubmissionStatus.PENDING_REVIEW }, { status, comment }] },
        },
      });
      await prisma.auditLog.create({ data: { submissionId: s.id, userId: manager.id, action: 'SEED_DEMO', metadata: { demo: true } } });
    }
  }

  console.log(`Seed complete. ${officeRows.length} dummy offices available. Demo password: SIH@2026`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
