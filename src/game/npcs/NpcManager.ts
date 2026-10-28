import Phaser from 'phaser'
import { createNpcVisual } from './NpcRenderer'
import type { NpcDefinition } from './types'

interface NpcRuntime {
  definition: NpcDefinition
  visual: Phaser.GameObjects.Container
}

export class NpcManager {
  private readonly npcs: NpcRuntime[]
  private readonly interactionPrompt: Phaser.GameObjects.Text
  private activeNpc?: NpcRuntime
  private openNpc?: NpcRuntime
  private interactionSuppressed = false

  constructor(
    scene: Phaser.Scene,
    definitions: readonly NpcDefinition[],
    private readonly onNearbyNpcChange: (npc: NpcDefinition | null) => void,
    private readonly onDialogueChange: (npc: NpcDefinition | null) => void,
    private readonly onMovementLockChange: (locked: boolean) => void,
  ) {
    this.npcs = definitions.map((definition) => ({
      definition,
      visual: createNpcVisual(scene, definition),
    }))
    this.interactionPrompt = scene.add.text(0, 0, 'E / Tap: Bercakap', {
      color: '#fff7df',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      backgroundColor: '#1f5f5be6',
      padding: { x: 9, y: 6 },
    })
      .setOrigin(0.5, 1)
      .setDepth(25)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
  }

  update(playerX: number, playerY: number, visionRadius: number) {
    const playerPosition = new Phaser.Math.Vector2(playerX, playerY)
    this.npcs.forEach((npc) => {
      const distance = playerPosition.distance(
        new Phaser.Math.Vector2(npc.definition.position.x, npc.definition.position.y),
      )
      npc.visual.setVisible(distance <= visionRadius)
    })

    if (this.openNpc || this.interactionSuppressed) {
      this.setActiveNpc(undefined)
      return
    }

    const closest = this.npcs
      .map((npc) => ({
        npc,
        distance: playerPosition.distance(
          new Phaser.Math.Vector2(npc.definition.position.x, npc.definition.position.y),
        ),
      }))
      .filter(({ npc, distance }) => npc.visual.visible && distance <= npc.definition.interactionRadius)
      .sort((first, second) => first.distance - second.distance)[0]?.npc

    this.setActiveNpc(closest)
  }

  setInteractionSuppressed(suppressed: boolean) {
    this.interactionSuppressed = suppressed
    if (suppressed) this.setActiveNpc(undefined)
  }

  hasActiveNpc() {
    return Boolean(this.activeNpc)
  }

  hasOpenNpc() {
    return Boolean(this.openNpc)
  }

  interactWithActiveNpc() {
    if (!this.activeNpc || this.openNpc || this.interactionSuppressed) return false
    this.openNpc = this.activeNpc
    this.setActiveNpc(undefined)
    this.onMovementLockChange(true)
    this.onDialogueChange(this.openNpc.definition)
    return true
  }

  handlePointerDown(
    worldPoint: Phaser.Math.Vector2,
    gameObjects: Phaser.GameObjects.GameObject[],
  ) {
    if (!this.activeNpc || this.openNpc || this.interactionSuppressed) return false
    const activeNpcId = this.activeNpc.definition.id
    const clickedNpc = gameObjects.some((gameObject) => gameObject.getData('npcId') === activeNpcId)
    const clickedPosition = Phaser.Math.Distance.Between(
      worldPoint.x,
      worldPoint.y,
      this.activeNpc.definition.position.x,
      this.activeNpc.definition.position.y,
    ) <= 34
    const clickedPrompt = this.interactionPrompt.getBounds().contains(worldPoint.x, worldPoint.y)
    return clickedNpc || clickedPosition || clickedPrompt ? this.interactWithActiveNpc() : false
  }

  closeOpenNpc() {
    if (!this.openNpc) return
    this.openNpc = undefined
    this.onMovementLockChange(false)
    this.onDialogueChange(null)
  }

  destroy() {
    this.setActiveNpc(undefined)
    this.onDialogueChange(null)
  }

  private setActiveNpc(npc?: NpcRuntime) {
    if (this.activeNpc?.definition.id === npc?.definition.id) return
    this.activeNpc = npc
    this.onNearbyNpcChange(npc?.definition ?? null)
    if (!npc) {
      this.interactionPrompt.setVisible(false).setData('npcId', undefined)
      return
    }
    this.interactionPrompt
      .setText(`E / Tap: ${npc.definition.nameBM}`)
      .setPosition(npc.definition.position.x, npc.definition.position.y - 42)
      .setData('npcId', npc.definition.id)
      .setVisible(true)
  }
}
