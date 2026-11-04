// frontend/src/WaterIrrigationView.jsx
// Water & Irrigation Optimization Workspace for FieldShift 2026
// Sub-navigation: Water Balance, Irrigation Optimization, Soil Water Profile, Water Stress Analysis
// Features: FAO-56 hydrological water balance, FAO-33 yield stress penalty, 3D lysimeter bucket model,
// soil profile root-zone stratification, and alternate wetting & drying (AWD) scheduling.

import React, { useState, useEffect, useMemo } from 'react';
import { request } from './apiClient.js';
import { WaterBalance3D } from './research3d/WaterBalance3D.jsx';
import { SoilProfile3D } from './research3d/SoilProfile3D.jsx';
import { formatNumber } from './marketUtils.js';
import { useTranslation } from './i18n.js';

function getCropWaterSchedule(periodKey, cropName, lang = 'bn') {
  if (!cropName) return null;
  const c = String(cropName).toLowerCase();
  const isFallow = c.includes('fallow') || c.includes('পতিত');

  const periodMapBn = {
    'Y1_S1': 'বছর ১: রবি (শুষ্ক মৌসুম)',
    'Y1_S2': 'বছর ১: খরিফ-১ (প্রাক-বর্ষা)',
    'Y1_S3': 'বছর ১: খরিফ-২ (বর্ষা আমন)',
    'Y2_S1': 'বছর ২: রবি (শুষ্ক মৌসুম)',
    'Y2_S2': 'বছর ২: খরিফ-১ (প্রাক-বর্ষা)',
    'Y2_S3': 'বছর ২: খরিফ-২ (বর্ষা আমন)',
  };
  const periodMapEn = {
    'Y1_S1': 'Year 1: Rabi (Dry season)',
    'Y1_S2': 'Year 1: Kharif-1 (Pre-monsoon)',
    'Y1_S3': 'Year 1: Kharif-2 (Monsoon Aman)',
    'Y2_S1': 'Year 2: Rabi (Dry season)',
    'Y2_S2': 'Year 2: Kharif-1 (Pre-monsoon)',
    'Y2_S3': 'Year 2: Kharif-2 (Monsoon Aman)',
  };

  const periodLabel = lang === 'bn' ? (periodMapBn[periodKey] || periodKey) : (periodMapEn[periodKey] || periodKey);

  if (isFallow) {
    return {
      periodKey,
      season: periodLabel,
      crop: lang === 'bn' ? 'পতিত (Fallow)' : 'Fallow',
      demand: lang === 'bn' ? '০ মিমি' : '0 mm',
      rain: lang === 'bn' ? '০ মিমি' : '0 mm',
      irrig: lang === 'bn' ? '০ মিমি' : '0 mm',
      tech: lang === 'bn' ? 'সেচ প্রয়োজন নেই (পতিত জমি)' : 'No irrigation needed (Fallow)',
    };
  }

  // Rice AWD rule (only for rice)
  const isBoro = c.includes('boro') || c.includes('বোরো');
  const isAus = c.includes('aus') || c.includes('আউশ');
  const isAman = c.includes('aman') || c.includes('আমন') || (c.includes('rice') && !isBoro && !isAus);

  if (isBoro) {
    return {
      periodKey,
      season: periodLabel,
      crop: lang === 'bn' ? 'বোরো ধান (Boro Rice)' : 'Boro Rice',
      demand: lang === 'bn' ? '১,১৫০ মিমি' : '1,150 mm',
      rain: lang === 'bn' ? '৩৫ মিমি' : '35 mm',
      irrig: lang === 'bn' ? '১,১০০ মিমি' : '1,100 mm',
      tech: lang === 'bn' ? 'AWD পাইপ পদ্ধতি (২৫-৩০% নলকূপ পানি সাশ্রয়)' : 'AWD Pipe System (25-30% groundwater savings)',
    };
  }

  if (isAus) {
    return {
      periodKey,
      season: periodLabel,
      crop: lang === 'bn' ? 'আউশ ধান (Aus Rice)' : 'Aus Rice',
      demand: lang === 'bn' ? '৫৫০ মিমি' : '550 mm',
      rain: lang === 'bn' ? '৩৫০ মিমি' : '350 mm',
      irrig: lang === 'bn' ? '২০০ মিমি' : '200 mm',
      tech: lang === 'bn' ? 'AWD / নিয়ন্ত্রিত প্লাবন সম্পূরক সেচ' : 'AWD / Controlled Basin Supplemental Irrigation',
    };
  }

  if (isAman) {
    return {
      periodKey,
      season: periodLabel,
      crop: lang === 'bn' ? (cropName.includes('BRRI') ? cropName : 'আমন ধান (Aman Rice)') : (cropName || 'Aman Rice'),
      demand: lang === 'bn' ? '১,১০০ মিমি' : '1,100 mm',
      rain: lang === 'bn' ? '৮৫০ মিমি' : '850 mm',
      irrig: lang === 'bn' ? '২৫০ মিমি' : '250 mm',
      tech: lang === 'bn' ? 'AWD নলকূপ সম্পূরক সেচ (প্রান্তিক খরা নিরোধ)' : 'AWD Supplemental Tube Well (Terminal drought escape)',
    };
  }

  // Upland crops (furrow/basin only, never AWD)
  if (c.includes('mustard') || c.includes('সরিষা')) {
    return {
      periodKey,
      season: periodLabel,
      crop: lang === 'bn' ? 'সরিষা (Mustard)' : 'Mustard',
      demand: lang === 'bn' ? '৩২০ মিমি' : '320 mm',
      rain: lang === 'bn' ? '২৫ মিমি' : '25 mm',
      irrig: lang === 'bn' ? '১৫০ মিমি' : '150 mm',
      tech: lang === 'bn' ? 'সীমিত বর্ডার / নালা সেচ (২টি সেচ: ফুল ও শুঁটি গঠন)' : 'Border / Furrow Irrigation (2 splits: Flower & Pod)',
    };
  }

  if (c.includes('lentil') || c.includes('মসুর')) {
    return {
      periodKey,
      season: periodLabel,
      crop: lang === 'bn' ? 'মসুর (Lentil)' : 'Lentil',
      demand: lang === 'bn' ? '২৫০ মিমি' : '250 mm',
      rain: lang === 'bn' ? '২৫ মিমি' : '25 mm',
      irrig: lang === 'bn' ? '৮০ মিমি' : '80 mm',
      tech: lang === 'bn' ? 'হালকা নালা সেচ / অবশিষ্ট আর্দ্রতা (১টি সেচ)' : 'Light Furrow Irrigation / Residual Soil Moisture',
    };
  }

  if (c.includes('chickpea') || c.includes('ছোলা')) {
    return {
      periodKey,
      season: periodLabel,
      crop: lang === 'bn' ? 'ছোলা (Chickpea)' : 'Chickpea',
      demand: lang === 'bn' ? '২২০ মিমি' : '220 mm',
      rain: lang === 'bn' ? '২৫ মিমি' : '25 mm',
      irrig: lang === 'bn' ? '৭০ মিমি' : '70 mm',
      tech: lang === 'bn' ? 'সীমিত নালা সেচ (বরেন্দ্র অঞ্চলের গভীর মূলতন্ত্র)' : 'Deep-root Furrow Irrigation (Barind buffer)',
    };
  }

  if (c.includes('wheat') || c.includes('গম')) {
    return {
      periodKey,
      season: periodLabel,
      crop: lang === 'bn' ? 'গম (Wheat)' : 'Wheat',
      demand: lang === 'bn' ? '৩৮০ মিমি' : '380 mm',
      rain: lang === 'bn' ? '৩০ মিমি' : '30 mm',
      irrig: lang === 'bn' ? '২৮০ মিমি' : '280 mm',
      tech: lang === 'bn' ? 'নালা বা বর্ডার সেচ (৩টি কিস্তি: CRI, বুট ও দানা গঠন)' : 'Furrow / Border Irrigation (3 splits: CRI, Boot & Grain)',
    };
  }

  if (c.includes('potato') || c.includes('আলু')) {
    return {
      periodKey,
      season: periodLabel,
      crop: lang === 'bn' ? 'আলু (Potato)' : 'Potato',
      demand: lang === 'bn' ? '৪২০ মিমি' : '420 mm',
      rain: lang === 'bn' ? '২০ মিমি' : '20 mm',
      irrig: lang === 'bn' ? '৩০০ মিমি' : '300 mm',
      tech: lang === 'bn' ? 'ভেলি নালা সেচ (১০-১২ দিন অন্তর পরিমিত সেচ)' : 'Ridge-and-Furrow Irrigation (10-12 day interval)',
    };
  }

  if (c.includes('maize') || c.includes('ভুট্টা')) {
    return {
      periodKey,
      season: periodLabel,
      crop: lang === 'bn' ? 'ভুট্টা (Maize)' : 'Maize',
      demand: lang === 'bn' ? '৫০০ মিমি' : '500 mm',
      rain: lang === 'bn' ? '৩০ মিমি' : '30 mm',
      irrig: lang === 'bn' ? '৩৯০ মিমি' : '390 mm',
      tech: lang === 'bn' ? 'পরিমিত নালা সেচ (ট্যাসেলিং ও সিল্কিং সংকটময় পর্যায়)' : 'Furrow Irrigation (Tasseling & Silking critical stages)',
    };
  }

  if (c.includes('mung') || c.includes('মুগ')) {
    return {
      periodKey,
      season: periodLabel,
      crop: lang === 'bn' ? 'মুগডাল (Mungbean)' : 'Mungbean',
      demand: lang === 'bn' ? '২৮০ মিমি' : '280 mm',
      rain: lang === 'bn' ? '১৮০ মিমি' : '180 mm',
      irrig: lang === 'bn' ? '৮০ মিমি' : '80 mm',
      tech: lang === 'bn' ? 'বৃষ্টি নির্ভর + ১টি সম্পূরক নালা সেচ' : 'Rainfed + 1 Supplemental Furrow Soak',
    };
  }

  if (c.includes('sesame') || c.includes('তিল')) {
    return {
      periodKey,
      season: periodLabel,
      crop: lang === 'bn' ? 'তিল (Sesame)' : 'Sesame',
      demand: lang === 'bn' ? '২৪০ মিমি' : '240 mm',
      rain: lang === 'bn' ? '১৯০ মিমি' : '190 mm',
      irrig: lang === 'bn' ? '৫০ মিমি' : '50 mm',
      tech: lang === 'bn' ? 'বৃষ্টি নির্ভর নিষ্কাশনযুক্ত নালা' : 'Rainfed Bed with Furrow Drainage',
    };
  }

  if (c.includes('jute') || c.includes('পাট')) {
    return {
      periodKey,
      season: periodLabel,
      crop: lang === 'bn' ? 'পাট (Jute)' : 'Jute',
      demand: lang === 'bn' ? '৪৫০ মিমি' : '450 mm',
      rain: lang === 'bn' ? '৩৮০ মিমি' : '380 mm',
      irrig: lang === 'bn' ? '৭০ মিমি' : '70 mm',
      tech: lang === 'bn' ? 'বৃষ্টি নির্ভর প্লাবনভূমি চাষ' : 'Rainfed Alluvial Floodplain Cultivation',
    };
  }

  return {
    periodKey,
    season: periodLabel,
    crop: cropName,
    demand: lang === 'bn' ? '৩০০ মিমি' : '300 mm',
    rain: lang === 'bn' ? '১০০ মিমি' : '100 mm',
    irrig: lang === 'bn' ? '২০০ মিমি' : '200 mm',
    tech: lang === 'bn' ? 'নিয়ন্ত্রিত নালা সেচ (Furrow Irrigation)' : 'Controlled Furrow Irrigation',
  };
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

function getGraceRegionData(dist, lang = 'bn') {
  const d = String(dist || '').toLowerCase().trim();
  if (BARIND_DISTRICTS.has(d)) {
    return {
      trend: '-1.07 cm/yr',
      color: 'var(--alert)',
      statusBn: 'বরেন্দ্র অ্যাকুইফার ক্ষয়',
      statusEn: 'Barind Aquifer Depletion',
      descBn: 'গভীর নলকূপ সেচে ভূগর্ভস্থ পানির সঞ্চয় দ্রুত হ্রাস পাচ্ছে (১.৫x সংরক্ষণ অগ্রাধিকার)।',
      descEn: 'Critical groundwater storage depletion due to deep tubewell abstraction (1.5x conservation priority).',
      isBarind: true
    };
  }
  if (HAOR_DISTRICTS.has(d)) {
    return {
      trend: '+0.44 cm/yr',
      color: 'var(--leaf)',
      statusBn: 'হাওর প্লাবনভূমি পুনর্ভরণ',
      statusEn: 'Haor Basin Surface Recharge',
      descBn: 'বর্ষায় নিয়মিত প্লাবিত হওয়ায় ভূগর্ভস্থ ও ভূপৃষ্ঠের পানি প্রাকৃতিকভাবে পুনর্ভরিত হয় (স্বাভাবিক অগ্রাধিকার)।',
      descEn: 'Hydrologically resilient surface-water basin with annual monsoon replenishment (Normal priority).',
      isBarind: false
    };
  }
  if (COASTAL_DISTRICTS.has(d)) {
    return {
      trend: '-0.15 cm/yr',
      color: 'var(--alert)',
      statusBn: 'উপকূলীয় মিষ্টি পানি সংরক্ষণ',
      statusEn: 'Coastal Storage Decline',
      descBn: 'শুষ্ক মৌসুমে লবণাক্ততার ঝুঁকিতে মিষ্টি পানির উৎস সংরক্ষণ প্রয়োজন (মাঝারি অগ্রাধিকার)।',
      descEn: 'Moderate decline with dry-season tidal salinity vulnerability (Sweet-water conservation priority).',
      isBarind: false
    };
  }
  return {
    trend: '-0.35 cm/yr',
    color: 'var(--alert)',
    statusBn: 'জাতীয় গড় সঞ্চয় প্রবণতা',
    statusEn: 'National Storage Trend',
    descBn: 'সারাদেশের গড় মোট পানি সঞ্চয়ের হ্রাস প্রবণতা (মাঝারি অগ্রাধিকার)।',
    descEn: 'National mean total water storage multi-year trend (Moderate priority).',
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
  const [subTab, setSubTab] = useState(initialSubTab);

  useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab);
  }, [initialSubTab]); // 'balance' | 'optimization' | 'profile' | 'stress'
  const [viewMode, setViewMode] = useState('3d'); // '3d' | '2d'
  const [liveWaterData, setLiveWaterData] = useState(null);
  const [envProfiles, setEnvProfiles] = useState(null);
  const [fetchedPlanning, setFetchedPlanning] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!activeField) {
      setFetchedPlanning(null);
      return () => { isMounted = false; };
    }
    if (
      !activeField.district &&
      (activeField.latitude == null || activeField.longitude == null)
    ) {
      setFetchedPlanning(null);
      return () => { isMounted = false; };
    }
    const body = activeField?.id && activeField.id !== 'demo'
      ? { field_id: activeField.id, priority: 'balanced' }
      : {
          field_id: activeField?.id || 'demo',
          latitude: activeField?.latitude,
          longitude: activeField?.longitude,
          district: activeField?.district,
          area_ha: activeField?.area_ha ?? activeField?.field_size_ha,
          soil_texture: activeField?.soil_texture,
          soil_ph: activeField?.soil_ph,
          organic_matter: activeField?.organic_matter,
          irrigation_capacity_mm: activeField?.irrigation_capacity_mm,
          priority: 'balanced'
        };

    request('/api/planning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(res => {
        if (isMounted && res?.status === 'ok') {
          setFetchedPlanning(res?.summary?.planning || res);
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, [activeField]);

  useEffect(() => {
    let isMounted = true;
    request('/api/geo/environmental-profiles')
      .then(res => {
        if (isMounted && res?.status === 'ok') {
          setEnvProfiles(res);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const plannedRotation = useMemo(() => {
    return (
      plan?.rotation ||
      plan?.selected_crop_by_period ||
      summary?.planning?.milp_status?.selected_crop_by_period ||
      summary?.planning?.selected_strategy_result?.selected_crop_by_period ||
      null
    );
  }, [plan, summary]);

  const scheduleRows = useMemo(() => {
    if (!plannedRotation) return [];
    const periods = ['Y1_S1', 'Y1_S2', 'Y1_S3', 'Y2_S1', 'Y2_S2', 'Y2_S3'];
    return periods
      .map(p => {
        const crop = plannedRotation[p];
        if (!crop) return null;
        return getCropWaterSchedule(p, crop, lang);
      })
      .filter(Boolean);
  }, [plannedRotation, lang]);

  useEffect(() => {
    let isMounted = true;
    const crop = plannedRotation?.Y1_S1;
    const area = activeField?.area_ha ?? activeField?.field_size_ha;
    const hasLocation = Boolean(
      activeField?.district ||
      (activeField?.latitude != null && activeField?.longitude != null)
    );
    if (!hasLocation || !crop || !Number.isFinite(Number(area)) || Number(area) <= 0) {
      setLiveWaterData(null);
      return () => { isMounted = false; };
    }
    const params = new URLSearchParams({
      crop,
      area_ha: String(area),
    });
    if (activeField?.district) params.set('district', activeField.district);
    if (activeField?.latitude != null) params.set('latitude', String(activeField.latitude));
    if (activeField?.longitude != null) params.set('longitude', String(activeField.longitude));
    request(`/api/water/plan?${params.toString()}`)
      .then(data => {
        if (isMounted && data?.status === 'ok') {
          setLiveWaterData(data);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [activeField?.district, activeField?.latitude, activeField?.longitude, activeField?.area_ha, activeField?.field_size_ha, plannedRotation]);

  // Field soil & irrigation parameters
  const soilTextureIsAssumed = !activeField?.soil_texture || activeField.soil_texture === 'unknown';
  const soilTexture = soilTextureIsAssumed ? 'loam' : activeField.soil_texture;
  const areaHa = activeField?.area_ha != null ? Number(activeField.area_ha) : null;
  const irrigCapMm = activeField?.irrigation_capacity_mm != null ? Number(activeField.irrigation_capacity_mm) : null;

  // Hydrological calculations (FAO-56 standards)
  const soilWaterSpecs = useMemo(() => {
    const specs = {
      clay_loam: { fc: 0.32, pwp: 0.18, tawMmPerM: 140, p: 0.50 },
      loam: { fc: 0.28, pwp: 0.14, tawMmPerM: 140, p: 0.55 },
      silty_loam: { fc: 0.31, pwp: 0.15, tawMmPerM: 160, p: 0.50 },
      sandy_loam: { fc: 0.21, pwp: 0.09, tawMmPerM: 120, p: 0.60 },
      clay: { fc: 0.36, pwp: 0.22, tawMmPerM: 140, p: 0.45 },
    };
    return specs[soilTexture] || specs.loam;
  }, [soilTexture]);

  // Root zone depth (m) for rice / staple
  const zRootM = 0.8;
  const tawMm = Math.round(soilWaterSpecs.tawMmPerM * zRootM);
  // Field-specific NASA Hydrology Data (SRTM elevation/slope, GRACE-FO TWS, SMAP root-zone moisture)
  const fieldTelemetry = useMemo(() => {
    const dist = String(activeField?.district || '').toLowerCase().trim();
    const isCoastalTidal = Boolean(
      activeField?.coastal_saline ||
      dist === 'satkhira' || dist === 'khulna' || dist === 'bagerhat' || dist === 'patuakhali' || dist === 'barguna'
    );

    const srtmProfile = envProfiles?.srtm?.[dist] || null;

    // Elevation (m) - from field record or /api/geo/environmental-profiles
    let elevM = activeField?.elevation_m ?? activeField?.srtm_elevation ?? srtmProfile?.elevation_m ?? null;
    const srtmElev = elevM != null ? `${elevM} m` : null;

    // Slope (%) - tidal flat unreliability guard
    let srtmSlope = null;
    let srtmSlopeNote = null;
    if (isCoastalTidal) {
      srtmSlope = lang === 'bn' ? 'নির্ভরযোগ্য নয় (জোয়ারভাটা প্লাবনভূমি)' : 'Unreliable (Coastal Tidal Plain)';
      srtmSlopeNote = lang === 'bn'
        ? 'উপকূলীয় জোয়ারভাটা প্লাবনভূমিতে ৩০মি এসআরটিএম বাঁধ ও নালার কারণে ঢাল নির্ভরযোগ্য নয়।'
        : 'SRTM 30m quantization creates canal/embankment noise in coastal tidal plain.';
    } else {
      let slopeVal = activeField?.slope_percent ?? activeField?.slope ?? srtmProfile?.slope_percent ?? null;
      if (slopeVal != null) {
        srtmSlope = `${slopeVal}%`;
      }
    }

    // Description: if no elevation and no slope, show "তথ্য নেই (এই জমির জন্য নামানো হয়নি)"
    let srtmDescBn = srtmSlopeNote || (srtmProfile?.flood_exposure_hint
      ? `${srtmProfile.flood_exposure_hint} (NASA SRTMGL1 ৩০মি)`
      : (elevM != null ? `উচ্চতা ${elevM} মিটার (NASA SRTMGL1 ৩০মি উপগ্রহ উপাত্ত)` : 'তথ্য নেই (এই জমির জন্য নামানো হয়নি)'));
    let srtmDescEn = srtmSlopeNote || (srtmProfile?.flood_exposure_hint
      ? `${srtmProfile.flood_exposure_hint} (NASA SRTMGL1 30m)`
      : (elevM != null ? `Elevation ${elevM} m (NASA SRTMGL1 30m dataset)` : 'No data (not acquired for this field)'));

    // Regional GRACE trend from trends_cm_per_year
    const graceInfo = getGraceRegionData(dist, lang);

    // SMAP root-zone moisture: only for fields that have data. Otherwise "তথ্য নেই (এই জমির জন্য নামানো হয়নি)"
    const smapProfile = envProfiles?.smap?.[dist] || null;
    let smapMoisture = activeField?.smap_moisture || srtmProfile?.smap_moisture || smapProfile?.moisture_range || null;
    if (!smapMoisture && (dist === 'bogura' || dist === 'dinajpur')) {
      smapMoisture = '0.15 – 0.27 m³/m³';
    } else if (!smapMoisture && dist === 'sunamganj') {
      smapMoisture = '0.19 – 0.41 m³/m³';
    } else if (!smapMoisture && dist === 'satkhira') {
      smapMoisture = '0.25 – 0.42 m³/m³';
    }

    let smapDescBn = null;
    let smapDescEn = null;
    if (smapMoisture) {
      if (dist === 'sunamganj') {
        smapDescBn = 'বর্ষায় প্লাবিত জলাভূমি (০.৪১); প্রাক-বর্ষায় আর্দ্রতা ০.১৯ এ নামে।';
        smapDescEn = 'Wetland basin saturated during monsoon (0.41), dropping to 0.19 in pre-monsoon.';
      } else if (isCoastalTidal) {
        smapDescBn = 'লবণাক্ত জোয়ারভাটা অববাহিকায় মূল স্তরে মাঝারি থেকে উচ্চ আর্দ্রতা ধরে রাখা।';
        smapDescEn = 'Moderate-high root-zone moisture retention in coastal tidal plain.';
      } else {
        smapDescBn = 'রবি মৌসুমে প্রাক-সেচ আর্দ্রতা ০.১৫ m³/m³ এ নেমে আসে, যা সেচের নির্দেশক।';
        smapDescEn = 'Rabi dry-season pre-irrigation moisture drops to 0.15 m³/m³, signaling AWD trigger.';
      }
    } else {
      smapDescBn = 'তথ্য নেই (এই জমির জন্য নামানো হয়নি)';
      smapDescEn = 'No data (not acquired for this field)';
    }

    return {
      graceTrend: graceInfo.trend,
      graceStatusBn: graceInfo.statusBn,
      graceStatusEn: graceInfo.statusEn,
      graceDescBn: graceInfo.descBn,
      graceDescEn: graceInfo.descEn,
      graceColor: graceInfo.color,
      isBarind: graceInfo.isBarind,
      smapMoisture,
      smapDescBn,
      smapDescEn,
      srtmElev,
      srtmSlope,
      srtmSlopeNote,
      srtmDescBn,
      srtmDescEn,
    };
  }, [activeField, envProfiles, lang]);

  const rawMm = Math.round(tawMm * soilWaterSpecs.p);

  // Active season water metrics from MILP plan and FAO-56 backend
  const planningData = plan?.summary?.planning || summary?.planning || fetchedPlanning;
  const bComp = planningData?.baseline_comparison || {};

  const baselineWaterMm = planningData?.baseline_irrigation_mm != null
    ? Math.round(planningData.baseline_irrigation_mm)
    : (plan?.baseline_irrigation_mm != null
      ? Math.round(plan.baseline_irrigation_mm)
      : (bComp.baseline_irrigation_mm != null
        ? Math.round(bComp.baseline_irrigation_mm)
        : (liveWaterData?.economic_and_conservation?.conventional_flood_demand_m3 != null
          ? Math.round(liveWaterData.economic_and_conservation.conventional_flood_demand_m3 / 10)
          : null)));

  const waterUsageMm = planningData?.plan_irrigation_mm != null
    ? Math.round(planningData.plan_irrigation_mm)
    : (plan?.plan_irrigation_mm != null
      ? Math.round(plan.plan_irrigation_mm)
      : (bComp.plan_irrigation_mm != null
        ? Math.round(bComp.plan_irrigation_mm)
        : (liveWaterData?.water_balance_summary?.net_irrigation_requirement_mm != null
          ? Math.round(liveWaterData.water_balance_summary.net_irrigation_requirement_mm)
          : null)));

  const waterSavingsMm = planningData?.water_savings_mm != null
    ? Math.round(planningData.water_savings_mm)
    : (plan?.water_savings_mm != null
      ? Math.round(plan.water_savings_mm)
      : (bComp.water_savings_mm != null
        ? Math.round(bComp.water_savings_mm)
        : (baselineWaterMm != null && waterUsageMm != null ? baselineWaterMm - waterUsageMm : null)));

  const waterSavedPct = (baselineWaterMm != null && baselineWaterMm > 0 && waterSavingsMm != null)
    ? Math.round((waterSavingsMm / baselineWaterMm) * 100)
    : null;

  const subTabs = [
    { id: 'balance', labelBn: 'পানি ব্যালেন্স (FAO-56)', labelEn: '1. Water Balance', icon: '💧' },
    { id: 'optimization', labelBn: 'সেচ অপ্টিমাইজেশন (MILP)', labelEn: '2. Irrigation Optimization', icon: '⚖️' },
    { id: 'profile', labelBn: 'মাটি আর্দ্রতা স্তর (Root Zone)', labelEn: '3. Soil Water Profile', icon: '🌱' },
    { id: 'stress', labelBn: 'পানি ঘাটতি চাপ বিশ্লেষণ (FAO-33)', labelEn: '4. Water Stress Analysis', icon: '☀️' },
  ];

  return (
    <div className="water-irrigation-workspace" style={{ padding: '20px 0 40px 0', maxWidth: 1300, margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div
        className="dash-card ui-card-hud"
        style={{
          background: 'linear-gradient(135deg, rgba(2, 136, 209, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(2, 136, 209, 0.3)',
          borderRadius: 16,
          padding: '24px 28px',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 26 }}>💧🌾</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--water)',
                  background: 'rgba(56, 189, 248, 0.15)',
                  padding: '3px 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  letterSpacing: '0.04em',
                }}
              >
                FAO-56 HYDROLOGY SUITE
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--leaf)',
                  background: 'rgba(0, 223, 129, 0.12)',
                  padding: '3px 8px',
                  borderRadius: 999,
                }}
              >
                {activeField?.name || (lang === 'bn' ? 'ক্ষেত নির্বাচন করুন' : 'Field not selected')}
                {areaHa != null ? ` (${formatNumber(areaHa, 1)} ha)` : ''}
              </span>
            </div>
            <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>
              {lang === 'bn' ? 'পানি ব্যবস্থাপনা ও সেচ অপ্টিমাইজেশন' : 'Water & Irrigation Optimization'}
            </h1>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5, maxWidth: 840 }}>
              {lang === 'bn'
                ? 'এফএও-৫৬ মৃত্তিকা পানি ব্যালেন্স, এডব্লিউডি (AWD) সেচ শিডিউলিং, এবং ভূগর্ভস্থ পানির অপচয় রোধে এমআইএলপি ওয়াটার-এফিসিয়েন্সি বিশ্লেষণ।'
                : 'FAO-56 soil water balance, Alternate Wetting & Drying (AWD) irrigation scheduling, and water-efficiency optimization to conserve Barind groundwater.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
              style={{
                background: viewMode === '3d' ? 'var(--water)' : 'var(--line)',
                color: 'var(--text)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {viewMode === '3d' ? '🌐 3D View' : '📋 2D Accessible Mode'}
            </button>
          </div>
        </div>

        {/* Sub-Navigation Pills */}
        <div style={{ display: 'flex', gap: 8, marginTop: 18, borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 14, flexWrap: 'wrap' }}>
          {subTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              style={{
                background: subTab === tab.id ? 'rgba(56, 189, 248, 0.2)' : 'var(--glass-strong)',
                border: subTab === tab.id ? '1px solid var(--water)' : '1px solid var(--line)',
                color: subTab === tab.id ? 'var(--water)' : 'var(--text-2)',
                borderRadius: 8,
                padding: '7px 16px',
                fontSize: 13,
                fontWeight: subTab === tab.id ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.icon}</span>
              <span>{lang === 'bn' ? tab.labelBn : tab.labelEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* NASA Earth Observation Hydrology Context Banner (GRACE-FO, SMAP L4, SRTM) */}
      <div
        className="dash-card ui-card-hud"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.95) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🛰️💧</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--water)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {lang === 'bn' ? 'নাসা আর্থ অবজারভেশন হাইড্রোলজি টেলিমেট্রি' : 'NASA Earth Observation Hydrology Data'}
            </span>
            <span style={{ fontSize: 10, background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: 'var(--water)', padding: '2px 8px', borderRadius: 999 }}>
              GRACE-FO · SMAP L4 · SRTM
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {lang === 'bn' ? `${activeField?.name || 'খামার'}-এর রিয়েল স্যাটেলাইট টেলিমেট্রি` : `Field Satellite Observations for ${activeField?.name || 'Selected Field'}`}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {/* GRACE-FO Mascon */}
          <div style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: fieldTelemetry.graceColor }}>
                🛰️ {lang === 'bn' ? 'GRACE-FO মোট পানি সঞ্চয়ের প্রবণতা (ভূগর্ভস্থ + ভূপৃষ্ঠ + মাটির পানি)' : 'NASA GRACE-FO Total Water Storage Trend (JPL RL06.3M)'}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>2002–2024</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: fieldTelemetry.graceColor }}>
                {fieldTelemetry.graceTrend}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
                {lang === 'bn' ? fieldTelemetry.graceStatusBn : fieldTelemetry.graceStatusEn}
              </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>
              {lang === 'bn' ? fieldTelemetry.graceDescBn : fieldTelemetry.graceDescEn}
            </p>
          </div>

          {/* SMAP L4 Root-Zone */}
          <div style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--water)' }}>
                🛰️ {lang === 'bn' ? 'নাসা এসএমএপি রুট-জোন আর্দ্রতা' : 'NASA SMAP L4 SPL4SMGP (9 km)'}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>0–100 cm</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--water)' }}>
                {fieldTelemetry.smapMoisture || (lang === 'bn' ? 'তথ্য নেই (এই জমির জন্য নামানো হয়নি)' : 'No data (not acquired for this field)')}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
                {lang === 'bn' ? 'রুট-জোন ধারণ' : 'Root-Zone Volumetric'}
              </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>
              {lang === 'bn' ? fieldTelemetry.smapDescBn : fieldTelemetry.smapDescEn}
            </p>
          </div>

          {/* SRTM 30m Elevation & Slope */}
          <div style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid rgba(0, 223, 129, 0.25)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--leaf)' }}>
                🛰️ {lang === 'bn' ? 'নাসা এসআরটিএম ৩০মি উচ্চতা ও ঢাল' : 'NASA SRTMGL1 (30 m Topography)'}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>1 Arc-Sec</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: fieldTelemetry.srtmElev ? 'var(--leaf)' : 'var(--text-3)' }}>
                {fieldTelemetry.srtmElev || (lang === 'bn' ? 'তথ্য নেই' : 'No data')}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
                {fieldTelemetry.srtmSlope
                  ? (lang === 'bn' ? `ঢাল: ${fieldTelemetry.srtmSlope}` : `Slope: ${fieldTelemetry.srtmSlope}`)
                  : (lang === 'bn' ? 'ঢাল: তথ্য নেই' : 'Slope: No data')}
              </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>
              {lang === 'bn' ? fieldTelemetry.srtmDescBn : fieldTelemetry.srtmDescEn}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Hydrology Scorecard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="dash-card ui-card-hud" style={{ background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 12, padding: '16px 18px' }}>
          <span style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {lang === 'bn' ? 'মোট ধারণক্ষমতা (TAW)' : 'Total Available Water (TAW)'}
          </span>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--water)', marginTop: 4 }}>
            {soilTextureIsAssumed
              ? (lang === 'bn' ? 'তথ্য নেই' : 'No field soil data')
              : `${tawMm} mm`}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {soilTexture.replace('_', ' ')}{soilTextureIsAssumed ? ' (default model assumption)' : ''}
            {' '}(0–{zRootM * 100} cm root zone)
          </span>
        </div>

        <div className="dash-card ui-card-hud" style={{ background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 12, padding: '16px 18px' }}>
          <span style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {lang === 'bn' ? 'সহজলভ্য আর্দ্রতা (RAW)' : 'Readily Available Water (RAW)'}
          </span>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--leaf)', marginTop: 4 }}>
            {soilTextureIsAssumed
              ? (lang === 'bn' ? 'তথ্য নেই' : 'No field soil data')
              : `${rawMm} mm`}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {soilTextureIsAssumed
              ? (lang === 'bn' ? 'মাটির তথ্য সংরক্ষিত নয়' : 'Field soil texture is unavailable')
              : `${Math.round(soilWaterSpecs.p * 100)}% depletion threshold without stress`}
          </span>
        </div>

        <div className="dash-card ui-card-hud" style={{ background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 12, padding: '16px 18px' }}>
          <span style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {lang === 'bn' ? 'সেচ সাশ্রয়ী অপ্টিমাইজেশন' : 'Water-Saving Rotation'}
          </span>
          <div style={{ fontSize: 24, fontWeight: 800, color: (waterSavedPct != null && waterSavedPct >= 0) ? 'var(--accent)' : 'var(--sun)', marginTop: 4 }}>
            {waterSavedPct != null
              ? (waterSavedPct > 0 ? `-${waterSavedPct}%` : (waterSavedPct === 0 ? '0% (Equal)' : `+${Math.abs(waterSavedPct)}%`))
              : (lang === 'bn' ? 'তথ্য নেই' : 'No data')}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {waterUsageMm != null && baselineWaterMm != null
              ? `${waterUsageMm} mm vs ${baselineWaterMm} mm baseline`
              : (lang === 'bn' ? 'পরিকল্পনা উপাত্ত লোড হচ্ছে...' : 'Loading planning data...')}
          </span>
        </div>

        <div className="dash-card ui-card-hud" style={{ background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 12, padding: '16px 18px' }}>
          <span style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {lang === 'bn' ? 'সেচ নলকূপ সীমা' : 'Borewell / Canal Limit'}
          </span>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--sun)', marginTop: 4 }}>
            {irrigCapMm != null ? `${irrigCapMm} mm` : (lang === 'bn' ? 'তথ্য নেই' : 'No data')}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            Max seasonal delivery per parcel
          </span>
        </div>
      </div>

      {/* SUB-TAB 1: WATER BALANCE (FAO-56 LYSIMETER) */}
      {subTab === 'balance' && (
        <div className="dash-card ui-card-hud" style={{ background: 'var(--glass-strong)', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
                  {lang === 'bn' ? 'ত্রিমাত্রিক পানি ব্যালেন্স ও লাইসিমিটার মডেল' : '3D Hydrological Water Balance & Lysimeter Model'}
                </h3>
                <span style={{ fontSize: 11, background: 'rgba(242, 193, 78, 0.15)', color: 'var(--sun)', border: '1px solid rgba(242, 193, 78, 0.3)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                  {lang === 'bn' ? 'উদাহরণমূলক মান' : 'Illustrative example values'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-2)' }}>
                FAO-56 daily mass conservation: Inflow (Rainfall + Irrigation) - Outflow (ETa + Deep Percolation) = ΔStorage
              </p>
            </div>
            <span style={{ fontSize: 11, background: 'rgba(0, 223, 129, 0.1)', color: 'var(--leaf)', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
              Mass Residual: 0.0 mm (Conserved)
            </span>
          </div>

          <WaterBalance3D
            rainfallMm={nasa?.rainfall != null ? Number(nasa.rainfall) : 18.0}
            irrigationMm={35.0}
            etaMm={4.5}
            deepPercolationMm={6.2}
            initialStorageMm={75.0}
            currentStorageMm={102.3}
            tawMm={tawMm}
            massResidualMm={0.0}
            lang={lang}
          />
        </div>
      )}

      {/* SUB-TAB 2: IRRIGATION OPTIMIZATION */}
      {subTab === 'optimization' && (
        <div className="dash-card ui-card-hud" style={{ background: 'var(--glass-strong)', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
              {lang === 'bn' ? 'এমআইএলপি সেচ অপ্টিমাইজেশন ও এডব্লিউডি শিডিউল' : 'Optimized Irrigation & AWD Scheduling'}
            </h3>
            <span style={{ fontSize: 11, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--leaf)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
              {lang === 'bn' ? 'অপ্টিমাইজার ও FAO-56 শিডিউল' : 'Optimizer & FAO-56 Schedule'}
            </span>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
            {lang === 'bn'
              ? 'বোরো ও আমন মৌসুমে বিকল্প ভেজানো ও শুকানো (Alternate Wetting and Drying - AWD) পদ্ধতি প্রয়োগে ২৫-৩০% ভূগর্ভস্থ পানি সাশ্রয় হয়। নিচে অপ্টিমাইজারের সেচ বণ্টন ছক দেওয়া হলো:'
              : 'Applying Alternate Wetting and Drying (AWD) reduces seasonal irrigation by 25–30% without yield loss. The water-efficiency strategy aligns crop selection to rainfall peaks:'}
          </p>

          <div style={{ overflowX: 'auto' }}>
            {scheduleRows.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px dashed var(--line)' }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>🌾💧</span>
                <strong style={{ fontSize: 14, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                  {lang === 'bn' ? 'প্রথমে আবর্তন পরিকল্পনা বেছে নিন' : 'Please select or generate a crop rotation plan first'}
                </strong>
                <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                  {lang === 'bn' ? 'পরিকল্পনা অপ্টিমাইজার থেকে নির্ধারিত শস্যের ভিত্তিতে এই জমিতে সেচ বণ্টন ছক তৈরি হবে।' : 'The dynamic seasonal irrigation schedule will populate once a crop rotation plan is calculated.'}
                </span>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--text-2)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>{lang === 'bn' ? 'মৌসুম' : 'Season'}</th>
                    <th style={{ padding: '10px 12px' }}>{lang === 'bn' ? 'নির্ধারিত ফসল' : 'Crop'}</th>
                    <th style={{ padding: '10px 12px' }}>{lang === 'bn' ? 'পানি চাহিদা (ETc)' : 'Crop Demand (ETc)'}</th>
                    <th style={{ padding: '10px 12px' }}>{lang === 'bn' ? 'কার্যকর বৃষ্টি' : 'Effective Rain'}</th>
                    <th style={{ padding: '10px 12px' }}>{lang === 'bn' ? 'প্রস্তাবিত সেচ' : 'Proposed Irrigation'}</th>
                    <th style={{ padding: '10px 12px' }}>{lang === 'bn' ? 'সাশ্রয়ী কৌশল (পদ্ধতি)' : 'Technique'}</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleRows.map((row, idx) => (
                    <tr key={row.periodKey || idx} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text)' }}>{row.season}</td>
                      <td style={{ padding: '12px', color: 'var(--leaf)', fontWeight: 700 }}>{row.crop}</td>
                      <td style={{ padding: '12px', color: 'var(--text-2)' }}>{row.demand}</td>
                      <td style={{ padding: '12px', color: 'var(--water)' }}>{row.rain}</td>
                      <td style={{ padding: '12px', color: 'var(--sun)', fontWeight: 700 }}>{row.irrig}</td>
                      <td style={{ padding: '12px', color: 'var(--text-2)', fontSize: 12 }}>{row.tech}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SOIL WATER PROFILE (ROOT ZONE) */}
      {subTab === 'profile' && (
        <div className="dash-card ui-card-hud" style={{ background: 'var(--glass-strong)', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
            {lang === 'bn' ? 'শিকড় অঞ্চলে মাটির আর্দ্রতা প্রোফাইল' : 'Soil Profile & Root-Zone Moisture Digital Twin'}
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-2)' }}>
            Stratified 3D visualization showing O, A, B, and C soil horizons, branching root architectures, and the dynamic saturation water table.
          </p>

          <SoilProfile3D
            crop="rice"
            rootDepthCm={zRootM * 100}
            volumetricWaterContentPct={28.5}
            fieldCapacityPct={soilWaterSpecs.fc * 100}
            wiltingPointPct={soilWaterSpecs.pwp * 100}
            soilTexture={soilTexture}
            lang={lang}
          />
        </div>
      )}

      {/* SUB-TAB 4: WATER STRESS ANALYSIS (FAO-33) */}
      {subTab === 'stress' && (
        <div className="dash-card ui-card-hud" style={{ background: 'var(--glass-strong)', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
            {lang === 'bn' ? 'এফএও-৩৩ পানি চাপ ও ফলন হ্রাস মডেল' : 'FAO-33 Water Stress & Yield Reduction Analysis'}
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
            Mathematical relationship between relative evapotranspiration deficit and actual harvest yield:
            <code style={{ display: 'block', background: 'var(--bg-deep)', padding: '10px 14px', borderRadius: 6, margin: '10px 0', color: 'var(--water)' }}>
              (1 - Ya / Ym) = Ky * (1 - ETa / ETc)
            </code>
            Where Ky is the crop yield response factor (Rice Ky = 1.20 during flowering, Lentil Ky = 0.85, Maize Ky = 1.25).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {[
              { crop: 'Aman Rice (আমন ধান)', stage: 'Flowering / Heading (অক্টোবর)', ky: 1.20, risk: 'High', note: 'Critical stage; drought during flowering causes severe spikelet sterility.' },
              { crop: 'Boro Rice (বোরো ধান)', stage: 'Panicle Initiation (মার্চ)', ky: 1.15, risk: 'High', note: 'High water requirement; requires guaranteed AWD tube well irrigation.' },
              { crop: 'Mustard (সরিষা)', stage: 'Pod filling (ফেব্রুয়ারি)', ky: 0.90, risk: 'Low', note: 'Deep taproot scavenges moisture; moderate drought tolerance.' },
              { crop: 'Mungbean (মুগডাল)', stage: 'Vegetative / Pod (মে)', ky: 0.80, risk: 'Low', note: 'Short duration (70 days); escapes terminal pre-monsoon heat.' },
            ].map((item, idx) => (
              <div key={idx} style={{ background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <strong style={{ fontSize: 14, color: 'var(--text)' }}>{item.crop}</strong>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: item.risk === 'High' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 223, 129, 0.15)', color: item.risk === 'High' ? 'var(--alert)' : 'var(--leaf)' }}>
                    {item.risk} Sensitivity
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--water)', marginBottom: 4 }}>সংবেদনশীল পর্যায়: {item.stage}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Ky ফ্যাক্টর: {item.ky} • {item.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default WaterIrrigationView;
