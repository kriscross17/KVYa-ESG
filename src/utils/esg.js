import { POST_OFFICES, STATUSES } from '../data/constants.js';

const n = (value) => Number(value) || 0;
const hasValue = (value) => value !== '' && value !== null && value !== undefined;
const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

/**
 * Demo decision-support score. This is NOT an official BRSR compliance score.
 * It is intentionally transparent so the demo can explain why a submission is
 * considered healthy or high-risk.
 */
export function calculateESGScore(submission) {
  if (!submission) return { overall: 0, environmental: 0, social: 0, governance: 0, risks: [] };

  const b = submission.buildingData || {};
  const o = submission.operationalData || {};
  const electricity = n(b.electricityConsumptionKwh);
  const renewable = n(b.renewableEnergyKwh);
  const employees = n(o.totalEmployees);
  const female = n(o.femaleEmployees);
  const grievances = n(o.grievancesTotal);
  const resolved = n(o.grievancesResolved);
  const digital = n(o.digitalTransactionsPercent);
  const training = n(o.trainingHoursPerEmployee);
  const water = n(b.waterUsageKl);
  const waste = n(b.wasteGeneratedKg);

  const renewablePct = electricity > 0 ? clamp((renewable / electricity) * 100) : 0;
  const femalePct = employees > 0 ? clamp((female / employees) * 100) : 0;
  const grievanceResolutionPct = grievances > 0 ? clamp((resolved / grievances) * 100) : 100;

  const environmental = Math.round(
    renewablePct * 0.55 +
    (electricity > 0 ? 45 : 0) * 0.15 +
    (hasValue(b.waterUsageKl) ? 100 : 0) * 0.15 +
    (hasValue(b.wasteGeneratedKg) ? 100 : 0) * 0.15
  );

  const social = Math.round(
    clamp(femalePct * 1.5) * 0.35 +
    clamp(training * 10) * 0.25 +
    clamp(grievanceResolutionPct) * 0.25 +
    (employees > 0 ? 100 : 0) * 0.15
  );

  const governance = Math.round(
    digital * 0.55 +
    grievanceResolutionPct * 0.25 +
    (submission.history?.length ? 100 : 0) * 0.20
  );

  const overall = Math.round(environmental * 0.4 + social * 0.35 + governance * 0.25);
  const risks = [];

  if (electricity > 0 && renewablePct < 10) risks.push({ severity: 'medium', message: 'Renewable energy share is below 10%.' });
  if (digital < 50) risks.push({ severity: 'medium', message: 'Digital transaction adoption is below 50%.' });
  if (grievances > 0 && resolved / grievances < 0.8) risks.push({ severity: 'high', message: 'More than 20% of grievances remain unresolved.' });
  if (female > employees) risks.push({ severity: 'high', message: 'Female employee count exceeds total employees.' });
  if (water > 0 && employees > 0 && water / employees > 50) risks.push({ severity: 'medium', message: 'Water use per employee is unusually high.' });
  if (waste > 0 && employees > 0 && waste / employees > 100) risks.push({ severity: 'medium', message: 'Waste generated per employee is unusually high.' });

  return {
    overall: clamp(overall),
    environmental: clamp(environmental),
    social: clamp(social),
    governance: clamp(governance),
    renewablePct,
    femalePct,
    grievanceResolutionPct,
    risks,
  };
}

export function getApprovedSubmissions(submissions = []) {
  return submissions.filter((s) => s.status === STATUSES.APPROVED);
}

export function getNetworkMetrics(submissions = []) {
  const approved = getApprovedSubmissions(submissions);
  const scores = approved.map(calculateESGScore);
  const avg = (key) => scores.length ? Math.round(scores.reduce((sum, s) => sum + s[key], 0) / scores.length) : 0;
  const highRisk = approved.filter((s) => {
    const score = calculateESGScore(s);
    return score.overall < 60 || score.risks.some((risk) => risk.severity === 'high');
  }).length;

  const reportingOffices = new Set(submissions.map((s) => s.postOffice).filter(Boolean)).size;

  return {
    approved,
    reportingOffices,
    offices: reportingOffices,
    averageOverall: avg('overall'),
    averageEnvironmental: avg('environmental'),
    averageSocial: avg('social'),
    averageGovernance: avg('governance'),
    highRisk,
    coverage: POST_OFFICES.length ? Math.round((new Set(approved.map((s) => s.postOffice).filter((office) => POST_OFFICES.includes(office))).size / POST_OFFICES.length) * 100) : 0,
  };
}
