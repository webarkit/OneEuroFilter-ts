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
 *  Copyright 2023-2024 WebARKit.
 *
 *  Author(s): Walter Perdan @kalwalt https://github.com/kalwalt
 * 
 *  Ref: https://jaantollander.com/post/noise-filtering-using-one-euro-filter/#mjx-eqn%3A1
 * 
 */
import packageJson from "../package.json";
const { version } = packageJson;


export class OneEuroFilter {
    private minCutOff: number;
    private beta: number;
    private dCutOff: number;
    private xPrev: number[] | null;
    private dxPrev: number[] | null;
    private tPrev: number | null;
    private initialized: boolean;
    private version: string = version;
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

    filter(t: number, x: number[]) {
        if (!this.initialized) {
            this.initialized = true;
            this.xPrev = x;
            this.dxPrev = x.map(() => 0);
            this.tPrev = t;
            return x;
        }

        const { xPrev, tPrev, dxPrev } = this;

        //console.log("filter", x, xPrev, x.map((xx, i) => x[i] - xPrev[i]));

        const te = t - tPrev!;

        const ad = this.smoothingFactor(te, this.dCutOff);

        const dx: number[] = [];
        const dxHat: number[] = [];
        const xHat: number[] = [];
        for (let i = 0; i < x.length; i++) {
            // The filtered derivative of the signal.
            dx[i] = (x[i] - xPrev![i]) / te;
            dxHat[i] = this.exponentialSmoothing(ad, dx[i], dxPrev![i]);

            // The filtered signal
            const cutOff = this.minCutOff + this.beta * Math.abs(dxHat[i]);
            const a = this.smoothingFactor(te, cutOff);
            xHat[i] = this.exponentialSmoothing(a, x[i], xPrev![i]);
        }

        // update prev
        this.xPrev = xHat;
        this.dxPrev = dxHat;
        this.tPrev = t;

        return xHat;
    }
}
