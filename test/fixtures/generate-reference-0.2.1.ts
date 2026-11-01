// Generates reference-0.2.1.json: the outputs of the v0.2.1 filter (git 2e6dd5e) on a fixed sequence.
// test/filterStep.test.ts replays it to prove filter() still returns the same values bit for bit.
//
// To regenerate (Node >= 23.6, which runs .ts files), from the repository root:
//   mkdir -p tmp-ref && cp test/fixtures/generate-reference-0.2.1.ts tmp-ref/gen.ts
//   git show 2e6dd5e:src/OneEuroFilter.ts \
//     | sed 's#^import  { version } from "../package.json";#const version = "0.2.1";#' > tmp-ref/OneEuroFilter-0.2.1.ts
//   node tmp-ref/gen.ts > test/fixtures/reference-0.2.1.json && rm -r tmp-ref
import { OneEuroFilter } from "./OneEuroFilter-0.2.1.ts";
console.log = () => {}; // v0.2.1 logs its version once

let seed = 12345;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

const samples: { t: number; x: number[] }[] = [];
let t = 1000;
for (let k = 0; k < 24; k++) {
  if (k === 9) { /* repeated timestamp */ }
  else if (k === 14) t -= 7; // backwards timestamp
  else t += 10 + rand() * 25; // irregular frame times, ms
  const n = k < 16 ? 3 : k < 20 ? 4 : 2; // resize 3 -> 4 -> 2
  const x: number[] = [];
  for (let i = 0; i < n; i++) {
    const base = [0, -120, 300, 0.01][i];
    const amp = [0.2, 15, 40, 0.005][i];
    // Component 0 crosses zero, so differences of Float32 values are not always exact in Float32
    const wave = i === 0 ? 0.3 * Math.sin(k / 3) + 0.01 * Math.cos(7 * k) : amp * Math.sin(t / (90 + 40 * i));
    x.push(base + wave + (rand() - 0.5) * amp * 0.3 + (k === 12 ? amp * 3 : 0));
  }
  samples.push({ t, x });
}

const params: [number, number][] = [[0.001, 0.5], [0.0001, 0.01], [0.01, 0], [0.001, 3]];
const cases = [];
for (const type of ["Float32", "Float64"] as const) {
  for (const [minCutOff, beta] of params) {
    const Ctor = type === "Float32" ? Float32Array : Float64Array;
    const f = new OneEuroFilter(minCutOff, beta);
    const outputs = samples.map((s) => Array.from(f.filter(s.t, new Ctor(s.x))));
    cases.push({ type, minCutOff, beta, outputs });
  }
}
process.stdout.write(JSON.stringify({
  source: "OneEuroFilter v0.2.1 (git 2e6dd5e), filter(t, x) outputs",
  samples, cases,
}, null, 1) + "\n");
