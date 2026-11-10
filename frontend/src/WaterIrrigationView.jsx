// frontend/src/WaterIrrigationView.jsx
// Water & Irrigation Workspace for FieldShift 2026
// Rebuilt according to docs/water_layout_reference.html:
// 1. Seasonal Water Budget cards and yearly comparison bar
// 2. Daily water balance chart, AWD soil diorama, and irrigation schedule
// 3. Regional aquifer context (NASA GRACE-FO)
// Deep engineering diagnostics demoted into collapsed expert drawer.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { request } from './apiClient.js';
import { WaterBalance3D } from './research3d/WaterBalance3D.jsx';
import { SoilProfile3D } from './research3d/SoilProfile3D.jsx';
import { formatNumber } from './marketUtils.js';
import { useTranslation } from './i18n.js';

const MONTHS_BN = ['জানু', 'ফেব', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatShortDate(dStr, lang = 'bn') {
  if (!dStr) return '';
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return dStr;
  const day = d.getDate();
  const mIdx = d.getMonth();
  if (lang === 'bn') {
    return `${Number(day).toLocaleString('bn-BD', { useGrouping: false })} ${MONTHS_BN[mIdx]}`;
  }
  return `${day} ${MONTHS_EN[mIdx]}`;
}

function formatDateRange(startStr, endStr, lang = 'bn') {
  if (!startStr && !endStr) return '';
  return `${formatShortDate(startStr, lang)}–${formatShortDate(endStr, lang)}`;
}

export function formatNumberBnEn(num, decimals = 0, lang = 'bn') {
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

const BARIND_DISTRICTS = new Set([
  'rajshahi', 'bogura', 'bogra', 'naogaon', 'chapainawabganj', 'chapai_nawabganj',
  'natore', 'dinajpur', 'joypurhat', 'rangpur', 'gaibandha', 'kurigram', 'nilphamari',
  'lalmonirhat', 'panchagarh', 'thakurgaon'
]);

const HAOR_DISTRICTS = new Set([
  'sunamganj', 'habiganj', 'netrokona', 'kishoreganj', 'sylhet', 'moulvibazar', 'brahmanbaria'
]);

const COASTAL_DISTRICTS = new Set([
  'barisal', 'satkhira', 'khulna', 'bagerhat', 'patuakhali', 'barguna', 'pirojpur',
  'jhalokati', 'bhola', 'noakhali', 'feni', 'chittagong', 'chattogram', 'coxsbazar', "cox's bazar", 'lakshmipur'
]);

export function getGraceRegionData(dist, lang = 'bn') {
  const d = String(dist || '').toLowerCase().trim();
  if (BARIND_DISTRICTS.has(d)) {
    return {
      trend: '-1.07 cm/yr',
      color: 'var(--red-wp, #f07a6a)',
      statusBn: 'বরেন্দ্র অ্যাকুইফার ক্ষয়',
      statusEn: 'Barind Aquifer Depletion',
      descBn: 'বরেন্দ্রে মাটির নিচের পানি কমছে −১.০৭ সেমি/বছর (NASA GRACE-FO, ২০০২–২০২৬)',
      descEn: 'Groundwater in Barind is depleting at −1.07 cm/year (NASA GRACE-FO, 2002–2026)',
      isBarind: true
    };
  }
  if (HAOR_DISTRICTS.has(d)) {
    return {
      trend: '+0.44 cm/yr',
      color: 'var(--green-wp, #3ecf8e)',
      statusBn: 'হাওর প্লাবনভূমি পুনর্ভরণ',
      statusEn: 'Haor Basin Surface Recharge',
      descBn: 'হাওরে বর্ষায় প্রাকৃতিকভাবে পানি পুনর্ভরিত হয় +০.৪৪ সেমি/বছর (NASA GRACE-FO)',
      descEn: 'Haor basin experiences natural recharge at +0.44 cm/year (NASA GRACE-FO)',
      isBarind: false
    };
  }
  if (COASTAL_DISTRICTS.has(d)) {
    return {
      trend: '-0.15 cm/yr',
      color: 'var(--amber-wp, #f2b24c)',
      statusBn: 'উপকূলীয় মিষ্টি পানি সংরক্ষণ',
      statusEn: 'Coastal Storage Decline',
      descBn: 'উপকূলে শুষ্ক মৌসুমে মিষ্টি পানির স্তর কমছে −০.১৫ সেমি/বছর (NASA GRACE-FO)',
      descEn: 'Coastal dry-season freshwater storage declining at −0.15 cm/year (NASA GRACE-FO)',
      isBarind: false
    };
  }
  return {
    trend: '-0.35 cm/yr',
    color: 'var(--amber-wp, #f2b24c)',
    statusBn: 'জাতীয় গড় সঞ্চয় প্রবণতা',
    statusEn: 'National Storage Trend',
    descBn: 'মাটির নিচের পানির সঞ্চয় পরিবর্তন −০.৩৫ সেমি/বছর (NASA GRACE-FO, ২০০২–২০২৬)',
    descEn: 'National groundwater storage changing at −0.35 cm/year (NASA GRACE-FO, 2002–2026)',
    isBarind: false
  };
}

export function WaterIrrigationView({
  activeField,
  plan,
  summary,
  nasa,
  lang = 'bn',
  onNavigate,
  initialSubTab = 'balance',
}) {
  const { t } = useTranslation(lang);
  const [expertSubTab, setExpertSubTab] = useState(initialSubTab);

  const initialStrat = plan?.strategy_id || 'balanced';
  const [selectedStrategy, setSelectedStrategy] = useState(initialStrat);
  const [weatherScenario, setWeatherScenario] = useState('normal'); // 'normal' | 'dry'
  const [seasonPlanData, setSeasonPlanData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState(0);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pumpCapacity, setPumpCapacity] = useState('');
  const playTimerRef = useRef(null);

  // Sync selectedStrategy when plan changes from planner
  useEffect(() => {
    if (plan?.strategy_id && plan.strategy_id !== selectedStrategy && selectedStrategy !== 'current') {
      setSelectedStrategy(plan.strategy_id);
    }
  }, [plan?.strategy_id, selectedStrategy]);

  // Fetch seasonal water plan from backend
  useEffect(() => {
    let isMounted = true;
    const fieldId = activeField?.id || 'demo';
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      field_id: fieldId,
      strategy: selectedStrategy,
      weather_scenario: weatherScenario,
    });
    if (activeField?.district) params.set('district', activeField.district);
    if (activeField?.latitude != null) params.set('latitude', String(activeField.latitude));
    if (activeField?.longitude != null) params.set('longitude', String(activeField.longitude));
    if (activeField?.area_ha != null) params.set('area_ha', String(activeField.area_ha));

    request(`/api/water/season-plan?${params.toString()}`)
      .then(res => {
        if (!isMounted) return;
        if (res && res.status === 'ok') {
          setSeasonPlanData(res);
          setError(null);
        } else {
          setError(res?.detail || 'Failed to load water plan');
        }
      })
      .catch(err => {
        if (!isMounted) return;
        setError(err.message || 'Error loading water plan');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeField?.id, activeField?.district, activeField?.latitude, activeField?.longitude, activeField?.area_ha, selectedStrategy, weatherScenario]);

  // Stop playback on unmount
  useEffect(() => {
    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, []);

  const fieldInfo = seasonPlanData?.field || {
    name: activeField?.name || (lang === 'bn' ? 'রহিম মিয়ার জমি' : "Rahim Mia's Plot"),
    district: activeField?.district || 'chapainawabganj',
    area_bigha: activeField?.area_bigha ?? (activeField?.area_ha ? Number(activeField.area_ha) * 7.4749 : 5.0),
    area_m2: activeField?.area_m2 ?? Math.round((activeField?.area_ha || 0.6689) * 10000),
    soil_texture: activeField?.soil_texture || 'clay loam',
  };

  const seasons = seasonPlanData?.seasons || [];
  const yearly = seasonPlanData?.yearly_totals || {};
  const climatology = seasonPlanData?.climatology || {};

  // Auto-clamp selectedSeasonIdx
  useEffect(() => {
    if (seasons.length > 0 && selectedSeasonIdx >= seasons.length) {
      setSelectedSeasonIdx(0);
      setSelectedDayIdx(0);
    }
  }, [seasons.length, selectedSeasonIdx]);

  // Soil texture translation
  const soilTextureMapBn = {
    'clay loam': 'এঁটেল দোআঁশ',
    'clay_loam': 'এঁটেল দোআঁশ',
    'loam': 'দোআঁশ',
    'sandy loam': 'বেলে দোআঁশ',
    'sandy_loam': 'বেলে দোআঁশ',
    'silty loam': 'পলি দোআঁশ',
    'silty_loam': 'পলি দোআঁশ',
    'clay': 'এঁটেল মাটি',
    'sand': 'বেলে মাটি',
  };
  const soilLabel = lang === 'bn'
    ? (soilTextureMapBn[String(fieldInfo.soil_texture).toLowerCase()] || fieldInfo.soil_texture)
    : fieldInfo.soil_texture;

  const districtLabel = lang === 'bn'
    ? (fieldInfo.district === 'chapainawabganj' ? 'চাঁপাইনবাবগঞ্জ' : fieldInfo.district === 'sunamganj' ? 'সুনামগঞ্জ' : fieldInfo.district)
    : (fieldInfo.district ? fieldInfo.district.charAt(0).toUpperCase() + fieldInfo.district.slice(1) : '');

  const bighaStr = formatNumberBnEn(fieldInfo.area_bigha, 1, lang);
  const m2Str = formatNumberBnEn(fieldInfo.area_m2, 0, lang);

  // Strategy profiles
  const STRATEGIES = [
    { id: 'current', labelBn: 'আপনার এখনকার চাষ', labelEn: 'Your Current Practice' },
    { id: 'balanced', labelBn: 'সুষম পরিকল্পনা', labelEn: 'Balanced Plan' },
    { id: 'profit', labelBn: 'সর্বোচ্চ লাভ', labelEn: 'Maximum Profit' },
    { id: 'water', labelBn: 'পানি সাশ্রয়', labelEn: 'Water Saving' },
    { id: 'soil', labelBn: 'মাটির স্বাস্থ্য', labelEn: 'Soil Health' },
  ];

  const currentStratObj = STRATEGIES.find(s => s.id === selectedStrategy) || STRATEGIES[1];
  const selectedStrategyLabel = lang === 'bn' ? currentStratObj.labelBn : currentStratObj.labelEn;

  // Climatology note
  const isDry = weatherScenario === 'dry';
  const yrNote = isDry
    ? `${climatology.dry_year_label_bn || '২০০৯–১০ (শুকনো বছর)'} · ${lang === 'bn' ? 'বছরে বৃষ্টি' : 'Annual rain'} ${formatNumberBnEn(climatology.dry_annual_rainfall_mm || 1166, 0, lang)} ${lang === 'bn' ? 'মিমি' : 'mm'}`
    : `${climatology.normal_year_label_bn || '২০১৫–১৬ (স্বাভাবিক)'} · ${lang === 'bn' ? 'বছরে বৃষ্টি' : 'Annual rain'} ${formatNumberBnEn(climatology.normal_annual_rainfall_mm || 1372, 0, lang)} ${lang === 'bn' ? 'মিমি' : 'mm'}`;

  // Yearly bar comparison metrics
  const curMm = isDry ? yearly.dry_current_yearly_mm : yearly.current_yearly_mm;
  const planMm = isDry ? yearly.dry_plan_yearly_mm : yearly.plan_yearly_mm;
  const savedMm = isDry ? yearly.dry_saved_yearly_mm : yearly.saved_yearly_mm;
  const savedLitres = isDry ? yearly.dry_saved_yearly_litres : yearly.saved_yearly_litres;
  const maxMm = Math.max(curMm || 1, planMm || 1);

  // Active season
  const activeSeason = seasons[selectedSeasonIdx] || null;

  // GRACE-FO data
  const graceData = getGraceRegionData(fieldInfo.district, lang);

  return (
    <div className="water-planner-view">
      {/* Page Header */}
      <div className="wp-head">
        <h1 className="wp-title">
          {lang === 'bn' ? 'পানি ও সেচ' : 'Water & Irrigation'} · {fieldInfo.name || fieldInfo.name_en}
        </h1>
        <div className="wp-sub">
          {districtLabel} · {bighaStr} {lang === 'bn' ? 'বিঘা' : 'bigha'} ({m2Str} {lang === 'bn' ? 'বর্গমিটার' : 'm²'}) · {soilLabel} · {lang === 'bn' ? 'কোন মৌসুমে কত পানি, আর প্রতিদিন কেমন' : 'Seasonal water budget and daily irrigation schedule'}
        </div>
      </div>

      {/* Toggles Row */}
      <div className="wp-row">
        {/* Strategy Selector */}
        <div className="wp-seg" role="tablist" aria-label={lang === 'bn' ? 'পরিকল্পনা নির্বাচন' : 'Strategy selection'}>
          {STRATEGIES.map(s => {
            const isSelected = selectedStrategy === s.id;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={isSelected ? 'true' : 'false'}
                onClick={() => {
                  setSelectedStrategy(s.id);
                  setSelectedSeasonIdx(0);
                  setSelectedDayIdx(0);
                }}
              >
                {lang === 'bn' ? s.labelBn : s.labelEn}
              </button>
            );
          })}
        </div>

        {/* Normal vs Dry Year Selector */}
        <div className="wp-seg" role="tablist" aria-label={lang === 'bn' ? 'আবহাওয়া দৃশ্যপট' : 'Weather scenario'}>
          <button
            type="button"
            aria-pressed={!isDry ? 'true' : 'false'}
            onClick={() => setWeatherScenario('normal')}
          >
            {lang === 'bn' ? 'স্বাভাবিক বছর' : 'Normal Year'}
          </button>
          <button
            type="button"
            aria-pressed={isDry ? 'true' : 'false'}
            onClick={() => setWeatherScenario('dry')}
          >
            {lang === 'bn' ? 'শুকনো বছর' : 'Dry Year'}
          </button>
        </div>

        <span className="wp-muted">{yrNote}</span>
      </div>

      {/* Error / Loading notices */}
      {error && (
        <div className="wp-card" style={{ borderColor: 'var(--red-wp)' }}>
          <b style={{ color: 'var(--red-wp)' }}>{error}</b>
        </div>
      )}

      {/* SECTION 1: Seasonal Water Budget */}
      <section className="wp-card">
        <h2 className="wp-h2">{lang === 'bn' ? '১. মৌসুম ধরে পানির হিসাব' : '1. Seasonal Water Budget'}</h2>

        {/* Season Cards Grid */}
        <div className="wp-scards" style={{ '--n': seasons.length || 6 }}>
          {seasons.map((s, idx) => {
            const isSel = idx === selectedSeasonIdx;
            const cropName = lang === 'bn' ? (s.crop_bn || s.crop) : (s.crop_en || s.crop);
            const irrigMm = isDry ? s.dry_year_irrigation_mm : s.net_irrigation_mm;
            const litresVal = isDry ? Math.round(s.dry_year_irrigation_mm * (fieldInfo.area_m2 || 6689)) : s.field_litres;
            const dateStr = formatDateRange(s.start_date, s.end_date, lang);
            const seasonLabel = lang === 'bn' ? s.season_label_bn : s.season_label_en;

            return (
              <button
                key={s.period || idx}
                type="button"
                className="wp-sc"
                style={{ '--c': s.crop_color || '#3ecf8e' }}
                aria-pressed={isSel ? 'true' : 'false'}
                onClick={() => {
                  setSelectedSeasonIdx(idx);
                  setSelectedDayIdx(0);
                }}
              >
                <small>{seasonLabel} · {dateStr}</small>
                <b className="crop">{cropName}</b>

                {/* Big Number */}
                {s.is_fallow ? (
                  <span className="wp-big wp-none">
                    {lang === 'bn' ? 'জমি খালি — সেচ নেই' : 'Fallow — No irrigation'}
                  </span>
                ) : irrigMm < 5 ? (
                  <span className="wp-big wp-none">
                    {lang === 'bn' ? 'সেচ লাগবে না (বৃষ্টিতে চলবে)' : 'Rainfed — No irrigation needed'}
                  </span>
                ) : (
                  <>
                    <span className="wp-big">
                      {formatNumberBnEn(irrigMm, 0, lang)} {lang === 'bn' ? 'মিমি' : 'mm'}
                    </span>
                    <span className="wp-l">
                      = {formatNumberBnEn(litresVal, 0, lang)} {lang === 'bn' ? `লিটার আপনার ${bighaStr} বিঘায়` : `litres on your ${bighaStr} bigha`}
                    </span>
                  </>
                )}

                {/* Irrigation events and interval */}
                {!s.is_fallow && irrigMm >= 5 && (
                  <span className="wp-l">
                    {formatNumberBnEn(s.irrigation_events_count, 0, lang)} {lang === 'bn' ? `বার সেচ, প্রায় ${formatNumberBnEn(s.recommended_interval_days, 0, lang)} দিন পরপর` : `irrigations, every ~${formatNumberBnEn(s.recommended_interval_days, 0, lang)} days`}
                  </span>
                )}

                {/* Rice AWD comparison */}
                {s.is_rice && s.continuous_flooding_mm && s.continuous_flooding_mm > irrigMm + 5 && (
                  <span className="wp-l">
                    {lang === 'bn'
                      ? `সবসময় পানি ধরে রাখলে ${formatNumberBnEn(s.continuous_flooding_mm, 0, lang)} মিমি`
                      : `Continuous flooding: ${formatNumberBnEn(s.continuous_flooding_mm, 0, lang)} mm`}
                  </span>
                )}

                {/* Rainfall */}
                <span className="wp-l wp-muted">
                  {lang === 'bn'
                    ? `বৃষ্টি দেবে ${formatNumberBnEn(s.effective_rainfall_mm, 0, lang)} মিমি (মোট ${formatNumberBnEn(s.rainfall_mm, 0, lang)})`
                    : `Rain: ${formatNumberBnEn(s.effective_rainfall_mm, 0, lang)} mm eff. (${formatNumberBnEn(s.rainfall_mm, 0, lang)} tot)`}
                </span>

                {/* Dry/normal comparison badge */}
                {!isDry ? (
                  <span className="wp-dry">
                    {lang === 'bn'
                      ? `শুকনো বছরে ${formatNumberBnEn(s.dry_year_irrigation_mm, 0, lang)} মিমি`
                      : `Dry year: ${formatNumberBnEn(s.dry_year_irrigation_mm, 0, lang)} mm`}
                  </span>
                ) : (
                  <span className="wp-dry">
                    {lang === 'bn'
                      ? `স্বাভাবিক বছরে ${formatNumberBnEn(s.net_irrigation_mm, 0, lang)} মিমি`
                      : `Normal year: ${formatNumberBnEn(s.net_irrigation_mm, 0, lang)} mm`}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Yearly Total Comparison Bar */}
        <div className="wp-yb" style={{ marginTop: 14 }}>
          <div>
            <span>{lang === 'bn' ? 'আপনার এখনকার চাষ' : 'Your Current Practice'}</span>
            <i style={{ width: `${Math.min(100, (curMm / maxMm) * 100)}%`, background: 'var(--amber-wp)' }} />
            <span>{formatNumberBnEn(curMm, 0, lang)} {lang === 'bn' ? 'মিমি/বছর' : 'mm/yr'}</span>
          </div>
          <div>
            <span>{selectedStrategyLabel}</span>
            <i style={{ width: `${Math.min(100, (planMm / maxMm) * 100)}%`, background: 'var(--blue-wp)' }} />
            <span>{formatNumberBnEn(planMm, 0, lang)} {lang === 'bn' ? 'মিমি/বছর' : 'mm/yr'}</span>
          </div>

          {selectedStrategy === 'current' ? (
            <p className="wp-muted" style={{ margin: '4px 0 0' }}>
              {lang === 'bn'
                ? `এখনকার চাষে বছরে সেচ লাগে ${formatNumberBnEn(curMm, 0, lang)} মিমি।`
                : `Current practice requires ${formatNumberBnEn(curMm, 0, lang)} mm irrigation per year.`}
            </p>
          ) : (
            <p className="wp-muted" style={{ margin: '4px 0 0' }}>
              {lang === 'bn' ? 'বছরে প্রায় ' : 'Saves approx. '}
              <b style={{ color: 'var(--green-wp)' }}>
                {formatNumberBnEn(savedMm, 0, lang)} {lang === 'bn' ? 'মিমি' : 'mm'} = {formatNumberBnEn(savedLitres, 0, lang)} {lang === 'bn' ? 'লিটার' : 'litres'}
              </b>
              {lang === 'bn' ? ` পানি বাঁচে, শুধু আপনার ${bighaStr} বিঘায়।` : ` of water per year on your ${bighaStr} bighas.`}
            </p>
          )}
        </div>
      </section>

      {/* SECTION 2: Daily Water Placeholder (W3 will implement diorama & chart) */}
      <section className="wp-card">
        <h2 className="wp-h2">
          {lang === 'bn'
            ? `২. প্রতিদিনের পানি · ${activeSeason ? (lang === 'bn' ? activeSeason.crop_bn : activeSeason.crop_en) : ''}`
            : `2. Daily Water Schedule · ${activeSeason ? activeSeason.crop_en : ''}`}
        </h2>
        <p className="wp-muted" style={{ margin: 0 }}>
          {lang === 'bn'
            ? 'প্রতিদিনের বাষ্পীভবন (ETc), বৃষ্টি এবং এডব্লিউডি (AWD) সেচ সময়সূচী।'
            : 'Daily evapotranspiration (ETc), effective rainfall, and AWD irrigation timeline.'}
        </p>
      </section>

      {/* SECTION 3: Why Save Water (GRACE-FO Aquifer depletion) */}
      <section className="wp-card">
        <div className="wp-row" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>
            <b>{lang === 'bn' ? 'কেন পানি বাঁচানো দরকার:' : 'Why Save Water:'}</b>{' '}
            {graceData.descBn}
          </div>
          {onNavigate && (
            <button
              type="button"
              className="wp-muted"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={() => onNavigate('weather')}
            >
              {lang === 'bn' ? 'আবহাওয়া ও ঝুঁকি →' : 'Climate & Risk →'}
            </button>
          )}
        </div>
      </section>

      {/* EXPERT DRAWER: Engineering Diagnostics */}
      <details className="wp-expert-details">
        <summary className="wp-expert-summary">
          {lang === 'bn' ? 'বিস্তারিত (বিশেষজ্ঞদের জন্য)' : 'Detailed Diagnostics (For Experts)'}
        </summary>
        <div style={{ marginTop: 14 }}>
          <p className="wp-muted">
            {lang === 'bn'
              ? 'এফএও-৫৬ মৃত্তিকা পানি ব্যালেন্স ও রুট-জোন হাইড্রোডাইনামিক বিশ্লেষণ।'
              : 'FAO-56 Soil Water Balance & Root-zone Hydrodynamic Analysis.'}
          </p>
          <div className="wp-row" style={{ marginTop: 10 }}>
            <div className="wp-seg">
              <button
                type="button"
                aria-pressed={expertSubTab === 'balance' ? 'true' : 'false'}
                onClick={() => setExpertSubTab('balance')}
              >
                {lang === 'bn' ? 'পানির ব্যালেন্স' : 'Water Balance'}
              </button>
              <button
                type="button"
                aria-pressed={expertSubTab === 'profile' ? 'true' : 'false'}
                onClick={() => setExpertSubTab('profile')}
              >
                {lang === 'bn' ? 'মৃত্তিকা প্রোফাইল' : 'Soil Profile'}
              </button>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            {expertSubTab === 'balance' && (
              <WaterBalance3D
                crop={activeSeason?.crop || 'Mustard'}
                soilTexture={fieldInfo.soil_texture || 'clay loam'}
                irrigationMm={activeSeason?.net_irrigation_mm || 300}
                rainMm={activeSeason?.rainfall_mm || 50}
                lang={lang}
              />
            )}
            {expertSubTab === 'profile' && (
              <SoilProfile3D
                soilTexture={fieldInfo.soil_texture || 'clay loam'}
                waterTableM={1.2}
                rootDepthM={0.8}
                lang={lang}
              />
            )}
          </div>
        </div>
      </details>
    </div>
  );
}

export default WaterIrrigationView;
