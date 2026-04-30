import pool from '../db/db.js';

export type PlayerStats = {
    totalRuns: number;
    bestScore: number;
    enemiesDefeated: number;
    longestWord: string;
    lastRunResult: string;
};

let ensureStatsTablePromise: Promise<void> | null = null;

async function ensureStatsTable() {
    if (!ensureStatsTablePromise) {
        ensureStatsTablePromise = pool
            .query(`
                CREATE TABLE IF NOT EXISTS player_stats (
                    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    total_runs INT NOT NULL DEFAULT 0,
                    best_score INT NOT NULL DEFAULT 0,
                    enemies_defeated INT NOT NULL DEFAULT 0,
                    longest_word TEXT NOT NULL DEFAULT '-',
                    last_run_result TEXT NOT NULL DEFAULT 'No runs yet'
                );
            `)
            .then(() => undefined);
    }
    await ensureStatsTablePromise;
}

async function ensureRow(userId: number) {
    await ensureStatsTable();
    await pool.query(
        `
            INSERT INTO player_stats (user_id)
            VALUES ($1)
            ON CONFLICT (user_id) DO NOTHING
        `,
        [userId],
    );
}

export async function getPlayerStats(userId: number): Promise<PlayerStats> {
    await ensureRow(userId);
    const result = await pool.query<{
        total_runs: number;
        best_score: number;
        enemies_defeated: number;
        longest_word: string;
        last_run_result: string;
    }>(
        `
            SELECT total_runs, best_score, enemies_defeated, longest_word, last_run_result
            FROM player_stats
            WHERE user_id = $1
        `,
        [userId],
    );

    const row = result.rows[0];
    return {
        totalRuns: row?.total_runs ?? 0,
        bestScore: row?.best_score ?? 0,
        enemiesDefeated: row?.enemies_defeated ?? 0,
        longestWord: row?.longest_word ?? '-',
        lastRunResult: row?.last_run_result ?? 'No runs yet',
    };
}

export async function recordRunStarted(userId: number) {
    await ensureRow(userId);
    await pool.query(
        `
            UPDATE player_stats
            SET total_runs = total_runs + 1,
                last_run_result = 'In Progress'
            WHERE user_id = $1
        `,
        [userId],
    );
}

export async function recordWordProgress(
    userId: number,
    word: string,
    runScore: number,
) {
    await ensureRow(userId);
    await pool.query(
        `
            UPDATE player_stats
            SET best_score = GREATEST(best_score, $2),
                longest_word = CASE
                    WHEN CHAR_LENGTH($3) > CHAR_LENGTH(longest_word)
                    THEN $3
                    ELSE longest_word
                END
            WHERE user_id = $1
        `,
        [userId, runScore, word],
    );
}

export async function recordRunResult(
    userId: number,
    result: string,
    enemiesDefeatedDelta: number,
) {
    await ensureRow(userId);
    await pool.query(
        `
            UPDATE player_stats
            SET last_run_result = $2,
                enemies_defeated = enemies_defeated + $3
            WHERE user_id = $1
        `,
        [userId, result, enemiesDefeatedDelta],
    );
}
