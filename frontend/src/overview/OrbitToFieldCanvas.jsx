// frontend/src/overview/OrbitToFieldCanvas.jsx  — OF2-OF4 rewrite (crash-safe)
// ONE continuous 3D world: Space → Bangladesh → Farm
// Camera flies along CatmullRomCurve3 driven by scrollProgress (0-1).
// Performance: DPR ≤ 1.5, particles ≤ 2000, draw calls ≤ 150, auto-degrades at < 40 FPS.
// All geometry is created with standard Three.js BufferGeometry constructors only.
// No Object.assign on Three.js objects, no raw arrays as Mesh geometry.

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

// ─── camera spline keypoints ─────────────────────────────────────────────────
const CAM_POS = [
  new THREE.Vector3(0,  2, 28),   // 0.0 – space
  new THREE.Vector3(0,  1, 18),   // 0.1 – zoom toward Earth
  new THREE.Vector3(0,  0,  8),   // 0.2 – dive through clouds
  new THREE.Vector3(0,  3,  0),   // 0.3 – emerge above BD map
  new THREE.Vector3(-1, 2, -3),   // 0.4 – tilt to see pins
  new THREE.Vector3(0,  1.5, -6), // 0.5 – descend to farm
  new THREE.Vector3(2,  1.5, -9), // 0.6 – farm wide
  new THREE.Vector3(1,  1,  -11), // 0.7 – water cutaway
  new THREE.Vector3(-1, 1.2,-13), // 0.8 – heat/rain
  new THREE.Vector3(0,  0.8,-15), // 0.9 – rotation decision
  new THREE.Vector3(0,  1.4,-13), // 1.0 – pull back
];
const CAM_LOOK = [
  new THREE.Vector3( 0, 0,  0),
  new THREE.Vector3( 0, 0,  0),
  new THREE.Vector3( 0, 0, -2),
  new THREE.Vector3( 0, 0, -5),
  new THREE.Vector3( 0, 0, -7),
  new THREE.Vector3( 0, 0,-10),
  new THREE.Vector3( 0, 0,-12),
  new THREE.Vector3( 0, 0,-14),
  new THREE.Vector3( 0, 0,-16),
  new THREE.Vector3( 0, 0,-18),
  new THREE.Vector3( 0, 0.5,-17),
];

// geo helper
function latLonToMap(lat, lon) {
  return { x: (lon - 90.35) * 1.6, y: (lat - 23.5) * 1.6 };
}

// canvas-sprite label
function makeLabel(text, hexColor = '#C8F169', bg = 'rgba(10,20,14,0.82)') {
  const c = document.createElement('canvas');
  c.width = 384; c.height = 112;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = bg;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(6, 6, 372, 100, 20);
  else ctx.rect(6, 6, 372, 100);
  ctx.fill();
  ctx.strokeStyle = hexColor;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.font = 'bold 40px sans-serif';
  ctx.fillStyle = hexColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 192, 56);
  const tex = new THREE.CanvasTexture(c);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(3.0, 0.88, 1);
  return sp;
}

// farm primitives ─────────────────────────────────────────────────────────────
function buildHut() {
  const g = new THREE.Group();
  // walls
  const wallsMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.0, 1.1),
    new THREE.MeshLambertMaterial({ color: 0xc8a96e })
  );
  wallsMesh.position.y = 0.5;
  g.add(wallsMesh);
  // door
  const doorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.5, 0.05),
    new THREE.MeshLambertMaterial({ color: 0x5a3918 })
  );
  doorMesh.position.set(0, 0.25, 0.575);
  g.add(doorMesh);
  // roof panels
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x8b7355, side: THREE.DoubleSide });
  const roofL = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.9), roofMat);
  roofL.position.set(-0.42, 1.08, 0);
  roofL.rotation.z = Math.PI / 5;
  g.add(roofL);
  const roofR = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.9), roofMat);
  roofR.position.set(0.42, 1.08, 0);
  roofR.rotation.z = -Math.PI / 5;
  g.add(roofR);
  return g;
}

function buildPalm(height = 2.4) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.09, height, 7),
    new THREE.MeshLambertMaterial({ color: 0x7a5c35 })
  );
  trunk.position.y = height / 2;
  g.add(trunk);
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, 1.1),
      new THREE.MeshLambertMaterial({ color: 0x3a7c2a, side: THREE.DoubleSide })
    );
    leaf.position.y = height;
    leaf.rotation.y = (i / 7) * Math.PI * 2;
    leaf.rotation.z = Math.PI / 4;
    g.add(leaf);
  }
  return g;
}

function buildCow(color = 0xf0ebe0) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.28, 0.24),
    new THREE.MeshLambertMaterial({ color })
  );
  body.position.y = 0.22;
  g.add(body);
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.17, 0.17, 0.17),
    new THREE.MeshLambertMaterial({ color })
  );
  head.position.set(0.33, 0.33, 0);
  g.add(head);
  for (const lx of [-0.14, 0.14]) {
    for (const lz of [-0.08, 0.08]) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.2, 5),
        new THREE.MeshLambertMaterial({ color: 0xd4c9a8 })
      );
      leg.position.set(lx, 0.1, lz);
      g.add(leg);
    }
  }
  return g;
}

function buildBed(w = 1.1, d = 0.75, cropColor = 0x4a9c38, hasWater = false) {
  const g = new THREE.Group();
  // soil
  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.14, d),
    new THREE.MeshLambertMaterial({ color: 0x5a3e1c })
  );
  soil.position.y = 0.07;
  g.add(soil);
  // water surface
  if (hasWater) {
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(w - 0.04, d - 0.04),
      new THREE.MeshLambertMaterial({ color: 0x38a0c8, transparent: true, opacity: 0.72 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.145;
    g.add(water);
  } else {
    // crops
    const cropMat = new THREE.MeshLambertMaterial({ color: cropColor });
    for (let ci = 0; ci < 4; ci++) {
      for (let cj = 0; cj < 3; cj++) {
        const plant = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.28, 4), cropMat);
        plant.position.set(
          -w / 2 + 0.18 + ci * ((w - 0.3) / 3),
          0.28,
          -d / 2 + 0.18 + cj * ((d - 0.3) / 2)
        );
        g.add(plant);
      }
    }
  }
  // bunds (raised ridges around bed)
  const bundMat = new THREE.MeshLambertMaterial({ color: 0x6e5030 });
  [
    { pos: [0, 0.14, d / 2],  size: [w + 0.1, 0.1, 0.07] },
    { pos: [0, 0.14, -d / 2], size: [w + 0.1, 0.1, 0.07] },
    { pos: [w / 2, 0.14, 0],  size: [0.07, 0.1, d] },
    { pos: [-w / 2, 0.14, 0], size: [0.07, 0.1, d] },
  ].forEach(({ pos, size }) => {
    const bund = new THREE.Mesh(new THREE.BoxGeometry(...size), bundMat);
    bund.position.set(...pos);
    g.add(bund);
  });
  return g;
}

// ─── main component ───────────────────────────────────────────────────────────
export function OrbitToFieldCanvas({
  scrollProgress = 0,
  activeField = null,
  graceTrends = null,
  onFpsUpdate = null,
}) {
  const mountRef = useRef(null);
  const progressRef = useRef(scrollProgress);
  progressRef.current = scrollProgress;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── renderer ────────────────────────────────────────────────────────
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // ── scene + camera ──────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05080c, 0.012);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.05, 300);

    const camCurve  = new THREE.CatmullRomCurve3(CAM_POS,  false, 'catmullrom', 0.5);
    const lookCurve = new THREE.CatmullRomCurve3(CAM_LOOK, false, 'catmullrom', 0.5);

    // ── lighting ────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x112211, 0.9));
    const sun = new THREE.DirectionalLight(0xfff8e7, 2.4);
    sun.position.set(12, 10, 8);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x38D9F5, 0.6);
    fill.position.set(-8, -4, 4);
    scene.add(fill);
    const farmWarm = new THREE.PointLight(0xf5b04c, 1.8, 18);
    farmWarm.position.set(1, 3, -11);
    scene.add(farmWarm);

    // ════════════════════════════════════════════════════════════════════
    // ZONE 0 — SPACE
    // ════════════════════════════════════════════════════════════════════
    const spaceGroup = new THREE.Group();
    scene.add(spaceGroup);

    // Starfield
    const STAR_N = 1600;
    const starPos = new Float32Array(STAR_N * 3);
    const starCol = new Float32Array(STAR_N * 3);
    for (let i = 0; i < STAR_N; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const r  = 80 + Math.random() * 60;
      starPos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
      starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      starPos[i * 3 + 2] = r * Math.cos(ph);
      const lum = 0.5 + Math.random() * 0.5;
      starCol[i * 3]     = lum + (Math.random() > 0.85 ? 0.3 : 0);
      starCol[i * 3 + 1] = lum;
      starCol[i * 3 + 2] = lum + (Math.random() > 0.85 ? 0.4 : 0);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color',    new THREE.BufferAttribute(starCol, 3));
    spaceGroup.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      size: 0.35, vertexColors: true, transparent: true, opacity: 0.9,
    })));

    // Earth globe (SphereGeometry — real texture if available, blue fallback)
    const earthGeo = new THREE.SphereGeometry(6.0, 64, 32);
    const earthMat = new THREE.MeshStandardMaterial({ color: 0x1a6090, roughness: 0.75 });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(3, -0.5, 0);
    // rotate so Bangladesh (~90.4°E) faces camera (+Z)
    earthMesh.rotation.y = THREE.MathUtils.degToRad(90.4 - 90);
    spaceGroup.add(earthMesh);

    new THREE.TextureLoader().load(
      '/textures/earth_day_2048.jpg',
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        earthMat.map = tex;
        earthMat.color.set(0xffffff);
        earthMat.needsUpdate = true;
      },
      undefined, () => {}  // silent fallback: blue sphere stays
    );

    // Cloud sphere
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xddeef8, transparent: true, opacity: 0.28, roughness: 1, depthWrite: false });
    const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(6.0 * 1.015, 48, 24), cloudMat);
    cloudMesh.position.copy(earthMesh.position);
    spaceGroup.add(cloudMesh);

    // Atmosphere glow (back-side, slightly larger)
    const atmMesh = new THREE.Mesh(
      new THREE.SphereGeometry(6.0 * 1.09, 36, 18),
      new THREE.MeshStandardMaterial({ color: 0x38D9F5, transparent: true, opacity: 0.14, side: THREE.BackSide, roughness: 1, depthWrite: false })
    );
    atmMesh.position.copy(earthMesh.position);
    spaceGroup.add(atmMesh);

    // Satellite (box body + 2 flat solar panels)
    const satGroup = new THREE.Group();
    satGroup.add(new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.28, 0.28),
      new THREE.MeshStandardMaterial({ color: 0xd0dce8, metalness: 0.75, roughness: 0.3 })
    ));
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1a4a9a, metalness: 0.5, roughness: 0.4 });
    for (const px of [-0.72, 0.72]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.32), panelMat);
      panel.position.x = px;
      satGroup.add(panel);
    }
    // Scan cone (ConeGeometry with open-ended = true is fine)
    const scanCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 2.0, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xC8F169, transparent: true, opacity: 0.08, side: THREE.DoubleSide })
    );
    scanCone.rotation.z = Math.PI;
    scanCone.position.y = -1.0;
    satGroup.add(scanCone);
    satGroup.position.set(10, 3.5, 2);
    spaceGroup.add(satGroup);

    // ════════════════════════════════════════════════════════════════════
    // ZONE 1 — BANGLADESH MAP
    // ════════════════════════════════════════════════════════════════════
    const mapGroup = new THREE.Group();
    mapGroup.position.set(0, 0, -5);
    mapGroup.rotation.x = -0.3;
    mapGroup.visible = false;
    scene.add(mapGroup);

    // Sea floor
    const seaMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 20),
      new THREE.MeshLambertMaterial({ color: 0x0a2535 })
    );
    seaMesh.rotation.x = -Math.PI / 2;
    seaMesh.position.y = -0.05;
    mapGroup.add(seaMesh);

    // Bangladesh outline via key points (lat, lon)
    const bdPoints = [
      [24.46, 88.08], [24.59, 88.28], [24.72, 88.56], [25.19, 88.68],
      [25.59, 89.02], [26.02, 89.07], [26.63, 88.70], [26.57, 89.49],
      [25.90, 89.90], [25.52, 90.42], [25.34, 91.17], [25.09, 91.84],
      [24.49, 91.95], [24.05, 92.07], [23.64, 91.65], [22.95, 91.81],
      [22.07, 92.08], [21.45, 91.93], [21.69, 91.08], [21.98, 89.48],
      [22.49, 89.09], [22.76, 89.05], [22.98, 88.56], [23.18, 88.72],
      [23.76, 88.23], [24.04, 88.08],
    ];
    const bdShape = new THREE.Shape();
    bdPoints.forEach(([lat, lon], i) => {
      const { x, y } = latLonToMap(lat, lon);
      if (i === 0) bdShape.moveTo(x, y); else bdShape.lineTo(x, y);
    });
    bdShape.closePath();

    const bdExtGeo = new THREE.ExtrudeGeometry(bdShape, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 1 });
    const bdMesh = new THREE.Mesh(bdExtGeo, new THREE.MeshLambertMaterial({ color: 0x1e5c38 }));
    bdMesh.rotation.x = Math.PI / 2;
    bdMesh.position.set(0, 0.3, 0);
    mapGroup.add(bdMesh);

    // Neon border
    const bdLine = new THREE.LineSegments(
      new THREE.EdgesGeometry(bdExtGeo),
      new THREE.LineBasicMaterial({ color: 0xC8F169, transparent: true, opacity: 0.5 })
    );
    bdLine.rotation.x = Math.PI / 2;
    bdLine.position.set(0, 0.32, 0);
    mapGroup.add(bdLine);

    // Region pins
    const regions = [
      { key: 'barind', color: 0xC8F169, label: 'Barind', lat: 24.6, lon: 88.9 },
      { key: 'haor',   color: 0x38D9F5, label: 'Haor',   lat: 24.8, lon: 91.1 },
      { key: 'coast',  color: 0xF5B04C, label: 'Coast',  lat: 22.4, lon: 89.5 },
    ];
    regions.forEach(reg => {
      const { x, y } = latLonToMap(reg.lat, reg.lon);
      const pinG = new THREE.Group();
      pinG.position.set(x, 0.6, -y);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.18, 0.32, 20),
        new THREE.MeshBasicMaterial({ color: reg.color, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
      );
      ring.rotation.x = -Math.PI / 2;
      pinG.add(ring);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 12, 8),
        new THREE.MeshLambertMaterial({ color: reg.color })
      );
      head.position.y = 0.5;
      pinG.add(head);

      const lbl = makeLabel(reg.label, '#' + reg.color.toString(16).padStart(6, '0'));
      lbl.position.set(0, 1.2, 0);
      pinG.add(lbl);
      mapGroup.add(pinG);
    });

    // Active field pin
    const fLat = activeField?.latitude  != null ? Number(activeField.latitude)  : 24.62;
    const fLon = activeField?.longitude != null ? Number(activeField.longitude) : 88.55;
    const { x: fx, y: fy } = latLonToMap(fLat, fLon);
    const fieldPinG = new THREE.Group();
    fieldPinG.position.set(fx, 0.6, -fy);

    const fieldPulse = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.5, 20),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    fieldPulse.rotation.x = -Math.PI / 2;
    fieldPinG.add(fieldPulse);

    const fieldHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 12, 8),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    fieldHead.position.y = 0.6;
    fieldPinG.add(fieldHead);

    const fieldLbl = makeLabel(activeField?.name || 'Your Field', '#EAF2EC', 'rgba(10,20,14,0.9)');
    fieldLbl.position.set(0, 1.4, 0);
    fieldPinG.add(fieldLbl);

    // Light beam (open-ended cone)
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 2.5, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false })
    );
    beam.position.y = -1.0;
    fieldPinG.add(beam);
    mapGroup.add(fieldPinG);

    // ════════════════════════════════════════════════════════════════════
    // ZONE 2 — FARM WORLD
    // ════════════════════════════════════════════════════════════════════
    const farmGroup = new THREE.Group();
    farmGroup.position.set(0, 0, -11);
    farmGroup.visible = false;
    scene.add(farmGroup);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 20),
      new THREE.MeshLambertMaterial({ color: 0x1e3a14 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    farmGroup.add(ground);

    // 6 beds arranged in 2 rows of 3
    const bedDefs = [
      { x: -1.0, z:  0.5, color: 0xdec050, water: true  },
      { x:  0.0, z:  0.5, color: 0x4a8f30, water: false },
      { x:  1.0, z:  0.5, color: 0xe8d040, water: false },
      { x: -1.0, z: -0.5, color: 0x4a8f30, water: false },
      { x:  0.0, z: -0.5, color: 0x5a3e1c, water: false },
      { x:  1.0, z: -0.5, color: 0xdec050, water: true  },
    ];
    bedDefs.forEach(b => {
      const bed = buildBed(0.85, 0.65, b.color, b.water);
      bed.position.set(b.x * 2.0, 0, b.z * 1.5);
      farmGroup.add(bed);
    });

    // Farm house
    const hut = buildHut();
    hut.position.set(-2.8, 0, 0.3);
    hut.rotation.y = Math.PI / 6;
    farmGroup.add(hut);

    // Haystack (flattened sphere)
    const haystack = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 10, 6),
      new THREE.MeshLambertMaterial({ color: 0xd4a040 })
    );
    haystack.scale.set(1, 0.65, 1);
    haystack.position.set(-3.4, 0.27, -0.8);
    farmGroup.add(haystack);

    // Pond (CircleGeometry, squash via mesh.scale)
    const pondMesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.9, 24),
      new THREE.MeshLambertMaterial({ color: 0x1a7ab0, transparent: true, opacity: 0.85 })
    );
    pondMesh.rotation.x = -Math.PI / 2;
    pondMesh.scale.set(1, 1, 0.65);  // squash Z to make ellipse
    pondMesh.position.set(3.4, 0.01, 0.4);
    farmGroup.add(pondMesh);

    // Tubewell pump — build parts separately (never use Object.assign on Three.js objects)
    const tubewellGroup = new THREE.Group();
    const tubePipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.75, 8),
      new THREE.MeshLambertMaterial({ color: 0x888888 })
    );
    tubePipe.position.y = 0.37;
    tubewellGroup.add(tubePipe);
    const tubeHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.14, 0.14),
      new THREE.MeshLambertMaterial({ color: 0xcc4444 })
    );
    tubeHead.position.y = 0.78;
    tubewellGroup.add(tubeHead);
    tubewellGroup.position.set(2.8, 0, -0.9);
    farmGroup.add(tubewellGroup);

    // Palm trees
    [[-3.8, 1.2], [-3.6, -1.0], [3.8, -1.2], [4.0, 0.9]].forEach(([tx, tz]) => {
      const palm = buildPalm(1.8 + Math.random() * 0.8);
      palm.position.set(tx, 0, tz);
      farmGroup.add(palm);
    });

    // Cows
    [[1.6, -1.5], [2.2, -1.2]].forEach(([cx, cz], i) => {
      const cow = buildCow(i === 0 ? 0xf0ebe0 : 0x9e8060);
      cow.position.set(cx, 0, cz);
      cow.rotation.y = i * 0.8;
      farmGroup.add(cow);
    });

    // Soil cutaway (GRACE section)
    const cutawayGroup = new THREE.Group();
    cutawayGroup.position.set(-1.5, -0.5, 0.5);
    cutawayGroup.visible = false;
    farmGroup.add(cutawayGroup);

    const soilDefs = [
      { y:  0,    h: 0.4, color: 0x4a7c35 },
      { y: -0.4,  h: 0.5, color: 0x7a5a3a },
      { y: -0.95, h: 0.4, color: 0x38a0c8, transparent: true, opacity: 0.75 },
      { y: -1.4,  h: 0.4, color: 0x2a1e14 },
    ];
    let aquiferMesh = null;
    soilDefs.forEach((s, si) => {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, s.h, 1.1),
        new THREE.MeshLambertMaterial({ color: s.color, transparent: !!s.transparent, opacity: s.opacity ?? 1 })
      );
      m.position.y = s.y;
      cutawayGroup.add(m);
      if (si === 2) aquiferMesh = m;
    });

    // Rain particles (200 pts)
    const RAIN_N = 200;
    const rainPos = new Float32Array(RAIN_N * 3);
    for (let i = 0; i < RAIN_N; i++) {
      rainPos[i * 3]     = (Math.random() - 0.5) * 10;
      rainPos[i * 3 + 1] = Math.random() * 5;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({ color: 0x38D9F5, size: 0.06, transparent: true, opacity: 0.0 });
    const rainMesh = new THREE.Points(rainGeo, rainMat);
    farmGroup.add(rainMesh);

    // Horizon strip
    const horizonMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 6),
      new THREE.MeshBasicMaterial({ color: 0x1a1208, transparent: true, opacity: 0.85 })
    );
    horizonMesh.position.set(0, 1.5, -9);
    scene.add(horizonMesh);

    // Silhouette tree line
    const silMat = new THREE.MeshBasicMaterial({ color: 0x0a1208 });
    for (let tx = -10; tx <= 10; tx += 1.2) {
      const h = 1.4 + Math.random() * 1.0;
      const sil = new THREE.Mesh(new THREE.BoxGeometry(0.5 + Math.random() * 0.4, h, 0.2), silMat);
      sil.position.set(tx, h / 2 - 0.1, -8.5);
      scene.add(sil);
    }

    // ── animation loop ──────────────────────────────────────────────────
    let animId;
    let frameCount = 0, fpsTimer = 0, lastTime = performance.now();
    let lowFpsCount = 0, degraded = false;
    const tmpPos  = new THREE.Vector3();
    const tmpLook = new THREE.Vector3();

    const render = () => {
      animId = requestAnimationFrame(render);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      frameCount++;
      fpsTimer += dt;
      if (fpsTimer >= 1) {
        const fps = Math.round(frameCount / fpsTimer);
        if (onFpsUpdate) onFpsUpdate(fps);
        if (fps < 40) { lowFpsCount++; } else { lowFpsCount = Math.max(0, lowFpsCount - 1); }
        if (!degraded && lowFpsCount > 2) {
          degraded = true;
          rainMat.opacity = 0;
          renderer.setPixelRatio(1.0);
        }
        frameCount = 0; fpsTimer = 0;
      }

      const p = Math.max(0, Math.min(1, progressRef.current));

      // Camera along spline
      camCurve.getPoint(p, tmpPos);
      camera.position.lerp(tmpPos, 0.12);
      lookCurve.getPoint(p, tmpLook);
      camera.lookAt(tmpLook);

      // Scene visibility
      spaceGroup.visible = p < 0.38;
      mapGroup.visible   = p > 0.18 && p < 0.72;
      farmGroup.visible  = p > 0.45;

      // Animations
      earthMesh.rotation.y += 0.0012;
      cloudMesh.rotation.y += 0.0005;

      // Satellite orbit
      const satT = (now * 0.00022) % (Math.PI * 2);
      satGroup.position.set(
        earthMesh.position.x + Math.cos(satT) * 9,
        earthMesh.position.y + Math.sin(satT * 0.4) * 2.5,
        earthMesh.position.z + Math.sin(satT) * 4
      );
      satGroup.lookAt(earthMesh.position);

      // Field pin pulse
      fieldPulse.material.opacity = (0.85 + Math.sin(now * 0.003) * 0.15) * 0.85;
      fieldHead.position.y = 0.6 + Math.sin(now * 0.003) * 0.05;

      // Rain fade in p=0.72-0.82
      const rainFade = farmGroup.visible && !degraded
        ? Math.max(0, Math.min(1, (p - 0.72) / 0.06)) * Math.max(0, Math.min(1, (0.82 - p) / 0.06))
        : 0;
      rainMat.opacity = rainFade * 0.8;
      if (rainFade > 0.05) {
        const rpa = rainGeo.attributes.position.array;
        for (let i = 1; i < rpa.length; i += 3) {
          rpa[i] -= 0.12;
          if (rpa[i] < -1) rpa[i] = 5;
        }
        rainGeo.attributes.position.needsUpdate = true;
      }

      // Soil cutaway p=0.62-0.73
      cutawayGroup.visible = farmGroup.visible && p > 0.62 && p < 0.73;
      if (cutawayGroup.visible && aquiferMesh) {
        const trend = graceTrends?.trends_cm_per_year?.northwest_barind ?? -1.07;
        aquiferMesh.position.y = -0.95 + Math.sin(now * 0.001) * 0.05 + (trend < 0 ? -0.08 : 0.08);
      }

      // Scene environment
      scene.fog.density = farmGroup.visible ? 0.018 : (mapGroup.visible ? 0.008 : 0.004);
      scene.background = new THREE.Color(spaceGroup.visible ? 0x01020a : (mapGroup.visible ? 0x060f0a : 0x040906));

      renderer.render(scene, camera);
    };

    render();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
    />
  );
}

export default OrbitToFieldCanvas;
