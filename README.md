# OneEuroFilter-ts

[![CI](https://github.com/webarkit/OneEuroFilter-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/webarkit/OneEuroFilter-ts/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@webarkit/oneeurofilter-ts)](https://www.npmjs.com/package/@webarkit/oneeurofilter-ts)
[![License: LGPL v3+](https://img.shields.io/badge/License-LGPL_v3%2B-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![GitHub stars](https://img.shields.io/github/stars/webarkit/OneEuroFilter-ts?style=social)](https://github.com/webarkit/OneEuroFilter-ts/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/webarkit/OneEuroFilter-ts?style=social)](https://github.com/webarkit/OneEuroFilter-ts/network/members)


A TypeScript implementation of the 1€ (One Euro) filter, an adaptive low-pass filter for noisy real-time signals such as tracked poses: it smooths strongly when the signal moves slowly, and follows it closely when it moves fast. The algorithm is from Casiez, Roussel and Vogel (CHI 2012), see [References](#references); this code started as a translation of [Jaan Tollander's](https://jaantollander.com/post/noise-filtering-using-one-euro-filter/) Python version.

The code is covered by a unit test suite (`npm test`), but it has not been validated extensively on real-world data, so check the results for your use case.

## Installation

Install with npm:
```bash
npm install @webarkit/oneeurofilter-ts
```
Install with yarn:
```bash
yarn add @webarkit/oneeurofilter-ts
```

The package works with `import` (ESM) and `require` (CommonJS), with types for both, including TypeScript's `moduleResolution: "NodeNext"` and `"bundler"`. A UMD build (`dist/OneEuroFilter.js`) is included for `<script>` tags; there the class is `OneEuroFilter.OneEuroFilter`.

## Usage

`filter(t, x, out?)` takes a timestamp in **milliseconds** and a `Float32Array` or `Float64Array`, and returns the filtered values in a new array of the same type, or in `out` if you pass one. Use `Float32Array` for most cases, and `Float64Array` when you need more precision.

```typescript
import { OneEuroFilter } from "@webarkit/oneeurofilter-ts";

// minCutOff = 0.001 cycles/ms (1 Hz), beta = 0.5; dCutOff defaults to 0.001 (1 Hz)
const filter = new OneEuroFilter(0.001, 0.5);

function onFrame(timestampMs: number, raw: Float32Array): Float32Array {
  // The input is not modified: use the returned array
  return filter.filter(timestampMs, raw);
}

onFrame(performance.now(), new Float32Array([0.1, 0.2, 0.3]));
```

To filter without allocating, pass the destination array:
```typescript
const raw = new Float32Array([0.1, 0.2, 0.3]);
const filtered = new Float32Array(raw.length);
filter.filter(performance.now(), raw, filtered);
```

Take timestamps from a monotonic clock, for example `performance.now()`, the timestamp of `requestAnimationFrame`, or a video frame's time. The filter never reads a clock itself. A sample whose timestamp is not greater than the previous one returns the previous filtered value and leaves the filter unchanged. `reset()` makes the next sample start the filter again.

In a browser, with an import map:
```html
<script type="importmap">
  {
    "imports": {
      "oef": "https://cdn.jsdelivr.net/npm/@webarkit/oneeurofilter-ts@0.3.0/dist/OneEuroFilter.mjs"
    }
  }
</script>
<script type="module">
  import { OneEuroFilter } from "oef";

  const filter = new OneEuroFilter(0.001, 0.5);
  const filtered = filter.filter(performance.now(), new Float32Array([0.1, 0.2, 0.3]));
  console.log(filtered);
</script>
```

## Units

Timestamps are in **milliseconds**, so the cutoff frequencies are in **cycles per millisecond**. This differs from the paper, which uses seconds and Hz.

| Parameter | Unit | Default | From Hz and seconds |
|---|---|---|---|
| `t` (`filter`) | ms | — | seconds × 1000 |
| `te` (`filterStep`) | ms | — | seconds × 1000 |
| `minCutOff` | cycles/ms | required | Hz ÷ 1000 |
| `beta` | 1 / (signal unit) | required | same value |
| `dCutOff` | cycles/ms | `0.001` (= 1 Hz) | Hz ÷ 1000 |

`minCutOff` and `dCutOff` are frequencies, so a value in Hz is divided by 1000: `0.001` is 1 Hz and `0.0001` is 0.1 Hz. `beta` keeps the same value in both conventions. The cutoff is `minCutOff + beta × |speed|`, and the speed is in signal units per millisecond, so converting both sides from seconds to milliseconds divides both by 1000.

The paper suggests starting from `minCutOff` = 1 Hz, `beta` = 0 and `dCutOff` = 1 Hz, so `new OneEuroFilter(0.001, 0, 0.001)` here. Then lower `minCutOff` until slow movements stop jittering, and raise `beta` until fast movements stop lagging.

For each sample, the smoothing factor of a component is `α = r / (r + 1)` with `r = 2π × cutoff × te`: the output moves by `α` times the distance to the input.

## Filtering a step computed by the caller

`filterStep(te, step, out?, alphaOut?)` is a lower-level method for signals whose step is not a plain difference, such as a rotation filtered in its tangent space. It takes the step of each component since the previous filtered value and the time delta `te` in milliseconds. It returns `{ step, alpha }`, where `step[i] = alpha[i] × input step[i]`. The caller applies the smoothed step.

There is one `alpha` per component, because each component's cutoff depends on its own filtered speed, as in `filter()`. For a plain vector, `filterStep` gives the same result as `filter` up to rounding:

```typescript
const f = new OneEuroFilter(0.001, 0.5);
const xHat = Float64Array.from(firstSample); // firstSample: the first input, taken as is
const step = new Float64Array(xHat.length);

function next(x: Float64Array, te: number): Float64Array {
  for (let i = 0; i < x.length; i++) step[i] = x[i] - xHat[i];
  const smoothed = f.filterStep(te, step);
  for (let i = 0; i < x.length; i++) xHat[i] += smoothed.step[i];
  return xHat;
}
```

For a rotation, with `ω = log(R̂ᵀ R)` as the step, update `R̂ ← R̂ · exp(smoothed step)`. Pass `out` and `alphaOut` to avoid allocating arrays. When `te` is not positive, `filterStep` returns a zero step and zero `alpha` and leaves the filter unchanged. Use either `filter` or `filterStep` on one instance, not both: they share the filtered speed.

## Version

The package version is available as the static property `OneEuroFilter.version`. The library never writes to the console.
```typescript
import { OneEuroFilter } from "@webarkit/oneeurofilter-ts";

console.log(OneEuroFilter.version); // e.g. "0.3.0"
```

## References

- Géry Casiez, Nicolas Roussel and Daniel Vogel. 2012. "1 € Filter: A Simple Speed-based Low-pass Filter for Noisy Input in Interactive Systems". In *Proceedings of the SIGCHI Conference on Human Factors in Computing Systems (CHI '12)*, 2527–2530. https://doi.org/10.1145/2207676.2208639 — see also the [1€ filter page](https://gery.casiez.net/1euro/).
- Jaan Tollander, [Noise Filtering Using 1€ Filter](https://jaantollander.com/post/noise-filtering-using-one-euro-filter/).

## License

OneEuroFilter-ts is licensed under the GNU Lesser General Public License, version 3 or (at your option) any later version (SPDX: `LGPL-3.0-or-later`), with a linking exception: you may link it with independent modules (modules neither derived from nor based on it) to produce an executable, and distribute that executable under terms of your choice, provided you meet each independent module's own licence. The library itself, including any modification of it, stays under the LGPL.

See [LICENSE](LICENSE) for the exception and the LGPL-3.0 text, and [COPYING](COPYING) for the GPL-3.0 text that the LGPL builds on.
