// frontend/src/overview/OrbitToFieldStory.jsx
// Immersive 3D scroll story "From Orbit to Field" for FieldShift Overview (OV1-OV4).
// Matches docs/overview_storyboard.html closely:
// 7 generic scenes (~100vh each) with sticky 3D canvas background and floating glass cards:
// 1. Space: Navy #05080F, starfield, low-poly Earth, satellite orbit
// 2. Bangladesh: Dives to Bangladesh border, 3 region pins (Barind, Haor, Coast) + active field pin
// 3. Today: 3 regional farm rotations (Barind, Haor, Coast)
// 4. Underground: Cut-away soil strata (GRACE-FO -1.07 cm/yr Barind, +0.44 cm/yr Haor)
// 5. Sky: Uncertain onset (POWER vs IMERG, district p-value check)
// 6. The Question: Glowing '?' hologram + floating candidate crops
// 7. Start: Active field card with 4 inputs and "Start with my field →" CTA button
// Recording mode: "Play story" button auto-scrolls smoothly in ~60s with pause/replay and Esc cancel.
// Prefers-reduced-motion / WebGL-off: clean static card stream.

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { OrbitToFieldCanvas } from './OrbitToFieldCanvas.jsx';
import { isWebGLAvailable, haToBigha } from '../three/farmSceneHelpers.js';
import { REGIONAL_ROTATIONS } from './regionalRotationsConfig.js';
import graceTrendsData from '../../../data/grace/grace_bangladesh_trends.json';

const SCENE_COUNT = 7;

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
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [fps, setFps] = useState(60);
  const autoPlayAnimRef = useRef(null);
  const autoPlayStartRef = useRef(null);

  // Check WebGL and Reduced Motion
  const hasWebGL = useMemo(() => isWebGLAvailable(), []);
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Sync scroll progress
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || prefersReducedMotion) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalH = containerRef.current.offsetHeight - window.innerHeight;
      if (totalH <= 0) return;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(SCENE_COUNT - 1, (scrolled / totalH) * (SCENE_COUNT - 1)));
      setScrollProgress(progress);
      setCurrentSceneIndex(Math.round(progress));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prefersReducedMotion]);

  // Recording Mode: Auto-play smooth scroll through all 7 scenes in ~60s
  const stopAutoPlay = useCallback(() => {
    setIsAutoPlaying(false);
    setIsPaused(false);
    if (autoPlayAnimRef.current) {
      cancelAnimationFrame(autoPlayAnimRef.current);
      autoPlayAnimRef.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    if (!containerRef.current) return;
    setIsAutoPlaying(true);
    setIsPaused(false);

    const totalH = containerRef.current.offsetHeight - window.innerHeight;
    const startScroll = window.scrollY;
    const targetScroll = containerRef.current.offsetTop + totalH;
    const duration = 60000; // 60 seconds
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Smooth cubic in-out
      const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const currentY = startScroll + (targetScroll - startScroll) * ease;
      window.scrollTo(0, currentY);

      if (progress < 1) {
        autoPlayAnimRef.current = requestAnimationFrame(step);
      } else {
        stopAutoPlay();
      }
    };
    autoPlayAnimRef.current = requestAnimationFrame(step);
  }, [stopAutoPlay]);

  // Esc key stops auto play
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAutoPlaying) {
        stopAutoPlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAutoPlaying, stopAutoPlay]);

  // Jump to specific scene
  const scrollToScene = (idx) => {
    if (!containerRef.current) return;
    const totalH = containerRef.current.offsetHeight - window.innerHeight;
    const targetY = containerRef.current.offsetTop + (idx / (SCENE_COUNT - 1)) * totalH;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  // Active Field Telemetry & Derived Values
  const fieldName = activeField?.name || (isBn ? 'আপনার জমি' : 'Your Field');
  const fieldDistrict = activeField?.district || 'chapainawabganj';
  const fieldAreaBigha = activeField?.area_ha != null ? haToBigha(activeField.area_ha) : '5.0';
  const fieldCurrentCrop = activeField?.current_crop || (isBn ? 'বোরো → পতিত → আমন' : 'Boro → Fallow → Aman');
  const fieldWater = activeField?.irrigation_capacity_mm != null
    ? `${activeField.irrigation_capacity_mm} mm`
    : (isBn ? 'পর্যাপ্ত সেচ' : 'Ample water');

  // GRACE trends from file
  const barindTrend = graceTrendsData?.trends_cm_per_year?.northwest_barind ?? -1.07;
  const haorTrend = graceTrendsData?.trends_cm_per_year?.haor_wetland ?? 0.44;

  // District Onset Verification
  const onsetShift = advisoryData?.comparison?.shift_days_median;
  const isConfirmedShift = advisoryData?.comparison?.statistically_significant || (onsetShift != null && Math.abs(onsetShift) >= 10);

  // Scene definitions matching storyboard
  const SCENES = [
    {
      idx: '01 · Orbit',
      titleEn: 'FieldShift',
      titleBn: 'ফিল্ডশিফট',
      descEn: 'NASA watches every field on Earth from orbit.',
      descBn: 'মহাকাশ থেকে প্রতিটি জমিতে নজর রাখে নাসা।',
      chips: null,
      cta: null,
      nums: null,
    },
    {
      idx: '02 · Bangladesh',
      titleEn: 'But every farmer knows only his own field.',
      titleBn: 'কিন্তু প্রতিজন কৃষক শুধু নিজের জমিটুকুই চেনেন।',
      descEn: 'The camera dives to Bangladesh. Each region farms in its own way.',
      descBn: 'ক্যামেরা নেমে আসে বাংলাদেশে। একেক অঞ্চলের কৃষির ধরন একেক রকম।',
      chips: null,
      cta: null,
      nums: null,
    },
    {
      idx: '03 · Today',
      titleEn: 'Every field farms differently.',
      titleBn: 'প্রতিটি জমির চাষাবাদের ধরন আলাদা।',
      descEn: 'FieldShift starts from what YOU grow now, not from a template.',
      descBn: 'কোনো ছকে বাঁধা নিয়ম নয়, ফিল্ডশিফট শুরু করে আপনি এখন যা ফলান তা থেকেই।',
      chips: { label: isBn ? 'আমার জমি দেখুন →' : 'See My Fields →', dest: 'field' },
      cta: null,
      nums: [
        { label: isBn ? REGIONAL_ROTATIONS.barind.regionBn : REGIONAL_ROTATIONS.barind.regionEn, val: isBn ? REGIONAL_ROTATIONS.barind.rotationBn : REGIONAL_ROTATIONS.barind.rotationEn, color: REGIONAL_ROTATIONS.barind.color },
        { label: isBn ? REGIONAL_ROTATIONS.haor.regionBn : REGIONAL_ROTATIONS.haor.regionEn, val: isBn ? REGIONAL_ROTATIONS.haor.rotationBn : REGIONAL_ROTATIONS.haor.rotationEn, color: REGIONAL_ROTATIONS.haor.color },
        { label: isBn ? REGIONAL_ROTATIONS.coast.regionBn : REGIONAL_ROTATIONS.coast.regionEn, val: isBn ? REGIONAL_ROTATIONS.coast.rotationBn : REGIONAL_ROTATIONS.coast.rotationEn, color: REGIONAL_ROTATIONS.coast.color },
      ],
    },
    {
      idx: '04 · Underground',
      titleEn: 'Underground, the water is changing.',
      titleBn: 'মাটির নিচের পানির স্তর নীরবে বদলে যাচ্ছে।',
      descEn: 'GRACE-FO sees it from orbit: falling under Barind, rising under the haor.',
      descBn: 'উপগ্রহ থেকে গ্রেজ-এফও দেখে: বরেন্দ্রে পানি নামছে, আর হাওরে পানি বাড়ছে।',
      chips: { label: isBn ? 'পানির হিসাব দেখুন →' : 'See Water →', dest: 'water_irrigation' },
      cta: null,
      nums: [
        { label: isBn ? 'বরেন্দ্র' : 'Barind', val: `${barindTrend > 0 ? '+' : ''}${barindTrend} cm/yr`, color: '#F5B04C' },
        { label: isBn ? 'হাওর' : 'Haor', val: `+${haorTrend} cm/yr`, color: '#38D9F5' },
        { label: 'GRACE-FO', val: '2002–2026', color: '#EAF2EC' },
      ],
    },
    {
      idx: '05 · Sky',
      titleEn: 'Even the sky is uncertain.',
      titleBn: 'আকাশের পূর্বাভাসও দ্বিধাদ্বন্দ্বে ভরা।',
      descEn: isConfirmedShift
        ? (isBn ? `এই জেলায় আমন রোপণের বৃষ্টি শুরু গড়ে ${onsetShift} দিন পিছিয়েছে (পরিসংখ্যানগতভাবে নিশ্চিত)।` : `Monsoon onset delayed by ${onsetShift} days in this district (statistically confirmed).`)
        : (isBn ? 'বর্ষা শুরুর বিষয়ে নাসার দুই উপাত্তের ভেতর মতভেদ রয়েছে, তাই ফিল্ডশিফট কেবল প্রমাণিত সত্যের ওপর পরামর্শ দেয়।' : 'Two NASA datasets disagree on when the monsoon starts here, so FieldShift only advises on what is confirmed.'),
      descBn: isConfirmedShift
        ? `এই জেলায় আমন রোপণের বৃষ্টি শুরু গড়ে ${onsetShift} দিন পিছিয়েছে (পরিসংখ্যানগতভাবে নিশ্চিত)।`
        : 'বর্ষা শুরুর বিষয়ে নাসার দুই উপাত্তের ভেতর মতভেদ রয়েছে, তাই ফিল্ডশিফট কেবল প্রমাণিত সত্যের ওপর পরামর্শ দেয়।',
      chips: { label: isBn ? 'জলবায়ু ও ঝুঁকি দেখুন →' : 'See Climate & Risk →', dest: 'weather' },
      cta: null,
      nums: [
        { label: 'POWER', val: isBn ? '+১৩ দিন' : '+13 days', color: '#F5B04C' },
        { label: 'IMERG', val: isBn ? '+২.৫ দিন' : '+2.5 days', color: '#38D9F5' },
        { label: isBn ? 'তাৎপর্য' : 'Stat.', val: 'p > 0.1', color: '#9fb3a5' },
      ],
    },
    {
      idx: '06 · The question',
      titleEn: 'What should your field grow next?',
      titleBn: 'পরের মৌসুমে আপনার জমিতে কী ফলানো উচিত?',
      descEn: 'One field, many options. The answer depends on its water, soil, climate and the farmer.',
      descBn: 'এক জমি, অনেক বিকল্প। সঠিক সিদ্ধান্ত নির্ভর করে পানি, মাটি, আবহাওয়া ও কৃষকের সক্ষমতার ওপর।',
      chips: { label: isBn ? 'আবর্তন পরিকল্পনা দেখুন →' : 'See Rotation Planner →', dest: 'farm_planning' },
      cta: null,
      nums: [
        { label: isBn ? 'সরিষা?' : 'Mustard?', val: isBn ? 'বিকল্প' : 'Option', color: '#C8F169' },
        { label: isBn ? 'মুগডাল?' : 'Mungbean?', val: isBn ? 'বিকল্প' : 'Option', color: '#C8F169' },
        { label: isBn ? 'ছোলা?' : 'Chickpea?', val: isBn ? 'বিকল্প' : 'Option', color: '#C8F169' },
        { label: isBn ? 'তিল?' : 'Sesame?', val: isBn ? 'বিকল্প' : 'Option', color: '#C8F169' },
      ],
    },
    {
      idx: '07 · Start',
      titleEn: 'Start with your field.',
      titleBn: 'শুরু হোক আপনার নিজের জমি দিয়ে।',
      descEn: 'Pin it on the map and tell us what you grow. FieldShift does the rest with NASA data.',
      descBn: 'মানচিত্রে জমি চিহ্নিত করুন আর বলুন কী ফলান। নাসা উপাত্ত বিশ্লেষণ করে বাকি পথ দেখাবে ফিল্ডশিফট।',
      chips: null,
      cta: {
        label: isBn ? 'আমার জমি দিয়ে শুরু করুন →' : 'Start with my field →',
        dest: 'farm_planning',
      },
      nums: null,
    },
  ];

  // If reduced motion is requested, render a static card stream
  if (prefersReducedMotion || !hasWebGL) {
    return (
      <div
        className="story-reduced-motion-stream"
        style={{
          padding: '24px 0 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {SCENES.map((s, idx) => (
          <div
            key={s.idx}
            className="dash-card"
            style={{
              background: 'rgba(14, 24, 20, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: 18,
              padding: '20px 24px',
              color: '#EAF2EC',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--lime, #C8F169)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {s.idx}
            </div>
            <h2 style={{ fontFamily: 'var(--display, "Space Grotesk", sans-serif)', fontSize: 24, fontWeight: 700, margin: '6px 0 4px', color: '#ffffff' }}>
              {s.titleEn}
            </h2>
            {isBn && <div style={{ fontSize: 14, color: '#9fb3a5', marginBottom: 6 }}>{s.titleBn}</div>}
            <p style={{ margin: 0, fontSize: 14, color: '#cfe0d4', lineHeight: 1.5 }}>{s.descEn}</p>
            {s.cta && (
              <button
                type="button"
                onClick={() => onNavigate(s.cta.dest)}
                style={{
                  marginTop: 14,
                  background: 'var(--lime, #C8F169)',
                  color: '#10200a',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: 12,
                  padding: '10px 18px',
                  cursor: 'pointer',
                }}
              >
                {s.cta.label}
              </button>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overview-story-container"
      style={{
        position: 'relative',
        height: `${SCENE_COUNT * 100}vh`,
        marginBottom: 28,
        borderRadius: 24,
        overflow: 'hidden',
        background: 'radial-gradient(120% 90% at 15% 50%, #05080F 0%, #071510 60%, #0c1a12 100%)',
      }}
    >
      {/* Fixed/Sticky 3D Canvas Viewport in Background */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          zIndex: 1,
        }}
      >
        <OrbitToFieldCanvas
          scrollProgress={scrollProgress}
          activeField={activeField}
          graceTrends={graceTrendsData}
          onsetComparison={advisoryData?.comparison}
          isAutoPlaying={isAutoPlaying}
          onFpsUpdate={setFps}
        />
      </div>

      {/* Floating Header Controls: Play Story & Progress Dots */}
      <div
        style={{
          position: 'fixed',
          top: 74,
          right: 28,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={isAutoPlaying ? stopAutoPlay : startAutoPlay}
          style={{
            background: isAutoPlaying ? 'rgba(239, 68, 68, 0.25)' : 'rgba(200, 241, 105, 0.2)',
            border: isAutoPlaying ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid var(--lime, #C8F169)',
            color: isAutoPlaying ? '#fca5a5' : 'var(--lime, #C8F169)',
            borderRadius: 999,
            padding: '6px 14px',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>{isAutoPlaying ? '⏹' : '▶'}</span>
          <span>{isAutoPlaying ? (isBn ? 'গল্প থামান (Esc)' : 'Stop story (Esc)') : (isBn ? 'গল্প শুনুন (Play)' : 'Play story')}</span>
        </button>

        {/* Scene Dots 01..07 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            background: 'rgba(10, 18, 14, 0.7)',
            padding: '8px 6px',
            borderRadius: 20,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {SCENES.map((_, i) => {
            const isActive = currentSceneIndex === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => scrollToScene(i)}
                aria-label={`Jump to scene ${i + 1}`}
                style={{
                  width: 8,
                  height: isActive ? 18 : 8,
                  borderRadius: 4,
                  background: isActive ? 'var(--lime, #C8F169)' : 'rgba(255, 255, 255, 0.3)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 0 8px var(--lime, #C8F169)' : 'none',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* 7 Absolute Scroll Triggers & Foreground Glass Cards */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'none',
        }}
      >
        {SCENES.map((scene, idx) => {
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
              }}
            >
              {/* Left Floating Glass Card */}
              <div
                className="story-glass-card"
                style={{
                  width: 'min(40%, 450px)',
                  padding: 'clamp(16px, 2.4vw, 28px)',
                  borderRadius: 20,
                  background: 'rgba(14, 24, 20, 0.78)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#EAF2EC',
                  pointerEvents: 'auto',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65)',
                }}
              >
                {/* Index Tag */}
                <div
                  style={{
                    fontFamily: 'var(--display, "Space Grotesk", sans-serif)',
                    fontSize: 12,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--lime, #C8F169)',
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  {scene.idx}
                </div>

                {/* English Headline */}
                <h2
                  style={{
                    fontFamily: 'var(--display, "Space Grotesk", sans-serif)',
                    fontWeight: 700,
                    fontSize: 'clamp(20px, 2.6vw, 36px)',
                    lineHeight: 1.18,
                    margin: '0 0 6px',
                    color: '#ffffff',
                    textWrap: 'balance',
                  }}
                >
                  {scene.titleEn}
                </h2>

                {/* Bangla Subtitle Line if in BN mode */}
                {isBn && (
                  <div
                    style={{
                      fontSize: 14,
                      color: '#a3b8aa',
                      marginBottom: 8,
                      lineHeight: 1.4,
                    }}
                  >
                    {scene.titleBn}
                  </div>
                )}

                {/* English Body Text */}
                <p
                  style={{
                    margin: 0,
                    fontSize: 'clamp(12px, 1.25vw, 15.5px)',
                    color: '#cfe0d4',
                    lineHeight: 1.5,
                  }}
                >
                  {scene.descEn}
                </p>

                {/* Numbers / Tags Strip */}
                {scene.nums && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginTop: 14,
                    }}
                  >
                    {scene.nums.map((n, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 12.5,
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: 99,
                          padding: '4px 10px',
                          display: 'flex',
                          gap: 6,
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ color: '#9fb3a5' }}>{n.label}</span>
                        <b style={{ color: n.color }}>{n.val}</b>
                      </span>
                    ))}
                  </div>
                )}

                {/* Navigation Chip */}
                {scene.chips && (
                  <button
                    type="button"
                    onClick={() => onNavigate(scene.chips.dest)}
                    style={{
                      marginTop: 14,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--lime, #C8F169)',
                      background: 'rgba(200, 241, 105, 0.1)',
                      border: '1px solid rgba(200, 241, 105, 0.35)',
                      borderRadius: 99,
                      padding: '4px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{scene.chips.label}</span>
                  </button>
                )}

                {/* Primary CTA button on Scene 7 */}
                {scene.cta && (
                  <button
                    type="button"
                    onClick={() => onNavigate(scene.cta.dest)}
                    style={{
                      marginTop: 18,
                      background: 'var(--accent, #C8F169)',
                      color: 'var(--accent-ink, #10200a)',
                      fontFamily: 'var(--display, "Space Grotesk", sans-serif)',
                      fontWeight: 700,
                      border: 'none',
                      borderRadius: 14,
                      padding: '13px 24px',
                      fontSize: 'clamp(13px, 1.3vw, 16px)',
                      cursor: 'pointer',
                      boxShadow: '0 0 30px rgba(200, 241, 105, 0.45)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      justifyContent: 'center',
                    }}
                  >
                    <span>{scene.cta.label}</span>
                  </button>
                )}
              </div>

              {/* Scene 7: Right-hand "Your Field" Telemetry & Map Card (Matches Storyboard Frame 7) */}
              {idx === 6 && (
                <div
                  className="story-field-card"
                  style={{
                    position: 'absolute',
                    right: '5%',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 'min(42%, 480px)',
                    background: 'rgba(14, 24, 20, 0.88)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    borderRadius: 24,
                    padding: '22px 24px',
                    color: '#EAF2EC',
                    pointerEvents: 'auto',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 30px rgba(200, 241, 105, 0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  {/* Mini Map View with Grid & Pin */}
                  <div
                    style={{
                      height: 160,
                      borderRadius: 16,
                      background: 'radial-gradient(circle at 50% 50%, #153322 0%, #0d1e15 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <svg viewBox="0 0 400 160" style={{ width: '100%', height: '100%' }}>
                      <defs>
                        <pattern id="field-grid-p7" width="28" height="28" patternUnits="userSpaceOnUse">
                          <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(200, 241, 105, 0.15)" strokeWidth="1" />
                        </pattern>
                      </defs>
                      <rect width="400" height="160" fill="url(#field-grid-p7)" />
                      {/* Stylized river bend */}
                      <path d="M 20 140 Q 120 40 240 100 T 380 30" fill="none" stroke="#38D9F5" strokeWidth="8" strokeOpacity="0.35" strokeLinecap="round" />
                      {/* Active field parcel polygon */}
                      <polygon points="170,45 230,40 245,115 185,120" fill="rgba(200, 241, 105, 0.22)" stroke="#C8F169" strokeWidth="2" strokeDasharray="3 3" />
                      {/* Glowing Field Pin */}
                      <g transform="translate(205 75)">
                        <circle r="22" fill="#C8F169" opacity="0.2" />
                        <circle r="12" fill="#C8F169" opacity="0.4" />
                        <path d="M0,0 c-8,-12 -8,-22 0,-26 c8,4 8,14 0,26z" fill="#C8F169" />
                        <circle cy="-17" r="4" fill="#0c1a12" />
                      </g>
                    </svg>
                    <div style={{ position: 'absolute', bottom: 10, left: 14, fontSize: 11, fontWeight: 700, color: 'var(--lime, #C8F169)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {isBn ? 'স্যাটেলাইট পার্সেল পর্যবেক্ষণ' : 'Satellite Parcel Telemetry'}
                    </div>
                  </div>

                  {/* Header Title */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontFamily: 'var(--display, "Space Grotesk", sans-serif)', fontSize: 20, fontWeight: 700, color: '#ffffff' }}>
                      {isBn ? 'আপনার জমি' : 'Your field'}
                    </div>
                    <span style={{ fontSize: 11, color: '#9fb3a5', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 99 }}>
                      {activeField?.district || 'Chapainawabganj'}
                    </span>
                  </div>

                  {/* 4 Detail Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <span style={{ fontSize: 13, color: '#9fb3a5', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>📍</span>
                        <span>{isBn ? 'অবস্থান' : 'Location'}</span>
                      </span>
                      <b style={{ fontSize: 13, color: '#ffffff' }}>{activeField?.name || (isBn ? 'রহিমের খামার' : "Rahim's Farm")}</b>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <span style={{ fontSize: 13, color: '#9fb3a5', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>🌾</span>
                        <span>{isBn ? 'বর্তমান ফসল' : 'What you grow now'}</span>
                      </span>
                      <b style={{ fontSize: 13, color: '#ffffff' }}>{fieldCurrentCrop}</b>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <span style={{ fontSize: 13, color: '#9fb3a5', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>💧</span>
                        <span>{isBn ? 'পানির সুবিধা' : 'Water access'}</span>
                      </span>
                      <b style={{ fontSize: 13, color: '#38D9F5' }}>{fieldWater}</b>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <span style={{ fontSize: 13, color: '#9fb3a5', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>📐</span>
                        <span>{isBn ? 'জমির পরিমাপ' : 'Area'}</span>
                      </span>
                      <b style={{ fontSize: 13, color: 'var(--lime, #C8F169)' }}>{fieldAreaBigha} {isBn ? 'বিঘা' : 'bigha'}</b>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OrbitToFieldStory;