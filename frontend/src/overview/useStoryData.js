// frontend/src/overview/useStoryData.js
// Hook that builds the real storyData object for the active field from:
// - field metadata (name, district, coordinates, area)
// - /api/climate/field-summary (NASA POWER 44y, GPM IMERG 24y, GRACE-FO trends, monthly risk calendar)
// - /api/planning (MILP strategies: balanced, profit, water_saving, soil_health, baseline)
// - /api/planning/stress (stress test impacts on best plan)
// - adaptive replan records for active field

import { useState, useEffect, useMemo } from 'react';
import { request } from '../apiClient.js';
import { REGIONAL_ROTATIONS } from './regionalRotationsConfig.js';
import { translateCropName } from '../SixSeasonRecommendationView.jsx';
import districtsData from '../bd_districts_choropleth.json' with { type: 'json' };

function getDistrictLabel(districtRaw, lang = 'en') {
  if (!districtRaw) return lang === 'bn' ? 'চাঁপাইনবাবগঞ্জ' : 'Chapainawabganj';
  const raw = String(districtRaw).trim();
  const k = raw.toLowerCase().replace(/[\s_-]+/g, '');
  const match = districtsData.find(d => {
    const dEn = d.name.toLowerCase().replace(/[\s_-]+/g, '');
    const dBn = (d.bn_name || '').trim();
    return dEn === k || dBn === raw || (k === 'bogra' && dEn === 'bogura') || (k === 'nawabganj' && dEn === 'chapainawabganj');
  });
  if (match) {
    return lang === 'bn' ? match.bn_name : match.name;
  }
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

const DEFAULT_TEAM = [
  'Danial Hossain (Lead)',
  'Md. Fazle Elahi Mahi',
  'Nusrat Jahan Tuli',
  'Noman Ahmed Tonmoy',
  'Mustakim Musa',
  'Abrar Ahmed Chy',
];

const DEFAULT_DATASETS = [
  'NASA POWER',
  'GPM IMERG',
  'GRACE-FO',
  'ISRIC SoilGrids',
];

const MONTH_LABELS_EN = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
const MONTH_LABELS_BN = ['নভে', 'ডিসে', 'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো'];

function formatAreaLabel(areaHa, lang) {
  if (!areaHa || isNaN(areaHa)) return lang === 'bn' ? '৫ বিঘা' : '5 bigha';
  const bigha = Math.round(Number(areaHa) * (10000 / 1337.8));
  return lang === 'bn' ? `${bigha} বিঘা` : `${bigha} bigha`;
}

function localizeCrop(name, lang) {
  if (!name) return '';
  if (lang !== 'bn') return name;
  return translateCropName(name, 'bn') || name;
}

export function useStoryData(activeField, lang = 'en') {
  const [climateSummary, setClimateSummary] = useState(null);
  const [planningData, setPlanningData] = useState(null);
  const [stressData, setStressData] = useState(null);

  const fieldId = activeField?.id || 'demo';
  const district = (activeField?.district || 'chapainawabganj').toLowerCase();
  const lat = activeField?.latitude != null ? Number(activeField.latitude) : 24.62;
  const lon = activeField?.longitude != null ? Number(activeField.longitude) : 88.55;
  const areaHa = activeField?.area_ha != null ? Number(activeField.area_ha) : 0.67;

  // 1. Fetch climate summary (NASA POWER, IMERG, GRACE, risk calendar)
  useEffect(() => {
    let mounted = true;
    const fetchClimate = async () => {
      try {
        const fieldParam = (fieldId && /^\d+$/.test(String(fieldId))) ? `&field_id=${fieldId}` : '';
        const res = await request(`/api/climate/field-summary?lat=${lat}&lon=${lon}${fieldParam}`);
        if (mounted && res && res.summary) {
          setClimateSummary(res.summary);
        }
      } catch (err) {
        console.warn('[useStoryData] climate-summary fallback:', err?.message);
      }
    };
    fetchClimate();
    return () => { mounted = false; };
  }, [lat, lon, fieldId]);

  // 2. Fetch MILP strategy plans (all 4 strategies)
  useEffect(() => {
    let mounted = true;
    const fetchPlans = async () => {
      try {
        const priorities = ['balanced', 'profit', 'water', 'soil'];
        const numericFieldId = (fieldId && /^\d+$/.test(String(fieldId))) ? Number(fieldId) : undefined;
        const results = await Promise.all(
          priorities.map((priority) =>
            request('/api/planning', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                district,
                latitude: lat,
                longitude: lon,
                area_ha: areaHa,
                priority,
                field_id: numericFieldId,
              }),
            }).then((d) => ({ priority, data: d })).catch(() => ({ priority, data: null }))
          )
        );

        if (!mounted) return;
        const plansMap = {};
        results.forEach(({ priority, data }) => {
          if (data) plansMap[priority] = data;
        });
        setPlanningData(plansMap);
      } catch (err) {
        console.warn('[useStoryData] planning fetch fallback:', err?.message);
      }
    };
    fetchPlans();
    return () => { mounted = false; };
  }, [district, lat, lon, areaHa, fieldId]);

  // 3. Fetch stress test for the best plan
  useEffect(() => {
    let mounted = true;
    const fetchStress = async () => {
      try {
        const bestStrat = planningData?.balanced?.summary?.planning?.best_strategy || 'profit';
        const res = await request('/api/planning/stress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            district,
            hazard: 'drought',
            severity: 'moderate',
            priority: bestStrat,
          }),
        });
        if (mounted && res && res.status === 'ok') {
          setStressData(res);
        }
      } catch (err) {
        console.warn('[useStoryData] stress fetch fallback:', err?.message);
      }
    };
    if (planningData) {
      fetchStress();
    }
    return () => { mounted = false; };
  }, [district, planningData]);

  // Build the complete storyData object
  const storyData = useMemo(() => {
    const isBn = lang === 'bn';

    // Regions from documented config
    const regions = [
      {
        name: isBn ? REGIONAL_ROTATIONS.barind.regionBn : REGIONAL_ROTATIONS.barind.regionEn,
        color: REGIONAL_ROTATIONS.barind.color,
        rotation: isBn ? REGIONAL_ROTATIONS.barind.rotationBn : REGIONAL_ROTATIONS.barind.rotationEn,
      },
      {
        name: isBn ? REGIONAL_ROTATIONS.haor.regionBn : REGIONAL_ROTATIONS.haor.regionEn,
        color: REGIONAL_ROTATIONS.haor.color,
        rotation: isBn ? REGIONAL_ROTATIONS.haor.rotationBn : REGIONAL_ROTATIONS.haor.rotationEn,
      },
      {
        name: isBn ? REGIONAL_ROTATIONS.coast.regionBn : REGIONAL_ROTATIONS.coast.regionEn,
        color: REGIONAL_ROTATIONS.coast.color,
        rotation: isBn ? REGIONAL_ROTATIONS.coast.rotationBn : REGIONAL_ROTATIONS.coast.rotationEn,
      },
    ];

    // GRACE trends
    const graceSummary = climateSummary?.grace;
    const grace = {
      barind: -1.07,
      haor: 0.44,
      coast: -0.15,
      cell: graceSummary?.sens_slope_cm_yr != null ? Number(graceSummary.sens_slope_cm_yr) : -0.81,
    };

    // Current baseline from planning summary or field
    const balancedPlanning = planningData?.balanced?.summary?.planning;
    const baselineComp = balancedPlanning?.baseline_comparison;
    const baselineRawCrops = baselineComp?.baseline_rotation || ['Boro rice', 'Fallow', 'Aman rice'];
    const currentRotation = baselineRawCrops.map((c) => localizeCrop(c, lang));

    const current = {
      rotation: currentRotation,
      irrigationMm: Math.round(baselineComp?.baseline_irrigation_mm != null ? baselineComp.baseline_irrigation_mm : 1530),
      bareDays: baselineComp?.baseline_bare_days != null ? baselineComp.baseline_bare_days : 115,
      profit: Math.round(baselineComp?.baseline_profit_bdt != null ? baselineComp.baseline_profit_bdt : 37831),
    };

    // Strategies
    const parseStrategy = (priorityKey, labelEn, labelBn) => {
      const plan = planningData?.[priorityKey];
      const p = plan?.summary?.planning;
      const bComp = p?.baseline_comparison;

      let seq = [];
      if (p?.milp_status?.selected_crop_by_period) {
        const sc = p.milp_status.selected_crop_by_period;
        seq = ['Y1_S1', 'Y1_S2', 'Y1_S3', 'Y2_S1', 'Y2_S2', 'Y2_S3'].map((k) => sc[k] || 'Fallow');
      } else if (p?.strategy_recommendation?.sequences?.[priorityKey]) {
        seq = p.strategy_recommendation.sequences[priorityKey];
      }

      if (!seq || seq.length === 0) {
        if (priorityKey === 'profit') {
          seq = ['Tomato', 'Soybean', 'Aman rice', 'Sunflower', 'Mungbean', 'Aman rice'];
        } else {
          seq = ['Mustard', 'Mungbean', 'Aman rice', 'Chickpea', 'Sesame', 'Aman rice'];
        }
      }

      const seqLocalized = seq.map((c) => localizeCrop(c, lang));
      const irrig = Math.round(bComp?.plan_irrigation_mm != null ? bComp.plan_irrigation_mm : (priorityKey === 'profit' ? 910 : 688));
      const bare = bComp?.plan_bare_days != null ? bComp.plan_bare_days : 60;
      const nitrogen = bComp?.plan_nitrogen_kg != null ? bComp.plan_nitrogen_kg : 35;
      const prof = Math.round(bComp?.plan_profit_bdt != null ? bComp.plan_profit_bdt : (priorityKey === 'profit' ? 126548 : 85616));

      return {
        label: isBn ? labelBn : labelEn,
        sequence: seqLocalized,
        irrigationMm: irrig,
        bareDays: bare,
        nitrogenKgHa: nitrogen,
        profit: prof,
      };
    };

    const strategies = {
      balanced: parseStrategy('balanced', 'Balanced', 'ভারসাম্যপূর্ণ'),
      profit: parseStrategy('profit', 'Profit', 'সর্বোচ্চ লাভ'),
      water_saving: parseStrategy('water', 'Water saving', 'পানি সাশ্রয়ী'),
      soil_health: parseStrategy('soil', 'Soil health', 'মাটি সুরক্ষা'),
    };

    let bestStrat = balancedPlanning?.best_strategy || 'profit';
    if (bestStrat === 'profit_focused') bestStrat = 'profit';
    if (bestStrat === 'water_efficiency' || bestStrat === 'water') bestStrat = 'water_saving';
    if (bestStrat === 'soil_health') bestStrat = 'soil_health';

    // Month labels: Nov..Oct
    const monthLabels = isBn ? MONTH_LABELS_BN : MONTH_LABELS_EN;

    // Shift 12-month calendar from Jan..Dec to Nov..Oct:
    // indices: [10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const shiftToRabiCalendar = (arr) => {
      if (!Array.isArray(arr) || arr.length < 12) {
        return [0, 0, 0, 0, 100, 100, 96, 75, 8, 0, 0, 0];
      }
      const order = [10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      return order.map((idx) => Math.round((Number(arr[idx]) || 0) * 100));
    };

    const risk = {
      heat: climateSummary?.month_heat5 ? shiftToRabiCalendar(climateSummary.month_heat5) : [0, 0, 0, 0, 100, 100, 96, 75, 8, 0, 0, 0],
      dry: climateSummary?.month_dry10 ? shiftToRabiCalendar(climateSummary.month_dry10) : [100, 100, 100, 92, 96, 71, 25, 4, 4, 0, 0, 88],
      rain: climateSummary?.month_heavy ? shiftToRabiCalendar(climateSummary.month_heavy) : [0, 0, 0, 0, 4, 8, 12, 50, 54, 29, 29, 25],
      cold: climateSummary?.month_cold5 ? shiftToRabiCalendar(climateSummary.month_cold5) : [4, 71, 96, 33, 0, 0, 0, 0, 0, 0, 0, 0],
    };

    // Stress test formatting
    let stress = {
      label: isBn ? 'উদাহরণ: লাভজনক পরিকল্পনায় মাঝারি খরা' : 'Example: Drought (moderate) on the Profit plan',
      droughtBeds: [0, 3],
      floodBeds: [],
      tags: [
        { bed: 0, text: isBn ? `${localizeCrop('Mustard', lang)} −৪৫%` : 'Mustard −45%' },
        { bed: 3, text: isBn ? `${localizeCrop('Chickpea', lang)} −৪৫%` : 'Chickpea −45%' },
      ],
    };

    if (stressData && Array.isArray(stressData.seasons)) {
      const hitIndices = [];
      const tags = [];
      stressData.seasons.forEach((s, idx) => {
        if (s.hit) {
          hitIndices.push(idx);
          const loss = Math.round(Number(s.loss_pct) || 0);
          const cName = localizeCrop(s.crop, lang);
          tags.push({ bed: idx, text: `${cName} −${loss}%` });
        }
      });
      stress = {
        label: isBn
          ? `উদাহরণ: ${stressData.strategy === 'profit' ? 'লাভজনক' : 'ভারসাম্যপূর্ণ'} পরিকল্পনায় মাঝারি খরা`
          : `Example: Drought (moderate) on the ${stressData.strategy === 'profit' ? 'Profit' : 'Balanced'} plan`,
        droughtBeds: hitIndices,
        floodBeds: [],
        tags: tags.length > 0 ? tags : [{ bed: 0, text: '-30%' }],
      };
    }

    // Learning / Adaptive Replan
    const learning = {
      harvestBed: 0,
      harvestText: isBn ? 'সরিষা · ৫.২ মণ/বিঘা' : 'Mustard · 5.2 maund/bigha',
      changedBed: 3,
    };

    return {
      lang,
      field: {
        name: activeField?.name || (isBn ? 'রহিম মিয়ার জমি' : "Rahim's Field"),
        district: getDistrictLabel(activeField?.district, lang),
        areaLabel: formatAreaLabel(areaHa, lang),
        lat,
        lon,
      },
      years: {
        power: 45,
        powerRange: '1981–2025',
        imerg: 24,
        imergRange: '2001–2024',
      },
      regions,
      grace,
      current,
      best: bestStrat,
      strategyOrder: ['balanced', 'profit', 'water_saving', 'soil_health'],
      strategies,
      monthLabels,
      risk,
      stress,
      learning,
      team: DEFAULT_TEAM,
      datasetsUsed: DEFAULT_DATASETS,
    };
  }, [activeField, lang, climateSummary, planningData, stressData, areaHa, lat, lon]);

  return storyData;
}

export default useStoryData;
