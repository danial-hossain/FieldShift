import React, { useId, useState } from 'react';
import { CHART_PALETTE, ChartTooltip } from './chartTheme.js';

export function LineChart({
  series = [], // array of numbers or [{ x, y }]
  width = 280,
  height = 80,
  tone = 'accent', // 'accent' | 'leaf' | 'water' | 'sun' | 'alert' | 'hud'
  strokeWidth = 2,
  showGradient = true,
  unit = '',
  className = '',
  style = {}
}) {
  const gradientId = useId();
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Normalize numbers
  const points = series.map((pt, i) => {
    if (typeof pt === 'number') return { x: i, y: pt };
    if (pt && typeof pt.y === 'number') return { x: pt.x ?? i, y: pt.y };
    return null;
  }).filter(Boolean);

  if (points.length < 2) {
    return (
      <div
        className={`ui-linechart-empty ${className}`}
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(238, 243, 238, 0.42)',
          fontSize: 11,
          fontStyle: 'italic',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 8,
          border: '1px dashed rgba(255, 255, 255, 0.08)',
          ...style
        }}
      >
        তথ্য নেই
      </div>
    );
  }

  const yVals = points.map(p => p.y);
  const minY = Math.min(...yVals);
  const maxY = Math.max(...yVals);
  const ySpan = maxY - minY || 1;

  const padX = 8;
  const padY = 8;
  const drawW = width - padX * 2;
  const drawH = height - padY * 2;

  const coords = points.map((p, idx) => {
    const x = padX + (idx / (points.length - 1)) * drawW;
    const y = padY + drawH - ((p.y - minY) / ySpan) * drawH;
    return { x, y, val: p.y };
  });

  const pathD = coords.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${height - padY} L ${coords[0].x} ${height - padY} Z`;

  const toneColors = {
    accent: CHART_PALETTE.dark.lime,
    leaf: CHART_PALETTE.dark.lime,
    water: CHART_PALETTE.dark.cyan,
    sun: CHART_PALETTE.dark.amber,
    alert: CHART_PALETTE.dark.coral,
    hud: CHART_PALETTE.dark.cyan,
    violet: CHART_PALETTE.dark.violet,
  };
  const strokeColor = toneColors[tone] || CHART_PALETTE.dark.lime;

  return (
    <div className={`ui-linechart ${className}`} style={{ width, height, position: 'relative', ...style }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {showGradient && (
          <path d={areaD} fill={`url(#${gradientId})`} />
        )}
        <path
          className="chart-line-animated"
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Vertical crosshair on hover */}
        {hoveredPoint && (
          <line
            x1={hoveredPoint.x}
            x2={hoveredPoint.x}
            y1={padY}
            y2={height - padY}
            stroke={CHART_PALETTE.dark.crosshair}
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        )}

        {/* Hover hit points */}
        {coords.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={hoveredPoint?.x === pt.x ? 4 : 2.5}
            fill={strokeColor}
            stroke="#07140D"
            strokeWidth={1.5}
            style={{ cursor: 'pointer' }}
            onPointerEnter={() => setHoveredPoint(pt)}
            onPointerLeave={() => setHoveredPoint(null)}
          />
        ))}
      </svg>

      {/* Glass hover tooltip */}
      {hoveredPoint && (
        <ChartTooltip
          visible={Boolean(hoveredPoint)}
          x={hoveredPoint.x}
          y={hoveredPoint.y}
          value={Math.round(hoveredPoint.val * 10) / 10}
          unit={unit}
          theme="dark"
        />
      )}
    </div>
  );
}

export const Sparkline = LineChart;
