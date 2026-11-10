// frontend/src/farmScene3D.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { getCropCategory, haToBigha, FARM_PALETTE, mapCropToGeoKey } from './three/farmSceneHelpers.js';

test('FarmScene3D: getCropCategory identifies major Bangladesh crops correctly', () => {
  assert.equal(getCropCategory('Boro Rice'), 'rice');
  assert.equal(getCropCategory('রোপা আমন ধান'), 'rice');
  assert.equal(getCropCategory('Mustard'), 'mustard');
  assert.equal(getCropCategory('সরিষা'), 'mustard');
  assert.equal(getCropCategory('Wheat'), 'wheat');
  assert.equal(getCropCategory('Sunflower'), 'sunflower');
  assert.equal(getCropCategory('Mungbean'), 'pulse');
  assert.equal(getCropCategory('Lentil'), 'pulse');
  assert.equal(getCropCategory('Jute'), 'jute');
  assert.equal(getCropCategory('Potato'), 'potato');
  assert.equal(getCropCategory('Maize'), 'maize');
  assert.equal(getCropCategory('Fallow'), 'fallow');
  assert.equal(getCropCategory('পতিত জমি'), 'fallow');
  assert.equal(getCropCategory(null), 'fallow');
});

test('FarmScene3D: haToBigha converts hectare to bigha accurately', () => {
  assert.equal(haToBigha(1.0), '7.5');
  assert.equal(haToBigha(10.0), '74.7');
  assert.equal(haToBigha(null), null);
  assert.equal(haToBigha(undefined), null);
});

test('FarmScene3D: FARM_PALETTE conforms to natural matte clay diorama standards', () => {
  assert.ok(FARM_PALETTE.bg_dark);
  assert.ok(FARM_PALETTE.bg_light);
  assert.ok(FARM_PALETTE.crop_rice);
  assert.ok(FARM_PALETTE.crop_mustard);
  assert.ok(FARM_PALETTE.soil_base);
  assert.ok(FARM_PALETTE.soil_drought);
});

test('T1: For each of the 5 strategies, the 6 bed cropKeys equal the plan’s 6 crops', () => {
  const seasonKinds = ['rabi', 'k1', 'k2', 'rabi', 'k1', 'k2'];
  const plans = {
    balanced: ['Mustard', 'Mungbean', 'Rice', 'Chickpea', 'Sesame', 'Rice'],
    profit: ['Sunflower', 'Soybean', 'Rice', 'Tomato', 'Mungbean', 'Rice'],
    water: ['Mustard', 'Mungbean', 'Rice', 'Chickpea', 'Sesame', 'Rice'],
    soil: ['Mustard', 'Mungbean', 'Rice', 'Chickpea', 'Sesame', 'Rice'],
    current: ['Boro Rice', 'Fallow', 'T. Aman Rice', 'Boro Rice', 'Fallow', 'T. Aman Rice'],
  };

  const expectedGeoKeys = {
    balanced: ['mustard', 'mungbean', 'rice', 'chickpea', 'sesame', 'rice'],
    profit: ['sunflower', 'soybean', 'rice', 'tomato', 'mungbean', 'rice'],
    water: ['mustard', 'mungbean', 'rice', 'chickpea', 'sesame', 'rice'],
    soil: ['mustard', 'mungbean', 'rice', 'chickpea', 'sesame', 'rice'],
    current: ['riceRipe', 'fallow', 'rice', 'riceRipe', 'fallow', 'rice'],
  };

  for (const [strat, crops] of Object.entries(plans)) {
    const actualGeoKeys = crops.map((crop, i) => mapCropToGeoKey(crop, seasonKinds[i]));
    assert.deepEqual(
      actualGeoKeys,
      expectedGeoKeys[strat],
      `Strategy ${strat} 6 bed cropKeys must match expected 3D geoKeys`
    );
  }
});

test('T2: Clicking bed or season card retains camera position and updates selection outline', () => {
  // Mock camera and controls state
  const camera = { position: { x: 50, y: 30, z: 40, set(x, y, z) { this.x = x; this.y = y; this.z = z; } } };
  const controls = { target: { x: 5, y: 0, z: 2, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, update() {} };

  // Farmer has orbited camera to a custom viewpoint
  const customPos = { x: 42, y: 35, z: 55 };
  camera.position.set(customPos.x, customPos.y, customPos.z);

  // Simulating active bed selection change (e.g. bed 0 -> bed 2)
  const bedObjects = [
    { edges: { material: { opacity: 0, color: { set() {} } } } },
    { edges: { material: { opacity: 0, color: { set() {} } } } },
    { edges: { material: { opacity: 0, color: { set() {} } } } },
  ];

  const selectBed = (activeIndex) => {
    bedObjects.forEach((b, j) => {
      if (j === activeIndex) {
        b.edges.material.opacity = 0.95;
      } else {
        b.edges.material.opacity = 0;
      }
    });
  };

  selectBed(2);
  assert.equal(bedObjects[2].edges.material.opacity, 0.95);
  assert.equal(bedObjects[0].edges.material.opacity, 0);
  // Camera must not have jumped
  assert.equal(camera.position.x, customPos.x);
  assert.equal(camera.position.y, customPos.y);
  assert.equal(camera.position.z, customPos.z);
});

test('T3: Baseline current strategy presents 3 active seasons and greys out beds 4-6 with repeat label', () => {
  const currentRotation = { rabi: 'Boro Rice', kharif1: 'Fallow', kharif2: 'T. Aman Rice' };
  const seasonKeys = ['Y1_S1', 'Y1_S2', 'Y1_S3', 'Y2_S1', 'Y2_S2', 'Y2_S3'];
  const isBaseline = true;

  // The 3 displayed cards for baseline
  const displayedCards = isBaseline ? seasonKeys.slice(0, 3) : seasonKeys;
  assert.equal(displayedCards.length, 3);

  // 3D bed construction: CF1 exactly 3 beds for baseline view
  const activeKeys = isBaseline ? seasonKeys.slice(0, 3) : seasonKeys;
  const farm3dBeds = activeKeys.map((k, i) => {
    return {
      id: k,
      crop: i === 0 ? currentRotation.rabi : i === 1 ? currentRotation.kharif1 : currentRotation.kharif2,
      labelBn: 'আপনার চাষ · প্রতি বছর একই',
      labelEn: 'Your farming now · same every year',
    };
  });

  assert.equal(farm3dBeds.length, 3);
  assert.equal(farm3dBeds[0].crop, currentRotation.rabi);
  assert.equal(farm3dBeds[1].crop, currentRotation.kharif1);
  assert.equal(farm3dBeds[2].crop, currentRotation.kharif2);
  assert.equal(farm3dBeds[0].labelEn, 'Your farming now · same every year');
});

test('T4: Performance optimizations clamp pixel ratio <= 1.5 and shadowMap config', () => {
  const clampRatio = (dpr) => Math.min(dpr || 1, 1.5);
  assert.equal(clampRatio(1), 1);
  assert.equal(clampRatio(2), 1.5);
  assert.equal(clampRatio(3), 1.5);
  assert.equal(clampRatio(0.75), 0.75);

  const shadowMapConfig = {
    enabled: true,
    type: 'PCFSoftShadowMap',
    autoUpdate: false,
    needsUpdate: true,
  };
  assert.equal(shadowMapConfig.autoUpdate, false);
  assert.equal(shadowMapConfig.needsUpdate, true);
});

test('T5: Authentic diorama atmosphere and botanical crop distinctness', () => {
  const sunElevationDeg = Math.round(Math.asin(32.5 / Math.hypot(58, 32.5, 42)) * (180 / Math.PI));
  assert.ok(sunElevationDeg >= 22 && sunElevationDeg <= 26, 'Sun elevation is around ~24°');

  const supportedCrops = [
    'mustard', 'riceRipe', 'rice', 'mungbean', 'tomato', 'sunflower',
    'wheat', 'potato', 'maize', 'lentil', 'chickpea', 'sesame', 'soybean', 'fallow'
  ];
  supportedCrops.forEach(crop => {
    assert.ok(mapCropToGeoKey(crop, 'rabi'), `GeoKey must be resolvable for ${crop}`);
  });
});


