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
     * @param t - The timestamp of the current sample.
     * @param x - The input signal as a Float32Array.
     * @returns The filtered signal as a Float32Array.
     */
    filter(t: number, x: Float32Array): Float32Array;
}
