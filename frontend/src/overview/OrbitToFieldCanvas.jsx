// frontend/src/overview/OrbitToFieldCanvas.jsx
// Continuous 3D viewport for the 7-scene "From Orbit to Field" scroll story.
// Renders low-poly scenes 1-7 driven by scrollProgress (0.0 to 6.0):
// 1. Orbit (Earth globe, satellite, stars)
// 2. Bangladesh Dive (GeoJSON silhouette, regional pins + active field pin)
// 3. Three Regional Farms (Barind, Haor, Coast rotations)
// 4. Two Soil Strata Cutaways (Barind sinking -1.07 cm/yr, Haor rising +0.44 cm/yr)
// 5. Sky / Monsoon Onset (Clouds, dual rain particles, onset curves)
// 6. Crop Decision Bed (Glowing '?' hologram, orbiting crop tags)
// 7. Active Field Platform (Interactive field ground with target marker)
// Performance target: 50+ FPS at 1920x1080, low-poly geometry, particles <= 2000, on-demand rendering.

import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

const W_REF = 1600;
const H_REF = 900;

export function OrbitToFieldCanvas({
  scrollProgress = 0,
  activeField = null,
  graceTrends = null,
  onsetComparison = null,
  isAutoPlaying = false,
  onFpsUpdate = null,
}) {
  const containerRef = useRef(null);
  const progressRef = useRef(scrollProgress);
  progressRef.current = scrollProgress;
  const isAutoPlayingRef = useRef(isAutoPlaying);
  isAutoPlayingRef.current = isAutoPlaying;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      console.warn('[OrbitToFieldCanvas] WebGL not available:', e);
      return;
    }

    const width = container.clientWidth || W_REF;
    const height = container.clientHeight || H_REF;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#05080F', 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 22);

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.8);
    sunLight.position.set(20, 30, 20);
    scene.add(sunLight);

    const cyanRim = new THREE.DirectionalLight(0x38D9F5, 1.2);
    cyanRim.position.set(-20, -10, 10);
    scene.add(cyanRim);

    // ==========================================
    // SCENE 1: STARFIELD & EARTH & SATELLITE
    // ==========================================
    const scene1Group = new THREE.Group();
    scene.add(scene1Group);

    // Low-poly Stars (1200 particles <= 2000 requirement)
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 140;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 90;
      starPos[i * 3 + 2] = -30 + (Math.random() - 0.5) * 80;

      const lum = 0.5 + Math.random() * 0.5;
      starCol[i * 3] = lum;
      starCol[i * 3 + 1] = lum;
      starCol[i * 3 + 2] = lum * 1.1;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene1Group.add(starPoints);

    // Low-poly Earth Globe
    const earthGeo = new THREE.IcosahedronGeometry(6.2, 3);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x1a4570,
      roughness: 0.7,
      metalness: 0.1,
      flatShading: true,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(5.5, -0.5, 0);
    scene1Group.add(earthMesh);

    // Low-poly Continents overlay
    const contGeo = new THREE.IcosahedronGeometry(6.25, 2);
    const contMat = new THREE.MeshStandardMaterial({
      color: 0x2c7a4a,
      roughness: 0.8,
      flatShading: true,
      transparent: true,
      opacity: 0.88,
    });
    const contMesh = new THREE.Mesh(contGeo, contMat);
    contMesh.position.copy(earthMesh.position);
    scene1Group.add(contMesh);

    // Atmosphere Glow
    const glowGeo = new THREE.SphereGeometry(6.8, 24, 24);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38D9F5,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.position.copy(earthMesh.position);
    scene1Group.add(glowMesh);

    // Orbiting Satellite
    const satGroup = new THREE.Group();
    const satBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.35, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xd9e2ea, metalness: 0.8, roughness: 0.3 })
    );
    const panelGeo = new THREE.BoxGeometry(1.2, 0.05, 0.4);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x2055a5, metalness: 0.6, roughness: 0.2 });
    const panelL = new THREE.Mesh(panelGeo, panelMat);
    panelL.position.x = -0.9;
    const panelR = new THREE.Mesh(panelGeo, panelMat);
    panelR.position.x = 0.9;
    satGroup.add(satBody, panelL, panelR);
    satGroup.position.set(11, 4.2, 2);
    scene1Group.add(satGroup);

    // ==========================================
    // SCENE 2: BANGLADESH DIVE & PINS
    // ==========================================
    const scene2Group = new THREE.Group();
    scene2Group.position.set(0, 0, -40);
    scene2Group.visible = false;
    scene.add(scene2Group);

    // Base Landmass / Outline representation
    const bdShapePts = [
      [52, 38], [85, 65], [120, 60], [155, 75], [190, 95], [235, 115],
      [285, 110], [315, 140], [325, 175], [295, 200], [305, 250], [345, 305],
      [375, 370], [370, 410], [345, 465], [330, 440], [300, 380], [255, 360],
      [225, 385], [180, 415], [140, 410], [105, 370], [100, 335], [75, 300],
      [55, 250], [35, 190], [45, 130], [35, 80]
    ];
    const bdShape = new THREE.Shape();
    bdShapePts.forEach(([px, py], i) => {
      const x = (px - 200) * 0.045;
      const y = (260 - py) * 0.045;
      if (i === 0) bdShape.moveTo(x, y);
      else bdShape.lineTo(x, y);
    });
    bdShape.closePath();

    const bdGeo = new THREE.ShapeGeometry(bdShape);
    const bdMat = new THREE.MeshStandardMaterial({
      color: 0x1f5e38,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });
    const bdMesh = new THREE.Mesh(bdGeo, bdMat);
    bdMesh.position.set(4, 0, 0);
    scene2Group.add(bdMesh);

    // Border line outline
    const lineEdges = new THREE.EdgesGeometry(bdGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x7fd39a, linewidth: 2 });
    const bdOutline = new THREE.LineSegments(lineEdges, lineMat);
    bdMesh.add(bdOutline);

    // Helper to create 3D Map Pin
    const createPin = (colorHex, scale = 1, isTarget = false) => {
      const pin = new THREE.Group();
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.4 * scale, 16, 16),
        new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3, metalness: 0.2 })
      );
      head.position.y = 0.8 * scale;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.22 * scale, 0.8 * scale, 12),
        new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4 })
      );
      cone.position.y = 0.4 * scale;
      cone.rotation.x = Math.PI;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.3 * scale, 0.6 * scale, 24),
        new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
      );
      ring.rotation.x = -Math.PI / 2;
      pin.add(head, cone, ring);
      if (isTarget) {
        const outerPulse = new THREE.Mesh(
          new THREE.RingGeometry(0.7 * scale, 0.9 * scale, 24),
          new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
        );
        outerPulse.rotation.x = -Math.PI / 2;
        pin.add(outerPulse);
      }
      return pin;
    };

    // 3 Region Pins + 1 Active Field Pin
    const pinBarind = createPin(0xC8F169, 1.1);
    pinBarind.position.set(1.2, 3.2, 0.2); // Northwest
    const pinHaor = createPin(0x38D9F5, 1.1);
    pinHaor.position.set(7.2, 3.4, 0.2); // Northeast
    const pinCoast = createPin(0xF5B04C, 1.1);
    pinCoast.position.set(3.8, -4.8, 0.2); // Southwest coast
    const pinYourField = createPin(0xffffff, 1.3, true);
    pinYourField.position.set(2.4, 1.5, 0.3); // Dynamic field pin
    scene2Group.add(pinBarind, pinHaor, pinCoast, pinYourField);

    // ==========================================
    // SCENE 3: THREE REGIONAL FARMS SIDE-BY-SIDE
    // ==========================================
    const scene3Group = new THREE.Group();
    scene3Group.position.set(0, 0, -80);
    scene3Group.visible = false;
    scene.add(scene3Group);

    const createMiniFarm = (xOffset, soilColor, cropKind) => {
      const g = new THREE.Group();
      g.position.x = xOffset;
      // Base soil platform
      const baseMesh = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 0.6, 3.4),
        new THREE.MeshStandardMaterial({ color: soilColor, roughness: 0.9 })
      );
      g.add(baseMesh);

      // Raised beds with furrows
      for (let b = 0; b < 3; b++) {
        const bedZ = (b - 1) * 1.0;
        const bed = new THREE.Mesh(
          new THREE.BoxGeometry(3.6, 0.25, 0.75),
          new THREE.MeshStandardMaterial({
            color: cropKind === 'flood' ? 0x38a8d6 : 0x5a3e26,
            roughness: 0.8,
            transparent: cropKind === 'flood',
            opacity: cropKind === 'flood' ? 0.75 : 1,
          })
        );
        bed.position.set(0, 0.35, bedZ);
        g.add(bed);

        // Crops on bed (low poly instanced blades)
        if (cropKind !== 'flood' && cropKind !== 'fallow') {
          const cropMat = new THREE.MeshStandardMaterial({
            color: cropKind === 'boro' ? 0xe2c65a : 0x5fa842,
            roughness: 0.7,
          });
          for (let p = 0; p < 7; p++) {
            const plant = new THREE.Mesh(
              new THREE.ConeGeometry(0.12, 0.55, 4),
              cropMat
            );
            plant.position.set((p - 3) * 0.48, 0.65, bedZ);
            g.add(plant);
          }
        }
      }
      return g;
    };

    const farmBarind = createMiniFarm(0, 0x6e5238, 'boro'); // Barind
    const farmHaor = createMiniFarm(5.2, 0x423425, 'flood'); // Haor wetland
    const farmCoast = createMiniFarm(10.4, 0x554535, 'fallow'); // Coast
    scene3Group.add(farmBarind, farmHaor, farmCoast);
    scene3Group.position.set(-1.2, -1, -80);
    scene3Group.rotation.x = 0.45;

    // ==========================================
    // SCENE 4: TWO SOIL CUTAWAYS (GRACE STRATA)
    // ==========================================
    const scene4Group = new THREE.Group();
    scene4Group.position.set(0, 0, -120);
    scene4Group.visible = false;
    scene.add(scene4Group);

    const createSoilCutaway = (xOffset, trendCm, isDropping) => {
      const g = new THREE.Group();
      g.position.x = xOffset;

      // Topsoil layer
      const topsoil = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 0.8, 3.2),
        new THREE.MeshStandardMaterial({ color: 0x5a8a3a, roughness: 0.9 })
      );
      topsoil.position.y = 1.4;

      // Subsoil / unsaturated strata
      const subsoil = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 1.4, 3.2),
        new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.9 })
      );
      subsoil.position.y = 0.3;

      // Water Table layer (Cyan translucent)
      const waterLayer = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 0.75, 3.2),
        new THREE.MeshStandardMaterial({
          color: 0x38D9F5,
          roughness: 0.2,
          transparent: true,
          opacity: 0.78,
        })
      );
      waterLayer.position.y = isDropping ? -0.8 : -0.2; // Dropping vs rising level
      waterLayer.name = 'waterTable';

      // Deep aquifer bed
      const bedrock = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 1.2, 3.2),
        new THREE.MeshStandardMaterial({ color: 0x3a2b1d, roughness: 0.95 })
      );
      bedrock.position.y = -1.8;

      g.add(topsoil, subsoil, waterLayer, bedrock);
      return g;
    };

    const cutawayBarind = createSoilCutaway(1.5, -1.07, true);
    const cutawayHaor = createSoilCutaway(7.5, 0.44, false);
    scene4Group.add(cutawayBarind, cutawayHaor);
    scene4Group.position.set(-0.5, 0, -120);
    scene4Group.rotation.y = -0.2;
    scene4Group.rotation.x = 0.15;

    // ==========================================
    // SCENE 5: STORM CLOUDS & ONSET CURVES
    // ==========================================
    const scene5Group = new THREE.Group();
    scene5Group.position.set(0, 0, -160);
    scene5Group.visible = false;
    scene.add(scene5Group);

    // Low-poly cloud puffs
    for (let c = 0; c < 5; c++) {
      const puff = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.6 + Math.random() * 0.8, 1),
        new THREE.MeshStandardMaterial({ color: 0xb5c7d8, roughness: 0.9, flatShading: true })
      );
      puff.position.set(2 + (c - 2) * 2.5, 4.2 + (c % 2) * 0.6, (c % 3) * 0.8);
      scene5Group.add(puff);
    }

    // Dual Rain Particles (600 particles <= 2000 requirement)
    const rainCount = 600;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    const rainCol = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPos[i * 3] = 1 + (Math.random() - 0.5) * 12;
      rainPos[i * 3 + 1] = Math.random() * 6 - 1;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 6;

      // Half Amber (POWER), Half Cyan (IMERG)
      const isAmber = i % 2 === 0;
      rainCol[i * 3] = isAmber ? 0.96 : 0.22;
      rainCol[i * 3 + 1] = isAmber ? 0.69 : 0.85;
      rainCol[i * 3 + 2] = isAmber ? 0.30 : 0.96;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    rainGeo.setAttribute('color', new THREE.BufferAttribute(rainCol, 3));
    const rainMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
    });
    const rainPoints = new THREE.Points(rainGeo, rainMat);
    scene5Group.add(rainPoints);

    // ==========================================
    // SCENE 6: DECISION BED & GLOWING '?'
    // ==========================================
    const scene6Group = new THREE.Group();
    scene6Group.position.set(0, 0, -200);
    scene6Group.visible = false;
    scene.add(scene6Group);

    // Ploughed fallow soil bed
    const bedPloughed = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 0.8, 5.0),
      new THREE.MeshStandardMaterial({ color: 0x5a3e26, roughness: 0.95 })
    );
    bedPloughed.position.set(4.5, -2.5, 0);
    bedPloughed.rotation.x = 0.4;
    scene6Group.add(bedPloughed);

    // Glowing question-mark pillar / torus hologram
    const glowRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.4, 0.14, 16, 48),
      new THREE.MeshStandardMaterial({
        color: 0xC8F169,
        emissive: 0xC8F169,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      })
    );
    glowRing.position.set(4.5, 0.6, 0);
    glowRing.rotation.x = Math.PI / 2;
    scene6Group.add(glowRing);

    // ==========================================
    // SCENE 7: YOUR FIELD PLATFORM
    // ==========================================
    const scene7Group = new THREE.Group();
    scene7Group.position.set(0, 0, -240);
    scene7Group.visible = false;
    scene.add(scene7Group);

    const yourFieldPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 0.7, 5.4),
      new THREE.MeshStandardMaterial({ color: 0x3d6e35, roughness: 0.85 })
    );
    yourFieldPlatform.position.set(4.5, -1.8, 0);
    yourFieldPlatform.rotation.x = 0.35;
    const yourFieldPin = createPin(0xC8F169, 1.5, true);
    yourFieldPin.position.set(4.5, 0.5, 0);
    scene7Group.add(yourFieldPlatform, yourFieldPin);

    // Animation & Render Loop
    let animId;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = 0;

    const render = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      frameCount++;
      fpsTimer += dt;
      if (fpsTimer >= 1.0) {
        if (onFpsUpdate) onFpsUpdate(Math.round(frameCount / fpsTimer));
        frameCount = 0;
        fpsTimer = 0;
      }

      const p = Math.max(0, Math.min(6, progressRef.current));

      // Slow idle rotations
      earthMesh.rotation.y += 0.003;
      contMesh.rotation.y += 0.003;
      satGroup.rotation.y += 0.008;
      glowRing.rotation.z += 0.01;

      // Rain fall animation
      if (scene5Group.visible) {
        const pos = rainGeo.attributes.position.array;
        for (let i = 1; i < pos.length; i += 3) {
          pos[i] -= 0.18;
          if (pos[i] < -2) pos[i] = 5;
        }
        rainGeo.attributes.position.needsUpdate = true;
      }

      // Camera Flight interpolation across scenes 0 to 6
      // Camera Z positions:
      // S0 (0.0): 22
      // S1 (1.0): -18
      // S2 (2.0): -58
      // S3 (3.0): -98
      // S4 (4.0): -138
      // S5 (5.0): -178
      // S6 (6.0): -218
      const targetZ = 22 - p * 40;
      camera.position.z += (targetZ - camera.position.z) * 0.12;

      // Adjust group visibility to maximize FPS and prevent draw call overhead
      scene1Group.visible = p <= 1.4;
      scene2Group.visible = p >= 0.6 && p <= 2.4;
      scene3Group.visible = p >= 1.6 && p <= 3.4;
      scene4Group.visible = p >= 2.6 && p <= 4.4;
      scene5Group.visible = p >= 3.6 && p <= 5.4;
      scene6Group.visible = p >= 4.6 && p <= 5.9;
      scene7Group.visible = p >= 5.1;

      // Dynamically sink/rise water table in Scene 4
      if (scene4Group.visible) {
        const wt1 = cutawayBarind.getObjectByName('waterTable');
        const wt2 = cutawayHaor.getObjectByName('waterTable');
        if (wt1) wt1.position.y = -0.8 - Math.sin(now * 0.002) * 0.08;
        if (wt2) wt2.position.y = -0.2 + Math.sin(now * 0.002) * 0.08;
      }

      // Dynamic pin positioning for Active Field in Scene 2
      if (activeField?.latitude != null && activeField?.longitude != null) {
        // Map 20..27 lat to -6..6, 88..93 lon to -2..8
        const latNorm = (Number(activeField.latitude) - 20) / 7;
        const lonNorm = (Number(activeField.longitude) - 88) / 5;
        pinYourField.position.x = 1 + lonNorm * 6;
        pinYourField.position.y = -5 + latNorm * 9;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || W_REF;
      const h = container.clientHeight || H_REF;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      // Resource disposal
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
    };
  }, [activeField, onFpsUpdate]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}

export default OrbitToFieldCanvas;