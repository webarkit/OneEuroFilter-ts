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
    private version;
    constructor(minCutOff: number, beta: number);
    smoothingFactor(te: number, cutoff: number): number;
    exponentialSmoothing(a: number, x: number, xPrev: number): number;
    reset(): void;
    /**
     * Creates a new typed array of the same type as the source.
     * @param source - The source typed array to match the type of.
     * @param lengthOrData - The length for a zero-filled array, or data to copy.
     * @returns A new typed array of the same type as the source.
     */
    private createTypedArray;
    /**
     * Filters the input signal using the One Euro Filter algorithm.
     * Accepts either Float32Array or Float64Array; the output type matches the input type.
     * @param t - The timestamp of the current sample.
     * @param x - The input signal as a Float32Array or Float64Array.
     * @returns The filtered signal as the same typed array type as the input.
     */
    filter<T extends FilterDataArray>(t: number, x: T): T;
}
