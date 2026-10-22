import type { QuestionTopicId } from '../questions/types'

export interface QuestionMasteryRecord { bestScore: number }
export interface SirahMasteryState { questionRecords: Record<string, QuestionMasteryRecord> }
export interface MasterySummary {
  earned: number
  possible: number
  percentage: number
  covered: number
  total: number
}
export interface TopicMasterySummary extends MasterySummary { topicId: QuestionTopicId }

