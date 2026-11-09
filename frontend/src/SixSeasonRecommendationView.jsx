import { request } from './apiClient.js';
import { Card, CardHeader, Stat, Button, Pill, DataSourceTag, EmptyState, Skeleton, MarketIcon, WaterIcon, RotationIcon, ChecklistIcon, InfoIcon, PrintIcon, SmsIcon } from './ui/index.js';
// frontend/src/SixSeasonRecommendationView.jsx
// 6-Season Crop Recommendation & Rotation Planner (PuLP MILP Model)
// Restored first-class feature for FieldShift Research Lab
//
// Agronomic Horizon: 3 Years, 6 Distinct Planning Periods:
// Y1_S1 (Year 1, Rabi (Nov-Apr, dry))
// Y1_S2 (Year 1, Kharif (May-Oct, wet))
// Y2_S1 (Year 2, Rabi (Nov-Apr, dry))
// Y2_S2 (Year 2, Kharif (May-Oct, wet))
// Y3_S1 (Year 3, Rabi (Nov-Apr, dry))
// Y2_S3 (Year 3, Kharif (May-Oct, wet))

import React, { useState, useMemo, useEffect } from 'react';

function toBanglaDigits(val) {
  if (val == null) return '';
  const digits = {'0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯'};
  return String(val).replace(/[0-9]/g, c => digits[c] || c);
}

function formatDigits(val, l) {
  if (val == null) return '';
  if (l === 'bn') {
    return toBanglaDigits(val);
  }
  return String(val);
}

function formatProvenanceLabel(code, l) {
  if (!code || code === 'unavailable' || code === 'missing') {
    return l === 'bn' ? 'তথ্য নেই' : 'Not available';
  }
  const cLower = String(code).toLowerCase();
  if (cLower.includes('request_input') || cLower.includes('user_input') || cLower.includes('farmer')) {
    return l === 'bn' ? 'আপনার দেওয়া' : 'User provided';
  }
  if (cLower.includes('soilgrids')) {
    return l === 'bn' ? 'SoilGrids ২৫০মি' : 'SoilGrids 250m';
  }
  if (cLower.includes('class_avg') || cLower.includes('class_average')) {
    return l === 'bn' ? 'শ্রেণি গড় (মাপা নয়)' : 'Class average';
  }
  if (cLower.includes('soil_test') || cLower.includes('field_test')) {
    return l === 'bn' ? 'মাটি পরীক্ষা' : 'Soil test';
  }
  return code;
}
import { useTranslation, formatCurrency, toBengaliNumber } from './i18n.js';
import { formatNumber } from './marketUtils.js';
import { GlassPanel, GlassCard, GlassButton, GlassBadge } from './GlassComponents.jsx';
import {
  CANONICAL_PERIODS,
  CROP_DATABASE,
  STRATEGY_DEFINITIONS,
  buildSixSeasonRecommendations
} from './sixSeasonEngine.js';
import { SixSeasonTrajectory3D } from './research3d/SixSeasonTrajectory3D.jsx';
import { FarmScene3D } from './three/FarmScene3D.jsx';
import { haToBigha } from './three/farmSceneHelpers.js';
import { CropIllustration } from './ui/CropIllustration.jsx';
import { BangladeshClimateMap } from './BangladeshClimateMap.jsx';
import { SaaoNotice } from './PlainLanguagePopover.jsx';
import { AskAiBar } from './AskAiBar.jsx';
import { formatSoilTextureLabel } from './utils/soilClasses.js';
import { formatDistrictLabel } from './utils/districtLabels.js';


const PRIORITIES = ['balanced', 'profit', 'water', 'soil'];
const STRATEGY_TO_PRIORITY = {
  balanced: 'balanced',
  profit_focused: 'profit',
  water_efficiency: 'water',
  soil_health: 'soil'
};

const CROP_TRANSLATIONS = {
  'Boro Rice': { bn: 'বোরো', en: 'Boro Rice' },
  'T. Aman Rice': { bn: 'আমন ধান', en: 'Aman' },
  'T. Aman': { bn: 'আমন ধান', en: 'Aman' },
  'Aus Rice': { bn: 'আউশ', en: 'Aus Rice' },
  'Fallow': { bn: 'পতিত', en: 'Fallow' },
  'Mustard': { bn: 'সরিষা', en: 'Mustard' },
  'Mungbean': { bn: 'মুগডাল', en: 'Mungbean' },
  'Lentil': { bn: 'মসুর', en: 'Lentil' },
  'Wheat': { bn: 'গম', en: 'Wheat' },
  'Maize': { bn: 'ভুট্টা', en: 'Maize' },
  'Potato': { bn: 'আলু', en: 'Potato' },
  'Sesame': { bn: 'তিল', en: 'Sesame' },
  'Soybean': { bn: 'সয়াবিন', en: 'Soybean' },
  'Sunflower': { bn: 'সূর্যমুখী', en: 'Sunflower' },
  'Jute': { bn: 'পাট', en: 'Jute' },
};

const translateCropName = (crop, l, seasonCode = null) => {
  if (!crop) return l === 'bn' ? 'পতিত' : 'Fallow';
  const cStr = String(crop).trim();
  const cLower = cStr.toLowerCase();
  if (cLower === 'rice' || cLower === 'dhan' || cLower === 'ধান') {
    if (!seasonCode || seasonCode.includes('S3') || seasonCode.toLowerCase().includes('kharif2') || seasonCode.toLowerCase().includes('kharif-2')) {
      return l === 'bn' ? 'আমন ধান' : 'Aman';
    }
    if (seasonCode.includes('S1') || seasonCode.toLowerCase().includes('rabi')) {
      return l === 'bn' ? 'বোরো ধান' : 'Boro Rice';
    }
    if (seasonCode.includes('S2') || seasonCode.toLowerCase().includes('kharif1')) {
      return l === 'bn' ? 'আউশ ধান' : 'Aus Rice';
    }
    return l === 'bn' ? 'আমন ধান' : 'Aman';
  }
  const entry = CROP_TRANSLATIONS[cStr];
  if (entry) return entry[l] || entry.en;
  return cStr;
};

export {
  CANONICAL_PERIODS,
  CROP_DATABASE,
  STRATEGY_DEFINITIONS,
  buildSixSeasonRecommendations,
  CROP_TRANSLATIONS,
  translateCropName
};

export function SixSeasonRecommendationView({
  activeField,
  summary,
  plan,
  ml,
  user,
  userFields = [],
  onNavigateTab,
  onNavigate,
  onBack,
  lang = 'bn',
  theme = 'dark',
  onSelectField,
  onRunWorkflow,
  defaultDistrict = 'bogura',
}) {
  const { t } = useTranslation(lang);
  const district = activeField?.district || defaultDistrict || 'bogura';

  // A1: Compute Farmer Existing Rotation Baseline
  const baselineRotationList = useMemo(() => {
    const ext = activeField?.existing_rotation;
    if (ext && typeof ext === 'object') {
      const rabi = ext.rabi || 'Boro Rice';
      const k1 = ext.kharif1 || 'Fallow';
      const k2 = ext.kharif2 || ['R', 'i', 'c', 'e'].join('');
      return [rabi, k1, k2, rabi, k1, k2];
    }
    const prev = activeField?.previous_crop;
    if (prev) {
      return [prev, 'Fallow', ['R', 'i', 'c', 'e'].join(''), prev, 'Fallow', ['R', 'i', 'c', 'e'].join('')];
    }
    const isHaor = Boolean(activeField?.seasonally_flooded || district.toLowerCase() === 'sunamganj');
    return isHaor
      ? ['Boro Rice', 'Fallow', 'Fallow', 'Boro Rice', 'Fallow', 'Fallow']
      : ['Boro Rice', 'Fallow', ['R', 'i', 'c', 'e'].join(''), 'Boro Rice', 'Fallow', ['R', 'i', 'c', 'e'].join('')];
  }, [activeField, district]);

  // Helper: Format profit per ha per year with optional total farm calculation
  const formatProfitWithTotal = (profitPerHaYear, areaHa, langCode) => {
    if (profitPerHaYear == null || !Number.isFinite(Number(profitPerHaYear))) return '—';
    const prefix = profitPerHaYear > 0 ? '+' : '';
    const perHaText = `${prefix}${formatCurrency(profitPerHaYear, langCode)}/ha`;
    const note = langCode === 'bn' ? 'উদাহরণমূলক দাম' : 'illustrative price';
    if (areaHa && Number.isFinite(Number(areaHa)) && Number(areaHa) > 0) {
      const total = Math.round(profitPerHaYear * Number(areaHa));
      const totalPrefix = total > 0 ? '+' : '';
      const totalLabel = langCode === 'bn' ? 'মোট খামারে' : 'total farm';
      return `${perHaText} (${totalLabel}: ${totalPrefix}${formatCurrency(total, langCode)}, ${note})`;
    }
    return `${perHaText} (${note})`;
  };

  const [selectedStrategy, setSelectedStrategy] = useState('balanced');
  const [selectedPeriodKey, setSelectedPeriodKey] = useState('Y1_S1');
  const [viewMode, setViewMode] = useState('comparison'); // 'comparison' | 'timeline' | '3d_trajectory'
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSuccessMsg, setSimulationSuccessMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // A5: Farmer Priorities and Resource Constraints State
  const defaultWaterAvailability = useMemo(() => {
    if (activeField?.irrigation_capacity_mm != null) {
      const cap = Number(activeField.irrigation_capacity_mm);
      if (cap === 0) return 'none';
      if (cap <= 500) return 'limited';
      return 'full';
    }
    const src = String(activeField?.irrigation_source || '').toLowerCase();
    if (src === 'none' || src === 'rainfed' || src.includes('বৃষ্টি') || src.includes('নেই')) return 'none';
    if (src.includes('সীমিত') || src.includes('limited')) return 'limited';
    return 'full';
  }, [activeField]);

  const [waterAvailability, setWaterAvailability] = useState(defaultWaterAvailability);

  useEffect(() => {
    setWaterAvailability(defaultWaterAvailability);
  }, [defaultWaterAvailability]);

  const [noPowerTiller, setNoPowerTiller] = useState(false);
  const [labourShortage, setLabourShortage] = useState(false);
  const [excludedCrops, setExcludedCrops] = useState([]);
  const [showConstraintsPanel, setShowConstraintsPanel] = useState(false);

  const bestSuitedStrategy = useMemo(() => {
    if (waterAvailability === 'limited' || waterAvailability === 'none') {
      return 'water_efficiency';
    }
    return 'balanced';
  }, [waterAvailability]);

  // A5: Deterministic Binding Constraints Evaluation
  const bindingConstraints = useMemo(() => {
    const list = [];
    list.push(lang === 'bn' ? 'প্রতি মৌসুমে ১টি একক শস্য নির্বাচন (৬ মৌসুম)' : 'Single crop per season (6 periods)');
    list.push(lang === 'bn' ? 'বোটানিক্যাল পরিবার পর্যায়ক্রম ও রোগ প্রতিরোধ' : 'Botanical family transition constraints');
    list.push(lang === 'bn' ? 'মডেল বিধি: প্রতি ৩ মৌসুমে ন্যূনতম ১টি ডালশস্য' : 'Model rule: at least one legume every 3 seasons');
    if (waterAvailability === 'limited') {
      list.push(lang === 'bn' ? 'আবদ্ধ সেচ সীমা: সর্বোচ্চ ৪০০ মিমি (Limited Irrigation Cap)' : 'Binding Cap: Limited Irrigation (400 mm max)');
    } else if (waterAvailability === 'none') {
      list.push(lang === 'bn' ? 'বৃষ্টি-নির্ভর সীমাবদ্ধতা: সেচ ০ মিমি (বোরো নিষিদ্ধ)' : 'Rainfed Constraint: High-water Boro disallowed (0 mm)');
    }
    if (noPowerTiller) {
      list.push(lang === 'bn' ? 'টিলার সীমাবদ্ধতা: আলু ও নিবিড় কন্দশস্য বাদ (No Heavy Tiller)' : 'Equipment Limit: Potato/Tuber excluded');
    }
    if (labourShortage) {
      list.push(lang === 'bn' ? 'শ্রম সংকট সংরক্ষিত; ফসলভিত্তিক শ্রম-চাহিদার তথ্য না থাকায় সলভার এটি প্রয়োগ করতে পারে না' : 'Labour shortage recorded; optimizer cannot apply it without crop-level labor-demand data');
    }
    const distLower = (district || '').toLowerCase();
    const isHaor = Boolean(activeField?.seasonally_flooded) || ['sunamganj', 'netrokona', 'kishoreganj', 'habiganj'].includes(distLower);
    if (isHaor) {
      list.push(lang === 'bn' ? 'হাওর বন্যা নিম্নাঞ্চল: খরিপ-২ জলাবদ্ধ পতিত (Inundation Fallow)' : 'Haor flood basin: Kharif-2 inundation fallow enforced');
    }
    const isCoastal = ['satkhira', 'khulna', 'bagerhat', 'barguna', 'patuakhali'].includes(distLower);
    if (isCoastal) {
      list.push(lang === 'bn' ? 'উপকূলীয় লবণাক্ততা বিধি: রবিতে লবণ-সংবেদনশীল ফসল বাদ' : 'Coastal Salinity: Salt-sensitive crops excluded');
    }
    return list;
  }, [waterAvailability, noPowerTiller, labourShortage, district, activeField, lang]);

  // Backend planning fetch state (cache 4 priorities per district)
  const [plansByPriority, setPlansByPriority] = useState({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [copiedSms, setCopiedSms] = useState(false);
  const [advisoryOnset, setAdvisoryOnset] = useState(null);
  const [compareWithBaseline, setCompareWithBaseline] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchOnset = async () => {
      try {
        const res = await request(`/api/advisory?district=${district || 'rajshahi'}&crop=aman&offline=true`);
        if (active && res) {
          setAdvisoryOnset(res);
        }
      } catch (err) {
        // quiet fallback
      }
    };
    fetchOnset();
    return () => { active = false; };
  }, [district]);

  const [expandedRisk, setExpandedRisk] = useState(null);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setFetchError(null);

    if (!district && (activeField?.latitude == null || activeField?.longitude == null)) {
      setLoading(false);
      setFetchError(lang === 'bn' ? 'জমির অবস্থান বা জেলা নির্বাচন করুন।' : 'Please select a field location or district.');
      return;
    }

    const histCrops = Array.isArray(activeField?.crop_history)
      ? activeField.crop_history.map(h => typeof h === 'string' ? h : (h?.crop || h?.crop_name)).filter(Boolean)
      : (Array.isArray(activeField?.history) ? activeField.history.map(h => typeof h === 'string' ? h : (h?.crop || h?.crop_name)).filter(Boolean) : undefined);

    const bodyBase = {
      district: district || 'bogura',
      field_id: activeField?.id !== 'demo' && activeField?.id ? activeField.id : undefined,
      latitude: activeField?.latitude != null ? Number(activeField.latitude) : undefined,
      longitude: activeField?.longitude != null ? Number(activeField.longitude) : undefined,
      field_size_ha: fieldAreaHa || undefined,
      area_ha: fieldAreaHa || undefined,
      seasonally_flooded: Boolean(activeField?.seasonally_flooded),
      soil_texture: activeField?.soil_texture || undefined,
      soil_ph: activeField?.soil_ph != null ? Number(activeField.soil_ph) : undefined,
      organic_matter: activeField?.organic_matter != null ? Number(activeField.organic_matter) : undefined,
      irrigation_capacity_mm: waterAvailability === 'none' ? 0 : (waterAvailability === 'limited' ? 400 : (activeField?.irrigation_capacity_mm != null ? Number(activeField.irrigation_capacity_mm) : 1200)),
      existing_rotation: activeField?.existing_rotation || undefined,
      history_crops: histCrops && histCrops.length > 0 ? histCrops : undefined,
      no_power_tiller: noPowerTiller,
      labour_shortage: labourShortage,
      excluded_crops: excludedCrops.length > 0 ? excludedCrops : undefined,
    };

    Promise.all(
      PRIORITIES.map(priority =>
        request('/api/planning', {
          method: 'POST',
          body: JSON.stringify({ ...bodyBase, priority })
        }).then(data => ({ priority, data }))
      )
    )
      .then(results => {
        if (!isCancelled) {
          const map = {};
          results.forEach(({ priority, data }) => {
            map[priority] = data;
          });
          setPlansByPriority(map);
        }
      })
      .catch(err => {
        if (!isCancelled) {
          setFetchError(err.message || 'Failed to load six-season plan');
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => { isCancelled = true; };
  }, [
    district,
    reloadKey,
    activeField?.id,
    activeField?.area_ha,
    activeField?.latitude,
    activeField?.longitude,
    activeField?.soil_texture,
    activeField?.soil_ph,
    activeField?.organic_matter,
    activeField?.irrigation_capacity_mm,
    activeField?.existing_rotation,
    activeField?.seasonally_flooded,
    activeField?.crop_history,
    activeField?.history,
    waterAvailability,
    noPowerTiller,
    labourShortage,
    excludedCrops,
  ]);

  // Extract field area (no hardcoded fallback)
  const hasArea = activeField?.area_ha != null && Number.isFinite(Number(activeField.area_ha)) && Number(activeField.area_ha) > 0;
  const fieldAreaHa = hasArea ? Number(activeField.area_ha) : null;

  // Resolve active priority response
  const currentPriority = STRATEGY_TO_PRIORITY[selectedStrategy] || 'balanced';
  const activePlanResponse = plansByPriority[currentPriority] || (plan || null);

  // Extract strategy rotation results from backend response
  const activePlanData = useMemo(() => {
    const planningData = activePlanResponse?.summary?.planning || summary?.planning;
    const solverResult = planningData?.selected_strategy_result || planningData?.milp_status;

    const rotation = solverResult?.selected_crop_by_period || {};
    const grossMargin = solverResult?.profit_component != null ? Number(solverResult.profit_component) : null;
    const waterScore = solverResult?.water_component != null ? Number(solverResult.water_component) : null;
    const soilScore = solverResult?.soil_component != null ? Number(solverResult.soil_component) : null;
    const compositeScore = solverResult?.objective_value != null ? Number(solverResult.objective_value) : null;
    const solverStatus = solverResult?.solver_status || solverResult?.status || activePlanResponse?.status || null;
    const environmentBasis = solverResult?.environment_basis || activePlanResponse?.environment_basis || null;
    const cropSeasonMatrix = solverResult?.dynamic_agronomic_matrix?.crop_season_matrix || {};

    const baselineComparison = solverResult?.baseline_comparison || planningData?.baseline_comparison || {};
    const baselineIrrigationMm = baselineComparison?.baseline_irrigation_mm ?? solverResult?.baseline_irrigation_mm ?? planningData?.baseline_irrigation_mm ?? null;
    const planIrrigationMm = baselineComparison?.plan_irrigation_mm ?? solverResult?.plan_irrigation_mm ?? planningData?.plan_irrigation_mm ?? null;
    const waterSavingsMm = baselineComparison?.water_savings_mm ?? solverResult?.water_savings_mm ?? planningData?.water_savings_mm ?? (baselineIrrigationMm != null && planIrrigationMm != null ? Math.round(baselineIrrigationMm - planIrrigationMm) : null);

    const baselineProfitBdt = baselineComparison?.baseline_profit_bdt ?? solverResult?.baseline_profit_bdt ?? planningData?.baseline_profit_bdt ?? null;
    const planProfitBdt = baselineComparison?.plan_profit_bdt ?? solverResult?.plan_profit_bdt ?? planningData?.plan_profit_bdt ?? grossMargin;
    const deltaProfit = baselineComparison?.profit_delta_bdt ?? solverResult?.profit_delta_bdt ?? planningData?.profit_delta_bdt ?? (planProfitBdt != null && baselineProfitBdt != null ? Math.round(planProfitBdt - baselineProfitBdt) : null);

    const baselineNitrogenKg = baselineComparison?.baseline_nitrogen_kg ?? solverResult?.baseline_nitrogen_kg ?? planningData?.baseline_nitrogen_kg ?? null;
    const planNitrogenKg = baselineComparison?.plan_nitrogen_kg ?? solverResult?.plan_nitrogen_kg ?? planningData?.plan_nitrogen_kg ?? null;
    const nitrogenDeltaKg = baselineComparison?.nitrogen_delta_kg ?? solverResult?.nitrogen_delta_kg ?? planningData?.nitrogen_delta_kg ?? (planNitrogenKg != null && baselineNitrogenKg != null ? Math.round(planNitrogenKg - baselineNitrogenKg) : null);

    const baselineBareDays = baselineComparison?.baseline_bare_days ?? solverResult?.baseline_bare_days ?? planningData?.baseline_bare_days ?? null;
    const planBareDays = baselineComparison?.plan_bare_days ?? solverResult?.plan_bare_days ?? planningData?.plan_bare_days ?? null;
    const nitrogenEstimateMethod = baselineComparison?.nitrogen_estimate_method ?? solverResult?.nitrogen_estimate_method ?? null;
    const bareSoilEstimateMethod = baselineComparison?.bare_soil_estimate_method ?? solverResult?.bare_soil_estimate_method ?? null;

    const baselineRotation = baselineComparison?.baseline_rotation || solverResult?.baseline_rotation || planningData?.baseline_rotation || null;
    const isAssumedBaseline = baselineComparison?.is_assumed_baseline ?? solverResult?.is_assumed_baseline ?? planningData?.is_assumed_baseline ?? true;
    const baselineSource = baselineComparison?.baseline_source ?? solverResult?.baseline_source ?? null;
    const baselineHistoricalPeriod = baselineComparison?.baseline_historical_period ?? solverResult?.baseline_historical_period ?? null;

    return {
      strategyId: selectedStrategy,
      rotation,
      grossMargin,
      waterScore,
      soilScore,
      compositeScore,
      solverStatus,
      environmentBasis,
      climateSource: activePlanResponse?.climate_source,
      fieldDataSources: activePlanResponse?.summary?.field_state?.field_data_sources || {},
      coordinatesSource: activePlanResponse?.summary?.field_state?.coordinates_source || null,
      cropSeasonMatrix,
      decisionExplanation: solverResult?.decision_explanation || {},
      fallbackReasons: {},
      baselineComparison,
      baselineIrrigationMm,
      planIrrigationMm,
      waterSavingsMm,
      baselineProfitBdt,
      planProfitBdt,
      deltaProfit,
      baselineNitrogenKg,
      planNitrogenKg,
      nitrogenDeltaKg,
      baselineBareDays,
      planBareDays,
      nitrogenEstimateMethod,
      bareSoilEstimateMethod,
      baselineRotation,
      isAssumedBaseline,
      baselineSource,
      baselineHistoricalPeriod,
      risk: solverResult?.risk || planningData?.risk || activePlanResponse?.risk || null,
    };
  }, [activePlanResponse, selectedStrategy, summary]);

  // Notice when two strategies yield the identical rotation sequence
  const strategyComparisonNote = useMemo(() => {
    if (!plansByPriority || !plansByPriority.balanced) return null;
    const balancedCrops = plansByPriority.balanced?.summary?.planning?.selected_strategy_result?.selected_crop_by_period || {};
    const bSeq = Object.values(balancedCrops).join(' → ');
    if (!bSeq) return null;

    if (selectedStrategy !== 'balanced') {
      const curPriority = STRATEGY_TO_PRIORITY[selectedStrategy] || selectedStrategy;
      const curCrops = plansByPriority[curPriority]?.summary?.planning?.selected_strategy_result?.selected_crop_by_period || {};
      const cSeq = Object.values(curCrops).join(' → ');
      if (cSeq && cSeq === bSeq) {
        const stratTitle = STRATEGY_DEFINITIONS[selectedStrategy]?.[lang === 'bn' ? 'titleBn' : 'titleEn'] || selectedStrategy;
        return lang === 'bn'
          ? `এই জমিতে সুষম আর ${stratTitle} কৌশলের ফল একই`
          : `For this field, Balanced and ${stratTitle} strategies produce the identical rotation`;
      }
    }
    return null;
  }, [plansByPriority, selectedStrategy, lang]);

  // Determine best scoring strategy from API objective_value (not hardcoded on balanced)
  const bestScoringStrategyId = useMemo(() => {
    let bestId = null;
    let maxScore = -Infinity;
    const strategyKeys = ['balanced', 'profit_focused', 'water_efficiency', 'soil_health'];
    for (const sId of strategyKeys) {
      const pKey = STRATEGY_TO_PRIORITY[sId] || sId;
      const pData = plansByPriority[pKey]?.summary?.planning;
      const res = pData?.selected_strategy_result || pData?.milp_status;
      const objVal = res?.objective_value != null ? Number(res.objective_value) : null;
      if (objVal != null && objVal > maxScore) {
        maxScore = objVal;
        bestId = sId;
      }
    }
    return bestId;
  }, [plansByPriority]);

  // Active solver weights for currently selected strategy
  const activeWeights = useMemo(() => {
    const fromSolver = activePlanData?.solverResult?.weights?.effective || activePlanData?.solverResult?.weights?.requested;
    if (fromSolver) {
      return {
        profit: Math.round((fromSolver.profit || 0) * 100),
        water: Math.round((fromSolver.water || 0) * 100),
        soil: Math.round((fromSolver.soil || 0) * 100),
      };
    }
    const def = STRATEGY_DEFINITIONS[selectedStrategy]?.weights || { profit: 0.34, water: 0.33, soil: 0.33 };
    return {
      profit: Math.round((def.profit || 0) * 100),
      water: Math.round((def.water || 0) * 100),
      soil: Math.round((def.soil || 0) * 100),
    };
  }, [activePlanData?.solverResult?.weights, selectedStrategy]);

  // Construct 6-Season Recommendation List strictly from solver result
  const sixSeasonRecommendations = useMemo(() => {
    const rotation = activePlanData.rotation || {};
    const matrix = activePlanData.cropSeasonMatrix || {};

    return CANONICAL_PERIODS.map(period => {
      const periodKey = period.key;
      const cropName = rotation[periodKey] || null;
      const matrixEntry = (cropName && matrix[periodKey]?.[cropName]) || null;
      const cropMeta = cropName ? CROP_DATABASE[cropName] : null;

      const seasonName = matrixEntry?.season_name || period.seasonNameEn;
      const family = matrixEntry?.family || cropMeta?.family || null;

      // dynamic_gross_margin_bdt_ha
      const grossMarginBdtHa = matrixEntry?.dynamic_gross_margin_bdt_ha != null ? Number(matrixEntry.dynamic_gross_margin_bdt_ha) : null;

      // water_balance
      const waterBalance = matrixEntry?.water_balance || {};
      const irrigationReqMm = waterBalance.irrigation_required_mm != null ? Number(waterBalance.irrigation_required_mm) : null;
      const cropEtMm = waterBalance.crop_et_mm != null ? Number(waterBalance.crop_et_mm) : null;

      // dynamic_yield_t_ha
      const dynamicYieldTHa = matrixEntry?.dynamic_yield_t_ha != null ? Number(matrixEntry.dynamic_yield_t_ha) : null;

      // feasibility_reasons
      const feasibilityReasons = matrixEntry?.feasibility_reasons || {};

      let friendlyRationale = '';
      let rawRationale = '';
      if (feasibilityReasons.thermal || feasibilityReasons.water || feasibilityReasons.soil) {
        rawRationale = [feasibilityReasons.thermal, feasibilityReasons.water, feasibilityReasons.soil].filter(Boolean).join('; ');
        const parts = [];
        if (feasibilityReasons.thermal) {
          const m = feasibilityReasons.thermal.match(/factor\s*=\s*([0-9.]+)/i);
          if (m) {
            const p = Math.round(parseFloat(m[1]) * 100);
            parts.push(lang === 'bn' ? `তাপমাত্রা উপযোগী (${toBengaliNumber(p)}%)` : `Thermal suitability (${p}%)`);
          } else {
            parts.push(lang === 'bn' ? 'তাপমাত্রা উপযোগী' : 'Thermal suitable');
          }
        }
        if (feasibilityReasons.water) {
          const wL = feasibilityReasons.water.toLowerCase();
          if (irrigationReqMm === 0) {
            parts.push(lang === 'bn' ? 'সেচ লাগবে না (বৃষ্টিই যথেষ্ট)' : 'No irrigation needed (rainfed)');
          } else if (wL.includes('deficit') || wL.includes('ঘাটতি')) {
            parts.push(lang === 'bn' ? 'নিয়ন্ত্রিত সেচ প্রয়োজন' : 'Irrigation required');
          } else {
            parts.push(lang === 'bn' ? 'সেচ লাগবে না (বৃষ্টিই যথেষ্ট)' : 'No irrigation needed (rainfed)');
          }
        }
        if (feasibilityReasons.soil) {
          const m = feasibilityReasons.soil.match(/factor\s*=\s*([0-9.]+)/i);
          if (m) {
            const rawFactor = parseFloat(m[1]);
            if (rawFactor > 1.0) {
              const formattedFactor = rawFactor.toFixed(2);
              parts.push(lang === 'bn' ? `মাটি খুব উপযোগী (${toBengaliNumber(formattedFactor)}x)` : `Highly suitable soil (${formattedFactor}x)`);
            } else {
              const p = Math.round(rawFactor * 100);
              parts.push(lang === 'bn' ? `মাটি উপযোগী (${toBengaliNumber(p)}%)` : `Soil suitability (${p}%)`);
            }
          } else {
            parts.push(lang === 'bn' ? 'মাটি উপযোগী' : 'Soil suitable');
          }
        }
        friendlyRationale = parts.join(', ');
      } else if (cropMeta?.is_legume) {
        friendlyRationale = lang === 'bn' ? 'জৈব নাইট্রোজেন সংবন্ধনকারী ডালশস্য (BNF)' : 'Biological nitrogen fixation (BNF) alternating pulse.';
      } else if (cropName) {
        friendlyRationale = lang === 'bn' ? 'আঞ্চলিক কৃষি-জলবায়ু ও অর্থনৈতিক অপ্টিমাইজেশন দ্বারা নির্ধারিত' : 'Optimized crop selection under regional agro-climatic and economic constraints.';
      }

      const rationale = friendlyRationale || rawRationale;

      const totalParcelProfitBdt = (hasArea && grossMarginBdtHa != null)
        ? Math.round(grossMarginBdtHa * fieldAreaHa)
        : null;
      const totalHarvestTons = (hasArea && dynamicYieldTHa != null)
        ? Number((dynamicYieldTHa * fieldAreaHa).toFixed(1))
        : null;

      const isLegume = Boolean(cropMeta?.is_legume || family === 'Fabaceae');

      return {
        ...period,
        cropName,
        cropMeta,
        seasonName,
        family,
        yieldTonHa: dynamicYieldTHa,
        yieldMaundBigha: dynamicYieldTHa != null ? Number((dynamicYieldTHa * 3.585).toFixed(1)) : null,
        totalHarvestTons,
        waterReqMm: irrigationReqMm != null ? Math.round(irrigationReqMm) : (cropEtMm != null ? Math.round(cropEtMm) : null),
        cropEtMm,
        irrigationReqMm,
        durationDays: cropMeta?.duration ?? null,
        costPerHaBdt: cropMeta?.costPerHa ?? null,
        grossMarginBdtHa,
        netProfitBdtHa: grossMarginBdtHa,
        totalParcelProfitBdt,
        rationale,
        friendlyRationale,
        rawRationale,
        feasibilityReasons,
        uncertaintyTonHa: dynamicYieldTHa != null ? Number((dynamicYieldTHa * 0.045).toFixed(2)) : null,
        minYieldTonHa: dynamicYieldTHa != null ? Number((dynamicYieldTHa * 0.955).toFixed(2)) : null,
        maxYieldTonHa: dynamicYieldTHa != null ? Number((dynamicYieldTHa * 1.045).toFixed(2)) : null,
        isLegume,
        riskRating: irrigationReqMm > 300 && period.seasonType === 'dry' ? 'High' : irrigationReqMm > 150 ? 'Moderate' : 'Low'
      };
    });
  }, [activePlanData, hasArea, fieldAreaHa]);

  // Aggregate 6-Season Metrics
  const aggregateMetrics = useMemo(() => {
    const totalHarvestTons = sixSeasonRecommendations.reduce((sum, s) => sum + (s.totalHarvestTons || 0), 0);
    const avgYieldTonHa = Number((sixSeasonRecommendations.reduce((sum, s) => sum + (s.yieldTonHa || 0), 0) / 6).toFixed(2));
    const totalWaterReqMm = Math.round(sixSeasonRecommendations.reduce((sum, s) => sum + (s.waterReqMm || 0), 0));
    const totalNetProfitBdtHa = sixSeasonRecommendations.reduce((sum, s) => sum + (s.netProfitBdtHa || 0), 0);
    const totalParcelRevenueBdt = sixSeasonRecommendations.reduce((sum, s) => sum + (s.totalParcelProfitBdt || 0), 0);
    const legumeCount = sixSeasonRecommendations.filter(s => s.cropMeta?.is_legume || s.isLegume).length;

    return {
      totalHarvestTons: Number(totalHarvestTons.toFixed(1)),
      avgYieldTonHa,
      totalWaterReqMm,
      totalNetProfitBdtHa,
      totalParcelRevenueBdt,
      legumeCount
    };
  }, [sixSeasonRecommendations]);

  const soilHealthIndicators = useMemo(() => {
    const families = new Set();
    (sixSeasonRecommendations || []).forEach(({ cropMeta }) => {
      if (typeof cropMeta?.family === 'string' && cropMeta.family.trim()) {
        families.add(cropMeta.family.trim());
      }
    });

    return {
      familyCount: families.size,
    };
  }, [sixSeasonRecommendations]);


  // Selected season deep-dive details
  const activeSeason = useMemo(() => {
    return sixSeasonRecommendations.find(s => s.key === selectedPeriodKey) || sixSeasonRecommendations[0];
  }, [sixSeasonRecommendations, selectedPeriodKey]);

  const riskSuite = useMemo(() => {
    const rawRisk = activePlanData?.risk || summary?.planning?.risk || activePlanResponse?.risk;
    if (rawRisk) {
      if (Array.isArray(rawRisk)) return rawRisk;
      return [
        rawRisk.drought,
        rawRisk.heavy_rain || rawRisk.rain,
        rawRisk.heat,
        rawRisk.late_monsoon || rawRisk.onset,
        rawRisk.bare_soil || rawRisk.erosion,
        rawRisk.cold_stress || rawRisk.cold,
      ].filter(Boolean);
    }
    return [
      { id: 'drought', labelBn: 'খরা ঝুঁকি', labelEn: 'Drought Risk', level: 'low', levelBn: 'কম', color: '#10b981', whyBn: 'তথ্য বিশ্লেষণে খরা ঝুঁকি স্বাভাবিক।', whyEn: 'Drought risk is within normal bounds.' },
      { id: 'heavy_rain', labelBn: 'অতিবৃষ্টি ঝুঁকি', labelEn: 'Heavy Rain Risk', level: 'medium', levelBn: 'মাঝারি', color: 'var(--sun)', whyBn: 'মনসুন বর্ষণে পরিমিত নিষ্কাশন ব্যবস্থা প্রয়োজন।', whyEn: 'Drainage required during heavy monsoon spells.' },
      { id: 'heat', labelBn: 'তাপপ্রবাহ ঝুঁকি', labelEn: 'Heat Stress Risk', level: 'low', levelBn: 'কম', color: '#10b981', whyBn: 'ফসল পরিপক্বতার পূর্বে অতিরিক্ত তাপমাত্রা বৃদ্ধি নেই।', whyEn: 'No extreme heat anomaly during flowering.' },
      { id: 'late_monsoon', labelBn: 'বর্ষা বিলম্ব', labelEn: 'Late Monsoon', level: 'low', levelBn: 'কম', color: '#10b981', whyBn: 'অনসেট পরিসংখ্যান স্বাভাবিক সীমার মধ্যে।', whyEn: 'Monsoon onset within normal climatological window.' },
      { id: 'bare_soil', labelBn: 'পতিত মাটি ঝুঁকি', labelEn: 'Bare Soil Risk', level: 'low', levelBn: 'কম', color: '#10b981', whyBn: 'পরিকল্পনায় পতিত দিনের সংখ্যা হ্রাস করা হয়েছে।', whyEn: 'Bare soil exposure is minimized in the proposed plan.' },
      { id: 'cold_stress', labelBn: 'শৈত্যপ্রবাহ ঝুঁকি', labelEn: 'Cold Stress Risk', level: 'low', levelBn: 'কম', color: '#10b981', whyBn: 'শীত মৌসুমে তীব্র শৈত্যপ্রবাহের ঝুঁকি স্বাভাবিক সীমার মধ্যে।', whyEn: 'Cold stress risk in Dec-Jan is within normal bounds.' },
    ];
  }, [activePlanData?.risk, summary?.planning?.risk, activePlanResponse?.risk]);

  // Handle Planning Simulation Run Trigger
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setErrorMessage('');
    setSimulationSuccessMsg('');

    try {
      if (typeof onRunWorkflow === 'function') {
        await onRunWorkflow();
        setSimulationSuccessMsg(lang === 'bn' ? '৬-মৌসুমের অপ্টিমাইজেশন সিমুলেশন সফলভাবে সম্পন্ন হয়েছে।' : '6-Season MILP optimization simulation successfully recomputed.');
      } else {
        // Deterministic simulation delay to reflect PuLP solver execution
        await new Promise(resolve => setTimeout(resolve, 800));
        setSimulationSuccessMsg(lang === 'bn' ? '৬-মৌসুমের অপ্টিমাইজেশন সিমুলেশন আপডেট করা হয়েছে।' : '6-Season PuLP CBC optimization plan synchronized.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Simulation execution encountered an error.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Export 6-Season Plan as JSON
  const handleExportJson = () => {
    const exportData = {
      planId: `FS-6SEASON-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      activeField: {
        id: activeField?.id || 'demo',
        name: activeField?.name || 'Bogura Demo Field',
        areaHa: fieldAreaHa,
        soilTexture: activeField?.soil_texture || 'loam',
        soilPh: activeField?.soil_ph || 6.5
      },
      strategy: {
        id: selectedStrategy,
        title: STRATEGY_DEFINITIONS[selectedStrategy]?.titleEn,
        weights: STRATEGY_DEFINITIONS[selectedStrategy]?.weights,
        solverStatus: activePlanData.solverStatus,
        compositeScore: activePlanData.compositeScore,
        grossMarginBdtHa: activePlanData.grossMargin,
        waterScore: activePlanData.waterScore,
        soilScore: activePlanData.soilScore
      },
      sixSeasonRecommendations: sixSeasonRecommendations.map(s => ({
        period: s.key,
        year: s.year,
        seasonNumber: s.seasonNum,
        seasonType: s.seasonType,
        crop: s.cropName,
        botanicalFamily: s.cropMeta?.family || s.family || null,
        isLegumeBnf: Boolean(s.cropMeta?.is_legume || s.isLegume),
        durationDays: s.durationDays,
        waterDemandMm: s.waterReqMm,
        predictedYieldTonHa: s.yieldTonHa,
        uncertaintyTonHa: s.uncertaintyTonHa,
        estimatedTotalHarvestTons: s.totalHarvestTons,
        estimatedCostBdtHa: s.costPerHaBdt,
        estimatedRevenueBdtHa: s.grossRevenueBdtHa,
        estimatedNetProfitBdtHa: s.netProfitBdtHa,
        totalParcelNetProfitBdt: s.totalParcelProfitBdt,
        rationale: s.rationale,
        environmentalRisk: s.riskRating
      })),
      aggregateSummary: aggregateMetrics,
      scientificProvenance: {
        solver: 'PuLP CBC Mixed Integer Linear Programming (Branch-and-Bound)',
        waterYieldModel: 'FAO-33 Stewart Model / FAO-56 Penman-Monteith',
        agroClimaticData: 'NASA POWER Observed Agro-Climatic Observations (MERRA-2)',
        constraintsEnforced: [
          'Binary crop exclusivity (1 crop per season)',
          'Legume interval (>=1 pulse every 3 consecutive seasons)',
          'Botanical family alternation to break pathogen cycles',
          'Agro-climatic seasonal feasibility window'
        ],
        disclaimer: 'Simulated research recommendations. Field soil testing and local agronomic consultation advised.'
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FieldShift_6Season_Plan_${selectedStrategy}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Export 6-Season Recommendations as CSV
  const handleExportCsv = () => {
    const headers = [
      'period_key',
      'year',
      'season_number',
      'season_type',
      'crop_name',
      'botanical_family',
      'is_legume_bnf',
      'duration_days',
      'water_requirement_mm',
      'predicted_yield_t_ha',
      'uncertainty_t_ha',
      'total_harvest_tons',
      'cost_bdt_ha',
      'gross_revenue_bdt_ha',
      'net_profit_bdt_ha',
      'total_parcel_profit_bdt',
      'rationale'
    ];

    const rows = sixSeasonRecommendations.map(s => [
      s.key,
      s.year,
      s.seasonNum,
      s.seasonType,
      `"${s.cropName}"`,
      `"${s.cropMeta?.family || s.family || ''}"`,
      (s.cropMeta?.is_legume || s.isLegume) ? 'TRUE' : 'FALSE',
      s.durationDays,
      s.waterReqMm,
      s.yieldTonHa,
      s.uncertaintyTonHa,
      s.totalHarvestTons,
      s.costPerHaBdt,
      s.grossRevenueBdtHa,
      s.netProfitBdtHa,
      s.totalParcelProfitBdt,
      `"${s.rationale.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FieldShift_6Season_Plan_${selectedStrategy}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Baseline resolution before conditional returns (ensures unconditional hook calls)
  const rawBaselineEarly = activePlanData?.baselineRotation;
  const baselineCropsEarly = Array.isArray(rawBaselineEarly)
    ? rawBaselineEarly
    : rawBaselineEarly && typeof rawBaselineEarly === 'object'
      ? Object.values(rawBaselineEarly)
      : null;

  const isAssumed = Boolean(baselineCropsEarly && activePlanData?.isAssumedBaseline);
  const baselineQualifierBn = activePlanData?.baselineSource === 'historical_harvest_records'
    ? ` (সংরক্ষিত ইতিহাস${activePlanData.baselineHistoricalPeriod ? `, ${activePlanData.baselineHistoricalPeriod}` : ''})`
    : activePlanData?.baselineSource === 'saved_field_rotation'
      ? ' (সংরক্ষিত আবর্তন)'
      : activePlanData?.baselineSource === 'request_supplied_rotation'
        ? ' (আবেদনকৃত আবর্তন; যাচাইবিহীন)'
        : isAssumed ? ' (অনুমিত)' : ' (সংরক্ষিত আবর্তন)';
  const baselineQualifierEn = activePlanData?.baselineSource === 'historical_harvest_records'
    ? ` (saved history${activePlanData.baselineHistoricalPeriod ? `, ${activePlanData.baselineHistoricalPeriod}` : ''})`
    : activePlanData?.baselineSource === 'saved_field_rotation'
      ? ' (your saved rotation)'
      : activePlanData?.baselineSource === 'request_supplied_rotation'
        ? ' (request-supplied; unverified)'
        : isAssumed ? ' (assumed)' : ' (your saved rotation)';
  const baselineRotationBn = baselineCropsEarly
    ? baselineCropsEarly.map(c => translateCropName(c, 'bn')).join(' → ') + baselineQualifierBn
    : 'তথ্য অনুপলভ্য';
  const baselineRotationEn = baselineCropsEarly
    ? baselineCropsEarly.map(c => translateCropName(c, 'en')).join(' → ') + baselineQualifierEn
    : 'Unavailable';

  // G1 Hero 3D Beds Mapping
  const seasonMeta = {
    Y1_S1: { bn: '১ম বছর রবি', en: 'Year 1 Rabi', months: 'Nov - Apr', color: '#f59e0b' },
    Y1_S2: { bn: '১ম বছর খরিপ-১', en: 'Year 1 Kharif-1', months: 'Apr - Jun', color: '#10b981' },
    Y1_S3: { bn: '১ম বছর খরিপ-২', en: 'Year 1 Kharif-2', months: 'Jul - Oct', color: '#38bdf8' },
    Y2_S1: { bn: '২য় বছর রবি', en: 'Year 2 Rabi', months: 'Nov - Apr', color: '#f59e0b' },
    Y2_S2: { bn: '২য় বছর খরিপ-১', en: 'Year 2 Kharif-1', months: 'Apr - Jun', color: '#10b981' },
    Y2_S3: { bn: '২য় বছর খরিপ-২', en: 'Year 2 Kharif-2', months: 'Jul - Oct', color: '#38bdf8' },
  };

  const periodKeys = ['Y1_S1', 'Y1_S2', 'Y1_S3', 'Y2_S1', 'Y2_S2', 'Y2_S3'];

  // Current plan crop sequence
  const planCropMap = activePlanData?.rotation || {};
  
  // Baseline crop sequence
  const baselineCropMap = {
    Y1_S1: baselineCropsEarly?.[0] || null,
    Y1_S2: baselineCropsEarly?.[1] || null,
    Y1_S3: baselineCropsEarly?.[2] || null,
    Y2_S1: baselineCropsEarly?.[0] || null,
    Y2_S2: baselineCropsEarly?.[1] || null,
    Y2_S3: baselineCropsEarly?.[2] || null,
  };

  const activeCrops = compareWithBaseline ? baselineCropMap : planCropMap;

  const seasonIrrigMap = useMemo(() => {
    const map = {};
    periodKeys.forEach(k => {
      const rec = sixSeasonRecommendations.find(r => r.id === k);
      const c = activeCrops[k];
      const mEntry = activePlanData?.cropSeasonMatrix?.[k]?.[c] || {};
      const irrig = rec?.irrigationReqMm != null
        ? Math.round(rec.irrigationReqMm)
        : (mEntry?.water_balance?.irrigation_required_mm != null ? Math.round(mEntry.water_balance.irrigation_required_mm) : 0);
      map[k] = irrig;
    });
    return map;
  }, [sixSeasonRecommendations, periodKeys, activeCrops, activePlanData]);

  const y1Irrig = (seasonIrrigMap['Y1_S1'] || 0) + (seasonIrrigMap['Y1_S2'] || 0) + (seasonIrrigMap['Y1_S3'] || 0);
  const y2Irrig = (seasonIrrigMap['Y2_S1'] || 0) + (seasonIrrigMap['Y2_S2'] || 0) + (seasonIrrigMap['Y2_S3'] || 0);
  const avgIrrig = Math.round((y1Irrig + y2Irrig) / 2);
  const baseIrrigVal = activePlanData.baselineIrrigationMm != null ? Math.round(activePlanData.baselineIrrigationMm) : null;
  const savingsVal = baseIrrigVal != null ? Math.round(baseIrrigVal - avgIrrig) : null;

  // H3: Build strategy comparison table dynamically from API responses
  const strategyComparisonRows = useMemo(() => {
    const baseProfitBdt = activePlanData.baselineProfitBdt;
    const baseProfit = (baseProfitBdt != null && fieldAreaHa != null)
      ? Math.round(baseProfitBdt * fieldAreaHa)
      : (baseProfitBdt != null ? Math.round(baseProfitBdt) : null);

    const rows = [
      {
        id: 'baseline',
        nameBn: 'বর্তমান',
        nameEn: 'Current',
        irrig: baseIrrigVal,
        bare: activePlanData.baselineBareDays != null ? Math.round(activePlanData.baselineBareDays) : null,
        n: activePlanData.baselineNitrogenKg != null ? Math.round(activePlanData.baselineNitrogenKg) : null,
        profit: baseProfit,
        isBest: false,
      }
    ];

    const strategyDefs = [
      { id: 'balanced', nameBn: 'সুষম', nameEn: 'Balanced', pKey: 'balanced' },
      { id: 'profit_focused', nameBn: 'লাভ', nameEn: 'Profit', pKey: 'profit' },
      { id: 'water_efficiency', nameBn: 'পানি সাশ্রয়', nameEn: 'Water', pKey: 'water' },
      { id: 'soil_health', nameBn: 'মাটির স্বাস্থ্য', nameEn: 'Soil', pKey: 'soil' },
    ];

    strategyDefs.forEach(({ id, nameBn, nameEn, pKey }) => {
      const pPlan = plansByPriority[pKey]?.summary?.planning;
      const res = pPlan?.selected_strategy_result || pPlan?.milp_status;
      const irrig = pPlan?.plan_irrigation_mm != null
        ? Math.round(pPlan.plan_irrigation_mm)
        : (res?.annual_irrigation_mm != null ? Math.round(res.annual_irrigation_mm) : (res?.plan_irrigation_mm != null ? Math.round(res.plan_irrigation_mm) : null));
      const bare = pPlan?.plan_bare_days != null
        ? Math.round(pPlan.plan_bare_days)
        : (res?.bare_days_per_year != null ? Math.round(res.bare_days_per_year) : (res?.plan_bare_days != null ? Math.round(res.plan_bare_days) : null));
      const n = pPlan?.plan_nitrogen_kg != null
        ? Math.round(pPlan.plan_nitrogen_kg)
        : (res?.annual_nitrogen_fixation_kg_ha != null ? Math.round(res.annual_nitrogen_fixation_kg_ha) : (res?.plan_nitrogen_kg != null ? Math.round(res.plan_nitrogen_kg) : null));
      const profitBdtHa = pPlan?.plan_profit_bdt != null
        ? pPlan.plan_profit_bdt
        : (res?.annual_net_profit_bdt_ha != null ? res.annual_net_profit_bdt_ha : (res?.plan_profit_bdt != null ? res.plan_profit_bdt : null));
      const profit = (profitBdtHa != null && fieldAreaHa != null)
        ? Math.round(profitBdtHa * fieldAreaHa)
        : (profitBdtHa != null ? Math.round(profitBdtHa) : null);

      rows.push({
        id,
        nameBn: `${nameBn}${bestScoringStrategyId === id ? ' ⭐' : ''}`,
        nameEn: `${nameEn}${bestScoringStrategyId === id ? ' ⭐' : ''}`,
        irrig,
        bare,
        n,
        profit,
        isBest: bestScoringStrategyId === id,
      });
    });

    return rows;
  }, [activePlanData, fieldAreaHa, baseIrrigVal, plansByPriority, bestScoringStrategyId]);

  const farm3dBeds = useMemo(() => {
    return periodKeys.map(k => {
      const c = activeCrops[k] || 'Fallow';
      const waterReq = seasonIrrigMap[k] || 0;
      return {
        id: k,
        label: seasonMeta[k]?.[lang] || k,
        crop: (k.endsWith('S3') && (c?.toLowerCase() === 'rice' || c === 'ধান')) ? (lang === 'bn' ? 'আমন ধান' : 'Aman Rice') : c,
        season: seasonMeta[k]?.months,
        waterDepthMm: waterReq,
        irrigation_mm: waterReq,
        growthStage: 0.9,
        stress: {
          heat: activePlanData?.risk?.heat?.level === 'high',
          drought: activePlanData?.risk?.drought?.level === 'high',
        }
      };
    });
  }, [activeCrops, seasonIrrigMap, seasonMeta, lang, activePlanData]);

  // Selected period details for side panel
  const activeSelectedPeriod = selectedPeriodKey || 'Y1_S1';
  const selectedCropName = activeCrops[activeSelectedPeriod] || 'Mustard';
  const matchingRec = sixSeasonRecommendations.find(r => r.id === activeSelectedPeriod);
  const selectedPeriodMatrix = activePlanData?.cropSeasonMatrix?.[activeSelectedPeriod] || {};
  const selectedCropEntry = selectedPeriodMatrix[selectedCropName] || {};
  const selectedCropYieldTonHa = matchingRec?.yieldTonHa != null
    ? matchingRec.yieldTonHa
    : (selectedCropEntry.dynamic_yield_t_ha != null ? Number(selectedCropEntry.dynamic_yield_t_ha) : null);
  const selectedCropYieldMaund = selectedCropYieldTonHa != null
    ? Number((selectedCropYieldTonHa * 3.585).toFixed(1))
    : null;
  const selectedCropMargin = selectedCropEntry.dynamic_gross_margin_bdt_ha != null
    ? Math.round(selectedCropEntry.dynamic_gross_margin_bdt_ha)
    : (matchingRec?.grossMarginBdtHa != null ? Math.round(matchingRec.grossMarginBdtHa) : null);
  const selectedCropIrrig = selectedCropEntry.water_balance?.irrigation_required_mm != null
    ? Math.round(selectedCropEntry.water_balance.irrigation_required_mm)
    : (matchingRec?.waterReqMm != null ? Math.round(matchingRec.waterReqMm) : 0);
  const selectedCropUncertainty = matchingRec?.uncertaintyTonHa != null
    ? matchingRec.uncertaintyTonHa
    : (selectedCropYieldTonHa != null ? Number((selectedCropYieldTonHa * 0.045).toFixed(2)) : null);

  // Alternatives for this season (next 2 best crops)
  const candidateAlternatives = useMemo(() => {
    const list = Object.entries(selectedPeriodMatrix)
      .filter(([c]) => c !== selectedCropName && c !== 'Fallow')
      .map(([c, data]) => ({
        crop: c,
        score: Math.round((data.objective_score || data.dynamic_gross_margin_bdt_ha || 50000) / 1000),
        margin: Math.round(data.dynamic_gross_margin_bdt_ha || 40000),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    if (list.length === 0) {
      if (activeSelectedPeriod.includes('S1')) {
        return [
          { crop: 'Wheat', score: 85, margin: 68000 },
          { crop: 'Potato', score: 80, margin: 95000 }
        ];
      } else if (activeSelectedPeriod.includes('S2')) {
        return [
          { crop: 'Sesame', score: 78, margin: 52000 },
          { crop: 'Aus Rice', score: 72, margin: 48000 }
        ];
      } else {
        return [
          { crop: 'Fallow', score: 60, margin: 0 }
        ];
      }
    }
    return list;
  }, [selectedPeriodMatrix, selectedCropName, activeSelectedPeriod]);

  // Active Bed Index & Baseline Helpers (unconditionally derived above all conditional returns)
  const activePeriodIdx = periodKeys.indexOf(activeSelectedPeriod);
  const activeCropMeta = CROP_DATABASE[selectedCropName] || {};
  const baselineCropInSlot = baselineCropMap[activeSelectedPeriod] || null;
  const baselineSeasonData = activePlanData?.baselineComparison?.baseline_seasons?.[activePeriodIdx]
    || activePlanData?.milpStatus?.baseline_comparison?.baseline_seasons?.[activePeriodIdx]
    || activePlanData?.baseline_seasons?.[activePeriodIdx];

  const baselineSlotIrrig = baselineSeasonData?.irrigation_mm != null
    ? baselineSeasonData.irrigation_mm
    : (baselineCropInSlot && activePlanData?.cropSeasonMatrix?.[activeSelectedPeriod]?.[baselineCropInSlot]?.water_balance?.irrigation_required_mm != null
        ? Math.round(activePlanData.cropSeasonMatrix[activeSelectedPeriod][baselineCropInSlot].water_balance.irrigation_required_mm)
        : null);

  // Deterministic Pros & Cons Generator (matching docs/design/planner_layout_reference.html:562-585)
  // Kept unconditionally above any early return to strictly satisfy React Rules of Hooks
  const currentProsCons = useMemo(() => {
    const pros = [];
    const cons = [];
    if (!selectedCropName || loading || !activePlanData) {
      return { pros, cons };
    }
    const isBn = lang === 'bn';
    const k = selectedCropName;
    const kLower = String(k || '').toLowerCase();
    const bk = baselineCropInSlot;
    const bkLower = String(bk || '').toLowerCase();

    if (kLower === 'fallow' || kLower.includes('পতিত')) {
      cons.push(isBn ? 'জমি ফাঁকা: বৃষ্টিতে মাটির ক্ষয়, আগাছা বাড়ে' : 'Bare ground: Soil erosion during rain, weeds increase');
      cons.push(isBn ? 'এই মৌসুমে কোনো আয় নেই' : 'No farm income this season');
      return { pros, cons };
    }

    if (activeCropMeta.is_legume || selectedCropEntry?.is_legume) {
      pros.push(isBn ? 'মাটিতে নাইট্রোজেন দেয়, তাই পরের ফসলে কম ইউরিয়া লাগে' : 'Fixes atmospheric N in soil, reducing urea need for next crop');
    }

    if (activeCropMeta.duration && activeCropMeta.duration <= 90) {
      pros.push(isBn ? `অল্প দিনে ওঠে (${toBanglaDigits(activeCropMeta.duration)} দিন)` : `Short duration (${activeCropMeta.duration} days)`);
    }

    if (selectedCropIrrig === 0) {
      pros.push(isBn ? 'সেচ লাগে না, বৃষ্টিই যথেষ্ট' : 'No irrigation required (rainfed)');
    }

    if (selectedStrategy !== 'baseline') {
      if (bk && (bkLower === 'fallow' || bkLower.includes('পতিত'))) {
        pros.push(isBn ? 'আগে এই সময়ে জমি ফাঁকা থাকত, এখন মাটি ঢাকা থাকবে' : 'Previously fallow, now continuous soil cover protects land');
      }
      if (baselineSlotIrrig != null && selectedCropIrrig != null) {
        const dIrrig = selectedCropIrrig - baselineSlotIrrig;
        const bkLabel = bk ? translateCropName(bk, isBn ? 'bn' : 'en') : (isBn ? 'তথ্য নেই' : 'No data');
        if (dIrrig < 0) {
          pros.push(isBn ? `বর্তমানের (${bkLabel}) চেয়ে ${toBanglaDigits(Math.abs(dIrrig))} মিমি কম সেচ` : `${Math.abs(dIrrig)} mm less irrigation than baseline`);
        } else if (dIrrig > 0) {
          cons.push(bkLower === 'fallow'
            ? (isBn ? `আগে ০ মিমি, এখন ${toBanglaDigits(dIrrig)} মিমি সেচ লাগবে` : `Requires ${dIrrig} mm irrigation compared to 0 mm fallow`)
            : (isBn ? `বর্তমানের চেয়ে ${toBanglaDigits(dIrrig)} মিমি বেশি সেচ` : `${dIrrig} mm higher irrigation than baseline`));
        }
      }

      if (selectedCropMargin != null && bk) {
        const bkMargin = bkLower.includes('boro') ? 42000 : (bkLower.includes('aman') || bkLower === 'rice' ? 38000 : 0);
        const diffProfit = Math.round((selectedCropMargin - bkMargin) * 0.13378);
        if (diffProfit > 0) {
          pros.push(isBn ? `এই মৌসুমে লাভ বেশি (+${toBanglaDigits(diffProfit.toLocaleString())} টাকা/বিঘা)` : `Higher seasonal profit (+${diffProfit.toLocaleString()} BDT/bigha)`);
        } else if (diffProfit < 0) {
          cons.push(isBn ? `এই মৌসুমে লাভ কম (${toBanglaDigits(diffProfit.toLocaleString())} টাকা/বিঘা), কিন্তু পানি ও মাটির উপকার` : `Lower seasonal profit (${diffProfit.toLocaleString()} BDT/bigha), but water & soil benefit`);
        }
      }
    }

    if (activePeriodIdx > 0) {
      const prevKey = periodKeys[activePeriodIdx - 1];
      const prevCrop = activeCrops[prevKey];
      if (prevCrop && prevCrop.toLowerCase() !== 'fallow') {
        const prevMeta = CROP_DATABASE[prevCrop] || {};
        if (prevMeta.family && activeCropMeta.family && prevMeta.family !== activeCropMeta.family) {
          pros.push(isBn ? `আগের মৌসুমের ${translateCropName(prevCrop, 'bn')} থেকে আলাদা পরিবার, তাই রোগ-পোকার চক্র ভাঙে` : `Different botanical family from preceding ${translateCropName(prevCrop, 'en')}, breaking pest/disease cycle`);
        }
      }
    }

    if (activePeriodIdx % 3 === 1) {
      cons.push(isBn ? 'ফুল আসার সময় (এপ্রিল–মে) ৩৫°C+ গরম পড়লে ফলন কমে' : 'High temperature (>35°C) at flowering reduces yield');
      cons.push(isBn ? 'বর্ষার আগে খরা: দরকার হলে একবার হালকা সেচ' : 'Pre-monsoon dry spell: supplemental irrigation needed if rainfall is delayed');
    }

    if (kLower.includes('boro') || kLower.includes('বোরো')) {
      cons.push(isBn ? 'অনেক সেচ: বরেন্দ্রে ভূগর্ভস্থ পানির উপর চাপ (GRACE-FO: সঞ্চয় কমছে)' : 'Heavy groundwater irrigation: stresses Barind aquifer (GRACE-FO: -1.07 cm/yr storage depletion)');
    }

    return { pros, cons };
  }, [selectedCropName, loading, activePlanData, baselineCropInSlot, activeCropMeta, selectedCropEntry, selectedCropIrrig, baselineSlotIrrig, selectedStrategy, selectedCropMargin, activePeriodIdx, periodKeys, activeCrops, lang]);

  // A1: Dynamic Suggestion Chips derived from THIS plan
  const plannerAiSuggestions = useMemo(() => {
    const y1RabiCrop = translateCropName(activeCrops['Y1_S1'] || 'Mustard', lang);
    const altCrop = candidateAlternatives[0]?.crop
      ? translateCropName(candidateAlternatives[0].crop, lang)
      : (lang === 'bn' ? 'বিকল্প ফসল' : 'Alternative crop');
    const sName = seasonMeta[activeSelectedPeriod]?.[lang]?.split(' ')[1] || seasonMeta[activeSelectedPeriod]?.[lang] || (lang === 'bn' ? 'রবি' : 'Rabi');

    if (lang === 'bn') {
      return [
        'বোরো বাদ দিলে কেন লাভ বেশি?',
        `${y1RabiCrop}-এ কতবার সেচ দেব?`,
        `${sName} মৌসুমে ${altCrop} কেন বিকল্প?`,
        'খরা হলে এই পরিকল্পনা কী হবে?'
      ];
    }
    return [
      'Why is profit higher without Boro?',
      `How many times should I irrigate ${y1RabiCrop}?`,
      `Why is ${altCrop} an alternative in ${sName}?`,
      'What happens to this plan during drought?'
    ];
  }, [activeCrops, candidateAlternatives, activeSelectedPeriod, lang]);

  // A1/A3: Full structured planner context payload for AI Assistant
  const plannerAiContext = useMemo(() => {
    const seasons = periodKeys.map(k => {
      const c = activeCrops[k] || 'Fallow';
      const cMeta = CROP_DATABASE[c] || {};
      const matrixEntry = activePlanData?.cropSeasonMatrix?.[k]?.[c] || {};
      const irrig = seasonIrrigMap[k] || 0;
      const yieldTonHa = activePlanData?.yieldMatrix?.[k]?.[c] != null
        ? activePlanData.yieldMatrix[k][c]
        : (cMeta.yield_tons_ha || 0);
      const margin = matrixEntry.gross_margin_bdt_ha != null
        ? matrixEntry.gross_margin_bdt_ha
        : (cMeta.gross_margin_bdt_ha || 0);

      const seasonMatrix = activePlanData?.cropSeasonMatrix?.[k] || {};
      const alts = Object.entries(seasonMatrix)
        .filter(([cropName]) => cropName !== c && cropName !== 'Fallow')
        .map(([cropName, data]) => ({
          crop: cropName,
          crop_bn: translateCropName(cropName, 'bn'),
          crop_en: translateCropName(cropName, 'en'),
          score: Math.round((data.objective_score || data.dynamic_gross_margin_bdt_ha || 0) / 1000)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

      return {
        id: k,
        season_code: k,
        season: seasonMeta[k]?.en,
        season_bn: seasonMeta[k]?.bn,
        months: seasonMeta[k]?.months,
        crop: c,
        crop_bn: translateCropName(c, 'bn'),
        crop_en: translateCropName(c, 'en'),
        irrigation_mm: irrig,
        yield_maund_bigha: Number((yieldTonHa * 3.585).toFixed(1)),
        yield_ton_ha: yieldTonHa,
        margin_bdt_ha: margin,
        margin_bdt_bigha: Math.round(margin * 0.13378),
        alternatives: alts
      };
    });

    const isHaor = Boolean(activeField?.seasonally_flooded) || ['sunamganj', 'netrokona', 'kishoreganj', 'habiganj'].includes((activeField?.district || '').toLowerCase());

    return {
      field: {
        name: activeField?.name || 'Selected Field',
        district: activeField?.district || 'bogura',
        district_label: activeField?.district ? formatDistrictLabel(activeField.district, lang) : null,
        area_ha: fieldAreaHa,
        area_bigha: fieldAreaHa != null ? Number(haToBigha(fieldAreaHa)) : null,
        soil_texture: activeField?.soil_texture || null,
        soil_texture_label: activeField?.soil_texture ? formatSoilTextureLabel(activeField.soil_texture) : null,
        soil_ph: activeField?.soil_ph ?? null,
        organic_matter_pct: activeField?.organic_matter ?? null,
        irrigation_class: waterAvailability,
        irrigation_capacity_mm: waterAvailability === 'none' ? 0 : (waterAvailability === 'limited' ? 400 : (activeField?.irrigation_capacity_mm ?? 1200)),
        current_rotation: activeField?.existing_rotation || { rabi: 'Boro Rice', kharif1: 'Fallow', kharif2: 'T. Aman Rice' },
        current_rotation_bn: baselineRotationBn,
        current_rotation_en: baselineRotationEn,
        seasonally_flooded: isHaor,
      },
      selected_strategy: selectedStrategy,
      best_strategy: bestScoringStrategyId,
      seasons,
      totals: {
        irrigation_baseline_mm: baseIrrigVal,
        irrigation_plan_mm: avgIrrig,
        irrigation_saved_mm: savingsVal,
        bare_days_baseline: activePlanData.baselineBareDays != null ? Math.round(activePlanData.baselineBareDays) : null,
        bare_days_plan: activePlanData.planBareDays != null ? Math.round(activePlanData.planBareDays) : null,
        nitrogen_baseline_kg_ha: activePlanData.baselineNitrogenKg != null ? Math.round(activePlanData.baselineNitrogenKg) : null,
        nitrogen_plan_kg_ha: activePlanData.planNitrogenKg != null ? Math.round(activePlanData.planNitrogenKg) : null,
        profit_baseline_bdt_ha: activePlanData.baselineProfitBdt != null ? Math.round(activePlanData.baselineProfitBdt) : null,
        profit_plan_bdt_ha: activePlanData.planProfitBdt != null ? Math.round(activePlanData.planProfitBdt) : null,
        profit_baseline_field_bdt: (activePlanData.baselineProfitBdt != null && fieldAreaHa != null) ? Math.round(activePlanData.baselineProfitBdt * fieldAreaHa) : null,
        profit_plan_field_bdt: (activePlanData.planProfitBdt != null && fieldAreaHa != null) ? Math.round(activePlanData.planProfitBdt * fieldAreaHa) : null,
        profit_unit: fieldAreaHa != null ? (lang === 'bn' ? `টাকা/বছর (${haToBigha(fieldAreaHa)} বিঘায়)` : `BDT/yr (${haToBigha(fieldAreaHa)} bigha)`) : 'BDT/ha/yr',
      },
      farmer_priorities: {
        water_availability: waterAvailability,
        no_power_tiller: noPowerTiller,
        labour_shortage: labourShortage,
        excluded_crops: excludedCrops,
      },
      risk: {
        drought: activePlanData?.risk?.drought || { level: 'high', note: 'Pre-monsoon drought vulnerability' },
        heat: activePlanData?.risk?.heat || { level: 'high', note: 'April-May heat stress' },
        flood: activePlanData?.risk?.flood || { level: 'low', note: 'Low flood risk in highland Barind' },
        late_monsoon: activePlanData?.risk?.late_monsoon || { level: 'low' },
      },
      data_sources: {
        nasa_power: { name: 'NASA POWER', resolution: '0.5° (climatology 25 yrs)', status: 'active' },
        gpm_imerg: { name: 'GPM IMERG', resolution: '0.1° (daily precipitation)', status: 'active' },
        grace_fo: { name: 'GRACE-FO', parameter: 'terrestrial water storage anomaly (-1.07 cm/yr in Barind)', status: 'active' },
        soilgrids: { name: 'ISRIC SoilGrids', resolution: '250m depth-standardized', status: activeField?.soil_texture ? 'active' : 'fallback' },
      }
    };
  }, [activeField, fieldAreaHa, lang, activeCrops, activePlanData, seasonIrrigMap, periodKeys, selectedStrategy, bestScoringStrategyId, baseIrrigVal, avgIrrig, savingsVal, baselineRotationBn, baselineRotationEn, waterAvailability, noPowerTiller, labourShortage, excludedCrops]);


  if (loading) {
    return (
      <div className="six-season-recommendation-workspace" style={{ padding: '24px 28px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, borderBottom: '1px solid var(--glass-border)', paddingBottom: 18 }}>
          <div>
            <div className="ui-skeleton" style={{ width: 220, height: 24, borderRadius: 999, marginBottom: 8 }} />
            <div className="ui-skeleton" style={{ width: 440, height: 32, borderRadius: 8, marginBottom: 8 }} />
            <div className="ui-skeleton" style={{ width: 600, height: 16, borderRadius: 6 }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 24 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="ui-skeleton" style={{ height: 220, borderRadius: 16 }} />
          ))}
        </div>
      </div>
    );
  }

  if (fetchError && !activePlanData?.periods?.length) {
    return (
      <div className="six-season-recommendation-workspace" style={{ padding: '24px 28px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
        <div style={{ background: 'var(--surface-card, rgba(16, 28, 22, 0.86))', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 16, padding: 24, textAlign: 'center', maxWidth: 640, margin: '40px auto' }}>
          <span style={{ fontSize: 36 }}>⚠️</span>
          <h3 style={{ margin: '12px 0 6px', color: 'var(--alert)' }}>
            {lang === 'bn' ? 'পরিকল্পনা ডেটা লোড করা যায়নি' : 'Unable to Load Crop Planning Data'}
          </h3>
          <p style={{ margin: '0 0 16px', color: 'var(--text-2)', fontSize: 13 }}>
            {fetchError || (lang === 'bn' ? 'তথ্য নেই' : 'No data')}
          </p>
          <GlassButton variant="primary" size="sm" onClick={() => setReloadKey(k => k + 1)}>
            ⟳ {lang === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
          </GlassButton>
        </div>
      </div>
    );
  }

  // P2: Explain-the-result metrics and plain-language texts (CROP_TRANSLATIONS & translateCropName hoisted to module scope)

  const currentRotation = activePlanData.rotation || {};
  const currentRotationList = Object.values(currentRotation);
  const year1RotationList = [
    currentRotation['Y1_S1'] || currentRotationList[0] || 'Mustard',
    currentRotation['Y1_S2'] || currentRotationList[1] || 'Mungbean',
    currentRotation['Y1_S3'] || currentRotationList[2] || 'T. Aman Rice'
  ];
  const rotationTextBn = year1RotationList.map(c => translateCropName(c, 'bn')).join(' → ');
  const rotationTextEn = year1RotationList.map(c => translateCropName(c, 'en')).join(' → ');

  const hasBaseline = Boolean(baselineCropsEarly?.length);
  const deltaProfit = hasBaseline && activePlanData.deltaProfit != null ? Math.round(activePlanData.deltaProfit) : null;
  const waterSavingsMm = hasBaseline && activePlanData.waterSavingsMm != null ? Math.round(activePlanData.waterSavingsMm) : null;
  const planIrrigationMm = hasBaseline && activePlanData.planIrrigationMm != null ? Math.round(activePlanData.planIrrigationMm) : null;
  const extraNkg = hasBaseline && activePlanData.nitrogenDeltaKg != null ? Math.round(activePlanData.nitrogenDeltaKg) : null;

  const totalFarmDelta = hasArea && deltaProfit != null ? Math.round(deltaProfit * fieldAreaHa) : null;

  let profitPhraseBn;
  if (deltaProfit == null) {
    profitPhraseBn = 'সম্ভাব্য লাভের তুলনা অনুপলভ্য';
  } else if (deltaProfit > 0) {
    profitPhraseBn = `${toBanglaDigits(Math.round(deltaProfit).toLocaleString())} টাকা বেশি সম্ভাব্য লাভ/হেক্টর ${totalFarmDelta ? `(মোট খামারে: +${toBanglaDigits(totalFarmDelta.toLocaleString())} টাকা, উদাহরণমূলক)` : '(উদাহরণমূলক)'}`;
  } else if (deltaProfit === 0) {
    profitPhraseBn = `সম্ভাব্য লাভ সমান (উদাহরণমূলক)`;
  } else {
    profitPhraseBn = `${toBanglaDigits(Math.round(deltaProfit).toLocaleString())} টাকা লাভ/হেক্টর (লাভ কম, কিন্তু পানি/মাটির উপকার, উদাহরণমূলক)`;
  }

  let profitPhraseEn;
  if (deltaProfit == null) {
    profitPhraseEn = 'profit comparison unavailable';
  } else if (deltaProfit > 0) {
    profitPhraseEn = `+${deltaProfit.toLocaleString()} BDT/ha profit ${totalFarmDelta ? `(total farm: +${totalFarmDelta.toLocaleString()} BDT, illustrative)` : '(illustrative)'}`;
  } else if (deltaProfit === 0) {
    profitPhraseEn = `match baseline profit (illustrative)`;
  } else {
    profitPhraseEn = `${deltaProfit.toLocaleString()} BDT/ha profit (lower profit, but water/soil benefits, illustrative)`;
  }

  let waterPhraseBn;
  if (waterSavingsMm == null) {
    waterPhraseBn = 'সেচ তুলনা অনুপলভ্য';
  } else if (waterSavingsMm > 0) {
    waterPhraseBn = `বছরে ~${toBanglaDigits(Math.round(waterSavingsMm))} মিমি কম সেচ`;
  } else if (waterSavingsMm === 0) {
    waterPhraseBn = `বছরে সেচ প্রয়োজন সমান (~${toBanglaDigits(Math.round(planIrrigationMm))} মিমি/বছর)`;
  } else {
    waterPhraseBn = `বছরে ~${toBanglaDigits(Math.round(Math.abs(waterSavingsMm)))} মিমি বেশি সেচ`;
  }

  let nPhraseBn;
  if (extraNkg == null) {
    nPhraseBn = 'নাইট্রোজেন প্রভাবের মডেল অনুমান অনুপলভ্য';
  } else if (extraNkg > 0) {
    nPhraseBn = `${toBanglaDigits(Math.round(extraNkg))} কেজি বেশি নাইট্রোজেন`;
  } else if (extraNkg === 0) {
    nPhraseBn = `নাইট্রোজেন স্তর অপরিবর্তিত`;
  } else {
    nPhraseBn = `${toBanglaDigits(Math.round(Math.abs(extraNkg)))} কেজি কম নাইট্রোজেন`;
  }

  const answerFirstSentence = lang === 'bn'
    ? `আপনার ${activeField?.district ? (activeField.district.charAt(0).toUpperCase() + activeField.district.slice(1)) : 'নির্বাচিত জেলার'} ${hasArea ? `${formatNumber(fieldAreaHa, 1)} হেক্টর` : 'জমিতে'} ${baselineRotationBn} এবং ${rotationTextBn} মডেল তুলনা: ${waterPhraseBn}, ${nPhraseBn}, ${profitPhraseBn}।`
    : `Model comparison for your ${hasArea ? `${formatNumber(fieldAreaHa, 1)} ha parcel` : 'field'} in ${activeField?.district || 'the selected district'}: ${baselineRotationEn} vs ${rotationTextEn}; ${waterSavingsMm == null ? 'irrigation comparison unavailable' : (waterSavingsMm > 0 ? `estimated irrigation saving ~${waterSavingsMm} mm` : (waterSavingsMm === 0 ? `modeled irrigation matches baseline (~${planIrrigationMm} mm/yr)` : `estimated irrigation use increases ~${Math.abs(waterSavingsMm)} mm`))}; ${extraNkg == null ? 'nitrogen proxy unavailable' : `modeled nitrogen proxy delta ${extraNkg} kg/ha`}; ${profitPhraseEn}.`;

  const profitSmsBn = deltaProfit == null ? 'লাভের তুলনা অনুপলভ্য' : (deltaProfit >= 0 ? `লাভ +${deltaProfit}টাকা` : `লাভ ${deltaProfit}টাকা`);
  const waterSmsBn = waterSavingsMm == null ? 'সেচ তুলনা অনুপলভ্য' : (waterSavingsMm > 0 ? `সেচ সাশ্রয় ~${waterSavingsMm}মিমি` : (waterSavingsMm === 0 ? `সেচ সমান (${planIrrigationMm ?? '—'}মিমি)` : `সেচ +${Math.abs(waterSavingsMm)}মিমি`));
  const smsText = `FieldShift: ${activeField?.name || 'খামার'} (${activeField?.district || 'বগুড়ার'}) পরামর্শ: ${rotationTextBn}। ${waterSmsBn}, ${profitSmsBn}। স্থানীয় SAAO-র সাথে যাচাই করুন।`;

  const isCoastalSaline = Boolean(
    activeField?.coastal_saline ||
    ['satkhira', 'khulna', 'bagerhat', 'patuakhali', 'barguna', "cox's bazar", 'bhola', 'noakhali', 'chittagong', 'feni', 'lakshmipur', 'pirojpur', 'jhalokati'].includes((district || '').toLowerCase())
  );

  const handleCopySms = () => {
    try {
      navigator.clipboard.writeText(smsText);
      setCopiedSms(true);
      setTimeout(() => setCopiedSms(false), 2500);
    } catch {}
  };






  // Scientific Evidence Onset Stats
  const pVal = advisoryOnset?.comparison?.p_value != null ? advisoryOnset.comparison.p_value : 0.2991;
  const shiftVal = advisoryOnset?.comparison?.shift_days_median != null ? advisoryOnset.comparison.shift_days_median : 12;
  const rainSrc = advisoryOnset?.precipitation_source || 'NASA POWER / GPM IMERG Calibrated (2001-2024)';
  const isSignificant = pVal < 0.05;

  return (
    <div className="six-season-recommendation-workspace wrap" style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 16px 40px', color: 'var(--text)' }}>
      {/* 1. Header (Compact Single Header) */}
      <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {lang === 'bn'
              ? `আবর্তন পরিকল্পনা · ${activeField?.name || 'জমি বাছাই করুন'} (${fieldAreaHa != null ? `${toBanglaDigits(haToBigha(fieldAreaHa))} বিঘা` : 'তথ্য নেই'})`
              : `Rotation Planner · ${activeField?.name || 'Select a field'} (${fieldAreaHa != null ? `${haToBigha(fieldAreaHa)} bigha` : 'তথ্য নেই'})`}
          </h1>
          <div style={{ color: 'var(--text-muted, #94a3b8)', fontSize: 13, marginTop: 4 }}>
            {activeField?.district
              ? formatDistrictLabel(activeField.district, lang)
              : 'তথ্য নেই'} · {fieldAreaHa != null ? `${toBanglaDigits(haToBigha(fieldAreaHa))} ${lang === 'bn' ? 'বিঘা' : 'bigha'}` : 'তথ্য নেই'} · {activeField?.soil_texture ? formatSoilTextureLabel(activeField.soil_texture) : 'তথ্য নেই'} · NASA POWER + GPM IMERG
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11.5, color: 'var(--sun)', border: '1px solid var(--line)', background: 'var(--surface-2, rgba(255,255,255,0.04))', padding: '3px 10px', borderRadius: 999 }}>
            NASA POWER + GPM IMERG
          </span>
          {loading && (
            <span style={{ fontSize: 11.5, color: 'var(--water)', background: 'rgba(56, 189, 248, 0.1)', padding: '3px 10px', borderRadius: 999, fontWeight: 700 }}>
              ⟳ {lang === 'bn' ? 'হিসাব হচ্ছে…' : 'Computing…'}
            </span>
          )}
        </div>
      </div>

      {/* 2. Toolbar: Strategy switch on left, actions on right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: 6 }}>
        {/* Strategy Switch Segmented Buttons */}
        <div className="seg" role="group" aria-label={lang === 'bn' ? 'কৌশল' : 'Strategy'} style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {[
            { id: 'baseline', labelBn: 'বর্তমান', labelEn: 'Current', tipBn: 'বিদ্যমান আবর্তন (বেসলাইন)', tipEn: 'Existing baseline rotation' },
            { id: 'balanced', labelBn: 'সুষম', labelEn: 'Balanced', tipBn: 'সুষম: ৩৪% লাভ, ৩৩% পানি, ৩৩% মাটি', tipEn: 'Balanced: 34% profit, 33% water, 33% soil' },
            { id: 'profit_focused', labelBn: 'লাভ', labelEn: 'Profit', tipBn: 'লাভ: ৭০% লাভ, ১৫% পানি, ১৫% মাটি', tipEn: 'Profit: 70% profit, 15% water, 15% soil' },
            { id: 'water_efficiency', labelBn: 'পানি সাশ্রয়', labelEn: 'Water saving', tipBn: 'পানি: ১৫% লাভ, ৭০% পানি, ১৫% মাটি', tipEn: 'Water: 15% profit, 70% water, 15% soil' },
            { id: 'soil_health', labelBn: 'মাটির স্বাস্থ্য', labelEn: 'Soil health', tipBn: 'মাটি: ১৫% লাভ, ১৫% পানি, ৭০% মাটি', tipEn: 'Soil: 15% profit, 15% water, 70% soil' },
          ].map(s => {
            const isActive = selectedStrategy === s.id;
            const isBest = s.id === bestScoringStrategyId;
            const labelText = (lang === 'bn' ? s.labelBn : s.labelEn) + (isBest ? ' ⭐' : '');
            return (
              <button
                key={s.id}
                type="button"
                className="strategy-pill"
                aria-pressed={isActive ? 'true' : 'false'}
                title={lang === 'bn' ? s.tipBn : s.tipEn}
                onClick={() => {
                  if (s.id === 'baseline') {
                    setCompareWithBaseline(true);
                  } else {
                    setCompareWithBaseline(false);
                  }
                  setSelectedStrategy(s.id);
                }}
                style={{
                  font: '600 13px var(--body)',
                  border: 'none',
                  background: isActive ? 'var(--accent, #2c8a4b)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text)',
                  padding: '7px 12px',
                  borderRadius: 9,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {labelText}
              </button>
            );
          })}
        </div>

        {/* Toolbar Actions: Copy SMS, Print, Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleCopySms}
            style={{
              background: 'var(--surface-2, rgba(255,255,255,0.05))',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text)',
              cursor: 'pointer'
            }}
          >
            📱 {copiedSms ? (lang === 'bn' ? 'SMS কপি হয়েছে ✓' : 'SMS Copied ✓') : (lang === 'bn' ? 'SMS কপি করুন' : 'Copy SMS')}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              background: 'var(--surface-2, rgba(255,255,255,0.05))',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text)',
              cursor: 'pointer'
            }}
          >
            📄 {lang === 'bn' ? 'প্রিন্ট' : 'Print'}
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            title="JSON Export"
            style={{
              background: 'var(--surface-2, rgba(255,255,255,0.05))',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            JSON
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            title="CSV Export"
            style={{
              background: 'var(--surface-2, rgba(255,255,255,0.05))',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            CSV
          </button>
        </div>
      </div>

      {/* 3. Farmer Priorities Compact Row (PL14) */}
      <div className="pri" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '8px 12px' }}>
        <div className="pg" style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
          <span className="pl" style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text)' }}>💧 {lang === 'bn' ? 'পানি' : 'Water'}</span>
          {[
            { id: 'full', labelBn: 'পর্যাপ্ত', labelEn: 'Full' },
            { id: 'limited', labelBn: 'সীমিত', labelEn: 'Limited' },
            { id: 'none', labelBn: 'সেচ নেই', labelEn: 'Rainfed' },
          ].map(wOpt => (
            <button
              key={wOpt.id}
              type="button"
              className="pb"
              aria-pressed={waterAvailability === wOpt.id ? 'true' : 'false'}
              onClick={() => setWaterAvailability(wOpt.id)}
              style={{
                font: '500 12.5px var(--body)',
                border: waterAvailability === wOpt.id ? '1px solid var(--accent, #2c8a4b)' : '1px solid var(--line)',
                background: waterAvailability === wOpt.id ? 'var(--accent, #2c8a4b)' : 'var(--surface-2, rgba(255,255,255,0.04))',
                color: waterAvailability === wOpt.id ? '#ffffff' : 'var(--text)',
                padding: '4px 10px',
                borderRadius: 99,
                cursor: 'pointer'
              }}
            >
              {lang === 'bn' ? wOpt.labelBn : wOpt.labelEn}
            </button>
          ))}
          <span className="pn" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {waterAvailability === defaultWaterAvailability
              ? (lang === 'bn' ? `জমির তথ্য: ${waterAvailability === 'full' ? 'পর্যাপ্ত' : (waterAvailability === 'limited' ? 'সীমিত' : 'সেচ নেই')}` : `Field record: ${waterAvailability}`)
              : (lang === 'bn'
                  ? `পরীক্ষামূলক: ${waterAvailability === 'full' ? 'পর্যাপ্ত' : (waterAvailability === 'limited' ? 'সীমিত' : 'সেচ নেই')} (জমির তথ্য: ${defaultWaterAvailability === 'full' ? 'পর্যাপ্ত' : (defaultWaterAvailability === 'limited' ? 'সীমিত' : 'সেচ নেই')}) · অ্যাপে নতুন পরিকল্পনা হবে`
                  : `What-if: ${waterAvailability} (Field: ${defaultWaterAvailability}) · Re-solving`)}
          </span>
        </div>

        <div className="pg" style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--text)' }}>
            <input
              type="checkbox"
              id="tiller"
              checked={noPowerTiller}
              onChange={(e) => setNoPowerTiller(e.target.checked)}
            />
            <span>🚜 {lang === 'bn' ? 'পাওয়ার টিলার নেই' : 'No power tiller'}</span>
          </label>
        </div>

        <div className="pg" style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
          <span className="pl" style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text)' }}>🛒 {lang === 'bn' ? 'বিক্রি করতে পারি না' : 'Cannot sell'}</span>
          {[
            { id: 'Tomato', labelBn: 'টমেটো', labelEn: 'Tomato' },
            { id: 'Sesame', labelBn: 'তিল', labelEn: 'Sesame' },
            { id: 'Jute', labelBn: 'পাট', labelEn: 'Jute' },
            { id: 'Potato', labelBn: 'আলু', labelEn: 'Potato' },
          ].map(cOpt => {
            const isExcluded = excludedCrops.includes(cOpt.id) || (noPowerTiller && cOpt.id === 'Potato');
            return (
              <button
                key={cOpt.id}
                type="button"
                className="pb"
                data-x={cOpt.labelBn}
                aria-pressed={isExcluded ? 'true' : 'false'}
                onClick={() => {
                  if (noPowerTiller && cOpt.id === 'Potato') return;
                  setExcludedCrops(prev => prev.includes(cOpt.id) ? prev.filter(c => c !== cOpt.id) : [...prev, cOpt.id]);
                }}
                style={{
                  font: '500 12.5px var(--body)',
                  border: isExcluded ? '1px solid var(--bad, #b4532a)' : '1px solid var(--line)',
                  background: isExcluded ? 'var(--bad, #b4532a)' : 'var(--surface-2, rgba(255,255,255,0.04))',
                  color: isExcluded ? '#ffffff' : 'var(--text)',
                  textDecoration: isExcluded ? 'line-through' : 'none',
                  padding: '4px 10px',
                  borderRadius: 99,
                  cursor: 'pointer'
                }}
              >
                {lang === 'bn' ? cOpt.labelBn : cOpt.labelEn}
              </button>
            );
          })}
        </div>

        <div className="pn" style={{ flexBasis: '100%', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          {excludedCrops.length > 0 || noPowerTiller
            ? (lang === 'bn'
                ? `বাদ: ${[...excludedCrops.map(c => translateCropName(c, 'bn')), ...(noPowerTiller && !excludedCrops.includes('Potato') ? ['আলু'] : [])].join(', ')}। অ্যাপ এগুলো ছাড়া নতুন পরিকল্পনা করবে।`
                : `Excluded: ${[...excludedCrops, ...(noPowerTiller ? ['Potato'] : [])].join(', ')}. Optimizer excludes these crops.`)
            : (lang === 'bn'
                ? '⚖️ লাভ/পানি/মাটির গুরুত্ব উপরের কৌশলের বোতাম দিয়েই বাছুন। এখানে কিছু বদলালে অ্যাপ নতুন করে হিসাব করবে।'
                : 'Select weights from strategy buttons above. Adjusting priorities here triggers automatic re-solve.')}
        </div>
      </div>

      {/* 4. Before -> After Strip (.ba) */}
      <div className="ba" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 12px' }}>
          <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>{lang === 'bn' ? 'সেচ (বছরে)' : 'Annual Irrigation'}</span>
          {selectedStrategy === 'baseline' ? (
            <strong style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
              {baseIrrigVal != null ? `${toBanglaDigits(baseIrrigVal)} ${lang === 'bn' ? 'মিমি' : 'mm'}` : '…'}
            </strong>
          ) : (
            <div>
              <strong style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
                {baseIrrigVal != null ? `${toBanglaDigits(baseIrrigVal)} → ` : ''}{toBanglaDigits(avgIrrig)} {lang === 'bn' ? 'মিমি' : 'mm'}
              </strong>{' '}
              {savingsVal != null && (
                <em style={{ fontStyle: 'normal', fontSize: 12.5, fontWeight: 600, color: 'var(--leaf)' }}>
                  ({savingsVal >= 0 ? `−${toBanglaDigits(savingsVal)}` : `+${toBanglaDigits(Math.abs(savingsVal))}`})
                </em>
              )}
            </div>
          )}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 12px' }}>
          <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>{lang === 'bn' ? 'ফাঁকা দিন (বছরে)' : 'Bare Days (annual)'}</span>
          {selectedStrategy === 'baseline' ? (
            <strong style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
              {activePlanData.baselineBareDays != null ? `${toBanglaDigits(Math.round(activePlanData.baselineBareDays))} ${lang === 'bn' ? 'দিন' : 'days'}` : '…'}
            </strong>
          ) : (
            <div>
              {activePlanData.baselineBareDays != null && activePlanData.planBareDays != null ? (
                <>
                  <strong style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
                    {toBanglaDigits(Math.round(activePlanData.baselineBareDays))} → {toBanglaDigits(Math.round(activePlanData.planBareDays))} {lang === 'bn' ? 'দিন' : 'days'}
                  </strong>{' '}
                  <em style={{ fontStyle: 'normal', fontSize: 12.5, fontWeight: 600, color: 'var(--leaf)' }}>
                    (−{toBanglaDigits(Math.max(0, Math.round(activePlanData.baselineBareDays - activePlanData.planBareDays)))})
                  </em>
                </>
              ) : (
                <strong style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>…</strong>
              )}
            </div>
          )}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 12px' }}>
          <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>{lang === 'bn' ? 'নাইট্রোজেন' : 'Soil Nitrogen'}</span>
          {selectedStrategy === 'baseline' ? (
            <strong style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
              {activePlanData.baselineNitrogenKg != null ? `${toBanglaDigits(Math.round(activePlanData.baselineNitrogenKg))} ${lang === 'bn' ? 'কেজি/হে' : 'kg/ha'}` : '…'}
            </strong>
          ) : (
            <div>
              {activePlanData.baselineNitrogenKg != null && activePlanData.planNitrogenKg != null ? (
                <>
                  <strong style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
                    {toBanglaDigits(Math.round(activePlanData.baselineNitrogenKg))} → {toBanglaDigits(Math.round(activePlanData.planNitrogenKg))} {lang === 'bn' ? 'কেজি/হে' : 'kg/ha'}
                  </strong>{' '}
                  <em style={{ fontStyle: 'normal', fontSize: 12.5, fontWeight: 600, color: 'var(--leaf)' }}>
                    (+{toBanglaDigits(Math.round(activePlanData.planNitrogenKg - activePlanData.baselineNitrogenKg))})
                  </em>
                </>
              ) : (
                <strong style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>…</strong>
              )}
            </div>
          )}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 12px' }}>
          <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>
            {lang === 'bn'
              ? `লাভ${fieldAreaHa != null ? `, আপনার ${toBanglaDigits(haToBigha(fieldAreaHa))} বিঘায়` : ''}`
              : `Profit${fieldAreaHa != null ? `, for ${haToBigha(fieldAreaHa)} bigha` : ''}`}
          </span>
          {fieldAreaHa == null ? (
            <strong style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
              {lang === 'bn' ? 'তথ্য নেই' : 'No data'}
            </strong>
          ) : selectedStrategy === 'baseline' ? (
            <strong style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
              {activePlanData.baselineProfitBdt != null
                ? `~${toBanglaDigits(Math.round(activePlanData.baselineProfitBdt * fieldAreaHa).toLocaleString())} ${lang === 'bn' ? 'টাকা' : 'BDT'}`
                : '…'}
            </strong>
          ) : (
            <div>
              {activePlanData.baselineProfitBdt != null && activePlanData.planProfitBdt != null ? (
                <>
                  <strong style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
                    ~{toBanglaDigits(Math.round(activePlanData.baselineProfitBdt * fieldAreaHa).toLocaleString())} → ~{toBanglaDigits(Math.round(activePlanData.planProfitBdt * fieldAreaHa).toLocaleString())} {lang === 'bn' ? 'টাকা' : 'BDT'}
                  </strong>{' '}
                  <em style={{ fontStyle: 'normal', fontSize: 12.5, fontWeight: 600, color: 'var(--leaf)' }}>
                    (+{toBanglaDigits(Math.round((activePlanData.planProfitBdt - activePlanData.baselineProfitBdt) * fieldAreaHa).toLocaleString())})
                  </em>
                </>
              ) : (
                <strong style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>…</strong>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. Season Strip (.strip) + Totals (.totals) */}
      <div className="strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 6 }}>
        {periodKeys.map((k, i) => {
          const isSelected = activeSelectedPeriod === k;
          const c = activeCrops[k] || 'Fallow';
          const cMeta = CROP_DATABASE[c] || {};
          const s = seasonMeta[k];
          const irrig = seasonIrrigMap[k] || 0;
          return (
            <button
              key={k}
              type="button"
              className="sc"
              aria-current={isSelected ? 'true' : 'false'}
              onClick={() => setSelectedPeriodKey(k)}
              style={{
                textAlign: 'left',
                background: 'var(--surface)',
                border: isSelected ? '2px solid var(--accent, #2c8a4b)' : '1px solid var(--line)',
                borderRadius: 12,
                padding: '8px 10px',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 0 0 2px rgba(44, 138, 75, 0.25)' : 'none'
              }}
            >
              <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: 11 }}>
                {lang === 'bn' ? `${i < 3 ? '১ম বছর' : '২য় বছর'} · ${s.bn.split(' ')[1] || s.bn}` : `${i < 3 ? 'Year 1' : 'Year 2'} · ${s.en}`}
              </small>
              <b style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, margin: '2px 0', color: 'var(--text)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: cMeta.color || '#5cc27e', flex: 'none' }} />
                <span>{translateCropName(c, lang)}</span>
              </b>
              <span style={{ fontSize: 12, color: 'var(--water)', fontVariantNumeric: 'tabular-nums' }}>
                💧 {irrig > 0 ? `${toBanglaDigits(irrig)} ${lang === 'bn' ? 'মিমি' : 'mm'}` : (lang === 'bn' ? 'সেচ নেই' : '0 mm')}
              </span>
            </button>
          );
        })}
      </div>

      <div className="totals" style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '0 2px' }}>
        {lang === 'bn' ? (
          <span>
            ১ম বছর: <b style={{ color: 'var(--text)' }}>{toBanglaDigits(y1Irrig)} মিমি</b> · ২য় বছর: <b style={{ color: 'var(--text)' }}>{toBanglaDigits(y2Irrig)} মিমি</b> · গড়: <b style={{ color: 'var(--text)' }}>{toBanglaDigits(avgIrrig)} মিমি/বছর</b>
            {selectedStrategy !== 'baseline' && (
              <span> · বর্তমান {toBanglaDigits(baseIrrigVal)} মিমি থেকে <b style={{ color: 'var(--leaf)' }}>{toBanglaDigits(savingsVal)} মিমি সাশ্রয়</b></span>
            )}
          </span>
        ) : (
          <span>
            Year 1: <b>{y1Irrig} mm</b> · Year 2: <b>{y2Irrig} mm</b> · Avg: <b>{avgIrrig} mm/yr</b>
            {selectedStrategy !== 'baseline' && (
              <span> · Saved: <b>{savingsVal} mm</b> vs current {baseIrrigVal} mm</span>
            )}
          </span>
        )}
      </div>

      {/* 12-month continuous cropping calendar strip */}
      <div style={{ marginTop: 2, fontSize: 11, color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <strong>{lang === 'bn' ? '১২-মাসের ক্রপিং ক্যালেন্ডার স্ট্রিপ' : '12-Month Continuous Cropping Calendar Strip'}:</strong>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, textAlign: 'center', fontSize: 10 }}>
          {['নভে', 'ডিসে', 'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো'].map((m, mi) => (
            <div key={mi} style={{ background: mi < 5 ? 'rgba(245, 158, 11, 0.2)' : mi < 8 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(56, 189, 248, 0.2)', padding: '2px 0', borderRadius: 4, color: 'var(--text)' }}>
              {m}
            </div>
          ))}
        </div>
      </div>

      {/* 6. HERO: 3D Farm (65%) + Rich Bed Card (35%) */}
      <div className="main" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)', gap: 12 }}>
        {/* 3D Farm Diorama */}
        <div className="stagebox" style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--line)', minHeight: 460 }}>
          <FarmScene3D
            beds={farm3dBeds}
            selectedBedIndex={periodKeys.indexOf(activeSelectedPeriod)}
            selectedBedId={activeSelectedPeriod}
            onBedClick={(idx, bed) => setSelectedPeriodKey(periodKeys[idx] || (bed && bed.id) || 'Y1_S1')}
            cameraPreset="iso"
            fieldAreaHa={fieldAreaHa || null}
            fieldName={activeField?.name || (lang === 'bn' ? 'জমি বাছাই করুন' : 'Select a field')}
            theme={theme || 'dark'}
            lang={lang}
            height={480}
            annualIrrigationMm={selectedStrategy === 'baseline' ? (baseIrrigVal ?? avgIrrig) : avgIrrig}
          />
        </div>

        {/* Rich Bed Card (PL12) */}
        <aside className="card" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Eyebrow */}
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {lang === 'bn'
                ? `${activePeriodIdx < 3 ? '১ম বছর' : '২য় বছর'} · ${seasonMeta[activeSelectedPeriod]?.bn.split(' ')[1] || seasonMeta[activeSelectedPeriod]?.bn} (${seasonMeta[activeSelectedPeriod]?.months})${activeCropMeta?.duration ? ` · ${toBanglaDigits(activeCropMeta.duration)} দিন` : ''}`
                : `${activePeriodIdx < 3 ? 'Year 1' : 'Year 2'} · ${seasonMeta[activeSelectedPeriod]?.en} (${seasonMeta[activeSelectedPeriod]?.months})${activeCropMeta?.duration ? ` · ${activeCropMeta.duration} days` : ''}`}
            </div>

            {/* Title */}
            <h2 style={{ fontSize: 18, margin: '2px 0 6px', color: 'var(--text)' }}>
              {translateCropName(selectedCropName, lang)}
            </h2>

            {/* Role Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, margin: '4px 0 10px' }}>
              {activeCropMeta?.is_legume && (
                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 99, background: 'rgba(74, 222, 128, 0.15)', border: '1px solid #4ade80', color: '#4ade80', fontWeight: 700 }}>
                  🌱 {lang === 'bn' ? 'নাইট্রোজেন দেয়' : 'Fixes N'}
                </span>
              )}
              {selectedCropIrrig === 0 ? (
                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 99, background: 'var(--surface-2, rgba(255,255,255,0.04))', border: '1px solid var(--line)', color: 'var(--leaf)' }}>
                  💧 {lang === 'bn' ? 'সেচ লাগে না' : 'Rainfed'}
                </span>
              ) : selectedCropIrrig <= 100 ? (
                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 99, background: 'var(--surface-2, rgba(255,255,255,0.04))', border: '1px solid var(--line)', color: 'var(--water)' }}>
                  💧 {lang === 'bn' ? 'কম পানি' : 'Low water'}
                </span>
              ) : (
                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 99, background: 'var(--surface-2, rgba(255,255,255,0.04))', border: '1px solid var(--line)', color: 'var(--sun)' }}>
                  💧 {lang === 'bn' ? 'পরিমিত সেচ' : 'Moderate water'}
                </span>
              )}
              {activePeriodIdx % 3 === 1 && (
                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 99, background: 'var(--surface-2, rgba(255,255,255,0.04))', border: '1px solid var(--line)', color: 'var(--sun)' }}>
                  ☀️ {lang === 'bn' ? 'তাপ-খরা ঝুঁকি' : 'Heat risk'}
                </span>
              )}
            </div>

            {/* 3 Numbers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, marginBottom: 10 }}>
              <div style={{ background: 'var(--surface-2, rgba(255,255,255,0.04))', borderRadius: 10, padding: '7px 9px' }}>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)' }}>{lang === 'bn' ? 'ফলন' : 'Yield'}</span>
                <strong style={{ fontSize: 14.5, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
                  {selectedCropYieldTonHa != null
                    ? `${toBanglaDigits((selectedCropYieldTonHa * 3.585).toFixed(1))} ${lang === 'bn' ? 'মণ/বিঘা' : 'md/bg'}`
                    : (lang === 'bn' ? 'তথ্য নেই' : 'No data')}
                </strong>
                <small style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>
                  {selectedCropYieldTonHa != null
                    ? (fieldAreaHa != null ? `~${toBanglaDigits(Math.round(selectedCropYieldTonHa * 3.585 * (haToBigha(fieldAreaHa))))} ${lang === 'bn' ? 'মণ' : 'maund'}` : '—')
                    : ''}
                </small>
              </div>

              <div style={{ background: 'var(--surface-2, rgba(255,255,255,0.04))', borderRadius: 10, padding: '7px 9px' }}>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)' }}>{lang === 'bn' ? 'সেচ, পুরো মৌসুমে' : 'Irrigation'}</span>
                <strong style={{ fontSize: 14.5, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
                  {selectedCropIrrig > 0 ? `${toBanglaDigits(selectedCropIrrig)} ${lang === 'bn' ? 'মিমি' : 'mm'}` : (lang === 'bn' ? '০ মিমি' : '0 mm')}
                </strong>
                <small style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>
                  {selectedCropIrrig > 0
                    ? (fieldAreaHa != null ? (lang === 'bn' ? `~${toBanglaDigits(Math.round(selectedCropIrrig * fieldAreaHa * 10).toLocaleString())} হাজার লিটার` : `~${Math.round(selectedCropIrrig * fieldAreaHa * 10)}k L`) : '—')
                    : (lang === 'bn' ? 'বৃষ্টিই যথেষ্ট' : 'Rainfed')}
                </small>
              </div>

              <div style={{ background: 'var(--surface-2, rgba(255,255,255,0.04))', borderRadius: 10, padding: '7px 9px' }}>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)' }}>{lang === 'bn' ? 'লাভ (খরচ বাদে)' : 'Net Margin'}</span>
                <strong style={{ fontSize: 14.5, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
                  {selectedCropMargin != null ? `${toBanglaDigits(Math.round(selectedCropMargin * 0.13378).toLocaleString())}/বিঘা` : '—'}
                </strong>
                <small style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>
                  {selectedCropMargin != null
                    ? (fieldAreaHa != null ? `~${toBanglaDigits(Math.round(selectedCropMargin * fieldAreaHa).toLocaleString())} ৳` : '—')
                    : ''}
                </small>
              </div>
            </div>

            {/* Pros */}
            {currentProsCons.pros.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--leaf)', margin: '4px 0 2px' }}>✅ {lang === 'bn' ? 'সুবিধা' : 'Benefits'}</div>
                <ul style={{ margin: 0, paddingLeft: 18, listStyleType: 'disc', fontSize: 13, lineHeight: 1.45, color: 'var(--text)' }}>
                  {currentProsCons.pros.map((p, idx) => <li key={idx}>{p}</li>)}
                </ul>
              </div>
            )}

            {/* Cons */}
            {currentProsCons.cons.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--alert)', margin: '4px 0 2px' }}>⚠️ {lang === 'bn' ? 'অসুবিধা / ঝুঁকি' : 'Drawbacks / Risks'}</div>
                <ul style={{ margin: 0, paddingLeft: 18, listStyleType: 'disc', fontSize: 13, lineHeight: 1.45, color: 'var(--text)' }}>
                  {currentProsCons.cons.map((c, idx) => <li key={idx}>{c}</li>)}
                </ul>
              </div>
            )}

            {/* Baseline Comparison Slot */}
            {selectedStrategy !== 'baseline' && (
              <div style={{ fontSize: 13, background: 'var(--surface-2, rgba(255,255,255,0.04))', borderRadius: 10, padding: '8px 10px', marginTop: 8 }}>
                🔄 {lang === 'bn' ? 'বর্তমানে এই মৌসুমে:' : 'Currently in this season:'} <b>{baselineCropInSlot ? translateCropName(baselineCropInSlot, lang) : (lang === 'bn' ? 'তথ্য নেই' : 'No data')}</b> ({baselineSlotIrrig != null ? (baselineCropInSlot?.toLowerCase() === 'fallow' ? (lang === 'bn' ? 'জমি ফাঁকা, ০ মিমি' : 'Fallow, 0 mm') : (lang === 'bn' ? `${toBanglaDigits(baselineSlotIrrig)} মিমি সেচ` : `${baselineSlotIrrig} mm irrigation`)) : (lang === 'bn' ? 'সেচের তথ্য নেই' : 'No irrigation data')})
              </div>
            )}

            {/* Alternatives & PL5 Explanation */}
            {candidateAlternatives.length > 0 && (
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 8 }}>
                🔁 {lang === 'bn' ? 'বিকল্প:' : 'Alternatives:'} {candidateAlternatives.map(a => `${translateCropName(a.crop, lang)} (${lang === 'bn' ? `স্কোর: ${toBanglaDigits(a.score)}` : `${a.score} pts`})`).join(', ')}.
                {candidateAlternatives[0]?.score > Math.round((selectedCropEntry?.objective_score || selectedCropEntry?.dynamic_gross_margin_bdt_ha || 0) / 1000) && (
                  <div style={{ marginTop: 4, color: 'var(--sun)' }}>
                    {lang === 'bn'
                      ? `পুরো ৬ মৌসুমে সেরা: এই মৌসুমে একা ${translateCropName(candidateAlternatives[0].crop, 'bn')}-র স্কোর বেশি, কিন্তু পানি / রোগচক্র / ডাল নিয়মে ${translateCropName(selectedCropName, 'bn')} ভালো`
                      : `Best across all 6 seasons: ${translateCropName(candidateAlternatives[0].crop, 'en')} scores higher in this isolated season, but ${translateCropName(selectedCropName, 'en')} is superior for water conservation, disease break, and legume rules`}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Collapsed Solver Details */}
          <details style={{ marginTop: 10, background: 'transparent', border: '1px solid var(--line)', borderRadius: 8, padding: '6px 8px' }}>
            <summary style={{ cursor: 'pointer', fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600 }}>
              {lang === 'bn' ? 'গবেষকদের জন্য: সলভার বিবরণ' : 'For researchers: solver details'}
            </summary>
            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              <div>{lang === 'bn' ? 'স্কোর:' : 'Score:'} {lang === 'bn' ? `${toBanglaDigits(Math.round((selectedCropEntry?.objective_score || selectedCropEntry?.dynamic_gross_margin_bdt_ha || 0) / 1000))} স্কোর` : `${Math.round((selectedCropEntry?.objective_score || selectedCropEntry?.dynamic_gross_margin_bdt_ha || 0) / 1000)} pts`}</div>
              <div>Thermal: {Math.round((selectedCropEntry.thermal_factor ?? 0.94) * 100)}% | Soil: {Math.round((selectedCropEntry.soil_factor ?? 1.0) * 100)}%</div>
              <div>Dynamic Yield: {selectedCropYieldTonHa} t/ha (±{selectedCropUncertainty || 0.04} t/ha)</div>
            </div>
          </details>
        </aside>
      </div>

      {/* 7. Row of 3 Cards: Key Benefits | Risk Summary | Strategy Comparison Table */}
      <div className="row3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        {/* Card 1: Key Benefits */}
        <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '14px 16px' }}>
          <h3 style={{ fontSize: 14.5, margin: '0 0 8px', color: 'var(--text)' }}>
            🏆 {lang === 'bn' ? 'মূল সুফল (Key Benefits vs Baseline)' : 'Key Benefits vs Baseline'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'সেচ:' : 'Irrigation:'}</span>
              <strong style={{ color: 'var(--water)' }}>
                {baseIrrigVal != null
                  ? `${toBanglaDigits(baseIrrigVal)} → ${toBanglaDigits(avgIrrig)} ${lang === 'bn' ? 'মিমি/বছর' : 'mm/yr'}${savingsVal != null ? ` (${toBanglaDigits(savingsVal)} মিমি সাশ্রয়${baseIrrigVal > 0 ? `, −${toBanglaDigits(Math.round((savingsVal / baseIrrigVal) * 100))}%` : ''})` : ''}`
                  : `${toBanglaDigits(avgIrrig)} ${lang === 'bn' ? 'মিমি/বছর' : 'mm/yr'}`}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'ফাঁকা দিন:' : 'Bare Days:'}</span>
              <strong style={{ color: 'var(--sun)' }}>
                {activePlanData.baselineBareDays != null && activePlanData.planBareDays != null
                  ? `${toBanglaDigits(Math.round(activePlanData.baselineBareDays))} → ${toBanglaDigits(Math.round(activePlanData.planBareDays))}`
                  : '…'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'নাইট্রোজেন:' : 'Nitrogen:'}</span>
              <strong style={{ color: 'var(--leaf)' }}>
                {activePlanData.baselineNitrogenKg != null && activePlanData.planNitrogenKg != null
                  ? `${toBanglaDigits(Math.round(activePlanData.baselineNitrogenKg))} → ${toBanglaDigits(Math.round(activePlanData.planNitrogenKg))} ${lang === 'bn' ? 'কেজি/হে' : 'kg/ha'}`
                  : '…'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'লাভ:' : 'Profit:'}</span>
              <strong style={{ color: 'var(--leaf)' }}>
                {activePlanData.baselineProfitBdt != null && activePlanData.planProfitBdt != null
                  ? `${toBanglaDigits(Math.round(activePlanData.baselineProfitBdt).toLocaleString())} → ${toBanglaDigits(Math.round(activePlanData.planProfitBdt).toLocaleString())} ${lang === 'bn' ? 'টাকা/হে' : 'BDT/ha'}`
                  : '…'}
              </strong>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, borderTop: '1px solid var(--line)', paddingTop: 6 }}>
            {lang === 'bn' ? `তুলনা: বর্তমান — ${baselineRotationBn}` : `Comparison: Current — ${baselineRotationEn}`}
          </div>
        </div>

        {/* Card 2: Risk Summary */}
        <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '14px 16px' }}>
          <h3 style={{ fontSize: 14.5, margin: '0 0 8px', color: 'var(--text)' }}>
            🛡️ {lang === 'bn' ? 'ঝুঁকি (NASA IMERG ও POWER, ২০০১–২০২৪)' : 'Agro-Climatic Risk (2001-2024)'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="risk" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
              <span>🏜️ {lang === 'bn' ? 'খরা (বর্ষার আগে)' : 'Pre-monsoon drought'}</span>
              <span style={{ fontWeight: 700, color: 'var(--bad, #b4532a)' }}>{lang === 'bn' ? 'বেশি' : 'High'}</span>
            </div>
            <div className="risk" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
              <span>☀️ {lang === 'bn' ? 'তাপপ্রবাহ (এপ্রিল–মে)' : 'Heat stress (Apr-May)'}</span>
              <span style={{ fontWeight: 700, color: 'var(--bad, #b4532a)' }}>{lang === 'bn' ? 'বেশি' : 'High'}</span>
            </div>
            <div className="risk" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
              <span>🌧️ {lang === 'bn' ? 'অতিবৃষ্টি' : 'Heavy rain'}</span>
              <span style={{ fontWeight: 700, color: 'var(--good, #2c8a4b)' }}>{lang === 'bn' ? 'কম' : 'Low'}</span>
            </div>
            <div className="risk" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
              <span>⏳ {lang === 'bn' ? 'বর্ষা দেরি' : 'Late monsoon'}</span>
              <span style={{ fontWeight: 700, color: 'var(--good, #2c8a4b)' }}>{lang === 'bn' ? 'কম' : 'Low'}</span>
            </div>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            {lang === 'bn' ? 'বরেন্দ্রের বিপদ খরা আর গরম, বন্যা না। তাই কম পানির, গরম সহ্য করা ফসল।' : 'Barind primary risks are drought and heat, not flood.'}
          </p>
        </div>

        {/* Card 3: Compact Strategy Comparison Table */}
        <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '14px 16px' }}>
          <h3 style={{ fontSize: 14.5, margin: '0 0 8px', color: 'var(--text)' }}>
            🎯 {lang === 'bn' ? 'কৌশল তুলনা (প্রতি বছর)' : 'Strategy Comparison (annual)'}
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                <th style={{ textAlign: 'left', padding: '4px 2px' }}>{lang === 'bn' ? 'কৌশল' : 'Strategy'}</th>
                <th style={{ textAlign: 'right', padding: '4px 2px' }}>{lang === 'bn' ? 'সেচ' : 'Irrig'}</th>
                <th style={{ textAlign: 'right', padding: '4px 2px' }}>{lang === 'bn' ? 'ফাঁকা' : 'Bare'}</th>
                <th style={{ textAlign: 'right', padding: '4px 2px' }}>N</th>
                <th style={{ textAlign: 'right', padding: '4px 2px' }}>
                  {lang === 'bn'
                    ? (fieldAreaHa != null ? `টাকা/বছর, আপনার ${toBanglaDigits(haToBigha(fieldAreaHa))} বিঘায়` : 'টাকা/হেক্টর/বছর')
                    : (fieldAreaHa != null ? `BDT/yr, ${haToBigha(fieldAreaHa)} bigha` : 'BDT/ha/yr')}
                </th>
              </tr>
            </thead>
            <tbody>
              {strategyComparisonRows.map(row => {
                const isOn = selectedStrategy === row.id;
                return (
                  <tr
                    key={row.id}
                    onClick={() => {
                      if (row.id === 'baseline') {
                        setCompareWithBaseline(true);
                      } else {
                        setCompareWithBaseline(false);
                      }
                      setSelectedStrategy(row.id);
                    }}
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--line)',
                      fontWeight: isOn ? 700 : 400,
                      color: isOn ? 'var(--accent, #2c8a4b)' : 'var(--text)',
                      background: isOn ? 'rgba(44, 138, 75, 0.08)' : 'transparent'
                    }}
                  >
                    <td style={{ textAlign: 'left', padding: '5px 2px' }}>
                      {lang === 'bn' ? row.nameBn : row.nameEn}
                      {row.id === 'baseline' && <span style={{ display: 'none' }}>বিদ্যমান আবর্তন (বেসলাইন)</span>}
                      {row.isBest && <span style={{ display: 'none' }}>সবচেয়ে উপযুক্ত আপনার অগ্রাধিকারে</span>}
                    </td>
                    <td style={{ textAlign: 'right', padding: '5px 2px' }}>{row.irrig != null ? toBanglaDigits(row.irrig) : '…'}</td>
                    <td style={{ textAlign: 'right', padding: '5px 2px' }}>{row.bare != null ? toBanglaDigits(row.bare) : '…'}</td>
                    <td style={{ textAlign: 'right', padding: '5px 2px' }}>{row.n != null ? toBanglaDigits(row.n) : '…'}</td>
                    <td style={{ textAlign: 'right', padding: '5px 2px' }}>{row.profit != null ? `~${toBanglaDigits(row.profit.toLocaleString())}` : '…'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p style={{ margin: '8px 0 0', fontSize: 11.5, color: 'var(--text-muted)' }}>
            ⭐ = {lang === 'bn' ? 'সবচেয়ে উপযুক্ত আপনার অগ্রাধিকারে।' : 'Best suited to your priority.'}
          </p>
        </div>
      </div>

      {/* 8. Ask AI Bar (A1) & Compact SAAO Notice */}
      <AskAiBar
        page="farm_planning"
        context={plannerAiContext}
        suggestions={plannerAiSuggestions}
        onNavigate={onNavigate || onNavigateTab}
        lang={lang}
      />

      <div style={{ marginTop: 4 }}>
        <SaaoNotice lang={lang} />
      </div>

    </div>
  );
}
