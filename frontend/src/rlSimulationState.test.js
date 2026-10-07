import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeNumberInput,
  normalizeSimulationState,
  readInputValue
} from './rlSimulationState.js';

test('input events are reduced to the primitive control value', () => {
  const event = {
    _reactName: 'onChange',
    nativeEvent: {},
    target: { value: '31.5' },
    currentTarget: { value: '31.5' }
  };

  assert.equal(readInputValue(event), '31.5');
  assert.equal(normalizeNumberInput(readInputValue(event)), 31.5);
  assert.equal(normalizeNumberInput(event), '');
});

test('simulation state accepts finite primitives and rejects event-shaped values', () => {
  const event = {
    _reactName: 'onChange',
    nativeEvent: {},
    target: { value: '10' },
    currentTarget: { value: '10' }
  };
  const state = normalizeSimulationState({
    season_id: 'Y1_S1',
    temperature_c: event,
    available_water_mm: '10',
    soil_health_score: 0,
    soil_ph: '',
    temperature_source: event,
    available_water_source: 'user-supplied simulation assumption',
    previous_crop: 'Maize',
    previous_crop_is_legume: false,
    seasons_since_legume: event,
    field_id: event
  });

  assert.equal(state.temperature_c, null);
  assert.equal(state.available_water_mm, 10);
  assert.equal(state.soil_health_score, 0);
  assert.equal(state.soil_ph, null);
  assert.equal(state.temperature_source, null);
  assert.equal(state.available_water_source, 'user-supplied simulation assumption');
  assert.equal(state.previous_crop, 'Maize');
  assert.equal(state.previous_crop_is_legume, false);
  assert.equal(state.seasons_since_legume, null);
  assert.equal(state.field_id, null);
  assert.doesNotThrow(() => JSON.stringify(state));
});

test('missing and invalid numeric inputs stay unavailable instead of defaulting', () => {
  assert.equal(normalizeNumberInput(''), '');
  assert.equal(normalizeNumberInput('not-a-number'), '');
  assert.equal(normalizeNumberInput({ value: 10 }), '');
  assert.equal(normalizeSimulationState({ temperature_c: null }).temperature_c, null);
});
