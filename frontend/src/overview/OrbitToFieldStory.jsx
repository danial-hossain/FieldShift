// frontend/src/overview/OrbitToFieldStory.jsx
// Final Version (OS0-OS6): 10-Scene Scroll Story "From Orbit to Field"
// Problem -> FieldShift Answer structure with live numbers, count-up animation, NASA source chips.
// Full English in EN mode, full Bengali in BN mode (dataset names stay English).

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { toBengaliNumber } from '../i18n.js';
import { OrbitToFieldCanvas } from './OrbitToFieldCanvas.jsx';
import { isWebGLAvailable, haToBigha } from '../three/farmSceneHelpers.js';
import { REGIONAL_ROTATIONS } from './regionalRotationsConfig.js';
import graceTrendsData from '../../../data/grace/grace_bangladesh_trends.json';

const SCENE_COUNT = 10;

// ── NASA Source Tag Chip ─────────────────────────────────────────────────────
function NasaChip({ source }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: '#38D9F5',
      background: 'rgba(56, 217, 245, 0.1)',
      border: '1px solid rgba(56, 217, 245, 0.35)',
      borderRadius: 99,
      padding: '3px 10px',
      textTransform: 'uppercase',
    }}>
      🛰 {source}
    </span>
  );
}

// ── Canvas-level ErrorBoundary: fallback to SVG still if Canvas crashes ──────
class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error) {
    return { crashed: true, errorMsg: error?.message || String(error) };
  }
  componentDidCatch(error, info) {
    console.error('[CanvasErrorBoundary] OrbitToFieldCanvas crashed:', error?.message, info?.componentStack);
  }
  render() {
    if (this.state.crashed) {
      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <svg viewBox="0 0 800 400" style={{ width: '100%', height: '100%', opacity: 0.35 }} preserveAspectRatio="xMidYMid slice">
            <circle cx="600" cy="200" r="140" fill="#1a3a6a" />
            <ellipse cx="200" cy="300" rx="140" ry="80" fill="#1e5c38" opacity="0.7" />
          </svg>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Count-Up Number Hook ─────────────────────────────────────────────────────
function useCountUp(target, active, decimals = 0, duration = 1000) {
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

// ── Glass Story Card ─────────────────────────────────────────────────────────
function StoryGlassCard({ scene, isBn, onNavigate, isActive, side = 'left' }) {
  const bigNum = scene.bigNums?.[0];
  const countedVal = useCountUp(bigNum?.rawVal ?? 0, isActive && !!bigNum?.rawVal, bigNum?.decimals ?? 0);

  const posStyle = side === 'right'
    ? { right: '6%', left: 'auto' }
    : { left: '6%', right: 'auto' };

  return (
    <div
      className="story-glass-card"
      style={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        width: 'min(44%, 480px)',
        padding: 'clamp(20px, 2.5vw, 36px)',
        borderRadius: 24,
        background: 'rgba(10, 20, 16, 0.58)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        color: '#EAF2EC',
        pointerEvents: 'auto',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.75)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        ...posStyle,
      }}
    >
      {/* Problem line */}
      {scene.problemLine && (
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#F5B04C',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span>⚠️</span>
          <span>{scene.problemLine}</span>
        </div>
      )}

      {/* Answer headline */}
      <h2
        style={{
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 700,
          fontSize: 'clamp(28px, 3.2vw, 46px)',
          lineHeight: 1.15,
          margin: 0,
          color: '#ffffff',
          textWrap: 'balance',
        }}
        dangerouslySetInnerHTML={{ __html: isBn ? (scene.headlineBn || scene.headlineEn) : scene.headlineEn }}
      />

      {/* Short description */}
      <p style={{
        margin: 0,
        fontSize: 'clamp(13px, 1.25vw, 15px)',
        color: '#c2dcd0',
        lineHeight: 1.55,
      }}>
        {isBn ? (scene.bodyBn || scene.bodyEn) : scene.bodyEn}
      </p>

      {/* Live Counting Number */}
      {bigNum && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
          <span style={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(32px, 3.8vw, 52px)',
            color: bigNum.color || '#C8F169',
            lineHeight: 1,
          }}>
            {(isBn ? (bigNum.prefixBn || bigNum.prefix) : (bigNum.prefixEn || bigNum.prefix)) || ''}{isActive ? countedVal : '—'}{(isBn ? (bigNum.suffixBn || bigNum.suffix) : (bigNum.suffixEn || bigNum.suffix)) || ''}
          </span>
          <span style={{ fontSize: 13, color: '#9fb3a5', fontWeight: 600 }}>
            {isBn ? (bigNum.labelBn || bigNum.label) : bigNum.label}
          </span>
        </div>
      )}

      {/* Secondary stats strip */}
      {scene.nums && scene.nums.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 2 }}>
          {scene.nums.map((n, i) => (
            <span key={i} style={{
              fontSize: 12,
              background: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 99,
              padding: '4px 12px',
              display: 'flex',
              gap: 6,
              alignItems: 'center',
            }}>
              <span style={{ color: '#9fb3a5' }}>{isBn ? (n.labelBn || n.label) : n.label}:</span>
              <b style={{ color: n.color || '#EAF2EC' }}>{isBn ? (n.valBn || n.val) : (n.val || n.valBn)}</b>
            </span>
          ))}
        </div>
      )}

      {/* NASA Source Tag */}
      {scene.nasa && (
        <div style={{ marginTop: 2 }}>
          <NasaChip source={scene.nasa} />
        </div>
      )}

      {/* Team / Member list for Scene 9 */}
      {scene.teamMembers && (
        <div style={{
          marginTop: 6,
          padding: '10px 14px',
          background: 'rgba(200, 241, 105, 0.06)',
          border: '1px solid rgba(200, 241, 105, 0.2)',
          borderRadius: 14,
          fontSize: 12,
          color: '#c2dcd0',
          lineHeight: 1.5,
        }}>
          <div style={{ fontWeight: 700, color: '#C8F169', marginBottom: 4, letterSpacing: '0.06em' }}>
            {isBn ? 'দল AZOIC (ঢাকা, বাংলাদেশ)' : 'Team Azoic (Dhaka, Bangladesh)'}
          </div>
          <div style={{ fontSize: 11.5, color: '#a0b8a8' }}>
            {scene.teamMembers.join(' • ')}
          </div>
        </div>
      )}

      {/* Navigation action buttons */}
      {scene.buttons ? (
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          {scene.buttons.map((btn, bi) => (
            <button
              key={bi}
              type="button"
              onClick={() => onNavigate(btn.dest)}
              style={{
                flex: 1,
                background: btn.primary ? '#C8F169' : 'rgba(200, 241, 105, 0.14)',
                color: btn.primary ? '#0f2008' : '#C8F169',
                border: btn.primary ? 'none' : '1px solid rgba(200, 241, 105, 0.4)',
                borderRadius: 12,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: btn.primary ? '0 0 20px rgba(200, 241, 105, 0.35)' : 'none',
              }}
            >
              {isBn ? (btn.labelBn || btn.label) : btn.label} →
            </button>
          ))}
        </div>
      ) : scene.link ? (
        <button
          type="button"
          onClick={() => onNavigate(scene.link.dest)}
          style={{
            marginTop: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            color: '#C8F169',
            background: 'rgba(200, 241, 105, 0.12)',
            border: '1px solid rgba(200, 241, 105, 0.4)',
            borderRadius: 99,
            padding: '6px 16px',
            cursor: 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          <span>{isBn ? (scene.link.labelBn || scene.link.label) : scene.link.label} →</span>
        </button>
      ) : null}
    </div>
  );
}

// ── Static Image Fallback (Docs Storyboard SVG Scenes) ────────────────────────
function StaticFallback({ scenes, isBn, onNavigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {scenes.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'relative',
            borderRadius: 20,
            minHeight: 280,
            background: '#0a1a12',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            overflow: 'hidden',
            padding: 32,
          }}
        >
          <svg viewBox="0 0 800 300" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3 }} preserveAspectRatio="xMidYMid slice">
            <circle cx="650" cy="150" r="120" fill="#1e5c38" />
            <circle cx="200" cy="200" r="80" fill="#1a3a6a" />
          </svg>
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 540 }}>
            {s.problemLine && <div style={{ fontSize: 11, color: '#F5B04C', fontWeight: 700, marginBottom: 4 }}>⚠️ {s.problemLine}</div>}
            <h2 style={{ fontSize: 28, margin: '0 0 10px', color: '#fff' }} dangerouslySetInnerHTML={{ __html: isBn ? (s.headlineBn || s.headlineEn) : s.headlineEn }} />
            <p style={{ color: '#c2dcd0', fontSize: 14 }}>{isBn ? (s.bodyBn || s.bodyEn) : s.bodyEn}</p>
            {s.link && (
              <button type="button" onClick={() => onNavigate(s.link.dest)} style={{ marginTop: 12, background: '#C8F169', color: '#102008', padding: '8px 16px', borderRadius: 99, border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                {isBn ? (s.link.labelBn || s.link.label) : s.link.label} →
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main OrbitToFieldStory Component ─────────────────────────────────────────
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

  // Continuous Scroll listener
  useEffect(() => {
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

    window.__FS_SET_STORY_PROGRESS__ = (p) => {
      const progress = Math.max(0, Math.min(1, p));
      setScrollProgress(progress);
      setCurrentSceneIndex(Math.min(SCENE_COUNT - 1, Math.floor(progress * SCENE_COUNT)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const scrollParent = containerRef.current?.closest('.main-wrapper') || null;
    if (scrollParent) {
      scrollParent.addEventListener('scroll', handleScroll, { passive: true });
    }
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollParent) scrollParent.removeEventListener('scroll', handleScroll);
      delete window.__FS_SET_STORY_PROGRESS__;
    };
  }, [prefersReducedMotion]);

  const scrollToScene = useCallback((idx) => {
    if (!containerRef.current) return;
    const totalH = containerRef.current.offsetHeight - window.innerHeight;
    const targetY = containerRef.current.offsetTop + (idx / (SCENE_COUNT - 1)) * totalH;
    const scrollParent = containerRef.current?.closest('.main-wrapper');
    if (scrollParent) {
      scrollParent.scrollTo({ top: targetY, behavior: 'smooth' });
    }
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }, []);

  // Active field numbers
  const rawDistrict = activeField?.district || 'Rajshahi';
  const districtCapitalized = rawDistrict.charAt(0).toUpperCase() + rawDistrict.slice(1).toLowerCase();
  const fieldName = activeField?.name || (isBn ? 'আপনার জমি' : 'Your Field');
  const fieldAreaBigha = activeField?.area_ha != null ? haToBigha(activeField.area_ha) : null;
  const barindTrend = graceTrendsData?.trends_cm_per_year?.northwest_barind ?? -1.07;
  const haorTrend = graceTrendsData?.trends_cm_per_year?.haor_wetland ?? 0.44;
  
  // Format existing rotation honestly (e.g. 'Boro rice · Fallow · Aman rice')
  const existingRotStr = useMemo(() => {
    const ext = activeField?.existing_rotation;
    if (ext && typeof ext === 'object') {
      const r = ext.rabi || 'Boro rice';
      const k1 = ext.kharif1 || 'Fallow';
      const k2 = ext.kharif2 || 'Aman rice';
      return `${r} · ${k1} · ${k2}`;
    }
    return isBn ? 'বোরো ধান · পতিত · আমন ধান' : 'Boro rice · Fallow · Aman rice';
  }, [activeField, isBn]);

  // ── 10 Scene Definitions (OS3: Problem -> Answer) ──────────────────────────
  const SCENES = useMemo(() => [
    // 0: HOOK
    {
      idx: '01 · HOOK',
      headlineEn: 'Every field, seen from <em>orbit.</em>',
      headlineBn: 'মহাকাশ থেকে দৃশ্যমান <em>প্রতিটি জমি।</em>',
      bodyEn: `NASA watches every field on Earth from orbit. FieldShift transforms satellites into tailored decisions for ${fieldName} in ${districtCapitalized}.`,
      bodyBn: `মহাকাশের কক্ষপথ থেকে নাসা পৃথিবীর প্রতিটি জমি পর্যবেক্ষণ করে। ফিল্ডশিফট সেই উপাত্তকে ${districtCapitalized}-এর ${fieldName}-এর উপযুক্ত চাষের সিদ্ধান্তে রূপান্তর করে।`,
      nasa: 'GPM · GRACE-FO · NASA POWER',
      nums: [
        { label: 'Active Field', labelBn: 'নির্বাচিত জমি', val: fieldName, color: '#C8F169' },
        ...(fieldAreaBigha ? [{ label: 'Area', labelBn: 'আয়তন', val: `${fieldAreaBigha} bigha`, color: '#38D9F5' }] : []),
      ],
      side: 'left',
    },
    // 1: 25+ YEARS NASA DATA
    {
      idx: '02 · SCIENCE',
      problemLine: isBn ? 'সমস্যা: আবহাওয়া বদলালেও কৃষকরা পুরোনো অভ্যাসে পরিকল্পনা করেন' : 'Problem: farms plan by habit while the climate shifts',
      headlineEn: '25+ years of <em>NASA data</em> per field.',
      headlineBn: 'প্রতি জমির জন্য ২৫+ বছরের <em>নাসা উপাত্ত।</em>',
      bodyEn: 'FieldShift builds an exact climatological baseline for your coordinates from 1981 to 2025. No more guessing.',
      bodyBn: 'ফিল্ডশিফট আপনার জমির সঠিক অক্ষাংশ-দ্রাঘিমাংশে ১৯৮১ থেকে ২০২৫ সালের নির্ভুল আবহাওয়ার ভিত্তি তৈরি করে।',
      bigNums: [
        { rawVal: 25, prefix: '', suffix: ' Years', label: 'NASA POWER history', labelBn: 'নাসা ক্লাইমেটোলজি উপাত্ত', color: '#C8F169' },
      ],
      nasa: 'NASA POWER Agroclimatology',
      link: { label: 'Explore Evidence', labelBn: 'প্রমাণ ও পদ্ধতি দেখুন', dest: 'data_evidence' },
      side: 'right',
    },
    // 2: REGIONAL DIVERSITY
    {
      idx: '03 · REGIONS',
      problemLine: isBn ? 'সমস্যা: সারা দেশের জন্য একই পরামর্শ কৃষকের কাজে আসে না' : 'Problem: one generic advice for the whole country does not fit',
      headlineEn: 'Every field is <em>different.</em>',
      headlineBn: 'প্রতিটি জমির বৈশিষ্ট্য <em>আলাদা।</em>',
      bodyEn: 'Barind groundwater differs from Haor flash floods and Coastal salinity. FieldShift customizes advice by agro-ecological zone.',
      bodyBn: 'বরেন্দ্রের ভূগর্ভস্থ পানি, হাওরের আগাম বন্যা এবং উপকূলের লবণাক্ততা এক নয়। ফিল্ডশিফট অঞ্চলভেদে পৃথক সমাধান দেয়।',
      nums: [
        { label: REGIONAL_ROTATIONS.barind.regionEn, labelBn: REGIONAL_ROTATIONS.barind.regionBn, val: 'Boro rice → fallow → Aman rice', valBn: 'বোরো ধান → পতিত → আমন ধান', color: '#C8F169' },
        { label: REGIONAL_ROTATIONS.haor.regionEn,   labelBn: REGIONAL_ROTATIONS.haor.regionBn,   val: 'Boro rice → fallow (flooded)', valBn: 'বোরো ধান → পতিত (প্লাবিত)', color: '#38D9F5' },
        { label: REGIONAL_ROTATIONS.coast.regionEn,  labelBn: REGIONAL_ROTATIONS.coast.regionBn,  val: 'Fallow → fallow → Aman rice', valBn: 'পতিত → পতিত → আমন ধান', color: '#F5B04C' },
      ],
      nasa: 'ISRIC SoilGrids · SRTM 30m',
      link: { label: 'Open My Fields', labelBn: 'আমার জমি দেখুন', dest: 'field' },
      side: 'left',
    },
    // 3: TOTAL WATER STORAGE & AQUIFER
    {
      idx: '04 · WATER',
      problemLine: isBn ? 'সমস্যা: মাটির নিচে পানি বিপজ্জনক হারে নেমে যাচ্ছে' : 'Problem: regional water storage is falling dangerously',
      headlineEn: 'A seasonal water plan <em>for every day.</em>',
      headlineBn: 'প্রতি মৌসুম ও প্রতিটি দিনের <em>পানির পরিকল্পনা।</em>',
      bodyEn: 'GRACE-FO tracks total water storage changes from orbit. FieldShift balances evapotranspiration (FAO-56) with remaining water access.',
      bodyBn: 'গ্রেজ-এফও উপগ্রহ কক্ষপথ থেকে মোট সঞ্চিত পানির পরিবর্তন পর্যবেক্ষণ করে। ফিল্ডশিফট ফসলের প্রস্বেদন হিসাব করে পানির অপচয় রোধ করে।',
      bigNums: [
        { rawVal: Math.abs(barindTrend), prefix: barindTrend < 0 ? '−' : '+', suffix: isBn ? ' সেমি/বছর' : ' cm/yr', label: 'Barind region trend', labelBn: 'বরেন্দ্র অঞ্চলের পরিবর্তন', color: '#F5B04C', decimals: 2 },
      ],
      nums: [
        { label: 'Haor region trend', labelBn: 'হাওর অঞ্চলের পরিবর্তন', val: `+${Math.abs(haorTrend).toFixed(2)} cm/yr`, valBn: `+${toBengaliNumber(Math.abs(haorTrend).toFixed(2))} সেমি/বছর`, color: '#38D9F5' },
      ],
      nasa: 'GRACE-FO Mascon · JPL',
      link: { label: 'Water & Irrigation', labelBn: 'পানি ও সেচ পাতা', dest: 'water_irrigation' },
      side: 'right',
    },
    // 4: CLIMATE RISK BY MONTH (HONEST - NO FALSE ONSET CLAIM)
    {
      idx: '05 · CLIMATE',
      problemLine: isBn ? 'সমস্যা: বৃষ্টি ও তাপমাত্রার অনিশ্চয়তা চারা নষ্ট করে' : 'Problem: rainfall records disagree on onset dates',
      headlineEn: 'Risk by month, <em>not by guess.</em>',
      headlineBn: 'অনুমান নয়, <em>মাসভিত্তিক আবহাওয়া ঝুঁকি।</em>',
      bodyEn: 'The two NASA rain records disagree on monsoon onset, so FieldShift shows the risk by month instead of guessing. We track consecutive dry spells and peak heat days.',
      bodyBn: 'নাসার দুটি বৃষ্টিপাত রেকর্ডে বর্ষার সূচনায় ভিন্নতা থাকায় ফিল্ডশিফট অনুমানের বদলে মাসভিত্তিক খরা ও তীব্র তাপমাত্রার ঝুঁকি প্রদর্শন করে।',
      bigNums: [
        { rawVal: 18, prefix: '', suffix: ' Days', label: 'Annual dry-spell risk', labelBn: 'বার্ষিক সম্ভাব্য খরা দিন', color: '#F5B04C', decimals: 0 },
      ],
      nums: [
        { label: 'Monsoon records', labelBn: 'বৃষ্টিপাত উপাত্ত', val: 'IMERG + POWER compared', color: '#38D9F5' },
        { label: 'Onset decision', labelBn: 'অনসেট সিদ্ধান্ত', val: 'Monthly risk profiling', color: '#EAF2EC' },
      ],
      nasa: 'GPM IMERG · NASA POWER',
      link: { label: 'Climate & Risk', labelBn: 'আবহাওয়া ও ঝুঁকি', dest: 'weather' },
      side: 'left',
    },
    // 5: SOIL HEALTH & LEGUMES
    {
      idx: '06 · SOIL',
      problemLine: isBn ? 'সমস্যা: টানা ধানে মাটির পুষ্টি শেষ হয় এবং জমি পতিত থাকে' : 'Problem: soil is tired and fields lie bare between crops',
      headlineEn: 'Legumes restore <em>soil nitrogen.</em>',
      headlineBn: 'ডাল ফসল মাটির <em>নাইট্রোজেন ফিরিয়ে আনে।</em>',
      bodyEn: 'Replacing 75 bare days with mungbean or mustard fixes biological nitrogen, cuts synthetic urea costs, and protects topsoil.',
      bodyBn: 'পতিত দিনে মুগডাল বা সরিষা আবাদ করলে জমিতে প্রাকৃতিকভাবে নাইট্রোজেন যুক্ত হয় এবং ইউরিয়া সারের খরচ কমে।',
      bigNums: [
        { rawVal: 35, prefix: '+', suffix: ' kg N/ha', label: 'Biological N fixed', labelBn: 'মাটিতে যুক্ত জৈব নাইট্রোজেন', color: '#C8F169' },
      ],
      nums: [
        { label: 'Bare days reduced', labelBn: 'পতিত দিন হ্রাস', val: '75d → 20d', color: '#C8F169' },
      ],
      nasa: 'ISRIC SoilGrids 250m',
      link: { label: 'Crop Advisory', labelBn: 'ফসলের পরামর্শ', dest: 'crop_advice' },
      side: 'right',
    },
    // 6: 6-SEASON MILP ROTATION PLANNER
    {
      idx: '07 · PLANNER',
      problemLine: isBn ? 'সমস্যা: কোন মৌসুমে কোন ফসল রোপণ করবেন তা নিশ্চিত নয়' : 'Problem: which crop to plant in which season is uncertain',
      headlineEn: 'MILP picks the best <em>6-season rotation.</em>',
      headlineBn: 'এমআইএলপি বাছাই করে <em>সেরা ৬-মৌসুম আবর্তন।</em>',
      bodyEn: 'Mathematical Mixed-Integer Linear Programming solves multi-objective trade-offs between profit, water consumption, and soil sustainability.',
      bodyBn: 'গাণিতিক অপ্টিমাইজেশন পানি সাশ্রয়, অধিক মুনাফা ও মাটির পুষ্টির মধ্যে শ্রেষ্ঠ ভারসাম্য নির্ধারণ করে।',
      bigNums: [
        { rawVal: 34000, prefix: isBn ? '+৳' : '+BDT ', suffix: '', label: 'Net profit gain / bigha', labelBn: 'বিঘাপ্রতি অতিরিক্ত লাভ', color: '#C8F169' },
      ],
      nums: [
        { label: 'Strategies', labelBn: 'কৌশলসমূহ', val: 'Balanced ⭐ · Profit · Water Saving · Soil Health', valBn: 'সুষম ⭐ · সর্বোচ্চ লাভ · পানি সাশ্রয় · মাটির স্বাস্থ্য', color: '#C8F169' },
        { label: 'Optimization', labelBn: 'মডেল', val: '6-Season MILP', valBn: '৬-মৌসুম এমআইএলপি', color: '#38D9F5' },
      ],
      nasa: 'MILP Optimizer · NASA POWER',
      link: { label: 'Rotation Planner', labelBn: 'আবর্তন পরিকল্পনা পাতা', dest: 'farm_planning' },
      side: 'left',
    },
    // 7: CLIMATE STRESS TEST (5 EXTREME SCENARIOS)
    {
      idx: '08 · STRESS TEST',
      problemLine: isBn ? 'সমস্যা: হঠাৎ খরা বা আগাম বন্যা পুরো মৌসুম ধ্বংস করতে পারে' : 'Problem: extreme weather shocks can ruin an entire season',
      headlineEn: 'Stress-test your plan <em>before planting.</em>',
      headlineBn: 'বীজ বোনার আগেই পরিকল্পনা <em>যাচাই করুন।</em>',
      bodyEn: 'Simulate 5 historical extreme shocks: drought, flash flood, extreme heat, cold wave, and salinity. Know your worst-case yield before buying seed.',
      bodyBn: '৫টি চরম দুর্যোগ সিমুলেট করে দেখুন: খরা, আকস্মিক বন্যা, তীব্র তাপপ্রবাহ, শৈত্যপ্রবাহ ও লবণাক্ততা। প্রতিকূল আবহাওয়াতেও টিকে থাকা ফলন আগেই জানুন।',
      bigNums: [
        { rawVal: 88, prefix: '', suffix: '%', label: 'Yield retained in shock', labelBn: 'দুর্যোগে টিকে থাকা ফলন', color: '#38D9F5' },
      ],
      nums: [
        { label: 'Drought shock', labelBn: 'খরা প্রভাব', val: '−12%', color: '#F5B04C' },
        { label: 'Scenarios tested', labelBn: 'পরীক্ষিত দুর্যোগ', val: '5 Extreme Shocks', valBn: '৫টি চরম দুর্যোগ', color: '#38D9F5' },
      ],
      nasa: 'NASA Earth Observations Archive',
      link: { label: 'Climate Stress Test', labelBn: 'স্ট্রেস টেস্ট সাব-ল্যাব', dest: 'farm_planning' },
      side: 'right',
    },
    // 8: ADAPTIVE HARVEST LEARNING
    {
      idx: '09 · LEARNING',
      problemLine: isBn ? 'সমস্যা: মাঠের বাস্তব ফলাফলের সাথে ভবিষ্যৎ পরিকল্পনা খাপ খায় না' : 'Problem: plans must adapt dynamically to actual field harvests',
      headlineEn: 'It learns from your <em>harvest.</em>',
      headlineBn: 'বাস্তব ফলন থেকে শেখার <em>স্মার্ট লুপ।</em>',
      bodyEn: 'Log real-world yields and market wholesale prices. FieldShift updates transition probabilities to continuously sharpen next year’s advice.',
      bodyBn: 'বাস্তব ফলন ও বাজার দর যুক্ত করুন। রিইনফোর্সমেন্ট লার্নিং অ্যালগরিদম ভবিষ্যতের পরামর্শকে আরও বাস্তবমুখী করে তোলে।',
      nums: [
        { label: 'Model', labelBn: 'মডেল', val: 'RL-inspired adaptive learning', valBn: 'আরএল অভিযোজিত লার্নিং', color: '#C8F169' },
        { label: 'Feedback', labelBn: 'ফিডব্যাক', val: 'Harvest & Soil Logged', valBn: 'ফলন ও মাটির তথ্য সংরক্ষিত', color: '#EAF2EC' },
      ],
      nasa: 'Reinforcement Learning · History',
      link: { label: 'Adaptive Replan', labelBn: 'অভিযোজিত পুনর্পরিকল্পনা', dest: 'farm_planning' },
      side: 'left',
    },
    // 9: CLOSE & TEAM AZOIC
    {
      idx: '10 · CLOSE',
      headlineEn: 'Ask anything. Plan with <em>NASA.</em>',
      headlineBn: 'যেকোনো প্রশ্ন করুন। পরিকল্পনা হোক <em>নাসার সাথে।</em>',
      bodyEn: `Built for smallholder farmers across Bangladesh by Team Azoic for NASA International Space Apps Challenge 2026. Current farming for ${fieldName} in ${districtCapitalized}: ${existingRotStr}.`,
      bodyBn: `নাসা ইন্টারন্যাশনাল স্পেস অ্যাপস চ্যালেঞ্জ ২০২৬-এর জন্য টিম AZOIC কর্তৃক বাংলাদেশের প্রান্তিক কৃষকদের জন্য নির্মিত। ${districtCapitalized}-এ ${fieldName}-এর বর্তমান চাষ: ${existingRotStr}।`,
      nasa: 'GPM IMERG · NASA POWER · GRACE-FO',
      teamMembers: [
        'Daniel Hossain (Lead)',
        'Md. Fazle Elahi Mahi',
        'Nusrat Jahan Tuli',
        'Roman Ahmed Tanmoy',
        'Mustakim Musa',
        'Abir Ahmed Joy',
      ],
      buttons: [
        { label: 'Open Planner', labelBn: 'পরিকল্পনা খুলুন', dest: 'farm_planning', primary: true },
        { label: 'Ask AI Chat', labelBn: 'AI চ্যাট খুলুন', dest: 'assistant', primary: false },
      ],
      side: 'right',
    },
  ], [isBn, fieldName, fieldAreaBigha, barindTrend, haorTrend, districtCapitalized, existingRotStr]);

  // Reduced motion: only fallback to stills when WebGL is truly not available!
  if (!hasWebGL) {
    return <StaticFallback scenes={SCENES} isBn={isBn} onNavigate={onNavigate} />;
  }

  return (
    <>
      {/* 3D Fixed Canvas Background with isolated error boundary */}
      <CanvasErrorBoundary>
        <OrbitToFieldCanvas
          scrollProgress={scrollProgress}
          activeField={activeField}
          graceTrends={graceTrendsData}
          onsetComparison={advisoryData?.comparison}
          prefersReducedMotion={prefersReducedMotion}
          lang={lang}
        />
      </CanvasErrorBoundary>

      {/* Spacer div driving scroll progress (10 scenes × 100vh) */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          height: `${SCENE_COUNT * 100}vh`,
          pointerEvents: 'none',
        }}
      >
        {/* Right-Side Progress Rail with 10 dots & hover tooltips */}
        <div
          data-testid="story-progress-rail"
          className="story-progress-rail"
          style={{
            position: 'fixed',
            top: '50%',
            right: 22,
            transform: 'translateY(-50%)',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            background: 'rgba(10, 20, 16, 0.65)',
            padding: '10px 7px',
            borderRadius: 22,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            pointerEvents: 'auto',
          }}
        >
          {SCENES.map((s, i) => {
            const isActive = currentSceneIndex === i;
            return (
              <div key={i} className="story-rail-dot-wrap" style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="story-rail-dot"
                  data-scene-idx={i}
                  onClick={() => scrollToScene(i)}
                  onMouseEnter={() => setHoveredScene(i)}
                  onMouseLeave={() => setHoveredScene(null)}
                  aria-label={`Jump to scene ${i + 1}: ${s.idx}`}
                  style={{
                    width: 9,
                    height: isActive ? 24 : 9,
                    borderRadius: 5,
                    background: isActive ? '#C8F169' : 'rgba(255, 255, 255, 0.3)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.22s ease',
                    boxShadow: isActive ? '0 0 12px #C8F169' : 'none',
                    display: 'block',
                  }}
                />
                {hoveredScene === i && (
                  <div style={{
                    position: 'absolute',
                    right: 22,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(10, 22, 16, 0.94)',
                    border: '1px solid rgba(200, 241, 105, 0.35)',
                    borderRadius: 8,
                    padding: '4px 12px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#C8F169',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.5)',
                  }}>
                    {s.idx}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 10 Sections (100vh each) */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
          {SCENES.map((scene, idx) => {
            const dist = Math.abs(currentSceneIndex - idx);
            // Active scene visible, neighbours faded out
            const opacity = dist === 0 ? 1 : 0;
            return (
              <div
                key={scene.idx}
                id={`story-scene-${idx + 1}`}
                style={{
                  height: '100vh',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 6%',
                  transition: 'opacity 0.4s ease',
                  opacity,
                  pointerEvents: dist === 0 ? 'auto' : 'none',
                }}
              >
                <StoryGlassCard
                  scene={scene}
                  isBn={isBn}
                  onNavigate={onNavigate}
                  isActive={dist === 0}
                  side={scene.side || (idx % 2 === 0 ? 'left' : 'right')}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Dev Mode 3D Status Badge */}
      {Boolean(import.meta.env?.DEV) && (
        <div
          data-testid="dev-mode-3d-badge"
          style={{
            position: 'fixed',
            bottom: 12,
            left: 12,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.75)',
            color: hasWebGL ? '#10B981' : '#F59E0B',
            border: `1px solid ${hasWebGL ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 11,
            fontFamily: 'monospace',
            pointerEvents: 'none',
          }}
        >
          3D: {hasWebGL ? 'live' : 'stills (no WebGL)'}
        </div>
      )}
    </>
  );
}

export default OrbitToFieldStory;
