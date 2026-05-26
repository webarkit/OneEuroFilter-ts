/** Supported typed array types for filter input/output. */
export type FilterDataArray = Float32Array | Float64Array;
export declare class OneEuroFilter {
    private minCutOff;
    private beta;
    private dCutOff;
    private xPrev;
    private dxPrev;
    private tPrev;
    private initialized;
    constructor(minCutOff: number, beta: number);
    smoothingFactor(te: number, cutoff: number): number;
    exponentialSmoothing(a: number, x: number, xPrev: number): number;
    reset(): void;
    /**
     * Filters the input signal using the One Euro Filter algorithm.
     * Accepts either Float32Array or Float64Array; the output type matches the input type.
     * @param t - The timestamp of the current sample.
     * @param x - The input signal as a Float32Array or Float64Array.
     * @returns The filtered signal as the same typed array type as the input.
     */
    filter<T extends FilterDataArray>(t: number, x: T): T;
}
