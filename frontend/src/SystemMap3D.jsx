// frontend/src/SystemMap3D.jsx
// Interactive 3D System Map of FieldShift 2026:
// NASA Satellites -> Data Layer -> Agronomic Science -> MILP / Learning Engine -> Farmer Pages
// Matches exact reference layout: space | engine | farmer columns, glowing tubes with flowing particles,
// status colors (used lime, partial amber, experimental violet, planned grey), hover path lighting,
// click side drawer with verified file:line citations, and the "Follow 718 mm" animated pathway.

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

  // Interactive UI State
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [isAnimatingPath, setIsAnimatingPath] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [fps, setFps] = useState(60);
  const [drawCalls, setDrawCalls] = useState(0);

  // System Entities Definition with verified file citations & honest statuses
  const PIPELINE_ENTITIES = useMemo(() => ({
    // SPACE / DATA SOURCES (Left Column)
    gpm: {
      id: 'gpm',
      category: 'space',
      nameBn: 'NASA GPM Core Observatory',
      nameEn: 'NASA GPM Core Observatory',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#a3e635',
      subBn: 'বৃষ্টি',
      subEn: 'Rain',
      roleBn: 'দৈনিক বৃষ্টিপাত পর্যবেক্ষণ (GPM_3IMERGDF V07B)',
      roleEn: 'Daily satellite precipitation (GPM_3IMERGDF V07B)',
      resolutionBn: '০.১° × ০.১° (~১০ কিমি), ২০০১–২০২৪ (৮,৭৬৬ দিন)',
      resolutionEn: '0.1° × 0.1° (~10 km), 2001–2024 (8,766 days)',
      computesBn: 'মাটির আর্দ্রতা ঘাটতি, এডব্লিউডি (AWD) শুকানোর চক্র, আমন রোপণ বৃষ্টি শুরুর পরিসংখ্যান।',
      computesEn: 'Root-zone water deficit, AWD drying cycles, Aman monsoon onset shift statistics.',
      citation: 'data/imerg/bd_imerg_daily.npz, src/climate/point_data.py:302',
      pages: [
        { id: 'water_irrigation', labelBn: 'পানি ও সেচ', labelEn: 'Water & Irrigation' },
        { id: 'weather', labelBn: 'আবহাওয়া ও ঝুঁকি', labelEn: 'Weather & Risk' },
        { id: 'farm_planning', labelBn: 'আবর্তন পরিকল্পনা', labelEn: 'Rotation Planner' },
      ],
      connections: ['fieldshift_api', 'water_balance', 'milp_optimizer', 'page_planner', 'page_water'],
      uiPos: { left: '14%', top: '39%' },
    },
    ceres: {
      id: 'ceres',
      category: 'space',
      nameBn: 'Terra / Aqua · CERES',
      nameEn: 'Terra / Aqua with CERES',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#a3e635',
      subBn: 'রোদ (POWER-এ)',
      subEn: 'Solar (in POWER)',
      roleBn: 'সৌর বিকিরণ ও আলোর তীব্রতা (ALLSKY_SFC_SW_DWN)',
      roleEn: 'Surface solar irradiance for FAO-56 Penman-Monteith',
      resolutionBn: '১.০° CERES FlashFlux সিনোপটিক পর্যবেক্ষণ',
      resolutionEn: '1.0° CERES FlashFlux synoptic observations',
      computesBn: 'দৈনিক নিট সৌর বিকিরণ (Rn) যা বাষ্পীভবন (ET0) ও ফসলের পানির চাহিদা চালনা করে।',
      computesEn: 'Daily net solar radiation (Rn) driving Penman-Monteith reference ET0.',
      citation: 'src/climate/point_data.py:85, src/compute/water_service.py:100',
      pages: [
        { id: 'water_irrigation', labelBn: 'পানি ও সেচ', labelEn: 'Water & Irrigation' },
        { id: 'farm_planning', labelBn: 'আবর্তন পরিকল্পনা', labelEn: 'Rotation Planner' },
      ],
      connections: ['power_hub', 'fieldshift_api', 'water_balance', 'page_water', 'page_planner'],
      uiPos: { left: '23%', top: '48%' },
    },
    grace: {
      id: 'grace',
      category: 'space',
      nameBn: 'NASA GRACE / GRACE-FO',
      nameEn: 'NASA GRACE / GRACE-FO Twin Satellites',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#a3e635',
      subBn: 'মাটির নিচের পানি',
      subEn: 'Groundwater',
      roleBn: 'ভূগর্ভস্থ ভূ-জল সঞ্চয় হ্রাস/বৃদ্ধি (JPL Mascon RL06.3M)',
      roleEn: 'Terrestrial water storage anomaly & depletion trend',
      resolutionBn: '০.৫° Mascon CRI গ্রিড, ২০০২–২০২৪ (২৫৯ মাস)',
      resolutionEn: '0.5° Mascon CRI grid, 2002–2024 (259 months)',
      computesBn: 'বরেন্দ্র অঞ্চলের ভূগর্ভস্থ পানির দীর্ঘমেয়াদী ঘাটতি (-০.৫৮ সেমি/বছর) বনাম হাওর (+০.২২ সেমি/বছর)।',
      computesEn: 'Barind deep aquifer depletion (-0.58 cm/yr) vs Haor recharge (+0.22 cm/yr).',
      citation: 'src/climate/point_data.py:440',
      pages: [
        { id: 'water_irrigation', labelBn: 'পানি ও সেচ', labelEn: 'Water & Irrigation' },
        { id: 'weather', labelBn: 'আবহাওয়া ও ঝুঁকি', labelEn: 'Weather & Risk' },
      ],
      connections: ['fieldshift_api', 'climate_trends', 'page_climate', 'page_water'],
      uiPos: { left: '4%', top: '56%' },
    },
    srtm: {
      id: 'srtm',
      category: 'space',
      nameBn: 'SRTM Shuttle Radar Topography',
      nameEn: 'SRTM Radar Topography Mission',
      badgeBn: 'আংশিক',
      badgeEn: 'Partial',
      status: 'partial',
      color: '#f59e0b',
      subBn: 'উচ্চতা',
      subEn: 'Elevation',
      roleBn: 'ডিজিটাল এলিভেশন মডেল (DEM 30m) ও ঢাল',
      roleEn: 'Digital elevation model & altitude lookup',
      resolutionBn: '১ আর্ক-সেকেন্ড (~৩০ মি গ্লোবাল গ্রিড)',
      resolutionEn: '1 Arc-Second (~30 m global grid)',
      computesBn: 'বায়ুমণ্ডলীয় চাপ সংশোধন ও উচ্চতা নির্ধারণ। সমতল অঞ্চলে ডেটা না থাকলে জেলা মেটাডাটা ব্যবহার করে।',
      computesEn: 'Atmospheric pressure altitude correction for ET0; falls back to district metadata if tile absent.',
      citation: 'src/climate/point_data.py:530',
      pages: [
        { id: 'weather', labelBn: 'আবহাওয়া ও ঝুঁকি', labelEn: 'Weather & Risk' },
      ],
      connections: ['fieldshift_api', 'climate_trends', 'page_climate'],
      uiPos: { left: '4%', top: '74%' },
    },
    smap: {
      id: 'smap',
      category: 'space',
      nameBn: 'NASA SMAP (Soil Moisture Active Passive)',
      nameEn: 'NASA SMAP (SPL4SMGP 9km)',
      badgeBn: 'পরিকল্পিত',
      badgeEn: 'Planned',
      status: 'planned',
      color: '#64748b',
      subBn: 'মাটির আর্দ্রতা',
      subEn: 'Soil Moisture',
      roleBn: 'মাটির আর্দ্রতা অনুপাত (পরিকল্পিত দূরবর্তী ইনজেশন)',
      roleEn: 'Soil moisture active passive root zone simulation',
      resolutionBn: '৯ কিমি গ্লোবাল অ্যাসিমিল্যাশন (SPL4SMGP)',
      resolutionEn: '9 km Global Assimilation (SPL4SMGP)',
      computesBn: 'বর্তমানে মাটির আর্দ্রতা সরাসরি স্যাটেলাইটের বদলে FAO-56 মডেল দিয়ে নিখুঁতভাবে সিমুলেট করা হয়।',
      computesEn: 'Currently simulated via daily FAO-56 dual Kc water balance rather than direct 9km raster download.',
      citation: 'backend/app/main.py:941 (Empty DataFrame placeholder frame)',
      pages: [],
      connections: ['fieldshift_api'],
      uiPos: { left: '9%', top: '88%' },
    },
    modis: {
      id: 'modis',
      category: 'space',
      nameBn: 'MODIS NDVI (Terra/Aqua 250m)',
      nameEn: 'MODIS NDVI Vegetation Index',
      badgeBn: 'পরিকল্পিত',
      badgeEn: 'Planned',
      status: 'planned',
      color: '#64748b',
      subBn: 'গাছের সবুজভাব (NDVI)',
      subEn: 'Vegetation (NDVI)',
      roleBn: 'ফসলের সবুজ ঘনত্ব সূচক (পরিকল্পিত উপগ্রহ যাচাই)',
      roleEn: 'Normalized difference vegetation index (Planned)',
      resolutionBn: '২৫০ মি ১৬-দিনের কম্পোজিট (MOD13Q1)',
      resolutionEn: '250 m 16-Day composite (MOD13Q1)',
      computesBn: 'পরিকল্পিত ইন-সিজন ফসল পর্যবেক্ষণ। বর্তমানে কৃষকের বাস্তব ইনপুট দিয়ে যাচাই করা হয়।',
      computesEn: 'Planned remote sensing validation; currently validated via farmer in-season feedback.',
      citation: 'frontend/src/DataEvidenceView.jsx:42',
      pages: [],
      connections: ['fieldshift_api'],
      uiPos: { left: '20%', top: '86%' },
    },

    // ADJACENT DATA INPUT CARDS
    power_hub: {
      id: 'power_hub',
      category: 'space',
      nameBn: 'NASA POWER Climatology Hub',
      nameEn: 'NASA POWER Data Reanalysis Hub',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#a3e635',
      subBn: 'তাপ · আর্দ্রতা · বাতাস · রোদ',
      subEn: 'Temp · Humidity · Wind · Solar',
      roleBn: 'MERRA-2 + GEOS-5.12.4 আবহাওয়া ডেটাহাব',
      roleEn: 'MERRA-2 atmospheric assimilation & CERES solar data hub',
      resolutionBn: '০.৫° × ০.৫° পয়েন্ট এপিআই (১৯৮১–২০২৫ দৈনিক)',
      resolutionEn: '0.5° × 0.5° point API (1981–2025 daily)',
      computesBn: 'তাপমাত্রা (Tmax, Tmin, Tmean), আর্দ্রতা (RH), বাতাসের গতি (WS2M) ও গ্রোইং ডিগ্রি ডে (GDD)।',
      computesEn: 'Daily Tmax, Tmin, Tavg, RH, Wind Speed, and thermal GDD accumulation.',
      citation: 'src/climate/point_data.py:79, src/compute/water_service.py:100',
      pages: [
        { id: 'water_irrigation', labelBn: 'পানি ও সেচ', labelEn: 'Water & Irrigation' },
        { id: 'weather', labelBn: 'আবহাওয়া ও ঝুঁকি', labelEn: 'Weather & Risk' },
        { id: 'farm_planning', labelBn: 'আবর্তন পরিকল্পনা', labelEn: 'Rotation Planner' },
      ],
      connections: ['fieldshift_api', 'water_balance', 'crop_stress', 'climate_trends', 'milp_optimizer', 'page_planner', 'page_water'],
      uiPos: { left: '31%', top: '58%' },
    },
    soilgrids: {
      id: 'soilgrids',
      category: 'space',
      nameBn: 'ISRIC SoilGrids 250m Global Data',
      nameEn: 'ISRIC SoilGrids 250m Global Data',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#a3e635',
      subBn: 'মাটি (২৫০ মি)',
      subEn: 'Soil (250m)',
      roleBn: 'মাটির বুনট, পিএইচ ও জৈব পদার্থ প্রোফাইল',
      roleEn: 'Soil texture, clay/sand/silt %, pH & organic matter',
      resolutionBn: '২৫০ মিটার স্থানিক রেজোলিউশন (ISRIC WoSIS)',
      resolutionEn: '250 m spatial resolution (ISRIC WoSIS)',
      computesBn: 'মাটির পানি ধারণক্ষমতা (TAW), ফিল্ড ক্যাপাসিটি ও পারকুলেশন রেট যা হাইড্রলিক মডেলে ব্যবহৃত হয়।',
      computesEn: 'Total Available Water (TAW), field capacity and percolation rates for pedotransfer equations.',
      citation: 'src/compute/field_enrichment.py:19',
      pages: [
        { id: 'water_irrigation', labelBn: 'পানি ও সেচ', labelEn: 'Water & Irrigation' },
        { id: 'farm_planning', labelBn: 'আবর্তন পরিকল্পনা', labelEn: 'Rotation Planner' },
      ],
      connections: ['fieldshift_api', 'water_balance', 'crop_stress', 'page_water', 'page_planner'],
      uiPos: { left: '31%', top: '72%' },
    },
    prices: {
      id: 'prices',
      category: 'space',
      nameBn: 'সরকারি বাজার দর ও উৎপাদন খরচ',
      nameEn: 'Official Market Prices & Costs',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#a3e635',
      subBn: 'DAM · TCB · BBS',
      subEn: 'DAM · TCB · BBS',
      roleBn: 'কৃষি বিপণন অধিদপ্তর ও বিবিএস পাইকারি দর',
      roleEn: 'Dept of Agricultural Marketing & BBS baseline costs',
      resolutionBn: 'জাতীয় ও আঞ্চলিক পাইকারি বাজার সংকলন (২০২৪–২০২৫)',
      resolutionEn: 'National and regional wholesale market prices',
      computesBn: 'প্রতি ফসলের মোট উৎপাদন খরচ, সম্ভাব্য রাজস্ব, নিট মুনাফা এবং -২০% মূল্য সংবেদনশীলতা।',
      computesEn: 'Gross margins, production costs, net profit and -20% price risk sensitivity.',
      citation: 'src/data/crops.py:12',
      pages: [
        { id: 'harvest_profit', labelBn: 'বাজার ও লাভ', labelEn: 'Market & Profit' },
        { id: 'farm_planning', labelBn: 'আবর্তন পরিকল্পনা', labelEn: 'Rotation Planner' },
      ],
      connections: ['fieldshift_api', 'milp_optimizer', 'page_market', 'page_planner'],
      uiPos: { left: '31%', top: '83%' },
    },

    // MIDDLE ENGINE: COLUMN 1 (Data Layer)
    fieldshift_api: {
      id: 'fieldshift_api',
      category: 'engine_data',
      nameBn: 'FieldShift API ও ক্যাশ স্তর',
      nameEn: 'FieldShift API & Cache Layer',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#a3e635',
      subBn: 'FastAPI + cache',
      subEn: 'FastAPI + cache',
      roleBn: 'স্থানাঙ্কভিত্তিক উপাত্ত সমন্বয় ও ক্যাশিং',
      roleEn: 'Coordinate harmonisation & disk caching layer',
      resolutionBn: 'খামারের নিজস্ব অক্ষাংশ-দ্রাঘিমাংশ (FastAPI ব্যাকএন্ড)',
      resolutionEn: 'Farm coordinate point (FastAPI backend)',
      computesBn: 'পয়েন্ট কোঅর্ডিনেট অনুযায়ী ০.১° আইমার্জ ও ০.৫° পাওয়ার ডেটা একত্রিত করে বৈজ্ঞানিক মডেলে সরবরাহ।',
      computesEn: 'Harmonises satellite rasters and reanalysis grids to exact field coordinates for engines.',
      citation: 'src/climate/point_data.py, backend/app/main.py',
      pages: [
        { id: 'farm_planning', labelBn: 'আবর্তন পরিকল্পনা', labelEn: 'Rotation Planner' },
        { id: 'water_irrigation', labelBn: 'পানি ও সেচ', labelEn: 'Water & Irrigation' },
      ],
      connections: ['water_balance', 'crop_stress', 'climate_trends', 'milp_optimizer'],
      uiPos: { left: '44%', top: '61%' },
    },

    // MIDDLE ENGINE: COLUMN 2 (Agronomic Science)
    water_balance: {
      id: 'water_balance',
      category: 'engine_science',
      nameBn: 'পানির হিসাব ও এডব্লিউডি (FAO-56 PM)',
      nameEn: 'Water Balance (FAO-56 Penman-Monteith)',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#a3e635',
      subBn: 'FAO-56 Penman-Monteith',
      subEn: 'FAO-56 Penman-Monteith',
      roleBn: 'দৈনিক মৃত্তিকা আর্দ্রতা হিসাব ও এডব্লিউডি (AWD)',
      roleEn: 'Daily root-zone soil water balance & AWD scheduling',
      resolutionBn: 'দৈনিক টাইম-স্টেপ, মাটির গভীরতা ০-১০০ সেমি (ISRIC SoilGrids ২৫০ মি)',
      resolutionEn: 'Daily time-step, soil depth 0-100 cm (ISRIC SoilGrids 250m)',
      computesBn: 'FAO-56 পেনম্যান-মন্টিথ রেফারেন্স বাষ্পীভবন (ET0), দ্বৈত ফসল সহগ (Kc) ও সেচের শিডিউল।',
      computesEn: 'FAO-56 Penman-Monteith ET0, dual Kc depletion, and Alternate Wetting & Drying schedules.',
      citation: 'src/compute/water_service.py:100',
      pages: [
        { id: 'water_irrigation', labelBn: 'পানি ও সেচ', labelEn: 'Water & Irrigation' },
        { id: 'farm_planning', labelBn: 'আবর্তন পরিকল্পনা', labelEn: 'Rotation Planner' },
      ],
      connections: ['milp_optimizer', 'page_water', 'page_planner'],
      uiPos: { left: '57%', top: '48%' },
    },
    crop_stress: {
      id: 'crop_stress',
      category: 'engine_science',
      nameBn: 'ফসলের চাপ মডেল (FAO-33 Ky & Maas-Hoffman)',
      nameEn: 'Crop Stress Testing (FAO-33 Ky & FAO-29)',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#a3e635',
      subBn: 'Ky · তাপ · খরা · লবণ',
      subEn: 'Ky · Heat · Drought · Salinity',
      roleBn: 'খরা, তাপপ্রবাহ, বন্যা ও লবণাক্ততার ফলন হ্রাস মডেল',
      roleEn: 'Drought, heatwave, flood & salinity impact model',
      resolutionBn: 'মৌসুমভিত্তিক স্টেজ রেসপন্স (FAO-33 Ky ও FAO-29 ECe)',
      resolutionEn: 'Seasonal stage response (FAO-33 Ky & FAO-29 ECe)',
      computesBn: 'পানির অভাবে ফলন ক্ষতি (১ - Ya/Ym) = Ky × (১ - ETa/ETm) এবং লবণাক্ততা ক্ষতি (%/dS/m)।',
      computesEn: 'FAO-33 yield response to deficit and Maas-Hoffman salinity yield reduction curves.',
      citation: 'src/compute/climate_stress.py:541, src/compute/climate_stress.py:620',
      pages: [
        { id: 'farm_planning', labelBn: 'চাপ পরীক্ষা', labelEn: 'Stress Test' },
      ],
      connections: ['milp_optimizer', 'page_stress'],
      uiPos: { left: '57%', top: '62%' },
    },
    climate_trends: {
      id: 'climate_trends',
      category: 'engine_science',
      nameBn: 'জলবায়ু প্রবণতা ও অনসেট বিশ্লেষণ',
      nameEn: 'Climate Trends & Monsoon Onset',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#a3e635',
      subBn: 'Mann-Kendall · বর্ষা শুরু',
      subEn: 'Mann-Kendall · Monsoon Onset',
      roleBn: 'ম্যান-হুইটনি ইউ ও সেন-স্লোপ আবহাওয়া বিশ্লেষণ',
      roleEn: 'Mann-Whitney U, Sen slope & onset shift tests',
      resolutionBn: '২৪ বছরের দৈনিক উপাত্ত তুলনা (২০০১–২০১২ বনাম ২০১৩–২০২৪)',
      resolutionEn: '24-year daily record comparison (2001–2012 vs 2013–2024)',
      computesBn: 'আমন বৃষ্টি শুরু হওয়ার তারিখের পরিবর্তন ও দীর্ঘমেয়াদী তাপপ্রবাহের পরিসংখ্যানগত তাৎপর্য।',
      computesEn: 'Empirical monsoon rainfall onset DOY distribution shifts and heatwave day frequencies.',
      citation: 'src/compute/agro.py:228, src/climate/point_data.py:488',
      pages: [
        { id: 'weather', labelBn: 'আবহাওয়া ও ঝুঁকি', labelEn: 'Weather & Risk' },
      ],
      connections: ['milp_optimizer', 'page_climate'],
      uiPos: { left: '57%', top: '76%' },
    },

    // MIDDLE ENGINE: COLUMN 3 (Decision & Learning)
    assistant_engine: {
      id: 'assistant_engine',
      category: 'engine_decision',
      nameBn: 'AI সিদ্ধান্ত সহকারী (Gemini)',
      nameEn: 'AI Agronomist (Gemini)',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#a3e635',
      subBn: 'Gemini + পর্যবেক্ষণ ডেটা',
      subEn: 'Gemini + Observation Data',
      roleBn: 'নাসা উপাত্ত ও বৈজ্ঞানিক মডেলে পরিচালিত কৃষি বুদ্ধিমত্তা',
      roleEn: 'Agronomic AI grounded in NASA telemetry & MILP results',
      resolutionBn: 'খামারের সার্বিক প্রোফাইল ও পরিকল্পনা',
      resolutionEn: 'Farm profile & crop plan telemetry',
      computesBn: 'কৃষকের জমিতে কোন সার, কখন পানি দিতে হবে এবং পোকা দমনে কী করতে হবে।',
      computesEn: 'Context-grounded agronomic briefings, fertilizer doses, and irrigation guidelines.',
      citation: 'backend/app/main.py:2910',
      pages: [{ id: 'assistant', labelBn: 'AI সহকারী', labelEn: 'AI Assistant' }],
      connections: ['page_assistant'],
      uiPos: { left: '71%', top: '41%' },
    },
    milp_optimizer: {
      id: 'milp_optimizer',
      category: 'engine_decision',
      nameBn: 'MILP অপ্টিমাইজার (PuLP/CBC)',
      nameEn: 'MILP Crop Rotation Optimizer (PuLP / CBC)',
      badgeBn: 'প্রধান সিদ্ধান্তকারী',
      badgeEn: 'Core Decision Maker',
      status: 'used',
      color: '#a3e635',
      subBn: 'PuLP - ৬ মৌসুম - ৪ কৌশল',
      subEn: 'PuLP - 6 seasons - 4 strategies',
      roleBn: '৬ মৌসুমের সর্বোত্তম ফসল চক্র নির্ধারণ',
      roleEn: 'Mixed Integer Linear Programming 6-season rotation',
      resolutionBn: 'মৌসুম ১ থেকে ৬, ৪টি কৌশল (ভারসাম্য, লাভ, পানি, মাটি)',
      resolutionEn: 'Seasons 1 to 6, 4 strategies (balanced, profit, water, soil)',
      computesBn: 'সর্বোচ্চ লাভ, সর্বনিম্ন পানি ও সর্বোচ্চ মাটির নাইট্রোজেন বজায় রেখে বাস্তবসম্মত ফসল নির্বাচন।',
      computesEn: 'Solves optimal 6-season sequence subject to irrigation capacity, agronomic family & legume constraints.',
      citation: 'src/optimizer/milp.py:430',
      pages: [
        { id: 'farm_planning', labelBn: 'আবর্তন পরিকল্পনা', labelEn: 'Rotation Planner' },
        { id: 'water_irrigation', labelBn: 'পানি ও সেচ', labelEn: 'Water & Irrigation' },
      ],
      connections: ['page_planner', 'page_water', 'page_market'],
      uiPos: { left: '70%', top: '55%' },
    },
    adaptive_learning: {
      id: 'adaptive_learning',
      category: 'engine_decision',
      nameBn: 'মাঠ থেকে শেখা (Adaptive Feedback)',
      nameEn: 'Feedback Calibration (Adaptive Bayesian EMA)',
      badgeBn: 'ব্যবহৃত',
      badgeEn: 'Used',
      status: 'used',
      color: '#a3e635',
      subBn: 'অমল -> ফলন -> অর্থনীতি',
      subEn: 'Action -> Yield -> Economy',
      roleBn: 'কৃষকের আসল ফলন ও দাম থেকে প্রত্যাশা সমন্বয়',
      roleEn: 'In-season farmer feedback yield & profit calibration',
      resolutionBn: 'মৌসুম শেষে কৃষকের ইনপুট (মণ/বিঘা, টাকা/মণ)',
      resolutionEn: 'Post-harvest farmer input (maund/bigha, BDT/maund)',
      computesBn: 'মৌসুম শেষে দেওয়া আসল ফলন ও লাভের ভিত্তিতে বাকি মৌসুমগুলোর জন্য নতুন সেরা পরিকল্পনা তৈরি করে।',
      computesEn: 'Calibrates crop return priors with farmer recorded outcomes to re-solve future seasons.',
      citation: 'src/optimizer/adaptive_replan.py:140',
      pages: [
        { id: 'farm_planning', labelBn: 'অভিযোজিত পুনঃপরিকল্পনা', labelEn: 'Adaptive Replan' },
      ],
      connections: ['milp_optimizer', 'page_adaptive'],
      uiPos: { left: '71%', top: '71%' },
    },
    q_learning: {
      id: 'q_learning',
      category: 'engine_decision',
      nameBn: 'Q-learning (পরীক্ষামূলক)',
      nameEn: 'Synthetic Q-Learning (Experimental)',
      badgeBn: 'গবেষণা প্রোটোটাইপ',
      badgeEn: 'Research Prototype',
      status: 'experimental',
      color: '#a855f7',
      subBn: 'পরীক্ষামূলক',
      subEn: 'Experimental',
      roleBn: 'কৃত্রিম সিমুলেশন পরিবেশে রিইনফোর্সমেন্ট লার্নিং টেস্ট',
      roleEn: 'Reinforcement learning state-action transition benchmark',
      resolutionBn: '১০,০০০ এপিসোড কৃত্রিম জিম এনভায়রনমেন্ট',
      resolutionEn: '10,000 episode synthetic Gym environment',
      computesBn: 'ল্যাবে কৃত্রিম পরিবেশে পরীক্ষিত; বাস্তব কৃষকের সিদ্ধান্ত তৈরিতে এটি নয়, নিশ্চিতভাবে MILP ব্যবহৃত হয়।',
      computesEn: 'Trained strictly in synthetic environment; experimental research benchmark, NOT the production farmer advisor.',
      citation: 'src/rl/synthetic_q_learning.py:22',
      pages: [],
      connections: ['adaptive_learning'],
      uiPos: { left: '71%', top: '84%' },
    },

    // RIGHT: FARMER APPLICATION PAGES
    page_planner: {
      id: 'page_planner',
      category: 'farmer_page',
      nameBn: 'আবর্তন পরিকল্পনা',
      nameEn: 'Rotation Planner',
      badgeBn: 'পৃষ্ঠা',
      badgeEn: 'Page',
      status: 'used',
      color: '#a3e635',
      roleBn: '৬ মৌসুমের কৌশলগত ফসল পরিকল্পনা',
      roleEn: '6-season rotation planner with 3D field preview',
      resolutionBn: 'কৃষকের নিজস্ব জমির আয়তন (বিঘা/হেক্টর)',
      resolutionEn: 'Farmer parcel size (bigha / ha)',
      computesBn: 'কৌশলগত ফসল কার্ড, সেচ বাজেট, ও লাভ-ক্ষতির পূর্ণ চিত্র।',
      computesEn: 'Seasonal crop sequencing cards, yearly irrigation budget and profit.',
      citation: 'frontend/src/SixSeasonRecommendationView.jsx',
      pages: [{ id: 'farm_planning', labelBn: 'প্ল্যানার খুলুন', labelEn: 'Open Planner' }],
      connections: [],
      uiPos: { right: '3%', top: '39%' },
    },
    page_water: {
      id: 'page_water',
      category: 'farmer_page',
      nameBn: 'পানি ও সেচ',
      nameEn: 'Water & Irrigation',
      badgeBn: 'পৃষ্ঠা',
      badgeEn: 'Page',
      status: 'used',
      color: '#a3e635',
      roleBn: 'দৈনিক সেচ সূচি ও ভূগর্ভস্থ পানির অবস্থা',
      roleEn: 'Day-by-day AWD pipe threshold & pump calendar',
      resolutionBn: 'খামারের নিজস্ব মাটির গঠন ও গভীরতা',
      resolutionEn: 'Field soil texture & depth',
      computesBn: 'কবে সেচ দিতে হবে এবং বছরে মোট কত হাজার লিটার পানি লাগবে।',
      computesEn: 'Next irrigation date, seasonal AWD pipe level, and yearly liter requirements.',
      citation: 'frontend/src/WaterIrrigationView.jsx',
      pages: [{ id: 'water_irrigation', labelBn: 'পানি ও সেচ খুলুন', labelEn: 'Open Water' }],
      connections: [],
      uiPos: { right: '3%', top: '47%' },
    },
    page_climate: {
      id: 'page_climate',
      category: 'farmer_page',
      nameBn: 'আবহাওয়া ও ঝুঁকি',
      nameEn: 'Weather & Risk',
      badgeBn: 'পৃষ্ঠা',
      badgeEn: 'Page',
      status: 'used',
      color: '#a3e635',
      roleBn: 'খামারের নিজস্ব অক্ষাংশ-দ্রাঘিমাংশের আবহাওয়া ঝুঁকি',
      roleEn: 'Coordinate-specific rainfall, heatwave & GRACE trend',
      resolutionBn: '০.১° আইমার্জ গ্রিড সেল ও পয়েন্ট পাওয়ার উপাত্ত',
      resolutionEn: '0.1° IMERG grid cell & point POWER data',
      computesBn: 'গত ২৪ বছরের বৃষ্টিপাত প্যাটার্ন, তাপপ্রবাহের দিন ও ভূগর্ভস্থ পানির গতিবিধি।',
      computesEn: '24-year precipitation shift, annual heatwave days and regional water trend.',
      citation: 'frontend/src/ClimateRiskView.jsx',
      pages: [{ id: 'weather', labelBn: 'আবহাওয়া খুলুন', labelEn: 'Open Weather' }],
      connections: [],
      uiPos: { right: '3%', top: '55%' },
    },
    page_stress: {
      id: 'page_stress',
      category: 'farmer_page',
      nameBn: 'চাপ পরীক্ষা',
      nameEn: 'Stress Test',
      badgeBn: 'পৃষ্ঠা',
      badgeEn: 'Page',
      status: 'used',
      color: '#a3e635',
      roleBn: 'প্রতিকূল আবহাওয়ায় বর্তমান পরিকল্পনার ঝুঁকি',
      roleEn: 'Empirical risk test against drought, heat & salinity',
      resolutionBn: 'FAO-33 স্টেজভিত্তিক সংবেদনশীলতা',
      resolutionEn: 'FAO-33 stage-based sensitivity',
      computesBn: 'খরা বা বন্যা হলে ঠিক কত টাকা আর্থিক ক্ষতি হতে পারে তার পূর্বানুমান।',
      computesEn: 'Exact BDT financial loss simulation under adverse climate scenarios.',
      citation: 'frontend/src/ClimateStressView.jsx',
      pages: [{ id: 'farm_planning', labelBn: 'চাপ পরীক্ষা দেখুন', labelEn: 'View Stress Test' }],
      connections: [],
      uiPos: { right: '3%', top: '63%' },
    },
    page_adaptive: {
      id: 'page_adaptive',
      category: 'farmer_page',
      nameBn: 'অভিযোজিত',
      nameEn: 'Adaptive',
      badgeBn: 'পৃষ্ঠা',
      badgeEn: 'Page',
      status: 'used',
      color: '#a3e635',
      roleBn: 'বাস্তব ফলনের ভিত্তিতে পরবর্তী মৌসুমের পরিকল্পনা বদল',
      roleEn: 'In-season adjustment from recorded harvest outcomes',
      resolutionBn: 'কৃষকের রেকর্ডকৃত তথ্য',
      resolutionEn: 'Farmer recorded harvest log',
      computesBn: 'আগের মৌসুমে কম বা বেশি ফলন হলে ভবিষ্যতের ফসল আবর্তন স্বয়ংক্রিয়ভাবে ঠিক করা।',
      computesEn: 'Auto-adjusts remaining season crops when yield or market prices deviate.',
      citation: 'frontend/src/AdaptiveReplanView.jsx',
      pages: [{ id: 'farm_planning', labelBn: 'অভিযোজিত পৃষ্ঠা', labelEn: 'Open Adaptive' }],
      connections: [],
      uiPos: { right: '3%', top: '70%' },
    },
    page_market: {
      id: 'page_market',
      category: 'farmer_page',
      nameBn: 'বাজার ও লাভ',
      nameEn: 'Market & Profit',
      badgeBn: 'পৃষ্ঠা',
      badgeEn: 'Page',
      status: 'used',
      color: '#a3e635',
      roleBn: 'ফসলের দাম, খরচ, লাভ ও ব্রেক-ইভেন বিশ্লেষণ',
      roleEn: 'Farm-gate crop prices, revenue, and sensitivity analysis',
      resolutionBn: 'সরকারি কৃষি বিপণন অধিদপ্তর (DAM/TCB/BBS ২০২৪)',
      resolutionEn: 'Dept. of Agricultural Marketing (DAM / TCB / BBS 2024)',
      computesBn: 'মৌসুমভিত্তিক আয়-ব্যয় এবং কত দামের নিচে নামলে লোকসান হবে।',
      computesEn: 'Seasonal cost-benefit breakdown, break-even price thresholds and -20% sensitivity.',
      citation: 'frontend/src/MarketProfitView.jsx',
      pages: [{ id: 'harvest_profit', labelBn: 'বাজার খুলুন', labelEn: 'Open Market' }],
      connections: [],
      uiPos: { right: '3%', top: '78%' },
    },
    page_assistant: {
      id: 'page_assistant',
      category: 'farmer_page',
      nameBn: 'AI সহকারী',
      nameEn: 'AI Assistant',
      badgeBn: 'পৃষ্ঠা',
      badgeEn: 'Page',
      status: 'used',
      color: '#a3e635',
      roleBn: 'নাসা উপাত্ত ও বৈজ্ঞানিক মডেলে পরিচালিত কৃষি বুদ্ধিমত্তা',
      roleEn: 'Agronomic AI grounded in NASA telemetry & MILP results',
      resolutionBn: 'খামারের সার্বিক প্রোফাইল ও পরিকল্পনা',
      resolutionEn: 'Farm profile & crop plan telemetry',
      computesBn: 'কৃষকের জমিতে কোন সার, কখন পানি দিতে হবে এবং পোকা দমনে কী করতে হবে।',
      computesEn: 'Context-grounded agronomic briefings, fertilizer doses, and irrigation guidelines.',
      citation: 'frontend/src/AiAssistantView.jsx',
      pages: [{ id: 'assistant', labelBn: 'সহকারী খুলুন', labelEn: 'Open Assistant' }],
      connections: [],
      uiPos: { right: '3%', top: '85%' },
    },
  }), []);

  // Check WebGL availability safely
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.WebGLRenderingContext) {
        setWebGlSupported(false);
        return;
      }
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebGlSupported(false);
    } catch {
      setWebGlSupported(false);
    }

    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsReducedMotion(true);
    }
  }, []);

  // "Follow One Number" animation: Rahim's 718 mm/yr net irrigation
  // Path: GPM (rain) + POWER (radiation) -> FieldShift API -> FAO-56 PM (Water Balance) -> MILP Optimizer -> Planner
  const triggerFollowNumber = useCallback(() => {
    setIsAnimatingPath(true);
    setAnimationStep(1);

    const steps = [
      { step: 1, node: 'gpm', activeTubes: ['gpm_api', 'power_api'] },
      { step: 2, node: 'fieldshift_api', activeTubes: ['api_water'] },
      { step: 3, node: 'water_balance', activeTubes: ['water_milp'] },
      { step: 4, node: 'milp_optimizer', activeTubes: ['milp_planner'] },
      { step: 5, node: 'page_planner', activeTubes: [] },
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

  // Three.js Background Scene: 3D Earth, orbit rings, perspective floor grid & floating particle stars
  useEffect(() => {
    if (!webGlSupported || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 1000;
    const heightPx = container.clientHeight || 560;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060b13);

    const camera = new THREE.PerspectiveCamera(40, width / heightPx, 0.5, 200);
    camera.position.set(0, 4, 38);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. OrbitControls (Strictly limited: no flipping upside down)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 20;
    controls.maxDistance = 50;
    controls.minPolarAngle = Math.PI / 3;
    controls.maxPolarAngle = Math.PI / 1.95;
    controls.enablePan = false;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    dirLight.position.set(-20, 20, 20);
    scene.add(dirLight);

    // 5. 3D Earth (Positioned on the Left corresponding to Earth in Space)
    const earthGroup = new THREE.Group();
    earthGroup.position.set(-14.5, -2.5, 0);
    scene.add(earthGroup);

    // Earth Ocean Sphere
    const earthGeo = new THREE.SphereGeometry(4.2, 32, 24);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // vibrant deep blue ocean
      roughness: 0.5,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // Atmosphere Glow
    const atmGeo = new THREE.SphereGeometry(4.38, 24, 16);
    const atmMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      wireframe: true,
    });
    const atmMesh = new THREE.Mesh(atmGeo, atmMat);
    earthGroup.add(atmMesh);

    // Stylized Green Continents on Earth
    const continentMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      roughness: 0.8,
    });
    const cont1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 1), continentMat);
    cont1.position.set(2.2, 1.5, 2.5);
    earthMesh.add(cont1);
    const cont2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.9, 1), continentMat);
    cont2.position.set(-1.0, -1.8, 3.2);
    earthMesh.add(cont2);

    // Orbit Rings
    const orbitMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });
    const ring1 = new THREE.Mesh(new THREE.RingGeometry(5.8, 5.86, 64), orbitMat);
    ring1.rotation.x = Math.PI / 2.3;
    earthGroup.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.RingGeometry(7.2, 7.26, 64), orbitMat);
    ring2.rotation.x = Math.PI / 2.8;
    ring2.rotation.y = 0.3;
    earthGroup.add(ring2);

    // 6. Perspective Grid Floor in Cyan
    const gridHelper = new THREE.GridHelper(50, 25, 0x06b6d4, 0x0f2b48);
    gridHelper.position.set(4, -10.5, 0);
    gridHelper.material.opacity = 0.25;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Animation Loop
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
      earthMesh.rotation.y += 0.003;
      atmMesh.rotation.y += 0.002;

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
      controls.dispose();
      renderer.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [webGlSupported]);

  // Determine active highlights
  const activeEntityId = hoveredNodeId || selectedNode?.id;

  const isConnectedToActive = (nodeId) => {
    if (!activeEntityId) return true;
    if (activeEntityId === nodeId) return true;
    const activeConn = PIPELINE_ENTITIES[activeEntityId]?.connections || [];
    const targetConn = PIPELINE_ENTITIES[nodeId]?.connections || [];
    return activeConn.includes(nodeId) || targetConn.includes(activeEntityId);
  };

  const getTubeOpacity = (fromId, toId) => {
    if (isAnimatingPath) {
      if (animationStep === 1 && (fromId === 'gpm' || fromId === 'power_hub')) return 1;
      if (animationStep === 2 && (fromId === 'fieldshift_api' || toId === 'fieldshift_api')) return 1;
      if (animationStep === 3 && (fromId === 'water_balance' || toId === 'water_balance')) return 1;
      if (animationStep === 4 && (fromId === 'milp_optimizer' || toId === 'milp_optimizer')) return 1;
      if (animationStep === 5 && toId === 'page_planner') return 1;
      return 0.12;
    }
    if (!activeEntityId) return 0.45;
    const activeConns = PIPELINE_ENTITIES[activeEntityId]?.connections || [];
    if (
      (activeEntityId === fromId && activeConns.includes(toId)) ||
      (activeEntityId === toId) ||
      (activeConns.includes(fromId) && activeConns.includes(toId))
    ) {
      return 1;
    }
    return 0.12;
  };

  // Connected Tube Paths for SVG overlay
  const TUBE_PATHS = [
    // Space Satellites -> FieldShift API / POWER
    { id: 'gpm_api', from: 'gpm', to: 'fieldshift_api', d: 'M 190 260 C 280 260, 360 380, 470 380', color: '#a3e635' },
    { id: 'ceres_power', from: 'ceres', to: 'power_hub', d: 'M 300 320 C 320 330, 320 360, 350 370', color: '#a3e635' },
    { id: 'power_api', from: 'power_hub', to: 'fieldshift_api', d: 'M 400 375 C 430 375, 440 380, 470 380', color: '#a3e635' },
    { id: 'soilgrids_api', from: 'soilgrids', to: 'fieldshift_api', d: 'M 400 460 C 430 460, 440 400, 470 395', color: '#a3e635' },
    { id: 'prices_api', from: 'prices', to: 'fieldshift_api', d: 'M 390 530 C 430 530, 440 420, 470 410', color: '#a3e635' },
    { id: 'grace_api', from: 'grace', to: 'fieldshift_api', d: 'M 100 370 C 200 420, 350 400, 470 390', color: '#a3e635' },
    { id: 'srtm_api', from: 'srtm', to: 'fieldshift_api', d: 'M 90 480 C 180 500, 350 430, 470 405', color: '#f59e0b' },

    // FieldShift API -> Agronomic Science Tier
    { id: 'api_water', from: 'fieldshift_api', to: 'water_balance', d: 'M 540 380 C 560 380, 580 320, 610 320', color: '#a3e635' },
    { id: 'api_stress', from: 'fieldshift_api', to: 'crop_stress', d: 'M 540 395 C 570 395, 580 405, 610 405', color: '#a3e635' },
    { id: 'api_climate', from: 'fieldshift_api', to: 'climate_trends', d: 'M 540 410 C 570 410, 580 490, 610 490', color: '#a3e635' },

    // Science Tier -> Decision Tier
    { id: 'water_milp', from: 'water_balance', to: 'milp_optimizer', d: 'M 700 320 C 720 320, 720 365, 750 365', color: '#a3e635' },
    { id: 'stress_milp', from: 'crop_stress', to: 'milp_optimizer', d: 'M 700 405 C 720 405, 720 375, 750 375', color: '#a3e635' },
    { id: 'climate_milp', from: 'climate_trends', to: 'milp_optimizer', d: 'M 700 490 C 730 490, 720 395, 750 395', color: '#a3e635' },
    { id: 'adaptive_milp', from: 'adaptive_learning', to: 'milp_optimizer', d: 'M 760 455 C 760 430, 760 420, 760 410', color: '#a3e635' },

    // Decision Tier -> Farmer Applications
    { id: 'milp_planner', from: 'milp_optimizer', to: 'page_planner', d: 'M 830 360 C 870 360, 890 260, 930 260', color: '#a3e635' },
    { id: 'milp_water', from: 'milp_optimizer', to: 'page_water', d: 'M 830 370 C 870 370, 890 310, 930 310', color: '#a3e635' },
    { id: 'milp_market', from: 'milp_optimizer', to: 'page_market', d: 'M 830 395 C 870 395, 890 500, 930 500', color: '#a3e635' },
    { id: 'climate_page', from: 'climate_trends', to: 'page_climate', d: 'M 700 495 C 780 520, 860 360, 930 360', color: '#a3e635' },
    { id: 'stress_page', from: 'crop_stress', to: 'page_stress', d: 'M 700 415 C 780 430, 860 410, 930 410', color: '#a3e635' },
    { id: 'adaptive_page', from: 'adaptive_learning', to: 'page_adaptive', d: 'M 820 470 C 860 470, 890 455, 930 455', color: '#a3e635' },
    { id: 'assistant_page', from: 'assistant_engine', to: 'page_assistant', d: 'M 820 270 C 860 270, 890 550, 930 550', color: '#a3e635' },
  ];

  return (
    <div
      className="system-map-3d-wrapper"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: 640,
        backgroundColor: '#060b13',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 25px 50px -15px rgba(0, 0, 0, 0.8)',
        marginBottom: 32,
      }}
    >
      {/* 3D WebGL Background Canvas (Earth, Orbits, Grid) */}
      {webGlSupported && !isReducedMotion ? (
        <div
          ref={mountRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            pointerEvents: 'auto',
            cursor: 'grab',
          }}
        />
      ) : (
        /* Reduced motion / no-WebGL background gradient */
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            background: 'radial-gradient(circle at 18% 60%, rgba(14, 165, 233, 0.12) 0%, rgba(6, 11, 19, 0.98) 70%)',
          }}
        />
      )}

      {/* SVG Tube Overlay with Flowing Particles & Bezier Neon Connectors */}
      <svg
        viewBox="0 0 1060 640"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {TUBE_PATHS.map((tube) => {
          const opacity = getTubeOpacity(tube.from, tube.to);
          const isHigh = opacity > 0.8;
          return (
            <g key={tube.id}>
              {/* Glow backdrop path */}
              <path
                d={tube.d}
                fill="none"
                stroke={tube.color}
                strokeWidth={isHigh ? 4 : 2}
                strokeOpacity={opacity * 0.4}
                filter="url(#glow)"
              />
              {/* Sharp foreground path */}
              <path
                d={tube.d}
                fill="none"
                stroke={tube.color}
                strokeWidth={isHigh ? 2.2 : 1.2}
                strokeOpacity={opacity}
              />
              {/* Flowing animated light particle along tube */}
              {isHigh && (
                <circle r={isHigh ? 3.5 : 2.5} fill="#ffffff">
                  <animateMotion
                    path={tube.d}
                    dur={isAnimatingPath ? '1.2s' : '2.8s'}
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      {/* Interactive Glass Cards Layer positioned exactly over system nodes */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 4,
          pointerEvents: 'none',
        }}
      >
        {Object.values(PIPELINE_ENTITIES).map((entity) => {
          const isHighlighted = isConnectedToActive(entity.id);
          const isSelected = selectedNode?.id === entity.id;
          const isCoreMilp = entity.id === 'milp_optimizer';
          const isPlanned = entity.status === 'planned';
          const isExp = entity.status === 'experimental';
          const isPartial = entity.status === 'partial';

          const borderColor = isSelected
            ? '#38bdf8'
            : isExp
            ? '#a855f7'
            : isPartial
            ? '#f59e0b'
            : isPlanned
            ? '#64748b'
            : '#a3e635';

          const title = isBn ? entity.nameBn : entity.nameEn;
          const sub = isBn ? entity.subBn : entity.subEn;

          return (
            <div
              key={entity.id}
              onClick={() => setSelectedNode(entity)}
              onMouseEnter={() => setHoveredNodeId(entity.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              style={{
                position: 'absolute',
                ...entity.uiPos,
                pointerEvents: 'auto',
                cursor: 'pointer',
                background: isSelected
                  ? 'rgba(15, 23, 42, 0.98)'
                  : isCoreMilp
                  ? 'rgba(6, 78, 59, 0.35)'
                  : 'rgba(15, 23, 42, 0.88)',
                border: `${isCoreMilp ? '2px' : '1.5px'} ${isPlanned || isExp ? 'dashed' : 'solid'} ${borderColor}`,
                borderRadius: isCoreMilp ? 12 : 8,
                padding: isCoreMilp ? '10px 14px' : entity.category === 'farmer_page' ? '7px 12px' : '7px 11px',
                minWidth: entity.category === 'farmer_page' ? 128 : undefined,
                backdropFilter: 'blur(8px)',
                boxShadow: isSelected
                  ? '0 0 24px rgba(56, 189, 248, 0.5)'
                  : isCoreMilp
                  ? '0 0 25px rgba(163, 230, 53, 0.35)'
                  : isHighlighted
                  ? `0 0 12px ${borderColor}40`
                  : 'none',
                opacity: isHighlighted ? 1 : 0.35,
                transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                transition: 'all 0.22s ease-out',
                userSelect: 'none',
              }}
            >
              <div
                style={{
                  fontSize: isCoreMilp ? 13.5 : 12,
                  fontWeight: 800,
                  color: isPlanned ? '#94a3b8' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {entity.category === 'farmer_page' && (
                  <span style={{ fontSize: 10, color: '#a3e635' }}>☰</span>
                )}
                <span>{title}</span>
              </div>
              {sub && (
                <div
                  style={{
                    fontSize: 10,
                    color: isPlanned ? '#64748b' : '#94a3b8',
                    marginTop: 2,
                    fontWeight: 500,
                  }}
                >
                  {sub}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Top Header & Interactive Action Controls */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 20,
          right: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 3px 0',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)',
            }}
          >
            {isBn ? 'FieldShift কীভাবে কাজ করে' : 'How FieldShift Works'}
          </h2>
          <p
            style={{
              fontSize: 12.5,
              color: '#94a3b8',
              margin: 0,
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            {isBn
              ? 'মহাকাশ থেকে মাঠ পর্যন্ত — কোনো স্যাটেলাইট বা বাক্সে মাউস রাখুন বা click করুন'
              : 'From Space to Field — Hover or click any satellite or node'}
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 12, pointerEvents: 'auto' }}>
            {/* Follow One Number Button */}
            <button
              type="button"
              onClick={triggerFollowNumber}
              style={{
                background: '#a3e635',
                color: '#052e16',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 0 20px rgba(163, 230, 53, 0.4)',
                transition: 'all 0.2s',
              }}
            >
              <span>▶</span>
              <span>
                {isAnimatingPath
                  ? (isBn ? `ধাপ ${animationStep}/৫: উপাত্ত প্রবাহ সক্রিয়...` : `Step ${animationStep}/5: Tracing...`)
                  : (isBn ? 'একটা সংখ্যা অনুসরণ করুন: ৭১৮ মিমি' : 'Follow One Number: 718 mm')}
              </span>
            </button>

            {/* Show All Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedNode(null);
                setHoveredNodeId(null);
                setIsAnimatingPath(false);
              }}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '8px 14px',
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(6px)',
              }}
            >
              {isBn ? 'সব দেখান' : 'Show All'}
            </button>
          </div>
        </div>

        {/* Diagnostic Pill */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 8,
            padding: '5px 10px',
            fontSize: 11,
            fontFamily: 'monospace',
            color: fps >= 45 ? '#a3e635' : '#f59e0b',
            pointerEvents: 'auto',
          }}
        >
          {fps} FPS | {drawCalls} calls
        </div>
      </div>

      {/* Bottom Status Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 34,
          left: 20,
          display: 'flex',
          gap: 16,
          fontSize: 11.5,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#a3e635' }} />
          <span>{isBn ? 'ব্যবহৃত' : 'Used'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b' }} />
          <span>{isBn ? 'আংশিক / নির্মাণাধীন' : 'Partial / In Progress'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#a855f7' }} />
          <span>{isBn ? 'পরীক্ষামূলক' : 'Experimental'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#64748b' }} />
          <span>{isBn ? 'পরিকল্পিত' : 'Planned'}</span>
        </div>
      </div>

      {/* Bottom Column Labels */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 20,
          right: 20,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          letterSpacing: '0.08em',
          color: '#64748b',
          fontWeight: 800,
          textTransform: 'uppercase',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <span style={{ width: '30%' }}>SPACE · NASA</span>
        <span style={{ width: '40%', textAlign: 'center' }}>ENGINE · SCIENCE · DECISION</span>
        <span style={{ width: '25%', textAlign: 'right' }}>FARMER · APP</span>
      </div>

      {/* Glass Side Drawer: Provenance & Verified Details on Click */}
      {selectedNode && (
        <div
          className="system-node-glass-panel"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            bottom: 14,
            width: 380,
            maxWidth: '92%',
            background: 'rgba(15, 23, 42, 0.96)',
            border: `1.5px solid ${selectedNode.color || 'rgba(56, 189, 248, 0.4)'}`,
            borderRadius: 14,
            padding: 20,
            zIndex: 30,
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.85)',
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
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background:
                    selectedNode.status === 'used'
                      ? 'rgba(163, 230, 53, 0.2)'
                      : selectedNode.status === 'partial'
                      ? 'rgba(245, 158, 11, 0.2)'
                      : selectedNode.status === 'experimental'
                      ? 'rgba(168, 85, 247, 0.2)'
                      : 'rgba(100, 116, 139, 0.2)',
                  color:
                    selectedNode.status === 'used'
                      ? '#a3e635'
                      : selectedNode.status === 'partial'
                      ? '#fbbf24'
                      : selectedNode.status === 'experimental'
                      ? '#c084fc'
                      : '#94a3b8',
                  border: `1px solid ${selectedNode.color}40`,
                }}
              >
                {isBn ? selectedNode.badgeBn : selectedNode.badgeEn}
              </span>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', margin: '8px 0 2px' }}>
                {isBn ? selectedNode.nameBn : selectedNode.nameEn}
              </h3>
              <div style={{ fontSize: 12, color: selectedNode.color, fontWeight: 600 }}>
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
                width: 28,
                height: 28,
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

          <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.1)', margin: '8px 0 14px' }} />

          {/* Details Body */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12.5, lineHeight: 1.5, flex: 1 }}>
            {/* Resolution & Period */}
            <div>
              <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
                {isBn ? 'রেজোলিউশন ও সময়কাল' : 'Resolution & Period'}
              </div>
              <div style={{ color: '#e2e8f0', marginTop: 2 }}>
                {isBn ? selectedNode.resolutionBn : selectedNode.resolutionEn}
              </div>
            </div>

            {/* Computes */}
            <div>
              <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
                {isBn ? 'ফিল্ডশিফট কী হিসাব করে' : 'What FieldShift Computes'}
              </div>
              <div style={{ color: '#cbd5e1', marginTop: 2 }}>
                {isBn ? selectedNode.computesBn : selectedNode.computesEn}
              </div>
            </div>

            {/* Citation file:line */}
            <div>
              <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
                {isBn ? 'কোড ও ডেটা রেফারেন্স (File:Line)' : 'Source Citation (File:Line)'}
              </div>
              <code
                style={{
                  display: 'block',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: '#38bdf8',
                  marginTop: 4,
                  wordBreak: 'break-all',
                }}
              >
                {selectedNode.citation}
              </code>
            </div>

            {/* Consumer Pages */}
            {selectedNode.pages && selectedNode.pages.length > 0 && (
              <div>
                <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
                  {isBn ? 'ব্যবহারকারী পৃষ্ঠা' : 'Consumer Pages'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedNode.pages.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onNavigate && onNavigate(p.id)}
                      style={{
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        borderRadius: 6,
                        color: '#38bdf8',
                        padding: '4px 10px',
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span>➔</span>
                      <span>{isBn ? p.labelBn : p.labelEn}</span>
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
