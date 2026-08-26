import Phaser from 'phaser'
import { DEFAULT_PLAYER_STATS } from '../config/playerStats'
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

  constructor() {
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
    const gameContainer = this.game.canvas.parentElement

    this.movementController = new MovementController(
      player,
      new Phaser.Geom.Rectangle(0, 0, MAP_WIDTH, MAP_HEIGHT),
      OBSTACLES,
      DEFAULT_PLAYER_STATS,
      targetMarker,
      (x, y) => {
        if (gameContainer) {
          gameContainer.dataset.playerX = x.toFixed(1)
          gameContainer.dataset.playerY = y.toFixed(1)
        }
      },
    )

    this.keyboardInput = new KeyboardInput(this, this.movementController)
    new PointerInput(this, this.movementController)

    this.cameras.main.startFollow(player, true, 0.12, 0.12)
    this.cameras.main.setRoundPixels(true)
  }

  update(_time: number, delta: number) {
    this.keyboardInput?.update()
    this.movementController?.update(delta)
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
