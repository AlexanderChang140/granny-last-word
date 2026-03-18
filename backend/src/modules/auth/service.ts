import crypto from 'crypto';

import argon2 from 'argon2';

// TODO: Use actual database and backend
export const users = new Map<string, string>();
export const sessions = new Map<string, string>();

export async function signup(username: string, password: string) {
    const hash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
        hashLength: 16,
    });
    
    if (users.has(username)) {
        return null;
    }
    users.set(username, hash);

    return createToken(username);
}

export async function login(username: string, password: string) {
    const hash = users.get(username);
    if (hash && (await argon2.verify(hash, password))) {
        return createToken(username);
    }
}

export async function logout(token: string) {
    sessions.delete(token);
}

export async function validateSession(token: string) {
    return sessions.get(token);
}

function createToken(username: string) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, username);
    return token;
}