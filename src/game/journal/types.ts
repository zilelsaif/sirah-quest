import type { QuestStatus, QuestType } from '../quests/types'
import type { QuestionReviewStatus, QuestionTopicId } from '../questions/types'
import type { TopicMasterySummary } from '../mastery/types'

export interface JournalQuestEntry {
  id: string
  type: QuestType
  titleBM: string
  titleEN: string
  areaBM: string
  status: Extract<QuestStatus, 'ACTIVE' | 'COMPLETED'>
  tracked: boolean
  completedObjectives: number
  totalObjectives: number
  objectives: Array<{ id: string; completed: boolean }>
}

export interface JournalKnowledgeEntry {
  questionId: string
  topicId: QuestionTopicId
  promptBM: string
  promptEN: string
  answerBM: string
  answerEN: string
  explanationBM: string
  explanationEN: string
  reviewStatus: QuestionReviewStatus
  areaBM: string
  clueTitle: string
}

export interface JournalLegacyKnowledgeEntry {
  clueId: string
  areaBM: string
  clueTitle: string
}

export interface JournalExplorationEntry {
  areaId: string
  nameBM: string
  nameEN: string
  current: boolean
  visited: boolean
  discoveredClues: number
  completedClues: number
  totalClues: number
}

export interface JournalModel {
  quests: JournalQuestEntry[]
  knowledge: JournalKnowledgeEntry[]
  legacyKnowledge: JournalLegacyKnowledgeEntry[]
  exploration: JournalExplorationEntry[]
  mastery: TopicMasterySummary[]
}
