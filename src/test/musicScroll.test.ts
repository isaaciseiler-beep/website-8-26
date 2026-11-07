import { describe, expect, it } from 'vitest';
import { createMusicWheelGesture, musicDragPull, stepMusicSpring } from '@/lib/musicScroll';

describe('restrained album motion', () => {
  it('has a small single rebound and settles precisely without a long oscillating tail', () => {
    let position = 0, velocity = 0, peak = 0, crossings = 0;
    let above = false;
    for (let frame = 0; frame < 120; frame++) {
      ({ position, velocity } = stepMusicSpring(position, velocity, 1, 1 / 120));
      peak = Math.max(peak, position);
      if ((position > 1) !== above) { crossings++; above = position > 1; }
    }
    expect(peak).toBeGreaterThan(1);
    expect(peak).toBeLessThan(1.012);
    expect(Math.abs(position - 1)).toBeLessThan(0.0001);
    expect(Math.abs(velocity)).toBeLessThan(0.0001);
    // Floating-point crossings after settling are imperceptible; no second visible bounce.
    expect(crossings).toBeLessThanOrEqual(2);
  });

  it('preserves the same motion across common display refresh rates and smooth retargets', () => {
    const advance = (rate: number) => {
      let state = { position: 0, velocity: 0 };
      for (let frame = 0; frame < rate / 2; frame++) state = stepMusicSpring(state.position, state.velocity, 1, 1 / rate);
      return state;
    };
    const sixty = advance(60), highRefresh = advance(120);
    expect(sixty.position).toBeCloseTo(highRefresh.position, 8);
    expect(sixty.velocity).toBeCloseTo(highRefresh.velocity, 8);
    const reversed = stepMusicSpring(0.45, 2, 0, 1 / 120);
    expect(reversed.position).toBeGreaterThan(0.45);
    expect(reversed.position).toBeLessThan(0.47);
    expect(reversed.velocity).toBeLessThan(2);
  });

  it('follows the finger then adds increasing resistance beyond a cover and at the endpoints', () => {
    expect(musicDragPull(60, 240, false)).toBe(0.25);
    expect(musicDragPull(1000, 240, false)).toBeLessThan(1.12);
    expect(musicDragPull(-1000, 240, true)).toBeGreaterThan(-0.12);
    expect(musicDragPull(-60, 240, true)).toBeLessThan(0);
  });
});

describe('album wheel gestures', () => {
  it('gives a little before committing, then ignores a long decaying momentum tail', () => {
    const consume = createMusicWheelGesture();
    const pull = consume(30, 0, 320);
    expect(pull.step).toBe(0);
    expect(pull.pull).toBeGreaterThan(0);
    expect(pull.pull).toBeLessThan(0.2);
    expect(consume(60, 20, 320).step).toBe(1);
    for (let time = 40; time < 1000; time += 20) expect(consume(40 * Math.exp(-time / 300), time, 320).step).toBe(0);
    expect(consume(100, 1250, 320).step).toBe(1);
  });

  it('responds to a deliberate reversal without unlocking for tiny tail noise', () => {
    const consume = createMusicWheelGesture();
    expect(consume(100, 0, 320).step).toBe(1);
    expect(consume(-2, 20, 320).step).toBe(0);
    expect(consume(60, 40, 320).step).toBe(0);
    expect(consume(-100, 60, 320).step).toBe(-1);
  });
});
