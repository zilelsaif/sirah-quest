import Phaser from 'phaser'
import type { PlayerStats } from '../config/playerStats'

const PLAYER_RADIUS = 18
const TARGET_REACHED_DISTANCE = 5

export class MovementController {
  private keyboardDirection = new Phaser.Math.Vector2()
  private pointerTarget?: Phaser.Math.Vector2

  constructor(
    private readonly player: Phaser.GameObjects.Container,
    private readonly mapBounds: Phaser.Geom.Rectangle,
    private readonly obstacles: Phaser.Geom.Rectangle[],
    private readonly stats: PlayerStats,
    private readonly targetMarker: Phaser.GameObjects.Arc,
    private readonly onPositionChange?: (x: number, y: number) => void,
  ) {}

  setKeyboardDirection(x: number, y: number) {
    this.keyboardDirection.set(x, y)

    if (this.keyboardDirection.lengthSq() > 0) {
      this.keyboardDirection.normalize()
      this.cancelPointerTarget()
    }
  }

  setPointerTarget(x: number, y: number) {
    if (!this.isPositionWalkable(x, y)) return

    this.pointerTarget = new Phaser.Math.Vector2(x, y)
    this.targetMarker.setPosition(x, y).setVisible(true)
  }

  update(deltaMs: number) {
    const deltaSeconds = Math.min(deltaMs, 50) / 1000
    const direction = this.getMovementDirection()
    const distance = this.stats.movementSpeed * deltaSeconds

    if (direction.lengthSq() > 0) {
      this.moveWithCollisions(direction.x * distance, direction.y * distance)
    }

    this.onPositionChange?.(this.player.x, this.player.y)
  }

  private getMovementDirection() {
    if (this.keyboardDirection.lengthSq() > 0) {
      return this.keyboardDirection.clone()
    }

    if (!this.pointerTarget) return new Phaser.Math.Vector2()

    const toTarget = this.pointerTarget.clone().subtract(this.player)
    if (toTarget.length() <= TARGET_REACHED_DISTANCE) {
      this.player.setPosition(this.pointerTarget.x, this.pointerTarget.y)
      this.cancelPointerTarget()
      return new Phaser.Math.Vector2()
    }

    return toTarget.normalize()
  }

  private moveWithCollisions(dx: number, dy: number) {
    let moved = false
    const nextX = this.player.x + dx
    if (this.isPositionWalkable(nextX, this.player.y)) {
      this.player.x = nextX
      moved = true
    }

    const nextY = this.player.y + dy
    if (this.isPositionWalkable(this.player.x, nextY)) {
      this.player.y = nextY
      moved = true
    }

    if (!moved && this.pointerTarget) this.cancelPointerTarget()
  }

  private isPositionWalkable(x: number, y: number) {
    const insideMap =
      x >= this.mapBounds.left + PLAYER_RADIUS &&
      x <= this.mapBounds.right - PLAYER_RADIUS &&
      y >= this.mapBounds.top + PLAYER_RADIUS &&
      y <= this.mapBounds.bottom - PLAYER_RADIUS

    return (
      insideMap &&
      !this.obstacles.some((obstacle) =>
        Phaser.Geom.Intersects.CircleToRectangle(
          new Phaser.Geom.Circle(x, y, PLAYER_RADIUS),
          obstacle,
        ),
      )
    )
  }

  private cancelPointerTarget() {
    this.pointerTarget = undefined
    this.targetMarker.setVisible(false)
  }
}
