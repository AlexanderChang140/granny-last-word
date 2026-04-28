import Phaser from 'phaser';
import type { ReactToPhaserEvents } from '../game/types';

const eventBus = new Phaser.Events.EventEmitter() as {
    on<K extends keyof ReactToPhaserEvents>(
        event: K,
        fn: ReactToPhaserEvents[K],
        context?: unknown,
    ): unknown;
    emit<K extends keyof ReactToPhaserEvents>(
        event: K,
        ...args: Parameters<ReactToPhaserEvents[K]>
    ): boolean;
    off<K extends keyof ReactToPhaserEvents>(
        event: K,
        fn: ReactToPhaserEvents[K],
        context?: unknown,
    ): unknown;
};

export default eventBus;
