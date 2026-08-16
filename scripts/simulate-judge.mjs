import fs from 'node:fs';
import { normalizedBuilding, normalizedOperational, validateMetrics, validateSubmissionCompleteness, validateStatusTransition } from '../backend/src/services/submissionValidation.js';
import { calculateEsg } from '../backend/src/services/esg.js';

const offices = JSON.parse(fs.readFileSync(new URL('../dummy-data/post-offices-140.json', import.meta.url), 'utf8'));
const sample = {
  office: offices[0],
  reportingPeriod: 'FY 2025-26',
  buildingData: { buildingType: 'Standard Office', areaSqFt: '12500', electricityConsumptionKwh: '12000', renewableEnergyKwh: '3600', waterUsageKl: '420', wasteGeneratedKg: '380' },
  operationalData: { totalEmployees: '85', femaleEmployees: '31', digitalTransactionsPercent: '78', energyUsageKwh: '8400', trainingHoursPerEmployee: '14', communityProgramsCount: '6', grievancesResolved: '19', grievancesTotal: '20' },
};

const b = normalizedBuilding(sample.buildingData);
const o = normalizedOperational(sample.operationalData);
if (validateMetrics(b, o).length) throw new Error('Valid sample was rejected');
const score = calculateEsg({ buildingData: b, operationalData: o, history: [{ status: 'DRAFT' }] });
if (score.score !== 72 || score.risks.length !== 0) throw new Error(`Unexpected sample ESG result: ${JSON.stringify(score)}`);

const invalid = validateMetrics(normalizedBuilding({ electricityConsumptionKwh: '100', renewableEnergyKwh: '120' }), normalizedOperational({ totalEmployees: '10', femaleEmployees: '11', digitalTransactionsPercent: '101' }));
if (invalid.length < 3) throw new Error('Invalid metrics were not rejected');

const fractionalEmployees = validateMetrics(
  normalizedBuilding({ electricityConsumptionKwh: '100' }),
  normalizedOperational({ totalEmployees: '10.5', femaleEmployees: '5', digitalTransactionsPercent: '50', grievancesResolved: '0', grievancesTotal: '0' })
);
if (!fractionalEmployees.some((e) => e.includes('totalEmployees'))) throw new Error('Fractional employee count was accepted');

const incomplete = validateSubmissionCompleteness(
  normalizedBuilding({ buildingType: 'Standard Office', electricityConsumptionKwh: '100' }),
  normalizedOperational({ totalEmployees: '10' })
);
if (incomplete.length < 10) throw new Error('Incomplete submission was not rejected');

const boundary = validateMetrics(
  normalizedBuilding({ electricityConsumptionKwh: '100', renewableEnergyKwh: '100' }),
  normalizedOperational({ totalEmployees: '10', femaleEmployees: '10', digitalTransactionsPercent: '100', trainingHoursPerEmployee: '0', communityProgramsCount: '0', grievancesResolved: '0', grievancesTotal: '0' })
);
if (boundary.length) throw new Error(`Valid boundary values were rejected: ${boundary.join('; ')}`);

const workflow = [
  ['OPERATOR', 'DRAFT', 'SUBMIT', null],
  ['MANAGER', 'PENDING_REVIEW', 'APPROVED', null],
  ['MANAGER', 'PENDING_REVIEW', 'RETURNED', 'Please verify supporting electricity evidence.'],
  ['OPERATOR', 'RETURNED', 'RESUBMIT', null],
];
for (const [role, current, next, comment] of workflow) {
  const error = validateStatusTransition(role, current, next, comment || '');
  if (error) throw new Error(`${role} ${current}->${next} failed: ${error}`);
}

const blocked = validateStatusTransition('OPERATOR', 'APPROVED', 'RESUBMIT', '');
if (!blocked) throw new Error('Operator was incorrectly allowed to resubmit an approved submission');

console.log('JUDGE SIMULATION PASS');
console.log(`Office: ${sample.office.name} (${sample.office.pincode})`);
console.log(`Sample ESG: ${score.score}/100; risks: ${score.risks.length}`);
console.log('Workflow: submit → approve/return → resubmit PASS');
console.log('Invalid metric rejection PASS');
console.log('Unauthorized state transition rejection PASS');
console.log(`Office master: ${offices.length} records PASS`);
