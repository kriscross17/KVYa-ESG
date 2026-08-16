import postOfficeData from '../../dummy-data/post-offices-140.json' with { type: 'json' };

export const STATUSES = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING_REVIEW: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  RETURNED: 'Returned for Correction',
};

export const STATUS_COLORS = {
  Draft: 'bg-slate-200 text-slate-800',
  Submitted: 'bg-yellow-100 text-yellow-900',
  'Pending Review': 'bg-yellow-100 text-yellow-900',
  Approved: 'bg-green-100 text-green-900',
  Rejected: 'bg-red-100 text-red-900',
  'Returned for Correction': 'bg-red-100 text-red-900',
};

export const POST_OFFICE_RECORDS = postOfficeData;
export const POST_OFFICES = postOfficeData.map((office) => office.name);

export const REPORTING_PERIODS = [
  'FY 2023-24',
  'FY 2024-25',
  'FY 2025-26',
  'FY 2026-27',
];

export const BUILDING_TYPES = [
  'Heritage Building',
  'Standard Office',
  'Modern Green Building',
  'Rural Post Office',
  'Sub Post Office',
];

export const OPERATOR_STEPS = [
  { path: '/operator/new', label: 'Post Office & Period' },
  { path: '/operator/building-data', label: 'Building Data' },
  { path: '/operator/operational-data', label: 'Operational Data' },
  { path: '/operator/review', label: 'Review & Submit' },
];

export const EMPTY_BUILDING_DATA = {
  buildingType: '',
  areaSqFt: '',
  electricityConsumptionKwh: '',
  waterUsageKl: '',
  wasteGeneratedKg: '',
  renewableEnergyKwh: '',
  fuelConsumptionLitres: '',
  greenCoverSqFt: '',
};

export const EMPTY_OPERATIONAL_DATA = {
  totalEmployees: '',
  femaleEmployees: '',
  digitalTransactionsPercent: '',
  energyUsageKwh: '',
  trainingHoursPerEmployee: '',
  communityProgramsCount: '',
  grievancesResolved: '',
  grievancesTotal: '',
};

export const BUILDING_FIELD_LABELS = {
  buildingType: 'Building Type',
  areaSqFt: 'Total Floor Area (sq ft)',
  electricityConsumptionKwh: 'Electricity Consumption (kWh)',
  waterUsageKl: 'Water Usage (KL)',
  wasteGeneratedKg: 'Waste Generated (kg)',
  renewableEnergyKwh: 'Renewable Energy Used (kWh)',
  fuelConsumptionLitres: 'Fuel Consumption (litres)',
  greenCoverSqFt: 'Green Cover Area (sq ft)',
};

export const OPERATIONAL_FIELD_LABELS = {
  totalEmployees: 'Total Employees',
  femaleEmployees: 'Female Employees',
  digitalTransactionsPercent: 'Digital Transactions (%)',
  energyUsageKwh: 'Operational Energy Usage (kWh)',
  trainingHoursPerEmployee: 'Training Hours per Employee',
  communityProgramsCount: 'Community Programs Conducted',
  grievancesResolved: 'Grievances Resolved',
  grievancesTotal: 'Total Grievances Received',
};

export const BUILDING_FIELD_HELP = {
  buildingType: 'Select the type of post office building.',
  areaSqFt: 'Total built-up area in square feet — check building records.',
  electricityConsumptionKwh: 'Electricity consumption in units/kWh — check your latest electricity bill.',
  waterUsageKl: 'Total water consumed in kilolitres — check your water bill.',
  wasteGeneratedKg: 'Total waste generated during the reporting period in kilograms.',
  renewableEnergyKwh: 'Energy from solar or other renewable sources in kWh.',
  fuelConsumptionLitres: 'Diesel/petrol used for generators and vehicles in litres.',
  greenCoverSqFt: 'Area covered by plants, gardens, or green roofs in sq ft.',
};

export const OPERATIONAL_FIELD_HELP = {
  totalEmployees: 'Total number of employees at this post office.',
  femaleEmployees: 'Number of female employees — must not exceed total employees.',
  digitalTransactionsPercent: 'Percentage of transactions done digitally (0–100).',
  energyUsageKwh: 'Energy used for operational equipment (computers, servers) in kWh.',
  trainingHoursPerEmployee: 'Average ESG/safety training hours per employee.',
  communityProgramsCount: 'Number of community outreach programs conducted.',
  grievancesResolved: 'Number of employee/public grievances resolved.',
  grievancesTotal: 'Total grievances received during the period.',
};
