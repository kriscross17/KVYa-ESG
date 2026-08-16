import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateEsg } from '../src/services/esg.js';

test('calculates a complete demo submission', () => {
  const submission = {
    buildingData: { electricityConsumption: 1200, renewableEnergy: 300, waterUsage: 50, wasteGenerated: 40 },
    operationalData: { totalEmployees: 20, femaleEmployees: 8, digitalTransactionsPct: 72, trainingHoursPerEmployee: 12, grievancesTotal: 10, grievancesResolved: 9 },
    history: [{ status: 'DRAFT' }, { status: 'PENDING_REVIEW' }],
  };
  const score = calculateEsg(submission);
  assert.equal(score.score, score.overall);
  assert.ok(score.score >= 0 && score.score <= 100);
  assert.equal(score.renewablePct, 25);
  assert.equal(score.grievanceResolutionPct, 90);
});

test('flags high-risk unresolved grievances', () => {
  const score = calculateEsg({ buildingData: {}, operationalData: { totalEmployees: 10, femaleEmployees: 4, digitalTransactionsPct: 20, grievancesTotal: 10, grievancesResolved: 2 }, history: [{ status: 'DRAFT' }] });
  assert.ok(score.risks.some((risk) => risk.severity === 'high'));
});
