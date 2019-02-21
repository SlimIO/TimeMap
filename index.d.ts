/// <reference types="@types/node" />

import * as events from "events";

declare class TimeMap extends events {
    constructor(timeLifeMs: number);

    public static DEFAULT_TIMELIFE_MS: number;
    public readonly timeLife: number;
    public readonly size: number;

    has(key: TimeMap.key): boolean;
    delete(key: TimeMap.key): void;
    set(key: TimeMap.key, value: any): void;
    get<T>(key: TimeMap.key): T;
    clear(): void;
}

declare namespace TimeMap {
    type key = symbol | string;
}

export as namespace TimeMap;
export = TimeMap;
