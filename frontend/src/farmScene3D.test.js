// frontend/src/farmScene3D.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { getCropCategory, haToBigha, FARM_PALETTE } from './three/farmSceneHelpers.js';

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
