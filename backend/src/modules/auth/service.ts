import crypto from 'crypto';
import argon2 from 'argon2';
import pool from '../db/db.js';

export async function signup(username: string, password: string) {
    const hash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
        hashLength: 16,
    });

    const existing = await pool.query(
        'SELECT id FROM users WHERE username = $1',
        [username],
    );
    if (existing.rows.length > 0) return null;

    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [
        username,
        hash,
    ]);

    return createToken(username);
}

export async function login(username: string, password: string) {
    const result = await pool.query<{ password: string }>(
        'SELECT password FROM users WHERE username = $1',
        [username],
    );
    const hash = result.rows[0]?.password;
    if (hash && (await argon2.verify(hash, password))) {
        return createToken(username);
    }
    return null;
}

export async function logout(token: string) {
    await pool.query('DELETE FROM sessions WHERE id = $1', [token]);
}

export async function validateSession(token: string) {
    const result = await pool.query<{ id: number, username: string }>(
        `SELECT u.id, u.username FROM sessions s 
         JOIN users u ON s.user_id = u.id 
         WHERE s.id = $1 AND s.expires_at > NOW()`,
        [token],
    );
    return result.rows[0];
}

async function createToken(username: string) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    const user = await pool.query('SELECT id FROM users WHERE username = $1', [
        username,
    ]);
    await pool.query(
        'INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)',
        [token, user.rows[0].id, expiresAt],
    );

    return token;
}
