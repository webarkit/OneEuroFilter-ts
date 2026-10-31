/** Supported typed array types for filter input/output. */
export type FilterDataArray = Float32Array | Float64Array;
/** Result of {@link OneEuroFilter.filterStep}. */
export interface FilterStepResult<T extends FilterDataArray> {
    /** The smoothed step: `step[i] = alpha[i] * inputStep[i]`. */
    step: T;
    /**
     * The smoothing factor α of each component: in [0, 1) for non-negative parameters, 1 where
     * `2π * cutoff * te` overflows, and 0 when the time delta is not positive or is NaN.
     */
    alpha: T;
}
/**
 * The 1€ filter: an adaptive low-pass filter whose cutoff grows with the speed of the signal
 * (Casiez, Roussel, Vogel, CHI 2012).
 *
 * Units: timestamps and time deltas are in milliseconds, so cutoff frequencies are in cycles per
 * millisecond. A frequency in Hz divided by 1000 gives the value to pass: `0.001` is 1 Hz.
 * The filter reads no clock; time comes only from the timestamps it is given.
 */
export declare class OneEuroFilter {
    /** The package version. */
    static readonly version: string;
    private minCutOff;
    private beta;
    private dCutOff;
    private xPrev;
    private dxPrev;
    private tPrev;
    private initialized;
    private dxScratch;
    private dxHatScratch;
    /**
     * @param minCutOff - The minimum cutoff frequency, in cycles per millisecond (Hz / 1000).
     *   Lower values smooth slow movements more.
     * @param beta - The speed coefficient, in 1 / (signal unit): the cutoff is
     *   `minCutOff + beta * |speed|`, with the speed in signal units per millisecond.
     *   Higher values reduce the lag on fast movements. Its value is the same as with seconds and Hz.
     * @param dCutOff - The cutoff frequency of the speed (derivative) filter, in cycles per
     *   millisecond (Hz / 1000). Defaults to `0.001` (1 Hz).
     * @throws RangeError if `dCutOff` is not a finite number > 0.
     */
    constructor(minCutOff: number, beta: number, dCutOff?: number);
    /**
     * The smoothing factor α of an exponential filter: `r / (r + 1)` with `r = 2π * cutoff * te`.
     * @param te - The time delta, in milliseconds.
     * @param cutoff - The cutoff frequency, in cycles per millisecond.
     */
    smoothingFactor(te: number, cutoff: number): number;
    /**
     * One step of exponential smoothing: `a * x + (1 - a) * xPrev`.
     * @param a - The smoothing factor, in [0, 1].
     * @param x - The new value.
     * @param xPrev - The previous smoothed value.
     */
    exponentialSmoothing(a: number, x: number, xPrev: number): number;
    /**
     * Forgets the filter's state: the next `filter()` call takes its sample as is, and the next
     * `filterStep()` call starts from a zero speed.
     */
    reset(): void;
    /**
     * Creates a new typed array of the same type as the source.
     * @param source - The source typed array to match the type of.
     * @param lengthOrData - The length for a zero-filled array, or data to copy.
     * @returns A new typed array of the same type as the source.
     */
    private createTypedArray;
    /**
     * Makes sure the scratch buffers have the given length, reallocating them with the type of `source` if not.
     */
    private ensureScratch;
    /**
     * The per-component core shared by {@link filter} and {@link filterStep}.
     * Updates the filtered derivative of component `i` in the scratch buffers and returns its smoothing factor α.
     * @param i - The component index.
     * @param te - The time delta, > 0.
     * @param step - The raw change of component `i` since the previous filtered value.
     * @param ad - The smoothing factor of the derivative filter for `te`.
     */
    private componentAlpha;
    /**
     * Filters the input signal using the One Euro Filter algorithm.
     * Accepts either Float32Array or Float64Array.
     * The first sample (and the first after `reset()`) is returned as is.
     * A sample whose timestamp is not greater than the previous one returns the previous filtered
     * value and leaves the state unchanged.
     * @param t - The timestamp of the current sample, in milliseconds: a finite number, preferably from
     *   a monotonic clock such as `performance.now()`.
     * @param x - The input signal as a Float32Array or Float64Array. It is not modified.
     * @param out - Optional pre-allocated destination array to write the result into, achieving zero allocation.
     * @returns The filtered signal array.
     */
    filter<T extends FilterDataArray>(t: number, x: T, out?: T): T;
    /**
     * Smooths a step computed by the caller, for example a rotation's step in its tangent space
     * (`ω = log(R̂ᵀ R)`, then `R̂ ← R̂ · exp(result.step)`).
     *
     * This is the core of `filter()` without the difference and the update, which the caller does:
     * with `step = x - x̂`, `x̂ + result.step` equals `filter()`'s output up to rounding.
     * Each component has its own α, because its cutoff depends on its own filtered speed.
     * When `te` is not positive or is NaN, the step and α are zero and the state is unchanged.
     * Use either `filter()` or `filterStep()` on one instance: they share the filtered speed.
     * @param te - The time elapsed since the previous step, in milliseconds. Only the products of `te`
     *   with the cutoffs and the quotient `step / te` are used, so other units work if `te` and the
     *   cutoffs agree (for example seconds and Hz).
     * @param step - The raw step of each component since the previous filtered value. It is not modified.
     * @param out - Optional pre-allocated destination for the smoothed step.
     * @param alphaOut - Optional pre-allocated destination for the smoothing factors.
     * @returns The smoothed step (`alpha[i] * step[i]`) and the smoothing factor of each component.
     * @throws RangeError if `out` or `alphaOut` is shorter than `step`, or if they are the same array.
     */
    filterStep<T extends FilterDataArray>(te: number, step: T, out?: T, alphaOut?: T): FilterStepResult<T>;
}
