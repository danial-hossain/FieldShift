import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SQM_PER_BIGHA,
  HA_TO_BIGHA,
  KG_PER_MAUND,
  tonPerHaToMaundPerBigha,
  maundPerBighaToTonPerHa,
  haToBigha,
  bighaToHa
} from './utils/conversions.js';

test('1 bigha equals exactly 1337.8 m2 and 1 maund equals 37.32 kg', () => {
  assert.strictEqual(SQM_PER_BIGHA, 1337.8);
  assert.strictEqual(KG_PER_MAUND, 37.32);
  assert.ok(Math.abs(HA_TO_BIGHA - 7.475) < 0.001);
});

test('t/ha to maund/bigha conversion ratio is 1000 * 0.13378 / 37.32 = ~3.585', () => {
  const oneTonHa = tonPerHaToMaundPerBigha(1.0);
  assert.ok(Math.abs(oneTonHa - 3.584673) < 0.001);
  assert.strictEqual(oneTonHa.toFixed(3), '3.585');

  // 4.8 t/ha Aman rice -> ~17.206 maund/bigha
  const riceMaund = tonPerHaToMaundPerBigha(4.8);
  assert.ok(Math.abs(riceMaund - 17.206) < 0.01);
});

test('maund/bigha to t/ha roundtrip accurately recovers original yield', () => {
  const originalTonHa = 3.5;
  const maund = tonPerHaToMaundPerBigha(originalTonHa);
  const recoveredTonHa = maundPerBighaToTonPerHa(maund);
  assert.ok(Math.abs(recoveredTonHa - originalTonHa) < 1e-6);
});

test('ha to bigha roundtrip accurately recovers area', () => {
  const ha = 2.5;
  const bigha = haToBigha(ha);
  const recoveredHa = bighaToHa(bigha);
  assert.ok(Math.abs(recoveredHa - ha) < 1e-6);
});

test('null/invalid inputs gracefully return null without error', () => {
  assert.strictEqual(tonPerHaToMaundPerBigha(null), null);
  assert.strictEqual(tonPerHaToMaundPerBigha(undefined), null);
  assert.strictEqual(tonPerHaToMaundPerBigha('invalid'), null);
  assert.strictEqual(maundPerBighaToTonPerHa(null), null);
  assert.strictEqual(haToBigha(null), null);
  assert.strictEqual(bighaToHa(null), null);
});
