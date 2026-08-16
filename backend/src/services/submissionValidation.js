export const SUBMISSION_STATUS_ACTIONS = Object.freeze({
  SUBMIT: 'SUBMIT',
  RESUBMIT: 'RESUBMIT',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  RETURNED: 'RETURNED',
});

export const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
};

export function normalizedBuilding(b = {}) {
  return {
    buildingType: b.buildingType || null,
    areaSqFt: toNumberOrNull(b.areaSqFt),
    electricityConsumption: toNumberOrNull(b.electricityConsumptionKwh ?? b.electricityConsumption),
    waterUsage: toNumberOrNull(b.waterUsageKl ?? b.waterUsage),
    wasteGenerated: toNumberOrNull(b.wasteGeneratedKg ?? b.wasteGenerated),
    renewableEnergy: toNumberOrNull(b.renewableEnergyKwh ?? b.renewableEnergy),
    fuelConsumption: toNumberOrNull(b.fuelConsumptionLitres ?? b.fuelConsumption),
    greenCover: toNumberOrNull(b.greenCoverSqFt ?? b.greenCover),
  };
}

export function normalizedOperational(o = {}) {
  return {
    totalEmployees: toNumberOrNull(o.totalEmployees),
    femaleEmployees: toNumberOrNull(o.femaleEmployees),
    digitalTransactionsPct: toNumberOrNull(o.digitalTransactionsPercent ?? o.digitalTransactionsPct),
    energyUsageKwh: toNumberOrNull(o.energyUsageKwh),
    trainingHoursPerEmployee: toNumberOrNull(o.trainingHoursPerEmployee),
    communityProgramsCount: toNumberOrNull(o.communityProgramsCount),
    grievancesResolved: toNumberOrNull(o.grievancesResolved),
    grievancesTotal: toNumberOrNull(o.grievancesTotal),
  };
}

export function validateMetrics(building = {}, operational = {}) {
  const errors = [];
  for (const [key, value] of Object.entries({ ...building, ...operational })) {
    if (value !== null && value !== undefined && typeof value === 'number' && (!Number.isFinite(value) || value < 0)) {
      errors.push(`${key} must be a non-negative number`);
    }
  }
  for (const key of ['totalEmployees', 'femaleEmployees', 'communityProgramsCount', 'grievancesResolved', 'grievancesTotal']) {
    const value = operational[key];
    if (value != null && (!Number.isInteger(value) || value < 0)) errors.push(`${key} must be a whole, non-negative number`);
  }
  if (operational.femaleEmployees != null && operational.totalEmployees != null && operational.femaleEmployees > operational.totalEmployees) {
    errors.push('Female employees cannot exceed total employees');
  }
  if (operational.grievancesResolved != null && operational.grievancesTotal != null && operational.grievancesResolved > operational.grievancesTotal) {
    errors.push('Resolved grievances cannot exceed total grievances');
  }
  if (building.renewableEnergy != null && building.electricityConsumption != null && building.renewableEnergy > building.electricityConsumption) {
    errors.push('Renewable energy cannot exceed electricity consumption');
  }
  if (operational.digitalTransactionsPct != null && (operational.digitalTransactionsPct < 0 || operational.digitalTransactionsPct > 100)) {
    errors.push('Digital transactions must be between 0 and 100');
  }
  return errors;
}


export function validateSubmissionCompleteness(building = {}, operational = {}) {
  const requiredBuilding = ['buildingType', 'areaSqFt', 'electricityConsumption', 'waterUsage', 'wasteGenerated', 'renewableEnergy', 'fuelConsumption', 'greenCover'];
  const requiredOperational = ['totalEmployees', 'femaleEmployees', 'digitalTransactionsPct', 'energyUsageKwh', 'trainingHoursPerEmployee', 'communityProgramsCount', 'grievancesResolved', 'grievancesTotal'];
  const missing = [];
  for (const key of requiredBuilding) if (building[key] === null || building[key] === undefined || building[key] === '') missing.push(`Missing building field: ${key}`);
  for (const key of requiredOperational) if (operational[key] === null || operational[key] === undefined || operational[key] === '') missing.push(`Missing operational field: ${key}`);
  return missing;
}

export function validateStatusTransition(role, currentStatus, requestedStatus, comment = '') {
  if (role === 'OPERATOR') {
    if (!['DRAFT', 'RETURNED'].includes(currentStatus)) return 'Only drafts or returned submissions can be edited';
    if (!requestedStatus) return null;
    if (requestedStatus === SUBMISSION_STATUS_ACTIONS.SUBMIT && currentStatus !== 'DRAFT') return 'SUBMIT is only valid for a draft';
    if (requestedStatus === SUBMISSION_STATUS_ACTIONS.RESUBMIT && currentStatus !== 'RETURNED') return 'RESUBMIT is only valid for a returned submission';
    if (!['SUBMIT', 'RESUBMIT', 'PENDING_REVIEW'].includes(requestedStatus)) return 'Operators can only submit or resubmit submissions';
    return null;
  }
  if (!['APPROVED', 'REJECTED', 'RETURNED'].includes(requestedStatus)) return 'Managers must use APPROVED, REJECTED, or RETURNED as a status action';
  if (currentStatus !== 'PENDING_REVIEW') return 'Only submissions pending review can be approved, rejected, or returned';
  if (['REJECTED', 'RETURNED'].includes(requestedStatus) && String(comment).trim().length < 10) return 'A review comment of at least 10 characters is required for rejection or return';
  return null;
}
