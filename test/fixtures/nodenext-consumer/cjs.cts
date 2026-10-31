// A CommonJS consumer (compiled to require()) under module/moduleResolution NodeNext (issue #9, item 7).
import { OneEuroFilter, type FilterStepResult } from "@webarkit/oneeurofilter-ts";

const filter = new OneEuroFilter(0.001, 0.5);
filter.filter(1000, new Float32Array([1, 2]));
const filtered: Float32Array = filter.filter(1016, new Float32Array([2, 3]));
const stepped: FilterStepResult<Float64Array> = new OneEuroFilter(0.001, 0.5).filterStep(16, new Float64Array([1]));

// @ts-expect-error a string timestamp must not compile; this fails if the package's types resolve to `any`
filter.filter("1032", new Float32Array([2, 3]));

console.log(`cjs ${OneEuroFilter.version} ${filtered.length} ${stepped.alpha.length}`);
