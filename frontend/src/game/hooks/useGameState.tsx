import { useState, useEffect } from 'react';
import { socket } from '../../socket';
import type { GameState } from '../../../../shared/types';
import type { LetterTileData } from '../types';

export default function useGameState() {
    const [gameState, setGameState] = useState<GameState>();
    const [tiles, setTiles] = useState<LetterTileData[]>([]);

    const handleUpdate = (state: GameState) => {
        console.log(state);
        setGameState(state);
        setTiles(
            state.hand.map((letter, i) => ({
                id: letter.id,
                letter: letter.letter,
                zone: 'hand',
                order: i,
            })),
        );
    };

    useEffect(() => {
        socket.on('state_update', handleUpdate);
        return () => {
            socket.off('state_update', handleUpdate);
        };
    }, []);

    return { gameState, tiles, setTiles };
}
