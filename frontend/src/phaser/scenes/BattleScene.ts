import Phaser from "phaser";
import eventBus from "../eventBus";
import LetterTile from "../objects/LetterTile";
import {
  BANNER_X,
  BANNER_Y,
  BATTLE_HEIGHT,
  BATTLE_WIDTH,
  DISCARD_ZONE,
  ENEMY_X,
  ENEMY_Y,
  HAND_ZONE,
  HP_BAR_HEIGHT,
  HP_BAR_WIDTH,
  HUD_LEFT_X,
  HUD_RIGHT_X,
  HUD_Y,
  PLAYER_X,
  PLAYER_Y,
  TILE_SIZE,
  TOP_HEIGHT,
  WORD_ZONE,
  getDiscardTilePosition,
  getHandTilePosition,
  getWordInsertIndex,
  getWordTilePosition,
  isInsideRect,
} from "../systems/battleLayout";
import type { BattleViewState, LetterTileData } from '../../game/types';

export default class BattleScene extends Phaser.Scene {
  private battleState: BattleViewState | null = null;
  private tileMap = new Map<number, LetterTile>();

  private playerHpFill!: Phaser.GameObjects.Rectangle;
  private enemyHpFill!: Phaser.GameObjects.Rectangle;
  private playerHpText!: Phaser.GameObjects.Text;
  private enemyHpText!: Phaser.GameObjects.Text;
  private centerText!: Phaser.GameObjects.Text;

  constructor() {
    super("BattleScene");
  }

  create() {
    this.drawBackground();
    this.drawTopHud();
    this.drawCharacters();
    this.drawZones();
    this.registerEvents();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      eventBus.off("stateChanged", this.handleStateChanged, this);
    });

    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      eventBus.off("stateChanged", this.handleStateChanged, this);
    });
  }

  private registerEvents() {
    eventBus.on("stateChanged", this.handleStateChanged, this);

    this.input.on(
      "dragstart",
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
      ) => {
        const tile = gameObject as LetterTile;
        tile.setDragging(true);
      },
    );

    this.input.on(
      "drag",
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
        dragX: number,
        dragY: number,
      ) => {
        const tile = gameObject as LetterTile;
        tile.x = dragX;
        tile.y = dragY;
      },
    );

    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      const codeMatch = /^Key([A-Z])$/.exec(event.code);
      if (codeMatch) {
        eventBus.emit("letterKeyPressed", { letter: codeMatch[1] });
        return;
      }

      const key = event.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) {
        eventBus.emit("letterKeyPressed", { letter: key });
      }
    });

    this.input.on(
      "dragend",
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
      ) => {
        const tile = gameObject as LetterTile;
        tile.setDragging(false);

        if (!this.battleState || !this.battleState.battleStarted) {
          this.layoutTiles(this.battleState?.tiles ?? []);
          return;
        }

        const { x, y } = tile;

        if (isInsideRect(x, y, WORD_ZONE)) {
          const currentWordCount =
            this.battleState?.tiles.filter(
              (t) => t.zone === "word" && t.id !== tile.tileId,
            ).length ?? 0;

          const insertIndex = getWordInsertIndex(x, currentWordCount);

          eventBus.emit("tileToWord", {
            tileId: tile.tileId,
            insertIndex,
          });
          return;
        }

        if (isInsideRect(x, y, DISCARD_ZONE)) {
          eventBus.emit("tileToDiscard", { tileId: tile.tileId });
          return;
        }

        eventBus.emit("tileToHand", { tileId: tile.tileId });
      },
    );

    this.input.keyboard?.on("keydown-ENTER", () => {
      eventBus.emit("submitPressed");
    });

    this.input.keyboard?.on("keydown-BACKSPACE", (event: KeyboardEvent) => {
      event.preventDefault();

      if (event.ctrlKey) {
        eventBus.emit("clearPressed");
        return;
      }

      eventBus.emit("backspacePressed");
    });
  }

  private handleStateChanged(state: BattleViewState) {
    const previousState = this.battleState;
    this.battleState = state;

    if (
      !this.centerText ||
      !this.playerHpFill ||
      !this.enemyHpFill ||
      !state.gameState
    ) {
      return;
    }

    this.updateHud(state);
    this.syncTiles(state.tiles);

    if (previousState?.gameState) {
      if (previousState.gameState.enemy_hp > state.gameState.enemy_hp) {
        this.playEnemyHit();
      }

      if (previousState.gameState.player_hp > state.gameState.player_hp) {
        this.playPlayerHit();
      }
    }
  }

  private drawBackground() {
    this.add.rectangle(
      BATTLE_WIDTH / 2,
      BATTLE_HEIGHT / 2,
      BATTLE_WIDTH,
      BATTLE_HEIGHT,
      0xead9b8,
    );

    this.add.rectangle(
      BATTLE_WIDTH / 2,
      TOP_HEIGHT / 2,
      BATTLE_WIDTH,
      TOP_HEIGHT,
      0x8fd3ff,
    );
    this.add.circle(BATTLE_WIDTH - 50, 46, 34, 0xffd34d);

    this.add.ellipse(200, 55, 95, 38, 0xffffff, 0.95);
    this.add.ellipse(850, 65, 95, 38, 0xffffff, 0.95);

    this.add.rectangle(0, TOP_HEIGHT, BATTLE_WIDTH * 2, 150, 0x78c267).setOrigin(0.5,1);
    this.add.ellipse(150, TOP_HEIGHT, 120, 90, 0x5ba74c).setOrigin(0.5, 2);
    this.add.ellipse(590, TOP_HEIGHT, 120, 100, 0x69b657).setOrigin(0.5, 2);
    this.add.ellipse(1020, TOP_HEIGHT, 100, 80, 0x5ba74c).setOrigin(0.5, 2);

    this.add.rectangle(
      BATTLE_WIDTH / 2,
      TOP_HEIGHT + 4,
      BATTLE_WIDTH,
      8,
      0x4d3622,
    );
  }

  private drawTopHud() {
    this.drawHpBar(HUD_LEFT_X, HUD_Y, "Player HP", true);
    this.drawHpBar(HUD_RIGHT_X - HP_BAR_WIDTH, HUD_Y, "Enemy HP", false);

    const banner = this.add.rectangle(BANNER_X, BANNER_Y, 250, 68, 0x5f4126);
    banner.setStrokeStyle(4, 0x2a190d);

    this.centerText = this.add.text(
      BANNER_X,
      BANNER_Y,
      "Connecting...\nYour Turn",
      {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#fff7e8",
        fontStyle: "bold",
        align: "center",
      },
    );
    this.centerText.setOrigin(0.5);
  }

  private drawHpBar(x: number, y: number, label: string, isPlayer: boolean) {
    this.add.text(x, y - 18, label, {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#2c1d12",
      fontStyle: "bold",
    });

    this.add
      .rectangle(
        x + HP_BAR_WIDTH / 2,
        y + 18,
        HP_BAR_WIDTH + 8,
        HP_BAR_HEIGHT + 8,
        0x3a2919,
      )
      .setOrigin(0.5);

    this.add
      .rectangle(
        x + HP_BAR_WIDTH / 2,
        y + 18,
        HP_BAR_WIDTH,
        HP_BAR_HEIGHT,
        0x6e1018,
      )
      .setOrigin(0.5);

    const fill = this.add.rectangle(
      x,
      y + 18,
      HP_BAR_WIDTH,
      HP_BAR_HEIGHT,
      0xff4a5a,
    );
    fill.setOrigin(0, 0.5);

    if (isPlayer) {
      this.playerHpFill = fill;
      this.playerHpText = this.add.text(
        x + HP_BAR_WIDTH / 2,
        y + 18,
        "100/100",
        {
          fontFamily: "Arial",
          fontSize: "14px",
          color: "#fff7e8",
          fontStyle: "bold",
        },
      ).setOrigin(0.5);
    } else {
      this.enemyHpFill = fill;
      this.enemyHpText = this.add.text(
        x + HP_BAR_WIDTH / 2,
        y + 18,
        "100/100",
        {
          fontFamily: "Arial",
          fontSize: "14px",
          color: "#fff7e8",
          fontStyle: "bold",
        },
      ).setOrigin(0.5);
    }
  }

  private drawCharacters() {
    const playerBox = this.add.rectangle(
      PLAYER_X,
      PLAYER_Y,
      150,
      150,
      0xfff8ec,
    );
    playerBox.setStrokeStyle(5, 0x3b2818);

    this.add
      .text(PLAYER_X, PLAYER_Y - 10, "👵", {
        fontSize: "58px",
        padding: { top: 10 },
      })
      .setOrigin(0.5);

    this.add
      .text(PLAYER_X, PLAYER_Y + 42, "Player", {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#2d1c11",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const enemyBox = this.add.rectangle(ENEMY_X, ENEMY_Y, 150, 150, 0xfff8ec);
    enemyBox.setStrokeStyle(5, 0x3b2818);

    this.add
      .text(ENEMY_X, ENEMY_Y - 10, "🧌", {
        fontSize: "58px",
        padding: { top: 10 },
      })
      .setOrigin(0.5);

    this.add
      .text(ENEMY_X, ENEMY_Y + 42, "Enemy", {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#2d1c11",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
  }

  private drawZones() {
    this.drawPanel(
      WORD_ZONE.x,
      WORD_ZONE.y,
      WORD_ZONE.width,
      WORD_ZONE.height,
      0xf3e3c1,
      "Word Crafting",
    );
    this.drawPanel(
      DISCARD_ZONE.x,
      DISCARD_ZONE.y,
      DISCARD_ZONE.width,
      DISCARD_ZONE.height,
      0xead7b2,
      "Discard Area",
    );
    this.drawPanel(
      HAND_ZONE.x,
      HAND_ZONE.y,
      HAND_ZONE.width,
      HAND_ZONE.height,
      0xedd9b0,
      "",
    );
  }

  private drawPanel(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    title: string,
  ) {
    const panel = this.add.rectangle(
      x + width / 2,
      y + height / 2,
      width,
      height,
      color,
    );
    panel.setStrokeStyle(5, 0x3b2818);

    if (title) {
      this.add
        .text(x + width / 2, y + 16, title, {
          fontFamily: "Arial",
          fontSize: "15px",
          color: "#6b4d2f",
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0);
    }
  }

  private updateHud(state: BattleViewState) {
    if (!state.gameState) {
        return;
    }

    const playerRatio = Phaser.Math.Clamp(
      state.gameState.player_hp / state.gameState.player_max_hp,
      0,
      1,
    );
    const enemyRatio = Phaser.Math.Clamp(
      state.gameState.enemy_hp / state.gameState.enemy_max_hp,
      0,
      1,
    );

    this.playerHpFill.width = HP_BAR_WIDTH * playerRatio;
    this.enemyHpFill.width = HP_BAR_WIDTH * enemyRatio;
    this.playerHpText.setText(
      `${Math.max(0, state.gameState.player_hp)}/${state.gameState.player_max_hp}`,
    );
    this.enemyHpText.setText(
      `${Math.max(0, state.gameState.enemy_hp)}/${state.gameState.enemy_max_hp}`,
    );

    const defaultLabel =
      state.gameState.status === "finished"
        ? state.gameState.enemy_hp <= 0
          ? "Victory!"
          : "Defeat!"
        : state.gameState.turn_owner === "player"
          ? `Score ${state.gameState.run_score} • Turn ${state.gameState.turn_number}`
          : "Enemy Turn";
    const centerLabel = state.gameState.feedback ?? defaultLabel;

    this.centerText.setText(
      `${state.connected ? "Connected" : "Connecting..."} • Stage ${state.gameState.level}/5\n${centerLabel}`,
    );
  }

  private syncTiles(tiles: LetterTileData[]) {
    const ids = new Set(tiles.map((tile) => tile.id));

    for (const [id, tile] of this.tileMap.entries()) {
      if (!ids.has(id)) {
        tile.destroy();
        this.tileMap.delete(id);
      }
    }

    for (const tileData of tiles) {
      let tile = this.tileMap.get(tileData.id);

      if (!tile) {
        tile = new LetterTile(this, {
          id: tileData.id,
          letter: tileData.letter,
          x: 0,
          y: 0,
          size: TILE_SIZE,
        });
        this.tileMap.set(tileData.id, tile);
      }

      tile.setDisabled(false);
      tile.setDepth(100);
    }

    this.layoutTiles(tiles);
  }

  private layoutTiles(tiles: LetterTileData[]) {
    const handTiles = tiles
      .filter((tile) => tile.zone === "hand")
      .sort((a, b) => a.order - b.order);

    const wordTiles = tiles
      .filter((tile) => tile.zone === "word")
      .sort((a, b) => a.order - b.order);

    const discardTiles = tiles
      .filter((tile) => tile.zone === "discard")
      .sort((a, b) => a.order - b.order);

    handTiles.forEach((tileData, index) => {
      const tile = this.tileMap.get(tileData.id);
      if (!tile) return;
      const pos = getHandTilePosition(index, handTiles.length);
      this.tweens.add({
        targets: tile,
        x: pos.x,
        y: pos.y,
        duration: 120,
        ease: "Quad.Out",
      });
    });

    wordTiles.forEach((tileData, index) => {
      const tile = this.tileMap.get(tileData.id);
      if (!tile) return;
      const pos = getWordTilePosition(index, wordTiles.length);
      this.tweens.add({
        targets: tile,
        x: pos.x,
        y: pos.y,
        duration: 120,
        ease: "Quad.Out",
      });
    });
    discardTiles.forEach((tileData, index) => {
      const tile = this.tileMap.get(tileData.id);
      if (!tile) return;
      const pos = getDiscardTilePosition(index);
      this.tweens.add({
        targets: tile,
        x: pos.x,
        y: pos.y,
        duration: 120,
        ease: "Quad.Out",
      });
    });
  }

  private playEnemyHit() {
    this.cameras.main.shake(120, 0.004);
  }

  private playPlayerHit() {
    this.cameras.main.shake(120, 0.004);
  }
}
