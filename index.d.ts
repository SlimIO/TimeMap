declare class TimeMap {
    constructor(timeLifeMs: number);

    public readonly timeLife: number;

    has(key: TimeMap.key): boolean;
    delete(key: TimeMap.key): void;
    set(key: TimeMap.key, value: any): void;
    get<T>(key: TimeMap.key): T | null;
}

declare namespace TimeMap {
    type key = symbol | string;
}

export as namespace TimeMap;
export = TimeMap;
