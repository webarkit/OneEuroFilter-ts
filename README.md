# OneEuroFilter-ts

[![CI](https://github.com/webarkit/OneEuroFilter-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/webarkit/OneEuroFilter-ts/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@webarkit/oneeurofilter-ts)](https://www.npmjs.com/package/@webarkit/oneeurofilter-ts)
[![License: LGPL v3](https://img.shields.io/badge/License-LGPL_v3-blue.svg)](https://www.gnu.org/licenses/lgpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![GitHub stars](https://img.shields.io/github/stars/webarkit/OneEuroFilter-ts?style=social)](https://github.com/webarkit/OneEuroFilter-ts/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/webarkit/OneEuroFilter-ts?style=social)](https://github.com/webarkit/OneEuroFilter-ts/network/members)

This code is a translation to Typescript of the original code from [Jaan Tollander](https://jaantollander.com/post/noise-filtering-using-one-euro-filter/#mjx-eqn%3A1).
It's not well tested yet, so I can not assure of the correctness of the code.


## Installation

Install with npm:
```bash
npm install @webarkit/oneeurofilter-ts
```
Install with yarn:
```bash
yarn add @webarkit/oneeurofilter-ts
```

## Version

The package version is available as the static property `OneEuroFilter.version`, without creating a filter instance:
```typescript
import { OneEuroFilter } from "@webarkit/oneeurofilter-ts";

console.log(OneEuroFilter.version); // e.g. "0.2.0"
```

## Usage

The `filter` method accepts and returns `Float32Array` or `Float64Array` for optimal performance and memory efficiency. Use `Float32Array` for most cases; use `Float64Array` when higher precision is required.

In a typescript file:
```typescript
// import the OneEuroFilter class into your project
import { OneEuroFilter } from "@webarkit/oneeurofilter-ts";

let filterMinCF: number = 0.0001;
let filterBeta: number = 0.01;
const filter = new OneEuroFilter(filterMinCF, filterBeta);

/* yourData is the data you want to filter, createData() is a dummy function here, 
use it you method or data instead...
*/
let yourData: Float32Array = createData();

// filter the data (yourData) with the filter method
filter.filter(Date.now(), yourData);

// then use yourData...

```

In a javascript file:
```javascript
// import the OneEuroFilter class into your project
import { OneEuroFilter } from "@webarkit/oneeurofilter-ts";

let filterMinCF = 0.0001;
let filterBeta = 0.01;
const filter = new OneEuroFilter(filterMinCF, filterBeta);

/* yourData is the data you want to filter, createData() is a dummy function here, 
use it you method or data instead...
*/
let yourData = new Float32Array(createData());

// filter the data (yourData) with the filter method
filter.filter(Date.now(), yourData);
// then use yourData...

```


in a html script tag  with module support:
```html

<script type="importmap">
    {
    "imports": {
        "oef": "https://raw.github.com/webarkit/oneeurofilter-ts/main/dist/OneEuroFilter.mjs",
        }
    }
</script>

// import the OneEuroFilter class into your project

<script type="module">

import { OneEuroFilter } from "oef";

let filterMinCF = 0.0001;
let filterBeta = 0.01;
const filter = new OneEuroFilter(filterMinCF, filterBeta);

/* yourData is the data you want to filter, createData() is a dummy function here, 
use it you method or data instead...
*/
let yourData = createData();

// filter the data (yourData) with the filter method
filter.filter(Date.now(), yourData);

// then use yourData...
</script>

```