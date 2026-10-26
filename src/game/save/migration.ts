import { SAVE_SCHEMA_VERSION } from './config'
import { createSirahMastery } from '../mastery/SirahMastery'
import { ALL_AREA_CLUES, AREA_DEFINITIONS, BAZAR_LAMA_AREA_ID, KAMPUNG_ILMU_AREA_ID } from '../areas/areaRegistry'
import { QUESTION_BANK } from '../questions/questionBank'
import { createQuestSession } from '../quests/QuestManager'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function createDefaultAreaState(area: (typeof AREA_DEFINITIONS)[number]) {
  return {
    playerPosition: { ...area.spawn },
    clues: Object.fromEntries(area.clues.map((clue) => [clue.id, {
      state: 'hidden',
      lastAnswerWasIncorrect: false,
      incorrectAttemptOccurred: false,
      hintUsed: false,
      eliminatedOptionIds: [],
    }])),
    fogDiscoveryPoints: [],
  }
}

function appendMissingQuestionAssignments(assignments: unknown[]) {
  const next = [...assignments]
  const usedIds = new Set(next.map((assignment) =>
    isRecord(assignment) && isRecord(assignment.question) && typeof assignment.question.id === 'string'
      ? assignment.question.id
      : undefined,
  ).filter((id): id is string => Boolean(id)))

  for (let index = next.length; index < ALL_AREA_CLUES.length; index += 1) {
    const clue = ALL_AREA_CLUES[index]
    const question = QUESTION_BANK.find((candidate) =>
      candidate.topicId === clue.questionTopicId && !usedIds.has(candidate.id),
    )
    if (!question) break
    usedIds.add(question.id)
    const offset = (index % (question.options.length - 1)) + 1
    next.push({
      question,
      shuffledOptions: [...question.options.slice(offset), ...question.options.slice(0, offset)],
    })
  }

  return next
}

function normalizeCurrentSchemaSave(value: Record<string, unknown>) {
  const runState = value.runState
  if (!isRecord(runState)) return value
  const run = runState.area
  if (!isRecord(run)) return value
  const questionRun = run.questionRun
  const savedAreaStates = run.areaStates
  const savedQuests = run.quests
  if (!isRecord(questionRun) || !Array.isArray(questionRun.assignments) ||
      !isRecord(savedAreaStates) || !isRecord(savedQuests)) return value

  const areaStates = { ...savedAreaStates }
  AREA_DEFINITIONS.forEach((area) => {
    if (!isRecord(areaStates[area.id])) areaStates[area.id] = createDefaultAreaState(area)
  })

  const defaultQuests = createQuestSession()
  const savedQuestRecords = isRecord(savedQuests.quests) ? savedQuests.quests : {}
  return {
    ...value,
    runState: {
      ...runState,
      area: {
        ...run,
        questionRun: {
          ...questionRun,
          assignments: appendMissingQuestionAssignments(questionRun.assignments),
        },
        areaStates,
        quests: {
          ...savedQuests,
          quests: { ...defaultQuests.quests, ...savedQuestRecords },
        },
      },
    },
  }
}

export function migrateSave(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  let working = value as Record<string, unknown>
  let schemaVersion = working.schemaVersion
  if (schemaVersion === SAVE_SCHEMA_VERSION) return normalizeCurrentSchemaSave(working)

  if (schemaVersion === 1) {
    const legacy = working
    const runState = legacy.runState as Record<string, unknown> | undefined
    const area = runState?.area as Record<string, unknown> | undefined
    const clues = area?.clues as Record<string, unknown> | undefined
    const migratedClues = clues
      ? Object.fromEntries(Object.entries(clues).map(([id, clue]) => [id, {
          ...(clue as Record<string, unknown>),
          incorrectAttemptOccurred: false,
          hintUsed: false,
        }]))
      : clues
    working = {
      ...legacy,
      schemaVersion: 2,
      appVersion: '0.10.0',
      masteryState: createSirahMastery(),
      runState: runState ? { ...runState, area: area ? { ...area, clues: migratedClues } : area } : runState,
    }
    schemaVersion = 2
  }

  if (schemaVersion === 2) {
    const runState = working.runState as Record<string, unknown>
    const oldArea = runState.area as Record<string, unknown>
    const oldQuestionRun = oldArea.questionRun as { assignments?: Array<{ question?: { id?: string } }>; usedFallback?: boolean }
    const oldAssignments = oldQuestionRun.assignments ?? []
    const usedIds = new Set(oldAssignments.map((assignment) => assignment.question?.id).filter((id): id is string => typeof id === 'string'))
    const bazarAssignments = AREA_DEFINITIONS.find((area) => area.id === BAZAR_LAMA_AREA_ID)!.clues.map((clue, index) => {
      const question = QUESTION_BANK.find((candidate) => candidate.topicId === clue.questionTopicId && !usedIds.has(candidate.id))!
      usedIds.add(question.id)
      const shuffledOptions = [...question.options.slice(index + 1), ...question.options.slice(0, index + 1)]
      return { question, shuffledOptions }
    })
    const defaultQuests = createQuestSession()
    const oldQuestSession = oldArea.quests as Record<string, unknown>
    const oldQuestRecords = oldQuestSession.quests as Record<string, unknown>
    const bazarArea = AREA_DEFINITIONS.find((area) => area.id === BAZAR_LAMA_AREA_ID)!
    working = {
      ...working,
      schemaVersion: 3,
      appVersion: '0.11.0',
      runState: {
        ...runState,
        area: {
          questionRun: { assignments: [...oldAssignments, ...bazarAssignments], usedFallback: Boolean(oldQuestionRun.usedFallback) },
          areaStates: {
            [KAMPUNG_ILMU_AREA_ID]: { playerPosition: oldArea.playerPosition, clues: oldArea.clues, fogDiscoveryPoints: oldArea.fogDiscoveryPoints },
            [BAZAR_LAMA_AREA_ID]: {
              playerPosition: { ...bazarArea.spawn },
              clues: Object.fromEntries(bazarArea.clues.map((clue) => [clue.id, { state: 'hidden', lastAnswerWasIncorrect: false, incorrectAttemptOccurred: false, hintUsed: false, eliminatedOptionIds: [] }])),
              fogDiscoveryPoints: [],
            },
          },
          quests: { ...oldQuestSession, quests: { ...defaultQuests.quests, ...oldQuestRecords } },
          remainingHints: oldArea.remainingHints,
        },
      },
    }
  }
  return schemaVersion === SAVE_SCHEMA_VERSION
    ? normalizeCurrentSchemaSave(working)
    : working
}

