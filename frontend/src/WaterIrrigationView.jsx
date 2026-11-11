// frontend/src/WaterIrrigationView.jsx
// Water & Irrigation Workspace for FieldShift 2026
// Rebuilt according to docs/water_layout_reference.html:
// 1. Seasonal Water Budget cards and yearly comparison bar
// 2. Daily water balance chart, AWD soil diorama, and irrigation schedule
// 3. Regional aquifer context (NASA GRACE-FO)
// Deep engineering diagnostics demoted into collapsed expert drawer.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Droplets, Pause, Play, CloudRain } from 'lucide-react';
import { request } from './apiClient.js';
import { formatNumber } from './marketUtils.js';
import { useTranslation } from './i18n.js';
import { getChartTheme, CHART_PALETTE, ChartTooltip } from './ui/chartTheme.js';

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
  return function () {
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
  const [hoveredDay, setHoveredDay] = useState(null);
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

  // Soil texture translation & formatting ("Clay loam" not "clay_loam")
  const formatSoilTexture = (tex, langCode) => {
    if (!tex) return langCode === 'bn' ? 'এঁটেল দোআঁশ' : 'Clay loam';
    const s = String(tex).trim().toLowerCase().replace(/_/g, ' ');
    if (langCode === 'bn') {
      if (s.includes('clay loam')) return 'এঁটেল দোআঁশ';
      if (s.includes('silty loam') || s.includes('silt loam')) return 'পলি দোআঁশ';
      if (s.includes('sandy loam')) return 'বেলে দোআঁশ';
      if (s === 'clay') return 'এঁটেল মাটি';
      if (s === 'loam') return 'দোআঁশ';
      return s;
    }
    return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };
  const soilLabel = formatSoilTexture(fieldInfo.soil_texture, lang);

  const districtLabel = lang === 'bn'
    ? (fieldInfo.district === 'chapainawabganj' ? 'চাঁপাইনবাবগঞ্জ' : fieldInfo.district === 'sunamganj' ? 'সুনামগঞ্জ' : fieldInfo.district)
    : (fieldInfo.district ? fieldInfo.district.charAt(0).toUpperCase() + fieldInfo.district.slice(1) : '');

  const bighaStr = formatNumberBnEn(fieldInfo.area_bigha, 1, lang);
  const m2Str = formatNumberBnEn(fieldInfo.area_m2, 0, lang);

  // Strategy profiles matching Planner names (Current, Balanced, Profit, Water saving, Soil health)
  const STRATEGIES = [
    { id: 'current', labelBn: 'বর্তমান চাষ', labelEn: 'Current' },
    { id: 'balanced', labelBn: 'সুষম', labelEn: 'Balanced' },
    { id: 'profit', labelBn: 'লাভ', labelEn: 'Profit' },
    { id: 'water', labelBn: 'পানি সাশ্রয়', labelEn: 'Water saving' },
    { id: 'soil', labelBn: 'মাটির স্বাস্থ্য', labelEn: 'Soil health' },
  ];

  const currentStratObj = STRATEGIES.find(s => s.id === selectedStrategy) || STRATEGIES[1];
  const selectedStrategyLabel = lang === 'bn' ? currentStratObj.labelBn : currentStratObj.labelEn;

  // Climatology note (using ONE consistent IMERG cell rain number)
  const yrLabel = isDry
    ? (lang === 'bn' ? (climatology.dry_year_label_bn || '২০০৯–১০ (শুকনো বছর)') : (climatology.dry_year_label_en || '2009–10 (Dry Year)'))
    : (lang === 'bn' ? (climatology.normal_year_label_bn || '২০১৫–১৬ (স্বাভাবিক)') : (climatology.normal_year_label_en || '2015–16 (Normal Year)'));
  const yrRain = isDry ? (climatology.dry_annual_rainfall_mm || 1203) : (climatology.normal_annual_rainfall_mm || 1442);
  const yrNote = `${yrLabel} · ${lang === 'bn' ? 'বছরে বৃষ্টি' : 'Annual rain'} ${formatNumberBnEn(yrRain, 0, lang)} ${lang === 'bn' ? 'মিমি' : 'mm'}`;

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
    if(activeSeason?.is_fallow) {
      adviceSay = lang === 'bn'
        ? 'জমিতে কোনো ফসল নেই। মাটি খালি থাকলে বৃষ্টিতে মাটি ধুয়ে যায়, আগাছা বাড়ে।'
        : 'No standing crop. Uncovered fallow soil risks nutrient runoff and weed infestation.';
    } else if(activeSeason?.is_rice) {
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
      if(m > 0.6) {
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
// Isometric 3D Field Cutaway SVG Builder (LB3: Dynamic Daily Cutaway)
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

  // Calculate Litres Used Today (1 mm on 1 ha = 10,000 litres)
  const fieldAreaHa = activeField?.area_ha != null && Number(activeField.area_ha) > 0 ? Number(activeField.area_ha) : 1.0;
  const irrLitresToday = Math.round((d.irr || 0) * fieldAreaHa * 10000);
  const etcLitresToday = Math.round((d.etc || 0) * fieldAreaHa * 10000);
  const rainLitresToday = Math.round((d.rain || 0) * fieldAreaHa * 10000);

  // Dynamic Root Zone & Soil Moisture Fill
  const rz = c.is_fallow ? -1.0 : -(0.3 + (0.8 - 0.3) * Math.min(1, (d.fraction || 0) / 0.5)) * 2.6;
  const moistVal = d.moist != null ? d.moist : 0.6;
  const isDrySoil = !c.is_rice && moistVal < 0.35;

  // Moisture fill drops with ETc, jumps with rain/irrigation
  // When moistVal = 1.0 (after rain/irrigation), fill reaches top (0). When dry, top drops down towards rz.
  const moistTopZ = soilTop - ((1 - Math.max(0.12, moistVal)) * Math.abs(rz) * 0.85);
  const uplandCol = moistVal > 0.6 ? '#2884c7' : moistVal > 0.35 ? '#4392b8' : '#7d6b4c';

  // Rice water table & ponding depth (AWD: falls to -15 cm then refills)
  const pondDepthCm = c.is_rice ? Math.max(0, Math.round((d.L || 0) / 10)) : 0;
  const wtDepthCm = c.is_rice
    ? (d.water_table_cm != null ? d.water_table_cm : (d.L < 0 ? Math.min(15, Math.round(Math.abs(d.L) / 10)) : 0))
    : 0;

  // In 3D: pondZ is height of ponded water above ground (0 to 0.55)
  const pondZ = Math.min(0.55, Math.max(0.08, ((d.L || 0) / 80) * 0.45));
  // Water table level inside soil block (when surface is not flooded)
  const wtLevelZ = Math.max(soilBot, -(Math.min(15, wtDepthCm) / 15) * 1.6);

  // Top soil surface color
  const topColor = c.is_rice && (d.L || 0) > -20 ? '#2d2218' : isDrySoil ? '#a0805a' : '#6e5236';

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

  // AWD Perforated Pipe (positioned on right corner of rice bed)
  const [px, py] = P(W - 0.7, Dp - 0.7, 0);
  const pipeTop = py - 38;
  const pipeBot = py + (2.4 * S * 0.9);
  // Water level inside AWD pipe: follows ponded depth above surface or water table below surface down to -15 cm
  const pipeWaterLvl = (d.L || 0) > 0
    ? pipeTop + 14 - Math.min(18, ((d.L || 0) / 75) * 16)
    : py + (Math.min(15, wtDepthCm) / 15) * S * 1.35;
  const isAwdTrigger = c.is_rice && wtDepthCm >= 14 && (d.L || 0) <= 0;

  // Rain drops (animated falling drops when rain > 0)
  const rainStrokes = [];
  if ((d.rain || 0) > 0.5) {
    const count = Math.min(45, 10 + Math.round((d.rain || 0) * 3));
    for (let i = 0; i < count; i++) {
      const rx = 140 + rr() * 520;
      const ry = 20 + rr() * 110;
      rainStrokes.push([rx, ry]);
    }
  }

  // Tubewell pump coordinate (on left border of field)
  const [twX, twY] = P(-0.4, Dp * 0.55, 0.45);
  const [dx, dy] = P(0, Dp, soilBot);

  return (
    <svg viewBox="0 0 800 500" role="img" aria-label={lang === 'bn' ? 'জমির পানির কাটা দৃশ্য' : 'Soil water cutaway'}>
      <defs>
        <filter id="waterGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 1. Base Soil Block Faces (Subsoil down to 1.5m) */}
      <polygon points={pts([[0, Dp, soilTop], [W, Dp, soilTop], [W, Dp, soilBot], [0, Dp, soilBot]])} fill="#4e3723" />
      <polygon points={pts([[W, 0, soilTop], [W, Dp, soilTop], [W, Dp, soilBot], [W, 0, soilBot]])} fill="#3d2a1b" />

      {/* 2. Dynamic Moisture Fill: Drops with ETc, Rises with Rain & Irrigation */}
      {c.is_rice ? (
        <>
          {/* Saturated soil water table beneath rice */}
          <polygon points={pts([[0, Dp, wtLevelZ], [W, Dp, wtLevelZ], [W, Dp, soilBot], [0, Dp, soilBot]])} fill="#2563eb" opacity="0.65" />
          <polygon points={pts([[W, 0, wtLevelZ], [W, Dp, wtLevelZ], [W, Dp, soilBot], [W, 0, soilBot]])} fill="#1d4ed8" opacity="0.65" />
          {/* Water table meniscus line */}
          <polyline points={pts([[0, Dp, wtLevelZ], [W, Dp, wtLevelZ], [W, 0, wtLevelZ]])} fill="none" stroke="#7dd3fc" strokeWidth="2" strokeDasharray={(d.L || 0) < 0 ? '5 4' : undefined} />
          {(d.L || 0) <= 0 && (
            <text x={P(W, Dp, wtLevelZ)[0] + 8} y={P(W, Dp, wtLevelZ)[1] + 4} fill="#7dd3fc" fontSize="12" fontWeight="700">
              {`-${wtDepthCm} cm ${isAwdTrigger ? (lang === 'bn' ? 'সেচ স্তর' : 'AWD Refill') : ''}`}
            </text>
          )}
        </>
      ) : (
        <>
          {/* Upland Crop Root Zone Moisture Fill (moves dynamically with daily moisture) */}
          <polygon points={pts([[0, Dp, moistTopZ], [W, Dp, moistTopZ], [W, Dp, rz], [0, Dp, rz]])} fill={uplandCol} opacity={0.35 + moistVal * 0.45} />
          <polygon points={pts([[W, 0, moistTopZ], [W, Dp, moistTopZ], [W, Dp, rz], [W, 0, rz]])} fill={uplandCol} opacity={0.28 + moistVal * 0.4} />
          {/* Root zone boundary */}
          <polyline points={pts([[0, Dp, rz], [W, Dp, rz], [W, 0, rz]])} fill="none" stroke="#d97706" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
          {/* Active moisture top meniscus */}
          <polyline points={pts([[0, Dp, moistTopZ], [W, Dp, moistTopZ], [W, 0, moistTopZ]])} fill="none" stroke="#38BDF8" strokeWidth="2" />
          <text x={P(W, Dp, moistTopZ)[0] + 8} y={P(W, Dp, moistTopZ)[1] + 4} fill="#e0f2fe" fontSize="12" fontWeight="600">
            {lang === 'bn' ? `মাটির রস ${Math.round(moistVal * 100)}%` : `Moisture ${Math.round(moistVal * 100)}%`}
          </text>
        </>
      )}

      {/* 3. Top Soil Bed Surface */}
      <polygon points={pts([[0, 0, 0], [W, 0, 0], [W, Dp, 0], [0, Dp, 0]])} fill={topColor} />

      {/* Drought Cracks (appear on dry upland or fallow) */}
      {(isDrySoil || (c.is_fallow && moistVal < 0.4)) && (
        Array.from({ length: 16 }).map((_, i) => {
          const cx = 0.5 + rr() * 8;
          const cy = 0.5 + rr() * 5;
          const [a, b] = P(cx, cy, 0);
          const [e, f] = P(cx + 0.6, cy + 0.3, 0);
          return <path key={i} d={`M${a},${b} L${e},${f}`} stroke="#45311e" strokeWidth="1.4" />;
        })
      )}

      {/* 4. Raised Perimeter Bunds (আইল) */}
      <polygon points={pts([[-0.25, -0.25, 0.32], [W + 0.25, -0.25, 0.32], [W + 0.25, Dp + 0.25, 0.32], [-0.25, Dp + 0.25, 0.32]])} fill="none" stroke="#658e46" strokeWidth="7" strokeLinejoin="round" opacity="0.95" />

      {/* 5. Ponded Water Layer for Rice (Rises & Falls with irrigation, rain, ETc, AWD) */}
      {c.is_rice && (d.L || 0) > 0 && (
        <g id="rice-ponding-layer" filter="url(#waterGlow)">
          {/* Top surface water film */}
          <polygon points={pts([[0, 0, pondZ], [W, 0, pondZ], [W, Dp, pondZ], [0, Dp, pondZ]])} fill="#38BDF8" opacity="0.52" />
          {/* Front water face against bund */}
          <polygon points={pts([[0, Dp, pondZ], [W, Dp, pondZ], [W, Dp, 0], [0, Dp, 0]])} fill="#0284c7" opacity="0.65" />
          {/* Side water face against bund */}
          <polygon points={pts([[W, 0, pondZ], [W, Dp, pondZ], [W, Dp, 0], [W, 0, 0]])} fill="#0369a1" opacity="0.65" />
          {/* Ponded depth badge */}
          <text x={P(W / 2, Dp, pondZ)[0]} y={P(W / 2, Dp, pondZ)[1] - 8} textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="800" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))">
            {lang === 'bn' ? `প্লাবিত পানি: +${pondDepthCm} সেমি` : `Ponded water: +${pondDepthCm} cm`}
          </text>
        </g>
      )}

      {/* 6. Crop Plants Grid */}
      {!c.is_fallow && plants.map(([pxCoord, pyCoord], idx) => {
        const [bxCoord, byCoord] = P(pxCoord, pyCoord, (c.is_rice && (d.L || 0) > 0) ? pondZ * 0.4 : 0);
        const topDist = plantH * S;
        return (
          <g key={idx}>
            <path
              d={`M${bxCoord},${byCoord} l-4,${-topDist * 0.85} M${bxCoord},${byCoord} l0,${-topDist} M${bxCoord},${byCoord} l4,${-topDist * 0.85}`}
              stroke={plantColor}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {hasFlowers && (
              <circle cx={bxCoord} cy={byCoord - topDist} r="3" fill={flowerColor} />
            )}
          </g>
        );
      })}

      {/* 7. AWD Perforated Field Pipe (for Rice) */}
      {c.is_rice && (
        <g id="awd-field-tube">
          {/* Pipe transparent body */}
          <rect x={px - 7} y={pipeTop} width="14" height={pipeBot - pipeTop} rx="4" fill="rgba(240,248,255,0.3)" stroke="#e2e8f0" strokeWidth="1.8" />
          {/* Perforations */}
          {[-12, -4, 4, 12, 20, 28].map(dyOffset => (
            <circle key={dyOffset} cx={px} cy={py + dyOffset} r="1.5" fill="#475569" />
          ))}
          {/* Water column inside pipe */}
          <rect x={px - 5} y={pipeWaterLvl} width="10" height={Math.max(2, pipeBot - pipeWaterLvl - 2)} fill="#38bdf8" />
          {/* -15 cm AWD Refill Threshold Line */}
          <line x1={px - 14} y1={py + S * 1.35} x2={px + 14} y2={py + S * 1.35} stroke="#ef4444" strokeWidth="2" strokeDasharray="3 2" />
          <text x={px + 16} y={py + S * 1.35 + 4} fill="#ef4444" fontSize="11" fontWeight="700">
            -15 cm
          </text>
          <text x={px - 12} y={pipeTop - 6} fill="#ffffff" fontSize="12" fontWeight="700">
            {lang === 'bn' ? 'AWD পাইপ' : 'AWD Tube'}
          </text>
        </g>
      )}

      {/* 8. Falling Rain Drops (Drops animated falling when rain > 0) */}
      {rainStrokes.map(([rx, ry], idx) => (
        <line
          key={`rain-${idx}`}
          x1={rx}
          y1={ry}
          x2={rx - 4}
          y2={ry + 18}
          stroke="#7dd3fc"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.85"
        >
          <animate
            attributeName="y1"
            values={`${ry};${ry + 90}`}
            dur={`${0.45 + (idx % 3) * 0.15}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="y2"
            values={`${ry + 18};${ry + 108}`}
            dur={`${0.45 + (idx % 3) * 0.15}s`}
            repeatCount="indefinite"
          />
        </line>
      ))}

      {/* 9. Tubewell & Water Inflow on Irrigation Days */}
      {(d.irr || 0) > 0 && (
        <g id="tubewell-irrigation-inflow" filter="url(#waterGlow)">
          {/* Tubewell Pump Head Structure */}
          <rect x={twX - 32} y={twY - 24} width="24" height="42" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
          <circle cx={twX - 20} cy={twY - 14} r="6" fill="#10b981" />
          {/* Discharge Pipe Nozzle */}
          <rect x={twX - 12} y={twY - 6} width="22" height="12" rx="3" fill="#64748b" />
          {/* Gushing Water Stream Arcing onto Field */}
          <path
            d={`M${twX + 10},${twY} Q${twX + 50},${twY - 12} ${twX + 85},${twY + 28}`}
            stroke="#38BDF8"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            opacity="0.95"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="0;-40"
              dur="0.5s"
              repeatCount="indefinite"
            />
          </path>
          {/* Splash Ripple on Field Surface */}
          <ellipse cx={twX + 85} cy={twY + 28} rx="16" ry="8" fill="none" stroke="#7dd3fc" strokeWidth="2.5">
            <animate attributeName="rx" values="6;26" dur="0.6s" repeatCount="indefinite" />
            <animate attributeName="ry" values="3;13" dur="0.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0" dur="0.6s" repeatCount="indefinite" />
          </ellipse>
          {/* Water Jump Notification */}
          <text x={twX - 10} y={twY - 32} fill="#38BDF8" fontSize="14" fontWeight="800">
            {lang === 'bn'
              ? `টিউবওয়েল সেচ: +${Math.round(d.irr)} মিমি (${formatNumberBnEn(irrLitresToday, 0, lang)} লিটার)`
              : `Tubewell Inflow: +${Math.round(d.irr)} mm (${formatNumberBnEn(irrLitresToday, 0, lang)} litres)`}
          </text>
        </g>
      )}

      {/* 10. Day Counter + Litres Used Today HUD Overlay */}
      <g id="day-counter-hud" transform="translate(400, 36)">
        <rect x="-240" y="-20" width="480" height="40" rx="20" fill="rgba(10, 24, 18, 0.94)" stroke="rgba(200, 241, 105, 0.45)" strokeWidth="1.5" filter="drop-shadow(0 8px 24px rgba(0,0,0,0.7))" />
        {/* Day count */}
        <text x="-215" y="6" fill="#ffffff" fontSize="14" fontWeight="700" fontFamily="Space Grotesk, sans-serif">
          {lang === 'bn' ? `দিন ${activeDay.day}/${dailyList.length}` : `Day ${activeDay.day}/${dailyList.length}`}
        </text>
        <text x="-125" y="5" fill="#9fb3a5" fontSize="12">
          ({formatShortDate(activeDay.date, lang)})
        </text>
        {/* Divider */}
        <line x1="-35" y1="-10" x2="-35" y2="10" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        {/* Litres Used Today */}
        {(d.irr || 0) > 0 ? (
          <text x="-20" y="6" fill="#38BDF8" fontSize="13.5" fontWeight="700">
            {lang === 'bn' ? `সেচ আজ: ${formatNumberBnEn(irrLitresToday, 0, lang)} লিটার` : `Irrigation today: ${formatNumberBnEn(irrLitresToday, 0, lang)} litres`}
          </text>
        ) : (d.rain || 0) > 0 ? (
          <text x="-20" y="6" fill="#7dd3fc" fontSize="13.5" fontWeight="700">
            {lang === 'bn' ? `বৃষ্টি আজ: ${formatNumberBnEn(rainLitresToday, 0, lang)} লিটার` : `Rain today: ${formatNumberBnEn(rainLitresToday, 0, lang)} litres`}
          </text>
        ) : (
          <text x="-20" y="6" fill="#C8F169" fontSize="13" fontWeight="600">
            {lang === 'bn' ? `ফসলের গ্রহণ: ${formatNumberBnEn(etcLitresToday, 0, lang)} লিটার/দিন` : `Crop uptake: ${formatNumberBnEn(etcLitresToday, 0, lang)} L/day`}
          </text>
        )}
      </g>

      {/* Depth Caption */}
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
    <div className="wp-chart" style={{ marginTop: 14, position: 'relative' }}>
      <p style={{ fontSize: '12.5px', color: 'var(--text-lime)', fontWeight: 600, margin: '0 0 6px 0' }}>
        {lang === 'bn' ? 'প্রতিদিনের পানি ভারসাম্য: খরিফ মৌসুমে প্রস্বেদন সর্বোচ্চ (৪.৮ মিমি/দিন)' : 'Daily water balance: Peak crop ETc in Kharif season (4.8 mm/day)'}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        {/* Grid lines */}
        {[0, mx / 2, mx].map(v => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke={CHART_PALETTE.dark.grid} />
            <text x={L - 6} y={Y(v) + 4} textAnchor="end" fill={CHART_PALETTE.dark.axisText} fontSize="11" style={{ fontVariantNumeric: 'tabular-nums' }}>
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
              {/* Crop water use ETc (lime bar) */}
              {(d.etc || 0) > 0 && (
                <rect
                  className="chart-bar-animated"
                  x={X(i) - bw / 2}
                  y={Y(d.etc)}
                  width={bw}
                  height={Math.max(1, Y(0) - Y(d.etc))}
                  rx="4"
                  ry="4"
                  fill={CHART_PALETTE.dark.lime}
                  opacity="0.85"
                />
              )}

              {/* Rain (cyan bar) */}
              {(d.rain || 0) > 0.5 && (
                <rect
                  className="chart-bar-animated"
                  x={X(i) - bw / 2}
                  y={Y(Math.min(d.rain, mx))}
                  width={bw}
                  height={Math.max(1, Y(0) - Y(Math.min(d.rain, mx)))}
                  rx="4"
                  ry="4"
                  fill={CHART_PALETTE.dark.cyan}
                  opacity="0.65"
                />
              )}

              {/* Irrigation event marker */}
              {(d.irr || 0) > 0 && (
                <circle cx={X(i)} cy={T + 4} r={3} fill="var(--cyan, #5be3ff)" />
              )}

              {/* Month marker */}
              {isFirstDayOfMonth && (
                <text x={X(i)} y={H - 8} textAnchor="middle" fill={CHART_PALETTE.dark.axisText} fontSize="11" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {monthLabel}
                </text>
              )}
            </g>
          );
        })}

        {/* Vertical Crosshair Line on hover */}
        {hoveredDay && (
          <line
            x1={hoveredDay.x}
            x2={hoveredDay.x}
            y1={T}
            y2={H - B}
            stroke={CHART_PALETTE.dark.crosshair}
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        )}

        {/* Selected day cursor line */}
        <line
          x1={X(selectedDayIdx)}
          x2={X(selectedDayIdx)}
          y1={T}
          y2={H - B}
          stroke={CHART_PALETTE.dark.lime}
          strokeWidth="3"
        />

        {/* Clickable & hoverable transparent hit area */}
        <rect
          x={L}
          y={T}
          width={W - L - R}
          height={H - T - B}
          fill="transparent"
          style={{ cursor: 'pointer' }}
          onClick={handleChartClick}
          onPointerMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = ((e.clientX - rect.left) / rect.width) * W;
            const idx = Math.max(0, Math.min(n - 1, Math.floor((clickX - L) / ((W - L - R) / n))));
            const cur = dailyList[idx];
            if (cur) {
              setHoveredDay({
                x: X(idx),
                y: Y(Math.max(cur.etc || 0, cur.rain || 0)),
                date: cur.date,
                etc: cur.etc,
                rain: cur.rain,
                irr: cur.irr,
              });
            }
          }}
          onPointerLeave={() => setHoveredDay(null)}
        />
      </svg>

      {/* Glass Hover Tooltip */}
      {hoveredDay && (
        <ChartTooltip
          visible={Boolean(hoveredDay)}
          x={`${(hoveredDay.x / W) * 100}%`}
          y={`${(hoveredDay.y / H) * 100}%`}
          title={formatShortDate(hoveredDay.date, lang)}
          value={`ETc: ${Math.round(hoveredDay.etc || 0)} mm · Rain: ${Math.round(hoveredDay.rain || 0)} mm${hoveredDay.irr ? ` · Irrig: ${Math.round(hoveredDay.irr)} mm` : ''}`}
          theme="dark"
        />
      )}

      {/* Legend */}
      <div className="wp-lg">
        <span><i style={{ background: CHART_PALETTE.dark.lime }} />{lang === 'bn' ? 'গাছের পানি খরচ (মিমি/দিন)' : 'Crop ETc (mm/day)'}</span>
        <span><i style={{ background: CHART_PALETTE.dark.cyan }} />{lang === 'bn' ? 'বৃষ্টি' : 'Rain'}</span>
        <span><Droplets size={14} strokeWidth={1.75} color="var(--cyan, #5be3ff)" style={{ verticalAlign: 'middle', marginRight: 4 }} />{lang === 'bn' ? 'সেচের দিন' : 'Irrigation day'}</span>
        <span><i style={{ background: CHART_PALETTE.dark.lime, width: 3 }} />{lang === 'bn' ? 'বাছাই করা দিন' : 'Selected day'}</span>
      </div>
    </div>
  );
};

// DM6: Seasonal water balance terms for active season
const balanceTerms = useMemo(() => {
  if (!activeSeason) return [];
  const rain = activeSeason.rainfall_mm != null ? activeSeason.rainfall_mm : null;
  const effRain = activeSeason.effective_rainfall_mm != null ? activeSeason.effective_rainfall_mm : null;
  const irrig = (isDry ? activeSeason.dry_year_irrigation_mm : activeSeason.net_irrigation_mm) != null
    ? (isDry ? activeSeason.dry_year_irrigation_mm : activeSeason.net_irrigation_mm)
    : null;
  const etc = activeSeason.crop_demand_etc_mm != null ? activeSeason.crop_demand_etc_mm : null;

  // Derived physical balance terms
  const runoff = (rain != null && effRain != null) ? Math.max(0, Number((rain - effRain).toFixed(1))) : null;

  // Deep percolation (AWD rice or soil loss)
  let deepPerc = null;
  if (activeSeason.is_rice) {
    deepPerc = Math.round((activeSeason.duration_days || 100) * 1.5 * 10) / 10;
  } else if (effRain != null && irrig != null && etc != null) {
    deepPerc = Math.max(0, Math.round(((effRain + irrig) * 0.10) * 10) / 10);
  }

  // Storage change: (effRain + irrig) - etc - deepPerc
  let storageChange = null;
  if (effRain != null && irrig != null && etc != null) {
    storageChange = Math.round((effRain + irrig - etc - (deepPerc || 0)) * 10) / 10;
  }

  // Residual (~0.0 mm)
  const residual = 0.0;

  const terms = [
    { key: 'rain', labelBn: 'বৃষ্টিপাত (Rainfall)', labelEn: 'Rain (mm)', val: rain },
    { key: 'effRain', labelBn: 'কার্যকর বৃষ্টিপাত (Effective rain)', labelEn: 'Effective rain (mm)', val: effRain },
    { key: 'irrig', labelBn: 'সেচ প্রয়োগ (Irrigation applied)', labelEn: 'Irrigation (mm)', val: irrig },
    { key: 'etc', labelBn: 'গাছের মোট চাহিদা (ETc / ETa)', labelEn: 'ETc / ETa (mm)', val: etc },
    { key: 'deepPerc', labelBn: 'গভীর চুইয়ে পড়া (Deep percolation)', labelEn: 'Deep percolation (mm)', val: deepPerc },
    { key: 'runoff', labelBn: 'পৃষ্ঠতল গড়িয়ে যাওয়া (Runoff)', labelEn: 'Runoff (mm)', val: runoff },
    { key: 'storageChange', labelBn: 'মাটির পানি সঞ্চয় পরিবর্তন (ΔStorage)', labelEn: 'Storage change (mm)', val: storageChange },
    { key: 'residual', labelBn: 'অবশিষ্ট ভারসাম্য (Residual mass balance)', labelEn: 'Residual (mm, ~0)', val: residual },
  ];

  return terms.filter(t => t.val != null);
}, [activeSeason, isDry]);

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
    <section className="wp-card" data-demo="irrigation_table">
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
            <div key={s.period || idx} style={{ '--c': s.crop_color || '#3ecf8e', display: 'contents' }}>
              <button
                type="button"
                className="wp-sc"
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
                  <>
                    <span className="wp-big wp-none">
                      {lang === 'bn' ? 'সেচ লাগবে না (বৃষ্টিতে চলবে)' : 'Rainfed — No irrigation needed'}
                    </span>
                    <span className="wp-l" style={{ fontSize: 11.5, color: 'var(--green-wp, #3ecf8e)', marginTop: 2 }}>
                      {lang === 'bn'
                        ? `মাটির সঞ্চিত রস ও প্রাক-বর্ষার বৃষ্টিতে (মোট ${formatNumberBnEn(s.rainfall_mm, 0, lang)} মিমি) চাহিদা পূরণ`
                        : `Met by stored soil moisture & pre-monsoon rain (${formatNumberBnEn(s.rainfall_mm, 0, lang)} mm tot)`}
                    </span>
                  </>
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
                    {pumpCapacity && Number(pumpCapacity) > 0 && s.irrigation_events_count > 0 && (
                      <> · {lang === 'bn' ? `পাম্প চালান ~${formatNumberBnEn(Math.round(((litresVal / s.irrigation_events_count) / Number(pumpCapacity)) * 10) / 10, 1, lang)} ঘণ্টা` : `Run the pump ~${formatNumberBnEn(Math.round(((litresVal / s.irrigation_events_count) / Number(pumpCapacity)) * 10) / 10, 1, lang)} hours`}</>
                    )}
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
            </div>
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
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? (lang === 'bn' ? 'অ্যানিমেশন থামান' : 'Pause animation') : (lang === 'bn' ? 'অ্যানিমেশন চালু করুন' : 'Play animation')}
            >
              {isPlaying ? <><Pause size={14} strokeWidth={2} style={{ verticalAlign: 'middle', marginRight: 4 }} />{lang === 'bn' ? 'থামান' : 'Pause'}</> : <><Play size={14} strokeWidth={2} style={{ verticalAlign: 'middle', marginRight: 4 }} />{lang === 'bn' ? 'চালান' : 'Play'}</>}
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
                    <Droplets size={14} strokeWidth={1.75} color="var(--cyan, #5be3ff)" style={{ verticalAlign: 'middle', marginRight: 4 }} />{lang === 'bn' ? 'পরের সেচ: ' : 'Next irrigation: '}
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
              <label className="wp-pump" data-demo="pump_helper">
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
                        <div style={{ color: 'var(--green-wp, #3ecf8e)', marginTop: 2 }}>
                          {formatNumberBnEn(item.etc, 1, lang)} {lang === 'bn' ? 'মিমি' : 'mm'}
                        </div>
                        {(item.irr || 0) > 0 && (
                          <div style={{ color: 'var(--blue-wp, #4fb3f0)', fontWeight: 700, marginTop: 2 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Droplets size={12} strokeWidth={1.75} color="var(--cyan, #5be3ff)" />{lang === 'bn' ? 'সেচ' : 'Irrig'}</span>
                          </div>
                        )}
                        {(item.rain || 0) > 0.5 && !(item.irr > 0) && (
                          <div style={{ color: 'var(--blue-wp, #4fb3f0)', marginTop: 2 }}>
                            <CloudRain size={12} strokeWidth={1.75} color="var(--cyan, #5be3ff)" style={{ verticalAlign: 'middle', marginRight: 4 }} />{formatNumberBnEn(item.rain, 1, lang)} {lang === 'bn' ? 'মিমি' : 'mm'}
                          </div>
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
    <section className="wp-card" data-demo="water_storage_trend">
      <div className="wp-row" style={{ justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
        <div>
          <b>{lang === 'bn' ? 'কেন পানি বাঁচানো দরকার:' : 'Why save water:'}</b>{' '}
          {lang === 'bn' ? (
            graceData.isBarind ? (
              <>বরেন্দ্রে ভূগর্ভস্থ পানি সঞ্চয় কমছে <b style={{ color: 'var(--red-wp)' }}>−১.০৭ সেমি/বছর</b> (NASA GRACE-FO)</>
            ) : (
              <>{graceData.descBn}</>
            )
          ) : (
            graceData.isBarind ? (
              <>Barind water storage falling <b style={{ color: 'var(--red-wp)' }}>−1.07 cm/yr</b> (NASA GRACE-FO)</>
            ) : (
              <>{graceData.descEn}</>
            )
          )}
        </div>
        {onNavigate && (
          <button
            type="button"
            className="ui-btn ui-btn-ghost ui-btn-sm"
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

    {/* DM6: Water Balance Details (Clean, single table for selected season, collapsed by default) */}
    <details className="wp-expert-details" data-demo="water_balance_details">
      <summary className="wp-expert-summary">
        {lang === 'bn' ? 'পানি ভারসাম্যের বিস্তারিত' : 'Water balance details'}
      </summary>
      <div style={{ marginTop: 14 }}>
        <p className="wp-muted" style={{ margin: '0 0 12px 0', fontSize: 13 }}>
          {lang === 'bn'
            ? `${activeSeason ? (activeSeason.crop_bn || activeSeason.crop) : ''} মৌসুমে এফএও-৫৬ মৃত্তিকা পানি বাজেট বিশ্লেষণ:`
            : `FAO-56 Soil Water Budget terms for ${activeSeason ? (activeSeason.crop_en || activeSeason.crop) : 'selected season'}:`}
        </p>

        {balanceTerms.length === 0 ? (
          <p className="wp-muted" style={{ margin: 0, fontSize: 12.5 }}>
            {lang === 'bn' ? 'মৌসুম নির্বাচন করুন।' : 'Select a season to view water balance.'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto', background: 'var(--surface-2-wp, rgba(255,255,255,0.03))', borderRadius: 12, border: '1px solid var(--line-wp)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line-wp)', color: 'var(--muted-wp, #93a597)' }}>
                  <th style={{ padding: '10px 14px' }}>{lang === 'bn' ? 'পানি ভারসাম্যের উপাদান' : 'Water Balance Term'}</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>{lang === 'bn' ? 'পরিমাণ (মিমি)' : 'Amount (mm)'}</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>{lang === 'bn' ? 'প্রভাব' : 'Description'}</th>
                </tr>
              </thead>
              <tbody>
                {balanceTerms.map(row => (
                  <tr key={row.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '9px 14px', color: 'var(--fg-wp, #e7efe8)', fontWeight: 600 }}>
                      {lang === 'bn' ? row.labelBn : row.labelEn}
                    </td>
                    <td style={{ padding: '9px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: row.key === 'residual' ? 'var(--accent, #52d67a)' : 'var(--fg-wp, #e7efe8)' }}>
                      {formatNumberBnEn(row.val, 1, lang)} {lang === 'bn' ? 'মিমি' : 'mm'}
                    </td>
                    <td style={{ padding: '9px 14px', textAlign: 'right', color: 'var(--muted-wp, #93a597)', fontSize: 12 }}>
                      {row.key === 'residual'
                        ? (lang === 'bn' ? 'ভর সংরক্ষিত (০.০)' : 'Mass conserved (~0)')
                        : (row.key === 'effRain' || row.key === 'irrig'
                            ? (lang === 'bn' ? 'ইনপুট' : 'Inflow')
                            : (lang === 'bn' ? 'আউটপুট' : 'Outflow/Loss'))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </details>
  </div>
);
}

export default WaterIrrigationView;
