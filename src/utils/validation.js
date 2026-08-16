import {
  BUILDING_FIELD_LABELS,
  OPERATIONAL_FIELD_LABELS,
  STATUSES,
} from '../data/constants.js';

export function isNonNegativeNumber(value) {
  if (value === '' || value === null || value === undefined) return false;
  const num = Number(value);
  return !Number.isNaN(num) && num >= 0;
}

export function isPositiveNumber(value) {
  if (value === '' || value === null || value === undefined) return false;
  const num = Number(value);
  return !Number.isNaN(num) && num > 0;
}

export function isNonNegativeInteger(value) {
  if (!isNonNegativeNumber(value)) return false;
  return Number.isInteger(Number(value));
}

export function isValidPercent(value) {
  if (!isNonNegativeNumber(value)) return false;
  const num = Number(value);
  return num >= 0 && num <= 100;
}

export function validateBuildingData(data, requireAll = false) {
  const errors = {};

  if (requireAll && !data.buildingType) {
    errors.buildingType = 'Please select a building type — this field cannot be empty.';
  }

  const numericFields = [
    'areaSqFt',
    'electricityConsumptionKwh',
    'waterUsageKl',
    'wasteGeneratedKg',
    'renewableEnergyKwh',
    'fuelConsumptionLitres',
    'greenCoverSqFt',
  ];

  numericFields.forEach((field) => {
    if (requireAll && (data[field] === '' || data[field] === null || data[field] === undefined)) {
      errors[field] = `Please enter ${BUILDING_FIELD_LABELS[field].toLowerCase()} — this field cannot be empty.`;
    } else if (data[field] !== '' && data[field] !== null && data[field] !== undefined && !isNonNegativeNumber(data[field])) {
      errors[field] = `${BUILDING_FIELD_LABELS[field]} must be a non-negative number.`;
    }
  });

  if (
    isNonNegativeNumber(data.renewableEnergyKwh) &&
    isNonNegativeNumber(data.electricityConsumptionKwh) &&
    Number(data.renewableEnergyKwh) > Number(data.electricityConsumptionKwh)
  ) {
    errors.renewableEnergyKwh = 'Renewable energy used cannot exceed total electricity consumption.';
  }

  return errors;
}

export function validateOperationalData(data, requireAll = false) {
  const errors = {};

  const numericFields = [
    'totalEmployees',
    'femaleEmployees',
    'digitalTransactionsPercent',
    'energyUsageKwh',
    'trainingHoursPerEmployee',
    'communityProgramsCount',
    'grievancesResolved',
    'grievancesTotal',
  ];

  const integerFields = new Set(['totalEmployees', 'femaleEmployees', 'communityProgramsCount', 'grievancesResolved', 'grievancesTotal']);

  numericFields.forEach((field) => {
    if (requireAll && (data[field] === '' || data[field] === null || data[field] === undefined)) {
      errors[field] = `Please enter ${OPERATIONAL_FIELD_LABELS[field].toLowerCase()} — this field cannot be empty.`;
    } else if (data[field] !== '' && data[field] !== null && data[field] !== undefined) {
      if (field === 'digitalTransactionsPercent') {
        if (!isValidPercent(data[field])) {
          errors[field] = 'Digital transactions must be a percentage between 0 and 100.';
        }
      } else if (integerFields.has(field)) {
        if (!isNonNegativeInteger(data[field])) {
          errors[field] = `${OPERATIONAL_FIELD_LABELS[field]} must be a whole, non-negative number.`;
        }
      } else if (!isNonNegativeNumber(data[field])) {
        errors[field] = `${OPERATIONAL_FIELD_LABELS[field]} must be a non-negative number.`;
      }
    }
  });

  if (
    isNonNegativeNumber(data.totalEmployees) &&
    isNonNegativeNumber(data.femaleEmployees) &&
    Number(data.femaleEmployees) > Number(data.totalEmployees)
  ) {
    errors.femaleEmployees = 'Female employees cannot be more than total employees.';
  }

  if (
    isNonNegativeNumber(data.grievancesResolved) &&
    isNonNegativeNumber(data.grievancesTotal) &&
    Number(data.grievancesResolved) > Number(data.grievancesTotal)
  ) {
    errors.grievancesResolved = 'Resolved grievances cannot exceed total grievances.';
  }

  return errors;
}

export function validateSubmissionForSubmit(submission) {
  const errors = [];

  if (!submission.postOffice) {
    errors.push({ field: 'postOffice', section: 'setup', message: 'Post Office is required.', path: '/operator/new' });
  }
  if (!submission.reportingPeriod) {
    errors.push({ field: 'reportingPeriod', section: 'setup', message: 'Reporting Period is required.', path: '/operator/new' });
  }

  const buildingErrors = validateBuildingData(submission.buildingData, true);
  Object.entries(buildingErrors).forEach(([field, message]) => {
    errors.push({ field, section: 'building', message, path: '/operator/building-data' });
  });

  const operationalErrors = validateOperationalData(submission.operationalData, true);
  Object.entries(operationalErrors).forEach(([field, message]) => {
    errors.push({ field, section: 'operational', message, path: '/operator/operational-data' });
  });

  return errors;
}

export function validateManagerComment(comment) {
  if (!comment || comment.trim().length < 10) {
    return 'Please enter a comment of at least 10 characters explaining your decision.';
  }
  return null;
}

export function canEditSubmission(status) {
  return status === STATUSES.DRAFT || status === STATUSES.RETURNED;
}

export function isPendingReview(status) {
  return status === STATUSES.SUBMITTED || status === STATUSES.PENDING_REVIEW;
}

export function parseNumericFields(obj) {
  const result = { ...obj };
  Object.keys(result).forEach((key) => {
    if (key !== 'buildingType' && result[key] !== '' && result[key] !== null && result[key] !== undefined) {
      result[key] = Number(result[key]);
    }
  });
  return result;
}
