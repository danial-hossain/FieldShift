// frontend/src/DataEvidenceView.jsx
// Data & Evidence Workspace for FieldShift 2026
// Sub-navigation: NASA Data Sources, Data Provenance Registry, Research Reports, Scientific Methodology.
// Features: 4-tier data reliability hierarchy, dataset citations, NASA POWER parameter registry,
// missing-value protocols, and reproducibility reports.

import React, { useState, useEffect } from 'react';
import { SyntheticDataLabView } from './SyntheticDataLabView.jsx';
import { JudgeChecklistView } from './JudgeChecklistView.jsx';
import { SatelliteReadinessView } from './SatelliteReadinessView.jsx';
import { formatNumber } from './marketUtils.js';
import { useTranslation } from './i18n.js';
import cropStressData from './cropStressData.js';
import { translateCropName } from './SixSeasonRecommendationView.jsx';

const toBanglaDigits = (num) => {
  if (num === null || num === undefined) return '';
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bn[parseInt(d, 10)]);
};

export function DataEvidenceView({
  activeField,
  nasa,
  lang = 'bn',
  request,
  initialSubTab = 'sources',
  onNavigate,
}) {
  const { t } = useTranslation(lang);
  const [subTab, setSubTab] = useState(initialSubTab);

  useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab);
  }, [initialSubTab]); // 'sources' | 'provenance' | 'reports' | 'methodology' | 'stress_models' | 'limitations'

  const subTabs = [
    { id: 'sources', labelBn: 'নাসা তথ্য উৎস (NASA Sources)', labelEn: '1. NASA Data Sources', icon: '🛰️' },
    { id: 'provenance', labelBn: 'ডেটা প্রোভেন্যান্স রেজিস্ট্রি (4-Tier)', labelEn: '2. Data Provenance Registry', icon: '🏛️' },
    { id: 'judges', labelBn: 'বিচারক নির্দেশিকা (Judge Rubric)', labelEn: '3. For Judges & Evaluators', icon: '🏆' },
    { id: 'reports', labelBn: 'গবেষণা ও বেঞ্চমার্ক রিপোর্ট', labelEn: '4. Research Reports', icon: '📊' },
    { id: 'methodology', labelBn: 'বৈজ্ঞানিক পদ্ধতি ও নিয়ম', labelEn: '5. Scientific Methodology', icon: '🔬' },
    { id: 'stress_models', labelBn: 'চাপ পরীক্ষার মডেল (Stress Models)', labelEn: '6. Stress Testing Models', icon: '🌪️' },
    { id: 'limitations', labelBn: 'সীমাবদ্ধতা ও পরিধি (Limitations)', labelEn: '7. Limitations & Boundaries', icon: '⚠️' },
    { id: 'satellites', labelBn: 'স্যাটেলাইট প্রস্তুতি ও টেলিমেট্রি (Readiness)', labelEn: '8. Satellite Telemetry & Readiness', icon: '🛰️' },
  ];

  const DATASET_REGISTRY = [
    {
      code: 'PRECTOTCORR',
      name: 'Precipitation Corrected',
      units: 'mm/day',
      source: 'NASA GEOS-5.12.4 / MERRA-2',
      tier: 'Tier 1 (Observed / Assimilated)',
      coverage: '2001–2025 (25 Years Daily)',
      missingRule: '-999 marker converted to NaN; omitted without artificial imputation',
    },
    {
      code: 'T2M',
      name: 'Temperature at 2 Meters',
      units: '°C',
      source: 'NASA POWER Daily Point API',
      tier: 'Tier 1 (Observed / Assimilated)',
      coverage: '2001–2025 (25 Years Daily)',
      missingRule: 'Valid range [-10°C, 55°C]; missing days excluded from GDD accumulation',
    },
    {
      code: 'T2M_MAX / T2M_MIN',
      name: 'Maximum & Minimum Temperature',
      units: '°C',
      source: 'NASA POWER Daily Point API',
      tier: 'Tier 1 (Observed / Assimilated)',
      coverage: '2001–2025 (25 Years Daily)',
      missingRule: 'Used for daily diurnal range and GDD = max(0, min(35, Tmean) - 10)',
    },
    {
      code: 'RH2M',
      name: 'Relative Humidity at 2 Meters',
      units: '%',
      source: 'NASA POWER Daily Point API',
      tier: 'Tier 1 (Observed / Assimilated)',
      coverage: '2001–2025 (25 Years Daily)',
      missingRule: 'Valid range [0%, 100%]; missing values flagged as unavailable',
    },
    {
      code: 'ALLSKY_SFC_SW_DWN',
      name: 'All Sky Surface Shortwave Downward Irradiance',
      units: 'MJ/m²/day',
      source: 'NASA FlashFlux / CERES Satellite',
      tier: 'Tier 1 (Observed / Assimilated)',
      coverage: '2001–2025 (25 Years Daily)',
      missingRule: 'Solar radiation telemetry for Hargreaves reference evapotranspiration (ET0)',
    },
    {
      code: 'SMAP_L4_SM',
      name: 'Soil Moisture Active Passive (Root Zone SPL4SMGP)',
      units: 'm³/m³ (Volumetric fraction)',
      source: 'NASA SMAP Level-4 Global Assimilation (9 km)',
      tier: 'Tier 1 (OPeNDAP Subsetting)',
      coverage: 'Seasonal Telemetry (2023–2024) via NSIDC OPeNDAP',
      missingRule: 'Root zone moisture (0–100 cm depth) subsetted across representative seasons; multi-decadal archive catalogued as planned limitation.',
    },
    {
      code: 'MOD13Q1_NDVI',
      name: 'MODIS Normalized Difference Vegetation Index (NDVI)',
      units: 'Unitless Index [-0.2, 1.0]',
      source: 'NASA MODIS Terra/Aqua (250 m 16-Day)',
      tier: 'Planned (LP DAAC Cloud Tested)',
      coverage: 'LP DAAC Granule Catalogued',
      missingRule: 'Single 16-day granule tested (231 MB); full 24-year series (~130 GB) catalogued under Known Limitations as planned remote feature.',
    },
    {
      code: 'GRACE_JPL_RL06',
      name: 'GRACE / GRACE-FO Terrestrial Water Storage Anomaly',
      units: 'cm Equivalent Water Height (EWH)',
      source: 'NASA JPL RL06.3M Mascon CRI Grid (0.5°)',
      tier: 'Tier 1 (Satellite Gravimetry)',
      coverage: '2002–2024 (259 Monthly Observations)',
      missingRule: 'Regional trends recomputed directly from JPL NetCDF (-1.07 cm/yr Barind, +0.44 cm/yr Haor basin, -0.15 cm/yr Coastal), setting MILP water-scarcity weights.',
    },
    {
      code: 'SRTMGL1_ELEV',
      name: 'SRTM 1 Arc-Second Global Elevation & Slope',
      units: 'meters / % slope',
      source: 'NASA SRTMGL1 (30 m DEM)',
      tier: 'Tier 1 (Space Shuttle Radar Topography)',
      coverage: 'Static Topography (30 m global grid)',
      missingRule: 'Derived 3x3 Sobel window topographic slope and elevation from raw .hgt tiles for Hargreaves ET0 pressure correction and flood exposure.',
    },
  ];

  return (
    <div className="data-evidence-workspace" style={{ padding: '20px 0 40px 0', maxWidth: 1300, margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div
        className="dash-card ui-card-hud"
        style={{
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 16,
          padding: '24px 28px',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 26 }}>🛰️🏛️</span>
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
                SCIENTIFIC PROVENANCE &amp; TRACEABILITY
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
                {lang === 'bn' ? 'উৎস ও পদ্ধতি' : 'Sources and methods'}
              </span>
            </div>
            <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>
              {lang === 'bn' ? 'তথ্য প্রমাণ ও বৈজ্ঞানিক প্রোভেন্যান্স' : 'Data Evidence & Scientific Provenance'}
            </h1>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5, maxWidth: 840 }}>
              {lang === 'bn'
                ? 'নাসা পাওয়ার দৈনিক উপাত্তের স্পেশাল ও টেম্পোরাল কভারেজ, ৪-স্তরের প্রোভেন্যান্স হায়ারার্কি, এবং বিআরআরআই ও এফএও অনুমোদিত বৈজ্ঞানিক পদ্ধতির প্রমাণ্য দলিল।'
                : 'Traceable NASA Earth Observations, 4-tier data provenance hierarchy, dataset citations, and validated agro-meteorological calibration methodologies.'}
            </p>
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

      {/* SUB-TAB 1: NASA DATA SOURCES */}
      {subTab === 'sources' && (
        <div className="dash-card ui-card-hud" style={{ background: 'var(--glass-strong)', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
                {lang === 'bn' ? 'নাসা পাওয়ার অনুমোদিত প্যারামিটার রেজিস্ট্রি' : 'Official NASA POWER Telemetry Registry'}
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                NASA Prediction Of Worldwide Energy Resources (POWER) Daily Point API • 0.5° x 0.5° Spatial Grid
              </span>
            </div>
            <a
              href="https://power.larc.nasa.gov/docs/services/api/temporal/daily/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'var(--water)',
                color: 'var(--text)',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              ↗ NASA POWER API Docs
            </a>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--text-2)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>Parameter</th>
                  <th style={{ padding: '10px 12px' }}>Variable Name</th>
                  <th style={{ padding: '10px 12px' }}>Units</th>
                  <th style={{ padding: '10px 12px' }}>Assimilation Model</th>
                  <th style={{ padding: '10px 12px' }}>Data Reliability Tier</th>
                  <th style={{ padding: '10px 12px' }}>Missing Data Protocol</th>
                </tr>
              </thead>
              <tbody>
                {DATASET_REGISTRY.map((d, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--water)' }}>{d.code}</td>
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text)' }}>{d.name}</td>
                    <td style={{ padding: '12px', color: 'var(--sun)' }}>{d.units}</td>
                    <td style={{ padding: '12px', color: 'var(--text-2)' }}>{d.source}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: 11, background: 'rgba(0, 223, 129, 0.15)', color: 'var(--leaf)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                        {d.tier}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: 12, color: 'var(--text-2)', maxWidth: 280 }}>{d.missingRule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DATA PROVENANCE REGISTRY (4-TIER HIERARCHY) */}
      {subTab === 'provenance' && (
        <div>
          <SyntheticDataLabView
            activeField={activeField}
            request={request}
            formatNumber={formatNumber}
            initialTab="provenance"
            lang={lang}
          />
        </div>
      )}

      {/* SUB-TAB 3: RESEARCH REPORTS & BENCHMARKS */}
      {/* Sub-Tab: Judge & Evaluator Checklist (P3.4) */}
      {subTab === 'judges' && (
        <JudgeChecklistView onNavigate={onNavigate} lang={lang} />
      )}

      {subTab === 'reports' && (
        <div className="dash-card ui-card-hud" style={{ background: 'var(--glass-strong)', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
            {lang === 'bn' ? 'গবেষণা ও এলগরিদমিক বেঞ্চমার্ক রিপোর্ট' : 'Algorithmic Optimization & Robustness Reports'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {[
              {
                title: 'Multi-Field Sensitivity Across Bangladesh Agro-Ecological Zones',
                status: 'PASSED (17/17 Invariants)',
                date: '2026-10-30',
                desc: 'Evaluates 6 canonical field profiles (Bogura, Rajshahi, Rangpur, Mymensingh, Barisal, Cumilla) across soil texture, pH, and irrigation constraints.',
              },
              {
                title: 'Rajshahi Aman Rainfall Onset Distribution Shift (2001–2012 vs 2013–2025)',
                status: 'Empirical (+3.5 to +10.5 Days)',
                date: '2026-10-30',
                desc: 'NASA POWER Daily Point observation analysis using 3-day 25mm onset rule and 21-day dry-spell lookahead. Mann-Whitney U test p=0.93 indicates high interannual variance.',
              },
              {
                title: 'PuLP MILP Multi-Objective Solver Stability & Feasibility Benchmark',
                status: 'OPTIMAL (48/48 Cases)',
                date: '2026-10-30',
                desc: 'Tested across 4 objective profiles (Balanced, Profit-Focused, Water-Efficiency, Soil-Health). Enforces legume BNF intervals and botanical family alternation.',
              },
            ].map((rep, idx) => (
              <div key={idx} style={{ background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{rep.date}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--leaf)', background: 'rgba(0, 223, 129, 0.12)', padding: '2px 8px', borderRadius: 4 }}>
                    {rep.status}
                  </span>
                </div>
                <strong style={{ fontSize: 14, color: 'var(--text)', display: 'block', marginBottom: 6 }}>{rep.title}</strong>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{rep.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SCIENTIFIC METHODOLOGY */}
      {subTab === 'methodology' && (
        <div className="dash-card ui-card-hud" style={{ background: 'var(--glass-strong)', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
            {lang === 'bn' ? 'বৈজ্ঞানিক পদ্ধতি, কৃষি নিয়ম ও সতর্কর্তা' : 'Scientific Methodology & Agronomic Calibration Protocols'}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
            <div style={{ background: 'var(--glass)', padding: 16, borderRadius: 10, border: '1px solid var(--line)' }}>
              <strong style={{ color: 'var(--leaf)', display: 'block', marginBottom: 6, fontSize: 14 }}>
                1. বৃষ্টিপাত অনসেট নির্ধারণ নিয়ম (Rainfall Onset Definition):
              </strong>
              আমন মৌসুমে জুনের ১ তারিখ থেকে প্রতিদিনের বৃষ্টিপাত পরিমাপ করা হয়। প্রথম যে তারিখে পরপর ৩ দিনে মোট বৃষ্টিপাত ২৫ মিমি বা তার বেশি হয় এবং কমপক্ষে ১ দিন কার্যকর বৃষ্টি (≥ ১.০ মিমি) হয়, সেটিকে প্রাথমিক অনসেট বিবেচনা করা হয়।
            </div>

            <div style={{ background: 'var(--glass)', padding: 16, borderRadius: 10, border: '1px solid var(--line)' }}>
              <strong style={{ color: 'var(--water)', display: 'block', marginBottom: 6, fontSize: 14 }}>
                2. শুষ্ক স্পেল প্রত্যাখ্যান নিয়ম (Dry-Spell Lookahead Rule):
              </strong>
              প্রাথমিক অনসেটের পরবর্তী ২১ দিনের মধ্যে যদি একটানা ৭ বা তার বেশি দিন শুষ্ক (বৃষ্টি ২.০ মিমি এর কম) থাকে, তবে সেটিকে ভুয়া অনসেট (False Onset) হিসেবে বাতিল করা হয় এবং পরবর্তী টেকসই বৃষ্টিপাতের জন্য অনুসন্ধান অব্যাহত রাখা হয়।
            </div>

            <div style={{ background: 'var(--glass)', padding: 16, borderRadius: 10, border: '1px solid var(--line)' }}>
              <strong style={{ color: 'var(--sun)', display: 'block', marginBottom: 6, fontSize: 14 }}>
                3. ডিগ্রি-ডে সঞ্চয়ন (Growing Degree Days - GDD):
              </strong>
              ধানের শারীরবৃত্তীয় বৃদ্ধি পরিমাপে T_base = ১০°C এবং T_cap = ৩৫°C ব্যবহৃত হয়। সূত্র: Daily GDD = max(0, min(35, T_mean) - 10)। খরিফ মৌসুমে ডিগ্রি-ডে বৃদ্ধির ফলে উদ্ভিদের পানি চাহিদা বাড়ে।
            </div>

            <div style={{ background: 'var(--glass)', padding: 16, borderRadius: 10, border: '1px solid var(--line)' }}>
              <strong style={{ color: 'var(--alert)', display: 'block', marginBottom: 6, fontSize: 14 }}>
                4. রোপণ শিফট ও অনসেট শিফটের পার্থক্য (Recommendation Rule):
              </strong>
              {lang === 'bn'
                ? 'বৃষ্টিপাত অনসেটের শিফট সরাসরি ধানের চারা রোপণ শিফটের সমান নয়। আগস্টের ১৫ তারিখের পরে রোপণ করলে অক্টোবরের শেষভাগে ধানের শীষ বের হওয়ার সময় খরা এবং নভেম্বরের ঠান্ডায় চিটা হওয়ার ঝুঁকি তৈরি হয়। তাই FieldShift সর্বোচ্চ ৭-১০ দিনের পরিমিত বীজতলা শিফট এবং স্বল্পমেয়াদী দ্রুত পরিপক্ক জাত (ব্রি ধান-৭৫, ১১৫ দিন) চাষের সুনির্দিষ্ট সুপারিশ করে।'
                : 'Rainfall onset delay does not equate to a 1:1 transplantation delay. Transplanting after August 15 exposes Aman panicle emergence to terminal drought in October and cold-induced sterility in November. FieldShift enforces a conservative 7-10 day nursery shift limit with short-duration cultivars (BRRI dhan75, 115 days).'}
            </div>

            <div style={{ background: 'var(--glass)', padding: 16, borderRadius: 10, border: '1px solid rgba(56, 189, 248, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                <strong style={{ color: 'var(--water)', fontSize: 14 }}>
                  {lang === 'bn' ? '৫. চাপ পরীক্ষার গাণিতিক মডেল ও ১৭ ফসলের তালিকা:' : '5. Climate Stress Testing Mathematical Models & 17-Crop Calibration:'}
                </strong>
                <button
                  type="button"
                  onClick={() => setSubTab('stress_models')}
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid var(--water)',
                    color: 'var(--water)',
                    padding: '4px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {lang === 'bn' ? 'গাণিতিক সূত্র ও ১৭ ফসলের প্যারামিটার তালিকা দেখুন →' : 'View Formulas & 17-Crop Registry Table →'}
                </button>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6 }}>
                {lang === 'bn'
                  ? 'জলবায়ু চরমাবস্থার অভিঘাত নির্ণয়ে FAO-33 পানি-ফলন প্রতিক্রিয়া, Maas-Hoffman লবণাক্ততা সহনশীলতা (FAO-29), সংবেদনশীল দশায় ডিগ্রি-ডে সীমা এবং প্লাবন নিমজ্জন স্টেপ-মডেল কার্যকর করা হয়েছে।'
                  : 'Screening climate shock impacts across rotations using FAO-33 water-yield functions, Maas-Hoffman salinity models (FAO-29), stage-specific degree-day exceedance, and flood inundation submergence curves.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: CLIMATE STRESS TESTING MATHEMATICAL MODELS & PARAMETER REGISTRY */}
      {subTab === 'stress_models' && (
        <div className="dash-card ui-card-hud" style={{ background: 'var(--glass-strong)', border: '1px solid var(--line)', borderRadius: 14, padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 22 }}>🌪️📐</span>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
                  {lang === 'bn' ? 'জলবায়ু চাপ পরীক্ষার গাণিতিক মডেল ও বৈজ্ঞানিক ভিত্তি' : 'Climate Stress Testing Mathematical Models & Registry'}
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>
                {lang === 'bn'
                  ? 'FAO-33, FAO-29, BRRI এবং BARI দ্বারা ক্যালিব্রেট করা প্রতিক্রিয়া সমীকরণ, সংকটপূর্ণ পর্যায় এবং ১৭টি ফসলের অনুমোদিত প্যারামিটার রেজিস্ট্রি।'
                  : 'Empirical response functions, stage-specific damage functions, and peer-reviewed 17-crop stress coefficients.'}
              </p>
            </div>
            <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 999, background: 'rgba(56, 189, 248, 0.15)', color: 'var(--water)', fontWeight: 700, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              {lang === 'bn' ? 'FAO ও জাতীয় কৃষি গবেষণা কাউন্সিল স্বীকৃত' : 'FAO & NARS Calibrated'}
            </span>
          </div>

          {/* Section A: The 4 Mathematical Formulas */}
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--leaf)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            {lang === 'bn' ? 'ক. ৪টি প্রধান গাণিতিক প্রতিক্রিয়া সূত্র (Core Mathematical Formulas)' : 'A. Four Primary Mathematical Response Functions'}
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 24 }}>
            {/* Formula 1: FAO-33 Water Yield */}
            <div style={{ background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>🌵</span>
                <strong style={{ fontSize: 13.5, color: '#f59e0b' }}>
                  {lang === 'bn' ? '১. খরা ও পানির ঘাটতি (FAO-33)' : '1. Water Deficit Response (FAO-33)'}
                </strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--water)', marginBottom: 8, textAlign: 'center', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                (1 - Y_a / Y_m) = K_y × (1 - ET_a / ET_m)
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                {lang === 'bn'
                  ? 'যেখানে Ya/Ym হলো প্রাপ্ত বনাম সর্বোচ্চ সম্ভাব্য ফলন অনুপাত, Ky হলো ফসলের ফলন প্রতিক্রিয়া সহগ (FAO-33 Table 24), এবং ETa/ETm হলো বাষ্পীভবন অনুপাত।'
                  : 'Where Ya/Ym is relative yield, Ky is the yield response factor (FAO-33 Paper 33), and ETa/ETm is the actual over maximum evapotranspiration ratio.'}
              </p>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                সূত্র: Doorenbos & Kassam (1979), FAO Irrigation & Drainage Paper No. 33
              </div>
            </div>

            {/* Formula 2: Maas-Hoffman Salinity */}
            <div style={{ background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>🧂</span>
                <strong style={{ fontSize: 13.5, color: '#38bdf8' }}>
                  {lang === 'bn' ? '২. লবণাক্ততা অনুপ্রবেশ (FAO-29)' : '2. Salinity Response (Maas-Hoffman)'}
                </strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#38bdf8', marginBottom: 8, textAlign: 'center', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                Y% = 100 - b × (EC_e - a) &nbsp;[EC_e &gt; a]
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                {lang === 'bn'
                  ? 'যেখানে a হলো মাটির লবণাক্ততা সহনশীলতার সর্বোচ্চ সীমা (dS/m), b হলো সীমা অতিক্রমের পর প্রতি ১ dS/m বৃদ্ধিতে ফলন হ্রাসের শতাংশ (%), এবং ECe হলো সম্পৃক্ত পেস্টের পরিবাহিতা।'
                  : 'Where a is the salinity threshold (dS/m), b is the yield decrease slope (% per dS/m above threshold a), and ECe is electrical conductivity of saturated extract.'}
              </p>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                সূত্র: Maas & Hoffman (1977); Ayers & Westcot (1985), FAO-29 Table 4
              </div>
            </div>

            {/* Formula 3: Thermal Degree-Day Exceedance */}
            <div style={{ background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>🔥❄️</span>
                <strong style={{ fontSize: 13.5, color: '#ef4444' }}>
                  {lang === 'bn' ? '৩. চরম তাপ ও শৈত্যপ্রবাহ (ডিগ্রি-ডে)' : '3. Thermal Degree-Day Exceedance'}
                </strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: '#f87171', marginBottom: 8, textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                ΔY% = Σ max(0, |T - T_crit|) × Rate_loss
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                {lang === 'bn'
                  ? 'সংবেদনশীল পরাগায়ন/শীষ গঠনের নির্দিষ্ট দিনগুলোতে (DAS) সংকটপূর্ণ তাপমাত্রা (যেমন ধানে Tmax > ৩৫°C বা Tmin < ১০°C) অতিক্রমকারী ডিগ্রি-ডে অনুপাতে বন্ধ্যাত্ব ও ক্ষতি হিসাব করা হয়।'
                  : 'Cumulative degree-day exceedance beyond critical thresholds (e.g. Tmax > 35°C causing rice spikelet sterility, Tmin < 10°C chilling) during sensitive phenological windows (DAS).'}
              </p>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                সূত্র: BRRI Agro-Meteorology Division & BARI Terminal Heat Guidelines
              </div>
            </div>

            {/* Formula 4: Flood Submergence Curve */}
            <div style={{ background: 'var(--glass)', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>🌊</span>
                <strong style={{ fontSize: 13.5, color: '#00df81' }}>
                  {lang === 'bn' ? '৪. প্লাবন ও নিমজ্জন স্টেপ-মডেল' : '4. Inundation Submergence Model'}
                </strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#00df81', marginBottom: 8, textAlign: 'center', border: '1px solid rgba(0, 223, 129, 0.2)' }}>
                Y_loss = StepFunction(Inundation_Days)
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                {lang === 'bn'
                  ? 'জমিতে পানি জমার মেয়াদ ৩, ৭ ও ১৪ দিনের পর্যবেক্ষণভিত্তিক স্টেপ ফাংশন। আমন ধান (বিশেষত Sub1 জাত) ১৪ দিন টিকে থাকে, বিপরীতে ডাল ও তেলবীজ ৩ দিনেই শিকড় পচে মারাত্মক ক্ষতিগ্রস্ত হয়।'
                  : 'Stepwise loss evaluation at 3, 7, and 14 days of complete submergence. Sub1 rice cultivars tolerate up to 14 days, whereas upland pulses suffer rapid root anoxia.'}
              </p>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                সূত্র: BRRI Flash Flood Screening (Sub1) & BARI Agronomy Division
              </div>
            </div>
          </div>

          {/* Section B: 17 Catalogue Crops Parameter Registry Table */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--water)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                {lang === 'bn' ? 'খ. ১৭টি ফসলের বিজ্ঞানভিত্তিক স্ট্রেস প্যারামিটার রেজিস্ট্রি' : 'B. 17-Crop Scientific Stress Parameter Registry'}
              </h4>
              <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
                {lang === 'bn' ? 'উৎস: data/crops/crop_stress_params.json (কোনো মনগড়া সংখ্যা নেই)' : 'Source: data/crops/crop_stress_params.json (Zero fabricated numbers)'}
              </span>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--glass)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--text-2)', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '10px 12px' }}>{lang === 'bn' ? 'ফসল (Crop)' : 'Crop'}</th>
                    <th style={{ padding: '10px 12px' }}>{lang === 'bn' ? 'Ky ফ্যাক্টর' : 'Ky Factor'}</th>
                    <th style={{ padding: '10px 12px' }}>{lang === 'bn' ? 'লবণাক্ততা (a, b)' : 'Salinity (a, b)'}</th>
                    <th style={{ padding: '10px 12px' }}>{lang === 'bn' ? 'সংবেদনশীল দশা ও DAS' : 'Sensitive Stage & DAS'}</th>
                    <th style={{ padding: '10px 12px' }}>{lang === 'bn' ? 'তাপমাত্রা সংকট (Tmax / Tmin)' : 'Temp Limits (Tmax / Tmin)'}</th>
                    <th style={{ padding: '10px 12px' }}>{lang === 'bn' ? 'বন্যা সহনশীলতা' : 'Flood Tolerance'}</th>
                    <th style={{ padding: '10px 12px' }}>{lang === 'bn' ? 'তথ্যসূত্র (Citation)' : 'Citation'}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(cropStressData).map(([cropKey, params]) => {
                    const isFallow = cropKey === 'Fallow';
                    const cropLabel = translateCropName ? translateCropName(cropKey, lang) : cropKey;
                    const kyVal = params.ky_total?.value != null ? (lang === 'bn' ? toBanglaDigits(params.ky_total.value.toFixed(2)) : params.ky_total.value.toFixed(2)) : (lang === 'bn' ? 'তথ্য নেই' : 'N/A');
                    const salA = params.salinity?.threshold_a != null ? (lang === 'bn' ? toBanglaDigits(params.salinity.threshold_a) : params.salinity.threshold_a) : (lang === 'bn' ? 'তথ্য নেই' : 'N/A');
                    const salB = params.salinity?.slope_b != null ? (lang === 'bn' ? `${toBanglaDigits(params.salinity.slope_b)}%` : `${params.salinity.slope_b}%`) : (lang === 'bn' ? 'তথ্য নেই' : 'N/A');
                    const dasWindow = params.sensitive_stage?.window_das ? (lang === 'bn' ? `${toBanglaDigits(params.sensitive_stage.window_das[0])}-${toBanglaDigits(params.sensitive_stage.window_das[1])} দিন` : `${params.sensitive_stage.window_das[0]}-${params.sensitive_stage.window_das[1]} DAS`) : (lang === 'bn' ? 'তথ্য নেই' : 'N/A');
                    const stageName = params.sensitive_stage?.name || (lang === 'bn' ? 'তথ্য নেই' : 'N/A');
                    const tmax = params.heat?.tmax_crit != null ? (lang === 'bn' ? `> ${toBanglaDigits(params.heat.tmax_crit)}°C` : `> ${params.heat.tmax_crit}°C`) : (lang === 'bn' ? 'তথ্য নেই' : 'N/A');
                    const tmin = params.cold?.tmin_crit != null ? (lang === 'bn' ? `< ${toBanglaDigits(params.cold.tmin_crit)}°C` : `< ${params.cold.tmin_crit}°C`) : (lang === 'bn' ? 'প্রযোজ্য নয় (গ্রীষ্মকালীন)' : 'N/A (Kharif crop)');
                    const floodDays = params.flood?.tolerated_days != null ? (lang === 'bn' ? `সহনশীল: ${toBanglaDigits(params.flood.tolerated_days)} দিন` : `Tolerates: ${params.flood.tolerated_days}d`) : (lang === 'bn' ? 'তথ্য নেই' : 'N/A');
                    const floodLoss3d = params.flood?.loss_at_3d != null ? (lang === 'bn' ? `(৩ দিনে -${toBanglaDigits(params.flood.loss_at_3d)}%)` : `(3d: -${params.flood.loss_at_3d}%)`) : '';
                    
                    const primarySource = params.ky_total?.source || params.salinity?.source || params.heat?.source || (isFallow ? (lang === 'bn' ? 'অনাবাদী জমি (প্রযোজ্য নয়)' : 'Fallow (N/A)') : 'BARI / BRRI');

                    return (
                      <tr key={cropKey} style={{ borderBottom: '1px solid var(--line)', opacity: isFallow ? 0.6 : 1 }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: isFallow ? 'var(--text-muted)' : 'var(--text)' }}>
                          <div>{cropLabel}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{cropKey}</div>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--sun)', fontWeight: 600 }}>
                          {kyVal}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#38bdf8' }}>
                          <div>a: {salA} dS/m</div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-2)' }}>b: {salB}/dS/m</div>
                        </td>
                        <td style={{ padding: '10px 12px', maxWidth: 170 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{stageName}</div>
                          <div style={{ fontSize: 10.5, color: 'var(--leaf)' }}>{dasWindow}</div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ color: '#f87171' }}>Tmax: {tmax}</div>
                          <div style={{ color: '#93c5fd', fontSize: 10.5 }}>Tmin: {tmin}</div>
                        </td>
                        <td style={{ padding: '10px 12px', maxWidth: 160 }}>
                          <div>{floodDays}</div>
                          {floodLoss3d && <div style={{ fontSize: 10.5, color: '#f59e0b' }}>{floodLoss3d}</div>}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--text-2)', maxWidth: 220 }}>
                          {primarySource}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {lang === 'bn'
                ? '* আউশ ধান, মুগডাল, তিল ও পাট গ্রীষ্মকালীন/খরিফ ফসল হওয়ায় শীতকালীন শৈত্যপ্রবাহ এদের ক্ষেত্রে প্রযোজ্য নয় (N/A)। অনাবাদী জমির (Fallow) জন্য সকল প্যারামিটার স্বভাবতই ফাঁকা (তথ্য নেই)।'
                : '* Aus Rice, Mungbean, Sesame, and Jute are summer/monsoon crops not cultivated in winter; coldwave is non-applicable (N/A). Fallow land has null parameters across all categories.'}
            </div>
          </div>

          {/* Section C: Model Operational Boundaries & Assumptions */}
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--alert)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            {lang === 'bn' ? 'গ. মডেলের কার্যকর পরিধি ও অনুমিতিসমূহ (Model Boundaries & Caveats)' : 'C. Model Operational Boundaries & Agronomic Caveats'}
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            <div style={{ background: 'var(--glass)', padding: 14, borderRadius: 10, border: '1px solid var(--line)' }}>
              <strong style={{ color: 'var(--water)', display: 'block', marginBottom: 4, fontSize: 13 }}>
                {lang === 'bn' ? '১. স্ক্রীনিং মডেল বনাম ডাইনামিক ফিল্ড সিমুলেশন' : '1. Rapid Screening vs Dynamic Crop Simulation'}
              </strong>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                {lang === 'bn'
                  ? 'FieldShift-এর চাপ পরীক্ষা মূলত ফসলের একাধিক মৌসুমী বিকল্পের ঝুঁকি দ্রুত মূল্যায়নের জন্য এফএও স্ট্যান্ডার্ড স্ক্রীনিং মডেল। এটি APSIM বা DSSAT-এর মতো দৈনিক ফিজিক্যাল মাটি-উদ্ভিদ-বায়ুমণ্ডল প্রক্রিয়ার সিমুলেটর নয়।'
                  : 'FieldShift provides an empirical FAO screening tool to rapidly assess rotational vulnerability across candidate sequences, rather than a full process-based dynamic daily simulation model like DSSAT or APSIM.'}
              </p>
            </div>

            <div style={{ background: 'var(--glass)', padding: 14, borderRadius: 10, border: '1px solid var(--line)' }}>
              <strong style={{ color: '#f59e0b', display: 'block', marginBottom: 4, fontSize: 13 }}>
                {lang === 'bn' ? '২. একক মৌসুমে জটিল যৌগিক দুর্যোগ বাদ' : '2. No Compound Multi-Stress in Single Season'}
              </strong>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                {lang === 'bn'
                  ? 'মডেল প্রতিটি দুর্যোগ পরিস্থিতিকে (যেমন তাপপ্রবাহ, খরা বা আকস্মিক বন্যা) স্বতন্ত্রভাবে পরীক্ষা করে। একই মৌসুমে একাধিক চরম বিপর্যয়ের যৌথ মিথস্ক্রিয়া (যেমন একই সাথে খরা ও তাপপ্রবাহ) এখনো সিমুলেশন পরিধির বাইরে।'
                  : 'Each climate hazard (heatwave, drought, submergence, salinity) is modeled independently. Compound simultaneous multi-hazard events occurring in the exact same seasonal window are not aggregated non-linearly.'}
              </p>
            </div>

            <div style={{ background: 'var(--glass)', padding: 14, borderRadius: 10, border: '1px solid var(--line)' }}>
              <strong style={{ color: '#ef4444', display: 'block', marginBottom: 4, fontSize: 13 }}>
                {lang === 'bn' ? '৩. রোগবালাই ও কীটপতঙ্গের সেকেন্ডারি প্রাদুর্ভাব বাদ' : '3. Exclusion of Secondary Pest & Disease Vector Dynamics'}
              </strong>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                {lang === 'bn'
                  ? 'বন্যা-পরবর্তী অতিরিক্ত আর্দ্রতা বা তাপবৃদ্ধির ফলে ধানে ব্লাস্ট, বাদামি গাছফড়িং (BPH) বা ছত্রাকজনিত রোগের সম্ভাব্য বিস্তার সরাসরি ক্ষতির সূত্রে যুক্ত হয় না; এগুলোকে পরামর্শমূলক সুরক্ষায় বিবেচনা করা হয়।'
                  : 'Secondary biotic pressures triggered by climate shocks (e.g., fungal blast or brown planthopper outbreaks following humidity surges) are not simulated in yield loss formulas and are mitigated via qualitative advisory guidelines.'}
              </p>
            </div>

            <div style={{ background: 'var(--glass)', padding: 14, borderRadius: 10, border: '1px solid var(--line)' }}>
              <strong style={{ color: '#a855f7', display: 'block', marginBottom: 4, fontSize: 13 }}>
                {lang === 'bn' ? '৪. মৌসুমের মধ্যবর্তী ভূগর্ভস্থ পানিস্তরের ধারাবাহিক স্মৃতি বাদ' : '4. Decoupled Inter-Seasonal Soil Hydrology Memory'}
              </strong>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                {lang === 'bn'
                  ? 'প্রতিটি মৌসুমের পানির ভারসাম্য এবং মাটির আর্দ্রতা নাসা ও মাটির বৈশিষ্ট্যের ভিত্তিতে হিসাব করা হয়। পূর্ববর্তী মৌসুমের অতিরিক্ত পানি বা চরম ঘাটতি পরবর্তী মৌসুমে সঞ্চিত হিসেবে বহন করা হয় না।'
                  : 'Soil moisture profiles are evaluated per seasonal window based on SoilGrids texture and climate inputs. Multi-year carryover of deep aquifer depletion is not modeled dynamically between disparate seasonal blocks.'}
              </p>
            </div>
          </div>
        </div>
      )}


      {/* SUB-TAB 5: SCIENTIFIC LIMITATIONS & BOUNDARIES */}
      {subTab === 'limitations' && (
        <div className="dash-card ui-card-hud" style={{ background: 'var(--glass-strong)', border: '1px solid var(--line)', borderRadius: 14, padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
                {lang === 'bn' ? 'মডেল ও ডেটার বৈজ্ঞানিক সীমাবদ্ধতা এবং ব্যবহারিক পরিধি' : 'Scientific Limitations & Operational Boundaries'}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-2)' }}>
                {lang === 'bn'
                  ? 'গাণিতিক মডেল, রিমোট সেন্সিং উপাত্ত এবং বাজার তথ্যের বাস্তব সীমাবদ্ধতাসমূহ স্বচ্ছভাবে উপস্থাপিত।'
                  : 'Transparent disclosure of gridded satellite resolution, simulation bounds, market dynamics, and agronomic assumptions.'}
              </p>
            </div>
            <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, background: 'rgba(234, 179, 8, 0.15)', color: '#f59e0b', fontWeight: 700, border: '1px solid rgba(234, 179, 8, 0.3)' }}>
              {lang === 'bn' ? 'স্বচ্ছ গবেষণা চুক্তি' : 'Honesty Contract'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {/* Limitation 1 */}
            <div style={{ background: 'var(--glass)', padding: 16, borderRadius: 12, border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>🛰️</span>
                <strong style={{ fontSize: 14, color: 'var(--water)' }}>
                  {lang === 'bn' ? '১. ০.৫° গ্রিড রেজোলিউশন (NASA POWER Scale)' : '1. 0.5° Gridded Scale (NASA POWER Resolution)'}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 }}>
                {lang === 'bn'
                  ? 'NASA POWER আবহাওয়া উপাত্ত প্রায় ৫৫ কিমি × ৫৫ কিমি গ্রিড কোষে সংগৃহীত। এটি আঞ্চলিক মনসুন অনসেট ও সাধারণ প্রবণতা নির্ণয়ে অত্যন্ত নিখুঁত হলেও, অত্যন্ত স্থানীয় নদীর বাঁধ, গাছপালার ছায়া বা মাইক্রো-ক্লাইমেট বৈচিত্র্য এতে প্রতিফলিত হয় না।'
                  : 'NASA POWER meteorology is assimilated over a 0.5° × 0.5° (~55 km) grid cell. While statistically robust for multi-decadal climatology and onset detection, hyper-local microclimates (canopy shade, river levees) are spatially averaged across the cell.'}
              </p>
            </div>

            {/* Limitation 2 */}
            <div style={{ background: 'var(--glass)', padding: 16, borderRadius: 12, border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>🌱</span>
                <strong style={{ fontSize: 14, color: 'var(--leaf)' }}>
                  {lang === 'bn' ? '২. মাঠ পর্যায়ে লাইসিমিটার প্রমাণের শূন্যতা' : '2. Remote Sensing vs In-Situ Lysimetry'}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 }}>
                {lang === 'bn'
                  ? 'মাটির আর্দ্রতা ও হাইড্রোলজিক্যাল বৈশিষ্ট্য ISRIC SoilGrids ও FAO-56 সমীকরণ ভিত্তিক। মাঠের মাটির বাস্তব ঘনত্ব ও ভূগর্ভস্থ পানিস্তরের গভীরতার পরিবর্তন যাচাইয়ের জন্য স্থানীয় উপ-সহকারী কৃষি কর্মকর্তা (SAAO) বা আঞ্চলিক মাটি পরীক্ষাগারের পরামর্শ প্রয়োজন।'
                  : 'Soil moisture and hydrology are modeled using ISRIC SoilGrids 250m and FAO-56 empirical functions. In-situ physical soil compaction and local watertable depth may vary; local agricultural extension (SAAO) validation is recommended.'}
              </p>
            </div>

            {/* Limitation 3 */}
            <div style={{ background: 'var(--glass)', padding: 16, borderRadius: 12, border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>📈</span>
                <strong style={{ fontSize: 14, color: 'var(--accent-amber, #f59e0b)' }}>
                  {lang === 'bn' ? '৩. স্থানীয় হাট বনাম জাতীয় গড় মূল্য' : '3. Regional Mandi vs National Price Data'}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 }}>
                {lang === 'bn'
                  ? 'অর্থনৈতিক লাভজনকতা হিসাব BBS এবং FAOSTAT-এর প্রাতিষ্ঠানিক পাইকারি মূল্যের গড় ডেটা ব্যবহার করে। কিন্তু দৈনিক স্থানীয় হাটে পাইকার সিন্ডিকেট, পরিবহন খরচ এবং তাৎক্ষণিক সরবরাহ-চাহিদার কারণে বিক্রয়মূল্য ওঠানামা করতে পারে।'
                  : 'Profit models utilize official BBS and FAOSTAT wholesale benchmarks. Actual farmgate returns at local village haats fluctuate based on transport access, middleman margins, and day-to-day market arrivals.'}
              </p>
            </div>

            {/* Limitation 4 */}
            <div style={{ background: 'var(--glass)', padding: 16, borderRadius: 12, border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>🧪</span>
                <strong style={{ fontSize: 14, color: '#a855f7' }}>
                  {lang === 'bn' ? '৪. সিন্থেটিক সিমুলেশন পরিধি' : '4. Synthetic Benchmark Boundaries'}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 }}>
                {lang === 'bn'
                  ? 'গবেষণা ল্যাবে ব্যবহৃত সিন্থেটিক স্ট্রেস টেস্টগুলো অ্যালগরিদমের চরম আবহাওয়ায় প্রতিক্রিয়া যাচাইয়ের জন্য তৈরি। এগুলো ভবিষ্যৎ আবহাওয়ার পূর্বাভাস নয় এবং বাস্তব মাঠের পরিমাপিত তথ্য হিসেবে দাবি করা হয় না।'
                  : 'Synthetic holdout scenarios in the research lab exist purely to benchmark PuLP MILP solver stability under non-linear perturbations. They are not empirical future forecasts and represent controlled synthetic stress-tests.'}
              </p>
            </div>

            {/* Limitation 5 */}
            <div style={{ background: 'var(--glass)', padding: 16, borderRadius: 12, border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>🌊</span>
                <strong style={{ fontSize: 14, color: '#38bdf8' }}>
                  {lang === 'bn' ? '৫. হাওর ও প্লাবনভূমির জলাবদ্ধতা গতিশীলতা' : '5. Wetland & Flash Flood Dynamics'}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 }}>
                {lang === 'bn'
                  ? 'সুনামগঞ্জের মতো নিচু হাওর অঞ্চলে এপ্রিলের শেষ বা মে মাসে পাহাড়ি ঢলে আকস্মিক বন্যা হতে পারে। আমাদের মডেল আমন মৌসুমে হাওরের জমিকে অনাবাদী রাখে, তবে ফসল কাটার সময় স্থানীয় বাঁধের নিরাপত্তা ও নিষ্কাশন অত্যন্ত গুরুত্বপূর্ণ।'
                  : 'Low-lying haor basins (e.g. Sunamganj) face flash flood risks from upstream catchments. While our optimization model enforces Kharif fallow constraints, Boro harvest windows remain dependent on local submersible embankment conditions.'}
              </p>
            </div>

            {/* Limitation 6 */}
            <div style={{ background: 'var(--glass)', padding: 16, borderRadius: 12, border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>🛡️</span>
                <strong style={{ fontSize: 14, color: '#ec4899' }}>
                  {lang === 'bn' ? '৬. উপাত্তের সততা ও ফাঁকা অবস্থা নীতি' : '6. Zero Fabrication & Honest Empty States'}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 }}>
                {lang === 'bn'
                  ? 'যেখানে নাসার পরিমাপিত উপাত্ত বা ব্যবহারকারীর ইনপুট নেই (যেমন একক প্লটের লাইভ এনডিভিআই বা সেন্সর আর্দ্রতা), FieldShift সেখানে কৃত্রিম সংখ্যা বসায় না; স্পষ্টভাবে "তথ্য নেই" দেখায়।'
                  : 'Where empirical satellite telemetry or farmer field inputs are unavailable (e.g. single-plot live NDVI or continuous telemetry), FieldShift renders an honest "No data / তথ্য নেই" state rather than fabricated placeholders.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 8: Satellite Telemetry & Readiness */}
      {subTab === 'satellites' && (
        <SatelliteReadinessView
          activeField={activeField}
          lang={lang}
          onNavigateTab={onNavigate}
        />
      )}

    </div>
  );
}

export default DataEvidenceView;
