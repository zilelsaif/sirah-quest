import type { BilingualText, QuestionOption, QuestionReviewStatus } from '../questions/types'

export type ClueState = 'hidden' | 'discovered' | 'completed'

export interface ClueDefinition {
  id: string
  title: string
  x: number
  y: number
  interactionRadius: number
  state: ClueState
}

export interface CluePanelData {
  id: string
  title: string
  state: ClueState
  questionId: string
  topicId: string
  difficulty: string
  prompt: BilingualText
  options: QuestionOption[]
  correctOptionId?: string
  explanation?: BilingualText
  feedback?: {
    tone: 'correct' | 'incorrect'
    message: BilingualText
  }
  reviewStatus: QuestionReviewStatus
}

export interface ClueCounts {
  total: number
  discovered: number
  completed: number
}

