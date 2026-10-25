import Phaser from 'phaser'
import type { PlayerStats } from '../config/playerStats'
import type { Pathfinder } from '../navigation/Pathfinder'

const TARGET_REACHED_DISTANCE = 5

export class MovementController {
  private keyboardDirection = new Phaser.Math.Vector2()
  private pointerPath: Phaser.Math.Vector2[] = []
  private enabled = true

  constructor(
    private readonly player: Phaser.GameObjects.Container,
    private readonly pathfinder: Pathfinder,
    private stats: PlayerStats,
    private readonly targetMarker: Phaser.GameObjects.Arc,
    private readonly onPositionChange?: (x: number, y: number) => void,
  ) {}

  setKeyboardDirection(x: number, y: number) {
    if (!this.enabled) return

    this.keyboardDirection.set(x, y)

    if (this.keyboardDirection.lengthSq() > 0) {
      this.keyboardDirection.normalize()
      this.cancelPointerTarget()
    }
  }

  setPointerTarget(x: number, y: number) {
    if (!this.enabled) return
    const path = this.pathfinder.findPath(
      { x: this.player.x, y: this.player.y },
      { x, y },
    )
    this.cancelPointerTarget()
    if (path.length === 0) return
    this.pointerPath = path.map((point) => new Phaser.Math.Vector2(point.x, point.y))
    const destination = this.pointerPath[this.pointerPath.length - 1]
    this.targetMarker.setPosition(destination.x, destination.y).setVisible(true)
  }

  update(deltaMs: number) {
    if (!this.enabled) {
      this.onPositionChange?.(this.player.x, this.player.y)
      return
    }

    const deltaSeconds = Math.min(deltaMs, 50) / 1000
    const direction = this.getMovementDirection()
    let distance = this.stats.movementSpeed * deltaSeconds

    if (this.keyboardDirection.lengthSq() === 0 && this.pointerPath.length > 0) {
      const waypointDistance = Phaser.Math.Distance.BetweenPoints(this.player, this.pointerPath[0])
      distance = Math.min(distance, waypointDistance)
    }

    if (direction.lengthSq() > 0) {
      const moved = this.moveWithCollisions(direction.x * distance, direction.y * distance)
      if (!moved && this.pointerPath.length > 0) this.cancelPointerTarget()
    }

    if (this.pointerPath.length > 0) {
      const waypoint = this.pointerPath[0]
      if (Phaser.Math.Distance.BetweenPoints(this.player, waypoint) <= TARGET_REACHED_DISTANCE) {
        this.player.setPosition(waypoint.x, waypoint.y)
        this.pointerPath.shift()
        if (this.pointerPath.length === 0) this.cancelPointerTarget()
      }
    }

    this.onPositionChange?.(this.player.x, this.player.y)
  }

  private getMovementDirection() {
    if (this.keyboardDirection.lengthSq() > 0) {
      return this.keyboardDirection.clone()
    }

    if (this.pointerPath.length === 0) return new Phaser.Math.Vector2()

    const toTarget = this.pointerPath[0].clone().subtract(this.player)
    if (toTarget.length() <= TARGET_REACHED_DISTANCE) {
      this.player.setPosition(this.pointerPath[0].x, this.pointerPath[0].y)
      this.pointerPath.shift()
      if (this.pointerPath.length === 0) this.cancelPointerTarget()
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

    return moved
  }

  private isPositionWalkable(x: number, y: number) {
    return this.pathfinder.isPointWalkable({ x, y })
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (!enabled) {
      this.keyboardDirection.set(0, 0)
      this.cancelPointerTarget()
    }
  }

  setStats(stats: PlayerStats) {
    this.stats = stats
  }

  cancelPointerTarget() {
    this.pointerPath = []
    this.targetMarker.setVisible(false)
  }
}
