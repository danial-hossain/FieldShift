import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DEMO_ANNOTATIONS } from './annotations.js';

export function DemoOverlay({
  activeNav,
  plannerSubTab = 'recommendations',
  lang = 'en',
  onClose,
  isOpen = false
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [layoutTick, setLayoutTick] = useState(0);
  const overlayRef = useRef(null);

  // Determine which annotation set corresponds to the current route and planner sub-tab
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

  const annotationsList = useMemo(() => {
    const list = [...(DEMO_ANNOTATIONS[currentKey] || [])];
    // Always append floating chat button if present
    if (DEMO_ANNOTATIONS.floating_chat) {
      list.push(...DEMO_ANNOTATIONS.floating_chat);
    }
    return list;
  }, [currentKey]);

  // Reset active index when view changes
  useEffect(() => {
    setActiveIndex(0);
  }, [currentKey]);

  // Re-measure positions on scroll, resize, or tab change
  useEffect(() => {
    if (!isOpen) return;
    const trigger = () => setLayoutTick(t => t + 1);
    window.addEventListener('resize', trigger);
    window.addEventListener('scroll', trigger, true);

    const timer = setTimeout(trigger, 250);
    return () => {
      window.removeEventListener('resize', trigger);
      window.removeEventListener('scroll', trigger, true);
      clearTimeout(timer);
    };
  }, [isOpen, currentKey, plannerSubTab]);

  // Keyboard navigation: Left, Right, Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveIndex(idx => (idx + 1) % Math.max(1, annotationsList.length));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveIndex(idx => (idx - 1 + annotationsList.length) % Math.max(1, annotationsList.length));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, annotationsList.length, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (!isOpen || !annotationsList[activeIndex]) return;
    const item = annotationsList[activeIndex];
    const el = document.querySelector(item.selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      const inView = rect.top >= 60 && rect.bottom <= (window.innerHeight - 80);
      if (!inView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeIndex, isOpen, annotationsList]);

  // Calculate layout coordinates for each rectangle, bubble, and arrow
  const renderedItems = useMemo(() => {
    if (!isOpen || typeof window === 'undefined') return [];
    void layoutTick;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const placedBubbles = [];

    const bubbleW = 210;
    const bubbleH = 100;
    const pad = 6;

    return annotationsList.map((ann, idx) => {
      const el = document.querySelector(ann.selector);
      if (!el) return null;

      const rect = el.getBoundingClientRect();
      // Skip if completely collapsed / invisible
      if (rect.width <= 2 && rect.height <= 2) return null;

      const target = {
        left: Math.max(0, rect.left - pad),
        top: Math.max(0, rect.top - pad),
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
        right: Math.min(viewportW, rect.right + pad),
        bottom: Math.min(viewportH, rect.bottom + pad),
        cx: rect.left + rect.width / 2,
        cy: rect.top + rect.height / 2
      };

      // Candidates for placing the bubble in 8 directions
      const rawCandidates = [
        // 1. Right
        { x: target.right + 20, y: target.cy - bubbleH / 2, side: 'right' },
        // 2. Left
        { x: target.left - bubbleW - 20, y: target.cy - bubbleH / 2, side: 'left' },
        // 3. Bottom
        { x: target.cx - bubbleW / 2, y: target.bottom + 20, side: 'bottom' },
        // 4. Top
        { x: target.cx - bubbleW / 2, y: target.top - bubbleH - 20, side: 'top' },
        // 5. Diagonal Top-Right
        { x: target.right + 20, y: target.top - bubbleH / 2, side: 'top-right' },
        // 6. Diagonal Bottom-Right
        { x: target.right + 20, y: target.bottom - bubbleH / 2, side: 'bottom-right' },
        // 7. Diagonal Top-Left
        { x: target.left - bubbleW - 20, y: target.top - bubbleH / 2, side: 'top-left' },
        // 8. Diagonal Bottom-Left
        { x: target.left - bubbleW - 20, y: target.bottom - bubbleH / 2, side: 'bottom-left' },
      ];

      // Pre-clamp candidates to screen
      const minX = 16;
      const maxX = Math.max(16, viewportW - bubbleW - 16);
      const minY = 64;
      const maxY = Math.max(64, viewportH - bubbleH - 75);

      const candidates = rawCandidates.map(c => ({
        x: Math.max(minX, Math.min(maxX, c.x)),
        y: Math.max(minY, Math.min(maxY, c.y)),
        rawDist: Math.hypot(c.x - target.cx, c.y - target.cy),
        side: c.side
      }));

      // Helper to check overlap between two boxes with margin
      const boxesIntersect = (b1, b2, margin = 8) => {
        return !(
          b1.x + bubbleW + margin <= b2.x ||
          b1.x >= b2.x + bubbleW + margin ||
          b1.y + bubbleH + margin <= b2.y ||
          b1.y >= b2.y + bubbleH + margin
        );
      };

      // Score candidates
      let bestCandidate = null;
      let minPenalty = Infinity;

      for (const cand of candidates) {
        let penalty = cand.rawDist * 0.1;

        // Overlap with current target
        const overlapTarget = !(cand.x + bubbleW < target.left || cand.x > target.right || cand.y + bubbleH < target.top || cand.y > target.bottom);
        if (overlapTarget) penalty += 20000;

        // Overlap with previously placed bubbles
        for (const pb of placedBubbles) {
          if (boxesIntersect(cand, pb)) {
            penalty += 100000;
          }
        }

        if (penalty < minPenalty) {
          minPenalty = penalty;
          bestCandidate = cand;
        }
      }

      let bubbleX = bestCandidate ? bestCandidate.x : minX;
      let bubbleY = bestCandidate ? bestCandidate.y : minY;

      // Iterative collision resolution to guarantee ZERO overlap
      let tries = 0;
      let hasCollision = true;
      while (hasCollision && tries < 30) {
        hasCollision = false;
        for (const pb of placedBubbles) {
          if (boxesIntersect({ x: bubbleX, y: bubbleY }, pb)) {
            hasCollision = true;
            // Shift vertically or horizontally
            if (pb.y - bubbleH - 16 >= minY) {
              bubbleY = pb.y - bubbleH - 16;
            } else if (pb.y + bubbleH + 16 <= maxY) {
              bubbleY = pb.y + bubbleH + 16;
            } else if (pb.x - bubbleW - 24 >= minX) {
              bubbleX = pb.x - bubbleW - 24;
            } else if (pb.x + bubbleW + 24 <= maxX) {
              bubbleX = pb.x + bubbleW + 24;
            } else {
              bubbleY = Math.max(minY, Math.min(maxY, pb.y - 40));
              bubbleX = Math.max(minX, Math.min(maxX, pb.x - 40));
            }
            break;
          }
        }
        tries++;
      }

      placedBubbles.push({ x: bubbleX, y: bubbleY });

      // Arrow start from bubble center / edge to target border edge
      const bCenter = { x: bubbleX + bubbleW / 2, y: bubbleY + bubbleH / 2 };
      let arrowStart = { x: bubbleX + bubbleW / 2, y: bubbleY + bubbleH / 2 };
      let arrowEnd = { x: target.cx, y: target.cy };

      if (bCenter.x > target.right) {
        arrowStart = { x: bubbleX, y: bubbleY + bubbleH / 2 };
        arrowEnd = { x: target.right, y: target.cy };
      } else if (bCenter.x < target.left) {
        arrowStart = { x: bubbleX + bubbleW, y: bubbleY + bubbleH / 2 };
        arrowEnd = { x: target.left, y: target.cy };
      } else if (bCenter.y > target.bottom) {
        arrowStart = { x: bubbleX + bubbleW / 2, y: bubbleY };
        arrowEnd = { x: target.cx, y: target.bottom };
      } else {
        arrowStart = { x: bubbleX + bubbleW / 2, y: bubbleY + bubbleH };
        arrowEnd = { x: target.cx, y: target.top };
      }

      // Curved bezier path
      const dx = arrowEnd.x - arrowStart.x;
      const dy = arrowEnd.y - arrowStart.y;
      const cp1x = arrowStart.x + dx * 0.4;
      const cp1y = arrowStart.y;
      const cp2x = arrowStart.x + dx * 0.6;
      const cp2y = arrowEnd.y;
      const pathD = `M ${arrowStart.x} ${arrowStart.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${arrowEnd.x} ${arrowEnd.y}`;

      return {
        ann,
        idx,
        target,
        bubble: { x: bubbleX, y: bubbleY, width: bubbleW, height: bubbleH },
        pathD,
        isActive: idx === activeIndex
      };
    }).filter(Boolean);
  }, [isOpen, layoutTick, annotationsList, activeIndex]);

  if (!isOpen) return null;

  const totalCount = renderedItems.length;
  const currentItem = renderedItems[activeIndex] || renderedItems[0];

  return (
    <div
      ref={overlayRef}
      className="demo-mode-overlay"
      data-testid="demo-mode-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        pointerEvents: 'none',
        background: 'rgba(0, 0, 0, 0.45)',
        transition: 'opacity 0.2s ease',
        overflow: 'hidden'
      }}
      onClick={(e) => {
        // If clicking dark backdrop directly, don't close immediately unless wanted
        if (e.target === overlayRef.current) {
          // keep open or allow inspecting
        }
      }}
    >
      {/* SVG Canvas for Connecting Curved Arrows */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 9999
        }}
      >
        <defs>
          <marker
            id="demo-arrowhead-active"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#7ee787" />
          </marker>
          <marker
            id="demo-arrowhead"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(82, 214, 122, 0.6)" />
          </marker>
        </defs>

        {renderedItems.map(item => (
          <path
            key={`arrow-${item.ann.id}`}
            d={item.pathD}
            fill="none"
            stroke={item.isActive ? '#7ee787' : 'rgba(82, 214, 122, 0.45)'}
            strokeWidth={item.isActive ? '2.5' : '1.8'}
            strokeDasharray={item.isActive ? 'none' : '4 3'}
            markerEnd={item.isActive ? 'url(#demo-arrowhead-active)' : 'url(#demo-arrowhead)'}
            style={{ transition: 'all 0.2s ease' }}
          />
        ))}
      </svg>

      {/* Glowing Rounded Target Rectangles */}
      {renderedItems.map(item => (
        <div
          key={`rect-${item.ann.id}`}
          className={`demo-target-box ${item.isActive ? 'active' : ''}`}
          onClick={() => setActiveIndex(item.idx)}
          style={{
            position: 'absolute',
            left: item.target.left,
            top: item.target.top,
            width: item.target.width,
            height: item.target.height,
            border: item.isActive ? '2px solid #52d67a' : '2px solid rgba(82, 214, 122, 0.70)',
            borderRadius: 12,
            boxShadow: item.isActive
              ? '0 0 24px rgba(82, 214, 122, 0.85), inset 0 0 14px rgba(82, 214, 122, 0.35)'
              : '0 0 16px rgba(82, 214, 122, 0.45), inset 0 0 8px rgba(82, 214, 122, 0.15)',
            pointerEvents: 'auto',
            cursor: 'pointer',
            zIndex: item.isActive ? 10001 : 10000,
            transition: 'all 0.2s ease'
          }}
        />
      ))}

      {/* Glass Callout Bubbles */}
      {renderedItems.map(item => (
        <div
          key={`bubble-${item.ann.id}`}
          className={`demo-bubble-card ${item.isActive ? 'active' : ''}`}
          onClick={() => setActiveIndex(item.idx)}
          style={{
            position: 'absolute',
            left: item.bubble.x,
            top: item.bubble.y,
            width: item.bubble.width,
            maxWidth: 220,
            padding: '10px 14px',
            background: item.isActive ? 'rgba(8, 20, 14, 0.94)' : 'rgba(8, 16, 12, 0.88)',
            border: item.isActive ? '1.5px solid #52d67a' : '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 14,
            boxShadow: item.isActive
              ? '0 8px 30px rgba(0, 0, 0, 0.65), 0 0 18px rgba(82, 214, 122, 0.50)'
              : '0 6px 20px rgba(0, 0, 0, 0.45)',
            color: 'var(--text, #e6edf3)',
            zIndex: item.isActive ? 10002 : 10001,
            pointerEvents: 'auto',
            cursor: 'pointer',
            transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
            transform: item.isActive ? 'scale(1.04)' : 'scale(1.0)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: item.isActive ? '#a8f5c0' : 'rgba(82, 214, 122, 0.8)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px'
              }}
            >
              #{item.idx + 1}
            </span>
            {item.isActive && (
              <span
                style={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#52d67a',
                  boxShadow: '0 0 6px #52d67a'
                }}
              />
            )}
          </div>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.25,
              marginBottom: 4
            }}
          >
            {item.ann.title[lang] || item.ann.title.en}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(235, 240, 245, 0.85)',
              lineHeight: 1.35
            }}
          >
            {item.ann.desc[lang] || item.ann.desc.en}
          </div>
        </div>
      ))}

      {/* Bottom Floating Control Bar */}
      <div
        className="demo-control-bar"
        style={{
          position: 'fixed',
          bottom: 22,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10005,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '6px 16px',
          background: 'rgba(8, 16, 12, 0.92)',
          border: '1px solid rgba(82, 214, 122, 0.50)',
          borderRadius: 9999,
          boxShadow: '0 10px 32px rgba(0, 0, 0, 0.65), 0 0 20px rgba(82, 214, 122, 0.30)',
          color: '#ffffff',
          pointerEvents: 'auto'
        }}
      >
        {/* Prev Button */}
        <button
          type="button"
          onClick={() => setActiveIndex(idx => (idx - 1 + totalCount) % Math.max(1, totalCount))}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--leaf-neon, #7ee787)',
            fontSize: 16,
            fontWeight: 800,
            cursor: 'pointer',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
          title={lang === 'bn' ? 'আগেরটি (Left arrow)' : 'Previous (Left arrow)'}
          aria-label="Previous annotation"
        >
          ‹ <span style={{ fontSize: 12 }}>{lang === 'bn' ? 'আগের' : 'Prev'}</span>
        </button>

        {/* Counter */}
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: '#a8f5c0',
            letterSpacing: '0.5px',
            padding: '0 4px',
            minWidth: 46,
            textAlign: 'center'
          }}
        >
          {totalCount > 0 ? `${activeIndex + 1} / ${totalCount}` : '0 / 0'}
        </span>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => setActiveIndex(idx => (idx + 1) % Math.max(1, totalCount))}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--leaf-neon, #7ee787)',
            fontSize: 16,
            fontWeight: 800,
            cursor: 'pointer',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
          title={lang === 'bn' ? 'পরেরটি (Right arrow)' : 'Next (Right arrow)'}
          aria-label="Next annotation"
        >
          <span style={{ fontSize: 12 }}>{lang === 'bn' ? 'পরের' : 'Next'}</span> ›
        </button>

        <span style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.2)' }} />

        {/* Exit Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.20)',
            borderRadius: 9999,
            color: '#ff8a8a',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
          title={lang === 'bn' ? 'ডেমো শেষ (Esc)' : 'Exit Demo (Esc)'}
          aria-label="Exit Demo Mode"
        >
          ✕ <span>{lang === 'bn' ? 'বন্ধ' : 'Exit'}</span>
        </button>
      </div>
    </div>
  );
}

export default DemoOverlay;
