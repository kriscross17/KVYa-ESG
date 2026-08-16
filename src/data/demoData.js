import { STATUSES } from './constants.js';

const offices = [
  ['Mumbai Head Post Office', 'Anita Sharma', 92, 18, 148000, 34, 7600, 520, 310, 18200, 13200, 87, 24, 42, 44],
  ['New Delhi Head Post Office', 'Rahul Verma', 78, 12, 131000, 18, 6900, 610, 420, 20500, 11000, 82, 18, 37, 41],
  ['Chennai Head Post Office', 'Meena Iyer', 84, 16, 98000, 29, 5200, 470, 260, 14100, 9800, 91, 31, 48, 49],
  ['Kolkata Head Post Office', 'Sourav Das', 66, 14, 121000, 8, 6400, 720, 530, 22100, 8700, 68, 15, 35, 43],
  ['Bengaluru Head Post Office', 'Priya Nair', 74, 20, 113000, 41, 5900, 390, 220, 16300, 10500, 94, 36, 50, 51],
  ['Hyderabad Head Post Office', 'Arjun Rao', 59, 11, 87000, 6, 4800, 530, 350, 11900, 7400, 72, 12, 26, 38],
  ['Virar Head Post Office', 'Neha Patil', 48, 9, 42000, 15, 2800, 260, 140, 6100, 4100, 76, 22, 28, 30],
  ['Pune Head Post Office', 'Vivek Joshi', 61, 13, 55000, 23, 3100, 330, 190, 7200, 5200, 84, 20, 33, 36],
  ['Ahmedabad Head Post Office', 'Kiran Shah', 53, 10, 73000, 5, 3900, 590, 410, 10400, 6900, 63, 9, 24, 36],
  ['Jaipur Head Post Office', 'Ritu Meena', 45, 8, 46000, 12, 2700, 240, 120, 5800, 3600, 79, 16, 25, 28],
];

function history(status, createdAt, reviewedAt = null) {
  const items = [{ status: STATUSES.DRAFT, timestamp: createdAt }];
  if (status !== STATUSES.DRAFT) items.push({ status: STATUSES.PENDING_REVIEW, timestamp: new Date(new Date(createdAt).getTime() + 86400000).toISOString() });
  if (status === STATUSES.APPROVED) items.push({ status: STATUSES.APPROVED, timestamp: reviewedAt });
  if (status === STATUSES.RETURNED) items.push({ status: STATUSES.RETURNED, timestamp: reviewedAt, comment: 'Please verify water and waste figures against supporting evidence.' });
  return items;
}

export function createDemoSubmissions() {
  const base = new Date('2026-07-15T09:00:00.000Z');

  return offices.map((row, index) => {
    const [postOffice, operator, employees, female, electricity, renewablePct, water, waste, fuel, area, greenCover, digital, training, grievances, resolved] = row;
    const createdAt = new Date(base.getTime() + index * 86400000).toISOString();
    const approved = index < 7;
    const returned = index === 7;
    const status = approved ? STATUSES.APPROVED : returned ? STATUSES.RETURNED : STATUSES.PENDING_REVIEW;
    const renewable = Math.round(electricity * renewablePct / 100);
    const submittedAt = new Date(new Date(createdAt).getTime() + 86400000).toISOString();
    const reviewedAt = approved || returned ? new Date(new Date(submittedAt).getTime() + 86400000).toISOString() : null;

    return {
      id: `demo-${String(index + 1).padStart(3, '0')}`,
      postOffice,
      reportingPeriod: 'FY 2025-26',
      operator,
      buildingData: {
        buildingType: index === 0 || index === 1 ? 'Heritage Building' : index === 4 ? 'Modern Green Building' : 'Standard Office',
        areaSqFt: area,
        electricityConsumptionKwh: electricity,
        waterUsageKl: water,
        wasteGeneratedKg: waste,
        renewableEnergyKwh: renewable,
        fuelConsumptionLitres: fuel,
        greenCoverSqFt: greenCover,
      },
      operationalData: {
        totalEmployees: employees,
        femaleEmployees: female,
        digitalTransactionsPercent: digital,
        energyUsageKwh: Math.round(electricity * 0.31),
        trainingHoursPerEmployee: training,
        communityProgramsCount: index + 3,
        grievancesResolved: resolved,
        grievancesTotal: grievances,
      },
      status,
      createdAt,
      submittedAt,
      reviewedAt,
      managerComment: returned ? 'Please verify water and waste figures against supporting evidence.' : null,
      evidence: [
        { name: `${postOffice.replace(/ /g, '_')}_electricity_bill.pdf`, type: 'application/pdf', size: 248000 + index * 17000, category: 'Electricity Bill', uploadedAt: submittedAt },
        { name: `${postOffice.replace(/ /g, '_')}_meter_photo.jpg`, type: 'image/jpeg', size: 830000 + index * 31000, category: 'Meter Photo', uploadedAt: submittedAt },
      ],
      history: history(status, createdAt, reviewedAt),
      demoData: true,
    };
  });
}
