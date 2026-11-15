import { QUESTION_BANK } from '../questions/questionBank'
import { selectQuestionsForRun } from '../questions/questionSelection'
import type { QuestionAssignment, QuestionTopicId, SirahQuestion } from '../questions/types'
import type { SirahMasteryState } from '../mastery/types'

export interface ReviewSession {
  topicId: QuestionTopicId
  assignments: QuestionAssignment[]
  index: number
  answeredOptionId: string | null
  correctCount: number
  complete: boolean
}

export function getEligibleReviewQuestions(mastery: SirahMasteryState, topicId?: QuestionTopicId): SirahQuestion[] {
  return QUESTION_BANK.filter((question) => (!topicId || question.topicId === topicId) && (mastery.questionRecords[question.id]?.bestScore ?? 0) > 0)
}

export function createReviewSession(mastery: SirahMasteryState, topicId: QuestionTopicId, random: () => number = Math.random): ReviewSession | null {
  const eligible = getEligibleReviewQuestions(mastery, topicId)
  if (eligible.length === 0) return null
  return { topicId, assignments: selectQuestionsForRun(eligible, eligible.length, [], random).assignments, index: 0, answeredOptionId: null, correctCount: 0, complete: false }
}

export function answerReviewQuestion(session: ReviewSession, optionId: string): ReviewSession {
  if (session.complete || session.answeredOptionId !== null) return session
  const assignment = session.assignments[session.index]
  if (!assignment?.shuffledOptions.some((option) => option.id === optionId)) return session
  return { ...session, answeredOptionId: optionId, correctCount: session.correctCount + (optionId === assignment.question.correctOptionId ? 1 : 0) }
}

export function advanceReviewSession(session: ReviewSession): ReviewSession {
  if (session.complete || session.answeredOptionId === null) return session
  if (session.index >= session.assignments.length - 1) return { ...session, complete: true }
  return { ...session, index: session.index + 1, answeredOptionId: null }
}
