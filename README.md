# TimeMap
![version](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/SlimIO/TimeMap/master/package.json&query=$.version&label=Version)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/SlimIO/is/commit-activity)
![MIT](https://img.shields.io/github/license/mashape/apistatus.svg)
![dep](https://img.shields.io/david/slimio/timemap.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/SlimIO/TimeMap/badge.svg?targetFile=package.json)](https://snyk.io/test/github/SlimIO/TimeMap?targetFile=package.json)
[![Build Status](https://travis-ci.com/SlimIO/TimeMap.svg?branch=master)](https://travis-ci.com/SlimIO/TimeMap) [![Greenkeeper badge](https://badges.greenkeeper.io/SlimIO/TimeMap.svg)](https://greenkeeper.io/)

ECMAScript 6 Map-Like implementation with keys that have a defined timelife.

## Requirements
- Node.js v10 or higher

## Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i @slimio/timemap
# or
$ yarn add @slimio/timemap
```

## Usage example
```js
const { strictEqual } = require("assert");
const TimeMap = require("@slimio/timemap");

const col = new TimeMap(1000);
col.on("expiration", (key, value) => {
    console.log(`col key ${key} has expired!`);
});

col.set("foo", "bar");
col.set("test", true);
strictEqual(col.has("foo"), true);

setTimeout(() => {
    col.set("hello", "world!");
    strictEqual(col.has("foo"), true);
}, 500);

setTimeout(() => {
    strictEqual(col.has("foo"), false);
    strictEqual(col.has("test"), false);
    strictEqual(col.has("hello"), true);
}, 1100);
```

## Events
TimeMap class is extended by a [Node.js EventEmitter](https://nodejs.org/api/events.html). The class can trigger several events:

| event name | description |
| --- | --- |
| expiration | Expired key are emitted before deletion |

```js
const map = new TimeMap(100);
map.on("expiration", (key, value) => {
    console.log(`key: ${key}, value: ${value}`);
});

map.set("foo", "bar");
```

## API
Following methods are members of **TimeMap** class. The type `TimeMap.key` is declared as follow:
```ts
type key = symbol | string | number;
```

<details><summary>constructor(timeLifeMs: number)</summary>
<br />

Create a new TimeMap Object. Take an argument which is the time that a key stay alive within the class.
```js
const map = new TimeMap(5000);
map.set("foo", "bar"); // foo will live for the next 5,000 milliseconds
```

The default **timeLifeMs** is equal to the value of static member `TimeMap.DEFAULT_TIMELIFE_MS` (equal to *1000* by default).
```js
const { strictEqual } = require("assert");

const map = new TimeMap();
strictEqual(map.timeLife, TimeMap.DEFAULT_TIMELIFE_MS);
```
</details>

<details><summary>set(key: TimeMap.key, value: any): void</summary>
<br />

Set a new key in the Collection. Inner timer will be initialized by the first key. The key must be a string or a symbol (no other primitive are accepted).
```js
const { strictEqual } = require("assert");

const map = new TimeMap();
const sym = Symbol("foo");
map.set(sym, "bar");
strictEqual(map.get(sym), "foo");
```
</details>

<details><summary>has(key: TimeMap.key): boolean</summary>
<br />

Similar to `Map.has` method. Return **true** if the key exist within.
```js
const { strictEqual } = require("assert");

const map = new TimeMap(100);
map.set("foo", "bar");
strictEqual(map.has("foo"), true);

setTimeout(() => {
    strictEqual(map.has("foo"), false);
}, 105);
```
</details>

<details><summary>delete(key: TimeMap.key): void</summary>
<br />

Delete a given key from TimeMap. The key must be a string or a symbol.
```js
const { strictEqual } = require("assert");

const map = new TimeMap(100);
map.once("expiration", (key) => {
    strictEqual(key, "hello");
});
map.set("foo", "bar");
map.set("hello", "world");

setTimeout(() => {
    map.delete("foo");
}, 50)
```
</details>

<details><summary>get< T >(key: TimeMap.key): T</summary>
<br />

Get a given key from the Class. Throw an Error if the key doesn't exist in the Collection (use .has() before).
```js
const assert = require("assert");

const map = new TimeMap(100);
map.set("foo", "bar");

assert.strictEqual(map.get("foo"), "bar");
assert.throws(() => {
    map.get("world!");
}, { name: "Error" });
```
</details>

<details><summary>clear(): void</summary>
<br />

Clear internal timer and internal data. Everything will be reset.
</details>

<details><summary>keys(): IterableIterator< TimeMap.key ></summary>
<br />

The keys() method returns a new Iterator object that contains the keys for each element in the TimeMap object in insertion order.
```js
const { deepEqual } = require("assert");

const map = new TimeMap();
map.set("foo", "bar");
map.set("yo", "boo");

deepEqual(["foo", "yo"], [...map.keys()]);
```
</details>

### Properties
All following properties are **readonly**

<details><summary>.size</summary>
<br />

The size accessor property returns the number of elements in the TimeMap.
```js
const { strictEqual } = require("assert");

const map = new TimeMap();
map.set("foo", "bar");
strictEqual(map.size, 1);
```
</details>

<details><summary>.timeLife</summary>
<br />

The timeLife accessor property return the configured time life for keys
```js
const { strictEqual } = require("assert");

const map = new TimeMap(2000);
strictEqual(map.timeLife, 2000);
```
</details>

## License
MIT
