import Phaser from 'phaser'
import { FOG_APPEARANCE } from './visibility'
import type { FogDiscoveryPoint } from '../session/types'
import type { FogIsolationMode } from '../performance/renderingConfig'

const VISIBILITY_UPDATE_DISTANCE = 2
const MIN_DISCOVERY_STEP = 12
const MAX_DISCOVERY_STEP = 32

export class FogOfWar {
  private readonly exploredMaskSource?: Phaser.GameObjects.Graphics
  private readonly exploredMaskTexture?: Phaser.Textures.DynamicTexture
  private readonly discoveryStampKey?: string
  private readonly visibleMaskSource: Phaser.GameObjects.Graphics
  private readonly visibleFeather?: Phaser.GameObjects.Graphics
  private lastVisiblePosition?: Phaser.Math.Vector2
  private lastDiscoveredPosition?: Phaser.Math.Vector2
  private lastVisionRadius?: number
  private discoveryUpdates = 0
  private visibilityUpdates = 0
  private readonly rasterExploration: boolean

  constructor(
    scene: Phaser.Scene,
    mapWidth: number,
    mapHeight: number,
    initialDiscoveryPoints: readonly FogDiscoveryPoint[] = [],
    private readonly onDiscoveryChange?: (points: FogDiscoveryPoint[]) => void,
    private readonly useSoftVisibleEdge = false,
    private readonly isolationMode: FogIsolationMode = 'normal',
  ) {
    this.visibleMaskSource = new Phaser.GameObjects.Graphics(scene)
    this.rasterExploration = isolationMode === 'normal' && scene.game.renderer.type === Phaser.WEBGL

    const exploredShade = isolationMode === 'all-disabled' ? undefined : scene.add
      .rectangle(0, 0, mapWidth, mapHeight, 0x07101d, FOG_APPEARANCE.exploredOpacity)
      .setOrigin(0).setDepth(90)
    const unexploredFog = isolationMode === 'normal' ? scene.add
      .rectangle(0, 0, mapWidth, mapHeight, 0x02050a, FOG_APPEARANCE.unexploredOpacity)
      .setOrigin(0).setDepth(91) : undefined

    if (useSoftVisibleEdge) {
      this.visibleFeather = scene.add.graphics().setDepth(90.5)
    }

    if (exploredShade) {
      const visibleMask = this.visibleMaskSource.createGeometryMask()
      visibleMask.invertAlpha = true
      exploredShade.setMask(visibleMask)
    }

    if (unexploredFog && this.rasterExploration) {
      const textureKey = `fog-explored-${scene.sys.settings.key}`
      if (scene.textures.exists(textureKey)) scene.textures.remove(textureKey)
      this.exploredMaskTexture = scene.textures.addDynamicTexture(textureKey, mapWidth, mapHeight) ?? undefined
      this.exploredMaskTexture?.setIsSpriteTexture(false)
      if (this.exploredMaskTexture) {
        const reconstruction = new Phaser.GameObjects.Graphics(scene)
        reconstruction.fillStyle(0xffffff, 1)
        initialDiscoveryPoints.forEach(({ x, y, radius }) => reconstruction.fillCircle(x, y, radius))
        this.exploredMaskTexture.draw(reconstruction)
        reconstruction.destroy()
        const exploredMask = unexploredFog.createBitmapMask(this.exploredMaskTexture)
        exploredMask.invertAlpha = true
        unexploredFog.setMask(exploredMask)

        this.discoveryStampKey = `${textureKey}-stamp`
        if (scene.textures.exists(this.discoveryStampKey)) scene.textures.remove(this.discoveryStampKey)
        const stamp = new Phaser.GameObjects.Graphics(scene)
        stamp.fillStyle(0xffffff, 1).fillCircle(32, 32, 32)
        stamp.generateTexture(this.discoveryStampKey, 64, 64)
        stamp.destroy()
      }
    } else if (unexploredFog) {
      this.exploredMaskSource = new Phaser.GameObjects.Graphics(scene)
      initialDiscoveryPoints.forEach(({ x, y, radius }) => {
        this.exploredMaskSource?.fillStyle(0xffffff).fillCircle(x, y, radius)
      })
      const exploredMask = this.exploredMaskSource.createGeometryMask()
      exploredMask.invertAlpha = true
      unexploredFog.setMask(exploredMask)
    }
    this.discoveryPoints = initialDiscoveryPoints.map((point) => ({ ...point }))

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.discoveryStampKey && scene.textures.exists(this.discoveryStampKey)) scene.textures.remove(this.discoveryStampKey)
      this.exploredMaskTexture?.destroy()
      this.exploredMaskSource?.destroy()
      this.visibleMaskSource.destroy()
      this.visibleFeather?.destroy()
    })
  }

  private discoveryPoints: FogDiscoveryPoint[] = []

  update(playerX: number, playerY: number, visionRadius: number) {
    const position = new Phaser.Math.Vector2(playerX, playerY)
    const radiusChanged = this.lastVisionRadius !== visionRadius

    if (
      radiusChanged ||
      !this.lastVisiblePosition ||
      this.lastVisiblePosition.distance(position) >= VISIBILITY_UPDATE_DISTANCE
    ) {
      this.visibleMaskSource.clear().fillStyle(0xffffff).fillCircle(playerX, playerY, visionRadius)
      this.visibilityUpdates += 1
      if (this.visibleFeather) {
        this.visibleFeather.clear()
        const featherBands = [
          { inset: 5, width: 10, alpha: 0.2 },
          { inset: 15, width: 10, alpha: 0.14 },
          { inset: 25, width: 10, alpha: 0.09 },
          { inset: 35, width: 10, alpha: 0.045 },
        ] as const
        featherBands.forEach(({ inset, width, alpha }) => {
          this.visibleFeather?.lineStyle(width, 0x07101d, alpha)
            .strokeCircle(playerX, playerY, Math.max(1, visionRadius - inset))
        })
      }
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
      if (this.exploredMaskTexture && this.discoveryStampKey) {
        this.exploredMaskTexture.stamp(this.discoveryStampKey, undefined, playerX, playerY, {
          scale: visionRadius / 32,
        })
      } else {
        this.exploredMaskSource?.fillStyle(0xffffff).fillCircle(playerX, playerY, visionRadius)
      }
      this.lastDiscoveredPosition = position.clone()
      this.discoveryUpdates += 1
      this.discoveryPoints.push({ x: playerX, y: playerY, radius: visionRadius })
      this.onDiscoveryChange?.(this.discoveryPoints.map((point) => ({ ...point })))
    }

    this.lastVisionRadius = visionRadius
  }

  getDebugState() {
    return {
      discoveryUpdates: this.discoveryUpdates,
      visibilityUpdates: this.visibilityUpdates,
      discoveryPointCount: this.discoveryPoints.length,
      exploredGeometryCommands: this.rasterExploration ? 0 : this.discoveryPoints.length,
      explorationStrategy: this.rasterExploration ? 'cached-raster' : 'geometry',
      visionRadius: this.lastVisionRadius ?? 0,
      softVisibleEdge: this.useSoftVisibleEdge,
      activeMaskCount: this.isolationMode === 'all-disabled' ? 0
        : this.isolationMode === 'explored-disabled' ? 1
          : (this.useSoftVisibleEdge ? 3 : 2),
    }
  }
}
