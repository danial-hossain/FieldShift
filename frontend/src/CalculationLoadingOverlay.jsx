import React, { useState, useEffect, useRef, useMemo } from 'react';

/**
 * Polar to Cartesian coordinates helper for SVG arcs
 */
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
}

// 6 Seasonal Arcs Configuration
const SEASON_ARCS = [
  { id: 'Y1_S1', nameEn: 'Rabi Y1', nameBn: 'রবি ১', start: 5, end: 55 },
  { id: 'Y1_S2', nameEn: 'Kharif-1 Y1', nameBn: 'খরিপ-১ ১', start: 65, end: 115 },
  { id: 'Y1_S3', nameEn: 'Kharif-2 Y1', nameBn: 'খরিপ-২ ১', start: 125, end: 175 },
  { id: 'Y2_S1', nameEn: 'Rabi Y2', nameBn: 'রবি ২', start: 185, end: 235 },
  { id: 'Y2_S2', nameEn: 'Kharif-1 Y2', nameBn: 'খরিপ-১ ২', start: 245, end: 295 },
  { id: 'Y2_S3', nameEn: 'Kharif-2 Y2', nameBn: 'খরিপ-২ ২', start: 305, end: 355 },
];

const ARC_LENGTH = (50 / 360) * 2 * Math.PI * 64; // ~55.85px

const MODE_STEPS = {
  planner: (lang, nOptions) => [
    {
      id: 1,
      text: lang === 'bn' ? 'নাসা POWER ও GPM IMERG তথ্য পড়া হচ্ছে' : 'Reading NASA POWER & GPM IMERG for your field',
      tickMs: 150,
    },
    {
      id: 2,
      text: lang === 'bn' ? 'ফসলের পানির চাহিদা গণনা করা হচ্ছে (FAO-56)' : 'Computing crop water need (FAO-56)',
      tickMs: 450,
    },
    {
      id: 3,
      text: lang === 'bn' ? `${nOptions || 18}টি ফসল-মৌসুম বিকল্প মূল্যায়ন করা হচ্ছে` : `Scoring ${nOptions || 18} crop-season options`,
      tickMs: 750,
    },
    {
      id: 4,
      text: lang === 'bn' ? 'MILP সেরা ৬-মৌসুম ফসল আবর্তন নির্ধারণ করছে' : 'MILP choosing the best 6-season rotation',
      tickMs: null,
    },
  ],
  replan: (lang) => [
    {
      id: 1,
      text: lang === 'bn' ? 'আপনার ফসল কাটার তথ্য পড়া হচ্ছে' : 'Reading your harvest records',
      tickMs: 200,
    },
    {
      id: 2,
      text: lang === 'bn' ? 'বাকি মৌসুমগুলোর পুনর্বিন্যাস করা হচ্ছে' : 'Re-optimizing remaining seasons',
      tickMs: null,
    },
  ],
  stress: (lang) => [
    {
      id: 1,
      text: lang === 'bn' ? '১০ বছরের খরা পরিস্থিতি সিমুলেশন করা হচ্ছে' : 'Simulating 10-year drought',
      tickMs: 200,
    },
    {
      id: 2,
      text: lang === 'bn' ? 'AWD পানি ভারসাম্য গণনা চলছে' : 'Running AWD water balance',
      tickMs: 450,
    },
    {
      id: 3,
      text: lang === 'bn' ? 'ফলন হ্রাসের মাত্রা নির্ধারণ করা হচ্ছে' : 'Computing yield penalty',
      tickMs: null,
    },
  ],
};

/**
 * G5: Calculation Loading Screen with 6-arc rotation ring and honest ticking steps
 */
export function CalculationLoadingOverlay({
  active = true,
  isApiLoading = false,
  isInitialOpen = false,
  mode = 'planner',
  lang = 'en',
  nOptions = 18,
  error = null,
  onRetry = null,
  onComplete = null,
  style = {},
}) {
  const [mounted, setMounted] = useState(active);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [ringProgress, setRingProgress] = useState(0);

  const startTimeRef = useRef(Date.now());
  const isReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const steps = useMemo(() => {
    const fn = MODE_STEPS[mode] || MODE_STEPS.planner;
    return fn(lang, nOptions);
  }, [mode, lang, nOptions]);

  const minDuration = isInitialOpen ? 1200 : 700;

  // Reset when active transitions to true
  useEffect(() => {
    if (active) {
      setMounted(true);
      setIsFadingOut(false);
      setCompletedSteps(new Set());
      setActiveStepIdx(0);
      setRingProgress(0);
      startTimeRef.current = Date.now();
    }
  }, [active]);

  // Main ticking timer
  useEffect(() => {
    if (!mounted || error) return;

    let animFrame = null;
    let timerId = null;

    const updateLoop = () => {
      const elapsed = Date.now() - startTimeRef.current;

      // Update ring fill (filling 6 arcs smoothly across minDuration)
      if (!isReducedMotion) {
        const p = Math.min(elapsed / (minDuration * 0.9), 1);
        setRingProgress(p);
      }

      // Check intermediate step ticks
      steps.forEach((step, idx) => {
        if (step.tickMs != null && elapsed >= step.tickMs) {
          setCompletedSteps((prev) => {
            if (!prev.has(idx)) {
              const next = new Set(prev);
              next.add(idx);
              return next;
            }
            return prev;
          });
          if (activeStepIdx <= idx) {
            setActiveStepIdx(idx + 1);
          }
        }
      });

      // Check if API has returned (or not actively loading) and minDuration has passed
      if (!isApiLoading && elapsed >= minDuration) {
        // Complete all steps
        const allIndices = new Set(steps.map((_, i) => i));
        setCompletedSteps(allIndices);
        setActiveStepIdx(steps.length);
        setRingProgress(1);

        // Hold completed checkmarks for 100ms, then initiate fade out
        timerId = setTimeout(() => {
          setIsFadingOut(true);
          // 250ms fade out transition
          setTimeout(() => {
            setMounted(false);
            if (onComplete) onComplete();
          }, 250);
        }, 100);
        return;
      }

      animFrame = requestAnimationFrame(updateLoop);
    };

    animFrame = requestAnimationFrame(updateLoop);

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (timerId) clearTimeout(timerId);
    };
  }, [mounted, isApiLoading, minDuration, steps, isReducedMotion, error, onComplete, activeStepIdx]);

  if (!mounted && !active) return null;

  return (
    <div
      className={`calc-loading-overlay ${isFadingOut ? 'fade-out' : ''}`}
      style={style}
      role="status"
      aria-live="polite"
    >
      {error ? (
        <div
          style={{
            background: 'var(--surface-card, rgba(16, 28, 22, 0.92))',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 16,
            padding: '24px 32px',
            textAlign: 'center',
            maxWidth: 520,
            boxShadow: '0 12px 36px rgba(0,0,0,0.45)',
          }}
        >
          <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>⚠️</span>
          <h3 style={{ margin: '0 0 8px', color: 'var(--alert, #ef4444)', fontSize: 18, fontWeight: 600 }}>
            {lang === 'bn' ? 'পরিকল্পনা গণনায় সমস্যা হয়েছে' : 'Optimization Could Not Complete'}
          </h3>
          <p style={{ margin: '0 0 20px', color: 'var(--text-muted, #94a3b8)', fontSize: 13, lineHeight: 1.5 }}>
            {typeof error === 'string' ? error : error?.message || (lang === 'bn' ? 'পুনরায় চেষ্টা করুন।' : 'Please try again.')}
          </p>
          {onRetry && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onRetry}
              style={{
                background: 'linear-gradient(135deg, #D7F78A, #A8E04A)',
                color: '#0d160e',
                border: 'none',
                borderRadius: 10,
                padding: '9px 20px',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(200, 241, 105, 0.35)',
              }}
            >
              ⟳ {lang === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry Calculation'}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 480, width: '100%' }}>
          {/* Animated 6-Season Rotation Ring */}
          {!isReducedMotion ? (
            <div className="calc-ring-wrapper">
              <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                <defs>
                  <linearGradient id="calcNeonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--neon-cyan, #5BE3FF)" />
                    <stop offset="100%" stopColor="var(--neon, #C8F169)" />
                  </linearGradient>
                </defs>
                {SEASON_ARCS.map((arc, i) => {
                  const arcD = describeArc(90, 90, 64, arc.start, arc.end);
                  const arcStartProgress = i / 6;
                  const arcEndProgress = (i + 1) / 6;
                  let fillFraction = 0;
                  if (ringProgress >= arcEndProgress) {
                    fillFraction = 1;
                  } else if (ringProgress > arcStartProgress) {
                    fillFraction = (ringProgress - arcStartProgress) / (arcEndProgress - arcStartProgress);
                  }
                  const strokeOffset = ARC_LENGTH * (1 - fillFraction);

                  return (
                    <g key={arc.id}>
                      {/* Track */}
                      <path
                        d={arcD}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeWidth="7"
                        strokeLinecap="round"
                      />
                      {/* Animated Fill */}
                      {fillFraction > 0 && (
                        <path
                          d={arcD}
                          fill="none"
                          stroke="url(#calcNeonGrad)"
                          strokeWidth="7"
                          strokeLinecap="round"
                          strokeDasharray={ARC_LENGTH}
                          strokeDashoffset={strokeOffset}
                          style={{
                            filter: 'drop-shadow(0 0 6px rgba(200, 241, 105, 0.4))',
                            transition: 'stroke-dashoffset 0.08s linear',
                          }}
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
              {/* Ring Center */}
              <div className="calc-ring-center">
                <span style={{ fontSize: 24, lineHeight: 1, filter: 'drop-shadow(0 0 8px rgba(200,241,105,0.4))' }}>
                  🌱
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--neon)',
                    marginTop: 4,
                  }}
                >
                  6-Season
                </span>
              </div>
            </div>
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                border: '3px solid rgba(200, 241, 105, 0.2)',
                borderTopColor: 'var(--neon)',
                borderRadius: '50%',
                marginBottom: 20,
              }}
            />
          )}

          {/* Ticking Steps Checklist */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {steps.map((step, idx) => {
              const isDone = completedSteps.has(idx);
              const isActive = activeStepIdx === idx && !isDone;
              const isWaiting = !isDone && !isActive;

              let iconClass = 'calc-step-icon waiting';
              let iconContent = idx + 1;
              if (isDone) {
                iconClass = 'calc-step-icon done';
                iconContent = '✓';
              } else if (isActive) {
                iconClass = 'calc-step-icon active';
                iconContent = '⟳';
              }

              return (
                <div
                  key={step.id}
                  className="calc-step-row"
                  style={{
                    color: isDone ? 'var(--text)' : isActive ? 'var(--neon-cyan, #5BE3FF)' : 'var(--text-muted, #94a3b8)',
                    opacity: isWaiting ? 0.45 : 1,
                    fontWeight: isDone || isActive ? 600 : 400,
                  }}
                >
                  <div className={iconClass}>{iconContent}</div>
                  <span style={{ fontSize: 13.5 }}>{step.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Animated count-up component for KPI numbers (600ms)
 */
export function CountUpNumber({
  value,
  duration = 600,
  lang = 'bn',
  formatFn = null,
  triggerKey = null,
}) {
  const [displayValue, setDisplayValue] = useState(() => (typeof window === 'undefined' ? value : 0));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced || value == null || isNaN(Number(value))) {
      setDisplayValue(value);
      return;
    }

    let animId = null;
    let startTs = null;
    const target = Number(value);

    const step = (ts) => {
      if (!startTs) startTs = ts;
      const progress = Math.min((ts - startTs) / duration, 1);
      // easeOutCubic: 1 - Math.pow(1 - progress, 3)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setDisplayValue(target);
      }
    };

    animId = requestAnimationFrame(step);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [value, duration, triggerKey]);

  if (value == null) return '…';
  if (formatFn) return formatFn(displayValue);
  return displayValue.toLocaleString();
}

export default CalculationLoadingOverlay;
