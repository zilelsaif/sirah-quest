import Phaser from 'phaser'
import type { QuestionAssignment } from '../questions/types'
import type { ClueSessionState } from '../session/types'
import type { ClueCounts, ClueDefinition, CluePanelData, ClueState } from './types'
import { VISUAL_PALETTE } from '../visuals/visualTheme'

interface ClueRuntime {
  definition: ClueDefinition
  assignment: QuestionAssignment
  state: ClueState
  visual: Phaser.GameObjects.Container
  marker: Phaser.GameObjects.Arc
  glow: Phaser.GameObjects.Arc
  base: Phaser.GameObjects.Ellipse
  symbol: Phaser.GameObjects.Text
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

  constructor(
    private readonly scene: Phaser.Scene,
    clueData: ClueDefinition[],
    questionAssignments: QuestionAssignment[],
    private readonly discoveryRadius: number,
    private readonly onPanelChange: (clue: CluePanelData | null) => void,
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
    this.onStateChange(this.getSessionState())
    this.onPanelChange(this.toPanelData(this.openClue))
    return true
  }

  handlePointerDown(
    worldPoint: Phaser.Math.Vector2,
    gameObjects: Phaser.GameObjects.GameObject[],
  ) {
    if (!this.activeClue || this.openClue) return false

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
    if (!this.openClue || this.openClue.state === 'completed') return

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
    if (!this.openClue || this.openClue.state === 'completed') return false

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
    const base = this.scene.add.ellipse(0, 13, 34, 13, VISUAL_PALETTE.ink, 0.38)
      .setStrokeStyle(2, VISUAL_PALETTE.softGold, 0.28)
    const glow = this.scene.add.circle(0, -2, 27, VISUAL_PALETTE.softGold, 0.13)
    const marker = this.scene.add
      .circle(0, -3, 15, VISUAL_PALETTE.gold)
      .setStrokeStyle(3, VISUAL_PALETTE.parchment)
      .setInteractive({ useHandCursor: true })
    const symbol = this.scene.add
      .text(0, -4, '?', {
        color: '#172033',
        fontFamily: 'Georgia, serif',
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    const visual = this.scene.add
      .container(definition.x, definition.y, [base, glow, marker, symbol])
      .setDepth(8)
      .setVisible((initialState?.state ?? definition.state) !== 'hidden')

    marker.setData('clueId', definition.id)
    symbol.setData('clueId', definition.id).setInteractive({ useHandCursor: true })

    const clue = {
      definition,
      assignment,
      state: initialState?.state ?? definition.state,
      visual,
      marker,
      glow,
      base,
      symbol,
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
      .setDepth(24)

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
      .setPosition(clue.definition.x, clue.definition.y - 28)
      .setData('clueId', clue.definition.id)
      .setVisible(true)
  }

  private updateVisual(clue: ClueRuntime) {
    if (clue.state === 'completed') {
      clue.marker.setFillStyle(VISUAL_PALETTE.success).setStrokeStyle(3, VISUAL_PALETTE.parchment)
      clue.glow.setFillStyle(VISUAL_PALETTE.success, 0.1)
      clue.base.setStrokeStyle(2, VISUAL_PALETTE.success, 0.48)
      clue.symbol.setText('✓').setColor('#fff7df')
    } else {
      clue.marker.setFillStyle(VISUAL_PALETTE.gold).setStrokeStyle(3, VISUAL_PALETTE.parchment)
      clue.glow.setFillStyle(VISUAL_PALETTE.softGold, 0.14)
      clue.base.setStrokeStyle(2, VISUAL_PALETTE.softGold, 0.28)
      clue.symbol.setText('?').setColor('#172033')
    }
  }

  private toPanelData(clue: ClueRuntime): CluePanelData {
    const isCompleted = clue.state === 'completed'
    const question = clue.assignment.question

    return {
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
              bm: 'Betul! Clue ini telah diselesaikan.',
              en: 'Correct! This clue is now complete.',
            },
          }
        : clue.lastAnswerWasIncorrect
          ? {
              tone: 'incorrect',
              message: {
                bm: 'Belum tepat. Cuba lagi dan teliti setiap pilihan.',
                en: 'Not quite. Try again and consider each choice carefully.',
              },
            }
          : undefined,
      reviewStatus: question.reviewStatus,
    }
  }
}

