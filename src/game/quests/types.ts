import type { QuestionTopicId } from '../questions/types'

export type QuestType = 'main' | 'side' | 'repeatable'
export type QuestStatus = 'LOCKED' | 'AVAILABLE' | 'ACTIVE' | 'COMPLETED'

export interface QuestObjectiveDefinition {
  id: string
  type: 'complete-clue'
  relatedAreaId: string
  relatedClueId: string
}

export interface QuestDefinition {
  id: string
  type: QuestType
  titleBM: string
  titleEN: string
  descriptionBM: string
  descriptionEN: string
  areaIds: string[]
  topicId: QuestionTopicId
  objectives: QuestObjectiveDefinition[]
  prerequisiteQuestIds: string[]
  initialStatus: QuestStatus
  completionXP: number
}

export interface QuestProgressState {
  status: QuestStatus
  objectives: Record<string, boolean>
}

export interface QuestSessionState {
  quests: Record<string, QuestProgressState>
  acceptedQuestIds: string[]
  trackedQuestId: string | null
}

