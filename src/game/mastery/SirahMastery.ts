import { QUESTION_BANK } from '../questions/questionBank'
import type { QuestionTopicId } from '../questions/types'
import { MASTERY_BASE_CORRECT, MASTERY_BANDS, MASTERY_FIRST_ATTEMPT_BONUS, MASTERY_NO_HINT_BONUS, QUESTION_MASTERY_MAX } from './masteryConfig'
import type { MasterySummary, SirahMasteryState, TopicMasterySummary } from './types'

export function createSirahMastery(): SirahMasteryState { return { questionRecords: {} } }

export function calculateEncounterScore(incorrectAttemptOccurred: boolean, hintUsed: boolean) {
  return MASTERY_BASE_CORRECT + (incorrectAttemptOccurred ? 0 : MASTERY_FIRST_ATTEMPT_BONUS) + (hintUsed ? 0 : MASTERY_NO_HINT_BONUS)
}

export function recordQuestionMastery(state: SirahMasteryState, questionId: string, score: number): SirahMasteryState {
  if (!QUESTION_BANK.some((question) => question.id === questionId)) return state
  const safeScore = Math.max(0, Math.min(QUESTION_MASTERY_MAX, Math.round(score)))
  const previous = state.questionRecords[questionId]?.bestScore ?? 0
  if (safeScore <= previous) return state
  return { questionRecords: { ...state.questionRecords, [questionId]: { bestScore: safeScore } } }
}

function summarize(questionIds: readonly string[], state: SirahMasteryState): MasterySummary {
  const earned = questionIds.reduce((sum, id) => sum + (state.questionRecords[id]?.bestScore ?? 0), 0)
  const possible = questionIds.length * QUESTION_MASTERY_MAX
  return { earned, possible, percentage: possible ? Math.max(0, Math.min(100, Math.round(earned / possible * 100))) : 0, covered: questionIds.filter((id) => (state.questionRecords[id]?.bestScore ?? 0) > 0).length, total: questionIds.length }
}

export function getTopicMastery(state: SirahMasteryState, topicId: QuestionTopicId): TopicMasterySummary {
  return { topicId, ...summarize(QUESTION_BANK.filter((question) => question.topicId === topicId).map((question) => question.id), state) }
}
export function getOverallMastery(state: SirahMasteryState) { return summarize(QUESTION_BANK.map((question) => question.id), state) }
export function getMasteryBand(percentage: number) { return MASTERY_BANDS.find((band) => percentage >= band.min) ?? MASTERY_BANDS[MASTERY_BANDS.length - 1] }

