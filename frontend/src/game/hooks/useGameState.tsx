import { useState, useEffect } from 'react';
import { socket } from '../../socket';
import type { GameState } from '../../../../shared/types';
import type { LetterTileData } from '../types';

export default function useGameState(startMode: 'new' | 'continue') {
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
        let shouldResetOnNextStart = startMode === 'new';

        function requestBattleStart() {
            socket.emit('start_battle', shouldResetOnNextStart);
            shouldResetOnNextStart = false;
        }

        if (socket.connected) {
            requestBattleStart();
        }
        socket.on('connect', requestBattleStart);

        return () => {
            socket.off('state_update', handleUpdate);
            socket.off('connect', requestBattleStart);
        };
    }, [startMode]);

    return { gameState, tiles, setTiles };
}
