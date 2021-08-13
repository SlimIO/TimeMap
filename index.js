"use strict";

// Require Node.js Dependencies
const events = require("events");

/**
 * @typedef {object} TimeValue
 * @property {any} value
 * @property {number} ts
 */

/**
 * @constant TimeStore
 * @type {WeakMap<TimeMap, Map<string|symbol|number, TimeValue>>}
 * @description Use this to avoid memory leak when TimeMap are GC, and avoid data leak too.
 */
const TimeStore = new WeakMap();

// Symbols
const SymInterval = Symbol("interval");
const SymCurrKey = Symbol("currentKey");
const SymTime = Symbol("timelife");

/**
 * @function assertKey
 * @param {!(string|symbol|number)} key key
 * @returns {void}
 *
 * @throws {TypeError}
 */
function assertKey(key) {
    const tKey = typeof key;
    if (tKey !== "string" && tKey !== "symbol" && tKey !== "number") {
        throw new TypeError("key must be a string, a symbol or a number");
    }
}

/**
 * @function checkInterval
 * @description Re-schedule TimeMap interval if any keys are available!
 * @param {!TimeMap} timeMap timeMap
 * @returns {void}
 */
function checkInterval(timeMap) {
    const curr = TimeStore.get(timeMap);
    timeMap[SymInterval] = null;
    timeMap[SymCurrKey] = null;

    if (curr.size === 0) {
        return void 0;
    }

    // Sort elements by date (timestamp)
    const sortedElements = [...curr.entries()].sort((left, right) => right[1].ts - left[1].ts);
    while (sortedElements.length > 0) {
        const [key, elem] = sortedElements.pop();
        const deltaTime = Date.now() - elem.ts;
        console.log(deltaTime);

        if (deltaTime >= timeMap.timeLife) {
            // When the key is already expired too
            timeMap.emit("expiration", key, elem.value);
            timeMap.delete(key);
        }
        else {
            // Re-schedule timer
            timeMap[SymCurrKey] = key;
            timeMap[SymInterval] = setTimeout(() => {
                timeMap.emit("expiration", key, elem.value);
                timeMap.delete(key);
            }, (timeMap.timeLife - deltaTime) + 200);
            // timeMap[SymInterval].unref();
            break;
        }
    }

    return void 0;
}

/**
 * @author GENTILHOMME Thomas <gentilhomme.thomas@gmail.com>
 *
 * @class TimeMap
 * @classdesc ECMAScript 6 Map-Like implementation with timelife keys/values.
 */
class TimeMap extends events {
    /**
     * @class
     * @memberof TimeMap#
     * @param {!number} timeLifeMs timeLife in milliseconds
     *
     * @throws {TypeError}
     *
     * @example
     * const map = new TimeMap(100);
     * console.log(map.timeLife); // 100
     * map.set("hello", "world!");
     * setTimeout(() => {
     *     console.log(map.has("hello")); // False
     * }, 110);
     */
    constructor(timeLifeMs = TimeMap.DEFAULT_TIMELIFE_MS) {
        super();
        if (typeof timeLifeMs !== "number") {
            throw new TypeError("timeLifeMs must be a number");
        }

        TimeStore.set(this, new Map());

        // These properties are private, that why we use Symbols as key
        // they can still be recovered with Reflect.ownKeys()
        Reflect.defineProperty(this, SymInterval, {
            writable: true,
            value: null
        });
        Reflect.defineProperty(this, SymCurrKey, {
            writable: true,
            value: null
        });
        Reflect.defineProperty(this, SymTime, { value: timeLifeMs });
    }

    /**
     * @member {number} size
     * @description The size accessor property returns the number of elements in the TimeMap.
     * @memberof TimeMap#
     * @returns {number}
     */
    get size() {
        return TimeStore.get(this).size;
    }

    /**
     * @member {number} timeLife
     * @description The timeLife accessor property return the configured time life for keys
     * @memberof TimeMap#
     * @returns {number}
     */
    get timeLife() {
        return this[SymTime];
    }

    /**
     * @version 0.1.0
     *
     * @function set
     * @description The set() method adds or updates an element with a specified key and value to the TimeMap object.
     * @memberof TimeMap#
     * @param {!(string|symbol|number)} key String or Symbol key
     * @param {*} value ant value
     * @returns {void}
     *
     * @throws {TypeError}
     */
    set(key, value) {
        assertKey(key);
        const curr = TimeStore.get(this);
        const ts = Date.now();

        const isCurrKey = this[SymCurrKey] === key;
        if (isCurrKey || this[SymInterval] === null) {
            if (isCurrKey) {
                clearTimeout(this[SymInterval]);
            }
            else {
                this[SymCurrKey] = key;
            }
            this[SymInterval] = setTimeout(() => {
                this.emit("expiration", key, value);
                this.delete(key);
            }, this.timeLife);
            this[SymInterval].unref();
        }

        curr.set(key, { ts, value });
    }

    /**
     * @version 0.1.0
     *
     * @function delete
     * @description Delete a given key from the Map, if key is the currentKey interval will be rescheduled!
     * @memberof TimeMap#
     * @param {!(string|symbol|number)} key key
     * @returns {void}
     *
     * @throws {TypeError}
     *
     * @example
     * const map = new TimeMap(100);
     * map.set("foo", "bar");
     * map.set("hello", "world");
     *
     * setTimeout(() => map.delete("foo"), 50);
     * setTimeout(() => {
     *    console.log(map.has("hello")); // false
     * }, 100);
     */
    delete(key) {
        assertKey(key);
        const curr = TimeStore.get(this);

        if (this[SymCurrKey] === key) {
            clearTimeout(this[SymInterval]);
            curr.delete(key);
            checkInterval(this);
        }
        else {
            curr.delete(key);
        }
    }

    /**
     * @version 0.1.0
     *
     * @function has
     * @description Returns a boolean indicating whether an element with the specified key exists or not.
     * @memberof TimeMap#
     * @param {string|symbol} key key
     * @param {boolean} [refreshTimestamp=false]
     * @returns {boolean}
     */
    has(key, refreshTimestamp = false) {
        const curr = TimeStore.get(this);

        const hasKey = curr.has(key);
        if (hasKey && refreshTimestamp) {
            const currO = curr.get(key);
            currO.ts = Date.now();

            if (this[SymCurrKey] === key) {
                checkInterval(this);
            }
        }

        return hasKey;
    }

    /**
     * @version 0.1.0
     *
     * @function get
     * @description The get() method returns a specified element from the TimeMap object.
     * @memberof TimeMap#
     * @param {string|symbol} key key
     * @param {boolean} [refreshTimestamp=false]
     * @returns {T}
     *
     * @throws {Error}
     */
    get(key, refreshTimestamp = false) {
        const curr = TimeStore.get(this);
        if (!curr.has(key)) {
            throw new Error(`Unknown key ${key}`);
        }

        const currO = curr.get(key);
        if (refreshTimestamp) {
            currO.ts = Date.now();
            if (this[SymCurrKey] === key) {
                checkInterval(this);
            }
        }

        return currO.value;
    }

    /**
     * @version 0.1.0
     *
     * @function clear
     * @description Clear internal timer and internal data. Everything will be reset.
     * @memberof TimeMap#
     * @returns {void}
     */
    clear() {
        if (this[SymInterval] !== null) {
            clearTimeout(this[SymInterval]);
        }

        this[SymCurrKey] = null;
        TimeStore.set(this, new Map());
    }

    /**
     * @function keys
     * @description Return all keys
     * @memberof TimeMap#
     * @returns {IterableIterator<string|symbol|number>}
     */
    keys() {
        return TimeStore.get(this).keys();
    }
}

TimeMap.DEFAULT_TIMELIFE_MS = 1000;

module.exports = TimeMap;
