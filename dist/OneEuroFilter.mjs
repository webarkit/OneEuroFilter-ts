// src/OneEuroFilter.ts
var e = class {
	static version = "0.3.0";
	minCutOff;
	beta;
	dCutOff;
	xPrev;
	dxPrev;
	tPrev;
	initialized;
	dxScratch = null;
	dxHatScratch = null;
	constructor(e, t, n = .001) {
		if (!Number.isFinite(n) || n <= 0) throw RangeError(`OneEuroFilter: dCutOff must be a finite number > 0, got ${n}`);
		this.minCutOff = e, this.beta = t, this.dCutOff = n, this.xPrev = null, this.dxPrev = null, this.tPrev = null, this.initialized = !1;
	}
	smoothingFactor(e, t) {
		let n = 2 * Math.PI * t * e;
		return n / (n + 1);
	}
	exponentialSmoothing(e, t, n) {
		return e * t + (1 - e) * n;
	}
	reset() {
		this.initialized = !1, this.dxPrev = null;
	}
	createTypedArray(e, t) {
		let n = e.constructor;
		return new n(t);
	}
	ensureScratch(e) {
		(this.dxScratch === null || this.dxScratch.length !== e.length) && (this.dxScratch = this.createTypedArray(e, e.length), this.dxHatScratch = this.createTypedArray(e, e.length));
	}
	componentAlpha(e, t, n, r) {
		let i = this.dxScratch, a = this.dxHatScratch;
		i[e] = n / t, a[e] = this.exponentialSmoothing(r, i[e], this.dxPrev[e]);
		let o = this.minCutOff + this.beta * Math.abs(a[e]);
		return this.smoothingFactor(t, o);
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
		if (this.xPrev.length !== t.length || this.dxPrev.length !== t.length) {
			let e = this.xPrev, n = this.dxPrev;
			this.xPrev = this.createTypedArray(t, t.length), this.dxPrev = this.createTypedArray(t, t.length);
			for (let r = 0; r < t.length; r++) this.xPrev[r] = r < e.length ? e[r] : t[r], this.dxPrev[r] = r < n.length ? n[r] : 0;
		}
		this.ensureScratch(t);
		let { xPrev: i } = this, a = this.smoothingFactor(r, this.dCutOff), o = n || this.createTypedArray(t, t.length);
		for (let e = 0; e < t.length; e++) {
			let n = this.componentAlpha(e, r, t[e] - i[e], a);
			o[e] = this.exponentialSmoothing(n, t[e], i[e]);
		}
		return this.xPrev.length !== o.length && (this.xPrev = this.createTypedArray(t, o.length), this.dxPrev = this.createTypedArray(t, o.length)), this.xPrev.set(o), this.dxPrev.set(this.dxHatScratch), this.tPrev = e, o;
	}
	filterStep(e, t, n, r) {
		let i = t.length;
		if (n && n.length < i || r && r.length < i) throw RangeError(`OneEuroFilter.filterStep: out and alphaOut need at least ${i} elements`);
		if (n && n === r) throw RangeError("OneEuroFilter.filterStep: out and alphaOut must be different arrays");
		let a = n || this.createTypedArray(t, i), o = r || this.createTypedArray(t, i);
		if (!(e > 0)) return a.fill(0, 0, i), o.fill(0, 0, i), {
			step: a,
			alpha: o
		};
		if (this.dxPrev === null || this.dxPrev.length !== i) {
			let e = this.dxPrev;
			if (this.dxPrev = this.createTypedArray(t, i), e !== null) for (let t = 0; t < i && t < e.length; t++) this.dxPrev[t] = e[t];
		}
		this.ensureScratch(t);
		let s = this.smoothingFactor(e, this.dCutOff);
		s !== s && (s = 1);
		for (let n = 0; n < i; n++) {
			let r = t[n], i = this.componentAlpha(n, e, r, s);
			i !== i && (i = 1), a[n] = i * r, o[n] = i;
		}
		return this.dxPrev.set(this.dxHatScratch), {
			step: a,
			alpha: o
		};
	}
};
export { e as OneEuroFilter };

//# sourceMappingURL=OneEuroFilter.mjs.map