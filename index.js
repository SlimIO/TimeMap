// Require Third-party Dependencies
const { privateProperty } = require("@slimio/utils");

/**
 * @typedef {Object} TimeValue
 * @property {any} value
 * @property {Number} ts
 */

/**
 * @const TimeStore
 * @type {WeakMap<TimeMap, Map<String | Symbol, TimeValue>>}
 */
const TimeStore = new WeakMap();

// Symbols
const SymInterval = Symbol("interval");
const SymCurrKey = Symbol("currentKey");
const SymTimeLife = Symbol("timeLife");

/**
 * @func checkInterval
 * @desc Re-schedule TimeMap interval is there is available keys!
 * @param {!TimeMap} timeMap
 * @returns {void}
 */
function checkInterval(timeMap) {
    if (!(timeMap instanceof TimeMap)) {
        return void 0;
    }
    const self = TimeStore.get(timeMap);
    timeMap[SymInterval] = null;
    timeMap[SymCurrKey] = null;

    if (self.size === 0) {
        return void 0;
    }

    const sortedElements = [...self.entries()].sort((a, b) => b[1].ts - a[1].ts);
    while (sortedElements.length > 0) {
        const [key, elem] = sortedElements.pop();
        const deltaTime = Date.now() - elem.ts;

        if (deltaTime >= timeMap.timeLife) {
            self.delete(key);
        }
        else {
            const timeMs = deltaTime < 0 ? timeMap.timeLife : timeMap.timeLife - deltaTime;

            timeMap[SymCurrKey] = key;
            timeMap[SymInterval] = setTimeout(() => {
                self.delete(key);
                checkInterval(timeMap);
            }, timeMs);
            break;
        }
    }

    return void 0;
}

/**
 * @class TimeMap
 */
class TimeMap {
    /**
     * @constructor
     * @memberof TimeMap#
     * @param {!Number} timeLifeMs
     *
     * @throws {TypeError}
     */
    constructor(timeLifeMs = 1000) {
        if (typeof timeLifeMs !== "number") {
            throw new TypeError("timeLifeMs must be a number");
        }

        TimeStore.set(this, new Map());
        privateProperty(this, SymInterval, null);
        privateProperty(this, SymCurrKey, null);
        privateProperty(this, SymTimeLife, this.timeLifeMs);
    }

    /**
     * @member {Number} timeLife
     * @memberof TimeMap#
     */
    get timeLife() {
        return this[SymTimeLife];
    }

    /**
     * @method set
     * @memberof TimeMap#
     * @param {String | Symbol} key key
     * @param {*} value ant value
     * @returns {void}
     *
     * @throws {TypeError}
     */
    set(key, value) {
        if (typeof key !== "string" && typeof key !== "symbol") {
            throw new TypeError("key must be a string or a symbol");
        }

        const self = TimeStore.get(this);
        const ts = Date.now();

        if (this[SymInterval] === null) {
            this[SymCurrKey] = key;
            this[SymInterval] = setTimeout(() => {
                self.delete(key);
                checkInterval(this);
            }, this.timeLife);
        }
        self.set(key, { ts, value });
    }

    /**
     * @method delete
     * @memberof TimeMap#
     * @param {String | Symbol} key key
     * @returns {void}
     *
     * @throws {TypeError}
     */
    delete(key) {
        if (typeof key !== "string" && typeof key !== "symbol") {
            throw new TypeError("key must be a string or a symbol");
        }
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
     * @method has
     * @memberof TimeMap#
     * @param {String | Symbol} key key
     * @returns {Boolean}
     */
    has(key) {
        return TimeStore.get(this).has(key);
    }

    /**
     * @template T
     * @method get
     * @memberof TimeMap#
     * @param {String | Symbol} key key
     * @returns {T | null}
     */
    get(key) {
        const self = TimeStore.get(this);

        return self.has(key) ? self.get(key).value : null;
    }
}

module.exports = TimeMap;
