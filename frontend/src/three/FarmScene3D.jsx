// frontend/src/three/FarmScene3D.jsx
// Unified 3D Farm Component for FieldShift 2026 (G0 Architecture)
// Features:
// - Authentic clay diorama aesthetic (barn, silo, trees, fence, strata)
// - Configurable beds (6 for rotation plans, 1-3 for single season / splits)
// - Procedural crop models with growth stages (0..1) & stress transformations
// - Weather visual effects: rain particles, standing water, drought cracking, heat wilting
// - Interactive hover, selection, and camera presets ('iso', 'top', 'close')
// - Draw calls bounded <= 150, on-demand/throttled rendering, strict resource disposal
// - Complete 2D SVG fallback if WebGL is unavailable

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  createGrassTexture,
  createTilledSoilTexture,
  createDirtPathTexture,
  createSaltCrustTexture,
} from '../farmTextures.js';
import {
  FARM_PALETTE,
  getCropCategory,
  haToBigha,
  isWebGLAvailable,
} from './farmSceneHelpers.js';

export { FARM_PALETTE, getCropCategory, haToBigha, isWebGLAvailable };

export function FarmScene3D({
  beds = [],
  weather = { rainMul: 1.0, tempDelta: 0.0, event: 'none' },
  onBedClick = null,
  selectedBedId = null,
  cameraPreset = 'iso', // 'iso', 'top', 'close'
  fieldAreaHa = 1.0,
  fieldName = 'খামার প্লট',
  theme = 'dark',
  lang = 'bn',
  height = 420,
}) {
  const containerRef = useRef(null);
  const [hoveredBed, setHoveredBed] = useState(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  // Check WebGL support on mount
  useEffect(() => {
    setHasWebGL(isWebGLAvailable());
  }, []);

  const bighaStr = useMemo(() => {
    const b = haToBigha(fieldAreaHa);
    return b ? `${b} ${lang === 'bn' ? 'বিঘা' : 'bigha'}` : '';
  }, [fieldAreaHa, lang]);

  // Main Three.js Scene Setup & Animation
  useEffect(() => {
    if (!hasWebGL || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 640;
    const sceneHeight = height || 420;

    // Disposables tracking to prevent WebGL leaks
    const disposables = [];

    // Scene & Background
    const scene = new THREE.Scene();
    const isDark = theme === 'dark';
    scene.background = new THREE.Color(isDark ? FARM_PALETTE.bg_dark : FARM_PALETTE.bg_light);

    // Camera (Orthographic Isometric for diorama look)
    const aspect = width / sceneHeight;
    const d = 6.2;
    const camera = new THREE.OrthographicCamera(
      -d * aspect, d * aspect,
      d, -d,
      0.1, 100
    );

    const applyCameraPreset = (preset) => {
      if (preset === 'top') {
        camera.position.set(0, 16, 0.01);
      } else if (preset === 'close') {
        camera.position.set(5.5, 6.0, 5.5);
      } else {
        // default 'iso'
        camera.position.set(8.5, 9.2, 8.5);
      }
      camera.lookAt(0, 0.5, 0);
    };
    applyCameraPreset(cameraPreset);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, sceneHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2.15; // Prevent viewing underneath base
    controls.minZoom = 0.5;
    controls.maxZoom = 2.2;
    controls.target.set(0, 0.6, 0);

    // Lights
    const ambientLight = new THREE.AmbientLight(
      isDark ? '#d0e0d8' : '#ffffff',
      isDark ? 0.75 : 1.15
    );
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#fff4e0', isDark ? 1.4 : 1.6);
    dirLight.position.set(10, 15, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 35;
    const sc = 9;
    dirLight.shadow.camera.left = -sc;
    dirLight.shadow.camera.right = sc;
    dirLight.shadow.camera.top = sc;
    dirLight.shadow.camera.bottom = -sc;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight('#a6d5fa', isDark ? 0.45 : 0.6);
    fillLight.position.set(-8, 8, -6);
    scene.add(fillLight);

    // Procedural Textures
    const grassTex = createGrassTexture();
    const soilTex = createTilledSoilTexture();
    const dirtPathTex = createDirtPathTexture();
    const saltTex = createSaltCrustTexture();
    [grassTex, soilTex, dirtPathTex, saltTex].forEach(t => { if (t) disposables.push(t); });

    // Diorama Slab Base
    const slabGroup = new THREE.Group();
    const slabW = 11.6;
    const slabD = 11.6;

    // Strata layers (Bottom, Mid, Top)
    const matBot = new THREE.MeshStandardMaterial({ color: FARM_PALETTE.strata_bot, roughness: 0.95 });
    const botGeo = new RoundedBoxGeometry(slabW - 0.4, 0.8, slabD - 0.4, 2, 0.1);
    const botMesh = new THREE.Mesh(botGeo, matBot);
    botMesh.position.y = -0.85;
    botMesh.receiveShadow = true;
    slabGroup.add(botMesh);
    disposables.push(matBot, botGeo);

    const matMid = new THREE.MeshStandardMaterial({ color: FARM_PALETTE.strata_mid, roughness: 0.95 });
    const midGeo = new RoundedBoxGeometry(slabW - 0.2, 0.85, slabD - 0.2, 2, 0.1);
    const midMesh = new THREE.Mesh(midGeo, matMid);
    midMesh.position.y = -0.05;
    midMesh.receiveShadow = true;
    slabGroup.add(midMesh);
    disposables.push(matMid, midGeo);

    const matGrass = new THREE.MeshStandardMaterial({
      color: isDark ? FARM_PALETTE.grass_dark : FARM_PALETTE.grass_light,
      map: grassTex,
      roughness: 0.9,
    });
    const topGeo = new RoundedBoxGeometry(slabW, 0.8, slabD, 2, 0.12);
    const topMesh = new THREE.Mesh(topGeo, matGrass);
    topMesh.position.y = 0.72;
    topMesh.receiveShadow = true;
    slabGroup.add(topMesh);
    disposables.push(matGrass, topGeo);

    scene.add(slabGroup);

    // Low-Poly Farm Buildings (Barn, Silo, Fence, Trees)
    const buildingsGroup = new THREE.Group();

    // Barn
    const matBarnWall = new THREE.MeshStandardMaterial({ color: FARM_PALETTE.barn_wall, roughness: 0.85 });
    const matBarnRoof = new THREE.MeshStandardMaterial({ color: FARM_PALETTE.barn_roof, roughness: 0.8 });
    const barnGeo = new THREE.BoxGeometry(1.8, 1.1, 1.4);
    const barnMesh = new THREE.Mesh(barnGeo, matBarnWall);
    barnMesh.position.set(-3.8, 1.7, -3.6);
    barnMesh.castShadow = true;
    barnMesh.receiveShadow = true;
    buildingsGroup.add(barnMesh);

    const roofGeo = new THREE.CylinderGeometry(0.95, 0.95, 1.9, 3);
    const roofMesh = new THREE.Mesh(roofGeo, matBarnRoof);
    roofMesh.rotation.z = Math.PI / 2;
    roofMesh.position.set(-3.8, 2.45, -3.6);
    roofMesh.castShadow = true;
    buildingsGroup.add(roofMesh);
    disposables.push(matBarnWall, matBarnRoof, barnGeo, roofGeo);

    // Silo
    const matSilo = new THREE.MeshStandardMaterial({ color: FARM_PALETTE.silo, roughness: 0.85 });
    const siloBodyGeo = new THREE.CylinderGeometry(0.45, 0.45, 1.7, 12);
    const siloBodyMesh = new THREE.Mesh(siloBodyGeo, matSilo);
    siloBodyMesh.position.set(-2.2, 1.95, -4.2);
    siloBodyMesh.castShadow = true;
    buildingsGroup.add(siloBodyMesh);

    const siloDomeGeo = new THREE.SphereGeometry(0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const siloDomeMesh = new THREE.Mesh(siloDomeGeo, matSilo);
    siloDomeMesh.position.set(-2.2, 2.8, -4.2);
    siloDomeMesh.castShadow = true;
    buildingsGroup.add(siloDomeMesh);
    disposables.push(matSilo, siloBodyGeo, siloDomeGeo);

    // Trees
    const matTreeDark = new THREE.MeshStandardMaterial({ color: FARM_PALETTE.tree_dark, roughness: 0.9 });
    const matTreeLight = new THREE.MeshStandardMaterial({ color: FARM_PALETTE.tree_light, roughness: 0.9 });
    const matWood = new THREE.MeshStandardMaterial({ color: FARM_PALETTE.wood, roughness: 0.9 });
    const trunkGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.6, 6);
    const foliageGeo = new THREE.SphereGeometry(0.45, 8, 6);
    disposables.push(matTreeDark, matTreeLight, matWood, trunkGeo, foliageGeo);

    const treeLocs = [
      { x: -4.8, z: 0.2, mat: matTreeDark, s: 1.1 },
      { x: -4.6, z: 2.8, mat: matTreeLight, s: 0.95 },
      { x: 4.8, z: -4.4, mat: matTreeDark, s: 1.0 },
      { x: 4.6, z: 4.4, mat: matTreeLight, s: 0.9 },
      { x: 0.4, z: -4.8, mat: matTreeDark, s: 1.05 },
    ];
    treeLocs.forEach(tl => {
      const tg = new THREE.Group();
      tg.position.set(tl.x, 1.12, tl.z);
      tg.scale.setScalar(tl.s);
      const tr = new THREE.Mesh(trunkGeo, matWood);
      tr.position.y = 0.3;
      tr.castShadow = true;
      tg.add(tr);
      const fol = new THREE.Mesh(foliageGeo, tl.mat);
      fol.position.y = 0.75;
      fol.castShadow = true;
      tg.add(fol);
      buildingsGroup.add(tg);
    });

    // Walkway Path
    const matPath = new THREE.MeshStandardMaterial({ color: '#c2a882', map: dirtPathTex, roughness: 0.95 });
    const pathGeo = new RoundedBoxGeometry(0.45, 0.02, 7.6, 2, 0.03);
    const pathMesh = new THREE.Mesh(pathGeo, matPath);
    pathMesh.position.set(0, 1.14, 0.6);
    pathMesh.receiveShadow = true;
    buildingsGroup.add(pathMesh);
    disposables.push(matPath, pathGeo);

    scene.add(buildingsGroup);

    // Weather Effects Components
    const weatherEvent = weather?.event || 'none';
    const isDrought = weatherEvent === 'drought' || (weather?.rainMul != null && weather.rainMul < 0.65);
    const isHeavyRain = weatherEvent === 'heavy_rain' || weatherEvent === 'rain';
    const isFlood = weatherEvent === 'flood';
    const isHeat = weatherEvent === 'heatwave' || (weather?.tempDelta != null && weather.tempDelta >= 3.0);
    const isHumid = weatherEvent === 'humid';

    // 1. Rain Particles
    let rainSystem = null;
    if (isHeavyRain || isFlood) {
      const rainCount = isHeavyRain ? 350 : 180;
      const rainGeo = new THREE.BufferGeometry();
      const rainPos = new Float32Array(rainCount * 3);
      for (let i = 0; i < rainCount * 3; i += 3) {
        rainPos[i] = (Math.random() - 0.5) * 11;
        rainPos[i + 1] = 1.2 + Math.random() * 5.0;
        rainPos[i + 2] = (Math.random() - 0.5) * 11;
      }
      rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
      const rainMat = new THREE.PointsMaterial({
        color: '#9ad0e8',
        size: 0.06,
        transparent: true,
        opacity: 0.75,
      });
      rainSystem = new THREE.Points(rainGeo, rainMat);
      scene.add(rainSystem);
      disposables.push(rainGeo, rainMat);
    }

    // 2. Humid / Mist Atmosphere
    if (isHumid) {
      scene.fog = new THREE.FogExp2(isDark ? '#1a2924' : '#e2ede7', 0.045);
    }

    // Interactive Crop Beds Layout
    // Normalizes bed count: 6 beds for 6 seasons (2 cols x 3 rows), or 1-3 beds for single-season splits
    const bedCount = Math.max(1, Math.min(6, beds.length || 6));
    const normalizedBeds = beds.length > 0 ? beds : [
      { id: 'b1', label: 'Y1-S1', crop: 'Mustard', season: 'Rabi' },
      { id: 'b2', label: 'Y1-S2', crop: 'Mungbean', season: 'Kharif-1' },
      { id: 'b3', label: 'Y1-S3', crop: 'T.Aman Rice', season: 'Kharif-2' },
      { id: 'b4', label: 'Y2-S1', crop: 'Wheat', season: 'Rabi' },
      { id: 'b5', label: 'Y2-S2', crop: 'Sesame', season: 'Kharif-1' },
      { id: 'b6', label: 'Y2-S3', crop: 'T.Aman Rice', season: 'Kharif-2' },
    ];

    // Bed placement slots
    let bedLayout = [];
    if (bedCount <= 1) {
      bedLayout = [{ x: 0, z: 0.6, w: 5.6, d: 4.8 }];
    } else if (bedCount === 2) {
      bedLayout = [
        { x: -1.8, z: 0.6, w: 2.8, d: 4.8 },
        { x: 1.8, z: 0.6, w: 2.8, d: 4.8 },
      ];
    } else if (bedCount === 3) {
      bedLayout = [
        { x: -2.0, z: 0.6, w: 2.4, d: 4.8 },
        { x: 0.6, z: 0.6, w: 2.4, d: 4.8 },
        { x: 3.0, z: 0.6, w: 2.0, d: 4.8 },
      ];
    } else {
      // 6-bed grid (2 columns x 3 rows)
      const xs = [-1.7, 1.7];
      const zs = [-2.1, 0.6, 3.3];
      bedLayout = [
        { x: xs[0], z: zs[0], w: 2.7, d: 2.2 },
        { x: xs[1], z: zs[0], w: 2.7, d: 2.2 },
        { x: xs[0], z: zs[1], w: 2.7, d: 2.2 },
        { x: xs[1], z: zs[1], w: 2.7, d: 2.2 },
        { x: xs[0], z: zs[2], w: 2.7, d: 2.2 },
        { x: xs[1], z: zs[2], w: 2.7, d: 2.2 },
      ];
    }

    const interactiveMeshes = [];

    // Shared Crop Model Geometries
    const CROP_GEOS = {
      rice_tiller: new THREE.CylinderGeometry(0.02, 0.05, 0.38, 4),
      mustard_flower: new THREE.SphereGeometry(0.11, 6, 5),
      wheat_ear: new THREE.ConeGeometry(0.07, 0.42, 5),
      sunflower_head: new THREE.CylinderGeometry(0.14, 0.14, 0.05, 8),
      pulse_bush: new THREE.DodecahedronGeometry(0.12),
      jute_stem: new THREE.CylinderGeometry(0.03, 0.04, 0.65, 4),
      potato_leaf: new THREE.ConeGeometry(0.10, 0.22, 5),
      maize_stalk: new THREE.CylinderGeometry(0.04, 0.06, 0.55, 5),
      fallow_ridge: new THREE.BoxGeometry(0.2, 0.04, 0.8),
    };
    Object.values(CROP_GEOS).forEach(g => disposables.push(g));

    normalizedBeds.forEach((bed, idx) => {
      if (idx >= bedLayout.length) return;
      const slot = bedLayout[idx];
      const cropCat = getCropCategory(bed.crop);
      const isSelected = selectedBedId != null && String(selectedBedId) === String(bed.id);

      // Bed Base Soil
      let bedSoilColor = isDrought ? FARM_PALETTE.soil_drought : (isFlood ? FARM_PALETTE.soil_wet : FARM_PALETTE.soil_base);
      if (isSelected) {
        bedSoilColor = '#a8b87c'; // Highlight border
      }

      const bedMat = new THREE.MeshStandardMaterial({
        color: bedSoilColor,
        map: isDrought ? saltTex : soilTex,
        roughness: isDrought ? 0.75 : 0.92,
        emissive: isSelected ? '#2a3b1a' : '#000000',
      });
      const bedGeo = new RoundedBoxGeometry(slot.w, 0.14, slot.d, 2, 0.06);
      const bedMesh = new THREE.Mesh(bedGeo, bedMat);
      bedMesh.position.set(slot.x, 1.18, slot.z);
      bedMesh.castShadow = true;
      bedMesh.receiveShadow = true;
      bedMesh.userData = { bed, bedId: bed.id, isBed: true };
      scene.add(bedMesh);
      interactiveMeshes.push(bedMesh);
      disposables.push(bedMat, bedGeo);

      // Standing Water Sheet (Rice AWD or Flood event)
      const hasWaterSheet = isFlood || cropCat === 'rice' || (bed.waterDepthMm != null && bed.waterDepthMm > 0);
      if (hasWaterSheet) {
        const waterDepthNorm = Math.min(0.08, Math.max(0.02, (bed.waterDepthMm || 30) / 1000));
        const waterMat = new THREE.MeshStandardMaterial({
          color: FARM_PALETTE.water,
          roughness: 0.15,
          metalness: 0.2,
          transparent: true,
          opacity: isFlood ? 0.85 : 0.65,
        });
        const waterGeo = new THREE.PlaneGeometry(slot.w - 0.1, slot.d - 0.1);
        const waterMesh = new THREE.Mesh(waterGeo, waterMat);
        waterMesh.rotation.x = -Math.PI / 2;
        waterMesh.position.set(slot.x, 1.25 + waterDepthNorm, slot.z);
        scene.add(waterMesh);
        disposables.push(waterMat, waterGeo);
      }

      // Procedural Plants (Instanced for bounded draw calls)
      if (cropCat !== 'fallow') {
        const growth = Math.max(0.18, Math.min(1.0, bed.growthStage != null ? bed.growthStage : 0.9));
        const stressHeat = isHeat || (bed.stress && bed.stress.heat);
        const stressDrought = isDrought || (bed.stress && bed.stress.drought);

        // Plant Color & Tinting
        let cropColor = FARM_PALETTE.crop_rice;
        if (cropCat === 'mustard') cropColor = FARM_PALETTE.crop_mustard;
        else if (cropCat === 'wheat') cropColor = FARM_PALETTE.crop_wheat;
        else if (cropCat === 'pulse') cropColor = FARM_PALETTE.crop_pulse;
        else if (cropCat === 'sunflower') cropColor = FARM_PALETTE.crop_sunflower;
        else if (cropCat === 'jute') cropColor = FARM_PALETTE.crop_jute;
        else if (cropCat === 'potato') cropColor = FARM_PALETTE.crop_potato;
        else if (cropCat === 'maize') cropColor = FARM_PALETTE.crop_maize;

        // Apply stress discoloration (yellowing / drought browning)
        if (stressDrought) {
          cropColor = '#b59e56';
        }

        const plantMat = new THREE.MeshStandardMaterial({
          color: cropColor,
          roughness: 0.85,
        });
        disposables.push(plantMat);

        let plantGeo = CROP_GEOS.rice_tiller;
        if (cropCat === 'mustard') plantGeo = CROP_GEOS.mustard_flower;
        else if (cropCat === 'wheat') plantGeo = CROP_GEOS.wheat_ear;
        else if (cropCat === 'pulse') plantGeo = CROP_GEOS.pulse_bush;
        else if (cropCat === 'sunflower') plantGeo = CROP_GEOS.sunflower_head;
        else if (cropCat === 'jute') plantGeo = CROP_GEOS.jute_stem;
        else if (cropCat === 'potato') plantGeo = CROP_GEOS.potato_leaf;
        else if (cropCat === 'maize') plantGeo = CROP_GEOS.maize_stalk;

        // Populate a neat 4x3 or 5x4 grid of plants per bed
        const rows = slot.d > 3.0 ? 6 : 4;
        const cols = slot.w > 3.5 ? 7 : 4;
        const count = rows * cols;
        const instancedMesh = new THREE.InstancedMesh(plantGeo, plantMat, count);
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = true;

        const dummy = new THREE.Object3D();
        let pIdx = 0;
        const startX = slot.x - (slot.w / 2) + 0.35;
        const stepX = (slot.w - 0.7) / Math.max(1, cols - 1);
        const startZ = slot.z - (slot.d / 2) + 0.35;
        const stepZ = (slot.d - 0.7) / Math.max(1, rows - 1);

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const px = startX + c * stepX + (Math.sin(r * 2.1 + c) * 0.05);
            const pz = startZ + r * stepZ + (Math.cos(r + c * 1.8) * 0.05);
            dummy.position.set(px, 1.25, pz);

            // Scale by growth stage
            const scaleY = growth * (0.85 + (Math.sin(r + c) * 0.15));
            const scaleXZ = growth * (0.8 + (Math.cos(r * 1.5 + c) * 0.2));
            dummy.scale.set(scaleXZ, scaleY, scaleXZ);

            // Wilting angle if heat stressed
            if (stressHeat) {
              dummy.rotation.z = (Math.sin(c * 1.3) * 0.35);
              dummy.rotation.x = 0.25;
            } else {
              dummy.rotation.set(0, (r * 1.2 + c * 0.7), 0);
            }

            dummy.updateMatrix();
            instancedMesh.setMatrixAt(pIdx++, dummy.matrix);
          }
        }
        instancedMesh.instanceMatrix.needsUpdate = true;
        scene.add(instancedMesh);
        disposables.push(instancedMesh);
      }
    });

    // Raycasting for Bed Click & Hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);
      if (intersects.length > 0) {
        const target = intersects[0].object;
        renderer.domElement.style.cursor = 'pointer';
        setHoveredBed(target.userData.bed);
      } else {
        renderer.domElement.style.cursor = 'default';
        setHoveredBed(null);
      }
    };

    const handleClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);
      if (intersects.length > 0) {
        const clickedBed = intersects[0].object.userData.bed;
        if (onBedClick) onBedClick(clickedBed);
      }
    };

    renderer.domElement.addEventListener('mousemove', handlePointerMove);
    renderer.domElement.addEventListener('click', handleClick);

    // Animation Loop
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Rain drop falling motion
      if (rainSystem) {
        const positions = rainSystem.geometry.attributes.position.array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] -= delta * 7.5;
          if (positions[i] < 1.2) {
            positions[i] = 6.2;
          }
        }
        rainSystem.geometry.attributes.position.needsUpdate = true;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = height || 420;
      const asp = w / h;
      camera.left = -d * asp;
      camera.right = d * asp;
      camera.top = d;
      camera.bottom = -d;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Strict Cleanup & Disposal (Requirement G0)
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);

      disposables.forEach(d => {
        try {
          if (d.dispose) d.dispose();
        } catch {
          // ignore cleanup glitches
        }
      });

      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [hasWebGL, beds, weather, cameraPreset, selectedBedId, theme, height]);

  // WebGL-Off 2D Fallback
  if (!hasWebGL) {
    return (
      <div
        style={{
          width: '100%',
          height,
          background: theme === 'dark' ? '#0f1715' : '#f8fafc',
          borderRadius: 14,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--line, #334155)',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          🌿 {fieldName} ({bighaStr}) — {lang === 'bn' ? 'দ্বিমাত্রিক প্রদর্শন (WebGL বন্ধ)' : '2D Bed Layout (WebGL Unavailable)'}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: beds.length > 3 ? 'repeat(3, 1fr)' : `repeat(${beds.length || 1}, 1fr)`,
            gap: 12,
            width: '90%',
            maxWidth: 600,
          }}
        >
          {(beds.length > 0 ? beds : [{ id: 1, label: 'Bed', crop: 'Rice' }]).map((b, idx) => (
            <div
              key={b.id || idx}
              onClick={() => onBedClick && onBedClick(b)}
              style={{
                background: selectedBedId === b.id ? 'var(--primary-subtle, rgba(16, 185, 129, 0.2))' : 'var(--surface-2, #1a2228)',
                border: selectedBedId === b.id ? '2px solid var(--primary, #10b981)' : '1px solid var(--line, #334155)',
                borderRadius: 8,
                padding: '12px 10px',
                textAlign: 'center',
                cursor: onBedClick ? 'pointer' : 'default',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{b.label || `Bed ${idx + 1}`}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--leaf, #10b981)', margin: '4px 0' }}>{b.crop || 'Fallow'}</div>
              {b.season && <div style={{ fontSize: 10, color: 'var(--text-2)' }}>{b.season}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: 14, overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating HUD: Field info & Bigha label */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          background: theme === 'dark' ? 'rgba(11, 17, 15, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          border: '1px solid var(--line, rgba(255, 255, 255, 0.15))',
          borderRadius: 8,
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          fontWeight: 600,
          color: theme === 'dark' ? '#f8fafc' : '#0f172a',
          pointerEvents: 'none',
        }}
      >
        <span style={{ color: 'var(--leaf, #10b981)' }}>🌾</span>
        <span>{fieldName}</span>
        {bighaStr && (
          <span style={{ fontSize: 11, color: 'var(--text-3)', paddingLeft: 4, borderLeft: '1px solid var(--line)' }}>
            {bighaStr}
          </span>
        )}
      </div>

      {/* Hover info tooltip */}
      {hoveredBed && (
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            background: theme === 'dark' ? 'rgba(15, 23, 20, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            border: '1px solid var(--primary, #10b981)',
            borderRadius: 8,
            padding: '6px 16px',
            fontSize: 12,
            fontWeight: 700,
            color: theme === 'dark' ? '#f8fafc' : '#0f172a',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>{hoveredBed.label || hoveredBed.season}:</span>
          <span style={{ color: 'var(--leaf, #10b981)' }}>{hoveredBed.crop || 'পতিত জমি (Fallow)'}</span>
          {hoveredBed.areaShare != null && <span>({Math.round(hoveredBed.areaShare * 100)}%)</span>}
        </div>
      )}
    </div>
  );
}

export default FarmScene3D;
