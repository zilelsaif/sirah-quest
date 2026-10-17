import Phaser from 'phaser'
import type { MovementController } from '../player/MovementController'

export class PointerInput {
  constructor(
    scene: Phaser.Scene,
    movementController: MovementController,
    onInteractivePointerDown: (
      pointer: Phaser.Input.Pointer,
      gameObjects: Phaser.GameObjects.GameObject[],
    ) => boolean,
  ) {
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, (
      pointer: Phaser.Input.Pointer,
      gameObjects: Phaser.GameObjects.GameObject[],
    ) => {
      if (onInteractivePointerDown(pointer, gameObjects)) {
        movementController.cancelPointerTarget()
        return
      }

      movementController.setPointerTarget(pointer.worldX, pointer.worldY)
    })
  }
}
