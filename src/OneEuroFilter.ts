// Ref: https://jaantollander.com/post/noise-filtering-using-one-euro-filter/#mjx-eqn%3A1
export class OneEuroFilter {
    private minCutOff: number;
    private beta: number;
    private dCutOff: number;
    private xPrev: number[] | null;
    private dxPrev: number[] | null;
    private tPrev: number | null;
    private initialized: boolean;
    constructor(minCutOff: number, beta: number) {
        this.minCutOff = minCutOff;
        this.beta = beta;
        this.dCutOff = 0.001; // period in milliseconds, so default to 0.001 = 1Hz

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
