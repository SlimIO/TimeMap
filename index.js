// Require Node.js Dependencies
const events = require("events");

/**
 * @typedef {Object} TimeValue
 * @property {any} value
 * @property {Number} ts
 */

/**
 * @const TimeStore
 * @type {WeakMap<TimeMap, Map<String | Symbol | Number, TimeValue>>}
 * @desc Use this to avoid memory leak when TimeMap are GC, and avoid data leak too.
 */
const TimeStore = new WeakMap();

// Symbols
const SymInterval = Symbol("interval");
const SymCurrKey = Symbol("currentKey");
const SymTime = Symbol("timelife");

/**
 * @func assertKey
 * @param {!(String | Symbol | Number)} key key
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
 * @func checkInterval
 * @desc Re-schedule TimeMap interval if any keys are available!
 * @param {!TimeMap} timeMap timeMap
 * @returns {void}
 */
function checkInterval(timeMap) {
    const self = TimeStore.get(timeMap);
    timeMap[SymInterval] = null;
    timeMap[SymCurrKey] = null;

    if (self.size === 0) {
        return void 0;
    }

    // Sort elements by date (timestamp)
    const sortedElements = [...self.entries()].sort((a, b) => b[1].ts - a[1].ts);
    while (sortedElements.length > 0) {
        const [key, elem] = sortedElements.pop();
        const deltaTime = Date.now() - elem.ts;

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
            }, timeMap.timeLife - deltaTime);
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
     * @constructor
     * @memberof TimeMap#
     * @param {!Number} timeLifeMs timeLife in milliseconds
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
     * @member {Number} size
     * @desc The size accessor property returns the number of elements in the TimeMap.
     * @memberof TimeMap#
     */
    get size() {
        return TimeStore.get(this).size;
    }

    /**
     * @member {Number} timeLife
     * @desc The timeLife accessor property return the configured time life for keys
     * @memberof TimeMap#
     */
    get timeLife() {
        return this[SymTime];
    }

    /**
     * @version 0.1.0
     *
     * @method set
     * @desc The set() method adds or updates an element with a specified key and value to the TimeMap object.
     * @memberof TimeMap#
     * @param {!(String | Symbol | Number)} key String or Symbol key
     * @param {*} value ant value
     * @returns {void}
     *
     * @throws {TypeError}
     */
    set(key, value) {
        assertKey(key);
        const self = TimeStore.get(this);
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
        }

        self.set(key, { ts, value });
    }

    /**
     * @version 0.1.0
     *
     * @method delete
     * @desc Delete a given key from the Map, if key is the currentKey interval will be rescheduled!
     * @memberof TimeMap#
     * @param {!(String | Symbol | Number)} key key
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
        const self = TimeStore.get(this);

        if (this[SymCurrKey] === key) {
            clearTimeout(this[SymInterval]);
            self.delete(key);
            checkInterval(this);
        }
        else {
            self.delete(key);
        }
    }

    /**
     * @version 0.1.0
     *
     * @method has
     * @desc Returns a boolean indicating whether an element with the specified key exists or not.
     * @memberof TimeMap#
     * @param {String | Symbol} key key
     * @returns {Boolean}
     */
    has(key) {
        return TimeStore.get(this).has(key);
    }

    /**
     * @version 0.1.0
     *
     * @template T
     * @method get
     * @desc The get() method returns a specified element from the TimeMap object.
     * @memberof TimeMap#
     * @param {String | Symbol} key key
     * @returns {T}
     *
     * @throws {Error}
     */
    get(key) {
        const self = TimeStore.get(this);
        if (!self.has(key)) {
            throw new Error(`Unknown key ${key}`);
        }

        return self.get(key).value;
    }

    /**
     * @version 0.1.0
     *
     * @method clear
     * @desc Clear internal timer and internal data. Everything will be reset.
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
     * @method keys
     * @desc Return all keys
     * @memberof TimeMap#
     * @returns {IterableIterator<String | Symbol | Number>}
     */
    keys() {
        return TimeStore.get(this).keys();
    }
}

TimeMap.DEFAULT_TIMELIFE_MS = 1000;

module.exports = TimeMap;
