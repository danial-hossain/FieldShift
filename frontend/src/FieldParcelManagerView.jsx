import React, { useState, useEffect } from 'react';
import { GoogleFieldMapPicker } from './GoogleFieldMapPicker.jsx';
import { GoogleFieldMapThumbnail } from './GoogleFieldMapThumbnail.jsx';

const SOIL_TEXTURE_DATA = {
  clay_loam: {
    label: 'Clay Loam',
    fc: '32%',
    pwp: '18%',
    sand: 32,
    silt: 34,
    clay: 34,
    colorHex: 'var(--accent)',
    bgBadge: 'rgba(242, 193, 78, 0.12)',
    textBadge: 'var(--sun)',
    hydraulicCond: '0.8 cm/hr'
  },
  loam: {
    label: 'Medium Loam',
    fc: '28%',
    pwp: '14%',
    sand: 40,
    silt: 40,
    clay: 20,
    colorHex: 'var(--sun)',
    bgBadge: 'rgba(242, 193, 78, 0.12)',
    textBadge: 'var(--sun)',
    hydraulicCond: '1.5 cm/hr'
  },
  silty_loam: {
    label: 'Silty Loam',
    fc: '31%',
    pwp: '15%',
    sand: 20,
    silt: 65,
    clay: 15,
    colorHex: 'var(--sun)',
    bgBadge: 'rgba(242, 193, 78, 0.12)',
    textBadge: 'var(--sun)',
    hydraulicCond: '1.2 cm/hr'
  },
  sandy_loam: {
    label: 'Sandy Loam',
    fc: '21%',
    pwp: '9%',
    sand: 65,
    silt: 25,
    clay: 10,
    colorHex: 'var(--sun)',
    bgBadge: 'rgba(242, 193, 78, 0.12)',
    textBadge: 'var(--sun)',
    hydraulicCond: '3.2 cm/hr'
  },
  silty_clay: {
    label: 'Silty Clay',
    fc: '36%',
    pwp: '22%',
    sand: 10,
    silt: 45,
    clay: 45,
    colorHex: 'var(--accent)',
    bgBadge: 'rgba(197, 232, 108, 0.12)',
    textBadge: 'var(--accent)',
    hydraulicCond: '0.3 cm/hr'
  },
  clay: {
    label: 'Heavy Clay',
    fc: '39%',
    pwp: '25%',
    sand: 15,
    silt: 25,
    clay: 60,
    colorHex: 'var(--alert)',
    bgBadge: 'rgba(239, 122, 90, 0.12)',
    textBadge: 'var(--alert)',
    hydraulicCond: '0.2 cm/hr'
  },
  unknown: {
    label: 'Standard Loam',
    fc: '27%',
    pwp: '13%',
    sand: 40,
    silt: 40,
    clay: 20,
    colorHex: 'var(--text-2)',
    bgBadge: 'rgba(255, 255, 255, 0.08)',
    textBadge: 'var(--text-2)',
    hydraulicCond: '1.4 cm/hr'
  }
};

const defaultFormatDate = d => {
  if (!d) return 'Not Evaluated';
  try {
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return String(d);
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return String(d);
  }
};

const defaultFormatNumber = (val, digits = 2, fallback = 'Not available') => {
  if (val === null || val === undefined || val === '') return fallback;
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return n.toFixed(digits);
};

export function FieldParcelManagerView({
  user = null,
  userFarms = [],
  fieldsLoaded = true,
  fieldsError = '',
  activeField = null,
  userFields = [],
  onSelectField,
  onSelectForAnalysis,
  onViewField,
  onEditField,
  onArchiveField,
  onAddField,
  onBack,
  formatDate = defaultFormatDate,
  formatNumber = defaultFormatNumber,
  lang = 'bn',
}) {
  const [mapMode, setMapMode] = useState('satellite'); // 'satellite' | '3d_block' | 'ndvi'
  const [pinMode, setPinMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFieldIds, setSelectedFieldIds] = useState([]);

  useEffect(() => {
    const validIds = new Set(userFields.map(f => f.id));
    setSelectedFieldIds(prev => prev.filter(id => validIds.has(id)));
  }, [userFields]);

  const isDemo = Boolean(activeField?.id === 'demo' || activeField?.is_demo);
  const hasActiveField = Boolean(activeField);
  const lat = activeField?.latitude != null ? Number(activeField.latitude) : 24.8500;
  const lon = activeField?.longitude != null ? Number(activeField.longitude) : 89.3700;
  const [pinnedCoords, setPinnedCoords] = useState({ lat, lon });

  // Keep pinned coordinates synchronized if active field updates and pin mode is off
  useEffect(() => {
    if (!pinMode) {
      setPinnedCoords({ lat, lon });
    }
  }, [lat, lon, pinMode]);

  const areaHa = activeField?.area_ha != null ? Number(activeField.area_ha) : 10.0;
  const areaBigha = (areaHa * 10000 / 1337.8).toFixed(1);
  const texture = activeField?.soil_texture || 'loam';
  const organicMatter = activeField?.organic_matter != null ? Number(activeField.organic_matter) : 2.5;
  const irrigationMm = activeField?.irrigation_capacity_mm != null ? Number(activeField.irrigation_capacity_mm) : 90;
  const crop = activeField?.crop || activeField?.previous_crop || 'Maize';
  const cropYear = activeField?.previous_crop_year || 2024;

  const soilInfo = SOIL_TEXTURE_DATA[texture] || SOIL_TEXTURE_DATA.unknown;

  // Filtered fields based on search
  const qLower = (searchQuery || '').toLowerCase();
  const filteredFields = userFields.filter(f =>
    (typeof f?.name === 'string' && f.name.toLowerCase().includes(qLower)) ||
    (typeof f?.soil_texture === 'string' && f.soil_texture.toLowerCase().includes(qLower)) ||
    (f?.id != null && String(f.id).includes(searchQuery || ''))
  );

  const handleStartPinning = () => {
    setMapMode('satellite');
    setPinMode(true);
  };

  const handleCancelPinning = () => {
    setPinMode(false);
    setPinnedCoords({ lat, lon });
  };

  const handleRegisterFromPin = () => {
    if (onAddField) {
      onAddField({
        latitude: pinnedCoords.lat,
        longitude: pinnedCoords.lon
      });
    }
  };

  return (
    <div className="parcel-manager-viewport">
      {/* 2. Active Parcel Hero Summary Card */}
      <div className="parcel-hero-banner" style={{ borderLeft: hasActiveField ? (isDemo ? '4px solid var(--water)' : '4px solid var(--leaf)') : '4px solid var(--sun)' }}>
        <div className="hero-banner-main">
          <div className="hero-status-tag" style={{ background: hasActiveField ? (isDemo ? 'rgba(108, 196, 224, 0.15)' : 'rgba(95, 191, 119, 0.15)') : 'rgba(242, 193, 78, 0.15)', color: hasActiveField ? (isDemo ? 'var(--water)' : 'var(--leaf)') : 'var(--sun)' }}>
            <span className={hasActiveField ? "pulse-dot" : ""} style={hasActiveField ? undefined : { width: 8, height: 8, borderRadius: '50%', background: 'var(--sun)', display: 'inline-block' }} />
            {hasActiveField ? (isDemo ? 'DEMO BENCHMARK PARCEL' : 'CURRENT ACTIVE PARCEL') : 'NO ACTIVE PARCEL REGISTERED'}
          </div>
          <h1 className="hero-parcel-name">
            {hasActiveField ? activeField.name : 'কোনো সক্রিয় জমি নিবন্ধিত নেই (০ জমি)'}
          </h1>
          <div className="hero-meta-strip">
            {hasActiveField ? (
              <>
                <span className="hero-meta-chip font-mono">
                  📍 {lat.toFixed(4)}° N, {lon.toFixed(4)}° E
                </span>
                <span className="hero-meta-chip">
                  📐 {areaHa} {lang === 'bn' ? 'হেক্টর' : 'ha'} ({areaBigha} {lang === 'bn' ? 'বিঘা' : 'bigha'})
                </span>
                <span className="hero-meta-chip" style={{ background: soilInfo.bgBadge, color: soilInfo.textBadge, borderColor: soilInfo.colorHex }}>
                  🌱 {soilInfo.label}
                </span>
                <span className="hero-source-chip">
                  {isDemo ? (lang === 'bn' ? 'অফলাইন ডেমো বেঞ্চমার্ক' : 'Offline Demo Benchmark') : (lang === 'bn' ? `জমি #${activeField.id}` : `Field #${activeField.id}`)}
                </span>
              </>
            ) : (
              <>
                <span className="hero-meta-chip">
                  📋 রেজিস্ট্রি খালি (০ নিবন্ধিত জমি)
                </span>
                <span className="hero-meta-chip">
                  💡 নিচে "Add New Field" চাপুন বা ডেমো খামার পরীক্ষা করুন
                </span>
              </>
            )}
          </div>
        </div>

        <div className="hero-banner-stats">
          <div className="hero-stat-block">
            <span className="stat-label">{lang === 'bn' ? 'জৈব পদার্থ' : 'Organic Matter'}</span>
            <span className="stat-val text-green">{hasActiveField ? `${organicMatter}%` : '--'}</span>
            <small className="stat-sub">
              {hasActiveField ? (
                isDemo
                  ? (lang === 'bn' ? 'ধরে নেওয়া' : 'Assumed')
                  : (activeField?.organic_matter != null
                      ? (lang === 'bn' ? 'আপনার দেওয়া' : 'User provided')
                      : (activeField?.soilgrids_soil || activeField?.district)
                        ? 'SoilGrids'
                        : (lang === 'bn' ? 'ধরে নেওয়া' : 'Assumed'))
              ) : (lang === 'bn' ? 'তথ্য নেই' : 'No data')}
            </small>
          </div>
          <div className="hero-divider" />
          <div className="hero-stat-block">
            <span className="stat-label">Irrigation Cap.</span>
            <span className="stat-val">{hasActiveField ? `${irrigationMm} mm` : '--'}</span>
            <small className="stat-sub">{hasActiveField ? 'Seasonal Quota' : 'No measurement'}</small>
          </div>
        </div>
      </div>

      {/* 3. Main Stage: 3D / Satellite Map Viewport (Left) + Soil Horizon Deck (Right) */}
      <div className="parcel-main-grid">
        {/* Left Map Viewport Card */}
        <div className="parcel-stage-card">
          <div className="stage-header-bar">
            <div className="stage-mode-tabs">
              <button
                type="button"
                className="stage-mode-btn active"
              >
                🛰️ {lang === 'bn' ? 'স্যাটেলাইট ভিউ ও স্থানাঙ্ক' : 'Satellite View & Location'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {mapMode === 'satellite' && (
                pinMode ? (
                  <button
                    type="button"
                    className="stage-mode-btn"
                    style={{ background: 'rgba(239, 122, 90, 0.15)', borderColor: 'var(--alert)', color: 'var(--alert)' }}
                    onClick={handleCancelPinning}
                  >
                    ✕ Cancel Pin
                  </button>
                ) : (
                  <button
                    type="button"
                    className="stage-mode-btn"
                    style={{ background: 'rgba(108, 196, 224, 0.15)', borderColor: 'var(--water)', color: 'var(--water)' }}
                    onClick={handleStartPinning}
                    title="Click anywhere on the map to pin a new location for a new field"
                  >
                    📍 Pin New Location on Map
                  </button>
                )
              )}
              <div className="stage-coords-tag font-mono">
                GPS: {(pinMode ? pinnedCoords.lat : lat).toFixed(4)}, {(pinMode ? pinnedCoords.lon : lon).toFixed(4)}
              </div>
            </div>
          </div>

          {/* Pin Mode Alert Strip */}
          {mapMode === 'satellite' && pinMode && (
            <div style={{
              background: 'rgba(95, 191, 119, 0.15)',
              borderBottom: '1px solid var(--line)',
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              fontSize: 13
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>📍</span>
                <span>
                  <strong>Pin Mode Active:</strong> Drag marker or click the map to select coordinates (
                  <code className="font-mono">{pinnedCoords.lat.toFixed(4)}°, {pinnedCoords.lon.toFixed(4)}°</code>
                  ).
                </span>
              </div>
              <button
                type="button"
                className="btn-primary-sm"
                style={{ whiteSpace: 'nowrap', padding: '6px 14px' }}
                onClick={handleRegisterFromPin}
              >
                + Register Field with these Coordinates
              </button>
            </div>
          )}

          <div className="stage-canvas-wrapper">
            <div className="interactive-google-map-holder">
              <GoogleFieldMapPicker
                latitude={pinMode ? pinnedCoords.lat : lat}
                longitude={pinMode ? pinnedCoords.lon : lon}
                readOnly={!pinMode}
                onChange={(newLat, newLng) => {
                  if (pinMode) {
                    setPinnedCoords({ lat: Number(newLat), lon: Number(newLng) });
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Soil Horizon Deck */}
        <div className="parcel-soil-deck">
          {/* Card 1: Soil Texture & Fractions (ISRIC SoilGrids 250m) */}
          <div className="param-card-3d soil-stratigraphy-card">
            <div className="card-top-row">
              <div className="card-title-wrap">
                <span className="card-title-icon">🧪 {lang === 'bn' ? 'মাটির কণার অনুপাত' : 'Soil Texture Fractions'}</span>
                <span className="card-subtitle-note">
                  {activeField?.soilgrids_soil ? 'SoilGrids 250 m' : (lang === 'bn' ? 'এই মাটির ধরনের গড় মান (মাপা নয়)' : 'Average for soil type (not measured)')}
                </span>
              </div>
              <span className="soil-tag-pill" style={{ background: soilInfo.bgBadge, color: soilInfo.textBadge, borderColor: soilInfo.colorHex }}>
                {soilInfo.label}
              </span>
            </div>

            {/* Particle Texture Fractions Breakdown */}
            <div className="soil-fractions-wrapper" style={{ marginTop: 6 }}>
              <div className="fractions-label-row">
                <span className="fractions-title">{lang === 'bn' ? 'বালু, পলি ও কাদার অনুপাত' : 'Sand, Silt & Clay Distribution'}</span>
                <span className="fractions-total">
                  {activeField?.soilgrids_soil ? 'SoilGrids 250 m' : (lang === 'bn' ? 'এই মাটির ধরনের গড় মান (মাপা নয়)' : 'Average for soil type (not measured)')}
                </span>
              </div>

              <div className="soil-fractions-bar-v2">
                <div
                  className="fraction-seg-v2 sand"
                  style={{ width: `${soilInfo.sand}%` }}
                  title={`Sand: ${soilInfo.sand}%`}
                >
                  <span>{lang === 'bn' ? 'বালু' : 'Sand'} {soilInfo.sand}%</span>
                </div>
                <div
                  className="fraction-seg-v2 silt"
                  style={{ width: `${soilInfo.silt}%` }}
                  title={`Silt: ${soilInfo.silt}%`}
                >
                  <span>{lang === 'bn' ? 'পলি' : 'Silt'} {soilInfo.silt}%</span>
                </div>
                <div
                  className="fraction-seg-v2 clay"
                  style={{ width: `${soilInfo.clay}%` }}
                  title={`Clay: ${soilInfo.clay}%`}
                >
                  <span>{lang === 'bn' ? 'কাদা' : 'Clay'} {soilInfo.clay}%</span>
                </div>
              </div>

              <div className="fractions-legend-grid">
                <div className="fraction-legend-box sand">
                  <span className="dot" />
                  <span className="name">{lang === 'bn' ? 'বালু (Sand)' : 'Sand'}</span>
                  <strong className="pct">{soilInfo.sand}%</strong>
                </div>
                <div className="fraction-legend-box silt">
                  <span className="dot" />
                  <span className="name">{lang === 'bn' ? 'পলি (Silt)' : 'Silt'}</span>
                  <strong className="pct">{soilInfo.silt}%</strong>
                </div>
                <div className="fraction-legend-box clay">
                  <span className="dot" />
                  <span className="name">{lang === 'bn' ? 'কাদা (Clay)' : 'Clay'}</span>
                  <strong className="pct">{soilInfo.clay}%</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Key Physical Soil Metrics (FC & PWP only, no fake depth) */}
          <div className="param-card-3d">
            <div className="card-top-row">
              <span className="card-title-icon">💧 {lang === 'bn' ? 'আর্দ্রতা ধারণ সক্ষমতা' : 'Moisture Retention Capacity'}</span>
              <span className="status-live-chip">
                {activeField?.soilgrids_soil ? 'SoilGrids 250 m' : (lang === 'bn' ? 'এই মাটির ধরনের গড় মান (মাপা নয়)' : 'Average for soil type (not measured)')}
              </span>
            </div>
            <div className="param-metrics-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="p-metric-box">
                <span className="lbl">{lang === 'bn' ? 'ফিল্ড ক্যাপাসিটি (FC)' : 'Field Capacity (FC)'}</span>
                <strong className="val text-green">{soilInfo.fc}</strong>
                <small style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                  {activeField?.soilgrids_soil ? 'SoilGrids 250 m' : (lang === 'bn' ? 'এই মাটির ধরনের গড় মান (মাপা নয়)' : 'Average for soil type (not measured)')}
                </small>
              </div>
              <div className="p-metric-box">
                <span className="lbl">{lang === 'bn' ? 'উইল্টিং পয়েন্ট (PWP)' : 'Permanent Wilting Point (PWP)'}</span>
                <strong className="val text-amber">{soilInfo.pwp}</strong>
                <small style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                  {activeField?.soilgrids_soil ? 'SoilGrids 250 m' : (lang === 'bn' ? 'এই মাটির ধরনের গড় মান (মাপা নয়)' : 'Average for soil type (not measured)')}
                </small>
              </div>
            </div>
          </div>

          {/* Card 3: Authentic Crop Rotation History from /api/fields/{id}/history */}
          <div className="param-card-3d">
            <div className="card-top-row">
              <span className="card-title-icon">🌾 {lang === 'bn' ? 'ফসল আবর্তনের ইতিহাস' : 'Agronomic Rotation History'}</span>
              {activeField?.history && activeField.history.length > 0 && (
                <span className="crop-history-badge">
                  {activeField.history[0].year} • {activeField.history[0].crop}
                </span>
              )}
            </div>
            <div className="crop-history-body">
              {activeField?.history && activeField.history.length > 0 ? (
                <div className="crop-sequence-pill-strip" style={{ flexWrap: 'wrap', gap: 8 }}>
                  {activeField.history.map((h, idx) => (
                    <div key={h.id || idx} className="seq-step current">
                      <span className="seq-yr">{h.year} • {h.season}</span>
                      <strong>{h.crop}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '14px 10px', color: 'var(--text-muted)' }}>
                  <p style={{ margin: '0 0 10px', fontSize: 13 }}>
                    {lang === 'bn' ? 'এখনো কোনো ফসলের ইতিহাস নেই' : 'No crop history recorded yet.'}
                  </p>
                  <button
                    type="button"
                    className="btn-primary-sm"
                    onClick={() => onEditField && onEditField(activeField)}
                    style={{ fontSize: 12, padding: '6px 14px', margin: '0 auto' }}
                  >
                    {lang === 'bn' ? '+ ইতিহাস যোগ করুন' : '+ Add History'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Complete "My Fields" Section - High-Fidelity Centralized Database Registry */}
      <section className="profile-card-section" style={{ marginTop: 28 }}>
        <div className="my-fields-header">
          <div className="my-fields-title">
            <h3>My Fields</h3>
            <span className="field-count-pill">
              {!user ? 'Sign in required' : !fieldsLoaded ? 'Loading...' : fieldsError ? 'Unavailable' : `${userFields.length} ${userFields.length === 1 ? 'Field' : 'Fields'}`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div className="db-search-wrap">
              <input
                type="text"
                placeholder="Search parcels or soil…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="parcel-search-input"
                style={{ width: 220 }}
              />
            </div>

            <button
              type="button"
              className="btn-add-field"
              onClick={() => onAddField && onAddField()}
              title="Register a new agricultural field"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              + Add New Field
            </button>
          </div>
        </div>

        {!user ? (
          <p className="field-load-notice">{lang === "bn" ? "নিবন্ধিত জমি লোড করতে সাইন ইন করুন।" : "Sign in to load registered fields."}</p>
        ) : !fieldsLoaded ? (
          <p className="field-load-notice">{lang === "bn" ? "জমি লোড হচ্ছে..." : "Loading registered fields..."}</p>
        ) : fieldsError ? (
          <p className="field-load-notice" role="alert">Could not load registered fields: {fieldsError}</p>
        ) : filteredFields.length > 0 ? (
          <div>
            {selectedFieldIds.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                marginBottom: 16,
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 12
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                  {lang === 'bn'
                    ? `${selectedFieldIds.length}টি জমি নির্বাচিত`
                    : `${selectedFieldIds.length} fields selected`}
                </span>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="btn-field-action"
                    onClick={() => setSelectedFieldIds([])}
                  >
                    {lang === 'bn' ? 'বাতিল' : 'Deselect All'}
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '7px 16px',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      const toDelete = userFields.filter(f => selectedFieldIds.includes(f.id));
                      if (onArchiveField) onArchiveField(toDelete);
                      setSelectedFieldIds([]);
                    }}
                  >
                    {lang === 'bn'
                      ? `নির্বাচিত জমি মুছে ফেলুন (${selectedFieldIds.length})`
                      : `Delete Selected (${selectedFieldIds.length})`}
                  </button>
                </div>
              </div>
            )}
            <div className="fields-cards-grid">
            {filteredFields.map(fld => {
              const isActive = activeField && String(activeField.id) === String(fld.id);
              const latestCrop = fld.previous_crop || fld.current_crop || (fld.history && fld.history[0]?.crop) || 'Not recorded';
              const latestCropYear = fld.previous_crop_year || (fld.history && fld.history[0]?.year) || 'year unavailable';

              return (
                <div key={fld.id} className="field-card-item">
                  {/* 1. Google Maps Location Preview at Top of Card */}
                  <GoogleFieldMapThumbnail
                    latitude={fld.latitude}
                    longitude={fld.longitude}
                    name={fld.name}
                    height="180px"
                    onClick={() => {
                      if (onViewField) onViewField(fld);
                      else if (onSelectField) onSelectField(fld, false);
                    }}
                  />

                  <div className="field-card-content">
                    {/* Level 1 & 2: Field Name, Status & ID */}
                    <div className="field-card-header">
                      <div className="field-card-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="checkbox"
                          checked={selectedFieldIds.includes(fld.id)}
                          onChange={e => {
                            e.stopPropagation();
                            setSelectedFieldIds(prev =>
                              prev.includes(fld.id) ? prev.filter(id => id !== fld.id) : [...prev, fld.id]
                            );
                          }}
                          aria-label={`Select ${fld.name}`}
                          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary, #10b981)' }}
                        />
                        <div>
                          <h4>{fld.name}</h4>
                          <span className="field-id-badge">Field ID #{fld.id}</span>
                        </div>
                      </div>
                      <span className={`completeness-badge ${isActive ? 'active-highlight' : ''}`}>
                        {isActive ? (lang === 'bn' ? 'সক্রিয় জমি' : 'Active Field') : (lang === 'bn' ? 'নিবন্ধিত' : 'Registered')}
                      </span>
                    </div>

                    {/* Level 3: Location / Farm Station */}
                    <div className="field-location-row">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
                        <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span className="field-coords-text">
                        {formatNumber(fld.latitude, 4, null) != null && formatNumber(fld.longitude, 4, null) != null
                          ? `${formatNumber(fld.latitude, 4)}, ${formatNumber(fld.longitude, 4)}`
                          : 'Coordinates not provided'}
                      </span>
                      <span className="field-farm-text">
                        {userFarms.find(farm => farm.id === fld.farm_id)?.name || `My farm`}
                      </span>
                    </div>

                    {/* Level 4: Important Properties - 2 Highlight Blocks */}
                    <div className="field-props-highlight-grid">
                      <div className="prop-highlight-card">
                        <div className="prop-highlight-val">
                          {formatNumber(fld.area_ha, 1, null) != null ? `${formatNumber(fld.area_ha, 1)} ha (${(Number(fld.area_ha) * 10000 / 1337.8).toFixed(1)} ${lang === 'bn' ? 'বিঘা' : 'bigha'})` : (lang === 'bn' ? 'তথ্য নেই' : 'Not provided')}
                        </div>
                        <div className="prop-highlight-lbl">Field Size</div>
                      </div>
                      <div className="prop-highlight-card">
                        <div className="prop-highlight-val" style={{ textTransform: 'capitalize' }}>
                          {fld.soil_texture ? fld.soil_texture.replaceAll('_', ' ') : 'Not provided'}
                        </div>
                        <div className="prop-highlight-lbl">Soil Texture</div>
                      </div>
                    </div>

                    {/* Level 5: Detailed Parameters & Metadata */}
                    <div className="field-props-list">
                      <div className="prop-row">
                        <span className="prop-row-key">Soil pH</span>
                        <span className="prop-row-val">
                          {fld.soil_ph != null ? formatNumber(fld.soil_ph, 1) : 'Not provided'}
                        </span>
                      </div>
                      <div className="prop-row">
                        <span className="prop-row-key">Organic Matter</span>
                        <span className="prop-row-val">
                          {formatNumber(fld.organic_matter, 1, null) != null ? `${formatNumber(fld.organic_matter, 1)} %` : 'Not provided'}
                        </span>
                      </div>
                      <div className="prop-row">
                        <span className="prop-row-key">Irrigation Capacity</span>
                        <span className="prop-row-val">
                          {fld.irrigation_capacity_mm != null ? `${Math.round(Number(fld.irrigation_capacity_mm))} mm` : 'Not provided'}
                        </span>
                      </div>
                      <div className="prop-row">
                        <span className="prop-row-key">Previous Crop</span>
                        <span className="prop-row-val">
                          <span className="crop-chip">{latestCrop} ({latestCropYear})</span>
                        </span>
                      </div>
                      <div className="prop-row prop-meta-row">
                        <span className="prop-row-key">Registered</span>
                        <span className="prop-row-val">{formatDate(fld.created_at)}</span>
                      </div>
                      <div className="prop-row prop-meta-row">
                        <span className="prop-row-key">Last Analysis</span>
                        <span className="prop-row-val" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                          {fld.last_analysis_date ? formatDate(fld.last_analysis_date) : 'Not Evaluated'}
                        </span>
                      </div>
                    </div>

                    {/* Level 6: Actions */}
                    <div className="field-card-actions">
                      {isActive ? (
                        <button
                          type="button"
                          className="btn-active-field-badge"
                          disabled
                          title="This field is currently selected and active"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Active Field
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-select-analysis"
                          onClick={() => {
                            if (onSelectForAnalysis) onSelectForAnalysis(fld);
                            else if (onSelectField) onSelectField(fld, false);
                          }}
                          title="Set this field as active and sync coordinates for analysis"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                          Select for Analysis
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-field-action"
                        onClick={() => onViewField && onViewField(fld)}
                        title="View full field details and crop history"
                      >
                        View
                      </button>

                      <button
                        type="button"
                        className="btn-field-action"
                        onClick={() => onEditField && onEditField(fld)}
                        title="Edit field parameters"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="btn-field-archive"
                        onClick={() => onArchiveField && onArchiveField(fld)}
                        title={lang === 'bn' ? 'জমি মুছে ফেলুন' : 'Delete this field'}
                      >
                        {lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--bg-card)', borderRadius: 16, border: '1px dashed var(--border-light)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <h4 style={{ margin: '0 0 6px', fontSize: 16 }}>
              {lang === 'bn' ? 'কোনো নিবন্ধিত জমি পাওয়া যায়নি' : 'No registered farm parcels found'}
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)' }}>
              {searchQuery
                ? (lang === 'bn' ? `"${searchQuery}" এর সাথে কোনো জমি মিলেনি।` : `No fields matched "${searchQuery}".`)
                : (lang === 'bn' ? 'মাটির গুণাগুণ কনফিগার ও শস্য পরিকল্পনা করতে নতুন জমি যোগ করুন।' : 'Add your first agricultural parcel to configure soil properties and optimize crop rotations.')}
            </p>
            <button
              type="button"
              className="btn-add-field"
              style={{ margin: '0 auto' }}
              onClick={() => onAddField && onAddField()}
            >
              {lang === 'bn' ? '+ নতুন জমি যোগ করুন' : '+ Add Your First Field'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
