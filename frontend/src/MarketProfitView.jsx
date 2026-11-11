// frontend/src/MarketProfitView.jsx
// Market & Profit Workspace for FieldShift 2026 (MP3 - MP5)
// One unified scrolling page for the selected field & rotation plan:
// 1. Header: Field summary, strategy switch (shared store), and current rotation
// 2. 4 Big Numbers: Profit/yr current -> plan, extra income/yr, -20% price profit, custom vs official count
// 3. Seasonal Economics Table: yield (maund/bigha), price (BDT/maund) with source chip & inline price edit,
//    revenue, cost, profit, and break-even price.
// 4. Price Sensitivity Chart & Riskiest Crop Exposure
// 5. Adaptive Outcomes (Planned vs Actual or Replan callout)
// 6. Reference Catalogue Table (collapsed by default, static benchmark notice)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapPin, Ruler, Sprout, Lightbulb, Pencil, AlertTriangle, BarChart3, FileText } from 'lucide-react';
import { request } from './apiClient.js';
import {
  getFieldSelectedStrategy,
  setFieldSelectedStrategy,
} from './store/rotationPlansStore.js';
import { formatDistrictLabel } from './utils/districtLabels.js';
import { formatSoilTextureLabel } from './utils/soilClasses.js';
import { CHART_PALETTE, ChartTooltip } from './ui/chartTheme.js';

// Number and Money formatters honoring strict L1 localization
function formatMoney(num, lang = 'bn') {
  if (num === null || num === undefined || isNaN(Number(num))) return '—';
  const val = Math.round(Number(num));
  const locale = lang === 'bn' ? 'bn-BD' : 'en-US';
  const prefix = lang === 'bn' ? '৳' : 'BDT ';
  return `${prefix}${val.toLocaleString(locale)}`;
}

function formatNum(num, decimals = 1, lang = 'bn') {
  if (num === null || num === undefined || isNaN(Number(num))) return lang === 'bn' ? '০' : '0';
  const val = Number(num);
  const locale = lang === 'bn' ? 'bn-BD' : 'en-US';
  if (decimals === 0) {
    return Math.round(val).toLocaleString(locale);
  }
  return val.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const STRATEGIES = [
  { id: 'balanced', bn: 'সুষম', en: 'Balanced', descBn: 'মুনাফা, পানি ও মাটির সমতা', descEn: 'Balanced multi-objective' },
  { id: 'profit', bn: 'লাভজনক', en: 'Profit-focused', descBn: 'সর্বোচ্চ মোট আর্থিক আয়', descEn: 'Maximum gross margins' },
  { id: 'water', bn: 'পানি সাশ্রয়ী', en: 'Water-saving', descBn: 'ভূগর্ভস্থ পানি সংরক্ষণ', descEn: 'Preserves groundwater' },
  { id: 'soil', bn: 'মাটি সমৃদ্ধ', en: 'Soil health', descBn: 'মাটির স্বাস্থ্য ও উর্বরতা বৃদ্ধি', descEn: 'Builds organic matter' },
];

export function MarketProfitView({ activeField, lang = 'bn', onNavigateTab }) {
  const isBn = lang === 'bn';
  const fieldId = activeField?.id || 'demo';

  // Strategy state synchronized with shared rotation plans store
  const [selectedStrategy, setSelectedStrategyState] = useState(() => {
    return getFieldSelectedStrategy(fieldId) || 'balanced';
  });

  const [economics, setEconomics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Price edit modal state
  const [editTarget, setEditTarget] = useState(null); // { crop, crop_bn, currentPrice, defaultPrice }
  const [inputPrice, setInputPrice] = useState('');
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [priceNotice, setPriceNotice] = useState(null);

  // Reference catalogue accordion state
  const [isCatalogueOpen, setIsCatalogueOpen] = useState(false);
  const [hoveredSensItem, setHoveredSensItem] = useState(null);

  // Synchronize when field changes
  useEffect(() => {
    const curStrat = getFieldSelectedStrategy(fieldId) || 'balanced';
    setSelectedStrategyState(curStrat);
  }, [fieldId]);

  // Handle strategy switch
  const handleStrategyChange = useCallback((stratId) => {
    setSelectedStrategyState(stratId);
    setFieldSelectedStrategy(fieldId, stratId);
  }, [fieldId]);

  // Fetch plan economics data from backend
  const fetchEconomics = useCallback(async (strat = selectedStrategy) => {
    setLoading(true);
    setError(null);
    try {
      const qParams = new URLSearchParams();
      if (activeField?.id && activeField.id !== 'demo') {
        qParams.set('field_id', String(activeField.id));
      }
      qParams.set('strategy', strat);
      if (activeField?.district) qParams.set('district', activeField.district);
      if (activeField?.latitude != null) qParams.set('lat', String(activeField.latitude));
      if (activeField?.longitude != null) qParams.set('lon', String(activeField.longitude));
      if (activeField?.area_ha != null) qParams.set('area_ha', String(activeField.area_ha));

      const res = await request(`/api/market/plan-economics?${qParams.toString()}`);
      if (res && res.status === 'ok') {
        setEconomics(res);
      } else {
        setError(isBn ? 'বাজারের আর্থিক হিসাব পেতে সমস্যা হয়েছে।' : 'Could not load plan economics.');
      }
    } catch (err) {
      setError(err?.message || (isBn ? 'সার্ভারের সাথে সংযোগে ত্রুটি।' : 'Failed to fetch economics.'));
    } finally {
      setLoading(false);
    }
  }, [activeField, selectedStrategy, isBn]);

  useEffect(() => {
    fetchEconomics(selectedStrategy);
  }, [fetchEconomics, selectedStrategy]);

  // Save custom price handler
  const handleSaveCustomPrice = async () => {
    if (!editTarget || !inputPrice) return;
    const pVal = parseFloat(inputPrice);
    if (isNaN(pVal) || pVal <= 0) {
      setPriceNotice({ type: 'error', text: isBn ? 'সঠিক ধনাত্মক মূল্য দিন।' : 'Enter a valid positive price.' });
      return;
    }

    setIsSavingPrice(true);
    setPriceNotice(null);
    try {
      const res = await request('/api/market/custom-price', {
        method: 'POST',
        body: JSON.stringify({
          field_id: activeField?.id && activeField.id !== 'demo' ? activeField.id : undefined,
          crop: editTarget.crop,
          price_bdt_per_maund: pVal,
          strategy: selectedStrategy,
          district: activeField?.district,
          latitude: activeField?.latitude,
          longitude: activeField?.longitude,
          area_ha: activeField?.area_ha,
        }),
      });

      if (res && res.status === 'ok') {
        setEconomics(res);
        setEditTarget(null);
        setInputPrice('');
        setPriceNotice({
          type: 'success',
          text: isBn
            ? `${editTarget.crop_bn}-এর দর ৳${Math.round(pVal).toLocaleString('bn-BD')}/মণ সংরক্ষিত হয়েছে এবং পরিকল্পনা পুনঃগণনা করা হয়েছে।`
            : `Updated price for ${editTarget.crop} to ${Math.round(pVal).toLocaleString('en-US')} BDT/maund. Plan re-solved.`,
        });
        setTimeout(() => setPriceNotice(null), 5000);
      }
    } catch (err) {
      setPriceNotice({ type: 'error', text: err?.message || (isBn ? 'দর সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to save price.') });
    } finally {
      setIsSavingPrice(false);
    }
  };

  // Field details
  const fieldSummary = economics?.field || {
    name: activeField?.name || (isBn ? 'রহিমের জমি' : "Rahim's Field"),
    district: activeField?.district || 'chapainawabganj',
    latitude: activeField?.latitude || 24.62,
    longitude: activeField?.longitude || 88.55,
    area_ha: activeField?.area_ha || 0.67,
    area_bigha: Math.round(((activeField?.area_ha || 0.67) / 0.13378) * 10) / 10,
    soil_texture: activeField?.soil_texture || 'clay loam',
  };

  const districtLabel = formatDistrictLabel(fieldSummary.district, lang);
  const soilLabel = formatSoilTextureLabel(fieldSummary.soil_texture, lang);
  const totals = economics?.yearly_totals || {};
  const sensitivity = economics?.price_sensitivity || {};
  const seasons = economics?.seasons || [];
  const adaptive = economics?.adaptive_outcomes || { has_records: false };
  const catalogue = economics?.reference_catalogue || [];

  // Current rotation crops formatted for badge
  const currentRotationCropsText = useMemo(() => {
    const csList = economics?.current_seasons || [];
    if (csList.length > 0) {
      return csList.map(cs => isBn ? cs.crop_bn : cs.crop_en).join(' ➔ ');
    }
    return isBn ? 'বোরো ধান ➔ পতিত ➔ আমন ধান' : 'Boro Rice ➔ Fallow ➔ Rice';
  }, [economics?.current_seasons, isBn]);

  // Max revenue for the sensitivity chart scale
  const maxSensProfit = useMemo(() => {
    const s = economics?.price_sensitivity || {};
    const vals = [
      s.downside_20_profit_field || 0,
      s.normal_profit_field || 0,
      s.upside_20_profit_field || 0,
      s.current_rotation_profit_field || 0,
    ];
    return Math.max(...vals, 1000);
  }, [economics?.price_sensitivity]);

  return (
    <div
      className="market-profit-view content-container"
      style={{
        paddingTop: '8px',
        paddingBottom: '80px',
        fontFamily: isBn ? 'var(--font-bangla, Hind Siliguri, sans-serif)' : 'var(--font-body, Inter, sans-serif)',
        color: 'var(--text, #F4F7F4)',
      }}
    >
      {/* =========================================================================
          SECTION 1: HEADER & STRATEGY SELECTOR
          ========================================================================= */}
      <header
        className="market-header-card"
        style={{
          background: 'var(--glass-surface-bg, rgba(8, 14, 11, 0.80))',
          border: 'var(--glass-surface-border, 1px solid rgba(255, 255, 255, 0.10))',
          borderRadius: 'var(--r-xl, 20px)',
          padding: '24px 28px',
          marginBottom: 24,
          boxShadow: 'var(--shadow-glass, 0 10px 30px rgba(0, 0, 0, 0.35))',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <h1
              style={{
                margin: '0 0 4px',
                fontSize: 'clamp(22px, 3vw, 28px)',
                fontWeight: 700,
                color: 'var(--text, #F4F7F4)',
                letterSpacing: '-0.02em',
              }}
            >
              {fieldSummary.name} · {districtLabel}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted, #8C9B90)', marginBottom: 6 }}>
              {isBn ? 'ফসল আবর্তনের আয়-ব্যয় ও ব্রেক-ইভেন বাজারদর।' : 'Crop rotation revenue, costs, and break-even market economics.'}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8, fontSize: 13, color: 'var(--text-muted, #8C9B90)' }}>
              <span>
                <MapPin size={14} strokeWidth={1.75} style={{ verticalAlign: 'middle', marginRight: 4 }} />{formatNum(fieldSummary.latitude, 2, lang)}°{isBn ? 'উ' : 'N'}, {formatNum(fieldSummary.longitude, 2, lang)}°{isBn ? 'পূ' : 'E'}
              </span>
              <span>•</span>
              <span>
                <Ruler size={14} strokeWidth={1.75} style={{ verticalAlign: 'middle', marginRight: 4 }} />{formatNum(fieldSummary.area_bigha, 1, lang)} {isBn ? 'বিঘা' : 'bigha'} ({formatNum(fieldSummary.area_ha, 2, lang)} {isBn ? 'হেক্টর' : 'ha'})
              </span>
              <span>•</span>
              <span><Sprout size={14} strokeWidth={1.75} color="var(--lime, #c8f169)" style={{ verticalAlign: 'middle', marginRight: 4 }} />{soilLabel}</span>
            </div>
          </div>

          {/* Current Rotation Badge */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--r-md, 12px)',
              padding: '12px 18px',
              minWidth: 260,
            }}
          >
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted, #8C9B90)', fontWeight: 600, marginBottom: 4 }}>
              {isBn ? 'আপনার এখনকার চাষ (সনাতন)' : 'Your Current Rotation (Baseline)'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text, #F4F7F4)', marginBottom: 2 }}>
              {currentRotationCropsText}
            </div>
            <div style={{ fontSize: 12, color: 'var(--accent, #C8F169)' }}>
              {isBn ? 'বর্তমান নিট আয়:' : 'Baseline profit:'}{' '}
              <strong style={{ fontWeight: 700 }}>{formatMoney(totals.current_profit_field, lang)}</strong>
              {isBn ? '/বছর' : '/yr'}
            </div>
          </div>
        </div>

        {/* Strategy Switcher */}
        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted, #8C9B90)', marginBottom: 8, fontWeight: 500 }}>
            {isBn ? 'পরিকল্পনার কৌশল বেছে নিন (শেয়ার্ড প্ল্যানার স্টোর):' : 'Select Rotation Strategy (Shared Planner Store):'}
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {STRATEGIES.map((strat) => {
              const active = selectedStrategy === strat.id;
              return (
                <button
                  key={strat.id}
                  type="button"
                  onClick={() => handleStrategyChange(strat.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--r-full, 9999px)',
                    border: active ? '1px solid var(--accent, #C8F169)' : '1px solid rgba(255, 255, 255, 0.12)',
                    background: active ? 'rgba(200, 241, 105, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                    color: active ? 'var(--accent, #C8F169)' : 'var(--text, #F4F7F4)',
                    fontWeight: active ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>{isBn ? strat.bn : strat.en}</span>
                  {active && <span style={{ fontSize: 11, opacity: 0.85 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Notice Banner */}
      {priceNotice && (
        <div
          style={{
            padding: '12px 18px',
            marginBottom: 20,
            borderRadius: 'var(--r-md, 12px)',
            background: priceNotice.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: priceNotice.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            color: priceNotice.type === 'success' ? 'var(--good, #34d399)' : '#f87171',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {priceNotice.text}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '16px 20px',
            marginBottom: 24,
            borderRadius: 'var(--r-md, 12px)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* =========================================================================
          SECTION 2: 4 BIG HERO METRICS
          ========================================================================= */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {/* Tile 1: Profit/yr Current -> Plan */}
        <div
          className="market-kpi-tile"
          style={{
            background: 'var(--glass-surface-bg, rgba(8, 14, 11, 0.80))',
            border: 'var(--glass-surface-border, 1px solid rgba(255, 255, 255, 0.10))',
            borderRadius: 'var(--r-lg, 16px)',
            padding: '20px 22px',
            boxShadow: 'var(--shadow-glass, 0 10px 30px rgba(0, 0, 0, 0.35))',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-muted, #8C9B90)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
            {isBn ? 'বার্ষিক মোট লাভ (বর্তমান ➔ প্রস্তাবিত)' : 'Annual Profit (Current ➔ Plan)'}
          </div>
          <div style={{ fontSize: 'clamp(20px, 2.2vw, 26px)', fontWeight: 800, color: 'var(--text, #F4F7F4)', letterSpacing: '-0.02em', marginBottom: 6 }}>
            <span style={{ color: 'var(--text-muted, #8C9B90)', textDecoration: 'line-through', marginRight: 6, fontSize: '0.85em' }}>
              {formatMoney(totals.current_profit_field, lang)}
            </span>
            <span>➔</span>
            <span style={{ color: 'var(--accent, #C8F169)', marginLeft: 6 }}>
              {formatMoney(totals.plan_profit_field, lang)}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted, #8C9B90)' }}>
            {isBn ? `আপনার ${formatNum(fieldSummary.area_bigha, 1, lang)} বিঘা জমির জন্য` : `For your ${formatNum(fieldSummary.area_bigha, 1, lang)} bigha field`}
          </div>
        </div>

        {/* Tile 2: Extra Income / Year */}
        <div
          className="market-kpi-tile market-kpi-tile-highlight"
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 'var(--r-lg, 16px)',
            padding: '20px 22px',
            boxShadow: 'var(--shadow-glass, 0 10px 30px rgba(0, 0, 0, 0.35))',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--tile-highlight-color, #34d399)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
            {isBn ? 'অতিরিক্ত বার্ষিক আয়' : 'Extra Annual Income'}
          </div>
          <div style={{ fontSize: 'clamp(22px, 2.4vw, 28px)', fontWeight: 800, color: 'var(--tile-highlight-color, #10B981)', letterSpacing: '-0.02em', marginBottom: 6 }}>
            +{formatMoney(totals.delta_profit_field, lang)}
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted, #8C9B90)' }}>
              {isBn ? '/বছর' : '/yr'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--tile-highlight-color, #34d399)' }}>
            {totals.current_profit_field > 0 ? (
              <span>
                +{formatNum(((totals.delta_profit_field || 0) / totals.current_profit_field) * 100, 0, lang)}% {isBn ? 'মুনাফা বৃদ্ধি' : 'increase over baseline'}
              </span>
            ) : (
              <span>{isBn ? 'নতুন ফসল ধারা' : 'New crop sequence'}</span>
            )}
          </div>
        </div>

        {/* Tile 3: Plan Profit at -20% Prices */}
        <div
          className="market-kpi-tile"
          style={{
            background: 'var(--glass-surface-bg, rgba(8, 14, 11, 0.80))',
            border: 'var(--glass-surface-border, 1px solid rgba(255, 255, 255, 0.10))',
            borderRadius: 'var(--r-lg, 16px)',
            padding: '20px 22px',
            boxShadow: 'var(--shadow-glass, 0 10px 30px rgba(0, 0, 0, 0.35))',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-muted, #8C9B90)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
            {isBn ? 'দাম ২০% কমলেও লাভ' : 'Profit at -20% Prices'}
          </div>
          <div style={{ fontSize: 'clamp(22px, 2.4vw, 28px)', fontWeight: 800, color: '#38BDF8', letterSpacing: '-0.02em', marginBottom: 6 }}>
            {formatMoney(sensitivity.downside_20_profit_field, lang)}
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted, #8C9B90)' }}>
              {isBn ? '/বছর' : '/yr'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted, #8C9B90)' }}>
            {isBn ? 'বাজারের চরম মন্দাতেও সুরক্ষিত' : 'Protected even in market downturns'}
          </div>
        </div>

        {/* Tile 4: Custom vs Catalogue Prices Count */}
        <div
          className="market-kpi-tile"
          style={{
            background: 'var(--glass-surface-bg, rgba(8, 14, 11, 0.80))',
            border: 'var(--glass-surface-border, 1px solid rgba(255, 255, 255, 0.10))',
            borderRadius: 'var(--r-lg, 16px)',
            padding: '20px 22px',
            boxShadow: 'var(--shadow-glass, 0 10px 30px rgba(0, 0, 0, 0.35))',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-muted, #8C9B90)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
            {isBn ? 'দামের উৎস অনুপাত' : 'Price Sources Ratio'}
          </div>
          <div style={{ fontSize: 'clamp(18px, 2vw, 22px)', fontWeight: 700, color: 'var(--text, #F4F7F4)', letterSpacing: '-0.02em', marginBottom: 6 }}>
            <span style={{ color: totals.custom_price_count > 0 ? 'var(--accent, #C8F169)' : 'inherit' }}>
              {formatNum(totals.custom_price_count || 0, 0, lang)} {isBn ? 'নিজস্ব দর' : 'custom'}
            </span>
            <span style={{ margin: '0 6px', color: 'var(--text-muted, #8C9B90)' }}>·</span>
            <span>
              {formatNum(totals.catalogue_price_count || 6, 0, lang)} {isBn ? 'সরকারি দর' : 'official'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted, #8C9B90)' }}>
            {isBn ? 'কৃষক নির্ধারিত বনাম কৃষি বিপণন দর (DAM)' : 'Farmer-set vs DAM benchmark'}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: "মৌসুম ধরে আয়-ব্যয়" (SEASON ECONOMICS TABLE)
          ========================================================================= */}
      <section
        className="market-card-section"
        style={{
          background: 'var(--glass-surface-bg, rgba(8, 14, 11, 0.80))',
          border: 'var(--glass-surface-border, 1px solid rgba(255, 255, 255, 0.10))',
          borderRadius: 'var(--r-xl, 20px)',
          padding: '24px 28px',
          marginBottom: 32,
          boxShadow: 'var(--shadow-glass, 0 10px 30px rgba(0, 0, 0, 0.35))',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: 'var(--text, #F4F7F4)' }}>
              {isBn ? 'মৌসুম ধরে আয়-ব্যয় ও ব্রেক-ইভেন দর' : 'Seasonal Economics & Break-Even Prices'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted, #8C9B90)' }}>
              {isBn
                ? '৬ মৌসুমের প্রতিটি ফসলের সম্ভাব্য ফলন, দর, উৎপাদন খরচ এবং লোকসান এড়ানোর ন্যূনতম দর'
                : 'Expected yields, prices, costs, and break-even price thresholds for all 6 seasons'}
            </p>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted, #8C9B90)' }}>
            <Lightbulb size={14} strokeWidth={1.75} color="var(--amber, #f5b04c)" style={{ verticalAlign: 'middle', marginRight: 4 }} />{isBn ? 'দর পরিবর্তন করতে পেন্সিল আইকনে ক্লিক করুন' : 'Click the pencil icon to input your own selling price'}
          </div>
        </div>

        {/* Responsive Table */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table
            data-demo="wholesale_prices"
            className="market-table"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
              textAlign: 'left',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)', color: 'var(--text-muted, #8C9B90)' }}>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>{isBn ? 'মৌসুম' : 'Season'}</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>{isBn ? 'ফসল' : 'Crop'}</th>
                <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>
                  {isBn ? 'ফলন (মণ/বিঘা)' : 'Yield (maund/bigha)'}
                </th>
                <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>
                  {isBn ? 'দর (টাকা/মণ)' : 'Price (BDT/maund)'}
                </th>
                <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>{isBn ? 'আয় (টাকা)' : 'Revenue (BDT)'}</th>
                <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>{isBn ? 'খরচ (টাকা)' : 'Cost (BDT)'}</th>
                <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>{isBn ? 'লাভ (টাকা)' : 'Profit (BDT)'}</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>{isBn ? 'লোকসানের ঝুঁকি (ব্রেক-ইভেন দর)' : 'Break-Even Threshold'}</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((s, idx) => {
                const isFallow = s.crop.toLowerCase() === 'fallow';
                const isProfit = s.profit >= 0;
                return (
                  <tr
                    key={s.period || idx}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                    }}
                  >
                    {/* Season */}
                    <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text, #F4F7F4)' }}>
                        {isBn ? s.season_name_bn : s.season_name_en}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted, #8C9B90)' }}>{s.period}</div>
                    </td>

                    {/* Crop */}
                    <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontWeight: 600,
                          color: isFallow ? 'var(--text-muted, #8C9B90)' : 'var(--text, #F4F7F4)',
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: isFallow ? '#64748b' : '#10B981',
                            display: 'inline-block',
                          }}
                        />
                        {isBn ? s.crop_bn : s.crop_en}
                      </span>
                    </td>

                    {/* Yield */}
                    <td style={{ padding: '14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {isFallow ? (
                        <span style={{ color: 'var(--text-muted, #8C9B90)' }}>—</span>
                      ) : (
                        <span>
                          <strong>{formatNum(s.yield_maund_bigha, 1, lang)}</strong>{' '}
                          <span style={{ fontSize: 11, color: 'var(--text-muted, #8C9B90)' }}>
                            {isBn ? 'মণ' : 'maund'}
                          </span>
                        </span>
                      )}
                    </td>

                    {/* Price with edit pencil and source chip */}
                    <td style={{ padding: '14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {isFallow ? (
                        <span style={{ color: 'var(--text-muted, #8C9B90)' }}>—</span>
                      ) : (
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 700, color: 'var(--text, #F4F7F4)' }}>
                              {formatMoney(s.price_bdt_maund, lang)}
                            </span>
                            <button
                              type="button"
                              title={isBn ? 'দর পরিবর্তন করুন' : 'Edit selling price'}
                              onClick={() => {
                                setEditTarget({
                                  crop: s.crop,
                                  crop_bn: s.crop_bn,
                                  crop_en: s.crop_en,
                                  currentPrice: s.price_bdt_maund,
                                });
                                setInputPrice(String(Math.round(s.price_bdt_maund)));
                              }}
                              style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: 6,
                                padding: '2px 6px',
                                cursor: 'pointer',
                                fontSize: 11,
                                color: 'var(--accent, #C8F169)',
                              }}
                            >
                              <Pencil size={14} strokeWidth={1.75} />
                            </button>
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: s.is_custom_price ? 'rgba(200, 241, 105, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                              color: s.is_custom_price ? 'var(--accent, #C8F169)' : 'var(--text-muted, #8C9B90)',
                              fontWeight: s.is_custom_price ? 700 : 500,
                            }}
                          >
                            {isBn ? s.price_source_bn : s.price_source_en}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Revenue */}
                    <td style={{ padding: '14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {formatMoney(s.revenue, lang)}
                    </td>

                    {/* Cost */}
                    <td style={{ padding: '14px', textAlign: 'right', whiteSpace: 'nowrap', color: 'var(--text-muted, #8C9B90)' }}>
                      {formatMoney(s.cost, lang)}
                    </td>

                    {/* Profit */}
                    <td style={{ padding: '14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: isProfit ? '#10B981' : '#EF4444',
                        }}
                      >
                        {isProfit ? '+' : ''}{formatMoney(s.profit, lang)}
                      </span>
                    </td>

                    {/* Break-even Price */}
                    <td style={{ padding: '14px' }}>
                      {isFallow ? (
                        <span style={{ color: 'var(--text-muted, #8C9B90)' }}>—</span>
                      ) : (
                        <div style={{ fontSize: 12 }}>
                          <span style={{ color: 'var(--text-muted, #8C9B90)' }}>
                            {isBn ? 'লোকসান হবে যদি দর ' : 'Loss if price < '}
                          </span>
                          <strong style={{ color: '#F59E0B' }}>
                            {formatMoney(s.break_even_price_maund, lang)}
                          </strong>
                          <span style={{ color: 'var(--text-muted, #8C9B90)' }}>
                            {isBn ? '/মণ-এর নিচে নামে' : '/maund'}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: "দাম ওঠানামা করলে" (PRICE SENSITIVITY & RISKIEST CROP)
          ========================================================================= */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
          marginBottom: 32,
        }}
      >
        {/* Left: Sensitivity Bar Chart */}
        <div
          data-demo="price_forecast"
          className="market-card-section"
          style={{
            background: 'var(--glass-surface-bg, rgba(8, 14, 11, 0.80))',
            border: 'var(--glass-surface-border, 1px solid rgba(255, 255, 255, 0.10))',
            borderRadius: 'var(--r-xl, 20px)',
            padding: '24px 26px',
            boxShadow: 'var(--shadow-glass, 0 10px 30px rgba(0, 0, 0, 0.35))',
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text, #F4F7F4)' }}>
              {isBn ? 'দাম ওঠানামা করলে (বাজার সংবেদনশীলতা)' : 'Market Price Fluctuations (Sensitivity)'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted, #8C9B90)' }}>
              {isBn
                ? 'সব ফসলের বাজারদর -২০%, স্বাভাবিক অথবা +২০% হলে বার্ষিক মোট লাভ'
                : 'Annual net profit if crop market prices swing -20%, baseline, or +20%'}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--text-lime)', fontWeight: 600 }}>
              {isBn ? 'দর ২০% ধস নামলেও নতুন পরিকল্পনায় লাভ বেশি থাকে (৳৪০,০০০+ সর্বনিম্ন মুনাফা)' : 'Plan remains more profitable even under a 20% price shock (৳40,000+ floor)'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
            {/* -20% Price Crash Bar */}
            <div
              style={{ cursor: 'pointer' }}
              onPointerEnter={() => setHoveredSensItem({
                label: isBn ? 'দর ২০% কমলে (মন্দা)' : 'Price -20% (Crash)',
                val: formatMoney(sensitivity.downside_20_profit_field, lang),
              })}
              onPointerLeave={() => setHoveredSensItem(null)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-cyan)', fontWeight: 600 }}>
                  {isBn ? 'দর ২০% কমলে (মন্দা)' : 'Price -20% (Crash)'}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary, #F4F7F4)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatMoney(sensitivity.downside_20_profit_field, lang)}
                </span>
              </div>
              <div style={{ height: 16, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  className="chart-bar-animated"
                  style={{
                    height: '100%',
                    width: `${Math.max(5, Math.min(100, ((sensitivity.downside_20_profit_field || 0) / maxSensProfit) * 100))}%`,
                    background: 'var(--color-cyan, #5be3ff)',
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>

            {/* Normal Price Bar */}
            <div
              style={{ cursor: 'pointer' }}
              onPointerEnter={() => setHoveredSensItem({
                label: isBn ? 'বর্তমান প্রাক্কলিত দর' : 'Normal Estimated Price',
                val: formatMoney(sensitivity.normal_profit_field, lang),
              })}
              onPointerLeave={() => setHoveredSensItem(null)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-lime)', fontWeight: 600 }}>
                  {isBn ? 'বর্তমান প্রাক্কলিত দর' : 'Normal Estimated Price'}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-lime)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatMoney(sensitivity.normal_profit_field, lang)}
                </span>
              </div>
              <div style={{ height: 16, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  className="chart-bar-animated"
                  style={{
                    height: '100%',
                    width: `${Math.max(5, Math.min(100, ((sensitivity.normal_profit_field || 0) / maxSensProfit) * 100))}%`,
                    background: 'var(--color-lime, #c8f169)',
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>

            {/* +20% Price Surge Bar */}
            <div
              style={{ cursor: 'pointer' }}
              onPointerEnter={() => setHoveredSensItem({
                label: isBn ? 'দর ২০% বাড়লে (সুসময়)' : 'Price +20% (Surge)',
                val: formatMoney(sensitivity.upside_20_profit_field, lang),
              })}
              onPointerLeave={() => setHoveredSensItem(null)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-amber)', fontWeight: 600 }}>
                  {isBn ? 'দর ২০% বাড়লে (সুসময়)' : 'Price +20% (Surge)'}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-amber)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatMoney(sensitivity.upside_20_profit_field, lang)}
                </span>
              </div>
              <div style={{ height: 16, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  className="chart-bar-animated"
                  style={{
                    height: '100%',
                    width: `${Math.max(5, Math.min(100, ((sensitivity.upside_20_profit_field || 0) / maxSensProfit) * 100))}%`,
                    background: 'var(--color-amber, #f5b04c)',
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>

            {/* Glass Hover Tooltip */}
            {hoveredSensItem && (
              <ChartTooltip
                visible={Boolean(hoveredSensItem)}
                x="50%"
                y="50%"
                title={hoveredSensItem.label}
                value={hoveredSensItem.val}
                theme="dark"
              />
            )}

            {/* Baseline Current Rotation Reference Line */}
            <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px dashed rgba(255, 255, 255, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted, #8C9B90)' }}>
                <span>{isBn ? 'রেফারেন্স: সনাতন চাষের নিট লাভ' : 'Reference: Current Farming Profit'}</span>
                <strong>{formatMoney(sensitivity.current_rotation_profit_field, lang)}</strong>
              </div>
              <div style={{ fontSize: 11, color: 'var(--good, #34d399)', marginTop: 4 }}>
                ✓ {isBn ? 'দাম ২০% ধস নামলেও নতুন পরিকল্পনায় লাভ বেশি থাকে' : 'Plan remains more profitable even under a 20% price collapse'}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Riskiest Crop Card */}
        <div
          className="market-card-section"
          style={{
            background: 'var(--glass-surface-bg, rgba(8, 14, 11, 0.80))',
            border: 'var(--glass-surface-border, 1px solid rgba(255, 255, 255, 0.10))',
            borderRadius: 'var(--r-xl, 20px)',
            padding: '24px 26px',
            boxShadow: 'var(--shadow-glass, 0 10px 30px rgba(0, 0, 0, 0.35))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <AlertTriangle size={18} strokeWidth={1.75} color="var(--coral, #ff7a6b)" />
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#F59E0B' }}>
                {isBn ? 'কোন ফসলের দামে সবচেয়ে ঝুঁকি?' : 'Which Crop Holds the Highest Price Risk?'}
              </h3>
            </div>

            {sensitivity.riskiest_crop ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text, #F4F7F4)', marginBottom: 8 }}>
                  {isBn ? sensitivity.riskiest_crop.crop_bn : sensitivity.riskiest_crop.crop_en}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted, #8C9B90)', lineHeight: 1.6, marginBottom: 16 }}>
                  {isBn ? sensitivity.riskiest_crop.reason_bn : sensitivity.riskiest_crop.reason_en}
                </div>
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: 'var(--r-md, 12px)',
                    padding: '12px 16px',
                  }}
                >
                  <div style={{ fontSize: 11, color: 'var(--amber, #F59E0B)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {isBn ? '২০% দর কমলে সম্ভাব্য প্রভাব' : 'Impact if price drops 20%'}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text, #F4F7F4)', marginTop: 2 }}>
                    -{formatMoney(sensitivity.riskiest_crop.profit_drop_field, lang)}{' '}
                    <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted, #8C9B90)' }}>
                      {isBn ? 'বার্ষিক মুনাফা হ্রাস' : 'annual profit reduction'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted, #8C9B90)' }}>
                {isBn ? 'পরিকল্পনায় কোনো ফসলের একক ঝুঁকি চিহ্নিত হয়নি।' : 'No single high-risk exposure identified in the current plan.'}
              </p>
            )}
          </div>

          <div style={{ marginTop: 18, fontSize: 11, color: 'var(--text-muted, #8C9B90)' }}>
            <Lightbulb size={14} strokeWidth={1.75} color="var(--amber, #f5b04c)" style={{ verticalAlign: 'middle', marginRight: 4 }} />{isBn ? 'ঝুঁকি কমাতে কন্ট্রাক্ট ফার্মিং বা আগাম বায়না দরে ফসল বিক্রির পরামর্শ দেওয়া হয়।' : 'Consider forward contracts or warehouse receipt storage to hedge market swings.'}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: "পরিকল্পনা বনাম আসল" (ADAPTIVE OUTCOMES)
          ========================================================================= */}
      <section
        className="market-card-section"
        style={{
          background: 'var(--glass-surface-bg, rgba(8, 14, 11, 0.80))',
          border: 'var(--glass-surface-border, 1px solid rgba(255, 255, 255, 0.10))',
          borderRadius: 'var(--r-xl, 20px)',
          padding: '24px 28px',
          marginBottom: 32,
          boxShadow: 'var(--shadow-glass, 0 10px 30px rgba(0, 0, 0, 0.35))',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: 'var(--text, #F4F7F4)' }}>
              {isBn ? 'পরিকল্পনা বনাম আসল ফলন ও আয়' : 'Planned vs Actual Harvest Outcomes'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted, #8C9B90)' }}>
              {isBn
                ? 'বাস্তব মাঠের ফলাফল যুক্ত করলে মডেল আপনার মাটির উর্বরতা ও বাজারের গতিশীলতা শিখে পরবর্তী আবর্তন নিখুঁত করবে।'
                : 'Recorded seasonal yields and prices allow the MILP optimizer to adapt future seasons.'}
            </p>
          </div>
        </div>

        {adaptive.has_records && adaptive.records.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="market-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted, #8C9B90)' }}>
                  <th style={{ padding: '10px 12px' }}>{isBn ? 'বছর / মৌসুম' : 'Year / Season'}</th>
                  <th style={{ padding: '10px 12px' }}>{isBn ? 'ফসল' : 'Crop'}</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>{isBn ? 'আসল ফলন (মণ/বিঘা)' : 'Actual Yield (maund/bigha)'}</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>{isBn ? 'আসল দর (টাকা/মণ)' : 'Actual Price (BDT/maund)'}</th>
                </tr>
              </thead>
              <tbody>
                {adaptive.records.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '10px 12px' }}>{r.year} · {r.season}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{isBn ? r.crop_bn : r.crop}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatNum(r.actual_yield_maund_bigha, 1, lang)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatMoney(r.actual_price_bdt_maund, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              padding: '24px 20px',
              borderRadius: 'var(--r-md, 12px)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px dashed rgba(255, 255, 255, 0.15)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <BarChart3 size={28} strokeWidth={1.75} style={{ display: 'block', margin: '0 auto' }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text, #F4F7F4)' }}>
                  {isBn ? adaptive.callout_bn : adaptive.callout_en}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted, #8C9B90)', marginTop: 2 }}>
                  {isBn
                    ? 'এখনো কোনো মৌসুমের বাস্তব ফসল হিসাব লিপিবদ্ধ করা হয়নি।'
                    : 'No completed seasonal harvest records submitted yet.'}
                </div>
              </div>
            </div>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('replan')}
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--r-full, 9999px)',
                  background: 'var(--accent, #C8F169)',
                  color: 'var(--accent-ink, #0A0F0D)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{isBn ? 'অভিযোজিত পুনঃপরিকল্পনায় যান' : 'Go to Adaptive Replan'}</span>
                <span>➔</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 6: "দামের উৎস" (REFERENCE CATALOGUE ACCORDION)
          ========================================================================= */}
      <section
        data-demo="buyer_contacts"
        className="market-card-section"
        style={{
          background: 'var(--glass-surface-bg, rgba(8, 14, 11, 0.80))',
          border: 'var(--glass-surface-border, 1px solid rgba(255, 255, 255, 0.10))',
          borderRadius: 'var(--r-xl, 20px)',
          padding: '18px 24px',
          boxShadow: 'var(--shadow-glass, 0 10px 30px rgba(0, 0, 0, 0.35))',
        }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsCatalogueOpen(prev => !prev)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsCatalogueOpen(prev => !prev);
            }
          }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FileText size={16} strokeWidth={1.75} />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text, #F4F7F4)' }}>
              {isBn ? 'দামের উৎস ও সরকারি পাইকারি দর তালিকা' : 'Official Price Registry & Wholesale Reference'}
            </span>
            <span
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 'var(--r-full, 9999px)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-muted, #8C9B90)',
                fontWeight: 600,
              }}
            >
              {isBn ? 'স্থির তালিকা, লাইভ নয়' : 'Static benchmark, not live'}
            </span>
          </div>

          <span style={{ fontSize: 14, color: 'var(--accent, #C8F169)', fontWeight: 600 }}>
            {isCatalogueOpen ? (isBn ? '▲ সংক্ষেপ করুন' : '▲ Collapse') : (isBn ? '▼ বিস্তারিত তালিকা' : '▼ Expand')}
          </span>
        </div>

        {isCatalogueOpen && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--text-muted, #8C9B90)', lineHeight: 1.6 }}>
              {isBn
                ? 'সব দর কৃষি বিপণন অধিদপ্তর (DAM), ট্রেডিং কর্পোরেশন অব বাংলাদেশ (TCB) এবং বাংলাদেশ পরিসংখ্যান ব্যুরো (BBS) এর ২০২৫ সালের মাঠ পর্যায়ের পাইকারি প্রাক্কলন থেকে সংকলিত। লাইভ কোনো ব্রোকার বা এপিআই সংযোগ নেই।'
                : 'All reference prices are compiled from 2025 farmgate benchmarks by DAM, TCB, and BBS. Static catalogue; no live broker API.'}
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table className="market-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted, #8C9B90)' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>{isBn ? 'ফসল' : 'Crop'}</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>{isBn ? 'খামার প্রান্ত দর (টাকা/মণ)' : 'Farmgate (BDT/maund)'}</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>{isBn ? 'খামার প্রান্ত দর (টাকা/কেজি)' : 'Farmgate (BDT/kg)'}</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>{isBn ? 'খুচরা দর (টাকা/কেজি)' : 'Retail (BDT/kg)'}</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>{isBn ? 'উৎস ও বছর' : 'Source & Year'}</th>
                  </tr>
                </thead>
                <tbody>
                  {catalogue.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text, #F4F7F4)' }}>
                        {isBn ? c.name_bn : c.name_en}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatMoney(c.farmgate_bdt_maund, lang)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatMoney(c.farmgate_bdt_kg, lang)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatMoney(c.retail_bdt_kg, lang)}</td>
                      <td style={{ padding: '8px 10px', color: 'var(--text-muted, #8C9B90)' }}>
                        {c.source} · {c.source_date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          MODAL: EDIT CROP SELLING PRICE
          ========================================================================= */}
      {editTarget && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--surface-2, #18231C)',
              border: '1px solid rgba(200, 241, 105, 0.3)',
              borderRadius: 'var(--r-xl, 20px)',
              padding: '24px 28px',
              maxWidth: 440,
              width: '100%',
              boxShadow: 'var(--shadow-elevated, 0 16px 48px rgba(0, 0, 0, 0.6))',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text, #F4F7F4)' }}>
                {isBn ? `${editTarget.crop_bn}-এর নিজস্ব দর নির্ধারণ` : `Set Custom Price for ${editTarget.crop_en}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #8C9B90)',
                  fontSize: 20,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted, #8C9B90)', lineHeight: 1.5 }}>
              {isBn
                ? 'আপনার স্থানীয় বাজারের প্রত্যাশিত বিক্রয়মূল্য লিখুন। এটি সংরক্ষণ করার সাথে সাথে সম্পূর্ণ শস্য আবর্তন পুনরায় অপ্টিমাইজ করা হবে।'
                : 'Enter your local selling price. Saving will automatically re-solve the rotation plan.'}
            </p>

            <div style={{ marginBottom: 16 }}>
              <label
                htmlFor="market-custom-price-input"
                style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted, #8C9B90)', marginBottom: 6 }}
              >
                {isBn ? 'বিক্রয়মূল্য (টাকা প্রতি মণ):' : 'Selling Price (BDT per maund):'}
              </label>
              <input
                id="market-custom-price-input"
                type="number"
                value={inputPrice}
                onChange={(e) => setInputPrice(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--r-md, 12px)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'var(--text, #F4F7F4)',
                  fontSize: 16,
                  fontWeight: 600,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Quick Adjustment Chips */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => setInputPrice(String(Math.round(editTarget.currentPrice * 1.1)))}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'var(--text, #F4F7F4)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                +10%
              </button>
              <button
                type="button"
                onClick={() => setInputPrice(String(Math.round(editTarget.currentPrice * 0.9)))}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'var(--text, #F4F7F4)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                -10%
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                style={{
                  padding: '9px 16px',
                  borderRadius: 'var(--r-full, 9999px)',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'var(--text, #F4F7F4)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isSavingPrice || !inputPrice}
                onClick={handleSaveCustomPrice}
                style={{
                  padding: '9px 20px',
                  borderRadius: 'var(--r-full, 9999px)',
                  background: 'var(--accent, #C8F169)',
                  border: 'none',
                  color: 'var(--accent-ink, #0A0F0D)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isSavingPrice ? 'not-allowed' : 'pointer',
                  opacity: isSavingPrice ? 0.6 : 1,
                }}
              >
                {isSavingPrice
                  ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                  : (isBn ? 'সংরক্ষণ ও পুনঃপরিকল্পনা' : 'Save & Re-solve')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketProfitView;
