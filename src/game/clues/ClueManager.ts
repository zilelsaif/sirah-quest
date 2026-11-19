import Phaser from 'phaser'
import type { QuestionAssignment } from '../questions/types'
import type { ClueSessionState } from '../session/types'
import type { ClueCounts, ClueDefinition, ClueInspectionData, ClueOverlayData, CluePanelData, ClueState } from './types'
import { VISUAL_PALETTE } from '../visuals/visualTheme'
import { KAMPUNG_ILMU_AREA_ID } from '../areas/areaRegistry'
import { getKampungClueVisual } from './kampungClueVisualManifest'
import { kampungWorldDepth } from '../visuals/kampungEnvironmentManifest'

interface ClueRuntime {
  definition: ClueDefinition
  assignment: QuestionAssignment
  state: ClueState
  visual: Phaser.GameObjects.Container
  marker?: Phaser.GameObjects.Arc
  glow?: Phaser.GameObjects.Arc
  base?: Phaser.GameObjects.Ellipse
  symbol?: Phaser.GameObjects.Text
  physicalSprite?: Phaser.GameObjects.Image
  statusBadge?: Phaser.GameObjects.Container
  lastAnswerWasIncorrect: boolean
  incorrectAttemptOccurred: boolean
  hintUsed: boolean
  eliminatedOptionIds: string[]
}

export class ClueManager {
  private readonly clues: ClueRuntime[]
  private readonly interactionPrompt: Phaser.GameObjects.Text
  private activeClue?: ClueRuntime
  private openClue?: ClueRuntime
  private openStage?: 'inspection' | 'question'
  private interactionSuppressed = false

  constructor(
    private readonly scene: Phaser.Scene,
    clueData: ClueDefinition[],
    questionAssignments: QuestionAssignment[],
    private readonly discoveryRadius: number,
    private readonly onPanelChange: (clue: ClueOverlayData | null) => void,
    private readonly onMovementLockChange: (locked: boolean) => void,
    initialState: Record<string, ClueSessionState>,
    private readonly onStateChange: (state: Record<string, ClueSessionState>) => void,
  ) {
    if (clueData.length !== questionAssignments.length) {
      throw new Error('Every clue must receive exactly one question assignment')
    }

    this.clues = clueData.map((definition, index) =>
      this.createClue(definition, questionAssignments[index], initialState[definition.id]),
    )
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
      .setDepth(scene.registry.get('areaId') === KAMPUNG_ILMU_AREA_ID ? 80 : 25)
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

    if (this.openClue || this.interactionSuppressed) {
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
    if (!this.activeClue || this.openClue || this.interactionSuppressed) return false

    this.openClue = this.activeClue
    this.setActiveClue(undefined)
    this.onMovementLockChange(true)
    const usesPhysicalInspection =
      this.scene.registry.get('areaId') === KAMPUNG_ILMU_AREA_ID &&
      getKampungClueVisual(this.openClue.definition.id) !== undefined
    this.openStage = usesPhysicalInspection ? 'inspection' : 'question'
    this.onPanelChange(
      usesPhysicalInspection ? this.toInspectionData(this.openClue) : this.toPanelData(this.openClue),
    )
    return true
  }

  continueOpenClue() {
    if (!this.openClue || this.openStage !== 'inspection') return false
    this.openStage = 'question'
    this.onPanelChange(this.toPanelData(this.openClue))
    return true
  }

  handlePointerDown(
    worldPoint: Phaser.Math.Vector2,
    gameObjects: Phaser.GameObjects.GameObject[],
  ) {
    if (!this.activeClue || this.openClue || this.interactionSuppressed) return false

    const activeClueId = this.activeClue.definition.id
    const clickedActiveClue = gameObjects.some(
      (gameObject) => gameObject.getData('clueId') === activeClueId,
    )
    const clickedCluePosition = Phaser.Math.Distance.Between(
      worldPoint.x,
      worldPoint.y,
      this.activeClue.definition.x,
      this.activeClue.definition.y,
    ) <= 34
    const clickedPrompt = this.interactionPrompt
      .getBounds()
      .contains(worldPoint.x, worldPoint.y)

    return clickedActiveClue || clickedCluePosition || clickedPrompt
      ? this.interactWithActiveClue()
      : false
  }

  answerOpenClue(optionId: string) {
    if (!this.openClue || this.openStage !== 'question' || this.openClue.state === 'completed') return

    const isKnownOption = this.openClue.assignment.shuffledOptions.some(
      (option) => option.id === optionId && !this.openClue?.eliminatedOptionIds.includes(option.id),
    )
    if (!isKnownOption) return

    if (optionId === this.openClue.assignment.question.correctOptionId) {
      this.openClue.state = 'completed'
      this.openClue.lastAnswerWasIncorrect = false
      this.updateVisual(this.openClue)
    } else {
      this.openClue.lastAnswerWasIncorrect = true
      this.openClue.incorrectAttemptOccurred = true
    }

    this.onStateChange(this.getSessionState())
    this.onPanelChange(this.toPanelData(this.openClue))
  }

  useHint() {
    if (!this.openClue || this.openStage !== 'question' || this.openClue.state === 'completed') return false

    const incorrectOptions = this.openClue.assignment.shuffledOptions.filter(
      (option) =>
        option.id !== this.openClue?.assignment.question.correctOptionId &&
        !this.openClue?.eliminatedOptionIds.includes(option.id),
    )
    if (incorrectOptions.length <= 1) return false

    this.openClue.eliminatedOptionIds.push(incorrectOptions[0].id)
    this.openClue.hintUsed = true
    this.openClue.lastAnswerWasIncorrect = false
    this.onStateChange(this.getSessionState())
    this.onPanelChange(this.toPanelData(this.openClue))
    return true
  }

  closeOpenClue() {
    if (!this.openClue) return

    this.openClue = undefined
    this.openStage = undefined
    this.onMovementLockChange(false)
    this.onPanelChange(null)
  }

  setInteractionSuppressed(suppressed: boolean) {
    this.interactionSuppressed = suppressed
    if (suppressed) this.setActiveClue(undefined)
  }

  hasActiveClue() {
    return Boolean(this.activeClue)
  }

  getCounts(): ClueCounts {
    return {
      total: this.clues.length,
      discovered: this.clues.filter((clue) => clue.state !== 'hidden').length,
      completed: this.clues.filter((clue) => clue.state === 'completed').length,
    }
  }

  getSessionState(): Record<string, ClueSessionState> {
    return Object.fromEntries(
      this.clues.map((clue) => [
        clue.definition.id,
        {
          state: clue.state,
          lastAnswerWasIncorrect: clue.lastAnswerWasIncorrect,
          incorrectAttemptOccurred: clue.incorrectAttemptOccurred,
          hintUsed: clue.hintUsed,
          eliminatedOptionIds: [...clue.eliminatedOptionIds],
        },
      ]),
    )
  }

  private createClue(
    definition: ClueDefinition,
    assignment: QuestionAssignment,
    initialState?: ClueSessionState,
  ) {
    const physicalMetadata = this.scene.registry.get('areaId') === KAMPUNG_ILMU_AREA_ID
      ? getKampungClueVisual(definition.id)
      : undefined
    const usePhysicalVisual = Boolean(
      physicalMetadata && this.scene.textures.exists(physicalMetadata.textureKey),
    )
    let base: Phaser.GameObjects.Ellipse | undefined
    let glow: Phaser.GameObjects.Arc | undefined
    let marker: Phaser.GameObjects.Arc | undefined
    let symbol: Phaser.GameObjects.Text | undefined
    let physicalSprite: Phaser.GameObjects.Image | undefined
    let statusBadge: Phaser.GameObjects.Container | undefined
    const children: Phaser.GameObjects.GameObject[] = []

    if (physicalMetadata && usePhysicalVisual) {
      physicalSprite = this.scene.add.image(0, 0, physicalMetadata.textureKey)
        .setOrigin(...physicalMetadata.origin)
        .setScale(physicalMetadata.scale)
        .setData('clueId', definition.id)
        .setInteractive(new Phaser.Geom.Rectangle(
          physicalMetadata.alphaBounds.x,
          physicalMetadata.alphaBounds.y,
          physicalMetadata.alphaBounds.width,
          physicalMetadata.alphaBounds.height,
        ), Phaser.Geom.Rectangle.Contains)
      physicalSprite.input!.cursor = 'pointer'
      const badgeCircle = this.scene.add.circle(0, 0, 9, VISUAL_PALETTE.softGold, 0.88)
        .setStrokeStyle(2, VISUAL_PALETTE.parchment, 0.9)
      const badgeSymbol = this.scene.add.text(0, -1, '✦', {
        color: '#fff7df', fontFamily: 'Georgia, serif', fontSize: '11px', fontStyle: 'bold',
      }).setOrigin(0.5)
      statusBadge = this.scene.add.container(20, -31, [badgeCircle, badgeSymbol])
      statusBadge.setData('badgeCircle', badgeCircle).setData('badgeSymbol', badgeSymbol)
      children.push(physicalSprite, statusBadge)
    } else {
      base = this.scene.add.ellipse(0, 13, 34, 13, VISUAL_PALETTE.ink, 0.38)
        .setStrokeStyle(2, VISUAL_PALETTE.softGold, 0.28)
      glow = this.scene.add.circle(0, -2, 27, VISUAL_PALETTE.softGold, 0.13)
      marker = this.scene.add.circle(0, -3, 15, VISUAL_PALETTE.gold)
        .setStrokeStyle(3, VISUAL_PALETTE.parchment)
        .setInteractive({ useHandCursor: true })
      symbol = this.scene.add.text(0, -4, '?', {
        color: '#172033', fontFamily: 'Georgia, serif', fontSize: '19px', fontStyle: 'bold',
      }).setOrigin(0.5)
      marker.setData('clueId', definition.id)
      symbol.setData('clueId', definition.id).setInteractive({ useHandCursor: true })
      children.push(base, glow, marker, symbol)
    }

    const visual = this.scene.add
      .container(definition.x, definition.y, children)
      .setDepth(this.scene.registry.get('areaId') === KAMPUNG_ILMU_AREA_ID
        ? kampungWorldDepth(definition.y) + 0.5
        : 8)
      .setVisible((initialState?.state ?? definition.state) !== 'hidden')

    const clue: ClueRuntime = {
      definition,
      assignment,
      state: initialState?.state ?? definition.state,
      visual,
      marker,
      glow,
      base,
      symbol,
      physicalSprite,
      statusBadge,
      lastAnswerWasIncorrect: initialState?.lastAnswerWasIncorrect ?? false,
      incorrectAttemptOccurred: initialState?.incorrectAttemptOccurred ?? false,
      hintUsed: initialState?.hintUsed ?? false,
      eliminatedOptionIds: [...(initialState?.eliminatedOptionIds ?? [])],
    }
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
      .setDepth(this.scene.registry.get('areaId') === KAMPUNG_ILMU_AREA_ID ? 80 : 24)

    this.scene.tweens.add({
      targets: notice,
      y: notice.y - 18,
      alpha: 0,
      duration: 1200,
      onComplete: () => notice.destroy(),
    })
    this.onStateChange(this.getSessionState())
  }

  private setActiveClue(clue?: ClueRuntime) {
    this.activeClue = clue
    if (!clue) {
      this.interactionPrompt.setVisible(false).setData('clueId', undefined)
      return
    }

    this.interactionPrompt
      .setText(clue.state === 'completed' ? 'E / Tap: Review clue' : 'E / Tap: Open clue')
      .setPosition(clue.definition.x, clue.definition.y - (clue.physicalSprite ? 48 : 28))
      .setData('clueId', clue.definition.id)
      .setVisible(true)
  }

  private updateVisual(clue: ClueRuntime) {
    if (clue.statusBadge) {
      const circle = clue.statusBadge.getData('badgeCircle') as Phaser.GameObjects.Arc
      const symbol = clue.statusBadge.getData('badgeSymbol') as Phaser.GameObjects.Text
      if (clue.state === 'completed') {
        circle.setFillStyle(VISUAL_PALETTE.success, 0.92)
        symbol.setText('✓')
      } else {
        circle.setFillStyle(VISUAL_PALETTE.softGold, 0.88)
        symbol.setText('✦')
      }
      clue.statusBadge.setVisible(clue.state !== 'hidden')
      return
    }
    if (clue.state === 'completed') {
      clue.marker?.setFillStyle(VISUAL_PALETTE.success).setStrokeStyle(3, VISUAL_PALETTE.parchment)
      clue.glow?.setFillStyle(VISUAL_PALETTE.success, 0.1)
      clue.base?.setStrokeStyle(2, VISUAL_PALETTE.success, 0.48)
      clue.symbol?.setText('✓').setColor('#fff7df')
    } else {
      clue.marker?.setFillStyle(VISUAL_PALETTE.gold).setStrokeStyle(3, VISUAL_PALETTE.parchment)
      clue.glow?.setFillStyle(VISUAL_PALETTE.softGold, 0.14)
      clue.base?.setStrokeStyle(2, VISUAL_PALETTE.softGold, 0.28)
      clue.symbol?.setText('?').setColor('#172033')
    }
  }

  private toInspectionData(clue: ClueRuntime): ClueInspectionData {
    const metadata = getKampungClueVisual(clue.definition.id)
    return {
      kind: 'inspection',
      id: clue.definition.id,
      state: clue.state === 'completed' ? 'completed' : 'discovered',
      title: clue.definition.title,
      physicalName: metadata?.name ?? { bm: clue.definition.title, en: clue.definition.title },
      inspect: metadata?.inspect ?? {
        bm: 'Petunjuk pembelajaran ini sedia untuk diperiksa.',
        en: 'This learning clue is ready to inspect.',
      },
      assetUrl: metadata?.assetUrl ?? '',
      assetStatus: 'PROTOTYPE_VISUAL_QA_PENDING',
    }
  }

  private toPanelData(clue: ClueRuntime): CluePanelData {
    const isCompleted = clue.state === 'completed'
    const question = clue.assignment.question

    return {
      kind: 'question',
      id: clue.definition.id,
      title: clue.definition.title,
      state: clue.state,
      questionId: question.id,
      topicId: question.topicId,
      difficulty: question.difficulty,
      prompt: question.prompt,
      options: clue.assignment.shuffledOptions,
      eliminatedOptionIds: [...clue.eliminatedOptionIds],
      canUseHint:
        !isCompleted &&
        clue.assignment.shuffledOptions.filter(
          (option) =>
            option.id !== question.correctOptionId &&
            !clue.eliminatedOptionIds.includes(option.id),
        ).length > 1,
      correctOptionId: isCompleted ? question.correctOptionId : undefined,
      explanation: isCompleted ? question.explanation : undefined,
      feedback: isCompleted
        ? {
            tone: 'correct',
            message: {
              bm: 'Betul. Petunjuk ini telah diselesaikan.',
              en: 'Correct! This clue is now complete.',
            },
          }
        : clue.lastAnswerWasIncorrect
          ? {
              tone: 'incorrect',
              message: {
                bm: 'Belum Tepat. Cuba lagi dan teliti setiap pilihan.',
                en: 'Not quite. Try again and consider each choice carefully.',
              },
            }
          : undefined,
      reviewStatus: question.reviewStatus,
    }
  }
}

