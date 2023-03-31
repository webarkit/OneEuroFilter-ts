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
    filter(t: number, x: number[]): number[];
}
