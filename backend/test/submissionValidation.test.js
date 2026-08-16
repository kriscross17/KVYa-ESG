import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizedBuilding, normalizedOperational, validateMetrics, validateSubmissionCompleteness, validateStatusTransition } from '../src/services/submissionValidation.js';

test('normalizes a valid submission payload', () => {
  const building = normalizedBuilding({ electricityConsumptionKwh: '1200', renewableEnergyKwh: '300', waterUsageKl: '50' });
  const operational = normalizedOperational({ totalEmployees: '20', femaleEmployees: '8', digitalTransactionsPercent: '72' });
  assert.deepEqual(building.electricityConsumption, 1200);
  assert.deepEqual(building.renewableEnergy, 300);
  assert.deepEqual(operational.totalEmployees, 20);
  assert.deepEqual(operational.digitalTransactionsPct, 72);
  assert.deepEqual(validateMetrics(building, operational), []);
});

test('rejects invalid ESG relationships', () => {
  const building = normalizedBuilding({ electricityConsumptionKwh: '100', renewableEnergyKwh: '120' });
  const operational = normalizedOperational({ totalEmployees: '10', femaleEmployees: '11', grievancesTotal: '4', grievancesResolved: '5', digitalTransactionsPercent: '101' });
  const errors = validateMetrics(building, operational);
  assert.equal(errors.length, 4);
});

test('enforces submission state transitions', () => {
  assert.equal(validateStatusTransition('OPERATOR', 'DRAFT', 'SUBMIT'), null);
  assert.match(validateStatusTransition('OPERATOR', 'DRAFT', 'RESUBMIT'), /only valid for a returned/);
  assert.equal(validateStatusTransition('OPERATOR', 'RETURNED', 'RESUBMIT'), null);
  assert.match(validateStatusTransition('MANAGER', 'APPROVED', 'RETURNED', 'Need correction'), /pending review/);
  assert.match(validateStatusTransition('MANAGER', 'PENDING_REVIEW', 'RETURNED', 'short'), /at least 10/);
  assert.equal(validateStatusTransition('MANAGER', 'PENDING_REVIEW', 'APPROVED'), null);
});


test('rejects fractional integer-only operational fields', () => {
  const errors = validateMetrics({}, normalizedOperational({
    totalEmployees: '10.5',
    femaleEmployees: '5',
    communityProgramsCount: '2.2',
    grievancesResolved: '1',
    grievancesTotal: '2',
  }));
  assert.ok(errors.some((e) => e.includes('totalEmployees')));
  assert.ok(errors.some((e) => e.includes('communityProgramsCount')));
});

test('requires all fields before submission', () => {
  const errors = validateSubmissionCompleteness(
    normalizedBuilding({ buildingType: 'Standard Office', electricityConsumptionKwh: '100' }),
    normalizedOperational({ totalEmployees: '10' }),
  );
  assert.ok(errors.length >= 10);
});
