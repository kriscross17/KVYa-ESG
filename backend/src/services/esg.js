const n = (value) => Number(value) || 0;
const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

/**
 * Transparent prototype decision-support score. This is NOT an official BRSR compliance score.
 * Keep this formula aligned with the frontend so dashboards and reports agree.
 */
export function calculateEsg(submission) {
  const b = submission?.buildingData || {};
  const o = submission?.operationalData || {};
  const electricity = n(b.electricityConsumption);
  const renewable = n(b.renewableEnergy);
  const employees = n(o.totalEmployees);
  const female = n(o.femaleEmployees);
  const grievances = n(o.grievancesTotal);
  const resolved = n(o.grievancesResolved);
  const digital = n(o.digitalTransactionsPct);
  const training = n(o.trainingHoursPerEmployee);
  const water = n(b.waterUsage);
  const waste = n(b.wasteGenerated);

  const renewablePct = electricity > 0 ? clamp((renewable / electricity) * 100) : 0;
  const femalePct = employees > 0 ? clamp((female / employees) * 100) : 0;
  const grievanceResolutionPct = grievances > 0 ? clamp((resolved / grievances) * 100) : 100;
  const environmental = Math.round(renewablePct * 0.55 + (electricity > 0 ? 45 : 0) * 0.15 + (b.waterUsage != null ? 100 : 0) * 0.15 + (b.wasteGenerated != null ? 100 : 0) * 0.15);
  const social = Math.round(clamp(femalePct * 1.5) * 0.35 + clamp(training * 10) * 0.25 + clamp(grievanceResolutionPct) * 0.25 + (employees > 0 ? 100 : 0) * 0.15);
  const governance = Math.round(digital * 0.55 + grievanceResolutionPct * 0.25 + (submission?.history?.length ? 100 : 0) * 0.20);
  const score = Math.round(environmental * 0.4 + social * 0.35 + governance * 0.25);
  const risks = [];
  if (electricity > 0 && renewablePct < 10) risks.push({ severity: 'medium', message: 'Renewable energy share is below 10%.' });
  if (digital < 50) risks.push({ severity: 'medium', message: 'Digital transaction adoption is below 50%.' });
  if (grievances > 0 && resolved / grievances < 0.8) risks.push({ severity: 'high', message: 'More than 20% of grievances remain unresolved.' });
  if (female > employees) risks.push({ severity: 'high', message: 'Female employee count exceeds total employees.' });
  if (water > 0 && employees > 0 && water / employees > 50) risks.push({ severity: 'medium', message: 'Water use per employee is unusually high.' });
  if (waste > 0 && employees > 0 && waste / employees > 100) risks.push({ severity: 'medium', message: 'Waste generated per employee is unusually high.' });
  return { score: clamp(score), overall: clamp(score), environmental: clamp(environmental), social: clamp(social), governance: clamp(governance), renewableShare: Math.round(renewablePct * 10) / 10, renewablePct, femalePct, grievanceResolutionPct, risks };
}
