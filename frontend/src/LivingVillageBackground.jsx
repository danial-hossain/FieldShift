import React, { useEffect, useRef, useState } from 'react';

const LAYER_CONFIGS = [
  { id: 'sky', file: '/bg/layers/0_sky.svg', mouseMax: 0, scrollPct: 0.00 },
  { id: 'far', file: '/bg/layers/1_far.svg', mouseMax: 4, scrollPct: 0.02 },
  { id: 'land', file: '/bg/layers/2_land.svg', mouseMax: 8, scrollPct: 0.04 },
  { id: 'mid', file: '/bg/layers/3_mid.svg', mouseMax: 14, scrollPct: 0.08 },
  { id: 'fore', file: '/bg/layers/4_fore.svg', mouseMax: 24, scrollPct: 0.14 },
];

function processSvg(raw, index) {
  let svg = raw;

  if (index === 0) {
    // 0_sky.svg
    // Sun radial glow breathing
    svg = svg.replace(
      '<rect width="1600" height="580" fill="url(#sun)"/>',
      '<rect class="bg-sun-glow" width="1600" height="580" fill="url(#sun)"/>'
    );

    // Stars twinkle with random delays (3-7s)
    let starIdx = 0;
    svg = svg.replace(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)" fill="#fff" opacity="([^"]+)"\/>/g, (m, cx, cy, r, op) => {
      starIdx++;
      const dur = (3.5 + (starIdx % 5) * 0.8).toFixed(1);
      const delay = ((starIdx * 0.7) % 5).toFixed(1);
      return `<circle class="bg-star" cx="${cx}" cy="${cy}" r="${r}" fill="#fff" opacity="${op}" style="--star-base-op: ${op}; animation-duration: ${dur}s; animation-delay: -${delay}s;"/>`;
    });

    // Birds slowly drift right (60s loop)
    const birdStart = svg.indexOf('<path d="M820');
    if (birdStart !== -1) {
      const birdEnd = svg.indexOf('</svg>');
      const birdPaths = svg.substring(birdStart, birdEnd);
      svg = svg.substring(0, birdStart) + `<g class="bg-birds">${birdPaths}</g></svg>`;
    }
  } else if (index === 3) {
    // 3_mid.svg
    // Hut windows flicker softly
    svg = svg.replace(/fill="#ffb24d"/g, 'fill="#ffb24d" class="bg-window-glow"');
  } else if (index === 4) {
    // 4_fore.svg
    // Fireflies pulse and drift
    let flyIdx = 0;
    svg = svg.replace(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)" fill="#ffe58a"/g, (m, cx, cy, r) => {
      flyIdx++;
      const dur = (2.0 + (flyIdx % 5) * 0.5).toFixed(1);
      const delay = ((flyIdx * 0.6) % 3).toFixed(1);
      return `<circle class="bg-firefly" cx="${cx}" cy="${cy}" r="${r}" fill="#ffe58a" style="animation-duration: ${dur}s; animation-delay: -${delay}s;"`;
    });
  }

  return svg;
}

export function LivingVillageBackground() {
  const [layers, setLayers] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const layerRefs = useRef([]);

  // Check mobile and reduced motion
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const onMotionChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', onMotionChange);
    window.addEventListener('resize', checkMobile);

    return () => {
      mediaQuery.removeEventListener('change', onMotionChange);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Fetch 5 SVG layers
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let mounted = true;
    Promise.all(
      LAYER_CONFIGS.map((cfg, idx) =>
        fetch(cfg.file)
          .then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.text();
          })
          .then((text) => processSvg(text, idx))
          .catch((err) => {
            console.warn(`Layer ${cfg.id} load failed:`, err);
            return null;
          })
      )
    ).then((results) => {
      if (mounted) {
        setLayers(results);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Parallax animation loop
  useEffect(() => {
    if (typeof window === 'undefined' || reducedMotion || isMobile) return;

    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;
    let currentScrollY = window.scrollY || 0;
    let targetScrollY = currentScrollY;
    let rafId = null;

    const onMouseMove = (e) => {
      // Normalized from -1 to 1
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const onScroll = () => {
      targetScrollY = window.scrollY || 0;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    const animate = () => {
      // Smooth lerp
      currentMouseX += (targetMouseX - currentMouseX) * 0.08;
      currentMouseY += (targetMouseY - currentMouseY) * 0.08;
      currentScrollY += (targetScrollY - currentScrollY) * 0.08;

      LAYER_CONFIGS.forEach((cfg, idx) => {
        const el = layerRefs.current[idx];
        if (!el) return;

        const transX = currentMouseX * cfg.mouseMax;
        const transY = currentMouseY * (cfg.mouseMax * 0.6) - Math.min(100, currentScrollY * cfg.scrollPct);

        el.style.transform = `translate3d(${transX.toFixed(2)}px, ${transY.toFixed(2)}px, 0) scale(1.04)`;
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, [reducedMotion, isMobile, layers]);

  return (
    <div className="living-village-bg-container" aria-hidden="true">
      {isMobile ? (
        <picture className="village-bg-picture">
          <source srcSet="/bg/village_dusk_bg_1600.webp" type="image/webp" />
          <img
            src="/bg/village_dusk_bg_1600.webp"
            alt=""
            className="village-bg-img"
          />
        </picture>
      ) : (
        LAYER_CONFIGS.map((cfg, idx) => {
          const svgContent = layers[idx];
          return (
            <div
              key={cfg.id}
              ref={(el) => (layerRefs.current[idx] = el)}
              className={`living-bg-layer living-bg-layer-${cfg.id}`}
              style={{
                zIndex: idx + 1,
                transform: 'scale(1.04)',
              }}
              dangerouslySetInnerHTML={svgContent ? { __html: svgContent } : undefined}
            />
          );
        })
      )}

      {/* UP2 Gradient Vignette Overlay on top of stacked layers */}
      <div className="village-bg-overlay" />
    </div>
  );
}

export default LivingVillageBackground;
