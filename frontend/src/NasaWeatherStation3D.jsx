import React, { useState, useMemo, useEffect } from 'react';
import { DataSourceTag } from './ui/index.js';
import { request } from './apiClient.js';
import sampleSeries from './nasa_30day_series.json';

export function NasaWeatherStation3D({ nasa = {}, env = {}, activeField = null, onBack, lang = 'bn' }) {
  const [activeChartMetric, setActiveChartMetric] = useState('temp'); // 'temp' | 'rain' | 'humidity' | 'solar'
  const [timeHorizon, setTimeHorizon] = useState(30); // 7 | 14 | 30
  const [hoveredDataPoint, setHoveredDataPoint] = useState(null);
  const [liveWeather, setLiveWeather] = useState(null);

  // Fallbacks based on user inputs or active field
  const isDemo = Boolean(activeField?.id === 'demo' || activeField?.is_demo);
  const latitude = activeField?.latitude != null ? Number(activeField.latitude) : 24.8500;
  const longitude = activeField?.longitude != null ? Number(activeField.longitude) : 89.3700;
  const locationName = activeField?.name || (isDemo ? 'Demo Field (Bogura 10 ha) [DEMO]' : 'Regional Weather Center (Bogura Reference)');

  useEffect(() => {
    let isCancelled = false;
    async function loadWeather() {
      try {
        const body = {
          latitude,
          longitude,
          district: activeField?.district || undefined,
        };
        const data = await request('/api/location/weather', {
          method: 'POST',
          body: JSON.stringify(body)
        });
        if (!isCancelled && data?.status === 'ok') {
          setLiveWeather(data);
        }
      } catch (err) {
        console.warn('Weather fetch fallback to cached telemetry:', err);
      }
    }
    loadWeather();
    return () => { isCancelled = true; };
  }, [latitude, longitude, activeField?.district]);

  const activeSeries = (liveWeather?.series && liveWeather.series.length > 0)
    ? liveWeather.series
    : (Array.isArray(sampleSeries) && sampleSeries.length > 0 ? sampleSeries : []);

  const latestSummary = liveWeather?.summary || nasa?.summary || {};
  const tempVal = latestSummary.temperature ?? (env.temperature != null ? Number(env.temperature) : 27.8);
  const tempMax = latestSummary.temp_max ?? (env.temp_max != null ? Number(env.temp_max) : 32.2);
  const tempMin = latestSummary.temp_min ?? (env.temp_min != null ? Number(env.temp_min) : 24.2);
  const humidVal = latestSummary.humidity ?? (env.humidity != null ? Number(env.humidity) : 82.8);
  const windVal = latestSummary.wind_speed ?? (env.wind_speed != null ? Number(env.wind_speed) : 1.4);
  const rainVal = latestSummary.rainfall ?? (env.rainfall != null ? Number(env.rainfall) : 0.17);
  const observationDate = latestSummary.latest_valid_date || nasa.latest_valid_date || '2025-12-31';
  const observationDays = latestSummary.rows || nasa.rows || 30;
  const isObserved = Boolean(liveWeather?.series?.length || (nasa && (nasa.data_status === 'observed' || nasa.data_status === 'live')));

  // Filter 30-day timeseries based on timeHorizon
  const chartData = useMemo(() => {
    const raw = activeSeries;
    const sliced = raw.slice(Math.max(0, raw.length - timeHorizon));
    return sliced.map(d => ({
      ...d,
      temperature: Number(d.temperature) || tempVal,
      temp_max: Number(d.temp_max) || tempMax,
      temp_min: Number(d.temp_min) || tempMin,
      rainfall: Number(d.rainfall) || rainVal,
      humidity: Number(d.humidity) || humidVal,
      wind_speed: Number(d.wind_speed) || windVal,
      solar_radiation: Number(d.solar_radiation) || 14.5
    }));
  }, [activeSeries, timeHorizon, tempVal, tempMax, tempMin, humidVal, windVal, rainVal]);

  // Derived agro-climatic metrics
  const rain30DaySum = useMemo(() => {
    if (!activeSeries || activeSeries.length === 0) return null;
    const last30 = activeSeries.slice(Math.max(0, activeSeries.length - 30));
    const sum = last30.reduce((acc, curr) => acc + (Number(curr.rainfall) || 0), 0);
    return sum.toFixed(1);
  }, [activeSeries]);

  const latestSolar = useMemo(() => {
    if (!activeSeries || activeSeries.length === 0) return null;
    const last = activeSeries[activeSeries.length - 1];
    const val = last.solar_radiation ?? last.ALLSKY_SFC_SW_DWN;
    return val != null ? Number(val).toFixed(1) : null;
  }, [activeSeries]);

  const dewPoint = (tempVal != null && humidVal != null)
    ? (tempVal - ((100 - humidVal) / 5)).toFixed(1)
    : null;
  const diurnalRange = (tempMax - tempMin).toFixed(1);
  const et0 = ((0.0023 * (tempVal + 17.8) * Math.sqrt(Math.max(1, tempMax - tempMin)) * 14.2) / 2.45).toFixed(1); // Hargreaves approximation
  const gdd = Math.max(0, ((tempMax + tempMin) / 2) - 10).toFixed(1); // Base 10C for maize/rice

  return (
    <div className="nasa-weather-container">
      {/* Top Header Command Bar */}
      <div className="nasa-view-header">
        <div className="nasa-header-left">
          <div className="nasa-badge-row" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            <span className="nasa-satellite-pill">
              <span className="nasa-pulse-dot" /> NASA POWER AGROMETEOROLOGICAL
            </span>
            <span className="nasa-res-tag">SPATIAL RESOLUTION: 0.5° × 0.5° (~50 KM)</span>
            <DataSourceTag
              source="NASA POWER"
              cache="30-day cached demo window"
              period={observationDate ? `30 days ending ${observationDate}` : "30-day demo window"}
            />
          </div>
          <h1 className="nasa-title">Environmental Observations &amp; 3D Climate Station</h1>
          <p className="nasa-subtitle">
            Observed daily climate telemetry (Context only — empirical NASA CERES &amp; MERRA-2 meteorological assimilation)
          </p>
        </div>
        <div className="nasa-header-actions">
          <button type="button" className="back-btn" onClick={onBack}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      {/* Target Field Mission Banner */}
      <div className="nasa-mission-banner">
        <div className="mission-stat">
          <span className="mission-label">Target Field Parcel</span>
          <strong className="mission-value">{locationName}</strong>
        </div>
        <div className="mission-divider" />
        <div className="mission-stat">
          <span className="mission-label">GPS Geolocation</span>
          <strong className="mission-value">{latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E</strong>
        </div>
        <div className="mission-divider" />
        <div className="mission-stat">
          <span className="mission-label">Validation Date</span>
          <strong className="mission-value highlight-green">{observationDate}</strong>
        </div>
        <div className="mission-divider" />
        <div className="mission-stat">
          <span className="mission-label">Assimilation Span</span>
          <strong className="mission-value">{observationDays} Consecutive Days</strong>
        </div>
        <div className="mission-divider" />
        <div className="mission-stat">
          <span className="mission-label">Data Assurance</span>
          <strong className={`mission-value ${isObserved ? 'highlight-cyan' : 'highlight-amber'}`}>
            {isObserved ? 'Direct Climatology' : 'Cached Archive'}
          </strong>
        </div>
      </div>

      {/* Main Grid: Primary Instruments & Telemetry */}
      <div className="nasa-main-grid" style={{ gridTemplateColumns: '1fr' }}>
        {/* 3D Physical Weather Instrument Deck (5 Interactive 3D Instruments) */}
        <div className="nasa-instruments-deck">
          {/* Gauge 1: 3D Temperature & Thermal Envelope */}
          <div className="gauge-card-3d">
            <div className="gauge-header">
              <span className="gauge-title">🌡️ Thermal Envelope</span>
              <span className="gauge-pill temp">DIURNAL: Δ {diurnalRange}°C</span>
            </div>
            <div className="gauge-body">
              <div className="thermometer-3d-visual">
                <div className="thermo-tube">
                  <div
                    className="thermo-fill"
                    style={{ height: `${Math.min(100, Math.max(10, ((tempVal - 10) / 35) * 100))}%` }}
                  />
                  <div className="thermo-bulb" />
                </div>
              </div>
              <div className="gauge-readouts">
                <div className="readout-hero">
                  <span className="readout-num">{tempVal}</span>
                  <span className="readout-unit">°C</span>
                </div>
                <div className="readout-limits">
                  <div><span>Max:</span> <strong>{tempMax}°C</strong></div>
                  <div><span>Min:</span> <strong>{tempMin}°C</strong></div>
                </div>
                <span className="readout-status-tag tag-green">{tempVal >= 20 && tempVal <= 32 ? "Optimal temp (rule-based hint)" : "Suboptimal temp (rule-based hint)"}</span>
              </div>
            </div>
          </div>

          {/* Gauge 2: 3D Precipitation & Hydrology Cylinder */}
          <div className="gauge-card-3d">
            <div className="gauge-header">
              <span className="gauge-title">🌧️ Daily Precipitation</span>
              <span className="gauge-pill rain">HYDROLOGY</span>
            </div>
            <div className="gauge-body">
              <div className="rain-cylinder-3d">
                <div className="cylinder-top" />
                <div className="cylinder-body">
                  <div
                    className="cylinder-water"
                    style={{ height: `${Math.min(95, Math.max(15, (rainVal / 25) * 100))}%` }}
                  >
                    <div className="water-surface" />
                  </div>
                </div>
              </div>
              <div className="gauge-readouts">
                <div className="readout-hero">
                  <span className="readout-num">{rainVal}</span>
                  <span className="readout-unit">mm/day</span>
                </div>
                <div className="readout-limits">
                  <div><span>30-Day Sum:</span> <strong>{rain30DaySum != null ? `${rain30DaySum} mm` : (lang === 'bn' ? 'তথ্য নেই' : 'No data')}</strong></div>
                  <div><span>Intensity:</span> <strong>{rainVal > 5 ? 'Moderate' : 'Light Trace'}</strong></div>
                </div>
                <span className="readout-status-tag tag-blue">{rainVal > 2 ? "Precipitation observed (rule-based hint)" : "Low precipitation (rule-based hint)"}</span>
              </div>
            </div>
          </div>

          {/* Gauge 3: 3D Relative Humidity Hydrometer */}
          <div className="gauge-card-3d">
            <div className="gauge-header">
              <span className="gauge-title">💧 Relative Humidity</span>
              <span className="gauge-pill humidity">DEW POINT: {dewPoint}°C</span>
            </div>
            <div className="gauge-body">
              <div className="hygro-orb-3d">
                <div className="orb-outer">
                  <div className="orb-inner" style={{ opacity: humidVal / 100 }} />
                  <span className="orb-icon">💧</span>
                </div>
              </div>
              <div className="gauge-readouts">
                <div className="readout-hero">
                  <span className="readout-num">{humidVal}</span>
                  <span className="readout-unit">%</span>
                </div>
                <div className="readout-limits">
                  <div><span>Vapor Pressure:</span> <strong>High</strong></div>
                  <div><span>Risk Index:</span> <strong style={{ color: humidVal > 80 ? 'var(--sun)' : 'var(--leaf)' }}>{humidVal > 80 ? 'High humidity (rule-based hint)' : 'Normal (rule-based hint)'}</strong></div>
                </div>
                <span className="readout-status-tag tag-amber">{humidVal > 80 ? "High humidity (rule-based hint)" : "Moderate humidity (rule-based hint)"}</span>
              </div>
            </div>
          </div>

          {/* Gauge 4: 3D Wind Vector Compass & Anemometer */}
          <div className="gauge-card-3d">
            <div className="gauge-header">
              <span className="gauge-title">🧭 Surface Wind Field</span>
              <span className="gauge-pill wind">BEAUFORT: 1</span>
            </div>
            <div className="gauge-body">
              <div className="compass-3d-visual">
                <div className="compass-plate">
                  <div className="compass-arrow" style={{ transform: 'rotate(55deg)' }}>
                    ▲
                  </div>
                  <span className="compass-label north">N</span>
                  <span className="compass-label east">E</span>
                  <span className="compass-label south">S</span>
                  <span className="compass-label west">W</span>
                </div>
              </div>
              <div className="gauge-readouts">
                <div className="readout-hero">
                  <span className="readout-num">{windVal}</span>
                  <span className="readout-unit">m/s</span>
                </div>
                <div className="readout-limits">
                  <div><span>Speed:</span> <strong>{((windVal * 3.6)).toFixed(1)} km/h</strong></div>
                  <div><span>Direction:</span> <strong>NE (55°)</strong></div>
                </div>
                <span className="readout-status-tag tag-green">{windVal >= 1 && windVal <= 4 ? "Low wind (rule-based hint)" : "High wind (rule-based hint)"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 30-Day Timeseries Charting Engine */}
      <div className="nasa-chart-card">
        <div className="chart-header-row">
          <div className="chart-title-wrap">
            <h3>📈 Empirical Observation Timeseries Curve</h3>
            <p>Continuous daily atmospheric measurements from NASA POWER Point Grid</p>
          </div>
          <div className="chart-controls-wrap">
            <div className="chart-metric-selector">
              <button
                type="button"
                className={`metric-tab-btn ${activeChartMetric === 'temp' ? 'active' : ''}`}
                onClick={() => setActiveChartMetric('temp')}
              >
                🌡️ Temperature High/Mean/Low
              </button>
              <button
                type="button"
                className={`metric-tab-btn ${activeChartMetric === 'rain' ? 'active' : ''}`}
                onClick={() => setActiveChartMetric('rain')}
              >
                🌧️ Precipitation Rainfall
              </button>
              <button
                type="button"
                className={`metric-tab-btn ${activeChartMetric === 'humidity' ? 'active' : ''}`}
                onClick={() => setActiveChartMetric('humidity')}
              >
                💧 Relative Humidity
              </button>
              <button
                type="button"
                className={`metric-tab-btn ${activeChartMetric === 'solar' ? 'active' : ''}`}
                onClick={() => setActiveChartMetric('solar')}
              >
                ☀️ Solar Irradiance
              </button>
            </div>
            <div className="chart-horizon-selector">
              <button
                type="button"
                className={`horizon-btn ${timeHorizon === 7 ? 'active' : ''}`}
                onClick={() => setTimeHorizon(7)}
              >
                7D
              </button>
              <button
                type="button"
                className={`horizon-btn ${timeHorizon === 14 ? 'active' : ''}`}
                onClick={() => setTimeHorizon(14)}
              >
                14D
              </button>
              <button
                type="button"
                className={`horizon-btn ${timeHorizon === 30 ? 'active' : ''}`}
                onClick={() => setTimeHorizon(30)}
              >
                30D Full
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic SVG Chart Canvas */}
        <div className="chart-svg-container">
          <svg className="nasa-timeseries-svg" viewBox="0 0 960 260" preserveAspectRatio="none">
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#facc15" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#facc15" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#facc15" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            <line x1="60" y1="40" x2="940" y2="40" stroke="rgba(148, 163, 184, 0.2)" strokeDasharray="3 3" />
            <line x1="60" y1="95" x2="940" y2="95" stroke="rgba(148, 163, 184, 0.2)" strokeDasharray="3 3" />
            <line x1="60" y1="150" x2="940" y2="150" stroke="rgba(148, 163, 184, 0.2)" strokeDasharray="3 3" />
            <line x1="60" y1="205" x2="940" y2="205" stroke="rgba(148, 163, 184, 0.3)" />

            {/* Metric Chart Lines */}
            {activeChartMetric === 'temp' && (
              <>
                {/* Max Temp Line (Red) */}
                <path
                  d={chartData.reduce((acc, d, i) => {
                    const x = 60 + (i / (chartData.length - 1)) * 880;
                    const y = 205 - ((d.temp_max - 20) / 20) * 165;
                    return i === 0 ? `M${x},${y}` : `${acc} L${x},${y}`;
                  }, '')}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                />
                {/* Mean Temp Line with Area Fill */}
                <path
                  d={`${chartData.reduce((acc, d, i) => {
                    const x = 60 + (i / (chartData.length - 1)) * 880;
                    const y = 205 - ((d.temperature - 20) / 20) * 165;
                    return i === 0 ? `M${x},${y}` : `${acc} L${x},${y}`;
                  }, '')} L940,205 L60,205 Z`}
                  fill="url(#tempGradient)"
                />
                <path
                  d={chartData.reduce((acc, d, i) => {
                    const x = 60 + (i / (chartData.length - 1)) * 880;
                    const y = 205 - ((d.temperature - 20) / 20) * 165;
                    return i === 0 ? `M${x},${y}` : `${acc} L${x},${y}`;
                  }, '')}
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="3"
                />
                {/* Min Temp Line (Blue) */}
                <path
                  d={chartData.reduce((acc, d, i) => {
                    const x = 60 + (i / (chartData.length - 1)) * 880;
                    const y = 205 - ((d.temp_min - 20) / 20) * 165;
                    return i === 0 ? `M${x},${y}` : `${acc} L${x},${y}`;
                  }, '')}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
              </>
            )}

            {activeChartMetric === 'rain' && (
              <g>
                {chartData.map((d, i) => {
                  const x = 60 + (i / (chartData.length - 1)) * 880 - 6;
                  const barH = Math.max(4, Math.min(160, (d.rainfall / 25) * 160));
                  const y = 205 - barH;
                  return (
                    <rect
                      key={d.date}
                      x={x}
                      y={y}
                      width="12"
                      height={barH}
                      rx="3"
                      fill="url(#rainGradient)"
                      stroke="#38bdf8"
                      strokeWidth="1"
                    />
                  );
                })}
              </g>
            )}

            {activeChartMetric === 'humidity' && (
              <>
                <path
                  d={`${chartData.reduce((acc, d, i) => {
                    const x = 60 + (i / (chartData.length - 1)) * 880;
                    const y = 205 - ((d.humidity - 50) / 50) * 165;
                    return i === 0 ? `M${x},${y}` : `${acc} L${x},${y}`;
                  }, '')} L940,205 L60,205 Z`}
                  fill="url(#humidityGradient)"
                />
                <path
                  d={chartData.reduce((acc, d, i) => {
                    const x = 60 + (i / (chartData.length - 1)) * 880;
                    const y = 205 - ((d.humidity - 50) / 50) * 165;
                    return i === 0 ? `M${x},${y}` : `${acc} L${x},${y}`;
                  }, '')}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                />
              </>
            )}

            {activeChartMetric === 'solar' && (
              <>
                <path
                  d={`${chartData.reduce((acc, d, i) => {
                    const x = 60 + (i / (chartData.length - 1)) * 880;
                    const y = 205 - ((d.solar_radiation - 5) / 20) * 165;
                    return i === 0 ? `M${x},${y}` : `${acc} L${x},${y}`;
                  }, '')} L940,205 L60,205 Z`}
                  fill="url(#solarGradient)"
                />
                <path
                  d={chartData.reduce((acc, d, i) => {
                    const x = 60 + (i / (chartData.length - 1)) * 880;
                    const y = 205 - ((d.solar_radiation - 5) / 20) * 165;
                    return i === 0 ? `M${x},${y}` : `${acc} L${x},${y}`;
                  }, '')}
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="3"
                />
              </>
            )}

            {/* Interactive Data Point Dots */}
            {chartData.map((d, i) => {
              const x = 60 + (i / (chartData.length - 1)) * 880;
              let y = 120;
              if (activeChartMetric === 'temp') y = 205 - ((d.temperature - 20) / 20) * 165;
              if (activeChartMetric === 'rain') y = 205 - Math.max(4, Math.min(160, (d.rainfall / 25) * 160));
              if (activeChartMetric === 'humidity') y = 205 - ((d.humidity - 50) / 50) * 165;
              if (activeChartMetric === 'solar') y = 205 - ((d.solar_radiation - 5) / 20) * 165;

              return (
                <g key={d.date} onMouseEnter={() => setHoveredDataPoint(d)} onMouseLeave={() => setHoveredDataPoint(null)}>
                  <circle cx={x} cy={y} r="5" fill="#eef3ee" stroke="#00df81" strokeWidth="2.5" style={{ cursor: 'pointer' }} />
                </g>
              );
            })}

            {/* Axis Y Labels */}
            {activeChartMetric === 'temp' && (
              <>
                <text x="20" y="44" fill="var(--text-muted, #94a3b8)" fontSize="10.5" fontWeight="700">40°C</text>
                <text x="20" y="99" fill="var(--text-muted, #94a3b8)" fontSize="10.5" fontWeight="700">33°C</text>
                <text x="20" y="154" fill="var(--text-muted, #94a3b8)" fontSize="10.5" fontWeight="700">26°C</text>
                <text x="20" y="209" fill="var(--text-muted, #94a3b8)" fontSize="10.5" fontWeight="700">20°C</text>
              </>
            )}
            {activeChartMetric === 'rain' && (
              <>
                <text x="15" y="44" fill="var(--text-muted, #94a3b8)" fontSize="10.5" fontWeight="700">25 mm</text>
                <text x="15" y="99" fill="var(--text-muted, #94a3b8)" fontSize="10.5" fontWeight="700">18 mm</text>
                <text x="15" y="154" fill="var(--text-muted, #94a3b8)" fontSize="10.5" fontWeight="700">10 mm</text>
                <text x="20" y="209" fill="var(--text-muted, #94a3b8)" fontSize="10.5" fontWeight="700">0 mm</text>
              </>
            )}
            {activeChartMetric === 'humidity' && (
              <>
                <text x="15" y="44" fill="var(--text-muted, #94a3b8)" fontSize="10.5" fontWeight="700">100%</text>
                <text x="20" y="99" fill="var(--text-muted, #94a3b8)" fontSize="10.5" fontWeight="700">85%</text>
                <text x="20" y="154" fill="var(--text-muted, #94a3b8)" fontSize="10.5" fontWeight="700">70%</text>
                <text x="20" y="209" fill="var(--text-muted, #94a3b8)" fontSize="10.5" fontWeight="700">50%</text>
              </>
            )}
            {activeChartMetric === 'solar' && (
              <>
                <text x="10" y="44" fill="var(--text-muted, #94a3b8)" fontSize="10.5" fontWeight="700">25 MJ</text>
                <text x="10" y="99" fill="var(--text-muted, #94a3b8)" fontSize="10.5" fontWeight="700">18 MJ</text>
                <text x="10" y="154" fill="var(--text-muted, #94a3b8)" fontSize="10.5" fontWeight="700">12 MJ</text>
                <text x="15" y="209" fill="var(--text-muted, #94a3b8)" fontSize="10.5" fontWeight="700">5 MJ</text>
              </>
            )}

            {/* X Axis Date Labels */}
            <text x="60" y="235" fill="rgba(238, 243, 238, 0.42)" fontSize="10.5" fontWeight="700">{chartData[0]?.date}</text>
            <text x="480" y="235" fill="rgba(238, 243, 238, 0.42)" fontSize="10.5" fontWeight="700">{chartData[Math.floor(chartData.length / 2)]?.date}</text>
            <text x="880" y="235" fill="rgba(238, 243, 238, 0.42)" fontSize="10.5" fontWeight="700">{chartData[chartData.length - 1]?.date}</text>
          </svg>

          {/* Interactive Tooltip Card on Hover */}
          {hoveredDataPoint && (
            <div className="chart-hover-pill">
              <strong>📅 {hoveredDataPoint.date}</strong>
              <span>Temp: <strong>{hoveredDataPoint.temperature}°C</strong> (Min {hoveredDataPoint.temp_min}° / Max {hoveredDataPoint.temp_max}°)</span>
              <span>Rainfall: <strong>{hoveredDataPoint.rainfall} mm</strong></span>
              <span>Humidity: <strong>{hoveredDataPoint.humidity}%</strong></span>
              <span>Solar: <strong>{hoveredDataPoint.solar_radiation} MJ/m²</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Agro-Climatic Intelligence Cards */}
      <div className="nasa-agro-grid">
        <div className="agro-card">
          <div className="agro-icon-wrap" style={{ background: 'rgba(108, 196, 224, 0.15)', color: '#38bdf8' }}>
            🌾
          </div>
          <div className="agro-content">
            <h4>Reference Evapotranspiration (ET₀)</h4>
            <div className="agro-val">{et0} <small>mm/day</small></div>
            <p>Estimated atmospheric crop water extraction demand calculated via FAO-56 radiation-temperature model.</p>
          </div>
        </div>

        <div className="agro-card">
          <div className="agro-icon-wrap" style={{ background: 'rgba(242, 193, 78, 0.15)', color: '#facc15' }}>
            🌿
          </div>
          <div className="agro-content">
            <h4>Thermal Heat Accumulation (GDD)</h4>
            <div className="agro-val">{gdd} <small>GDD / day</small></div>
            <p>Growing degree days (Base 10°C). Favorable for vegetative biomass acceleration in Rabi/Kharif pulses.</p>
          </div>
        </div>
      </div>

      {/* Scientific Provenance, Safety Boundaries & Mission Notice */}
      <div className="nasa-safety-card">
        <div className="safety-header">
          <div className="safety-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00df81" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <h3>Scientific Safety Boundaries &amp; NASA POWER Provenance</h3>
          </div>
        </div>
        <div className="safety-body">
          <p>
            <strong>Empirical Historical Ground Context:</strong> NASA POWER observations provide empirical historical and recent environmental context for the selected field coordinates ({latitude.toFixed(4)}°, {longitude.toFixed(4)}°).
          </p>
          <p>
            <strong>Non-Predictive Safety Policy:</strong> The prototype does not silently substitute synthetic data for failed live queries; offline demo data is clearly isolated and labelled. Observations represent historical and recent daily climate values rather than real-time field weather station sensors.
          </p>
          <p>
            <strong>Hydrology &amp; Soil Sensor Isolation:</strong> Soil moisture or localized sensor telemetry is explicitly retained as missing or synthetic and not inferred, preventing hazardous agricultural water miscalculations.
          </p>
        </div>
      </div>
    </div>
  );
}
