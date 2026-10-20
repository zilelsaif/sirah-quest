import { QUESTION_BANK } from './questionBank'
import { selectQuestionsForTopics } from './questionSelection'
import type { QuestionRun, QuestionTopicId } from './types'

const PREVIOUS_RUN_STORAGE_KEY = 'sirah-quest.previous-question-ids.v1'

function readPreviousQuestionIds() {
  try {
    const storedValue = window.localStorage.getItem(PREVIOUS_RUN_STORAGE_KEY)
    if (!storedValue) return []

    const parsedValue: unknown = JSON.parse(storedValue)
    return Array.isArray(parsedValue)
      ? parsedValue.filter((value): value is string => typeof value === 'string')
      : []
  } catch {
    return []
  }
}

function rememberQuestionIds(questionIds: string[]) {
  try {
    window.localStorage.setItem(PREVIOUS_RUN_STORAGE_KEY, JSON.stringify(questionIds))
  } catch {
    // Selection still works when storage is unavailable; only cross-run avoidance is skipped.
  }
}

export function createQuestionRun(topicIds: readonly QuestionTopicId[]): QuestionRun {
  const run = selectQuestionsForTopics(QUESTION_BANK, topicIds, readPreviousQuestionIds())
  rememberQuestionIds(run.assignments.map(({ question }) => question.id))
  return run
}
