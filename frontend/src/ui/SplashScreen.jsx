// frontend/src/ui/SplashScreen.jsx
import React, { useState, useEffect } from 'react';

export function SplashScreen({ onFinish = () => {} }) {
  const [shouldRender, setShouldRender] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return !sessionStorage.getItem('fieldshift_splash_seen');
      }
    } catch (_) {}
    return true;
  });
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!shouldRender) return;

    try {
      sessionStorage.setItem('fieldshift_splash_seen', '1');
    } catch (_) {}

    const isReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const playDuration = isReduced ? 300 : 900;
    const totalDuration = isReduced ? 400 : 1150;

    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, playDuration);

    const endTimer = setTimeout(() => {
      setShouldRender(false);
      onFinish();
    }, totalDuration);

    // Hard fallback safety: never block longer than 1.5s
    const hardTimeout = setTimeout(() => {
      setShouldRender(false);
      onFinish();
    }, 1450);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
      clearTimeout(hardTimeout);
    };
  }, [shouldRender, onFinish]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fieldshift-splash-overlay ${fading ? 'fade-out' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading FieldShift"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#07140D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        {/* Animated Mark */}
        <div style={{ position: 'relative', width: 88, height: 88 }}>
          <svg viewBox="0 0 64 64" width="88" height="88" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="splash-lf" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="#2FB86A" />
                <stop offset="1" stopColor="#C8F169" />
              </linearGradient>
              <linearGradient id="splash-bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#0F2A1C" />
                <stop offset="1" stopColor="#07140D" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="16" fill="url(#splash-bg)" stroke="rgba(200, 241, 105, 0.25)" strokeWidth="1" />
            <path d="M32 50 C18 44 16 28 26 18 C30 14 38 12 46 13 C48 22 47 32 42 40 C39 45 35 48 32 50Z" fill="url(#splash-lf)" />
            <path d="M32 50 C33 38 37 27 44 16" stroke="#0B2016" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path d="M35.5 35 L28 31 M38.6 27 L32.5 23.5" stroke="#0B2016" strokeWidth="1.8" strokeLinecap="round" />
            
            {/* Orbit ring drawing itself (stroke-dashoffset 700ms) */}
            <ellipse
              className="splash-orbit-ring"
              cx="32"
              cy="33"
              rx="25"
              ry="9"
              fill="none"
              stroke="#5BE3FF"
              strokeWidth="2"
              transform="rotate(-24 32 33)"
            />
            {/* Satellite dot traveling along orbit */}
            <g className="splash-satellite-dot">
              <circle cx="53.5" cy="22.5" r="3.4" fill="#5BE3FF" />
              <circle cx="53.5" cy="22.5" r="7" fill="#5BE3FF" opacity="0.3" />
            </g>
          </svg>
        </div>

        {/* Wordmark */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontSize: 26, fontWeight: 800, color: '#EAF6E6', letterSpacing: '-0.5px' }}>
            Field<span style={{ color: '#C8F169' }}>Shift</span>
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9.5, fontWeight: 700, color: '#8FA394', letterSpacing: '2.4px', marginTop: 4 }}>
            SATELLITE DATA · FIELD DECISIONS
          </div>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
