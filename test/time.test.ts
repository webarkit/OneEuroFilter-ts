import { describe, it, expect, vi, afterEach } from 'vitest';
import { OneEuroFilter } from '../src/OneEuroFilter';

// The filter's time comes only from the timestamps it is given (issue #9, item 6).
describe('Time source', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('never reads a clock', () => {
    const dateNow = vi.spyOn(Date, 'now');
    const perfNow = vi.spyOn(performance, 'now');

    const filter = new OneEuroFilter(0.001, 0.5, 0.002);
    for (let k = 0; k < 5; k++) filter.filter(1000 + 16 * k, new Float32Array([k, 2 * k]));
    filter.filter(1064, new Float32Array([9, 9])); // repeated timestamp
    filter.reset();
    for (let k = 0; k < 3; k++) filter.filterStep(16, new Float64Array([0.1, -0.1]));
    filter.filterStep(0, new Float64Array([0.1, -0.1]));

    expect(dateNow).not.toHaveBeenCalled();
    expect(perfNow).not.toHaveBeenCalled();
  });

  const smoothed = () => {
    const filter = new OneEuroFilter(0.001, 0.5);
    let last = new Float64Array(0);
    for (let k = 0; k < 4; k++) last = filter.filter(1000 + 16 * k, new Float64Array([10 * k, -5 * k]));
    return { filter, last, tLast: 1000 + 16 * 3 };
  };

  it.each([0, -1, -100])(
    'returns the previous filtered value, not the previous input, when the timestamp moves by %s ms',
    (dt) => {
      const { filter, last, tLast } = smoothed();
      expect(last[0]).not.toBe(30); // the filter has smoothed, so the last output is not the last input
      const result = filter.filter(tLast + dt, new Float64Array([1000, 1000]));
      expect(Array.from(result)).toEqual(Array.from(last));
      expect(result).not.toBe(last);
    },
  );

  it('writes the previous filtered value into out for a non-increasing timestamp', () => {
    const { filter, last, tLast } = smoothed();
    const out = new Float64Array(2);
    expect(filter.filter(tLast, new Float64Array([1000, 1000]), out)).toBe(out);
    expect(Array.from(out)).toEqual(Array.from(last));
  });

  it('ignores a sample with a non-increasing timestamp entirely', () => {
    const a = smoothed();
    const b = smoothed();
    a.filter.filter(a.tLast - 5, new Float64Array([1000, 1000]));
    a.filter.filter(a.tLast, new Float64Array([-1000, 1000]));
    const next = new Float64Array([45, -20]);
    expect(Array.from(a.filter.filter(a.tLast + 16, next))).toEqual(Array.from(b.filter.filter(b.tLast + 16, next)));
  });
});
