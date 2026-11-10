// frontend/src/SystemMap3D.jsx
// Interactive System Architecture Map for FieldShift 2026:
// NASA Satellites -> Data Layer -> Agronomic Science -> MILP / Learning Engine -> Farmer Pages
// Matches docs/evidence_layout_reference.html closely:
// 3-Column Layout: SPACE · NASA | ENGINE · SCIENCE · DECISION | FARMER · APP
// Visible text labels & subtitles on every node at all times.
// Interactive hover path lighting, click glass side panel, 6-step "Follow 718 mm" animation.
// Debug info goes strictly to console, zero UI counter clutter.

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const W = 1600;
const H = 860;

const COL = {
  used: '#C8F169',
  partial: '#F5B04C',
  planned: '#5d6b63',
  exp: '#b49cff',
};

export function SystemMap3D({
  lang = 'bn',
  onNavigate = null,
  activeField = null,
  selectedId = null,
  onSelectNode = null,
}) {
  const isBn = lang === 'bn';
  const [pinned, setPinned] = useState(selectedId || null);
  const [hovered, setHovered] = useState(null);
  const [followStep, setFollowStep] = useState(null);
  const followTimerRef = useRef(null);
  const svgRef = useRef(null);

  // Sync external selectedId
  useEffect(() => {
    if (selectedId) {
      setPinned(selectedId);
    }
  }, [selectedId]);

  // System Nodes definition matching reference layout
  const NODES = useMemo(() => {
    const rawNodes = [
      // SPACE · NASA
      {
        id: 'gpm',
        t: 'sat',
        x: 250,
        y: 150,
        lBn: 'GPM',
        lEn: 'GPM',
        sBn: 'বৃষ্টি',
        sEn: 'Rain',
        st: 'used',
        i: {
          whatBn: 'Global Precipitation Measurement — IMERG Final, দৈনিক বৃষ্টি',
          whatEn: 'Global Precipitation Measurement — IMERG Final daily precipitation',
          resBn: '০.১° (~১০ কিমি), ২০০১–২০২৪',
          resEn: '0.1° (~10 km), 2001–2024',
          useBn: 'পানির হিসাব, খরা/অতিবৃষ্টি, বর্ষা শুরু',
          useEn: 'Soil water balance, drought/flood deficit, monsoon onset',
          pagesBn: 'পানি, আবহাওয়া ও ঝুঁকি, প্ল্যানার',
          pagesEn: 'Water, Climate & Risk, Planner',
          code: 'data/imerg/bd_imerg_daily.npz, src/climate/point_data.py:302',
          targetPage: 'water_irrigation',
        },
      },
      {
        id: 'grace',
        t: 'sat',
        x: 92,
        y: 300,
        lBn: 'GRACE-FO',
        lEn: 'GRACE-FO',
        sBn: 'মাটির নিচের পানি',
        sEn: 'Total Water Storage',
        st: 'used',
        i: {
          whatBn: 'জোড়া স্যাটেলাইট, পৃথিবীর মাধ্যাকর্ষণ মেপে মোট পানি সঞ্চয় (ভূগর্ভস্থ + ভূ-উপরিস্থ + মাটির আর্দ্রতা)',
          whatEn: 'Twin satellites measuring gravity anomaly for total water storage (groundwater + surface + soil moisture)',
          resBn: 'mascon (~৩°), ০.৫° গ্রিডে, ২০০২–২০২৬ (২৫৯ মাস)',
          resEn: 'mascon (~3°), 0.5° grid, 2002–2026 (259 months)',
          useBn: 'পানি সঞ্চয়ের আঞ্চলিক প্রবণতা (বরেন্দ্র গড়: −১.০৭ সেমি/বছর)',
          useEn: 'Regional water storage trend (Barind avg: −1.07 cm/yr)',
          pagesBn: 'আবহাওয়া ও ঝুঁকি, পানি, Overview',
          pagesEn: 'Climate & Risk, Water, Overview',
          code: 'data/grace/grace_bangladesh_trends.json, src/climate/point_data.py:440',
          targetPage: 'weather',
        },
      },
      {
        id: 'ceres',
        t: 'sat',
        x: 400,
        y: 255,
        lBn: 'Terra/Aqua · CERES',
        lEn: 'Terra/Aqua · CERES',
        sBn: 'রোদ (POWER-এ)',
        sEn: 'Solar (in POWER)',
        st: 'used',
        i: {
          whatBn: 'সূর্যের বিকিরণ মাপে; NASA POWER-এর রোদের তথ্যের মূল উৎস (ALLSKY_SFC_SW_DWN)',
          whatEn: 'Measures solar irradiance; primary source of NASA POWER insolation telemetry',
          resBn: 'POWER-এর মাধ্যমে, ০.৫° গ্রিড',
          resEn: 'Via NASA POWER, 0.5° grid',
          useBn: 'FAO-56 পেনম্যান-মন্টিথ রেফারেন্স বাষ্পীভবন (ET0)',
          useEn: 'FAO-56 Penman-Monteith reference evapotranspiration (ET0)',
          pagesBn: 'পানি ও সেচ',
          pagesEn: 'Water & Irrigation',
          code: 'src/climate/point_data.py:85, src/compute/water_service.py:100',
          targetPage: 'water_irrigation',
        },
      },
      {
        id: 'srtm',
        t: 'sat',
        x: 98,
        y: 560,
        lBn: 'SRTM',
        lEn: 'SRTM',
        sBn: 'উচ্চতা',
        sEn: 'Elevation',
        st: 'partial',
        i: {
          whatBn: 'Shuttle Radar Topography Mission — জমির উচ্চতা ও ঢাল',
          whatEn: 'Shuttle Radar Topography Mission — Surface elevation and terrain slope',
          resBn: '৩০ মিটার গ্লোবাল গ্রিড',
          resEn: '30 meter global grid',
          useBn: 'বায়ুমণ্ডলীয় চাপ সংশোধন (FAO-56) ও ঢাল',
          useEn: 'Atmospheric pressure correction (FAO-56) and drainage slope',
          pagesBn: 'পানি (কিছু জমিতে)',
          pagesEn: 'Water (fields with valid elevation tiles)',
          code: 'src/climate/point_data.py:530',
          targetPage: 'water_irrigation',
        },
      },
      {
        id: 'smap',
        t: 'sat',
        x: 150,
        y: 720,
        lBn: 'SMAP',
        lEn: 'SMAP',
        sBn: 'মাটির আর্দ্রতা',
        sEn: 'Soil Moisture',
        st: 'planned',
        i: {
          whatBn: 'NASA SMAP L4 মাটির আর্দ্রতা অনুপাত (পরিকল্পিত দূরবর্তী ইনজেশন)',
          whatEn: 'NASA SMAP L4 root-zone soil moisture simulation (Planned remote sensing)',
          resBn: '৯ কিমি গ্লোবাল অ্যাসিমিল্যাশন, ২০১৫–বর্তমান',
          resEn: '9 km global assimilation, 2015–present',
          useBn: 'বর্তমানে সরাসরি স্যাটেলাইটের বদলে FAO-56 পানি ব্যালেন্স ব্যবহৃত হয়',
          useEn: 'Currently simulated via FAO-56 daily water balance rather than direct raster',
          pagesBn: '—',
          pagesEn: '—',
          code: 'backend/app/main.py:941 (খালি টেবিল / Placeholder DataFrame)',
        },
      },
      {
        id: 'modis',
        t: 'sat',
        x: 330,
        y: 690,
        lBn: 'MODIS',
        lEn: 'MODIS',
        sBn: 'গাছের সবুজভাব (NDVI)',
        sEn: 'Vegetation (NDVI)',
        st: 'planned',
        i: {
          whatBn: 'Terra/Aqua MODIS NDVI ফসলের সবুজ ঘনত্ব সূচক (পরিকল্পিত ইন-সিজন যাচাই)',
          whatEn: 'Terra/Aqua MODIS NDVI normalized vegetation index (Planned validation)',
          resBn: '২৫০ মিটার, ১৬ দিনের কম্পোজিট',
          resEn: '250 meter, 16-day composite',
          useBn: 'এখনো সরাসরি অ্যাপে ইনজেস্ট হয় না; কৃষকের নিজস্ব ফলন লগ দিয়ে যাচাই হয়',
          useEn: 'Not currently ingested directly; validated via farmer in-season feedback',
          pagesBn: '—',
          pagesEn: '—',
          code: 'frontend/src/DataEvidenceView.jsx:42',
        },
      },
      {
        id: 'power',
        t: 'hub',
        x: 520,
        y: 400,
        lBn: 'NASA POWER',
        lEn: 'NASA POWER',
        sBn: 'তাপ · আর্দ্রতা · বাতাস · রোদ',
        sEn: 'Temp · Humidity · Wind · Solar',
        st: 'used',
        i: {
          whatBn: 'MERRA-2 reanalysis + CERES থেকে দৈনিক কৃষি-আবহাওয়া (স্যাটেলাইট নয়, তথ্যের কেন্দ্র)',
          whatEn: 'MERRA-2 atmospheric assimilation + CERES daily agro-climatology (Data Hub)',
          resBn: '০.৫° (~৫০ কিমি), ১৯৮১–২০২৫ (৪৫ বছর)',
          resEn: '0.5° (~50 km), 1981–2025 (45 years daily series)',
          useBn: 'তাপমাত্রা, গরম দিন, ET0, ফসলের উপযোগিতা',
          useEn: 'Daily Tmax/Tmin, heatwave days, ET0, thermal GDD accumulation',
          pagesBn: 'সব পাতা',
          pagesEn: 'All Application Pages',
          code: 'src/climate/point_data.py:79, src/compute/water_service.py:100',
          targetPage: 'weather',
        },
      },
      {
        id: 'soil',
        t: 'box',
        x: 520,
        y: 560,
        lBn: 'ISRIC SoilGrids',
        lEn: 'ISRIC SoilGrids',
        sBn: 'মাটি (২৫০ মি)',
        sEn: 'Soil (250m)',
        st: 'used',
        ext: 1,
        i: {
          whatBn: 'মাটির বালি/পলি/কাদা অনুপাত, পিএইচ, জৈব কার্বন (NASA নয়, ISRIC গ্লোবাল ডেটা)',
          whatEn: 'Sand, silt, clay %, pH, and organic matter (Non-NASA, ISRIC Global Data)',
          resBn: '২৫০ মিটার গ্রিড',
          resEn: '250 meter grid',
          useBn: 'মাটি কত পানি ধরে রাখে (TAW, ফিল্ড ক্যাপাসিটি)',
          useEn: 'Total Available Water (TAW) & pedotransfer hydraulic parameters',
          pagesBn: 'আমার জমি, পানি ও সেচ',
          pagesEn: 'My Farm, Water & Irrigation',
          code: 'src/compute/field_enrichment.py:19',
          targetPage: 'field',
        },
      },
      {
        id: 'price',
        t: 'box',
        x: 520,
        y: 680,
        lBn: 'দাম',
        lEn: 'Prices',
        sBn: 'DAM · TCB · BBS',
        sEn: 'DAM · TCB · BBS',
        st: 'used',
        ext: 1,
        i: {
          whatBn: 'সরকারি বাজার দর ও উৎপাদন খরচের স্থির তালিকা (NASA নয়) + কৃষকের নিজস্ব দর',
          whatEn: 'Official government market wholesale prices & costs (Non-NASA) + farmer overrides',
          resBn: 'ফসলভিত্তিক জাতীয়/আঞ্চলিক বেঞ্চমার্ক',
          resEn: 'Crop-specific national & regional benchmarks',
          useBn: 'লাভের হিসাব, ব্রেক-ইভেন ও -২০% মূল্য ঝুঁকি',
          useEn: 'Gross margins, break-even thresholds & -20% sensitivity',
          pagesBn: 'প্ল্যানার, বাজার ও লাভ',
          pagesEn: 'Rotation Planner, Market & Profit',
          code: 'src/data/crops.py:12',
          targetPage: 'harvest_profit',
        },
      },

      // ENGINE · SCIENCE · DECISION
      {
        id: 'api',
        t: 'box',
        x: 740,
        y: 430,
        lBn: 'FieldShift API',
        lEn: 'FieldShift API',
        sBn: 'FastAPI + cache',
        sEn: 'FastAPI + cache',
        st: 'used',
        big: 1,
        i: {
          whatBn: 'সব তথ্য জমির নির্দিষ্ট বিন্দুতে এনে ক্যাশ করে, সব পাতায় একই সংখ্যা দেয়',
          whatEn: 'Harmonises multi-scale rasters to exact field GPS coordinate with local disk cache',
          resBn: 'খামারের নিজস্ব অক্ষাংশ-দ্রাঘিমাংশ',
          resEn: 'Field exact point coordinates',
          useBn: 'তথ্য সংগ্রহ ও ক্রস-ভিউ ধারাবাহিকতা রক্ষা',
          useEn: 'Data integration and cross-view numeric consistency',
          pagesBn: 'সব অ্যাপ্লিকেশন পাতা',
          pagesEn: 'All Application Pages',
          code: 'src/climate/point_data.py, backend/app/main.py',
        },
      },
      {
        id: 'water',
        t: 'box',
        x: 960,
        y: 260,
        lBn: 'পানির হিসাব',
        lEn: 'Water Balance',
        sBn: 'FAO-56 Penman-Monteith',
        sEn: 'FAO-56 Penman-Monteith',
        st: 'used',
        i: {
          whatBn: 'দৈনিক ET0, ফসলের পানির চাহিদা (দ্বৈত Kc), মাটির আর্দ্রতা ব্যালেন্স ও এডব্লিউডি (AWD)',
          whatEn: 'Daily reference ET0, dual Kc crop water balance, rootzone depletion & AWD scheduling',
          resBn: 'দৈনিক টাইম-স্টেপ',
          resEn: 'Daily time-step',
          useBn: 'কোন মৌসুমে কত সেচ, পাম্প চালানোর তারিখ',
          useEn: 'Seasonal net irrigation requirement and pump dates',
          pagesBn: 'পানি ও সেচ, প্ল্যানার',
          pagesEn: 'Water & Irrigation, Planner',
          code: 'src/compute/water_service.py:100',
          targetPage: 'water_irrigation',
        },
      },
      {
        id: 'stress',
        t: 'box',
        x: 960,
        y: 430,
        lBn: 'ফসলের চাপ',
        lEn: 'Crop Stress',
        sBn: 'Ky · তাপ · বন্যা · লবণ',
        sEn: 'Ky · Heat · Flood · Salinity',
        st: 'partial',
        i: {
          whatBn: 'খরা (FAO-33 Ky ফলন ক্ষতি), লবণাক্ততা (FAO-29 Maas-Hoffman), তাপ ও বন্যা',
          whatEn: 'Drought (FAO-33 Ky yield response), salinity (FAO-29 Maas-Hoffman), heat & flood',
          resBn: 'মৌসুমভিত্তিক সংবেদনশীলতা',
          resEn: 'Seasonal stage response',
          useBn: 'প্রতিকূল আবহাওয়ায় ফলন কত কমতে পারে ও সম্ভাব্য আর্থিক ক্ষতি',
          useEn: 'Yield deficit percentages and simulated financial losses under climate stress',
          pagesBn: 'চাপ পরীক্ষা',
          pagesEn: 'Stress Test Lab',
          code: 'src/compute/climate_stress.py:541, 620',
          targetPage: 'farm_planning',
        },
      },
      {
        id: 'trend',
        t: 'box',
        x: 960,
        y: 600,
        lBn: 'জলবায়ুর প্রবণতা',
        lEn: 'Climate Trends',
        sBn: 'Mann-Kendall · বর্ষা শুরু',
        sEn: 'Mann-Kendall · Monsoon Onset',
        st: 'used',
        i: {
          whatBn: '২৪–৪৫ বছরের আবহাওয়া প্রবণতা, p-মান; বর্ষা শুরুর তারিখের পরীক্ষা (Mann-Whitney U)',
          whatEn: '24-45 year climate trends, Sen slope, and empirical monsoon onset shift test (Mann-Whitney U)',
          resBn: 'বার্ষিক ও মৌসুমী সিরিজ',
          resEn: 'Annual and seasonal series',
          useBn: 'দীর্ঘমেয়াদে বৃষ্টি ও তাপমাত্রার কী বদলেছে, কী এখনো নিশ্চিত নয়',
          useEn: 'What has shifted historically vs what remains uncertain (monsoon onset disagreement)',
          pagesBn: 'আবহাওয়া ও ঝুঁকি',
          pagesEn: 'Weather & Climate Risk',
          code: 'src/compute/agro.py:228, src/climate/point_data.py:488',
          targetPage: 'weather',
        },
      },
      {
        id: 'milp',
        t: 'box',
        x: 1180,
        y: 350,
        lBn: 'MILP অপ্টিমাইজার',
        lEn: 'MILP Optimizer',
        sBn: 'PuLP · ৬ মৌসুম · ৪ কৌশল',
        sEn: 'PuLP · 6 seasons · 4 strategies',
        st: 'used',
        big: 1,
        i: {
          whatBn: 'সব স্কোর আর বাস্তব নিয়ম মেনে ৬ মৌসুমের সেরা ফসল-সারি একসাথে সমাধান করে',
          whatEn: 'Solves optimal 6-season crop sequence balancing profit, water conservation & soil health',
          resBn: '২ বছর × ৩ মৌসুম (মোট ৬ মৌসুম)',
          resEn: '2 years × 3 seasons (6 seasons rotation)',
          useBn: 'আবর্তন পরিকল্পনায় প্রধান সিদ্ধান্ত তৈরি (বোরো কমিয়ে সরিষা+মুগডাল)',
          useEn: 'Core decision engine powering rotation planning (saves 718 mm water/year)',
          pagesBn: 'প্ল্যানার, তুলনা, পানি, বাজার',
          pagesEn: 'Planner, Compare, Water, Market',
          code: 'src/optimizer/milp.py:430',
          targetPage: 'farm_planning',
        },
      },
      {
        id: 'learn',
        t: 'box',
        x: 1180,
        y: 540,
        lBn: 'মাঠ থেকে শেখা',
        lEn: 'Learning from Field',
        sBn: 'ফলন × দাম → আপডেট',
        sEn: 'Yield × Price → Update',
        st: 'used',
        i: {
          whatBn: 'আসল ফলন ও দামকে পুরস্কার ধরে ফসলের প্রত্যাশিত লাভ আপডেট, তারপর বাকি মৌসুম পুনরায় সাজানো',
          whatEn: 'Uses actual harvest outcomes to update prior expected profit, then re-solves remaining periods',
          resBn: 'প্রতি মৌসুমের শেষে',
          resEn: 'Post-harvest each season',
          useBn: 'মৌসুমের ফলাফলের ভিত্তিতে বাকি মৌসুমের পরিকল্পনা স্বয়ংক্রিয় সমন্বয়',
          useEn: 'Dynamically re-plans remaining seasons based on real field returns',
          pagesBn: 'অভিযোজিত পুনঃপরিকল্পনা',
          pagesEn: 'Adaptive Replan',
          code: 'src/optimizer/adaptive_replan.py:140',
          targetPage: 'farm_planning',
        },
      },
      {
        id: 'qrl',
        t: 'box',
        x: 1180,
        y: 690,
        lBn: 'Q-learning',
        lEn: 'Q-learning',
        sBn: 'পরীক্ষামূলক',
        sEn: 'Experimental',
        st: 'exp',
        dash: 1,
        i: {
          whatBn: 'Reinforcement learning গবেষণা পরীক্ষা, কৃত্রিম সিমুলেশন পরিবেশে প্রশিক্ষিত (১০,০০০ এপিসোড)',
          whatEn: 'Reinforcement learning research experiment trained in synthetic Gym environment (10,000 episodes)',
          resBn: 'সিমুলেশন ল্যাব',
          resEn: 'Synthetic lab benchmark',
          useBn: 'গবেষণামূলক বেঞ্চমার্ক মাত্র; কৃষকের আসল পরামর্শ PuLP MILP দেয়',
          useEn: 'Research benchmark only; authoritative farmer recommendations come strictly from MILP',
          pagesBn: 'অভিযোজিত (ছোট বাক্স), গবেষণা ল্যাব',
          pagesEn: 'Adaptive (small box), Research Lab',
          code: 'src/rl/synthetic_q_learning.py:22',
        },
      },
      {
        id: 'gemini',
        t: 'box',
        x: 1180,
        y: 180,
        lBn: 'AI সহকারী',
        lEn: 'AI Assistant',
        sBn: 'Gemini + পরিকল্পনার তথ্য',
        sEn: 'Gemini + Telemetry',
        st: 'used',
        i: {
          whatBn: 'পরিকল্পনার আসল সংখ্যা ও নাসা উপাত্ত দিয়ে বাংলায় কৃষি পরামর্শ দেয়; অফলাইনে নিজস্ব লোকাল ডেটা থেকে',
          whatEn: 'Agronomic conversational AI grounded in NASA telemetry and field rotation plan',
          resBn: 'খামারের নিজস্ব প্রেক্ষাপট',
          resEn: 'Field contextual briefing',
          useBn: 'কৃষকের জমিতে সেচ, সার ও আবহাওয়া ঝুঁকি সম্পর্কিত প্রশ্নের উত্তর',
          useEn: 'Answers farmer questions regarding fertilizer, irrigation timing & pest risks',
          pagesBn: 'AI সহকারী',
          pagesEn: 'AI Assistant',
          code: 'backend/app/main.py:2910, frontend/src/AiAssistantView.jsx',
          targetPage: 'assistant',
        },
      },

      // FARMER · APP (7 Pages on the Right)
      { id: 'p_plan', t: 'page', x: 1440, y: 150, lBn: 'আবর্তন পরিকল্পনা', lEn: 'Rotation Planner', st: 'used', targetPage: 'farm_planning' },
      { id: 'p_water', t: 'page', x: 1440, y: 240, lBn: 'পানি ও সেচ', lEn: 'Water & Irrigation', st: 'used', targetPage: 'water_irrigation' },
      { id: 'p_clim', t: 'page', x: 1440, y: 330, lBn: 'আবহাওয়া ও ঝুঁকি', lEn: 'Weather & Risk', st: 'used', targetPage: 'weather' },
      { id: 'p_stress', t: 'page', x: 1440, y: 420, lBn: 'চাপ পরীক্ষা', lEn: 'Stress Test', st: 'partial', targetPage: 'farm_planning' },
      { id: 'p_adapt', t: 'page', x: 1440, y: 510, lBn: 'অভিযোজিত', lEn: 'Adaptive', st: 'used', targetPage: 'farm_planning' },
      { id: 'p_market', t: 'page', x: 1440, y: 600, lBn: 'বাজার ও লাভ', lEn: 'Market & Profit', st: 'used', targetPage: 'harvest_profit' },
      { id: 'p_ai', t: 'page', x: 1440, y: 690, lBn: 'AI সহকারী', lEn: 'AI Assistant', st: 'used', targetPage: 'assistant' },
    ];
    return rawNodes;
  }, []);

  const byId = useMemo(() => Object.fromEntries(NODES.map((n) => [n.id, n])), [NODES]);

  const EDGES = useMemo(
    () => [
      ['gpm', 'api'],
      ['grace', 'api'],
      ['ceres', 'power'],
      ['power', 'api'],
      ['srtm', 'api'],
      ['smap', 'api'],
      ['modis', 'api'],
      ['soil', 'api'],
      ['price', 'api'],
      ['api', 'water'],
      ['api', 'stress'],
      ['api', 'trend'],
      ['water', 'milp'],
      ['stress', 'milp'],
      ['trend', 'milp'],
      ['api', 'milp'],
      ['milp', 'learn'],
      ['learn', 'milp'],
      ['milp', 'qrl'],
      ['milp', 'gemini'],
      ['milp', 'p_plan'],
      ['water', 'p_water'],
      ['trend', 'p_clim'],
      ['stress', 'p_stress'],
      ['learn', 'p_adapt'],
      ['milp', 'p_market'],
      ['gemini', 'p_ai'],
      ['milp', 'p_water'],
      ['grace', 'p_clim'],
    ],
    []
  );

  // Connectivity traversal to light the entire path (upstream + downstream)
  const reach = useCallback(
    (id) => {
      const up = new Set([id]);
      const down = new Set([id]);
      let changed = true;
      while (changed) {
        changed = false;
        EDGES.forEach(([a, b]) => {
          if (down.has(a) && !down.has(b) && !(a === 'learn' && b === 'milp')) {
            down.add(b);
            changed = true;
          }
          if (up.has(b) && !up.has(a) && !(a === 'milp' && b === 'learn')) {
            up.add(a);
            changed = true;
          }
        });
      }
      return new Set([...up, ...down]);
    },
    [EDGES]
  );

  const activeSet = useMemo(() => {
    if (followStep) {
      return new Set(followStep.ids);
    }
    const current = hovered || pinned;
    if (!current) return null;
    return reach(current);
  }, [hovered, pinned, followStep, reach]);

  // Node dimensions helper
  const getNodeSize = (n) => {
    if (n.t === 'sat') return [0, 0];
    if (n.t === 'page') return [200, 56];
    if (n.big) return [220, 84];
    return [200, 70];
  };

  const getAnchor = (n, side) => {
    const [w] = getNodeSize(n);
    if (n.t === 'sat') return [n.x + (side === 'out' ? 30 : -30), n.y];
    return side === 'out' ? [n.x + w / 2, n.y] : [n.x - w / 2, n.y];
  };

  const getEdgePath = (a, b) => {
    const A = byId[a];
    const B = byId[b];
    if (!A || !B) return '';
    let [x1, y1] = getAnchor(A, 'out');
    let [x2, y2] = getAnchor(B, 'in');

    if (a === 'learn' && b === 'milp') {
      [x1, y1] = [A.x - getNodeSize(A)[0] / 2, A.y - 20];
      [x2, y2] = [B.x - getNodeSize(B)[0] / 2, B.y + 30];
      return `M${x1},${y1} C${x1 - 70},${y1} ${x2 - 70},${y2} ${x2},${y2}`;
    }
    if (a === 'milp' && b === 'learn') {
      [x1, y1] = [A.x + getNodeSize(A)[0] / 2, A.y + 30];
      [x2, y2] = [B.x + getNodeSize(B)[0] / 2, B.y - 20];
      return `M${x1},${y1} C${x1 + 60},${y1} ${x2 + 60},${y2} ${x2},${y2}`;
    }
    if (a === 'milp' && b === 'qrl') {
      [x1, y1] = [A.x, A.y + 42];
      [x2, y2] = [B.x, B.y - 35];
      return `M${x1},${y1} C${x1 - 140},${y1 + 120} ${x2 - 140},${y2 - 80} ${x2},${y2}`;
    }
    if (a === 'milp' && b === 'gemini') {
      [x1, y1] = [A.x, A.y - 42];
      [x2, y2] = [B.x, B.y + 35];
      return `M${x1},${y1} L${x2},${y2}`;
    }
    const dx = (x2 - x1) * 0.5;
    return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
  };

  // Follow 718 mm Animation: 6 captioned steps as in reference
  const handleFollowNumber = () => {
    if (followTimerRef.current) {
      clearTimeout(followTimerRef.current);
      followTimerRef.current = null;
    }
    setPinned(null);

    const steps = [
      {
        ids: ['gpm'],
        textBn: 'GPM: রহিমের জমির ১০ কিমি ঘরের দৈনিক বৃষ্টি',
        textEn: 'GPM: Daily rainfall at Rahim field 0.1° (~10 km) cell',
      },
      {
        ids: ['gpm', 'ceres', 'power'],
        textBn: 'NASA POWER: তাপ, আর্দ্রতা, বাতাস, রোদ (CERES)',
        textEn: 'NASA POWER: Temp, humidity, wind, and CERES solar irradiance',
      },
      {
        ids: ['gpm', 'ceres', 'power', 'soil', 'api'],
        textBn: 'API: সব তথ্য জমির বিন্দুতে, মাটি SoilGrids থেকে',
        textEn: 'API: Harmonises all point rasters, soil parameters from SoilGrids',
      },
      {
        ids: ['gpm', 'ceres', 'power', 'soil', 'api', 'water'],
        textBn: 'FAO-56: প্রতিদিন ফসলের পানি − বৃষ্টি = সেচ',
        textEn: 'FAO-56: Daily crop ETc − effective rain = net irrigation deficit',
      },
      {
        ids: ['gpm', 'ceres', 'power', 'soil', 'api', 'water', 'milp'],
        textBn: 'MILP: কম পানির ফসল বেছে ৬ মৌসুম সাজায়',
        textEn: 'MILP: Selects low-water crop sequence across 6 seasons',
      },
      {
        ids: ['gpm', 'ceres', 'power', 'soil', 'api', 'water', 'milp', 'p_plan'],
        textBn: 'প্ল্যানার: বছরে সেচ ১৫৪৮ → ৭১৮ মিমি সাশ্রয়',
        textEn: 'Planner: Annual irrigation cut from 1,548 mm to 718 mm',
      },
    ];

    let idx = 0;
    const playNext = () => {
      if (idx >= steps.length) {
        followTimerRef.current = setTimeout(() => {
          setFollowStep(null);
        }, 3500);
        return;
      }
      setFollowStep({
        stepNum: idx + 1,
        total: steps.length,
        ids: steps[idx].ids,
        text: isBn ? steps[idx].textBn : steps[idx].textEn,
      });
      idx++;
      followTimerRef.current = setTimeout(playNext, 1750);
    };

    playNext();
  };

  const handleReset = () => {
    if (followTimerRef.current) {
      clearTimeout(followTimerRef.current);
      followTimerRef.current = null;
    }
    setFollowStep(null);
    setPinned(null);
    setHovered(null);
    if (onSelectNode) onSelectNode(null);
  };

  const handleNodeClick = (nodeId) => {
    setPinned(nodeId);
    if (onSelectNode) onSelectNode(nodeId);
  };

  // Pseudo-random stars for space background
  const stars = useMemo(() => {
    let seed = 3;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const s = [];
    for (let i = 0; i < 140; i++) {
      s.push({
        cx: rnd() * 640,
        cy: rnd() * H,
        r: rnd() * 1.2 + 0.3,
        opacity: 0.2 + rnd() * 0.6,
      });
    }
    return s;
  }, []);

  const selectedNodeData = pinned ? byId[pinned] : null;

  return (
    <div
      className="hero"
      style={{
        position: 'relative',
        borderRadius: 20,
        overflow: 'hidden',
        background: 'radial-gradient(120% 90% at 15% 50%, #0d1f33 0%, #070d14 45%, #08130e 100%)',
        border: '1px solid #1b2a24',
        marginBottom: 20,
        boxShadow: '0 25px 50px -15px rgba(0, 0, 0, 0.85)',
      }}
    >
      {/* Title & Subtitle */}
      <h1
        style={{
          position: 'absolute',
          left: 22,
          top: 16,
          margin: 0,
          fontFamily: 'var(--display, "Space Grotesk", sans-serif)',
          fontSize: 22,
          fontWeight: 700,
          color: '#ffffff',
          zIndex: 2,
        }}
      >
        {isBn ? 'FieldShift কীভাবে কাজ করে' : 'How FieldShift Works'}
      </h1>

      <div
        className="tag"
        style={{
          position: 'absolute',
          left: 22,
          top: 48,
          fontSize: 12.5,
          color: '#9fb3a5',
          zIndex: 2,
        }}
      >
        {isBn
          ? 'মহাকাশ থেকে মাঠ পর্যন্ত — কোনো স্যাটেলাইট বা বাক্সে মাউস রাখুন বা click করুন'
          : 'From space to field — Hover or click any satellite or node'}
      </div>

      {/* Top Action Tools */}
      <div
        className="tools"
        style={{
          position: 'absolute',
          right: 16,
          top: 14,
          display: 'flex',
          gap: 8,
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={handleFollowNumber}
          className="main"
          style={{
            font: '600 13px var(--body, "Hind Siliguri", sans-serif)',
            border: '1px solid var(--lime, #C8F169)',
            background: 'var(--lime, #C8F169)',
            color: '#10200a',
            borderRadius: 10,
            padding: '7px 14px',
            cursor: 'pointer',
            fontWeight: 700,
            boxShadow: '0 0 16px rgba(200, 241, 105, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>▶</span>
          <span>
            {isBn ? 'একটা সংখ্যা অনুসরণ করুন: ৭১৮ মিমি' : 'Follow One Number: 718 mm'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          style={{
            font: '600 13px var(--body, "Hind Siliguri", sans-serif)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            background: 'rgba(255, 255, 255, 0.07)',
            color: '#ffffff',
            borderRadius: 10,
            padding: '7px 12px',
            cursor: 'pointer',
          }}
        >
          {isBn ? 'সব দেখান' : 'Show All'}
        </button>
      </div>

      {/* SVG System Architecture Canvas */}
      <svg
        ref={svgRef}
        id="map"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={isBn ? 'FieldShift সিস্টেম মানচিত্র' : 'FieldShift System Architecture Map'}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          minHeight: 480,
        }}
      >
        <defs>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="earth" cx="38%" cy="35%">
            <stop offset="0" stopColor="#5bb4f0" />
            <stop offset="0.6" stopColor="#1f5fa6" />
            <stop offset="1" stopColor="#0a2550" />
          </radialGradient>

          <radialGradient id="atm">
            <stop offset="0.7" stopColor="#38D9F5" stopOpacity="0" />
            <stop offset="0.82" stopColor="#38D9F5" stopOpacity="0.35" />
            <stop offset="1" stopColor="#38D9F5" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Space Stars */}
        {stars.map((st, idx) => (
          <circle key={idx} cx={st.cx} cy={st.cy} r={st.r} fill="#ffffff" opacity={st.opacity} />
        ))}

        {/* Perspective floor grid in cyan for the Engine columns */}
        {Array.from({ length: 15 }).map((_, i) => {
          const x = 640 + i * 68;
          const x2 = 1120 + (x - 1120) * 0.35;
          return <line key={`v-${i}`} x1={x} y1="780" x2={x2} y2="560" stroke="#1d3a2a" strokeWidth="1" />;
        })}
        {Array.from({ length: 6 }).map((_, j) => {
          const y = 780 - j * 44;
          const k = 1 - j * 0.13;
          return (
            <line
              key={`h-${j}`}
              x1={1120 - 480 * k}
              y1={y}
              x2={1120 + 480 * k}
              y2={y}
              stroke="#1d3a2a"
              strokeWidth="1"
            />
          );
        })}

        {/* Earth + Atmospheric halo + Orbit Ellipses */}
        <circle cx="250" cy="430" r="190" fill="url(#atm)" />
        <circle cx="250" cy="430" r="150" fill="url(#earth)" />
        {/* Continents */}
        <path
          d="M190,360 q50,-30 95,0 q30,30 5,70 q-45,30 -90,0 q-40,-30 -10,-70z M270,470 q40,-10 60,25 q0,40 -45,40 q-40,-10 -15,-65z"
          fill="#3f9a57"
          opacity="0.85"
        />
        {/* Bangladesh field dot */}
        <path d="M262,410 l9,-3 l5,7 l-3,7 l-8,1z" fill="#C8F169" />

        {/* Orbit tracks */}
        <ellipse
          cx="250"
          cy="430"
          rx="250"
          ry="285"
          fill="none"
          stroke="#9fd8ff"
          strokeOpacity="0.18"
          strokeDasharray="3 7"
        />
        <ellipse
          cx="250"
          cy="430"
          rx="180"
          ry="300"
          fill="none"
          stroke="#9fd8ff"
          strokeOpacity="0.12"
          strokeDasharray="3 7"
          transform="rotate(30 250 430)"
        />

        {/* Column Category Footer Titles */}
        <text x="250" y="800" textAnchor="middle" fontFamily="Space Grotesk" fontSize="14" letterSpacing="3" fill="#6f8577">
          SPACE · NASA
        </text>
        <text x="960" y="835" textAnchor="middle" fontFamily="Space Grotesk" fontSize="14" letterSpacing="3" fill="#6f8577">
          ENGINE · SCIENCE · DECISION
        </text>
        <text x="1440" y="835" textAnchor="middle" fontFamily="Space Grotesk" fontSize="14" letterSpacing="3" fill="#6f8577">
          FARMER · APP
        </text>

        {/* Connecting Edges with Bezier Neon Glow and Flowing Particle Animation */}
        <g id="edges">
          {EDGES.map(([a, b], i) => {
            const pathD = getEdgePath(a, b);
            const sourceNode = byId[a];
            const targetNode = byId[b];
            if (!sourceNode || !targetNode || !pathD) return null;

            const isPlanned = sourceNode.st === 'planned';
            const isExp = targetNode.st === 'exp';
            const edgeColor = isPlanned ? COL.planned : isExp ? COL.exp : COL[sourceNode.st] || '#C8F169';

            const isEdgeOn = activeSet ? activeSet.has(a) && activeSet.has(b) : true;
            const opacity = activeSet ? (isEdgeOn ? 1 : 0.08) : isPlanned ? 0.25 : 0.38;

            return (
              <g key={`edge-${a}-${b}`} style={{ transition: 'opacity 0.2s', opacity }}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={edgeColor}
                  strokeWidth={isEdgeOn && activeSet ? 3.5 : isPlanned ? 1.5 : 2.5}
                  strokeDasharray={isPlanned ? '4 6' : undefined}
                  filter={isEdgeOn && activeSet ? 'url(#glow)' : undefined}
                />
                {!isPlanned && (
                  <circle r={isEdgeOn && activeSet ? 4.5 : 3.5} fill={edgeColor} filter="url(#glow)">
                    <animateMotion
                      dur={`${2.2 + (i % 5) * 0.4}s`}
                      repeatCount="indefinite"
                      path={pathD}
                      begin={`${(i % 7) * 0.25}s`}
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </g>

        {/* Nodes Layer: Labelled Glass Blocks & Realistic Satellites */}
        <g id="nodes">
          {NODES.map((n) => {
            const isNodeOn = activeSet ? activeSet.has(n.id) : true;
            const isSelected = pinned === n.id;
            const nodeOpacity = activeSet ? (isNodeOn ? 1 : 0.22) : 1;
            const nodeColor = COL[n.st] || '#C8F169';
            const [w, h] = getNodeSize(n);
            const label = isBn ? n.lBn : n.lEn;
            const sub = isBn ? n.sBn : n.sEn;

            return (
              <g
                key={n.id}
                className="node"
                tabIndex={0}
                role="button"
                aria-label={label}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleNodeClick(n.id)}
                style={{
                  cursor: 'pointer',
                  opacity: nodeOpacity,
                  transition: 'opacity 0.2s',
                  outline: 'none',
                }}
              >
                {/* 1. SATELLITE NODE TYPE */}
                {n.t === 'sat' && (
                  <g transform={`translate(${n.x} ${n.y})`}>
                    <circle r="34" fill={nodeColor} opacity={isSelected ? '0.22' : '0.08'} />
                    {/* Satellite Body & Solar Panels */}
                    <rect
                      x="-9"
                      y="-7"
                      width="18"
                      height="14"
                      rx="3"
                      fill={n.st === 'planned' ? '#6b7670' : '#dfe7ee'}
                    />
                    <rect
                      x="-36"
                      y="-4"
                      width="24"
                      height="8"
                      fill={n.st === 'planned' ? '#4a5550' : '#3a7bd5'}
                    />
                    <rect
                      x="12"
                      y="-4"
                      width="24"
                      height="8"
                      fill={n.st === 'planned' ? '#4a5550' : '#3a7bd5'}
                    />
                    {/* GRACE-FO Twin Satellite Feature */}
                    {n.id === 'grace' && (
                      <g transform="translate(0 30)">
                        <rect x="-7" y="-5" width="14" height="10" rx="2" fill="#dfe7ee" />
                        <rect x="-26" y="-3" width="17" height="6" fill="#3a7bd5" />
                        <rect x="9" y="-3" width="17" height="6" fill="#3a7bd5" />
                        <path d="M0,-16 L0,-2" stroke="#38D9F5" strokeDasharray="2 3" />
                      </g>
                    )}
                    {/* Visible Text Label & Subtitle */}
                    <text
                      y={n.id === 'grace' ? 58 : 30}
                      textAnchor="middle"
                      fontFamily="Space Grotesk, sans-serif"
                      fontSize="16"
                      fontWeight="700"
                      fill={nodeColor}
                    >
                      {label}
                    </text>
                    <text
                      y={n.id === 'grace' ? 76 : 48}
                      textAnchor="middle"
                      fontFamily="Hind Siliguri, sans-serif"
                      fontSize="13"
                      fontWeight="600"
                      fill="#b9c8be"
                    >
                      {sub}
                    </text>
                  </g>
                )}

                {/* 2. ENGINE / DATA BOX NODE TYPE (Pseudo-3D Glass Block) */}
                {(n.t === 'box' || n.t === 'hub') && (
                  <g transform={`translate(${n.x - w / 2} ${n.y - h / 2})`}>
                    {/* Pseudo-3D Depth Polygons */}
                    <polygon
                      points={`${w},0 ${w + 10},-10 ${w + 10},${h - 10} ${w},${h}`}
                      fill={nodeColor}
                      opacity={isSelected ? '0.35' : '0.18'}
                    />
                    <polygon
                      points={`0,0 10,-10 ${w + 10},-10 ${w},0`}
                      fill={nodeColor}
                      opacity={isSelected ? '0.45' : '0.28'}
                    />
                    {/* Main Glass Body Rect */}
                    <rect
                      className="body"
                      width={w}
                      height={h}
                      rx="10"
                      fill={n.ext ? '#141f1a' : '#10241a'}
                      stroke={nodeColor}
                      strokeWidth={isSelected ? 3 : n.big ? 2.5 : 1.5}
                      strokeDasharray={n.dash ? '7 5' : undefined}
                      filter={isSelected ? 'url(#glow)' : undefined}
                    />
                    {/* NASA POWER Hub Indicator Circle */}
                    {n.t === 'hub' && (
                      <g>
                        <circle cx="22" cy={h / 2} r="10" fill="none" stroke={nodeColor} strokeWidth="2" />
                        <circle cx="22" cy={h / 2} r="3.5" fill={nodeColor} />
                      </g>
                    )}
                    {/* Label & Subtitle */}
                    <text
                      x={n.t === 'hub' ? 42 : 14}
                      y={sub ? h / 2 - 4 : h / 2 + 6}
                      fontFamily="Hind Siliguri, sans-serif"
                      fontSize={n.big ? 19 : 16}
                      fontWeight="700"
                      fill="#eef5ef"
                    >
                      {label}
                    </text>
                    {sub && (
                      <text
                        x={n.t === 'hub' ? 42 : 14}
                        y={h / 2 + 17}
                        fontFamily="Hind Siliguri, sans-serif"
                        fontSize="12.5"
                        fill="#9fb3a5"
                      >
                        {sub}
                      </text>
                    )}
                    {/* Non-NASA Attribution Badge */}
                    {n.ext && (
                      <text
                        x={w - 10}
                        y="14"
                        textAnchor="end"
                        fontFamily="Space Grotesk, sans-serif"
                        fontSize="10"
                        fontWeight="700"
                        fill="#7f9186"
                      >
                        {isBn ? 'non-NASA' : 'non-NASA'}
                      </text>
                    )}
                  </g>
                )}

                {/* 3. FARMER APPLICATION PAGE NODE TYPE */}
                {n.t === 'page' && (
                  <g transform={`translate(${n.x - w / 2} ${n.y - h / 2})`}>
                    <rect
                      width={w}
                      height={h}
                      rx="9"
                      fill="#0f1c16"
                      stroke={nodeColor}
                      strokeOpacity={isSelected ? 1 : 0.7}
                      strokeWidth={isSelected ? 2.5 : 1}
                    />
                    <rect x="8" y="8" width="26" height={h - 16} rx="4" fill={nodeColor} opacity="0.2" />
                    <path
                      d={`M14,${h / 2 - 6} h14 M14,${h / 2} h10 M14,${h / 2 + 6} h12`}
                      stroke={nodeColor}
                      strokeWidth="2"
                    />
                    <text
                      x="44"
                      y={h / 2 + 5}
                      fontFamily="Hind Siliguri, sans-serif"
                      fontSize="15"
                      fontWeight="600"
                      fill="#eef5ef"
                    >
                      {label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* "Follow One Number" Floating Caption Notification */}
      {followStep && (
        <div
          className="cap show"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 16,
            transform: 'translateX(-50%)',
            background: 'rgba(14, 24, 20, 0.92)',
            border: '1px solid rgba(200, 241, 105, 0.5)',
            color: '#eaf2ec',
            borderRadius: 999,
            padding: '7px 18px',
            fontSize: 13.5,
            fontWeight: 600,
            zIndex: 25,
            whiteSpace: 'nowrap',
            boxShadow: '0 0 24px rgba(200, 241, 105, 0.3)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span style={{ color: 'var(--lime, #C8F169)', fontWeight: 700, marginRight: 8 }}>
            {followStep.stepNum}/{followStep.total}
          </span>
          <span>{followStep.text}</span>
        </div>
      )}

      {/* Bottom Status Legend */}
      <div
        className="legend"
        style={{
          position: 'absolute',
          left: 22,
          bottom: 14,
          display: 'flex',
          gap: 16,
          fontSize: 12,
          color: '#9fb3a5',
          zIndex: 2,
          flexWrap: 'wrap',
          pointerEvents: 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--lime, #C8F169)' }} />
          <span>{isBn ? 'ব্যবহৃত' : 'Used'}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--amber, #F5B04C)' }} />
          <span>{isBn ? 'আংশিক / নির্মাণাধীন' : 'Partial / In Progress'}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--violet, #b49cff)' }} />
          <span>{isBn ? 'পরীক্ষামূলক' : 'Experimental'}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#5d6b63' }} />
          <span>{isBn ? 'পরিকল্পিত' : 'Planned'}</span>
        </span>
      </div>

      {/* Glass Side Panel: Citation & Detailed Provenance on Click */}
      {selectedNodeData && (
        <div
          className="panel show"
          style={{
            position: 'absolute',
            right: 16,
            top: 64,
            width: 320,
            maxWidth: 'calc(100% - 32px)',
            background: 'rgba(14, 24, 20, 0.92)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: 16,
            padding: '14px 16px',
            color: '#e7efe8',
            zIndex: 30,
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.7)',
          }}
        >
          <button
            type="button"
            className="x"
            onClick={() => {
              setPinned(null);
              if (onSelectNode) onSelectNode(null);
            }}
            aria-label={isBn ? 'বন্ধ' : 'Close'}
            style={{
              position: 'absolute',
              right: 10,
              top: 8,
              background: 'none',
              border: 0,
              color: '#93a597',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ×
          </button>

          <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--display, "Space Grotesk", sans-serif)', fontSize: 17, fontWeight: 700 }}>
            {isBn ? selectedNodeData.lBn : selectedNodeData.lEn}
          </h3>

          <span
            className={`st ${selectedNodeData.st}`}
            style={{
              display: 'inline-block',
              fontSize: 11.5,
              fontWeight: 700,
              borderRadius: 99,
              padding: '1px 8px',
              marginBottom: 8,
              background:
                selectedNodeData.st === 'used'
                  ? 'rgba(200, 241, 105, 0.16)'
                  : selectedNodeData.st === 'partial'
                  ? 'rgba(245, 176, 76, 0.16)'
                  : selectedNodeData.st === 'exp'
                  ? 'rgba(180, 156, 255, 0.16)'
                  : 'rgba(255, 255, 255, 0.08)',
              color:
                selectedNodeData.st === 'used'
                  ? 'var(--lime, #C8F169)'
                  : selectedNodeData.st === 'partial'
                  ? 'var(--amber, #F5B04C)'
                  : selectedNodeData.st === 'exp'
                  ? 'var(--violet, #b49cff)'
                  : '#a5b2a9',
            }}
          >
            {selectedNodeData.st === 'used'
              ? (isBn ? 'ব্যবহৃত' : 'Used')
              : selectedNodeData.st === 'partial'
              ? (isBn ? 'আংশিক / নির্মাণাধীন' : 'Partial / In Progress')
              : selectedNodeData.st === 'exp'
              ? (isBn ? 'পরীক্ষামূলক' : 'Experimental')
              : (isBn ? 'পরিকল্পিত' : 'Planned')}
          </span>

          {selectedNodeData.i ? (
            <dl
              style={{
                margin: 0,
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '4px 10px',
                fontSize: 12.5,
                lineHeight: 1.45,
              }}
            >
              <dt style={{ color: '#93a597' }}>{isBn ? 'কী' : 'What'}</dt>
              <dd style={{ margin: 0 }}>{isBn ? selectedNodeData.i.whatBn : selectedNodeData.i.whatEn}</dd>

              <dt style={{ color: '#93a597' }}>{isBn ? 'মাপ/সময়' : 'Resolution'}</dt>
              <dd style={{ margin: 0 }}>{isBn ? selectedNodeData.i.resBn : selectedNodeData.i.resEn}</dd>

              <dt style={{ color: '#93a597' }}>{isBn ? 'কী হিসাব করি' : 'Computes'}</dt>
              <dd style={{ margin: 0 }}>{isBn ? selectedNodeData.i.useBn : selectedNodeData.i.useEn}</dd>

              <dt style={{ color: '#93a597' }}>{isBn ? 'কোন পাতায়' : 'Pages'}</dt>
              <dd style={{ margin: 0 }}>{isBn ? selectedNodeData.i.pagesBn : selectedNodeData.i.pagesEn}</dd>

              <dt style={{ color: '#93a597' }}>code</dt>
              <dd style={{ margin: 0 }}>
                <code style={{ fontSize: 11.5, color: '#9fd8ff', wordBreak: 'break-all' }}>
                  {selectedNodeData.i.code}
                </code>
              </dd>
            </dl>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: '#b9c8be' }}>
              {isBn
                ? 'অ্যাপের পাতা। আলো-জ্বলা পথ দেখায় এই পাতার সংখ্যা কোন তথ্য আর হিসাব থেকে আসে।'
                : 'Application Page. The lit path shows which telemetry and scientific models feed this view.'}
            </p>
          )}

          {selectedNodeData.targetPage && onNavigate && (
            <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button
                type="button"
                onClick={() => onNavigate(selectedNodeData.targetPage)}
                style={{
                  background: 'rgba(200, 241, 105, 0.15)',
                  border: '1px solid rgba(200, 241, 105, 0.35)',
                  color: 'var(--lime, #C8F169)',
                  padding: '5px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                {isBn ? '➔ এই পাতাটি খুলুন' : '➔ Open Page'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SystemMap3D;
