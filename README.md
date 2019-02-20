# TimeMap
![version](https://img.shields.io/badge/version-0.1.0-blue.svg)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/SlimIO/is/commit-activity)
![MIT](https://img.shields.io/github/license/mashape/apistatus.svg)

Map implementation with timelife keys

## Requirements
- Node.js v10 or higher

## Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i @slimio/TimeMap
# or
$ yarn add @slimio/TimeMap
```

## Usage example
```js
const { strictEqual } = require("assert");
const TimeMap = require("@slimio/timemap");

const col = new TimeMap(1000);
col.set("foo", "bar");
col.set("test", true);
strictEqual(col.has("foo"), true);

setTimeOut(() => {
    col.set("hello", "world!");
    strictEqual(col.has("foo"), true);
});

setTimeOut(() => {
    strictEqual(col.has("foo"), false);
    strictEqual(col.has("test"), false);
    strictEqual(col.has("hello"), true);
}, 1100);
```

## API
TBC

## License
MIT
