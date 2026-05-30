/*
 *  OneEuroFilter.ts
 *  OneEuroFilter
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
 *  along with OneEuroFilter.  If not, see <http://www.gnu.org/licenses/>.
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
import packageJson from "../package.json";
const { version } = packageJson;

/** Supported typed array types for filter input/output. */
export type FilterDataArray = Float32Array | Float64Array;


export class OneEuroFilter {
    private minCutOff: number;
    private beta: number;
    private dCutOff: number;
    private xPrev: FilterDataArray | null;
    private dxPrev: FilterDataArray | null;
    private tPrev: number | null;
    private initialized: boolean;
    private version: string = version;

    // High performance scratch buffers to avoid allocations at run-time
    private dxScratch: FilterDataArray | null = null;
    private dxHatScratch: FilterDataArray | null = null;

    constructor(minCutOff: number, beta: number) {
        this.minCutOff = minCutOff;
        this.beta = beta;
        this.dCutOff = 0.001; // period in milliseconds, so default to 0.001 = 1Hz

        this.xPrev = null;
        this.dxPrev = null;
        this.tPrev = null;
        this.initialized = false;
        console.log("OneEuroFilter: ", this.version);
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
        if (this.xPrev!.length !== x.length) {
            const oldXPrev = this.xPrev!;
            const oldDxPrev = this.dxPrev!;

            this.xPrev = this.createTypedArray(x, x.length);
            this.dxPrev = this.createTypedArray(x, x.length);

            for (let i = 0; i < x.length; i++) {
                this.xPrev[i] = i < oldXPrev.length ? oldXPrev[i] : x[i];
                this.dxPrev[i] = i < oldDxPrev.length ? oldDxPrev[i] : 0;
            }
        }

        let dx = this.dxScratch!;
        let dxHat = this.dxHatScratch!;
        if (dx.length !== x.length) {
            dx = this.createTypedArray(x, x.length);
            dxHat = this.createTypedArray(x, x.length);
            this.dxScratch = dx;
            this.dxHatScratch = dxHat;
        }

        const { xPrev, dxPrev } = this;
        const ad = this.smoothingFactor(te, this.dCutOff);
        const xHat = out || this.createTypedArray(x, x.length);

        for (let i = 0; i < x.length; i++) {
            // The filtered derivative of the signal.
            dx[i] = (x[i] - xPrev![i]) / te;
            dxHat[i] = this.exponentialSmoothing(ad, dx[i], dxPrev![i]);

            // The filtered signal
            const cutOff = this.minCutOff + this.beta * Math.abs(dxHat[i]);
            const a = this.smoothingFactor(te, cutOff);
            xHat[i] = this.exponentialSmoothing(a, x[i], xPrev![i]);
        }

        // Store persistent state by copying instead of re-allocating
        if (this.xPrev!.length !== xHat.length) {
            this.xPrev = this.createTypedArray(x, xHat.length);
            this.dxPrev = this.createTypedArray(x, xHat.length);
        }
        this.xPrev!.set(xHat);
        this.dxPrev!.set(dxHat);
        this.tPrev = t;

        return xHat;
    }
}
