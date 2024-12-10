# OneEuroFilter-ts

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

## Usage

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
let yourData = createData();

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
let yourData = createData();

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