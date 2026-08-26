import Phaser from 'phaser'
import type { MovementController } from '../player/MovementController'

export class KeyboardInput {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys
  private readonly wasd: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>

  constructor(
    scene: Phaser.Scene,
    private readonly movementController: MovementController,
  ) {
    const keyboard = scene.input.keyboard
    if (!keyboard) throw new Error('Keyboard input is unavailable.')

    this.cursors = keyboard.createCursorKeys()
    this.wasd = keyboard.addKeys('W,A,S,D') as typeof this.wasd
  }

  update() {
    const x = Number(this.cursors.right.isDown || this.wasd.D.isDown) -
      Number(this.cursors.left.isDown || this.wasd.A.isDown)
    const y = Number(this.cursors.down.isDown || this.wasd.S.isDown) -
      Number(this.cursors.up.isDown || this.wasd.W.isDown)

    this.movementController.setKeyboardDirection(x, y)
  }
}
