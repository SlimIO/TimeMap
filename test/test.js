// Require Third-party Dependencies
const avaTest = require("ava");
const is = require("@slimio/is");

// Require Internal Dependencies
const TimeMap = require("../");

avaTest("Exported data", (assert) => {
    assert.true(is.classObject(TimeMap));
    assert.true(is.number(TimeMap.DEFAULT_TIMELIFE_MS));
});

avaTest("new TimeMap(null) must throw TypeError", (assert) => {
    assert.throws(() => {
        new TimeMap(null);
    }, { instanceOf: TypeError, message: "timeLifeMs must be a number" });
});

avaTest("construct new TimeMap", (assert) => {
    const map = new TimeMap();
    assert.is(map.timeLife, TimeMap.DEFAULT_TIMELIFE_MS);
    assert.is(Object.keys(map).length, 3);
    assert.is(Reflect.ownKeys(map).length, 6);

    const mapCusto = new TimeMap(4000);
    assert.is(mapCusto.timeLife, 4000);
});

avaTest("set key must be string or symbol", (assert) => {
    assert.throws(() => {
        const map = new TimeMap();
        map.set(null, null);
    }, { instanceOf: TypeError, message: "key must be a string or a symbol" });
});

avaTest("set key in TimeMap", async(assert) => {
    assert.plan(4);
    const map = new TimeMap(100);
    const symFoo = Symbol("foo");
    map.on("expiration", () => {
        assert.pass();
    });

    const ret = map.set(symFoo, "bar");
    assert.is(ret, void 0);
    assert.true(map.has(symFoo));

    await new Promise((resolve) => setTimeout(resolve, 110));
    assert.false(map.has(symFoo));
});

avaTest("get key in TimeMap", async(assert) => {
    assert.plan(4);
    const map = new TimeMap(100);
    map.on("expiration", () => {
        assert.pass();
    });

    map.set("foo", "bar");
    setTimeout(() => {
        map.set("woo", "moo");
    }, 50);

    const ret = map.get("foo");
    assert.is(ret, "bar");

    assert.throws(() => {
        map.get("world!");
    }, { instanceOf: Error, message: "Unknown key world!" });

    await new Promise((resolve) => setTimeout(resolve, 200));
});

avaTest("delete.key must be a string or a symbol", (assert) => {
    assert.throws(() => {
        const map = new TimeMap();
        map.delete(null, null);
    }, { instanceOf: TypeError, message: "key must be a string or a symbol" });
});

avaTest("delete key in TimeMap", async(assert) => {
    assert.plan(2);
    const map = new TimeMap(100);
    map.on("expiration", () => {
        assert.pass();
        map.delete("hello");
        setImmediate(() => {
            map.delete("woo");
        });
    });

    map.set("foo", "bar");
    map.set("hello", "world");
    setTimeout(() => {
        map.set("woo", "moo");
    }, 50);

    await new Promise((resolve) => setTimeout(resolve, 110));
    assert.false(map.has("woo"));
});

avaTest("clear TimeMap", async(assert) => {
    assert.plan(0);
    const map = new TimeMap(100);
    map.clear();
    map.on("expiration", () => {
        assert.pass();
    });

    map.set("foo", "bar");
    setTimeout(() => {
        map.clear();
    }, 50);

    await new Promise((resolve) => setTimeout(resolve, 100));
});
