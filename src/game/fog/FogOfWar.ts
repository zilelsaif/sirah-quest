import Phaser from 'phaser'
import { FOG_APPEARANCE } from './visibility'

const VISIBILITY_UPDATE_DISTANCE = 2
const MIN_DISCOVERY_STEP = 12
const MAX_DISCOVERY_STEP = 32

export class FogOfWar {
  private readonly exploredMaskSource: Phaser.GameObjects.Graphics
  private readonly visibleMaskSource: Phaser.GameObjects.Graphics
  private lastVisiblePosition?: Phaser.Math.Vector2
  private lastDiscoveredPosition?: Phaser.Math.Vector2
  private lastVisionRadius?: number
  private discoveryUpdates = 0

  constructor(scene: Phaser.Scene, mapWidth: number, mapHeight: number) {
    this.exploredMaskSource = new Phaser.GameObjects.Graphics(scene)
    this.visibleMaskSource = new Phaser.GameObjects.Graphics(scene)

    const exploredShade = scene.add
      .rectangle(0, 0, mapWidth, mapHeight, 0x07101d, FOG_APPEARANCE.exploredOpacity)
      .setOrigin(0)
      .setDepth(90)

    const unexploredFog = scene.add
      .rectangle(0, 0, mapWidth, mapHeight, 0x02050a, FOG_APPEARANCE.unexploredOpacity)
      .setOrigin(0)
      .setDepth(91)

    const visibleMask = this.visibleMaskSource.createGeometryMask()
    visibleMask.invertAlpha = true
    exploredShade.setMask(visibleMask)

    const exploredMask = this.exploredMaskSource.createGeometryMask()
    exploredMask.invertAlpha = true
    unexploredFog.setMask(exploredMask)
  }

  update(playerX: number, playerY: number, visionRadius: number) {
    const position = new Phaser.Math.Vector2(playerX, playerY)
    const radiusChanged = this.lastVisionRadius !== visionRadius

    if (
      radiusChanged ||
      !this.lastVisiblePosition ||
      this.lastVisiblePosition.distance(position) >= VISIBILITY_UPDATE_DISTANCE
    ) {
      this.visibleMaskSource.clear().fillStyle(0xffffff).fillCircle(playerX, playerY, visionRadius)
      this.lastVisiblePosition = position.clone()
    }

    const discoveryStep = Phaser.Math.Clamp(
      visionRadius * 0.1,
      MIN_DISCOVERY_STEP,
      MAX_DISCOVERY_STEP,
    )

    if (
      radiusChanged ||
      !this.lastDiscoveredPosition ||
      this.lastDiscoveredPosition.distance(position) >= discoveryStep
    ) {
      this.exploredMaskSource.fillStyle(0xffffff).fillCircle(playerX, playerY, visionRadius)
      this.lastDiscoveredPosition = position.clone()
      this.discoveryUpdates += 1
    }

    this.lastVisionRadius = visionRadius
  }

  getDebugState() {
    return {
      discoveryUpdates: this.discoveryUpdates,
      visionRadius: this.lastVisionRadius ?? 0,
    }
  }
}
