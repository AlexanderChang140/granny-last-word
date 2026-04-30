import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { toWord } from '../deck.js';
import type { Letter } from '../../../../../shared/types.js';

const WORD_SET = generateWordSet();

const SCORE_MAP: Record<string, number> = {
    A: 1,
    E: 1,
    I: 1,
    O: 1,
    U: 1,
    L: 1,
    N: 1,
    S: 1,
    T: 1,
    R: 1,
    D: 2,
    G: 2,
    B: 3,
    C: 3,
    M: 3,
    P: 3,
    F: 4,
    H: 4,
    V: 4,
    W: 4,
    Y: 4,
    K: 5,
    J: 8,
    X: 8,
    Q: 10,
    Z: 10,
};

export function scoreWord(letters: Letter[]) {
    const word = toWord(letters);

    if (!WORD_SET.has(word.toUpperCase())) {
        return 0;
    }

    let score = 0;
    for (const c of word) {
        score += SCORE_MAP[c.toUpperCase()] ?? 0;
    }
    return score;
}

function generateWordSet(): Set<string> {
    const candidates = [
        path.resolve(process.cwd(), 'dictionary.txt'),
        path.resolve(process.cwd(), 'backend/dictionary.txt'),
    ];
    const filePath = candidates.find((candidate) => existsSync(candidate));

    try {
        if (!filePath) {
            throw new Error('dictionary.txt not found');
        }
        const data = readFileSync(filePath, 'utf-8');
        const words = data
            .split(/\r?\n/)
            .map((word) => word.trim().toUpperCase())
            .filter((word) => word.length > 0);
        return new Set(words);
    } catch (error) {
        console.error('Could not read dictionary file:', error);
        return new Set();
    }
}
