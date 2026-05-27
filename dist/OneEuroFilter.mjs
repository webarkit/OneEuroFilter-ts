var y = Object.defineProperty;
var f = (n, r, t) => r in n ? y(n, r, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[r] = t;
var s = (n, r, t) => f(n, typeof r != "symbol" ? r + "" : r, t);
const u = "0.1.2", p = {
  version: u
}, { version: A } = p;
class S {
  constructor(r, t) {
    s(this, "minCutOff");
    s(this, "beta");
    s(this, "dCutOff");
    s(this, "xPrev");
    s(this, "dxPrev");
    s(this, "tPrev");
    s(this, "initialized");
    s(this, "version", A);
    // High performance scratch buffers to avoid allocations at run-time
    s(this, "dxScratch", null);
    s(this, "dxHatScratch", null);
    this.minCutOff = r, this.beta = t, this.dCutOff = 1e-3, this.xPrev = null, this.dxPrev = null, this.tPrev = null, this.initialized = !1, console.log("OneEuroFilter: ", this.version);
  }
  smoothingFactor(r, t) {
    const h = 2 * Math.PI * t * r;
    return h / (h + 1);
  }
  exponentialSmoothing(r, t, h) {
    return r * t + (1 - r) * h;
  }
  reset() {
    this.initialized = !1;
  }
  /**
   * Creates a new typed array of the same type as the source.
   * @param source - The source typed array to match the type of.
   * @param lengthOrData - The length for a zero-filled array, or data to copy.
   * @returns A new typed array of the same type as the source.
   */
  createTypedArray(r, t) {
    const h = r.constructor;
    return new h(t);
  }
  /**
   * Filters the input signal using the One Euro Filter algorithm.
   * Accepts either Float32Array or Float64Array.
   * @param t - The timestamp of the current sample.
   * @param x - The input signal as a Float32Array or Float64Array.
   * @param out - Optional pre-allocated destination array to write the result into, achieving zero allocation.
   * @returns The filtered signal array.
   */
  filter(r, t, h) {
    if (!this.initialized) {
      this.initialized = !0, this.xPrev = this.createTypedArray(t, t), this.dxPrev = this.createTypedArray(t, t.length), this.dxScratch = this.createTypedArray(t, t.length), this.dxHatScratch = this.createTypedArray(t, t.length), this.tPrev = r;
      const e = h || this.createTypedArray(t, t.length);
      return e.set(t), e;
    }
    const o = r - this.tPrev;
    if (o <= 0) {
      const e = h || this.createTypedArray(t, t.length);
      return e.set(this.xPrev), e;
    }
    if (this.xPrev.length !== t.length) {
      const e = this.xPrev, d = this.dxPrev;
      this.xPrev = this.createTypedArray(t, t.length), this.dxPrev = this.createTypedArray(t, t.length);
      for (let i = 0; i < t.length; i++)
        this.xPrev[i] = i < e.length ? e[i] : t[i], this.dxPrev[i] = i < d.length ? d[i] : 0;
    }
    let c = this.dxScratch, l = this.dxHatScratch;
    c.length !== t.length && (c = this.createTypedArray(t, t.length), l = this.createTypedArray(t, t.length), this.dxScratch = c, this.dxHatScratch = l);
    const { xPrev: v, dxPrev: g } = this, P = this.smoothingFactor(o, this.dCutOff), a = h || this.createTypedArray(t, t.length);
    for (let e = 0; e < t.length; e++) {
      c[e] = (t[e] - v[e]) / o, l[e] = this.exponentialSmoothing(P, c[e], g[e]);
      const d = this.minCutOff + this.beta * Math.abs(l[e]), i = this.smoothingFactor(o, d);
      a[e] = this.exponentialSmoothing(i, t[e], v[e]);
    }
    return this.xPrev.length !== a.length && (this.xPrev = this.createTypedArray(t, a.length), this.dxPrev = this.createTypedArray(t, a.length)), this.xPrev.set(a), this.dxPrev.set(l), this.tPrev = r, a;
  }
}
export {
  S as OneEuroFilter
};
//# sourceMappingURL=OneEuroFilter.mjs.map
