// frontend/src/ClimateStressTestView.jsx
// ৩. জলবায়ু চাপ পরীক্ষা (Climate Stress Test)
// Evaluates chosen 6-season rotation plan under physical climate stress scenarios:
// Heatwave, Drought (FAO-33/FAO-56), Flood/Inundation, Coldwave, and Salinity (FAO-29 Maas-Hoffman).

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardHeader, Stat, Button, Pill, DataSourceTag, EmptyState, Skeleton, MarketIcon, WaterIcon, RotationIcon, InfoIcon } from './ui/index.js';
import { GlassPanel, GlassCard, GlassButton, GlassBadge } from './GlassComponents.jsx';
import { FarmScene3D } from './three/FarmScene3D.jsx';
import { useRotationPlans, extractPlanCrops, CANONICAL_PERIOD_KEYS } from './store/rotationPlansStore.js';
import { CalculationLoadingOverlay } from './CalculationLoadingOverlay.jsx';
import { request as defaultRequest } from './apiClient.js';
import { toBengaliNumber, formatCurrency, formatNumber } from './i18n.js';
import { translateCropName } from './SixSeasonRecommendationView.jsx';

function toBanglaDigits(val) {
  if (val == null) return '';
  const digits = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
  return String(val).replace(/[0-9]/g, (c) => digits[c] || c);
}

function formatDigits(val, lang) {
  if (val == null) return '—';
  if (lang === 'bn') return toBanglaDigits(val);
  return String(val);
}

const SCENARIOS = [
  {
    id: 'heatwave',
    icon: '🔥',
    nameBn: 'তাপপ্রবাহ',
    nameEn: 'Heatwave',
    impactBn: 'ফুল ও পরাগ নষ্ট',
    impactEn: 'Pollen sterility & flower drop',
    defaultPeriods: ['Y1_S2', 'Y2_S2', 'Y1_S1', 'Y2_S1'],
    intensitySpecs: {
      mild: { bn: 'Tmax +২°C, ৫ দিন', en: 'Tmax +2°C, 5 days' },
      moderate: { bn: 'Tmax +৪°C, ৭ দিন', en: 'Tmax +4°C, 7 days' },
      severe: { bn: 'Tmax +৬°C, ১০ দিন', en: 'Tmax +6°C, 10 days' },
    },
  },
  {
    id: 'drought',
    icon: '🌵',
    nameBn: 'খরা',
    nameEn: 'Drought',
    impactBn: 'মাটির রস কমে, পানির চাপ',
    impactEn: 'Soil moisture deficit & water stress',
    defaultPeriods: ['Y1_S1', 'Y1_S2', 'Y2_S1', 'Y2_S2'],
    intensitySpecs: {
      mild: { bn: 'বৃষ্টি -৩০%, সেচ ক্ষমতা ৭০%', en: 'Rain -30%, Irrigation 70%' },
      moderate: { bn: 'বৃষ্টি -৫০%, সেচ ক্ষমতা ৫০%', en: 'Rain -50%, Irrigation 50%' },
      severe: { bn: 'বৃষ্টি -৭০%, সেচ ক্ষমতা ৩০%', en: 'Rain -70%, Irrigation 30%' },
    },
  },
  {
    id: 'flood',
    icon: '🌊',
    nameBn: 'বন্যা',
    nameEn: 'Flood / Inundation',
    impactBn: 'শিকড়ে অক্সিজেন বন্ধ, ডুবে যাওয়া',
    impactEn: 'Root anoxia & submergence damage',
    defaultPeriods: ['Y1_S3', 'Y2_S3'],
    intensitySpecs: {
      mild: { bn: '৩ দিন জলাবদ্ধতা', en: '3 days standing water' },
      moderate: { bn: '৭ দিন জলাবদ্ধতা', en: '7 days standing water' },
      severe: { bn: '১৪ দিন নিমজ্জন', en: '14 days deep submergence' },
    },
  },
  {
    id: 'coldwave',
    icon: '❄️',
    nameBn: 'শৈত্যপ্রবাহ',
    nameEn: 'Coldwave',
    impactBn: 'ঠান্ডায় ক্ষতি, বৃদ্ধি ধীর',
    impactEn: 'Chilling injury & stunted growth',
    defaultPeriods: ['Y1_S1', 'Y2_S1'],
    intensitySpecs: {
      mild: { bn: 'Tmin -৩°C, ৫ দিন', en: 'Tmin -3°C, 5 days' },
      moderate: { bn: 'Tmin -৫°C, ৭ দিন', en: 'Tmin -5°C, 7 days' },
      severe: { bn: 'Tmin -৭°C, ১০ দিন', en: 'Tmin -7°C, 10 days' },
    },
  },
  {
    id: 'salinity',
    icon: '🧂',
    nameBn: 'লবণাক্ততা',
    nameEn: 'Salinity Stress',
    impactBn: 'লবণের বিষক্রিয়া, পুষ্টি নিতে বাধা',
    impactEn: 'Osmotic stress & ion toxicity',
    defaultPeriods: ['Y1_S1', 'Y2_S1'],
    intensitySpecs: {
      mild: { bn: 'মাটির ECe ৪ dS/m', en: 'Soil ECe 4 dS/m' },
      moderate: { bn: 'মাটির ECe ৮ dS/m', en: 'Soil ECe 8 dS/m' },
      severe: { bn: 'মাটির ECe ১২ dS/m', en: 'Soil ECe 12 dS/m' },
    },
  },
];

const INTENSITIES = [
  { id: 'mild', labelBn: 'মৃদু', labelEn: 'Mild' },
  { id: 'moderate', labelBn: 'মাঝারি', labelEn: 'Moderate' },
  { id: 'severe', labelBn: 'তীব্র', labelEn: 'Severe' },
];

const PERIOD_LABELS = {
  Y1_S1: { bn: '১ম বছর · রবি', en: 'Year 1 · Rabi' },
  Y1_S2: { bn: '১ম বছর · খরিপ-১', en: 'Year 1 · Kharif-1' },
  Y1_S3: { bn: '১ম বছর · খরিপ-২', en: 'Year 1 · Kharif-2' },
  Y2_S1: { bn: '২য় বছর · রবি', en: 'Year 2 · Rabi' },
  Y2_S2: { bn: '২য় বছর · খরিপ-১', en: 'Year 2 · Kharif-1' },
  Y2_S3: { bn: '২য় বছর · খরিপ-২', en: 'Year 2 · Kharif-2' },
};

function formatSpecificCropName(crop, periodKey, lang) {
  if (!crop) return lang === 'bn' ? 'পতিত' : 'Fallow';
  const cLower = String(crop).trim().toLowerCase();
  if (cLower === 'rice' || cLower === 'dhan' || cLower === 'ধান') {
    if (!periodKey || periodKey.includes('S3') || periodKey.includes('kharif2') || periodKey.includes('kharif-2')) {
      return lang === 'bn' ? 'আমন ধান' : 'Aman rice';
    }
    if (periodKey.includes('S1') || periodKey.includes('rabi')) {
      return lang === 'bn' ? 'বোরো ধান' : 'Boro rice';
    }
    if (periodKey.includes('S2') || periodKey.includes('kharif1') || periodKey.includes('kharif-1')) {
      return lang === 'bn' ? 'আউশ ধান' : 'Aus rice';
    }
    return lang === 'bn' ? 'আমন ধান' : 'Aman rice';
  }
  return translateCropName(crop, lang, periodKey);
}

export function ClimateStressTestView({
  activeField,
  user,
  lang = 'bn',
  theme = 'dark',
  onBack,
  onNavigateTab,
  request = defaultRequest,
}) {
  // 1. Shared 6-Season MILP Plans Store
  const {
    plansByPriority,
    loading: plansLoading,
    selectedStrategy: storeStrategy,
    setSelectedStrategy: setStoreStrategy,
  } = useRotationPlans({ field: activeField, lang, request });

  const [strategyLocal, setStrategyLocal] = useState(null);
  const activeStrategy = strategyLocal || storeStrategy || 'balanced';

  // Strategy definition metadata
  const strategies = useMemo(() => [
    { id: 'balanced', labelBn: 'সুষম কৌশল', labelEn: 'Balanced Plan', icon: '⚖️' },
    { id: 'profit', labelBn: 'সর্বোচ্চ লাভ', labelEn: 'Max Profit', icon: '💰' },
    { id: 'water', labelBn: 'পানি সাশ্রয়', labelEn: 'Water Saving', icon: '💧' },
    { id: 'soil', labelBn: 'মাটির স্বাস্থ্য', labelEn: 'Soil Health', icon: '🌱' },
  ], []);

  // 2. Scenario & Simulation State
  const [activeScenarioId, setActiveScenarioId] = useState('heatwave');
  const [activeIntensity, setActiveIntensity] = useState('moderate');
  const activeScenario = useMemo(() => (
    SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0]
  ), [activeScenarioId]);

  // Seasons Hit Selection (pre-selected by scenario defaults)
  const [seasonsHit, setSeasonsHit] = useState(() => (
    new Set(activeScenario.defaultPeriods)
  ));

  useEffect(() => {
    setSeasonsHit(new Set(activeScenario.defaultPeriods));
  }, [activeScenario]);

  const togglePeriodHit = useCallback((pKey) => {
    setSeasonsHit((prev) => {
      const next = new Set(prev);
      if (next.has(pKey)) {
        next.delete(pKey);
      } else {
        next.add(pKey);
      }
      return next;
    });
  }, []);

  // Before / After View Toggle for 3D and comparisons
  const [isPostStress, setIsPostStress] = useState(true);
  const [selectedBedIndex, setSelectedBedIndex] = useState(0);

  // 3. Extract the 6-crop plan sequence from the chosen strategy
  const activePlanObject = plansByPriority ? plansByPriority[activeStrategy] : null;
  const planCrops = useMemo(() => {
    const extracted = extractPlanCrops(activePlanObject);
    if (extracted && extracted.length === 6) return extracted;
    // Default fallback crops for Bogura/standard field if store still resolving
    return ['Mustard', 'Soybean', 'Rice', 'Chickpea', 'Sesame', 'Rice'];
  }, [activePlanObject]);

  // 4. API Stress Test Simulation Query
  const [stressResult, setStressResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState(null);

  const fetchStressSimulation = useCallback(async () => {
    setSimLoading(true);
    setSimError(null);
    try {
      const payload = {
        field_id: activeField?.id || 'demo',
        district: activeField?.district || 'bogura',
        strategy: activeStrategy,
        scenario: activeScenarioId,
        intensity: activeIntensity,
        seasons_hit: Array.from(seasonsHit),
        plan_crops: planCrops,
        area_ha: activeField?.area_ha != null ? Number(activeField.area_ha) : 0.133,
      };
      const res = await request('/api/planning/stress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res && res.status === 'ok') {
        setStressResult(res);
      } else {
        throw new Error(res?.detail || 'Failed to simulate stress test');
      }
    } catch (err) {
      console.warn('[ClimateStressTestView] Simulation error:', err);
      setSimError(err.message || 'Simulation error');
    } finally {
      setSimLoading(false);
    }
  }, [activeField, activeStrategy, activeScenarioId, activeIntensity, seasonsHit, planCrops, request]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStressSimulation();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchStressSimulation]);

  // Prepare 3D Farm Props
  const bedLossPcts = useMemo(() => {
    if (!stressResult || !Array.isArray(stressResult.seasons)) {
      return [0, 0, 0, 0, 0, 0];
    }
    return stressResult.seasons.map((s) => Number(s.loss_pct || 0));
  }, [stressResult]);

  const farm3dBeds = useMemo(() => {
    return CANONICAL_PERIOD_KEYS.map((pKey, i) => {
      const crop = planCrops[i] || 'Fallow';
      const loss = bedLossPcts[i] || 0;
      const sData = stressResult?.seasons?.[i];
      return {
        id: pKey,
        name: crop,
        crop: crop,
        cropLabel: formatSpecificCropName(crop, pKey, lang),
        season: PERIOD_LABELS[pKey][lang === 'bn' ? 'bn' : 'en'],
        periodKey: pKey,
        lossPct: loss,
        isHit: seasonsHit.has(pKey),
        yieldBeforeMon: sData?.yield_before_mon ?? sData?.yield_before_maund,
        yieldAfterMon: sData?.yield_after_mon ?? sData?.yield_after_maund,
      };
    });
  }, [planCrops, bedLossPcts, stressResult, seasonsHit, lang]);

  const summaryData = stressResult?.summary;

  return (
    <div className="climate-stress-workspace" style={{ width: '100%', margin: 0, padding: 0 }}>
      
      {/* Header Banner */}
      <Card variant="glass" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 26 }}>⚡</span>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
                {lang === 'bn' ? '৩. জলবায়ু চাপ পরীক্ষা (Climate Stress Test)' : '3. Climate Stress Test'}
              </h2>
              <GlassBadge variant="cyan">
                {lang === 'bn' ? 'প্রতিকূল আবহাওয়ার প্রভাব' : 'Hazard Impact Model'}
              </GlassBadge>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              {lang === 'bn'
                ? 'আপনার নির্বাচিত ৬-মৌসুম পরিকল্পনার ওপর চরম আবহাওয়ার আর্থিক ও উৎপাদন ঝুঁকি নিরূপণ।'
                : 'Assess financial and yield risks of your chosen 6-season rotation plan under severe weather shocks.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                {lang === 'bn' ? '← মূল পরিকল্পনায় ফিরুন' : '← Back to Planner'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 1. Strategy Selector & 6-Crop Sequence Strip */}
      <Card variant="glass" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--primary)' }}>
              {lang === 'bn' ? 'পরীক্ষাধীন পরিকল্পনা:' : 'Plan Under Stress Test:'}
            </span>
          </div>

          {/* Strategy Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {strategies.map((st) => {
              const isSelected = activeStrategy === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => {
                    setStrategyLocal(st.id);
                    setStoreStrategy(st.id);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)',
                    background: isSelected ? 'var(--primary-subtle, rgba(34, 197, 94, 0.18))' : 'var(--glass-bg)',
                    color: isSelected ? 'var(--primary)' : 'var(--text)',
                  }}
                >
                  <span>{st.icon}</span>
                  <span>{lang === 'bn' ? st.labelBn : st.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 6-Crop Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
          {CANONICAL_PERIOD_KEYS.map((pKey, i) => {
            const crop = planCrops[i] || 'Fallow';
            const isHit = seasonsHit.has(pKey);
            const loss = bedLossPcts[i] || 0;
            const isSelectedBed = selectedBedIndex === i;

            return (
              <div
                key={pKey}
                onClick={() => setSelectedBedIndex(i)}
                style={{
                  background: isSelectedBed ? 'rgba(56, 189, 248, 0.12)' : 'var(--surface-2)',
                  border: isSelectedBed ? '1.5px solid var(--cyan)' : isHit && isPostStress && loss > 0 ? (loss > 30 ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(245, 158, 11, 0.6)') : '1px solid var(--glass-border)',
                  borderRadius: 12,
                  padding: '10px 8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Hit Badge */}
                {isHit && (
                  <span style={{ position: 'absolute', top: 4, right: 6, fontSize: 11 }} title="Hazard Hit">
                    {activeScenario.icon}
                  </span>
                )}
                
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>
                  {PERIOD_LABELS[pKey][lang === 'bn' ? 'bn' : 'en']}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {formatSpecificCropName(crop, pKey, lang)}
                </div>

                {/* Loss indicator if post stress */}
                {isPostStress && isHit && loss > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <span style={{
                      display: 'inline-block',
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: loss > 30 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: loss > 30 ? '#ef4444' : '#f59e0b',
                      border: loss > 30 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                    }}>
                      −{formatDigits(Math.round(loss), lang)}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* 2. Scenario Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {SCENARIOS.map((sc) => {
          const isActive = sc.id === activeScenarioId;
          return (
            <div
              key={sc.id}
              onClick={() => setActiveScenarioId(sc.id)}
              style={{
                background: isActive ? 'var(--surface-2, rgba(255, 255, 255, 0.08))' : 'var(--glass-bg, rgba(255, 255, 255, 0.02))',
                border: isActive ? '2px solid var(--primary, #22c55e)' : '1px solid var(--glass-border)',
                borderRadius: 14,
                padding: '14px 12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 0 16px rgba(34, 197, 94, 0.22)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 22 }}>{sc.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: isActive ? 'var(--primary)' : 'var(--text)' }}>
                  {lang === 'bn' ? sc.nameBn : sc.nameEn}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.35 }}>
                {lang === 'bn' ? sc.impactBn : sc.impactEn}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Intensity & Seasons Hit Controls */}
      <Card variant="glass" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          {/* Intensity Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
              {lang === 'bn' ? 'তীব্রতা:' : 'Intensity:'}
            </span>
            <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 999, padding: 3, border: '1px solid var(--glass-border)' }}>
              {INTENSITIES.map((intObj) => {
                const isCur = activeIntensity === intObj.id;
                return (
                  <button
                    key={intObj.id}
                    onClick={() => setActiveIntensity(intObj.id)}
                    style={{
                      border: 'none',
                      background: isCur ? (intObj.id === 'severe' ? 'rgba(239, 68, 68, 0.85)' : intObj.id === 'moderate' ? 'rgba(245, 158, 11, 0.85)' : 'rgba(34, 197, 94, 0.85)') : 'transparent',
                      color: isCur ? '#ffffff' : 'var(--text-muted)',
                      borderRadius: 999,
                      padding: '4px 14px',
                      fontSize: 12,
                      fontWeight: isCur ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {lang === 'bn' ? intObj.labelBn : intObj.labelEn}
                  </button>
                );
              })}
            </div>
            
            {/* Physical Metric Callout */}
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan)', background: 'rgba(56, 189, 248, 0.12)', padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(56, 189, 248, 0.25)' }}>
              {activeScenario.intensitySpecs[activeIntensity][lang === 'bn' ? 'bn' : 'en']}
            </span>
          </div>

          {/* Hit Seasons Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'আঘাতপ্রাপ্ত মৌসুম:' : 'Seasons Hit:'}
            </span>
            {CANONICAL_PERIOD_KEYS.map((pKey) => {
              const isHit = seasonsHit.has(pKey);
              return (
                <button
                  key={pKey}
                  onClick={() => togglePeriodHit(pKey)}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 6,
                    fontSize: 11,
                    cursor: 'pointer',
                    border: isHit ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                    background: isHit ? 'rgba(34, 197, 94, 0.18)' : 'transparent',
                    color: isHit ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: isHit ? 700 : 400,
                  }}
                >
                  {PERIOD_LABELS[pKey][lang === 'bn' ? 'bn' : 'en']}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* 4. 3D Farm Visualizer with "আগে | পরে" Toggle */}
      <Card variant="glass" style={{ marginBottom: 24, overflow: 'hidden', padding: 0 }}>
        {/* Visualizer Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid var(--glass-border)', background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>🏡</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
              {lang === 'bn' ? '৩ডি ক্ষেত্র প্রভাব ডায়োরামা' : '3D Farm Stress Diorama'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'বেডে ক্লিক করে বিস্তারিত দেখুন' : 'Click bed to inspect impact'}
            </span>
          </div>

          {/* Before | After Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'অবস্থা প্রদর্শন:' : 'View Mode:'}
            </span>
            <div style={{ display: 'inline-flex', background: 'var(--surface)', borderRadius: 999, padding: 2, border: '1px solid var(--glass-border)' }}>
              <button
                onClick={() => setIsPostStress(false)}
                style={{
                  border: 'none',
                  background: !isPostStress ? 'var(--primary)' : 'transparent',
                  color: !isPostStress ? '#ffffff' : 'var(--text-muted)',
                  borderRadius: 999,
                  padding: '4px 14px',
                  fontSize: 12,
                  fontWeight: !isPostStress ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
              >
                {lang === 'bn' ? 'আগে (স্বাভাবিক)' : 'Before (Normal)'}
              </button>
              <button
                onClick={() => setIsPostStress(true)}
                style={{
                  border: 'none',
                  background: isPostStress ? '#ef4444' : 'transparent',
                  color: isPostStress ? '#ffffff' : 'var(--text-muted)',
                  borderRadius: 999,
                  padding: '4px 14px',
                  fontSize: 12,
                  fontWeight: isPostStress ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
              >
                {lang === 'bn' ? 'পরে (চাপগ্রস্ত)' : 'After (Stressed)'}
              </button>
            </div>
          </div>
        </div>

        {/* 3D Scene Container */}
        <div className="stress-test-3d-stage" style={{ position: 'relative', width: '100%', height: 560, borderRadius: 16, overflow: 'hidden' }}>
          <CalculationLoadingOverlay
            active={simLoading}
            isInitialOpen={false}
            mode="stress"
            lang={lang}
            error={simError}
            onRetry={fetchStressSimulation}
          />
          <FarmScene3D
            beds={farm3dBeds}
            selectedBedIndex={selectedBedIndex}
            onBedClick={(idx) => setSelectedBedIndex(idx)}
            weather={{
              event: activeScenarioId,
              intensity: activeIntensity,
              isPostStress: isPostStress,
            }}
            bedLossPcts={isPostStress ? bedLossPcts : [0, 0, 0, 0, 0, 0]}
            lang={lang}
            height={440}
            fieldAreaHa={activeField?.area_ha != null ? Number(activeField.area_ha) : 0.133}
            selectedStrategy={activeStrategy}
          />
        </div>
      </Card>

      {/* Inline Error Card with Retry */}
      {simError && (
        <Card variant="glass" style={{ marginBottom: 20, padding: '16px 20px', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>
                  {lang === 'bn' ? 'সিমুলেশন চালাতে সমস্যা হয়েছে' : 'Failed to simulate climate stress'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {simError}
                </div>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={fetchStressSimulation}>
              {lang === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
            </Button>
          </div>
        </Card>
      )}

      {/* SF2: 3 Big Numbers Summary Strip */}
      {simLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
          <Skeleton height={90} style={{ borderRadius: 14 }} />
          <Skeleton height={90} style={{ borderRadius: 14 }} />
          <Skeleton height={90} style={{ borderRadius: 14 }} />
        </div>
      ) : stressResult ? (() => {
        const totals = stressResult.totals || {};
        const totalYieldLoss = Number(totals.total_yield_loss_pct ?? 0);
        const totalProfitLoss = Number(totals.total_profit_loss_bdt ?? 0);
        const worstSeasonRaw = totals.worst_season || '';

        // Severity Color: >30% red, >10% amber, <=10% green
        const sevColor = totalYieldLoss > 30 ? '#ef4444' : totalYieldLoss > 10 ? '#f59e0b' : '#22c55e';
        const sevBg = totalYieldLoss > 30 ? 'rgba(239, 68, 68, 0.12)' : totalYieldLoss > 10 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(34, 197, 94, 0.12)';
        const sevBorder = totalYieldLoss > 30 ? 'rgba(239, 68, 68, 0.35)' : totalYieldLoss > 10 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(34, 197, 94, 0.35)';

        let worstSeasonDisplay = worstSeasonRaw || (lang === 'bn' ? 'কোনো ক্ষতি নেই' : 'None');
        if (lang === 'bn' && worstSeasonRaw) {
          // Translate common period terms in worst season
          worstSeasonDisplay = worstSeasonRaw
            .replace('Year 1', '১ম বছর')
            .replace('Year 2', '২য় বছর')
            .replace('Rabi', 'রবি')
            .replace('Kharif-1', 'খরিপ-১')
            .replace('Kharif-2', 'খরিপ-২')
            .replace('(Winter)', '(শীতকাল)')
            .replace('(Summer)', '(গ্রীষ্ম)')
            .replace('(Monsoon)', '(বর্ষা)')
            .replace('Mustard', 'সরিষা')
            .replace('Soybean', 'সয়াবিন')
            .replace('Chickpea', 'ছোলা')
            .replace('Rice', 'ধান')
            .replace('Sesame', 'তিল')
            .replace('Wheat', 'গম')
            .replace('Potato', 'আলু')
            .replace('Maize', 'ভুট্টা')
            .replace('Lentil', 'মসুর')
            .replace('Mungbean', 'মুগডাল');
        }

        return (
          <div
            className="stress-summary-strip"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 14,
              marginBottom: 20,
            }}
          >
            {/* 1. Yield Loss */}
            <div
              style={{
                background: sevBg,
                border: `1.5px solid ${sevBorder}`,
                borderRadius: 14,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {lang === 'bn' ? 'ফলন ক্ষতি' : 'Yield Loss'}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: sevColor, marginTop: 4 }}>
                {totalYieldLoss > 0 ? `−${formatDigits(totalYieldLoss.toFixed(1), lang)}%` : (lang === 'bn' ? '০%' : '0%')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {lang === 'bn' ? 'গড় ফলন হ্রাস' : 'Across planned rotation'}
              </div>
            </div>

            {/* 2. Profit Loss */}
            <div
              style={{
                background: sevBg,
                border: `1.5px solid ${sevBorder}`,
                borderRadius: 14,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {lang === 'bn' ? 'আর্থিক ক্ষতি' : 'Profit Loss'}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: sevColor, marginTop: 4 }}>
                {totalProfitLoss > 0 ? `−৳${formatCurrency(totalProfitLoss, lang)}` : (lang === 'bn' ? '৳০' : '৳0')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {lang === 'bn' ? 'নিট মুনাফার মোট ক্ষতি' : 'Total 2-year margin drop'}
              </div>
            </div>

            {/* 3. Worst Season */}
            <div
              style={{
                background: sevBg,
                border: `1.5px solid ${sevBorder}`,
                borderRadius: 14,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {lang === 'bn' ? 'সর্বাধিক ক্ষতিগ্রস্ত মৌসুম' : 'Worst Season'}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginTop: 6, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={worstSeasonDisplay}>
                {worstSeasonDisplay}
              </div>
              <div style={{ fontSize: 11, color: sevColor, marginTop: 4, fontWeight: 600 }}>
                {totals.hit_seasons_count != null ? (
                  lang === 'bn' ? `${formatDigits(totals.hit_seasons_count, lang)}টি মৌসুম আঘাতপ্রাপ্ত` : `${totals.hit_seasons_count} season(s) hit by hazard`
                ) : '—'}
              </div>
            </div>
          </div>
        );
      })() : null}

      {/* 6. Impact Table by Season */}
      <Card variant="glass" style={{ marginBottom: 24, padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              {lang === 'bn' ? 'মৌসুমভিত্তিক প্রভাব বিশ্লেষণ' : 'Season-by-Season Impact Breakdown'}
            </h3>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {lang === 'bn' ? 'সারির ওপর ক্লিক করলে ৩ডি বেড ফোকাস হবে' : 'Click any row to focus that bed in 3D'}
            </div>
          </div>
        </div>

        {simLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 10px' }}>{lang === 'bn' ? 'মৌসুম' : 'Season'}</th>
                  <th style={{ padding: '8px 10px' }}>{lang === 'bn' ? 'ফসল' : 'Crop'}</th>
                  <th style={{ padding: '8px 10px' }}>{lang === 'bn' ? 'ক্ষতির কারণ ও মডেল' : 'Mechanism & Model'}</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>{lang === 'bn' ? 'ফলন (আগে → পরে)' : 'Yield (Before → After)'}</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>{lang === 'bn' ? 'ক্ষতি %' : 'Loss %'}</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>{lang === 'bn' ? 'লাভ (আগে → পরে)' : 'Profit (Before → After)'}</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>{lang === 'bn' ? 'সেচ চাহিদা' : 'Irrigation'}</th>
                </tr>
              </thead>
              <tbody>
                {CANONICAL_PERIOD_KEYS.map((pKey, idx) => {
                  const s = stressResult?.seasons?.[idx];
                  const crop = s?.crop || planCrops[idx] || 'Fallow';
                  const isHit = s ? Boolean(s.hit) : seasonsHit.has(pKey);
                  const loss = Number(s?.loss_pct || 0);
                  const isSelected = selectedBedIndex === idx;

                  const seasonLabel = lang === 'bn'
                    ? (s?.season_label_bn || PERIOD_LABELS[pKey]?.bn || pKey)
                    : (s?.season_label || PERIOD_LABELS[pKey]?.en || pKey);

                  const cropDisplay = formatSpecificCropName(crop, pKey, lang);

                  // Color code: >30% red, >10% amber, <=10% green
                  const rowBg = isSelected
                    ? 'rgba(56, 189, 248, 0.12)'
                    : isHit && loss > 0
                    ? loss > 30
                      ? 'rgba(239, 68, 68, 0.08)'
                      : 'rgba(245, 158, 11, 0.06)'
                    : 'transparent';

                  const badgeBg = loss > 30 ? 'rgba(239, 68, 68, 0.2)' : loss > 10 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(34, 197, 94, 0.2)';
                  const badgeColor = loss > 30 ? '#ef4444' : loss > 10 ? '#f59e0b' : '#22c55e';

                  return (
                    <tr
                      key={pKey}
                      onClick={() => setSelectedBedIndex(idx)}
                      style={{
                        background: rowBg,
                        borderBottom: '1px solid var(--glass-border)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Season */}
                      <td style={{ padding: '10px', fontWeight: 600, color: 'var(--text)' }}>
                        {seasonLabel}
                      </td>

                      {/* Crop */}
                      <td style={{ padding: '10px', fontWeight: 700, color: 'var(--text)' }}>
                        {cropDisplay}
                      </td>

                      {/* Mechanism & Model */}
                      <td style={{ padding: '10px' }}>
                        {isHit ? (
                          <>
                            <div style={{ color: 'var(--text)', fontSize: 12 }}>
                              {lang === 'bn' ? (s?.mechanism_bn || s?.mechanism) : (s?.mechanism_en || s?.mechanism)}
                            </div>
                            {s?.model_basis && (
                              <div style={{ marginTop: 2 }}>
                                <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>
                                  {s.model_basis}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            {lang === 'bn' ? 'প্রভাবিত নয়' : 'Not affected'}
                          </span>
                        )}
                      </td>

                      {/* Yield (Before -> After) */}
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        {s ? (
                          <div>
                            <div>
                              <span style={{ color: 'var(--text)' }}>{formatDigits(s.yield_before_mon ?? s.yield_before_maund, lang)}</span>
                              <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>→</span>
                              <span style={{ fontWeight: 700, color: isHit && loss > 0 ? badgeColor : 'var(--text)' }}>
                                {formatDigits(s.yield_after_mon ?? s.yield_after_maund, lang)}
                              </span>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 3 }}>
                                {lang === 'bn' ? 'মণ/বিঘা' : 'mon/bigha'}
                              </span>
                            </div>
                            {s.yield_before_ton != null && (
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                                {formatDigits(s.yield_before_ton, lang)} → {formatDigits(s.yield_after_ton, lang)} t/ha
                              </div>
                            )}
                          </div>
                        ) : '—'}
                      </td>

                      {/* Loss % */}
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        {isHit && loss > 0 ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontWeight: 800,
                            fontSize: 12,
                            background: badgeBg,
                            color: badgeColor,
                          }}>
                            −{formatDigits(Math.round(loss), lang)}%
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {lang === 'bn' ? '০% (স্বাভাবিক)' : '0% (OK)'}
                          </span>
                        )}
                      </td>

                      {/* Profit (Before -> After) */}
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        {s ? (
                          <div>
                            <div>
                              <span style={{ color: 'var(--text)' }}>{formatCurrency(s.profit_before_bdt, lang)}</span>
                              <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>→</span>
                              <span style={{ fontWeight: 700, color: s.profit_loss_bdt > 0 ? '#ef4444' : 'var(--text)' }}>
                                {formatCurrency(s.profit_after_bdt, lang)}
                              </span>
                            </div>
                            {s.profit_loss_bdt > 0 && (
                              <div style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>
                                −{formatCurrency(s.profit_loss_bdt, lang)}
                              </div>
                            )}
                          </div>
                        ) : '—'}
                      </td>

                      {/* Irrigation */}
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        {s?.irrigation_before_mm != null ? (
                          <div>
                            <span style={{ color: 'var(--text)' }}>{formatDigits(s.irrigation_before_mm, lang)}</span>
                            {s.irrigation_after_mm !== s.irrigation_before_mm && (
                              <>
                                <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>→</span>
                                <span style={{ fontWeight: 700, color: s.irrigation_after_mm > s.irrigation_before_mm ? '#f59e0b' : 'var(--text)' }}>
                                  {formatDigits(s.irrigation_after_mm, lang)}
                                </span>
                              </>
                            )}
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 3 }}>
                              {lang === 'bn' ? 'মিমি' : 'mm'}
                            </span>
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 7. SF2: Mitigations Grouped by Hit Season & Bridge Button */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Mitigation Steps */}
        <Card variant="glass" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
              {lang === 'bn' ? 'কী করতে পারেন (মাঠ-প্রমাণিত কৌশল):' : 'What You Can Do (Field-Tested Mitigations):'}
            </h3>
          </div>

          {simLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton height={60} />
              <Skeleton height={60} />
            </div>
          ) : stressResult?.mitigations && stressResult.mitigations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stressResult.mitigations.map((mGroup, gIdx) => (
                <div
                  key={mGroup.period || gIdx}
                  style={{
                    background: 'var(--surface-2)',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  {/* Season & Crop Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>
                        {lang === 'bn' ? (mGroup.season_label_bn || mGroup.season_label) : (mGroup.season_label || mGroup.season_label_bn)}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>·</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                        {formatSpecificCropName(mGroup.crop, mGroup.period, lang)}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 700, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      {lang === 'bn' ? 'ক্ষতিগ্রস্ত' : 'Stressed'}
                    </span>
                  </div>

                  {/* Bullet Steps */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {mGroup.steps?.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 10,
                          fontSize: 12,
                          lineHeight: 1.4,
                          padding: '4px 0',
                          borderTop: sIdx > 0 ? '1px solid var(--glass-border)' : 'none',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                            {lang === 'bn' ? step.title_bn : step.title_en}:{' '}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {lang === 'bn' ? step.action_bn : step.action_en}
                          </span>
                        </div>
                        {step.source && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: 'var(--surface)',
                              color: 'var(--cyan)',
                              border: '1px solid rgba(56, 189, 248, 0.25)',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                          >
                            {step.source}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : stressResult?.mitigation_steps && stressResult.mitigation_steps.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stressResult.mitigation_steps.map((step, sIdx) => (
                <div key={sIdx} style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 2 }}>
                    {lang === 'bn' ? step.title_bn : step.title_en}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>
                    {lang === 'bn' ? step.text_bn : step.text_en}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, background: 'var(--surface-2)', borderRadius: 12 }}>
              {lang === 'bn'
                ? 'কোনো মৌসুমে জলবায়ু চাপ নেই — স্বাভাবিক ফসল ব্যবস্থাপনা প্রযোজ্য।'
                : 'No seasons affected under this scenario — standard agronomic practices apply.'}
            </div>
          )}
        </Card>

        {/* Bridge Action to Adaptive Replan */}
        <Card variant="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <span style={{ fontSize: 32, marginBottom: 10 }}>🔄</span>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
            {lang === 'bn' ? 'এই পরিস্থিতিতে বাকি পরিকল্পনা বদলাতে চান?' : 'Want to re-plan the remaining seasons?'}
          </h4>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 16px 0' }}>
            {lang === 'bn'
              ? 'চরম আবহাওয়ার অভিঘাতের পর বাকি মৌসুমগুলোর ফসল পুনর্বিন্যাস করতে অভিযোজিত পুনঃপরিকল্পনা ব্যবহার করুন।'
              : 'Use Adaptive Replan to safely optimize the next seasons given the recorded weather stress.'}
          </p>

          <Button
            variant="primary"
            onClick={() => {
              if (onNavigateTab) {
                onNavigateTab('replan', {
                  strategy: activeStrategy,
                  hazard: lang === 'bn' ? activeScenario.nameBn : activeScenario.nameEn,
                  hazardId: activeScenario.id,
                  intensity: activeIntensity,
                  intensityLabel: activeScenario.intensitySpecs[activeIntensity][lang === 'bn' ? 'bn' : 'en'],
                  stressResult,
                });
              }
            }}
            style={{ width: '100%' }}
          >
            {lang === 'bn'
              ? 'অভিযোজিত পুনঃপরিকল্পনায় যান →'
              : 'Go to Adaptive Replan →'}
          </Button>
        </Card>
      </div>

    </div>
  );
}

export default ClimateStressTestView;
