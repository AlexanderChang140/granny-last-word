import { useEffect, useRef } from "react";
import eventBus from "../phaser/eventBus";
import { createPhaserGame, destroyPhaserGame } from "../phaser";
import type { BattleViewState } from "../game/types";

type PhaserBattleProps = {
    state: BattleViewState;
    onTileToWord: (tileId: number, insertIndex?: number) => void;
    onTileToDiscard: (tileId: number) => void;
    onTileToHand: (tileId: number) => void;
    onLetterKeyPressed: (letter: string) => void;
    onSubmitPressed: () => void;
    onBackspacePressed: () => void;
    onClearPressed: () => void;
    onEndTurnPressed: () => void;
};

export default function PhaserBattle({
    state,
    onTileToWord,
    onTileToDiscard,
    onTileToHand,
    onLetterKeyPressed,
    onSubmitPressed,
    onBackspacePressed,
    onClearPressed,
    onEndTurnPressed,
}: PhaserBattleProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    const handlersRef = useRef({
        onTileToWord,
        onTileToDiscard,
        onTileToHand,
        onLetterKeyPressed,
        onSubmitPressed,
        onBackspacePressed,
        onClearPressed,
        onEndTurnPressed,
    });

    useEffect(() => {
        handlersRef.current = {
            onTileToWord,
            onTileToDiscard,
            onTileToHand,
            onLetterKeyPressed,
            onSubmitPressed,
            onBackspacePressed,
            onClearPressed,
            onEndTurnPressed,
        };
    }, [
        onTileToWord,
        onTileToDiscard,
        onTileToHand,
        onLetterKeyPressed,
        onSubmitPressed,
        onBackspacePressed,
        onClearPressed,
        onEndTurnPressed,
    ]);

    useEffect(() => {
        if (!containerRef.current) return;

        createPhaserGame(containerRef.current);

        const handleTileToWord = (payload: { tileId: number; insertIndex?: number }) =>
            handlersRef.current.onTileToWord(payload.tileId, payload.insertIndex);

        const handleTileToDiscard = (payload: { tileId: number }) =>
            handlersRef.current.onTileToDiscard(payload.tileId);

        const handleTileToHand = (payload: { tileId: number }) =>
            handlersRef.current.onTileToHand(payload.tileId);

        const handleLetterKeyPressed = (payload: { letter: string }) =>
            handlersRef.current.onLetterKeyPressed(payload.letter);

        const handleSubmitPressed = () => handlersRef.current.onSubmitPressed();
        const handleBackspacePressed = () => handlersRef.current.onBackspacePressed();
        const handleClearPressed = () => handlersRef.current.onClearPressed();
        const handleEndTurnPressed = () => handlersRef.current.onEndTurnPressed();

        eventBus.on("tileToWord", handleTileToWord);
        eventBus.on("tileToDiscard", handleTileToDiscard);
        eventBus.on("tileToHand", handleTileToHand);
        eventBus.on("letterKeyPressed", handleLetterKeyPressed);
        eventBus.on("submitPressed", handleSubmitPressed);
        eventBus.on("backspacePressed", handleBackspacePressed);
        eventBus.on("clearPressed", handleClearPressed);
        eventBus.on("endTurnPressed", handleEndTurnPressed);

        return () => {
            eventBus.off("tileToWord", handleTileToWord);
            eventBus.off("tileToDiscard", handleTileToDiscard);
            eventBus.off("tileToHand", handleTileToHand);
            eventBus.off("letterKeyPressed", handleLetterKeyPressed);
            eventBus.off("submitPressed", handleSubmitPressed);
            eventBus.off("backspacePressed", handleBackspacePressed);
            eventBus.off("clearPressed", handleClearPressed);
            eventBus.off("endTurnPressed", handleEndTurnPressed);
            destroyPhaserGame();
        };
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            eventBus.emit("stateChanged", state);
        }, 0);

        return () => window.clearTimeout(timer);
    }, [state]);

    return <div ref={containerRef} className="phaser-battle-root" />;
}