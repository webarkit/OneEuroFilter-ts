/*
 *  OneEuroFilter.ts
 *  OneEuroFilter
 *
 *  SPDX-License-Identifier: LGPL-3.0-or-later
 *  The linking exception stated below also applies (see LICENSE).
 *
 *  This file is part of OneEuroFilter-ts - WebARKit.
 *
 *  OneEuroFilter-ts is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Lesser General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  OneEuroFilter-ts is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with OneEuroFilter-ts.  If not, see <https://www.gnu.org/licenses/>.
 *
 *  As a special exception, the copyright holders of this library give you
 *  permission to link this library with independent modules to produce an
 *  executable, regardless of the license terms of these independent modules, and to
 *  copy and distribute the resulting executable under terms of your choice,
 *  provided that you also meet, for each linked independent module, the terms and
 *  conditions of the license of that module. An independent module is a module
 *  which is neither derived from nor based on this library. If you modify this
 *  library, you may extend this exception to your version of the library, but you
 *  are not obligated to do so. If you do not wish to do so, delete this exception
 *  statement from your version.
 *
 *  Copyright 2023-2026 WebARKit.
 *
 *  Author(s): Walter Perdan @kalwalt https://github.com/kalwalt
 * 
 *  Ref: https://jaantollander.com/post/noise-filtering-using-one-euro-filter/#mjx-eqn%3A1
 * 
 */
import  { version } from "../package.json";

/** Supported typed array types for filter input/output. */
export type FilterDataArray = Float32Array | Float64Array;

/** Result of {@link OneEuroFilter.filterStep}. */
export interface FilterStepResult<T extends FilterDataArray> {
    /** The smoothed step: `step[i] = alpha[i] * inputStep[i]`. */
    step: T;
    /** The smoothing factor α of each component, in (0, 1]; 0 when the time delta is not positive. */
    alpha: T;
}

export class OneEuroFilter {
    static readonly version: string = version;

    private minCutOff: number;
    private beta: number;
    private dCutOff: number;
    private xPrev: FilterDataArray | null;
    private dxPrev: FilterDataArray | null;
    private tPrev: number | null;
    private initialized: boolean;

    // High performance scratch buffers to avoid allocations at run-time
    private dxScratch: FilterDataArray | null = null;
    private dxHatScratch: FilterDataArray | null = null;

    constructor(minCutOff: number, beta: number, dCutOff: number = 0.001) {
        if (!Number.isFinite(dCutOff) || dCutOff <= 0) {
            throw new RangeError(`OneEuroFilter: dCutOff must be a finite number > 0, got ${dCutOff}`);
        }
        this.minCutOff = minCutOff;
        this.beta = beta;
        this.dCutOff = dCutOff; // timestamps are in milliseconds, so the default 0.001 = 1Hz

        this.xPrev = null;
        this.dxPrev = null;
        this.tPrev = null;
        this.initialized = false;
    }

    smoothingFactor(te: number, cutoff: number): number {
        const r = 2 * Math.PI * cutoff * te;
        return r / (r + 1);
    };

    exponentialSmoothing(a: number, x: number, xPrev: number): number {
        return a * x + (1 - a) * xPrev;
    };

    reset() {
        this.initialized = false;
        this.dxPrev = null;
    }

    /**
     * Creates a new typed array of the same type as the source.
     * @param source - The source typed array to match the type of.
     * @param lengthOrData - The length for a zero-filled array, or data to copy.
     * @returns A new typed array of the same type as the source.
     */
    private createTypedArray<T extends FilterDataArray>(source: T, lengthOrData: number | ArrayLike<number>): T {
        const Ctor = source.constructor as { new (arg: number | ArrayLike<number>): T };
        return new Ctor(lengthOrData);
    }

    /**
     * Makes sure the scratch buffers have the given length, reallocating them with the type of `source` if not.
     */
    private ensureScratch(source: FilterDataArray): void {
        if (this.dxScratch === null || this.dxScratch.length !== source.length) {
            this.dxScratch = this.createTypedArray(source, source.length);
            this.dxHatScratch = this.createTypedArray(source, source.length);
        }
    }

    /**
     * The per-component core shared by {@link filter} and {@link filterStep}.
     * Updates the filtered derivative of component `i` in the scratch buffers and returns its smoothing factor α.
     * @param i - The component index.
     * @param te - The time delta, > 0.
     * @param step - The raw change of component `i` since the previous filtered value.
     * @param ad - The smoothing factor of the derivative filter for `te`.
     */
    private componentAlpha(i: number, te: number, step: number, ad: number): number {
        const dx = this.dxScratch!;
        const dxHat = this.dxHatScratch!;

        // The filtered derivative of the signal.
        dx[i] = step / te;
        dxHat[i] = this.exponentialSmoothing(ad, dx[i], this.dxPrev![i]);

        // The cutoff grows with the speed
        const cutOff = this.minCutOff + this.beta * Math.abs(dxHat[i]);
        return this.smoothingFactor(te, cutOff);
    }

    /**
     * Filters the input signal using the One Euro Filter algorithm.
     * Accepts either Float32Array or Float64Array.
     * @param t - The timestamp of the current sample.
     * @param x - The input signal as a Float32Array or Float64Array.
     * @param out - Optional pre-allocated destination array to write the result into, achieving zero allocation.
     * @returns The filtered signal array.
     */
    filter<T extends FilterDataArray>(t: number, x: T, out?: T): T {
        if (!this.initialized) {
            this.initialized = true;
            this.xPrev = this.createTypedArray(x, x);
            this.dxPrev = this.createTypedArray(x, x.length);
            this.dxScratch = this.createTypedArray(x, x.length);
            this.dxHatScratch = this.createTypedArray(x, x.length);
            this.tPrev = t;

            const res = out || this.createTypedArray(x, x.length);
            res.set(x);
            return res;
        }

        const te = t - this.tPrev!;
        // Safeguard against zero/negative time differences
        if (te <= 0) {
            const res = out || this.createTypedArray(x, x.length);
            res.set(this.xPrev!);
            return res;
        }

        // Safety check to resize persistent and scratch arrays if the input length changes dynamically
        // (dxPrev can differ only if filterStep() was called on this instance with another length)
        if (this.xPrev!.length !== x.length || this.dxPrev!.length !== x.length) {
            const oldXPrev = this.xPrev!;
            const oldDxPrev = this.dxPrev!;

            this.xPrev = this.createTypedArray(x, x.length);
            this.dxPrev = this.createTypedArray(x, x.length);

            for (let i = 0; i < x.length; i++) {
                this.xPrev[i] = i < oldXPrev.length ? oldXPrev[i] : x[i];
                this.dxPrev[i] = i < oldDxPrev.length ? oldDxPrev[i] : 0;
            }
        }

        this.ensureScratch(x);

        const { xPrev } = this;
        const ad = this.smoothingFactor(te, this.dCutOff);
        const xHat = out || this.createTypedArray(x, x.length);

        for (let i = 0; i < x.length; i++) {
            const a = this.componentAlpha(i, te, x[i] - xPrev![i], ad);

            // The filtered signal
            xHat[i] = this.exponentialSmoothing(a, x[i], xPrev![i]);
        }

        // Store persistent state by copying instead of re-allocating
        if (this.xPrev!.length !== xHat.length) {
            this.xPrev = this.createTypedArray(x, xHat.length);
            this.dxPrev = this.createTypedArray(x, xHat.length);
        }
        this.xPrev!.set(xHat);
        this.dxPrev!.set(this.dxHatScratch!);
        this.tPrev = t;

        return xHat;
    }

    /**
     * Smooths a step computed by the caller, for example a rotation's step in its tangent space.
     * @param te - The time elapsed since the previous step.
     * @param step - The raw step of each component since the previous filtered value.
     * @param out - Optional pre-allocated destination for the smoothed step.
     * @param alphaOut - Optional pre-allocated destination for the smoothing factors.
     * @returns The smoothed step and the smoothing factor of each component.
     */
    filterStep<T extends FilterDataArray>(te: number, step: T, out?: T, alphaOut?: T): FilterStepResult<T> {
        const n = step.length;
        const stepOut = out || this.createTypedArray(step, n);
        const alpha = alphaOut || this.createTypedArray(step, n);

        // Safeguard against zero/negative time differences: no movement, state unchanged
        if (te <= 0) {
            stepOut.fill(0, 0, n);
            alpha.fill(0, 0, n);
            return { step: stepOut, alpha };
        }

        // New components start with a zero derivative, as in filter()
        if (this.dxPrev === null || this.dxPrev.length !== n) {
            const oldDxPrev = this.dxPrev;
            this.dxPrev = this.createTypedArray(step, n);
            if (oldDxPrev !== null) {
                for (let i = 0; i < n && i < oldDxPrev.length; i++) {
                    this.dxPrev[i] = oldDxPrev[i];
                }
            }
        }
        this.ensureScratch(step);

        const ad = this.smoothingFactor(te, this.dCutOff);
        for (let i = 0; i < n; i++) {
            const s = step[i];
            const a = this.componentAlpha(i, te, s, ad);
            stepOut[i] = a * s;
            alpha[i] = a;
        }
        this.dxPrev.set(this.dxHatScratch!);

        return { step: stepOut, alpha };
    }
}
