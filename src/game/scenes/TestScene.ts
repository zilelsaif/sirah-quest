import Phaser from 'phaser'
import { CLUE_DATA, CLUE_DISCOVERY_RADIUS } from '../clues/clueData'
import { ClueManager } from '../clues/ClueManager'
import type { CluePanelData } from '../clues/types'
import { DEFAULT_PLAYER_STATS } from '../config/playerStats'
import { FogOfWar } from '../fog/FogOfWar'
import { KeyboardInput } from '../input/KeyboardInput'
import { PointerInput } from '../input/PointerInput'
import { MovementController } from '../player/MovementController'

const MAP_WIDTH = 1600
const MAP_HEIGHT = 1200

const OBSTACLES = [
  new Phaser.Geom.Rectangle(520, 220, 240, 90),
  new Phaser.Geom.Rectangle(900, 510, 110, 300),
  new Phaser.Geom.Rectangle(260, 760, 320, 100),
  new Phaser.Geom.Rectangle(1180, 860, 210, 130),
]

export class TestScene extends Phaser.Scene {
  private keyboardInput?: KeyboardInput
  private movementController?: MovementController
  private fogOfWar?: FogOfWar
  private player?: Phaser.GameObjects.Container
  private debugText?: Phaser.GameObjects.Text
  private clueManager?: ClueManager

  constructor(private readonly onCluePanelChange: (clue: CluePanelData | null) => void) {
    super('movement-prototype')
  }

  create() {
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT)
    this.drawMap()

    const targetMarker = this.add
      .circle(0, 0, 12, 0xf4d58d, 0.35)
      .setStrokeStyle(3, 0xf4d58d)
      .setVisible(false)

    const player = this.createPlayer(300, 300)
    this.player = player
    const gameContainer = this.game.canvas.parentElement

    this.fogOfWar = new FogOfWar(this, MAP_WIDTH, MAP_HEIGHT)
    this.fogOfWar.update(player.x, player.y, DEFAULT_PLAYER_STATS.visionRadius)

    this.movementController = new MovementController(
      player,
      new Phaser.Geom.Rectangle(0, 0, MAP_WIDTH, MAP_HEIGHT),
      OBSTACLES,
      DEFAULT_PLAYER_STATS,
      targetMarker,
      (x, y) => {
        this.fogOfWar?.update(x, y, DEFAULT_PLAYER_STATS.visionRadius)

        if (gameContainer) {
          gameContainer.dataset.playerX = x.toFixed(1)
          gameContainer.dataset.playerY = y.toFixed(1)
          gameContainer.dataset.visionRadius = String(DEFAULT_PLAYER_STATS.visionRadius)
          gameContainer.dataset.discoveryUpdates = String(
            this.fogOfWar?.getDebugState().discoveryUpdates ?? 0,
          )
        }
      },
    )

    this.clueManager = new ClueManager(
      this,
      CLUE_DATA,
      CLUE_DISCOVERY_RADIUS,
      this.onCluePanelChange,
      (locked) => this.movementController?.setEnabled(!locked),
    )

    this.keyboardInput = new KeyboardInput(
      this,
      this.movementController,
      () => this.clueManager?.interactWithActiveClue(),
    )
    new PointerInput(
      this,
      this.movementController,
      (pointer, gameObjects) => (
        this.clueManager?.handlePointerDown(pointer, gameObjects) ?? false
      ),
    )

    this.cameras.main.startFollow(player, true, 0.12, 0.12)
    this.cameras.main.setRoundPixels(true)

    if (import.meta.env.DEV) {
      this.debugText = this.add
        .text(10, 10, '', {
          color: '#dbe4f0',
          fontFamily: 'monospace',
          fontSize: '12px',
          backgroundColor: '#07101dcc',
          padding: { x: 7, y: 5 },
        })
        .setScrollFactor(0)
        .setDepth(200)
    }
  }

  update(_time: number, delta: number) {
    this.keyboardInput?.update()
    this.movementController?.update(delta)

    if (this.player) this.clueManager?.update(this.player.x, this.player.y)

    if (this.debugText && this.player) {
      const clueCounts = this.clueManager?.getCounts()
      this.debugText.setText([
        `speed  ${DEFAULT_PLAYER_STATS.movementSpeed}`,
        `vision ${DEFAULT_PLAYER_STATS.visionRadius}`,
        `x ${this.player.x.toFixed(0)}  y ${this.player.y.toFixed(0)}`,
        `clues ${clueCounts?.discovered ?? 0}/${clueCounts?.total ?? 0} discovered`,
        `done   ${clueCounts?.completed ?? 0}/${clueCounts?.total ?? 0} completed`,
      ])
    }
  }

  closeClue() {
    this.clueManager?.closeOpenClue()
  }

  completeClue() {
    this.clueManager?.completeOpenClue()
  }

  private drawMap() {
    this.add.rectangle(0, 0, MAP_WIDTH, MAP_HEIGHT, 0x294c43).setOrigin(0)

    const grid = this.add.graphics().lineStyle(1, 0xffffff, 0.07)
    for (let x = 0; x <= MAP_WIDTH; x += 80) grid.lineBetween(x, 0, x, MAP_HEIGHT)
    for (let y = 0; y <= MAP_HEIGHT; y += 80) grid.lineBetween(0, y, MAP_WIDTH, y)

    const colors = [0x8d5a3b, 0x5f6f52, 0x456990, 0x9b7e46]
    OBSTACLES.forEach((obstacle, index) => {
      this.add
        .rectangle(obstacle.x, obstacle.y, obstacle.width, obstacle.height, colors[index])
        .setOrigin(0)
        .setStrokeStyle(4, 0x172033, 0.65)
    })

    this.add.circle(1320, 250, 90, 0x5ca4a9).setStrokeStyle(8, 0xc7e8e9, 0.5)
    this.add.star(770, 930, 8, 32, 70, 0xe0b44c).setStrokeStyle(5, 0xf4d58d, 0.5)
  }

  private createPlayer(x: number, y: number) {
    const shadow = this.add.ellipse(0, 13, 40, 18, 0x000000, 0.25)
    const body = this.add.circle(0, 0, 18, 0xf4d58d).setStrokeStyle(4, 0x5b3a29)
    const direction = this.add.triangle(0, -17, -5, 7, 5, 7, 0, -5, 0xffffff)
    return this.add.container(x, y, [shadow, body, direction]).setDepth(10)
  }
}
