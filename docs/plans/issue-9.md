# Issue #9 (nft-tracker One Euro core) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `@webarkit/oneeurofilter-ts` usable as the One Euro core of webarkit's NFT tracker (issue #9), and close issue #5 by removing all console output.

**Architecture:** One class, `OneEuroFilter` in `src/OneEuroFilter.ts`. The per-component derivative/cutoff/α math moves into one private helper shared by `filter()` and a new low-level `filterStep()`, so `filter()` stays byte-identical to v0.2.1. Packaging gains an `exports` map with separate CJS (`.d.ts`) and ESM (`.d.mts`) declarations, without `"type": "module"`.

**Tech Stack:** TypeScript 6, Vite 8 (library mode, `es` + `umd`), vite-plugin-dts 5, Vitest 5, Node 20 in CI.

**Spec:** https://github.com/webarkit/OneEuroFilter-ts/issues/9 (items 1–8) and #5, plus the maintainer's choices below.

## Global Constraints

- Licence: **LGPL-3.0-or-later, keeping the linking exception** already in the source headers.
- Units stay **milliseconds**: timestamps in ms, cutoffs in cycles per ms (`0.001` = 1 Hz). No behaviour change for ARnft / Aframe-nft / jsartoolkitNFT (all call `new OneEuroFilter(minCutOff, beta)` with two arguments).
- Item 5 is a **low-level method**, not a rotation filter.
- `filter()` output must be bit-for-bit identical to v0.2.1 (`2e6dd5e`) for the same inputs, for `Float32Array` and `Float64Array`.
- No console output anywhere in the library. `OneEuroFilter.version` stays.
- No `"type": "module"` in `package.json` (it would make the UMD `dist/OneEuroFilter.js` ESM for Node and bundlers).
- Do not touch the bundle-size test added for issue #6 in another branch.
- Version `0.3.0`. No npm publish, no tag, no release.
- Tests run with `npm test`; build with `npm run build-ts`. CI builds before testing.

## Decisions

- **SPDX id:** `"license": "LGPL-3.0-or-later"`. SPDX has no exception matching our text: `Classpath-exception-2.0-short` is closest but says "not derived from or based on" where ours says "neither derived from nor based on", and npm 11's bundled `spdx-exceptions@2.5.0` does not know that id. The exception only adds permissions (LGPL-3.0 §7), so `LGPL-3.0-or-later` is accurate as the machine-readable floor; `LICENSE` states the exception.
- **`LICENSE`** = project notice + linking exception + full LGPL-3.0 text. **`COPYING`** = full GPL-3.0 text (LGPL-3.0 is a set of additional permissions on top of GPL-3.0). Texts fetched verbatim from gnu.org.
- **`dCutOff`** = optional third constructor argument, default `0.001`. Throws `RangeError` when given and not a finite number > 0. `minCutOff` and `beta` stay unvalidated (validating them would be a behaviour change for existing callers).
- **`filterStep(te, step, out?, alphaOut?)`** returns `{ step, alpha }` with **one α per component**, because the cutoff depends on `|dx̂ᵢ|` per component, exactly as in `filter()`. `stepOutᵢ = alphaᵢ · stepᵢ`. The caller applies it (`x̂ = x̂ₚᵣₑᵥ + stepOut`, or `R̂ = R̂ₚᵣₑᵥ · exp(stepOut)`).
- **`te <= 0` in `filterStep`** returns a zero step and zero α and leaves the state untouched (same meaning as `filter()` returning the previous value).
- **Added after review:** in `filterStep`, a NaN `te` is treated like `te <= 0`; α = 1 where `2π·cutoff·te` is not finite (as in the nft-tracker core; `filter()` keeps v0.2.1's NaN); `out`/`alphaOut` shorter than the step, or the same array, throw `RangeError`. The reference fixture got a zero-crossing component so it pins the Float32 rounding of the step, and its generator is committed in `test/fixtures/`. Tests ended up in `test/filterStep.test.ts`, `test/time.test.ts` and `test/packaging.test.ts`; `.d.mts` files come from vite-plugin-dts `outDirs` with `moduleFormat: 'esm'` rather than an `afterBuild` hook.
- **`beta` units:** `beta` is in 1/(signal unit); time cancels, so its value is the same in the ms and s conventions. Only `minCutOff` and `dCutOff` change (Hz ÷ 1000).

## Review Focus

- Mixing `filter()` and `filterStep()` on one instance: they share the derivative state; document "one or the other per instance"; `reset()` must clear the derivative state for both.
- `reset()` followed by `filterStep()`: the derivative estimate must restart from zero (test in Task 4).
- Vector length changing between `filterStep()` calls: new components start with derivative 0, as `filter()` does (test in Task 4).
- `Float32Array` rounding in the shared helper: the step must be divided by `te` in double precision before being stored, as v0.2.1 does, or Float32 output drifts (pinned by the reference test in Task 4).
- A NodeNext ESM consumer getting `any` instead of real types (unresolved relative import in `.d.mts`): the packaging test must fail on `any` (Task 7).

---

### Task 1: Licence (item 1)

**Files:** Modify `LICENSE`, `package.json` (`license`), `src/OneEuroFilter.ts` and `src/index.ts` headers, `README.md` (badge + "License" section). Create `COPYING`.

- [ ] Fetch `https://www.gnu.org/licenses/lgpl-3.0.txt` and `https://www.gnu.org/licenses/gpl-3.0.txt` into the scratchpad; check first lines and line counts.
- [ ] `LICENSE`: a header ("OneEuroFilter-ts is licensed under the GNU LGPL, version 3 or (at your option) any later version, with the following linking exception", the exception text verbatim from `src/OneEuroFilter.ts`, a pointer to `COPYING` for the GPL-3.0 text), then the LGPL-3.0 text verbatim.
- [ ] `COPYING`: GPL-3.0 text verbatim.
- [ ] `package.json`: `"license": "LGPL-3.0-or-later"`.
- [ ] Headers: add `SPDX-License-Identifier: LGPL-3.0-or-later` with a note that the linking exception below applies; `http://www.gnu.org/licenses/` → `https://`.
- [ ] README: badge `License: LGPL v3+` → `https://www.gnu.org/licenses/lgpl-3.0`; add a "License" section (LGPL-3.0-or-later + linking exception, see `LICENSE` and `COPYING`).
- [ ] Verify `npm test` and `npm run build-ts` pass. Review, commit `chore(license): state LGPL-3.0-or-later with linking exception consistently`.

### Task 2: No side effects (item 2, closes #5)

**Files:** Modify `src/OneEuroFilter.ts`, `test/OneEuroFilter.test.ts`, `package.json` (`"sideEffects": false`).

- [ ] Replace test `should log the version only once across multiple instances` with `should not write to the console on import, construction or filtering`: `vi.resetModules()`, spy on `console.log/info/warn/error/debug` (mocked), dynamically import `../src/OneEuroFilter`, construct two filters, call `filter()` three times; expect every spy `toHaveBeenCalledTimes(0)`.
- [ ] Run it: FAIL (log called once).
- [ ] Remove `versionLogged` and the `console.log`.
- [ ] Run: PASS. Add `"sideEffects": false` to `package.json`. Review, commit `fix: remove console output from the constructor (closes #5)`.

### Task 3: Configurable `dCutOff` (item 3)

**Files:** Modify `src/OneEuroFilter.ts`, `test/OneEuroFilter.test.ts`.

**Produces:** `constructor(minCutOff: number, beta: number, dCutOff: number = 0.001)`.

- [ ] Tests in `describe('dCutOff')`:
  - `defaults to 0.001`: two Float64 filters `(0.001, 0.5)` and `(0.001, 0.5, 0.001)` fed the same 10-sample sequence → outputs `toEqual` at every step.
  - `changes the output when set`: `(0.001, 0.5)` vs `(0.001, 0.5, 0.01)` on a sequence with changing speed → at least one sample differs.
  - `rejects non-positive or non-finite values`: `0`, `-1`, `NaN`, `Infinity` → `toThrow(RangeError)`; `undefined` does not throw.
- [ ] Run: FAIL (TS arg count / no throw).
- [ ] Implement; error message names the parameter and value.
- [ ] Run: PASS. Review, commit `feat: make dCutOff configurable`.

### Task 4: `filterStep()` low-level method (item 5)

**Files:** Modify `src/OneEuroFilter.ts`, `src/index.ts` (export type `FilterStepResult`), `test/OneEuroFilter.test.ts`. Create `test/fixtures/reference-0.2.1.json` (its generator is a one-off script in the scratchpad, run against the v0.2.1 source).

**Produces:**
```ts
export interface FilterStepResult<T extends FilterDataArray> { step: T; alpha: T; }
filterStep<T extends FilterDataArray>(te: number, step: T, out?: T, alphaOut?: T): FilterStepResult<T>;
```

- [ ] Generate reference outputs **from the v0.2.1 code** (`git show 2e6dd5e:src/OneEuroFilter.ts` copied to the scratchpad, console mocked): for Float32 and Float64, params `(0.001, 0.5)` and `(1, 0.01)`, a 3-component sequence of ~20 samples with irregular timestamps, one repeated timestamp, one backwards timestamp, and a resize 3→4→2. Save inputs and outputs as JSON (`Array.from`, numbers round-trip exactly).
- [ ] Test `filter() matches v0.2.1 bit for bit`: replay the fixture, `expect(Array.from(out)).toEqual(expected)`.
- [ ] Tests for `filterStep`:
  - `matches filter() when the caller computes the step` (Float64): caller keeps `xHat`, `step = x − xHat`, `xHat += filterStep(te, step).step`; compare to `filter()` with `toBeCloseTo(…, 12)`.
  - `returns per-component alpha with step = alpha * input step` (Float64, exact) and `0 < alpha ≤ 1`; a faster component gets a larger α when `beta > 0`.
  - `writes into out and alphaOut` (reference identity) and keeps the input type (Float32 → Float32).
  - `returns a zero step and alpha for te <= 0 and keeps its state`: next call equals a fresh twin that never saw the bad call.
  - `reset() clears the derivative state`: after reset, output equals a fresh filter's.
  - `new components start with zero derivative when the length grows`.
- [ ] Run: FAIL (`filterStep` missing). The reference test passes before the refactor; keep it green throughout.
- [ ] Implement: private helper `componentAlpha(i: number, te: number, step: number, ad: number): number` writes `dxScratch[i] = step / te`, `dxHatScratch[i] = exponentialSmoothing(ad, dxScratch[i], dxPrev[i])`, returns `smoothingFactor(te, minCutOff + beta·|dxHatScratch[i]|)`. `filter()` calls it with `x[i] − xPrev[i]` (a double) and keeps `xHat[i] = exponentialSmoothing(a, x[i], xPrev[i])`. `filterStep()` allocates/resizes `dxPrev` and scratch (zeros for new components), calls the helper, writes `alphaOut[i] = a`, `out[i] = a * step[i]`, then `dxPrev.set(dxHatScratch)`. `reset()` also sets `dxPrev = null`.
- [ ] Run: all PASS. Review, commit `feat: add filterStep() for caller-computed steps`.

### Task 5: Time only from timestamps (item 6)

**Files:** Modify `test/OneEuroFilter.test.ts`.

- [ ] Tests:
  - `never reads a clock`: spy `Date.now` and `performance.now`; construct, `filter()` ×5, `filterStep()` ×3, `reset()`; expect 0 calls.
  - `returns the previous filtered value (not the previous input) for a non-increasing timestamp`: after 3 smoothing steps, `filter(tSame, other)` equals the last output; also with `out`.
  - `ignores a non-increasing sample entirely`: the next valid call equals a twin filter that never saw it.
- [ ] These pin existing behaviour, so they pass at once: prove they bite by temporarily adding `Date.now()` in `filter()` and setting `tPrev = t` in the `te <= 0` branch, see them FAIL, revert.
- [ ] Review, commit `test: pin that time comes only from the given timestamps`.

### Task 6: Units and reference (items 4 and 8)

**Files:** Modify `src/OneEuroFilter.ts` (JSDoc), `README.md`, `example/test.html`.

- [ ] JSDoc on the class, constructor (`minCutOff` cycles/ms, `beta` 1/(signal unit), `dCutOff` cycles/ms, default `0.001` = 1 Hz, `Hz / 1000`), `filter` (`t` ms, monotonic clock recommended, non-increasing → previous value), `filterStep` (`te` ms, α per component, how to apply it), `smoothingFactor`, `exponentialSmoothing`, `reset`. Reference: Casiez, Roussel, Vogel, CHI 2012, DOI 10.1145/2207676.2208639.
- [ ] README: "Units" section with a table and the conversion; "Low-level step filtering" section with a `filterStep` example; correct examples (use the returned array, `performance.now()`, valid importmap JSON); add the paper to the references.
- [ ] `example/test.html`: two constructor arguments (the old four would now set `dCutOff`), ms timestamps.
- [ ] `npm test`, `npm run build-ts` pass. Review, commit `docs: document units and cite the 1€ filter paper`.

### Task 7: Packaging (item 7)

**Files:** Modify `package.json` (`exports`), `vite.config.ts` (emit `.d.mts`), `src/index.ts` (import with `.js` extension), `tsconfig.json` (exclude `test/fixtures`). Create `test/packaging.test.ts`, `test/fixtures/nodenext-consumer/{package.json,tsconfig.json,esm.mts,cjs.cts}`.

**Produces:**
```json
"exports": {
  ".": {
    "import": { "types": "./types/index.d.mts", "default": "./dist/OneEuroFilter.mjs" },
    "require": { "types": "./types/index.d.ts", "default": "./dist/OneEuroFilter.js" }
  },
  "./package.json": "./package.json"
}
```
`main`, `module`, `types` stay for older resolvers.

- [ ] Fixture consumer: `"type": "module"`, tsconfig `module`/`moduleResolution` `NodeNext`, `strict`. `esm.mts` does `import { OneEuroFilter, type FilterStepResult } from "@webarkit/oneeurofilter-ts"`, assigns `filter()` to a `Float32Array` variable, has a `// @ts-expect-error` on `filter("x", …)` (fails if types are `any`), prints a line. `cjs.cts` does the same with `require`.
- [ ] `test/packaging.test.ts` (timeout 120 s): `npm pack --pack-destination <tmp>`, extract with `tar -xzf … --strip-components=1` into `<tmp>/consumer/node_modules/@webarkit/oneeurofilter-ts`, copy the fixture, run the repo's `typescript/bin/tsc -p`, then `node esm.mjs` and `node cjs.cjs`; assert exit 0 and expected stdout.
- [ ] Run: FAIL (no `.d.mts`, no `exports`).
- [ ] Implement: `src/index.ts` imports `./OneEuroFilter.js`; `vite.config.ts` dts `afterBuild` writes each `types/*.d.ts` as `*.d.mts` with relative `.js` specifiers rewritten to `.mjs`; add `exports`.
- [ ] `npm run build-ts && npm test`: PASS. Check `types/*.d.ts` and `*.d.mts` import specifiers by eye. Review, commit `feat: add exports map for ESM and CJS consumers`.

### Task 8: Version 0.3.0

**Files:** `package.json`, `package-lock.json`, `dist/`, `types/`, `README.md`.

- [ ] `npm version 0.3.0 --no-git-tag-version`; README version example → `0.3.0`.
- [ ] `npm run build-ts`; commit regenerated `dist/` and `types/`, including deletion of the stale `dist/*.d.ts` (the build no longer emits them; `types/` is the declared location).
- [ ] `npm test` passes (version test reads `package.json`). Commit `chore: release 0.3.0 build`.

### Finish

- [ ] superpowers:verification-before-completion: fresh `npm ci`, `npm run build-ts`, `npm test`, `git status` clean.
- [ ] superpowers:finishing-a-development-branch: push, PR to `main` with the decisions above, "Closes #9", "Closes #5". No publish, no tag.
