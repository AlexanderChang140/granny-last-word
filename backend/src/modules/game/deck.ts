import type { Letter } from '../../../../shared/types.js';

function shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j] as T, shuffled[i] as T];
    }

    return shuffled;
}

export function checkLetters(word: number[], hand: Letter[]) {
    const handIds = new Set(hand.map((l) => l.id));
    const wordIds = new Set(word);
    
    return (
        wordIds.size === word.length &&
        handIds.intersection(wordIds).size === wordIds.size
    );
}

export function useLetters(
    word: readonly number[],
    hand: readonly Letter[],
    discard: readonly Letter[],
): { hand: Letter[]; discard: Letter[] } {
    const ids = new Set(word);
    const newHand = hand.filter((letter) => !ids.has(letter.id));
    const newDiscard = [
        ...discard,
        ...hand.filter((letter) => ids.has(letter.id)),
    ];

    return { hand: newHand, discard: newDiscard };
}

export function drawLetters(
    hand: readonly Letter[],
    draw: readonly Letter[],
    discard: readonly Letter[],
    handSize: number,
): { hand: Letter[]; draw: Letter[]; discard: Letter[] } {
    const newHand = [...hand];
    let newDraw = [...draw];
    let newDiscard = [...discard];

    while (
        newHand.length < handSize &&
        (newDraw.length > 0 || newDiscard.length > 0)
    ) {
        if (newDraw.length === 0) {
            newDraw = shuffle(newDiscard);
            newDiscard = [];
        }

        const drawnLetter = newDraw.pop();
        if (drawnLetter) {
            newHand.push(drawnLetter);
        }
    }

    return { hand: newHand, draw: newDraw, discard: newDiscard };
}

export function parseWord(word: number[], hand: Letter[]): Letter[] {
    const mapping = new Map();
    hand.forEach((letter) => mapping.set(letter.id, letter));

    return word.map((id) => mapping.get(id));
}

export function arrToLetters(arr: string[], offset: number = 0): Letter[] {
    let letters = [];
    for (let i = 0; i < arr.length; i++) {
        const char = arr[i] as string;
        if (isSingleLetter(char)) {
            letters.push({ id: i + offset, letter: char });
        }
    }
    return letters;
}

export function toWord(letters: Letter[]) {
    let word = [];
    for (const letter of letters) {
        word.push(letter.letter);
    }
    return word.join('');
}

function isSingleLetter(char: string): boolean {
    return /^[a-zA-Z]$/.test(char);
}

export function count(word: Letter[]) {
    const counts = new Map();

    for (const letter of word) {
        counts.set(letter.letter, (counts.get(letter.letter) || 0) + 1);
    }

    return counts;
}
