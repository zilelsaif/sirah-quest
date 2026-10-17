import Phaser from 'phaser'
import type { ClueCounts, ClueDefinition, CluePanelData, ClueState } from './types'

interface ClueRuntime {
  definition: ClueDefinition
  state: ClueState
  visual: Phaser.GameObjects.Container
  marker: Phaser.GameObjects.Arc
}

export class ClueManager {
  private readonly clues: ClueRuntime[]
  private readonly interactionPrompt: Phaser.GameObjects.Text
  private activeClue?: ClueRuntime
  private openClue?: ClueRuntime

  constructor(
    private readonly scene: Phaser.Scene,
    clueData: ClueDefinition[],
    private readonly discoveryRadius: number,
    private readonly onPanelChange: (clue: CluePanelData | null) => void,
    private readonly onMovementLockChange: (locked: boolean) => void,
  ) {
    this.clues = clueData.map((definition) => this.createClue(definition))
    this.interactionPrompt = scene.add
      .text(0, 0, 'E / Tap: Open clue', {
        color: '#172033',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        backgroundColor: '#f4d58d',
        padding: { x: 9, y: 6 },
      })
      .setOrigin(0.5, 1)
      .setDepth(25)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
  }

  update(playerX: number, playerY: number) {
    const playerPosition = new Phaser.Math.Vector2(playerX, playerY)

    this.clues.forEach((clue) => {
      if (
        clue.state === 'hidden' &&
        playerPosition.distance(new Phaser.Math.Vector2(clue.definition.x, clue.definition.y)) <=
          this.discoveryRadius
      ) {
        this.discoverClue(clue)
      }
    })

    if (this.openClue) {
      this.setActiveClue(undefined)
      return
    }

    const closestClue = this.clues
      .filter((clue) => clue.state !== 'hidden')
      .map((clue) => ({
        clue,
        distance: playerPosition.distance(
          new Phaser.Math.Vector2(clue.definition.x, clue.definition.y),
        ),
      }))
      .filter(({ clue, distance }) => distance <= clue.definition.interactionRadius)
      .sort((first, second) => first.distance - second.distance)[0]?.clue

    this.setActiveClue(closestClue)
  }

  interactWithActiveClue() {
    if (!this.activeClue || this.openClue) return false

    this.openClue = this.activeClue
    this.setActiveClue(undefined)
    this.onMovementLockChange(true)
    this.onPanelChange(this.toPanelData(this.openClue))
    return true
  }

  handlePointerDown(
    pointer: Phaser.Input.Pointer,
    gameObjects: Phaser.GameObjects.GameObject[],
  ) {
    if (!this.activeClue || this.openClue) return false

    const activeClueId = this.activeClue.definition.id
    const clickedActiveClue = gameObjects.some(
      (gameObject) => gameObject.getData('clueId') === activeClueId,
    )
    const clickedCluePosition = Phaser.Math.Distance.Between(
      pointer.worldX,
      pointer.worldY,
      this.activeClue.definition.x,
      this.activeClue.definition.y,
    ) <= 34
    const clickedPrompt = this.interactionPrompt
      .getBounds()
      .contains(pointer.worldX, pointer.worldY)

    return clickedActiveClue || clickedCluePosition || clickedPrompt
      ? this.interactWithActiveClue()
      : false
  }

  completeOpenClue() {
    if (!this.openClue) return

    this.openClue.state = 'completed'
    this.updateVisual(this.openClue)
    this.onPanelChange(this.toPanelData(this.openClue))
  }

  closeOpenClue() {
    if (!this.openClue) return

    this.openClue = undefined
    this.onMovementLockChange(false)
    this.onPanelChange(null)
  }

  getCounts(): ClueCounts {
    return {
      total: this.clues.length,
      discovered: this.clues.filter((clue) => clue.state !== 'hidden').length,
      completed: this.clues.filter((clue) => clue.state === 'completed').length,
    }
  }

  private createClue(definition: ClueDefinition) {
    const glow = this.scene.add.circle(0, 0, 26, 0xf4d58d, 0.15)
    const marker = this.scene.add
      .circle(0, 0, 15, 0xe0b44c)
      .setStrokeStyle(3, 0xfff1bd)
      .setInteractive({ useHandCursor: true })
    const symbol = this.scene.add
      .text(0, -1, '?', {
        color: '#172033',
        fontFamily: 'Georgia, serif',
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    const visual = this.scene.add
      .container(definition.x, definition.y, [glow, marker, symbol])
      .setDepth(8)
      .setVisible(definition.state !== 'hidden')

    marker.setData('clueId', definition.id)
    symbol.setData('clueId', definition.id).setInteractive({ useHandCursor: true })

    const clue = { definition, state: definition.state, visual, marker }
    this.updateVisual(clue)
    return clue
  }

  private discoverClue(clue: ClueRuntime) {
    clue.state = 'discovered'
    clue.visual.setVisible(true).setScale(0.4)
    this.scene.tweens.add({
      targets: clue.visual,
      scale: 1,
      duration: 260,
      ease: 'Back.Out',
    })

    const notice = this.scene.add
      .text(clue.definition.x, clue.definition.y - 36, 'Clue discovered', {
        color: '#fff4ca',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        backgroundColor: '#172033cc',
        padding: { x: 7, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(24)

    this.scene.tweens.add({
      targets: notice,
      y: notice.y - 18,
      alpha: 0,
      duration: 1200,
      onComplete: () => notice.destroy(),
    })
  }

  private setActiveClue(clue?: ClueRuntime) {
    this.activeClue = clue
    if (!clue) {
      this.interactionPrompt.setVisible(false).setData('clueId', undefined)
      return
    }

    this.interactionPrompt
      .setText(clue.state === 'completed' ? 'E / Tap: Review clue' : 'E / Tap: Open clue')
      .setPosition(clue.definition.x, clue.definition.y - 28)
      .setData('clueId', clue.definition.id)
      .setVisible(true)
  }

  private updateVisual(clue: ClueRuntime) {
    if (clue.state === 'completed') {
      clue.marker.setFillStyle(0x66c78b).setStrokeStyle(3, 0xd8ffe5)
    } else {
      clue.marker.setFillStyle(0xe0b44c).setStrokeStyle(3, 0xfff1bd)
    }
  }

  private toPanelData(clue: ClueRuntime): CluePanelData {
    return {
      id: clue.definition.id,
      title: clue.definition.title,
      text: clue.definition.text,
      state: clue.state,
    }
  }
}

