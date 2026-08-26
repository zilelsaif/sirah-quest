import Phaser from 'phaser'
import type { MovementController } from '../player/MovementController'

export class PointerInput {
  constructor(
    scene: Phaser.Scene,
    movementController: MovementController,
  ) {
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      movementController.setPointerTarget(pointer.worldX, pointer.worldY)
    })
  }
}
