/// <reference types="@types/node" />

import { EventEmitter } from "events";

declare class TimeMap<T> extends EventEmitter {
    constructor(timeLifeMs: number);

    public static DEFAULT_TIMELIFE_MS: number;
    public readonly timeLife: number;
    public readonly size: number;

    has(key: TimeMap.key): boolean;
    delete(key: TimeMap.key): void;
    set(key: TimeMap.key, value: T): void;
    get(key: TimeMap.key, refreshTimestamp?: boolean): T;
    clear(): void;
    keys(): IterableIterator<TimeMap.key>;
}

declare namespace TimeMap {
    type key = symbol | string | number;
}

export as namespace TimeMap;
export = TimeMap;
