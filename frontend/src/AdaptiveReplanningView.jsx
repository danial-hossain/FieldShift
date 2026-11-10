// frontend/src/AdaptiveReplanningView.jsx
// Adaptive Next-Season Replanning with feedback calibration & MILP optimizer (R4, R5, R6)
// Matches design reference in docs/replan_layout_reference.html

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { FarmScene3D } from './three/FarmScene3D.jsx';
import { request as defaultRequest } from './apiClient.js';
import { formatCurrency, cropLabel, seasonLabel, monthLabel, districtLabel, soilLabel, unitLabel, formatNumber } from './i18n.js';
import { useRotationPlans, extractPlanCrops, setAppliedReplan } from './store/rotationPlansStore.js';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export function toBnDigits(val) {
  if (val == null) return '';
  return String(val).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

export function fmtNum(val, lang = 'bn', decimals = 0) {
  if (val == null || isNaN(val)) return '—';
  return formatNumber(val, lang, decimals);
}

const CROP_TRANSLATIONS = {
  Mustard: 'সরিষা',
  Lentil: 'মসুর ডাল',
  Chickpea: 'ছোলা',
  Wheat: 'গম',
  'Boro Rice': 'বোরো ধান',
  'T. Aman Rice': 'আমন ধান',
  Rice: 'আমন ধান',
  'Aus Rice': 'আউশ ধান',
  Mungbean: 'মুগ ডাল',
  Potato: 'আলু',
  Tomato: 'টমেটো',
  Maize: 'ভুট্টা',
  Jute: 'পাট',
  Sunflower: 'সূর্যমুখী',
  Sesame: 'তিল',
  Groundnut: 'চীনাবাদাম',
  Soybean: 'সয়াবিন',
  Fallow: 'পতিত',
};

const SEASON_ALLOWED_CROPS = {
  rabi: ['Tomato', 'Mustard', 'Chickpea', 'Wheat', 'Boro Rice', 'Lentil', 'Potato', 'Maize', 'Sunflower', 'Sesame', 'Soybean', 'Groundnut', 'Fallow'],
  kharif1: ['Mungbean', 'Jute', 'Aus Rice', 'Sesame', 'Maize', 'Soybean', 'Groundnut', 'Fallow'],
  kharif2: ['Rice', 'T. Aman Rice', 'Fallow'],
};

const SEASONS_CONFIG = [
  { id: 'Y1_S1', yBn: '১ম বছর', sBn: 'রবি', mBn: 'নভে–এপ্রি', yEn: 'Year 1', sEn: 'Rabi', mEn: 'Nov–Apr', kind: 'rabi' },
  { id: 'Y1_S2', yBn: '১ম বছর', sBn: 'খরিফ-১', mBn: 'এপ্রি–জুন', yEn: 'Year 1', sEn: 'Kharif-1', mEn: 'Apr–Jun', kind: 'kharif1' },
  { id: 'Y1_S3', yBn: '১ম বছর', sBn: 'খরিফ-২', mBn: 'জুলাই–অক্টো', yEn: 'Year 1', sEn: 'Kharif-2', mEn: 'Jul–Oct', kind: 'kharif2' },
  { id: 'Y2_S1', yBn: '২য় বছর', sBn: 'রবি', mBn: 'নভে–এপ্রি', yEn: 'Year 2', sEn: 'Rabi', mEn: 'Nov–Apr', kind: 'rabi' },
  { id: 'Y2_S2', yBn: '২য় বছর', sBn: 'খরিফ-১', mBn: 'এপ্রি–জুন', yEn: 'Year 2', sEn: 'Kharif-1', mEn: 'Apr–Jun', kind: 'kharif1' },
  { id: 'Y2_S3', yBn: '২য় বছর', sBn: 'খরিফ-২', mBn: 'জুলাই–অক্টো', yEn: 'Year 2', sEn: 'Kharif-2', mEn: 'Jul–Oct', kind: 'kharif2' },
];

export function AdaptiveReplanningView({
  activeField,
  analysisResult,
  request: propRequest,
  onNavigateTab,
  onBack,
  lang = 'bn',
  stressContext,
}) {
  const request = typeof propRequest === 'function' ? propRequest : defaultRequest;

  // Single source of truth for rotation plans across strategies
  const {
    plansByPriority,
    loading: plansLoading,
    error: plansError,
    selectedPriority,
    bestPriority,
    bestReason,
    identicalStrategyNote,
    setSelectedStrategy,
    refetch: refetchPlans,
  } = useRotationPlans({ field: activeField, lang, request });

  // 1. Strategy Selection (bound to shared store)
  const strategy = selectedPriority;

  // Current plan for chosen strategy
  const currentPlan = plansByPriority?.[strategy] || analysisResult;
  const plannerCrops = useMemo(() => {
    return extractPlanCrops(currentPlan);
  }, [currentPlan]);

  const cropSeasonMatrix = useMemo(() => {
    const pData = currentPlan?.summary?.planning || currentPlan;
    const ssr = pData?.selected_strategy_result || pData?.milp_status;
    const dam = ssr?.dynamic_agronomic_matrix;
    return dam?.crop_season_matrix || pData?.crop_season_matrix || {};
  }, [currentPlan]);

  // 2. Finished seasons count (1 to 5)
  const [finishedCount, setFinishedCount] = useState(1);

  // 3. Finished seasons records state: array of 5 entries with no hardcoded fallback crops
  const [seasonRows, setSeasonRows] = useState([
    { crop: '', yieldMb: '', priceMb: '', outcome: 'normal', parts: [], showParts: false, userEditedCrop: false },
    { crop: '', yieldMb: '', priceMb: '', outcome: 'normal', parts: [], showParts: false, userEditedCrop: false },
    { crop: '', yieldMb: '', priceMb: '', outcome: 'normal', parts: [], showParts: false, userEditedCrop: false },
    { crop: '', yieldMb: '', priceMb: '', outcome: 'normal', parts: [], showParts: false, userEditedCrop: false },
    { crop: '', yieldMb: '', priceMb: '', outcome: 'normal', parts: [], showParts: false, userEditedCrop: false },
  ]);

  useEffect(() => {
    if (plannerCrops && Array.isArray(plannerCrops)) {
      setSeasonRows((prev) =>
        prev.map((r, i) => ({
          ...r,
          crop: r.userEditedCrop ? r.crop : (plannerCrops[i] || ''),
        }))
      );
    }
  }, [plannerCrops]);

  // SF4: Pre-fill finished seasons when loaded from Climate Stress Test
  useEffect(() => {
    if (stressContext?.stressResult?.seasons && Array.isArray(stressContext.stressResult.seasons)) {
      const sArr = stressContext.stressResult.seasons;
      const hitIndices = sArr.slice(0, 5).map((s, idx) => (s.hit ? idx + 1 : 0)).filter(Boolean);
      const targetCount = hitIndices.length > 0 ? Math.max(...hitIndices) : 1;
      setFinishedCount(Math.min(5, Math.max(1, targetCount)));

      setSeasonRows((prev) =>
        prev.map((r, i) => {
          const s = sArr[i];
          if (!s) return r;
          const stressedYield = s.yield_after_mon ?? s.yield_after_maund;
          return {
            ...r,
            crop: s.crop || r.crop || (plannerCrops && plannerCrops[i]) || '',
            yieldMb: stressedYield != null ? String(stressedYield) : r.yieldMb,
            outcome: s.hit ? 'low_yield' : 'normal',
            userEditedCrop: true,
          };
        })
      );
      setIsDirty(true);
    }
  }, [stressContext, plannerCrops]);

  // 4. Irrigation selector for remaining seasons
  const defaultIrrigClass = useMemo(() => {
    const raw = String(activeField?.irrigation_class || activeField?.irrigation_capacity_mm || '').toLowerCase();
    if (raw === 'rainfed' || raw === 'none' || raw === '0' || raw === '০') return 'rainfed';
    if (raw === 'limited' || raw === '400' || raw === '৪০০') return 'limited';
    return 'full';
  }, [activeField]);

  const [irrigationClass, setIrrigationClass] = useState(defaultIrrigClass);

  // Dirty state flag
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [replanData, setReplanData] = useState(null);
  const [selectedBed, setSelectedBed] = useState(0);

  // RL Second Opinion State (R6)
  const [rlDecision, setRlDecision] = useState(null);
  const [appliedNotice, setAppliedNotice] = useState(null);

  const stageBoxRef = useRef(null);

  // Execute Replan Call
  const handleRunReplan = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    setAppliedNotice(null);

    const completedPayload = [];
    for (let i = 0; i < finishedCount; i++) {
      const row = seasonRows[i];
      const seasonConfig = SEASONS_CONFIG[i];

      const item = {
        period: seasonConfig.id,
        crop: row.crop,
        outcome: row.outcome || 'normal',
      };

      if (row.parts && row.parts.length > 0) {
        item.parts = row.parts.map((p) => ({
          crop: p.crop,
          areaShare: Number(p.share || 1) / 100,
          yield_maund_bigha: p.yieldMb ? Number(p.yieldMb) : undefined,
          sale_price_bdt_maund: p.priceMb ? Number(p.priceMb) : undefined,
        }));
      } else {
        if (row.yieldMb && !isNaN(Number(row.yieldMb))) {
          item.yield_maund_bigha = Number(row.yieldMb);
        }
        if (row.priceMb && !isNaN(Number(row.priceMb))) {
          item.sale_price_bdt_maund = Number(row.priceMb);
        }
      }
      completedPayload.push(item);
    }

    const payload = {
      field_id: activeField?.id || 'demo',
      district: activeField?.district || 'chapai_nawabganj',
      latitude: activeField?.latitude || 24.62,
      longitude: activeField?.longitude || 88.55,
      area_ha: activeField?.area_ha || 0.67,
      field_size_ha: activeField?.area_ha || 0.67,
      soil_texture: activeField?.soil_texture || 'clay_loam',
      priority: strategy,
      water_availability: irrigationClass,
      irrigation_class: irrigationClass,
      completed_seasons: completedPayload,
    };

    try {
      const resp = await request('/api/workflow/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (resp && resp.status === 'ok') {
        setReplanData(resp);
        setIsDirty(false);

        // Fetch RL second opinion if season index > 0
        try {
          const realSoil = activeField?.soil_health_score != null ? Number(activeField.soil_health_score) : undefined;
          const rlPayload = {
            field_id: activeField?.id || 'demo',
            season_index: finishedCount,
            strategy_id: strategy,
            field_area_ha: activeField?.area_ha || 0.67,
            state: {
              temperature_c: 26.5,
              available_water_mm: (irrigationClass === 'rainfed' || irrigationClass === 'none') ? 0 : irrigationClass === 'limited' ? 400 : 1200,
              ...(realSoil != null ? { soil_health_score: realSoil } : {}),
            },
            initial_state: {
              temperature_c: 26.5,
              available_water_mm: 1200,
              ...(realSoil != null ? { soil_health_score: realSoil } : {}),
            },
            completed_seasons: completedPayload.map((c, idx) => ({
              season_id: idx,
              applied_action: c.crop,
              outcome: c.outcome,
            })),
            milp_reference_rotation: resp.new_plan?.sequence || plannerCrops,
          };
          const rlResp = await request('/api/rl/decision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rlPayload),
          });
          if (rlResp?.decision) {
            setRlDecision(rlResp.decision);
          } else {
            setRlDecision(null);
          }
        } catch {
          setRlDecision(null);
        }

        // Scroll to 3D view
        if (stageBoxRef.current) {
          stageBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        setErrorMsg(resp?.detail || (lang === 'bn' ? 'পুনঃপরিকল্পনা করতে ত্রুটি হয়েছে।' : 'Failed to recalculate replan.'));
      }
    } catch (err) {
      setErrorMsg(err.message || (lang === 'bn' ? 'সার্ভার যোগাযোগ ব্যর্থ হয়েছে।' : 'Server communication failed.'));
    } finally {
      setLoading(false);
    }
  }, [finishedCount, seasonRows, strategy, irrigationClass, activeField, request, plannerCrops, lang]);

  // Initial calculation on mount
  useEffect(() => {
    handleRunReplan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update a season row field
  const updateSeasonRow = (idx, field, val) => {
    setIsDirty(true);
    setSeasonRows((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        [field]: val,
        ...(field === 'crop' ? { userEditedCrop: true } : {}),
      };
      return next;
    });
  };

  // Example scenario pre-fill buttons
  const applyExample = (type) => {
    setIsDirty(true);
    if (type === 'good') {
      setFinishedCount(1);
      setIrrigationClass('full');
      setSeasonRows((prev) => {
        const next = [...prev];
        next[0] = { ...next[0], crop: 'Mustard', yieldMb: '7', priceMb: '3000', outcome: 'normal', parts: [], showParts: false };
        return next;
      });
    } else if (type === 'bad') {
      setFinishedCount(2);
      setIrrigationClass('full');
      setSeasonRows((prev) => {
        const next = [...prev];
        next[0] = { ...next[0], crop: 'Mustard', yieldMb: '3', priceMb: '2400', outcome: 'poor', parts: [], showParts: false };
        next[1] = { ...next[1], crop: 'Mungbean', yieldMb: '2', priceMb: '4200', outcome: 'normal', parts: [], showParts: false };
        return next;
      });
    } else if (type === 'split') {
      setFinishedCount(2);
      setIrrigationClass('full');
      setSeasonRows((prev) => {
        const next = [...prev];
        next[0] = {
          ...next[0],
          crop: 'Mustard',
          yieldMb: '6.5',
          priceMb: '3000',
          outcome: 'normal',
          showParts: true,
          parts: [
            { crop: 'Mustard', share: 60, yieldMb: '6.5', priceMb: '3000' },
            { crop: 'Chickpea', share: 40, yieldMb: '2.0', priceMb: '4000' },
          ],
        };
        next[1] = { ...next[1], crop: 'Mungbean', yieldMb: '3.5', priceMb: '4500', outcome: 'normal', parts: [], showParts: false };
        return next;
      });
    } else if (type === 'dry') {
      setFinishedCount(1);
      setIrrigationClass('none');
      setSeasonRows((prev) => {
        const next = [...prev];
        next[0] = { ...next[0], crop: 'Mustard', yieldMb: '7', priceMb: '3000', outcome: 'normal', parts: [], showParts: false };
        return next;
      });
    }
  };

  // 3D Scene Beds mapping
  const sceneBeds = useMemo(() => {
    if (!replanData?.seasonal_comparison) {
      return SEASONS_CONFIG.map((s, i) => {
        const crop = plannerCrops?.[i] || '';
        const csmEntry = cropSeasonMatrix?.[s.id]?.[crop];
        const planIrrigMm = csmEntry?.water_balance?.irrigation_required_mm != null
          ? Math.round(Number(csmEntry.water_balance.irrigation_required_mm))
          : 0;
        const isDone = i < finishedCount;
        return {
          id: s.id,
          label: lang === 'bn' ? s.sBn : s.sEn,
          crop: isDone ? (seasonRows[i]?.crop || crop) : crop,
          isCompleted: isDone,
          isChanged: false,
          yieldLabel: null,
          waterDepthMm: isDone ? 0 : planIrrigMm,
          irrigation_mm: isDone ? 0 : planIrrigMm,
        };
      });
    }

    return replanData.seasonal_comparison.map((s, i) => {
      const isDone = s.stage === 'completed';
      const isChg = Boolean(s.is_modified && !isDone);
      const yieldTxt = s.yield_maund_bigha != null && s.yield_maund_bigha > 0 ? (lang === 'bn' ? `${toBnDigits(s.yield_maund_bigha)} মণ/বিঘা` : `${s.yield_maund_bigha} maund/bigha`) : null;
      const irrigVal = isDone ? 0 : (s.water_mm || 0);

      return {
        id: s.period,
        label: lang === 'bn' ? SEASONS_CONFIG[i].sBn : SEASONS_CONFIG[i].sEn,
        crop: s.actual_or_replanned_crop || plannerCrops?.[i] || '',
        crop_bn: s.actual_or_replanned_crop_bn || s.actual_or_replanned_crop,
        isCompleted: isDone,
        isChanged: isChg,
        yieldLabel: yieldTxt,
        waterDepthMm: irrigVal,
        irrigation_mm: irrigVal,
      };
    });
  }, [replanData, finishedCount, plannerCrops, cropSeasonMatrix, seasonRows, lang]);

  const totals = replanData?.totals || {};
  const whyChangedList = lang === 'bn' ? (replanData?.why_changed || []) : (replanData?.why_changed_en || replanData?.why_changed || []);
  const calibrationTable = replanData?.calibration_table || [];

  return (
    <div className="adaptive-replan-root" style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 20px', color: 'var(--text, #1b261d)' }}>
      {/* Top Breadcrumb & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="ui-btn ui-btn-ghost ui-btn-sm"
            >
              ← {lang === 'bn' ? 'ফিরে যান' : 'Back'}
            </button>
          )}
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text)' }}>
            {lang === 'bn' ? `অভিযোজিত পুনঃপরিকল্পনা · ${activeField?.name || 'রহিম মিয়ার জমি'}` : `Adaptive Replan · ${activeField?.name || 'Rahim Farm'}`}
          </h1>
          <div style={{ fontSize: 13, color: 'var(--muted, #5e6b60)', marginTop: 4 }}>
            {activeField?.district ? districtLabel(activeField.district, lang) : (lang === 'bn' ? 'চাঁপাইনবাবগঞ্জ' : 'Chapainawabganj')} · {fmtNum(activeField?.area_ha ? activeField.area_ha / 0.13378 : 5, lang, 1)} {unitLabel('bigha', lang)} ·{' '}
            {activeField?.soil_texture ? soilLabel(activeField.soil_texture, lang) : (lang === 'bn' ? 'এঁটেল দোআঁশ' : 'Clay Loam')} · NASA POWER + GPM IMERG
          </div>
        </div>
        <div style={{ background: 'var(--surface-2, rgba(255,255,255,0.06))', border: '1px solid var(--line, #dfe6dc)', padding: '6px 12px', borderRadius: 10, fontSize: 12, color: 'var(--muted, #5e6b60)' }}>
          {lang === 'bn' ? 'ফিডব্যাক ক্যালিব্রেশন + MILP শাখা-সীমাবদ্ধ সমাধান' : 'Feedback Calibration + MILP Branch-and-Bound'}
        </div>
      </div>

      {/* SF4: One-line Note when Loaded from Stress Test */}
      {stressContext && (
        <div
          className="stress-loaded-note"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 16px',
            borderRadius: 10,
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1.5px solid rgba(56, 189, 248, 0.35)',
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--cyan)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚡</span>
            <span>
              {(() => {
                const hName = stressContext.hazard || 'Drought';
                const iName = stressContext.intensity ? (stressContext.intensity.charAt(0).toUpperCase() + stressContext.intensity.slice(1)) : 'Moderate';
                return lang === 'bn'
                  ? `চাপ পরীক্ষা থেকে লোড করা: ${hName} (${iName})`
                  : `Loaded from stress test: ${hName} (${iName})`;
              })()}
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
            {lang === 'bn' ? 'ক্ষতিগ্রস্ত ফলন স্বয়ংক্রিয়ভাবে পূরণ করা হয়েছে' : 'Stressed yields populated into finished seasons'}
          </span>
        </div>
      )}

      {/* 3 Step Guidance Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
          marginBottom: 18,
          background: 'var(--surface-2, rgba(255, 255, 255, 0.04))',
          padding: 12,
          borderRadius: 12,
          border: '1px solid var(--line, #dfe6dc)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <b style={{ background: 'var(--accent, #2c8a4b)', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{lang === 'bn' ? '১' : '1'}</b>
          <span style={{ fontSize: 13 }}>{lang === 'bn' ? 'পরিকল্পনা বাছুন (আবর্তন পরিকল্পনা থেকে আসে)' : '1 Choose Strategy (from Rotation Planner)'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <b style={{ background: 'var(--accent, #2c8a4b)', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{lang === 'bn' ? '২' : '2'}</b>
          <span style={{ fontSize: 13 }}>{lang === 'bn' ? 'যে মৌসুম শেষ হয়েছে, তার আসল ফলন আর দাম দিন (১–৫টা)' : '2 Log actual yield & price for finished seasons (1–5)'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <b style={{ background: 'var(--accent, #2c8a4b)', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{lang === 'bn' ? '৩' : '3'}</b>
          <span style={{ fontSize: 13 }}>{lang === 'bn' ? 'বাকি মৌসুমের নতুন পরিকল্পনা ও কারণ দেখুন' : '3 View adapted plan for remaining seasons'}</span>
        </div>
      </div>

      {/* Strategy Segments & Current Sequence Strip */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          <div role="group" aria-label="Strategy" style={{ display: 'inline-flex', background: 'var(--surface-2, rgba(0,0,0,0.05))', padding: 4, borderRadius: 10, border: '1px solid var(--line, #dfe6dc)' }}>
            {[
              { id: 'balanced', labelBn: 'সুষম', labelEn: 'Balanced' },
              { id: 'profit', labelBn: 'লাভ', labelEn: 'Profit' },
              { id: 'water', labelBn: 'পানি সাশ্রয়', labelEn: 'Water Saving' },
              { id: 'soil', labelBn: 'মাটির স্বাস্থ্য', labelEn: 'Soil Health' },
            ].map((st) => {
              const isBest = st.id === bestPriority;
              const label = (lang === 'bn' ? st.labelBn : st.labelEn) + (isBest ? ' ⭐' : '');
              return (
                <button
                  key={st.id}
                  onClick={() => {
                    setSelectedStrategy(st.id);
                    setIsDirty(true);
                  }}
                  style={{
                    background: strategy === st.id ? 'var(--accent)' : 'transparent',
                    color: strategy === st.id ? 'var(--accent-ink)' : 'var(--text)',
                    border: 0,
                    borderRadius: 7,
                    padding: '6px 12px',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <span style={{ fontSize: 12.5, color: 'var(--muted, #5e6b60)' }}>
            {lang === 'bn' ? 'আবর্তন পরিকল্পনার নির্বাচিত কৌশল।' : 'Selected rotation strategy from planner.'}
          </span>
        </div>

        {/* Best Strategy Explanation Line */}
        {bestReason && (
          <div style={{ marginBottom: 10, fontSize: 12.5, color: 'var(--leaf-dark, #237841)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
            <span>{bestReason}</span>
          </div>
        )}

        {/* Identical Strategy Parity Note */}
        {identicalStrategyNote && (
          <div style={{ marginBottom: 10, fontSize: 12.5, color: 'var(--text-2, #5e6b60)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>ℹ️ {identicalStrategyNote}</span>
          </div>
        )}

        {/* 6 crops baseline sequence strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            gap: 6,
            background: 'var(--surface-2, rgba(255,255,255,0.03))',
            padding: 8,
            borderRadius: 10,
            border: '1px solid var(--line, #dfe6dc)',
          }}
        >
          {plansLoading ? (
            <div style={{ gridColumn: 'span 6', padding: '12px 0', textAlign: 'center', color: 'var(--muted, #5e6b60)' }}>
              {lang === 'bn' ? 'লোড হচ্ছে…' : 'Loading rotation plan…'}
            </div>
          ) : plansError ? (
            <div style={{ gridColumn: 'span 6', padding: '8px 0', textAlign: 'center', color: 'var(--danger, #e11d48)' }}>
              <span>{plansError}</span>
              <span style={{ marginLeft: 8 }}>
                <button
                  type="button"
                  onClick={refetchPlans}
                  className="ui-btn ui-btn-secondary ui-btn-sm"
                >
                  {lang === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
                </button>
              </span>
            </div>
          ) : (
            SEASONS_CONFIG.map((sc, i) => {
              const crop = plannerCrops?.[i];
              return (
                <div key={sc.id} style={{ fontSize: 12, padding: '4px 6px', textAlign: 'center', background: 'var(--surface, #ffffff)', borderRadius: 6, border: '1px solid var(--line, #dfe6dc)' }}>
                  <div style={{ color: 'var(--muted, #5e6b60)', fontSize: 10.5 }}>{lang === 'bn' ? `${sc.sBn} (${sc.mBn})` : `${sc.sEn} (${sc.mEn})`}</div>
                  <strong style={{ display: 'block', marginTop: 2, fontSize: 12.5 }}>
                    {crop ? cropLabel(crop, lang) : (lang === 'bn' ? 'তথ্য নেই' : 'No data')}
                  </strong>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Interaction Card: Finished Seasons & Feedback */}
      <section
        style={{
          background: 'var(--surface, #ffffff)',
          border: '1px solid var(--line, #dfe6dc)',
          borderRadius: 16,
          padding: '16px 20px',
          marginBottom: 20,
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 10px', color: 'var(--text)' }}>
          {lang === 'bn' ? 'কয়টা মৌসুম শেষ হয়েছে?' : 'How many seasons have finished?'}
        </h2>

        {/* 5 count buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {[
            { count: 1, labelBn: '১টা রবি', labelEn: '1 Rabi' },
            { count: 2, labelBn: '২টা + খরিফ-১', labelEn: '2 + Kharif-1' },
            { count: 3, labelBn: '৩টা + খরিফ-২', labelEn: '3 + Kharif-2' },
            { count: 4, labelBn: '৪টা + ২য় বছর রবি', labelEn: '4 + Year 2 Rabi' },
            { count: 5, labelBn: '৫টা + খরিফ-১', labelEn: '5 + Kharif-1' },
          ].map((btn) => (
            <button
              key={btn.count}
              onClick={() => {
                setFinishedCount(btn.count);
                setIsDirty(true);
              }}
              style={{
                background: finishedCount === btn.count ? 'var(--accent)' : 'var(--surface-2, rgba(0,0,0,0.04))',
                color: finishedCount === btn.count ? 'var(--accent-ink)' : 'var(--text)',
                border: '1px solid var(--line, #dfe6dc)',
                borderRadius: 9,
                padding: '7px 14px',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {lang === 'bn' ? btn.labelBn : btn.labelEn}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 12.5, color: 'var(--muted, #5e6b60)', margin: '0 0 14px' }}>
          {lang === 'bn'
            ? 'প্রতিটা মৌসুমে কী চাষ করেছেন, কত ফলন হয়েছে আর কত দামে বিক্রি করেছেন দিন। ফসল আগে থেকে পরিকল্পনা অনুযায়ী বসানো থাকে; অন্য কিছু করলে বদলে দিন। ⋯ চাপলে জমি ভাগ আর ফলাফল (খারাপ/নষ্ট)।'
            : 'Enter actual harvest yield and sale price. Default crop reflects original plan; change if you planted something else. ⋯ opens field split & harvest outcome.'}
        </p>

        {/* Finished Season Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SEASONS_CONFIG.slice(0, finishedCount).map((season, idx) => {
            const row = seasonRows[idx] || {};
            const planCrop = plannerCrops?.[idx];
            const allowedBase = SEASON_ALLOWED_CROPS[season.kind] || [];
            const allowedCrops = [...allowedBase];
            if (planCrop && !allowedCrops.includes(planCrop)) {
              allowedCrops.unshift(planCrop);
            }
            if (row.crop && !allowedCrops.includes(row.crop)) {
              allowedCrops.unshift(row.crop);
            }
            const currentSeasonCrop = row.crop || planCrop || allowedCrops[0];
            const matrixEntry = currentSeasonCrop ? cropSeasonMatrix?.[season.id]?.[currentSeasonCrop] : null;

            let yieldPlaceholder = lang === 'bn' ? 'ফলন দিন' : 'Enter yield';
            if (matrixEntry?.dynamic_yield_t_ha != null) {
              const yMb = (matrixEntry.dynamic_yield_t_ha * 3.5846731).toFixed(1);
              yieldPlaceholder = lang === 'bn' ? `মডেল: ${toBnDigits(yMb)}` : `Model: ${yMb}`;
            }

            let pricePlaceholder = lang === 'bn' ? 'দাম দিন' : 'Enter price';
            if (matrixEntry?.market_price_bdt_t != null) {
              const pMb = Math.round(matrixEntry.market_price_bdt_t * 0.03732);
              pricePlaceholder = lang === 'bn'
                ? `ক্যাটালগ: ${toBnDigits(pMb.toLocaleString('en-US'))}`
                : `Catalog: ${pMb.toLocaleString('en-US')}`;
            }

            return (
              <div
                key={season.id}
                style={{
                  background: 'var(--surface-2, rgba(255,255,255,0.04))',
                  border: '1px solid var(--line, #dfe6dc)',
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(130px, 1.2fr) minmax(110px, 1fr) minmax(110px, 1fr) 42px', gap: 10, alignItems: 'center' }}>
                  {/* Season Name */}
                  <div>
                    <strong style={{ fontSize: 13, display: 'block', color: 'var(--text)' }}>
                      {lang === 'bn' ? `${season.yBn} ${season.sBn}` : `${season.yEn} ${season.sEn}`}
                    </strong>
                    <span style={{ fontSize: 11.5, color: 'var(--muted, #5e6b60)' }}>
                      {lang === 'bn' ? season.mBn : season.mEn}
                    </span>
                  </div>

                  {/* Crop Select */}
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--muted, #5e6b60)', display: 'block', marginBottom: 2 }}>
                      {lang === 'bn' ? 'কী চাষ করেছেন' : 'Planted Crop'}
                    </label>
                    <select
                      value={row.crop || planCrop || ''}
                      onChange={(e) => updateSeasonRow(idx, 'crop', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: '1px solid var(--line, #dfe6dc)',
                        background: 'var(--surface, #ffffff)',
                        color: 'var(--text)',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {allowedCrops.map((c) => (
                        <option key={c} value={c}>
                          {cropLabel(c, lang)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Yield Input */}
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--muted, #5e6b60)', display: 'block', marginBottom: 2 }}>
                      {lang === 'bn' ? 'ফলন (মণ/বিঘা)' : 'Yield (maund/bigha)'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder={yieldPlaceholder}
                      value={row.yieldMb}
                      onChange={(e) => updateSeasonRow(idx, 'yieldMb', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: '1px solid var(--line, #dfe6dc)',
                        background: 'var(--surface, #ffffff)',
                        color: 'var(--text)',
                        fontSize: 13,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Price Input */}
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--muted, #5e6b60)', display: 'block', marginBottom: 2 }}>
                      {lang === 'bn' ? 'দাম (টাকা/মণ)' : 'Price (BDT/maund)'}
                    </label>
                    <input
                      type="number"
                      step="50"
                      placeholder={pricePlaceholder}
                      value={row.priceMb}
                      onChange={(e) => updateSeasonRow(idx, 'priceMb', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: '1px solid var(--line, #dfe6dc)',
                        background: 'var(--surface, #ffffff)',
                        color: 'var(--text)',
                        fontSize: 13,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Details Toggle Button */}
                  <div style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => updateSeasonRow(idx, 'showParts', !row.showParts)}
                      title={lang === 'bn' ? 'জমি ভাগ ও ফলাফল' : 'Split parts & outcome'}
                      style={{
                        background: row.showParts ? 'var(--accent, #2c8a4b)' : 'var(--surface, #fff)',
                        color: row.showParts ? '#fff' : 'var(--text)',
                        border: '1px solid var(--line, #dfe6dc)',
                        borderRadius: 8,
                        width: 36,
                        height: 32,
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      ⋯
                    </button>
                  </div>
                </div>

                {/* Expanded Details: Field Split & Outcome Chips */}
                {row.showParts && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--line, #dfe6dc)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                        {lang === 'bn' ? 'জমি ভাগ করে (২-৩ ফসল)' : 'Split Field (2-3 parts)'}
                      </span>
                      <button
                        onClick={() => {
                          const currentParts = row.parts || [];
                          if (currentParts.length >= 3) return;
                          const nextParts = currentParts.length === 0
                            ? [
                                { crop: row.crop || 'Mustard', share: 60, yieldMb: row.yieldMb || '', priceMb: row.priceMb || '' },
                                { crop: 'Chickpea', share: 40, yieldMb: '', priceMb: '' },
                              ]
                            : [...currentParts, { crop: 'Chickpea', share: 20, yieldMb: '', priceMb: '' }];
                          updateSeasonRow(idx, 'parts', nextParts);
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--line, #dfe6dc)',
                          borderRadius: 6,
                          padding: '3px 8px',
                          fontSize: 11,
                          cursor: 'pointer',
                          color: 'var(--accent, #2c8a4b)',
                          fontWeight: 600,
                        }}
                      >
                        + {lang === 'bn' ? 'ভাগ যোগ করুন' : 'Add Split Part'}
                      </button>
                    </div>

                    {/* Split Parts Rows */}
                    {row.parts && row.parts.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                        {row.parts.map((p, pIdx) => (
                          <div key={pIdx} style={{ display: 'grid', gridTemplateColumns: '80px 1.2fr 1fr 1fr 30px', gap: 8, alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={p.share}
                                onChange={(e) => {
                                  const nextParts = [...row.parts];
                                  nextParts[pIdx].share = Number(e.target.value);
                                  updateSeasonRow(idx, 'parts', nextParts);
                                }}
                                style={{ width: 44, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12 }}
                              />
                              <span style={{ fontSize: 12 }}>%</span>
                            </div>
                            <select
                              value={p.crop}
                              onChange={(e) => {
                                const nextParts = [...row.parts];
                                nextParts[pIdx].crop = e.target.value;
                                updateSeasonRow(idx, 'parts', nextParts);
                              }}
                              style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12 }}
                            >
                              {allowedCrops.map((c) => (
                                <option key={c} value={c}>{cropLabel(c, lang)}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              step="0.1"
                              placeholder={lang === 'bn' ? 'ফলন' : 'Yield'}
                              value={p.yieldMb}
                              onChange={(e) => {
                                const nextParts = [...row.parts];
                                nextParts[pIdx].yieldMb = e.target.value;
                                updateSeasonRow(idx, 'parts', nextParts);
                              }}
                              style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12 }}
                            />
                            <input
                              type="number"
                              step="50"
                              placeholder={lang === 'bn' ? 'দাম' : 'Price'}
                              value={p.priceMb}
                              onChange={(e) => {
                                const nextParts = [...row.parts];
                                nextParts[pIdx].priceMb = e.target.value;
                                updateSeasonRow(idx, 'parts', nextParts);
                              }}
                              style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12 }}
                            />
                            <button
                              onClick={() => {
                                const nextParts = row.parts.filter((_, i) => i !== pIdx);
                                updateSeasonRow(idx, 'parts', nextParts);
                              }}
                              style={{ background: 'transparent', border: 0, color: 'var(--bad, #b4532a)', cursor: 'pointer', fontWeight: 700 }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Outcome Chips */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--muted, #5e6b60)' }}>
                        {lang === 'bn' ? 'ফসল কেমন হয়েছে:' : 'Outcome:'}
                      </span>
                      {[
                        { id: 'normal', labelBn: 'স্বাভাবিক', labelEn: 'Normal' },
                        { id: 'poor', labelBn: 'খারাপ (ফলন কম)', labelEn: 'Poor' },
                        { id: 'failed', labelBn: 'নষ্ট (ফসলহানি)', labelEn: 'Failed' },
                      ].map((chip) => (
                        <button
                          key={chip.id}
                          onClick={() => updateSeasonRow(idx, 'outcome', chip.id)}
                          style={{
                            background: row.outcome === chip.id ? 'var(--accent, #2c8a4b)' : 'transparent',
                            color: row.outcome === chip.id ? '#fff' : 'var(--text)',
                            border: '1px solid var(--line, #dfe6dc)',
                            borderRadius: 6,
                            padding: '3px 8px',
                            fontSize: 11.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {lang === 'bn' ? chip.labelBn : chip.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Irrigation Capacity Selector (R2e) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
          <b style={{ fontSize: 13, color: 'var(--text)' }}>
            💧 {lang === 'bn' ? 'সেচ সুবিধা (বাকি মৌসুমে):' : 'Irrigation Availability (Remaining):'}
          </b>
          <div style={{ display: 'inline-flex', gap: 6 }}>
            {[
              { id: 'full', labelBn: 'পর্যাপ্ত (১২০০ মিমি)', labelEn: 'Full (1200 mm)' },
              { id: 'limited', labelBn: 'সীমিত (৪০০ মিমি)', labelEn: 'Limited (400 mm)' },
              { id: 'rainfed', labelBn: 'বৃষ্টিনির্ভর (০ মিমি)', labelEn: 'Rainfed (0 mm)' },
            ].map((ir) => {
              const isSelected = irrigationClass === ir.id || (ir.id === 'rainfed' && irrigationClass === 'none') || (ir.id === 'full' && irrigationClass === 'ample');
              return (
                <button
                  key={ir.id}
                  onClick={() => {
                    setIrrigationClass(ir.id);
                    setIsDirty(true);
                  }}
                  style={{
                    background: isSelected ? 'var(--accent)' : 'var(--surface-2, rgba(0,0,0,0.04))',
                    color: isSelected ? 'var(--accent-ink)' : 'var(--text)',
                    border: '1px solid var(--line, #dfe6dc)',
                    borderRadius: 8,
                    padding: '5px 12px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'bn' ? ir.labelBn : ir.labelEn}
                </button>
              );
            })}
          </div>
          <span style={{ fontSize: 12, color: 'var(--muted, #5e6b60)' }}>
            {lang === 'bn' ? `জমির ডিফল্ট: ${defaultIrrigClass === 'full' ? 'পর্যাপ্ত' : defaultIrrigClass === 'limited' ? 'সীমিত' : 'নেই'}` : `Field default: ${defaultIrrigClass === 'full' ? 'Ample' : defaultIrrigClass === 'limited' ? 'Limited' : 'None'}`}
          </span>
        </div>

        {/* Calculate Button & Dirty State Notice */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleRunReplan}
            disabled={loading}
            className="ui-btn ui-btn-primary ui-btn-md"
          >
            {loading ? '⏳ ...' : '🔄'} {lang === 'bn' ? 'বাকি মৌসুমের পরিকল্পনা আবার করুন' : 'Re-optimize Remaining Seasons'}
          </button>

          {isDirty && (
            <span style={{ fontSize: 13, color: 'var(--chg, #d9822b)', fontWeight: 700 }}>
              ⚠️ {lang === 'bn' ? 'তথ্য বদলেছে, আবার হিসাব করুন' : 'Inputs changed, please re-calculate'}
            </span>
          )}

          {errorMsg && (
            <span style={{ fontSize: 12.5, color: 'var(--bad, #b4532a)' }}>
              {errorMsg}
            </span>
          )}
        </div>

        {/* Example Presets Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--muted, #5e6b60)' }}>
            {lang === 'bn' ? 'উদাহরণ চালান:' : 'Run Example:'}
          </span>
          <button type="button" onClick={() => applyExample('good')} className="ui-btn ui-btn-secondary ui-btn-xs">
            {lang === 'bn' ? 'সরিষা ভালো হয়েছে' : 'Mustard Harvest Good'}
          </button>
          <button type="button" onClick={() => applyExample('bad')} className="ui-btn ui-btn-secondary ui-btn-xs">
            {lang === 'bn' ? 'সরিষা খারাপ হয়েছে' : 'Mustard Yield Poor'}
          </button>
          <button type="button" onClick={() => applyExample('split')} className="ui-btn ui-btn-secondary ui-btn-xs">
            {lang === 'bn' ? 'জমি ভাগ করে চাষ' : 'Split Plot Planting'}
          </button>
          <button type="button" onClick={() => applyExample('dry')} className="ui-btn ui-btn-secondary ui-btn-xs">
            {lang === 'bn' ? 'সেচ নেই হলে' : 'No Irrigation Available'}
          </button>
        </div>
      </section>

      {/* 3D Farm Viewer (R5) */}
      <div
        ref={stageBoxRef}
        style={{
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid var(--line, #dfe6dc)',
          height: 480,
          background: 'var(--surface-2, #cfdcc4)',
          marginBottom: 20,
        }}
      >
        <FarmScene3D
          beds={sceneBeds}
          selectedBedIndex={selectedBed}
          onBedClick={(idx) => setSelectedBed(idx)}
          fieldAreaHa={activeField?.area_ha || 0.67}
          fieldName={activeField?.name || (lang === 'bn' ? 'রহিম মিয়ার জমি' : 'Rahim Farm')}
          annualIrrigationMm={totals.annual_irrigation_new_mm}
          lang={lang}
          height={480}
        />

        {/* Legend */}
        <div
          style={{
            position: 'absolute',
            left: 12,
            bottom: 12,
            background: 'rgba(255, 255, 255, 0.92)',
            color: '#1b261d',
            borderRadius: 10,
            padding: '5px 10px',
            fontSize: 12,
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <span style={{ color: '#2c8a4b', fontWeight: 800 }}>✓</span> {lang === 'bn' ? 'শেষ হয়েছে (আসল ফসল)' : 'Finished (actual)'} ·{' '}
          <span style={{ color: '#c46818', fontWeight: 800 }}>{lang === 'bn' ? '⟳ নতুন' : '⟳ New'}</span> {lang === 'bn' ? 'নতুন পরিকল্পনা' : 'Adapted Plan'}
        </div>
      </div>

      {/* Results Section (R4 & R6) */}
      {replanData && (
        <section
          style={{
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--line, #dfe6dc)',
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          }}
        >
          {/* Before -> After 6 Season Timeline Strip */}
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 10px', color: 'var(--text)' }}>
            {lang === 'bn' ? '৬ মৌসুমের নতুন আবর্তন ধারা (Before → After)' : '6-Season Sequence (Before → After)'}
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
              gap: 8,
              marginBottom: 16,
            }}
          >
            {SEASONS_CONFIG.map((sc, i) => {
              const origCrop = replanData.original_plan?.sequence?.[i] || plannerCrops[i];
              const newCrop = replanData.new_plan?.sequence?.[i] || origCrop;
              const isFinished = i < finishedCount;
              const isChanged = !isFinished && origCrop !== newCrop;

              return (
                <div
                  key={sc.id}
                  style={{
                    background: isFinished ? 'rgba(44,138,75,0.08)' : 'var(--surface-2, rgba(0,0,0,0.03))',
                    border: isChanged ? '2px solid var(--chg, #d9822b)' : '1px solid var(--line, #dfe6dc)',
                    borderRadius: 10,
                    padding: '8px 10px',
                    fontSize: 12.5,
                  }}
                >
                  <div style={{ color: 'var(--muted, #5e6b60)', fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{lang === 'bn' ? sc.sBn : sc.sEn}</span>
                    {isFinished && <span style={{ color: 'var(--accent, #2c8a4b)', fontWeight: 800 }}>✓</span>}
                  </div>
                  {isFinished ? (
                    <strong style={{ display: 'block', marginTop: 3, fontSize: 13, color: 'var(--text)' }}>
                      {cropLabel(newCrop, lang)}
                    </strong>
                  ) : isChanged ? (
                    <div style={{ marginTop: 3 }}>
                      <s style={{ color: 'var(--muted, #5e6b60)', fontSize: 11.5 }}>
                        {cropLabel(origCrop, lang)}
                      </s>{' '}
                      →{' '}
                      <strong style={{ color: 'var(--chg, #d9822b)', fontSize: 13 }}>
                        {cropLabel(newCrop, lang)}
                      </strong>
                    </div>
                  ) : (
                    <strong style={{ display: 'block', marginTop: 3, fontSize: 13, color: 'var(--text)' }}>
                      {cropLabel(newCrop, lang)}
                    </strong>
                  )}
                </div>
              );
            })}
          </div>

          {/* 4 Financial & Irrigation Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              marginBottom: 18,
            }}
          >
            {/* 1. Actual profit so far */}
            <div style={{ background: 'var(--surface-2, rgba(0,0,0,0.03))', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)' }}>
              <span style={{ fontSize: 12, color: 'var(--muted, #5e6b60)', display: 'block' }}>
                {lang === 'bn' ? 'এ পর্যন্ত আসল লাভ' : 'Profit So Far (Actual)'}
              </span>
              <strong style={{ fontSize: 17, color: 'var(--text)' }}>
                {formatCurrency(totals.profit_so_far_actual_bdt || 0, lang)}
              </strong>
            </div>

            {/* 2. Projected remaining */}
            <div style={{ background: 'var(--surface-2, rgba(0,0,0,0.03))', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)' }}>
              <span style={{ fontSize: 12, color: 'var(--muted, #5e6b60)', display: 'block' }}>
                {lang === 'bn' ? 'বাকি মৌসুমের প্রক্ষেপণ' : 'Projected Remaining'}
              </span>
              <strong style={{ fontSize: 17, color: 'var(--text)' }}>
                {formatCurrency(totals.profit_remaining_projected_bdt || 0, lang)}
              </strong>
            </div>

            {/* 3. 2-year total vs original */}
            <div style={{ background: 'var(--surface-2, rgba(0,0,0,0.03))', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)' }}>
              <span style={{ fontSize: 12, color: 'var(--muted, #5e6b60)', display: 'block' }}>
                {lang === 'bn' ? '২ বছরের মোট (আগের চেয়ে)' : '2-Year Total (vs Original)'}
              </span>
              <strong style={{ fontSize: 17, color: 'var(--text)' }}>
                {formatCurrency(totals.total_2year_profit_bdt || 0, lang)}
              </strong>{' '}
              <em
                style={{
                  fontStyle: 'normal',
                  fontSize: 12,
                  fontWeight: 700,
                  color: totals.profit_delta_bdt >= 0 ? 'var(--good, #2c8a4b)' : 'var(--bad, #b4532a)',
                }}
              >
                ({totals.profit_delta_bdt >= 0 ? '+' : ''}{formatCurrency(totals.profit_delta_bdt || 0, lang)})
              </em>
            </div>

            {/* 4. Irrigation old -> new */}
            <div style={{ background: 'var(--surface-2, rgba(0,0,0,0.03))', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)' }}>
              <span style={{ fontSize: 12, color: 'var(--muted, #5e6b60)', display: 'block' }}>
                {lang === 'bn' ? 'বাকি মৌসুমে সেচ' : 'Remaining Irrigation'}
              </span>
              <strong style={{ fontSize: 17, color: 'var(--text)' }}>
                {fmtNum(totals.remaining_irrigation_old_mm, lang)} → {fmtNum(totals.remaining_irrigation_new_mm, lang)} {lang === 'bn' ? 'মিমি' : 'mm'}
              </strong>{' '}
              <em
                style={{
                  fontStyle: 'normal',
                  fontSize: 12,
                  fontWeight: 700,
                  color: totals.irrigation_delta_mm <= 0 ? 'var(--good, #2c8a4b)' : 'var(--bad, #b4532a)',
                }}
              >
                ({totals.irrigation_delta_mm > 0 ? '+' : ''}{fmtNum(totals.irrigation_delta_mm, lang)})
              </em>
            </div>
          </div>

          {/* Two Columns: Why Changed vs What Was Learned */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
            {/* Left: Why Changed */}
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 10px', color: 'var(--text)' }}>
                {lang === 'bn' ? 'কেন বদলাল?' : 'Why Did It Change?'}
              </h3>
              {whyChangedList.length > 0 ? (
                <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, lineHeight: 1.5 }}>
                  {whyChangedList.map((reason, rIdx) => (
                    <li key={rIdx}>{reason}</li>
                  ))}
                </ol>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--muted, #5e6b60)' }}>
                  {lang === 'bn' ? 'পরিকল্পনায় কোনো পরিবর্তন হয়নি।' : 'No changes in the schedule.'}
                </p>
              )}
            </div>

            {/* Right: What Was Learned from Farmer Records */}
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 10px', color: 'var(--text)' }}>
                🧠 {lang === 'bn' ? 'আপনার মাঠ থেকে কী শিখল' : 'What Was Learned from Your Field'}
              </h3>

              {calibrationTable.length > 0 ? (
                <div style={{ overflowX: 'auto', marginBottom: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--line, #dfe6dc)', color: 'var(--muted, #5e6b60)', textAlign: 'left' }}>
                        <th style={{ padding: '4px 6px' }}>{lang === 'bn' ? 'ফসল' : 'Crop'}</th>
                        <th style={{ padding: '4px 6px', textAlign: 'right' }}>{lang === 'bn' ? 'মডেল ফলন' : 'Model Yield'}</th>
                        <th style={{ padding: '4px 6px', textAlign: 'right' }}>{lang === 'bn' ? 'আপনার' : 'Actual'}</th>
                        <th style={{ padding: '4px 6px', textAlign: 'right' }}>{lang === 'bn' ? 'অনুপাত' : 'Ratio'}</th>
                        <th style={{ padding: '4px 6px', textAlign: 'right' }}>{lang === 'bn' ? 'দাম ধরা' : 'Price'}</th>
                        <th style={{ padding: '4px 6px', textAlign: 'center' }}>{lang === 'bn' ? 'মৌসুম' : 'Records'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calibrationTable.map((cal, cIdx) => (
                        <tr key={cIdx} style={{ borderBottom: '1px solid var(--line, #dfe6dc)' }}>
                          <td style={{ padding: '6px' }}>
                            <strong>{cropLabel(cal.crop, lang)}</strong>
                            {cal.is_uncertain && (
                              <span style={{ display: 'block', fontSize: 10, color: 'var(--chg, #d9822b)', fontWeight: 600 }}>
                                {lang === 'bn' ? cal.uncertainty_badge_bn : cal.uncertainty_badge_en}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '6px', textAlign: 'right' }}>{fmtNum(cal.model_yield_maund_bigha, lang, 1)}</td>
                          <td style={{ padding: '6px', textAlign: 'right' }}>{fmtNum(cal.actual_yield_maund_bigha, lang, 1)}</td>
                          <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700, color: cal.ratio < 1.0 ? 'var(--bad, #b4532a)' : 'var(--good, #2c8a4b)' }}>
                            {Math.round(cal.ratio * 100)}%
                          </td>
                          <td style={{ padding: '6px', textAlign: 'right' }}>
                            {lang === 'bn' ? '৳' : 'BDT '}{fmtNum(cal.price_bdt_maund, lang)}
                            <span style={{ display: 'block', fontSize: 9.5, color: 'var(--muted, #5e6b60)' }}>
                              {lang === 'bn' ? cal.price_source : cal.price_source_en}
                            </span>
                          </td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>{fmtNum(cal.record_count, lang)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--muted, #5e6b60)', marginBottom: 8 }}>
                  {lang === 'bn' ? 'ফলন আর দাম দিলে এখানে দেখাবে।' : 'Log actual harvest yield and price to calibrate.'}
                </p>
              )}

              <p style={{ fontSize: 11.5, color: 'var(--muted, #5e6b60)', margin: '4px 0 10px', lineHeight: 1.4 }}>
                {lang === 'bn'
                  ? 'ফলন মণ/বিঘায়। একই ফসল পরে এলে এই অনুপাতে ফলন ধরা হয় (৫০–১৫০% সীমা)। নষ্ট হলে ঐ ফসলের ফলন ৭০% ধরা হয়।'
                  : 'Yield in maund/bigha. Ratio applies to same crop in subsequent seasons (50-150% clamp). Crop failure applies 70% factor.'}
              </p>

              {/* Honest RL Label (R6) */}
              <div
                style={{
                  background: 'var(--surface-2, rgba(0,0,0,0.03))',
                  border: '1px solid var(--line, #dfe6dc)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontSize: 12,
                  color: 'var(--text)',
                  marginBottom: 12,
                }}
              >
                <b>ℹ️ {lang === 'bn' ? 'পদ্ধতি প্রকাশ (Methodology):' : 'Methodology Disclosure:'}</b>{' '}
                {lang === 'bn'
                  ? 'প্রতি মৌসুমের ফলাফল থেকে শেখা (feedback calibration) + MILP দিয়ে বাকি মৌসুম পুনঃঅপ্টিমাইজ। শেষ হওয়া মৌসুম আটকানো থাকে।'
                  : 'Learning from each season’s outcome (feedback calibration) + MILP re-optimization of remaining seasons with finished seasons locked.'}
              </div>

              {/* Optional RL Second Opinion Card (R6) */}
              {rlDecision && (
                <div
                  style={{
                    background: 'rgba(92, 194, 126, 0.08)',
                    border: '1px solid rgba(92, 194, 126, 0.3)',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: 12,
                    marginBottom: 12,
                  }}
                >
                  <strong style={{ color: 'var(--good, #2c8a4b)', display: 'block', marginBottom: 2 }}>
                    🤖 {lang === 'bn' ? 'RL পলিসির পরামর্শ (পরের মৌসুম - দ্বিতীয় মতামত)' : 'RL Policy Recommendation (Next Season - Second Opinion)'}
                  </strong>
                  <span>
                    {lang === 'bn' ? 'প্রস্তাবিত ফসল:' : 'Proposed Action:'}{' '}
                    <b>{cropLabel(rlDecision.rl_proposed_action, lang)}</b>
                  </span>
                  <div style={{ fontSize: 10.5, color: 'var(--muted, #5e6b60)', marginTop: 4 }}>
                    {lang === 'bn' ? 'উৎস: সিন্থেটিক সিমুলেশন পরিবেশে প্রশিক্ষিত Q-লার্নিং পলিসি' : 'Source: Synthetic Simulation Environment Q-Learning Policy'} (<code>src/rl/crop_rotation_rl.py:19</code>)
                  </div>
                </div>
              )}

              {/* Apply to Rotation Plan Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <button
                  onClick={() => {
                    const confirmIrrig = window.confirm(
                      lang === 'bn'
                        ? 'পরিকল্পনা প্রয়োগ করা হবে। জমির সেচ সুবিধাও আপডেট করবেন?'
                        : 'Plan will be updated. Update field irrigation capacity as well?'
                    );
                    setAppliedReplan(activeField?.id, strategy, {
                      fieldId: activeField?.id || 'demo',
                      strategy,
                      appliedAt: new Date().toISOString(),
                      finishedCount,
                      seasonRows: seasonRows.slice(0, finishedCount),
                      seasonal_comparison: replanData?.seasonal_comparison,
                      new_plan: replanData?.new_plan,
                      original_plan: replanData?.original_plan,
                      totals: replanData?.totals,
                      why_changed: replanData?.why_changed,
                      why_changed_en: replanData?.why_changed_en,
                    });
                    setAppliedNotice(
                      lang === 'bn'
                        ? `✅ আবর্তন পরিকল্পনা পাতায় এই নতুন পরিকল্পনা সফলভাবে প্রয়োগ করা হয়েছে! (সেচ আপডেট: ${confirmIrrig ? 'হ্যাঁ' : 'না'})`
                        : `✅ Successfully applied adapted plan to rotation planner! (Irrigation updated: ${confirmIrrig ? 'Yes' : 'No'})`
                    );
                  }}
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--accent-ink)',
                    border: 0,
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(44,138,75,0.2)',
                  }}
                >
                  ✅ {lang === 'bn' ? 'পরিকল্পনায় প্রয়োগ করুন' : 'Apply to Rotation Plan'}
                </button>

                {appliedNotice && (
                  <span style={{ fontSize: 12.5, color: 'var(--good, #2c8a4b)', fontWeight: 700 }}>
                    {appliedNotice}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default AdaptiveReplanningView;
