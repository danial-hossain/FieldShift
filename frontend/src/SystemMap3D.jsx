// frontend/src/SystemMap3D.jsx
// Interactive 3D System Map of FieldShift 2026:
// NASA Satellites -> Data Layer -> Agronomic Science -> MILP / Learning Engine -> Farmer Pages
// High performance: limited orbit controls, shared geometry, tube pulse animations, <= 120 draw calls, >= 50 FPS.

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function SystemMap3D({
  lang = 'bn',
  onNavigate = null,
  activeField = null,
  height = '70vh',
}) {
  const isBn = lang === 'bn';
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Interactive UI State
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [isAnimatingPath, setIsAnimatingPath] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [fps, setFps] = useState(60);
  const [drawCalls, setDrawCalls] = useState(0);

  // Entities & Metadata definition
  const PIPELINE_ENTITIES = useMemo(() => ({
    // SPACE / DATA SOURCES (Left)
    gpm: {
      id: 'gpm',
      category: 'space',
      nameBn: 'NASA GPM Core Observatory',
      nameEn: 'NASA GPM Core Observatory',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#00e5ff',
      roleBn: 'দৈনিক বৃষ্টিপাত পর্যবেক্ষণ (GPM_3IMERGDF V07B)',
      roleEn: 'Daily satellite precipitation (GPM_3IMERGDF V07B)',
      resolutionBn: '০.১° × ০.১° (~১০ কিমি), ২০০১–২০২৪ (৮,৭৬৬ দিন)',
      resolutionEn: '0.1° × 0.1° (~10 km), 2001–2024 (8,766 days)',
      computesBn: 'মাটির আর্দ্রতা ঘাটতি, এডব্লিউডি (AWD) শুকানোর চক্র, আমন রোপণ বৃষ্টি শুরুর পরিসংখ্যান।',
      computesEn: 'Root-zone water deficit, AWD drying cycles, Aman monsoon onset shift statistics.',
      citation: 'data/imerg/bd_imerg_daily.npz, src/climate/point_data.py:302',
      pages: [
        { id: 'water_irrigation', labelBn: 'পানি ও সেচ', labelEn: 'Water & Irrigation' },
        { id: 'climate_risk', labelBn: 'আবহাওয়া ও ঝুঁকি', labelEn: 'Climate & Risk' },
        { id: 'farm_planning', labelBn: 'প্ল্যানার', labelEn: 'Planner' },
      ],
      connections: ['fieldshift_api', 'water_balance', 'milp_optimizer', 'page_water', 'page_planner'],
    },
    grace: {
      id: 'grace',
      category: 'space',
      nameBn: 'NASA GRACE / GRACE-FO',
      nameEn: 'NASA GRACE / GRACE-FO Twin Satellites',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#10b981',
      roleBn: 'ভূগর্ভস্থ ভূ-জল সঞ্চয় হ্রাস/বৃদ্ধি (JPL Mascon RL06.3M)',
      roleEn: 'Terrestrial water storage anomaly & depletion trend',
      resolutionBn: '০.৫° Mascon CRI গ্রিড, ২০০২–২০২৪ (২৫৯ মাস)',
      resolutionEn: '0.5° Mascon CRI grid, 2002–2024 (259 months)',
      computesBn: 'বরেন্দ্র অঞ্চলের ভূগর্ভস্থ পানির দীর্ঘমেয়াদী ঘাটতি (-০.৫৮ সেমি/বছর) বনাম হাওর (+০.২২ সেমি/বছর)।',
      computesEn: 'Barind deep aquifer depletion (-0.58 cm/yr) vs Haor recharge (+0.22 cm/yr).',
      citation: 'data/grace/grace_bangladesh_trends.json, src/climate/point_data.py:469',
      pages: [
        { id: 'water_irrigation', labelBn: 'পানি ও সেচ', labelEn: 'Water & Irrigation' },
        { id: 'climate_risk', labelBn: 'আবহাওয়া ও ঝুঁকি', labelEn: 'Climate & Risk' },
      ],
      connections: ['fieldshift_api', 'climate_trends', 'page_water', 'page_climate'],
    },
    ceres: {
      id: 'ceres',
      category: 'space',
      nameBn: 'Terra / Aqua (CERES & MODIS)',
      nameEn: 'Terra / Aqua with CERES',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#f59e0b',
      roleBn: 'সৌর বিকিরণ ও আলোর তীব্রতা (ALLSKY_SFC_SW_DWN)',
      roleEn: 'Surface solar irradiance for FAO-56 Penman-Monteith',
      resolutionBn: '১.০° CERES FlashFlux সিনোপটিক পর্যবেক্ষণ',
      resolutionEn: '1.0° CERES FlashFlux synoptic observations',
      computesBn: 'দৈনিক নিট সৌর বিকিরণ (Rn) যা বাষ্পীভবন (ET0) ও ফসলের পানির চাহিদা চালনা করে।',
      computesEn: 'Daily net solar radiation (Rn) driving Penman-Monteith reference ET0.',
      citation: 'src/climate/point_data.py:85, src/compute/water_service.py:102',
      pages: [
        { id: 'water_irrigation', labelBn: 'পানি ও সেচ', labelEn: 'Water & Irrigation' },
        { id: 'farm_planning', labelBn: 'প্ল্যানার', labelEn: 'Planner' },
      ],
      connections: ['power_hub', 'fieldshift_api', 'water_balance', 'page_water'],
    },
    srtm: {
      id: 'srtm',
      category: 'space',
      nameBn: 'SRTM Shuttle Radar Topography',
      nameEn: 'SRTM Radar Topography Mission',
      badgeBn: 'আংশিক',
      badgeEn: 'Partial',
      status: 'partial',
      color: '#a855f7',
      roleBn: 'ডিজিটাল এলিভেশন মডেল (DEM 30m) ও ঢাল',
      roleEn: 'Digital elevation model & slope calculation',
      resolutionBn: '১ আর্ক-সেকেন্ড (~৩০ মি গ্লোবাল গ্রিড)',
      resolutionEn: '1 Arc-Second (~30 m global grid)',
      computesBn: 'বায়ুমণ্ডলীয় চাপ সংশোধন ও বন্যা ঝুঁকি স্তর নির্ধারণ। ডেটা না থাকলে জেলা মেটাডাটা ব্যবহার করে।',
      computesEn: 'Atmospheric pressure altitude correction for ET0; falls back to district metadata if tile absent.',
      citation: 'data/srtm/, backend/app/main.py:612',
      pages: [
        { id: 'climate_risk', labelBn: 'আবহাওয়া ও ঝুঁকি', labelEn: 'Climate & Risk' },
        { id: 'water_irrigation', labelBn: 'পানি ও সেচ', labelEn: 'Water & Irrigation' },
      ],
      connections: ['fieldshift_api', 'water_balance', 'page_water'],
    },
    smap: {
      id: 'smap',
      category: 'space',
      nameBn: 'NASA SMAP (Soil Moisture Active Passive)',
      nameEn: 'NASA SMAP (SPL4SMGP 9km)',
      badgeBn: 'পরিকল্পিত',
      badgeEn: 'Planned',
      status: 'planned',
      color: '#94a3b8',
      roleBn: 'মাটির আর্দ্রতা অনুপাত (পরিকল্পিত দূরবর্তী ইনজেশন)',
      roleEn: 'Soil moisture active passive root zone simulation',
      resolutionBn: '৯ কিমি গ্লোবাল অ্যাসিমিল্যাশন (SPL4SMGP)',
      resolutionEn: '9 km Global Assimilation (SPL4SMGP)',
      computesBn: 'বর্তমানে মাটির আর্দ্রতা সরাসরি স্যাটেলাইটের বদলে FAO-56 মডেল দিয়ে নিখুঁতভাবে সিমুলেট করা হয়।',
      computesEn: 'Currently simulated via daily FAO-56 dual Kc water balance rather than direct 9km raster download.',
      citation: 'backend/app/main.py:940 (Empty DataFrame frame placeholder)',
      pages: [],
      connections: ['fieldshift_api'],
    },
    modis: {
      id: 'modis',
      category: 'space',
      nameBn: 'MODIS NDVI (Terra/Aqua 250m)',
      nameEn: 'MODIS NDVI Vegetation Index',
      badgeBn: 'পরিকল্পিত',
      badgeEn: 'Planned',
      status: 'planned',
      color: '#94a3b8',
      roleBn: 'ফসলের সবুজ ঘনত্ব সূচক (পরিকল্পিত উপগ্রহ যাচাই)',
      roleEn: 'Normalized difference vegetation index (Planned)',
      resolutionBn: '২৫০ মি ১৬-দিনের কম্পোজিট (MOD13Q1)',
      resolutionEn: '250 m 16-Day composite (MOD13Q1)',
      computesBn: 'পরিকল্পিত ইন-সিজন ফসল পর্যবেক্ষণ। বর্তমানে কৃষকের বাস্তব ইনপুট দিয়ে যাচাই করা হয়।',
      computesEn: 'Planned remote sensing validation; currently validated via farmer in-season feedback.',
      citation: 'frontend/src/DataEvidenceView.jsx:104',
      pages: [],
      connections: ['fieldshift_api'],
    },
    power_hub: {
      id: 'power_hub',
      category: 'space',
      nameBn: 'NASA POWER Climatology Hub',
      nameEn: 'NASA POWER Data Reanalysis Hub',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#38bdf8',
      roleBn: 'MERRA-2 + GEOS-5.12.4 আবহাওয়া ডেটাহাব',
      roleEn: 'MERRA-2 atmospheric assimilation & CERES solar data hub',
      resolutionBn: '০.৫° × ০.৫° পয়েন্ট এপিআই (১৯৮১–২০২৫ দৈনিক)',
      resolutionEn: '0.5° × 0.5° point API (1981–2025 daily)',
      computesBn: 'তাপমাত্রা (Tmax, Tmin, Tmean), আর্দ্রতা (RH), বাতাসের গতি (WS2M) ও গ্রোইং ডিগ্রি ডে (GDD)।',
      computesEn: 'Daily Tmax, Tmin, Tavg, RH, Wind Speed, and thermal GDD accumulation.',
      citation: 'src/climate/point_data.py:79, src/compute/advisory_service.py:189',
      pages: [
        { id: 'water_irrigation', labelBn: 'পানি ও সেচ', labelEn: 'Water & Irrigation' },
        { id: 'climate_risk', labelBn: 'আবহাওয়া ও ঝুঁকি', labelEn: 'Climate & Risk' },
        { id: 'farm_planning', labelBn: 'প্ল্যানার', labelEn: 'Planner' },
        { id: 'assistant', labelBn: 'এআই সহকারী', labelEn: 'AI Assistant' },
      ],
      connections: ['fieldshift_api', 'water_balance', 'crop_stress', 'climate_trends', 'milp_optimizer', 'page_planner', 'page_water', 'page_climate'],
    },

    // MIDDLE ENGINE: COLUMN 1 (Data Layer)
    fieldshift_api: {
      id: 'fieldshift_api',
      category: 'engine_data',
      nameBn: 'FieldShift API ও পয়েন্ট ক্যাশ',
      nameEn: 'FieldShift API & Point Cache',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#06b6d4',
      roleBn: 'স্থানাঙ্কভিত্তিক উপাত্ত সমন্বয় ও ক্যাশিং',
      roleEn: 'Coordinate harmonisation & disk caching layer',
      resolutionBn: 'খামারের নিজস্ব অক্ষাংশ-দ্রাঘিমাংশ (FastAPI ব্যাকএন্ড)',
      resolutionEn: 'Farm coordinate point (FastAPI backend)',
      computesBn: 'পয়েন্ট কোঅর্ডিনেট অনুযায়ী ০.১° আইমার্জ ও ০.৫° পাওয়ার ডেটা একত্রিত করে বৈজ্ঞানিক মডেলে সরবরাহ।',
      computesEn: 'Harmonises satellite rasters and reanalysis grids to exact field coordinates for engines.',
      citation: 'src/climate/point_data.py, backend/app/main.py',
      pages: [
        { id: 'farm_planning', labelBn: 'প্ল্যানার', labelEn: 'Planner' },
        { id: 'water_irrigation', labelBn: 'পানি ও সেচ', labelEn: 'Water & Irrigation' },
      ],
      connections: ['water_balance', 'crop_stress', 'climate_trends', 'milp_optimizer'],
    },

    // MIDDLE ENGINE: COLUMN 2 (Agronomic Science)
    water_balance: {
      id: 'water_balance',
      category: 'engine_science',
      nameBn: 'পানি ভারসাম্য (FAO-56 PM)',
      nameEn: 'Water Balance (FAO-56 Penman-Monteith)',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#3b82f6',
      roleBn: 'দৈনিক মৃত্তিকা আর্দ্রতা হিসাব ও এডব্লিউডি (AWD)',
      roleEn: 'Daily root-zone soil water balance & AWD scheduling',
      resolutionBn: 'দৈনিক টাইম-স্টেপ, মাটির গভীরতা ০-১০০ সেমি (ISRIC SoilGrids ২৫০ মি)',
      resolutionEn: 'Daily time-step, soil depth 0-100 cm (ISRIC SoilGrids 250m)',
      computesBn: 'FAO-56 পেনম্যান-মন্টিথ রেফারেন্স বাষ্পীভবন (ET0), দ্বৈত ফসল সহগ (Kc) ও সেচের শিডিউল।',
      computesEn: 'FAO-56 Penman-Monteith ET0, dual Kc depletion, and Alternate Wetting & Drying schedules.',
      citation: 'src/compute/water_service.py:102-149, 382-450',
      pages: [
        { id: 'water_irrigation', labelBn: 'পানি ও সেচ', labelEn: 'Water & Irrigation' },
        { id: 'farm_planning', labelBn: 'প্ল্যানার', labelEn: 'Planner' },
      ],
      connections: ['milp_optimizer', 'page_water', 'page_planner'],
    },
    crop_stress: {
      id: 'crop_stress',
      category: 'engine_science',
      nameBn: 'ফসল সহনশীলতা ও চাপ পরীক্ষা',
      nameEn: 'Crop Stress Testing (FAO-33 Ky & FAO-29)',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#f97316',
      roleBn: 'খরা, তাপপ্রবাহ, বন্যা ও লবণাক্ততার ফলন হ্রাস মডেল',
      roleEn: 'Drought, heatwave, flood & salinity impact model',
      resolutionBn: 'মৌসুমভিত্তিক স্টেজ রেসপন্স (FAO-33 Ky ও FAO-29 ECe)',
      resolutionEn: 'Seasonal stage response (FAO-33 Ky & FAO-29 ECe)',
      computesBn: 'পানির অভাবে ফলন ক্ষতি (১ - Ya/Ym) = Ky × (১ - ETa/ETm) এবং লবণাক্ততা ক্ষতি (%/dS/m)।',
      computesEn: 'FAO-33 yield response to deficit and Maas-Hoffman salinity yield reduction curves.',
      citation: 'data/crops/crop_stress_params.json, src/compute/climate_stress.py:28-65',
      pages: [
        { id: 'farm_planning', labelBn: 'চাপ পরীক্ষা', labelEn: 'Stress Test' },
      ],
      connections: ['milp_optimizer', 'page_stress'],
    },
    climate_trends: {
      id: 'climate_trends',
      category: 'engine_science',
      nameBn: 'জলবায়ু প্রবণতা ও অনসেট বিশ্লেষণ',
      nameEn: 'Climate Trends & Monsoon Onset',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#14b8a6',
      roleBn: 'ম্যান-হুইটনি ইউ ও সেন-স্লোপ আবহাওয়া বিশ্লেষণ',
      roleEn: 'Mann-Whitney U, Sen slope & onset shift tests',
      resolutionBn: '২৪ বছরের দৈনিক উপাত্ত তুলনা (২০০১–২০১২ বনাম ২০১৩–২০২৪)',
      resolutionEn: '24-year daily record comparison (2001–2012 vs 2013–2024)',
      computesBn: 'আমন বৃষ্টি শুরু হওয়ার তারিখের পরিবর্তন ও দীর্ঘমেয়াদী তাপপ্রবাহের পরিসংখ্যানগত তাৎপর্য।',
      computesEn: 'Empirical monsoon rainfall onset DOY distribution shifts and heatwave day frequencies.',
      citation: 'src/climate/point_data.py:602, src/climate/summary.py:210',
      pages: [
        { id: 'climate_risk', labelBn: 'আবহাওয়া ও ঝুঁকি', labelEn: 'Climate & Risk' },
      ],
      connections: ['milp_optimizer', 'page_climate'],
    },

    // MIDDLE ENGINE: COLUMN 3 (Decision & Learning)
    milp_optimizer: {
      id: 'milp_optimizer',
      category: 'engine_decision',
      nameBn: 'MILP আবর্তন অপ্টিমাইজার (PuLP/CBC)',
      nameEn: 'MILP Crop Rotation Optimizer (PuLP / CBC)',
      badgeBn: 'প্রধান সিদ্ধান্তকারী',
      badgeEn: 'Core Decision Maker',
      status: 'used',
      color: '#10b981',
      roleBn: '৬ মৌসুমের সর্বোত্তম ফসল চক্র নির্ধারণ',
      roleEn: 'Mixed Integer Linear Programming 6-season rotation',
      resolutionBn: 'মৌসুম ১ থেকে ৬, ৪টি কৌশল (ভারসাম্য, লাভ, পানি, মাটি)',
      resolutionEn: 'Seasons 1 to 6, 4 strategies (balanced, profit, water, soil)',
      computesBn: 'সর্বোচ্চ লাভ, সর্বনিম্ন পানি ও সর্বোচ্চ মাটির নাইট্রোজেন বজায় রেখে বাস্তবসম্মত ফসল নির্বাচন।',
      computesEn: 'Solves optimal 6-season sequence subject to irrigation capacity, agronomic family & legume constraints.',
      citation: 'src/optimizer/milp.py:195-460',
      pages: [
        { id: 'farm_planning', labelBn: 'প্ল্যানার', labelEn: 'Planner' },
        { id: 'water_irrigation', labelBn: 'পানি ও সেচ', labelEn: 'Water & Irrigation' },
      ],
      connections: ['page_planner', 'page_water', 'page_market', 'page_compare'],
    },
    adaptive_learning: {
      id: 'adaptive_learning',
      category: 'engine_decision',
      nameBn: 'মাঠের ফল থেকে শেখা (Adaptive Feedback)',
      nameEn: 'Feedback Calibration (Adaptive Bayesian EMA)',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#0ea5e9',
      roleBn: 'কৃষকের আসল ফলন ও দাম থেকে প্রত্যাশা সমন্বয়',
      roleEn: 'In-season farmer feedback yield & profit calibration',
      resolutionBn: 'মৌসুম শেষে কৃষকের ইনপুট (মণ/বিঘা, টাকা/মণ)',
      resolutionEn: 'Post-harvest farmer input (maund/bigha, BDT/maund)',
      computesBn: 'মৌসুম শেষে দেওয়া আসল ফলন ও লাভের ভিত্তিতে বাকি মৌসুমগুলোর জন্য নতুন সেরা পরিকল্পনা তৈরি করে।',
      computesEn: 'Calibrates crop return priors with farmer recorded outcomes to re-solve future seasons.',
      citation: 'src/data/field_history.py, backend/app/main.py:1600-1750',
      pages: [
        { id: 'farm_planning', labelBn: 'অভিযোজিত পুনঃপরিকল্পনা', labelEn: 'Adaptive Replan' },
      ],
      connections: ['milp_optimizer', 'page_adaptive'],
    },
    q_learning: {
      id: 'q_learning',
      category: 'engine_decision',
      nameBn: 'Q-Learning (পরীক্ষামূলক রিইনফোর্সমেন্ট লার্নিং)',
      nameEn: 'Synthetic Q-Learning (Experimental RL Prototype)',
      badgeBn: 'গবেষণা প্রোটোটাইপ',
      badgeEn: 'Research Prototype',
      status: 'experimental',
      color: '#c084fc',
      roleBn: 'কৃত্রিম সিমুলেশন পরিবেশে রিইনফোর্সমেন্ট লার্নিং টেস্ট',
      roleEn: 'Reinforcement learning state-action transition benchmark',
      resolutionBn: '১০,০০০ এপিসোড কৃত্রিম জিম এনভায়রনমেন্ট',
      resolutionEn: '10,000 episode synthetic Gym environment',
      computesBn: 'ল্যাবে কৃত্রিম পরিবেশে পরীক্ষিত; বাস্তব কৃষকের সিদ্ধান্ত তৈরিতে এটি নয়, নিশ্চিতভাবে MILP ব্যবহৃত হয়।',
      computesEn: 'Trained strictly in synthetic environment; experimental research benchmark, NOT the production farmer advisor.',
      citation: 'src/rl/synthetic_q_learning.py:40-180',
      pages: [],
      connections: ['adaptive_learning'],
    },

    // RIGHT: FARMER APPLICATION PAGES
    page_planner: {
      id: 'page_planner',
      category: 'farmer_page',
      nameBn: '১. ফসল পরিকল্পনা ও ৩ডি খামার',
      nameEn: '1. Crop Planner & 3D Farm',
      badgeBn: 'পৃষ্ঠা',
      badgeEn: 'Page',
      status: 'used',
      color: '#10b981',
      roleBn: '৬ মৌসুমের কৌশলগত ফসল পরিকল্পনা',
      roleEn: '6-season rotation planner with 3D field preview',
      resolutionBn: 'কৃষকের নিজস্ব জমির আয়তন (বিঘা/হেক্টর)',
      resolutionEn: 'Farmer parcel size (bigha / ha)',
      computesBn: 'কৌশলগত ফসল কার্ড, সেচ বাজেট, ও লাভ-ক্ষতির পূর্ণ চিত্র।',
      computesEn: 'Seasonal crop sequencing cards, yearly irrigation budget and profit.',
      citation: 'frontend/src/SixSeasonRecommendationView.jsx',
      pages: [{ id: 'farm_planning', labelBn: 'প্ল্যানার খুলুন', labelEn: 'Open Planner' }],
      connections: [],
    },
    page_water: {
      id: 'page_water',
      category: 'farmer_page',
      nameBn: '২. পানি ও সেচ (দৈনিক ব্যালেন্স ও AWD)',
      nameEn: '2. Water & Daily AWD Irrigation',
      badgeBn: 'পৃষ্ঠা',
      badgeEn: 'Page',
      status: 'used',
      color: '#06b6d4',
      roleBn: 'দৈনিক সেচ সূচি ও ভূগর্ভস্থ পানির অবস্থা',
      roleEn: 'Day-by-day AWD pipe threshold & pump calendar',
      resolutionBn: 'খামারের নিজস্ব মাটির গঠন ও গভীরতা',
      resolutionEn: 'Field soil texture & depth',
      computesBn: 'কবে সেচ দিতে হবে এবং বছরে মোট কত হাজার লিটার পানি লাগবে।',
      computesEn: 'Next irrigation date, seasonal AWD pipe level, and yearly liter requirements.',
      citation: 'frontend/src/WaterIrrigationView.jsx',
      pages: [{ id: 'water_irrigation', labelBn: 'পানি ও সেচ খুলুন', labelEn: 'Open Water' }],
      connections: [],
    },
    page_climate: {
      id: 'page_climate',
      category: 'farmer_page',
      nameBn: '৩. আবহাওয়া ও ঝুঁকি (নাসা পয়েন্ট উপাত্ত)',
      nameEn: '3. Climate & Risk (Point Observations)',
      badgeBn: 'পৃষ্ঠা',
      badgeEn: 'Page',
      status: 'used',
      color: '#14b8a6',
      roleBn: 'খামারের নিজস্ব অক্ষাংশ-দ্রাঘিমাংশের আবহাওয়া ঝুঁকি',
      roleEn: 'Coordinate-specific rainfall, heatwave & GRACE trend',
      resolutionBn: '০.১° আইমার্জ গ্রিড সেল ও পয়েন্ট পাওয়ার উপাত্ত',
      resolutionEn: '0.1° IMERG grid cell & point POWER data',
      computesBn: 'গত ২৪ বছরের বৃষ্টিপাত প্যাটার্ন, তাপপ্রবাহের দিন ও ভূগর্ভস্থ পানির গতিবিধি।',
      computesEn: '24-year precipitation shift, annual heatwave days and regional water trend.',
      citation: 'frontend/src/ClimateRiskView.jsx',
      pages: [{ id: 'climate_risk', labelBn: 'আবহাওয়া খুলুন', labelEn: 'Open Climate' }],
      connections: [],
    },
    page_stress: {
      id: 'page_stress',
      category: 'farmer_page',
      nameBn: '৪. জলবায়ু চাপ পরীক্ষা',
      nameEn: '4. Climate Stress Test Lab',
      badgeBn: 'পৃষ্ঠা',
      badgeEn: 'Page',
      status: 'used',
      color: '#f97316',
      roleBn: 'প্রতিকূল আবহাওয়ায় বর্তমান পরিকল্পনার ঝুঁকি',
      roleEn: 'Empirical risk test against drought, heat & salinity',
      resolutionBn: 'FAO-33 স্টেজভিত্তিক সংবেদনশীলতা',
      resolutionEn: 'FAO-33 stage-based sensitivity',
      computesBn: 'খরা বা বন্যা হলে ঠিক কত টাকা আর্থিক ক্ষতি হতে পারে তার পূর্বানুমান।',
      computesEn: 'Exact BDT financial loss simulation under adverse climate scenarios.',
      citation: 'frontend/src/ClimateStressView.jsx',
      pages: [{ id: 'farm_planning', labelBn: 'চাপ পরীক্ষা দেখুন', labelEn: 'View Stress Test' }],
      connections: [],
    },
    page_adaptive: {
      id: 'page_adaptive',
      category: 'farmer_page',
      nameBn: '৫. অভিযোজিত পুনঃপরিকল্পনা',
      nameEn: '5. Adaptive Replan',
      badgeBn: 'পৃষ্ঠা',
      badgeEn: 'Page',
      status: 'used',
      color: '#0ea5e9',
      roleBn: 'বাস্তব ফলনের ভিত্তিতে পরবর্তী মৌসুমের পরিকল্পনা বদল',
      roleEn: 'In-season adjustment from recorded harvest outcomes',
      resolutionBn: 'কৃষকের রেকর্ডকৃত তথ্য',
      resolutionEn: 'Farmer recorded harvest log',
      computesBn: 'আগের মৌসুমে কম বা বেশি ফলন হলে ভবিষ্যতের ফসল আবর্তন স্বয়ংক্রিয়ভাবে ঠিক করা।',
      computesEn: 'Auto-adjusts remaining season crops when yield or market prices deviate.',
      citation: 'frontend/src/AdaptiveReplanView.jsx',
      pages: [{ id: 'farm_planning', labelBn: 'অভিযোজিত পৃষ্ঠা', labelEn: 'Open Adaptive' }],
      connections: [],
    },
    page_market: {
      id: 'page_market',
      category: 'farmer_page',
      nameBn: '৬. বাজার ও লাভ',
      nameEn: '6. Market & Economics',
      badgeBn: 'পৃষ্ঠা',
      badgeEn: 'Page',
      status: 'used',
      color: '#eab308',
      roleBn: 'ফসলের দাম, খরচ, লাভ ও ব্রেক-ইভেন বিশ্লেষণ',
      roleEn: 'Farm-gate crop prices, revenue, and sensitivity analysis',
      resolutionBn: 'সরকারি কৃষি বিপণন অধিদপ্তর (DAM/TCB/BBS ২০২৪)',
      resolutionEn: 'Dept. of Agricultural Marketing (DAM / TCB / BBS 2024)',
      computesBn: 'মৌসুমভিত্তিক আয়-ব্যয় এবং কত দামের নিচে নামলে লোকসান হবে।',
      computesEn: 'Seasonal cost-benefit breakdown, break-even price thresholds and -20% sensitivity.',
      citation: 'frontend/src/MarketProfitView.jsx',
      pages: [{ id: 'market_profit', labelBn: 'বাজার খুলুন', labelEn: 'Open Market' }],
      connections: [],
    },
    page_assistant: {
      id: 'page_assistant',
      category: 'farmer_page',
      nameBn: '৭. এআই সিদ্ধান্ত সহকারী (Gemini)',
      nameEn: '7. AI Decision Assistant (Gemini)',
      badgeBn: 'পৃষ্ঠা',
      badgeEn: 'Page',
      status: 'used',
      color: '#8b5cf6',
      roleBn: 'নাসা উপাত্ত ও বৈজ্ঞানিক মডেলে পরিচালিত কৃষি বুদ্ধিমত্তা',
      roleEn: 'Agronomic AI grounded in NASA telemetry & MILP results',
      resolutionBn: 'খামারের সার্বিক প্রোফাইল ও পরিকল্পনা',
      resolutionEn: 'Farm profile & crop plan telemetry',
      computesBn: 'কৃষকের জমিতে কোন সার, কখন পানি দিতে হবে এবং পোকা দমনে কী করতে হবে।',
      computesEn: 'Context-grounded agronomic briefings, fertilizer doses, and irrigation guidelines.',
      citation: 'frontend/src/AiAssistantView.jsx',
      pages: [{ id: 'assistant', labelBn: 'সহকারী খুলুন', labelEn: 'Open Assistant' }],
      connections: [],
    },
  }), []);

  // Check WebGL availability safely
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebGlSupported(false);
    } catch {
      setWebGlSupported(false);
    }

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsReducedMotion(true);
    }
  }, []);

  // "Follow One Number" animation: Rahim's 718 mm/yr net irrigation
  // Path: GPM (rain) + POWER (radiation) -> FieldShift API (0.1°) -> FAO-56 PM (Water Balance) -> MILP Optimizer -> Planner & Water Page
  const triggerFollowNumber = useCallback(() => {
    setIsAnimatingPath(true);
    setAnimationStep(1);

    const steps = [
      { step: 1, node: 'gpm' },
      { step: 2, node: 'fieldshift_api' },
      { step: 3, node: 'water_balance' },
      { step: 4, node: 'milp_optimizer' },
      { step: 5, node: 'page_planner' },
    ];

    steps.forEach((s, idx) => {
      setTimeout(() => {
        setAnimationStep(s.step);
        setSelectedNode(PIPELINE_ENTITIES[s.node]);
        if (idx === steps.length - 1) {
          setTimeout(() => {
            setIsAnimatingPath(false);
          }, 3500);
        }
      }, idx * 1400);
    });
  }, [PIPELINE_ENTITIES]);

  // Three.js Scene Setup & Loop
  useEffect(() => {
    if (!webGlSupported || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 1000;
    const heightPx = container.clientHeight || 520;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x070c14);
    scene.fog = new THREE.FogExp2(0x070c14, 0.015);

    const camera = new THREE.PerspectiveCamera(40, width / heightPx, 0.5, 200);
    camera.position.set(0, 14, 42);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. OrbitControls (Strictly limited: no flipping upside down)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 18;
    controls.maxDistance = 58;
    controls.minPolarAngle = Math.PI / 4; // ~45 deg
    controls.maxPolarAngle = Math.PI / 1.85; // ~97 deg (no flipping)
    controls.enablePan = true;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.6);
    dirLight1.position.set(-20, 30, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x10b981, 1.2);
    dirLight2.position.set(20, -10, 10);
    scene.add(dirLight2);

    // 5. Build 3D Entities
    // Group 1: Earth and Satellites (Left: X ~ -18)
    const earthGroup = new THREE.Group();
    earthGroup.position.set(-18, 0, 0);
    scene.add(earthGroup);

    // Small Earth
    const earthGeo = new THREE.SphereGeometry(3.2, 32, 24);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x0f2b48,
      roughness: 0.6,
      metalness: 0.2,
      wireframe: false,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // Earth atmosphere glow
    const atmGeo = new THREE.SphereGeometry(3.38, 24, 16);
    const atmMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
      wireframe: true,
    });
    const atmMesh = new THREE.Mesh(atmGeo, atmMat);
    earthGroup.add(atmMesh);

    // Interactive Mesh Map
    const clickableMeshes = [];

    // Helper: Create Node Mesh
    const createNode = (id, position, geometry, color, size = 1, isPlanned = false, isCentral = false) => {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: isPlanned ? 0.08 : isCentral ? 0.7 : 0.45,
        roughness: 0.3,
        metalness: 0.6,
        wireframe: isPlanned,
      });
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.position.copy(position);
      mesh.scale.set(size, size, size);
      mesh.userData = { id, baseColor: color, emissiveIntensity: mat.emissiveIntensity };
      scene.add(mesh);
      clickableMeshes.push(mesh);
      return mesh;
    };

    // Low-poly satellite creator
    const satelliteRefs = [];
    const createSatellite = (id, orbitRadius, inclination, speed, color, isPlanned = false) => {
      const satGroup = new THREE.Group();

      // Satellite body
      const bodyGeo = new THREE.BoxGeometry(0.5, 0.35, 0.4);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: isPlanned ? 0x64748b : color,
        emissive: isPlanned ? 0x1e293b : color,
        emissiveIntensity: isPlanned ? 0.1 : 0.5,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.userData = { id, baseColor: color };
      clickableMeshes.push(body);
      satGroup.add(body);

      // Solar wings
      const wingGeo = new THREE.BoxGeometry(1.2, 0.04, 0.3);
      const wingMat = new THREE.MeshStandardMaterial({
        color: isPlanned ? 0x475569 : 0x1e3a8a,
        emissive: isPlanned ? 0x000000 : 0x1d4ed8,
        emissiveIntensity: 0.3,
      });
      const wing = new THREE.Mesh(wingGeo, wingMat);
      satGroup.add(wing);

      // Orbit ring visual
      const ringGeo = new THREE.RingGeometry(orbitRadius - 0.03, orbitRadius + 0.03, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isPlanned ? 0x334155 : color,
        transparent: true,
        opacity: isPlanned ? 0.15 : 0.28,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2 + inclination;
      ring.rotation.y = inclination * 0.5;
      earthGroup.add(ring);

      earthGroup.add(satGroup);
      satelliteRefs.push({ group: satGroup, radius: orbitRadius, inclination, speed, angle: Math.random() * Math.PI * 2 });
      return satGroup;
    };

    // Satellites orbiting Earth
    createSatellite('gpm', 5.0, 0.45, 0.012, 0x00e5ff, false); // GPM
    createSatellite('grace', 5.8, -0.7, 0.009, 0x10b981, false); // GRACE-FO
    createSatellite('ceres', 6.6, 1.2, 0.008, 0xf59e0b, false); // CERES
    createSatellite('srtm', 4.3, 0.2, 0.016, 0xa855f7, false); // SRTM (partial)
    createSatellite('smap', 7.4, -0.3, 0.006, 0x94a3b8, true); // SMAP (planned)
    createSatellite('modis', 8.1, 0.9, 0.005, 0x94a3b8, true); // MODIS (planned)

    // NASA POWER Hub (reanalysis box on high geostationary orbit / station)
    const powerBoxGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    createNode('power_hub', new THREE.Vector3(-14, -4.5, 2), powerBoxGeo, 0x38bdf8, 1.1, false, false);

    // MIDDLE ENGINE: COLUMN 1 (Data Layer)
    const apiBoxGeo = new THREE.OctahedronGeometry(1.2, 0);
    createNode('fieldshift_api', new THREE.Vector3(-5.5, 0, 0), apiBoxGeo, 0x06b6d4, 1.2, false, false);

    // MIDDLE ENGINE: COLUMN 2 (Science Models)
    const sphereGeo = new THREE.SphereGeometry(1.0, 16, 12);
    const icosaGeo = new THREE.IcosahedronGeometry(1.0, 0);
    const cylinderGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.2, 12);

    createNode('water_balance', new THREE.Vector3(2.5, 4.2, 0), sphereGeo, 0x3b82f6, 1.1, false, false);
    createNode('crop_stress', new THREE.Vector3(2.5, 0, 0), icosaGeo, 0xf97316, 1.1, false, false);
    createNode('climate_trends', new THREE.Vector3(2.5, -4.2, 0), cylinderGeo, 0x14b8a6, 1.0, false, false);

    // MIDDLE ENGINE: COLUMN 3 (Decision & Learning)
    // MILP optimizer is the BIGGEST hero node
    const milpGeo = new THREE.DodecahedronGeometry(1.8, 0);
    createNode('milp_optimizer', new THREE.Vector3(10.5, 2.5, 0), milpGeo, 0x10b981, 1.35, false, true);

    const adaptiveGeo = new THREE.TorusGeometry(0.9, 0.35, 12, 24);
    createNode('adaptive_learning', new THREE.Vector3(10.5, -2.2, 0), adaptiveGeo, 0x0ea5e9, 1.1, false, false);

    const qlearnGeo = new THREE.TetrahedronGeometry(0.8, 0);
    createNode('q_learning', new THREE.Vector3(10.5, -5.8, 0), qlearnGeo, 0xc084fc, 0.9, true, false);

    // RIGHT: FARMER APPLICATION PAGES (Floating HUD screen slabs)
    const screenGeo = new THREE.BoxGeometry(2.8, 1.2, 0.12);
    const pageNodes = [
      { id: 'page_planner', y: 6.2, color: 0x10b981 },
      { id: 'page_water', y: 4.2, color: 0x06b6d4 },
      { id: 'page_climate', y: 2.1, color: 0x14b8a6 },
      { id: 'page_stress', y: 0.0, color: 0xf97316 },
      { id: 'page_adaptive', y: -2.1, color: 0x0ea5e9 },
      { id: 'page_market', y: -4.2, color: 0xeab308 },
      { id: 'page_assistant', y: -6.2, color: 0x8b5cf6 },
    ];
    pageNodes.forEach((p) => {
      createNode(p.id, new THREE.Vector3(18.5, p.y, 0), screenGeo, p.color, 1.0, false, false);
    });

    // 6. Connective Spline Tubes & Flowing Light Particles
    const tubeConnections = [
      // Space -> Data
      { from: [-18, 2.5, 0], to: [-5.5, 0, 0], color: 0x00e5ff, id: 'gpm_tube' },
      { from: [-14, -4.5, 2], to: [-5.5, 0, 0], color: 0x38bdf8, id: 'power_tube' },
      // Data -> Science
      { from: [-5.5, 0, 0], to: [2.5, 4.2, 0], color: 0x3b82f6, id: 'api_water' },
      { from: [-5.5, 0, 0], to: [2.5, 0, 0], color: 0xf97316, id: 'api_stress' },
      { from: [-5.5, 0, 0], to: [2.5, -4.2, 0], color: 0x14b8a6, id: 'api_climate' },
      // Science -> Decision
      { from: [2.5, 4.2, 0], to: [10.5, 2.5, 0], color: 0x10b981, id: 'water_milp' },
      { from: [2.5, 0, 0], to: [10.5, 2.5, 0], color: 0xf97316, id: 'stress_milp' },
      { from: [2.5, -4.2, 0], to: [10.5, 2.5, 0], color: 0x14b8a6, id: 'climate_milp' },
      { from: [10.5, -2.2, 0], to: [10.5, 2.5, 0], color: 0x0ea5e9, id: 'adaptive_milp' },
      // Decision -> Farmer Pages
      { from: [10.5, 2.5, 0], to: [18.5, 6.2, 0], color: 0x10b981, id: 'milp_planner' },
      { from: [2.5, 4.2, 0], to: [18.5, 4.2, 0], color: 0x06b6d4, id: 'water_page' },
      { from: [2.5, -4.2, 0], to: [18.5, 2.1, 0], color: 0x14b8a6, id: 'climate_page' },
      { from: [2.5, 0, 0], to: [18.5, 0.0, 0], color: 0xf97316, id: 'stress_page' },
      { from: [10.5, -2.2, 0], to: [18.5, -2.1, 0], color: 0x0ea5e9, id: 'adaptive_page' },
      { from: [10.5, 2.5, 0], to: [18.5, -4.2, 0], color: 0xeab308, id: 'market_page' },
      { from: [-5.5, 0, 0], to: [18.5, -6.2, 0], color: 0x8b5cf6, id: 'assistant_page' },
    ];

    const tubeMeshes = [];
    tubeConnections.forEach((conn) => {
      const p1 = new THREE.Vector3(...conn.from);
      const p2 = new THREE.Vector3(...conn.to);
      const mid = new THREE.Vector3(
        (p1.x + p2.x) * 0.5,
        (p1.y + p2.y) * 0.5 + (p1.y === p2.y ? 0.4 : 0),
        (p1.z + p2.z) * 0.5 + 1.2
      );
      const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.045, 6, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: conn.color,
        transparent: true,
        opacity: 0.28,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(tubeMesh);
      tubeMeshes.push({ mesh: tubeMesh, curve, color: conn.color, id: conn.id });
    });

    // Flowing Light Particles along tubes
    const particleCount = tubeConnections.length * 4;
    const particleGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const pMesh = new THREE.Mesh(particleGeo, particleMat);
      scene.add(pMesh);
      particles.push({
        mesh: pMesh,
        tubeIndex: i % tubeConnections.length,
        progress: (i / particleCount) % 1,
        speed: 0.003 + (i % 3) * 0.0015,
      });
    }

    // 7. Raycasting Handler (Hover & Click)
    const handlePointerMove = (evt) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(clickableMeshes);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const hitId = hit.userData?.id;
        if (hitId) {
          setHoveredNodeId(hitId);
          renderer.domElement.style.cursor = 'pointer';
        }
      } else {
        setHoveredNodeId(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const handleClick = (evt) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(clickableMeshes);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const hitId = hit.userData?.id;
        if (hitId && PIPELINE_ENTITIES[hitId]) {
          setSelectedNode(PIPELINE_ENTITIES[hitId]);
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousemove', handlePointerMove);
    domElement.addEventListener('click', handleClick);

    // 8. Animation & FPS Monitor
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      // FPS tracking
      frameCount++;
      const now = performance.now();
      if (now - fpsTimer >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - fpsTimer)));
        setDrawCalls(renderer.info.render.calls);
        frameCount = 0;
        fpsTimer = now;
      }

      // Rotate Earth slowly
      earthMesh.rotation.y += 0.002;
      atmMesh.rotation.y += 0.0015;

      // Update Satellites
      satelliteRefs.forEach((s) => {
        s.angle += s.speed;
        const x = Math.cos(s.angle) * s.radius;
        const z = Math.sin(s.angle) * s.radius;
        const y = Math.sin(s.angle * 1.5) * (s.radius * 0.35 * Math.sin(s.inclination));
        s.group.position.set(x, y, z);
        s.group.rotation.y = -s.angle;
      });

      // Update flowing light particles
      particles.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        const curve = tubeMeshes[p.tubeIndex].curve;
        const pt = curve.getPointAt(p.progress);
        p.mesh.position.copy(pt);
      });

      // Highlight connections on hover / selection
      const activeId = hoveredNodeId || selectedNode?.id;
      tubeMeshes.forEach((t) => {
        if (activeId && PIPELINE_ENTITIES[activeId]?.connections?.length) {
          const isRelated = PIPELINE_ENTITIES[activeId].connections.some((c) => t.id.includes(c) || t.id.includes(activeId));
          t.mesh.material.opacity = isRelated ? 0.9 : 0.12;
        } else {
          t.mesh.material.opacity = 0.28;
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize observer
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousemove', handlePointerMove);
      domElement.removeEventListener('click', handleClick);
      controls.dispose();
      renderer.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [webGlSupported, hoveredNodeId, selectedNode, PIPELINE_ENTITIES]);

  // Reset Camera view
  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 14, 42);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div
      className="system-map-3d-wrapper"
      style={{
        position: 'relative',
        width: '100%',
        height,
        minHeight: 480,
        backgroundColor: '#070c14',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)',
        marginBottom: 28,
      }}
    >
      {/* 3D WebGL Canvas or SVG Fallback */}
      {webGlSupported && !isReducedMotion ? (
        <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
      ) : (
        /* Static 2D Schematic Fallback for reduced motion / no WebGL */
        <div
          className="system-map-svg-fallback"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'radial-gradient(circle at center, #0f172a 0%, #070c14 100%)',
            color: '#e2e8f0',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 700 }}>
            <h3 style={{ fontSize: 18, color: '#38bdf8', marginBottom: 8 }}>
              {isBn ? '🌐 সিস্টেম আর্কিটেকচার মানচিত্র (স্থির সংস্করণ)' : '🌐 System Architecture Map (Static 2D Fallback)'}
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
              {isBn
                ? 'নাসা স্যাটেলাইট উপাত্ত ➔ বৈজ্ঞানিক অ্যালগরিদম ➔ MILP অপ্টিমাইজার ➔ কৃষকের বাস্তব পৃষ্ঠা'
                : 'NASA Satellites ➔ Science Engine ➔ MILP Optimizer ➔ Farmer Pages'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, textAlign: 'left' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8 }}>
                <strong style={{ color: '#00e5ff' }}>১. উপগ্রহ (Space)</strong>
                <div style={{ fontSize: 12, marginTop: 4 }}>GPM, GRACE, CERES, SRTM, POWER</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8 }}>
                <strong style={{ color: '#06b6d4' }}>২. ডেটা লেয়ার</strong>
                <div style={{ fontSize: 12, marginTop: 4 }}>FieldShift API, 0.1° গ্রিড সেল</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8 }}>
                <strong style={{ color: '#10b981' }}>৩. বিজ্ঞান ও MILP</strong>
                <div style={{ fontSize: 12, marginTop: 4 }}>FAO-56 PM, FAO-33 Ky, PuLP CBC</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8 }}>
                <strong style={{ color: '#f59e0b' }}>৪. কৃষকের পৃষ্ঠা</strong>
                <div style={{ fontSize: 12, marginTop: 4 }}>প্ল্যানার, পানি, আবহাওয়া, চাপ পরীক্ষা</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Floating Overlay Controls */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 16,
          right: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        {/* Title & Diagnostic Stats */}
        <div
          style={{
            pointerEvents: 'auto',
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 10,
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 16 }}>🛰️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{isBn ? 'নাসা থেকে কৃষকের মাঠ: পূর্ণাঙ্গ সিস্টেম ম্যাপ' : 'From Orbit to Field: Complete System Pipeline'}</span>
              <span style={{ fontSize: 10, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 6px', borderRadius: 4 }}>
                3D Interactive
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              {isBn ? 'স্যাটেলাইট বা নোডে ক্লিক করে প্রমাণাদি দেখুন' : 'Click any satellite or node to inspect citations & code'}
            </div>
          </div>
        </div>

        {/* Action Controls & Diagnostic Monitor */}
        <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto', alignItems: 'center' }}>
          {/* Follow One Number Button */}
          <button
            type="button"
            onClick={triggerFollowNumber}
            style={{
              background: isAnimatingPath
                ? 'linear-gradient(135deg, #0ea5e9, #10b981)'
                : 'rgba(15, 23, 42, 0.88)',
              color: '#ffffff',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: isAnimatingPath ? '0 0 16px rgba(14, 165, 233, 0.6)' : 'none',
              transition: 'all 0.2s ease',
            }}
            title={isBn ? 'রহিমের জমির ৭১৮ মিমি/বছর সেচের সম্পূর্ণ প্রবাহ দেখুন' : 'Follow Rahim field 718 mm/yr pipeline'}
          >
            <span>✨</span>
            <span>
              {isAnimatingPath
                ? (isBn ? `ধাপ ${animationStep}/৫: উপাত্ত প্রবাহ সক্রিয়...` : `Step ${animationStep}/5: Flowing...`)
                : (isBn ? 'একটি সংখ্যার পথ দেখুন (৭১৮ মিমি/বছর)' : 'Follow One Number (718 mm/yr)')}
            </span>
          </button>

          {/* Reset Camera */}
          <button
            type="button"
            onClick={handleResetCamera}
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              color: '#cbd5e1',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              padding: '6px 10px',
              borderRadius: 8,
              fontSize: 12,
              cursor: 'pointer',
            }}
            title={isBn ? 'ক্যামেরা পুনরায় সেট করুন' : 'Reset Camera Target'}
          >
            🎥 {isBn ? 'রিসেট' : 'Reset'}
          </button>

          {/* FPS & Draw Calls Pill */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              padding: '5px 8px',
              fontSize: 11,
              fontFamily: 'monospace',
              color: fps >= 45 ? '#34d399' : '#f59e0b',
            }}
          >
            {fps} FPS | {drawCalls} calls
          </div>
        </div>
      </div>

      {/* Floating 3-Column Section Header Badges */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 16,
          right: 16,
          display: 'grid',
          gridTemplateColumns: '1.2fr 1.6fr 1.2fr',
          gap: 12,
          pointerEvents: 'none',
          zIndex: 8,
        }}
      >
        <div style={{ background: 'rgba(15, 23, 42, 0.90)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(56, 189, 248, 0.2)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8' }}>
            {isBn ? '🛰️ ১. মহাকাশ ও ডেটাহাব' : '🛰️ 1. Space & Data Hubs'}
          </span>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>GPM, GRACE-FO, CERES, SRTM, POWER</div>
        </div>
        <div style={{ background: 'rgba(15, 23, 42, 0.90)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399' }}>
            {isBn ? '⚙️ ২. বৈজ্ঞানিক ইঞ্জিন ও অপ্টিমাইজার' : '⚙️ 2. Scientific Engines & Optimization'}
          </span>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>
            {isBn ? 'FAO-56 PM পানি ব্যালেন্স ➔ FAO-33 Ky ➔ PuLP MILP' : 'FAO-56 PM Water Balance ➔ FAO-33 Ky ➔ PuLP MILP'}
          </div>
        </div>
        <div style={{ background: 'rgba(15, 23, 42, 0.90)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24' }}>
            {isBn ? '🌾 ৩. কৃষকের ইন্টারফেস' : '🌾 3. Farmer Applications'}
          </span>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>
            {isBn ? 'প্ল্যানার, সেচ শিডিউল, চাপ পরীক্ষা, বাজার' : 'Planner, Water Schedule, Stress Test, Market'}
          </div>
        </div>
      </div>

      {/* Glass Side Panel: Entity Details on Click */}
      {selectedNode && (
        <div
          className="system-node-glass-panel"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            bottom: 14,
            width: 360,
            maxWidth: '90%',
            background: 'rgba(15, 23, 42, 0.96)',
            border: `1px solid ${selectedNode.color || 'rgba(56, 189, 248, 0.4)'}`,
            borderRadius: 14,
            padding: 20,
            zIndex: 20,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 4,
                  background:
                    selectedNode.status === 'used'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : selectedNode.status === 'partial'
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(148, 163, 184, 0.2)',
                  color:
                    selectedNode.status === 'used'
                      ? '#34d399'
                      : selectedNode.status === 'partial'
                        ? '#fbbf24'
                        : '#94a3b8',
                  border: `1px solid ${selectedNode.color}40`,
                }}
              >
                {isBn ? selectedNode.badgeBn : selectedNode.badgeEn}
              </span>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginTop: 6, marginBottom: 2 }}>
                {isBn ? selectedNode.nameBn : selectedNode.nameEn}
              </h4>
              <div style={{ fontSize: 11, color: selectedNode.color }}>
                {isBn ? selectedNode.roleBn : selectedNode.roleEn}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#94a3b8',
                borderRadius: '50%',
                width: 26,
                height: 26,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
            >
              ✕
            </button>
          </div>

          {/* Details Body */}
          <div style={{ fontSize: 12, lineHeight: 1.5, color: '#cbd5e1', flex: 1 }}>
            <div style={{ marginBottom: 12, background: 'rgba(255, 255, 255, 0.03)', padding: 10, borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 2 }}>
                {isBn ? 'রেজোলিউশন ও সময়কাল:' : 'Resolution & Period:'}
              </div>
              <div style={{ color: '#f1f5f9' }}>{isBn ? (selectedNode.resolutionBn || selectedNode.resolution) : (selectedNode.resolutionEn || selectedNode.resolution)}</div>
            </div>

            <div style={{ marginBottom: 12, background: 'rgba(255, 255, 255, 0.03)', padding: 10, borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 2 }}>
                {isBn ? 'ফিল্ডশিফট যা হিসাব করে:' : 'What FieldShift Computes:'}
              </div>
              <div>{isBn ? selectedNode.computesBn : selectedNode.computesEn}</div>
            </div>

            <div style={{ marginBottom: 14, background: 'rgba(255, 255, 255, 0.03)', padding: 10, borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 2 }}>
                {isBn ? 'কোড ও প্রোভেন্যান্স (File : Line):' : 'Code Citation (File : Line):'}
              </div>
              <code style={{ fontSize: 11, color: '#38bdf8', wordBreak: 'break-all' }}>
                {selectedNode.citation}
              </code>
            </div>

            {/* Target Page Buttons */}
            {selectedNode.pages && selectedNode.pages.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
                  {isBn ? 'সরাসরি পৃষ্ঠায় যান:' : 'Jump to Application Page:'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedNode.pages.map((pg) => (
                    <button
                      key={pg.id}
                      type="button"
                      onClick={() => onNavigate && onNavigate(pg.id)}
                      style={{
                        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(16, 185, 129, 0.12))',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        color: '#38bdf8',
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: onNavigate ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{isBn ? pg.labelBn : pg.labelEn}</span>
                      <span>➔</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SystemMap3D;
