// frontend/src/three/FarmScene3D.jsx
// Authentic 3D Farm Component for FieldShift 2026 (Ported 1:1 from approved farm3d_reference.html)
// P3D-1 Architecture:
// - ACESFilmic tone mapping, SRGB output, PCFSoft shadows, pixel ratio <= 2
// - Procedural sky dome with PMREM environment map reflection
// - True village diorama: tin-roof house, veranda, straw stack, tubewell, pond, palms, trees, bamboo fence
// - 6 Beds (2 rows x 3) with raised bunds (আইল) and ploughed furrows
// - Merged vertex-colored InstancedMesh crops with distinct geometries per species
// - Dynamic water layer for rice paddies, ploughed dry/wet soil differentiation
// - Interactive bed selection with glowing yellow outline, camera presets ('iso', 'top', 'close')
// - Growth animation on crop sequence change with cubic ease-out, respecting prefers-reduced-motion
// - Draw calls bounded <= 150, on-demand/throttled rendering, strict resource disposal
// - WebGL-off graceful 2D fallback

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { AlertTriangle, Home, RotateCw, Map, Search, Droplets, MousePointerClick } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { cropLabel } from '../i18n.js';
import {
  FARM_PALETTE,
  CROPS_META,
  mapCropToGeoKey,
  getCropCategory,
  haToBigha,
  isWebGLAvailable,
} from './farmSceneHelpers.js';

export { FARM_PALETTE, CROPS_META, mapCropToGeoKey, getCropCategory, haToBigha, isWebGLAvailable };

function toBanglaDigits(val) {
  if (val == null) return '';
  const digits = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
  return String(val).replace(/[0-9]/g, (c) => digits[c] || c);
}

/* ---------- Procedural Helpers & Shaders (Reference 1:1) ---------- */
const createRnd = () => {
  let s = 7;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function vnoise(x, z) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi);
  const b = hash(xi + 1, zi);
  const c = hash(xi, zi + 1);
  const d = hash(xi + 1, zi + 1);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

function colorGeo(g, hex) {
  const c = new THREE.Color(hex);
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  if (g.index) g = g.toNonIndexed();
  return g;
}

function prep(g, hex) {
  g = g.index ? g.toNonIndexed() : g;
  return colorGeo(g, hex);
}

const vcMat = (rough = 0.85) =>
  new THREE.MeshStandardMaterial({ vertexColors: true, roughness: rough, metalness: 0 });

function blade(h, w, lean, hex, rnd) {
  const g = new THREE.ConeGeometry(w, h, 3, 1, true);
  g.translate(0, h / 2, 0);
  g.rotateZ(lean);
  return prep(g, hex);
}

/* ---------- Build Crop Geometries Cache ---------- */
function buildCropGeometries() {
  const rnd = createRnd();
  const G = {};

  // 1. Rice (Aman / Green vegetative in water)
  {
    const parts = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const b = blade(1.6 + rnd() * 0.5, 0.05, 0.18 + rnd() * 0.15, i % 3 ? '#5f9e35' : '#79b844', rnd);
      b.rotateY(a);
      parts.push(b);
    }
    G.rice = mergeGeometries(parts);
  }

  // 2. Rice Ripe (Boro / Golden mature tillers with grain heads)
  {
    const parts = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const b = blade(1.7, 0.05, 0.25, i % 3 ? '#b7a33a' : '#cdb64a', rnd);
      b.rotateY(a);
      parts.push(b);
    }
    for (let i = 0; i < 4; i++) {
      const p = new THREE.SphereGeometry(0.12, 5, 4);
      p.scale(1, 2.2, 1);
      p.translate(Math.cos(i * 1.6) * 0.45, 1.5, Math.sin(i * 1.6) * 0.45);
      parts.push(prep(p, '#d9b84e'));
    }
    G.riceRipe = mergeGeometries(parts);
  }

  // 3. Aus Rice (Light vegetative tillers)
  {
    const parts = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const b = blade(1.4 + rnd() * 0.4, 0.045, 0.2 + rnd() * 0.1, i % 2 ? '#8dbb45' : '#a0cc52', rnd);
      b.rotateY(a);
      parts.push(b);
    }
    G.aus = mergeGeometries(parts);
  }

  // 4. Mustard (Green stem, dark leaves, yellow flower clusters)
  {
    const parts = [];
    const stem = prep(new THREE.CylinderGeometry(0.035, 0.05, 1.9, 4).translate(0, 0.95, 0), '#5e8f2c');
    parts.push(stem);
    for (let i = 0; i < 4; i++) {
      const l = new THREE.PlaneGeometry(0.4, 0.7);
      l.rotateX(-0.9);
      l.rotateY(i * 1.6);
      l.translate(0, 0.35 + i * 0.12, 0);
      parts.push(prep(l, '#5b8c2d'));
    }
    for (let i = 0; i < 7; i++) {
      const f = new THREE.IcosahedronGeometry(0.17, 0);
      f.translate((rnd() - 0.5) * 0.45, 1.85 + rnd() * 0.35, (rnd() - 0.5) * 0.45);
      parts.push(prep(f, i % 2 ? '#f5cf1d' : '#f0b915'));
    }
    G.mustard = mergeGeometries(parts);
  }

  // 5. Soybean (Dense bush, dark trifoliate leaves, tan pod clusters)
  {
    const parts = [prep(new THREE.CylinderGeometry(0.04, 0.06, 0.9, 5).translate(0, 0.45, 0), '#5f7a2e')];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const h = 0.35 + rnd() * 0.55;
      for (let j = 0; j < 3; j++) {
        const l = new THREE.CircleGeometry(0.17, 7);
        l.scale(1, 1.35, 1);
        l.rotateX(-1.2);
        l.rotateY(a + j * 0.6 - 0.6);
        l.translate(Math.cos(a) * 0.32 + Math.cos(a + j) * 0.1, h, Math.sin(a) * 0.32 + Math.sin(a + j) * 0.1);
        parts.push(prep(l, j === 1 ? '#2f5f22' : '#356b26'));
      }
    }
    for (let i = 0; i < 7; i++) {
      const pod = new THREE.CapsuleGeometry(0.045, 0.16, 2, 5);
      pod.rotateZ(0.5 + rnd() * 0.6);
      pod.translate((rnd() - 0.5) * 0.4, 0.35 + rnd() * 0.4, (rnd() - 0.5) * 0.4);
      parts.push(prep(pod, '#a8915a'));
    }
    G.soybean = mergeGeometries(parts);
  }

  // 6. Mungbean (Upright light-green plant, long black slender pods, yellow flowers)
  {
    const parts = [prep(new THREE.CylinderGeometry(0.03, 0.045, 1.3, 4).translate(0, 0.65, 0), '#7d9a3a')];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      const st = new THREE.CylinderGeometry(0.015, 0.02, 0.5, 3);
      st.rotateZ(0.9);
      st.rotateY(a);
      st.translate(Math.cos(a) * 0.18, 0.55 + i * 0.12, Math.sin(a) * 0.18);
      parts.push(prep(st, '#7d9a3a'));
      const l = new THREE.PlaneGeometry(0.22, 0.34);
      l.rotateX(-0.6);
      l.rotateY(a);
      l.translate(Math.cos(a) * 0.4, 0.6 + i * 0.12, Math.sin(a) * 0.4);
      parts.push(prep(l, '#8fbf3e'));
    }
    for (let i = 0; i < 8; i++) {
      const a = rnd() * 6.28;
      const pod = new THREE.CylinderGeometry(0.018, 0.018, 0.42, 4);
      pod.rotateZ(1.25);
      pod.rotateY(a);
      pod.translate(Math.cos(a) * 0.3, 1.05 + rnd() * 0.25, Math.sin(a) * 0.3);
      parts.push(prep(pod, '#1f2420'));
    }
    for (let i = 0; i < 4; i++) {
      const f = new THREE.SphereGeometry(0.05, 4, 3);
      f.translate((rnd() - 0.5) * 0.3, 1.3 + rnd() * 0.1, (rnd() - 0.5) * 0.3);
      parts.push(prep(f, '#f2d22b'));
    }
    G.mungbean = mergeGeometries(parts);
  }

  // 7. Lentil (Very low dense mat of fine feathery blue-green leaflets, pale violet flowers)
  {
    const parts = [];
    for (let i = 0; i < 22; i++) {
      const b = new THREE.ConeGeometry(0.018, 0.32 + rnd() * 0.12, 3, 1, true);
      b.translate(0, 0.16, 0);
      b.rotateZ(0.5 + rnd() * 0.6);
      b.rotateY(rnd() * 6.28);
      parts.push(prep(b, i % 2 ? '#7fa48a' : '#6f9a7e'));
    }
    for (let i = 0; i < 5; i++) {
      const f = new THREE.SphereGeometry(0.035, 4, 3);
      f.translate((rnd() - 0.5) * 0.35, 0.3, (rnd() - 0.5) * 0.35);
      parts.push(prep(f, '#c9b8ea'));
    }
    G.lentil = mergeGeometries(parts);
  }

  // 8. Chickpea (Knee-high bushy grey-green, round inflated pods, white-pink flowers)
  {
    const parts = [prep(new THREE.CylinderGeometry(0.03, 0.045, 0.7, 4).translate(0, 0.35, 0), '#8a9a5a')];
    for (let i = 0; i < 16; i++) {
      const b = new THREE.ConeGeometry(0.03, 0.42, 3, 1, true);
      b.translate(0, 0.21, 0);
      b.rotateZ(0.7 + rnd() * 0.5);
      b.rotateY(rnd() * 6.28);
      b.translate(0, 0.25 + rnd() * 0.3, 0);
      parts.push(prep(b, i % 2 ? '#9aab78' : '#8c9f6a'));
    }
    for (let i = 0; i < 6; i++) {
      const pod = new THREE.SphereGeometry(0.07, 6, 5);
      pod.scale(1, 0.8, 1.2);
      pod.translate((rnd() - 0.5) * 0.45, 0.35 + rnd() * 0.35, (rnd() - 0.5) * 0.45);
      parts.push(prep(pod, '#b9c96a'));
    }
    for (let i = 0; i < 4; i++) {
      const f = new THREE.SphereGeometry(0.04, 4, 3);
      f.translate((rnd() - 0.5) * 0.4, 0.75, (rnd() - 0.5) * 0.4);
      parts.push(prep(f, '#f3d6e2'));
    }
    G.chickpea = mergeGeometries(parts);
  }

  // 9. Sesame (Tall stem with white bell flowers)
  {
    const parts = [prep(new THREE.CylinderGeometry(0.04, 0.06, 2.2, 4).translate(0, 1.1, 0), '#5d8f38')];
    for (let i = 0; i < 6; i++) {
      const l = new THREE.PlaneGeometry(0.22, 0.6);
      l.rotateX(-0.7);
      l.rotateY(i * 1.1);
      l.translate(0, 0.5 + i * 0.28, 0);
      parts.push(prep(l, '#5f9a3c'));
    }
    for (let i = 0; i < 4; i++) {
      const f = new THREE.ConeGeometry(0.07, 0.22, 5);
      f.rotateX(Math.PI);
      f.translate(Math.cos(i * 1.5) * 0.12, 1.4 + i * 0.18, Math.sin(i * 1.5) * 0.12);
      parts.push(prep(f, '#f3eef6'));
    }
    G.sesame = mergeGeometries(parts);
    G.tall = G.sesame;
  }

  // 10. Jute (Tall fibrous stems with leaf crown)
  {
    const parts = [prep(new THREE.CylinderGeometry(0.04, 0.06, 3.4, 5).translate(0, 1.7, 0), '#6c8a35')];
    for (let i = 0; i < 6; i++) {
      const l = new THREE.PlaneGeometry(0.35, 0.7);
      l.rotateX(-0.8);
      l.rotateY(i * 1.3);
      l.translate(0, 2.2 + i * 0.2, 0);
      parts.push(prep(l, '#3d7d34'));
    }
    G.jute = mergeGeometries(parts);
  }

  // 11. Wheat (Golden stems with ears)
  {
    const parts = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const st = new THREE.CylinderGeometry(0.02, 0.025, 1.5, 3);
      st.translate(0, 0.75, 0);
      st.rotateZ(0.08);
      st.rotateY(a);
      parts.push(prep(st, '#c9a94a'));
      const ear = new THREE.SphereGeometry(0.07, 5, 4);
      ear.scale(1, 3, 1);
      ear.translate(Math.sin(0.08) * 1.5, 1.55, 0);
      ear.rotateY(a);
      parts.push(prep(ear, '#e0bf5c'));
    }
    G.wheat = mergeGeometries(parts);
  }

  // 12. Fallow / Weeds (Bare tilled earth with sparse weeds)
  {
    const parts = [];
    for (let i = 0; i < 4; i++) {
      const b = blade(0.35, 0.04, 0.5, '#7a8f45', rnd);
      b.rotateY(i * 1.6);
      parts.push(b);
    }
    G.fallow = mergeGeometries(parts);
    G.weed = G.fallow;
  }

  // 13. Potato (Ridges with low leafy dark green bushes, white flowers)
  {
    const parts = [];
    const stem = prep(new THREE.CylinderGeometry(0.04, 0.05, 0.55, 4).translate(0, 0.27, 0), '#4a6b28');
    parts.push(stem);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const l = new THREE.CircleGeometry(0.19, 6);
      l.scale(1, 1.3, 1);
      l.rotateX(-1.1);
      l.rotateY(a + rnd() * 0.4);
      l.translate(Math.cos(a) * 0.28, 0.25 + rnd() * 0.2, Math.sin(a) * 0.28);
      parts.push(prep(l, i % 2 ? '#3a6625' : '#45732b'));
    }
    for (let i = 0; i < 3; i++) {
      const fl = new THREE.SphereGeometry(0.04, 4, 3);
      fl.translate((rnd() - 0.5) * 0.3, 0.52 + rnd() * 0.08, (rnd() - 0.5) * 0.3);
      parts.push(prep(fl, '#f6f7eb'));
    }
    G.potato = mergeGeometries(parts);
  }

  // 14. Maize (Tall stalk, arching leaves, tassel and side cob)
  {
    const parts = [];
    const stalk = prep(new THREE.CylinderGeometry(0.05, 0.07, 2.5, 5).translate(0, 1.25, 0), '#598b33');
    parts.push(stalk);
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05;
      const leaf = new THREE.PlaneGeometry(0.28, 0.95);
      leaf.rotateX(-0.95);
      leaf.rotateY(a);
      leaf.translate(Math.cos(a) * 0.2, 0.6 + i * 0.26, Math.sin(a) * 0.2);
      parts.push(prep(leaf, i % 2 ? '#4e7e2c' : '#5a8d33'));
    }
    const tassel = new THREE.ConeGeometry(0.12, 0.45, 4);
    tassel.translate(0, 2.7, 0);
    parts.push(prep(tassel, '#d6be58'));
    const cob = new THREE.CapsuleGeometry(0.05, 0.22, 2, 5);
    cob.rotateZ(0.6);
    cob.translate(0.14, 1.25, 0);
    parts.push(prep(cob, '#e0b838'));
    G.maize = mergeGeometries(parts);
  }

  // 15. Tomato (Staked bush with bright red fruit)
  {
    const parts = [];
    const stake = prep(new THREE.CylinderGeometry(0.025, 0.03, 1.6, 4).translate(0, 0.8, 0), '#735237');
    parts.push(stake);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const fol = new THREE.SphereGeometry(0.18 + rnd() * 0.08, 5, 4);
      fol.translate(Math.cos(a) * 0.22, 0.35 + rnd() * 0.7, Math.sin(a) * 0.22);
      parts.push(prep(fol, i % 2 ? '#3b6e28' : '#497c33'));
    }
    for (let i = 0; i < 5; i++) {
      const tom = new THREE.SphereGeometry(0.08, 6, 5);
      const a = (i / 5) * Math.PI * 2 + 0.3;
      tom.translate(Math.cos(a) * 0.28, 0.4 + rnd() * 0.5, Math.sin(a) * 0.28);
      parts.push(prep(tom, '#e23424'));
    }
    G.tomato = mergeGeometries(parts);
  }

  // 16. Sunflower (Tall stem, broad leaves, big yellow flower with dark disc)
  {
    const parts = [];
    const stem = prep(new THREE.CylinderGeometry(0.045, 0.065, 2.5, 5).translate(0, 1.25, 0), '#517f2e');
    parts.push(stem);
    for (let i = 0; i < 5; i++) {
      const a = i * 1.3;
      const leaf = new THREE.CircleGeometry(0.24, 6);
      leaf.scale(1, 1.4, 1);
      leaf.rotateX(-0.8);
      leaf.rotateY(a);
      leaf.translate(Math.cos(a) * 0.25, 0.6 + i * 0.32, Math.sin(a) * 0.25);
      parts.push(prep(leaf, '#447025'));
    }
    const disc = prep(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 12).rotateX(1.1).translate(0, 2.55, 0.12), '#452814');
    parts.push(disc);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const petal = new THREE.ConeGeometry(0.06, 0.24, 3);
      petal.rotateZ(a);
      petal.rotateX(1.1);
      petal.translate(Math.cos(a) * 0.22, 2.55 + Math.sin(a) * 0.22 * 0.5, 0.12);
      parts.push(prep(petal, '#f5be18'));
    }
    G.sunflower = mergeGeometries(parts);
  }

  // 17. Generic Plant (for unrecognized crops, warns in console)
  {
    const parts = [];
    const stem = prep(new THREE.CylinderGeometry(0.035, 0.05, 1.2, 4).translate(0, 0.6, 0), '#557f32');
    parts.push(stem);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const leaf = new THREE.PlaneGeometry(0.22, 0.45);
      leaf.rotateX(-0.8);
      leaf.rotateY(a);
      leaf.translate(Math.cos(a) * 0.18, 0.4 + rnd() * 0.4, Math.sin(a) * 0.18);
      parts.push(prep(leaf, i % 2 ? '#4d8236' : '#5f9940'));
    }
    G.generic = mergeGeometries(parts);
  }

  return G;
}

const SPACING = {
  rice: 0.75,
  riceRipe: 0.75,
  aus: 0.75,
  mustard: 0.62,
  soybean: 0.95,
  mungbean: 0.8,
  lentil: 0.42,
  chickpea: 0.7,
  tall: 0.7,
  sesame: 0.7,
  jute: 0.75,
  wheat: 0.5,
  potato: 0.65,
  maize: 0.75,
  tomato: 0.65,
  sunflower: 0.75,
  fallow: 2.4,
  weed: 2.4,
  generic: 0.7,
};

/* ---------- Main React Component ---------- */
export function FarmScene3D({
  beds = [],
  selectedBedId = null,
  selectedBedIndex = 0,
  onBedClick = null,
  cameraPreset = 'iso', // 'iso' | 'top' | 'close'
  fieldAreaHa = null,
  fieldName = 'খামার প্লট',
  theme = 'dark',
  lang = 'bn',
  height = 440,
  annualIrrigationMm = null,
  onRendererInfo = null,
  selectedStrategy = 'balanced',
  weather = null,
  bedLossPcts = null,
  timelineProgress = null,
  isTimelineActive = false,
  waterFraction = null,
}) {
  const containerRef = useRef(null);
  const labelsContainerRef = useRef(null);
  const bedsRef = useRef(beds);
  bedsRef.current = beds;
  const langRef = useRef(lang);
  langRef.current = lang;
  const selectedStrategyRef = useRef(selectedStrategy);
  selectedStrategyRef.current = selectedStrategy;
  const weatherRef = useRef(weather);
  weatherRef.current = weather;
  const bedLossPctsRef = useRef(bedLossPcts);
  bedLossPctsRef.current = bedLossPcts;
  const timelineProgressRef = useRef(timelineProgress);
  timelineProgressRef.current = timelineProgress;
  const isTimelineActiveRef = useRef(isTimelineActive);
  isTimelineActiveRef.current = isTimelineActive;
  const waterFractionRef = useRef(waterFraction);
  waterFractionRef.current = waterFraction;
  const [hasWebGL, setHasWebGL] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [currentPreset, setCurrentPreset] = useState(cameraPreset);
  const [infoStats, setInfoStats] = useState({ calls: 0, triangles: 0, fps: 60 });
  const [isLowLod, setIsLowLod] = useState(false);
  const isLowLodRef = useRef(false);

  // Resolve active selected index from prop
  const activeIndex = useMemo(() => {
    if (typeof selectedBedIndex === 'number' && selectedBedIndex >= 0 && selectedBedIndex < 6) {
      return selectedBedIndex;
    }
    if (selectedBedId && Array.isArray(beds)) {
      const idx = beds.findIndex((b, i) => b.id === selectedBedId || i === Number(selectedBedId));
      if (idx !== -1) return idx;
    }
    return 0;
  }, [selectedBedIndex, selectedBedId, beds]);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  // Check WebGL support on mount
  useEffect(() => {
    try {
      const avail = typeof isWebGLAvailable === 'function' ? isWebGLAvailable() : (
        typeof window !== 'undefined' && Boolean(window.WebGLRenderingContext && document.createElement('canvas').getContext('webgl'))
      );
      setHasWebGL(avail);
    } catch {
      setHasWebGL(true);
    }
  }, []);

  const bighaStr = useMemo(() => {
    if (!fieldAreaHa || fieldAreaHa <= 0) return '—';
    const b = haToBigha(fieldAreaHa);
    return b ? `${b} ${lang === 'bn' ? 'বিঘা' : 'bigha'}` : '—';
  }, [fieldAreaHa, lang]);

  const handlePresetClick = useCallback((preset) => {
    setCurrentPreset(preset);
    if (containerRef.current && containerRef.current.__farm3d) {
      containerRef.current.__farm3d.applyCameraPreset(preset, activeIndexRef.current);
      if (containerRef.current.__farm3d.requestRender) {
        containerRef.current.__farm3d.requestRender();
      }
    }
  }, []);

  // Sync internal preset state only when cameraPreset prop actually changes from parent
  const prevCameraPresetProp = useRef(cameraPreset);
  useEffect(() => {
    if (cameraPreset && cameraPreset !== prevCameraPresetProp.current) {
      prevCameraPresetProp.current = cameraPreset;
      handlePresetClick(cameraPreset);
    }
  }, [cameraPreset, handlePresetClick]);

  // -------------------------------------------------------------
  // Main Three.js Scene Setup & Lifecycle
  // -------------------------------------------------------------
  useEffect(() => {
    if (!hasWebGL || !containerRef.current) return;

    const container = containerRef.current;
    const labelsContainer = labelsContainerRef.current;
    const width = container.clientWidth || 800;
    const sceneHeight = height || 440;

    const rnd = createRnd();
    const disposables = [];

    // 1. Scene & Atmosphere (True daylight aesthetic in both themes)
    const scene = new THREE.Scene();
    const SKY_TOP = new THREE.Color('#7fb2e5');
    const SKY_HOR = new THREE.Color('#d7e3dc');
    scene.fog = new THREE.Fog('#d7e3dc', 90, 280);

    // Sky Dome
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { top: { value: SKY_TOP }, hor: { value: SKY_HOR } },
      vertexShader: `
        varying vec3 vP;
        void main() {
          vP = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * viewMatrix * vec4(vP, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 top;
        uniform vec3 hor;
        varying vec3 vP;
        void main() {
          float h = normalize(vP).y;
          float t = pow(max(h, 0.0), 0.55);
          gl_FragColor = vec4(mix(hor, top, t), 1.0);
        }
      `,
    });
    const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), skyMat);
    scene.add(skyMesh);
    disposables.push(skyMat, skyMesh.geometry);

    // 2. Renderer (ACESFilmic, SRGB, PCFSoft Shadows, pixel ratio <= 1.5 for high performance)
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, sceneHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    container.appendChild(renderer.domElement);

    // Environment map from sky for soft PBR reflections
    const pm = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), skyMat.clone()));
    const sunBall = new THREE.Mesh(
      new THREE.SphereGeometry(4, 16, 8),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(8, 7.2, 6) })
    );
    sunBall.position.set(30, 25, 15);
    envScene.add(sunBall);
    const envTexture = pm.fromScene(envScene, 0.04).texture;
    scene.environment = envTexture;
    disposables.push(pm, envTexture);

    // 3. Lighting (Warm low sun ~24° elevation + soft sky/ground hemisphere)
    const hemi = new THREE.HemisphereLight('#a8d5ff', '#594833', 0.65);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight('#fff3d1', 1.4);
    sun.position.set(58, 32.5, 42);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 10, far: 220 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -0.0003;
    sun.shadow.normalBias = 0.025;
    scene.add(sun);

    // 4. Camera & OrbitControls
    const prefersReducedMotion = typeof window !== 'undefined' && Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const camera = new THREE.PerspectiveCamera(38, width / sceneHeight, 0.5, 1500);
    camera.position.set(62, 48, 72);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 6);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI * 0.46; // polar limit prevents going under ground
    controls.minDistance = 28;
    controls.maxDistance = 190;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.35;

    const stopAutoRotate = () => {
      controls.autoRotate = false;
    };
    renderer.domElement.addEventListener('pointerdown', stopAutoRotate, { once: true });

    // 5. World Geometry Construction
    const FARM = { w: 66, d: 46 };

    // Ground Plane with soft undulation outside farm
    const groundGeo = new THREE.PlaneGeometry(420, 420, 180, 180);
    groundGeo.rotateX(-Math.PI / 2);
    const p = groundGeo.attributes.position;
    const col = new Float32Array(p.count * 3);
    const gA = new THREE.Color('#5f8a35');
    const gB = new THREE.Color('#7da343');
    const gC = new THREE.Color('#4c7a2e');
    const cColor = new THREE.Color();

    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const dx = Math.max(0, Math.abs(x) - FARM.w / 2 - 6);
      const dz = Math.max(0, Math.abs(z - 6) - FARM.d / 2 - 6);
      const fall = Math.min(1, Math.hypot(dx, dz) / 30);
      const h = (vnoise(x * 0.03, z * 0.03) * 3.2 + vnoise(x * 0.11, z * 0.11) * 0.8) * fall - 0.15;
      p.setY(i, h);
      const n = vnoise(x * 0.07 + 11, z * 0.07 - 3);
      cColor.copy(gA).lerp(gB, n).lerp(gC, vnoise(x * 0.02, z * 0.02) * 0.5);
      col.set([cColor.r, cColor.g, cColor.b], i * 3);
    }
    groundGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    groundGeo.computeVertexNormals();
    const groundMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);
    disposables.push(groundGeo, groundMat);

    // 6. 6 Beds Coordinates Setup (2 rows x 3 columns)
    const BED = { w: 18, d: 15 };
    const bedCenters = [];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        bedCenters.push(new THREE.Vector3((c - 1) * (BED.w + 3), 0, r === 0 ? -4 : 15));
      }
    }

    // Pond with reflection
    const waterMat = new THREE.MeshStandardMaterial({
      color: '#3f6f7c',
      roughness: 0.06,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
    });
    const pond = new THREE.Mesh(new THREE.CircleGeometry(9, 48), waterMat);
    pond.rotation.x = -Math.PI / 2;
    pond.scale.set(1.5, 1, 1);
    pond.position.set(-44, 0.06, -14);
    pond.receiveShadow = true;
    scene.add(pond);
    disposables.push(waterMat, pond.geometry);

    // 5. Unified Static Scenery BufferGeometry (Village House, Veranda, Tubewell, Straw Stack, Pond Bank, Bed Bunds)
    const sceneryGeos = [];

    // House Base
    sceneryGeos.push(prep(new THREE.BoxGeometry(16, 0.8, 11).translate(0, 0.4, -26), '#9b8b77'));
    // House Body
    sceneryGeos.push(prep(new THREE.BoxGeometry(14, 5.2, 8).translate(0, 3.4, -26.8), '#e9dcc6'));

    // Corrugated Roof Slopes & Ribs
    const ribGeo = [];
    for (let i = 0; i < 34; i++) {
      const b = new THREE.BoxGeometry(0.16, 0.12, 6.6);
      b.translate(-8 + i * 0.485, 0, 0);
      ribGeo.push(b);
    }
    const ribs = mergeGeometries(ribGeo);
    [-1, 1].forEach((side) => {
      const sheet = new THREE.BoxGeometry(16.6, 0.12, 6.6);
      sheet.rotateX(side * 0.52);
      sheet.translate(0, 7.3, -26.8 + side * 2.9);
      sceneryGeos.push(prep(sheet, '#8a9499'));

      const r = ribs.clone();
      r.translate(0, 0.1, 0);
      r.rotateX(side * 0.52);
      r.translate(0, 7.3, -26.8 + side * 2.9);
      sceneryGeos.push(prep(r, '#8a9499'));
    });

    // Gable ends
    const tri = new THREE.Shape();
    tri.moveTo(-4, 0);
    tri.lineTo(4, 0);
    tri.lineTo(0, 2.6);
    tri.lineTo(-4, 0);
    [-7, 7].forEach((x) => {
      const g = new THREE.ShapeGeometry(tri);
      g.rotateY(Math.PI / 2);
      g.translate(x, 6, -26.8);
      sceneryGeos.push(prep(g, '#e9dcc6'));
    });

    // Veranda roof & posts
    const ver = new THREE.BoxGeometry(15, 0.12, 3.4);
    ver.rotateX(0.18);
    ver.translate(0, 5.1, -26 + 4.6);
    sceneryGeos.push(prep(ver, '#8a9499'));

    for (let i = 0; i < 5; i++) {
      const pPost = new THREE.CylinderGeometry(0.16, 0.18, 4.4, 8);
      pPost.translate(-6.8 + i * 3.4, 2.9, -26 + 6.0);
      sceneryGeos.push(prep(pPost, '#6b4a2f'));
    }

    // Door & Windows
    const door = new THREE.BoxGeometry(2, 3.4, 0.2);
    door.translate(0, 2.5, -26 + 3.25);
    sceneryGeos.push(prep(door, '#6b4a2f'));

    [-4.4, 4.4].forEach((x) => {
      const w = new THREE.BoxGeometry(2, 1.6, 0.2);
      w.translate(x, 3.6, -26 + 3.25);
      sceneryGeos.push(prep(w, '#2e3b40'));

      const fr = new THREE.BoxGeometry(2.3, 1.9, 0.12);
      fr.translate(x, 3.6, -26 + 3.18);
      sceneryGeos.push(prep(fr, '#6b4a2f'));
    });

    // Straw stack & pole
    const stack = new THREE.CylinderGeometry(0.4, 2.4, 4.6, 18);
    stack.translate(15, 2.3, -24);
    sceneryGeos.push(prep(stack, '#d1a85a'));

    const pole = new THREE.CylinderGeometry(0.08, 0.08, 6, 6);
    pole.translate(15, 3, -24);
    sceneryGeos.push(prep(pole, '#5b4630'));

    // Tubewell
    const pipe = new THREE.CylinderGeometry(0.22, 0.22, 2.2, 12);
    pipe.translate(-6, 1.1, -15);
    sceneryGeos.push(prep(pipe, '#2f6b4f'));

    const head = new THREE.BoxGeometry(0.6, 0.5, 1.2);
    head.translate(-6, 2.2, -14.7);
    sceneryGeos.push(prep(head, '#2f6b4f'));

    const pad = new THREE.CylinderGeometry(1.1, 1.1, 0.2, 20);
    pad.translate(-6, 0.1, -15);
    sceneryGeos.push(prep(pad, '#a9a39a'));

    // 5b. Dynamic Irrigation Water Tank (follows cumulative plan irrigation)
    const tankGroup = new THREE.Group();
    tankGroup.position.set(-10.5, 0, -15);

    const plinthGeo = new THREE.CylinderGeometry(1.4, 1.5, 0.6, 20);
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0x5a6578, roughness: 0.85 });
    const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    plinthMesh.position.y = 0.3;
    plinthMesh.castShadow = true;
    plinthMesh.receiveShadow = true;
    tankGroup.add(plinthMesh);

    const tankOuterGeo = new THREE.CylinderGeometry(1.2, 1.2, 2.8, 20, 1, true);
    const tankOuterMat = new THREE.MeshStandardMaterial({
      color: 0xa0b4c8,
      transparent: true,
      opacity: 0.32,
      roughness: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const tankOuterMesh = new THREE.Mesh(tankOuterGeo, tankOuterMat);
    tankOuterMesh.position.y = 0.6 + 1.4;
    tankGroup.add(tankOuterMesh);

    const tankWaterGeo = new THREE.CylinderGeometry(1.15, 1.15, 2.6, 20);
    const tankWaterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.85,
      roughness: 0.2,
      metalness: 0.1,
    });
    const tankWaterMesh = new THREE.Mesh(tankWaterGeo, tankWaterMat);
    tankWaterMesh.position.y = 0.6 + 1.3;
    tankGroup.add(tankWaterMesh);

    const tankLidGeo = new THREE.CylinderGeometry(1.25, 1.25, 0.1, 20);
    const tankLidMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const tankLidMesh = new THREE.Mesh(tankLidGeo, tankLidMat);
    tankLidMesh.position.y = 0.6 + 2.85;
    tankGroup.add(tankLidMesh);

    scene.add(tankGroup);
    disposables.push(plinthGeo, plinthMat, tankOuterGeo, tankOuterMat, tankWaterGeo, tankWaterMat, tankLidGeo, tankLidMat);

    // Pond bank ring
    const bankGeo = new THREE.RingGeometry(9, 10.4, 48);
    bankGeo.rotateX(-Math.PI / 2);
    bankGeo.scale(1.5, 1, 1);
    bankGeo.translate(-44, 0.04, -14);
    sceneryGeos.push(prep(bankGeo, '#7a6142'));

    // Raised earthen bunds (আইল) across all 6 beds
    const bw = 0.7;
    const bh = 0.55;
    bedCenters.forEach((c) => {
      [
        [0, -BED.d / 2, BED.w + bw, bw],
        [0, BED.d / 2, BED.w + bw, bw],
        [-BED.w / 2, 0, bw, BED.d],
        [BED.w / 2, 0, bw, BED.d],
      ].forEach((bConfig) => {
        const bGeo = new THREE.BoxGeometry(bConfig[2], bh, bConfig[3]);
        bGeo.translate(c.x + bConfig[0], bh / 2, c.z + bConfig[1]);
        sceneryGeos.push(prep(bGeo, '#7d6143'));
      });
    });

    const mergedSceneryGeo = mergeGeometries(sceneryGeos);
    const mergedSceneryMesh = new THREE.Mesh(mergedSceneryGeo, vcMat(0.85));
    mergedSceneryMesh.castShadow = true;
    mergedSceneryMesh.receiveShadow = true;
    scene.add(mergedSceneryMesh);
    disposables.push(mergedSceneryGeo, mergedSceneryMesh.material, ribs);

    // Trees (Round trees + Coconut palms, instanced)
    const crownParts = [];
    for (let i = 0; i < 5; i++) {
      const s = new THREE.IcosahedronGeometry(1.6 + rnd() * 0.6, 1);
      s.translate((rnd() - 0.5) * 1.8, rnd() * 1.2, (rnd() - 0.5) * 1.8);
      crownParts.push(prep(s, i % 2 ? '#3f7a2c' : '#4e8a33'));
    }
    const crown = mergeGeometries(crownParts);
    crown.translate(0, 5.2, 0);
    const trunk = prep(new THREE.CylinderGeometry(0.28, 0.42, 4.6, 7).translate(0, 2.3, 0), '#5c4330');
    const treeGeo = mergeGeometries([trunk, crown]);

    const treeSpots = [];
    for (let i = 0; i < 46; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 46 + rnd() * 60;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r * 0.8 + 6;
      if (Math.abs(x + 44) < 16 && Math.abs(z + 14) < 12) continue;
      treeSpots.push([x, z, 0.8 + rnd() * 0.7]);
    }
    [
      [-14, -30, 1.1],
      [14, -32, 1],
      [-22, -20, 1.2],
      [24, -18, 0.9],
      [-36, 30, 1.1],
      [38, 32, 1],
    ].forEach((s) => treeSpots.push(s));

    const treeInstanced = new THREE.InstancedMesh(treeGeo, vcMat(0.9), treeSpots.length);
    const mTree = new THREE.Matrix4();
    const qTree = new THREE.Quaternion();
    const eTree = new THREE.Euler();
    treeSpots.forEach((s, i) => {
      eTree.set(0, rnd() * 6, 0);
      qTree.setFromEuler(eTree);
      mTree.compose(
        new THREE.Vector3(s[0], -0.1, s[1]),
        qTree,
        new THREE.Vector3(s[2], s[2] * (0.9 + rnd() * 0.3), s[2])
      );
      treeInstanced.setMatrixAt(i, mTree);
    });
    treeInstanced.castShadow = true;
    treeInstanced.receiveShadow = true;
    scene.add(treeInstanced);
    disposables.push(treeGeo, treeInstanced.material);

    // Coconut Palms
    const palmParts = [];
    const seg = 8;
    for (let i = 0; i < seg; i++) {
      const c = new THREE.CylinderGeometry(0.26, 0.3, 1.4, 6);
      c.translate(Math.sin((i / seg) * 1.2) * 1.4 * (i / seg), 0.7 + i * 1.35, 0);
      palmParts.push(prep(c, '#7a6248'));
    }
    const topY = seg * 1.35;
    const topX = Math.sin(1.2) * 1.4;
    for (let k = 0; k < 9; k++) {
      const leaf = new THREE.PlaneGeometry(0.9, 5.2, 1, 4);
      const lp = leaf.attributes.position;
      for (let i = 0; i < lp.count; i++) {
        const y = lp.getY(i) + 2.6;
        lp.setZ(i, -0.06 * y * y);
        lp.setY(i, y * 0.9);
      }
      leaf.rotateX(-0.6);
      leaf.rotateY((k / 9) * Math.PI * 2);
      leaf.translate(topX, topY, 0);
      palmParts.push(prep(leaf, k % 2 ? '#4a8a2a' : '#3b7a24'));
    }
    const palmGeo = mergeGeometries(palmParts);
    const palmMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide });
    const palmPts = [
      [-26, -30],
      [22, -34],
      [-48, -2],
      [-38, -26],
      [44, -6],
      [30, -40],
      [-10, -40],
    ];
    const palmInstanced = new THREE.InstancedMesh(palmGeo, palmMat, palmPts.length);
    palmPts.forEach((pt, i) => {
      eTree.set(0, rnd() * 6, 0);
      qTree.setFromEuler(eTree);
      mTree.compose(
        new THREE.Vector3(pt[0], 0, pt[1]),
        qTree,
        new THREE.Vector3(1, 1, 1).multiplyScalar(0.9 + rnd() * 0.3)
      );
      palmInstanced.setMatrixAt(i, mTree);
    });
    palmInstanced.castShadow = true;
    scene.add(palmInstanced);
    disposables.push(palmGeo, palmMat);

    // Bamboo Fence
    const bamboo = prep(new THREE.CylinderGeometry(0.09, 0.1, 1.5, 5).translate(0, 0.75, 0), '#b39a5e');
    const rail = prep(new THREE.BoxGeometry(2.2, 0.08, 0.08).translate(0, 1.0, 0), '#a48b52');
    const fenceUnit = mergeGeometries([bamboo, rail, rail.clone().translate(0, -0.45, 0)]);
    const fencePosts = [];
    const x0 = -FARM.w / 2 - 2;
    const x1 = FARM.w / 2 + 2;
    const z0 = 6 - FARM.d / 2 - 2;
    const z1 = 6 + FARM.d / 2 + 2;
    for (let x = x0; x <= x1; x += 2.2) fencePosts.push([x, z1, 0]);
    for (let z = z0 + 6; z <= z1; z += 2.2) {
      fencePosts.push([x0, z, Math.PI / 2]);
      fencePosts.push([x1, z, Math.PI / 2]);
    }
    const fenceInstanced = new THREE.InstancedMesh(fenceUnit, vcMat(0.9), fencePosts.length);
    fencePosts.forEach((fp, i) => {
      qTree.setFromAxisAngle(new THREE.Vector3(0, 1, 0), fp[2]);
      mTree.compose(new THREE.Vector3(fp[0], 0, fp[1]), qTree, new THREE.Vector3(1, 1, 1));
      fenceInstanced.setMatrixAt(i, mTree);
    });
    fenceInstanced.castShadow = true;
    scene.add(fenceInstanced);
    disposables.push(fenceUnit, fenceInstanced.material);

    // Earthen Paths
    const pathMat = new THREE.MeshStandardMaterial({ color: '#b59c76', roughness: 1 });
    const pathCenter = new THREE.Mesh(new THREE.BoxGeometry(3, 0.12, 46), pathMat);
    pathCenter.position.set(0, 0.06, 5.5);
    pathCenter.receiveShadow = true;
    scene.add(pathCenter);

    const pathCross = new THREE.Mesh(new THREE.BoxGeometry(66, 0.12, 3), pathMat);
    pathCross.position.set(0, 0.06, 5.5);
    pathCross.receiveShadow = true;
    scene.add(pathCross);

    const pathLane = new THREE.Mesh(new THREE.BoxGeometry(3, 0.12, 12), pathMat);
    pathLane.position.set(0, 0.06, -17);
    pathLane.receiveShadow = true;
    scene.add(pathLane);
    disposables.push(pathMat);

    // 6. 6 Beds (2 rows x 3 columns) Soil, Crop Meshes & Water
    const soilMat = new THREE.MeshStandardMaterial({ color: '#6b4f36', roughness: 1 });
    const wetSoilMat = new THREE.MeshStandardMaterial({ color: '#4a3626', roughness: 0.7 });
    const greySoilMat = new THREE.MeshStandardMaterial({ color: '#323a35', roughness: 0.95 });
    const drySoilMat = new THREE.MeshStandardMaterial({ color: '#bba88e', roughness: 1 });
    const salineSoilMat = new THREE.MeshStandardMaterial({ color: '#e5ecf0', roughness: 0.92 });
    const cropMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, side: THREE.DoubleSide });
    disposables.push(soilMat, wetSoilMat, greySoilMat, cropMat, drySoilMat, salineSoilMat);

    // Compile crop geometries
    const G = buildCropGeometries();
    Object.values(G).forEach((geo) => disposables.push(geo));

    function geoFor(geoKey, seasonKind) {
      if (geoKey === 'rice') return seasonKind === 'k2' ? G.rice : G.riceRipe;
      if (geoKey === 'riceRipe') return G.riceRipe;
      if (geoKey === 'aus') return G.aus;
      if (geoKey === 'potato') return G.potato;
      if (geoKey === 'maize') return G.maize;
      if (geoKey === 'tomato') return G.tomato;
      if (geoKey === 'sunflower') return G.sunflower;
      if (geoKey === 'generic') return G.generic;
      if (G[geoKey]) return G[geoKey];
      return G.weed;
    }

    // Build the 6 Bed objects
    const bedObjects = bedCenters.map((c, i) => {
      const g = new THREE.Group();
      g.position.copy(c);

      // Ploughed soil with furrow undulations
      const sg = new THREE.PlaneGeometry(BED.w, BED.d, 60, 40);
      sg.rotateX(-Math.PI / 2);
      const sp = sg.attributes.position;
      for (let k = 0; k < sp.count; k++) {
        const zP = sp.getZ(k);
        const xP = sp.getX(k);
        sp.setY(k, 0.18 + Math.sin(zP * 2.6) * 0.07 + vnoise(xP * 0.6, zP * 0.6) * 0.05);
      }
      sg.computeVertexNormals();
      const soil = new THREE.Mesh(sg, soilMat);
      soil.receiveShadow = true;
      g.add(soil);

      // Standing water layer (for rice paddies)
      const waterLayer = new THREE.Mesh(new THREE.PlaneGeometry(BED.w - 0.2, BED.d - 0.2), waterMat);
      waterLayer.rotation.x = -Math.PI / 2;
      waterLayer.position.y = 0.34;
      waterLayer.visible = false;
      g.add(waterLayer);

      // Raycast pick mesh
      const pick = new THREE.Mesh(new THREE.BoxGeometry(BED.w, 1.2, BED.d), new THREE.MeshBasicMaterial({ visible: false }));
      pick.position.y = 0.6;
      pick.userData = { bedIndex: i };
      g.add(pick);

      // Selection outline (glowing yellow outline when active)
      const outlineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(BED.w + 1.2, 0.9, BED.d + 1.2));
      const outlineMat = new THREE.LineBasicMaterial({
        color: '#ffe680',
        transparent: true,
        opacity: i === activeIndex ? 0.95 : 0,
        linewidth: 2,
      });
      const edges = new THREE.LineSegments(outlineGeo, outlineMat);
      edges.position.y = 0.45;
      g.add(edges);

      scene.add(g);
      return {
        index: i,
        group: g,
        water: waterLayer,
        soil,
        pick,
        edges,
        cropKey: null,
        inst: [],
        grow: 1,
      };
    });

    // ST4: Flood Water Mesh & Rain Particles for Weather Stress Simulation
    const floodGeo = new THREE.PlaneGeometry(FARM.w + 14, FARM.d + 14);
    floodGeo.rotateX(-Math.PI / 2);
    const floodMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#44523d'),
      roughness: 0.18,
      metalness: 0.08,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    });
    const floodWaterMesh = new THREE.Mesh(floodGeo, floodMat);
    floodWaterMesh.position.set(0, 0.85, 6);
    floodWaterMesh.visible = false;
    scene.add(floodWaterMesh);
    disposables.push(floodGeo, floodMat);

    const rainCount = 1200;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    for (let rIdx = 0; rIdx < rainCount; rIdx++) {
      rainPos[rIdx * 3] = (rnd() - 0.5) * (FARM.w + 24);
      rainPos[rIdx * 3 + 1] = rnd() * 45;
      rainPos[rIdx * 3 + 2] = (rnd() - 0.5) * (FARM.d + 24) + 6;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x9dc0e8,
      size: 0.35,
      transparent: true,
      opacity: 0.65,
    });
    const rainPoints = new THREE.Points(rainGeo, rainMat);
    rainPoints.visible = false;
    scene.add(rainPoints);
    disposables.push(rainGeo, rainMat);

    const dustCount = 450;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let dIdx = 0; dIdx < dustCount; dIdx++) {
      dustPos[dIdx * 3] = (rnd() - 0.5) * (FARM.w + 12);
      dustPos[dIdx * 3 + 1] = rnd() * 16 + 0.5;
      dustPos[dIdx * 3 + 2] = (rnd() - 0.5) * (FARM.d + 12) + 6;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xd2b48c,
      size: 0.32,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    dustPoints.visible = false;
    scene.add(dustPoints);
    disposables.push(dustGeo, dustMat);

    const stressTransition = {
      active: false,
      elapsed: 0,
      duration: 0.6,
    };

    // 7. Planting & Animation Helpers
    const _m = new THREE.Matrix4();
    const _q = new THREE.Quaternion();
    const _e = new THREE.Euler();
    const _v = new THREE.Vector3();
    const _s = new THREE.Vector3();

    function setGrowth(b, t) {
      const k = prefersReducedMotion ? 1 : t < 1 ? 1 - Math.pow(1 - t, 3) : 1;
      b.inst.forEach((im) => {
        const base = im.userData.base;
        const y0 = b.water.visible ? 0.2 : 0.18;
        base.forEach((pPoint, idx) => {
          _e.set(0, pPoint.r, 0);
          _q.setFromEuler(_e);
          _v.set(pPoint.x, y0, pPoint.z);
          const sVal = pPoint.s * Math.max(0.001, k);
          _s.set(sVal, sVal, sVal);
          _m.compose(_v, _q, _s);
          im.setMatrixAt(idx, _m);
        });
        im.instanceMatrix.needsUpdate = true;
      });
    }

    const seasonKinds = ['rabi', 'k1', 'k2', 'rabi', 'k1', 'k2'];

    function plantBed(bedIdx, cropName, forceRebuild = false) {
      const b = bedObjects[bedIdx];
      if (!b) return;
      const currentBeds = bedsRef.current || [];
      const numBeds = currentBeds.length === 3 ? 3 : 6;
      if (bedIdx >= numBeds) {
        b.group.visible = false;
        b.soil.visible = false;
        b.pick.visible = false;
        b.inst.forEach((m) => {
          b.group.remove(m);
          m.geometry.dispose();
        });
        b.inst = [];
        b.water.visible = false;
        return;
      }
      b.group.visible = true;
      b.soil.visible = true;
      b.pick.visible = true;

      const seasonKind = seasonKinds[bedIdx];
      const geoKey = mapCropToGeoKey(cropName, seasonKind);

      if (!forceRebuild && b.cropKey === geoKey && b.inst.length > 0) return;

      // Remove existing crop mesh
      b.inst.forEach((m) => {
        b.group.remove(m);
        m.geometry.dispose();
      });
      b.inst = [];

      b.cropKey = geoKey;
      const isRice = geoKey === 'rice' || geoKey === 'riceRipe' || geoKey === 'aus';
      const isFallow = geoKey === 'fallow';

      b.water.visible = isRice;
      b.soil.material = isRice ? wetSoilMat : soilMat;

      const geo = geoFor(geoKey, seasonKind);
      const activeLowLod = isLowLod || isLowLodRef.current;
      const spacing = (SPACING[geoKey] || 0.7) * (activeLowLod ? 1.25 : 1.0);
      const cols = Math.floor((BED.w - 1.6) / spacing);
      const rows = Math.floor((BED.d - 1.6) / spacing);

      const list = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (isFallow && rnd() > 0.35) continue;
          const x = -((cols - 1) * spacing) / 2 + c * spacing + (rnd() - 0.5) * spacing * (isRice ? 0.15 : 0.45);
          const z = -((rows - 1) * spacing) / 2 + r * spacing + (rnd() - 0.5) * spacing * (isRice ? 0.15 : 0.45);
          list.push([x, z]);
        }
      }

      const im = new THREE.InstancedMesh(geo, cropMat, list.length);
      im.castShadow = !isFallow;
      im.receiveShadow = false;
      im.userData.base = list.map((pPoint) => ({
        x: pPoint[0],
        z: pPoint[1],
        s: 0.8 + rnd() * 0.4,
        r: rnd() * 6.28,
      }));

      b.group.add(im);
      b.inst.push(im);
      b.grow = prefersReducedMotion ? 1 : 0;
      setGrowth(b, b.grow);
    }

    // Initial planting of all 6 beds
    for (let i = 0; i < 6; i++) {
      const bedData = beds[i] || {};
      const cropName = bedData.crop || bedData.crop_name || bedData.name || (i % 2 === 0 ? 'Mustard' : 'Rice');
      plantBed(i, cropName);
      setGrowth(bedObjects[i], 1);
      bedObjects[i].grow = 1;
    }

    // 8. Raycasting Selection Handler
    const raycaster = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    let downPos = null;

    const onPointerDown = (e) => {
      downPos = [e.clientX, e.clientY];
    };

    const onPointerUp = (e) => {
      if (!downPos) return;
      if (Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]) > 8) return;

      const rect = renderer.domElement.getBoundingClientRect();
      ptr.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ptr, camera);
      const hit = raycaster.intersectObjects(bedObjects.map((b) => b.pick))[0];
      if (hit && typeof hit.object.userData.bedIndex === 'number') {
        const hitIdx = hit.object.userData.bedIndex;
        if (onBedClick) onBedClick(hitIdx, beds[hitIdx]);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // 9. Camera Presets Application
    const applyCameraPreset = (preset, targetBedIdx = activeIndex) => {
      const is3Bed = (bedsRef.current && bedsRef.current.length === 3);
      if (preset === 'top') {
        if (is3Bed) {
          camera.position.set(0, 80, -3.99);
          controls.target.set(0, 0, -4);
        } else {
          camera.position.set(0, 95, 6.01);
          controls.target.set(0, 0, 6);
        }
      } else if (preset === 'close') {
        const targetBed = bedCenters[targetBedIdx] || bedCenters[0];
        camera.position.set(targetBed.x + 18, 14, targetBed.z + 18);
        controls.target.set(targetBed.x, 0, targetBed.z);
      } else {
        // default 'iso'
        if (is3Bed) {
          camera.position.set(50, 38, 50);
          controls.target.set(0, 0, -4);
        } else {
          camera.position.set(62, 48, 72);
          controls.target.set(0, 0, 6);
        }
      }
      controls.update();
    };

    applyCameraPreset(currentPreset, activeIndex);

    // 10. Floating 2D Bed Labels Projection
    const labelDoms = bedObjects.map(() => {
      const el = document.createElement('div');
      el.className = 'farm3d-bed-label';
      el.style.position = 'absolute';
      el.style.transform = 'translate(-50%, -100%)';
      el.style.font = '600 12px "Hind Siliguri", system-ui, sans-serif';
      el.style.color = '#ffffff';
      el.style.background = 'rgba(20, 30, 22, 0.88)';
      el.style.padding = '3px 8px';
      el.style.borderRadius = '8px';
      el.style.whiteSpace = 'nowrap';
      el.style.pointerEvents = 'none';
      el.style.zIndex = '4';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      if (labelsContainer) labelsContainer.appendChild(el);
      return el;
    });

    const updateLabels = () => {
      if (!labelsContainer) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      const currentBeds = bedsRef.current || [];
      const currentLang = langRef.current || 'bn';

      bedObjects.forEach((b, i) => {
        const labelPos = b.group.position.clone();
        labelPos.y = 4.2;
        labelPos.z -= BED.d / 2 - 1;
        labelPos.project(camera);

        const el = labelDoms[i];
        if (!el) return;

        const isVisible = labelPos.z < 1 && labelPos.x >= -1.1 && labelPos.x <= 1.1 && labelPos.y >= -1.1 && labelPos.y <= 1.1;
        el.style.display = isVisible ? 'block' : 'none';
        if (isVisible) {
          el.style.left = `${((labelPos.x + 1) / 2) * w}px`;
          el.style.top = `${((1 - labelPos.y) / 2) * h}px`;

          const bedData = currentBeds[i] || {};
          const numBeds = currentBeds.length === 3 ? 3 : 6;
          if (i >= numBeds) {
            el.style.display = 'none';
            return;
          }

          // Timeline harvest tag popup: "✓ {yield} maund/bigha"
          if (isTimelineActiveRef.current && (b.timelineStage === 'harvested' || b.timelineStage === 'harvest')) {
            const yieldVal = bedData.yieldMaundBigha != null
              ? bedData.yieldMaundBigha
              : (bedData.dynamicYieldTHa != null ? Number((bedData.dynamicYieldTHa * 3.585).toFixed(1)) : (i % 2 === 0 ? '5.2' : '15.4'));
            const yieldDigits = currentLang === 'bn' ? toBanglaDigits(yieldVal) : yieldVal;
            const yieldUnit = currentLang === 'bn' ? 'মন/বিঘা' : 'maund/bigha';
            el.innerHTML = `<div style="display:flex;align-items:center;gap:4px;color:#C8F169;font-weight:800;font-size:11.5px;padding:3px 7px;text-shadow:0 0 8px rgba(200,241,105,0.7)">
              <span>✓</span> <span>${yieldDigits} ${yieldUnit}</span>
            </div>`;
            el.style.background = 'rgba(15, 30, 18, 0.94)';
            el.style.border = '1px solid #C8F169';
            el.style.boxShadow = '0 0 12px rgba(200, 241, 105, 0.5)';
            return;
          }

          let cp = bedData.cropLabel || (bedData.crop ? cropLabel(bedData.crop, currentLang) : null) || (CROPS_META[b.cropKey] ? CROPS_META[b.cropKey][currentLang === 'bn' ? 'bn' : 'en'] : b.cropKey);
          if (i % 3 === 2 && (String(cp).toLowerCase().includes('rice') || String(cp).includes('ধান'))) {
            cp = currentLang === 'bn' ? 'আমন ধান' : 'Aman Rice';
          }
          const irrigVal = bedData.irrigation_mm != null ? bedData.irrigation_mm : (bedData.waterDepthMm != null ? Math.round(bedData.waterDepthMm) : null);

          let symbolsHtml = '';
          if (irrigVal != null && irrigVal > 0) {
            const dropSize = Math.max(10, Math.min(15, 10 + Math.round(irrigVal / 70)));
            symbolsHtml += `<span title="${currentLang === 'bn' ? `সেচ ${irrigVal} মিমি` : `Irrigation ${irrigVal} mm`}" style="color:#5be3ff;font-size:${dropSize}px;line-height:1;font-weight:700">W</span>`;
          }
          if (bedData.isLegume || CROPS_META[b.cropKey]?.isLegume) {
            symbolsHtml += `<span title="${currentLang === 'bn' ? 'মাটিতে নাইট্রোজেন দেয়' : 'Biological Nitrogen Fixer'}" style="color:#4ade80;font-size:11px;font-weight:800">N</span>`;
          }
          if (bedData.stress?.heat || bedData.heatRisk === 'high') {
            symbolsHtml += `<span title="${currentLang === 'bn' ? 'ফুল আসার সময় ৩৫°C+ গরম ঝুঁকি' : 'Heat stress risk'}" style="color:#f5b04c;font-size:12px;font-weight:700">H</span>`;
          }
          if (bedData.stress?.drought || bedData.droughtRisk === 'high') {
            symbolsHtml += `<span title="${currentLang === 'bn' ? 'খরা ঝুঁকি' : 'Drought risk'}" style="color:#f5b04c;font-size:12px;font-weight:700">D</span>`;
          }
          if (bedData.stress?.rain || bedData.rainRisk === 'high') {
            symbolsHtml += `<span title="${currentLang === 'bn' ? 'অতিবৃষ্টি ঝুঁকি' : 'Heavy rain risk'}" style="color:#5be3ff;font-size:12px;font-weight:700">R</span>`;
          }
          if (bedData.stress?.cold || bedData.coldRisk === 'high') {
            symbolsHtml += `<span title="${currentLang === 'bn' ? 'শৈত্যপ্রবাহ ঝুঁকি' : 'Cold stress risk'}" style="color:#a78bfa;font-size:12px;font-weight:700">C</span>`;
          }

          if (weatherRef.current?.isPostStress && bedLossPctsRef.current) {
            const lossVal = Number(bedLossPctsRef.current[i] || 0);
            if (lossVal > 0) {
              const bColor = lossVal > 30 ? '#ef4444' : lossVal > 10 ? '#f59e0b' : '#22c55e';
              const bBg = lossVal > 30 ? 'rgba(239, 68, 68, 0.28)' : lossVal > 10 ? 'rgba(245, 158, 11, 0.28)' : 'rgba(34, 197, 94, 0.28)';
              const lossDigits = currentLang === 'bn' ? toBanglaDigits(Math.round(lossVal)) : Math.round(lossVal);
              symbolsHtml += `<span style="background:${bBg};color:${bColor};border:1px solid ${bColor};border-radius:4px;padding:1px 5px;font-size:10px;font-weight:800;margin-left:4px">−${lossDigits}%</span>`;
            }
          }

          const isDone = Boolean(bedData.isCompleted);
          const isChg = Boolean(bedData.isChanged);
          if (isDone) {
            el.style.background = 'rgba(31, 110, 60, 0.92)';
            el.style.border = '1px solid #6fd28f';
          } else if (isChg) {
            el.style.background = 'rgba(196, 104, 24, 0.92)';
            el.style.border = '1px solid #f0a14a';
          } else if (weatherRef.current?.isPostStress && bedLossPctsRef.current && bedLossPctsRef.current[i] > 0) {
            const lVal = Number(bedLossPctsRef.current[i] || 0);
            if (lVal > 30) {
              el.style.background = 'rgba(70, 20, 20, 0.94)';
              el.style.border = '1px solid #ef4444';
            } else if (lVal > 10) {
              el.style.background = 'rgba(65, 45, 15, 0.94)';
              el.style.border = '1px solid #f59e0b';
            } else {
              el.style.background = 'rgba(20, 30, 22, 0.88)';
              el.style.border = '1px solid rgba(255, 255, 255, 0.15)';
            }
          } else {
            el.style.background = 'rgba(20, 30, 22, 0.88)';
            el.style.border = '1px solid rgba(255, 255, 255, 0.15)';
          }

          let prefix = '';
          if (isDone) prefix = '<span style="color:#6fd28f;font-weight:800;margin-right:2px">✓</span> ';
          else if (isChg) prefix = '<span style="color:#f0a14a;font-weight:800;margin-right:2px">⟳</span> ';

          let detailStr = '';
          if (weatherRef.current?.event) {
            // Climate Stress Test visualizer mode
            if (weatherRef.current?.isPostStress) {
              const lVal = Number(bedLossPctsRef.current?.[i] || 0);
              if (lVal > 0) {
                const lossDigits = currentLang === 'bn' ? toBanglaDigits(Math.round(lVal)) : Math.round(lVal);
                detailStr = ` · −${lossDigits}%`;
              } else {
                detailStr = currentLang === 'bn' ? ' · ঠিক আছে' : ' · OK';
              }
            } else {
              detailStr = currentLang === 'bn' ? ' · ঠিক আছে' : ' · OK';
            }
          } else {
            const yieldStr = bedData.yieldLabel ? ` · ${bedData.yieldLabel}` : '';
            const waterStr = isDone
              ? (bedData.water_reported != null && bedData.water_reported > 0 ? ` · ${bedData.water_reported} ${currentLang === 'bn' ? 'মিমি' : 'mm'}` : '')
              : (irrigVal != null && irrigVal > 0 ? ` · ${irrigVal} ${currentLang === 'bn' ? 'মিমি' : 'mm'}` : (currentLang === 'bn' ? ' · বৃষ্টি-নির্ভর' : ' · Rainfed'));
            detailStr = isDone ? (yieldStr || waterStr) : waterStr;
          }

          if (isTimelineActiveRef.current && b.timelineStage) {
            if (b.timelineStage === 'bare') detailStr = currentLang === 'bn' ? ' · পতিত জমি' : ' · Bare soil';
            else if (b.timelineStage === 'sowing') detailStr = currentLang === 'bn' ? ' · বপন' : ' · Sowing';
            else if (b.timelineStage === 'growing') detailStr = currentLang === 'bn' ? ' · বৃদ্ধি' : ' · Growing';
            else if (b.timelineStage === 'flowering') detailStr = currentLang === 'bn' ? ' · ফুল ফোটা' : ' · Flowering';
            else if (b.timelineStage === 'mature') detailStr = currentLang === 'bn' ? ' · পাকা ফসল' : ' · Mature';
            else if (b.timelineStage === 'upcoming') detailStr = currentLang === 'bn' ? ' · প্রস্তুত জমি' : ' · Prepared';
          }

          el.innerHTML = `<span style="display:inline-flex;align-items:center;gap:4px">${prefix}<span class="crop-name-label">${cp}</span>${symbolsHtml ? `<span style="display:inline-flex;align-items:center;gap:3px;margin-left:2px">${symbolsHtml}</span>` : ''}<span>${detailStr}</span></span>`;
        }
      });
    };

    // 11. Render Loop & Idle Throttling (On-demand rendering for >=40 FPS target)
    let animationFrameId = null;
    let isLoopRunning = false;
    let needsRender = true;
    let idleFrames = 0;
    let lowFpsConsecutiveSeconds = 0;
    const clock = new THREE.Clock();
    let lastRenderStatsTime = performance.now();
    let frameCount = 0;

    const requestRender = () => {
      needsRender = true;
      idleFrames = 0;
      if (!isLoopRunning) {
        isLoopRunning = true;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const render = () => {
      const dt = Math.min(clock.getDelta(), 0.05);

      // Growth interpolation
      let isAnimatingGrowth = false;
      bedObjects.forEach((b) => {
        if (b.grow < 1) {
          b.grow = Math.min(1, b.grow + dt * 1.25);
          setGrowth(b, b.grow);
          isAnimatingGrowth = true;
        }
      });

      // Rain animation when flood stress is visible
      if (rainPoints.visible) {
        const pArr = rainGeo.attributes.position.array;
        for (let rI = 0; rI < rainCount; rI++) {
          pArr[rI * 3 + 1] -= dt * 38;
          if (pArr[rI * 3 + 1] < 0) pArr[rI * 3 + 1] = 42;
        }
        rainGeo.attributes.position.needsUpdate = true;
        needsRender = true;
      }

      // Dust animation when drought stress is visible
      if (dustPoints.visible) {
        const dArr = dustGeo.attributes.position.array;
        for (let dI = 0; dI < dustCount; dI++) {
          dArr[dI * 3] += dt * 4;
          if (dArr[dI * 3] > (FARM.w / 2 + 12)) dArr[dI * 3] = -(FARM.w / 2 + 12);
        }
        dustGeo.attributes.position.needsUpdate = true;
        needsRender = true;
      }

      // Smooth 0.6s stress transition interpolation
      if (stressTransition.active) {
        stressTransition.elapsed += dt;
        const progress = Math.min(1.0, stressTransition.elapsed / stressTransition.duration);
        const ease = progress * (2 - progress); // Ease-out

        bedObjects.forEach((b) => {
          if (b.__targetScaleY != null && b.__startScaleY != null) {
            b.group.scale.y = b.__startScaleY + (b.__targetScaleY - b.__startScaleY) * ease;
          }
          if (b.__targetRotZ != null && b.__startRotZ != null) {
            b.group.rotation.z = b.__startRotZ + (b.__targetRotZ - b.__startRotZ) * ease;
          }
        });

        if (floodWaterMesh.visible && floodWaterMesh.__targetY != null && floodWaterMesh.__startY != null) {
          floodWaterMesh.position.y = floodWaterMesh.__startY + (floodWaterMesh.__targetY - floodWaterMesh.__startY) * ease;
        }

        if (pond && pond.__targetY != null && pond.__startY != null) {
          pond.position.y = pond.__startY + (pond.__targetY - pond.__startY) * ease;
        }

        needsRender = true;
        if (progress >= 1.0) {
          stressTransition.active = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      frameCount++;
      const now = performance.now();
      if (now - lastRenderStatsTime >= 1000) {
        const measuredFps = Math.round((frameCount * 1000) / (now - lastRenderStatsTime));
        const calls = renderer.info.render.calls;
        const triangles = renderer.info.render.triangles;
        setInfoStats({ calls, triangles, fps: measuredFps });
        if (onRendererInfo) {
          onRendererInfo({ calls, triangles, fps: measuredFps });
        }
        if (measuredFps < 40) {
          lowFpsConsecutiveSeconds++;
          if (lowFpsConsecutiveSeconds >= 2 && !isLowLodRef.current) {
            isLowLodRef.current = true;
            setIsLowLod(true);
            if (treeInstanced) treeInstanced.castShadow = false;
            renderer.shadowMap.needsUpdate = true;
            console.log('[FarmScene3D] Auto low-detail triggered: FPS < 40 for 2s');
          }
        } else {
          lowFpsConsecutiveSeconds = 0;
        }
        frameCount = 0;
        lastRenderStatsTime = now;
      }

      if (isAnimatingGrowth || needsRender) {
        needsRender = false;
        idleFrames = 0;
        animationFrameId = requestAnimationFrame(render);
      } else {
        idleFrames++;
        if (idleFrames < 3) {
          animationFrameId = requestAnimationFrame(render);
        } else {
          isLoopRunning = false;
          animationFrameId = null;
        }
      }
    };

    controls.addEventListener('change', () => {
      updateLabels();
      requestRender();
    });
    container.addEventListener('pointermove', requestRender);
    container.addEventListener('pointerdown', requestRender);
    requestRender();

    // 12. Resize Listener
    const onResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || 800;
      const newHeight = height || 440;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      updateLabels();
      requestRender();
    };
    window.addEventListener('resize', onResize);

    // ST4: Physical Weather & Hazard Stress Application (SF3)
    function applyWeatherStress(w, lossPcts) {
      const isPost = Boolean(w && w.isPostStress);
      const event = w?.event || 'heatwave';
      const intensity = w?.intensity || 'moderate';

      if (!isPost) {
        hemi.color.set('#a8d5ff');
        hemi.groundColor.set('#594833');
        sun.color.set('#fff3d1');
        scene.fog.color.set('#d7e3dc');
        floodWaterMesh.visible = false;
        rainPoints.visible = false;
        dustPoints.visible = false;
        if (pond) {
          pond.__startY = pond.position.y;
          pond.__targetY = 0.06;
          pond.scale.set(1.5, 1, 1);
        }
      } else {
        if (event === 'heatwave') {
          hemi.color.set('#ff9e42');
          hemi.groundColor.set('#8c5e32');
          sun.color.set('#ff7728');
          scene.fog.color.set('#f4dfce');
          floodWaterMesh.visible = false;
          rainPoints.visible = false;
          dustPoints.visible = false;
          if (pond) {
            pond.__startY = pond.position.y;
            pond.__targetY = 0.06;
            pond.scale.set(1.5, 1, 1);
          }
        } else if (event === 'coldwave') {
          hemi.color.set('#b0d0f5');
          hemi.groundColor.set('#485b6e');
          sun.color.set('#d8ebff');
          scene.fog.color.set('#c4d9ee');
          floodWaterMesh.visible = false;
          rainPoints.visible = false;
          dustPoints.visible = false;
          if (pond) {
            pond.__startY = pond.position.y;
            pond.__targetY = 0.06;
            pond.scale.set(1.5, 1, 1);
          }
        } else if (event === 'flood') {
          hemi.color.set('#6a7872');
          hemi.groundColor.set('#4a5246');
          sun.color.set('#8fa194');
          scene.fog.color.set('#68756e');
          floodWaterMesh.visible = true;
          const targetY = intensity === 'severe' ? 1.35 : intensity === 'mild' ? 0.58 : 0.95;
          floodWaterMesh.__startY = floodWaterMesh.position.y;
          floodWaterMesh.__targetY = targetY;
          rainPoints.visible = true;
          dustPoints.visible = false;
          if (pond) {
            pond.__startY = pond.position.y;
            pond.__targetY = 0.06;
            pond.scale.set(1.5, 1, 1);
          }
        } else if (event === 'drought') {
          hemi.color.set('#c9beaa');
          hemi.groundColor.set('#7a6e5a');
          sun.color.set('#fff5db');
          scene.fog.color.set('#ded7c5');
          floodWaterMesh.visible = false;
          rainPoints.visible = false;
          dustPoints.visible = true;
          if (pond) {
            pond.__startY = pond.position.y;
            pond.__targetY = -0.22;
            pond.scale.set(1.05, 1, 0.7);
          }
        } else if (event === 'salinity') {
          hemi.color.set('#b0c0c7');
          hemi.groundColor.set('#596366');
          sun.color.set('#f0f5f7');
          scene.fog.color.set('#d4dee0');
          floodWaterMesh.visible = false;
          rainPoints.visible = false;
          dustPoints.visible = false;
          if (pond) {
            pond.__startY = pond.position.y;
            pond.__targetY = 0.06;
            pond.scale.set(1.5, 1, 1);
          }
        }
      }

      bedObjects.forEach((b, i) => {
        const loss = Array.isArray(lossPcts) ? Number(lossPcts[i] || 0) : 0;
        const isHit = isPost && loss > 0;
        const lossFrac = Math.min(1.0, loss / 100.0);

        b.__startScaleY = b.group.scale.y;
        b.__startRotZ = b.group.rotation.z;

        if (!isPost || !isHit) {
          b.__targetScaleY = 1.0;
          b.__targetRotZ = 0.0;
          b.soil.material = (selectedStrategyRef.current === 'baseline' && i >= 3) ? greySoilMat : soilMat;
          if (b.cropKey === 'rice' || b.cropKey === 'riceRipe') {
            b.water.visible = true;
          }
          if (b.edges && b.edges.material) {
            if (i === activeIndexRef.current) {
              b.edges.material.color.set('#ffe680');
              b.edges.material.opacity = 0.95;
            } else {
              b.edges.material.opacity = 0;
            }
          }
          return;
        }

        // Stressed Hit Bed
        if (event === 'heatwave') {
          b.__targetScaleY = Math.max(0.65, 1.0 - 0.25 * lossFrac);
          b.__targetRotZ = 0.0;
        } else if (event === 'drought') {
          b.soil.material = drySoilMat;
          b.water.visible = false;
          b.__targetScaleY = Math.max(0.55, 1.0 - 0.38 * lossFrac);
          b.__targetRotZ = 0.07; // wilting tilt
        } else if (event === 'coldwave') {
          b.__targetScaleY = Math.max(0.68, 1.0 - 0.30 * lossFrac);
          b.__targetRotZ = 0.0;
        } else if (event === 'salinity') {
          b.soil.material = salineSoilMat;
          b.__targetScaleY = Math.max(0.72, 1.0 - 0.22 * lossFrac);
          b.__targetRotZ = 0.0;
        } else if (event === 'flood') {
          if (b.cropKey !== 'rice' && b.cropKey !== 'riceRipe') {
            b.__targetScaleY = Math.max(0.40, 1.0 - 0.50 * lossFrac);
          } else {
            b.__targetScaleY = 1.0;
          }
          b.__targetRotZ = 0.0;
        }

        // Severity Color Ring
        if (b.edges && b.edges.material) {
          b.edges.material.opacity = 0.95;
          if (loss > 30) {
            b.edges.material.color.set('#ef4444'); // Red ring
          } else if (loss > 10) {
            b.edges.material.color.set('#f59e0b'); // Amber ring
          } else {
            b.edges.material.color.set('#22c55e'); // Green ring
          }
        }
      });

      stressTransition.active = true;
      stressTransition.elapsed = 0;

      updateLabels();
      renderer.shadowMap.needsUpdate = true;
      requestRender();
    }

    const updateTimeline = (progress, isTimelineActive, waterFraction) => {
      timelineProgressRef.current = progress;
      isTimelineActiveRef.current = isTimelineActive;
      waterFractionRef.current = waterFraction;

      if (!isTimelineActive || progress == null) {
        bedObjects.forEach((b) => {
          b.timelineStage = null;
          setGrowth(b, 1);
        });
        if (!weatherRef.current?.event) {
          rainPoints.visible = false;
        }
        tankWaterMesh.scale.set(1, 0.45, 1);
        tankWaterMesh.position.y = 0.6 + (2.6 * 0.45) / 2;
        updateLabels();
        renderer.shadowMap.needsUpdate = true;
        requestRender();
        return;
      }

      const p = Math.max(0, Math.min(1, progress));
      const currentBeds = bedsRef.current || [];
      const numBeds = currentBeds.length === 3 ? 3 : 6;
      const activeSeasonIdx = Math.min(numBeds - 1, Math.floor(p * numBeds));
      const seasonFrac = Math.max(0, Math.min(1, (p * numBeds) - activeSeasonIdx));

      // Monsoon rain: May - Oct (months 6..10 in 12-month Rabi calendar)
      const totalMonths = numBeds === 3 ? 12 : 24;
      const currentMonthIdx = Math.floor(p * totalMonths) % 12;
      const isMonsoon = currentMonthIdx >= 6 && currentMonthIdx <= 10;
      if (!weatherRef.current?.event) {
        rainPoints.visible = isMonsoon;
      }

      // Tank water level follows cumulative water
      const tLevel = Math.max(0.08, Math.min(1.0, waterFraction != null ? waterFraction : p));
      tankWaterMesh.scale.set(1, tLevel, 1);
      tankWaterMesh.position.y = 0.6 + (2.6 * tLevel) / 2;

      // Crop life cycle: bare soil -> sowing shoots -> growing -> flowering -> mature -> harvest
      for (let i = 0; i < numBeds; i++) {
        const b = bedObjects[i];
        if (!b) continue;
        const isFallow = b.cropKey === 'fallow';

        if (i < activeSeasonIdx) {
          // Harvested bed: crops cleared, harvest tag visible
          setGrowth(b, 0.001);
          b.timelineStage = 'harvested';
        } else if (i === activeSeasonIdx) {
          if (isFallow) {
            setGrowth(b, 0.001);
            b.timelineStage = 'fallow';
          } else {
            let growthVal = 0.001;
            if (seasonFrac < 0.12) {
              growthVal = 0.001;
              b.timelineStage = 'bare';
            } else if (seasonFrac < 0.35) {
              const f = (seasonFrac - 0.12) / (0.35 - 0.12);
              growthVal = 0.05 + f * 0.30;
              b.timelineStage = 'sowing';
            } else if (seasonFrac < 0.70) {
              const f = (seasonFrac - 0.35) / (0.70 - 0.35);
              growthVal = 0.35 + f * 0.45;
              b.timelineStage = 'growing';
            } else if (seasonFrac < 0.90) {
              const f = (seasonFrac - 0.70) / (0.90 - 0.70);
              growthVal = 0.80 + f * 0.18;
              b.timelineStage = 'flowering';
            } else if (seasonFrac < 0.96) {
              growthVal = 1.0;
              b.timelineStage = 'mature';
            } else {
              const f = (seasonFrac - 0.96) / (1.0 - 0.96);
              growthVal = Math.max(0.001, 1.0 - f * 1.5);
              b.timelineStage = 'harvest';
            }
            setGrowth(b, growthVal);
          }
        } else {
          // Future bed
          setGrowth(b, 0.001);
          b.timelineStage = 'upcoming';
        }
      }

      updateLabels();
      renderer.shadowMap.needsUpdate = true;
      requestRender();
    };

    // Save references to update on prop changes
    container.__farm3d = {
      bedObjects,
      applyWeatherStress,
      updateTimeline,
      plantBed: (idx, crop) => {
        plantBed(idx, crop);
        renderer.shadowMap.needsUpdate = true;
        requestRender();
      },
      applyCameraPreset: (preset, idx) => {
        applyCameraPreset(preset, idx);
        renderer.shadowMap.needsUpdate = true;
        requestRender();
      },
      controls,
      renderer,
      requestRender,
      updateLabels,
      getPerfStats: () => ({
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
      }),
      captureCropCloseUp: (cropName) => {
        plantBed(0, cropName, true);
        const targetBed = bedCenters[0];
        camera.position.set(targetBed.x + 4.2, 3.2, targetBed.z + 4.8);
        controls.target.set(targetBed.x, 0.9, targetBed.z);
        controls.update();
        renderer.render(scene, camera);
        return renderer.domElement.toDataURL('image/png');
      },
    };
    if (typeof window !== 'undefined') {
      window.__farm3dRenderer = renderer;
      window.__farm3d = container.__farm3d;
    }

    // 13. Comprehensive Disposal on Unmount
    return () => {
      if (typeof window !== 'undefined') {
        if (window.__farm3dRenderer === renderer) window.__farm3dRenderer = null;
        if (window.__farm3d === container.__farm3d) window.__farm3d = null;
      }
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      controls.removeEventListener('change', requestRender);
      container.removeEventListener('pointermove', requestRender);
      container.removeEventListener('pointerdown', requestRender);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);

      // Clean up labels
      labelDoms.forEach((el) => {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });

      // Dispose Three.js objects
      controls.dispose();
      disposables.forEach((item) => {
        if (item && typeof item.dispose === 'function') {
          item.dispose();
        }
      });
      scene.clear();
      renderer.dispose();

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      delete container.__farm3d;
    };
  }, [hasWebGL, height]);

  // -------------------------------------------------------------
  // Dynamic updates for Bed Crops, Selection, and Camera Presets
  // -------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current || !containerRef.current.__farm3d) return;
    const { bedObjects, plantBed, updateLabels } = containerRef.current.__farm3d;

    // Update beds if crops changed or LOD adjusted
    if (Array.isArray(beds)) {
      const numBeds = beds.length === 3 ? 3 : 6;
      bedObjects.forEach((b, i) => {
        const isBedActive = i < numBeds;
        b.group.visible = isBedActive;
        b.soil.visible = isBedActive;
        b.pick.visible = isBedActive;
        if (!isBedActive) {
          b.inst.forEach((m) => {
            b.group.remove(m);
            m.geometry.dispose();
          });
          b.inst = [];
          b.water.visible = false;
        }
      });
      const cropNames = [];
      const geoKeys = [];
      beds.slice(0, numBeds).forEach((bedData, i) => {
        const cropName = bedData.crop || bedData.crop_name || bedData.name;
        cropNames.push(cropName);
        if (cropName && bedObjects[i]) {
          plantBed(i, cropName, isLowLod);
          geoKeys.push(bedObjects[i].cropKey);
        } else {
          geoKeys.push('fallow');
        }
      });
      console.log('[FarmScene3D] Replanting beds:', {
        strategy: selectedStrategy || 'custom',
        cropNames,
        geoKeys,
      });
      updateLabels();
    }

    // Update selection outlines and changed replan beds
    bedObjects.forEach((b, j) => {
      if (b.edges && b.edges.material) {
        const bedData = Array.isArray(beds) ? beds[j] : null;
        if (j === activeIndex) {
          b.edges.material.color.set('#ffe680');
          b.edges.material.opacity = 0.95;
        } else if (bedData && bedData.isChanged) {
          b.edges.material.color.set('#f0a14a');
          b.edges.material.opacity = 0.85;
        } else {
          b.edges.material.opacity = 0;
        }
      }
    });

    if (containerRef.current.__farm3d.applyWeatherStress) {
      containerRef.current.__farm3d.applyWeatherStress(weather, bedLossPcts);
    }

    if (updateLabels) {
      updateLabels();
    }
    if (containerRef.current.__farm3d.renderer) {
      containerRef.current.__farm3d.renderer.shadowMap.needsUpdate = true;
    }
    if (containerRef.current.__farm3d.requestRender) {
      containerRef.current.__farm3d.requestRender();
    }
  }, [beds, activeIndex, isLowLod, selectedStrategy, lang, weather, bedLossPcts]);

  // Dynamic update for Season Timeline Animation & Scrubber
  useEffect(() => {
    if (!containerRef.current || !containerRef.current.__farm3d) return;
    const f3d = containerRef.current.__farm3d;
    if (f3d.updateTimeline) {
      f3d.updateTimeline(timelineProgress, isTimelineActive, waterFraction);
    }
  }, [timelineProgress, isTimelineActive, waterFraction]);

  // -------------------------------------------------------------
  // WebGL Fallback (Graceful 2D Bed Matrix)
  // -------------------------------------------------------------
  if (!hasWebGL) {
    return (
      <div
        className="farm-scene-container"
        style={{
          width: '100%',
          height: height || 560,
          background: 'var(--surface-2, #18221b)',
          borderRadius: 16,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'var(--text)',
        }}
      >
        <div style={{ fontSize: 13, color: '#f59e0b', marginBottom: 12, fontWeight: 700 }}>
          <AlertTriangle size={16} strokeWidth={1.75} color="var(--coral, #ff7a6b)" style={{ verticalAlign: 'middle', marginRight: 4 }} />{lang === 'bn' ? 'ওয়েবজিএল অসমর্থিত — ২ডি ভিউ প্রদর্শিত হচ্ছে' : 'WebGL unavailable — showing 2D fallback'}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            width: '100%',
            maxWidth: 620,
          }}
        >
          {(beds && beds.length === 6 ? beds : [0, 1, 2, 3, 4, 5]).map((b, i) => {
            const cropName = typeof b === 'object' ? b.crop || b.crop_name || 'Crop' : 'Crop';
            const isSelected = i === activeIndex;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onBedClick && onBedClick(i, b)}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  border: isSelected ? '2px solid #ffe680' : '1px solid var(--line, rgba(255,255,255,0.15))',
                  background: isSelected ? 'rgba(255, 230, 128, 0.12)' : 'rgba(255,255,255,0.04)',
                  color: 'inherit',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--text-3, #9db0a0)' }}>
                  {i < 3 ? (lang === 'bn' ? '১ম বছর' : 'Year 1') : (lang === 'bn' ? '২য় বছর' : 'Year 2')} ·{' '}
                  {i % 3 === 0 ? (lang === 'bn' ? 'রবি' : 'Rabi') : i % 3 === 1 ? (lang === 'bn' ? 'খরিফ-১' : 'Kharif-1') : (lang === 'bn' ? 'খরিফ-২' : 'Kharif-2')}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                  {cropName}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className="farm-scene-container"
      style={{
        position: 'relative',
        width: '100%',
        height: height || 560,
        borderRadius: 16,
        overflow: 'hidden',
        background: '#0e1511',
      }}
    >
      {/* Three.js Canvas Container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating 2D Projected Bed Labels */}
      <div ref={labelsContainerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4 }} />

      {/* Top Floating Field Footprint Badge & Controls */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        {/* Field Area Badge */}
        <div
          style={{
            background: 'rgba(20, 30, 22, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 10,
            padding: '6px 12px',
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          }}
        >
          <Home size={14} strokeWidth={1.75} />
          <span>{fieldName}</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span style={{ color: '#5cc27e' }}>
            {fieldAreaHa && fieldAreaHa > 0 ? `${bighaStr} (${Number(fieldAreaHa).toFixed(1)} ha)` : '—'}
          </span>
        </div>

        {/* Camera Preset Controls */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            background: 'rgba(20, 30, 22, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 10,
            padding: 4,
            pointerEvents: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => handlePresetClick('iso')}
            title={lang === 'bn' ? 'আইসোমেট্রিক সাধারণ ভিউ' : 'Isometric overview'}
            style={{
              background: currentPreset === 'iso' ? '#15803d' : 'transparent',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <RotateCw size={14} strokeWidth={1.75} style={{ verticalAlign: 'middle', marginRight: 4 }} />{lang === 'bn' ? 'আইসো' : 'Iso'}
          </button>
          <button
            type="button"
            onClick={() => handlePresetClick('top')}
            title={lang === 'bn' ? 'উপর থেকে ফ্ল্যাট প্ল্যান ভিউ' : 'Top-down plan view'}
            style={{
              background: currentPreset === 'top' ? '#15803d' : 'transparent',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Map size={14} strokeWidth={1.75} style={{ verticalAlign: 'middle', marginRight: 4 }} />{lang === 'bn' ? 'টপ' : 'Top'}
          </button>
          <button
            type="button"
            onClick={() => handlePresetClick('close')}
            title={lang === 'bn' ? 'নির্বাচিত ফসলের নিকটবর্তী ভিউ' : 'Close-up on selected crop'}
            style={{
              background: currentPreset === 'close' ? '#15803d' : 'transparent',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Search size={14} strokeWidth={1.75} style={{ verticalAlign: 'middle', marginRight: 4 }} />{lang === 'bn' ? 'ক্লোজ' : 'Close'}
          </button>
        </div>
      </div>

      {/* Legend & Tank Capacity Matching Approved Reference */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 12,
          right: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 5,
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.90)',
            color: '#1b261d',
            borderRadius: 10,
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          <Droplets size={14} strokeWidth={1.75} color="var(--cyan, #5be3ff)" style={{ verticalAlign: 'middle', marginRight: 4 }} />{lang === 'bn' ? 'সেচ (W) · N নাইট্রোজেন দেয় · তাপ/খরা ঝুঁকি (H/D)' : 'Irrig (W) · Legume (N) · Heat/Drought Risk (H/D)'}
        </div>

        {annualIrrigationMm != null && !isNaN(annualIrrigationMm) ? (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.90)',
              color: '#1b261d',
              borderRadius: 10,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <Droplets size={14} strokeWidth={1.75} color="var(--cyan, #5be3ff)" style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {lang === 'bn'
              ? `ট্যাংক = বছরে সেচ: ${Math.round(annualIrrigationMm)} মিমি`
              : `Tank = Annual Irrigation: ${Math.round(annualIrrigationMm)} mm`}
          </div>
        ) : null}
      </div>

      {/* LB5: Mobile Tap to Interact Overlay */}
      {!hasInteracted && (
        <div
          className="tap-to-interact-overlay"
          onClick={() => setHasInteracted(true)}
          onTouchStart={() => setHasInteracted(true)}
          role="button"
          tabIndex={0}
          aria-label={lang === 'bn' ? 'ট্যাপ করে দেখুন' : 'Tap to interact'}
        >
          <div className="tap-to-interact-pill">
            <MousePointerClick size={16} strokeWidth={1.75} />
            <span>{lang === 'bn' ? 'ট্যাপ করে দেখুন' : 'Tap to interact'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default FarmScene3D;
