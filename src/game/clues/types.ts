import type {
  BilingualText,
  QuestionOption,
  QuestionReviewStatus,
  QuestionTopicId,
} from '../questions/types'

export type ClueState = 'hidden' | 'discovered' | 'completed'

export interface ClueDefinition {
  id: string
  title: string
  questionTopicId: QuestionTopicId
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
  eliminatedOptionIds: string[]
  canUseHint: boolean
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

