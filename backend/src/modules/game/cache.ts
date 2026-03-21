import { Mutex, } from "async-mutex";
import type { SessionData } from "./types.js";

const cache: Map<string, SessionData> = new Map();
const locks = new Map<string, Mutex>();

function getLock(sessionId: string): Mutex {
    const lock = locks.get(sessionId) ?? new Mutex();
    locks.set(sessionId, lock);
    return lock;
}

export async function get(sessionId: string) {
    return cache.get(sessionId);
}

export async function set(sessionId: string, data: SessionData) {
    const mutex = getLock(sessionId);
    
    await mutex.runExclusive(() => {
        cache.set(sessionId, data);
    });
}

export async function update(sessionId: string, updater: (prev: SessionData) => SessionData) {
    const mutex = getLock(sessionId);
    
    return await mutex.runExclusive(() => {
        const current = cache.get(sessionId);
        if (!current) throw new Error("Session not found");

        const newData = updater(current);
        cache.set(sessionId, newData);
        return newData;
    });
}

export async function remove(sessionId: string): Promise<void> {
    const mutex = getLock(sessionId);

    await mutex.runExclusive(() => {
        cache.delete(sessionId);
        locks.delete(sessionId);
    });
}