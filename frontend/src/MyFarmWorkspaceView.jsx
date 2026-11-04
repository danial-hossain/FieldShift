export function normalizeSeasonCode(seasonStr, lang = 'bn') {
  if (!seasonStr) return '--';
  const s = String(seasonStr).trim().toLowerCase();
  if (s.includes('রবি') || s.includes('rabi') || s.includes('dry')) return lang === 'bn' ? 'রবি' : 'Rabi';
  if (s.includes('খরিপ-১') || s.includes('খরিফ-১') || s.includes('kharif-1') || s.includes('kharif1')) return lang === 'bn' ? 'খরিফ-১' : 'Kharif-1';
  if (s.includes('খরিপ-২') || s.includes('খরিফ-২') || s.includes('kharif-2') || s.includes('kharif2') || s.includes('monsoon')) return lang === 'bn' ? 'খরিফ-২' : 'Kharif-2';
  return seasonStr;
}

// frontend/src/MyFarmWorkspaceView.jsx
// My Farm Workspace for FieldShift 2026 (P2 / M5 / M6 / M7)
// Sub-navigation: 1. আমার জমিগুলো, 2. জমির বিবরণ, 3. মাটি, 4. ফসল ও ইতিহাস.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleFieldMapPicker } from './GoogleFieldMapPicker.jsx';
import { formatNumber } from './marketUtils.js';
import { useTranslation } from './i18n.js';
import { Card, CardHeader, Stat, Pill, Button, Tabs, EmptyState, Toast, SourceChip, Skeleton } from './ui/index.js';
import { tonPerHaToMaundPerBigha, maundPerBighaToTonPerHa } from './utils/conversions.js';
import { computeSaxtonRawls } from './utils/saxtonRawls.js';
import { SOIL_TEXTURE_DATA, getSoilClassData } from './utils/soilClasses.js';

const RABI_OPTIONS = [
  'Boro Rice', 'Wheat', 'Potato', 'Mustard', 'Lentil',
  'Chickpea', 'Sunflower', 'Maize', 'Tomato', 'Fallow'
];
const KHARIF1_OPTIONS = [
  'Fallow', 'Aus Rice', 'Mungbean', 'Sesame', 'Jute', 'Maize'
];
const KHARIF2_OPTIONS = [
  'Rice', 'Fallow'
];

function normalizeRotation(rot, prevCrop) {
  let parsed = rot;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch {}
  }
  let rabi = parsed?.rabi || prevCrop || 'Boro Rice';
  if (!RABI_OPTIONS.includes(rabi)) {
    const l = String(rabi).toLowerCase();
    if (l.includes('boro') || l.includes('বোরো')) rabi = 'Boro Rice';
    else if (l.includes('wheat') || l.includes('গম')) rabi = 'Wheat';
    else if (l.includes('potato') || l.includes('আলু')) rabi = 'Potato';
    else if (l.includes('mustard') || l.includes('সরিষা')) rabi = 'Mustard';
    else if (l.includes('lentil') || l.includes('মসুর')) rabi = 'Lentil';
    else if (l.includes('chickpea') || l.includes('ছোলা')) rabi = 'Chickpea';
    else if (l.includes('sunflower') || l.includes('সূর্যমুখী')) rabi = 'Sunflower';
    else if (l.includes('maize') || l.includes('ভুট্টা')) rabi = 'Maize';
    else if (l.includes('tomato') || l.includes('টমেটো')) rabi = 'Tomato';
    else if (l.includes('fallow') || l.includes('পতিত')) rabi = 'Fallow';
    else rabi = 'Boro Rice';
  }

  let kharif1 = parsed?.kharif1 || 'Fallow';
  if (!KHARIF1_OPTIONS.includes(kharif1)) {
    const l = String(kharif1).toLowerCase();
    if (l.includes('aus') || l.includes('আউশ')) kharif1 = 'Aus Rice';
    else if (l.includes('mung') || l.includes('মুগ')) kharif1 = 'Mungbean';
    else if (l.includes('sesame') || l.includes('তিল')) kharif1 = 'Sesame';
    else if (l.includes('jute') || l.includes('পাট')) kharif1 = 'Jute';
    else if (l.includes('maize') || l.includes('ভুট্টা')) kharif1 = 'Maize';
    else kharif1 = 'Fallow';
  }

  let kharif2 = parsed?.kharif2 || 'Rice';
  if (!KHARIF2_OPTIONS.includes(kharif2)) {
    const l = String(kharif2).toLowerCase();
    if (l.includes('fallow') || l.includes('পতিত')) kharif2 = 'Fallow';
    else kharif2 = 'Rice';
  }

  return { rabi, kharif1, kharif2 };
}

// Calculate data completeness checklist for a field (P2)
function calculateCompleteness(f) {
  if (!f) return { score: 0, filledCount: 0, totalCount: 5, missing: [] };
  const checks = [
    {
      id: 'rotation',
      label: 'বর্তমান ফসল আবর্তন',
      labelEn: 'Current Rotation',
      desc: 'বর্তমান আবর্তন দিলে তুলনা সঠিক হবে',
      descEn: 'Provides baseline benchmark against optimizer',
      tab: 'history',
      filled: !!(f.existing_rotation && f.existing_rotation.rabi && f.existing_rotation.rabi !== 'Fallow')
    },
    {
      id: 'ph',
      label: 'মাটির অম্লতা (pH)',
      labelEn: 'Soil pH',
      desc: 'মাটির পিএইচ (pH) সঠিক সার সুপারিশে সহায়ক',
      descEn: 'Ensures nutrient uptake accuracy',
      tab: 'soil',
      filled: f.soil_ph != null || f.soilgrids_ph != null
    },
    {
      id: 'om',
      label: 'জৈব পদার্থ (OM)',
      labelEn: 'Organic Matter (OM)',
      desc: 'জৈব পদার্থ নাইট্রোজেন ও মাটির পুষ্টি নির্ধারণ করে',
      descEn: 'Calibrates soil carbon & nitrogen availability',
      tab: 'soil',
      filled: f.organic_matter != null || f.organic_matter_pct != null || f.soilgrids_soc != null
    },
    {
      id: 'irrigation',
      label: 'সেচ সক্ষমতা / শ্রেণি',
      labelEn: 'Irrigation Capacity',
      desc: 'সেচ সক্ষমতা পানির ঘাটতি ও ভূগর্ভস্থ চাপ পরিমাপে জরুরি',
      descEn: 'Crucial for groundwater extraction limit',
      tab: 'details',
      filled: f.irrigation_capacity_mm != null || f.irrigation_class != null
    },
    {
      id: 'texture',
      label: 'মাটির গঠন ও পুষ্টি বিশ্লেষণ',
      labelEn: 'Soil Texture Class',
      desc: 'মাটির গঠন সঠিক সেচ ও ফসল উপযোগিতা নিশ্চিত করে',
      descEn: 'Determines hydraulic conductivity and drainage',
      tab: 'soil',
      filled: !!(f.soil_texture && f.soil_texture !== 'unknown')
    }
  ];
  const filledCount = checks.filter(c => c.filled).length;
  const totalCount = checks.length;
  const score = Math.round((filledCount / totalCount) * 100);
  const missing = checks.filter(c => !c.filled);
  return { score, filledCount, totalCount, missing };
}

export function MyFarmWorkspaceView({
  activeField,
  user,
  userFields = [],
  onSelectField,
  onArchiveField,
  onDeleteField,
  onAddField,
  onEditField,
  request,
  lang = 'bn',
  onNavigate,
  initialSubTab = 'all_fields',
}) {
  const { t } = useTranslation(lang);

  // Normalize subTab IDs
  const resolveSubTab = (st) => {
    if (st === 'parcels' || st === 'overview' || st === 'all_fields') return 'all_fields';
    if (st === 'map' || st === 'details') return 'details';
    if (st === 'soil') return 'soil';
    if (st === 'history') return 'history';
    return 'all_fields';
  };

  const [subTab, setSubTab] = useState(() => resolveSubTab(initialSubTab));

  useEffect(() => {
    if (initialSubTab) setSubTab(resolveSubTab(initialSubTab));
  }, [initialSubTab]);

  // Search filter for all fields
  const [searchQuery, setSearchQuery] = useState('');

  // Toast notification state
  const [mapToast, setMapToast] = useState(null);

  // Trigger plan updated Toast with jump link
  const triggerPlanUpdatedToast = useCallback(() => {
    setMapToast({
      type: 'success',
      message: lang === 'bn' ? 'পরিকল্পনা আপডেট হয়েছে — দেখুন' : 'Plan updated — View',
      action: {
        label: lang === 'bn' ? 'পরিকল্পনায় যান →' : 'Open Planner →',
        onClick: () => onNavigate && onNavigate('farm_planning')
      }
    });
  }, [lang, onNavigate]);

  // A1 / M5: Existing Rotation Baseline State
  const [existingRotation, setExistingRotation] = useState(() =>
    normalizeRotation(activeField?.existing_rotation, activeField?.previous_crop)
  );
  const [baselineSaved, setBaselineSaved] = useState(false);
  const [isSavingBaseline, setIsSavingBaseline] = useState(false);

  useEffect(() => {
    setExistingRotation(normalizeRotation(activeField?.existing_rotation, activeField?.previous_crop));
  }, [activeField?.id, activeField?.existing_rotation, activeField?.previous_crop]);

  // Tab 2: Inline Edit State for Selected Field Details
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    district: 'bogura',
    area_ha: 1.0,
    soil_texture: 'loam',
    irrigation_capacity_mm: 400,
    seasonally_flooded: false,
  });

  useEffect(() => {
    if (activeField) {
      setEditForm({
        name: activeField.name || '',
        district: activeField.district || 'bogura',
        area_ha: activeField.area_ha != null ? activeField.area_ha : 1.0,
        soil_texture: activeField.soil_texture || 'loam',
        irrigation_capacity_mm: activeField.irrigation_capacity_mm != null ? activeField.irrigation_capacity_mm : 400,
        seasonally_flooded: Boolean(activeField.seasonally_flooded),
      });
    }
  }, [activeField?.id, activeField]);

  // Handle Save Inline Field Details
  const handleSaveDetails = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!activeField?.id || activeField.id === 'demo' || isSavingDetails) return;
    setIsSavingDetails(true);
    try {
      const reqFn = typeof request === 'function' ? request : (async (p, opts) => {
        const res = await fetch(p, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) } });
        return res.json();
      });

      const payload = {
        name: editForm.name.trim() || activeField.name,
        district: editForm.district,
        area_ha: parseFloat(editForm.area_ha) || activeField.area_ha || 1.0,
        soil_texture: editForm.soil_texture,
        irrigation_capacity_mm: parseFloat(editForm.irrigation_capacity_mm) || 0,
        seasonally_flooded: editForm.seasonally_flooded,
      };

      const res = await reqFn(`/api/fields/${activeField.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      const updated = res?.field || { ...activeField, ...payload };
      if (typeof onSelectField === 'function') {
        onSelectField(updated);
      }
      setIsEditingDetails(false);
      triggerPlanUpdatedToast();
    } catch (err) {
      setMapToast({
        type: 'error',
        message: lang === 'bn' ? `সংরক্ষণে ত্রুটি: ${err.message}` : `Save error: ${err.message}`
      });
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Re-Enrich field (POST /api/fields/{id}/enrich)
  const [isEnriching, setIsEnriching] = useState(false);
  const handleReEnrich = async () => {
    if (!activeField?.id || activeField.id === 'demo' || isEnriching) return;
    setIsEnriching(true);
    try {
      const reqFn = typeof request === 'function' ? request : (async (p, opts) => {
        const res = await fetch(p, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) } });
        return res.json();
      });

      await reqFn(`/api/fields/${activeField.id}/enrich`, {
        method: 'POST',
        body: JSON.stringify({
          latitude: activeField.latitude,
          longitude: activeField.longitude,
          area_ha: activeField.area_ha,
        })
      });

      // Reload field
      const fieldsRes = await reqFn('/api/fields');
      const found = fieldsRes?.fields?.find(f => f.id === activeField.id);
      if (found && typeof onSelectField === 'function') {
        onSelectField(found);
      }

      setMapToast({
        type: 'success',
        message: lang === 'bn' ? 'নাসা ও মাটির তথ্য সফলভাবে সমৃদ্ধ করা হয়েছে।' : 'NASA & soil telemetry enriched successfully.'
      });
      triggerPlanUpdatedToast();
    } catch (err) {
      setMapToast({
        type: 'error',
        message: lang === 'bn' ? `তথ্য আনতে ত্রুটি: ${err.message}` : `Enrichment error: ${err.message}`
      });
    } finally {
      setIsEnriching(false);
    }
  };

  // Moving map pin saves and re-enriches (P2)
  const [isUpdatingCoords, setIsUpdatingCoords] = useState(false);
  const handleUpdateCoords = async (newLat, newLng) => {
    if (!activeField || activeField.id === 'demo' || isUpdatingCoords) return;
    setIsUpdatingCoords(true);
    try {
      const reqFn = typeof request === 'function' ? request : (async (p, opts) => {
        const res = await fetch(p, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) } });
        return res.json();
      });
      await reqFn(`/api/fields/${activeField.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          latitude: Number(newLat),
          longitude: Number(newLng),
          name: activeField.name,
          area_ha: activeField.area_ha,
          soil_texture: activeField.soil_texture,
        })
      });
      await reqFn(`/api/fields/${activeField.id}/enrich`, {
        method: 'POST',
        body: JSON.stringify({
          latitude: Number(newLat),
          longitude: Number(newLng),
          area_ha: activeField.area_ha
        })
      });

      // Reload field
      const fieldsRes = await reqFn('/api/fields');
      const found = fieldsRes?.fields?.find(f => f.id === activeField.id) || { ...activeField, latitude: Number(newLat), longitude: Number(newLng) };
      if (typeof onSelectField === 'function') {
        onSelectField(found);
      }
      triggerPlanUpdatedToast();
    } catch (err) {
      setMapToast({
        type: 'error',
        message: lang === 'bn' ? `স্থানাঙ্ক সংরক্ষণে ত্রুটি: ${err.message}` : `Failed to save coordinates: ${err.message}`
      });
    } finally {
      setIsUpdatingCoords(false);
    }
  };

  // Save Baseline Rotation (M5)
  const handleSaveBaseline = async () => {
    if (!activeField || activeField.id === 'demo' || isSavingBaseline) return;
    setIsSavingBaseline(true);
    try {
      const reqFn = typeof request === 'function' ? request : (async (p, opts) => {
        const res = await fetch(p, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) } });
        return res.json();
      });
      const res = await reqFn(`/api/fields/${activeField.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          existing_rotation: existingRotation,
          previous_crop: existingRotation.rabi,
        })
      });
      const updated = res?.field || {
        ...activeField,
        existing_rotation: existingRotation,
        previous_crop: existingRotation.rabi,
      };
      if (typeof onSelectField === 'function') {
        onSelectField(updated);
      }
      setBaselineSaved(true);
      setTimeout(() => setBaselineSaved(false), 3000);
      triggerPlanUpdatedToast();
    } catch (err) {
      setMapToast({
        type: 'error',
        message: lang === 'bn'
          ? `ফসল চক্র সংরক্ষণে ত্রুটি: ${err.message}`
          : `Failed to save rotation: ${err.message}`
      });
    } finally {
      setIsSavingBaseline(false);
    }
  };

  // M6: Authentic Baseline Agro-Ecological Diagnostics from /api/planning
  const [baselinePlanning, setBaselinePlanning] = useState(null);
  const [isLoadingBaseline, setIsLoadingBaseline] = useState(false);

  useEffect(() => {
    if (!activeField?.id || activeField.id === 'demo') {
      setBaselinePlanning(null);
      return;
    }
    let isCancelled = false;
    setIsLoadingBaseline(true);
    const reqFn = typeof request === 'function' ? request : (async (p, opts) => {
      const res = await fetch(p, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) } });
      return res.json();
    });
    reqFn('/api/planning', {
      method: 'POST',
      body: JSON.stringify({
        field_id: activeField.id,
        district: activeField.district || 'bogura',
        area_ha: activeField.area_ha || 1.0,
        existing_rotation: existingRotation,
      })
    }).then(res => {
      if (!isCancelled && res?.summary?.planning) {
        setBaselinePlanning(res.summary.planning);
      }
    }).catch(err => {
      console.warn('Failed to fetch baseline planning diagnostics:', err);
    }).finally(() => {
      if (!isCancelled) setIsLoadingBaseline(false);
    });

    return () => { isCancelled = true; };
  }, [activeField?.id, existingRotation.rabi, existingRotation.kharif1, existingRotation.kharif2, request]);

  // M6: Authentic Field History from /api/fields/{id}/history
  const [fieldHistory, setFieldHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!activeField || !activeField.id || activeField.id === 'demo') {
      setFieldHistory([]);
      return;
    }
    setIsLoadingHistory(true);
    try {
      const reqFn = typeof request === 'function' ? request : (async (p, opts) => {
        const res = await fetch(p, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) } });
        return res.json();
      });
      const data = await reqFn(`/api/fields/${activeField.id}/history`);
      if (data && Array.isArray(data.history)) {
        setFieldHistory(data.history);
      } else {
        setFieldHistory([]);
      }
    } catch (err) {
      console.warn('Failed to fetch field history:', err);
      setFieldHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [activeField?.id, request]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleFieldDeleteClick = (fieldToDelete) => {
    if (!fieldToDelete) return;
    if (onArchiveField) {
      onArchiveField(fieldToDelete);
    } else if (onDeleteField) {
      onDeleteField(fieldToDelete);
    }
  };

  // M6: Form state to add past seasonal record

  const [newHistorySeason, setNewHistorySeason] = useState('রবি');
  const [newHistoryYear, setNewHistoryYear] = useState('2024');
  const [newHistoryCrop, setNewHistoryCrop] = useState('');
  const [newHistoryYield, setNewHistoryYield] = useState('');
  const [newHistoryYieldUnit, setNewHistoryYieldUnit] = useState('maund_bigha');
  const [newHistoryWater, setNewHistoryWater] = useState('');
  const [newHistoryNotes, setNewHistoryNotes] = useState('');
  const [isSubmittingHistory, setIsSubmittingHistory] = useState(false);

  // Filter crops strictly by allowed seasons
  // Filter crops strictly by allowed seasons
  const availableSeasonCrops = useMemo(() => {
    const s = String(newHistorySeason || '').trim().toLowerCase();
    const base = (s.includes('রবি') || s.includes('rabi') || s.includes('dry'))
      ? [
          { value: 'Boro Rice', label: lang === 'bn' ? 'বোরো ধান (Boro Rice)' : 'Boro Rice' },
          { value: 'Potato', label: lang === 'bn' ? 'গোল আলু (Potato)' : 'Potato' },
          { value: 'Mustard', label: lang === 'bn' ? 'সরিষা (Mustard)' : 'Mustard' },
          { value: 'Wheat', label: lang === 'bn' ? 'গম (Wheat)' : 'Wheat' },
          { value: 'Lentil', label: lang === 'bn' ? 'মসুর ডাল (Lentil)' : 'Lentil' },
          { value: 'Chickpea', label: lang === 'bn' ? 'ছোলা (Chickpea)' : 'Chickpea' },
          { value: 'Sunflower', label: lang === 'bn' ? 'সূর্যমুখী (Sunflower)' : 'Sunflower' },
          { value: 'Maize', label: lang === 'bn' ? 'ভুট্টা (Maize)' : 'Maize' },
          { value: 'Tomato', label: lang === 'bn' ? 'টমেটো (Tomato)' : 'Tomato' },
          { value: 'Fallow', label: lang === 'bn' ? 'পতিত জমি (Fallow)' : 'Fallow' },
        ]
      : (s.includes('খরিপ-১') || s.includes('খরিফ-১') || s.includes('kharif1') || s.includes('kharif-1'))
      ? [
          { value: 'Aus Rice', label: lang === 'bn' ? 'আউশ ধান (Aus Rice)' : 'Aus Rice' },
          { value: 'Mungbean', label: lang === 'bn' ? 'মুগডাল (Mungbean)' : 'Mungbean' },
          { value: 'Sesame', label: lang === 'bn' ? 'তিল (Sesame)' : 'Sesame' },
          { value: 'Jute', label: lang === 'bn' ? 'পাট (Jute)' : 'Jute' },
          { value: 'Maize', label: lang === 'bn' ? 'গ্রীষ্মকালীন ভুট্টা (Summer Maize)' : 'Summer Maize' },
          { value: 'Fallow', label: lang === 'bn' ? 'পতিত জমি (Fallow)' : 'Fallow' },
        ]
      : [
          { value: 'Rice', label: lang === 'bn' ? 'রোপা আমন ধান (T.Aman Rice)' : 'T.Aman Rice' },
          { value: 'Fallow', label: lang === 'bn' ? 'পতিত জমি (Fallow)' : 'Fallow' },
        ];
    return [...base, { value: '__other__', label: lang === 'bn' ? '➕ অন্যান্য (নিজে লিখুন)' : '➕ Other (Custom)' }];
  }, [newHistorySeason, lang]);

  const [customCropName, setCustomCropName] = useState('');

  const handleDeleteHistory = async (historyId) => {
    if (!activeField?.id || !historyId) return;
    if (typeof window !== 'undefined' && !window.confirm(lang === 'bn' ? 'আপনি কি এই রেকর্ডটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this record?')) {
      return;
    }
    try {
      const reqFn = typeof request === 'function' ? request : (async (p, opts) => {
        const res = await fetch(p, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) } });
        return res.json();
      });
      await reqFn(`/api/fields/${activeField.id}/history/${historyId}`, {
        method: 'DELETE'
      });
      await fetchHistory();
      setMapToast({
        type: 'success',
        message: lang === 'bn' ? 'রেকর্ড মুছে ফেলা হয়েছে।' : 'Record deleted successfully.'
      });
    } catch (err) {
      setMapToast({
        type: 'error',
        message: lang === 'bn' ? `মুছতে ব্যর্থ: ${err.message}` : `Delete failed: ${err.message}`
      });
    }
  };

  const handleAddHistory = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!activeField?.id || !newHistoryCrop.trim() || !newHistoryYield || isSubmittingHistory) return;
    setIsSubmittingHistory(true);
    try {
      const yieldVal = parseFloat(newHistoryYield);
      const yieldTonHa = newHistoryYieldUnit === 'ton_ha'
        ? yieldVal
        : maundPerBighaToTonPerHa(yieldVal);

      const waterVal = newHistoryWater.trim() ? parseFloat(newHistoryWater) : null;
      const yearVal = parseInt(newHistoryYear, 10) || new Date().getFullYear();

      const reqFn = typeof request === 'function' ? request : (async (p, opts) => {
        const res = await fetch(p, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) } });
        return res.json();
      });

      const finalCrop = newHistoryCrop === '__other__' ? customCropName.trim() : newHistoryCrop.trim();
      if (!finalCrop) {
        setIsSubmittingHistory(false);
        return;
      }
      await reqFn(`/api/fields/${activeField.id}/history`, {
        method: 'POST',
        body: JSON.stringify({
          season: newHistorySeason,
          year: yearVal,
          crop: finalCrop,
          yield_ton_per_ha: yieldTonHa,
          water_applied_mm: waterVal,
          notes: newHistoryNotes.trim() || null
        })
      });

      setNewHistoryCrop('');
      setCustomCropName('');
      setNewHistoryYield('');
      setNewHistoryWater('');
      setNewHistoryNotes('');

      await fetchHistory();

      setMapToast({
        type: 'success',
        message: lang === 'bn'
          ? 'বিগত মৌসুমের রেকর্ড সফলভাবে যোগ করা হয়েছে।'
          : 'Historical season record saved successfully.'
      });
    } catch (err) {
      setMapToast({
        type: 'error',
        message: lang === 'bn'
          ? `রেকর্ড সংরক্ষণে ত্রুটি: ${err.message}`
          : `Failed to save history: ${err.message}`
      });
    } finally {
      setIsSubmittingHistory(false);
    }
  };

  // Filtered fields for Tab 1
  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return userFields;
    const q = searchQuery.toLowerCase();
    return userFields.filter(f =>
      (f.name && f.name.toLowerCase().includes(q)) ||
      (f.district && f.district.toLowerCase().includes(q))
    );
  }, [userFields, searchQuery]);

  // Selected Field Completeness
  const activeCompleteness = useMemo(() => calculateCompleteness(activeField), [activeField]);

  // Soil diagnostics calculation (M7)
  const soilClass = useMemo(() => getSoilClassData(activeField?.soil_texture), [activeField?.soil_texture]);
  const hasRealSoilGrids = activeField?.soilgrids_sand != null && activeField?.soilgrids_clay != null;
  const sandVal = hasRealSoilGrids ? activeField.soilgrids_sand : soilClass.sand;
  const siltVal = hasRealSoilGrids ? activeField.soilgrids_silt : soilClass.silt;
  const clayVal = hasRealSoilGrids ? activeField.soilgrids_clay : soilClass.clay;
  const phVal = activeField?.soil_ph != null ? activeField.soil_ph : (activeField?.soilgrids_ph != null ? activeField.soilgrids_ph : 6.5);
  const omVal = activeField?.organic_matter != null ? activeField.organic_matter : (activeField?.soilgrids_soc != null ? (activeField.soilgrids_soc * 1.724).toFixed(1) : 1.8);

  // Saxton-Rawls calculation (M7)
  const saxtonRes = useMemo(() => {
    if (sandVal != null && clayVal != null) {
      return computeSaxtonRawls(sandVal, clayVal, omVal);
    }
    return null;
  }, [sandVal, clayVal, omVal]);

  const fcDisplay = hasRealSoilGrids && saxtonRes ? saxtonRes.fc : soilClass.fc;
  const pwpDisplay = hasRealSoilGrids && saxtonRes ? saxtonRes.pwp : soilClass.pwp;

  const fallbackText = lang === 'bn' ? 'তথ্য নেই' : 'No data';
  const areaHa = activeField?.area_ha != null ? Number(activeField.area_ha) : null;
  const areaBigha = areaHa != null ? (areaHa * (10000 / 1337.8)).toFixed(1) : null;
  const areaDisplay = areaHa != null
    ? `${formatNumber(areaHa, 2)} ${lang === 'bn' ? 'হেক্টর' : 'ha'} (${areaBigha} ${lang === 'bn' ? 'বিঘা' : 'bigha'})`
    : fallbackText;

  // Canonical 4 Tabs (Bangla first, no English shouting, no emoji in headings) (P2)
  const subTabs = [
    { id: 'all_fields', label: lang === 'bn' ? 'আমার জমিগুলো' : 'My Fields', icon: '📋' },
    { id: 'details', label: lang === 'bn' ? 'জমির বিবরণ' : 'Field Details', icon: '📍' },
    { id: 'soil', label: lang === 'bn' ? 'মাটি' : 'Soil', icon: '🌱' },
    { id: 'history', label: lang === 'bn' ? 'ফসল ও ইতিহাস' : 'Crop & History', icon: '📜' },
  ];

  return (
    <div className="my-farm-workspace" style={{ padding: '8px 0 32px 0', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Top Header Card */}
      <Card variant="glass" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 22 }}>🌾</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary, #10b981)' }}>
                {lang === 'bn' ? 'জমি ব্যবস্থাপনা' : 'Farm Parcel Registry'}
              </span>
              {activeField && (
                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 600 }}>
                  {activeField.name}
                </span>
              )}
            </div>
            <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
              {lang === 'bn' ? 'আমার জমি ও ফসল আবর্তন' : 'My Farm & Seasonal Crop Rotation'}
            </h1>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5, maxWidth: 840 }}>
              {lang === 'bn'
                ? 'খামারের সকল জমি, স্যাটেলাইট স্থানাঙ্ক, মাটির বৈশিষ্ট্য এবং বিগত মৌসুমসমূহের ইতিহাস।'
                : 'Registered field parcels, satellite boundaries, SoilGrids diagnostics, and seasonal history.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              variant="primary"
              size="sm"
              onClick={onAddField}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>+</span>
              <span>{lang === 'bn' ? 'নতুন জমি' : 'Add New Field'}</span>
            </Button>
          </div>
        </div>

        {/* 4 Tabs Bar */}
        <div style={{ marginTop: 18, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          <Tabs
            tabs={subTabs}
            activeTab={subTab}
            onChange={setSubTab}
          />
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* TAB 1: আমার জমিগুলো (ALL FIELDS MAP & CARDS) (P2)                          */}
      {/* ========================================================================= */}
      {subTab === 'all_fields' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Map with ALL fields as markers */}
          <Card variant="glass">
            <CardHeader
              title={lang === 'bn' ? 'স্যাটেলাইট মানচিত্রে আমার জমিগুলো' : 'Satellite Map with All Field Parcels'}
              subtitle={lang === 'bn' ? 'মানচিত্রের যেকোনো জমিতে ক্লিক করে সেটি সক্রিয় নির্বাচন করুন' : 'Click any parcel pin on the map to select as active field'}
            />
            <div style={{ borderRadius: 12, overflow: 'hidden', marginTop: 12, border: '1px solid var(--line)' }}>
              <GoogleFieldMapPicker
                fields={userFields}
                selectedFieldId={activeField?.id}
                onSelectField={(f) => {
                  if (onSelectField) onSelectField(f);
                }}
                height="320px"
              />
            </div>
          </Card>

          {/* Search Bar & Stats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
              <input
                type="text"
                placeholder={lang === 'bn' ? 'জমি বা জেলার নাম দিয়ে খুঁজুন...' : 'Search by field or district...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: 360,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  border: '1px solid var(--line)',
                  background: 'var(--surface-2, rgba(255,255,255,0.03))'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 12 }}
                >
                  {lang === 'bn' ? 'মুছুন' : 'Clear'}
                </button>
              )}
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
              {lang === 'bn' ? 'মোট জমি:' : 'Total fields:'} <strong style={{ color: 'var(--text)' }}>{userFields.length}</strong> {lang === 'bn' ? 'টি' : ''} •
              {' '} {lang === 'bn' ? 'মোট আয়তন:' : 'Total area:'} <strong style={{ color: 'var(--text)' }}>{(userFields.reduce((sum, f) => sum + (Number(f.area_ha) || 0), 0) * (10000 / 1337.8)).toFixed(1)}</strong> {lang === 'bn' ? 'বিঘা' : 'bigha'}
            </div>
          </div>

          {/* Field Cards Grid */}
          {filteredFields.length === 0 ? (
            <Card variant="glass" style={{ padding: 36, textAlign: 'center' }}>
              <EmptyState
                icon="🚜"
                title={lang === 'bn' ? 'কোনো জমি পাওয়া যায়নি' : 'No fields found'}
                description={searchQuery
                  ? (lang === 'bn' ? 'আপনার অনুসন্ধানের সাথে মিল রেখে কোনো জমি পাওয়া যায়নি।' : 'No fields match your search query.')
                  : (lang === 'bn' ? 'এখনো কোনো জমি যোগ করা হয়নি। "+ নতুন জমি" বোতামে ক্লিক করুন।' : 'No fields added yet. Click "+ Add New Field" to begin.')
                }
                action={
                  <Button variant="primary" size="sm" onClick={onAddField}>
                    {lang === 'bn' ? '+ নতুন জমি যোগ করুন' : '+ Add New Field'}
                  </Button>
                }
              />
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {filteredFields.map(f => {
                const isSelected = activeField && String(f.id) === String(f.id === activeField.id ? activeField.id : f.id) && String(f.id) === String(activeField.id);
                const comp = calculateCompleteness(f);
                const bigha = ((Number(f.area_ha) || 0) * (10000 / 1337.8)).toFixed(1);
                const soilInfo = getSoilClassData(f.soil_texture);
                const rotText = f.existing_rotation
                  ? [f.existing_rotation.rabi, f.existing_rotation.kharif1, f.existing_rotation.kharif2].filter(Boolean).join(' → ')
                  : (lang === 'bn' ? 'বোরো → পতিত → আমন (ধরে নেওয়া)' : 'Boro -> Fallow -> Aman (assumed)');

                return (
                  <Card
                    key={f.id}
                    variant="glass"
                    style={{
                      border: isSelected ? '1.5px solid #10b981' : '1px solid var(--line, rgba(255,255,255,0.12))',
                      background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'var(--surface-card, rgba(16, 28, 22, 0.7))',
                      borderRadius: 14,
                      padding: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: isSelected ? '0 0 20px rgba(16, 185, 129, 0.15)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      {/* Top Row: Name, ID, District & Completeness Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>🌱</span>
                            <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: 'var(--text)' }}>
                              {f.name}
                            </h3>
                            <span style={{ fontSize: 10.5, padding: '1px 7px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', color: 'var(--text-3)', fontWeight: 600 }}>
                              #{f.id}
                            </span>
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: 'var(--water)', fontWeight: 700 }}>{f.district ? f.district.toUpperCase() : 'BOGURA'}</span>
                            <span>•</span>
                            <span>{formatNumber(f.latitude, 4)}°N, {formatNumber(f.longitude, 4)}°E</span>
                          </div>
                        </div>

                        {/* Completeness Chip */}
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: comp.score >= 80 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: comp.score >= 80 ? '#4ade80' : '#fbbf24',
                            border: `1px solid ${comp.score >= 80 ? 'rgba(34, 197, 94, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {lang === 'bn' ? `তথ্য পূর্ণতা: ${comp.score}%` : `Data: ${comp.score}%`}
                        </span>
                      </div>

                      {/* Specs Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12.5, margin: '14px 0 10px', borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                        <div style={{ background: 'var(--surface-2, rgba(255,255,255,0.03))', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)' }}>
                          <span style={{ color: 'var(--text-3)', display: 'block', fontSize: 10.5, fontWeight: 600 }}>{lang === 'bn' ? 'আয়তন (Area):' : 'Area:'}</span>
                          <strong style={{ color: 'var(--sun, #f59e0b)', fontSize: 13 }}>{bigha} {lang === 'bn' ? 'বিঘা' : 'bigha'}</strong>
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}> ({f.area_ha || 1.0} ha)</span>
                        </div>
                        <div style={{ background: 'var(--surface-2, rgba(255,255,255,0.03))', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)' }}>
                          <span style={{ color: 'var(--text-3)', display: 'block', fontSize: 10.5, fontWeight: 600 }}>{lang === 'bn' ? 'মাটির শ্রেণি (Soil):' : 'Soil Class:'}</span>
                          <strong style={{ color: 'var(--text)', fontSize: 13 }}>{soilInfo.nameBn}</strong>
                        </div>
                        <div style={{ gridColumn: 'span 2', background: 'var(--surface-2, rgba(255,255,255,0.03))', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)' }}>
                          <span style={{ color: 'var(--text-3)', display: 'block', fontSize: 10.5, fontWeight: 600 }}>{lang === 'bn' ? 'বর্তমান আবর্তন (Current Rotation):' : 'Current Rotation:'}</span>
                          <span style={{ color: 'var(--leaf, #10b981)', fontWeight: 700, fontSize: 12.5 }}>{rotText}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                      <div>
                        {isSelected ? (
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.15)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                            <span>✓</span>
                            <span>{lang === 'bn' ? 'সক্রিয় জমি' : 'Active Field'}</span>
                          </span>
                        ) : (
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => onSelectField && onSelectField(f)}
                            style={{ fontWeight: 600 }}
                          >
                            {lang === 'bn' ? 'নির্বাচন করুন' : 'Select Field'}
                          </Button>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => {
                            if (onSelectField) onSelectField(f);
                            setIsEditingDetails(true);
                            setSubTab('details');
                          }}
                        >
                          ✏️ {lang === 'bn' ? 'সম্পাদনা' : 'Edit'}
                        </Button>
                        <Button
                          variant="danger"
                          size="xs"
                          onClick={() => handleFieldDeleteClick(f)}
                        >
                          🗑️ {lang === 'bn' ? 'মুছুন' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: জমির বিবরণ (SELECTED FIELD DETAILS & DYNAMICS) (P2)                 */}
      {/* ========================================================================= */}
      {subTab === 'details' && !activeField && (
        <Card variant="glass" style={{ padding: 36, textAlign: 'center' }}>
          <EmptyState
            icon="📍"
            title={lang === 'bn' ? 'কোনো জমি নির্বাচিত নেই' : 'No Field Selected'}
            description={lang === 'bn' ? 'জমির বিস্তারিত তথ্য দেখতে প্রথমে "আমার জমিগুলো" ট্যাব থেকে একটি জমি নির্বাচন করুন।' : 'Please select a field from "My Fields" tab to view details.'}
            action={
              <Button variant="primary" size="sm" onClick={() => setSubTab('all_fields')}>
                {lang === 'bn' ? 'জমি নির্বাচন করুন →' : 'Select Field →'}
              </Button>
            }
          />
        </Card>
      )}

      {subTab === 'details' && activeField && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, alignItems: 'start' }}>
          {/* Left Column: Details & Edit Form + Map Picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card variant="glass">
              <CardHeader
                title={lang === 'bn' ? 'জমির বিবরণ ও ভৌগোলিক অবস্থান' : 'Field Characteristics & Location'}
                subtitle={lang === 'bn' ? 'অবস্থান, আয়তন এবং আবহাওয়া গ্রিড সেল কোড' : 'Coordinates, area, and environmental grid cell IDs'}
                action={
                  <Button
                    variant={isEditingDetails ? 'secondary' : 'primary'}
                    size="xs"
                    onClick={() => setIsEditingDetails(!isEditingDetails)}
                  >
                    {isEditingDetails ? (lang === 'bn' ? 'বাতিল' : 'Cancel') : (lang === 'bn' ? 'সম্পাদনা করুন' : 'Edit Field')}
                  </Button>
                }
              />

              {/* Inline Edit Form */}
              {isEditingDetails ? (
                <form onSubmit={handleSaveDetails} style={{ marginTop: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                        {lang === 'bn' ? 'জমির নাম' : 'Field Name'} *
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 13 }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                        {lang === 'bn' ? 'জেলা' : 'District'} *
                      </label>
                      <input
                        type="text"
                        value={editForm.district}
                        onChange={e => setEditForm({ ...editForm, district: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 13 }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                        {lang === 'bn' ? 'আয়তন (হেক্টর)' : 'Area (ha)'} *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={editForm.area_ha}
                        onChange={e => setEditForm({ ...editForm, area_ha: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 13 }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                        {lang === 'bn' ? 'মাটির গঠন' : 'Soil Texture'}
                      </label>
                      <select
                        value={editForm.soil_texture}
                        onChange={e => setEditForm({ ...editForm, soil_texture: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 13 }}
                      >
                        <option value="loam">দোআঁশ (Loam)</option>
                        <option value="silty_loam">পলি দোআঁশ (Silty Loam)</option>
                        <option value="clay_loam">এঁটেল দোআঁশ (Clay Loam)</option>
                        <option value="clay">এঁটেল (Clay)</option>
                        <option value="sandy_loam">বেলে দোআঁশ (Sandy Loam)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                        {lang === 'bn' ? 'সেচ সক্ষমতা (মিমি)' : 'Irrigation Cap (mm)'}
                      </label>
                      <input
                        type="number"
                        step="50"
                        value={editForm.irrigation_capacity_mm}
                        onChange={e => setEditForm({ ...editForm, irrigation_capacity_mm: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 13 }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 18 }}>
                      <input
                        type="checkbox"
                        id="haor_toggle"
                        checked={editForm.seasonally_flooded}
                        onChange={e => setEditForm({ ...editForm, seasonally_flooded: e.target.checked })}
                      />
                      <label htmlFor="haor_toggle" style={{ fontSize: 12.5, color: 'var(--text)', cursor: 'pointer' }}>
                        {lang === 'bn' ? 'হাওর / নিচু জলাভূমি (মৌসুমি প্লাবিত)' : 'Haor / seasonally flooded basin'}
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => setIsEditingDetails(false)}
                    >
                      {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      type="submit"
                      disabled={isSavingDetails}
                    >
                      {isSavingDetails ? '...' : (lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes')}
                    </Button>
                  </div>
                </form>
              ) : (
                /* Display Mode */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginTop: 14 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'block' }}>{lang === 'bn' ? 'অবস্থান ও জেলা:' : 'District & Location:'}</span>
                    <strong style={{ fontSize: 14, color: 'var(--text)' }}>
                      {activeField.district ? activeField.district.toUpperCase() : 'BOGURA'}
                    </strong>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                      {formatNumber(activeField.latitude, 4)}°N, {formatNumber(activeField.longitude, 4)}°E
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'block' }}>{lang === 'bn' ? 'জেলা সদর থেকে দূরত্ব:' : 'Distance to District Centre:'}</span>
                    <strong style={{ fontSize: 14, color: 'var(--text)' }}>
                      {activeField.nearest_district_distance_km != null ? `${activeField.nearest_district_distance_km.toFixed(1)} কিমি` : (lang === 'bn' ? 'তথ্য নেই' : 'No data')}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'block' }}>{lang === 'bn' ? 'মোট আয়তন:' : 'Total Area:'}</span>
                    <strong style={{ fontSize: 14, color: 'var(--text)' }}>{areaDisplay}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'block' }}>{lang === 'bn' ? 'সেচ সক্ষমতা:' : 'Irrigation Capacity:'}</span>
                    <strong style={{ fontSize: 14, color: 'var(--water, #38bdf8)' }}>
                      {activeField.irrigation_capacity_mm != null ? `${activeField.irrigation_capacity_mm} মিমি` : (lang === 'bn' ? 'তথ্য নেই' : 'No data')}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'block' }}>NASA POWER Cell ID:</span>
                    <code style={{ fontSize: 12, color: 'var(--text-2)' }}>
                      {activeField.power_cell || `power_cell_${(Math.round((activeField.latitude||24)*2)/2).toFixed(1)}_${(Math.round((activeField.longitude||89)*2)/2).toFixed(1)}`}
                    </code>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'block' }}>GPM IMERG Cell ID:</span>
                    <code style={{ fontSize: 12, color: 'var(--text-2)' }}>
                      {activeField.imerg_cell || 'imerg_0.10deg_precip'}
                    </code>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'block' }}>{lang === 'bn' ? 'হাওর অঞ্চল স্ট্যাটাস:' : 'Haor Basin Status:'}</span>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: activeField.seasonally_flooded ? '#f59e0b' : 'var(--text-2)'
                    }}>
                      {activeField.seasonally_flooded
                        ? (lang === 'bn' ? '⚠️ হাওর / মৌসুমি প্লাবিত জলাভূমি (একফসলি বোরো ঝুঁকি অঞ্চল)' : 'Haor / seasonally waterlogged basin (Single-crop Boro flood risk)')
                        : (lang === 'bn' ? '✓ সাধারণ উঁচু ও সমতল কৃষি জমি (বহুফসলি আবর্তন উপযোগী)' : 'Standard arable agricultural land')
                      }
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* Interactive Satellite Pin Mover */}
            <Card variant="glass">
              <CardHeader
                title={lang === 'bn' ? 'স্যাটেলাইট পিন সমন্বয়' : 'Satellite Pin Coordinate Adjustment'}
                subtitle={lang === 'bn' ? 'মানচিত্রে পিন সরিয়ে নতুন স্থানাঙ্ক নির্ধারণ করুন, নাসার টেলিমিতি স্বয়ংক্রিয় হালনাগাদ হবে' : 'Move marker to update exact coordinates. Automatically re-enriches environmental data.'}
              />
              <div style={{ height: 280, borderRadius: 12, overflow: 'hidden', marginTop: 12, border: '1px solid var(--line)' }}>
                <GoogleFieldMapPicker
                  latitude={activeField.latitude}
                  longitude={activeField.longitude}
                  onChange={handleUpdateCoords}
                  height="280px"
                />
              </div>
            </Card>
          </div>

          {/* Right Column: 3 Dynamic Cards (Completeness, Enrich, Planner Mini) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 1. Data Completeness Card (P2) */}
            <Card variant="glass">
              <CardHeader
                title={lang === 'bn' ? 'উপাত্ত পূর্ণতা সূচক' : 'Data Completeness Index'}
                subtitle={lang === 'bn' ? 'সঠিক পরিকল্পনা ও সার সুপারিশের জন্য প্রয়োজনীয় উপাত্ত' : 'Required parameters for optimized decision engine'}
              />
              <div style={{ marginTop: 10 }}>
                {/* Progress bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    {lang === 'bn' ? 'সামগ্রিক পূর্ণতা:' : 'Overall completeness:'}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: activeCompleteness.score >= 80 ? 'var(--primary, #10b981)' : '#f59e0b' }}>
                    {activeCompleteness.score}%
                  </span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${activeCompleteness.score}%`,
                      background: activeCompleteness.score >= 80 ? 'var(--primary, #10b981)' : '#f59e0b',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>

                {/* Missing Items List */}
                {activeCompleteness.missing.length === 0 ? (
                  <div style={{ padding: 12, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#4ade80', fontSize: 12.5 }}>
                    ✓ {lang === 'bn' ? 'সকল প্রয়োজনীয় কৃষি উপাত্ত অন্তর্ভুক্ত রয়েছে।' : 'All essential parameters are registered.'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>
                      {lang === 'bn' ? 'অপূর্ণ উপাত্ত ও তার সুফল:' : 'Missing inputs & impact:'}
                    </span>
                    {activeCompleteness.missing.map(m => (
                      <div
                        key={m.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--line)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 10
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: 12.5, color: 'var(--text)', display: 'block' }}>
                            {lang === 'bn' ? m.label : m.labelEn}
                          </strong>
                          <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                            {lang === 'bn' ? m.desc : m.descEn}
                          </span>
                        </div>
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => {
                            if (m.tab === 'details') setIsEditingDetails(true);
                            else setSubTab(m.tab);
                          }}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {lang === 'bn' ? 'পূরণ করুন →' : 'Fill →'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* 2. Enrich Status Card (P2) */}
            <Card variant="glass">
              <CardHeader
                title={lang === 'bn' ? 'নাসা ও মাটি উপাত্ত সমৃদ্ধকরণ' : 'Environmental Data Telemetry Status'}
                subtitle={lang === 'bn' ? 'NASA POWER, GPM ও SoilGrids সিঙ্ক্রোনাইজেশন' : 'NASA POWER, GPM IMERG and ISRIC SoilGrids sync'}
              />
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'block' }}>
                      {lang === 'bn' ? 'সর্বশেষ সংযোগ অবস্থা:' : 'Telemetry status:'}
                    </span>
                    <strong style={{ fontSize: 13, color: 'var(--water, #38bdf8)' }}>
                      {activeField.power_cell || activeField.soilgrids_soil
                        ? (lang === 'bn' ? 'NASA ও মাটির তথ্য আনা হয়েছে (সক্রিয়)' : 'NASA & SoilGrids telemetry linked')
                        : (lang === 'bn' ? 'আনা যায়নি (অফলাইন মোড)' : 'Offline mode / local cache')
                      }
                    </strong>
                  </div>
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={handleReEnrich}
                    disabled={isEnriching}
                  >
                    {isEnriching ? '...' : (lang === 'bn' ? 'আবার আনুন' : 'Re-enrich')}
                  </Button>
                </div>
                <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.4 }}>
                  {lang === 'bn'
                    ? 'নাসার ৩০ বছরের আবহাওয়া উপাত্ত ও মাটির রাসায়নিক গঠন স্বয়ংক্রিয় যুক্ত করতে "আবার আনুন" ব্যবহার করুন।'
                    : 'Query nearest ISRIC SoilGrids 250m profile and NASA climate baseline for this parcel.'}
                </p>
              </div>
            </Card>

            {/* 3. এই জমির পরামর্শ Mini Card (P2) */}
            <Card variant="glass">
              <CardHeader
                title={lang === 'bn' ? 'এই জমির অনুকূল পরামর্শ' : 'Optimizer Advisory for this Parcel'}
                subtitle={lang === 'bn' ? 'অপ্টিমাইজারের সুপারিশকৃত ৩-মৌসুমের ফসল চক্র' : 'Recommended rotation based on real water & climate constraints'}
              />
              <div style={{ marginTop: 12 }}>
                {isLoadingBaseline ? (
                  <div style={{ padding: 16 }}>
                    <Skeleton height={20} style={{ marginBottom: 8 }} />
                    <Skeleton height={14} width="70%" />
                  </div>
                ) : baselinePlanning ? (
                  <div>
                    <div style={{ padding: 12, borderRadius: 8, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 2 }}>
                        {lang === 'bn' ? 'সুপারিশকৃত ফসল আবর্তন:' : 'Recommended Rotation:'}
                      </span>
                      <strong style={{ fontSize: 15, color: 'var(--leaf, #10b981)' }}>
                        {baselinePlanning.plan_rotation_text_bn || (baselinePlanning.plan_rotation ? baselinePlanning.plan_rotation.join(' → ') : 'সরিষা → মুগডাল → আমন ধান')}
                      </strong>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 12, marginBottom: 14 }}>
                      <div style={{ padding: 8, borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>
                        <span style={{ color: 'var(--text-3)', display: 'block', fontSize: 10.5 }}>{lang === 'bn' ? 'সেচ পানির প্রভাব:' : 'Irrigation Delta:'}</span>
                        <strong style={{ color: 'var(--water, #38bdf8)' }}>
                          {baselinePlanning.plan_irrigation_mm != null ? `${baselinePlanning.plan_irrigation_mm.toFixed(0)} মিমি/বছর` : '--'}
                        </strong>
                      </div>
                      <div style={{ padding: 8, borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>
                        <span style={{ color: 'var(--text-3)', display: 'block', fontSize: 10.5 }}>{lang === 'bn' ? 'ডাল নাইট্রোজেন যোগ:' : 'Legume BNF:'}</span>
                        <strong style={{ color: 'var(--leaf, #10b981)' }}>
                          {baselinePlanning.plan_nitrogen_kg != null ? `+${baselinePlanning.plan_nitrogen_kg.toFixed(0)} কেজি N` : '--'}
                        </strong>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onNavigate && onNavigate('farm_planning')}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      {lang === 'bn' ? 'পরিকল্পনায় বিস্তারিত দেখুন →' : 'View Full Farm Plan →'}
                    </Button>
                  </div>
                ) : (
                  <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                    {lang === 'bn' ? 'পরিকল্পনার তথ্য প্রস্তুত হচ্ছে...' : 'Generating tailored advisory...'}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: মাটি (SOIL PROPERTIES & AUTHENTIC M7 DIAGNOSTICS)                   */}
      {/* ========================================================================= */}
      {subTab === 'soil' && (
        <Card variant="glass">
          <CardHeader
            title={lang === 'bn' ? 'মাটির রাসায়নিক ও ভৌতিক পুষ্টি বৈশিষ্ট্য' : 'Soil Chemical & Hydraulic Diagnostics'}
            subtitle={lang === 'bn' ? 'প্রতিটি মানের পাশে তার নির্ভরযোগ্য তথ্যসূত্র প্রদর্শন করা হয়েছে' : 'Honest source provenance badge attached to every soil property'}
          />

          {!hasRealSoilGrids && (
            <div style={{
              margin: '12px 0 16px 0',
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              fontSize: 12.5,
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <span>
                ℹ️ {lang === 'bn'
                  ? 'এই জমির জন্য সরাসরি SoilGrids গ্রিড ক্যাশ নেই। বর্তমানে মাটির শ্রেণির গড় মান প্রদর্শন করা হচ্ছে।'
                  : 'Direct SoilGrids cache unavailable. Displaying standard mechanical class averages.'}
              </span>
              <Button size="xs" variant="secondary" onClick={handleReEnrich} disabled={isEnriching}>
                {lang === 'bn' ? 'SoilGrids সন্ধান করুন' : 'Query SoilGrids'}
              </Button>
            </div>
          )}

          {/* Key Soil Numbers with SourceChip next to each */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, margin: '16px 0' }}>
            {/* 1. Texture */}
            <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface-2, rgba(255,255,255,0.03))', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{lang === 'bn' ? 'মাটির গঠন (Texture):' : 'Soil Texture Class:'}</span>
                <SourceChip source={hasRealSoilGrids ? 'SoilGrids' : 'class_average'} lang={lang} size="xs" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
                {soilClass.nameBn} ({soilClass.nameEn})
              </div>
            </div>

            {/* 2. Sand % */}
            <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface-2, rgba(255,255,255,0.03))', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{lang === 'bn' ? 'বালি (Sand):' : 'Sand Fraction:'}</span>
                <SourceChip source={hasRealSoilGrids ? 'SoilGrids' : 'class_average'} lang={lang} size="xs" />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--sun, #f59e0b)' }}>
                {sandVal}%
              </div>
            </div>

            {/* 3. Silt % */}
            <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface-2, rgba(255,255,255,0.03))', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{lang === 'bn' ? 'পলি (Silt):' : 'Silt Fraction:'}</span>
                <SourceChip source={hasRealSoilGrids ? 'SoilGrids' : 'class_average'} lang={lang} size="xs" />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--water, #38bdf8)' }}>
                {siltVal}%
              </div>
            </div>

            {/* 4. Clay % */}
            <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface-2, rgba(255,255,255,0.03))', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{lang === 'bn' ? 'কাদা (Clay):' : 'Clay Fraction:'}</span>
                <SourceChip source={hasRealSoilGrids ? 'SoilGrids' : 'class_average'} lang={lang} size="xs" />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--leaf, #10b981)' }}>
                {clayVal}%
              </div>
            </div>

            {/* 5. Soil pH */}
            <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface-2, rgba(255,255,255,0.03))', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{lang === 'bn' ? 'মাটির অম্লতা (pH):' : 'Soil pH:'}</span>
                <SourceChip
                  source={activeField?.soil_ph != null ? 'user' : (activeField?.soilgrids_ph != null ? 'SoilGrids' : 'class_average')}
                  lang={lang}
                  size="xs"
                />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: phVal < 6 ? '#f87171' : phVal > 7.5 ? '#38bdf8' : 'var(--leaf)' }}>
                {phVal}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {phVal < 6 ? 'অম্লীয় (Acidic)' : phVal > 7.5 ? 'ক্ষারীয় (Alkaline)' : 'নিরপেক্ষ (Neutral)'}
              </span>
            </div>

            {/* 6. Organic Matter */}
            <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface-2, rgba(255,255,255,0.03))', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{lang === 'bn' ? 'জৈব পদার্থ (OM):' : 'Organic Matter:'}</span>
                <SourceChip
                  source={activeField?.organic_matter != null ? 'user' : (activeField?.soilgrids_soc != null ? 'SoilGrids' : 'class_average')}
                  lang={lang}
                  size="xs"
                />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--leaf, #10b981)' }}>
                {omVal}%
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {omVal < 1.5 ? 'স্বল্প (Low)' : 'পর্যাপ্ত (Optimal)'}
              </span>
            </div>

            {/* 7. Field Capacity (FC) */}
            <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface-2, rgba(255,255,255,0.03))', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{lang === 'bn' ? 'ফিল্ড ক্যাপাসিটি (FC):' : 'Field Capacity (FC):'}</span>
                <SourceChip source={hasRealSoilGrids ? 'saxton_rawls' : 'class_average'} lang={lang} size="xs" />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--water, #38bdf8)' }}>
                {fcDisplay}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {lang === 'bn' ? 'মাটির পানি ধারণক্ষমতা (৩৩ kPa)' : 'Soil moisture capacity (33 kPa)'}
              </span>
            </div>

            {/* 8. Permanent Wilting Point (PWP) */}
            <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface-2, rgba(255,255,255,0.03))', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{lang === 'bn' ? 'উইল্টিং পয়েন্ট (PWP):' : 'Wilting Point (PWP):'}</span>
                <SourceChip source={hasRealSoilGrids ? 'saxton_rawls' : 'class_average'} lang={lang} size="xs" />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b' }}>
                {pwpDisplay}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {lang === 'bn' ? 'উদ্ভিদের পানি গ্রহণ সীমা (১৫০০ kPa)' : 'Plant wilting threshold (1500 kPa)'}
              </span>
            </div>
          </div>

          {/* Mechanical Composition Bar */}
          <div style={{ marginTop: 20, padding: 16, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                {lang === 'bn' ? 'কণাসমূহের আনুপাতিক বণ্টন (Mechanical Split):' : 'Mechanical Particle Distribution:'}
              </span>
              <SourceChip source={hasRealSoilGrids ? 'SoilGrids' : 'class_average'} lang={lang} size="xs" />
            </div>
            <div style={{ height: 14, display: 'flex', borderRadius: 7, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ width: `${sandVal}%`, background: '#f59e0b' }} title={`Sand: ${sandVal}%`} />
              <div style={{ width: `${siltVal}%`, background: '#38bdf8' }} title={`Silt: ${siltVal}%`} />
              <div style={{ width: `${clayVal}%`, background: '#10b981' }} title={`Clay: ${clayVal}%`} />
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-2)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                {lang === 'bn' ? 'বালি' : 'Sand'}: {sandVal}%
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }} />
                {lang === 'bn' ? 'পলি' : 'Silt'}: {siltVal}%
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                {lang === 'bn' ? 'কাদা' : 'Clay'}: {clayVal}%
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ফসল ও ইতিহাস (BASELINE ROTATION & AUTHENTIC HISTORY) (M5 / M6)     */}
      {/* ========================================================================= */}
      {subTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* 1. Existing Rotation Baseline Input Form (M5) */}
          <Card variant="glass">
            <CardHeader
              title={lang === 'bn' ? 'বিদ্যমান ফসল আবর্তন বেসলাইন' : 'Current Seasonal Rotation Baseline'}
              subtitle={lang === 'bn' ? 'আপনার খামারে প্রচলিত ৩-মৌসুমের ফসল চক্র নির্ধারণ করুন, যা অপ্টিমাইজারের সাথে তুলনার মানদণ্ড হিসেবে ব্যবহৃত হবে।' : 'Configure your actual seasonal rotation baseline to benchmark against MILP optimization strategies.'}
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveBaseline}
                  disabled={isSavingBaseline}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span>{baselineSaved ? '✓' : '💾'}</span>
                  <span>{baselineSaved ? (lang === 'bn' ? 'সংরক্ষিত হয়েছে' : 'Baseline Saved') : (lang === 'bn' ? 'বেসলাইন সংরক্ষণ' : 'Save Baseline')}</span>
                </Button>
              }
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, margin: '16px 0' }}>
              {/* Rabi Crop Selector */}
              <div style={{ background: 'var(--surface-2, rgba(0, 0, 0, 0.15))', padding: 12, borderRadius: 10, border: '1px solid var(--line)' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--leaf)', marginBottom: 6, textTransform: 'uppercase' }}>
                  ১. রবি মৌসুম (Rabi: Nov - Apr)
                </label>
                <select
                  value={existingRotation.rabi}
                  onChange={e => setExistingRotation({ ...existingRotation, rabi: e.target.value })}
                  style={{ width: '100%', background: 'var(--surface-2, #1a2228)', color: 'var(--text, #f8fafc)', border: '1px solid var(--line, #334155)', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontWeight: 600 }}
                >
                  <option value="Boro Rice">বোরো ধান (Boro Rice - High Water)</option>
                  <option value="Wheat">গম (Wheat)</option>
                  <option value="Potato">গোল আলু (Potato - Cash Crop)</option>
                  <option value="Mustard">সরিষা (Mustard - Oilseed)</option>
                  <option value="Lentil">মসুর ডাল (Lentil - Legume BNF)</option>
                  <option value="Chickpea">ছোলা (Chickpea - Legume BNF)</option>
                  <option value="Sunflower">সূর্যমুখী (Sunflower)</option>
                  <option value="Maize">ভুট্টা (Maize)</option>
                  <option value="Tomato">টমেটো (Tomato)</option>
                  <option value="Fallow">পতিত জমি (Fallow / Rest)</option>
                </select>
              </div>

              {/* Kharif-1 Crop Selector */}
              <div style={{ background: 'var(--surface-2, rgba(0, 0, 0, 0.15))', padding: 12, borderRadius: 10, border: '1px solid var(--line)' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--water)', marginBottom: 6, textTransform: 'uppercase' }}>
                  ২. খরিপ-১ মৌসুম (Kharif-1: Apr - Jun)
                </label>
                <select
                  value={existingRotation.kharif1}
                  onChange={e => setExistingRotation({ ...existingRotation, kharif1: e.target.value })}
                  style={{ width: '100%', background: 'var(--surface-2, #1a2228)', color: 'var(--text, #f8fafc)', border: '1px solid var(--line, #334155)', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontWeight: 600 }}
                >
                  <option value="Fallow">পতিত জমি (Fallow / Common Practice)</option>
                  <option value="Aus Rice">আউশ ধান (Aus Rice)</option>
                  <option value="Mungbean">মুগডাল (Mungbean - Legume BNF)</option>
                  <option value="Sesame">তিল (Sesame)</option>
                  <option value="Jute">পাট (Jute - Green Residue)</option>
                  <option value="Maize">গ্রীষ্মকালীন ভুট্টা (Summer Maize)</option>
                </select>
              </div>

              {/* Kharif-2 Crop Selector */}
              <div style={{ background: 'var(--surface-2, rgba(0, 0, 0, 0.15))', padding: 12, borderRadius: 10, border: '1px solid var(--line)' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--sun)', marginBottom: 6, textTransform: 'uppercase' }}>
                  ৩. খরিপ-২ মৌসুম (Kharif-2: Jul - Oct)
                </label>
                <select
                  value={existingRotation.kharif2}
                  onChange={e => setExistingRotation({ ...existingRotation, kharif2: e.target.value })}
                  style={{ width: '100%', background: 'var(--surface-2, #1a2228)', color: 'var(--text, #f8fafc)', border: '1px solid var(--line, #334155)', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontWeight: 600 }}
                >
                  <option value="Rice">রোপা আমন ধান (T.Aman Rice - Monsoon)</option>
                  <option value="Fallow">পতিত জমি (Fallow - Waterlogged Basin)</option>
                </select>
              </div>
            </div>

            {/* Instant Baseline Agronomic Diagnostics (M6) */}
            <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 10, padding: '14px 18px', marginTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--water)' }}>
                  {lang === 'bn' ? 'বিদ্যমান ফসল চক্রের কৃষি-পরিবেশগত মূল্যায়ন:' : 'Baseline Agro-Ecological Diagnostics:'}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-3)', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: 4 }}>
                  {lang === 'bn' ? 'আনুমানিক (মডেল) • উদাহরণমূলক দাম' : 'Estimated (Model) • Illustrative Price'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 12.5 }}>
                <div>
                  <span style={{ color: 'var(--text-3)' }}>{lang === 'bn' ? 'বার্ষিক আনুমানিক লাভ:' : 'Est. Annual Net Margin:'}</span>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--leaf)', marginTop: 2 }}>
                    {baselinePlanning?.baseline_profit_bdt != null
                      ? `৳ ${Math.round(baselinePlanning.baseline_profit_bdt).toLocaleString('en-IN')} / হেক্টর`
                      : (isLoadingBaseline ? '...' : '--')}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                    {lang === 'bn' ? 'মডেল আনুমানিক • উদাহরণমূলক দাম' : 'Model estimate • Illustrative price'}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-3)' }}>{lang === 'bn' ? 'ভূগর্ভস্থ সেচ চাহিদা:' : 'Irrigation Water Load:'}</span>
                  <div style={{ fontSize: 16, fontWeight: 800, color: (baselinePlanning?.baseline_irrigation_mm || 0) > 600 ? '#f87171' : 'var(--water)', marginTop: 2 }}>
                    {baselinePlanning?.baseline_irrigation_mm != null
                      ? `${baselinePlanning.baseline_irrigation_mm.toFixed(1)} মিমি`
                      : (isLoadingBaseline ? '...' : '--')}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                    {lang === 'bn' ? 'আনুমানিক (মডেল)' : 'Estimated (Model)'}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-3)' }}>{lang === 'bn' ? 'ডাল ফসল / নাইট্রোজেন:' : 'Legume BNF Balance:'}</span>
                  <div style={{ fontSize: 16, fontWeight: 800, color: (baselinePlanning?.baseline_nitrogen_kg || 0) > 0 ? 'var(--leaf)' : '#f59e0b', marginTop: 2 }}>
                    {baselinePlanning?.baseline_nitrogen_kg != null
                      ? `${baselinePlanning.baseline_nitrogen_kg > 0 ? '+' : ''}${baselinePlanning.baseline_nitrogen_kg.toFixed(1)} কেজি N/হেক্টর`
                      : (isLoadingBaseline ? '...' : '০ কেজি')}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                    {lang === 'bn' ? 'আনুমানিক (মডেল)' : 'Estimated (Model)'}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-3)' }}>{lang === 'bn' ? 'নগ্ন মাটি অনাবৃত দিন:' : 'Bare Soil Exposure:'}</span>
                  <div style={{ fontSize: 16, fontWeight: 800, color: (baselinePlanning?.baseline_bare_days || 0) > 60 ? '#f87171' : 'var(--leaf)', marginTop: 2 }}>
                    {baselinePlanning?.baseline_bare_days != null
                      ? `${baselinePlanning.baseline_bare_days} দিন`
                      : (isLoadingBaseline ? '...' : '--')}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                    {lang === 'bn' ? 'আনুমানিক (মডেল)' : 'Estimated (Model)'}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 2. Historical Past Yield Records (M6) */}
          <Card variant="glass">
            <CardHeader
              title={lang === 'bn' ? 'ঐতিহাসিক ফলন ও সেচ লগ' : 'Historical Past Yield & Irrigation Log'}
              subtitle={lang === 'bn' ? 'বিগত মৌসুমসমূহের নথিভুক্ত ফলন ও উপাত্ত' : 'Archived seasonal yield logs and data'}
            />

            {isLoadingHistory ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)' }}>
                {lang === 'bn' ? 'উপাত্ত লোড হচ্ছে...' : 'Loading records...'}
              </div>
            ) : fieldHistory.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <EmptyState
                  icon="📜"
                  title={lang === 'bn' ? 'এখনো কোনো রেকর্ড নেই' : 'No records yet'}
                  description={lang === 'bn' ? 'এই জমির জন্য পূর্ববর্তী কোনো ফসলের ইতিহাস নেই। নিচে বিগত মৌসুমের ফলন তথ্য যুক্ত করুন।' : 'No historical crop records found for this field. Add past seasonal records below.'}
                />
              </div>
            ) : (
              <div style={{ overflowX: 'auto', marginTop: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--text-3)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>{lang === 'bn' ? 'মৌসুম ও বছর' : 'Season & Year'}</th>
                      <th style={{ padding: '10px 12px' }}>{lang === 'bn' ? 'উৎপাদিত ফসল' : 'Crop'}</th>
                      <th style={{ padding: '10px 12px' }}>{lang === 'bn' ? 'ফলন (দ্বৈত একক)' : 'Yield (Dual Unit)'}</th>
                      <th style={{ padding: '10px 12px' }}>{lang === 'bn' ? 'সেচ' : 'Water Applied'}</th>
                      <th style={{ padding: '10px 12px' }}>{lang === 'bn' ? 'মন্তব্য / মাটির প্রভাব' : 'Notes / Soil Impact'}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>{lang === 'bn' ? 'পদক্ষেপ' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fieldHistory.map((row, idx) => {
                      let yieldStr = '--';
                      if (row.yield_ton_per_ha != null) {
                        const tHa = Number(row.yield_ton_per_ha);
                        const mBigha = tonPerHaToMaundPerBigha(tHa);
                        yieldStr = `${tHa.toFixed(2)} t/ha (${mBigha.toFixed(1)} মণ/বিঘা)`;
                      }
                      const waterStr = row.water_applied_mm != null ? `${row.water_applied_mm} মিমি` : '--';
                      return (
                        <tr key={row.id || idx} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text)' }}>
                            {row.year ? `${row.year} ` : ''}{normalizeSeasonCode(row.season, lang)}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--leaf)', fontWeight: 700 }}>
                            {row.crop || '--'}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--water)', fontWeight: 600 }}>
                            {yieldStr}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--sun)' }}>
                            {waterStr}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-2)' }}>
                            {row.notes || '--'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button
                              type="button"
                              title={lang === 'bn' ? 'রেকর্ড মুছুন' : 'Delete record'}
                              onClick={() => handleDeleteHistory(row.id)}
                              style={{
                                background: 'transparent',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: 6,
                                padding: '4px 8px',
                                color: '#f87171',
                                cursor: 'pointer',
                                fontSize: 12
                              }}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Form: Add Past Season Record (M6) */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>➕</span>
                <span>{lang === 'bn' ? 'বিগত মৌসুমের রেকর্ড যোগ করুন' : 'Add Past Seasonal Record'}</span>
              </div>
              <form onSubmit={handleAddHistory}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                      {lang === 'bn' ? 'মৌসুম' : 'Season'} *
                    </label>
                    <select
                      value={newHistorySeason}
                      onChange={e => setNewHistorySeason(e.target.value)}
                      style={{ width: '100%', background: 'var(--surface-2, #1a2228)', color: 'var(--text, #f8fafc)', border: '1px solid var(--line, #334155)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5 }}
                    >
                      <option value="রবি">রবি (Rabi: Nov - Apr)</option>
                      <option value="খরিপ-১">খরিপ-১ (Kharif-1: Apr - Jun)</option>
                      <option value="খরিপ-২">খরিপ-২ (Kharif-2: Jul - Oct)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                      {lang === 'bn' ? 'বছর' : 'Year'} *
                    </label>
                    <input
                      type="number"
                      min="2000"
                      max="2035"
                      value={newHistoryYear}
                      onChange={e => setNewHistoryYear(e.target.value)}
                      style={{ width: '100%', background: 'var(--surface-2, #1a2228)', color: 'var(--text, #f8fafc)', border: '1px solid var(--line, #334155)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                      {lang === 'bn' ? 'উৎপাদিত ফসল (অনুমোদিত)' : 'Crop Name (Season-filtered)'} *
                    </label>
                    <select
                      value={newHistoryCrop}
                      onChange={e => setNewHistoryCrop(e.target.value)}
                      style={{ width: '100%', background: 'var(--surface-2, #1a2228)', color: 'var(--text, #f8fafc)', border: '1px solid var(--line, #334155)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5 }}
                    >
                      <option value="">{lang === 'bn' ? '-- ফসল নির্বাচন করুন --' : '-- Select Crop --'}</option>
                      {availableSeasonCrops.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    {newHistoryCrop === '__other__' && (
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'ফসলের নাম লিখুন' : 'Enter custom crop name'}
                        value={customCropName}
                        onChange={e => setCustomCropName(e.target.value)}
                        style={{ marginTop: 6, width: '100%', background: 'var(--surface-2, #1a2228)', color: 'var(--text, #f8fafc)', border: '1px solid var(--line, #334155)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5 }}
                      />
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                      {lang === 'bn' ? 'ফলন ও একক' : 'Yield & Unit'} *
                    </label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newHistoryYield}
                        onChange={e => setNewHistoryYield(e.target.value)}
                        style={{ flex: 1, background: 'var(--surface-2, #1a2228)', color: 'var(--text, #f8fafc)', border: '1px solid var(--line, #334155)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5 }}
                      />
                      <select
                        value={newHistoryYieldUnit}
                        onChange={e => setNewHistoryYieldUnit(e.target.value)}
                        style={{ background: 'var(--surface-2, #1a2228)', color: 'var(--text, #f8fafc)', border: '1px solid var(--line, #334155)', borderRadius: 8, padding: '8px 6px', fontSize: 11.5 }}
                      >
                        <option value="maund_bigha">মণ/বিঘা</option>
                        <option value="ton_ha">t/ha</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                      {lang === 'bn' ? 'সেচ (মিমি, ঐচ্ছিক)' : 'Water (mm, opt)'}
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="e.g. 400"
                      value={newHistoryWater}
                      onChange={e => setNewHistoryWater(e.target.value)}
                      style={{ width: '100%', background: 'var(--surface-2, #1a2228)', color: 'var(--text, #f8fafc)', border: '1px solid var(--line, #334155)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                      {lang === 'bn' ? 'মন্তব্য (ঐচ্ছিক)' : 'Notes (opt)'}
                    </label>
                    <input
                      type="text"
                      placeholder={lang === 'bn' ? 'মাটির অবস্থা বা জাত' : 'Soil state or variety'}
                      value={newHistoryNotes}
                      onChange={e => setNewHistoryNotes(e.target.value)}
                      style={{ width: '100%', background: 'var(--surface-2, #1a2228)', color: 'var(--text, #f8fafc)', border: '1px solid var(--line, #334155)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5 }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={isSubmittingHistory || !newHistoryCrop.trim() || !newHistoryYield}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span>{isSubmittingHistory ? '...' : '💾'}</span>
                    <span>{isSubmittingHistory ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (lang === 'bn' ? 'রেকর্ড সংরক্ষণ করুন' : 'Save Record')}</span>
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {mapToast && (
        <Toast
          type={mapToast.type}
          message={mapToast.message}
          action={mapToast.action}
          onClose={() => setMapToast(null)}
        />
      )}
    </div>
  );
}

export default MyFarmWorkspaceView;
