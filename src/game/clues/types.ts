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
  kind: 'question'
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

export interface ClueInspectionData {
  kind: 'inspection'
  id: string
  state: Exclude<ClueState, 'hidden'>
  title: string
  physicalName: BilingualText
  inspect: BilingualText
  assetUrl: string
  assetStatus: 'PROTOTYPE_VISUAL_QA_PENDING'
}

export type ClueOverlayData = CluePanelData | ClueInspectionData

export interface ClueCounts {
  total: number
  discovered: number
  completed: number
}

