// frontend/src/overview/OrbitToFieldStory.jsx  — OF1-OF6 rewrite
// Immersive "From Orbit to Field" scroll story for the FieldShift Overview page.
// OF1: Canvas is position:fixed (full-viewport), sidebar + topbar float above it.
//      Story scrolls 10×100vh behind the canvas.
//      No auto-play button (user presents by scrolling).
//      Progress rail on the right; click/hover = smooth scroll + label.
// OF5: Glass cards with PROBLEM/ANSWER layout, counting numbers, NASA chips.
// OF6: Storyboard SVG fallback if WebGL fails or prefers-reduced-motion.

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { OrbitToFieldCanvas } from './OrbitToFieldCanvas.jsx';
import { isWebGLAvailable, haToBigha } from '../three/farmSceneHelpers.js';
import { REGIONAL_ROTATIONS } from './regionalRotationsConfig.js';
import graceTrendsData from '../../../data/grace/grace_bangladesh_trends.json';

// ── scene count ──────────────────────────────────────────────────────────────
const SCENE_COUNT = 10; // 10 × 100vh scroll sections

// ── NASA source chip ─────────────────────────────────────────────────────────
function NasaChip({ source }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: '#38D9F5',
      background: 'rgba(56, 217, 245, 0.08)',
      border: '1px solid rgba(56, 217, 245, 0.3)',
      borderRadius: 99,
      padding: '2px 8px',
    }}>
      🛰 {source}
    </span>
  );
}

// ── count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target, active, decimals = 0, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const startVal = 0;
    const endVal = typeof target === 'number' ? target : parseFloat(target) || 0;
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * eased;
      setVal(decimals > 0 ? current.toFixed(decimals) : Math.round(current));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, decimals, duration]);
  return val;
}

// ── glass card ────────────────────────────────────────────────────────────────
function GlassCard({ scene, isBn, onNavigate, isActive, side = 'left' }) {
  const bigNum = scene.bigNums?.[0];
  const countedVal = useCountUp(bigNum?.rawVal ?? 0, isActive && !!bigNum?.rawVal, bigNum?.decimals ?? 0);

  const posStyle = side === 'right'
    ? { right: '5%', left: 'auto' }
    : { left: '5%', right: 'auto' };

  return (
    <div
      className="story-glass-card"
      style={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        width: 'min(42%, 460px)',
        padding: 'clamp(18px, 2.4vw, 32px)',
        borderRadius: 22,
        background: 'rgba(10, 18, 14, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        color: '#EAF2EC',
        pointerEvents: 'auto',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        ...posStyle,
      }}
    >
      {/* PROBLEM label */}
      {scene.problem && (
        <div style={{
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#F5B04C',
        }}>
          PROBLEM
        </div>
      )}

      {/* Scene index */}
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--lime, #C8F169)',
        marginTop: scene.problem ? -4 : 0,
      }}>
        {scene.idx}
      </div>

      {/* English headline (big, with italic key word) */}
      <h2 style={{
        fontFamily: 'var(--display, "Space Grotesk", sans-serif)',
        fontWeight: 700,
        fontSize: 'clamp(22px, 2.8vw, 44px)',
        lineHeight: 1.15,
        margin: '0 0 2px',
        color: '#ffffff',
        textWrap: 'balance',
      }}
        dangerouslySetInnerHTML={{ __html: scene.headlineEn }}
      />

      {/* Bangla subtitle in bn mode */}
      {isBn && scene.headlineBn && (
        <div style={{ fontSize: 15, color: '#a0b8a8', lineHeight: 1.4, fontWeight: 500 }}>
          {scene.headlineBn}
        </div>
      )}

      {/* Body line */}
      <p style={{
        margin: 0,
        fontSize: 'clamp(12px, 1.2vw, 15px)',
        color: '#c8dcd0',
        lineHeight: 1.55,
      }}>
        {isBn ? (scene.bodyBn || scene.bodyEn) : scene.bodyEn}
      </p>

      {/* Big counting number */}
      {bigNum && (
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
          marginTop: 4,
        }}>
          <span style={{
            fontFamily: 'var(--display, "Space Grotesk", sans-serif)',
            fontWeight: 700,
            fontSize: 'clamp(28px, 3.2vw, 48px)',
            color: bigNum.color || '#C8F169',
            lineHeight: 1,
          }}>
            {bigNum.prefix || ''}{isActive ? countedVal : '—'}{bigNum.suffix || ''}
          </span>
          <span style={{ fontSize: 12, color: '#9fb3a5', fontWeight: 600 }}>
            {isBn ? (bigNum.labelBn || bigNum.label) : bigNum.label}
          </span>
        </div>
      )}

      {/* Secondary nums strip */}
      {scene.nums && scene.nums.length > (bigNum ? 1 : 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          {scene.nums.slice(bigNum ? 1 : 0).map((n, i) => (
            <span key={i} style={{
              fontSize: 12,
              background: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 99,
              padding: '3px 10px',
              display: 'flex',
              gap: 5,
              alignItems: 'center',
            }}>
              <span style={{ color: '#9fb3a5' }}>{isBn ? (n.labelBn || n.label) : n.label}</span>
              <b style={{ color: n.color || '#EAF2EC' }}>{n.val}</b>
            </span>
          ))}
        </div>
      )}

      {/* NASA source chip */}
      {scene.nasa && <NasaChip source={scene.nasa} />}

      {/* Page link chip */}
      {scene.link && (
        <button
          type="button"
          onClick={() => onNavigate(scene.link.dest)}
          style={{
            marginTop: 6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12.5,
            fontWeight: 700,
            color: 'var(--lime, #C8F169)',
            background: 'rgba(200, 241, 105, 0.1)',
            border: '1px solid rgba(200, 241, 105, 0.35)',
            borderRadius: 99,
            padding: '5px 14px',
            cursor: 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          <span>{isBn ? (scene.link.labelBn || scene.link.label) : scene.link.label} →</span>
        </button>
      )}

      {/* Final CTA */}
      {scene.cta && (
        <button
          type="button"
          onClick={() => onNavigate(scene.cta.dest)}
          style={{
            marginTop: 10,
            background: 'var(--accent, #C8F169)',
            color: 'var(--accent-ink, #10200a)',
            fontFamily: 'var(--display, "Space Grotesk", sans-serif)',
            fontWeight: 700,
            border: 'none',
            borderRadius: 14,
            padding: '14px 24px',
            fontSize: 'clamp(13px, 1.3vw, 16px)',
            cursor: 'pointer',
            boxShadow: '0 0 32px rgba(200, 241, 105, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            justifyContent: 'center',
          }}
        >
          {isBn ? (scene.cta.labelBn || scene.cta.label) : scene.cta.label}
        </button>
      )}
    </div>
  );
}

// ── storyboard SVG fallback ───────────────────────────────────────────────────
// When WebGL is unavailable: render each scene as a styled card with an SVG
// still from the storyboard colour palette.
const FALLBACK_COLORS = [
  '#05080F', '#0a1a0c', '#0d1f10', '#0a1a14', '#0a1218',
  '#0c1a0e', '#0a1812', '#081510', '#0a1812', '#0a1612',
];

function StaticFallback({ scenes, isBn, onNavigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 0 32px' }}>
      {scenes.map((s, i) => (
        <div
          key={s.idx}
          style={{
            position: 'relative',
            borderRadius: 18,
            overflow: 'hidden',
            minHeight: 240,
            background: FALLBACK_COLORS[i] || '#05080F',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* SVG decorative background per scene */}
          <svg
            viewBox="0 0 800 240"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }}
            preserveAspectRatio="xMidYMid slice"
          >
            {i === 0 && <>
              <circle cx="600" cy="120" r="90" fill="#1a3a6a" />
              {[...Array(60)].map((_, j) => (
                <circle key={j} cx={Math.random() * 800} cy={Math.random() * 240} r="1.5" fill="white" opacity="0.6" />
              ))}
            </>}
            {i === 1 && <ellipse cx="560" cy="120" rx="120" ry="95" fill="#1e5c38" stroke="#C8F169" strokeWidth="1.5" />}
            {(i >= 2 && i <= 8) && <>
              <rect x="400" y="50" width="360" height="140" rx="12" fill="#1a3a1a" />
              {[...Array(4)].map((_, j) => (
                <rect key={j} x={420 + j * 80} y="80" width="60" height="80" rx="4" fill={['#4a7c35', '#38a0c8', '#dec050', '#5a3e1c'][j]} />
              ))}
            </>}
            {i === 9 && <>
              <rect x="400" y="60" width="340" height="160" rx="14" fill="#0d1e15" stroke="#C8F169" strokeWidth="1.5" />
              <circle cx="570" cy="100" r="20" fill="rgba(200,241,105,0.3)" />
              <path d="M570,80 C562,68 562,58 570,54 C578,58 578,68 570,80Z" fill="#C8F169" />
            </>}
          </svg>

          {/* Card content */}
          <div style={{ position: 'relative', padding: '24px 28px', zIndex: 2 }}>
            {s.problem && (
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: '#F5B04C', marginBottom: 4 }}>
                PROBLEM
              </div>
            )}
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#C8F169', marginBottom: 6 }}>{s.idx}</div>
            <h3 style={{ fontFamily: '"Space Grotesk",sans-serif', fontWeight: 700, fontSize: 22, color: '#fff', margin: '0 0 8px' }}
              dangerouslySetInnerHTML={{ __html: s.headlineEn }}
            />
            {isBn && s.headlineBn && <div style={{ fontSize: 14, color: '#a0b8a8', marginBottom: 6 }}>{s.headlineBn}</div>}
            <p style={{ margin: 0, fontSize: 13, color: '#c0d4c8', lineHeight: 1.5 }}>{isBn ? (s.bodyBn || s.bodyEn) : s.bodyEn}</p>
            {s.link && (
              <button type="button" onClick={() => onNavigate(s.link.dest)}
                style={{ marginTop: 12, background: 'rgba(200,241,105,0.12)', border: '1px solid rgba(200,241,105,0.4)', color: '#C8F169', borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {isBn ? (s.link.labelBn || s.link.label) : s.link.label} →
              </button>
            )}
            {s.cta && (
              <button type="button" onClick={() => onNavigate(s.cta.dest)}
                style={{ marginTop: 12, background: '#C8F169', color: '#10200a', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'block', width: '100%' }}>
                {isBn ? (s.cta.labelBn || s.cta.label) : s.cta.label}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export function OrbitToFieldStory({
  activeField = null,
  lang = 'bn',
  onNavigate = () => {},
  advisoryData = null,
}) {
  const isBn = lang === 'bn';
  const containerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [hoveredScene, setHoveredScene] = useState(null);

  const hasWebGL = useMemo(() => isWebGLAvailable(), []);
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  }, []);

  // Scroll tracking — container is RELATIVE (spacer div), canvas is FIXED
  useEffect(() => {
    if (prefersReducedMotion) return;
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalH = containerRef.current.offsetHeight - window.innerHeight;
      if (totalH <= 0) return;
      const scrolled = -rect.top;
      const rawProgress = scrolled / totalH;
      const progress = Math.max(0, Math.min(1, rawProgress));
      setScrollProgress(progress);
      setCurrentSceneIndex(Math.min(SCENE_COUNT - 1, Math.floor(progress * SCENE_COUNT)));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prefersReducedMotion]);

  // Click on progress dot → smooth scroll to that scene
  const scrollToScene = useCallback((idx) => {
    if (!containerRef.current) return;
    const totalH = containerRef.current.offsetHeight - window.innerHeight;
    const targetY = containerRef.current.offsetTop + (idx / (SCENE_COUNT - 1)) * totalH;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }, []);

  // ── live field data ──────────────────────────────────────────────────────
  const fieldName = activeField?.name || (isBn ? 'আপনার জমি' : 'Your Field');
  const fieldDistrict = activeField?.district || 'Chapainawabganj';
  const fieldAreaBigha = activeField?.area_ha != null ? haToBigha(activeField.area_ha) : null;
  const fieldCrop = activeField?.current_crop || null;
  const fieldIrrMm = activeField?.irrigation_capacity_mm ?? null;

  // GRACE trends
  const barindTrend = graceTrendsData?.trends_cm_per_year?.northwest_barind ?? -1.07;
  const haorTrend = graceTrendsData?.trends_cm_per_year?.haor_wetland ?? 0.44;

  // Onset shift
  const onsetShift = advisoryData?.comparison?.shift_days_median;

  // ── scene definitions (v2: PROBLEM → ANSWER) ────────────────────────────
  const SCENES = useMemo(() => [
    // ── 0: Space ─────────────────────────────────────────────────────────
    {
      idx: '01 · Space',
      headlineEn: 'FieldShift',
      headlineBn: 'ফিল্ডশিফট',
      bodyEn: 'NASA watches every field on Earth from orbit — measuring rain, groundwater and heat in real time.',
      bodyBn: 'মহাকাশ থেকে নাসা প্রতিটি জমির বৃষ্টি, ভূগর্ভস্থ পানি ও তাপমাত্রা রিয়েল-টাইমে পরিমাপ করে।',
      nasa: 'GPM · GRACE-FO · NASA POWER',
      side: 'left',
    },
    // ── 1: Every farmer ──────────────────────────────────────────────────
    {
      idx: '02 · Bangladesh',
      problem: true,
      headlineEn: 'But every farmer knows only <em>his own field.</em>',
      headlineBn: 'কিন্তু প্রতিটি কৃষক চেনেন শুধু নিজের জমিটুকু।',
      bodyEn: 'Generic advice ignores local soil, climate and water access. Farmers end up guessing.',
      bodyBn: 'সাধারণ পরামর্শ স্থানীয় মাটি, আবহাওয়া ও পানি উপেক্ষা করে। কৃষককে অনুমানের ওপর নির্ভর করতে হয়।',
      nasa: 'IMERG · NASA POWER',
      side: 'left',
    },
    // ── 2: Fields farm differently ───────────────────────────────────────
    {
      idx: '03 · Regions',
      headlineEn: 'Every field farms <em>differently.</em>',
      headlineBn: 'প্রতিটি জমির চাষের ধরন আলাদা।',
      bodyEn: 'FieldShift starts from what YOU grow now — not from a template. Barind, Haor and Coast each have their own rotation.',
      bodyBn: 'ফিল্ডশিফট শুরু করে আপনি এখন যা ফলান তা থেকেই, কোনো ছাঁচ থেকে নয়।',
      nums: [
        { label: REGIONAL_ROTATIONS.barind.regionEn, labelBn: REGIONAL_ROTATIONS.barind.regionBn, val: REGIONAL_ROTATIONS.barind.rotationEn, color: '#C8F169' },
        { label: REGIONAL_ROTATIONS.haor.regionEn,   labelBn: REGIONAL_ROTATIONS.haor.regionBn,   val: REGIONAL_ROTATIONS.haor.rotationEn,   color: '#38D9F5' },
        { label: REGIONAL_ROTATIONS.coast.regionEn,  labelBn: REGIONAL_ROTATIONS.coast.regionBn,  val: REGIONAL_ROTATIONS.coast.rotationEn,  color: '#F5B04C' },
      ],
      link: { label: 'See My Fields', labelBn: 'আমার জমি দেখুন', dest: 'field' },
      side: 'left',
    },
    // ── 3: Groundwater ───────────────────────────────────────────────────
    {
      idx: '04 · Underground',
      problem: true,
      headlineEn: 'Underground, the water is <em>changing.</em>',
      headlineBn: 'মাটির নিচের পানির স্তর নীরবে বদলে যাচ্ছে।',
      bodyEn: 'GRACE-FO satellites measure groundwater from orbit. Barind is running dry; haor wetlands are rising.',
      bodyBn: 'গ্রেজ-এফও উপগ্রহ মহাকাশ থেকে ভূগর্ভস্থ পানি মাপে। বরেন্দ্রে পানি কমছে; হাওরে বাড়ছে।',
      bigNums: [
        { rawVal: Math.abs(barindTrend), prefix: '', suffix: ' cm/yr', label: 'Barind groundwater drop', labelBn: 'বরেন্দ্র পানির পতন', color: '#F5B04C', decimals: 2 },
      ],
      nums: [
        { label: 'Haor', labelBn: 'হাওর', val: `+${Math.abs(haorTrend).toFixed(2)} cm/yr`, color: '#38D9F5' },
        { label: 'GRACE-FO', labelBn: 'গ্রেজ-এফও', val: '2002–2026', color: '#EAF2EC' },
      ],
      nasa: 'GRACE-FO (MASCON)',
      link: { label: 'Water & Irrigation', labelBn: 'পানির হিসাব', dest: 'water_irrigation' },
      side: 'left',
    },
    // ── 4: Heat / rain ────────────────────────────────────────────────────
    {
      idx: '05 · Sky',
      problem: true,
      headlineEn: 'Even the sky is <em>uncertain.</em>',
      headlineBn: 'আকাশের পূর্বাভাসও নিশ্চিত নয়।',
      bodyEn: onsetShift != null
        ? `Monsoon onset shifted by ${onsetShift > 0 ? '+' : ''}${onsetShift} days in this district. FieldShift adjusts your planting window.`
        : 'Two NASA datasets disagree on when the monsoon starts here. FieldShift only advises on what is confirmed.',
      bodyBn: onsetShift != null
        ? `এই জেলায় বর্ষা শুরু গড়ে ${onsetShift > 0 ? '+' : ''}${onsetShift} দিন পরিবর্তিত হয়েছে।`
        : 'নাসার দুটি উপাত্তের মধ্যে মতভেদ আছে। ফিল্ডশিফট শুধু নিশ্চিত তথ্যের ভিত্তিতে পরামর্শ দেয়।',
      bigNums: onsetShift != null
        ? [{ rawVal: Math.abs(onsetShift), prefix: onsetShift > 0 ? '+' : '−', suffix: ' days', label: 'monsoon shift', labelBn: 'বর্ষা পরিবর্তন', color: '#F5B04C', decimals: 0 }]
        : [],
      nums: [
        { label: 'IMERG rain', labelBn: 'ইমার্জ বৃষ্টি', val: '0.1° grid', color: '#38D9F5' },
        { label: 'POWER temp', labelBn: 'পাওয়ার তাপ', val: '0.5° grid', color: '#F5B04C' },
      ],
      nasa: 'IMERG · NASA POWER',
      link: { label: 'Climate & Risk', labelBn: 'জলবায়ু ও ঝুঁকি', dest: 'weather' },
      side: 'right',
    },
    // ── 5: Soil health ────────────────────────────────────────────────────
    {
      idx: '06 · Soil',
      problem: true,
      headlineEn: 'Continuous rice depletes <em>the soil.</em>',
      headlineBn: 'ধারাবাহিক ধান মাটির পুষ্টি নষ্ট করে।',
      bodyEn: 'Adding a legume break restores nitrogen and cuts fertiliser costs. FieldShift computes the gain.',
      bodyBn: 'ডাল ফসলের বিরতি নাইট্রোজেন পুনরুদ্ধার করে এবং সার খরচ কমায়। ফিল্ডশিফট লাভ হিসাব করে।',
      nasa: 'SoilGrids 250m · POWER',
      link: { label: 'Rotation Planner', labelBn: 'আবর্তন পরিকল্পনা', dest: 'farm_planning' },
      side: 'left',
    },
    // ── 6: Rotation decision ─────────────────────────────────────────────
    {
      idx: '07 · Decision',
      headlineEn: 'What should your field grow <em>next?</em>',
      headlineBn: 'পরের মৌসুমে আপনার জমিতে কী ফলানো উচিত?',
      bodyEn: 'MILP optimisation weighs water, profit, soil health and risk across 4 strategies — in seconds.',
      bodyBn: 'এমআইএলপি অপ্টিমাইজেশন পানি, মুনাফা, মাটির স্বাস্থ্য ও ঝুঁকি মিলিয়ে ৪টি কৌশল তুলনা করে — মুহূর্তেই।',
      nums: [
        { label: 'Max Profit',   labelBn: 'সর্বোচ্চ মুনাফা', val: '₹', color: '#C8F169' },
        { label: 'Water Star',   labelBn: 'পানি সাশ্রয়ী', val: '💧', color: '#38D9F5' },
        { label: 'Climate Adapt',labelBn: 'জলবায়ু সহনশীল', val: '🌡', color: '#F5B04C' },
        { label: 'Balanced',     labelBn: 'সুষম', val: '⭐', color: '#EAF2EC' },
      ],
      nasa: 'MILP · POWER · IMERG',
      link: { label: 'Rotation Planner', labelBn: 'আবর্তন পরিকল্পনা', dest: 'farm_planning' },
      side: 'right',
    },
    // ── 7: Extreme weather ────────────────────────────────────────────────
    {
      idx: '08 · Stress',
      problem: true,
      headlineEn: 'What if a drought or flood <em>hits your field?</em>',
      headlineBn: 'খরা বা বন্যা আঘাত করলে আপনার জমির কী হবে?',
      bodyEn: 'The Stress Test runs 6 extreme-weather scenarios and shows how much yield each rotation keeps.',
      bodyBn: 'স্ট্রেস টেস্ট ৬টি চরম আবহাওয়া পরিস্থিতি চালায় এবং প্রতিটি আবর্তনে কতটুকু ফলন টিকে থাকে তা দেখায়।',
      nasa: 'IMERG · NASA POWER · GRACE-FO',
      link: { label: 'Stress Test', labelBn: 'স্ট্রেস টেস্ট', dest: 'farm_planning' },
      side: 'left',
    },
    // ── 8: Learning loop ──────────────────────────────────────────────────
    {
      idx: '09 · Learning',
      headlineEn: 'FieldShift learns from <em>your results.</em>',
      headlineBn: 'ফিল্ডশিফট আপনার ফলাফল থেকে শেখে।',
      bodyEn: 'Log each season\'s yield and costs. The Q-learning loop improves your personalised plan each year.',
      bodyBn: 'প্রতিটি মৌসুমের ফলন ও খরচ লিখুন। কিউ-লার্নিং লুপ প্রতি বছর আপনার ব্যক্তিগত পরিকল্পনা উন্নত করে।',
      nasa: 'Q-Learning · Farm History',
      link: { label: 'Market & Profit', labelBn: 'বাজার ও মুনাফা', dest: 'harvest_profit' },
      side: 'right',
    },
    // ── 9: Start with your field ─────────────────────────────────────────
    {
      idx: '10 · Start',
      headlineEn: 'Start with <em>your field.</em>',
      headlineBn: 'শুরু হোক আপনার নিজের জমি দিয়ে।',
      bodyEn: 'Pin it on the map and tell us what you grow — FieldShift reads NASA data for that exact spot.',
      bodyBn: 'মানচিত্রে জমি চিহ্নিত করুন আর বলুন কী ফলান — ফিল্ডশিফট সেই নির্দিষ্ট স্থানের নাসা উপাত্ত পড়বে।',
      nums: fieldAreaBigha ? [
        { label: 'Your field', labelBn: 'আপনার জমি', val: `${fieldAreaBigha} bigha`, color: '#C8F169' },
      ] : [],
      cta: { label: 'Start with my field', labelBn: 'আমার জমি দিয়ে শুরু করুন', dest: 'field' },
      side: 'left',
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [isBn, barindTrend, haorTrend, onsetShift, fieldAreaBigha]);

  // ── reduced-motion / no-webgl fallback ───────────────────────────────────
  if (prefersReducedMotion || !hasWebGL) {
    return <StaticFallback scenes={SCENES} isBn={isBn} onNavigate={onNavigate} />;
  }

  // ── full story layout ────────────────────────────────────────────────────
  // The spacer div provides scroll height; the FIXED canvas sits behind everything.
  return (
    <>
      {/* Fixed 3D canvas — full viewport, z=0, behind sidebar + topbar */}
      <OrbitToFieldCanvas
        scrollProgress={scrollProgress}
        activeField={activeField}
        graceTrends={graceTrendsData}
        onsetComparison={advisoryData?.comparison}
      />

      {/* Scroll spacer — provides the scroll height for the story */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          height: `${SCENE_COUNT * 100}vh`,
          pointerEvents: 'none',
        }}
      >
        {/* Progress rail — right edge, above canvas */}
        <div
          style={{
            position: 'fixed',
            top: '50%',
            right: 20,
            transform: 'translateY(-50%)',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
            background: 'rgba(10, 18, 14, 0.6)',
            padding: '8px 6px',
            borderRadius: 20,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            pointerEvents: 'auto',
          }}
        >
          {SCENES.map((s, i) => {
            const isActive = currentSceneIndex === i;
            return (
              <div key={i} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => scrollToScene(i)}
                  onMouseEnter={() => setHoveredScene(i)}
                  onMouseLeave={() => setHoveredScene(null)}
                  aria-label={`Jump to scene ${i + 1}: ${s.idx}`}
                  style={{
                    width: 8,
                    height: isActive ? 20 : 8,
                    borderRadius: 4,
                    background: isActive ? 'var(--lime, #C8F169)' : 'rgba(255, 255, 255, 0.28)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.22s ease',
                    boxShadow: isActive ? '0 0 10px var(--lime, #C8F169)' : 'none',
                    display: 'block',
                  }}
                />
                {/* Hover label */}
                {hoveredScene === i && (
                  <div style={{
                    position: 'absolute',
                    right: 18,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(10, 18, 14, 0.9)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    padding: '3px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#C8F169',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}>
                    {s.idx}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Scene overlay columns: 10 × 100vh absolute panels */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          {SCENES.map((scene, idx) => {
            // Show only the active scene card and fade neighbours
            const dist = Math.abs(currentSceneIndex - idx);
            const opacity = dist === 0 ? 1 : dist === 1 ? 0.0 : 0;
            return (
              <div
                key={scene.idx}
                id={`story-scene-${idx + 1}`}
                style={{
                  height: '100vh',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 5%',
                  transition: 'opacity 0.4s ease',
                  opacity,
                  pointerEvents: dist === 0 ? 'auto' : 'none',
                }}
              >
                <GlassCard
                  scene={scene}
                  isBn={isBn}
                  onNavigate={onNavigate}
                  isActive={dist === 0}
                  side={scene.side || 'left'}
                />

                {/* Scene 10 (idx=9): right-side "Your Field" card */}
                {idx === 9 && activeField && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '5%',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 'min(40%, 420px)',
                      background: 'rgba(14, 24, 20, 0.88)',
                      border: '1px solid rgba(200, 241, 105, 0.25)',
                      borderRadius: 20,
                      padding: '20px 22px',
                      color: '#EAF2EC',
                      pointerEvents: 'auto',
                      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 28px rgba(200, 241, 105, 0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    {/* Mini map */}
                    <div style={{ height: 140, borderRadius: 14, background: '#0d1f15', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative' }}>
                      <svg viewBox="0 0 400 140" style={{ width: '100%', height: '100%' }}>
                        <defs>
                          <pattern id="fg7" width="26" height="26" patternUnits="userSpaceOnUse">
                            <path d="M26 0L0 0 0 26" fill="none" stroke="rgba(200,241,105,0.12)" strokeWidth="1" />
                          </pattern>
                        </defs>
                        <rect width="400" height="140" fill="url(#fg7)" />
                        <path d="M20 120 Q110 40 230 90 T380 30" fill="none" stroke="#38D9F5" strokeWidth="7" strokeOpacity="0.3" strokeLinecap="round" />
                        <polygon points="168,38 228,32 242,108 182,114" fill="rgba(200,241,105,0.18)" stroke="#C8F169" strokeWidth="1.5" strokeDasharray="3 3" />
                        <g transform="translate(203 70)">
                          <circle r="20" fill="#C8F169" opacity="0.18" />
                          <circle r="10" fill="#C8F169" opacity="0.38" />
                          <path d="M0,0 c-7,-10 -7,-19 0,-23 c7,4 7,13 0,23z" fill="#C8F169" />
                          <circle cy="-15" r="3.5" fill="#0c1a12" />
                        </g>
                      </svg>
                      <div style={{ position: 'absolute', bottom: 8, left: 12, fontSize: 10, fontWeight: 700, color: '#C8F169', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {isBn ? 'স্যাটেলাইট পার্সেল' : 'Satellite Parcel'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 18, fontWeight: 700, color: '#fff' }}>
                        {fieldName}
                      </div>
                      <span style={{ fontSize: 11, color: '#9fb3a5', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 99 }}>
                        {fieldDistrict}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {[
                        { icon: '🌾', labelEn: 'What you grow', labelBn: 'বর্তমান ফসল', val: fieldCrop, valColor: '#fff' },
                        { icon: '💧', labelEn: 'Irrigation', labelBn: 'সেচ', val: fieldIrrMm != null ? `${fieldIrrMm} mm` : null, valColor: '#38D9F5' },
                        { icon: '📐', labelEn: 'Area', labelBn: 'জমির পরিমাপ', val: fieldAreaBigha != null ? `${fieldAreaBigha} bigha` : null, valColor: '#C8F169' },
                      ].map((row, ri) => row.val && (
                        <div key={ri} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '7px 11px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)' }}>
                          <span style={{ fontSize: 12.5, color: '#9fb3a5', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span>{row.icon}</span>
                            <span>{isBn ? row.labelBn : row.labelEn}</span>
                          </span>
                          <b style={{ fontSize: 12.5, color: row.valColor }}>{row.val}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fade-to-normal-bg at the bottom of the story */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          height: 80,
          marginTop: -80,
          background: 'linear-gradient(to bottom, transparent, var(--bg-deep, #04070c) 100%)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

export default OrbitToFieldStory;
