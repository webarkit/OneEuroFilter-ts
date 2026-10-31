import { describe, it, expect } from 'vitest';
import { OneEuroFilter } from '../src/OneEuroFilter';
import reference from './fixtures/reference-0.2.1.json';

describe('filter() reference', () => {
  // Outputs recorded from v0.2.1 (git 2e6dd5e). filter() must keep producing them bit for bit.
  it.each(reference.cases.map((c) => [`${c.type} minCutOff=${c.minCutOff} beta=${c.beta}`, c] as const))(
    'matches v0.2.1 bit for bit: %s',
    (_name, c) => {
      const Ctor = c.type === 'Float32' ? Float32Array : Float64Array;
      const filter = new OneEuroFilter(c.minCutOff, c.beta);
      const outputs = reference.samples.map((s) => Array.from(filter.filter(s.t, new Ctor(s.x))));
      expect(outputs).toEqual(c.outputs);
    },
  );
});

describe('filterStep()', () => {
  // Frame times in ms and a 3-component signal moving at different speeds
  const frames = Array.from({ length: 30 }, (_, k) => {
    const t = 1000 + k * 16 + (k % 4) * 3;
    return { t, x: [0.002 * t, -0.03 * t + Math.sin(t / 40), 5 + 0.5 * Math.cos(t / 70)] };
  });

  it('matches filter() when the caller computes the step', () => {
    const reference = new OneEuroFilter(0.001, 0.5);
    const stepFilter = new OneEuroFilter(0.001, 0.5);
    let xHat = Float64Array.from(frames[0].x);
    let tPrev = frames[0].t;
    reference.filter(frames[0].t, Float64Array.from(frames[0].x));

    for (const { t, x } of frames.slice(1)) {
      const expected = reference.filter(t, Float64Array.from(x));
      const step = Float64Array.from(x, (v, i) => v - xHat[i]);
      const result = stepFilter.filterStep(t - tPrev, step);
      xHat = Float64Array.from(xHat, (v, i) => v + result.step[i]);
      tPrev = t;
      for (let i = 0; i < x.length; i++) {
        expect(xHat[i]).toBeCloseTo(expected[i], 9);
      }
    }
  });

  it('returns one alpha per component, with step = alpha * input step', () => {
    const filter = new OneEuroFilter(0.001, 0.5);
    let result = filter.filterStep(16, new Float64Array([0.01, 1, 0]));
    for (let k = 0; k < 5; k++) {
      const step = new Float64Array([0.01, 1, 0]);
      result = filter.filterStep(16, step);
      for (let i = 0; i < step.length; i++) {
        expect(result.step[i]).toBe(result.alpha[i] * step[i]);
        expect(result.alpha[i]).toBeGreaterThan(0);
        expect(result.alpha[i]).toBeLessThanOrEqual(1);
      }
    }
    // With beta > 0 the faster component gets the higher cutoff, hence the larger alpha
    expect(result.alpha[1]).toBeGreaterThan(result.alpha[0]);
    expect(result.alpha[0]).toBeGreaterThan(result.alpha[2]);
  });

  it('does not modify the input step', () => {
    const filter = new OneEuroFilter(0.001, 0.5);
    const step = new Float32Array([1, 2, 3]);
    filter.filterStep(16, step);
    expect(Array.from(step)).toEqual([1, 2, 3]);
  });

  it('writes into out and alphaOut when given', () => {
    const filter = new OneEuroFilter(0.001, 0.5);
    const out = new Float32Array(2);
    const alphaOut = new Float32Array(2);
    const result = filter.filterStep(16, new Float32Array([1, 2]), out, alphaOut);
    expect(result.step).toBe(out);
    expect(result.alpha).toBe(alphaOut);
    expect(out[0]).not.toBe(0);
    expect(alphaOut[0]).not.toBe(0);
  });

  it('keeps the input array type', () => {
    const filter = new OneEuroFilter(0.001, 0.5);
    const r32 = filter.filterStep(16, new Float32Array([1, 2]));
    expect(r32.step).toBeInstanceOf(Float32Array);
    expect(r32.alpha).toBeInstanceOf(Float32Array);
    const r64 = new OneEuroFilter(0.001, 0.5).filterStep(16, new Float64Array([1, 2]));
    expect(r64.step).toBeInstanceOf(Float64Array);
    expect(r64.alpha).toBeInstanceOf(Float64Array);
  });

  it.each([0, -5])('returns a zero step and zero alpha for te = %s and keeps its state', (te) => {
    const filter = new OneEuroFilter(0.001, 0.5);
    const twin = new OneEuroFilter(0.001, 0.5);
    for (const f of [filter, twin]) {
      f.filterStep(16, new Float64Array([0.5, -1]));
      f.filterStep(16, new Float64Array([0.4, -0.8]));
    }
    const out = new Float64Array([9, 9]);
    const alphaOut = new Float64Array([9, 9]);
    const result = filter.filterStep(te, new Float64Array([100, 100]), out, alphaOut);
    expect(Array.from(result.step)).toEqual([0, 0]);
    expect(Array.from(result.alpha)).toEqual([0, 0]);

    const next = new Float64Array([0.3, -0.6]);
    expect(filter.filterStep(16, next)).toEqual(twin.filterStep(16, next));
  });

  it('starts again from a zero derivative after reset()', () => {
    const filter = new OneEuroFilter(0.001, 0.5);
    for (let k = 0; k < 5; k++) filter.filterStep(16, new Float64Array([2, -3]));
    filter.reset();
    const step = new Float64Array([0.1, 0.2]);
    expect(filter.filterStep(16, step)).toEqual(new OneEuroFilter(0.001, 0.5).filterStep(16, step));
  });

  it('starts new components from a zero derivative when the length grows', () => {
    const filter = new OneEuroFilter(0.001, 0.5);
    const twin = new OneEuroFilter(0.001, 0.5);
    for (let k = 0; k < 4; k++) {
      filter.filterStep(16, new Float64Array([1, 2]));
      twin.filterStep(16, new Float64Array([1, 2]));
    }
    const grown = filter.filterStep(16, new Float64Array([1, 2, 3]));
    const old = twin.filterStep(16, new Float64Array([1, 2]));
    const fresh = new OneEuroFilter(0.001, 0.5).filterStep(16, new Float64Array([3]));
    expect(Array.from(grown.step)).toEqual([old.step[0], old.step[1], fresh.step[0]]);
    expect(Array.from(grown.alpha)).toEqual([old.alpha[0], old.alpha[1], fresh.alpha[0]]);
  });

  it('does not break filter() when used on the same instance with another length', () => {
    const filter = new OneEuroFilter(0.001, 0.5);
    filter.filter(1000, new Float64Array([1, 2, 3]));
    filter.filterStep(16, new Float64Array([0.1, 0.2]));
    const result = filter.filter(1016, new Float64Array([1.1, 2.1, 3.1]));
    expect(Array.from(result).every(Number.isFinite)).toBe(true);
  });
});
