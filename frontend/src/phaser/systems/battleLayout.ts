export const BATTLE_WIDTH = 1184;
export const BATTLE_HEIGHT = 684;

export const TOP_HEIGHT = 312;
export const DIVIDER_HEIGHT = 8;
export const BOTTOM_Y = TOP_HEIGHT + DIVIDER_HEIGHT;
export const BOTTOM_HEIGHT = BATTLE_HEIGHT - BOTTOM_Y;

export const HUD_LEFT_X = 60;
export const HUD_RIGHT_X = BATTLE_WIDTH - 60;
export const HUD_Y = 42;
export const HP_BAR_WIDTH = 290;
export const HP_BAR_HEIGHT = 24;

export const BANNER_X = BATTLE_WIDTH / 2;
export const BANNER_Y = 52;

export const PLAYER_X = 230;
export const PLAYER_Y = 220;

export const ENEMY_X = BATTLE_WIDTH - 230;
export const ENEMY_Y = 220;

export const MAIN_CENTER_X = BATTLE_WIDTH / 2;

export const TILE_SIZE = 62;
export const TILE_GAP = 10;
export const MAX_WORD_SLOTS = 10;

export const DISCARD_ZONE = {
    x: 20,
    y: BOTTOM_Y + 95,
    width: 170,
    height: 255,
};

export const WORD_ZONE = {
    x: (BATTLE_WIDTH - 760) / 2,
    y: BOTTOM_Y + 60,
    width: 760,
    height: 130,
};

export const HAND_ZONE = {
    x: (BATTLE_WIDTH - 760) / 2,
    y: BOTTOM_Y + 220,
    width: 760,
    height: 108,
};

export function getHandTilePosition(index: number, totalTiles: number) {
    const clampedTotal = Math.max(1, totalTiles);
    const totalWidth =
        clampedTotal * TILE_SIZE + (clampedTotal - 1) * TILE_GAP;

    const startX =
        HAND_ZONE.x + (HAND_ZONE.width - totalWidth) / 2 + TILE_SIZE / 2;

    return {
        x: startX + index * (TILE_SIZE + TILE_GAP),
        y: HAND_ZONE.y + HAND_ZONE.height / 2,
    };
}

export function getWordTilePosition(index: number, totalTiles: number) {
    const clampedTotal = Math.max(1, Math.min(MAX_WORD_SLOTS, totalTiles));
    const totalWidth =
        clampedTotal * TILE_SIZE + (clampedTotal - 1) * TILE_GAP;

    const startX =
        WORD_ZONE.x + (WORD_ZONE.width - totalWidth) / 2 + TILE_SIZE / 2;

    return {
        x: startX + index * (TILE_SIZE + TILE_GAP),
        y: WORD_ZONE.y + WORD_ZONE.height / 2 + 10,
    };
}

export function getWordInsertIndex(dropX: number, currentWordCount: number) {
    const slotCount = Math.max(1, Math.min(MAX_WORD_SLOTS, currentWordCount + 1));
    const totalWidth =
        slotCount * TILE_SIZE + (slotCount - 1) * TILE_GAP;

    const startX =
        WORD_ZONE.x + (WORD_ZONE.width - totalWidth) / 2 + TILE_SIZE / 2;

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < slotCount; i += 1) {
        const slotX = startX + i * (TILE_SIZE + TILE_GAP);
        const distance = Math.abs(dropX - slotX);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = i;
        }
    }

    return closestIndex;
}

export function getDiscardTilePosition(index: number) {
    const columns = 2;
    const spacingX = TILE_SIZE + 10;
    const spacingY = TILE_SIZE + 10;

    const startX = DISCARD_ZONE.x + DISCARD_ZONE.width / 2 - spacingX / 2;
    const startY = DISCARD_ZONE.y + 71;

    const col = index % columns;
    const row = Math.floor(index / columns);

    return {
        x: startX + col * spacingX,
        y: startY + row * spacingY,
    };
}

export function isInsideRect(
    x: number,
    y: number,
    rect: { x: number; y: number; width: number; height: number },
) {
    return (
        x >= rect.x &&
        x <= rect.x + rect.width &&
        y >= rect.y &&
        y <= rect.y + rect.height
    );
}