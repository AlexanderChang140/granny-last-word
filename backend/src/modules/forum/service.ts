import pool from '../db/db.js';

export type ForumPostRow = {
    post_id: number;
    username: string;
    content: string;
    created_at: string;
};

export async function getAllPosts(): Promise<ForumPostRow[]> {
    const result = await pool.query(
        `
        SELECT
            fp.id,
            u.username,
            fp.content,
            fp.created_at
        FROM forum_posts fp
        JOIN user u ON fp.user_id = u.id
        ORDER BY fp.created_at ASC
        `,
    );

    return result.rows;
}

export async function createPost(
    username: string,
    content: string,
): Promise<ForumPostRow | null> {
    const trimmed = content.trim();

    if (!trimmed) return null;
    if (trimmed.length > 300) {
        throw new Error('Post must be 300 characters or fewer');
    }

    const userResult = await pool.query(
        `SELECT id FROM users WHERE username = $1`,
        [username],
    );

    const userId = userResult.rows[0]?.user_id;
    if (!userId) return null;

    const insertResult = await pool.query(
        `
        INSERT INTO forum_posts (user_id, content)
        VALUES ($1, $2)
        RETURNING id, content, created_at
        `,
        [userId, trimmed],
    );

    const created = insertResult.rows[0];

    return {
        post_id: created.post_id,
        username,
        content: created.content,
        created_at: created.created_at,
    };
}
