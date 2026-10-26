import Phaser from 'phaser'
import type { MovementController } from '../player/MovementController'

export class PointerInput {
  constructor(
    scene: Phaser.Scene,
    movementController: MovementController,
    onInteractivePointerDown: (
      pointer: Phaser.Input.Pointer,
      gameObjects: Phaser.GameObjects.GameObject[],
      worldPoint: Phaser.Math.Vector2,
    ) => boolean,
  ) {
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, (
      pointer: Phaser.Input.Pointer,
      gameObjects: Phaser.GameObjects.GameObject[],
    ) => {
      const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y)

      if (onInteractivePointerDown(pointer, gameObjects, worldPoint)) {
        movementController.cancelPointerTarget()
        return
      }

      movementController.setPointerTarget(worldPoint.x, worldPoint.y)
    })
  }
}
