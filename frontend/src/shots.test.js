// frontend/src/shots.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { SHOTS, getInterpolatedShot, checkCameraClearance } from './overview/shots.js';

test('SH2: shots.js contains exactly 10 defined camera shots with all required fields', () => {
  assert.equal(SHOTS.length, 10, 'Must have exactly 10 shots for 10 scenes');
  SHOTS.forEach((shot, i) => {
    assert.ok(shot.id, `Shot ${i} must have id`);
    assert.equal(shot.camPos.length, 3, `Shot ${i} camPos must be [x,y,z]`);
    assert.equal(shot.lookAt.length, 3, `Shot ${i} lookAt must be [x,y,z]`);
    assert.ok(typeof shot.fov === 'number' && shot.fov >= 35 && shot.fov <= 60, `Shot ${i} fov must be sane`);
    assert.ok(shot.sun && shot.sun.dir && shot.sun.color && shot.sun.intensity, `Shot ${i} must have sun`);
    assert.ok(shot.fog && shot.fog.color && typeof shot.fog.density === 'number', `Shot ${i} must have fog`);
    assert.ok(shot.sceneState, `Shot ${i} must have sceneState`);
  });
});

test('SH2: getInterpolatedShot smoothly calculates position and lookAt across scroll [0, 1]', () => {
  for (let t = 0; t <= 1.0; t += 0.05) {
    const shot = getInterpolatedShot(t);
    assert.ok(shot.pos, `Interpolated shot at t=${t} must have pos`);
    assert.ok(shot.lookAt, `Interpolated shot at t=${t} must have lookAt`);
    assert.ok(shot.sun, `Interpolated shot at t=${t} must have sun`);
    assert.ok(shot.fog, `Interpolated shot at t=${t} must have fog`);
    assert.ok(Number.isFinite(shot.pos.x) && Number.isFinite(shot.pos.y) && Number.isFinite(shot.pos.z));
    assert.ok(Number.isFinite(shot.lookAt.x) && Number.isFinite(shot.lookAt.y) && Number.isFinite(shot.lookAt.z));
  }
});

test('SH2: Camera clearance check function is defined and callable', () => {
  assert.equal(typeof checkCameraClearance, 'function');
});

