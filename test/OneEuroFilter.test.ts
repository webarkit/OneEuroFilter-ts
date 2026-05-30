import { describe, it, expect } from 'vitest';
import { OneEuroFilter } from '../src/OneEuroFilter';

describe('OneEuroFilter', () => {
  it('should initialize correctly with parameters', () => {
    const filter = new OneEuroFilter(120, 0.1);
    expect(filter).toBeDefined();
  });

  describe('Initialization Path', () => {
    it('should initialize state on the first call and return a new copy of the input', () => {
      const filter = new OneEuroFilter(120, 0.1);
      const input = new Float32Array([1.0, 2.0, 3.0]);
      
      const result = filter.filter(1000, input);
      
      // Values must match exactly
      expect(result).toEqual(input);
      // It must be a distinct array reference (copy-on-initialization)
      expect(result).not.toBe(input);
      
      // Mutating result should not affect the internal filter state
      result[0] = 999.0;
      const secondResult = filter.filter(1016, new Float32Array([2.0, 3.0, 4.0]));
      expect(secondResult[0]).not.toBeCloseTo(999.0);
    });
  });

  describe('Filtering Correctness & Smoothing', () => {
    it('should smoothly filter values over consecutive timestamps', () => {
      const filter = new OneEuroFilter(1.0, 0.01);
      const start = new Float32Array([10.0, 20.0]);
      
      // T=0: Initial state
      const r0 = filter.filter(0, start);
      expect(r0).toEqual(start);
      
      // T=1: Significant shift in input
      const nextInput = new Float32Array([20.0, 40.0]);
      const r1 = filter.filter(1, nextInput);
      
      // The filter should smooth the shift (values should be between start and nextInput)
      expect(r1[0]).toBeGreaterThan(10.0);
      expect(r1[0]).toBeLessThan(20.0);
      expect(r1[1]).toBeGreaterThan(20.0);
      expect(r1[1]).toBeLessThan(40.0);
      
      // T=2: Filter again with same input, it should get closer to target
      const r2 = filter.filter(2, nextInput);
      expect(r2[0]).toBeGreaterThan(r1[0]);
      expect(r2[0]).toBeLessThan(20.0);
      expect(r2[1]).toBeGreaterThan(r1[1]);
      expect(r2[1]).toBeLessThan(40.0);
    });
  });

  describe('Zero/Negative Delta Time Safeguards', () => {
    it('should handle zero delta time (te === 0) gracefully without producing NaN', () => {
      const filter = new OneEuroFilter(120, 0.1);
      const input1 = new Float32Array([1.0, 2.0]);
      const input2 = new Float32Array([5.0, 10.0]);
      
      // Initial call
      filter.filter(1000, input1);
      
      // Call again immediately at the exact same timestamp (te = 0)
      const result = filter.filter(1000, input2);
      
      // Should not contain NaN or Infinity, should return the previous filtered values (input1)
      expect(Number.isNaN(result[0])).toBe(false);
      expect(Number.isFinite(result[0])).toBe(true);
      expect(result).toEqual(input1);
    });

    it('should handle negative delta time (te < 0) gracefully', () => {
      const filter = new OneEuroFilter(120, 0.1);
      const input1 = new Float32Array([1.0, 2.0]);
      const input2 = new Float32Array([5.0, 10.0]);
      
      filter.filter(1000, input1);
      
      // Call with timestamp backwards in time (te < 0)
      const result = filter.filter(990, input2);
      
      // Should return previous state instead of breaking
      expect(Number.isNaN(result[0])).toBe(false);
      expect(result).toEqual(input1);
    });
  });

  describe('Dynamic Resizing Support', () => {
    it('should support dynamic changes in input vector size at runtime without crashing', () => {
      const filter = new OneEuroFilter(120, 0.1);
      
      // 1. Initial size = 3
      const input3 = new Float32Array([1.0, 2.0, 3.0]);
      const res3 = filter.filter(1000, input3);
      expect(res3.length).toBe(3);
      
      // 2. Resize to 5 elements
      const input5 = new Float32Array([10.0, 20.0, 30.0, 40.0, 50.0]);
      const res5 = filter.filter(1016, input5);
      expect(res5.length).toBe(5);
      expect(res5[3]).toBeCloseTo(40.0); // Will initialize new channels with input
      
      // 3. Downsize to 2 elements
      const input2 = new Float32Array([100.0, 200.0]);
      const res2 = filter.filter(1032, input2);
      expect(res2.length).toBe(2);
    });
  });

  describe('Type Retention', () => {
    it('should return Float32Array when input is Float32Array', () => {
      const filter = new OneEuroFilter(120, 0.1);
      const input = new Float32Array([1.0, 2.0]);
      
      const r1 = filter.filter(1000, input);
      expect(r1).toBeInstanceOf(Float32Array);
      
      const r2 = filter.filter(1016, input);
      expect(r2).toBeInstanceOf(Float32Array);
    });

    it('should return Float64Array when input is Float64Array', () => {
      const filter = new OneEuroFilter(120, 0.1);
      const input = new Float64Array([1.0, 2.0]);
      
      const r1 = filter.filter(1000, input);
      expect(r1).toBeInstanceOf(Float64Array);
      
      const r2 = filter.filter(1016, input);
      expect(r2).toBeInstanceOf(Float64Array);
    });
  });

  describe('Zero-Allocation out-parameter support', () => {
    it('should filter in-place into the provided out array and perform zero allocations', () => {
      const filter = new OneEuroFilter(120, 0.1);
      const input = new Float32Array([1.0, 2.0]);
      const out = new Float32Array(2);
      
      // 1. Initial call
      const res1 = filter.filter(1000, input, out);
      expect(res1).toBe(out); // Reference check
      expect(out).toEqual(input);
      
      // 2. Subsequent call
      const input2 = new Float32Array([10.0, 20.0]);
      const res2 = filter.filter(1016, input2, out);
      expect(res2).toBe(out); // Reference check
      
      // Smooth values should be written directly to out
      expect(out[0]).toBeGreaterThan(1.0);
      expect(out[0]).toBeLessThan(10.0);
    });
  });

  describe('Reset', () => {
    it('should reset initialization state and clear historical memory', () => {
      const filter = new OneEuroFilter(120, 0.1);
      const input1 = new Float32Array([10.0, 20.0]);
      const input2 = new Float32Array([100.0, 200.0]);
      
      filter.filter(1000, input1);
      
      // Reset the filter
      filter.reset();
      
      // The next call should be treated as a fresh initialization call, returning the input directly
      const result = filter.filter(1016, input2);
      expect(result).toEqual(input2);
    });
  });
});
