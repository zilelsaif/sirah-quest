import { CLUE_DATA } from '../clues/clueData'
import { getLevelForTotalXP } from '../progression/PlayerProgression'
import { MAX_LEVEL, UPGRADE_MAX_RANK } from '../progression/progressionConfig'
import { QUESTION_BANK } from '../questions/questionBank'
import { QUEST_DATA } from '../quests/questData'
import { WORLD_LOCATIONS } from '../../world/locationData'
import type { SavePayload } from './types'
import { SAVE_SCHEMA_VERSION } from './config'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isInt = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
const isFiniteRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
const uniqueStrings = (value: unknown, allowed?: Set<string>): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string' && (!allowed || allowed.has(item))) && new Set(value).size === value.length

export function validateSavePayload(value: unknown): SavePayload | null {
  if (!isRecord(value) || value.schemaVersion !== SAVE_SCHEMA_VERSION || typeof value.appVersion !== 'string' || typeof value.savedAt !== 'string') return null
  if (Number.isNaN(Date.parse(value.savedAt))) return null
  const progression = value.playerProgression
  const mastery = value.masteryState
  const runState = value.runState
  if (!isRecord(progression) || !isRecord(mastery) || !isRecord(mastery.questionRecords) || !isRecord(runState)) return null

  const questionIds = new Set(QUESTION_BANK.map(({ id }) => id))
  const questionRecords: SavePayload['masteryState']['questionRecords'] = {}
  for (const [questionId, record] of Object.entries(mastery.questionRecords)) {
    if (!questionIds.has(questionId)) continue
    if (!isRecord(record) || !isInt(record.bestScore, 0, 10)) return null
    questionRecords[questionId] = { bestScore: record.bestScore }
  }

  const totalXP = progression.totalXP
  const knownRewardIds = new Set([
    ...CLUE_DATA.map(({ id }) => `clue:${id}`),
    ...QUEST_DATA.map(({ id }) => `quest:${id}`),
  ])
  if (!isInt(totalXP, 0, 10_000_000) || progression.level !== getLevelForTotalXP(totalXP) || !isInt(progression.unspentUpgradePoints, 0, MAX_LEVEL - 1) || !uniqueStrings(progression.awardedXPEventIds, knownRewardIds) || !isInt(progression.movementSpeedRank, 0, UPGRADE_MAX_RANK) || !isInt(progression.visionRadiusRank, 0, UPGRADE_MAX_RANK) || !isInt(progression.hintCapacityRank, 0, UPGRADE_MAX_RANK)) return null

  if (runState.mode !== 'WORLD_MAP' && runState.mode !== 'AREA_MAP') return null
  const area = runState.area
  const world = runState.world
  if (!isRecord(area) || !isRecord(world)) return null
  if (!isRecord(area.playerPosition) || !isFiniteRange(area.playerPosition.x, 0, 1600) || !isFiniteRange(area.playerPosition.y, 0, 1200) || !isInt(area.remainingHints, 0, 100)) return null

  const clueIds = new Set(CLUE_DATA.map(({ id }) => id))
  if (!isRecord(area.clues) || Object.keys(area.clues).length !== clueIds.size) return null
  for (const clue of CLUE_DATA) {
    const saved = area.clues[clue.id]
    if (!isRecord(saved) || !['hidden', 'discovered', 'completed'].includes(String(saved.state)) || typeof saved.lastAnswerWasIncorrect !== 'boolean' || typeof saved.incorrectAttemptOccurred !== 'boolean' || typeof saved.hintUsed !== 'boolean' || !uniqueStrings(saved.eliminatedOptionIds)) return null
  }

  if (!isRecord(area.questionRun) || !Array.isArray(area.questionRun.assignments) || area.questionRun.assignments.length !== CLUE_DATA.length || typeof area.questionRun.usedFallback !== 'boolean') return null
  const seenQuestions = new Set<string>()
  const assignments = area.questionRun.assignments.map((assignment, index) => {
    if (!isRecord(assignment) || !isRecord(assignment.question) || typeof assignment.question.id !== 'string' || !Array.isArray(assignment.shuffledOptions)) return null
    const savedQuestionId = assignment.question.id
    const question = QUESTION_BANK.find(({ id }) => id === savedQuestionId)
    if (!question || question.topicId !== CLUE_DATA[index].questionTopicId || seenQuestions.has(question.id)) return null
    const optionIds = assignment.shuffledOptions.map((option) => isRecord(option) ? option.id : undefined)
    const expectedIds = new Set(question.options.map(({ id }) => id))
    if (optionIds.some((id) => typeof id !== 'string') || optionIds.length !== expectedIds.size || new Set(optionIds).size !== expectedIds.size || optionIds.some((id) => !expectedIds.has(id as string))) return null
    seenQuestions.add(question.id)
    return { question, shuffledOptions: optionIds.map((id) => question.options.find((option) => option.id === id)!) }
  })
  if (assignments.some((assignment) => assignment === null)) return null
  for (let index = 0; index < CLUE_DATA.length; index += 1) {
    const savedClue = area.clues[CLUE_DATA[index].id] as Record<string, unknown>
    const allowedOptionIds = new Set(
      (assignments[index] as NonNullable<(typeof assignments)[number]>).question.options.map(({ id }) => id),
    )
    if (!(savedClue.eliminatedOptionIds as string[]).every((id) => allowedOptionIds.has(id))) return null
  }

  if (!isRecord(area.quests) || !isRecord(area.quests.quests)) return null
  const questIds = new Set(QUEST_DATA.map(({ id }) => id))
  if (!uniqueStrings(area.quests.acceptedQuestIds, questIds) || (area.quests.trackedQuestId !== null && (typeof area.quests.trackedQuestId !== 'string' || !questIds.has(area.quests.trackedQuestId)))) return null
  const quests: Record<string, { status: 'LOCKED' | 'AVAILABLE' | 'ACTIVE' | 'COMPLETED'; objectives: Record<string, boolean> }> = {}
  for (const quest of QUEST_DATA) {
    const saved = area.quests.quests[quest.id]
    if (!isRecord(saved) || !['LOCKED', 'AVAILABLE', 'ACTIVE', 'COMPLETED'].includes(String(saved.status)) || !isRecord(saved.objectives)) return null
    const objectives: Record<string, boolean> = {}
    for (const objective of quest.objectives) {
      if (typeof saved.objectives[objective.id] !== 'boolean') return null
      objectives[objective.id] = saved.objectives[objective.id] as boolean
    }
    quests[quest.id] = { status: saved.status as 'LOCKED' | 'AVAILABLE' | 'ACTIVE' | 'COMPLETED', objectives }
  }

  if (!Array.isArray(area.fogDiscoveryPoints) || area.fogDiscoveryPoints.length > 2500) return null
  const fogDiscoveryPoints = area.fogDiscoveryPoints.map((point) => {
    if (!isRecord(point) || !isFiniteRange(point.x, 0, 1600) || !isFiniteRange(point.y, 0, 1200) || !isFiniteRange(point.radius, 1, 1000)) return null
    return { x: point.x, y: point.y, radius: point.radius }
  })
  if (fogDiscoveryPoints.some((point) => point === null)) return null

  const locationIds = new Set(WORLD_LOCATIONS.map(({ id }) => id))
  if (typeof world.currentLocationId !== 'string' || !locationIds.has(world.currentLocationId) || !uniqueStrings(world.visitedLocationIds, locationIds) || typeof world.hasEnteredArea !== 'boolean') return null

  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    appVersion: value.appVersion,
    savedAt: value.savedAt,
    playerProgression: progression as unknown as SavePayload['playerProgression'],
    masteryState: { questionRecords },
    runState: {
      mode: runState.mode,
      area: {
        questionRun: { assignments: assignments as NonNullable<(typeof assignments)[number]>[], usedFallback: area.questionRun.usedFallback },
        playerPosition: { x: area.playerPosition.x, y: area.playerPosition.y },
        clues: area.clues as SavePayload['runState']['area']['clues'],
        quests: { quests, acceptedQuestIds: area.quests.acceptedQuestIds, trackedQuestId: area.quests.trackedQuestId },
        remainingHints: area.remainingHints,
        fogDiscoveryPoints: fogDiscoveryPoints as SavePayload['runState']['area']['fogDiscoveryPoints'],
      },
      world: { currentLocationId: world.currentLocationId, visitedLocationIds: world.visitedLocationIds, hasEnteredArea: world.hasEnteredArea },
    },
  }
}

