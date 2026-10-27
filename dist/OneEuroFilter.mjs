// package.json
var e = "0.2.0", t = !1, n = class n {
	static version = e;
	minCutOff;
	beta;
	dCutOff;
	xPrev;
	dxPrev;
	tPrev;
	initialized;
	dxScratch = null;
	dxHatScratch = null;
	constructor(e, r) {
		this.minCutOff = e, this.beta = r, this.dCutOff = .001, this.xPrev = null, this.dxPrev = null, this.tPrev = null, this.initialized = !1, t ||= (console.log("OneEuroFilter: ", n.version), !0);
	}
	smoothingFactor(e, t) {
		let n = 2 * Math.PI * t * e;
		return n / (n + 1);
	}
	exponentialSmoothing(e, t, n) {
		return e * t + (1 - e) * n;
	}
	reset() {
		this.initialized = !1;
	}
	createTypedArray(e, t) {
		let n = e.constructor;
		return new n(t);
	}
	filter(e, t, n) {
		if (!this.initialized) {
			this.initialized = !0, this.xPrev = this.createTypedArray(t, t), this.dxPrev = this.createTypedArray(t, t.length), this.dxScratch = this.createTypedArray(t, t.length), this.dxHatScratch = this.createTypedArray(t, t.length), this.tPrev = e;
			let r = n || this.createTypedArray(t, t.length);
			return r.set(t), r;
		}
		let r = e - this.tPrev;
		if (r <= 0) {
			let e = n || this.createTypedArray(t, t.length);
			return e.set(this.xPrev), e;
		}
		if (this.xPrev.length !== t.length) {
			let e = this.xPrev, n = this.dxPrev;
			this.xPrev = this.createTypedArray(t, t.length), this.dxPrev = this.createTypedArray(t, t.length);
			for (let r = 0; r < t.length; r++) this.xPrev[r] = r < e.length ? e[r] : t[r], this.dxPrev[r] = r < n.length ? n[r] : 0;
		}
		let i = this.dxScratch, a = this.dxHatScratch;
		i.length !== t.length && (i = this.createTypedArray(t, t.length), a = this.createTypedArray(t, t.length), this.dxScratch = i, this.dxHatScratch = a);
		let { xPrev: o, dxPrev: s } = this, c = this.smoothingFactor(r, this.dCutOff), l = n || this.createTypedArray(t, t.length);
		for (let e = 0; e < t.length; e++) {
			i[e] = (t[e] - o[e]) / r, a[e] = this.exponentialSmoothing(c, i[e], s[e]);
			let n = this.minCutOff + this.beta * Math.abs(a[e]), u = this.smoothingFactor(r, n);
			l[e] = this.exponentialSmoothing(u, t[e], o[e]);
		}
		return this.xPrev.length !== l.length && (this.xPrev = this.createTypedArray(t, l.length), this.dxPrev = this.createTypedArray(t, l.length)), this.xPrev.set(l), this.dxPrev.set(a), this.tPrev = e, l;
	}
};
export { n as OneEuroFilter };

//# sourceMappingURL=OneEuroFilter.mjs.map