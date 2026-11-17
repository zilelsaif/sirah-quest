import Phaser from 'phaser'
import { VISUAL_PALETTE } from '../visuals/visualTheme'
import type {
  WorldObjectDefinition,
  WorldObjectPanelData,
  WorldObjectSessionState,
  WorldObjectState,
} from './types'
import { applyWorldObjectInteraction } from './worldObjectRules'
import { attemptLandmarkDiscovery } from './landmarkDiscovery'
import { KAMPUNG_TEXTURES } from '../visuals/kampungEnvironmentManifest'

interface WorldObjectRuntime {
  definition: WorldObjectDefinition
  state: WorldObjectState
  visual: Phaser.GameObjects.Container
  stateShape: Phaser.GameObjects.GameObject
  glow?: Phaser.GameObjects.Arc
}

export class WorldObjectManager {
  private readonly objects: WorldObjectRuntime[]
  private readonly interactionPrompt: Phaser.GameObjects.Text
  private readonly feedbackText: Phaser.GameObjects.Text
  private activeObject?: WorldObjectRuntime
  private openObject?: WorldObjectRuntime
  private interactionSuppressed = false
  private lastInteractionAt = Number.NEGATIVE_INFINITY
  private playerX = Number.POSITIVE_INFINITY
  private playerY = Number.POSITIVE_INFINITY
  private readonly discoveredLandmarkIds: Set<string>

  constructor(
    private readonly scene: Phaser.Scene,
    definitions: readonly WorldObjectDefinition[],
    initialState: WorldObjectSessionState,
    private readonly onNearbyObjectChange: (object: WorldObjectDefinition | null) => void,
    private readonly onPanelChange: (object: WorldObjectPanelData | null) => void,
    private readonly onMovementLockChange: (locked: boolean) => void,
    private readonly onStateChange: (state: WorldObjectSessionState) => void,
    discoveredLandmarkIds: readonly string[] = [],
    private readonly onLandmarkDiscovered: (landmarkId: string) => void = () => undefined,
  ) {
    this.discoveredLandmarkIds = new Set(discoveredLandmarkIds)
    this.objects = definitions.map((definition) => this.createObject(definition, initialState[definition.id]))
    this.interactionPrompt = scene.add.text(0, 0, 'E / Tap: Interaksi', {
      color: '#fff7df', fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontStyle: 'bold',
      backgroundColor: '#66431fe6', padding: { x: 9, y: 6 },
    }).setOrigin(0.5, 1).setDepth(25).setVisible(false).setInteractive({ useHandCursor: true })
    this.feedbackText = scene.add.text(0, 0, '', {
      color: '#fff7df', fontFamily: 'system-ui, sans-serif', fontSize: '13px', fontStyle: 'bold',
      backgroundColor: '#172033dd', padding: { x: 8, y: 5 },
    }).setOrigin(0.5).setDepth(26).setVisible(false)
  }

  update(playerX: number, playerY: number, visionRadius: number) {
    this.playerX = playerX
    this.playerY = playerY
    const playerPosition = new Phaser.Math.Vector2(playerX, playerY)
    this.objects.forEach((object) => {
      const distance = playerPosition.distance(new Phaser.Math.Vector2(object.definition.position.x, object.definition.position.y))
      object.visual.setVisible(distance <= visionRadius)
    })
    if (this.openObject || this.interactionSuppressed) {
      this.setActiveObject(undefined)
      return
    }
    const closest = this.objects.map((object) => ({
      object,
      distance: playerPosition.distance(new Phaser.Math.Vector2(object.definition.position.x, object.definition.position.y)),
    })).filter(({ object, distance }) => object.visual.visible && distance <= object.definition.interactionRadius)
      .sort((left, right) => left.distance - right.distance)[0]?.object
    this.setActiveObject(closest)
  }

  setInteractionSuppressed(suppressed: boolean) {
    this.interactionSuppressed = suppressed
    if (suppressed) this.setActiveObject(undefined)
  }

  hasActiveObject() { return Boolean(this.activeObject) }

  interactWithActiveObject() {
    if (!this.activeObject || this.openObject || this.interactionSuppressed) return false
    const object = this.activeObject
    const now = this.scene.time.now
    const distance = Phaser.Math.Distance.Between(
      this.playerX, this.playerY, object.definition.position.x, object.definition.position.y,
    )
    const result = applyWorldObjectInteraction(object.definition, object.state, distance, now, this.lastInteractionAt)
    if (!result.accepted) return false
    this.lastInteractionAt = now
    if (object.definition.interactionType === 'INSPECT') {
      const discovery = attemptLandmarkDiscovery(
        [...this.discoveredLandmarkIds], object.definition, this.scene.registry.get('areaId') ?? object.definition.areaId,
        distance, object.visual.visible,
      )
      const isNewLandmark = discovery.newlyDiscovered
      if (isNewLandmark) {
        this.discoveredLandmarkIds.add(object.definition.id)
        this.onLandmarkDiscovered(object.definition.id)
      }
      this.openObject = object
      this.setActiveObject(undefined)
      this.onMovementLockChange(true)
      this.onPanelChange({
        id: object.definition.id,
        nameBM: object.definition.nameBM,
        nameEN: object.definition.nameEN,
        descriptionBM: object.definition.descriptionBM,
        descriptionEN: object.definition.descriptionEN,
        questContexts: object.definition.questContexts,
        discoveryNoticeBM: isNewLandmark ? `Lokasi Ditemui: ${object.definition.nameBM}` : undefined,
      })
      return true
    }
    object.state = result.nextState
    this.updateVisual(object)
    this.onStateChange(this.getSessionState())
    this.showFeedback(object, result.feedbackBM ?? '')
    return true
  }

  handlePointerDown(worldPoint: Phaser.Math.Vector2, gameObjects: Phaser.GameObjects.GameObject[]) {
    if (!this.activeObject || this.openObject || this.interactionSuppressed) return false
    const id = this.activeObject.definition.id
    const clickedObject = gameObjects.some((gameObject) => gameObject.getData('worldObjectId') === id)
    const clickedPosition = Phaser.Math.Distance.Between(
      worldPoint.x, worldPoint.y,
      this.activeObject.definition.position.x, this.activeObject.definition.position.y,
    ) <= 36
    const clickedPrompt = this.interactionPrompt.getBounds().contains(worldPoint.x, worldPoint.y)
    return clickedObject || clickedPosition || clickedPrompt ? this.interactWithActiveObject() : false
  }

  closeOpenObject() {
    if (!this.openObject) return
    this.openObject = undefined
    this.onMovementLockChange(false)
    this.onPanelChange(null)
  }

  getSessionState(): WorldObjectSessionState {
    return Object.fromEntries(this.objects.map((object) => [object.definition.id, object.state]))
  }

  destroy() {
    this.setActiveObject(undefined)
    this.onPanelChange(null)
  }

  private createObject(definition: WorldObjectDefinition, state = definition.initialState): WorldObjectRuntime {
    const shadow = this.scene.add.ellipse(0, 16, 46, 15, VISUAL_PALETTE.ink, 0.32)
    let stateShape: Phaser.GameObjects.GameObject
    let glow: Phaser.GameObjects.Arc | undefined
    const pieces: Phaser.GameObjects.GameObject[] = [shadow]
    const kampungTexture = definition.visualKey === 'notice-board' ? KAMPUNG_TEXTURES.noticeBoard
      : definition.visualKey === 'tool-chest' ? KAMPUNG_TEXTURES.toolChestClosed
        : definition.visualKey === 'old-well' ? KAMPUNG_TEXTURES.oldWell
          : definition.visualKey === 'reading-hut' ? KAMPUNG_TEXTURES.readingHut
            : undefined
    if (kampungTexture && this.scene.textures.exists(kampungTexture)) {
      const image = this.scene.add.image(0, 18, kampungTexture).setOrigin(0.5, 1)
      const targetWidth = definition.visualKey === 'reading-hut' ? 112
        : definition.visualKey === 'notice-board' ? 82 : 76
      image.setScale(targetWidth / image.width)
      stateShape = image
      shadow.setScale(definition.visualKey === 'reading-hut' ? 1.7 : 1.15)
      pieces.push(image)
    } else if (definition.visualKey.includes('chest')) {
      const body = this.scene.add.rectangle(0, 4, 38, 25, 0x8b5a2b).setStrokeStyle(3, VISUAL_PALETTE.softGold)
      const lid = this.scene.add.rectangle(0, -9, 38, 12, 0x6f451f).setStrokeStyle(3, VISUAL_PALETTE.ink)
      stateShape = lid
      pieces.push(body, lid)
    } else if (definition.visualKey === 'reading-lamp') {
      glow = this.scene.add.circle(0, -13, 28, VISUAL_PALETTE.gold, 0.08)
      const stand = this.scene.add.rectangle(0, 2, 5, 33, 0x59452f)
      const shade = this.scene.add.triangle(0, -16, -14, 11, 14, 11, 0, -8, 0xc18b32).setStrokeStyle(2, VISUAL_PALETTE.ink)
      stateShape = shade
      pieces.push(glow, stand, shade)
    } else if (definition.kind === 'landmark') {
      const base = this.scene.add.circle(0, 4, 25, VISUAL_PALETTE.deepTeal).setStrokeStyle(4, VISUAL_PALETTE.softGold)
      const symbolByVisual: Record<string, string> = {
        'old-well': '◉', 'reading-hut': '⌂', 'trade-gate': '⌘', 'caravan-corner': '◇', 'manuscript-table': '▤', 'map-corner': '✦',
      }
      const symbol = this.scene.add.text(0, 2, symbolByVisual[definition.visualKey] ?? '◆', {
        color: '#fff7df', fontSize: '23px', fontStyle: 'bold',
      }).setOrigin(0.5)
      stateShape = symbol
      pieces.push(base, symbol)
    } else if (definition.visualKey === 'reference-shelf') {
      const shelf = this.scene.add.rectangle(0, -1, 42, 48, 0x5d4635).setStrokeStyle(3, VISUAL_PALETTE.softGold)
      const books = this.scene.add.text(0, -2, '▥', { color: '#f4d58d', fontSize: '25px', fontStyle: 'bold' }).setOrigin(0.5)
      stateShape = books
      pieces.push(shelf, books)
    } else {
      const post = this.scene.add.rectangle(0, 11, 6, 34, 0x5d4635)
      const board = this.scene.add.rectangle(0, -10, 48, 29, 0x9a713d).setStrokeStyle(3, VISUAL_PALETTE.parchment)
      const mark = this.scene.add.text(0, -11, definition.visualKey === 'direction-board' ? '↔' : 'i', {
        color: '#172033', fontSize: '20px', fontStyle: 'bold',
      }).setOrigin(0.5)
      stateShape = mark
      pieces.push(post, board, mark)
    }
    const visual = this.scene.add.container(definition.position.x, definition.position.y, pieces).setDepth(7)
    pieces.forEach((piece) => piece.setData('worldObjectId', definition.id))
    visual.setData('worldObjectId', definition.id).setInteractive(
      new Phaser.Geom.Circle(0, 0, 34), Phaser.Geom.Circle.Contains,
    )
    const object = { definition, state, visual, stateShape, glow }
    this.updateVisual(object)
    return object
  }

  private updateVisual(object: WorldObjectRuntime) {
    if (object.definition.visualKey.includes('chest')) {
      if (object.stateShape instanceof Phaser.GameObjects.Image) {
        object.stateShape.setTexture(object.state === 'OPEN'
          ? KAMPUNG_TEXTURES.toolChestOpen
          : KAMPUNG_TEXTURES.toolChestClosed)
      } else {
        const lid = object.stateShape as Phaser.GameObjects.Rectangle
        lid.setPosition(0, object.state === 'OPEN' ? -19 : -9).setRotation(object.state === 'OPEN' ? -0.2 : 0)
      }
    }
    if (object.definition.visualKey === 'reading-lamp') {
      const shade = object.stateShape as Phaser.GameObjects.Triangle
      const on = object.state === 'ON'
      shade.setFillStyle(on ? 0xf6c85f : 0x725c3a)
      object.glow?.setFillStyle(VISUAL_PALETTE.gold, on ? 0.28 : 0.04)
    }
    object.visual.setData('worldObjectState', object.state)
  }

  private setActiveObject(object?: WorldObjectRuntime) {
    if (this.activeObject?.definition.id === object?.definition.id) return
    this.activeObject = object
    this.onNearbyObjectChange(object?.definition ?? null)
    if (!object) {
      this.interactionPrompt.setVisible(false).setData('worldObjectId', undefined)
      return
    }
    this.interactionPrompt.setText(`E / Tap: ${object.definition.nameBM}`)
      .setPosition(object.definition.position.x, object.definition.position.y - 42)
      .setData('worldObjectId', object.definition.id).setVisible(true)
  }

  private showFeedback(object: WorldObjectRuntime, message: string) {
    this.feedbackText.setText(message).setPosition(object.definition.position.x, object.definition.position.y - 58)
      .setAlpha(1).setVisible(true)
    this.scene.tweens.killTweensOf(this.feedbackText)
    const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    this.scene.tweens.add({
      targets: this.feedbackText, y: this.feedbackText.y - (reducedMotion ? 0 : 16), alpha: 0, duration: reducedMotion ? 1 : 900,
      onComplete: () => this.feedbackText.setVisible(false),
    })
  }
}
