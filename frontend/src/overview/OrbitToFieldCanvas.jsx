// frontend/src/overview/OrbitToFieldCanvas.jsx
// Final Version (OS0-OS7 / SH1-SH6):
// Continuous 3D flight from Space (Earth) -> Bangladesh 3D Map -> Village Farm Diorama
// Driven strictly by scrollProgress [0, 1] through the 10-shot camera trajectory in shots.js.

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { getInterpolatedShot, checkCameraClearance } from './shots.js';
import bdGeoData from '../../../data/geo/bd_districts.json';

// District region classifications
const BARIND_DISTRICTS = new Set(['Rajshahi', 'Chapainawabganj', 'Naogaon', 'Natore', 'Joypurhat']);
const HAOR_DISTRICTS = new Set(['Sunamganj', 'Kishoreganj', 'Netrokona', 'Habiganj', 'Sylhet']);
const COAST_DISTRICTS = new Set(['Satkhira', 'Khulna', 'Bagerhat', 'Barguna', 'Patuakhali']);

function latLonToMap(lat, lon) {
  // Center roughly at 23.7°N, 90.4°E, scaled for 3D map
  return {
    x: (lon - 90.35) * 1.6,
    z: -(lat - 23.68) * 1.6
  };
}

export function OrbitToFieldCanvas({
  scrollProgress = 0,
  activeField = null,
  graceTrends = null,
  onsetComparison = null,
  prefersReducedMotion = false,
}) {
  const mountRef = useRef(null);
  const scrollProgRef = useRef(scrollProgress);
  scrollProgRef.current = scrollProgress;
  const overlayLabelsRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Renderer & Camera Setup ──────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040810);
    const fog = new THREE.FogExp2(0x040810, 0.0006);
    scene.fog = fog;

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      350
    );
    camera.position.set(0, 2, 32);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    if (typeof window !== 'undefined') window.__FS_STORY_RENDERER__ = renderer;

    // ── Lighting ─────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff6e8, 2.2);
    sunLight.position.set(15, 8, 12);
    scene.add(sunLight);

    const pointFill = new THREE.PointLight(0xffd59e, 1.2, 40);
    pointFill.position.set(0, 6, -14);
    scene.add(pointFill);

    const registeredMeshes = [];

    // ══════════════════════════════════════════════════════════════════════
    // WORLD 0: SPACE & EARTH (Shots 01 - 02)
    // ══════════════════════════════════════════════════════════════════════
    const spaceGroup = new THREE.Group();
    scene.add(spaceGroup);

    // Deep cosmic space with stars (NOT blue)
    scene.background = new THREE.Color(0x0a101b);

    const STAR_COUNT = 2800;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const r = 40 + Math.random() * 80;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      starPos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
      starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      starPos[i * 3 + 2] = r * Math.cos(ph);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.95 })
    );
    spaceGroup.add(stars);

    // Texture Loader with error-safe loading for NASA Visible Earth (Blue Marble) Textures
    const texLoader = new THREE.TextureLoader();
    const loadSafeTex = (url, isSRGB = false) => {
      return texLoader.load(
        url,
        (tex) => {
          if (isSRGB) tex.colorSpace = THREE.SRGBColorSpace;
        },
        undefined,
        (err) => {
          console.warn(`[3D Orbit] Safe texture load warning (${url}):`, err);
        }
      );
    };

    const earthDayTex = loadSafeTex('/textures/earth_day_2048.jpg', true);
    const earthNormalTex = loadSafeTex('/textures/earth_normal_2048.jpg', false);
    const earthSpecularTex = loadSafeTex('/textures/earth_specular_2048.jpg', false);
    const earthNightTex = loadSafeTex('/textures/earth_night_2048.png', true);
    const earthCloudsTex = loadSafeTex('/textures/earth_clouds_1024.png', true);

    // Direction of the sun (shining from the right, positive X)
    const sunDirVec = new THREE.Vector3(12.0, 3.0, 6.0).normalize();
    const dayNightUniforms = {
      uSunDir: { value: sunDirVec },
    };

    // Earth Sphere (radius 1, 128 segments wide, 64 height) + MeshStandardMaterial
    const earthRadius = 1.0;
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthDayTex,
      normalMap: earthNormalTex,
      normalScale: new THREE.Vector2(0.9, 0.9),
      roughnessMap: earthSpecularTex,
      roughness: 0.9,
      metalness: 0.05,
      emissive: 0xffffff,
      emissiveMap: earthNightTex,
    });

    earthMat.onBeforeCompile = (shader) => {
      shader.uniforms.uSunDir = dayNightUniforms.uSunDir;

      // Ensure uSunDir uniform is explicitly declared at fragment shader top
      shader.fragmentShader = `
        uniform vec3 uSunDir;
        ${shader.fragmentShader}
      `;

      // Invert specular map for roughness: oceans (specular 1.0) -> roughness ~0.08 (shiny); land (0.0) -> roughness ~0.92 (matte)
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `
        float roughnessFactor = roughness;
        #ifdef USE_ROUGHNESSMAP
          vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
          roughnessFactor = clamp(1.0 - texelRoughness.r, 0.08, 0.92);
        #endif
        `
      );

      // Night side city lights: only illuminate emissiveMap on the dark side of terminator
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `
        #ifdef USE_EMISSIVEMAP
          vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
          vec3 viewSun = normalize((viewMatrix * vec4(uSunDir, 0.0)).xyz);
          float sunDot = dot(normal, viewSun);
          float nightFactor = 1.0 - smoothstep(-0.08, 0.08, sunDot);
          totalEmissiveRadiance = emissiveColor.rgb * emissive * nightFactor * 2.2;
        #endif
        `
      );
    };

    const earthMesh = new THREE.Mesh(
      new THREE.SphereGeometry(earthRadius, 128, 64),
      earthMat
    );
    earthMesh.name = 'EarthDaySphere';
    earthMesh.position.set(0, 0, 0);

    // Rotate Earth so Bangladesh (lat 23.7° N, lon 90.4° E) directly faces camera
    // In equirectangular SphereGeometry, lon 90.4°E points at +Z when rotY = -PI
    // Tilt slightly (-10 deg) so northern hemisphere, India and Bay of Bengal face camera
    const bangladeshRotY = -Math.PI;
    const bangladeshTiltX = THREE.MathUtils.degToRad(-10);
    earthMesh.rotation.set(bangladeshTiltX, bangladeshRotY, 0);
    spaceGroup.add(earthMesh);
    registeredMeshes.push(earthMesh);

    // Clouds Sphere (radius 1.01, earth_clouds_1024.png as alphaMap, white, transparent, depthWrite false)
    const cloudsMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      alphaMap: earthCloudsTex,
      transparent: true,
      opacity: 0.9,
      roughness: 1.0,
      depthWrite: false,
    });
    cloudsMat.onBeforeCompile = (shader) => {
      // Use alpha channel from earth_clouds_1024.png for smooth gradient transparency
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <alphamap_fragment>',
        `
        #ifdef USE_ALPHAMAP
          diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).a;
        #endif
        `
      );
    };

    const cloudsMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.01, 128, 64),
      cloudsMat
    );
    cloudsMesh.position.copy(earthMesh.position);
    cloudsMesh.rotation.set(bangladeshTiltX, bangladeshRotY, 0);
    spaceGroup.add(cloudsMesh);

    // Atmosphere Fresnel Glow (radius 1.06, additive, BackSide)
    const atmGeo = new THREE.SphereGeometry(1.06, 64, 48);
    const atmMat = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x38bdf8) }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec3 viewDir = normalize(vViewPosition);
          float rim = 1.0 - abs(dot(vNormal, viewDir));
          float alpha = pow(rim, 3.5) * 0.95;
          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const atmMesh = new THREE.Mesh(atmGeo, atmMat);
    atmMesh.position.copy(earthMesh.position);
    spaceGroup.add(atmMesh);

    // Orbiting Satellite (NASA GPM / GRACE-FO)
    const satGroup = new THREE.Group();
    satGroup.scale.set(0.08, 0.08, 0.08);
    const satBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.25, 0.25),
      new THREE.MeshStandardMaterial({ color: 0xcedee9, metalness: 0.8, roughness: 0.2 })
    );
    satGroup.add(satBody);

    const solarPanelMat = new THREE.MeshStandardMaterial({ color: 0x1b4480, metalness: 0.7, roughness: 0.2 });
    [-0.6, 0.6].forEach(px => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.3), solarPanelMat);
      panel.position.set(px, 0, 0);
      satGroup.add(panel);
    });

    const satRadar = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 2.0, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x38d9f5, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false })
    );
    satRadar.rotation.set(Math.PI, 0, 0);
    satRadar.position.set(0, -1.0, 0);
    satGroup.add(satRadar);
    satGroup.position.set(0.9, 0.7, 0.9);
    spaceGroup.add(satGroup);

    // Cloud dive rush sprites (Shot 02)
    const cloudDiveGroup = new THREE.Group();
    const diveCloudGeo = new THREE.PlaneGeometry(0.3, 0.2);
    const diveCloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let i = 0; i < 30; i++) {
      const sprite = new THREE.Mesh(diveCloudGeo, diveCloudMat);
      sprite.position.set(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.0 + 0.3,
        1.2 + Math.random() * 2.5
      );
      cloudDiveGroup.add(sprite);
    }
    cloudDiveGroup.visible = false;
    spaceGroup.add(cloudDiveGroup);

    // ══════════════════════════════════════════════════════════════════════
    // WORLD 1: BANGLADESH 3D DISTRICT MAP (Shots 03 - 04)
    // ══════════════════════════════════════════════════════════════════════
    const mapGroup = new THREE.Group();
    mapGroup.position.set(0, 0, -4.0);
    scene.add(mapGroup);

    // Ground plane extending to horizon with soft atmospheric fog (NOT floating in space!)
    const mapGroundGeo = new THREE.PlaneGeometry(80, 80, 32, 32);
    const mapColors = [];
    const mapPalette = [
      new THREE.Color(0x183c24), // lush alluvial silt
      new THREE.Color(0x2d6238), // green delta plain
      new THREE.Color(0x14341e), // wetland marsh
      new THREE.Color(0x387244), // fertile basin
    ];
    for (let i = 0; i < mapGroundGeo.attributes.position.count; i++) {
      const c = mapPalette[i % mapPalette.length];
      mapColors.push(c.r, c.g, c.b);
    }
    mapGroundGeo.setAttribute('color', new THREE.Float32BufferAttribute(mapColors, 3));
    const mapGround = new THREE.Mesh(
      mapGroundGeo,
      new THREE.MeshLambertMaterial({ vertexColors: true })
    );
    mapGround.rotation.set(-Math.PI / 2, 0, 0);
    mapGround.position.set(0, -0.05, 0);
    mapGround.receiveShadow = true;
    mapGroup.add(mapGround);

    // Districts extruded geometries
    const districts = bdGeoData?.districts || [];
    const distMeshes = [];
    const defaultDistMat = new THREE.MeshStandardMaterial({
      color: 0x255834,
      roughness: 0.65,
      metalness: 0.1,
    });
    const barindDistMat = new THREE.MeshStandardMaterial({
      color: 0x2e6618,
      emissive: 0xc8f169,
      emissiveIntensity: 0.45,
      roughness: 0.5,
    });
    const haorDistMat = new THREE.MeshStandardMaterial({
      color: 0x104d5e,
      emissive: 0x38d9f5,
      emissiveIntensity: 0.45,
      roughness: 0.5,
    });
    const coastDistMat = new THREE.MeshStandardMaterial({
      color: 0x5e3a10,
      emissive: 0xf5b04c,
      emissiveIntensity: 0.45,
      roughness: 0.5,
    });

    const hexRadius = 0.26;
    const hexHeight = 0.08;
    const hexGeo = new THREE.CylinderGeometry(hexRadius, hexRadius * 1.05, hexHeight, 6);
    const borderMat = new THREE.LineBasicMaterial({ color: 0x529a68, transparent: true, opacity: 0.6 });

    districts.forEach(d => {
      let mat = defaultDistMat;
      if (BARIND_DISTRICTS.has(d.name)) mat = barindDistMat;
      else if (HAOR_DISTRICTS.has(d.name)) mat = haorDistMat;
      else if (COAST_DISTRICTS.has(d.name)) mat = coastDistMat;

      const m = new THREE.Mesh(hexGeo, mat);
      const { x, z } = latLonToMap(d.lat, d.lon);
      m.position.set(x, hexHeight / 2, z);
      m.name = `District_${d.name}`;

      // Thin light border line per district
      const edges = new THREE.EdgesGeometry(hexGeo);
      const line = new THREE.LineSegments(edges, borderMat);
      m.add(line);

      mapGroup.add(m);
      distMeshes.push(m);
    });

    // Active Field Thin Light Pillar
    const activeLat = Number(activeField?.latitude || 24.85);
    const activeLon = Number(activeField?.longitude || 89.37);
    const activePos = latLonToMap(activeLat, activeLon);

    const activePillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 4.0, 12),
      new THREE.MeshBasicMaterial({ color: 0xc8f169 })
    );
    activePillar.position.set(activePos.x, 2.0, activePos.z);
    mapGroup.add(activePillar);

    const pillarGlow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.28, 4.0, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xc8f169, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
    );
    pillarGlow.position.set(activePos.x, 2.0, activePos.z);
    mapGroup.add(pillarGlow);

    // Shot 04: Soil Cutaway Block under active field
    const cutawayGroup = new THREE.Group();
    cutawayGroup.position.set(activePos.x, 0, activePos.z);
    cutawayGroup.visible = false;

    // 3 Soil layers: topsoil (0.3m), vadose zone (0.8m), bedrock (1.5m)
    const topsoilMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.3, 1.8),
      new THREE.MeshLambertMaterial({ color: 0x3d2716 })
    );
    topsoilMesh.position.set(0, -0.15, 0);
    cutawayGroup.add(topsoilMesh);

    const vadoseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.8, 1.8),
      new THREE.MeshLambertMaterial({ color: 0x5a3b22 })
    );
    vadoseMesh.position.set(0, -0.7, 0);
    cutawayGroup.add(vadoseMesh);

    const bedrockMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.4, 1.8),
      new THREE.MeshLambertMaterial({ color: 0x222a30 })
    );
    bedrockMesh.position.set(0, -1.8, 0);
    cutawayGroup.add(bedrockMesh);

    // Cyan Aquifer / Groundwater Layer
    const aquiferMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.76, 0.6, 1.76),
      new THREE.MeshStandardMaterial({
        color: 0x38d9f5,
        transparent: true,
        opacity: 0.8,
        roughness: 0.2,
      })
    );
    aquiferMesh.position.set(0, -1.5, 0);
    cutawayGroup.add(aquiferMesh);

    mapGroup.add(cutawayGroup);

    // ══════════════════════════════════════════════════════════════════════
    // WORLD 2: COMPLETE VILLAGE FARM DIORAMA (Shots 05 - 10)
    // ══════════════════════════════════════════════════════════════════════
    const farmGroup = new THREE.Group();
    farmGroup.position.set(0, 0, -18.0);
    scene.add(farmGroup);

    // Ground plane reaching horizon with natural grass / soil variation
    const farmGroundGeo = new THREE.PlaneGeometry(120, 100, 32, 32);
    const farmColors = [];
    const farmPalette = [
      new THREE.Color(0x234d2a),
      new THREE.Color(0x35683b),
      new THREE.Color(0x1e4224),
      new THREE.Color(0x2d5c32),
    ];
    for (let i = 0; i < farmGroundGeo.attributes.position.count; i++) {
      const c = farmPalette[i % farmPalette.length];
      farmColors.push(c.r, c.g, c.b);
    }
    farmGroundGeo.setAttribute('color', new THREE.Float32BufferAttribute(farmColors, 3));
    const farmGround = new THREE.Mesh(
      farmGroundGeo,
      new THREE.MeshLambertMaterial({ vertexColors: true })
    );
    farmGround.rotation.set(-Math.PI / 2, 0, 0);
    farmGround.position.set(0, 0, 0);
    farmGround.receiveShadow = true;
    farmGroup.add(farmGround);

    // 6 Beds (2 rows x 3) with raised bunds (আইল)
    const bedCenters = [
      { x: -3.2, z: -2.0, name: 'Bed 1 (Rabi)' },
      { x:  0.0, z: -2.0, name: 'Bed 2 (Kharif-1)' },
      { x:  3.2, z: -2.0, name: 'Bed 3 (Kharif-2)' },
      { x: -3.2, z:  1.8, name: 'Bed 4 (Year 2 Rabi)' },
      { x:  0.0, z:  1.8, name: 'Bed 5 (Year 2 K1)' },
      { x:  3.2, z:  1.8, name: 'Bed 6 (Year 2 K2)' },
    ];

    const bedMeshes = bedCenters.map(bc => {
      const bg = new THREE.Group();
      bg.position.set(bc.x, 0, bc.z);

      // Soil bed
      const soil = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 0.18, 2.2),
        new THREE.MeshLambertMaterial({ color: 0x3d2b1c })
      );
      soil.position.set(0, 0.09, 0);
      bg.add(soil);

      // Bunds around bed
      const bundMat = new THREE.MeshLambertMaterial({ color: 0x4a3725 });
      const bNorth = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.22, 0.12), bundMat);
      bNorth.position.set(0, 0.11, -1.1);
      const bSouth = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.22, 0.12), bundMat);
      bSouth.position.set(0, 0.11, 1.1);
      const bEast = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 2.3), bundMat);
      bEast.position.set(1.35, 0.11, 0);
      const bWest = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 2.3), bundMat);
      bWest.position.set(-1.35, 0.11, 0);
      bg.add(bNorth, bSouth, bEast, bWest);

      // Crop plants container
      const cropGroup = new THREE.Group();
      cropGroup.name = 'CropsContainer';
      bg.add(cropGroup);

      // Water film layer for flooded rice
      const waterLayer = new THREE.Mesh(
        new THREE.PlaneGeometry(2.5, 2.1),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          metalness: 0.8,
          roughness: 0.1,
          transparent: true,
          opacity: 0.75,
        })
      );
      waterLayer.rotation.set(-Math.PI / 2, 0, 0);
      waterLayer.position.set(0, 0.19, 0);
      waterLayer.visible = false;
      bg.add(waterLayer);

      // Drought cracked soil layer
      const droughtLayer = new THREE.Mesh(
        new THREE.PlaneGeometry(2.55, 2.15),
        new THREE.MeshLambertMaterial({ color: 0x8a6f4d })
      );
      droughtLayer.rotation.set(-Math.PI / 2, 0, 0);
      droughtLayer.position.set(0, 0.185, 0);
      droughtLayer.visible = false;
      bg.add(droughtLayer);

      farmGroup.add(bg);
      return { group: bg, soil, cropGroup, waterLayer, droughtLayer, center: bc };
    });

    // Helper to populate plants on a bed
    function setBedPlants(bedObj, colorHex = 0x48a832, count = 28) {
      const cg = bedObj.cropGroup;
      while (cg.children.length > 0) {
        cg.remove(cg.children[0]);
      }
      if (colorHex === 0) return; // Fallow / bare

      const plantGeo = new THREE.ConeGeometry(0.08, 0.38, 5);
      const plantMat = new THREE.MeshLambertMaterial({ color: colorHex });
      for (let i = 0; i < count; i++) {
        const p = new THREE.Mesh(plantGeo, plantMat);
        const rx = (Math.random() - 0.5) * 2.2;
        const rz = (Math.random() - 0.5) * 1.8;
        p.position.set(rx, 0.36, rz);
        cg.add(p);
      }
    }

    // Initial plant state: Healthy Boro rice, mustard, Aman rice
    setBedPlants(bedMeshes[0], 0x48a832); // Rice
    setBedPlants(bedMeshes[1], 0x3e8a2a); // Legume / Mungbean
    setBedPlants(bedMeshes[2], 0x58b83a); // Aman Rice
    setBedPlants(bedMeshes[3], 0xd4b840); // Mustard
    setBedPlants(bedMeshes[4], 0x36a048); // Crop
    setBedPlants(bedMeshes[5], 0x2e8032); // Crop

    // Traditional Do-Chala Bengali Farmhouse (tin roof, veranda, wooden posts)
    const houseGroup = new THREE.Group();
    houseGroup.position.set(6.2, 0, -2.5);

    const houseWalls = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.4, 1.6),
      new THREE.MeshLambertMaterial({ color: 0xd8c8b0 })
    );
    houseWalls.position.set(0, 0.7, 0);
    houseGroup.add(houseWalls);

    // Pitched tin roof
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x7a8a94, side: THREE.DoubleSide });
    const roofLeft = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.5), roofMat);
    roofLeft.position.set(-0.55, 1.7, 0);
    roofLeft.rotation.set(0, 0, 0.55);
    const roofRight = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.5), roofMat);
    roofRight.position.set(0.55, 1.7, 0);
    roofRight.rotation.set(0, 0, -0.55);
    houseGroup.add(roofLeft, roofRight);

    // Front veranda posts
    const postMat = new THREE.MeshLambertMaterial({ color: 0x5a3d24 });
    [-0.8, 0.8].forEach(px => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 6), postMat);
      post.position.set(px, 0.65, 0.9);
      houseGroup.add(post);
    });
    farmGroup.add(houseGroup);

    // Golden Haystack (খড়ের গাদা)
    const haystack = new THREE.Mesh(
      new THREE.ConeGeometry(0.85, 1.6, 12),
      new THREE.MeshLambertMaterial({ color: 0xd8b548 })
    );
    haystack.position.set(5.2, 0.8, 1.4);
    farmGroup.add(haystack);

    // Tube-well (টিউবওয়েল / নলকূপ)
    const tubewellGroup = new THREE.Group();
    tubewellGroup.position.set(-5.6, 0, 1.2);
    const twBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.65, 0.12, 12),
      new THREE.MeshLambertMaterial({ color: 0x8a949a })
    );
    twBase.position.set(0, 0.06, 0);
    tubewellGroup.add(twBase);
    const twPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6),
      new THREE.MeshLambertMaterial({ color: 0x184c30 })
    );
    twPipe.position.set(0, 0.42, 0);
    tubewellGroup.add(twPipe);
    farmGroup.add(tubewellGroup);

    // Rural Pond (পুকুর)
    const pond = new THREE.Mesh(
      new THREE.CircleGeometry(2.4, 32),
      new THREE.MeshStandardMaterial({ color: 0x1e6878, roughness: 0.15, metalness: 0.85 })
    );
    pond.rotation.set(-Math.PI / 2, 0, 0);
    pond.position.set(-6.8, 0.02, -2.8);
    pond.scale.set(1.4, 1, 1);
    farmGroup.add(pond);

    // 2 Cows grazing (গরু)
    function createCow() {
      const cg = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.5, 0.45),
        new THREE.MeshLambertMaterial({ color: 0xf4f0e6 })
      );
      body.position.set(0, 0.38, 0);
      cg.add(body);
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.3, 0.26),
        new THREE.MeshLambertMaterial({ color: 0x3d2b1f })
      );
      head.position.set(0.52, 0.52, 0);
      cg.add(head);
      const legMat = new THREE.MeshLambertMaterial({ color: 0x322216 });
      const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 6);
      [[-0.3, -0.15], [-0.3, 0.15], [0.3, -0.15], [0.3, 0.15]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, 0.15, lz);
        cg.add(leg);
      });
      return cg;
    }
    const cow1 = createCow();
    cow1.position.set(4.2, 0, -4.5);
    cow1.rotation.set(0, 0.4, 0);
    const cow2 = createCow();
    cow2.position.set(5.5, 0, -5.2);
    cow2.rotation.set(0, -0.8, 0);
    farmGroup.add(cow1, cow2);

    // Coconut palms and Banana trees along the farm perimeter
    function createPalm(height = 3.6, rotY = 0) {
      const pg = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.14, height, 7),
        new THREE.MeshLambertMaterial({ color: 0x5a422a })
      );
      trunk.position.set(0, height / 2, 0);
      trunk.rotation.set(0.08, 0, 0.08);
      pg.add(trunk);

      const crown = new THREE.Mesh(
        new THREE.ConeGeometry(1.4, 1.2, 8),
        new THREE.MeshLambertMaterial({ color: 0x2e6b28 })
      );
      crown.position.set(0.2, height + 0.3, 0.2);
      pg.add(crown);
      pg.rotation.set(0, rotY, 0);
      return pg;
    }

    farmGroup.add(createPalm(4.2, 0.5));
    farmGroup.children[farmGroup.children.length - 1].position.set(-6.5, 0, -6.0);
    farmGroup.add(createPalm(3.8, 1.8));
    farmGroup.children[farmGroup.children.length - 1].position.set(-5.5, 0, -7.5);
    farmGroup.add(createPalm(4.5, -0.6));
    farmGroup.children[farmGroup.children.length - 1].position.set(7.5, 0, -5.5);
    farmGroup.add(createPalm(3.9, 2.2));
    farmGroup.children[farmGroup.children.length - 1].position.set(8.2, 0, -3.5);

    // Recommended ⭐ Star Aura over Bed 1 (Shot 07)
    const starGlowGroup = new THREE.Group();
    starGlowGroup.position.set(bedCenters[0].x, 0.8, bedCenters[0].z);
    const starMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.42),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffb700,
        emissiveIntensity: 1.2,
      })
    );
    starGlowGroup.add(starMesh);
    starGlowGroup.visible = false;
    farmGroup.add(starGlowGroup);

    // Rain Particle System for Shot 05
    const RAIN_COUNT = 600;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
      rainPos[i * 3]     = (Math.random() - 0.5) * 20;
      rainPos[i * 3 + 1] = Math.random() * 12;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainPoints = new THREE.Points(
      rainGeo,
      new THREE.PointsMaterial({ color: 0x93c5fd, size: 0.15, transparent: true, opacity: 0.65 })
    );
    rainPoints.visible = false;
    farmGroup.add(rainPoints);

    // Biological Nitrogen (+N) Particle System for Shot 06
    const N_COUNT = 150;
    const nGeo = new THREE.BufferGeometry();
    const nPos = new Float32Array(N_COUNT * 3);
    for (let i = 0; i < N_COUNT; i++) {
      nPos[i * 3]     = (Math.random() - 0.5) * 10;
      nPos[i * 3 + 1] = 0.2 + Math.random() * 2.5;
      nPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    nGeo.setAttribute('position', new THREE.BufferAttribute(nPos, 3));
    const nPoints = new THREE.Points(
      nGeo,
      new THREE.PointsMaterial({ color: 0xc8f169, size: 0.22, transparent: true, opacity: 0.8 })
    );
    nPoints.visible = false;
    farmGroup.add(nPoints);

    // Adaptive Learning Replan Pulse Ring for Shot 09
    const pulseRing = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1.2, 32),
      new THREE.MeshBasicMaterial({ color: 0x38d9f5, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    );
    pulseRing.rotation.set(-Math.PI / 2, 0, 0);
    pulseRing.position.set(bedCenters[1].x, 0.25, bedCenters[1].z);
    pulseRing.visible = false;
    farmGroup.add(pulseRing);

    // ── HTML Overlay Labels Manager ──────────────────────────────────────
    const labelContainer = document.createElement('div');
    labelContainer.className = 'story-3d-labels-layer';
    labelContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:5;';
    mount.appendChild(labelContainer);
    overlayLabelsRef.current = labelContainer;

    function createHtmlPill(text) {
      const el = document.createElement('div');
      el.style.cssText = `
        position: absolute;
        transform: translate(-50%, -50%);
        background: rgba(10, 22, 16, 0.88);
        border: 1px solid rgba(200, 241, 105, 0.35);
        color: #EAF2EC;
        padding: 4px 10px;
        border-radius: 99px;
        font-family: "Space Grotesk", sans-serif;
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        pointer-events: none;
        transition: opacity 0.2s ease;
        box-shadow: 0 4px 14px rgba(0,0,0,0.5);
      `;
      el.innerText = text;
      labelContainer.appendChild(el);
      return el;
    }

    const labels = {
      barind: createHtmlPill('Barind · বরেন্দ্র'),
      haor: createHtmlPill('Haor · হাওর'),
      coast: createHtmlPill('Coast · উপকূল'),
      field: createHtmlPill(activeField?.name || 'Active Field'),
      waterTrend: createHtmlPill('Trend: −1.07 cm/yr'),
      starBed: createHtmlPill('Balanced ⭐ Optimum'),
      harvestDone: createHtmlPill('✓ Harvest Logged'),
    };

    function projectToScreen(pos3D) {
      const p = pos3D.clone().project(camera);
      return {
        x: (p.x * 0.5 + 0.5) * window.innerWidth,
        y: (-p.y * 0.5 + 0.5) * window.innerHeight,
        visible: p.z < 1,
      };
    }

    // ── Animation & Scroll Render Loop ───────────────────────────────────
    let isMounted = true;
    let animId = null;
    let isVisible = typeof document !== 'undefined' ? !document.hidden : true;

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible && isMounted && !animId) {
        animId = requestAnimationFrame(renderFrame);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    function renderFrame() {
      if (!isMounted || !isVisible) {
        animId = null;
        return;
      }
      const t = scrollProgRef.current;
      const shot = getInterpolatedShot(t);

      // 1. Update Camera
      camera.position.copy(shot.pos);
      camera.lookAt(shot.lookAt);
      camera.fov = shot.fov;
      camera.updateProjectionMatrix();

      // Check clearance guard (SH2 rule: >= 3.0 units)
      checkCameraClearance(shot.pos, registeredMeshes);

      // 2. Update Lighting & Fog
      sunLight.position.set(...shot.sun.dir);
      sunLight.color.copy(shot.sun.color);
      sunLight.intensity = shot.sun.intensity;
      fog.color.copy(shot.fog.color);
      fog.density = shot.fog.density;
      scene.background.copy(shot.fog.color);

      // 3. World Transitions based on scroll t
      // t in [0.0, 0.24]: Space & Earth
      // t in [0.20, 0.44]: Bangladesh Map
      // t in [0.40, 1.00]: Farm Diorama
      if (t < 0.22) {
        spaceGroup.visible = true;
        mapGroup.visible = false;
        farmGroup.visible = false;

        // Rotate Earth slightly with scroll
        earthMesh.rotation.y = bangladeshRotY + (t * 0.8);
        // Clouds rotate slowly with time and scroll
        cloudsMesh.rotation.y = bangladeshRotY + (t * 1.0) + (prefersReducedMotion ? 0 : (Date.now() * 0.0001));

        // Shot 02 cloud dive rush
        cloudDiveGroup.visible = t > 0.08 && !prefersReducedMotion;
        if (cloudDiveGroup.visible) {
          cloudDiveGroup.children.forEach(c => {
            c.position.z -= 0.04;
            if (c.position.z < 1.0) c.position.z = 2.8;
          });
        }
      } else if (t < 0.42) {
        spaceGroup.visible = false;
        mapGroup.visible = true;
        farmGroup.visible = false;

        // Shot 04 Aquifer Cutaway Block
        const isCutaway = t > 0.31;
        cutawayGroup.visible = isCutaway;
        if (isCutaway) {
          // Animate water layer downward
          const trendSign = -1;
          aquiferMesh.position.y = -1.5 + Math.sin(Date.now() * 0.003) * 0.08 * trendSign;
        }
      } else {
        spaceGroup.visible = false;
        mapGroup.visible = false;
        farmGroup.visible = true;

        // Shot 05: Rain & Heat
        const isRain = t >= 0.40 && t < 0.52;
        rainPoints.visible = isRain;
        if (isRain) {
          const posAttr = rainGeo.attributes.position;
          for (let i = 0; i < RAIN_COUNT; i++) {
            let y = posAttr.getY(i) - 0.28;
            if (y < 0) y = 10;
            posAttr.setY(i, y);
          }
          posAttr.needsUpdate = true;
        }

        // Shot 06: Nitrogen particles & Legumes
        const isLegumes = t >= 0.50 && t < 0.62;
        nPoints.visible = isLegumes;
        if (isLegumes) {
          const nAttr = nGeo.attributes.position;
          for (let i = 0; i < N_COUNT; i++) {
            let y = nAttr.getY(i) + 0.02;
            if (y > 3.0) y = 0.2;
            nAttr.setY(i, y);
          }
          nAttr.needsUpdate = true;
        }

        // Shot 07: 6 Beds Strategy Switch & Star Glow
        const isPlanner = t >= 0.60 && t < 0.72;
        starGlowGroup.visible = isPlanner;
        if (isPlanner) {
          if (!prefersReducedMotion) starMesh.rotation.y += 0.03;
          // Strategy switch every 25% of this section
          const subT = (t - 0.60) / 0.12;
          if (subT < 0.25) {
            // Balanced ⭐
            setBedPlants(bedMeshes[0], 0x48a832);
            setBedPlants(bedMeshes[1], 0x3e8a2a);
          } else if (subT < 0.50) {
            // Profit
            setBedPlants(bedMeshes[0], 0xe24a32); // Tomato
            setBedPlants(bedMeshes[1], 0xd4b840); // Sunflower
          } else if (subT < 0.75) {
            // Water Saving
            setBedPlants(bedMeshes[0], 0xd4b840); // Mustard
            setBedPlants(bedMeshes[1], 0x3e8a2a); // Chickpea
          } else {
            // Soil Health
            setBedPlants(bedMeshes[0], 0x3e8a2a); // Legumes
            setBedPlants(bedMeshes[1], 0x2e8032);
          }
        }

        // Shot 08: Climate Stress Test (Flood water on 2 beds, drought cracks on 2 beds)
        const isStress = t >= 0.70 && t < 0.82;
        bedMeshes[0].waterLayer.visible = isStress;
        bedMeshes[2].waterLayer.visible = isStress;
        bedMeshes[3].droughtLayer.visible = isStress;
        bedMeshes[4].droughtLayer.visible = isStress;

        // Shot 09: Adaptive Replan Learning Pulse
        const isLearning = t >= 0.80 && t < 0.92;
        pulseRing.visible = isLearning;
        if (isLearning) {
          const s = 1.0 + Math.sin(Date.now() * 0.005) * 0.25;
          pulseRing.scale.set(s, s, 1);
        }
      }

      // 4. Update 3D Projecting HTML Labels (max 3 on screen, hide non-active)
      Object.values(labels).forEach(l => { l.style.opacity = '0'; });

      if (mapGroup.visible && t < 0.32) {
        // Show regional map labels
        const pBarind = projectToScreen(new THREE.Vector3(-1.8, 0.4, -4.8));
        if (pBarind.visible) {
          labels.barind.style.left = `${pBarind.x}px`;
          labels.barind.style.top = `${pBarind.y}px`;
          labels.barind.style.opacity = '1';
        }
        const pHaor = projectToScreen(new THREE.Vector3(1.6, 0.4, -4.5));
        if (pHaor.visible) {
          labels.haor.style.left = `${pHaor.x}px`;
          labels.haor.style.top = `${pHaor.y}px`;
          labels.haor.style.opacity = '1';
        }
        const pCoast = projectToScreen(new THREE.Vector3(-0.4, 0.4, -2.2));
        if (pCoast.visible) {
          labels.coast.style.left = `${pCoast.x}px`;
          labels.coast.style.top = `${pCoast.y}px`;
          labels.coast.style.opacity = '1';
        }
      } else if (mapGroup.visible && t >= 0.32) {
        // Shot 04: Aquifer trend tag
        const pWater = projectToScreen(new THREE.Vector3(activePos.x, -1.2, activePos.z));
        if (pWater.visible) {
          labels.waterTrend.style.left = `${pWater.x}px`;
          labels.waterTrend.style.top = `${pWater.y}px`;
          labels.waterTrend.style.opacity = '1';
        }
      } else if (farmGroup.visible && t >= 0.60 && t < 0.72) {
        // Shot 07: Star Bed tag
        const pStar = projectToScreen(new THREE.Vector3(bedCenters[0].x, 1.4, bedCenters[0].z - 18.0));
        if (pStar.visible) {
          labels.starBed.style.left = `${pStar.x}px`;
          labels.starBed.style.top = `${pStar.y}px`;
          labels.starBed.style.opacity = '1';
        }
      } else if (farmGroup.visible && t >= 0.80 && t < 0.92) {
        // Shot 09: Harvest Logged tag
        const pLearn = projectToScreen(new THREE.Vector3(bedCenters[1].x, 1.2, bedCenters[1].z - 18.0));
        if (pLearn.visible) {
          labels.harvestDone.style.left = `${pLearn.x}px`;
          labels.harvestDone.style.top = `${pLearn.y}px`;
          labels.harvestDone.style.opacity = '1';
        }
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderFrame);
    }

    animId = requestAnimationFrame(renderFrame);

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      if (labelContainer && labelContainer.parentNode) {
        labelContainer.parentNode.removeChild(labelContainer);
      }
      renderer.dispose();
    };
  }, [activeField, graceTrends, onsetComparison, prefersReducedMotion]);

  return (
    <div
      ref={mountRef}
      className="orbit-to-field-canvas-mount"
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
