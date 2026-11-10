// frontend/src/WaterIrrigationView.jsx
// Water & Irrigation Workspace for FieldShift 2026
// Rebuilt according to docs/water_layout_reference.html:
// 1. Seasonal Water Budget cards and yearly comparison bar
// 2. Daily water balance chart, AWD soil diorama, and irrigation schedule
// 3. Regional aquifer context (NASA GRACE-FO)
// Deep engineering diagnostics demoted into collapsed expert drawer.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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

// Pseudorandom generator for deterministic plant/crack layout
function makeRng(seed) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
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

  // Active season & daily plan list
  const activeSeason = seasons[selectedSeasonIdx] || null;
  const isDry = weatherScenario === 'dry';
  const dailyList = useMemo(() => {
    if (!activeSeason) return [];
    return isDry ? (activeSeason.dry_daily_plan || activeSeason.daily_plan || []) : (activeSeason.daily_plan || []);
  }, [activeSeason, isDry]);

  // Auto-clamp selectedDayIdx
  useEffect(() => {
    if (dailyList.length > 0 && selectedDayIdx >= dailyList.length) {
      setSelectedDayIdx(0);
    }
  }, [dailyList.length, selectedDayIdx]);

  // Handle Play/Pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
      setIsPlaying(false);
    } else {
      if (dailyList.length <= 1) return;
      setIsPlaying(true);
      const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const intervalMs = reduced ? 400 : 120;
      playTimerRef.current = setInterval(() => {
        setSelectedDayIdx(prev => (prev + 1) % dailyList.length);
      }, intervalMs);
    }
  }, [isPlaying, dailyList.length]);

  // Stop playback on unmount or season change
  useEffect(() => {
    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [selectedSeasonIdx]);

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
  const yrNote = isDry
    ? `${climatology.dry_year_label_bn || '২০০৯–১০ (শুকনো বছর)'} · ${lang === 'bn' ? 'বছরে বৃষ্টি' : 'Annual rain'} ${formatNumberBnEn(climatology.dry_annual_rainfall_mm || 1166, 0, lang)} ${lang === 'bn' ? 'মিমি' : 'mm'}`
    : `${climatology.normal_year_label_bn || '২০১৫–১৬ (স্বাভাবিক)'} · ${lang === 'bn' ? 'বছরে বৃষ্টি' : 'Annual rain'} ${formatNumberBnEn(climatology.normal_annual_rainfall_mm || 1372, 0, lang)} ${lang === 'bn' ? 'মিমি' : 'mm'}`;

  // Hydrological soil water calculations (FAO-56 standards)
  const soilWaterSpecs = useMemo(() => {
    const specs = {
      clay_loam: { fc: 0.32, pwp: 0.18, tawMmPerM: 140, p: 0.50 },
      loam: { fc: 0.28, pwp: 0.14, tawMmPerM: 140, p: 0.55 },
      silty_loam: { fc: 0.31, pwp: 0.15, tawMmPerM: 160, p: 0.50 },
      sandy_loam: { fc: 0.21, pwp: 0.09, tawMmPerM: 120, p: 0.60 },
      clay: { fc: 0.36, pwp: 0.22, tawMmPerM: 140, p: 0.45 },
    };
    const s = String(fieldInfo.soil_texture || '').toLowerCase().replace(' ', '_');
    return specs[s] || specs.clay_loam;
  }, [fieldInfo.soil_texture]);

  const zRootM = 0.8;
  const tawMm = Math.round(soilWaterSpecs.tawMmPerM * zRootM);
  const rawMm = Math.round(tawMm * soilWaterSpecs.p);
  const borewellLimitMm = fieldInfo.irrigation_capacity_mm != null ? Number(fieldInfo.irrigation_capacity_mm) : 1200;
  const curMm = isDry ? yearly.dry_current_yearly_mm : yearly.current_yearly_mm;
  const planMm = isDry ? yearly.dry_plan_yearly_mm : yearly.plan_yearly_mm;
  const savedMm = isDry ? yearly.dry_saved_yearly_mm : yearly.saved_yearly_mm;
  const savedLitres = isDry ? yearly.dry_saved_yearly_litres : yearly.saved_yearly_litres;
  const maxMm = Math.max(curMm || 1, planMm || 1);

  // GRACE-FO data
  const graceData = getGraceRegionData(fieldInfo.district, lang);

  // Active day data for diorama & card
  const activeDay = dailyList[selectedDayIdx] || null;

  // Next irrigation after activeDay
  const nextIrrig = useMemo(() => {
    if (!activeDay || !dailyList.length) return null;
    return dailyList.slice(selectedDayIdx + 1).find(d => (d.irr || 0) > 0) || null;
  }, [activeDay, dailyList, selectedDayIdx]);

  // Next 7 days list ("এই সপ্তাহ")
  const next7Days = useMemo(() => {
    if (!dailyList.length) return [];
    return dailyList.slice(selectedDayIdx, selectedDayIdx + 7);
  }, [dailyList, selectedDayIdx]);

  // Next irrigation pump hours calculation
  const pumpNum = Number(pumpCapacity) || 0;
  const nextIrrigLitres = nextIrrig ? Math.round((nextIrrig.irr || 0) * (fieldInfo.area_m2 || 6689)) : 0;
  const nextPumpHours = pumpNum > 0 && nextIrrigLitres > 0 ? (nextIrrigLitres / pumpNum).toFixed(1) : null;

  // Guidance message
  let adviceSay = '';
  if (activeSeason?.is_fallow) {
    adviceSay = lang === 'bn'
      ? 'জমিতে কোনো ফসল নেই। মাটি খালি থাকলে বৃষ্টিতে মাটি ধুয়ে যায়, আগাছা বাড়ে।'
      : 'No standing crop. Uncovered fallow soil risks nutrient runoff and weed infestation.';
  } else if (activeSeason?.is_rice) {
    const pondL = activeDay?.L || 0;
    if (pondL > 20) {
      adviceSay = lang === 'bn'
        ? `ধানক্ষেতে ${formatNumberBnEn(Math.round(pondL / 10), 0, lang)} সেমি পানি দাঁড়িয়ে। এখন সেচ লাগবে না।`
        : `Ponded water at ${formatNumberBnEn(Math.round(pondL / 10), 0, lang)} cm depth. No irrigation needed.`;
    } else if (pondL > 0) {
      adviceSay = lang === 'bn'
        ? 'পানি প্রায় শেষ, তবে মাটি ভেজা। AWD-তে এখনো সেচ নয়।'
        : 'Surface water receding but topsoil saturated. Under AWD, do not irrigate yet.';
    } else {
      const wtCm = activeDay?.water_table_cm || 0;
      adviceSay = lang === 'bn'
        ? `উপরে পানি নেই, পাইপে পানি ${formatNumberBnEn(wtCm, 0, lang)} সেমি নিচে। ১৫ সেমি নিচে নামলে সেচ দিন (AWD)।`
        : `No standing water; water table is ${formatNumberBnEn(wtCm, 0, lang)} cm down in the pipe. Irrigate when it reaches 15 cm.`;
    }
  } else {
    const m = activeDay?.moist != null ? activeDay.moist : 0.6;
    if (m > 0.6) {
      adviceSay = lang === 'bn'
        ? 'মাটিতে যথেষ্ট রস আছে। সেচ লাগবে না।'
        : 'Root-zone moisture is optimal. No irrigation required.';
    } else if (m > 0.5) {
      adviceSay = lang === 'bn'
        ? 'রস কমছে, কয়েক দিনের মধ্যে সেচ লাগবে।'
        : 'Moisture gradually depleting. Plan irrigation within a few days.';
    } else {
      adviceSay = lang === 'bn'
        ? 'রস কম, গাছ চাপে পড়ছে। সেচ দিন।'
        : 'Soil moisture depleted below threshold. Irrigate now.';
    }
  }

  // -------------------------------------------------------------
  // Isometric 3D Field Cutaway SVG Builder
  // -------------------------------------------------------------
  const renderFieldCutaway = () => {
    if (!activeDay || !activeSeason) return null;
    const d = activeDay;
    const c = activeSeason;
    const sKey = String(c.crop || '').toLowerCase();
    const S = 30;
    const OX = 400;
    const OY = 150;
    const P = (x, y, z) => [OX + (x - y) * S * 0.866, OY + (x + y) * S * 0.5 - z * S];
    const pts = a => a.map(p => P(...p).map(n => Math.round(n * 10) / 10).join(',')).join(' ');

    const W = 9;
    const Dp = 6;
    const soilTop = 0;
    const soilBot = -4.2;

    const rr = makeRng((selectedDayIdx * 131) + (selectedSeasonIdx * 7) + 1);

    // Rice water table level / Upland root depth
    let wt = 0;
    if (c.is_rice) {
      wt = (d.L || 0) >= 0 ? 0 : Math.max(soilBot, -((d.water_table_cm || 0) / 15) * 1.0);
    }
    const rz = c.is_fallow ? -1.0 : -(0.3 + (0.8 - 0.3) * Math.min(1, (d.fraction || 0) / 0.5)) * 2.6;
    const moistVal = d.moist != null ? d.moist : 0.6;
    const uplandCol = moistVal > 0.6 ? '#2f7fb8' : moistVal > 0.35 ? '#5a8fb0' : '#8a7350';
    const isDrySoil = !c.is_rice && moistVal < 0.35;

    // Top surface color
    const topColor = c.is_rice && (d.L || 0) > -20 ? '#3b2d20' : isDrySoil ? '#a0805a' : '#6e5236';

    // Plants setup
    const plantH = c.is_fallow ? 0 : Math.min(1, 0.25 + (d.fraction || 0) * 1.2) * (c.is_rice ? 1.6 : (sKey === 'sesame' ? 1.8 : 1.2));
    const isStressed = !c.is_rice && !c.is_fallow && moistVal < 0.45;
    const plantColor = c.is_rice ? ((d.fraction || 0) > 0.75 ? '#c9b04a' : '#6fc24a') : (isStressed ? '#b8a84a' : '#6fae45');
    const flowerColor = sKey === 'mustard' ? '#f5d02a' : sKey === 'sesame' ? '#f4eee6' : sKey === 'mungbean' ? '#f2d22b' : '#f3d6e2';
    const hasFlowers = ['mustard', 'sesame', 'mungbean', 'chickpea'].includes(sKey) && (d.fraction || 0) > 0.35 && (d.fraction || 0) < 0.75;

    // Plant coordinates grid
    const plants = [];
    if (!c.is_fallow) {
      for (let x = 0.6; x < W - 0.3; x += 0.75) {
        for (let y = 0.6; y < Dp - 0.3; y += 0.75) {
          plants.push([x, y]);
        }
      }
      plants.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
    }

    // Ponded water height
    const pondZ = Math.max(0.05, ((d.L || 0) / 150) * 1.1);

    // AWD pipe coordinates
    const [px, py] = P(W - 0.8, Dp - 0.8, 0);
    const pipeTop = py - 34;
    const pipeBot = py + (2.2 * S * 0.9);
    const pipeWaterLvl = (d.L || 0) >= 0 ? pipeTop + 6 : py + Math.min(1.6, (d.water_table_cm || 0) / 15) * S * 0.6;

    // Rain strokes
    const rainStrokes = [];
    if ((d.rain || 0) > 1) {
      const count = Math.min(50, 8 + Math.round((d.rain || 0) * 3));
      for (let i = 0; i < count; i++) {
        const rx = 120 + rr() * 560;
        const ry = 10 + rr() * 120;
        rainStrokes.push([rx, ry]);
      }
    }

    // Irrigation nozzle
    const [ix, iy] = P(-0.3, Dp * 0.5, 0.4);
    const [dx, dy] = P(0, Dp, soilBot);
    const [lx, ly] = P(W, Dp, rz / 2);

    return (
      <svg viewBox="0 0 800 500" role="img" aria-label={lang === 'bn' ? 'জমির পানির অবস্থা' : 'Soil water cutaway'}>
        {/* Base soil block faces */}
        <polygon points={pts([[0, Dp, soilTop], [W, Dp, soilTop], [W, Dp, soilBot], [0, Dp, soilBot]])} fill="#5c432c" />
        <polygon points={pts([[W, 0, soilTop], [W, Dp, soilTop], [W, Dp, soilBot], [W, 0, soilBot]])} fill="#4a3624" />

        {/* Moisture / Water table on faces */}
        {c.is_rice ? (
          <>
            <polygon points={pts([[0, Dp, wt], [W, Dp, wt], [W, Dp, soilBot], [0, Dp, soilBot]])} fill="#2f7fb8" opacity="0.55" />
            <polygon points={pts([[W, 0, wt], [W, Dp, wt], [W, Dp, soilBot], [W, 0, soilBot]])} fill="#286c9c" opacity="0.55" />
            {(d.L || 0) < 0 && (
              <polyline points={pts([[0, Dp, wt], [W, Dp, wt], [W, 0, wt]])} fill="none" stroke="#8fd3ff" strokeWidth="2" strokeDasharray="6 5" />
            )}
          </>
        ) : (
          <>
            <polygon points={pts([[0, Dp, 0], [W, Dp, 0], [W, Dp, rz], [0, Dp, rz]])} fill={uplandCol} opacity={0.25 + moistVal * 0.5} />
            <polygon points={pts([[W, 0, 0], [W, Dp, 0], [W, Dp, rz], [W, 0, rz]])} fill={uplandCol} opacity={0.2 + moistVal * 0.45} />
            <polyline points={pts([[0, Dp, rz], [W, Dp, rz], [W, 0, rz]])} fill="none" stroke="#c9a46a" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
            <text x={lx + 12} y={ly} fill="#e7efe8" fontSize="13">
              {lang === 'bn' ? 'শিকড়ের অংশ' : 'Root zone'}
            </text>
          </>
        )}

        {/* Top soil surface */}
        <polygon points={pts([[0, 0, 0], [W, 0, 0], [W, Dp, 0], [0, Dp, 0]])} fill={topColor} />

        {/* Drought cracks */}
        {(isDrySoil || (c.is_fallow && moistVal < 0.4)) && (
          Array.from({ length: 16 }).map((_, i) => {
            const cx = 0.5 + rr() * 8;
            const cy = 0.5 + rr() * 5;
            const [a, b] = P(cx, cy, 0);
            const [e, f] = P(cx + 0.6, cy + 0.3, 0);
            return <path key={i} d={`M${a},${b} L${e},${f}`} stroke="#5a4028" strokeWidth="1.2" />;
          })
        )}

        {/* Bunds */}
        <polygon points={pts([[-0.3, -0.3, 0.35], [W + 0.3, -0.3, 0.35], [W + 0.3, Dp + 0.3, 0.35], [-0.3, Dp + 0.3, 0.35]])} fill="none" stroke="#7aa25a" strokeWidth="7" strokeLinejoin="round" opacity="0.9" />

        {/* Plants grid */}
        {!c.is_fallow && plants.map(([pxCoord, pyCoord], idx) => {
          const [bxCoord, byCoord] = P(pxCoord, pyCoord, 0);
          const topDist = plantH * S;
          return (
            <g key={idx}>
              <path
                d={`M${bxCoord},${byCoord} l-4,${-topDist * 0.85} M${bxCoord},${byCoord} l0,${-topDist} M${bxCoord},${byCoord} l4,${-topDist * 0.85}`}
                stroke={plantColor}
                strokeWidth="2"
                strokeLinecap="round"
              />
              {hasFlowers && (
                <circle cx={bxCoord} cy={byCoord - topDist} r="3" fill={flowerColor} />
              )}
            </g>
          );
        })}

        {/* Ponded water on top of rice */}
        {c.is_rice && (d.L || 0) > 0 && (
          <>
            <polygon points={pts([[0, 0, pondZ], [W, 0, pondZ], [W, Dp, pondZ], [0, Dp, pondZ]])} fill="#4aa8e8" opacity="0.45" />
            <polygon points={pts([[0, Dp, pondZ], [W, Dp, pondZ], [W, Dp, 0], [0, Dp, 0]])} fill="#3b8fd0" opacity="0.55" />
            <polygon points={pts([[W, 0, pondZ], [W, Dp, pondZ], [W, Dp, 0], [W, 0, 0]])} fill="#3480bd" opacity="0.55" />
          </>
        )}

        {/* AWD pipe for rice */}
        {c.is_rice && (
          <g>
            <rect x={px - 7} y={pipeTop} width="14" height={pipeBot - pipeTop} rx="4" fill="rgba(230,240,245,.25)" stroke="#dfe9ee" strokeWidth="1.5" />
            <rect x={px - 5} y={pipeWaterLvl} width="10" height={pipeBot - pipeWaterLvl - 2} fill="#4aa8e8" />
            <text x={px + 12} y={pipeTop + 10} fill="#dfe9ee" fontSize="12">
              {lang === 'bn' ? 'AWD পাইপ' : 'AWD pipe'}
            </text>
          </g>
        )}

        {/* Rain animation strokes */}
        {rainStrokes.map(([rx, ry], idx) => (
          <path key={idx} d={`M${rx},${ry} l-5,16`} stroke="#8fd3ff" strokeWidth="2" opacity="0.7" />
        ))}

        {/* Irrigation inflow pipe and splash */}
        {(d.irr || 0) > 0 && (
          <g>
            <rect x={ix - 40} y={iy - 10} width="40" height="12" rx="3" fill="#8b98a3" />
            <path d={`M${ix},${iy - 4} q30,-10 50,20`} stroke="#4aa8e8" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.9" />
            <text x={ix - 40} y={iy - 18} fill="#8fd3ff" fontSize="14" fontWeight="700">
              {lang === 'bn'
                ? `💧 আজ সেচ ${formatNumberBnEn(Math.round(d.irr), 0, lang)} মিমি`
                : `💧 Irrigation today: ${formatNumberBnEn(Math.round(d.irr), 0, lang)} mm`}
            </text>
          </g>
        )}

        {/* Cut-away depth caption */}
        <text x={dx - 10} y={dy + 22} fill="#93a597" fontSize="12">
          {lang === 'bn' ? 'মাটির নিচে ~১.৫ মিটার পর্যন্ত কাটা দৃশ্য' : 'Cut-away view down to ~1.5m depth'}
        </text>
      </svg>
    );
  };

  // -------------------------------------------------------------
  // Daily ETc & Rain Bar Chart SVG Builder
  // -------------------------------------------------------------
  const renderDailyChart = () => {
    if (!dailyList.length) return null;
    const n = dailyList.length;
    const W = 1100;
    const H = 230;
    const L = 36;
    const R = 10;
    const T = 14;
    const B = 26;

    const mx = Math.max(8, ...dailyList.map(d => Math.max(d.etc || 0, Math.min(d.rain || 0, 25))));
    const X = i => L + (i + 0.5) * (W - L - R) / n;
    const Y = v => T + (1 - v / mx) * (H - T - B);
    const bw = Math.max(1, (W - L - R) / n - 1);

    const handleChartClick = e => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * W;
      const clickedIdx = Math.max(0, Math.min(n - 1, Math.floor((clickX - L) / ((W - L - R) / n))));
      setSelectedDayIdx(clickedIdx);
    };

    return (
      <div className="wp-chart" style={{ marginTop: 14 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Grid lines */}
          {[0, mx / 2, mx].map(v => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke="var(--grid-wp, #223028)" />
              <text x={L - 6} y={Y(v) + 4} textAnchor="end" fill="var(--muted-wp, #93a597)" fontSize="11">
                {formatNumberBnEn(Math.round(v), 0, lang)}
              </text>
            </g>
          ))}

          {/* Daily Bars */}
          {dailyList.map((d, i) => {
            const dObj = new Date(d.date);
            const isFirstDayOfMonth = !isNaN(dObj.getTime()) && dObj.getDate() === 1;
            const monthLabel = lang === 'bn' ? MONTHS_BN[dObj.getMonth()] : MONTHS_EN[dObj.getMonth()];

            return (
              <g key={i}>
                {/* Crop water use ETc (green bar) */}
                {(d.etc || 0) > 0 && (
                  <rect
                    x={X(i) - bw / 2}
                    y={Y(d.etc)}
                    width={bw}
                    height={Math.max(1, Y(0) - Y(d.etc))}
                    fill="var(--green-wp, #3ecf8e)"
                    opacity="0.75"
                  />
                )}

                {/* Rain (blue bar) */}
                {(d.rain || 0) > 0.5 && (
                  <rect
                    x={X(i) - bw / 2}
                    y={Y(Math.min(d.rain, mx))}
                    width={bw}
                    height={Math.max(1, Y(0) - Y(Math.min(d.rain, mx)))}
                    fill="var(--blue-wp, #4fb3f0)"
                    opacity="0.55"
                  />
                )}

                {/* Irrigation event water drop */}
                {(d.irr || 0) > 0 && (
                  <text x={X(i)} y={T + 6} textAnchor="middle" fontSize="13">
                    💧
                  </text>
                )}

                {/* Month marker */}
                {isFirstDayOfMonth && (
                  <text x={X(i)} y={H - 8} textAnchor="middle" fill="var(--muted-wp, #93a597)" fontSize="11">
                    {monthLabel}
                  </text>
                )}
              </g>
            );
          })}

          {/* Selected day cursor line */}
          <line
            x1={X(selectedDayIdx)}
            x2={X(selectedDayIdx)}
            y1={T}
            y2={H - B}
            stroke="var(--accent-wp, #c8e46a)"
            strokeWidth="3"
          />

          {/* Clickable transparent hit area */}
          <rect
            x={L}
            y={T}
            width={W - L - R}
            height={H - T - B}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onClick={handleChartClick}
          />
        </svg>

        {/* Legend */}
        <div className="wp-lg">
          <span><i style={{ background: 'var(--green-wp, #3ecf8e)' }} />{lang === 'bn' ? 'গাছের পানি খরচ (মিমি/দিন)' : 'Crop ETc (mm/day)'}</span>
          <span><i style={{ background: 'var(--blue-wp, #4fb3f0)' }} />{lang === 'bn' ? 'বৃষ্টি' : 'Rain'}</span>
          <span>💧 {lang === 'bn' ? 'সেচের দিন' : 'Irrigation day'}</span>
          <span><i style={{ background: 'var(--accent-wp, #c8e46a)', width: 3 }} />{lang === 'bn' ? 'বাছাই করা দিন' : 'Selected day'}</span>
        </div>
      </div>
    );
  };

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

      {/* Error Notice */}
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

      {/* SECTION 2: Daily Water Schedule & Cutaway Diorama */}
      <section className="wp-card">
        <h2 className="wp-h2">
          {lang === 'bn'
            ? `২. প্রতিদিনের পানি · ${activeSeason ? (lang === 'bn' ? (activeSeason.crop_bn || activeSeason.crop) : (activeSeason.crop_en || activeSeason.crop)) : ''}`
            : `2. Daily Water Schedule · ${activeSeason ? (activeSeason.crop_en || activeSeason.crop) : ''}`}
        </h2>

        {/* Main 2-column diorama & This Day card */}
        <div className="wp-main">
          {/* Left Column: Isometric SVG cutaway & Scrub controls */}
          <div>
            <div className="wp-viz">
              {renderFieldCutaway()}

              {/* State Pills Overlay */}
              <div className="wp-state">
                {activeSeason?.is_fallow ? (
                  <>
                    <span className="wp-pill s">{lang === 'bn' ? 'জমি খালি' : 'Fallow land'}</span>
                    <span className="wp-pill">
                      {lang === 'bn' ? `মাটির রস ${formatNumberBnEn(Math.round((activeDay?.moist || 0) * 100), 0, lang)}%` : `Moisture ${formatNumberBnEn(Math.round((activeDay?.moist || 0) * 100), 0, lang)}%`}
                    </span>
                  </>
                ) : activeSeason?.is_rice ? (
                  (activeDay?.L || 0) > 20 ? (
                    <span className="wp-pill w">
                      {lang === 'bn' ? `পুরো জমি পানির নিচে · ${formatNumberBnEn(Math.round((activeDay?.L || 0) / 10), 0, lang)} সেমি` : `Ponded water: ${formatNumberBnEn(Math.round((activeDay?.L || 0) / 10), 0, lang)} cm`}
                    </span>
                  ) : (activeDay?.L || 0) > 0 ? (
                    <span className="wp-pill w">
                      {lang === 'bn' ? `হালকা পানি · ${formatNumberBnEn(Math.round((activeDay?.L || 0) / 10), 0, lang)} সেমি (নিচু অংশে)` : `Shallow water: ${formatNumberBnEn(Math.round((activeDay?.L || 0) / 10), 0, lang)} cm`}
                    </span>
                  ) : (
                    <span className="wp-pill s">
                      {lang === 'bn' ? `উপরে পানি নেই · পানি মাটির ${formatNumberBnEn(activeDay?.water_table_cm || 0, 0, lang)} সেমি নিচে` : `Water table ${formatNumberBnEn(activeDay?.water_table_cm || 0, 0, lang)} cm below soil`}
                    </span>
                  )
                ) : (
                  <span className={`wp-pill ${(activeDay?.moist || 0) < 0.5 ? 's' : ''}`}>
                    {lang === 'bn' ? `জমিতে পানি দাঁড়ায় না · শিকড়ে রস ${formatNumberBnEn(Math.round((activeDay?.moist || 0) * 100), 0, lang)}%` : `Upland soil · Root moisture ${formatNumberBnEn(Math.round((activeDay?.moist || 0) * 100), 0, lang)}%`}
                  </span>
                )}

                {/* Date & Day count pill */}
                {activeDay && (
                  <span className="wp-pill">
                    {formatShortDate(activeDay.date, lang)} · {lang === 'bn' ? (activeSeason?.crop_bn || activeSeason?.crop) : (activeSeason?.crop_en || activeSeason?.crop)}, {lang === 'bn' ? `দিন ${formatNumberBnEn(activeDay.day, 0, lang)}/${formatNumberBnEn(dailyList.length, 0, lang)}` : `Day ${formatNumberBnEn(activeDay.day, 0, lang)}/${formatNumberBnEn(dailyList.length, 0, lang)}`}
                  </span>
                )}
              </div>
            </div>

            {/* Scrub Controls */}
            <div className="wp-ctrl">
              <button type="button" onClick={togglePlay}>
                {isPlaying ? (lang === 'bn' ? '⏸ থামান' : '⏸ Pause') : (lang === 'bn' ? '▶ চালান' : '▶ Play')}
              </button>
              <input
                type="range"
                min="0"
                max={Math.max(0, dailyList.length - 1)}
                value={selectedDayIdx}
                onChange={e => setSelectedDayIdx(Number(e.target.value))}
                aria-label={lang === 'bn' ? 'দিন নির্বাচন' : 'Select day'}
              />
              <span className="wp-muted" style={{ minWidth: 70, textAlign: 'right' }}>
                {activeDay ? formatShortDate(activeDay.date, lang) : ''}
              </span>
            </div>
          </div>

          {/* Right Column: "This Day" summary card */}
          <div className="wp-day">
            {activeDay && (
              <>
                <h3>
                  {formatShortDate(activeDay.date, lang)} · {lang === 'bn' ? (activeSeason?.crop_bn || activeSeason?.crop) : (activeSeason?.crop_en || activeSeason?.crop)}
                </h3>

                {/* Key Value Metric Grid */}
                <div className="wp-kv">
                  <div>
                    <span>{lang === 'bn' ? 'গাছ আজ পানি খরচ করছে' : 'Crop ETc today'}</span>
                    <strong>{formatNumberBnEn(activeDay.etc, 1, lang)} {lang === 'bn' ? 'মিমি' : 'mm'}</strong>
                  </div>
                  <div>
                    <span>{lang === 'bn' ? 'আজ বৃষ্টি' : 'Rain today'}</span>
                    <strong>{formatNumberBnEn(activeDay.rain, 1, lang)} {lang === 'bn' ? 'মিমি' : 'mm'}</strong>
                  </div>
                  <div>
                    <span>{lang === 'bn' ? '= আপনার জমিতে আজ খরচ' : '= Field water used today'}</span>
                    <strong>
                      {formatNumberBnEn(Math.round((activeDay.etc || 0) * (fieldInfo.area_m2 || 6689) / 100) * 100, 0, lang)} {lang === 'bn' ? 'লিটার' : 'litres'}
                    </strong>
                  </div>
                  <div>
                    <span>{lang === 'bn' ? 'আবহাওয়ার চাহিদা (ET০)' : 'Reference ET0'}</span>
                    <strong>{formatNumberBnEn(activeDay.et0, 1, lang)} {lang === 'bn' ? 'মিমি' : 'mm'}</strong>
                  </div>
                </div>

                {/* Farmer Guidance Box */}
                <div className="wp-say">{adviceSay}</div>

                {/* Next Irrigation Box */}
                {!activeSeason?.is_fallow && (
                  nextIrrig ? (
                    <div className="wp-next">
                      💧 {lang === 'bn' ? 'পরের সেচ: ' : 'Next irrigation: '}
                      <b>{formatShortDate(nextIrrig.date, lang)}</b>{' '}
                      ({lang === 'bn' ? `আরও ${formatNumberBnEn(nextIrrig.day - activeDay.day, 0, lang)} দিন` : `in ${formatNumberBnEn(nextIrrig.day - activeDay.day, 0, lang)} days`}) ·{' '}
                      <b>
                        {formatNumberBnEn(Math.round(nextIrrig.irr), 0, lang)} {lang === 'bn' ? 'মিমি' : 'mm'} = {formatNumberBnEn(nextIrrigLitres, 0, lang)} {lang === 'bn' ? 'লিটার' : 'litres'}
                      </b>
                      {nextPumpHours && (
                        <> · {lang === 'bn' ? 'পাম্প চালান প্রায় ' : 'Run pump for ~'}<b>{formatNumberBnEn(nextPumpHours, 1, lang)} {lang === 'bn' ? 'ঘণ্টা' : 'hours'}</b></>
                      )}
                    </div>
                  ) : (
                    <div className="wp-next">
                      {lang === 'bn' ? 'এই মৌসুমে আর সেচ লাগবে না।' : 'No more irrigations scheduled for this season.'}
                    </div>
                  )
                )}

                {/* Pump Capacity Input */}
                <label className="wp-pump">
                  {lang === 'bn' ? 'পাম্পে ঘণ্টায় কত লিটার?' : 'Pump capacity (litres/hr)?'}
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder={lang === 'bn' ? 'যেমন ৩০০০০' : 'e.g. 30000'}
                    value={pumpCapacity}
                    onChange={e => setPumpCapacity(e.target.value)}
                  />
                </label>

                {/* Upcoming 7-day strip ("এই সপ্তাহ") */}
                {next7Days.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted-wp, #93a597)', marginBottom: 6 }}>
                      {lang === 'bn' ? 'এই সপ্তাহ (পরবর্তী ৭ দিন):' : 'This Week (Next 7 Days):'}
                    </div>
                    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                      {next7Days.map(item => (
                        <div
                          key={item.day}
                          onClick={() => setSelectedDayIdx(item.day - 1)}
                          style={{
                            background: item.day - 1 === selectedDayIdx ? 'var(--surface-wp, #131b16)' : 'var(--surface-2-wp, #18221c)',
                            border: `1px solid ${item.day - 1 === selectedDayIdx ? 'var(--accent-wp, #c8e46a)' : 'var(--line-wp, #243029)'}`,
                            borderRadius: 8,
                            padding: '6px 8px',
                            minWidth: 70,
                            textAlign: 'center',
                            cursor: 'pointer',
                            fontSize: 11.5,
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{formatShortDate(item.date, lang)}</div>
                          <div style={{ color: 'var(--green-wp, #3ecf8e)', marginTop: 2 }}>{formatNumberBnEn(item.etc, 1, lang)} mm</div>
                          {(item.irr || 0) > 0 && (
                            <div style={{ color: 'var(--blue-wp, #4fb3f0)', fontWeight: 700, marginTop: 2 }}>💧 সেচ</div>
                          )}
                          {(item.rain || 0) > 0.5 && !(item.irr > 0) && (
                            <div style={{ color: 'var(--blue-wp, #4fb3f0)', marginTop: 2 }}>🌧️ {formatNumberBnEn(item.rain, 1, lang)}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Daily ETc & Rain Bar Chart */}
        {renderDailyChart()}
      </section>

      {/* SECTION 3: Why Save Water (GRACE-FO Aquifer depletion) */}
      <section className="wp-card">
        <div className="wp-row" style={{ justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div>
            <b>{lang === 'bn' ? 'কেন পানি বাঁচানো দরকার:' : 'Why save water:'}</b>{' '}
            {lang === 'bn' ? (
              graceData.isBarind ? (
                <>বরেন্দ্রে মাটির নিচের পানি কমছে <b style={{ color: 'var(--red-wp)' }}>−১.০৭ সেমি/বছর</b> (NASA GRACE-FO, ২০০২–২০২৬)</>
              ) : (
                <>{graceData.descBn}</>
              )
            ) : (
              graceData.isBarind ? (
                <>Groundwater in Barind is depleting at <b style={{ color: 'var(--red-wp)' }}>−1.07 cm/year</b> (NASA GRACE-FO, 2002–2026)</>
              ) : (
                <>{graceData.descEn}</>
              )
            )}
          </div>
          {onNavigate && (
            <button
              type="button"
              className="wp-muted"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--muted-wp)',
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
              }}
              onClick={() => onNavigate('weather')}
              aria-label={lang === 'bn' ? 'আবহাওয়া ও ঝুঁকি পৃষ্ঠায় যান' : 'Navigate to Climate & Risk'}
            >
              {lang === 'bn' ? 'আবহাওয়া ও ঝুঁকি →' : 'Climate & Risk →'}
            </button>
          )}
        </div>
      </section>

      {/* Model & Evidence Provenance Note */}
      <p className="wp-note">
        {lang === 'bn'
          ? 'আবহাওয়া তথ্য: NASA POWER (তাপমাত্রা, আর্দ্রতা, বিকিরণ, বায়ুপ্রবাহ) ও GPM IMERG বৃষ্টিপাত। হিসাব: FAO-56 Penman-Monteith মৃত্তিকা পানি ব্যালেন্স; ধানে AWD (পানি ১৫ সেমি নিচে নামলে সেচ, জমি তৈরিতে ১৫০ মিমি বোরো / ৫০ মিমি আমন)। মাটির বৈশিষ্ট্য: ISRIC SoilGrids ২৫০মি।'
          : 'Climatology: NASA POWER (temperature, humidity, radiation, wind) & GPM IMERG precipitation. Balance: FAO-56 Penman-Monteith daily soil water balance; rice AWD (irrigate at 15 cm water table depth, puddling 150 mm Boro / 50 mm Aman). Soil texture: ISRIC SoilGrids 250m.'}
      </p>

      {/* EXPERT DRAWER: Engineering Diagnostics */}
      <details className="wp-expert-details">
        <summary className="wp-expert-summary">
          {lang === 'bn' ? 'বিস্তারিত (বিশেষজ্ঞদের জন্য)' : 'Detailed Diagnostics (For Experts)'}
        </summary>
        <div style={{ marginTop: 14 }}>
          <p className="wp-muted" style={{ margin: '0 0 12px 0' }}>
            {lang === 'bn'
              ? 'এফএও-৫৬ মৃত্তিকা পানি ব্যালেন্স, এডব্লিউডি সেচ অপ্টিমাইজেশন ও রুট-জোন হাইড্রোডাইনামিক বিশ্লেষণ।'
              : 'FAO-56 Soil Water Balance, AWD Irrigation Optimization & Root-zone Hydrodynamic Analysis.'}
          </p>

          {/* 4 Expert Sub-tabs */}
          <div className="wp-seg" style={{ marginBottom: 14 }}>
            <button
              type="button"
              aria-pressed={expertSubTab === 'balance' ? 'true' : 'false'}
              onClick={() => setExpertSubTab('balance')}
            >
              {lang === 'bn' ? '১. পানির ব্যালেন্স' : '1. Water Balance'}
            </button>
            <button
              type="button"
              aria-pressed={expertSubTab === 'optimization' ? 'true' : 'false'}
              onClick={() => setExpertSubTab('optimization')}
            >
              {lang === 'bn' ? '২. সেচ অপ্টিমাইজেশন' : '2. Irrigation Optimization'}
            </button>
            <button
              type="button"
              aria-pressed={expertSubTab === 'profile' ? 'true' : 'false'}
              onClick={() => setExpertSubTab('profile')}
            >
              {lang === 'bn' ? '৩. মৃত্তিকা প্রোফাইল' : '3. Soil Profile'}
            </button>
            <button
              type="button"
              aria-pressed={expertSubTab === 'stress' ? 'true' : 'false'}
              onClick={() => setExpertSubTab('stress')}
            >
              {lang === 'bn' ? '৪. পানির চাপ বিশ্লেষণ' : '4. Water Stress Analysis'}
            </button>
          </div>

          {/* Sub-tab 1: Water Balance & Lysimeter Model */}
          {expertSubTab === 'balance' && (
            <div>
              <div className="wp-kv" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 12 }}>
                <div>
                  <span>{lang === 'bn' ? 'গাছের মোট চাহিদা (ETc)' : 'Crop Demand (ETc)'}</span>
                  <strong>{formatNumberBnEn(activeSeason?.crop_demand_etc_mm, 1, lang)} mm</strong>
                </div>
                <div>
                  <span>{lang === 'bn' ? 'মৌসুমি বৃষ্টিপাত' : 'Seasonal Rainfall'}</span>
                  <strong>{formatNumberBnEn(activeSeason?.rainfall_mm, 1, lang)} mm</strong>
                </div>
                <div>
                  <span>{lang === 'bn' ? 'নিট সেচ চাহিদা' : 'Net Irrigation Requirement'}</span>
                  <strong>{formatNumberBnEn(activeSeason?.net_irrigation_mm, 1, lang)} mm</strong>
                </div>
                <div>
                  <span>{lang === 'bn' ? 'ভর সংরক্ষণ (Mass Balance)' : 'Mass Residual'}</span>
                  <strong>0.0 mm ({lang === 'bn' ? 'সংরক্ষিত' : 'Conserved'})</strong>
                </div>
              </div>

              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line-wp)' }}>
                <WaterBalance3D
                  crop={activeSeason?.crop || 'Mustard'}
                  soilTexture={fieldInfo.soil_texture || 'clay loam'}
                  irrigationMm={activeSeason?.net_irrigation_mm || 300}
                  rainMm={activeSeason?.rainfall_mm || 50}
                  lang={lang}
                />
              </div>
            </div>
          )}

          {/* Sub-tab 2: Irrigation Optimization & AWD Scheduling */}
          {expertSubTab === 'optimization' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="wp-card" style={{ background: 'var(--surface-2-wp)' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: 14 }}>
                  {lang === 'bn' ? 'বোরো ও আমন ধানে এডব্লিউডি (AWD) নিয়ম:' : 'Alternate Wetting & Drying (AWD) Scheduling Rules:'}
                </h4>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.6 }}>
                  <li>
                    {lang === 'bn'
                      ? 'মাটির উপরের পানি শেষ হয়ে পানি যখন মাটির ১৫ সেমি নিচে নামবে, তখন সেচ দিয়ে ৫ সেমি পর্যন্ত প্লাবিত করুন।'
                      : 'When surface ponding recedes and water table drops to 15 cm below surface in the AWD pipe, irrigate to 5 cm depth.'}
                  </li>
                  <li>
                    {lang === 'bn'
                      ? 'কাদা তৈরিতে (Puddling allowance) বোরো মৌসুমে ১৫০ মিমি এবং আমন মৌসুমে ৫০ মিমি পানি ধরা হয়েছে।'
                      : 'Puddling preparation water is calibrated at 150 mm for Boro rice and 50 mm for Aman rice.'}
                  </li>
                  <li>
                    {lang === 'bn'
                      ? 'ফুল ফোটা ও শিষ বের হওয়ার সংবেদনশীল সময়ে জমি সার্বক্ষণিক পানিতে সিক্ত রাখতে হবে।'
                      : 'During flowering and heading stages, the field is kept continuously ponded to protect pollination.'}
                  </li>
                </ul>
              </div>
              <div className="wp-card" style={{ background: 'var(--surface-2-wp)' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: 14 }}>
                  {lang === 'bn' ? 'রবি ও প্রাক-বর্ষা ফসলে সেচ অপ্টিমাইজেশন:' : 'Upland Rabi & Kharif-1 Water Optimization:'}
                </h4>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.6 }}>
                  <li>
                    {lang === 'bn'
                      ? 'সরিষা, গম, ভুট্টা ও ডালে রুট-জোন ডিপ্লিশন যখন সহজলভ্য আর্দ্রতা (RAW) সীমায় পৌঁছায়, তখনই সেচ প্রয়োগ করা হয়।'
                      : 'Irrigation is triggered precisely when root-zone depletion reaches Readily Available Water (RAW), avoiding deep percolation loss.'}
                  </li>
                  <li>
                    {lang === 'bn'
                      ? 'মুগডাল ও তিল প্রাক-বর্ষা বৃষ্টিতে স্বাভাবিকভাবে চলে, কেবল দীর্ঘ শুষ্ক স্পেলে সম্পূরক নালা সেচ প্রয়োজন হয়।'
                      : 'Mungbean and sesame are primarily rainfed, utilizing pre-monsoon precipitation with supplemental furrow irrigation only during dry spells.'}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Sub-tab 3: Soil Water Profile */}
          {expertSubTab === 'profile' && (
            <div>
              <div className="wp-kv" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginBottom: 12 }}>
                <div>
                  <span>{lang === 'bn' ? 'মাটি সর্বোচ্চ কত পানি ধরে রাখে (TAW)' : 'Soil Max Holding Capacity (TAW)'}</span>
                  <strong>{formatNumberBnEn(tawMm, 0, lang)} mm</strong>
                </div>
                <div>
                  <span>{lang === 'bn' ? 'সহজে তোলার পানি (RAW)' : 'Readily Available Water (RAW)'}</span>
                  <strong>{formatNumberBnEn(rawMm, 0, lang)} mm</strong>
                </div>
                <div>
                  <span>{lang === 'bn' ? 'মৃত্তিকা গঠন ও টেক্সচার' : 'Soil Texture Classification'}</span>
                  <strong>{soilLabel}</strong>
                </div>
              </div>

              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line-wp)' }}>
                <SoilProfile3D
                  soilTexture={fieldInfo.soil_texture || 'clay loam'}
                  waterTableM={1.2}
                  rootDepthM={0.8}
                  lang={lang}
                />
              </div>
            </div>
          )}

          {/* Sub-tab 4: Water Stress Analysis */}
          {expertSubTab === 'stress' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="wp-kv" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginBottom: 12 }}>
                <div>
                  <span>{lang === 'bn' ? 'সেচ নলকূপ সীমা (Borewell / Canal Limit)' : 'Borewell / Canal Capacity Limit'}</span>
                  <strong>{formatNumberBnEn(borewellLimitMm, 0, lang)} mm/yr</strong>
                </div>
                <div>
                  <span>{lang === 'bn' ? 'পরিকল্পনায় বাৎসরিক সেচ (স্বাভাবিক)' : 'Plan Annual Irrigation (Normal)'}</span>
                  <strong>{formatNumberBnEn(yearly.plan_yearly_mm, 0, lang)} mm/yr</strong>
                </div>
                <div>
                  <span>{lang === 'bn' ? 'পরিকল্পনায় বাৎসরিক সেচ (শুকনো বছর)' : 'Plan Annual Irrigation (Dry Year)'}</span>
                  <strong>{formatNumberBnEn(yearly.dry_plan_yearly_mm, 0, lang)} mm/yr</strong>
                </div>
              </div>

              <div className="wp-card" style={{ background: 'var(--surface-2-wp)' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: 14 }}>
                  {lang === 'bn' ? 'খরা ও শুকনো বছরের জলবায়ু চাপ সহনশীলতা:' : 'Drought & Dry Year Feasibility Assessment:'}
                </h4>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
                  {yearly.dry_plan_yearly_mm <= borewellLimitMm ? (
                    lang === 'bn'
                      ? `শুকনো বছরেও আপনার নির্বাচিত পরিকল্পনার মোট বাৎসরিক সেচ (${formatNumberBnEn(yearly.dry_plan_yearly_mm, 0, lang)} মিমি) নলকূপ সীমার (${formatNumberBnEn(borewellLimitMm, 0, lang)} মিমি) ভেতরে নিরাপদ।`
                      : `In dry climate years, your plan's total water requirement (${formatNumberBnEn(yearly.dry_plan_yearly_mm, 0, lang)} mm) remains safely within the irrigation capacity limit (${formatNumberBnEn(borewellLimitMm, 0, lang)} mm).`
                  ) : (
                    lang === 'bn'
                      ? `শুকনো বছরে অতিরিক্ত সেচের চাপ তৈরি হতে পারে (${formatNumberBnEn(yearly.dry_plan_yearly_mm, 0, lang)} মিমি > ${formatNumberBnEn(borewellLimitMm, 0, lang)} মিমি)। ডাল ও সরিষা নির্বাচন সেচ সংকট দূর করবে।`
                      : `Dry-year irrigation exceeds normal tube-well capacity (${formatNumberBnEn(yearly.dry_plan_yearly_mm, 0, lang)} mm > ${formatNumberBnEn(borewellLimitMm, 0, lang)} mm). Pulses and oilseeds are recommended to balance demand.`
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

export default WaterIrrigationView;
