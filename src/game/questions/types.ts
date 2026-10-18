export type QuestionTopicId = 'early-life' | 'first-revelation' | 'hijrah'

export type QuestionDifficulty = 'introductory' | 'developing'

export type QuestionReviewStatus = 'pending-editorial-review' | 'approved' | 'needs-revision'

export interface BilingualText {
  bm: string
  en: string
}

export interface QuestionOption {
  id: string
  text: BilingualText
}

export interface SirahQuestion {
  id: string
  topicId: QuestionTopicId
  difficulty: QuestionDifficulty
  prompt: BilingualText
  options: QuestionOption[]
  correctOptionId: string
  explanation: BilingualText
  reviewStatus: QuestionReviewStatus
  sourceNotes?: string
}

export interface QuestionAssignment {
  question: SirahQuestion
  shuffledOptions: QuestionOption[]
}

export interface QuestionRun {
  assignments: QuestionAssignment[]
  usedFallback: boolean
}
