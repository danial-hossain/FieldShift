import React, { useState, useEffect, useMemo, useRef } from 'react';
import { request } from './apiClient.js';
import { useRotationPlans, extractPlanCrops } from './store/rotationPlansStore.js';
import { toEnglishNumber } from './i18n.js';
import { getChartTheme, CHART_PALETTE, computeTrendTakeaway, ChartTooltip } from './ui/chartTheme.js';

export function NasaWeatherStation3D({
  nasa = {},
  env = {},
  activeField = null,
  onBack,
  lang = 'bn',
  onNavigate,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredChartPoint, setHoveredChartPoint] = useState(null); // { chartId, year, val, unit, x, y }
  const [activePlanYear, setActivePlanYear] = useState(0); // 0 = Y1, 1 = Y2

  // Shared rotation plan store
  const { plansByPriority, selectedPriority } = useRotationPlans({ field: activeField, lang, request });
  const selectedPlan = plansByPriority[selectedPriority] || plansByPriority.balanced;
  const rawPlanCrops = useMemo(() => extractPlanCrops(selectedPlan), [selectedPlan]);

  // Dynamic crops mapped from the chosen rotation plan
  const displayedCrops = useMemo(() => {
    const fallbackY1 = [
      { name: lang === 'bn' ? 'সরিষা' : 'Mustard', color: '#f2c94c', from: 0, to: 3, fl: [1, 2] },
      { name: lang === 'bn' ? 'মুগ ডাল' : 'Mungbean', color: '#9fd36a', from: 5, to: 7, fl: [6] },
      { name: lang === 'bn' ? 'আমন ধান' : 'Aman Rice', color: '#5fbf6a', from: 8, to: 11, fl: [10] },
    ];
    const fallbackY2 = [
      { name: lang === 'bn' ? 'ছোলা' : 'Chickpea', color: '#c9d88a', from: 0, to: 4, fl: [3] },
      { name: lang === 'bn' ? 'তিল' : 'Sesame', color: '#e8e2cf', from: 5, to: 7, fl: [6, 7] },
      { name: lang === 'bn' ? 'আমন ধান' : 'Aman Rice', color: '#5fbf6a', from: 8, to: 11, fl: [10] },
    ];

    const getCropWindow = (cropName, defaultCrop) => {
      if (!cropName) return defaultCrop;
      const c = String(cropName).toLowerCase();
      if (c.includes('mustard') || c.includes('সরিষা')) {
        return { name: lang === 'bn' ? 'সরিষা' : 'Mustard', color: '#f2c94c', from: 0, to: 3, fl: [1, 2] };
      }
      if (c.includes('mung') || c.includes('মুগ')) {
        return { name: lang === 'bn' ? 'মুগ ডাল' : 'Mungbean', color: '#9fd36a', from: 5, to: 7, fl: [6] };
      }
      if (c.includes('chickpea') || c.includes('ছোলা')) {
        return { name: lang === 'bn' ? 'ছোলা' : 'Chickpea', color: '#c9d88a', from: 0, to: 4, fl: [3] };
      }
      if (c.includes('sesame') || c.includes('তিল')) {
        return { name: lang === 'bn' ? 'তিল' : 'Sesame', color: '#e8e2cf', from: 5, to: 7, fl: [6, 7] };
      }
      if (c.includes('wheat') || c.includes('গম')) {
        return { name: lang === 'bn' ? 'গম' : 'Wheat', color: '#e5b869', from: 0, to: 4, fl: [2, 3] };
      }
      if (c.includes('sunflower') || c.includes('সূর্যমুখী')) {
        return { name: lang === 'bn' ? 'সূর্যমুখী' : 'Sunflower', color: '#f59e0b', from: 0, to: 4, fl: [2, 3] };
      }
      if (c.includes('tomato') || c.includes('টমেটো')) {
        return { name: lang === 'bn' ? 'টমেটো' : 'Tomato', color: '#ef4444', from: 0, to: 4, fl: [2, 3] };
      }
      if (c.includes('boro') || c.includes('বোরো')) {
        return { name: lang === 'bn' ? 'বোরো ধান' : 'Boro Rice', color: '#3b82f6', from: 1, to: 5, fl: [3, 4] };
      }
      if (c.includes('aman') || c.includes('ধান') || c.includes('rice')) {
        return { name: lang === 'bn' ? 'আমন ধান' : 'Aman Rice', color: '#5fbf6a', from: 8, to: 11, fl: [10] };
      }
      return { name: cropName, color: defaultCrop.color, from: defaultCrop.from, to: defaultCrop.to, fl: defaultCrop.fl };
    };

    return activePlanYear === 0
      ? [
          getCropWindow(rawPlanCrops?.[0], fallbackY1[0]),
          getCropWindow(rawPlanCrops?.[1], fallbackY1[1]),
          getCropWindow(rawPlanCrops?.[2], fallbackY1[2]),
        ]
      : [
          getCropWindow(rawPlanCrops?.[3], fallbackY2[0]),
          getCropWindow(rawPlanCrops?.[4], fallbackY2[1]),
          getCropWindow(rawPlanCrops?.[5], fallbackY2[2]),
        ];
  }, [activePlanYear, rawPlanCrops, lang]);

  // Target coordinates
  const lat = activeField?.latitude != null ? Number(activeField.latitude) : 24.59;
  const lon = activeField?.longitude != null ? Number(activeField.longitude) : 88.27;
  const fieldId = activeField?.id || 'demo';
  const fieldName = activeField?.name || (lang === 'bn' ? 'রহিম মিয়ার জমি' : 'Rahim Farm');

  useEffect(() => {
    let isCancelled = false;
    async function loadClimateSummary() {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams({
          lat: String(lat),
          lon: String(lon),
          field_id: String(fieldId),
        });
        const res = await request(`/api/climate/field-summary?${query.toString()}`);
        if (!isCancelled) {
          if (res?.status === 'unavailable') {
            setError(res.message || (lang === 'bn' ? 'তথ্য নেই' : 'No data available'));
          } else {
            setData(res);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to load climate field summary:', err);
          setError(lang === 'bn' ? 'আবহাওয়া তথ্য লোড করতে সমস্যা হয়েছে' : 'Failed to load climate data');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadClimateSummary();
    return () => { isCancelled = true; };
  }, [lat, lon, fieldId, lang]);

  // Number formatters
  const bn = useMemo(() => {
    return (num, decimals = 0) => {
      if (num == null || isNaN(num)) return '—';
      const absVal = Math.abs(Number(num));
      const formatted = lang === 'en'
        ? absVal.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : absVal.toLocaleString('bn-BD', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      return num < 0 ? `−${formatted}` : formatted;
    };
  }, [lang]);

  const by = useMemo(() => {
    return (yr) => {
      if (yr == null) return '';
      if (lang === 'en') return String(yr);
      return Number(yr).toLocaleString('bn-BD', { useGrouping: false });
    };
  }, [lang]);

  const summary = useMemo(() => data?.summary || {}, [data]);
  const provenance = useMemo(() => data?.provenance || {}, [data]);
  const thenVsNow = summary.then_vs_now;
  const grace = useMemo(() => summary.grace || {}, [summary]);
  const onset = useMemo(() => summary.onset || {}, [summary]);

  // Find the clearest signal among verdict rows (p < 0.05)
  const clearestSignal = useMemo(() => {
    if (!data) return null;
    const signals = [
      { name_bn: 'মাটির নিচের পানি', name_en: 'Groundwater storage', p: grace.p_value ?? 1.0 },
      { name_bn: 'সর্বোচ্চ তাপমাত্রা', name_en: 'Maximum temperature', p: summary.tmax_trend?.[1] ?? 1.0 },
      { name_bn: 'রাতের তাপমাত্রা', name_en: 'Nighttime temperature', p: summary.tmin_trend?.[1] ?? 1.0 },
      { name_bn: 'অতিরিক্ত গরম দিন', name_en: 'Extreme heat days', p: summary.heat_trend?.[1] ?? 1.0 },
      { name_bn: 'মোট বৃষ্টিপাত', name_en: 'Annual rainfall', p: summary.annual_trend?.[1] ?? 1.0 },
      { name_bn: 'আমন বৃষ্টি শুরু', name_en: 'Monsoon onset', p: onset.p_value ?? 1.0 },
    ];
    signals.sort((a, b) => a.p - b.p);
    return signals[0]?.p < 0.05 ? signals[0] : null;
  }, [data, grace, onset, summary]);

  // Verdict list with empirical p-values
  const verdicts = useMemo(() => {
    if (!summary.years) return [];
    return [
      {
        icon: '🌡️',
        title_bn: `সর্বোচ্চ তাপমাত্রা দশকে ${bn(summary.tmax_trend?.[0], 2)}°C ${summary.tmax_trend?.[0] >= 0 ? 'বেড়েছে' : 'কমেছে'}`,
        title_en: `Maximum temperature shifted ${Number(summary.tmax_trend?.[0] || 0).toFixed(2)}°C per decade`,
        p: summary.tmax_trend?.[1] ?? 1.0,
        period: '২০০১–২০২৪',
        period_en: '2001–2024',
      },
      {
        icon: '🌙',
        title_bn: `রাতের তাপমাত্রা দশকে ${bn(summary.tmin_trend?.[0], 2)}°C ${summary.tmin_trend?.[0] >= 0 ? 'বেড়েছে' : 'কমেছে'}`,
        title_en: `Nighttime minimum temperature shifted ${Number(summary.tmin_trend?.[0] || 0).toFixed(2)}°C per decade`,
        p: summary.tmin_trend?.[1] ?? 1.0,
        period: '২০০১–২০২৪',
        period_en: '2001–2024',
      },
      {
        icon: '🔥',
        title_bn: `৩৫°C-এর বেশি গরম দিন দশকে ${bn(summary.heat_trend?.[0], 1)}টি ${summary.heat_trend?.[0] >= 0 ? 'বেড়েছে' : 'কমেছে'}`,
        title_en: `Heat stress days (>35°C) shifted ${Number(summary.heat_trend?.[0] || 0).toFixed(1)} days per decade`,
        p: summary.heat_trend?.[1] ?? 1.0,
        period: '২০০১–২০২৪',
        period_en: '2001–2024',
      },
      {
        icon: '🌧️',
        title_bn: `বছরের মোট বৃষ্টি দশকে ${bn(Math.abs(summary.annual_trend?.[0] || 0))} মিমি ${summary.annual_trend?.[0] >= 0 ? 'বেড়েছে' : 'কমেছে'}`,
        title_en: `Annual rainfall shifted ${Math.round(Math.abs(summary.annual_trend?.[0] || 0))} mm per decade`,
        p: summary.annual_trend?.[1] ?? 1.0,
        period: '২০০১–২০২৪',
        period_en: '2001–2024',
      },
      {
        icon: '📅',
        title_bn: onset.verdict_bn || 'আমন রোপণের বৃষ্টি শুরুর তারিখে কোনো তাৎপর্যপূর্ণ পরিবর্তন নেই',
        title_en: onset.verdict_en || 'No statistically significant shift in monsoon onset',
        p: onset.p_value ?? 0.5,
        period: '২০০১–২০২৪',
        period_en: '2001–2024',
      },
    ];
  }, [summary, onset, bn]);

  // Chart SVG rendering helper (LA3: Unified Chart Theme)
  const renderChart = ({
    id,
    title,
    say,
    src,
    vals = [],
    kind = 'line',
    color = null,
    unit = '',
    trend = null,
    dec = 0,
    ymin = null,
  }) => {
    if (!vals || vals.length === 0) return null;
    const themeColors = getChartTheme('dark');
    const seriesColor = color || (kind === 'bar' ? themeColors.cyan : themeColors.lime);
    const W = 520;
    const H = 170;
    const L = 38;
    const R = 12;
    const T = 12;
    const B = 24;
    const yrs = summary.years || [];
    const n = vals.length;
    const lo = ymin !== null ? ymin : Math.min(...vals);
    const hi = Math.max(...vals);
    const pad = (hi - lo) * 0.12 || 1;
    const y0 = kind === 'bar' ? 0 : lo - pad;
    const y1 = hi + pad;

    const getX = (i) => L + (i + 0.5) * (W - L - R) / n;
    const getY = (v) => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
    const bw = Math.max(4, (W - L - R) / n - 2);

    const ticks = [y0, (y0 + y1) / 2, y1].map((v) =>
      Math.round(v * (dec ? 10 : 1)) / (dec ? 10 : 1)
    );

    // Trend line coordinates
    let trendLine = null;
    if (trend !== null) {
      const m = trend / 10;
      const mean = vals.reduce((a, b) => a + b, 0) / n;
      const xm = (n - 1) / 2;
      const a = mean - m * xm;
      trendLine = {
        x1: getX(0),
        y1: getY(a),
        x2: getX(n - 1),
        y2: getY(a + m * (n - 1)),
      };
    }

    const polyPoints = vals.map((v, i) => `${getX(i).toFixed(1)},${getY(v).toFixed(1)}`).join(' ');
    const areaPoints = `${polyPoints} ${getX(n - 1).toFixed(1)},${(H - B).toFixed(1)} ${getX(0).toFixed(1)},${(H - B).toFixed(1)}`;

    // Data-driven takeaway above chart
    const dynamicTakeaway = computeTrendTakeaway(vals, unit, lang) || say;

    return (
      <div className="ch" key={id} style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
          <h3 style={{ fontSize: '14.5px', margin: 0, color: '#EAF6E6', fontWeight: 700 }}>
            {title} {unit && <span style={{ fontSize: 11.5, color: themeColors.axisText, fontWeight: 500 }}>({unit})</span>}
          </h3>
        </div>
        <p className="say" style={{ fontSize: '12.5px', margin: '0 0 8px 0', color: themeColors.lime, minHeight: 18, fontWeight: 600 }}>
          {dynamicTakeaway}
        </p>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
          {/* Ticks and grid lines */}
          {ticks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={L}
                x2={W - R}
                y1={getY(t)}
                y2={getY(t)}
                stroke={themeColors.grid}
                strokeWidth="1"
              />
              <text
                x={L - 6}
                y={getY(t) + 4}
                textAnchor="end"
                fill={themeColors.axisText}
                fontSize="11"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {bn(t, dec)}
              </text>
            </g>
          ))}

          {/* Year labels */}
          {[0, 5, 10, 15, 20, Math.max(0, n - 1)].map((idx) => {
            if (idx >= n) return null;
            return (
              <text
                key={idx}
                x={getX(idx)}
                y={H - 6}
                textAnchor="middle"
                fill={themeColors.axisText}
                fontSize="11"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {by(yrs[idx])}
              </text>
            );
          })}

          {/* Vertical Crosshair Line on hover */}
          {hoveredChartPoint?.chartId === id && (
            <line
              x1={hoveredChartPoint.x}
              x2={hoveredChartPoint.x}
              y1={T}
              y2={H - B}
              stroke={themeColors.crosshair}
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Bars or Line */}
          {kind === 'bar' ? (
            vals.map((v, i) => {
              const barHeight = Math.max(2, getY(0) - getY(v));
              return (
                <rect
                  key={i}
                  className="chart-bar-animated"
                  x={getX(i) - bw / 2}
                  y={getY(v)}
                  width={bw}
                  height={barHeight}
                  rx="4"
                  ry="4"
                  fill={seriesColor}
                  opacity="0.85"
                  style={{ animationDelay: `${i * 30}ms` }}
                />
              );
            })
          ) : (
            <g>
              {/* 15% Area fill */}
              <polygon
                points={areaPoints}
                fill={seriesColor}
                opacity="0.15"
              />
              <polyline
                className="chart-line-animated"
                points={polyPoints}
                fill="none"
                stroke={seriesColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}

          {/* Dashed trend line */}
          {trendLine && (
            <line
              x1={trendLine.x1}
              y1={trendLine.y1}
              x2={trendLine.x2}
              y2={trendLine.y2}
              stroke="#EAF6E6"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.65"
            />
          )}

          {/* Interactive hover hit boxes */}
          {vals.map((v, i) => (
            <rect
              key={i}
              x={getX(i) - (W - L - R) / n / 2}
              y={T}
              width={(W - L - R) / n}
              height={H - T - B}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onPointerEnter={() => {
                setHoveredChartPoint({
                  chartId: id,
                  year: yrs[i],
                  val: v,
                  unit,
                  dec,
                  x: getX(i),
                  y: getY(v),
                });
              }}
              onPointerLeave={() => setHoveredChartPoint(null)}
            />
          ))}

          {/* Hover highlight marker */}
          {hoveredChartPoint?.chartId === id && (
            <circle
              cx={hoveredChartPoint.x}
              cy={hoveredChartPoint.y}
              r="4.5"
              fill={seriesColor}
              stroke="#07140D"
              strokeWidth="2"
            />
          )}
        </svg>

        {/* Glass Hover Tooltip */}
        <ChartTooltip
          visible={hoveredChartPoint?.chartId === id}
          x={hoveredChartPoint ? `${(hoveredChartPoint.x / W) * 100}%` : '50%'}
          y={hoveredChartPoint ? `${(hoveredChartPoint.y / H) * 100}%` : '50%'}
          title={hoveredChartPoint ? `${by(hoveredChartPoint.year)}` : ''}
          value={hoveredChartPoint ? `${bn(hoveredChartPoint.val, hoveredChartPoint.dec)}` : ''}
          unit={hoveredChartPoint?.unit || ''}
          theme="dark"
        />

        <span className="src" style={{ fontSize: '11px', color: 'var(--faint, #5f7064)', marginTop: 4, display: 'block' }}>
          {src}
        </span>
      </div>
    );
  };

  return (
    <div className="climate-risk-view content-container" style={{ padding: '0 0 48px', color: 'var(--fg, #e7efe8)' }}>
      {/* Top Header & Field Context */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
        <div>
          <h1 style={{ fontSize: '23px', margin: '0 0 4px', fontWeight: 700 }}>
            {lang === 'bn' ? `আবহাওয়া ও ঝুঁকি · ${fieldName}` : `Climate & Risk · ${fieldName}`}
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--muted, #93a597)' }}>
            {lang === 'bn'
              ? `স্থানাঙ্ক ${bn(lat, 2)}°উ, ${bn(lon, 2)}°পূ · স্যাটেলাইট ও আবহাওয়া উপাত্ত বিশ্লেষণ`
              : `Lat ${lat.toFixed(2)}°, Lon ${lon.toFixed(2)}° · Point-specific satellite & climate telemetry`}
          </div>
        </div>
      </div>

      {loading && (
        <div
          style={{
            padding: '36px 20px',
            background: 'var(--surface, #131b16)',
            border: '1px solid var(--line, rgba(255,255,255,0.1))',
            borderRadius: 16,
            textAlign: 'center',
            color: 'var(--fg, #e7efe8)',
            margin: '20px 0',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 10 }}>🛰️</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px' }}>
            {lang === 'bn' ? 'জমির নিজস্ব স্যাটেলাইট ও আবহাওয়া উপাত্ত লোড হচ্ছে...' : 'Loading Point-Specific Satellite & Weather Telemetry...'}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--muted, #93a597)', margin: '0 0 20px' }}>
            {lang === 'bn'
              ? `স্থানাঙ্ক: ${bn(lat, 2)}° উত্তর, ${bn(lon, 2)}° পূর্ব · সরাসরি গ্রিড ও পয়েন্ট উপাত্ত বিশ্লেষণ চলছে`
              : `Coordinates: ${lat.toFixed(2)}° N, ${lon.toFixed(2)}° E · Analyzing point & grid telemetry`}
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 12,
              maxWidth: 680,
              margin: '0 auto',
            }}
          >
            {[
              {
                source: 'NASA POWER',
                name_bn: 'দৈনিক তাপমাত্রা ও সৌর বিকিরণ',
                name_en: 'Daily Temperature & Solar Radiation',
                status_bn: '১৯৮১–বর্তমান বিন্দু উপাত্ত',
                status_en: '1981–present point series',
              },
              {
                source: 'NASA GPM IMERG',
                name_bn: '১০ কিমি গ্রিড বৃষ্টিপাত',
                name_en: '10km Grid Daily Precipitation',
                status_bn: '২০০১–২০২৪ স্যাটেলাইট রেকর্ড',
                status_en: '2001–2024 satellite record',
              },
              {
                source: 'NASA GRACE / FO',
                name_bn: 'ভূগর্ভস্থ পানির সঞ্চয় ধারা',
                name_en: 'Aquifer Total Water Storage',
                status_bn: 'জেপিএল ম্যাসকন অবক্ষেপ বিশ্লেষণ',
                status_en: 'JPL Mascon Trend Analysis',
              },
            ].map((st, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--surface-2, #18221c)',
                  border: '1px solid var(--line, rgba(255,255,255,0.08))',
                  borderRadius: 10,
                  padding: '10px 14px',
                  flex: '1 1 200px',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent, #c8e46a)', marginBottom: 2 }}>
                  ✓ {st.source}
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--fg, #e7efe8)' }}>
                  {lang === 'bn' ? st.name_bn : st.name_en}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted, #93a597)', marginTop: 2 }}>
                  {lang === 'bn' ? st.status_bn : st.status_en}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: 24, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: 12, color: '#f87171', margin: '20px 0' }}>
          <strong>⚠ {error}</strong>
        </div>
      )}

      {data && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* ==============================================================
              SECTION 1: আপনার জমির জলবায়ু কীভাবে বদলেছে
          ============================================================== */}
          <section
            className="card"
            style={{
              background: 'var(--surface, #131b16)',
              border: '1px solid var(--line, rgba(255,255,255,0.1))',
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '6px 12px', alignItems: 'baseline', marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: '18px', margin: '0 0 4px', fontWeight: 700 }}>
                  {lang === 'bn' ? '১. জমির জলবায়ু পরিবর্তন' : '1. Land Climate Trend'}
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--muted, #93a597)' }}>
                  {lang === 'bn' ? '২৪ বছরের স্যাটেলাইট উপাত্ত বিশ্লেষণ।' : '24-year satellite observation telemetry.'}
                </div>
              </div>
            </div>

            {/* Hero Grid: Verdict List + GRACE Aquifer Card */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'stretch' }}>
              {/* Left Column: Verdict rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {verdicts.map((v, i) => {
                  const isConfirmed = v.p < 0.05;
                  const isHint = v.p >= 0.05 && v.p < 0.10;
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                        background: 'var(--surface-2, #18221c)',
                        borderRadius: 12,
                        padding: '10px 14px',
                      }}
                    >
                      <span
                        style={{
                          flex: 'none',
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: '15px',
                          background: 'var(--surface, #131b16)',
                          border: '1px solid var(--line, rgba(255,255,255,0.1))',
                        }}
                      >
                        {v.icon}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--fg, #e7efe8)', lineHeight: 1.4 }}>
                          {lang === 'bn' ? v.title_bn : v.title_en}{' '}
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: 99,
                              padding: '1px 8px',
                              marginLeft: 4,
                              color: isConfirmed ? 'var(--red, #f07a6a)' : (isHint ? 'var(--amber, #f2b24c)' : 'var(--muted, #93a597)'),
                              background: isConfirmed
                                ? 'rgba(240, 122, 106, 0.15)'
                                : (isHint ? 'rgba(242, 178, 76, 0.15)' : 'var(--surface, #131b16)'),
                              border: isConfirmed || isHint ? 'none' : '1px solid var(--line, rgba(255,255,255,0.1))',
                            }}
                          >
                            {isConfirmed
                              ? (lang === 'bn' ? 'নিশ্চিত' : 'Confirmed')
                              : (isHint ? (lang === 'bn' ? 'ইঙ্গিত, নিশ্চিত নয়' : 'Hint, not confirmed') : (lang === 'bn' ? 'নিশ্চিত নয়' : 'Not significant'))}
                          </span>
                        </p>
                        <small style={{ display: 'block', color: 'var(--muted, #93a597)', fontSize: '11.5px', marginTop: 2 }}>
                          p = {bn(v.p, 2)} · {lang === 'bn' ? v.period : v.period_en}
                        </small>
                      </div>
                    </div>
                  );
                })}

                <div style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted, #93a597)' }}>
                  {lang === 'bn'
                    ? (clearestSignal ? `প্রধান ধারা: ${clearestSignal.name_bn}` : '২৪ বছরের উপাত্তে পরিবর্তন পর্যবেক্ষণাধীন।')
                    : (clearestSignal ? `Key trend: ${clearestSignal.name_en}` : 'Trends monitored over 24-year satellite record.')}
                </div>
              </div>

              {/* Right Column: GRACE Aquifer Depletion Card */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  background: 'linear-gradient(160deg, rgba(95, 176, 239, 0.12), var(--surface, #131b16))',
                  border: '1px solid rgba(95, 176, 239, 0.25)',
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--fg, #e7efe8)' }}>
                    💧 {lang === 'bn' ? 'মাটির নিচের পানি কমছে' : 'Groundwater Storage Trend'}
                  </h3>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: 99,
                      padding: '2px 8px',
                      color: 'var(--red, #f07a6a)',
                      background: 'rgba(240, 122, 106, 0.15)',
                    }}
                  >
                    {lang === 'bn' ? 'সবচেয়ে বড় সংকেত' : 'Primary Signal'}
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: '38px', fontWeight: 700, lineHeight: 1, color: 'var(--fg, #e7efe8)' }}>
                    {bn(grace.sens_slope_cm_yr, 2)}{' '}
                    <small style={{ fontSize: '15px', fontWeight: 600, color: 'var(--muted, #93a597)' }}>
                      {lang === 'bn' ? 'সেমি / বছর' : 'cm / yr'}
                    </small>
                  </div>
                  <div style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--muted, #93a597)' }}>
                    {lang === 'bn' ? '২০০২–২০২৬ পানি সঞ্চয় পরিবর্তন ধারা।' : '2002–2026 water storage anomaly trend.'}
                  </div>
                </div>

                {/* Regional comparison bar chart */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '4px 0' }}>
                  {(grace.regional_comparison || []).map((r, idx) => {
                    const rate = r.trend_cm_yr ?? r.rate ?? 0.0;
                    const maxRate = 1.07;
                    const widthPct = Math.min(100, Math.round((Math.abs(rate) / maxRate) * 100));
                    const isNeg = rate < 0;
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '95px 1fr 65px',
                          gap: 8,
                          alignItems: 'center',
                          fontSize: '12px',
                        }}
                      >
                        <span style={{ color: 'var(--muted, #93a597)' }}>{lang === 'bn' ? r.name_bn : r.name_en}</span>
                        <div style={{ background: 'var(--surface-2, #18221c)', height: 10, borderRadius: 3, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${widthPct}%`,
                              height: '100%',
                              background: isNeg ? 'var(--red, #f07a6a)' : 'var(--green, #3ecf8e)',
                              borderRadius: '0 3px 3px 0',
                            }}
                          />
                        </div>
                        <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                          {rate > 0 ? '+' : ''}{bn(rate, 2)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('farm_planning');
                    }
                  }}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'var(--accent, #c8e46a)',
                    color: 'var(--accent-ink, #0f1a07)',
                    border: 'none',
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: 'auto',
                  }}
                >
                  {lang === 'bn' ? 'বোরোর বদলে কী লাগাবেন? → আবর্তন পরিকল্পনা' : 'Alternatives to Boro? → Rotation Planner'}
                </button>

                <span style={{ fontSize: '11px', color: 'var(--faint, #5f7064)' }}>
                  {lang === 'bn' ? 'উৎস: NASA GRACE/GRACE-FO JPL RL06.3M mascon' : 'Source: NASA GRACE/GRACE-FO JPL RL06.3M mascon'}
                </span>
              </div>
            </div>

            {/* "তখন বনাম এখন" (1981-1990 vs 2015-2024) Card */}
            {thenVsNow && (
              <div
                style={{
                  marginTop: 16,
                  padding: '14px 16px',
                  background: 'var(--surface-2, #18221c)',
                  borderRadius: 14,
                  border: '1px solid var(--line, rgba(255,255,255,0.08))',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>
                    ⏳ {lang === 'bn'
                      ? `তখন বনাম এখন (${thenVsNow.period_then} বনাম ${thenVsNow.period_now})`
                      : `Then vs Now (${toEnglishNumber(thenVsNow.period_then)} vs ${toEnglishNumber(thenVsNow.period_now)})`}
                  </h4>
                  <span style={{ fontSize: '11.5px', color: 'var(--muted, #93a597)' }}>
                    {lang === 'bn' ? 'NASA POWER ৪০ বছরের রেকর্ড' : 'NASA POWER 40-year baseline'}
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12,
                  }}
                >
                  <div style={{ background: 'var(--surface, #131b16)', padding: '10px 12px', borderRadius: 10 }}>
                    <span style={{ fontSize: '12px', color: 'var(--muted, #93a597)', display: 'block' }}>
                      {lang === 'bn' ? 'দিনের গড় সর্বোচ্চ' : 'Average Day Max'}
                    </span>
                    <strong style={{ fontSize: '18px', color: 'var(--fg, #e7efe8)' }}>
                      {bn(thenVsNow.tmax_now, 1)}°C
                    </strong>
                    <span style={{ fontSize: '11.5px', display: 'block', color: thenVsNow.tmax_diff >= 0 ? 'var(--amber, #f2b24c)' : 'var(--blue, #5fb0ef)' }}>
                      {lang === 'bn' ? `তখন ${bn(thenVsNow.tmax_then, 1)}°C (${thenVsNow.tmax_diff >= 0 ? '+' : ''}${bn(thenVsNow.tmax_diff, 1)}°C)` : `Then ${thenVsNow.tmax_then.toFixed(1)}°C (${thenVsNow.tmax_diff >= 0 ? '+' : ''}${thenVsNow.tmax_diff.toFixed(1)}°C)`}
                    </span>
                  </div>

                  <div style={{ background: 'var(--surface, #131b16)', padding: '10px 12px', borderRadius: 10 }}>
                    <span style={{ fontSize: '12px', color: 'var(--muted, #93a597)', display: 'block' }}>
                      {lang === 'bn' ? '৩৫°C+ গরম দিন/বছর' : 'Heat Stress Days (>35°C)'}
                    </span>
                    <strong style={{ fontSize: '18px', color: 'var(--fg, #e7efe8)' }}>
                      {bn(thenVsNow.heat_days_now, 1)} {lang === 'bn' ? 'দিন' : 'days'}
                    </strong>
                    <span style={{ fontSize: '11.5px', display: 'block', color: thenVsNow.heat_days_diff >= 0 ? 'var(--amber, #f2b24c)' : 'var(--blue, #5fb0ef)' }}>
                      {lang === 'bn' ? `তখন ${bn(thenVsNow.heat_days_then, 1)} দিন (${thenVsNow.heat_days_diff >= 0 ? '+' : ''}${bn(thenVsNow.heat_days_diff, 1)})` : `Then ${thenVsNow.heat_days_then.toFixed(1)} days (${thenVsNow.heat_days_diff >= 0 ? '+' : ''}${thenVsNow.heat_days_diff.toFixed(1)})`}
                    </span>
                  </div>

                  <div style={{ background: 'var(--surface, #131b16)', padding: '10px 12px', borderRadius: 10 }}>
                    <span style={{ fontSize: '12px', color: 'var(--muted, #93a597)', display: 'block' }}>
                      {lang === 'bn' ? '১০°C-এর নিচে রাত/বছর' : 'Chilling Nights (<10°C)'}
                    </span>
                    <strong style={{ fontSize: '18px', color: 'var(--fg, #e7efe8)' }}>
                      {bn(thenVsNow.cold_nights_now, 1)} {lang === 'bn' ? 'রাত' : 'nights'}
                    </strong>
                    <span style={{ fontSize: '11.5px', display: 'block', color: thenVsNow.cold_nights_diff >= 0 ? 'var(--blue, #5fb0ef)' : 'var(--amber, #f2b24c)' }}>
                      {lang === 'bn' ? `তখন ${bn(thenVsNow.cold_nights_then, 1)} রাত (${thenVsNow.cold_nights_diff >= 0 ? '+' : ''}${bn(thenVsNow.cold_nights_diff, 1)})` : `Then ${thenVsNow.cold_nights_then.toFixed(1)} nights (${thenVsNow.cold_nights_diff >= 0 ? '+' : ''}${thenVsNow.cold_nights_diff.toFixed(1)})`}
                    </span>
                  </div>

                  <div style={{ background: 'var(--surface, #131b16)', padding: '10px 12px', borderRadius: 10 }}>
                    <span style={{ fontSize: '12px', color: 'var(--muted, #93a597)', display: 'block' }}>
                      {lang === 'bn' ? 'তুষারপাত/হিম দিন (<০°C)' : 'Frost Days (<0°C)'}
                    </span>
                    <strong style={{ fontSize: '18px', color: 'var(--fg, #e7efe8)' }}>
                      {bn(thenVsNow.frost_days_now, 0)} {lang === 'bn' ? 'দিন' : 'days'}
                    </strong>
                    <span style={{ fontSize: '11.5px', display: 'block', color: 'var(--muted, #93a597)' }}>
                      {lang === 'bn' ? 'বাংলাদেশে হিম নেই (০ দিন)' : 'Honest 0 days (rare in BD)'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 4 Interactive SVG Trend Charts */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 16,
                marginTop: 20,
              }}
            >
              {/* Chart 1: Mean Max Temp */}
              {renderChart({
                id: 'c1',
                title: lang === 'bn' ? 'গড় সর্বোচ্চ তাপমাত্রা (বছরে)' : 'Mean Maximum Temperature (Annual)',
                say: lang === 'bn'
                  ? `দশকে ${summary.tmax_trend?.[0] >= 0 ? '+' : ''}${bn(summary.tmax_trend?.[0], 2)}°C, কিন্তু বছরভেদে ওঠানামা বেশি — ${summary.tmax_trend?.[1] < 0.05 ? 'নিশ্চিত' : 'নিশ্চিত নয়'}।`
                  : `${summary.tmax_trend?.[0] >= 0 ? '+' : ''}${bn(summary.tmax_trend?.[0], 2)}°C per decade, high interannual variability — ${summary.tmax_trend?.[1] < 0.05 ? 'confirmed' : 'not statistically significant'}.`,
                src: lang === 'bn' ? 'NASA POWER T2M_MAX · ড্যাশ লাইন = প্রবণতা' : 'NASA POWER T2M_MAX · Dashed line = trend',
                vals: summary.tmax,
                kind: 'line',
                color: CHART_PALETTE.dark.amber,
                unit: '°C',
                trend: summary.tmax_trend?.[0],
                dec: 1,
              })}

              {/* Chart 2: Heat stress days */}
              {renderChart({
                id: 'c2',
                title: lang === 'bn' ? '৩৫°C-এর বেশি চরম গরম দিন' : 'Extreme Heat Days > 35°C (Annual)',
                say: lang === 'bn'
                  ? `গড়ে বছরে ${bn(Math.round((summary.heat || []).reduce((a, b) => a + b, 0) / (summary.heat?.length || 1)))} দিন, বেশিরভাগ মার্চ–জুনে।`
                  : `Average ${bn(Math.round((summary.heat || []).reduce((a, b) => a + b, 0) / (summary.heat?.length || 1)))} days/yr, mostly March–June.`,
                src: lang === 'bn' ? 'NASA POWER দৈনিক T2M_MAX' : 'NASA POWER Daily T2M_MAX',
                vals: summary.heat,
                kind: 'bar',
                color: CHART_PALETTE.dark.coral,
                unit: lang === 'bn' ? 'দিন' : 'days',
              })}

              {/* Chart 3: Kharif-1 Rain */}
              {renderChart({
                id: 'c3',
                title: lang === 'bn' ? 'এপ্রিল–মে-র বৃষ্টি (খরিফ-১)' : 'April–May Rainfall (Kharif-1)',
                say: lang === 'bn'
                  ? `ওঠানামা অনেক (${bn(Math.min(...(summary.am_rain || [0])))}–${bn(Math.max(...(summary.am_rain || [0])))} মিমি)। শেষ বছরে খরা টান ${bn(summary.dryspell?.[summary.dryspell?.length - 1] || 0)} দিন।`
                  : `High variance (${bn(Math.min(...(summary.am_rain || [0])))}–${bn(Math.max(...(summary.am_rain || [0])))} mm). Recent dry spell ${bn(summary.dryspell?.[summary.dryspell?.length - 1] || 0)} days.`,
                src: lang === 'bn' ? `${provenance.rain?.source || 'GPM IMERG'} দৈনিক বৃষ্টি` : `${provenance.rain?.source || 'GPM IMERG'} Daily Rainfall`,
                vals: summary.am_rain,
                kind: 'bar',
                color: CHART_PALETTE.dark.cyan,
                unit: lang === 'bn' ? 'মিমি' : 'mm',
              })}

              {/* Chart 4: Annual Rain */}
              {renderChart({
                id: 'c4',
                title: lang === 'bn' ? 'বছরের মোট বৃষ্টিপাত' : 'Annual Total Rainfall',
                say: lang === 'bn'
                  ? `দশকে ${bn(Math.abs(summary.annual_trend?.[0] || 0))} মিমি ${summary.annual_trend?.[0] >= 0 ? 'বৃদ্ধি' : 'কমার ইঙ্গিত'} (p = ${bn(summary.annual_trend?.[1], 2)}) — ${summary.annual_trend?.[1] < 0.05 ? 'নিশ্চিত' : 'নিশ্চিত নয়'}।`
                  : `${summary.annual_trend?.[0] >= 0 ? '+' : '−'}${bn(Math.abs(summary.annual_trend?.[0] || 0))} mm/decade trend (p = ${bn(summary.annual_trend?.[1], 2)}) — ${summary.annual_trend?.[1] < 0.05 ? 'confirmed' : 'not statistically significant'}.`,
                src: lang === 'bn' ? `${provenance.rain?.source || 'GPM IMERG'} · ড্যাশ লাইন = প্রবণতা` : `${provenance.rain?.source || 'GPM IMERG'} · Dashed line = trend`,
                vals: summary.annual,
                kind: 'line',
                color: CHART_PALETTE.dark.lime,
                unit: lang === 'bn' ? 'মিমি' : 'mm',
                trend: summary.annual_trend?.[0],
              })}
            </div>
          </section>

          {/* ==============================================================
              SECTION 2: আপনার পরিকল্পনার ঝুঁকি ক্যালেন্ডার (Nov–Oct)
          ============================================================== */}
          <section
            className="card"
            style={{
              background: 'var(--surface, #131b16)',
              border: '1px solid var(--line, rgba(255,255,255,0.1))',
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '8px 12px', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '18px', margin: '0 0 4px', fontWeight: 700 }}>
                  {lang === 'bn' ? '২. পরিকল্পনার ঝুঁকি ক্যালেন্ডার' : '2. Plan Risk Calendar'}
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--muted, #93a597)' }}>
                  {lang === 'bn'
                    ? 'পরিকল্পিত ফসলের মৌসুমভিত্তিক জলবায়ু ঝুঁকি।'
                    : 'Seasonal climate stress windows for rotation plan.'}
                </div>
              </div>

              {/* Y1 / Y2 Toggle Segment */}
              <div
                style={{
                  display: 'inline-flex',
                  gap: 4,
                  background: 'var(--surface-2, #18221c)',
                  border: '1px solid var(--line, rgba(255,255,255,0.1))',
                  borderRadius: 10,
                  padding: 3,
                }}
              >
                <button
                  type="button"
                  onClick={() => setActivePlanYear(0)}
                  style={{
                    font: '600 12.5px inherit',
                    border: 'none',
                    background: activePlanYear === 0 ? 'var(--accent, #c8e46a)' : 'transparent',
                    color: activePlanYear === 0 ? 'var(--accent-ink, #0f1a07)' : 'var(--fg, #e7efe8)',
                    padding: '5px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'bn' ? 'বছর ১' : 'Year 1'}
                </button>
                <button
                  type="button"
                  onClick={() => setActivePlanYear(1)}
                  style={{
                    font: '600 12.5px inherit',
                    border: 'none',
                    background: activePlanYear === 1 ? 'var(--accent, #c8e46a)' : 'transparent',
                    color: activePlanYear === 1 ? 'var(--accent-ink, #0f1a07)' : 'var(--fg, #e7efe8)',
                    padding: '5px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'bn' ? 'বছর ২' : 'Year 2'}
                </button>
              </div>
            </div>

            {/* Calendar Grid Container */}
            <div style={{ overflowX: 'auto', paddingBottom: 6 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '150px repeat(12, minmax(44px, 1fr))',
                  gap: 3,
                  minWidth: 720,
                  fontSize: 12,
                }}
              >
                {/* Header row: Month names (Nov..Oct) */}
                <div style={{ color: 'var(--muted, #93a597)', fontWeight: 600, padding: '4px 6px' }}>
                  {lang === 'bn' ? 'ফসলের পর্যায়' : 'Crop Stage'}
                </div>
                {['নভে', 'ডিসে', 'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগ', 'সেপ্টে', 'অক্টো'].map((mName, idx) => (
                  <div key={idx} style={{ color: 'var(--muted, #93a597)', textAlign: 'center', padding: '4px 0', fontWeight: 600 }}>
                    {lang === 'bn' ? mName : ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'][idx]}
                  </div>
                ))}

                {/* Crop Bars Row */}
                <div style={{ display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: '12.5px', paddingRight: 6 }}>
                  {lang === 'bn' ? `পরিকল্পিত ফসল (বছর ${bn(activePlanYear + 1)})` : `Planned Crops (Y${activePlanYear + 1})`}
                </div>
                {(() => {
                  const elements = [];
                  let currentCol = 0;

                  displayedCrops.forEach((c, cIdx) => {
                    if (c.from > currentCol) {
                      elements.push(
                        <div key={`gap-${cIdx}`} style={{ gridColumn: `span ${c.from - currentCol}` }} />
                      );
                    }
                    const spanWidth = c.to - c.from + 1;
                    const flLabel = c.fl.map((fi) => (lang === 'bn' ? ['নভে', 'ডিসে', 'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগ', 'সেপ্টে', 'অক্টো'][fi] : ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'][fi])).join('–');
                    elements.push(
                      <div
                        key={`crop-${cIdx}`}
                        style={{
                          gridColumn: `span ${spanWidth}`,
                          background: c.color,
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 8px',
                          fontWeight: 700,
                          fontSize: '12px',
                          color: '#10170f',
                          height: 30,
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                        <span
                          style={{
                            marginLeft: 'auto',
                            fontSize: '11px',
                            background: 'rgba(255,255,255,0.65)',
                            borderRadius: 99,
                            padding: '1px 6px',
                            fontWeight: 600,
                          }}
                        >
                          🌸 {flLabel}
                        </span>
                      </div>
                    );
                    currentCol = c.to + 1;
                  });

                  if (currentCol < 12) {
                    elements.push(
                      <div key="gap-end" style={{ gridColumn: `span ${12 - currentCol}` }} />
                    );
                  }

                  return elements;
                })()}

                {/* Separator Line */}
                <div style={{ gridColumn: '1 / -1', height: 8 }} />

                {/* Hazard Rows */}
                {[
                  {
                    name_bn: '🔥 গরমের চাপ',
                    name_en: '🔥 Heat Stress',
                    sub_bn: '৩৫°C-এর বেশি দিন',
                    sub_en: 'Days >35°C',
                    arr: summary.month_heat5 || [],
                    color: 'var(--red, #f07a6a)',
                  },
                  {
                    name_bn: '🌵 শুকনো টান',
                    name_en: '🌵 Dry Spell',
                    sub_bn: '১০+ দিন বৃষ্টিহীন',
                    sub_en: 'Dry spell >=10 days',
                    arr: summary.month_dry10 || [],
                    color: 'var(--amber, #f2b24c)',
                  },
                  {
                    name_bn: '🌊 ভারী বৃষ্টি',
                    name_en: '🌊 Heavy Rain',
                    sub_bn: '১ দিনে ৫০+ মিমি',
                    sub_en: 'Days >50mm rain',
                    arr: summary.month_heavy || [],
                    color: 'var(--blue, #5fb0ef)',
                  },
                  {
                    name_bn: '❄️ শীতের টান',
                    name_en: '❄️ Cold Stress',
                    sub_bn: '৫+ রাত ১০°C-এর নিচে',
                    sub_en: '5+ nights <10°C',
                    arr: summary.month_cold5 || [],
                    color: 'var(--purple, #a855f7)',
                  },
                ].map((hz, hIdx) => {
                  const MI = [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                  return (
                    <React.Fragment key={hIdx}>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', fontWeight: 600, fontSize: '12.5px', paddingRight: 6 }}>
                        <span>{lang === 'bn' ? hz.name_bn : hz.name_en}</span>
                        <small style={{ fontWeight: 400, color: 'var(--muted, #93a597)', fontSize: '11px' }}>
                          {lang === 'bn' ? hz.sub_bn : hz.sub_en}
                        </small>
                      </div>
                      {MI.map((m, mIdx) => {
                        const v = hz.arr[m - 1] ?? 0.0;
                        const pct = Math.round(v * 100);
                        const shadeStyle = v <= 0
                          ? 'var(--surface-2, #18221c)'
                          : `color-mix(in srgb, ${hz.color} ${Math.round(18 + v * 72)}%, var(--surface-2, #18221c))`;
                        return (
                          <div
                            key={mIdx}
                            style={{
                              height: 30,
                              borderRadius: 5,
                              background: shadeStyle,
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '11px',
                              fontVariantNumeric: 'tabular-nums',
                              color: 'var(--fg, #e7efe8)',
                              fontWeight: v > 0.4 ? 700 : 500,
                            }}
                            title={`${lang === 'bn' ? hz.name_bn : hz.name_en}: ${pct}%`}
                          >
                            {v > 0 ? `${bn(pct)}%` : ''}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Calendar Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', fontSize: '12px', color: 'var(--muted, #93a597)', marginTop: 12, alignItems: 'center' }}>
              <span>
                <span style={{ display: 'inline-flex', gap: 3, verticalAlign: 'middle', marginRight: 6 }}>
                  <i style={{ width: 14, height: 10, borderRadius: 2, background: 'var(--surface-2, #18221c)', display: 'inline-block' }} />
                  <i style={{ width: 14, height: 10, borderRadius: 2, background: 'color-mix(in srgb, var(--red, #f07a6a) 35%, var(--surface-2, #18221c))', display: 'inline-block' }} />
                  <i style={{ width: 14, height: 10, borderRadius: 2, background: 'color-mix(in srgb, var(--red, #f07a6a) 65%, var(--surface-2, #18221c))', display: 'inline-block' }} />
                  <i style={{ width: 14, height: 10, borderRadius: 2, background: 'var(--red, #f07a6a)', display: 'inline-block' }} />
                </span>
                {lang === 'bn' ? '২৪ বছরের মধ্যে কত বছর (০% → ১০০%)' : 'Frequency over 24 years (0% → 100%)'}
              </span>
              <span>🌸 = {lang === 'bn' ? 'ফুল আসার সময় (ফসলের সবচেয়ে নাজুক পর্যায়)' : 'Flowering window (most sensitive stage)'}</span>
            </div>

            {/* Climate Warnings List (Flowering overlap >= 35%) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {(() => {
                const MI = [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                const MLOC_BN = ['নভেম্বরে', 'ডিসেম্বরে', 'জানুয়ারিতে', 'ফেব্রুয়ারিতে', 'মার্চে', 'এপ্রিলে', 'মে মাসে', 'জুনে', 'জুলাইয়ে', 'আগস্টে', 'সেপ্টেম্বরে', 'অক্টোবরে'];
                const MLOC_EN = ['in November', 'in December', 'in January', 'in February', 'in March', 'in April', 'in May', 'in June', 'in July', 'in August', 'in September', 'in October'];

                const crops = displayedCrops;

                const hzList = [
                  { name_bn: 'গরমের চাপ', name_en: 'Heat Stress', arr: summary.month_heat5 || [] },
                  { name_bn: 'শুকনো টান', name_en: 'Dry Spell', arr: summary.month_dry10 || [] },
                  { name_bn: 'ভারী বৃষ্টি', name_en: 'Heavy Rain', arr: summary.month_heavy || [] },
                  { name_bn: 'শীতের টান', name_en: 'Cold Stress', arr: summary.month_cold5 || [] },
                ];

                const warnings = [];
                crops.forEach((c) => {
                  c.fl.forEach((fIdx) => {
                    const mNum = MI[fIdx];
                    hzList.forEach((hz) => {
                      const v = hz.arr[mNum - 1] ?? 0.0;
                      if (v >= 0.35) {
                        warnings.push({ crop: c, fIdx, hz, v });
                      }
                    });
                  });
                });

                // Deduplicate
                const uniqueWarns = {};
                warnings.forEach((w) => {
                  const key = `${w.crop.name}-${w.hz.name_en}`;
                  if (!uniqueWarns[key] || uniqueWarns[key].v < w.v) {
                    uniqueWarns[key] = w;
                  }
                });

                const sortedWarns = Object.values(uniqueWarns).sort((a, b) => b.v - a.v);

                if (sortedWarns.length === 0) {
                  return (
                    <p style={{ margin: 0, color: 'var(--muted, #93a597)', fontSize: '13px' }}>
                      {lang === 'bn' ? 'ফুলের সময় বড় কোনো জলবায়ু ঝুঁকির আশঙ্কা নেই।' : 'No major climate hazard overlaps the flowering window.'}
                    </p>
                  );
                }

                return sortedWarns.map((w, idx) => {
                  const isHigh = w.v >= 0.60;
                  const yearsCount = Math.round(w.v * 24);
                  let advice_bn = '';
                  let advice_en = '';

                  if (w.hz.name_en.includes('Heat')) {
                    advice_bn = 'তাপ-সহনশীল জাত বাছুন';
                    advice_en = 'Select heat-tolerant variety';
                  } else if (w.hz.name_en.includes('Dry')) {
                    advice_bn = 'ফুলের সময় সেচ দিন';
                    advice_en = 'Irrigate during flowering';
                  } else if (w.hz.name_en.includes('Heavy')) {
                    advice_bn = 'নিষ্কাশন নালা পরিষ্কার রাখুন';
                    advice_en = 'Keep drainage clear';
                  } else {
                    advice_bn = 'হালকা সেচ দিন';
                    advice_en = 'Light irrigation';
                  }

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                        padding: '10px 14px',
                        borderRadius: 12,
                        background: 'var(--surface-2, #18221c)',
                        fontSize: '13px',
                      }}
                    >
                      <b
                        style={{
                          flex: 'none',
                          fontSize: '11px',
                          borderRadius: 99,
                          padding: '2px 8px',
                          color: isHigh ? 'var(--red, #f07a6a)' : 'var(--amber, #f2b24c)',
                          background: isHigh ? 'rgba(240, 122, 106, 0.15)' : 'rgba(242, 178, 76, 0.15)',
                        }}
                      >
                        {isHigh ? (lang === 'bn' ? 'বেশি ঝুঁকি' : 'High Risk') : (lang === 'bn' ? 'মাঝারি' : 'Medium')}
                      </b>
                      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.45 }}>
                        ⚠ <b>{w.crop.name}</b>{' '}
                        {lang === 'bn'
                          ? `ফুল ${MLOC_BN[w.fIdx]} (${bn(Math.round(w.v * 100))}% ঝুঁকি) — ${advice_bn}।`
                          : `Flowers ${MLOC_EN[w.fIdx]} (${Math.round(w.v * 100)}% risk) — ${advice_en}.`}
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate && onNavigate('farm_planning')}
                        style={{
                          flex: 'none',
                          marginLeft: 'auto',
                          background: 'var(--surface, #131b16)',
                          color: 'var(--fg, #e7efe8)',
                          border: '1px solid var(--line, rgba(255,255,255,0.1))',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {lang === 'bn' ? 'চাপ পরীক্ষা →' : 'Stress Test →'}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Disclaimer note */}
            <p style={{ margin: '14px 0 0', fontSize: '12px', color: 'var(--faint, #5f7064)', lineHeight: 1.4 }}>
              {lang === 'bn'
                ? 'এগুলো অতীতের আসল ঘটনার হার, পূর্বাভাস নয়। NASA POWER প্রায় ৫০ কিমি, IMERG প্রায় ১০ কিমি এলাকার গড়; স্থানীয় স্টেশনের সাথে পার্থক্য থাকতে পারে।'
                : 'These represent empirical historical frequencies over 24 years, not forecasts. NASA POWER (~50 km) and IMERG (~10 km) reflect regional grid averages; local microclimate may vary.'}
            </p>
          </section>

          {/* ==============================================================
              SECTION 3: সাম্প্রতিক আবহাওয়া
          ============================================================== */}
          {summary.recent && (
            <section
              className="card"
              style={{
                background: 'var(--surface, #131b16)',
                border: '1px solid var(--line, rgba(255,255,255,0.1))',
                borderRadius: 16,
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '6px 12px', alignItems: 'baseline', marginBottom: 14 }}>
                <div>
                  <h2 style={{ fontSize: '18px', margin: '0 0 4px', fontWeight: 700 }}>
                    {lang === 'bn' ? '৩. সাম্প্রতিক আবহাওয়া' : '3. Recent Weather Observations'}
                  </h2>
                  <div style={{ fontSize: '13px', color: 'var(--muted, #93a597)' }}>
                    {lang === 'bn'
                      ? `শেষ ৩০ দিন বনাম একই সময়ের ২৪ বছরের গড় (${summary.recent.baseline_period || '২০০১–২০২৪'})`
                      : `Last 30 days vs 24-year historical normal (${toEnglishNumber(summary.recent.baseline_period) || '2001–2024'})`}
                  </div>
                </div>
              </div>

              {/* Stale data notice if newest observation > 60 days old */}
              {summary.recent.stale && summary.recent.stale_reason && (
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    fontSize: '13px',
                    color: 'var(--amber, #f2b24c)',
                    background: 'rgba(242, 178, 76, 0.12)',
                    border: '1px solid rgba(242, 178, 76, 0.25)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    marginBottom: 14,
                  }}
                >
                  <span>⚠</span>
                  <div>
                    {lang === 'bn'
                      ? (summary.recent.stale_reason_bn || summary.recent.stale_reason)
                      : (summary.recent.stale_reason_en || `Latest observation: ${summary.recent.end_date || ''}. Subsequent NASA POWER data not yet cached for this field (offline cache).`)}
                  </div>
                </div>
              )}

              {/* 4 Readouts Grid + Meaning Card */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: 12,
                }}
              >
                {/* 1. Day Max */}
                {(() => {
                  const df = summary.recent.tmax - summary.recent.norm_tmax;
                  return (
                    <div style={{ background: 'var(--surface-2, #18221c)', borderRadius: 12, padding: '12px 14px' }}>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #93a597)', marginBottom: 2 }}>
                        {lang === 'bn' ? 'দিনের গড় সর্বোচ্চ' : 'Average Day Max'}
                      </span>
                      <strong style={{ fontSize: '22px', fontWeight: 700, color: 'var(--fg, #e7efe8)' }}>
                        {bn(summary.recent.tmax, 1)}°C
                      </strong>
                      <em
                        style={{
                          fontStyle: 'normal',
                          fontSize: '12px',
                          display: 'block',
                          marginTop: 4,
                          color: Math.abs(df) < 0.5 ? 'var(--muted, #93a597)' : (df > 0 ? 'var(--amber, #f2b24c)' : 'var(--blue, #5fb0ef)'),
                        }}
                      >
                        {lang === 'bn'
                          ? `স্বাভাবিক ${bn(summary.recent.norm_tmax, 1)}°C (${df >= 0 ? '+' : ''}${bn(df, 1)})`
                          : `Normal ${summary.recent.norm_tmax.toFixed(1)}°C (${df >= 0 ? '+' : ''}${df.toFixed(1)})`}
                      </em>
                    </div>
                  );
                })()}

                {/* 2. Night Min */}
                {(() => {
                  const df = summary.recent.tmin - summary.recent.norm_tmin;
                  return (
                    <div style={{ background: 'var(--surface-2, #18221c)', borderRadius: 12, padding: '12px 14px' }}>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #93a597)', marginBottom: 2 }}>
                        {lang === 'bn' ? 'রাতের গড় সর্বনিম্ন' : 'Average Night Min'}
                      </span>
                      <strong style={{ fontSize: '22px', fontWeight: 700, color: 'var(--fg, #e7efe8)' }}>
                        {bn(summary.recent.tmin, 1)}°C
                      </strong>
                      <em
                        style={{
                          fontStyle: 'normal',
                          fontSize: '12px',
                          display: 'block',
                          marginTop: 4,
                          color: Math.abs(df) < 0.5 ? 'var(--muted, #93a597)' : (df > 0 ? 'var(--amber, #f2b24c)' : 'var(--blue, #5fb0ef)'),
                        }}
                      >
                        {lang === 'bn'
                          ? `স্বাভাবিক ${bn(summary.recent.norm_tmin, 1)}°C (${df >= 0 ? '+' : ''}${bn(df, 1)})`
                          : `Normal ${summary.recent.norm_tmin.toFixed(1)}°C (${df >= 0 ? '+' : ''}${df.toFixed(1)})`}
                      </em>
                    </div>
                  );
                })()}

                {/* 3. 30-day Rain */}
                {(() => {
                  const df = summary.recent.rain - summary.recent.norm_rain;
                  return (
                    <div style={{ background: 'var(--surface-2, #18221c)', borderRadius: 12, padding: '12px 14px' }}>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #93a597)', marginBottom: 2 }}>
                        {lang === 'bn' ? '৩০ দিনের মোট বৃষ্টি' : '30-Day Rainfall'}
                      </span>
                      <strong style={{ fontSize: '22px', fontWeight: 700, color: 'var(--fg, #e7efe8)' }}>
                        {bn(summary.recent.rain, 1)} {lang === 'bn' ? 'মিমি' : 'mm'}
                      </strong>
                      <em
                        style={{
                          fontStyle: 'normal',
                          fontSize: '12px',
                          display: 'block',
                          marginTop: 4,
                          color: Math.abs(df) < 5 ? 'var(--muted, #93a597)' : (df > 0 ? 'var(--blue, #5fb0ef)' : 'var(--amber, #f2b24c)'),
                        }}
                      >
                        {lang === 'bn'
                          ? `স্বাভাবিক ${bn(summary.recent.norm_rain, 1)} মিমি (${df >= 0 ? '+' : ''}${bn(df, 1)})`
                          : `Normal ${summary.recent.norm_rain.toFixed(1)} mm (${df >= 0 ? '+' : ''}${df.toFixed(1)})`}
                      </em>
                    </div>
                  );
                })()}

                {/* 4. 30-day ET0 (FAO-56 Penman-Monteith) */}
                {(() => {
                  const df = summary.recent.et0 - summary.recent.norm_et0;
                  return (
                    <div style={{ background: 'var(--surface-2, #18221c)', borderRadius: 12, padding: '12px 14px' }}>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #93a597)', marginBottom: 2 }}>
                        {lang === 'bn' ? 'বাষ্পীভবন (FAO-56 ET0)' : 'Evapotranspiration (ET0)'}
                      </span>
                      <strong style={{ fontSize: '22px', fontWeight: 700, color: 'var(--fg, #e7efe8)' }}>
                        {bn(summary.recent.et0, 1)} {lang === 'bn' ? 'মিমি' : 'mm'}
                      </strong>
                      <em
                        style={{
                          fontStyle: 'normal',
                          fontSize: '12px',
                          display: 'block',
                          marginTop: 4,
                          color: Math.abs(df) < 5 ? 'var(--muted, #93a597)' : (df > 0 ? 'var(--amber, #f2b24c)' : 'var(--blue, #5fb0ef)'),
                        }}
                      >
                        {lang === 'bn'
                          ? `স্বাভাবিক ${bn(summary.recent.norm_et0, 1)} মিমি (${df >= 0 ? '+' : ''}${bn(df, 1)})`
                          : `Normal ${summary.recent.norm_et0.toFixed(1)} mm (${df >= 0 ? '+' : ''}${df.toFixed(1)})`}
                      </em>
                    </div>
                  );
                })()}

                {/* 5. Meaning & Advisory */}
                <div style={{ background: 'var(--surface-2, #18221c)', borderRadius: 12, padding: '12px 14px', borderLeft: '3px solid var(--accent, #c8e46a)' }}>
                  <span style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #93a597)', marginBottom: 2 }}>
                    {lang === 'bn' ? 'মানে ও কৃষিতাত্ত্বিক পরামর্শ' : 'Meaning & Agronomic Advice'}
                  </span>
                  <strong style={{ fontSize: '15px', fontWeight: 700, color: 'var(--fg, #e7efe8)', display: 'block' }}>
                    {lang === 'bn' ? summary.recent.summary_bn : summary.recent.summary_en}
                  </strong>
                  <em style={{ fontStyle: 'normal', fontSize: '12px', display: 'block', marginTop: 4, color: 'var(--muted, #93a597)' }}>
                    {lang === 'bn' ? summary.recent.sub_advice_bn : summary.recent.sub_advice_en}
                  </em>
                </div>
              </div>
            </section>
          )}

          {/* Footnotes & Data Sources in muted 11px */}
          <footer style={{ marginTop: 24, paddingTop: 12, borderTop: '1px solid var(--line, rgba(255,255,255,0.08))', fontSize: 11, color: 'var(--muted, #93a597)', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
            <span>🔍 {lang === 'bn' ? 'উৎস: NASA POWER (১৯৮১–২০২৬), GPM IMERG (২০০১–২০২৪), GRACE/GRACE-FO JPL RL06.3M mascon' : 'Sources: NASA POWER (1981–2026), GPM IMERG (2001–2024), GRACE/GRACE-FO JPL RL06.3M mascon'}</span>
            <span>{lang === 'bn' ? 'মডেল ও অ্যানালাইসিস: FAO-56 Penman-Monteith, Mann-Kendall Trend' : 'Models: FAO-56 Penman-Monteith, Mann-Kendall Trend'}</span>
          </footer>
        </div>
      )}
    </div>
  );
}
