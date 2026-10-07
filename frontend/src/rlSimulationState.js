const NUMERIC_STATE_FIELDS = [
  'temperature_c',
  'available_water_mm',
  'soil_moisture',
  'organic_matter_pct',
  'soil_health_score',
  'soil_ph',
  'field_area_ha',
  'irrigation_capacity_mm'
];

const STRING_STATE_FIELDS = [
  'season_id',
  'soil_health_score_source',
  'organic_matter_source',
  'temperature_source',
  'available_water_source',
  'soil_ph_source',
  'previous_crop',
  'previous_crop_family',
  'environmental_source',
  'soil_moisture_source'
];

export function normalizeNumberInput(value) {
  if (value == null || (typeof value === 'string' && value.trim() === '')) return '';
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : '';
}

export function normalizeSimulationState(state) {
  const input = state && typeof state === 'object' && !Array.isArray(state) ? state : {};
  const normalized = {};

  for (const field of NUMERIC_STATE_FIELDS) {
    const value = normalizeNumberInput(input[field]);
    normalized[field] = value === '' ? null : value;
  }
  for (const field of STRING_STATE_FIELDS) {
    normalized[field] = typeof input[field] === 'string' ? input[field] : null;
  }

  const seasonsSinceLegume = normalizeNumberInput(input.seasons_since_legume);
  normalized.seasons_since_legume = Number.isInteger(seasonsSinceLegume) && seasonsSinceLegume >= 0
    ? seasonsSinceLegume
    : null;
  normalized.previous_crop_is_legume = typeof input.previous_crop_is_legume === 'boolean'
    ? input.previous_crop_is_legume
    : null;
  normalized.field_id = typeof input.field_id === 'string' || (
    typeof input.field_id === 'number' && Number.isFinite(input.field_id)
  ) ? input.field_id : null;

  return normalized;
}

export function readInputValue(event) {
  const value = event?.currentTarget?.value;
  return typeof value === 'string' ? value : '';
}
