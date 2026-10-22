import { ALL_AREA_CLUES, AREA_DEFINITIONS } from '../areas/areaRegistry'
import { getLevelForTotalXP } from '../progression/PlayerProgression'
import { MAX_LEVEL, UPGRADE_MAX_RANK } from '../progression/progressionConfig'
import { QUESTION_BANK } from '../questions/questionBank'
import { QUEST_DATA } from '../quests/questData'
import { WORLD_LOCATIONS } from '../../world/locationData'
import type { SavePayload } from './types'
import { SAVE_SCHEMA_VERSION } from './config'

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const isInt = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
const finite = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
const uniqueStrings = (value: unknown, allowed?: Set<string>): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string' && (!allowed || allowed.has(item))) && new Set(value).size === value.length

export function validateSavePayload(value: unknown): SavePayload | null {
  if (!isRecord(value) || value.schemaVersion !== SAVE_SCHEMA_VERSION || typeof value.appVersion !== 'string' || typeof value.savedAt !== 'string' || Number.isNaN(Date.parse(value.savedAt))) return null
  if (!isRecord(value.playerProgression) || !isRecord(value.masteryState) || !isRecord(value.masteryState.questionRecords) || !isRecord(value.runState)) return null
  const progression = value.playerProgression
  const totalXP = progression.totalXP
  const knownRewardIds = new Set([...ALL_AREA_CLUES.map(({ id }) => `clue:${id}`), ...QUEST_DATA.map(({ id }) => `quest:${id}`)])
  if (!isInt(totalXP, 0, 10_000_000) || progression.level !== getLevelForTotalXP(totalXP) || !isInt(progression.unspentUpgradePoints, 0, MAX_LEVEL - 1) || !uniqueStrings(progression.awardedXPEventIds, knownRewardIds) || !isInt(progression.movementSpeedRank, 0, UPGRADE_MAX_RANK) || !isInt(progression.visionRadiusRank, 0, UPGRADE_MAX_RANK) || !isInt(progression.hintCapacityRank, 0, UPGRADE_MAX_RANK)) return null
  const questionIds = new Set(QUESTION_BANK.map(({ id }) => id))
  const questionRecords: SavePayload['masteryState']['questionRecords'] = {}
  for (const [id, record] of Object.entries(value.masteryState.questionRecords)) {
    if (!questionIds.has(id)) continue
    if (!isRecord(record) || !isInt(record.bestScore, 0, 10)) return null
    questionRecords[id] = { bestScore: record.bestScore }
  }
  const runState = value.runState
  if ((runState.mode !== 'WORLD_MAP' && runState.mode !== 'AREA_MAP') || !isRecord(runState.area) || !isRecord(runState.world)) return null
  const run = runState.area
  if (!isInt(run.remainingHints, 0, 100) || !isRecord(run.questionRun) || !Array.isArray(run.questionRun.assignments) || run.questionRun.assignments.length !== ALL_AREA_CLUES.length || typeof run.questionRun.usedFallback !== 'boolean' || !isRecord(run.areaStates)) return null
  const seen = new Set<string>()
  const assignments = run.questionRun.assignments.map((assignment, index) => {
    if (!isRecord(assignment) || !isRecord(assignment.question) || typeof assignment.question.id !== 'string' || !Array.isArray(assignment.shuffledOptions)) return null
    const savedQuestionId = assignment.question.id
    const question = QUESTION_BANK.find(({ id }) => id === savedQuestionId)
    if (!question || question.topicId !== ALL_AREA_CLUES[index].questionTopicId || seen.has(question.id)) return null
    const optionIds = assignment.shuffledOptions.map((option) => isRecord(option) ? option.id : undefined)
    const allowed = new Set(question.options.map(({ id }) => id))
    if (optionIds.length !== allowed.size || optionIds.some((id) => typeof id !== 'string' || !allowed.has(id)) || new Set(optionIds).size !== allowed.size) return null
    seen.add(question.id)
    return { question, shuffledOptions: optionIds.map((id) => question.options.find((option) => option.id === id)!) }
  })
  if (assignments.some((assignment) => assignment === null)) return null
  const areaStates: SavePayload['runState']['area']['areaStates'] = {}
  for (const area of AREA_DEFINITIONS) {
    const state = run.areaStates[area.id]
    if (!isRecord(state) || !isRecord(state.playerPosition) || !isRecord(state.clues) || !Array.isArray(state.fogDiscoveryPoints)) return null
    const playerPosition = finite(state.playerPosition.x, 0, area.width) && finite(state.playerPosition.y, 0, area.height) ? { x: state.playerPosition.x, y: state.playerPosition.y } : { ...area.spawn }
    const clues: SavePayload['runState']['area']['areaStates'][string]['clues'] = {}
    for (const clue of area.clues) {
      const saved = state.clues[clue.id]
      if (!isRecord(saved) || !['hidden', 'discovered', 'completed'].includes(String(saved.state)) || typeof saved.lastAnswerWasIncorrect !== 'boolean' || typeof saved.incorrectAttemptOccurred !== 'boolean' || typeof saved.hintUsed !== 'boolean' || !uniqueStrings(saved.eliminatedOptionIds)) return null
      const assignmentIndex = ALL_AREA_CLUES.findIndex(({ id }) => id === clue.id)
      const allowedOptions = new Set((assignments[assignmentIndex]!).question.options.map(({ id }) => id))
      if (saved.eliminatedOptionIds.some((id) => !allowedOptions.has(id))) return null
      clues[clue.id] = saved as unknown as typeof clues[string]
    }
    if (state.fogDiscoveryPoints.length > 2500) return null
    const fogDiscoveryPoints = state.fogDiscoveryPoints.map((point) => isRecord(point) && finite(point.x, 0, area.width) && finite(point.y, 0, area.height) && finite(point.radius, 1, 1000) ? { x: point.x, y: point.y, radius: point.radius } : null)
    if (fogDiscoveryPoints.some((point) => point === null)) return null
    areaStates[area.id] = { playerPosition, clues, fogDiscoveryPoints: fogDiscoveryPoints as typeof areaStates[string]['fogDiscoveryPoints'] }
  }
  if (!isRecord(run.quests) || !isRecord(run.quests.quests)) return null
  const questIds = new Set(QUEST_DATA.map(({ id }) => id))
  if (!uniqueStrings(run.quests.acceptedQuestIds, questIds) || (run.quests.trackedQuestId !== null && (typeof run.quests.trackedQuestId !== 'string' || !questIds.has(run.quests.trackedQuestId)))) return null
  const quests: SavePayload['runState']['area']['quests']['quests'] = {}
  for (const quest of QUEST_DATA) {
    const saved = run.quests.quests[quest.id]
    if (!isRecord(saved) || !['LOCKED','AVAILABLE','ACTIVE','COMPLETED'].includes(String(saved.status)) || !isRecord(saved.objectives)) return null
    const objectives: Record<string, boolean> = {}
    for (const objective of quest.objectives) { if (typeof saved.objectives[objective.id] !== 'boolean') return null; objectives[objective.id] = saved.objectives[objective.id] as boolean }
    quests[quest.id] = { status: saved.status as 'LOCKED'|'AVAILABLE'|'ACTIVE'|'COMPLETED', objectives }
  }
  const locationIds = new Set(WORLD_LOCATIONS.map(({ id }) => id)); const world = runState.world
  if (typeof world.currentLocationId !== 'string' || !locationIds.has(world.currentLocationId) || !uniqueStrings(world.visitedLocationIds, locationIds) || typeof world.hasEnteredArea !== 'boolean') return null
  return { schemaVersion: SAVE_SCHEMA_VERSION, appVersion: value.appVersion, savedAt: value.savedAt, playerProgression: progression as unknown as SavePayload['playerProgression'], masteryState: { questionRecords }, runState: { mode: runState.mode, area: { questionRun: { assignments: assignments as NonNullable<(typeof assignments)[number]>[], usedFallback: run.questionRun.usedFallback }, areaStates, quests: { quests, acceptedQuestIds: run.quests.acceptedQuestIds, trackedQuestId: run.quests.trackedQuestId }, remainingHints: run.remainingHints }, world: { currentLocationId: world.currentLocationId, visitedLocationIds: world.visitedLocationIds, hasEnteredArea: world.hasEnteredArea } } }
}
