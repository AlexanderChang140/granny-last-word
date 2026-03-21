import { useEffect, useMemo, useState } from "react";
import { GameClient, type GameState } from "../game/GameManager";

const initialState: GameState = {
    player_hp: 100,
    enemy_hp: 100,
    turn_owner: "player",
    status: "running",
};

const initialHand = ["A", "R", "E", "T", "L", "O", "N"];

export default function GamePage() {
    const [gameState, setGameState] = useState<GameState>(initialState);
    const [word, setWord] = useState("");
    const [connected, setConnected] = useState(false);
    const [lastSubmittedWord, setLastSubmittedWord] = useState("");
    const [battleStarted, setBattleStarted] = useState(false);
    const [handLetters, setHandLetters] = useState<string[]>(initialHand);
    const [usedLetterIndexes, setUsedLetterIndexes] = useState<number[]>([]);

    const client = useMemo(() => {
        return new GameClient({
            onStateChange: (state: GameState) => {
                setGameState(state);
            },
            onConnectionChange: ({ connected }) => {
                setConnected(connected);
            },
        });
    }, []);

    useEffect(() => {
        return () => {
            client.destroy();
        };
    }, [client]);

    function handleStartBattle() {
        setBattleStarted(true);
        client.startBattle();
    }

    function handleLetterClickByIndex(index: number) {
        if (!isPlayerTurn) return;
        if (usedLetterIndexes.includes(index)) return;

        const letter = handLetters[index];
        setWord((prev) => prev + letter);
        setUsedLetterIndexes((prev) => [...prev, index]);
    }

    function handleBackspace() {
        if (!isPlayerTurn) return;
        if (!word.length || !usedLetterIndexes.length) return;

        setWord((prev) => prev.slice(0, -1));
        setUsedLetterIndexes((prev) => prev.slice(0, -1));
    }

    function handleClear() {
        if (!isPlayerTurn) return;

        setWord("");
        setUsedLetterIndexes([]);
    }

    function handleDiscard() {
        if (!isPlayerTurn) return;

        setWord("");
        setUsedLetterIndexes([]);
        setHandLetters(["S", "D", "I", "C", "A", "R", "D"]);
    }

    function handleEndTurn() {
        if (!battleStarted) return;

        setWord("");
        setUsedLetterIndexes([]);

        // later this should emit an end turn event to backend
        // client.endTurn();
    }

    function handleSubmit() {
        if (!word.trim()) return;
        if (gameState.turn_owner !== "player") return;
        if (gameState.status !== "running") return;

        client.sendAction(word.trim());
        setLastSubmittedWord(word.trim());

        const remainingLetters = handLetters.filter(
            (_, index) => !usedLetterIndexes.includes(index),
        );

        const refillPool = ["M", "G", "U", "P", "H", "B", "Y", "C", "F", "K", "E", "A"];
        const refillNeeded = handLetters.length - remainingLetters.length;
        const refillLetters = refillPool.slice(0, refillNeeded);

        setHandLetters([...remainingLetters, ...refillLetters]);
        setWord("");
        setUsedLetterIndexes([]);
    }

    const isPlayerTurn =
        battleStarted &&
        gameState.turn_owner === "player" &&
        gameState.status === "running";

    const playerHpWidth = `${Math.max(0, Math.min(gameState.player_hp, 100))}%`;
    const enemyHpWidth = `${Math.max(0, Math.min(gameState.enemy_hp, 100))}%`;

    const turnText =
        gameState.status === "finished"
            ? gameState.enemy_hp <= 0
                ? "Victory!"
                : "Defeat!"
            : gameState.turn_owner === "player"
              ? "Your Turn"
              : "Enemy Turn";

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (!battleStarted || !isPlayerTurn) return;

            const key = event.key;

            if (event.ctrlKey && key === "Backspace") {
                event.preventDefault();
                handleClear();
                return;
            }

            if (key === "Backspace") {
                event.preventDefault();
                handleBackspace();
                return;
            }

            if (key === "Enter") {
                event.preventDefault();
                handleSubmit();
                return;
            }

            if (/^[a-zA-Z]$/.test(key)) {
                const upperKey = key.toUpperCase();

                const availableIndex = handLetters.findIndex(
                    (letter, index) =>
                        letter === upperKey && !usedLetterIndexes.includes(index),
                );

                if (availableIndex !== -1) {
                    event.preventDefault();
                    handleLetterClickByIndex(availableIndex);
                }
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [battleStarted, isPlayerTurn, handLetters, usedLetterIndexes, word]);

    return (
        <div className="game-page">
            <div className="battle-layout">
                {!battleStarted && (
                    <div className="start-overlay">
                        <div className="start-overlay-card">
                            <h1>Granny&apos;s Last Word</h1>
                            <p>Enter the battle and build words to attack.</p>
                            <button className="battle-button start big" onClick={handleStartBattle}>
                                Start Battle
                            </button>
                        </div>
                    </div>
                )}

                <section className="battle-top">
                    <div className="landscape-sky" />
                    <div className="landscape-hill hill-1" />
                    <div className="landscape-hill hill-2" />
                    <div className="landscape-hill hill-3" />

                    <div className="battle-center-banner">
                        <p>{connected ? "Connected" : "Connecting..."}</p>
                        <p>{turnText}</p>
                    </div>

                    <div className="top-hud">
                        <div className="hp-side">
                            <div className="hp-header">
                                <span>Player HP</span>
                            </div>
                            <div className="hp-bar-frame">
                                <div className="hp-bar">
                                    <div className="hp-fill" style={{ width: playerHpWidth }} />
                                </div>
                            </div>
                            <div className="hp-number">{gameState.player_hp} / 100</div>
                        </div>

                        <div className="hp-side right">
                            <div className="hp-header">
                                <span>Enemy HP</span>
                            </div>
                            <div className="hp-bar-frame">
                                <div className="hp-bar">
                                    <div className="hp-fill" style={{ width: enemyHpWidth }} />
                                </div>
                            </div>
                            <div className="hp-number">{gameState.enemy_hp} / 100</div>
                        </div>
                    </div>

                    <div className="character-slot player-slot">
                        <div className="character-emoji">👵</div>
                        <div className="character-name">Player</div>
                    </div>

                    <div className="character-slot enemy-slot">
                        <div className="character-emoji">🧌</div>
                        <div className="character-name">Enemy</div>
                    </div>
                </section>

                <div className="battle-divider" />

                <section className="battle-bottom">
                    <div className="battle-side-buttons left">
                        <button
                            className="battle-button side-button"
                            onClick={handleDiscard}
                            disabled={!isPlayerTurn}
                        >
                            Discard
                        </button>
                    </div>

                    <div className="battle-main-stack">
                        <div className="word-space">
                            <div className="panel-title">Word Crafting</div>
                            <div className="built-word">{word || "_"}</div>
                        </div>

                        <div className="letter-deck">
                            <div className="letter-row">
                                {handLetters.map((letter, index) => {
                                    const isUsed = usedLetterIndexes.includes(index);

                                    return (
                                        <button
                                            key={`${letter}-${index}`}
                                            className="letter-tile"
                                            onClick={() => handleLetterClickByIndex(index)}
                                            disabled={!isPlayerTurn || isUsed}
                                        >
                                            {letter}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="battle-status-box">
                            <span>Last Word: {lastSubmittedWord || "None"}</span>
                            <span>Status: {gameState.status}</span>
                            <span>Turn: {gameState.turn_owner}</span>
                        </div>
                    </div>

                    <div className="battle-side-buttons right">
                        <button
                            className="battle-button side-button"
                            onClick={handleBackspace}
                            disabled={!isPlayerTurn || !word.length}
                        >
                            Backspace
                        </button>

                        <button
                            className="battle-button side-button"
                            onClick={handleClear}
                            disabled={!isPlayerTurn || !word.length}
                        >
                            Clear
                        </button>

                        <button
                            className="battle-button primary side-button"
                            onClick={handleSubmit}
                            disabled={!isPlayerTurn || !word.trim()}
                        >
                            Submit
                        </button>

                        <button
                            className="battle-button side-button"
                            onClick={handleEndTurn}
                            disabled={!isPlayerTurn}
                        >
                            End Turn
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}