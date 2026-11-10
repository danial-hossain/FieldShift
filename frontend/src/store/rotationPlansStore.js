// frontend/src/store/rotationPlansStore.js
// Single source of truth for 6-Season MILP rotation plans across all 4 strategies:
// Balanced, Profit, Water Saving, Soil Health.
// Keyed by field ID and priorities, shared between Rotation Planner and Adaptive Replan.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { request as defaultRequest } from '../apiClient.js';

export const CANONICAL_PERIOD_KEYS = ['Y1_S1', 'Y1_S2', 'Y1_S3', 'Y2_S1', 'Y2_S2', 'Y2_S3'];

export const PRIORITIES = ['balanced', 'profit', 'water', 'soil'];

export const STRATEGY_TO_PRIORITY = {
  balanced: 'balanced',
  profit: 'profit',
  profit_focused: 'profit',
  water: 'water',
  water_efficiency: 'water',
  soil: 'soil',
  soil_health: 'soil',
};

export const PRIORITY_TO_STRATEGY = {
  balanced: 'balanced',
  profit: 'profit_focused',
  water: 'water_efficiency',
  soil: 'soil_health',
};

// Global in-memory cache
const _plansCache = new Map();
const _selectedStrategyByField = new Map();
const _optionsByField = new Map();
const _appliedReplans = new Map();
const _listeners = new Set();

function notifyListeners() {
  _listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore
    }
  });
}

export function getAppliedReplan(fieldId, strategy) {
  const fId = fieldId != null ? String(fieldId) : 'demo';
  const strat = strategy || 'balanced';
  const key = `${fId}::${strat}`;
  if (_appliedReplans.has(key)) {
    return _appliedReplans.get(key);
  }
  try {
    const raw = localStorage.getItem(`fs_applied_replan_${fId}_${strat}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      _appliedReplans.set(key, parsed);
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function setAppliedReplan(fieldId, strategy, replanRecord) {
  const fId = fieldId != null ? String(fieldId) : 'demo';
  const strat = strategy || 'balanced';
  const key = `${fId}::${strat}`;
  if (replanRecord) {
    _appliedReplans.set(key, replanRecord);
    try {
      localStorage.setItem(`fs_applied_replan_${fId}_${strat}`, JSON.stringify(replanRecord));
    } catch {
      // ignore
    }
  } else {
    _appliedReplans.delete(key);
    try {
      localStorage.removeItem(`fs_applied_replan_${fId}_${strat}`);
    } catch {
      // ignore
    }
  }
  notifyListeners();
}

export function clearAppliedReplan(fieldId, strategy) {
  setAppliedReplan(fieldId, strategy, null);
}

export function buildPlansCacheKey(field, options = {}) {
  const fId = field?.id || 'demo';
  const dist = field?.district || 'bogura';
  const area = field?.area_ha != null ? Number(field.area_ha).toFixed(3) : '1.000';
  const soil = field?.soil_texture || 'unknown';
  const water = options.waterAvailability || 'full';
  const pt = Boolean(options.noPowerTiller);
  const ls = Boolean(options.labourShortage);
  const exc = Array.isArray(options.excludedCrops) ? [...options.excludedCrops].sort().join(',') : '';
  return `${fId}::${dist}::${area}::${soil}::${water}::${pt}::${ls}::${exc}`;
}

export function getCachedPlansEntry(cacheKey) {
  return _plansCache.get(cacheKey) || null;
}

export function getFieldSelectedStrategy(fieldId) {
  const id = fieldId || 'demo';
  return _selectedStrategyByField.get(id) || 'balanced';
}

export function setFieldSelectedStrategy(fieldId, strategy) {
  const id = fieldId || 'demo';
  const canonical = STRATEGY_TO_PRIORITY[strategy] || strategy || 'balanced';
  if (_selectedStrategyByField.get(id) !== canonical) {
    _selectedStrategyByField.set(id, canonical);
    notifyListeners();
  }
}

export function getFieldOptions(fieldId) {
  const id = fieldId || 'demo';
  return _optionsByField.get(id) || {};
}

export function setFieldOptions(fieldId, options) {
  const id = fieldId || 'demo';
  _optionsByField.set(id, { ...options });
}

/**
 * Extracts the 6-season crop sequence from a plan object.
 * Returns Array of 6 crop strings, or null if plan is unavailable.
 * Never invents or hardcodes fallback crops.
 */
export function extractPlanCrops(plan) {
  if (!plan) return null;
  const pData = plan?.summary?.planning || plan;
  const milp = pData?.selected_strategy_result || pData?.milp_status || plan?.milp_status;
  const rotation = milp?.selected_crop_by_period || {};

  const crops = CANONICAL_PERIOD_KEYS.map((pk) => rotation[pk] || null);
  if (crops.some((c) => !c)) {
    // If dictionary by period key missed, check recommended_crops list
    const rec = milp?.recommended_crops;
    if (Array.isArray(rec) && rec.length >= 6) {
      return rec.slice(0, 6);
    }
    return null;
  }
  return crops;
}

/**
 * Fetch all 4 strategy plans for a field from /api/planning.
 */
export async function fetchAllStrategyPlans({ field, options = {}, request = defaultRequest }) {
  if (!field) return {};
  const cacheKey = buildPlansCacheKey(field, options);
  let entry = _plansCache.get(cacheKey);

  if (entry && entry.plans && Object.keys(entry.plans).length === 4 && !entry.loading) {
    return entry.plans;
  }

  const histCrops = Array.isArray(field?.crop_history)
    ? field.crop_history.map((h) => (typeof h === 'string' ? h : h?.crop || h?.crop_name)).filter(Boolean)
    : Array.isArray(field?.history)
    ? field.history.map((h) => (typeof h === 'string' ? h : h?.crop || h?.crop_name)).filter(Boolean)
    : undefined;

  const waterAvail = options.waterAvailability || 'full';
  const waterCapacityMm = waterAvail === 'none' ? 0 : waterAvail === 'limited' ? 400 : (field?.irrigation_capacity_mm != null ? Number(field.irrigation_capacity_mm) : 1200);

  const bodyBase = {
    district: field?.district || 'bogura',
    field_id: field?.id !== 'demo' && field?.id ? field.id : undefined,
    latitude: field?.latitude != null ? Number(field.latitude) : undefined,
    longitude: field?.longitude != null ? Number(field.longitude) : undefined,
    field_size_ha: field?.area_ha != null ? Number(field.area_ha) : undefined,
    area_ha: field?.area_ha != null ? Number(field.area_ha) : undefined,
    seasonally_flooded: Boolean(field?.seasonally_flooded),
    soil_texture: field?.soil_texture || undefined,
    soil_ph: field?.soil_ph != null ? Number(field.soil_ph) : undefined,
    organic_matter: field?.organic_matter != null ? Number(field.organic_matter) : undefined,
    irrigation_capacity_mm: waterCapacityMm,
    existing_rotation: field?.existing_rotation || undefined,
    history_crops: histCrops && histCrops.length > 0 ? histCrops : undefined,
    no_power_tiller: Boolean(options.noPowerTiller),
    labour_shortage: Boolean(options.labourShortage),
    excluded_crops: Array.isArray(options.excludedCrops) && options.excludedCrops.length > 0 ? options.excludedCrops : undefined,
  };

  _plansCache.set(cacheKey, {
    plans: entry?.plans || {},
    loading: true,
    error: null,
  });
  notifyListeners();

  try {
    const results = await Promise.all(
      PRIORITIES.map((priority) =>
        request('/api/planning', {
          method: 'POST',
          body: JSON.stringify({ ...bodyBase, priority }),
        }).then((data) => ({ priority, data }))
      )
    );

    const plansMap = {};
    results.forEach(({ priority, data }) => {
      plansMap[priority] = data;
    });

    _plansCache.set(cacheKey, {
      plans: plansMap,
      loading: false,
      error: null,
    });
    notifyListeners();
    return plansMap;
  } catch (err) {
    _plansCache.set(cacheKey, {
      plans: entry?.plans || {},
      loading: false,
      error: err.message || 'Failed to fetch strategy plans',
    });
    notifyListeners();
    throw err;
  }
}

/**
 * Extract best_strategy and best_reason from plansByPriority
 */
export function getBestStrategyInfo(plansByPriority, lang = 'bn') {
  if (!plansByPriority) return { bestPriority: 'balanced', bestStrategyId: 'balanced', reason: null };
  for (const pKey of PRIORITIES) {
    const plan = plansByPriority[pKey];
    const pData = plan?.summary?.planning || plan;
    const bStrat = pData?.best_strategy || pData?.milp_status?.best_strategy || plan?.best_strategy;
    if (bStrat) {
      const canonicalPriority = STRATEGY_TO_PRIORITY[bStrat] || bStrat;
      const rBn = pData?.best_reason_bn || pData?.best_reason || plan?.best_reason;
      const rEn = pData?.best_reason_en || plan?.best_reason_en;
      const reason = lang === 'bn' ? (rBn || rEn) : (rEn || rBn);
      return {
        bestPriority: canonicalPriority,
        bestStrategyId: PRIORITY_TO_STRATEGY[canonicalPriority] || canonicalPriority,
        reason: reason || null,
      };
    }
  }
  return { bestPriority: 'balanced', bestStrategyId: 'balanced', reason: null };
}

export function getIdenticalStrategyNote(plansByPriority, lang = 'bn') {
  if (!plansByPriority || !plansByPriority.balanced) return null;
  for (const pKey of PRIORITIES) {
    const plan = plansByPriority[pKey];
    const pData = plan?.summary?.planning || plan;
    const nBn = pData?.identical_strategy_note_bn;
    const nEn = pData?.identical_strategy_note_en;
    if (nBn || nEn) {
      return lang === 'bn' ? (nBn || nEn) : (nEn || nBn);
    }
  }
  const bCrops = extractPlanCrops(plansByPriority.balanced);
  const wCrops = extractPlanCrops(plansByPriority.water);
  if (bCrops && wCrops && bCrops.join('::') === wCrops.join('::')) {
    return lang === 'bn'
      ? 'এই জমিতে সুষম আর পানি সাশ্রয় একই পরিকল্পনা দেয়'
      : 'For this field, Balanced and Water-Saving strategies produce the identical rotation';
  }
  return null;
}

/**
 * React hook for components to subscribe to strategy plans and shared selected strategy.
 */
export function useRotationPlans({ field, options = {}, lang = 'bn', request = defaultRequest }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    _listeners.add(listener);
    return () => {
      _listeners.delete(listener);
    };
  }, []);

  const fieldId = field?.id || 'demo';

  // Merge provided options with stored options if any
  const effectiveOptions = useMemo(() => {
    if (options && Object.keys(options).length > 0) {
      setFieldOptions(fieldId, options);
      return options;
    }
    return getFieldOptions(fieldId);
  }, [fieldId, options]);

  const cacheKey = useMemo(() => buildPlansCacheKey(field, effectiveOptions), [field, effectiveOptions]);
  const entry = _plansCache.get(cacheKey) || null;

  const plansByPriority = useMemo(() => entry?.plans || {}, [entry]);
  const loading = field ? (entry ? Boolean(entry.loading) : true) : false;
  const error = entry?.error || null;

  const selectedPriority = _selectedStrategyByField.get(fieldId) || 'balanced';
  const selectedStrategy = PRIORITY_TO_STRATEGY[selectedPriority] || selectedPriority;

  const { bestPriority, bestStrategyId, reason: bestReason } = useMemo(
    () => getBestStrategyInfo(plansByPriority, lang),
    [plansByPriority, lang]
  );

  const identicalStrategyNote = useMemo(
    () => getIdenticalStrategyNote(plansByPriority, lang),
    [plansByPriority, lang]
  );

  const setSelectedStrategy = useCallback(
    (strat) => {
      setFieldSelectedStrategy(fieldId, strat);
    },
    [fieldId]
  );

  const refetch = useCallback(() => {
    return fetchAllStrategyPlans({ field, options: effectiveOptions, request });
  }, [field, effectiveOptions, request]);

  useEffect(() => {
    if (!entry && field) {
      fetchAllStrategyPlans({ field, options: effectiveOptions, request }).catch(() => {});
    }
  }, [cacheKey, field, entry, effectiveOptions, request]);

  return {
    plansByPriority,
    loading,
    error,
    selectedPriority,
    selectedStrategy,
    bestPriority,
    bestStrategyId,
    bestReason,
    identicalStrategyNote,
    setSelectedStrategy,
    refetch,
    cacheKey,
  };
}

/**
 * Extract annualized strategy metrics: crops (6), irrigation (mm/yr), profit (BDT/yr for parcel),
 * bare days (days/yr), nitrogen (kg/ha/yr), and per-season irrigation (mm).
 */
export function extractStrategyMetrics(plan) {
  if (!plan) return null;
  const pData = plan?.summary?.planning || plan;
  const milp = pData?.selected_strategy_result || pData?.milp_status || plan?.milp_status;
  const bc = pData?.baseline_comparison || milp?.baseline_comparison || {};
  const crops = extractPlanCrops(plan);
  if (!crops || crops.length < 6) return null;

  const csm = milp?.dynamic_agronomic_matrix?.crop_season_matrix || {};
  const seasonIrrigs = CANONICAL_PERIOD_KEYS.map((pk, idx) => {
    const crop = crops[idx];
    const entry = csm[pk]?.[crop];
    const val = entry?.water_balance?.irrigation_required_mm;
    return val != null ? Number(val) : 0;
  });

  const irrigationMm = bc.plan_irrigation_mm != null
    ? Number(bc.plan_irrigation_mm)
    : (seasonIrrigs.reduce((a, b) => a + b, 0) / 2.0);

  const profitBdt = bc.plan_profit_bdt != null
    ? Number(bc.plan_profit_bdt)
    : (milp?.total_profit_bdt != null ? Number(milp.total_profit_bdt) / 2.0 : 0);

  const bareDays = bc.plan_bare_days != null
    ? Number(bc.plan_bare_days)
    : (milp?.bare_soil_days != null ? Number(milp.bare_soil_days) : 60);

  const nitrogenKg = bc.plan_nitrogen_kg != null
    ? Number(bc.plan_nitrogen_kg)
    : (milp?.nitrogen_balance_kg_ha != null ? Number(milp.nitrogen_balance_kg_ha) : 35);

  return {
    crops,
    irrigationMm: Math.round(irrigationMm * 10) / 10,
    profitBdt: Math.round(profitBdt),
    bareDays: Math.round(bareDays),
    nitrogenKg: Math.round(nitrogenKg * 10) / 10,
    seasonIrrigs,
  };
}

/**
 * Extract annualized baseline/current farming metrics:
 * checks if activeField has an authentic saved rotation.
 */
export function extractBaselineMetrics(plan, activeField) {
  const pData = plan?.summary?.planning || plan;
  const milp = pData?.selected_strategy_result || pData?.milp_status || plan?.milp_status;
  const bc = pData?.baseline_comparison || milp?.baseline_comparison || {};

  const hasSavedInField = Boolean(
    activeField?.existing_rotation &&
    (
      (typeof activeField.existing_rotation === 'object' && Object.values(activeField.existing_rotation).some(Boolean)) ||
      (Array.isArray(activeField.existing_rotation) && activeField.existing_rotation.some(Boolean))
    )
  );
  const isAssumed = bc.is_assumed_baseline ?? (!hasSavedInField);
  const hasSavedRotation = hasSavedInField || (bc.baseline_source === 'saved_field_rotation' && !isAssumed);

  if (!hasSavedRotation) {
    return {
      hasSavedRotation: false,
      crops: null,
      irrigationMm: null,
      profitBdt: null,
      bareDays: null,
      nitrogenKg: null,
      seasonIrrigs: null,
    };
  }

  // Extract 3 crops (Rabi, Kharif-1, Kharif-2)
  let rawCrops = bc.baseline_rotation;
  if (!rawCrops && activeField?.existing_rotation) {
    const er = activeField.existing_rotation;
    if (typeof er === 'object' && !Array.isArray(er)) {
      rawCrops = [er.rabi || 'Boro Rice', er.kharif1 || 'Fallow', er.kharif2 || 'Rice'];
    } else if (Array.isArray(er)) {
      rawCrops = er.slice(0, 3);
    }
  }

  const baselineSeasons = bc.baseline_seasons || [];
  const seasonIrrigs = [0, 1, 2].map((idx) => {
    const bs = baselineSeasons[idx];
    return bs?.irrigation_mm != null ? Number(bs.irrigation_mm) : 0;
  });

  const irrigationMm = bc.baseline_irrigation_mm != null
    ? Number(bc.baseline_irrigation_mm)
    : (seasonIrrigs.reduce((a, b) => a + b, 0));

  const profitBdt = bc.baseline_profit_bdt != null
    ? Number(bc.baseline_profit_bdt)
    : 0;

  const bareDays = bc.baseline_bare_days != null
    ? Number(bc.baseline_bare_days)
    : 115;

  const nitrogenKg = bc.baseline_nitrogen_kg != null
    ? Number(bc.baseline_nitrogen_kg)
    : 0;

  return {
    hasSavedRotation: true,
    isAssumed,
    crops: rawCrops && rawCrops.length >= 3 ? rawCrops.slice(0, 3) : ['Boro Rice', 'Fallow', 'Rice'],
    irrigationMm: Math.round(irrigationMm * 10) / 10,
    profitBdt: Math.round(profitBdt),
    bareDays: Math.round(bareDays),
    nitrogenKg: Math.round(nitrogenKg * 10) / 10,
    seasonIrrigs,
  };
}
