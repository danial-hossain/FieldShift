import React, { useRef, useCallback } from 'react';
import { Pause, Play, Droplets } from 'lucide-react';
import { formatNumber } from '../i18n.js';
import { translateCropName } from '../SixSeasonRecommendationView.jsx';

// Month names in English and Bengali starting from Rabi (November)
const MONTHS_EN = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
const MONTHS_BN = ['নভে', 'ডিসে', 'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো'];

// Colors for crops
const CROP_COLORS = {
  Mustard: '#facc15',
  Rice: '#65a30d',
  'Boro Rice': '#eab308',
  'Aman Rice': '#84cc16',
  'Aus Rice': '#a3e635',
  Soybean: '#15803d',
  Mungbean: '#4ade80',
  Lentil: '#a78bfa',
  Wheat: '#fde047',
  Chickpea: '#fb923c',
  Potato: '#d97706',
  Sunflower: '#f59e0b',
  Sesame: '#ca8a04',
  Jute: '#16a34a',
  Maize: '#eab308',
  Tomato: '#ef4444',
  Groundnut: '#f97316',
  Onion: '#c084fc',
  Fallow: 'var(--text-fallow, #cbd5e1)',
};

const PERIOD_KEYS_6 = ['Y1_S1', 'Y1_S2', 'Y1_S3', 'Y2_S1', 'Y2_S2', 'Y2_S3'];
const PERIOD_KEYS_3 = ['Y1_S1', 'Y1_S2', 'Y1_S3'];

const SEASON_NAMES_EN = ['Y1 Rabi', 'Y1 Kharif-1', 'Y1 Kharif-2', 'Y2 Rabi', 'Y2 Kharif-1', 'Y2 Kharif-2'];
const SEASON_NAMES_BN = ['১ম রবি', '১ম খরিপ-১', '১ম খরিপ-২', '২য় রবি', '২য় খরিপ-১', '২য় খরিপ-২'];

// Month spans: Rabi = 5 months (Nov-Mar), Kharif-1 = 3 months (Apr-Jun), Kharif-2 = 4 months (Jul-Oct)
const SEASON_MONTH_SPANS = [5, 3, 4, 5, 3, 4];
const TOTAL_MONTHS = 24;

export function SeasonTimelineBar({
  progress = 0,
  isPlaying = false,
  speed = 1,
  onPlayPause = () => {},
  onSpeedChange = () => {},
  onSeek = () => {},
  onSelectSeason = () => {},
  activePeriodKey = 'Y1_S1',
  beds = [],
  selectedStrategy = 'balanced',
  lang = 'en',
  waterUsedLiters = 0,
  profitBdt = 0,
}) {
  const barRef = useRef(null);
  const isDraggingRef = useRef(false);

  const isCurrent = selectedStrategy === 'baseline';
  const periodKeys = isCurrent ? PERIOD_KEYS_3 : PERIOD_KEYS_6;
  const numSeasons = isCurrent ? 3 : 6;
  const monthSpans = isCurrent ? [5, 3, 4] : SEASON_MONTH_SPANS;
  const totalMonthsInPlan = isCurrent ? 12 : TOTAL_MONTHS;

  // Compute segment boundaries as fractions of total progress (0..1)
  const segments = [];
  let cumMonths = 0;
  for (let i = 0; i < numSeasons; i++) {
    const span = monthSpans[i];
    const startFrac = cumMonths / totalMonthsInPlan;
    cumMonths += span;
    const endFrac = cumMonths / totalMonthsInPlan;
    const bed = beds[i] || {};
    const cropName = bed.crop || bed.crop_name || bed.name || (i % 2 === 0 ? 'Mustard' : 'Rice');
    const color = CROP_COLORS[cropName] || (i % 2 === 0 ? '#facc15' : '#84cc16');
    const label = lang === 'bn' ? SEASON_NAMES_BN[i] : SEASON_NAMES_EN[i];
    segments.push({
      index: i,
      periodKey: periodKeys[i] || `S${i + 1}`,
      cropName,
      label,
      color,
      startFrac,
      endFrac,
      widthPct: (span / totalMonthsInPlan) * 100,
    });
  }

  // Pointer scrubber handlers
  const handlePointerDown = useCallback(
    (e) => {
      if (!barRef.current) return;
      isDraggingRef.current = true;
      barRef.current.setPointerCapture(e.pointerId);
      const rect = barRef.current.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(p);
    },
    [onSeek]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDraggingRef.current || !barRef.current) return;
      const rect = barRef.current.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(p);
    },
    [onSeek]
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (!isDraggingRef.current || !barRef.current) return;
      isDraggingRef.current = false;
      try {
        barRef.current.releasePointerCapture(e.pointerId);
      } catch (_) {}
    },
    []
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        onPlayPause();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onSeek(Math.min(1, progress + 0.05));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onSeek(Math.max(0, progress - 0.05));
      }
    },
    [onPlayPause, onSeek, progress]
  );

  const monthsList = lang === 'bn' ? MONTHS_BN : MONTHS_EN;

  return (
    <div
      className="season-timeline-bar"
      role="region"
      aria-label={lang === 'bn' ? 'মৌসুম সময়রেখা অ্যানিমেশন' : 'Season Timeline Playback'}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{
        width: '100%',
        marginTop: 10,
        padding: '12px 16px',
        background: 'var(--surface-card, rgba(10, 18, 13, 0.55))',
        border: '1px solid var(--line, rgba(255, 255, 255, 0.12))',
        borderRadius: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        color: 'var(--text)',
      }}
    >
      {/* Top Row: Play/Pause, Speed, Live Telemetry Counters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        {/* Playback Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            id="timeline-play-btn"
            className="timeline-play-btn"
            onClick={onPlayPause}
            aria-label={isPlaying ? (lang === 'bn' ? 'থামান' : 'Pause') : (lang === 'bn' ? 'চালান' : 'Play')}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: isPlaying ? 'var(--neon, #C8F169)' : 'var(--surface-2, rgba(255,255,255,0.08))',
              color: isPlaying ? '#0d160e' : 'var(--text)',
              border: isPlaying ? 'none' : '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 15,
              boxShadow: isPlaying ? '0 0 14px rgba(200, 241, 105, 0.4)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {isPlaying ? <Pause size={14} strokeWidth={2} /> : <Play size={14} strokeWidth={2} />}
          </button>

          <button
            type="button"
            className="timeline-speed-btn"
            onClick={() => onSpeedChange(speed === 1 ? 2 : 1)}
            aria-label={lang === 'bn' ? `গতি ${speed}x` : `Speed ${speed}x`}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: speed === 2 ? 'rgba(91, 227, 255, 0.2)' : 'var(--surface-2, rgba(255,255,255,0.06))',
              color: speed === 2 ? 'var(--neon-cyan, #5BE3FF)' : 'var(--text-muted)',
              border: speed === 2 ? '1px solid var(--neon-cyan)' : '1px solid var(--line)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {speed}x
          </button>

          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {lang === 'bn'
              ? `${isCurrent ? '১ বছর' : '২ বছর'} (${totalMonthsInPlan} মাস)`
              : `${isCurrent ? '1 Year' : '2 Years'} (${totalMonthsInPlan} mos)`}
          </span>
        </div>

        {/* Live Accumulation Counters: Water & Profit */}
        <div className="timeline-live-counters" style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12.5, fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--neon-cyan, #5BE3FF)' }}>
            <span><Droplets size={14} strokeWidth={1.75} color="var(--cyan, #5be3ff)" /></span>
            <span>
              {lang === 'bn' ? 'ব্যবহৃত পানি: ' : 'Water used: '}
              <strong style={{ fontVariantNumeric: 'tabular-nums' }}>
                {waterUsedLiters >= 1000000
                  ? `${formatNumber((waterUsedLiters / 1000000).toFixed(1), lang)} ${lang === 'bn' ? 'মিলিয়ন লিটার' : 'M L'}`
                  : `${formatNumber(Math.round(waterUsedLiters).toLocaleString(), lang)} ${lang === 'bn' ? 'লিটার' : 'L'}`}
              </strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--neon, #C8F169)' }}>
            <span>৳</span>
            <span>
              {lang === 'bn' ? 'অর্জিত লাভ: ' : 'Profit so far: '}
              <strong style={{ fontVariantNumeric: 'tabular-nums' }}>
                ৳{formatNumber(Math.round(profitBdt).toLocaleString(), lang)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Center Track: Segments Bar with Scrubber */}
      <div
        ref={barRef}
        className="timeline-track-container"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: 'relative',
          height: 44,
          borderRadius: 8,
          background: 'rgba(0,0,0,0.3)',
          overflow: 'hidden',
          display: 'flex',
          cursor: 'pointer',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {segments.map((seg) => {
          const isSelected = activePeriodKey === seg.periodKey;
          return (
            <div
              key={seg.periodKey}
              onClick={(e) => {
                e.stopPropagation();
                onSeek(seg.startFrac);
                onSelectSeason(seg.periodKey);
              }}
              className="timeline-season-segment"
              style={{
                width: `${seg.widthPct}%`,
                height: '100%',
                position: 'relative',
                borderRight: '1px solid rgba(255,255,255,0.15)',
                background: isSelected
                  ? `linear-gradient(180deg, ${seg.color}35, ${seg.color}15)`
                  : 'rgba(255,255,255,0.03)',
                borderBottom: isSelected ? `2.5px solid ${seg.color}` : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '0 6px',
                transition: 'background 0.15s ease',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: isSelected ? seg.color : 'var(--text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {seg.label}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
                {translateCropName(seg.cropName, lang)}
              </div>
            </div>
          );
        })}

        {/* Playhead Line & Thumb */}
        <div
          className="timeline-playhead"
          style={{
            position: 'absolute',
            left: `${progress * 100}%`,
            top: 0,
            bottom: 0,
            width: 2,
            background: 'var(--neon, #C8F169)',
            boxShadow: '0 0 10px rgba(200, 241, 105, 0.8)',
            pointerEvents: 'none',
            zIndex: 10,
            transform: 'translateX(-50%)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -4,
              left: -5,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'var(--neon, #C8F169)',
              border: '2px solid #0d160e',
              boxShadow: '0 0 8px rgba(200, 241, 105, 0.9)',
            }}
          />
        </div>
      </div>

      {/* Month Markings Strip */}
      <div
        className="timeline-months-strip"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${totalMonthsInPlan}, minmax(0, 1fr))`,
          fontSize: 9.5,
          color: 'var(--text-muted)',
          textAlign: 'center',
          userSelect: 'none',
        }}
      >
        {Array.from({ length: totalMonthsInPlan }).map((_, mIdx) => {
          const name = monthsList[mIdx % 12];
          const isMonsoon = (mIdx % 12) >= 6 && (mIdx % 12) <= 10;
          return (
            <div
              key={mIdx}
              style={{
                color: isMonsoon ? 'var(--text-cyan, #0369a1)' : 'inherit',
                fontWeight: isMonsoon ? 600 : 400,
              }}
            >
              {name}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SeasonTimelineBar;
