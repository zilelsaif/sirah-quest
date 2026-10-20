import type {
  QuestionAssignment,
  QuestionRun,
  QuestionTopicId,
  SirahQuestion,
} from './types'

export type RandomSource = () => number

function shuffle<T>(items: readonly T[], random: RandomSource): T[] {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }

  return result
}

export function validateQuestionBank(questionBank: readonly SirahQuestion[]) {
  const questionIds = new Set<string>()

  questionBank.forEach((question) => {
    if (questionIds.has(question.id)) throw new Error(`Duplicate question ID: ${question.id}`)
    questionIds.add(question.id)

    if (question.options.length < 2) {
      throw new Error(`Question ${question.id} needs at least two options`)
    }

    const optionIds = new Set(question.options.map((option) => option.id))
    if (optionIds.size !== question.options.length) {
      throw new Error(`Question ${question.id} contains duplicate option IDs`)
    }

    const correctMatches = question.options.filter(
      (option) => option.id === question.correctOptionId,
    ).length
    if (correctMatches !== 1) {
      throw new Error(`Question ${question.id} must have exactly one correct option`)
    }
  })
}

export function selectQuestionsForRun(
  questionBank: readonly SirahQuestion[],
  count: number,
  previousQuestionIds: readonly string[],
  random: RandomSource = Math.random,
): QuestionRun {
  validateQuestionBank(questionBank)

  if (count < 1 || count > questionBank.length) {
    throw new Error(`Cannot select ${count} questions from a bank of ${questionBank.length}`)
  }

  const previousIds = new Set(previousQuestionIds)
  const freshQuestions = shuffle(
    questionBank.filter((question) => !previousIds.has(question.id)),
    random,
  )
  const selected = freshQuestions.slice(0, count)
  const usedFallback = selected.length < count

  if (usedFallback) {
    const selectedIds = new Set(selected.map((question) => question.id))
    const fallbackQuestions = shuffle(
      questionBank.filter((question) => !selectedIds.has(question.id)),
      random,
    )
    selected.push(...fallbackQuestions.slice(0, count - selected.length))
  }

  const assignments: QuestionAssignment[] = selected.map((question) => ({
    question,
    shuffledOptions: shuffle(question.options, random),
  }))

  return { assignments, usedFallback }
}

export function selectQuestionsForTopics(
  questionBank: readonly SirahQuestion[],
  topicIds: readonly QuestionTopicId[],
  previousQuestionIds: readonly string[],
  random: RandomSource = Math.random,
): QuestionRun {
  validateQuestionBank(questionBank)

  const previousIds = new Set(previousQuestionIds)
  const selectedIds = new Set<string>()
  let usedFallback = false

  const assignments = topicIds.map((topicId) => {
    const topicQuestions = questionBank.filter(
      (question) => question.topicId === topicId && !selectedIds.has(question.id),
    )
    if (topicQuestions.length === 0) {
      throw new Error(`No unused questions are available for topic ${topicId}`)
    }

    const freshQuestions = topicQuestions.filter((question) => !previousIds.has(question.id))
    const candidates = freshQuestions.length > 0 ? freshQuestions : topicQuestions
    if (freshQuestions.length === 0) usedFallback = true

    const question = shuffle(candidates, random)[0]
    selectedIds.add(question.id)
    return { question, shuffledOptions: shuffle(question.options, random) }
  })

  return { assignments, usedFallback }
}
