import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { DEMO_ANNOTATIONS } from './annotations.js';
import './DemoOverlay.css';

export function DemoOverlay({
  activeNav,
  plannerSubTab = 'recommendations',
  lang = 'en',
  onClose,
  isOpen = false
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [holeRect, setHoleRect] = useState(null);
  const [viewport, setViewport] = useState({ width: 1920, height: 1080 });
  const rafRef = useRef(null);

  // Map route + planner subtab to annotation catalog key
  const currentKey = useMemo(() => {
    if (activeNav === 'dashboard') return 'overview';
    if (activeNav === 'field') return 'myfields';
    if (activeNav === 'farm_planning') {
      if (plannerSubTab === 'recovery' || plannerSubTab === 'replan') return 'planner_replan';
      if (plannerSubTab === 'stress_test' || plannerSubTab === 'stress') return 'planner_stress';
      if (plannerSubTab === 'lab_comparison' || plannerSubTab === 'comparison') return 'planner_compare';
      return 'planner_milp';
    }
    if (activeNav === 'weather') return 'climate';
    if (activeNav === 'water_irrigation') return 'water';
    if (activeNav === 'harvest_profit') return 'market';
    if (activeNav === 'data_evidence') return 'evidence';
    return 'overview';
  }, [activeNav, plannerSubTab]);

  // Current list of annotations for the view
  const rawList = useMemo(() => {
    const list = [...(DEMO_ANNOTATIONS[currentKey] || [])];
    if (DEMO_ANNOTATIONS.floating_chat) {
      list.push(...DEMO_ANNOTATIONS.floating_chat);
    }
    return list;
  }, [currentKey]);

  // Filter to steps whose elements currently exist in DOM with non-zero dimensions
  const [validSteps, setValidSteps] = useState([]);

  const refreshValidSteps = useCallback(() => {
    if (!isOpen || typeof window === 'undefined') {
      setValidSteps([]);
      return;
    }
    const found = rawList.filter(ann => {
      const el = document.querySelector(ann.selector);
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 2 && rect.height > 2;
    });
    setValidSteps(found);
  }, [isOpen, rawList]);

  // Reset active index when view changes
  useEffect(() => {
    setActiveIndex(0);
    refreshValidSteps();
  }, [currentKey, refreshValidSteps]);

  // Check valid steps on open or when rawList changes
  useEffect(() => {
    refreshValidSteps();
  }, [refreshValidSteps]);

  // Safe active step
  const activeStep = useMemo(() => {
    if (!validSteps.length) return null;
    const idx = Math.max(0, Math.min(validSteps.length - 1, activeIndex));
    return validSteps[idx] || null;
  }, [validSteps, activeIndex]);

  // Smooth scroll active element into center of screen
  useEffect(() => {
    if (!isOpen || !activeStep) return;
    const el = document.querySelector(activeStep.selector);
    if (!el) return;

    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    el.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'center',
      inline: 'nearest'
    });
  }, [isOpen, activeStep]);

  // Continuously track target bounding box with rAF / scroll / resize
  const updateHoleRect = useCallback(() => {
    if (!isOpen || !activeStep || typeof window === 'undefined') {
      setHoleRect(null);
      return;
    }
    const el = document.querySelector(activeStep.selector);
    if (!el) {
      setHoleRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const pad = 10;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setViewport({ width: vw, height: vh });

    setHoleRect({
      left: Math.max(0, rect.left - pad),
      top: Math.max(0, rect.top - pad),
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
      right: Math.min(vw, rect.right + pad),
      bottom: Math.min(vh, rect.bottom + pad),
    });
  }, [isOpen, activeStep]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onUpdate = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateHoleRect);
    };

    window.addEventListener('resize', onUpdate);
    window.addEventListener('scroll', onUpdate, true);
    onUpdate();

    // Re-check periodically for any dynamic layout shifts
    const interval = setInterval(onUpdate, 150);

    return () => {
      window.removeEventListener('resize', onUpdate);
      window.removeEventListener('scroll', onUpdate, true);
      cancelAnimationFrame(rafRef.current);
      clearInterval(interval);
    };
  }, [isOpen, updateHoleRect]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        setActiveIndex(idx => (idx + 1 < validSteps.length ? idx + 1 : idx));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveIndex(idx => (idx > 0 ? idx - 1 : idx));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, validSteps.length, onClose]);

  if (!isOpen || !activeStep || !holeRect) return null;

  const totalSteps = validSteps.length;
  const currentStepNum = activeIndex + 1;

  return (
    <div
      className="demo-spotlight-overlay"
      data-testid="demo-mode-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Demo Spotlight Tour"
    >
      {/* 4 Fixed Backdrop Panels surrounding the active hole (DS1) */}
      {/* 1. Top Panel */}
      <div
        className="demo-spotlight-panel"
        data-testid="spotlight-panel-top"
        style={{
          top: 0,
          left: 0,
          width: '100vw',
          height: `${Math.max(0, holeRect.top)}px`,
        }}
        onClick={(e) => { e.stopPropagation(); }}
      />

      {/* 2. Bottom Panel */}
      <div
        className="demo-spotlight-panel"
        data-testid="spotlight-panel-bottom"
        style={{
          top: `${holeRect.bottom}px`,
          left: 0,
          width: '100vw',
          height: `${Math.max(0, viewport.height - holeRect.bottom)}px`,
        }}
        onClick={(e) => { e.stopPropagation(); }}
      />

      {/* 3. Left Panel */}
      <div
        className="demo-spotlight-panel"
        data-testid="spotlight-panel-left"
        style={{
          top: `${holeRect.top}px`,
          left: 0,
          width: `${Math.max(0, holeRect.left)}px`,
          height: `${holeRect.height}px`,
        }}
        onClick={(e) => { e.stopPropagation(); }}
      />

      {/* 4. Right Panel */}
      <div
        className="demo-spotlight-panel"
        data-testid="spotlight-panel-right"
        style={{
          top: `${holeRect.top}px`,
          left: `${holeRect.right}px`,
          width: `${Math.max(0, viewport.width - holeRect.right)}px`,
          height: `${holeRect.height}px`,
        }}
        onClick={(e) => { e.stopPropagation(); }}
      />

      {/* 2px Lime Ring with Soft Outer Glow around the active hole (DS1) */}
      <div
        className="demo-spotlight-ring"
        data-testid="spotlight-ring"
        style={{
          top: `${holeRect.top}px`,
          left: `${holeRect.left}px`,
          width: `${holeRect.width}px`,
          height: `${holeRect.height}px`,
        }}
      />

      {/* Card Placeholder (Refined in DS2) */}
      <div
        className="demo-spotlight-card"
        data-testid="demo-spotlight-card"
        style={{
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.55)' }}>
            {lang === 'bn' ? `ধাপ ${currentStepNum} / ${totalSteps}` : `Step ${currentStepNum} of ${totalSteps}`}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: 18,
              cursor: 'pointer',
              lineHeight: 1,
              padding: 0,
            }}
            aria-label="Close Tour"
          >
            ×
          </button>
        </div>
        <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>
          {activeStep.title?.[lang] || activeStep.title?.en}
        </h4>
        <p style={{ margin: '0 0 14px', fontSize: 13.5, color: '#9AA5A0', lineHeight: 1.45 }}>
          {activeStep.desc?.[lang] || activeStep.desc?.en}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setActiveIndex(idx => Math.max(0, idx - 1))}
            disabled={activeIndex === 0}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 8,
              color: activeIndex === 0 ? 'rgba(255,255,255,0.25)' : '#E8ECE9',
              padding: '6px 12px',
              fontSize: 12,
              cursor: activeIndex === 0 ? 'default' : 'pointer',
            }}
          >
            {lang === 'bn' ? 'পেছনে' : 'Back'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (activeIndex + 1 < totalSteps) {
                setActiveIndex(idx => idx + 1);
              } else {
                onClose?.();
              }
            }}
            style={{
              background: '#C8F169',
              border: 'none',
              borderRadius: 8,
              color: '#08140B',
              fontWeight: 700,
              padding: '6px 14px',
              fontSize: 12,
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(200, 241, 105, 0.35)',
            }}
          >
            {activeIndex + 1 === totalSteps ? (lang === 'bn' ? 'সমাপ্ত' : 'Finish') : (lang === 'bn' ? 'পরবর্তী' : 'Next')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DemoOverlay;
