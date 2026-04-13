import Phaser from "phaser";

type LetterTileConfig = {
    id: string;
    letter: string;
    x: number;
    y: number;
    size: number;
};

export default class LetterTile extends Phaser.GameObjects.Container {
    public readonly tileId: string;
    public readonly letter: string;

    private background: Phaser.GameObjects.Rectangle;
    private border: Phaser.GameObjects.Rectangle;
    private label: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, config: LetterTileConfig) {
        super(scene, config.x, config.y);

        this.tileId = config.id;
        this.letter = config.letter;

        this.background = scene.add.rectangle(0, 0, config.size, config.size, 0xf5e2bb);
        this.background.setOrigin(0.5);

        this.border = scene.add.rectangle(0, 0, config.size, config.size);
        this.border.setOrigin(0.5);
        this.border.setStrokeStyle(4, 0x3a2718);

        this.label = scene.add.text(0, 0, config.letter, {
            fontFamily: "Arial",
            fontSize: "28px",
            color: "#2c1b10",
            fontStyle: "bold",
        });
        this.label.setOrigin(0.5);

        this.add([this.background, this.border, this.label]);

        this.setSize(config.size, config.size);
        this.setInteractive({ cursor: "grab" });
        scene.input.setDraggable(this);

        scene.add.existing(this);
    }

    setDisabled(disabled: boolean) {
        this.alpha = disabled ? 0.5 : 1;
        this.disableInteractive();

        if (!disabled) {
            this.setInteractive({ cursor: "grab" });
            this.scene.input.setDraggable(this);
        }
    }

    setDragging(isDragging: boolean) {
        this.setScale(isDragging ? 1.08 : 1);
        this.setDepth(isDragging ? 50 : 10);
    }

    setHighlight(active: boolean) {
        this.border.setStrokeStyle(4, active ? 0x4fa4ef : 0x3a2718);
    }
}