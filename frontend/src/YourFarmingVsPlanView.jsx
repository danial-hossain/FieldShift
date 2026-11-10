// frontend/src/YourFarmingVsPlanView.jsx
// ৪. আপনার চাষ বনাম পরামর্শ (Your Farming vs Plan)
// Layout reference: docs/compare_layout_reference.html
// Unified comparison view showing:
// 1. Header with parcel metadata & verified data provenance
// 2. Shared strategy selector pills with best_strategy badge & reason
// 3. 3-Column comparison cards: Current Farming vs Original Plan vs Adaptive Learning
// 4. Interactive 3D Farm Diorama (FarmScene3D) with 3-way view toggle & water tank sync
// 5. Season-by-season comparison table with automated agronomic delta explanations
// 6. Cross-strategy comparison bars for Profit & Irrigation
// 7. Dynamic summary card with natural Bangla grammar (possessive suffixes) & English localization

import React, { useState, useMemo, useCallback } from 'react';
import { FarmScene3D } from './three/FarmScene3D.jsx';
import { haToBigha } from './three/farmSceneHelpers.js';
import { formatDistrictLabel } from './utils/districtLabels.js';
import { formatSoilTextureLabel } from './utils/soilClasses.js';
import {
  useRotationPlans,
  extractStrategyMetrics,
  extractBaselineMetrics,
  getAppliedReplan,
  PRIORITIES,
  CANONICAL_PERIOD_KEYS,
} from './store/rotationPlansStore.js';
import {
  cropLabel,
  formatCurrency,
} from './i18n.js';
import { request as defaultRequest } from './apiClient.js';

// Legumes for Biological Nitrogen Fixation detection
const LEGUMES = new Set([
  'mungbean', 'chickpea', 'lentil', 'grasspea', 'soybean', 'cowpea', 'groundnut',
  'মুগডাল', 'ছোলা', 'মসুর', 'খেসারি', 'সয়াবিন', 'চিনাবাদাম',
]);

const CROP_COLORS = {
  boro: '#529944',
  'boro rice': '#529944',
  'বোরো ধান': '#529944',
  rice: '#4d9241',
  't. aman rice': '#4d9241',
  'aman rice': '#4d9241',
  'আমন ধান': '#4d9241',
  mustard: '#d4a017',
  'সরিষা': '#d4a017',
  mungbean: '#388e3c',
  'মুগডাল': '#388e3c',
  chickpea: '#c47d2b',
  'ছোলা': '#c47d2b',
  sesame: '#c28b38',
  'তিল': '#c28b38',
  sunflower: '#e6a817',
  'সূর্যমুখী': '#e6a817',
  soybean: '#488b49',
  'সয়াবিন': '#488b49',
  tomato: '#c63d2f',
  'টমেটো': '#c63d2f',
  wheat: '#d6a850',
  'গম': '#d6a850',
  maize: '#e09f2b',
  'ভুট্টা': '#e09f2b',
  potato: '#9b7653',
  'আলু': '#9b7653',
  lentil: '#b25329',
  'মসুর': '#b25329',
  fallow: '#8a7b68',
  'ফসলহীন': '#8a7b68',
};

function getCropColor(cropName) {
  if (!cropName) return '#8a7b68';
  const k = String(cropName).toLowerCase().trim();
  return CROP_COLORS[k] || '#4d9241';
}

function toBanglaDigits(val) {
  if (val == null) return '–';
  return String(val).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
}

function formatNum(val, lang = 'bn') {
  if (val == null) return '–';
  const rounded = Math.round(val * 10) / 10;
  if (lang === 'bn') {
    return toBanglaDigits(rounded);
  }
  return String(rounded);
}

function formatBdt(val, lang = 'bn') {
  if (val == null) return '–';
  const rounded = Math.round(val);
  if (lang === 'bn') {
    return '৳' + toBanglaDigits(rounded.toLocaleString('en-IN'));
  }
  return rounded.toLocaleString('en-US') + ' BDT';
}

// Bengali possessive grammatical rule
function getBanglaPossessive(noun) {
  if (!noun) return '';
  // If ends with vowel sign (kar: া ি ী ু ূ ৃ ে ৈ ো ৌ) -> append 'র'
  // If ends with consonant (no kar) -> append 'ের'
  return noun + (/[\u09BE-\u09CC]$/.test(noun) ? 'র' : 'ের');
}

export function YourFarmingVsPlanView({
  activeField,
  user,
  lang = 'bn',
  theme = 'dark',
  onBack,
  onNavigateTab,
  request = defaultRequest,
}) {
  const {
    plansByPriority,
    loading: plansLoading,
    error: plansError,
    selectedPriority,
    bestPriority,
    bestReason,
    identicalStrategyNote,
    setSelectedStrategy,
    refetch,
  } = useRotationPlans({ field: activeField, lang, request });

  // 3D View Mode: 'current' | 'plan' | 'updated'
  const [viewMode, setViewMode] = useState('plan');

  // Check if activeField has an applied replan for current strategy
  const appliedReplan = useMemo(() => {
    return getAppliedReplan(activeField?.id, selectedPriority);
  }, [activeField?.id, selectedPriority]);

  // Baseline metrics (1-year current farming)
  const baselineMetrics = useMemo(() => {
    const anyPlan = plansByPriority[selectedPriority] || plansByPriority.balanced || Object.values(plansByPriority)[0];
    return extractBaselineMetrics(anyPlan, activeField);
  }, [plansByPriority, selectedPriority, activeField]);

  // Currently selected plan metrics (2-year MILP rotation)
  const currentPlanMetrics = useMemo(() => {
    return extractStrategyMetrics(plansByPriority[selectedPriority]);
  }, [plansByPriority, selectedPriority]);

  // All 4 strategies metrics (for horizontal comparison bars)
  const strategyMetrics = useMemo(() => {
    const map = {};
    PRIORITIES.forEach((p) => {
      map[p] = extractStrategyMetrics(plansByPriority[p]);
    });
    return map;
  }, [plansByPriority]);

  // Applied replan metrics if available
  const appliedReplanMetrics = useMemo(() => {
    if (!appliedReplan || !appliedReplan.plan) return null;
    const planCrops = appliedReplan.plan.map((p) => p.crop || 'Fallow');
    const seasonIrrigs = appliedReplan.plan.map((p) => p.water_mm != null ? Number(p.water_mm) : 0);
    const irrigationMm = Math.round((seasonIrrigs.reduce((a, b) => a + b, 0) / 2.0) * 10) / 10;
    const totalProfit = (appliedReplan.soFarProfit || 0) + (appliedReplan.remainProfit || 0);
    const profitBdt = Math.round(totalProfit / 2.0);
    const bareDays = appliedReplan.bareSoilDays != null ? appliedReplan.bareSoilDays : (currentPlanMetrics?.bareDays || 60);
    const nitrogenKg = appliedReplan.nitrogenKg != null ? appliedReplan.nitrogenKg : (currentPlanMetrics?.nitrogenKg || 35);
    return {
      crops: planCrops,
      irrigationMm,
      profitBdt,
      bareDays,
      nitrogenKg,
      seasonIrrigs,
      soFar: appliedReplan.soFarProfit || 0,
      remain: appliedReplan.remainProfit || 0,
      finishedCount: appliedReplan.finishedCount || 1,
      date: appliedReplan.date || (lang === 'bn' ? '১০ নভে' : '10 Nov'),
    };
  }, [appliedReplan, currentPlanMetrics, lang]);

  // Fallback viewMode if 'updated' was active but no replan exists
  const effectiveViewMode = useMemo(() => {
    if (viewMode === 'updated' && !appliedReplan) return 'plan';
    if (viewMode === 'current' && !baselineMetrics.hasSavedRotation) return 'plan';
    return viewMode;
  }, [viewMode, appliedReplan, baselineMetrics.hasSavedRotation]);

  // 3D Beds generation
  const beds3D = useMemo(() => {
    return CANONICAL_PERIOD_KEYS.map((pk, i) => {
      if (effectiveViewMode === 'current') {
        const isYear2 = i >= 3;
        const crop = baselineMetrics.crops ? baselineMetrics.crops[i % 3] : null;
        return {
          id: pk,
          isGreyedOut: isYear2,
          crop: isYear2 ? null : crop,
          cropLabel: isYear2
            ? (lang === 'bn' ? '২য় বছর: একই' : 'Year 2: Same')
            : (crop ? cropLabel(crop, lang) : ''),
          irrigation_mm: isYear2 ? 0 : (baselineMetrics.seasonIrrigs ? baselineMetrics.seasonIrrigs[i % 3] : 0),
          isLegume: crop ? LEGUMES.has(crop.toLowerCase()) : false,
        };
      } else if (effectiveViewMode === 'updated' && appliedReplan && appliedReplan.plan) {
        const item = appliedReplan.plan[i] || {};
        const crop = item.crop || 'Fallow';
        return {
          id: pk,
          isGreyedOut: false,
          isCompleted: i < (appliedReplan.finishedCount || 0),
          isChanged: Boolean(item.changed),
          crop,
          cropLabel: cropLabel(crop, lang),
          irrigation_mm: item.water_mm != null ? item.water_mm : 0,
          isLegume: crop ? LEGUMES.has(crop.toLowerCase()) : false,
        };
      } else {
        // 'plan'
        const crop = currentPlanMetrics?.crops ? currentPlanMetrics.crops[i] : 'Fallow';
        return {
          id: pk,
          isGreyedOut: false,
          crop,
          cropLabel: crop ? cropLabel(crop, lang) : '',
          irrigation_mm: currentPlanMetrics?.seasonIrrigs ? currentPlanMetrics.seasonIrrigs[i] : 0,
          isLegume: crop ? LEGUMES.has(crop.toLowerCase()) : false,
        };
      }
    });
  }, [effectiveViewMode, baselineMetrics, appliedReplan, currentPlanMetrics, lang]);

  // Active Yearly Irrigation for 3D Water Tank
  const activeIrrigationMm = useMemo(() => {
    if (effectiveViewMode === 'current') return baselineMetrics?.irrigationMm || 0;
    if (effectiveViewMode === 'updated' && appliedReplanMetrics) return appliedReplanMetrics.irrigationMm;
    return currentPlanMetrics?.irrigationMm || 0;
  }, [effectiveViewMode, baselineMetrics, appliedReplanMetrics, currentPlanMetrics]);

  // Strategy names & labels
  const strategyLabels = useMemo(() => ({
    balanced: { bn: 'সুষম', en: 'Balanced' },
    profit: { bn: 'লাভ', en: 'Profit' },
    water: { bn: 'পানি সাশ্রয়', en: 'Water Saving' },
    soil: { bn: 'মাটির স্বাস্থ্য', en: 'Soil Health' },
  }), []);

  // Seasons metadata for comparison table
  const seasonRows = useMemo(() => [
    { key: 'rabi', idx: 0, bn: 'রবি (নভে–এপ্রি)', en: 'Rabi (Nov–Apr)' },
    { key: 'kharif1', idx: 1, bn: 'খরিফ-১ (এপ্রি–জুন)', en: 'Kharif-1 (Apr–Jun)' },
    { key: 'kharif2', idx: 2, bn: 'খরিফ-২ (জুলা–অক্টো)', en: 'Kharif-2 (Jul–Oct)' },
  ], []);

  // Render 4 key metrics row
  const renderNums = useCallback((metrics, baseMetrics) => {
    if (!metrics) return null;
    const renderMetricCell = (label, val, unit, baseVal, isGoodFn) => {
      const delta = (baseVal != null && val != null) ? (val - baseVal) : null;
      const isDiff = delta != null && Math.abs(delta) > 0.1;
      const cls = !isDiff ? '' : (isGoodFn(delta) ? 'pos' : 'neg');
      const formattedVal = unit === 'টাকা' || unit === 'BDT' ? formatBdt(val, lang) : formatNum(val, lang);
      const formattedDelta = delta != null
        ? (unit === 'টাকা' || unit === 'BDT' ? formatBdt(Math.abs(delta), lang) : formatNum(Math.abs(delta), lang))
        : '';
      return (
        <div>
          <span>{label}</span>
          <strong>{formattedVal}</strong> <small>{unit}</small>
          {isDiff && (
            <em className={cls}>
              {delta > 0 ? '+' : '−'}{formattedDelta}
            </em>
          )}
        </div>
      );
    };

    return (
      <div className="cv-n4">
        {renderMetricCell(
          lang === 'bn' ? 'সেচ/বছর' : 'Irrigation/yr',
          metrics.irrigationMm,
          lang === 'bn' ? 'মিমি' : 'mm',
          baseMetrics ? baseMetrics.irrigationMm : null,
          (d) => d < 0
        )}
        {renderMetricCell(
          lang === 'bn' ? 'খালি দিন' : 'Bare soil',
          metrics.bareDays,
          lang === 'bn' ? 'দিন' : 'days',
          baseMetrics ? baseMetrics.bareDays : null,
          (d) => d < 0
        )}
        {renderMetricCell(
          lang === 'bn' ? 'নাইট্রোজেন' : 'Nitrogen',
          metrics.nitrogenKg,
          lang === 'bn' ? 'কেজি/হে' : 'kg/ha',
          baseMetrics ? baseMetrics.nitrogenKg : null,
          (d) => d > 0
        )}
        {renderMetricCell(
          lang === 'bn' ? 'লাভ/বছর' : 'Profit/yr',
          metrics.profitBdt,
          lang === 'bn' ? 'টাকা' : 'BDT',
          baseMetrics ? baseMetrics.profitBdt : null,
          (d) => d > 0
        )}
      </div>
    );
  }, [lang]);

  // Render crop chip badge
  const renderCropChip = useCallback((cropName, extraClass = '') => {
    const label = cropLabel(cropName, lang);
    const color = getCropColor(cropName);
    return (
      <span className={`cv-cc ${extraClass}`.trim()}>
        <i className="cv-dot" style={{ background: color }} />
        {label}
      </span>
    );
  }, [lang]);

  // Agronomic "What Changed" Reason Generator for Table
  const getWhatChangedReason = useCallback((baseCrop, planCrop, baseIrrig, planIrrig) => {
    if (!baseCrop || !planCrop) return '–';
    if (baseCrop.toLowerCase() === planCrop.toLowerCase()) {
      return lang === 'bn' ? 'একই থাকল' : 'Unchanged';
    }
    const reasons = [];
    if (baseCrop.toLowerCase() === 'fallow' || baseCrop === 'ফসলহীন') {
      reasons.push(lang === 'bn' ? 'খালি জমিতে আয়' : 'Income from fallow');
    }
    const dw = (baseIrrig || 0) - (planIrrig || 0);
    if (dw > 50) {
      reasons.push(
        lang === 'bn'
          ? `${toBanglaDigits(Math.round(dw))} মিমি পানি বাঁচল`
          : `Saved ${Math.round(dw)} mm water`
      );
    } else if (dw < -50) {
      reasons.push(
        lang === 'bn'
          ? `${toBanglaDigits(Math.round(-dw))} মিমি বেশি পানি`
          : `${Math.round(-dw)} mm more water`
      );
    }
    if (LEGUMES.has(planCrop.toLowerCase())) {
      reasons.push(lang === 'bn' ? 'নাইট্রোজেন যোগ' : 'Nitrogen added');
    }
    return reasons.join(', ') || (lang === 'bn' ? 'ফসল বদলাল' : 'Crop rotated');
  }, [lang]);

  // Max values for horizontal comparison bars
  const maxBarValues = useMemo(() => {
    const profits = [baselineMetrics.profitBdt || 0];
    const irrigs = [baselineMetrics.irrigationMm || 0];
    PRIORITIES.forEach((p) => {
      const m = strategyMetrics[p];
      if (m) {
        if (m.profitBdt) profits.push(m.profitBdt);
        if (m.irrigationMm) irrigs.push(m.irrigationMm);
      }
    });
    return {
      profit: Math.max(...profits, 1),
      irrigation: Math.max(...irrigs, 1),
    };
  }, [baselineMetrics, strategyMetrics]);

  // Dynamic Natural Language Summary
  const summaryText = useMemo(() => {
    if (!currentPlanMetrics) return '';
    if (!baselineMetrics.hasSavedRotation) {
      return lang === 'bn'
        ? `💡 এই জমিতে ${strategyLabels[selectedPriority]?.bn || 'নির্বাচিত'} কৌশলে বছরে সেচ লাগবে ${formatNum(currentPlanMetrics.irrigationMm, 'bn')} মিমি এবং সম্ভাব্য বাৎসরিক লাভ ${formatBdt(currentPlanMetrics.profitBdt, 'bn')}।`
        : `💡 For this parcel, the ${strategyLabels[selectedPriority]?.en || 'selected'} strategy requires ${formatNum(currentPlanMetrics.irrigationMm, 'en')} mm irrigation/yr with an estimated profit of ${formatBdt(currentPlanMetrics.profitBdt, 'en')}.`;
    }

    const dI = (baselineMetrics.irrigationMm || 0) - (currentPlanMetrics.irrigationMm || 0);
    const dP = (currentPlanMetrics.profitBdt || 0) - (baselineMetrics.profitBdt || 0);

    const swaps = [0, 1, 2]
      .filter((i) => {
        const b = baselineMetrics.crops ? baselineMetrics.crops[i] : null;
        const p = currentPlanMetrics.crops ? currentPlanMetrics.crops[i] : null;
        return b && p && b.toLowerCase() !== p.toLowerCase();
      })
      .map((i) => {
        const b = baselineMetrics.crops[i];
        const p = currentPlanMetrics.crops[i];
        const pBn = cropLabel(p, 'bn');
        const pEn = cropLabel(p, 'en');
        const bBn = cropLabel(b, 'bn');
        const bEn = cropLabel(b, 'en');
        if (lang === 'bn') {
          if (b.toLowerCase() === 'fallow' || b === 'ফসলহীন') {
            return `খালি ${seasonRows[i].bn.split(' ')[0]}-এ ${pBn}`;
          }
          return `${getBanglaPossessive(bBn)} বদলে ${pBn}`;
        } else {
          if (b.toLowerCase() === 'fallow') {
            return `${pEn} on fallow ${seasonRows[i].en.split(' ')[0]}`;
          }
          return `${pEn} instead of ${bEn}`;
        }
      });

    const swapsStr = swaps.join(lang === 'bn' ? ' আর ' : ' and ');
    const waterStr = lang === 'bn'
      ? (dI >= 0 ? `${toBanglaDigits(Math.round(dI))} মিমি পানি কম` : `${toBanglaDigits(Math.round(-dI))} মিমি পানি বেশি`)
      : (dI >= 0 ? `${Math.round(dI)} mm less water` : `${Math.round(-dI)} mm more water`);
    const profitStr = lang === 'bn'
      ? `প্রায় ${formatBdt(Math.abs(dP), 'bn')} বেশি লাভ`
      : `around ${formatBdt(Math.abs(dP), 'en')} more profit`;
    const waterWarning = dI < 0
      ? (lang === 'bn' ? ' (লাভ বেশি, কিন্তু পানি বেশি লাগে।)' : ' (Higher profit, but requires more water.)')
      : '';

    let res = '';
    if (swaps.length > 0) {
      res = lang === 'bn'
        ? `💡 ${swapsStr} লাগালে বছরে ${waterStr} লাগবে আর ${profitStr} হবে।${waterWarning}`
        : `💡 Planting ${swapsStr} will require ${waterStr} per year and yield ${profitStr}.${waterWarning}`;
    } else {
      res = lang === 'bn'
        ? `💡 বর্তমান চাষ পদ্ধতির সাথে এই কৌশলের প্রথম বছরের ফসল একই।`
        : `💡 The first year crop rotation matches your current farming practice.`;
    }

    if (identicalStrategyNote && (selectedPriority === 'balanced' || selectedPriority === 'water')) {
      res = `${identicalStrategyNote}। ` + res;
    }
    return res;
  }, [currentPlanMetrics, baselineMetrics, lang, selectedPriority, strategyLabels, seasonRows, identicalStrategyNote]);

  // Parcel header details
  const bighaVal = useMemo(() => {
    if (!activeField?.area_ha) return '৫';
    return haToBigha(activeField.area_ha);
  }, [activeField?.area_ha]);

  const districtLabelStr = useMemo(() => {
    return formatDistrictLabel(activeField?.district || 'chapainawabganj', lang);
  }, [activeField?.district, lang]);

  const soilLabelStr = useMemo(() => {
    return formatSoilTextureLabel(activeField?.soil_texture || 'clay loam', lang);
  }, [activeField?.soil_texture, lang]);

  const bighaText = lang === 'bn' ? `${toBanglaDigits(bighaVal)} বিঘা` : `${bighaVal} Bigha`;

  return (
    <div className="compare-view" data-theme={theme}>
      {/* 1. Header */}
      <div className="cv-head">
        <div>
          <h1 className="cv-title">
            {lang === 'bn'
              ? `আপনার চাষ বনাম পরামর্শ · ${activeField?.name || 'রহিম মিয়ার জমি'}`
              : `Your Farming vs Plan · ${activeField?.name || 'Rahim Plot'}`}
          </h1>
          <div className="cv-sub">
            {districtLabelStr} · {bighaText} · {soilLabelStr} · NASA POWER + GPM IMERG · BARC/AEZ
          </div>
        </div>
        <span className="cv-tag">
          {lang === 'bn' ? 'একীভূত তথ্য · একক নির্ভুল উৎস' : 'Unified Data · Single Source of Truth'}
        </span>
      </div>

      {/* 2. Strategy Selector Pills */}
      <div className="cv-row">
        <div className="cv-seg" role="group" aria-label={lang === 'bn' ? 'কৌশল নির্বাচন' : 'Strategy Selection'}>
          {PRIORITIES.map((pKey) => {
            const isSelected = selectedPriority === pKey;
            const isBest = bestPriority === pKey;
            const label = strategyLabels[pKey]?.[lang] || pKey;
            return (
              <button
                key={pKey}
                type="button"
                data-s={pKey}
                aria-pressed={isSelected ? 'true' : 'false'}
                onClick={() => setSelectedStrategy(pKey)}
              >
                {label} {isBest ? '⭐' : ''}
              </button>
            );
          })}
        </div>
        {bestReason && (
          <div className="cv-best-reason">
            <span>⭐</span>
            <span>{bestReason}</span>
          </div>
        )}
      </div>

      {/* 3. Three Comparison Columns */}
      <div className="cv-cols">
        {/* Column 1: Current Farming */}
        {!baselineMetrics.hasSavedRotation ? (
          <div className="cv-col empty">
            <div className="cv-ch">
              <b>১</b>
              <span>{lang === 'bn' ? 'আপনার এখনকার চাষ' : 'Your Current Farming'}</span>
            </div>
            <p className="cv-note">
              {lang === 'bn'
                ? 'আপনার এখনকার চাষ দেওয়া নেই — আমার জমিতে যোগ করুন'
                : 'No current rotation configured — add it in My Farm'}
            </p>
            <button
              className="cv-btn"
              type="button"
              onClick={() => onNavigateTab ? onNavigateTab('field') : null}
            >
              {lang === 'bn' ? 'আমার জমিতে যোগ করুন →' : 'Go to My Farm →'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`cv-col baseline-col ${effectiveViewMode === 'current' ? 'on' : ''}`}
            onClick={() => setViewMode('current')}
          >
            <div className="cv-ch">
              <b>১</b>
              <span>{lang === 'bn' ? 'আপনার এখনকার চাষ' : 'Your Current Farming'}</span>
              <small>{lang === 'bn' ? 'প্রতি বছর একই' : 'Same every year'}</small>
            </div>
            <div className="cv-strip">
              {baselineMetrics.crops.map((c, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <em>→</em>}
                  {renderCropChip(c)}
                </React.Fragment>
              ))}
            </div>
            {renderNums(baselineMetrics, null)}
          </button>
        )}

        {/* Column 2: Original Plan */}
        {plansLoading ? (
          <div className="cv-col">
            <div className="cv-ch">
              <b>২</b>
              <span>
                {lang === 'bn'
                  ? `মূল পরামর্শ · ${strategyLabels[selectedPriority]?.bn || ''}`
                  : `Plan · ${strategyLabels[selectedPriority]?.en || ''}`}
              </span>
            </div>
            <p className="cv-note">{lang === 'bn' ? 'লোড হচ্ছে…' : 'Loading…'}</p>
          </div>
        ) : plansError ? (
          <div className="cv-col empty">
            <div className="cv-ch">
              <b>২</b>
              <span>
                {lang === 'bn'
                  ? `মূল পরামর্শ · ${strategyLabels[selectedPriority]?.bn || ''}`
                  : `Plan · ${strategyLabels[selectedPriority]?.en || ''}`}
              </span>
            </div>
            <p className="cv-note">{plansError}</p>
            <button className="cv-btn" type="button" onClick={refetch}>
              {lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
            </button>
          </div>
        ) : !currentPlanMetrics ? (
          <div className="cv-col empty">
            <div className="cv-ch">
              <b>২</b>
              <span>
                {lang === 'bn'
                  ? `মূল পরামর্শ · ${strategyLabels[selectedPriority]?.bn || ''}`
                  : `Plan · ${strategyLabels[selectedPriority]?.en || ''}`}
              </span>
            </div>
            <p className="cv-note">{lang === 'bn' ? 'তথ্য পাওয়া যায়নি' : 'No plan data'}</p>
          </div>
        ) : (
          <button
            type="button"
            className={`cv-col ${effectiveViewMode === 'plan' ? 'on' : ''}`}
            onClick={() => setViewMode('plan')}
          >
            <div className="cv-ch">
              <b>২</b>
              <span>
                {lang === 'bn'
                  ? `মূল পরামর্শ · ${strategyLabels[selectedPriority]?.bn || ''}`
                  : `Plan · ${strategyLabels[selectedPriority]?.en || ''}`}
              </span>
              {bestPriority === selectedPriority && <span>⭐</span>}
              <small>{lang === 'bn' ? 'MILP · ২ বছর' : 'MILP · 2 years'}</small>
            </div>
            <div className="cv-strip">
              {currentPlanMetrics.crops.map((c, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <em>→</em>}
                  {renderCropChip(c)}
                </React.Fragment>
              ))}
            </div>
            {renderNums(
              currentPlanMetrics,
              baselineMetrics.hasSavedRotation ? baselineMetrics : null
            )}
            {identicalStrategyNote && (selectedPriority === 'balanced' || selectedPriority === 'water') && (
              <p className="cv-note" style={{ fontStyle: 'italic', marginTop: 4 }}>
                {identicalStrategyNote}।
              </p>
            )}
          </button>
        )}

        {/* Column 3: After Field Learning */}
        {appliedReplanMetrics ? (
          <button
            type="button"
            className={`cv-col upd-col ${effectiveViewMode === 'updated' ? 'on' : ''}`}
            onClick={() => setViewMode('updated')}
          >
            <div className="cv-ch">
              <b>৩</b>
              <span>{lang === 'bn' ? 'মাঠ থেকে শেখার পর' : 'After Field Learning'}</span>
              <small>
                {lang === 'bn'
                  ? `${toBanglaDigits(appliedReplanMetrics.finishedCount)}টা মৌসুম শেষ · ${appliedReplanMetrics.date}`
                  : `${appliedReplanMetrics.finishedCount} finished · ${appliedReplanMetrics.date}`}
              </small>
            </div>
            <div className="cv-strip">
              {appliedReplanMetrics.crops.map((c, i) => {
                const isDone = i < appliedReplanMetrics.finishedCount;
                const isChg = Boolean(appliedReplan?.plan?.[i]?.changed);
                const extraCls = isDone ? 'done' : isChg ? 'chg' : '';
                return (
                  <React.Fragment key={i}>
                    {i > 0 && <em>→</em>}
                    <span className={`cv-cc ${extraCls}`.trim()}>
                      <i className="cv-dot" style={{ background: getCropColor(c) }} />
                      {isDone ? '✓ ' : ''}{cropLabel(c, lang)}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
            {renderNums(
              appliedReplanMetrics,
              baselineMetrics.hasSavedRotation ? baselineMetrics : null
            )}
            <p className="cv-note" style={{ fontSize: '11.5px', marginTop: 4 }}>
              {lang === 'bn'
                ? `২ বছরে মোট = এ পর্যন্ত আসল ${formatCurrency(appliedReplanMetrics.soFar, 'bn')} + বাকি আনুমানিক ${formatCurrency(appliedReplanMetrics.remain, 'bn')}`
                : `2-yr total = Actual so far ${formatCurrency(appliedReplanMetrics.soFar, 'en')} + Projected remaining ${formatCurrency(appliedReplanMetrics.remain, 'en')}`}
            </p>
          </button>
        ) : (
          <div className="cv-col empty">
            <div className="cv-ch">
              <b>৩</b>
              <span>{lang === 'bn' ? 'মাঠ থেকে শেখার পর' : 'After Field Learning'}</span>
            </div>
            <p className="cv-note">
              {lang === 'bn'
                ? 'মৌসুম শেষ হলে আসল ফলন ও দাম দিন — পরিকল্পনা নিজেকে মানিয়ে নেবে।'
                : 'Record actual yield & price when season ends — the plan adapts itself.'}
            </p>
            <button
              className="cv-btn"
              type="button"
              onClick={() => onNavigateTab ? onNavigateTab('replan') : null}
            >
              🔄 {lang === 'bn' ? 'অভিযোজিত পুনঃপরিকল্পনা →' : 'Adaptive Replan →'}
            </button>
          </div>
        )}
      </div>

      {/* 4. 3D Farm Diorama */}
      <div className="stagebox">
        {/* Top 3-Way Toggle */}
        <div className="vseg" role="group" aria-label={lang === 'bn' ? '3D-তে দেখুন' : 'View in 3D'}>
          <button
            type="button"
            data-v="current"
            disabled={!baselineMetrics.hasSavedRotation}
            aria-pressed={effectiveViewMode === 'current' ? 'true' : 'false'}
            onClick={() => setViewMode('current')}
          >
            {lang === 'bn' ? 'আপনার চাষ' : 'Your Farming'}
          </button>
          <button
            type="button"
            data-v="plan"
            aria-pressed={effectiveViewMode === 'plan' ? 'true' : 'false'}
            onClick={() => setViewMode('plan')}
          >
            {lang === 'bn' ? 'মূল পরামর্শ' : 'Original Plan'}
          </button>
          <button
            type="button"
            data-v="updated"
            disabled={!appliedReplanMetrics}
            aria-pressed={effectiveViewMode === 'updated' ? 'true' : 'false'}
            onClick={() => setViewMode('updated')}
          >
            {lang === 'bn' ? 'হালনাগাদ' : 'Updated'}
          </button>
        </div>

        {/* 3D Scene */}
        <FarmScene3D
          beds={beds3D}
          selectedStrategy={effectiveViewMode === 'current' ? 'baseline' : selectedPriority}
          annualIrrigationMm={activeIrrigationMm}
          fieldName={activeField?.name || 'খামার প্লট'}
          theme={theme}
          lang={lang}
          height={460}
        />

        {/* Legend */}
        <div className="legend">
          {lang === 'bn'
            ? '✓ শেষ হয়েছে · ⟳ শেখার পর বদলেছে · ধূসর = একই চাষ আবার'
            : '✓ Finished · ⟳ Changed after learning · Grey = Repeat same'}
        </div>

        {/* Tank Capacity Display */}
        <div className="tankcap">
          💧 {lang === 'bn' ? 'বছরে সেচ:' : 'Yearly Irrigation:'} {formatNum(activeIrrigationMm, lang)} {lang === 'bn' ? 'মিমি' : 'mm'}
        </div>
      </div>

      {/* 5. Season Table & Comparison Bars */}
      <div className="cv-two">
        {/* Season Table */}
        <section className="cv-card">
          <h3 style={{ fontSize: 15, margin: '0 0 10px 0', fontWeight: 700 }}>
            {lang === 'bn' ? 'মৌসুম ধরে তুলনা' : 'Season-by-Season Comparison'}
          </h3>
          <div className="cv-tw">
            <table>
              <thead>
                <tr>
                  <th>{lang === 'bn' ? 'মৌসুম' : 'Season'}</th>
                  <th>{lang === 'bn' ? 'আপনার চাষ' : 'Your Farming'}</th>
                  <th>{lang === 'bn' ? 'পরামর্শ ১ম বছর' : 'Plan Year 1'}</th>
                  <th>{lang === 'bn' ? 'পরামর্শ ২য় বছর' : 'Plan Year 2'}</th>
                  {appliedReplanMetrics && (
                    <th>{lang === 'bn' ? 'হালনাগাদ (২য় বছর)' : 'Updated (Year 2)'}</th>
                  )}
                  <th>{lang === 'bn' ? 'কী বদলাল (১ম বছর)' : 'What Changed (Year 1)'}</th>
                </tr>
              </thead>
              <tbody>
                {seasonRows.map((sRow, idx) => {
                  const baseCrop = baselineMetrics.crops ? baselineMetrics.crops[idx] : null;
                  const baseIrrig = baselineMetrics.seasonIrrigs ? baselineMetrics.seasonIrrigs[idx] : 0;
                  const planY1Crop = currentPlanMetrics?.crops ? currentPlanMetrics.crops[idx] : null;
                  const planY1Irrig = currentPlanMetrics?.seasonIrrigs ? currentPlanMetrics.seasonIrrigs[idx] : 0;
                  const planY2Crop = currentPlanMetrics?.crops ? currentPlanMetrics.crops[idx + 3] : null;
                  const planY2Irrig = currentPlanMetrics?.seasonIrrigs ? currentPlanMetrics.seasonIrrigs[idx + 3] : 0;

                  const updItem = appliedReplan?.plan ? appliedReplan.plan[idx + 3] : null;
                  const updCrop = updItem?.crop || null;
                  const isUpdChanged = Boolean(updItem?.changed);

                  const whatChanged = getWhatChangedReason(baseCrop, planY1Crop, baseIrrig, planY1Irrig);

                  return (
                    <tr key={sRow.key}>
                      <td style={{ fontWeight: 600 }}>
                        {lang === 'bn' ? sRow.bn : sRow.en}
                      </td>
                      <td>
                        {baseCrop ? renderCropChip(baseCrop) : '–'}
                        <small>{formatNum(baseIrrig, lang)} {lang === 'bn' ? 'মিমি' : 'mm'}</small>
                      </td>
                      <td>
                        {planY1Crop ? renderCropChip(planY1Crop) : '–'}
                        <small>{formatNum(planY1Irrig, lang)} {lang === 'bn' ? 'মিমি' : 'mm'}</small>
                      </td>
                      <td>
                        {planY2Crop ? renderCropChip(planY2Crop) : '–'}
                        <small>{formatNum(planY2Irrig, lang)} {lang === 'bn' ? 'মিমি' : 'mm'}</small>
                      </td>
                      {appliedReplanMetrics && (
                        <td>
                          {isUpdChanged && planY2Crop && (
                            <>
                              <s>{cropLabel(planY2Crop, lang)}</s>
                              <span> → </span>
                            </>
                          )}
                          {updCrop ? renderCropChip(updCrop, isUpdChanged ? 'chg' : '') : '–'}
                        </td>
                      )}
                      <td>{whatChanged}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Cross-Strategy Horizontal Bars */}
        <section className="cv-card">
          <h3 style={{ fontSize: 15, margin: '0 0 10px 0', fontWeight: 700 }}>
            {lang === 'bn' ? '৪ কৌশল বনাম আপনার চাষ' : '4 Strategies vs Your Farming'}
          </h3>
          <div className="bh">
            <span />
            <span>{lang === 'bn' ? `লাভ/বছর (${bighaText})` : `Profit/yr (${bighaText})`}</span>
            <span>{lang === 'bn' ? 'সেচ/বছর' : 'Irrigation/yr'}</span>
          </div>

          {/* Current Farming Row */}
          <div className="br cur">
            <span style={{ fontWeight: 600 }}>
              {lang === 'bn' ? 'আপনার চাষ' : 'Your farming'}
            </span>
            {baselineMetrics.hasSavedRotation && baselineMetrics.profitBdt != null ? (
              <div className="bar">
                <i
                  className="p"
                  style={{ width: `${Math.min(100, Math.max(5, (baselineMetrics.profitBdt / maxBarValues.profit) * 100))}%` }}
                />
                <span>{formatBdt(baselineMetrics.profitBdt, lang)}</span>
              </div>
            ) : (
              <div className="bar na">{lang === 'bn' ? 'তথ্য নেই' : 'No data'}</div>
            )}
            {baselineMetrics.hasSavedRotation && baselineMetrics.irrigationMm != null ? (
              <div className="bar">
                <i
                  className="w"
                  style={{ width: `${Math.min(100, Math.max(5, (baselineMetrics.irrigationMm / maxBarValues.irrigation) * 100))}%` }}
                />
                <span>{formatNum(baselineMetrics.irrigationMm, lang)} {lang === 'bn' ? 'মিমি' : 'mm'}</span>
              </div>
            ) : (
              <div className="bar na">{lang === 'bn' ? 'তথ্য নেই' : 'No data'}</div>
            )}
          </div>

          {/* 4 Strategies Rows */}
          {PRIORITIES.map((pKey) => {
            const m = strategyMetrics[pKey];
            const isBest = bestPriority === pKey;
            const label = (strategyLabels[pKey]?.[lang] || pKey) + (isBest ? ' ⭐' : '');
            return (
              <div key={pKey} className="br">
                <span style={{ fontWeight: isBest ? 700 : 500 }}>{label}</span>
                {m && m.profitBdt != null ? (
                  <div className="bar">
                    <i
                      className="p"
                      style={{ width: `${Math.min(100, Math.max(5, (m.profitBdt / maxBarValues.profit) * 100))}%` }}
                    />
                    <span>{formatBdt(m.profitBdt, lang)}</span>
                  </div>
                ) : (
                  <div className="bar na">{lang === 'bn' ? 'তথ্য আসবে' : 'Pending'}</div>
                )}
                {m && m.irrigationMm != null ? (
                  <div className="bar">
                    <i
                      className="w"
                      style={{ width: `${Math.min(100, Math.max(5, (m.irrigationMm / maxBarValues.irrigation) * 100))}%` }}
                    />
                    <span>{formatNum(m.irrigationMm, lang)} {lang === 'bn' ? 'মিমি' : 'mm'}</span>
                  </div>
                ) : (
                  <div className="bar na">{lang === 'bn' ? 'তথ্য আসবে' : 'Pending'}</div>
                )}
              </div>
            );
          })}
        </section>
      </div>

      {/* 6. Dynamic Summary Card */}
      {summaryText && (
        <div className="cv-sum">
          {summaryText}
        </div>
      )}
    </div>
  );
}

export default YourFarmingVsPlanView;
