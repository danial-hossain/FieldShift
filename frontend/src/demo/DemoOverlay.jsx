import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { computePosition, flip, shift, offset, arrow } from '@floating-ui/dom';
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
  const [autoPlay, setAutoPlay] = useState(false);
  const rafRef = useRef(null);
  const cardRef = useRef(null);
  const arrowRef = useRef(null);

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
      if (rect.width <= 2 || rect.height <= 2) return false;
      try {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
      } catch {}
      return true;
    });
    setValidSteps(found);
  }, [isOpen, rawList]);

  // Reset active index when view changes
  useEffect(() => {
    setActiveIndex(0);
    setAutoPlay(false);
    refreshValidSteps();
    const t1 = setTimeout(refreshValidSteps, 150);
    const t2 = setTimeout(refreshValidSteps, 400);
    const t3 = setTimeout(refreshValidSteps, 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [currentKey, refreshValidSteps]);

  // Check valid steps on open or when rawList changes
  useEffect(() => {
    refreshValidSteps();
    const t1 = setTimeout(refreshValidSteps, 200);
    const t2 = setTimeout(refreshValidSteps, 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isOpen, refreshValidSteps]);

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

    const interval = setInterval(onUpdate, 150);

    return () => {
      window.removeEventListener('resize', onUpdate);
      window.removeEventListener('scroll', onUpdate, true);
      cancelAnimationFrame(rafRef.current);
      clearInterval(interval);
    };
  }, [isOpen, updateHoleRect]);

  // Floating UI Card Positioning (DS2)
  const updateCardPosition = useCallback(() => {
    if (!isOpen || !holeRect || !cardRef.current) return;

    const virtualEl = {
      getBoundingClientRect() {
        return {
          x: holeRect.left,
          y: holeRect.top,
          top: holeRect.top,
          left: holeRect.left,
          bottom: holeRect.bottom,
          right: holeRect.right,
          width: holeRect.width,
          height: holeRect.height,
        };
      }
    };

    const middleware = [
      offset(16),
      flip({ fallbackPlacements: ['left', 'bottom', 'top'] }),
      shift({ padding: 16, mainAxis: true, crossAxis: true }),
    ];

    if (arrowRef.current) {
      middleware.push(arrow({ element: arrowRef.current }));
    }

    computePosition(virtualEl, cardRef.current, {
      placement: 'right',
      middleware,
    }).then(({ x, y, placement, middlewareData }) => {
      if (!cardRef.current) return;
      const cardW = cardRef.current.offsetWidth || 320;
      const cardH = cardRef.current.offsetHeight || 260;
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;

      const clampedX = Math.max(16, Math.min(vw - cardW - 16, Math.round(x)));
      const clampedY = Math.max(16, Math.min(vh - cardH - 16, Math.round(y)));

      cardRef.current.style.left = `${clampedX}px`;
      cardRef.current.style.top = `${clampedY}px`;

      if (middlewareData.arrow && arrowRef.current) {
        const { x: arrowX, y: arrowY } = middlewareData.arrow;
        const staticSide = {
          top: 'bottom',
          right: 'left',
          bottom: 'top',
          left: 'right',
        }[placement.split('-')[0]];

        Object.assign(arrowRef.current.style, {
          left: arrowX != null ? `${arrowX}px` : '',
          top: arrowY != null ? `${arrowY}px` : '',
          right: '',
          bottom: '',
          [staticSide]: '-5px',
        });
      }
    }).catch(() => {});
  }, [isOpen, holeRect]);

  useEffect(() => {
    updateCardPosition();
  }, [updateCardPosition, activeIndex]);

  // ResizeObserver for data load & container size changes (DS4)
  useEffect(() => {
    if (!isOpen || !activeStep) return undefined;
    const el = document.querySelector(activeStep.selector);
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    const ro = new ResizeObserver(() => {
      updateHoleRect();
      updateCardPosition();
    });
    ro.observe(el);
    if (document.body) ro.observe(document.body);

    return () => ro.disconnect();
  }, [isOpen, activeStep, updateHoleRect, updateCardPosition]);

  // Auto-play every 5 seconds (DS2)
  useEffect(() => {
    if (!autoPlay || !isOpen) return undefined;
    const timer = setInterval(() => {
      setActiveIndex(idx => {
        if (idx + 1 < validSteps.length) {
          return idx + 1;
        }
        setAutoPlay(false);
        return idx;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [autoPlay, isOpen, validSteps.length]);

  // Stop auto mode on any keydown or pointer click outside toggle
  useEffect(() => {
    if (!autoPlay) return undefined;
    const stop = (e) => {
      if (e.target && e.target.closest && e.target.closest('[data-testid="demo-auto-toggle"]')) {
        return;
      }
      setAutoPlay(false);
    };
    window.addEventListener('keydown', stop);
    window.addEventListener('pointerdown', stop, true);
    return () => {
      window.removeEventListener('keydown', stop);
      window.removeEventListener('pointerdown', stop, true);
    };
  }, [autoPlay]);

  // Keyboard navigation & Focus trapping (DS2)
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
      } else if (e.key === 'Tab') {
        // Focus trap inside tooltip card
        const focusables = cardRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables && focusables.length > 0) {
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, validSteps.length, onClose]);

  if (!isOpen || !activeStep || !holeRect) return null;

  const totalSteps = validSteps.length;
  const currentStepNum = activeIndex + 1;
  const chipText = activeStep.chip || null;

  return (
    <div
      className="demo-spotlight-overlay"
      data-testid="demo-mode-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Demo Spotlight Tour"
    >
      {/* 4 Fixed Backdrop Panels surrounding the active hole (DS1) */}
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

      {/* Tooltip Card (DS2) */}
      <div
        ref={cardRef}
        className="demo-spotlight-card"
        data-testid="demo-spotlight-card"
        role="region"
        aria-live="polite"
      >
        <div ref={arrowRef} className="demo-card-arrow" />

        {/* Header row: Step count, Chip, Auto toggle, Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255, 255, 255, 0.65)' }}>
              {lang === 'bn' ? `ধাপ ${currentStepNum} / ${totalSteps}` : `Step ${currentStepNum} of ${totalSteps}`}
            </span>
            {chipText && (
              <span className="demo-card-chip" data-testid="demo-card-chip">
                {chipText}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              data-testid="demo-auto-toggle"
              onClick={() => setAutoPlay(prev => !prev)}
              style={{
                background: autoPlay ? 'rgba(200, 241, 105, 0.20)' : 'rgba(255, 255, 255, 0.08)',
                border: autoPlay ? '1px solid #C8F169' : '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 999,
                color: autoPlay ? '#C8F169' : 'rgba(255, 255, 255, 0.70)',
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              title={lang === 'bn' ? 'স্বয়ংক্রিয় প্লে (প্রতি ৫ সেকেন্ড)' : 'Auto-advance every 5 seconds'}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: autoPlay ? '#C8F169' : 'rgba(255,255,255,0.4)',
                  boxShadow: autoPlay ? '0 0 6px #C8F169' : 'none',
                }}
              />
              Auto
            </button>

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
              aria-label={lang === 'bn' ? 'ট্যুর বন্ধ করুন' : 'Close Tour'}
            >
              ×
            </button>
          </div>
        </div>

        {/* Title */}
        <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>
          {activeStep.title?.[lang] || activeStep.title?.en}
        </h4>

        {/* 1-2 Short Lines of Description */}
        <p style={{ margin: '0 0 12px', fontSize: 14, color: '#B2C2B8', lineHeight: 1.45 }}>
          {activeStep.desc?.[lang] || activeStep.desc?.en}
        </p>

        {/* Progress Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div className="demo-progress-dots" role="tablist" aria-label="Progress">
            {validSteps.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`demo-dot ${i === activeIndex ? 'active' : ''}`}
                onClick={() => setActiveIndex(i)}
                aria-label={`Go to step ${i + 1}`}
                role="tab"
                aria-selected={i === activeIndex}
              />
            ))}
          </div>
        </div>

        {/* Actions row: Skip tour, Back, Next */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.55)',
              fontSize: 12,
              cursor: 'pointer',
              padding: '6px 4px',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
            }}
          >
            {lang === 'bn' ? 'ট্যুর শেষ করুন' : 'Skip tour'}
          </button>

          <div style={{ display: 'flex', gap: 6 }}>
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
              data-testid="demo-next-btn"
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
                boxShadow: '0 0 16px rgba(200, 241, 105, 0.40)',
              }}
            >
              {activeIndex + 1 === totalSteps ? (lang === 'bn' ? 'সমাপ্ত' : 'Finish') : (lang === 'bn' ? 'পরবর্তী' : 'Next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DemoOverlay;
