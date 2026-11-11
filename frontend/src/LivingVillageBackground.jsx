import React, { useEffect, useRef } from 'react';
import './LivingVillageBackground.css';

/*
 * Village dusk background — performance version.
 * The 5 layers are pre-rendered WebP images (cheap to move on the GPU); only small elements
 * (stars, fireflies, window glow, sun glow) are animated, with opacity/transform only.
 * The parallax loop runs only while the mouse or the scroll is moving, then stops.
 */
const LAYERS = [
  { id: 'sky', mouse: 0, scroll: 0.0 },
  { id: 'far', mouse: 4, scroll: 0.02 },
  { id: 'land', mouse: 8, scroll: 0.04 },
  { id: 'mid', mouse: 14, scroll: 0.08 },
  { id: 'fore', mouse: 24, scroll: 0.14 },
];
const FILES = { sky: '0_sky', far: '1_far', land: '2_land', mid: '3_mid', fore: '4_fore' };
// positions in % of the 1600x1000 art frame
const STARS = [[32.38, 3.5, 1.2, 0.34], [53.56, 8.4, 0.7, 0.55], [3.75, 10.0, 0.7, 0.35], [42.44, 19.0, 0.7, 0.41], [62.75, 21.8, 1.1, 0.5], [97.62, 1.1, 1.4, 0.44], [14.44, 2.7, 0.9, 0.71], [18.06, 13.4, 1.2, 0.49], [54.75, 1.4, 0.7, 0.4], [68.06, 9.8, 0.9, 0.59], [45.31, 6.9, 1.3, 0.65], [24.44, 13.2, 1.1, 0.74], [72.94, 6.6, 1.5, 0.36], [41.81, 17.4, 0.7, 0.54], [3.94, 15.4, 1.3, 0.59], [87.56, 7.2, 1.2, 0.6], [58.0, 10.5, 1.4, 0.77], [47.44, 15.3, 0.7, 0.65], [64.69, 22.8, 1.3, 0.44], [38.56, 15.4, 0.6, 0.53], [16.81, 2.7, 0.7, 0.68], [12.94, 5.7, 1.0, 0.74], [8.06, 10.3, 1.1, 0.74], [81.94, 19.9, 0.9, 0.51], [35.88, 20.3, 1.5, 0.38], [17.62, 5.3, 0.8, 0.54], [58.94, 6.0, 0.6, 0.51], [36.94, 13.0, 1.5, 0.65], [51.56, 14.2, 1.2, 0.33], [89.94, 17.9, 1.4, 0.7], [39.25, 9.2, 0.7, 0.62], [6.25, 1.5, 0.8, 0.38], [34.0, 1.2, 0.6, 0.38], [10.12, 8.4, 0.6, 0.74], [61.44, 3.4, 0.8, 0.47], [36.44, 2.8, 1.4, 0.8], [46.62, 11.1, 0.7, 0.35], [34.25, 6.1, 1.3, 0.38], [2.31, 21.9, 1.1, 0.37], [54.31, 0.6, 1.1, 0.79], [86.31, 16.0, 0.8, 0.48], [16.69, 17.8, 1.1, 0.69], [32.94, 5.1, 1.3, 0.79], [85.25, 18.5, 1.3, 0.67], [22.69, 11.9, 0.9, 0.31], [2.81, 6.4, 0.8, 0.65], [95.62, 10.3, 1.4, 0.79], [95.5, 8.4, 0.8, 0.41], [19.69, 4.7, 1.2, 0.75], [84.06, 11.0, 1.2, 0.7], [8.5, 15.2, 1.4, 0.69], [75.0, 11.0, 0.8, 0.69], [33.25, 18.4, 1.5, 0.5], [40.12, 21.8, 1.3, 0.39], [12.69, 3.5, 1.4, 0.7], [14.62, 19.0, 1.5, 0.63], [35.06, 12.6, 0.7, 0.31], [97.06, 14.9, 1.1, 0.77], [43.38, 20.1, 1.3, 0.41], [25.19, 6.7, 0.8, 0.59], [25.94, 9.6, 0.7, 0.76], [35.38, 10.5, 1.1, 0.75], [42.06, 21.1, 1.1, 0.57], [52.38, 0.4, 1.0, 0.39], [0.38, 18.4, 0.8, 0.54], [72.5, 12.8, 0.9, 0.56], [55.56, 18.0, 0.7, 0.58], [24.88, 6.4, 1.3, 0.55], [56.19, 17.5, 1.4, 0.52], [61.25, 11.6, 1.1, 0.65]];
const FLIES = [[93.69, 68.8], [14.94, 64.7], [63.81, 86.4], [78.19, 73.3], [26.44, 62.3], [64.5, 77.7], [35.06, 80.1], [44.38, 88.2], [73.38, 69.0], [90.38, 63.2], [53.12, 73.4], [23.75, 63.6], [77.88, 62.3], [55.06, 88.3], [14.25, 67.6], [60.81, 76.2], [64.19, 84.8], [17.44, 70.7], [30.0, 63.4], [88.94, 83.9], [71.56, 62.2], [84.44, 82.9], [46.5, 82.8], [45.25, 68.3], [10.5, 68.5]];
const WINDOWS = [[74.47, 55.08, 1.59, "1"], [13.18, 58.44, 2.89, "3"], [22.3, 58.19, 2.31, "3"]];

function Frame({ id, children }) {
  return (
    <div className="lvb-frame">
      <img src={`/bg/layers/${FILES[id]}.webp`} alt="" draggable="false" decoding="async" />
      {children}
    </div>
  );
}

export function LivingVillageBackground() {
  const refs = useRef([]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || window.innerWidth <= 768) return undefined;
    let tx = 0, ty = 0, cx = 0, cy = 0, ts = 0, cs = 0, raf = 0;
    const scrollEl = () => document.scrollingElement || document.documentElement;
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    const onMouse = (e) => { tx = (e.clientX / window.innerWidth - 0.5) * 2; ty = (e.clientY / window.innerHeight - 0.5) * 2; kick(); };
    const onScroll = (e) => { const t = e && e.target && e.target !== document ? e.target.scrollTop : scrollEl().scrollTop; ts = t || 0; kick(); };
    function step() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08; cs += (ts - cs) * 0.12;
      for (let i = 0; i < LAYERS.length; i++) {
        const el = refs.current[i]; if (!el) continue;
        const L = LAYERS[i];
        const x = cx * L.mouse, y = cy * L.mouse * 0.6 - Math.min(100, cs * L.scroll);
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }
      const moving = Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002 || Math.abs(ts - cs) > 0.5;
      raf = moving ? requestAnimationFrame(step) : 0;
    }
    window.addEventListener('mousemove', onMouse, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('scroll', onScroll, { capture: true });
    };
  }, []);

  return (
    <div className="lvb" aria-hidden="true">
      {LAYERS.map((L, i) => (
        <div key={L.id} className={`lvb-layer lvb-${L.id}`} ref={(el) => (refs.current[i] = el)}>
          <Frame id={L.id}>
            {L.id === 'sky' && (
              <>
                <i className="lvb-sun" style={{ left: '67.5%', top: '54%' }} />
                {STARS.map(([x, y, r, o], k) => (
                  <i key={k} className="lvb-star" style={{ left: `${x}%`, top: `${y}%`, width: r * 2 + 1, height: r * 2 + 1, '--o': o, animationDelay: `-${(k * 0.7) % 5}s`, animationDuration: `${3.5 + (k % 5) * 0.8}s` }} />
                ))}
              </>
            )}
            {(L.id === 'far' || L.id === 'mid') && WINDOWS.filter((w) => w[3] === (L.id === 'far' ? '1' : '3')).map(([x, y, s], k) => (
              <i key={k} className="lvb-window" style={{ left: `${x}%`, top: `${y}%`, width: `${s}%`, animationDelay: `-${k * 1.3}s` }} />
            ))}
            {L.id === 'fore' && FLIES.map(([x, y], k) => (
              <i key={k} className="lvb-fly" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `-${(k * 0.6) % 3}s`, animationDuration: `${2 + (k % 5) * 0.5}s` }} />
            ))}
          </Frame>
        </div>
      ))}
      <div className="lvb-overlay" />
    </div>
  );
}
export default LivingVillageBackground;
