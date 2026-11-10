// frontend/src/overview/shots.js
// Single source of truth for the Overview 10-shot camera trajectory (SH2)
// Interpolated with Catmull-Rom spline for position and slerp for look direction.

import * as THREE from 'three';

export const SHOTS = [
  // 0: Space / Earth Hook
  {
    id: '01_space',
    name: 'Space · Earth Hook',
    camPos: [0.0, 0.45, 4.3],
    lookAt: [0.0, 0.20, 0.0],
    fov: 42,
    sun: { dir: [14, 4, 7], color: 0xfff6e8, intensity: 2.5 },
    fog: { color: 0x0a101b, density: 0.0001 },
    sceneState: { world: 'space', earthRotY: 0.0 },
  },
  // 1: Cloud Dive into Bangladesh
  {
    id: '02_dive',
    name: 'Atmosphere · Cloud Dive',
    camPos: [0.0, 0.45, 4.15],
    lookAt: [0.0, 0.35, 0.8],
    fov: 44,
    sun: { dir: [12, 5, 6], color: 0xfff2da, intensity: 2.4 },
    fog: { color: 0x0a101b, density: 0.0001 },
    sceneState: { world: 'space_dive', cloudFlash: true },
  },
  // 2: Bangladesh 3D Extruded Regional Map
  {
    id: '03_regions',
    name: 'Map · Regional Diversity',
    camPos: [0.0, 8.5, 3.5],
    lookAt: [0.0, 0.0, -4.0],
    fov: 48,
    sun: { dir: [8, 14, 6], color: 0xffffff, intensity: 1.8 },
    fog: { color: 0x1e462f, density: 0.007 },
    sceneState: { world: 'map_overview', showRegions: true },
  },
  // 3: Aquifer & Soil Column Cutaway
  {
    id: '04_water',
    name: 'Map · Groundwater & Aquifer',
    camPos: [-1.8, 4.2, -1.8],
    lookAt: [-1.4, 0.2, -4.5],
    fov: 45,
    sun: { dir: [6, 12, 5], color: 0xffedd5, intensity: 1.9 },
    fog: { color: 0x1e462f, density: 0.007 },
    sceneState: { world: 'map_water', cutaway: true },
  },
  // 4: Farm · Sky Uncertainty & Climate
  {
    id: '05_climate',
    name: 'Farm · Sky & Climate Risk',
    camPos: [0.0, 6.0, -8.0],
    lookAt: [0.0, 0.8, -18.0],
    fov: 45,
    sun: { dir: [10, 10, 5], color: 0xfde047, intensity: 1.6 },
    fog: { color: 0x183024, density: 0.008 },
    sceneState: { world: 'farm', rain: true, heat: true },
  },
  // 5: Farm · Soil Health & Biological Nitrogen
  {
    id: '06_soil',
    name: 'Farm · Soil Health & Legumes',
    camPos: [-2.2, 5.0, -10.0],
    lookAt: [-1.2, 0.6, -18.0],
    fov: 42,
    sun: { dir: [8, 12, 6], color: 0xecfccb, intensity: 1.8 },
    fog: { color: 0x1a3824, density: 0.008 },
    sceneState: { world: 'farm', legumes: true, nParticles: true },
  },
  // 6: Farm · 6-Season MILP Rotation Optimum
  {
    id: '07_planner',
    name: 'Farm · 6-Season MILP Optimum',
    camPos: [0.0, 7.2, -9.0],
    lookAt: [0.0, 0.4, -18.0],
    fov: 45,
    sun: { dir: [12, 14, 8], color: 0xffffff, intensity: 2.0 },
    fog: { color: 0x1c3a26, density: 0.008 },
    sceneState: { world: 'farm', strategies: true, starGlow: true },
  },
  // 7: Farm · Extreme Climate Stress Test
  {
    id: '08_stress',
    name: 'Farm · Extreme Stress Test',
    camPos: [1.8, 5.5, -9.5],
    lookAt: [0.0, 0.5, -18.0],
    fov: 44,
    sun: { dir: [4, 6, 2], color: 0x94a3b8, intensity: 0.8 },
    fog: { color: 0x1e2834, density: 0.012 },
    sceneState: { world: 'farm', storm: true, flood: true, drought: true },
  },
  // 8: Farm · Adaptive Harvest Learning Loop
  {
    id: '09_learning',
    name: 'Farm · Adaptive Learning Loop',
    camPos: [-1.5, 4.8, -10.5],
    lookAt: [0.0, 0.5, -18.0],
    fov: 42,
    sun: { dir: [10, 10, 6], color: 0xfef08a, intensity: 1.7 },
    fog: { color: 0x1c3624, density: 0.008 },
    sceneState: { world: 'farm', learning: true, replanPulse: true },
  },
  // 9: Farm · Dawn Closing Wide View
  {
    id: '10_close',
    name: 'Farm · Dawn Wide Closing',
    camPos: [0.0, 8.5, -6.0],
    lookAt: [0.0, 0.6, -18.0],
    fov: 48,
    sun: { dir: [18, 5, -8], color: 0xffedd5, intensity: 2.4 },
    fog: { color: 0x362c20, density: 0.006 },
    sceneState: { world: 'farm', dawn: true, widePullback: true },
  },
];

// ── Spline & Interpolation Helpers ───────────────────────────────────────────
const posPoints = SHOTS.map(s => new THREE.Vector3(...s.camPos));
const lookPoints = SHOTS.map(s => new THREE.Vector3(...s.lookAt));

// Centripetal Catmull-Rom spline guarantees smooth curves without looping overshoot
export const posSpline = new THREE.CatmullRomCurve3(posPoints, false, 'centripetal', 0.5);
export const lookSpline = new THREE.CatmullRomCurve3(lookPoints, false, 'centripetal', 0.5);

/**
 * Returns interpolated camera position, lookAt target, fov, sun, and fog for a progress t [0, 1].
 */
export function getInterpolatedShot(t) {
  const clampedT = Math.max(0, Math.min(1, t));
  const pos = posSpline.getPoint(clampedT);
  const lookAt = lookSpline.getPoint(clampedT);

  // Determine current and next shot index
  const numSegments = SHOTS.length - 1;
  const segIndex = Math.min(numSegments - 1, Math.floor(clampedT * numSegments));
  const segProgress = (clampedT * numSegments) - segIndex;

  const currentShot = SHOTS[segIndex];
  const nextShot = SHOTS[Math.min(numSegments, segIndex + 1)];

  // Linear / Cosine ease between shots for scalars
  const ease = 0.5 - 0.5 * Math.cos(segProgress * Math.PI);

  const fov = currentShot.fov + (nextShot.fov - currentShot.fov) * ease;

  // Sun interpolation
  const sunDir = [
    currentShot.sun.dir[0] + (nextShot.sun.dir[0] - currentShot.sun.dir[0]) * ease,
    currentShot.sun.dir[1] + (nextShot.sun.dir[1] - currentShot.sun.dir[1]) * ease,
    currentShot.sun.dir[2] + (nextShot.sun.dir[2] - currentShot.sun.dir[2]) * ease,
  ];
  const sunColor = new THREE.Color(currentShot.sun.color).lerp(new THREE.Color(nextShot.sun.color), ease);
  const sunIntensity = currentShot.sun.intensity + (nextShot.sun.intensity - currentShot.sun.intensity) * ease;

  // Fog interpolation
  const fogColor = new THREE.Color(currentShot.fog.color).lerp(new THREE.Color(nextShot.fog.color), ease);
  const fogDensity = currentShot.fog.density + (nextShot.fog.density - currentShot.fog.density) * ease;

  return {
    pos,
    lookAt,
    fov,
    sun: { dir: sunDir, color: sunColor, intensity: sunIntensity },
    fog: { color: fogColor, density: fogDensity },
    shotIndex: segIndex,
    currentShot,
    nextShot,
    segProgress,
  };
}

/**
 * Validates that no registered mesh bounding sphere is closer than 3.0 units to the camera.
 * Logs a console warning if violated.
 */
export function checkCameraClearance(camPos, registeredMeshes = []) {
  const MIN_CLEARANCE = 3.0;
  for (const m of registeredMeshes) {
    if (!m || !m.visible) continue;
    if (!m.geometry) continue;
    if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
    const sphere = m.geometry.boundingSphere;
    if (!sphere) continue;
    const meshWorldPos = new THREE.Vector3();
    m.getWorldPosition(meshWorldPos);
    meshWorldPos.add(sphere.center);
    const distToCenter = camPos.distanceTo(meshWorldPos);
    const distToSurface = distToCenter - sphere.radius;
    if (distToSurface < MIN_CLEARANCE && distToSurface > -sphere.radius) {
      console.warn(`[Camera Clearance Warning] Mesh "${m.name || 'unnamed'}" is within ${distToSurface.toFixed(2)}u of camera (min: ${MIN_CLEARANCE}u).`);
    }
  }
}
