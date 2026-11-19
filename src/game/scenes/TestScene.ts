import Phaser from 'phaser'
import { CLUE_DISCOVERY_RADIUS } from '../clues/clueData'
import { ClueManager } from '../clues/ClueManager'
import type { ClueOverlayData } from '../clues/types'
import { FogOfWar } from '../fog/FogOfWar'
import { KeyboardInput } from '../input/KeyboardInput'
import { PointerInput } from '../input/PointerInput'
import { MovementController } from '../player/MovementController'
import type { AreaPlaySession } from '../session/types'
import type { EffectivePlayerStats } from '../progression/types'
import type { AreaDefinition } from '../areas/types'
import { Pathfinder } from '../navigation/Pathfinder'
import { VISUAL_PALETTE } from '../visuals/visualTheme'
import { renderEnvironment, type EnvironmentRenderResult } from '../visuals/EnvironmentRenderer'
import { getCameraMetrics, type CameraViewMode } from '../camera/cameraConfig'
import { getNpcsForArea } from '../npcs/npcData'
import { NpcManager } from '../npcs/NpcManager'
import type { NpcDefinition } from '../npcs/types'
import { getWorldObjectsForArea } from '../worldObjects/worldObjectData'
import { getLandmarksForArea } from '../worldObjects/landmarkData'
import { WorldObjectManager } from '../worldObjects/WorldObjectManager'
import type { WorldObjectDefinition, WorldObjectPanelData, WorldObjectSessionState } from '../worldObjects/types'
import {
  createCharacterSprite,
  directionFromDisplacement,
  frameForCharacter,
  PLAYER_KAMPUNG_VISUAL,
  preloadCharacterVisuals,
  type CharacterDirection,
} from '../visuals/characterVisualManifest'
import { kampungWorldDepth, preloadKampungEnvironmentVisuals } from '../visuals/kampungEnvironmentManifest'
import { KAMPUNG_ILMU_AREA_ID } from '../areas/areaRegistry'
import { preloadKampungClueVisuals } from '../clues/kampungClueVisualManifest'
import type { DevelopmentRenderingConfig } from '../performance/renderingConfig'

export interface SceneRenderDiagnostics {
  sceneLoadMs: number
  displayObjectCount: number
  activeMaskCount: number
  textureCount: number
  requestedRenderMode: DevelopmentRenderingConfig['kampungRenderMode']
  renderModeUsed: DevelopmentRenderingConfig['kampungRenderMode']
  fogEdgeMode: DevelopmentRenderingConfig['fogEdgeMode']
  renderer: string
  gpuRenderer: string
  canvasPhysicalWidth: number
  canvasPhysicalHeight: number
  devicePixelRatio: number
  discoveryPointCount: number
  exploredGeometryCommands: number
  explorationStrategy: string
  fogIsolationMode: DevelopmentRenderingConfig['fogIsolationMode']
}

export class TestScene extends Phaser.Scene {
  private keyboardInput?: KeyboardInput
  private movementController?: MovementController
  private fogOfWar?: FogOfWar
  private player?: Phaser.GameObjects.Container
  private debugText?: Phaser.GameObjects.Text
  private clueManager?: ClueManager
  private npcManager?: NpcManager
  private worldObjectManager?: WorldObjectManager
  private lastSessionUpdate = 0
  private cluePanelLocked = false
  private npcPanelLocked = false
  private worldObjectPanelLocked = false
  private interfaceLocked = false
  private remainingHints: number
  private fogDiscoveryPoints: AreaPlaySession['fogDiscoveryPoints']
  private cameraViewMode: CameraViewMode
  private playerSprite?: Phaser.GameObjects.Sprite
  private playerFacing: CharacterDirection = 'front'
  private playerWalkElapsedMs = 0
  private environmentDiagnostics?: EnvironmentRenderResult

  constructor(
    private readonly onCluePanelChange: (clue: ClueOverlayData | null) => void,
    private readonly area: AreaDefinition,
    private readonly initialSession: AreaPlaySession,
    private readonly onSessionChange: (session: AreaPlaySession) => void,
    private effectiveStats: EffectivePlayerStats,
    initialCameraViewMode: CameraViewMode,
    private readonly renderingConfig: DevelopmentRenderingConfig,
    private readonly onNearbyNpcChange: (npc: NpcDefinition | null) => void,
    private readonly onNpcDialogueChange: (npc: NpcDefinition | null) => void,
    private readonly initialWorldObjectState: WorldObjectSessionState,
    private readonly onWorldObjectStateChange: (state: WorldObjectSessionState) => void,
    private readonly discoveredLandmarkIds: readonly string[],
    private readonly onLandmarkDiscovered: (landmarkId: string) => void,
    private readonly onNearbyWorldObjectChange: (object: WorldObjectDefinition | null) => void,
    private readonly onWorldObjectPanelChange: (object: WorldObjectPanelData | null) => void,
    private readonly onSceneReady: (diagnostics: SceneRenderDiagnostics) => void,
  ) {
    super('movement-prototype')
    this.remainingHints = initialSession.remainingHints
    this.fogDiscoveryPoints = initialSession.fogDiscoveryPoints
    this.cameraViewMode = initialCameraViewMode
  }

  preload() {
    preloadCharacterVisuals(this, this.area.id)
    if (this.area.id === KAMPUNG_ILMU_AREA_ID) {
      preloadKampungEnvironmentVisuals(this)
      preloadKampungClueVisuals(this)
    }
  }

  create() {
    const sceneLoadStartedAt = performance.now()
    this.registry.set('areaId', this.area.id)
    this.cameras.main.setBounds(0, 0, this.area.width, this.area.height)
    this.drawMap()

    const targetMarker = this.add
      .circle(0, 0, 12, 0xf4d58d, 0.35)
      .setStrokeStyle(3, 0xf4d58d)
      .setVisible(false)

    const player = this.createPlayer(
      this.initialSession.playerPosition.x,
      this.initialSession.playerPosition.y,
    )
    this.player = player
    const gameContainer = this.game.canvas.parentElement

    const syntheticDiscoveryPoints = this.renderingConfig.syntheticDiscoveryPointCount > 0
      ? Array.from({ length: this.renderingConfig.syntheticDiscoveryPointCount }, (_, index) => ({
        x: 80 + ((index * 97) % Math.max(1, this.area.width - 160)),
        y: 80 + ((index * 193) % Math.max(1, this.area.height - 160)),
        radius: this.effectiveStats.visionRadius,
      }))
      : undefined
    const initialFogPoints = syntheticDiscoveryPoints ?? this.initialSession.fogDiscoveryPoints
    this.fogOfWar = new FogOfWar(
      this,
      this.area.width,
      this.area.height,
      initialFogPoints,
      this.renderingConfig.fogIsolationMode === 'normal' && !syntheticDiscoveryPoints ? (points) => {
        this.fogDiscoveryPoints = points
      } : undefined,
      this.area.id === KAMPUNG_ILMU_AREA_ID && this.renderingConfig.fogEdgeMode === 'soft',
      this.renderingConfig.fogIsolationMode,
    )
    this.fogOfWar.update(player.x, player.y, this.effectiveStats.visionRadius)

    this.movementController = new MovementController(
      player,
      new Pathfinder(this.area),
      {
        movementSpeed: this.effectiveStats.movementSpeed,
        visionRadius: this.effectiveStats.visionRadius,
      },
      targetMarker,
      (x, y) => {
        this.fogOfWar?.update(x, y, this.effectiveStats.visionRadius)

        if (gameContainer) {
          gameContainer.dataset.playerX = x.toFixed(1)
          gameContainer.dataset.playerY = y.toFixed(1)
          gameContainer.dataset.visionRadius = String(this.effectiveStats.visionRadius)
          gameContainer.dataset.movementSpeed = String(this.effectiveStats.movementSpeed)
          gameContainer.dataset.discoveryUpdates = String(
            this.fogOfWar?.getDebugState().discoveryUpdates ?? 0,
          )
          gameContainer.dataset.visibilityUpdates = String(this.fogOfWar?.getDebugState().visibilityUpdates ?? 0)
          gameContainer.dataset.discoveryPointCount = String(this.fogOfWar?.getDebugState().discoveryPointCount ?? 0)
          gameContainer.dataset.explorationStrategy = this.fogOfWar?.getDebugState().explorationStrategy ?? 'unknown'
        }

        if (this.time.now - this.lastSessionUpdate >= 150) {
          this.lastSessionUpdate = this.time.now
          this.emitSessionState(x, y)
        }
      },
    )

    if (!this.renderingConfig.minimalScene) this.clueManager = new ClueManager(
      this,
      this.area.clues,
      this.initialSession.questionRun.assignments,
      CLUE_DISCOVERY_RADIUS,
      this.onCluePanelChange,
      (locked) => {
        this.cluePanelLocked = locked
        this.applyMovementLock()
      },
      this.initialSession.clues,
      (clues) => this.emitSessionState(player.x, player.y, clues),
    )

    if (!this.renderingConfig.minimalScene) this.npcManager = new NpcManager(
      this,
      getNpcsForArea(this.area.id),
      this.onNearbyNpcChange,
      this.onNpcDialogueChange,
      (locked) => {
        this.npcPanelLocked = locked
        this.applyMovementLock()
      },
    )

    if (!this.renderingConfig.minimalScene) this.worldObjectManager = new WorldObjectManager(
      this,
      [...getWorldObjectsForArea(this.area.id), ...getLandmarksForArea(this.area.id)],
      this.initialWorldObjectState,
      this.onNearbyWorldObjectChange,
      this.onWorldObjectPanelChange,
      (locked) => {
        this.worldObjectPanelLocked = locked
        this.applyMovementLock()
      },
      this.onWorldObjectStateChange,
      this.discoveredLandmarkIds,
      this.onLandmarkDiscovered,
    )

    this.keyboardInput = new KeyboardInput(
      this,
      this.movementController,
      () => {
        if (this.interfaceLocked || this.cluePanelLocked || this.npcPanelLocked || this.worldObjectPanelLocked) return false
        return this.npcManager?.interactWithActiveNpc() ||
          this.clueManager?.interactWithActiveClue() ||
          this.worldObjectManager?.interactWithActiveObject()
      },
    )
    new PointerInput(
      this,
      this.movementController,
      (_pointer, gameObjects, worldPoint) => {
        if (this.interfaceLocked || this.cluePanelLocked || this.npcPanelLocked || this.worldObjectPanelLocked) return true
        if (this.npcManager?.handlePointerDown(worldPoint, gameObjects)) return true
        if (this.clueManager?.handlePointerDown(worldPoint, gameObjects)) return true
        return this.worldObjectManager?.handlePointerDown(worldPoint, gameObjects) ?? false
      },
    )

    this.cameras.main.startFollow(player, true, 0.12, 0.12)
    this.cameras.main.setRoundPixels(true)
    this.applyCameraZoom()
    this.scale.on(Phaser.Scale.Events.RESIZE, this.applyCameraZoom, this)

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

    const fogDiagnostics = this.fogOfWar.getDebugState()
    const renderer = this.game.renderer
    const gl = renderer.type === Phaser.WEBGL
      ? (renderer as Phaser.Renderer.WebGL.WebGLRenderer).gl
      : undefined
    const webgl = gl?.getExtension('WEBGL_debug_renderer_info')
    const gpuRenderer = webgl && gl
      ? gl.getParameter(webgl.UNMASKED_RENDERER_WEBGL)
      : 'unavailable'
    this.onSceneReady({
      sceneLoadMs: performance.now() - sceneLoadStartedAt,
      displayObjectCount: this.children.list.length,
      activeMaskCount: (this.environmentDiagnostics?.activeMaskCount ?? 0)
        + (this.fogOfWar?.getDebugState().activeMaskCount ?? 0),
      textureCount: this.textures.getTextureKeys().length,
      requestedRenderMode: this.renderingConfig.kampungRenderMode,
      renderModeUsed: this.environmentDiagnostics?.modeUsed ?? 'modular',
      fogEdgeMode: this.renderingConfig.fogEdgeMode,
      renderer: renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas',
      gpuRenderer: String(gpuRenderer),
      canvasPhysicalWidth: this.game.canvas.width,
      canvasPhysicalHeight: this.game.canvas.height,
      devicePixelRatio: window.devicePixelRatio,
      discoveryPointCount: fogDiagnostics.discoveryPointCount,
      exploredGeometryCommands: fogDiagnostics.exploredGeometryCommands,
      explorationStrategy: fogDiagnostics.explorationStrategy,
      fogIsolationMode: this.renderingConfig.fogIsolationMode,
    })

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.emitSessionState(player.x, player.y)
      this.onCluePanelChange(null)
      this.npcManager?.destroy()
      this.worldObjectManager?.destroy()
      this.onNearbyNpcChange(null)
      this.onNearbyWorldObjectChange(null)
      this.scale.off(Phaser.Scale.Events.RESIZE, this.applyCameraZoom, this)
    })
  }

  update(_time: number, delta: number) {
    this.keyboardInput?.update()
    const previousPlayerPosition = this.player
      ? new Phaser.Math.Vector2(this.player.x, this.player.y)
      : undefined
    this.movementController?.update(delta)

    if (this.player && previousPlayerPosition) {
      this.updatePlayerVisual(previousPlayerPosition, delta)
      if (this.area.id === KAMPUNG_ILMU_AREA_ID) this.player.setDepth(kampungWorldDepth(this.player.y))
    }

    if (this.player) {
      this.npcManager?.setInteractionSuppressed(this.cluePanelLocked || this.worldObjectPanelLocked || this.interfaceLocked)
      this.npcManager?.update(this.player.x, this.player.y, this.effectiveStats.visionRadius)
      this.clueManager?.setInteractionSuppressed(
        this.npcPanelLocked || this.worldObjectPanelLocked || this.interfaceLocked || Boolean(this.npcManager?.hasActiveNpc()),
      )
      this.clueManager?.update(this.player.x, this.player.y)
      this.worldObjectManager?.setInteractionSuppressed(
        this.npcPanelLocked || this.cluePanelLocked || this.interfaceLocked ||
        Boolean(this.npcManager?.hasActiveNpc()) || Boolean(this.clueManager?.hasActiveClue()),
      )
      this.worldObjectManager?.update(this.player.x, this.player.y, this.effectiveStats.visionRadius)
    }

    if (this.debugText && this.player) {
      const clueCounts = this.clueManager?.getCounts()
      this.debugText.setText([
        `speed  ${this.effectiveStats.movementSpeed}`,
        `area   ${this.area.id}`,
        `vision ${this.effectiveStats.visionRadius}`,
        `zoom   ${this.cameras.main.zoom.toFixed(2)}  view ${Math.round(this.cameras.main.worldView.width)}x${Math.round(this.cameras.main.worldView.height)}`,
        `hints  ${this.remainingHints}/${this.effectiveStats.maxHints}`,
        `x ${this.player.x.toFixed(0)}  y ${this.player.y.toFixed(0)}`,
        `clues ${clueCounts?.discovered ?? 0}/${clueCounts?.total ?? 0} discovered`,
        `done   ${clueCounts?.completed ?? 0}/${clueCounts?.total ?? 0} completed`,
      ])
    }
  }

  closeClue() {
    this.clueManager?.closeOpenClue()
  }

  continueClueInspection() {
    return this.clueManager?.continueOpenClue() ?? false
  }

  interactWithNpc() {
    return this.npcManager?.interactWithActiveNpc() ?? false
  }

  closeNpcDialogue() {
    this.npcManager?.closeOpenNpc()
  }

  interactWithWorldObject() {
    return this.worldObjectManager?.interactWithActiveObject() ?? false
  }

  closeWorldObjectPanel() {
    this.worldObjectManager?.closeOpenObject()
  }

  answerClue(optionId: string) {
    this.clueManager?.answerOpenClue(optionId)
  }

  useHint() {
    if (this.remainingHints <= 0 || !this.clueManager?.useHint()) return false
    this.remainingHints -= 1
    if (this.player) this.emitSessionState(this.player.x, this.player.y)
    return true
  }

  setEffectiveStats(stats: EffectivePlayerStats) {
    this.effectiveStats = stats
    this.movementController?.setStats({
      movementSpeed: stats.movementSpeed,
      visionRadius: stats.visionRadius,
    })
    if (this.player) this.fogOfWar?.update(this.player.x, this.player.y, stats.visionRadius)
  }

  setInterfaceLocked(locked: boolean) {
    this.interfaceLocked = locked
    this.applyMovementLock()
  }

  setCameraViewMode(mode: CameraViewMode) {
    this.cameraViewMode = mode
    this.applyCameraZoom()
  }

  private applyCameraZoom() {
    const camera = this.cameras.main
    const metrics = getCameraMetrics(camera.width, camera.height, this.cameraViewMode)
    camera.setZoom(metrics.zoom)

    const gameContainer = this.game.canvas.parentElement
    if (gameContainer) {
      gameContainer.dataset.cameraMode = this.cameraViewMode
      gameContainer.dataset.cameraZoom = metrics.zoom.toFixed(2)
      gameContainer.dataset.canvasWidth = String(Math.round(metrics.viewportWidth))
      gameContainer.dataset.canvasHeight = String(Math.round(metrics.viewportHeight))
      gameContainer.dataset.worldViewWidth = metrics.worldViewWidth.toFixed(1)
      gameContainer.dataset.worldViewHeight = metrics.worldViewHeight.toFixed(1)
    }
  }

  private applyMovementLock() {
    this.movementController?.setEnabled(
      !this.cluePanelLocked && !this.npcPanelLocked && !this.worldObjectPanelLocked && !this.interfaceLocked,
    )
  }

  private emitSessionState(
    x: number,
    y: number,
    clues = this.clueManager?.getSessionState() ?? this.initialSession.clues,
  ) {
    this.onSessionChange({
      ...this.initialSession,
      playerPosition: { x, y },
      clues,
      remainingHints: this.remainingHints,
      fogDiscoveryPoints: this.fogDiscoveryPoints,
    })
  }

  private drawMap() {
    this.environmentDiagnostics = renderEnvironment(
      this,
      this.area,
      this.renderingConfig.kampungRenderMode,
      this.renderingConfig.minimalScene,
    )
  }

  private createPlayer(x: number, y: number) {
    const shadow = this.add.ellipse(0, 18, 42, 17, 0x000000, 0.3)
    const cloak = this.add.triangle(0, 8, -18, 20, 18, 20, 0, -14, VISUAL_PALETTE.deepTeal)
      .setStrokeStyle(3, VISUAL_PALETTE.ink)
    const scarf = this.add.triangle(0, -2, -12, 12, 12, 12, 0, -7, VISUAL_PALETTE.lapis)
    const head = this.add.circle(0, -10, 11, VISUAL_PALETTE.softGold)
      .setStrokeStyle(3, VISUAL_PALETTE.earth)
    const satchel = this.add.circle(13, 8, 6, VISUAL_PALETTE.gold)
      .setStrokeStyle(2, VISUAL_PALETTE.earth)
    const direction = this.add.triangle(0, -26, -5, 7, 5, 7, 0, -4, VISUAL_PALETTE.parchment)
    const fallbackParts = [cloak, scarf, head, satchel, direction]
    const player = this.add.container(x, y, [shadow, ...fallbackParts]).setDepth(10)
    if (this.area.id === KAMPUNG_ILMU_AREA_ID) player.setDepth(kampungWorldDepth(y))
    if (this.area.id === PLAYER_KAMPUNG_VISUAL.areaId) {
      const sprite = createCharacterSprite(this, PLAYER_KAMPUNG_VISUAL)
      if (sprite) {
        fallbackParts.forEach((part) => part.setVisible(false))
        player.addAt(sprite, 1)
        this.playerSprite = sprite
      }
    }
    return player
  }

  private updatePlayerVisual(previousPosition: Phaser.Math.Vector2, delta: number) {
    if (!this.playerSprite || !this.player) return
    const displacement = new Phaser.Math.Vector2(
      this.player.x - previousPosition.x,
      this.player.y - previousPosition.y,
    )
    const moving = displacement.lengthSq() >= 0.0001
    this.playerFacing = directionFromDisplacement(displacement, this.playerFacing)
    this.playerWalkElapsedMs = moving ? this.playerWalkElapsedMs + delta : 0
    const frame = frameForCharacter(
      PLAYER_KAMPUNG_VISUAL,
      this.playerFacing,
      moving,
      this.playerWalkElapsedMs,
    )
    if (this.playerSprite.texture.has(String(frame))) this.playerSprite.setFrame(frame)
  }
}
