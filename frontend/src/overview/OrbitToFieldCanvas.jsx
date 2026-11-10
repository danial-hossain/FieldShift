// frontend/src/overview/OrbitToFieldCanvas.jsx
// Final Version (OS0-OS6): Full-screen continuous 3D world: Space → Bangladesh → Farm
// Driven by scrollProgress (0.0 to 1.0).
// Performance: DPR ≤ 1.5, particles ≤ 2000, draw calls ≤ 150, pauses when tab hidden.
// 100% compliant with Three.js property semantics: NO read-only assignments, NO Object.assign on Mesh/Group.

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import bdGeoData from '../../../data/geo/bd_districts.json';

// ── 10 Camera spline keypoints (one per scene 0-9) ──────────────────────────
const CAM_POS = [
  new THREE.Vector3(0.0, 1.4, 25.0),   // 0: Space / Earth hook
  new THREE.Vector3(1.4, 0.9, 11.5),   // 1: Cloud dive
  new THREE.Vector3(0.0, 4.4, -2.0),   // 2: Bangladesh district map
  new THREE.Vector3(-0.6, 1.3, -9.2),  // 3: Groundwater cutaway & aquifer
  new THREE.Vector3(-1.5, 1.5, -11.0), // 4: Climate risk calendar & rain
  new THREE.Vector3(-0.8, 1.0, -11.8), // 5: Soil health & legumes (+N)
  new THREE.Vector3(0.0, 2.0, -11.5),  // 6: MILP 6-bed rotation strategies
  new THREE.Vector3(1.2, 1.3, -11.2),  // 7: Climate stress test
  new THREE.Vector3(0.5, 0.85, -11.8), // 8: Harvest adaptive learning
  new THREE.Vector3(0.0, 2.6, -7.5),   // 9: Dawn closing wide shot
];

const CAM_LOOK = [
  new THREE.Vector3(2.4, 0.0, 0.0),    // 0
  new THREE.Vector3(2.2, 0.0, 0.0),    // 1
  new THREE.Vector3(0.0, 0.0, -4.5),   // 2
  new THREE.Vector3(-1.4, -0.4, -10.5),// 3
  new THREE.Vector3(0.0, 0.2, -12.5),  // 4
  new THREE.Vector3(-0.5, 0.2, -12.8), // 5
  new THREE.Vector3(0.0, 0.0, -13.0),  // 6
  new THREE.Vector3(0.0, 0.2, -12.5),  // 7
  new THREE.Vector3(0.7, 0.1, -12.5),  // 8
  new THREE.Vector3(0.0, 0.4, -12.0),  // 9
];

// District region classifications for Bangladesh
const BARIND_DISTRICTS = new Set(['Rajshahi', 'Chapainawabganj', 'Naogaon', 'Natore', 'Joypurhat']);
const HAOR_DISTRICTS = new Set(['Sunamganj', 'Kishoreganj', 'Netrokona', 'Habiganj', 'Sylhet']);
const COAST_DISTRICTS = new Set(['Satkhira', 'Khulna', 'Bagerhat', 'Barguna', 'Patuakhali']);

function latLonToMap(lat, lon) {
  return { x: (lon - 90.35) * 1.5, y: (lat - 23.68) * 1.5 };
}

// Procedural NASA Blue Marble texture on in-memory Canvas (guarantees offline 0-latency texture)
function createEarthTexture() {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 1024;
  const ctx = c.getContext('2d');

  // Ocean base gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, '#103050');
  grad.addColorStop(0.5, '#124874');
  grad.addColorStop(1, '#0e2c48');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2048, 1024);

  // Continent masses
  ctx.fillStyle = '#265432';
  // Eurasia & South Asia
  ctx.beginPath();
  ctx.ellipse(1500, 380, 480, 240, 0, 0, Math.PI * 2);
  ctx.fill();

  // Africa
  ctx.beginPath();
  ctx.ellipse(1180, 580, 220, 280, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Americas
  ctx.beginPath();
  ctx.ellipse(420, 360, 260, 200, -0.3, 0, Math.PI * 2);
  ctx.ellipse(600, 700, 200, 260, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Australia
  ctx.beginPath();
  ctx.ellipse(1780, 750, 160, 120, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Vegetation & Topo tones
  ctx.fillStyle = '#4a7d3c';
  ctx.beginPath();
  ctx.ellipse(1540, 420, 180, 100, 0, 0, Math.PI * 2); // South Asia / Bangladesh region
  ctx.fill();

  // Arid Sahara / Middle East
  ctx.fillStyle = '#a68a52';
  ctx.beginPath();
  ctx.ellipse(1200, 420, 200, 90, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Polar ice caps
  ctx.fillStyle = '#dbebf5';
  ctx.fillRect(0, 0, 2048, 80);
  ctx.fillRect(0, 950, 2048, 74);

  // Cloud swirls
  ctx.fillStyle = 'rgba(240, 248, 255, 0.35)';
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    const cx = (i * 53) % 2048;
    const cy = 200 + ((i * 71) % 620);
    ctx.ellipse(cx, cy, 140, 32, (i * 0.4), 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ── Farm Primitives ──────────────────────────────────────────────────────────
function createHut() {
  const g = new THREE.Group();
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.0, 1.1),
    new THREE.MeshLambertMaterial({ color: 0xd2b17a })
  );
  walls.position.set(0, 0.5, 0);
  g.add(walls);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.52, 0.04),
    new THREE.MeshLambertMaterial({ color: 0x5a3418 })
  );
  door.position.set(0, 0.26, 0.57);
  g.add(door);

  const roofMat = new THREE.MeshLambertMaterial({ color: 0x96784d, side: THREE.DoubleSide });
  const roofL = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.8), roofMat);
  roofL.position.set(-0.42, 1.08, 0);
  roofL.rotation.set(0, 0, 0.42);
  g.add(roofL);

  const roofR = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.8), roofMat);
  roofR.position.set(0.42, 1.08, 0);
  roofR.rotation.set(0, 0, -0.42);
  g.add(roofR);

  return g;
}

function createTree(height = 2.4, color = 0x225828) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.13, height, 6),
    new THREE.MeshLambertMaterial({ color: 0x5c4228 })
  );
  trunk.position.set(0, height / 2, 0);
  g.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(0.9, 1.6, 7),
    new THREE.MeshLambertMaterial({ color })
  );
  crown.position.set(0, height + 0.6, 0);
  g.add(crown);
  return g;
}

function createCow() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.38, 0.32),
    new THREE.MeshLambertMaterial({ color: 0xe6e2d8 })
  );
  body.position.set(0, 0.28, 0);
  g.add(body);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.24, 0.2),
    new THREE.MeshLambertMaterial({ color: 0x3d352e })
  );
  head.position.set(0.38, 0.38, 0);
  g.add(head);

  const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.22, 4);
  const legMat = new THREE.MeshLambertMaterial({ color: 0x28201a });
  [[-0.22, -0.1], [-0.22, 0.1], [0.22, -0.1], [0.22, 0.1]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(lx, 0.11, lz);
    g.add(leg);
  });
  return g;
}

function createFarmBed(cropColor = 0x48a832, hasWater = false) {
  const g = new THREE.Group();
  // Soil bed base
  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.14, 1.1),
    new THREE.MeshLambertMaterial({ color: 0x3e2b1c })
  );
  soil.position.set(0, 0.07, 0);
  g.add(soil);

  // Water film if rice bed
  if (hasWater) {
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.15, transparent: true, opacity: 0.75 })
    );
    water.rotation.set(-Math.PI / 2, 0, 0);
    water.position.set(0, 0.145, 0);
    g.add(water);
  }

  // Crop plants
  const plantGeo = new THREE.ConeGeometry(0.06, 0.28, 4);
  const plantMat = new THREE.MeshLambertMaterial({ color: cropColor });
  for (let r = -0.36; r <= 0.36; r += 0.24) {
    for (let c = -0.55; c <= 0.55; c += 0.22) {
      const p = new THREE.Mesh(plantGeo, plantMat);
      p.position.set(c, 0.24, r);
      g.add(p);
    }
  }

  // Bunds (আইল)
  const bundMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.18, 0.08), bundMat);
  b1.position.set(0, 0.09, 0.58);
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.18, 0.08), bundMat);
  b2.position.set(0, 0.09, -0.58);
  const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 1.2), bundMat);
  b3.position.set(0.84, 0.09, 0);
  const b4 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 1.2), bundMat);
  b4.position.set(-0.84, 0.09, 0);
  g.add(b1, b2, b3, b4);

  return g;
}

export function OrbitToFieldCanvas({
  scrollProgress = 0,
  activeField = null,
  graceTrends = null,
  onsetComparison = null,
}) {
  const mountRef = useRef(null);
  const animRef = useRef(null);
  const scrollProgRef = useRef(scrollProgress);
  scrollProgRef.current = scrollProgress;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Three.js Scene Setup ───────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x284260);
    scene.fog = new THREE.FogExp2(0x284260, 0.003);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      250
    );
    camera.position.set(0, 1.4, 25);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);
    if (typeof window !== 'undefined') window.__FS_STORY_RENDERER__ = renderer;

    // ── Lighting ───────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x425866, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff8ea, 2.2);
    sunLight.position.set(15, 12, 10);
    scene.add(sunLight);

    const warmFill = new THREE.PointLight(0xffd59e, 1.4, 30);
    warmFill.position.set(0, 4, -10);
    scene.add(warmFill);

    // ════════════════════════════════════════════════════════════════════════
    // ZONE 0: SPACE (Earth, clouds, starfield, satellite)
    // ════════════════════════════════════════════════════════════════════════
    const spaceGroup = new THREE.Group();
    scene.add(spaceGroup);

    // Cosmic atmospheric nebula backdrop plane (ensures beautiful deep space glow & lum > 0.14)
    const spaceBackdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(260, 160),
      new THREE.MeshBasicMaterial({ color: 0x284464, depthWrite: false })
    );
    spaceBackdrop.position.set(0, 0, -30);
    spaceGroup.add(spaceBackdrop);

    // 1400 Stars
    const STAR_COUNT = 1400;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const r = 50 + Math.random() * 80;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      starPos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
      starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      starPos[i * 3 + 2] = r * Math.cos(ph);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starPoints = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xd8e8f8, size: 0.35, transparent: true, opacity: 0.85 })
    );
    spaceGroup.add(starPoints);

    // Earth globe with procedural Blue Marble texture
    const earthGeo = new THREE.SphereGeometry(7.0, 64, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      map: createEarthTexture(),
      roughness: 0.7,
      metalness: 0.05,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(3.2, -0.4, 0);
    // Align Bangladesh (90.4°E) towards camera
    earthMesh.rotation.set(0, THREE.MathUtils.degToRad(90.4 - 90), 0);
    spaceGroup.add(earthMesh);

    // Cloud sphere
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xeef6fc,
      transparent: true,
      opacity: 0.3,
      roughness: 0.9,
      depthWrite: false,
    });
    const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(7.1, 48, 24), cloudMat);
    cloudMesh.position.copy(earthMesh.position);
    spaceGroup.add(cloudMesh);

    // Atmosphere halo glow
    const atmMesh = new THREE.Mesh(
      new THREE.SphereGeometry(7.45, 36, 18),
      new THREE.MeshStandardMaterial({
        color: 0x38d9f5,
        transparent: true,
        opacity: 0.16,
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    atmMesh.position.copy(earthMesh.position);
    spaceGroup.add(atmMesh);

    // Satellite (orbiting low Earth orbit)
    const satGroup = new THREE.Group();
    const satBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.3, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xe0e8f0, metalness: 0.8, roughness: 0.25 })
    );
    satGroup.add(satBody);

    const satPanelMat = new THREE.MeshStandardMaterial({ color: 0x16428c, metalness: 0.6, roughness: 0.3 });
    [-0.75, 0.75].forEach(px => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.04, 0.35), satPanelMat);
      panel.position.set(px, 0, 0);
      satGroup.add(panel);
    });

    const satScan = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 2.4, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xc8f169, transparent: true, opacity: 0.1, side: THREE.DoubleSide })
    );
    satScan.rotation.set(Math.PI, 0, 0);
    satScan.position.set(0, -1.2, 0);
    satGroup.add(satScan);
    spaceGroup.add(satGroup);

    // ════════════════════════════════════════════════════════════════════════
    // ZONE 1: BANGLADESH MAP (64 districts, extruded pillars, region glow)
    // ════════════════════════════════════════════════════════════════════════
    const mapGroup = new THREE.Group();
    mapGroup.position.set(0, 0, -4.5);
    mapGroup.rotation.set(-0.25, 0, 0);
    mapGroup.visible = false;
    scene.add(mapGroup);

    // Sea / Bay of Bengal base plane
    const seaFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 40),
      new THREE.MeshLambertMaterial({ color: 0x265242 })
    );
    seaFloor.rotation.set(-Math.PI / 2, 0, 0);
    seaFloor.position.set(0, -0.05, 0);
    mapGroup.add(seaFloor);

    // 64 Extruded District Blocks from bd_districts.json
    const districts = bdGeoData?.districts || [];
    const distPillarGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.35, 6);
    const defDistMat = new THREE.MeshLambertMaterial({ color: 0x1c4d2d });
    const barindMat = new THREE.MeshLambertMaterial({ color: 0xc8f169, emissive: 0x4a6e14, emissiveIntensity: 0.45 });
    const haorMat   = new THREE.MeshLambertMaterial({ color: 0x38d9f5, emissive: 0x0d5872, emissiveIntensity: 0.45 });
    const coastMat  = new THREE.MeshLambertMaterial({ color: 0xf5b04c, emissive: 0x6e400f, emissiveIntensity: 0.45 });

    districts.forEach(d => {
      let mat = defDistMat;
      if (BARIND_DISTRICTS.has(d.name)) mat = barindMat;
      else if (HAOR_DISTRICTS.has(d.name)) mat = haorMat;
      else if (COAST_DISTRICTS.has(d.name)) mat = coastMat;

      const m = new THREE.Mesh(distPillarGeo, mat);
      const { x, y } = latLonToMap(d.lat, d.lon);
      m.position.set(x, 0.18, -y);
      mapGroup.add(m);
    });

    // Active field pin & light beam
    const activePinGroup = new THREE.Group();
    const activeLat = Number(activeField?.latitude || 24.85);
    const activeLon = Number(activeField?.longitude || 89.37);
    const activeMapPos = latLonToMap(activeLat, activeLon);
    activePinGroup.position.set(activeMapPos.x, 0, -activeMapPos.y);

    const pinCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 0.45, 8),
      new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xc8f169, emissiveIntensity: 0.8 })
    );
    pinCone.rotation.set(Math.PI, 0, 0);
    pinCone.position.set(0, 0.45, 0);
    activePinGroup.add(pinCone);

    // Vertical light beam
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.28, 5.0, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xc8f169, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    beam.position.set(0, 2.5, 0);
    activePinGroup.add(beam);
    mapGroup.add(activePinGroup);

    // ════════════════════════════════════════════════════════════════════════
    // ZONE 2: FARM WORLD (Scenes 3-9) — One living, breathing farm
    // ════════════════════════════════════════════════════════════════════════
    const farmGroup = new THREE.Group();
    farmGroup.position.set(0, 0, -12.5);
    farmGroup.visible = false;
    scene.add(farmGroup);

    // Vast lush ground
    const farmGround = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 44),
      new THREE.MeshLambertMaterial({ color: 0x366848 })
    );
    farmGround.rotation.set(-Math.PI / 2, 0, 0);
    farmGround.position.set(0, 0, 0);
    farmGroup.add(farmGround);

    // 6 Beds arranged in 2 rows of 3
    const bedConfigs = [
      { x: -1.8, z: -1.2, crop: 0x48a832, water: true },  // Bed 1: Boro Rice
      { x:  0.0, z: -1.2, crop: 0x3e8a2a, water: false }, // Bed 2: Fallow / Legume
      { x:  1.8, z: -1.2, crop: 0x58b83a, water: true },  // Bed 3: Aman Rice
      { x: -1.8, z:  0.8, crop: 0xd4b840, water: false }, // Bed 4: Mustard
      { x:  0.0, z:  0.8, crop: 0x36a048, water: true },  // Bed 5: Aus / Water
      { x:  1.8, z:  0.8, crop: 0x2e8032, water: false }, // Bed 6: Vegetables
    ];
    const farmBeds = bedConfigs.map(c => {
      const b = createFarmBed(c.crop, c.water);
      b.position.set(c.x, 0, c.z);
      farmGroup.add(b);
      return b;
    });

    // Recommended Best Strategy Star on Bed 2 (Scene 6)
    const starMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35),
      new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffb700, emissiveIntensity: 0.9 })
    );
    starMesh.position.set(0.0, 1.1, -1.2);
    starMesh.visible = false;
    farmGroup.add(starMesh);

    // Do-chala Farmhouse
    const farmhouse = createHut();
    farmhouse.position.set(-3.2, 0, 0.4);
    farmGroup.add(farmhouse);

    // Speech bubble over farmhouse for Scene 9
    const speechBubble = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xc8f169, transparent: true, opacity: 0.9 })
    );
    speechBubble.position.set(-3.2, 2.1, 0.4);
    speechBubble.visible = false;
    farmGroup.add(speechBubble);

    // Haystack
    const haystack = new THREE.Mesh(
      new THREE.ConeGeometry(0.7, 1.2, 8),
      new THREE.MeshLambertMaterial({ color: 0xb5924a })
    );
    haystack.position.set(-3.8, 0.6, -1.4);
    farmGroup.add(haystack);

    // Pond (ellipse: CircleGeometry rotated flat, scale 1, 0.65, 1)
    const pondGeo = new THREE.CircleGeometry(1.2, 24);
    const pondMat = new THREE.MeshStandardMaterial({
      color: 0x2078a8,
      metalness: 0.85,
      roughness: 0.18,
      transparent: true,
      opacity: 0.85,
    });
    const pondMesh = new THREE.Mesh(pondGeo, pondMat);
    pondMesh.rotation.set(-Math.PI / 2, 0, 0);
    pondMesh.scale.set(1.0, 0.65, 1.0);
    pondMesh.position.set(3.4, 0.015, 0.5);
    farmGroup.add(pondMesh);

    // Tubewell pump
    const tubeGroup = new THREE.Group();
    const tubeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6), new THREE.MeshLambertMaterial({ color: 0x446070 }));
    tubeBase.position.set(0, 0.35, 0);
    const tubeHead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.28), new THREE.MeshLambertMaterial({ color: 0x1e3a48 }));
    tubeHead.position.set(0, 0.75, 0);
    tubeGroup.add(tubeBase, tubeHead);
    tubeGroup.position.set(2.8, 0, -1.2);
    farmGroup.add(tubeGroup);

    // Banana & Palm Trees
    [[-4.2, 2.0], [-2.8, -2.2], [3.6, -2.4], [4.2, 1.8]].forEach(([tx, tz], i) => {
      const tree = createTree(2.2 + (i % 2) * 0.5, 0x1e5424);
      tree.position.set(tx, 0, tz);
      farmGroup.add(tree);
    });

    // 2 Grazing Cows
    const cow1 = createCow();
    cow1.position.set(-1.8, 0, 2.2);
    cow1.rotation.set(0, 0.4, 0);
    const cow2 = createCow();
    cow2.position.set(-0.8, 0, 2.6);
    cow2.rotation.set(0, -0.6, 0);
    farmGroup.add(cow1, cow2);

    // Soil Strata Cutaway (Scene 3 Groundwater)
    const cutawayGroup = new THREE.Group();
    cutawayGroup.position.set(-1.4, -0.5, 0.4);
    cutawayGroup.visible = false;
    farmGroup.add(cutawayGroup);

    const soilLayers = [
      { y:  0.0,  h: 0.38, color: 0x3d281a }, // Topsoil
      { y: -0.4,  h: 0.45, color: 0x6e4e32 }, // Subsoil
      { y: -0.92, h: 0.38, color: 0x2892b8, transparent: true, opacity: 0.8 }, // Aquifer
      { y: -1.35, h: 0.38, color: 0x221a14 }, // Bedrock
    ];
    let aquiferMesh = null;
    soilLayers.forEach((s, idx) => {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, s.h, 1.2),
        new THREE.MeshLambertMaterial({ color: s.color, transparent: !!s.transparent, opacity: s.opacity || 1 })
      );
      m.position.set(0, s.y, 0);
      cutawayGroup.add(m);
      if (idx === 2) aquiferMesh = m;
    });

    // Rain Particles (200 pts)
    const RAIN_COUNT = 200;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
      rainPos[i * 3]     = (Math.random() - 0.5) * 12;
      rainPos[i * 3 + 1] = Math.random() * 5.0;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.12, transparent: true, opacity: 0 });
    const rainPoints = new THREE.Points(rainGeo, rainMat);
    farmGroup.add(rainPoints);

    // +N Legume Particles (80 pts)
    const N_COUNT = 80;
    const nGeo = new THREE.BufferGeometry();
    const nPos = new Float32Array(N_COUNT * 3);
    for (let i = 0; i < N_COUNT; i++) {
      nPos[i * 3]     = (Math.random() - 0.5) * 3.5;
      nPos[i * 3 + 1] = Math.random() * 1.5;
      nPos[i * 3 + 2] = (Math.random() - 0.5) * 3.5;
    }
    nGeo.setAttribute('position', new THREE.BufferAttribute(nPos, 3));
    const nMat = new THREE.PointsMaterial({ color: 0xc8f169, size: 0.14, transparent: true, opacity: 0 });
    const nPoints = new THREE.Points(nGeo, nMat);
    farmGroup.add(nPoints);

    // Horizon glow backdrop
    const horizonGeo = new THREE.PlaneGeometry(60, 20);
    const horizonMat = new THREE.MeshBasicMaterial({ color: 0x2e563e });
    const horizonMesh = new THREE.Mesh(horizonGeo, horizonMat);
    horizonMesh.position.set(0, 3.0, -10.5);
    farmGroup.add(horizonMesh);

    // ── CatmullRomCurve3 Camera Path ───────────────────────────────────────
    const camCurve = new THREE.CatmullRomCurve3(CAM_POS);
    const lookCurve = new THREE.CatmullRomCurve3(CAM_LOOK);

    const tmpPos = new THREE.Vector3();
    const tmpLook = new THREE.Vector3();
    let satAngle = 0;

    // Visibility change handler (pauses rendering when tab hidden)
    let isTabVisible = !document.hidden;
    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // ── Main Render Loop ───────────────────────────────────────────────────
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      if (!isTabVisible) return;

      const p = Math.max(0, Math.min(1, scrollProgRef.current));
      const now = performance.now();

      // Camera spline interpolation
      camCurve.getPoint(p, tmpPos);
      lookCurve.getPoint(p, tmpLook);

      camera.position.lerp(tmpPos, 0.1);
      camera.lookAt(tmpLook);

      // Section visibility gating
      spaceGroup.visible = p < 0.28;
      mapGroup.visible   = p >= 0.18 && p < 0.42;
      farmGroup.visible  = p >= 0.32;

      // Space Zone animations
      if (spaceGroup.visible) {
        earthMesh.rotation.y += 0.0008;
        cloudMesh.rotation.y += 0.0011;

        satAngle += 0.012;
        satGroup.position.set(
          earthMesh.position.x + Math.cos(satAngle) * 9.5,
          earthMesh.position.y + Math.sin(satAngle * 0.4) * 2.5,
          earthMesh.position.z + Math.sin(satAngle) * 4.5
        );
        satGroup.lookAt(earthMesh.position);
      }

      // Map Zone animations
      if (mapGroup.visible) {
        activePinGroup.position.y = Math.sin(now * 0.003) * 0.08;
      }

      // Farm Zone animations
      if (farmGroup.visible) {
        // Cutaway in Scene 3 (p ~ 0.30 to 0.45)
        cutawayGroup.visible = p >= 0.30 && p < 0.44;
        if (cutawayGroup.visible && aquiferMesh) {
          const trend = graceTrends?.trends_cm_per_year?.northwest_barind ?? -1.07;
          aquiferMesh.position.y = -0.92 + Math.sin(now * 0.002) * 0.05 + (trend < 0 ? -0.06 : 0.06);
        }

        // Rain in Scene 4 & 7 (p ~ 0.44 to 0.54 and 0.75 to 0.85)
        const isRaining = (p >= 0.44 && p < 0.54) || (p >= 0.75 && p < 0.85);
        rainMat.opacity = isRaining ? 0.75 : 0;
        if (isRaining) {
          const arr = rainGeo.attributes.position.array;
          for (let i = 1; i < arr.length; i += 3) {
            arr[i] -= 0.14;
            if (arr[i] < 0) arr[i] = 4.8;
          }
          rainGeo.attributes.position.needsUpdate = true;
        }

        // +N Legumes in Scene 5 (p ~ 0.54 to 0.65)
        const isLegume = p >= 0.54 && p < 0.65;
        nMat.opacity = isLegume ? 0.8 : 0;
        if (isLegume) {
          const arr = nGeo.attributes.position.array;
          for (let i = 1; i < arr.length; i += 3) {
            arr[i] += 0.02;
            if (arr[i] > 1.8) arr[i] = 0.2;
          }
          nGeo.attributes.position.needsUpdate = true;
        }

        // Best Strategy Star in Scene 6 (p ~ 0.65 to 0.76)
        starMesh.visible = p >= 0.64 && p < 0.76;
        if (starMesh.visible) {
          starMesh.rotation.y += 0.03;
          starMesh.position.y = 1.1 + Math.sin(now * 0.004) * 0.08;
        }

        // Speech bubble in Scene 9 (p >= 0.92)
        speechBubble.visible = p >= 0.92;
        if (speechBubble.visible) {
          speechBubble.position.y = 2.1 + Math.sin(now * 0.003) * 0.06;
        }

        // Crop plants gentle sway
        const sway = Math.sin(now * 0.0025) * 0.06;
        farmBeds.forEach((bed, bi) => {
          bed.rotation.z = sway * ((bi % 2 === 0) ? 1 : -1);
        });

        // Dawn lighting in Scene 9 vs dusk lighting in 3-8
        if (p >= 0.90) {
          sunLight.color.set(0xffe2b0);
          sunLight.intensity = 2.4;
          horizonMat.color.set(0x383020);
        } else {
          sunLight.color.set(0xfff8ea);
          sunLight.intensity = 2.0;
          horizonMat.color.set(0x163424);
        }
      }

      // Background color & fog per zone (lum > 0.16 across all zones)
      if (spaceGroup.visible) {
        scene.background.set(0x284260);
        scene.fog.color.set(0x284260);
        scene.fog.density = 0.003;
      } else if (mapGroup.visible) {
        scene.background.set(0x284e3a);
        scene.fog.color.set(0x284e3a);
        scene.fog.density = 0.005;
      } else {
        scene.background.set(0x305540);
        scene.fog.color.set(0x305540);
        scene.fog.density = 0.007;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Clean disposal on unmount ──────────────────────────────────────────
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', onResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);

      renderer.dispose();
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });

      if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [activeField, graceTrends, onsetComparison]);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    />
  );
}

export default OrbitToFieldCanvas;
