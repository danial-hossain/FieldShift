// frontend/src/research3d/Comparison3Way3D.jsx
// Interactive 4-Row Multi-Algorithm Parallel Season Timelines (Existing vs MILP vs RL vs Rule-Based)
// Replaces flat coloured squares with meaningful multi-season timelines where:
// - Rows represent Existing Baseline, MILP, RL, and Rule-Based methods
// - 6 season blocks per row (Year 1 S1-S3, Year 2 S1-S3)
// - Block height corresponds to water use (mm)
// - Block color corresponds to botanical crop type
// - Full data grounding with zero fabricated fallbacks

import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Research3DScene } from './Research3DScene.jsx';
import { extractFirstCrop, parseFiniteMetric } from '../comparisonLabEngine.js';

export { extractFirstCrop, parseFiniteMetric };

const PERIOD_LABELS = [
  { id: 'Y1_S1', labelEn: 'Y1 Rabi (Winter)', labelBn: 'বছর ১ রবি (শীত)' },
  { id: 'Y1_S2', labelEn: 'Y1 Kharif-1 (Pre-Monsoon)', labelBn: 'বছর ১ খরিফ-১' },
  { id: 'Y1_S3', labelEn: 'Y1 Kharif-2 (Monsoon)', labelBn: 'বছর ১ খরিফ-২ (বর্ষা)' },
  { id: 'Y2_S1', labelEn: 'Y2 Rabi (Winter)', labelBn: 'বছর ২ রবি (শীত)' },
  { id: 'Y2_S2', labelEn: 'Y2 Kharif-1 (Pre-Monsoon)', labelBn: 'বছর ২ খরিফ-১' },
  { id: 'Y2_S3', labelEn: 'Y2 Kharif-2 (Monsoon)', labelBn: 'বছর ২ খরিফ-২ (বর্ষা)' },
];

function getCropWaterMm(method, index) {
  const period = PERIOD_LABELS[index]?.id;
  return parseFiniteMetric(method?.waterByPeriod?.[period] ?? method?.water_by_period_mm?.[period]);
}

function getCropColor(cropName) {
  if (!cropName) return '#475569';
  const key = String(cropName).toLowerCase().trim();
  if (key.includes('fallow') || key === 'পতিত') return '#475569';
  if (key.includes('rice') || key.includes('ধান')) return '#10b981';
  if (key.includes('wheat') || key.includes('গম')) return '#f59e0b';
  if (key.includes('maize') || key.includes('ভুট্টা')) return '#eab308';
  if (key.includes('potato') || key.includes('আলু')) return '#06b6d4';
  if (key.includes('lentil') || key.includes('chickpea') || key.includes('mungbean') || key.includes('ডাল')) return '#84cc16';
  if (key.includes('mustard') || key.includes('সরিষা')) return '#fbbf24';
  if (key.includes('sunflower') || key.includes('সূর্যমুখী')) return '#f97316';
  if (key.includes('sesame') || key.includes('তিল')) return '#a855f7';
  if (key.includes('soybean') || key.includes('সয়াবিন')) return '#34d399';
  return '#38bdf8';
}

function parseRotationList(rotationSource) {
  if (!rotationSource) return [];
  if (Array.isArray(rotationSource)) return rotationSource;
  if (typeof rotationSource === 'object') {
    const vals = Object.values(rotationSource);
    if (vals.length > 0) return vals;
  }
  if (typeof rotationSource === 'string') {
    if (rotationSource.includes('->')) return rotationSource.split('->').map(s => s.trim());
    if (rotationSource.includes('→')) return rotationSource.split('→').map(s => s.trim());
    return [rotationSource.trim()];
  }
  return [];
}

export function Comparison3Way3D({
  labData,
  activeField,
  priority = 'balanced',
  lang = 'bn',
}) {
  const [viewFormat, setViewFormat] = useState('both'); // 'both' | 'chart' | '3d'
  const milpRaw = labData?.methods?.find?.(m => m.id === 'milp') || labData?.comparison?.milp;
  const rlRaw = labData?.methods?.find?.(m => m.id === 'rl') || labData?.comparison?.rl;
  const ruleRaw = labData?.methods?.find?.(m => m.id === 'rule_based') || labData?.comparison?.rule_based;
  const existingRaw = labData?.methods?.find?.(m => m.id === 'existing_rotation') || null;

  // Extract metrics strictly without invented fallbacks
  const milp = useMemo(() => ({
    crop: extractFirstCrop(milpRaw),
    profit: parseFiniteMetric(milpRaw?.profit_bdt_per_ha ?? milpRaw?.total_field_profit_bdt ?? milpRaw?.profit),
    water: parseFiniteMetric(milpRaw?.water_requirement_mm ?? milpRaw?.water),
    yield: parseFiniteMetric(milpRaw?.yield),
    rotation: parseRotationList(milpRaw?.rotation || milpRaw?.rotation_sequence),
  }), [milpRaw]);

  const rl = useMemo(() => ({
    crop: extractFirstCrop(rlRaw),
    profit: parseFiniteMetric(rlRaw?.profit_bdt_per_ha ?? rlRaw?.total_field_profit_bdt ?? rlRaw?.profit),
    water: parseFiniteMetric(rlRaw?.water_requirement_mm ?? rlRaw?.water),
    yield: parseFiniteMetric(rlRaw?.yield),
    rotation: parseRotationList(rlRaw?.rotation || rlRaw?.rotation_sequence),
  }), [rlRaw]);

  const rule = useMemo(() => ({
    crop: extractFirstCrop(ruleRaw),
    profit: parseFiniteMetric(ruleRaw?.profit_bdt_per_ha ?? ruleRaw?.total_field_profit_bdt ?? ruleRaw?.profit),
    water: parseFiniteMetric(ruleRaw?.water_requirement_mm ?? ruleRaw?.water),
    yield: parseFiniteMetric(ruleRaw?.yield),
    rotation: parseRotationList(ruleRaw?.rotation || ruleRaw?.rotation_sequence),
  }), [ruleRaw]);

  const existing = useMemo(() => {
    const crops = parseRotationList(existingRaw?.rotation || existingRaw?.rotation_sequence);
    return {
      name: lang === 'bn' ? 'সংরক্ষিত আবর্তন প্যাটার্ন' : 'Saved Farmer Rotation Pattern',
      color: '#94a3b8',
      rotation: crops,
      profit: parseFiniteMetric(existingRaw?.profit_bdt_per_ha),
      water: parseFiniteMetric(existingRaw?.water_requirement_mm),
      waterByPeriod: existingRaw?.water_by_period_mm,
    };
  }, [existingRaw, lang]);

  const rows = useMemo(() => {
    const result = [
      ...(existingRaw ? [{
      id: 'existing',
      label: lang === 'bn' ? 'সংরক্ষিত কৃষক আবর্তন' : 'Saved Farmer Rotation',
      color: '#94a3b8',
      badge: lang === 'bn' ? 'প্রক্ষেপিত রেফারেন্স' : 'Projected Baseline',
      crops: existing.rotation,
      profit: existing.profit,
      water: existing.water,
      waterByPeriod: existing.waterByPeriod,
      x: -6.0,
      }] : []),
    {
      id: 'milp',
      label: lang === 'bn' ? '২. PuLP CBC MILP (গাণিতিক অপ্টিমাম)' : '2. PuLP CBC MILP Optimum',
      color: '#00df81',
      badge: lang === 'bn' ? 'গ্লোবাল অপটিমাম' : 'Global Optimum',
      crops: milp.rotation.slice(0, 6),
      profit: milp.profit,
      water: milp.water,
      waterByPeriod: milpRaw?.water_by_period_mm,
      x: -2.0,
    },
    {
      id: 'rl',
      label: lang === 'bn' ? '৩. Q-Learning RL (অভিযোজিত পলিসি)' : '3. Sequential Q-Learning RL',
      color: '#38bdf8',
      badge: lang === 'bn' ? 'অভিযোজিত পলিসি' : 'Adaptive Policy',
      crops: rl.rotation.slice(0, 6),
      profit: rl.profit,
      water: rl.water,
      waterByPeriod: rlRaw?.water_by_period_mm,
      x: 2.0,
    },
    {
      id: 'rule_based',
      label: lang === 'bn' ? '৪. কৃষিতাত্ত্বিক নিয়ম (Agronomic Rule Baseline)' : '4. Agronomic Rule Baseline',
      color: '#f59e0b',
      badge: lang === 'bn' ? 'হিউরিস্টিক নিয়ম' : 'Agronomic Rule',
      crops: rule.rotation.slice(0, 6),
      profit: rule.profit,
      water: rule.water,
      waterByPeriod: ruleRaw?.water_by_period_mm,
      x: 6.0,
    }];
    return result;
  }, [existingRaw, existing, milp, milpRaw, rl, rlRaw, rule, ruleRaw, lang]);

  const handleSceneReady = ({ scene }) => {
    const parentGroup = new THREE.Group();

    // Render 4 parallel rows in 3D
    rows.forEach((row) => {
      const rowGroup = new THREE.Group();
      rowGroup.position.set(row.x, 0, 0);

      // 3D Soil Bed for the algorithm track
      const bedGeo = new THREE.BoxGeometry(2.4, 0.25, 11.0);
      const bedMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.95 });
      const bed = new THREE.Mesh(bedGeo, bedMat);
      bed.position.y = -0.125;
      bed.receiveShadow = true;
      rowGroup.add(bed);

      // Boundary Line in algorithm color
      const trackGeo = new THREE.BoxGeometry(2.45, 0.05, 11.05);
      const trackMat = new THREE.MeshBasicMaterial({ color: row.color });
      const track = new THREE.Mesh(trackGeo, trackMat);
      track.position.y = 0.02;
      rowGroup.add(track);

      // 6 Season Blocks per row (along z: -4.5 to +4.5)
      row.crops.forEach((crop, sIdx) => {
        const zPos = -4.2 + sIdx * 1.68;
        const waterMm = getCropWaterMm(row, sIdx);
        const blockHeight = waterMm === null ? 0.3 : Math.max(0.3, (waterMm / 800) * 2.2);
        const cColor = getCropColor(crop);

        const blockGeo = new THREE.BoxGeometry(1.9, blockHeight, 1.4);
        const blockMat = new THREE.MeshStandardMaterial({
          color: cColor,
          roughness: 0.5,
          metalness: 0.1,
        });
        const blockMesh = new THREE.Mesh(blockGeo, blockMat);
        blockMesh.position.set(0, blockHeight / 2 + 0.05, zPos);
        blockMesh.castShadow = true;
        blockMesh.receiveShadow = true;
        rowGroup.add(blockMesh);
      });

      parentGroup.add(rowGroup);
    });

    scene.add(parentGroup);
  };

  return (
    <div className="comparison-3way-container" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Visual Header & Format Switch */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📊</span>
            <span>{lang === 'bn' ? 'ঘূর্ণন কৌশল তুলনা (সংরক্ষিত আবর্তন উপলভ্য হলে দেখানো হবে)' : 'Rotation Strategy Comparison (saved rotation shown when available)'}</span>
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#94a3b8' }}>
            {lang === 'bn'
              ? 'মৌসুমি রঙ ফসলের শ্রেণি দেখায়; ব্লকের উচ্চতা কেবল API-তে প্রাপ্ত সেচ চাহিদা দেখায়।'
              : 'Crop colors show crop type; block height uses only irrigation requirements returned by the API.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, background: 'rgba(15, 23, 42, 0.6)', padding: 4, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            type="button"
            className={`btn ${viewFormat === 'both' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewFormat('both')}
            style={{ fontSize: 11.5, padding: '4px 10px', borderRadius: 6 }}
          >
            {lang === 'bn' ? 'উভয় ভিউ' : 'Both'}
          </button>
          <button
            type="button"
            className={`btn ${viewFormat === 'chart' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewFormat('chart')}
            style={{ fontSize: 11.5, padding: '4px 10px', borderRadius: 6 }}
          >
            {lang === 'bn' ? '২ডি টাইমলাইন' : '2D Timelines'}
          </button>
          <button
            type="button"
            className={`btn ${viewFormat === '3d' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewFormat('3d')}
            style={{ fontSize: 11.5, padding: '4px 10px', borderRadius: 6 }}
          >
            {lang === 'bn' ? '৩ডি হাইট ব্লক' : '3D Water Height'}
          </button>
        </div>
      </div>

      {/* 2D 4-ROW PARALLEL TIMELINE CHART */}
      {(viewFormat === 'both' || viewFormat === 'chart') && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          borderRadius: 14,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {/* Season Header Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '260px repeat(6, 1fr) 140px', gap: 8, paddingBottom: 6, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              {lang === 'bn' ? 'পদ্ধতি / স্ট্র্যাটেজি' : 'Algorithm / Strategy'}
            </span>
            {PERIOD_LABELS.map(p => (
              <span key={p.id} style={{ fontSize: 10.5, fontWeight: 700, color: '#cbd5e1', textAlign: 'center' }}>
                {lang === 'bn' ? p.labelBn : p.labelEn}
              </span>
            ))}
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: 'right', textTransform: 'uppercase' }}>
              {lang === 'bn' ? 'মোট ফলাফল' : 'Total Impact'}
            </span>
          </div>

          {/* Strategy rows */}
          {rows.map(row => (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '260px repeat(6, 1fr) 140px',
                gap: 8,
                alignItems: 'center',
                padding: '10px 8px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.02)',
                borderLeft: `4px solid ${row.color}`,
              }}
            >
              {/* Method Label */}
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#f8fafc' }}>{row.label}</div>
                <span style={{ fontSize: 10, color: row.color, fontWeight: 700, textTransform: 'uppercase' }}>{row.badge}</span>
              </div>

              {/* 6 Season Blocks */}
              {PERIOD_LABELS.map((period, idx) => {
                const crop = row.crops[idx] || null;
                const waterMm = getCropWaterMm(row, idx);
                const color = crop ? getCropColor(crop) : '#475569';
                const heightPct = waterMm === null ? 0 : Math.min(100, Math.max(25, (waterMm / 750) * 100));

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      background: 'rgba(30, 41, 59, 0.6)',
                      borderRadius: 8,
                      border: `1px solid ${color}40`,
                      height: 64,
                      padding: '4px 6px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Water Demand Fill Bar */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: `${heightPct}%`,
                        background: `${color}25`,
                        borderTop: `2px solid ${color}`,
                        zIndex: 0,
                      }}
                    />
                    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#f8fafc', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {crop || (lang === 'bn' ? 'তথ্য নেই' : 'Unavailable')}
                      </span>
                      <span style={{ fontSize: 9.5, color: color, fontWeight: 700 }}>
                        {waterMm !== null ? `${Math.round(waterMm)} mm` : (lang === 'bn' ? 'সেচ তথ্য নেই' : 'No water data')}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Summary Metrics */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: row.color }}>
                  {row.profit !== null ? `৳${Math.round(row.profit / 1000)}k` : (lang === 'bn' ? 'তথ্য নেই' : '—')}
                </div>
                <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
                  {row.water ? `${Math.round(row.water)} mm` : '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3D RAISED PARCEL SCENE */}
      {(viewFormat === 'both' || viewFormat === '3d') && (
        <div className="research-scene-layout-grid">
          <Research3DScene
            cameraPosition={[-14, 12, 14]}
            cameraTarget={[0, 0.5, 0]}
            hudTitle="3D MULTI-SEASON ROTATION FOOTPRINT (HEIGHT = WATER USE)"
            hudMetrics={[
              `Field: ${activeField?.name || (lang === 'bn' ? 'অবস্থান অনুপলভ্য' : 'Location unavailable')}`,
              `Priority: ${priority.toUpperCase()}`,
              milp.profit !== null ? `MILP: ৳${Math.round(milp.profit / 1000)}k` : 'MILP: —',
              rl.profit !== null ? `RL: ৳${Math.round(rl.profit / 1000)}k` : 'RL: —'
            ]}
            onSceneReady={handleSceneReady}
            minHeight="420px"
            lang={lang}
          />

          {/* Quick Inspector Cards */}
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: '#f8fafc' }}>
              🔍 {lang === 'bn' ? 'পদ্ধতিগত পার্থক্য বিশ্লেষণ' : 'Methodological Synthesis'}
            </h4>

            {rows.map(r => (
              <div key={r.id} style={{ background: `${r.color}15`, border: `1px solid ${r.color}40`, padding: '8px 10px', borderRadius: 8, fontSize: 11.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: r.color }}>{r.label.split('(')[0]}</strong>
                  <span style={{ color: r.color, fontWeight: 700, fontSize: 10 }}>{r.badge}</span>
                </div>
                <div style={{ color: '#cbd5e1', marginTop: 3 }}>
                  {lang === 'bn' ? 'প্রথম ফসল' : 'First crop'}: <strong>{r.crops[0] || '—'}</strong> · {lang === 'bn' ? 'পানি' : 'Water'}: <strong>{r.water !== null && r.water !== undefined ? `${Math.round(r.water)} mm` : '—'}</strong>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 'auto', fontSize: 10.5, color: '#64748b', lineHeight: 1.4 }}>
              {lang === 'bn'
                ? '* ৪টি রো একই মাটির হাইড্রো-ফিজিক্স ও নাসা পাওয়ার আবহাওয়া ইনপুটের ভিত্তিতে গণনা করা হয়েছে।'
                : '* Evaluated on identical SoilGrids hydro-physics and NASA POWER weather climatology.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Comparison3Way3D;
