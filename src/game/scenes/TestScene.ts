import Phaser from 'phaser'
import { CLUE_DISCOVERY_RADIUS } from '../clues/clueData'
import { ClueManager } from '../clues/ClueManager'
import type { CluePanelData } from '../clues/types'
import { FogOfWar } from '../fog/FogOfWar'
import { KeyboardInput } from '../input/KeyboardInput'
import { PointerInput } from '../input/PointerInput'
import { MovementController } from '../player/MovementController'
import type { AreaPlaySession } from '../session/types'
import type { EffectivePlayerStats } from '../progression/types'
import type { AreaDefinition } from '../areas/types'
import { Pathfinder } from '../navigation/Pathfinder'
import { VISUAL_PALETTE } from '../visuals/visualTheme'
import { renderEnvironment } from '../visuals/EnvironmentRenderer'
import { getCameraMetrics, type CameraViewMode } from '../camera/cameraConfig'
import { getNpcsForArea } from '../npcs/npcData'
import { NpcManager } from '../npcs/NpcManager'
import type { NpcDefinition } from '../npcs/types'

export class TestScene extends Phaser.Scene {
  private keyboardInput?: KeyboardInput
  private movementController?: MovementController
  private fogOfWar?: FogOfWar
  private player?: Phaser.GameObjects.Container
  private debugText?: Phaser.GameObjects.Text
  private clueManager?: ClueManager
  private npcManager?: NpcManager
  private lastSessionUpdate = 0
  private cluePanelLocked = false
  private npcPanelLocked = false
  private interfaceLocked = false
  private remainingHints: number
  private fogDiscoveryPoints: AreaPlaySession['fogDiscoveryPoints']
  private cameraViewMode: CameraViewMode

  constructor(
    private readonly onCluePanelChange: (clue: CluePanelData | null) => void,
    private readonly area: AreaDefinition,
    private readonly initialSession: AreaPlaySession,
    private readonly onSessionChange: (session: AreaPlaySession) => void,
    private effectiveStats: EffectivePlayerStats,
    initialCameraViewMode: CameraViewMode,
    private readonly onNearbyNpcChange: (npc: NpcDefinition | null) => void,
    private readonly onNpcDialogueChange: (npc: NpcDefinition | null) => void,
  ) {
    super('movement-prototype')
    this.remainingHints = initialSession.remainingHints
    this.fogDiscoveryPoints = initialSession.fogDiscoveryPoints
    this.cameraViewMode = initialCameraViewMode
  }

  create() {
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

    this.fogOfWar = new FogOfWar(
      this,
      this.area.width,
      this.area.height,
      this.initialSession.fogDiscoveryPoints,
      (points) => {
        this.fogDiscoveryPoints = points
      },
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
        }

        if (this.time.now - this.lastSessionUpdate >= 150) {
          this.lastSessionUpdate = this.time.now
          this.emitSessionState(x, y)
        }
      },
    )

    this.clueManager = new ClueManager(
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

    this.npcManager = new NpcManager(
      this,
      getNpcsForArea(this.area.id),
      this.onNearbyNpcChange,
      this.onNpcDialogueChange,
      (locked) => {
        this.npcPanelLocked = locked
        this.applyMovementLock()
      },
    )

    this.keyboardInput = new KeyboardInput(
      this,
      this.movementController,
      () => {
        if (this.interfaceLocked || this.cluePanelLocked || this.npcPanelLocked) return false
        return this.npcManager?.interactWithActiveNpc() || this.clueManager?.interactWithActiveClue()
      },
    )
    new PointerInput(
      this,
      this.movementController,
      (_pointer, gameObjects, worldPoint) => {
        if (this.interfaceLocked || this.cluePanelLocked || this.npcPanelLocked) return true
        if (this.npcManager?.handlePointerDown(worldPoint, gameObjects)) return true
        return this.clueManager?.handlePointerDown(worldPoint, gameObjects) ?? false
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

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.emitSessionState(player.x, player.y)
      this.onCluePanelChange(null)
      this.npcManager?.destroy()
      this.onNearbyNpcChange(null)
      this.scale.off(Phaser.Scale.Events.RESIZE, this.applyCameraZoom, this)
    })
  }

  update(_time: number, delta: number) {
    this.keyboardInput?.update()
    this.movementController?.update(delta)

    if (this.player) {
      this.npcManager?.setInteractionSuppressed(this.cluePanelLocked || this.interfaceLocked)
      this.npcManager?.update(this.player.x, this.player.y, this.effectiveStats.visionRadius)
      this.clueManager?.setInteractionSuppressed(
        this.npcPanelLocked || this.interfaceLocked || Boolean(this.npcManager?.hasActiveNpc()),
      )
      this.clueManager?.update(this.player.x, this.player.y)
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

  interactWithNpc() {
    return this.npcManager?.interactWithActiveNpc() ?? false
  }

  closeNpcDialogue() {
    this.npcManager?.closeOpenNpc()
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
      !this.cluePanelLocked && !this.npcPanelLocked && !this.interfaceLocked,
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
    renderEnvironment(this, this.area)
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
    return this.add.container(x, y, [shadow, cloak, scarf, head, satchel, direction]).setDepth(10)
  }
}
