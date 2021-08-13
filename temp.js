"use strict";

const TimeMap = require("./index.js");
const timers = require("timers/promises");

const test = new TimeMap(1_000);

async function doTheWork() {
    test.set("key", "value");
    test.on("expiration", (key) => {
        console.log("expired key", new Date());
    });
    console.log("start: ", new Date());

    await timers.setTimeout(100);

    console.log(test.has("key", true));
    console.log("pre has: ", new Date());

    await timers.setTimeout(900);
    console.log("post has: ", new Date());

    console.log(test.get("key"));
}
doTheWork().catch(console.error);
