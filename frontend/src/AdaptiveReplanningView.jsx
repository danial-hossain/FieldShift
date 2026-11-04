// frontend/src/AdaptiveReplanningView.jsx
// Adaptive Next-Season Replanning with 3D Field Diorama & Multi-Part Field Splits (G2 Architecture)

import React, { useState, useEffect, useMemo } from 'react';
import { FarmScene3D } from './three/FarmScene3D.jsx';
import { CropIllustration } from './ui/CropIllustration.jsx';
import { formatNumber as defaultFormatNumber } from './marketUtils.js';
import { request as defaultRequest } from './apiClient.js';
import { formatCurrency } from './i18n.js';

export function AdaptiveReplanningView({
  activeField,
  analysisResult,
  request: propRequest,
  formatNumber: propFormatNumber,
  onNavigateTab,
  onBack,
  lang = 'bn',
}) {
  const request = typeof propRequest === 'function' ? propRequest : defaultRequest;
  const formatNumber = typeof propFormatNumber === 'function' ? propFormatNumber : defaultFormatNumber;

  // 1. Initial Strategy Selection (Requirement G2)
  const [selectedStrategy, setSelectedStrategy] = useState('balanced');

  // 2. Season Split Mode & Parts
  const [splitMode, setSplitMode] = useState('split'); // 'single' or 'split'
  const [singleCrop, setSingleCrop] = useState('Mustard');
  const [singleYield, setSingleYield] = useState('1.5');

  const [parts, setParts] = useState([
    { id: 1, crop: 'Mustard', areaShare: 0.6, yield_t_ha: 1.6 },
    { id: 2, crop: 'Lentil', areaShare: 0.4, yield_t_ha: 1.2 },
  ]);

  const [waterAppliedMm, setWaterAppliedMm] = useState('120');
  const [outcome, setOutcome] = useState('normal'); // 'normal' | 'poor' | 'failed'

  // Updated Soil & Environmental Measurements
  const [updatedSoilPh, setUpdatedSoilPh] = useState('6.8');
  const [updatedOm, setUpdatedOm] = useState('2.2');
  const [updatedIrrig, setUpdatedIrrig] = useState('400');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [replanData, setReplanData] = useState(null);

  const cropChoices = [
    'Mustard', 'Lentil', 'Wheat', 'Potato', 'Boro Rice',
    'Mungbean', 'Sesame', 'Aus Rice', 'T. Aman Rice', 'Maize', 'Fallow'
  ];

  // Validate that area shares sum to 100%
  const totalSharePct = useMemo(() => {
    if (splitMode === 'single') return 100;
    return Math.round(parts.reduce((sum, p) => sum + (Number(p.areaShare) || 0), 0) * 100);
  }, [splitMode, parts]);

  const handleUpdatePart = (idx, field, val) => {
    setParts(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleAddPart = () => {
    if (parts.length >= 3) return;
    setParts(prev => [...prev, { id: Date.now(), crop: 'Wheat', areaShare: 0.2, yield_t_ha: 1.8 }]);
  };

  const handleRemovePart = (idx) => {
    if (parts.length <= 1) return;
    setParts(prev => prev.filter((_, i) => i !== idx));
  };

  // Replan Execution
  const executeReplan = async () => {
    setLoading(true);
    setError('');
    try {
      const formattedParts = splitMode === 'split'
        ? parts.map(p => ({
            crop: p.crop,
            areaShare: Number(p.areaShare) || 0,
            yield_t_ha: Number(p.yield_t_ha) || 1.5,
          }))
        : [{ crop: singleCrop, areaShare: 1.0, yield_t_ha: Number(singleYield) || 1.5 }];

      const payload = {
        field_id: activeField?.id || 'demo',
        district: activeField?.district || 'bogura',
        field_size_ha: activeField?.area_ha || 1.0,
        area_ha: activeField?.area_ha || 1.0,
        priority: selectedStrategy,
        completed_seasons: [
          {
            period: 'Y1_S1',
            crop: formattedParts[0]?.crop || 'Mustard',
            parts: formattedParts,
            water_applied_mm: Number(waterAppliedMm) || 100,
            outcome,
          }
        ],
        updated_field_conditions: {
          soil_ph: updatedSoilPh ? parseFloat(updatedSoilPh) : undefined,
          organic_matter: updatedOm ? parseFloat(updatedOm) : undefined,
          available_water_mm: updatedIrrig ? parseFloat(updatedIrrig) : undefined,
        }
      };

      const res = await request('/api/workflow/replan', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res && res.status === 'ok') {
        setReplanData(res);
      } else {
        throw new Error(res?.detail || 'Failed to re-optimize');
      }
    } catch (err) {
      setError(err.message || 'Replanning failed');
    } finally {
      setLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    executeReplan();
  }, [selectedStrategy]);

  // 3D Scene Beds mapping for Adaptive Replan
  const replan3dBeds = useMemo(() => {
    if (replanData?.seasonal_comparison) {
      return replanData.seasonal_comparison.map(s => {
        const isCompleted = s.stage === 'completed';
        return {
          id: s.period,
          label: s.period,
          crop: s.actual_or_replanned_crop || 'Mustard',
          season: s.period_label,
          waterDepthMm: isCompleted ? Number(waterAppliedMm) : (s.water_mm || 80),
          growthStage: isCompleted ? 1.0 : 0.85,
          stress: {
            heat: outcome === 'poor',
            drought: outcome === 'failed',
          }
        };
      });
    }

    // Default 6 beds
    const currentPartsCrop = splitMode === 'split'
      ? parts.map(p => `${p.crop} (${Math.round(p.areaShare * 100)}%)`).join(' + ')
      : singleCrop;

    return [
      { id: 'Y1_S1', label: 'Y1 Rabi (Completed)', crop: currentPartsCrop, waterDepthMm: Number(waterAppliedMm), growthStage: 1.0 },
      { id: 'Y1_S2', label: 'Y1 Kharif-1', crop: 'Mungbean', waterDepthMm: 60, growthStage: 0.85 },
      { id: 'Y1_S3', label: 'Y1 Kharif-2', crop: 'T. Aman Rice', waterDepthMm: 350, growthStage: 0.85 },
      { id: 'Y2_S1', label: 'Y2 Rabi', crop: 'Wheat', waterDepthMm: 140, growthStage: 0.85 },
      { id: 'Y2_S2', label: 'Y2 Kharif-1', crop: 'Sesame', waterDepthMm: 50, growthStage: 0.85 },
      { id: 'Y2_S3', label: 'Y2 Kharif-2', crop: 'T. Aman Rice', waterDepthMm: 350, growthStage: 0.85 },
    ];
  }, [replanData, splitMode, parts, singleCrop, waterAppliedMm, outcome]);

  const planChange = replanData?.plan_change || {
    old_sequence: ['Wheat', 'Groundnut', 'Tomato', 'Mungbean', 'Maize', 'Groundnut'],
    new_sequence: ['Mustard (60%) + Lentil (40%)', 'Groundnut', 'Maize', 'Groundnut', 'Tomato', 'Groundnut'],
    changed_periods: ['Y1_S1', 'Y2_S1', 'Y2_S2'],
    profit_delta_bdt: 220400,
    water_delta_mm: -230,
    nitrogen_delta_kg: 35.0,
  };

  return (
    <div className="adaptive-replan-workspace" style={{ padding: '8px 0 32px 0', maxWidth: 1400, margin: '0 auto', color: 'var(--text)' }}>
      {/* 1. Header & Sub-Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--leaf)' }}>🔄 {lang === 'bn' ? 'অভিযোজিত পুনঃপরিকল্পনা' : 'Adaptive Next-Season Replan'}</span>
            <span style={{ color: 'var(--text-3)' }}>•</span>
            <span style={{ fontSize: 13, color: 'var(--water)', fontWeight: 600 }}>{activeField?.name || 'খামার প্লট'}</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
            {lang === 'bn' ? 'বাস্তব মাঠ অভিজ্ঞতা ও বিভক্ত প্লট ভিত্তিক নতুন আবর্তন' : 'Dynamic Replanning with Observed Harvest & Split Field Parts'}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{ background: 'var(--surface-2, rgba(255,255,255,0.05))', border: '1px solid var(--line)', borderRadius: 8, padding: '7px 14px', color: 'var(--text)', fontSize: 12.5, cursor: 'pointer' }}
            >
              ← {lang === 'bn' ? 'আবর্তন পরিকল্পনায় ফিরুন' : 'Back to Planner'}
            </button>
          )}
          <button
            type="button"
            onClick={executeReplan}
            disabled={loading}
            style={{ background: 'var(--primary, #10b981)', border: 'none', borderRadius: 8, padding: '7px 16px', color: '#ffffff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            {loading ? (lang === 'bn' ? 'সলভার চলছে...' : 'Solving...') : (lang === 'bn' ? '🔄 পুনঃপরিকল্পনা চালান' : '🔄 Run Next-Season Replan')}
          </button>
        </div>
      </div>

      {/* 2. Strategy Switcher (Requirement G2) */}
      <div style={{ background: 'var(--surface-2, rgba(255, 255, 255, 0.03))', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)' }}>
            🎯 {lang === 'bn' ? 'প্রারম্ভিক কৌশল (Starting Strategy):' : 'Starting Strategy:'}
          </span>
          {[
            { id: 'balanced', labelBn: 'ভারসাম্যপূর্ণ', labelEn: 'Balanced' },
            { id: 'profit', labelBn: 'সর্বোচ্চ লাভ', labelEn: 'Profit' },
            { id: 'water_efficiency', labelBn: 'পানি সাশ্রয়ী', labelEn: 'Water Saving' },
            { id: 'soil_health', labelBn: 'মাটি স্বাস্থ্য', labelEn: 'Soil Health' },
          ].map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedStrategy(s.id)}
              style={{
                background: selectedStrategy === s.id ? 'var(--primary, #10b981)' : 'transparent',
                color: selectedStrategy === s.id ? '#ffffff' : 'var(--text)',
                border: selectedStrategy === s.id ? '1px solid var(--primary, #10b981)' : '1px solid var(--line)',
                borderRadius: 8,
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {lang === 'bn' ? s.labelBn : s.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Season Just Completed Form (1 crop or 2-3 parts split) */}
      <div style={{ background: 'var(--surface-2, rgba(255, 255, 255, 0.03))', border: '1px solid var(--line)', borderRadius: 14, padding: 18, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14, borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
              📝 {lang === 'bn' ? 'সদ্য সমাপ্ত মৌসুমের বাস্তব রেকর্ড (Season that just happened)' : 'Recorded Outcome for Just-Completed Season (Y1 Rabi)'}
            </h3>
            <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
              {lang === 'bn' ? 'সম্পূর্ণ জমিতে ১টি ফসল অথবা ২-৩ অংশে বিভক্ত ফসলের চাষ ইনপুট দিন' : 'Enter 1 primary crop or split field into 2-3 parts with distinct crops'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setSplitMode('single')}
              style={{
                background: splitMode === 'single' ? 'var(--primary, #10b981)' : 'transparent',
                color: splitMode === 'single' ? '#fff' : 'var(--text)',
                border: '1px solid var(--line)',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {lang === 'bn' ? '১টি একক ফসল' : 'Single Crop'}
            </button>
            <button
              type="button"
              onClick={() => setSplitMode('split')}
              style={{
                background: splitMode === 'split' ? 'var(--primary, #10b981)' : 'transparent',
                color: splitMode === 'split' ? '#fff' : 'var(--text)',
                border: '1px solid var(--line)',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {lang === 'bn' ? '২-৩ অংশে বিভক্ত প্লট' : 'Split Parts (2-3)'}
            </button>
          </div>
        </div>

        {/* Inputs row */}
        {splitMode === 'single' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                {lang === 'bn' ? 'রোপিত ফসল' : 'Crop Planted'}:
              </label>
              <select
                value={singleCrop}
                onChange={e => setSingleCrop(e.target.value)}
                style={{ width: '100%', background: 'var(--surface-2, #1a2228)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 8, padding: '7px 10px', fontSize: 12.5 }}
              >
                {cropChoices.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                {lang === 'bn' ? 'ফলন (t/ha)' : 'Yield (t/ha)'}:
              </label>
              <input
                type="number"
                step="0.1"
                value={singleYield}
                onChange={e => setSingleYield(e.target.value)}
                style={{ width: '100%', background: 'var(--surface-2, #1a2228)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 8, padding: '7px 10px', fontSize: 12.5 }}
              />
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
              {parts.map((p, idx) => (
                <div key={p.id || idx} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--water)', minWidth: 60 }}>
                    {lang === 'bn' ? `অংশ ${idx + 1}:` : `Part ${idx + 1}:`}
                  </span>
                  <select
                    value={p.crop}
                    onChange={e => handleUpdatePart(idx, 'crop', e.target.value)}
                    style={{ flex: 1.5, background: 'var(--surface-2, #1a2228)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 6, padding: '6px 8px', fontSize: 12 }}
                  >
                    {cropChoices.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="0.9"
                      value={p.areaShare}
                      onChange={e => handleUpdatePart(idx, 'areaShare', parseFloat(e.target.value))}
                      style={{ width: 64, background: 'var(--surface-2, #1a2228)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 6, padding: '6px 8px', fontSize: 12 }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>({Math.round((p.areaShare || 0) * 100)}%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                    <input
                      type="number"
                      step="0.1"
                      value={p.yield_t_ha}
                      onChange={e => handleUpdatePart(idx, 'yield_t_ha', parseFloat(e.target.value))}
                      style={{ width: 64, background: 'var(--surface-2, #1a2228)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 6, padding: '6px 8px', fontSize: 12 }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>t/ha</span>
                  </div>
                  {parts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePart(idx)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--alert)', fontSize: 14, cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {parts.length < 3 && (
                <button
                  type="button"
                  onClick={handleAddPart}
                  style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 6, padding: '4px 10px', color: 'var(--water)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  + {lang === 'bn' ? 'আরেকটি অংশ যোগ করুন (সর্বোচ্চ ৩)' : 'Add Another Split Part (Max 3)'}
                </button>
              )}
              <span style={{ fontSize: 11.5, fontWeight: 700, color: totalSharePct === 100 ? 'var(--leaf)' : 'var(--alert)' }}>
                {lang === 'bn' ? `মোট অংশ: ${totalSharePct}%` : `Total Area Share: ${totalSharePct}%`} {totalSharePct !== 100 ? '(১০০% হতে হবে)' : '✓'}
              </span>
            </div>
          </div>
        )}

        {/* Inputs row 2: Irrigation & Harvest Outcome */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
              {lang === 'bn' ? 'প্রকৃত প্রদত্ত সেচ (মিমি)' : 'Actual Water Applied (mm)'}:
            </label>
            <input
              type="number"
              value={waterAppliedMm}
              onChange={e => setWaterAppliedMm(e.target.value)}
              placeholder="e.g. 120"
              style={{ width: '100%', background: 'var(--surface-2, #1a2228)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 8, padding: '7px 10px', fontSize: 12.5 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
              {lang === 'bn' ? 'ফলনের ফলাফল' : 'Season Harvest Outcome'}:
            </label>
            <select
              value={outcome}
              onChange={e => setOutcome(e.target.value)}
              style={{ width: '100%', background: 'var(--surface-2, #1a2228)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 8, padding: '7px 10px', fontSize: 12.5 }}
            >
              <option value="normal">{lang === 'bn' ? 'স্বাভাবিক ফলন (Normal)' : 'Normal Outcome'}</option>
              <option value="poor">{lang === 'bn' ? 'দুর্বল ফলন (Poor / Heat stress)' : 'Poor / Heat Stress'}</option>
              <option value="failed">{lang === 'bn' ? 'ফসল বিপর্যয় (Failed / Severe Drought)' : 'Crop Failed / Severe Drought'}</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
              {lang === 'bn' ? 'হালনাগাদ মাটির pH' : 'Updated Soil pH'}:
            </label>
            <input
              type="number"
              step="0.1"
              value={updatedSoilPh}
              onChange={e => setUpdatedSoilPh(e.target.value)}
              placeholder="e.g. 6.8"
              style={{ width: '100%', background: 'var(--surface-2, #1a2228)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 8, padding: '7px 10px', fontSize: 12.5 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
              {lang === 'bn' ? 'জৈব পদার্থ (%)' : 'Organic Matter (%)'}:
            </label>
            <input
              type="number"
              step="0.05"
              value={updatedOm}
              onChange={e => setUpdatedOm(e.target.value)}
              placeholder="e.g. 2.2"
              style={{ width: '100%', background: 'var(--surface-2, #1a2228)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 8, padding: '7px 10px', fontSize: 12.5 }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--alert)', fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* 4. 3D Scene: Shows that season's bed split into those parts + water depth (Requirement G2) */}
      <div style={{ background: 'var(--surface-2, rgba(255, 255, 255, 0.02))', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>
            🌾 {lang === 'bn' ? '৩ডি খামার দৃশ্যে অভিযোজিত পুনঃপরিকল্পনা (Beds with Split Parts & Water Layer)' : '3D Farm Diorama with Split Parts & Water Layer Depth'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {lang === 'bn' ? `সেচ গভীরতা: ${waterAppliedMm} মিমি` : `Applied water depth: ${waterAppliedMm} mm`}
          </span>
        </div>
        <FarmScene3D
          beds={replan3dBeds}
          weather={{
            rainMul: 1.0,
            tempDelta: outcome === 'poor' ? 3.0 : 0.0,
            event: outcome === 'failed' ? 'drought' : (outcome === 'poor' ? 'heatwave' : 'none'),
          }}
          fieldAreaHa={activeField?.area_ha || 1.0}
          fieldName={activeField?.name || 'খামার প্লট'}
          lang={lang}
          height={400}
        />
      </div>

      {/* 5. Output: "পরিকল্পনা কীভাবে বদলাল": old sequence vs new sequence & delta cards */}
      <div style={{ background: 'var(--surface-2, rgba(255, 255, 255, 0.03))', border: '1px solid var(--line)', borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 20 }}>📊</span>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
            {lang === 'bn' ? 'পরিকল্পনা কীভাবে বদলাল (How the Plan Adapted)' : 'How the Rotation Plan Adapted'}
          </h3>
        </div>

        {/* Delta KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-3)', display: 'block' }}>{lang === 'bn' ? 'মুনাফার পরিবর্তন (Profit Delta):' : 'Profit Delta:'}</span>
            <strong style={{ fontSize: 18, color: planChange.profit_delta_bdt >= 0 ? 'var(--leaf)' : 'var(--alert)' }}>
              {planChange.profit_delta_bdt >= 0 ? '+' : ''}{formatCurrency(planChange.profit_delta_bdt, lang)}
            </strong>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-3)', display: 'block' }}>{lang === 'bn' ? 'সেচ চাহিদা পরিবর্তন (Water Delta):' : 'Water Delta:'}</span>
            <strong style={{ fontSize: 18, color: planChange.water_delta_mm <= 0 ? 'var(--water)' : 'var(--sun)' }}>
              {planChange.water_delta_mm <= 0 ? '' : '+'}{Math.round(planChange.water_delta_mm)} mm
            </strong>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-3)', display: 'block' }}>{lang === 'bn' ? 'নাইট্রোজেন প্রভাব (Nitrogen Delta):' : 'Nitrogen Delta:'}</span>
            <strong style={{ fontSize: 18, color: planChange.nitrogen_delta_kg >= 0 ? 'var(--leaf)' : 'var(--alert)' }}>
              {planChange.nitrogen_delta_kg >= 0 ? '+' : ''}{planChange.nitrogen_delta_kg} kg N/ha
            </strong>
          </div>
        </div>

        {/* Before / After Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {/* Old Sequence */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 14, borderRadius: 10, border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 8 }}>
              {lang === 'bn' ? '১. পূর্বের প্রারম্ভিক পরিকল্পনা (Initial Plan):' : '1. Initial Planned Sequence:'}
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {planChange.old_sequence.map((c, i) => (
                <span
                  key={i}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--line)',
                    borderRadius: 6,
                    padding: '4px 8px',
                    fontSize: 11.5,
                    color: 'var(--text-2)',
                  }}
                >
                  S{i + 1}: {c}
                </span>
              ))}
            </div>
          </div>

          {/* New Sequence */}
          <div style={{ background: 'rgba(16, 185, 129, 0.06)', padding: 14, borderRadius: 10, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--leaf)', display: 'block', marginBottom: 8 }}>
              {lang === 'bn' ? '২. অভিযোজিত নতুন পরিকল্পনা (New Adapted Plan):' : '2. Adapted Sequence with Observed State:'}
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {planChange.new_sequence.map((c, i) => {
                const isChanged = planChange.changed_periods.includes(`Y${Math.floor(i / 2) + 1}_S${(i % 2) + 1}`);
                return (
                  <span
                    key={i}
                    style={{
                      background: isChanged ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: isChanged ? '1px solid var(--primary, #10b981)' : '1px solid var(--line)',
                      borderRadius: 6,
                      padding: '4px 8px',
                      fontSize: 11.5,
                      fontWeight: isChanged ? 700 : 500,
                      color: isChanged ? 'var(--leaf)' : 'var(--text)',
                    }}
                  >
                    S{i + 1}: {c} {isChanged && '★'}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdaptiveReplanningView;
