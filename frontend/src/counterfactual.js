export const COUNTERFACTUAL_ENDPOINT = '/api/counterfactual/reoptimize';

const finiteNumber = (value, fieldName, { required = false, minimum = null } = {}) => {
  if (value == null || value === '') {
    if (required) throw new Error(`${fieldName} is required.`);
    return null;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${fieldName} must be a finite number.`);
  if (minimum != null && number < minimum) {
    throw new Error(`${fieldName} must be at least ${minimum}.`);
  }
  return number;
};

const validDate = (value, fieldName) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${fieldName} must be a valid date.`);
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${fieldName} must be a valid date.`);
  }
  return value;
};

const strategyPriority = {
  profit_focused: 'profit',
  water_efficiency: 'water_efficiency',
  soil_health: 'soil_health',
  balanced: 'balanced',
};

export function buildCounterfactualPayload(form, field, selectedStrategyId) {
  if (!field) throw new Error('Select a field before running the counterfactual simulation.');
  if (field.id == null || field.id === '') throw new Error('field_id is required.');
  const latitude = finiteNumber(field.latitude, 'latitude', { required: true, minimum: -90 });
  const longitude = finiteNumber(field.longitude, 'longitude', { required: true, minimum: -180 });
  if (latitude > 90) throw new Error('latitude must be at most 90.');
  if (longitude > 180) throw new Error('longitude must be at most 180.');
  const fieldArea = finiteNumber(field.area_ha, 'field_area_ha', { required: true, minimum: 0 });
  if (fieldArea === 0) throw new Error('field_area_ha must be greater than zero.');

  const startDate = validDate(form.start_date, 'start_date');
  const endDate = validDate(form.end_date, 'end_date');
  if (startDate > endDate) throw new Error('end_date must be on or after start_date.');
  const rainfallDelta = finiteNumber(
    form.counterfactual_rainfall_delta_mm,
    'rainfall_delta_mm',
    { required: true },
  );
  const irrigationCapacity = finiteNumber(
    field.irrigation_capacity_mm,
    'irrigation_capacity_mm',
    { required: true, minimum: 0 },
  );
  const organicMatter = finiteNumber(field.organic_matter, 'organic_matter_pct', { minimum: 0 });
  if (organicMatter != null && organicMatter > 100) {
    throw new Error('organic_matter_pct must be at most 100.');
  }
  const priority = strategyPriority[selectedStrategyId];
  if (!priority) throw new Error('optimization_strategy is invalid.');

  return {
    field_id: field.id,
    latitude,
    longitude,
    field_size_ha: fieldArea,
    area_ha: fieldArea,
    soil_texture: field.soil_texture || '',
    organic_matter: organicMatter,
    irrigation_capacity_mm: irrigationCapacity,
    priority,
    optimization_strategy: selectedStrategyId,
    mode: field.id === 'demo' ? 'offline' : (form.mode || 'live'),
    start_date: startDate,
    end_date: endDate,
    counterfactual_rainfall_delta_mm: rainfallDelta,
    include_history: Boolean(form.include_history),
    include_previous_crop_history: Boolean(form.include_history),
  };
}

export function normalizeCounterfactualResponse(body) {
  const result = body?.summary?.counterfactual_milp
    ?? body?.result
    ?? body?.data
    ?? body;
  const required = [
    'scenario',
    'baseline_inputs',
    'counterfactual_inputs',
    'baseline_rotation',
    'counterfactual_rotation',
    'baseline_metrics',
    'counterfactual_metrics',
    'metric_deltas',
    'solver',
    'status',
    'provenance',
  ];
  const missing = required.filter(key => result?.[key] == null);
  if (missing.length) {
    throw new Error(`Backend counterfactual response is missing: ${missing.join(', ')}.`);
  }
  return result;
}

export function counterfactualErrorMessage(error) {
  const detail = String(error?.message || error || 'Unknown counterfactual simulation error.');
  if (error?.name === 'AbortError' || /timed out/i.test(detail)) {
    return 'Counterfactual simulation timed out. Check the backend solver/API status and try again.';
  }
  if (/NASA POWER/i.test(detail)) {
    return 'NASA POWER weather retrieval failed. Counterfactual simulation could not be completed.';
  }
  if (/infeasible/i.test(detail)) {
    return 'Counterfactual MILP is infeasible under the selected constraints.';
  }
  if (/PuLP\/CBC|MILP re-optimization|MILP optimization/i.test(detail)) {
    return 'PuLP/CBC re-optimization failed. No counterfactual result is available.';
  }
  return detail;
}

export async function runCounterfactualRequest({
  payload,
  request,
  setRunning,
  setResult,
  setError,
  development = false,
  timeoutMs = 120000,
}) {
  setRunning(true);
  setResult(null);
  setError(null);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    if (development) {
      console.debug('COUNTERFACTUAL_REQUEST', payload);
      console.debug('COUNTERFACTUAL_MILP_REQUEST', payload);
    }
    const response = await request(COUNTERFACTUAL_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (development) {
      console.debug('COUNTERFACTUAL_WEATHER_RESPONSE', {
        source: response?.provenance?.weather_source,
        observationCount: response?.provenance?.weather_observations,
        baselineRainfallMm: response?.baseline_inputs?.rainfall_window_mm,
      });
      console.debug('COUNTERFACTUAL_PERTURBED_INPUTS', response?.counterfactual_inputs);
      console.debug('COUNTERFACTUAL_MILP_REQUEST', {
        request: payload,
        solverInputs: response?.solver_inputs,
      });
      console.debug('COUNTERFACTUAL_MILP_RESPONSE', response);
    }
    const normalized = normalizeCounterfactualResponse(response);
    if (development) console.debug('COUNTERFACTUAL_RESULT_NORMALIZED', normalized);
    if (String(normalized.status).toLowerCase() === 'infeasible') {
      throw new Error('Counterfactual MILP is infeasible under the selected constraints.');
    }
    if (String(normalized.status).toLowerCase() === 'failed') {
      throw new Error('PuLP/CBC re-optimization failed. No counterfactual result is available.');
    }
    setResult(normalized);
    setError(null);
    return normalized;
  } catch (error) {
    if (development) {
      const failure = { error: String(error?.message || error) };
      console.debug('COUNTERFACTUAL_WEATHER_RESPONSE', failure);
      console.debug('COUNTERFACTUAL_PERTURBED_INPUTS', failure);
      console.debug('COUNTERFACTUAL_MILP_RESPONSE', failure);
      console.debug('COUNTERFACTUAL_RESULT_NORMALIZED', {
        status: 'failed',
        ...failure,
      });
    }
    setResult(null);
    setError(counterfactualErrorMessage(error));
    return null;
  } finally {
    clearTimeout(timer);
    setRunning(false);
  }
}
