import { calculateESGScore } from '../src/utils/esg.js';
import { calculateEsg } from '../backend/src/services/esg.js';
import { normalizedBuilding, normalizedOperational } from '../backend/src/services/submissionValidation.js';

const frontendPayload = {
  buildingData: {
    buildingType: 'Standard Office',
    areaSqFt: '12500',
    electricityConsumptionKwh: '12000',
    renewableEnergyKwh: '3600',
    waterUsageKl: '420',
    wasteGeneratedKg: '380',
    fuelConsumptionLitres: '150',
    greenCoverSqFt: '3000',
  },
  operationalData: {
    totalEmployees: '85',
    femaleEmployees: '31',
    digitalTransactionsPercent: '78',
    energyUsageKwh: '8400',
    trainingHoursPerEmployee: '14',
    communityProgramsCount: '6',
    grievancesResolved: '19',
    grievancesTotal: '20',
  },
  history: [{ status: 'Draft' }],
};

const backendPayload = {
  buildingData: normalizedBuilding(frontendPayload.buildingData),
  operationalData: normalizedOperational(frontendPayload.operationalData),
  history: frontendPayload.history,
};

const frontendScore = calculateESGScore(frontendPayload);
const backendScore = calculateEsg(backendPayload);

for (const field of ['overall', 'environmental', 'social', 'governance']) {
  if (frontendScore[field] !== backendScore[field]) {
    throw new Error(`ESG mismatch for ${field}: frontend=${frontendScore[field]}, backend=${backendScore[field]}`);
  }
}

console.log('FULLSTACK INPUT SIMULATION PASS');
console.log(`Input: Mumbai Head Post Office-style demo record`);
console.log(`ESG: ${frontendScore.overall}/100`);
console.log(`Environmental/Social/Governance: ${frontendScore.environmental}/${frontendScore.social}/${frontendScore.governance}`);
console.log('Frontend/backend ESG contract: PASS');
