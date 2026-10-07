import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCounterfactualPayload,
  counterfactualErrorMessage,
  COUNTERFACTUAL_ENDPOINT,
  normalizeCounterfactualResponse,
  runCounterfactualRequest,
} from './counterfactual.js';

const field = {
  id: 59,
  latitude: '24.37',
  longitude: '88.60',
  area_ha: '50',
  soil_texture: 'clay_loam',
  organic_matter: '9.8',
  irrigation_capacity_mm: '110',
};
const form = {
  mode: 'live',
  start_date: '2026-08-31',
  end_date: '2026-09-29',
  counterfactual_rainfall_delta_mm: '-100',
  include_history: true,
};

const response = {
  scenario: 'Custom Counterfactual',
  baseline_inputs: {},
  counterfactual_inputs: {},
  baseline_rotation: {},
  counterfactual_rotation: {},
  baseline_metrics: {},
  counterfactual_metrics: {},
  metric_deltas: {},
  solver: 'PuLP/CBC',
  status: 'completed',
  provenance: {},
};

function stateSetters() {
  const state = { running: false, result: { old: true }, error: 'old error' };
  return {
    state,
    setRunning: value => { state.running = value; },
    setResult: value => { state.result = value; },
    setError: value => { state.error = value; },
  };
}

test('payload validates dates and serializes numeric fields and history boolean', () => {
  const payload = buildCounterfactualPayload(form, field, 'balanced');
  for (const key of [
    'rainfall_delta_mm',
    'irrigation_capacity_mm',
    'field_size_ha',
    'latitude',
    'longitude',
    'organic_matter_pct',
  ]) {
    const value = {
      rainfall_delta_mm: payload.counterfactual_rainfall_delta_mm,
      irrigation_capacity_mm: payload.irrigation_capacity_mm,
      field_size_ha: payload.field_size_ha,
      latitude: payload.latitude,
      longitude: payload.longitude,
      organic_matter_pct: payload.organic_matter,
    }[key];
    assert.equal(typeof value, 'number', `${key} should be numeric`);
  }
  assert.equal(payload.counterfactual_rainfall_delta_mm, -100);
  assert.equal(payload.include_previous_crop_history, true);
  assert.equal(payload.include_history, true);
  assert.equal(payload.priority, 'balanced');
  assert.equal(payload.start_date, '2026-08-31');
  assert.equal(payload.end_date, '2026-09-29');
});

test('rejects invalid dates and rainfall delta with exact input labels', () => {
  assert.throws(
    () => buildCounterfactualPayload({ ...form, start_date: '2026-02-30' }, field, 'balanced'),
    /start_date must be a valid date/,
  );
  assert.throws(
    () => buildCounterfactualPayload({ ...form, counterfactual_rainfall_delta_mm: 'rain' }, field, 'balanced'),
    /rainfall_delta_mm must be a finite number/,
  );
});

test('success clears stale result/error and always ends loading', async () => {
  const setters = stateSetters();
  let requestedPath;
  const result = await runCounterfactualRequest({
    payload: {},
    request: async path => {
      requestedPath = path;
      return response;
    },
    ...setters,
  });
  assert.equal(requestedPath, COUNTERFACTUAL_ENDPOINT);
  assert.equal(result.status, 'completed');
  assert.equal(setters.state.running, false);
  assert.equal(setters.state.error, null);
  assert.equal(setters.state.result, response);
});

test('new request clears stale result immediately and unavailable metrics remain null', async () => {
  const setters = stateSetters();
  let finishRequest;
  const pending = runCounterfactualRequest({
    payload: {},
    request: () => new Promise(resolve => { finishRequest = resolve; }),
    ...setters,
  });
  assert.equal(setters.state.running, true);
  assert.equal(setters.state.result, null);
  assert.equal(setters.state.error, null);
  finishRequest({
    ...response,
    baseline_metrics: { production_tons: null },
    counterfactual_metrics: { production_tons: null },
    metric_deltas: { production_tons: null },
  });
  await pending;
  const normalized = normalizeCounterfactualResponse(setters.state.result);
  assert.equal(normalized.baseline_metrics.production_tons, null);
  assert.equal(normalized.counterfactual_metrics.production_tons, null);
});

test('API errors clear stale result and loading state', async () => {
  const setters = stateSetters();
  await runCounterfactualRequest({
    payload: {},
    request: async () => { throw new Error('validation failed: rainfall_delta_mm'); },
    ...setters,
  });
  assert.equal(setters.state.running, false);
  assert.equal(setters.state.result, null);
  assert.match(setters.state.error, /rainfall_delta_mm/);
});

test('MILP failure, NASA failure, and infeasibility become visible messages', async () => {
  for (const [message, expected] of [
    ['PuLP/CBC re-optimization failed: solver error', 'PuLP/CBC re-optimization failed. No counterfactual result is available.'],
    ['NASA POWER unavailable: network error', 'NASA POWER weather retrieval failed. Counterfactual simulation could not be completed.'],
    ['Counterfactual MILP is infeasible', 'Counterfactual MILP is infeasible under the selected constraints.'],
  ]) {
    const setters = stateSetters();
    await runCounterfactualRequest({
      payload: {},
      request: async () => { throw new Error(message); },
      ...setters,
    });
    assert.equal(setters.state.running, false);
    assert.equal(setters.state.result, null);
    assert.equal(setters.state.error, expected);
  }
});

test('infeasible response is not rendered as a successful result', async () => {
  const setters = stateSetters();
  await runCounterfactualRequest({
    payload: {},
    request: async () => ({ ...response, status: 'infeasible' }),
    ...setters,
  });
  assert.equal(setters.state.running, false);
  assert.equal(setters.state.result, null);
  assert.equal(setters.state.error, 'Counterfactual MILP is infeasible under the selected constraints.');
});

test('counterfactual timeout is visible and clears loading', async () => {
  const setters = stateSetters();
  await runCounterfactualRequest({
    payload: {},
    request: (_path, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      });
    }),
    timeoutMs: 5,
    ...setters,
  });
  assert.equal(setters.state.running, false);
  assert.equal(setters.state.result, null);
  assert.equal(setters.state.error, 'Counterfactual simulation timed out. Check the backend solver/API status and try again.');
});

test('transport errors classify to actionable messages', () => {
  assert.match(counterfactualErrorMessage(new Error('NASA POWER retrieval')), /NASA POWER weather retrieval failed/);
});
