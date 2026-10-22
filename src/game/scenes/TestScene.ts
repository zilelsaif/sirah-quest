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

export class TestScene extends Phaser.Scene {
  private keyboardInput?: KeyboardInput
  private movementController?: MovementController
  private fogOfWar?: FogOfWar
  private player?: Phaser.GameObjects.Container
  private debugText?: Phaser.GameObjects.Text
  private clueManager?: ClueManager
  private lastSessionUpdate = 0
  private cluePanelLocked = false
  private interfaceLocked = false
  private remainingHints: number
  private fogDiscoveryPoints: AreaPlaySession['fogDiscoveryPoints']

  constructor(
    private readonly onCluePanelChange: (clue: CluePanelData | null) => void,
    private readonly area: AreaDefinition,
    private readonly initialSession: AreaPlaySession,
    private readonly onSessionChange: (session: AreaPlaySession) => void,
    private effectiveStats: EffectivePlayerStats,
  ) {
    super('movement-prototype')
    this.remainingHints = initialSession.remainingHints
    this.fogDiscoveryPoints = initialSession.fogDiscoveryPoints
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
      new Phaser.Geom.Rectangle(0, 0, this.area.width, this.area.height),
      this.area.obstacles.map((obstacle) => new Phaser.Geom.Rectangle(obstacle.x, obstacle.y, obstacle.width, obstacle.height)),
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

    this.keyboardInput = new KeyboardInput(
      this,
      this.movementController,
      () => this.clueManager?.interactWithActiveClue(),
    )
    new PointerInput(
      this,
      this.movementController,
      (pointer, gameObjects) => (
        this.clueManager?.handlePointerDown(pointer, gameObjects) ?? false
      ),
    )

    this.cameras.main.startFollow(player, true, 0.12, 0.12)
    this.cameras.main.setRoundPixels(true)

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
    })
  }

  update(_time: number, delta: number) {
    this.keyboardInput?.update()
    this.movementController?.update(delta)

    if (this.player) this.clueManager?.update(this.player.x, this.player.y)

    if (this.debugText && this.player) {
      const clueCounts = this.clueManager?.getCounts()
      this.debugText.setText([
        `speed  ${this.effectiveStats.movementSpeed}`,
        `area   ${this.area.id}`,
        `vision ${this.effectiveStats.visionRadius}`,
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

  private applyMovementLock() {
    this.movementController?.setEnabled(!this.cluePanelLocked && !this.interfaceLocked)
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
    this.add.rectangle(0, 0, this.area.width, this.area.height, this.area.backgroundColor).setOrigin(0)

    const grid = this.add.graphics().lineStyle(1, this.area.gridColor, 0.09)
    for (let x = 0; x <= this.area.width; x += 80) grid.lineBetween(x, 0, x, this.area.height)
    for (let y = 0; y <= this.area.height; y += 80) grid.lineBetween(0, y, this.area.width, y)

    this.area.obstacles.forEach((obstacle) => {
      this.add
        .rectangle(obstacle.x, obstacle.y, obstacle.width, obstacle.height, obstacle.color)
        .setOrigin(0)
        .setStrokeStyle(4, 0x172033, 0.65)
    })

    this.area.landmarks.forEach((landmark) => {
      if (landmark.type === 'circle') this.add.circle(landmark.x, landmark.y, landmark.size, landmark.color).setStrokeStyle(8, 0xc7e8e9, 0.5)
      else this.add.star(landmark.x, landmark.y, 8, landmark.size * 0.45, landmark.size, landmark.color).setStrokeStyle(5, 0xf4d58d, 0.5)
    })
  }

  private createPlayer(x: number, y: number) {
    const shadow = this.add.ellipse(0, 13, 40, 18, 0x000000, 0.25)
    const body = this.add.circle(0, 0, 18, 0xf4d58d).setStrokeStyle(4, 0x5b3a29)
    const direction = this.add.triangle(0, -17, -5, 7, 5, 7, 0, -5, 0xffffff)
    return this.add.container(x, y, [shadow, body, direction]).setDepth(10)
  }
}
