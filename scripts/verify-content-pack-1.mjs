import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

const memory = new Map()
globalThis.window = {
  localStorage: {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, String(value)),
    removeItem: (key) => memory.delete(key),
    key: (index) => [...memory.keys()][index] ?? null,
    get length() { return memory.size },
  },
}

const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
const packQuestIds = [
  'quest-catatan-zaman-awal-pack-1',
  'quest-lembaran-ilmu-pack-1',
  'quest-jejak-perjalanan-pack-1',
]
const legacyQuestManifest = {
  'quest-jejak-permulaan': ['clue-1'],
  'quest-rahsia-wahyu-pertama': ['clue-2'],
  'quest-perjalanan-hijrah': ['clue-3'],
  'quest-jejak-bazar-lama': ['bazar-clue-1'],
  'quest-catatan-wahyu': ['bazar-clue-2'],
  'quest-laluan-musafir': ['bazar-clue-3'],
  'quest-khazanah-hikmah': ['library-clue-1'],
  'quest-catatan-permulaan-wahyu': ['library-clue-2'],
  'quest-jejak-perjalanan-library': ['library-clue-3'],
}

try {
  const { AREA_DEFINITIONS, ALL_AREA_CLUES, CONTENT_PACK_1_CLUE_IDS } = await server.ssrLoadModule('/src/game/areas/areaRegistry.ts')
  const { QUEST_DATA, MAX_ACTIVE_QUESTS } = await server.ssrLoadModule('/src/game/quests/questData.ts')
  const { createAreaSession, getAllClueStates } = await server.ssrLoadModule('/src/game/session/createSession.ts')
  const { acceptQuestWithResult, createQuestSession, setTrackedQuest, syncQuestProgress } = await server.ssrLoadModule('/src/game/quests/QuestManager.ts')
  const { QUESTION_BANK } = await server.ssrLoadModule('/src/game/questions/questionBank.ts')
  const { selectQuestionsForTopics } = await server.ssrLoadModule('/src/game/questions/questionSelection.ts')
  const { Pathfinder } = await server.ssrLoadModule('/src/game/navigation/Pathfinder.ts')
  const { resolveTrackedQuestNavigation } = await server.ssrLoadModule('/src/game/navigation/questNavigation.ts')
  const { selectJournalModel } = await server.ssrLoadModule('/src/game/journal/journalSelectors.ts')
  const { createSirahMastery } = await server.ssrLoadModule('/src/game/mastery/SirahMastery.ts')
  const { migrateSave } = await server.ssrLoadModule('/src/game/save/migration.ts')
  const { validateSavePayload } = await server.ssrLoadModule('/src/game/save/validation.ts')
  const { createPlayerProgression } = await server.ssrLoadModule('/src/game/progression/PlayerProgression.ts')
  const { NPC_DEFINITIONS } = await server.ssrLoadModule('/src/game/npcs/npcData.ts')

  assert.equal(packQuestIds.length, new Set(packQuestIds).size)
  assert.equal(CONTENT_PACK_1_CLUE_IDS.length, 6)
  assert.equal(new Set(CONTENT_PACK_1_CLUE_IDS).size, 6)
  assert.equal(new Set(QUEST_DATA.map((quest) => quest.id)).size, QUEST_DATA.length)
  assert.equal(new Set(ALL_AREA_CLUES.map((clue) => clue.id)).size, ALL_AREA_CLUES.length)
  assert.deepEqual(ALL_AREA_CLUES.slice(0, 9).map((clue) => clue.id), Object.values(legacyQuestManifest).flat(), 'Legacy assignment order must remain unchanged')
  assert.deepEqual(ALL_AREA_CLUES.slice(9).map((clue) => clue.id), [...CONTENT_PACK_1_CLUE_IDS])

  const packQuests = packQuestIds.map((id) => QUEST_DATA.find((quest) => quest.id === id))
  assert.ok(packQuests.every(Boolean))
  packQuests.forEach((quest) => {
    assert.equal(quest.type, 'side')
    assert.equal(quest.initialStatus, 'AVAILABLE')
    assert.equal(quest.objectives.length, 2)
    quest.objectives.forEach((objective) => {
      const area = AREA_DEFINITIONS.find((candidate) => candidate.id === objective.relatedAreaId)
      const clue = area?.clues.find((candidate) => candidate.id === objective.relatedClueId)
      assert.ok(clue, `${objective.id} must reference a configured clue`)
      assert.equal(clue.questionTopicId, quest.topicId, `${objective.id} must use the quest topic`)
    })
  })

  for (const [questId, clueIds] of Object.entries(legacyQuestManifest)) {
    const quest = QUEST_DATA.find((candidate) => candidate.id === questId)
    assert.deepEqual(quest?.objectives.map((objective) => objective.relatedClueId), clueIds, `${questId} changed unexpectedly`)
  }

  const run = selectQuestionsForTopics(QUESTION_BANK, ALL_AREA_CLUES.map((clue) => clue.questionTopicId), [], () => 0)
  assert.equal(run.assignments.length, 15)
  assert.equal(new Set(run.assignments.map((assignment) => assignment.question.id)).size, 15, 'Questions must remain unique within the run')
  run.assignments.forEach((assignment, index) => assert.equal(assignment.question.topicId, ALL_AREA_CLUES[index].questionTopicId))
  assert.equal(QUESTION_BANK.length, 24)

  for (const area of AREA_DEFINITIONS) {
    const pathfinder = new Pathfinder(area)
    for (const clue of area.clues.filter((candidate) => CONTENT_PACK_1_CLUE_IDS.includes(candidate.id))) {
      assert.ok(pathfinder.isPointWalkable(clue), `${clue.id} must not overlap collision geometry`)
      assert.ok(pathfinder.findPath(area.spawn, clue).length > 0, `${clue.id} must be reachable from spawn`)
    }
  }

  let questSession = createQuestSession()
  const emptyClues = getAllClueStates(createAreaSession())
  questSession = { ...questSession, trackedQuestId: 'quest-jejak-permulaan' }
  for (const questId of packQuestIds) {
    const result = acceptQuestWithResult(questSession, questId, emptyClues)
    assert.equal(result.code, 'ACCEPTED')
    assert.equal(result.session.trackedQuestId, 'quest-jejak-permulaan', 'Acceptance must not change tracking')
    questSession = result.session
  }
  assert.equal(Object.values(questSession.quests).filter((quest) => quest.status === 'ACTIVE').length, MAX_ACTIVE_QUESTS)
  assert.equal(acceptQuestWithResult(questSession, 'quest-jejak-permulaan', emptyClues).code, 'ACTIVE_LIMIT_REACHED')

  const earlyQuest = packQuests[0]
  const earlySession = createQuestSession()
  const earlyClues = { ...emptyClues }
  earlyClues[earlyQuest.objectives[1].relatedClueId] = { ...earlyClues[earlyQuest.objectives[1].relatedClueId], state: 'completed' }
  let acceptedEarly = acceptQuestWithResult(earlySession, earlyQuest.id, earlyClues).session
  assert.equal(acceptedEarly.quests[earlyQuest.id].objectives[earlyQuest.objectives[1].id], true, 'Pre-completed second objective must reconcile on acceptance')
  assert.equal(acceptedEarly.quests[earlyQuest.id].objectives[earlyQuest.objectives[0].id], false)
  earlyClues[earlyQuest.objectives[0].relatedClueId] = { ...earlyClues[earlyQuest.objectives[0].relatedClueId], state: 'completed' }
  acceptedEarly = syncQuestProgress(acceptedEarly, earlyClues)
  assert.equal(acceptedEarly.quests[earlyQuest.id].status, 'COMPLETED', 'Objectives must complete in either order')
  assert.strictEqual(syncQuestProgress(acceptedEarly, earlyClues), acceptedEarly, 'Repeated completion must be idempotent')

  const navSession = createAreaSession()
  navSession.quests = setTrackedQuest(acceptQuestWithResult(navSession.quests, earlyQuest.id, getAllClueStates(navSession)).session, earlyQuest.id)
  const hiddenNavigation = resolveTrackedQuestNavigation(navSession, earlyQuest.objectives[0].relatedAreaId)
  assert.equal(hiddenNavigation.status, 'unknown')
  assert.equal(hiddenNavigation.target?.position, undefined, 'Hidden clue coordinates must not be disclosed')
  const firstArea = AREA_DEFINITIONS.find((area) => area.id === earlyQuest.objectives[0].relatedAreaId)
  const firstClue = firstArea.clues.find((clue) => clue.id === earlyQuest.objectives[0].relatedClueId)
  navSession.areaStates[firstArea.id].clues[firstClue.id].state = 'discovered'
  navSession.areaStates[firstArea.id].fogDiscoveryPoints.push({ x: firstClue.x, y: firstClue.y, radius: 50 })
  const knownNavigation = resolveTrackedQuestNavigation(navSession, firstArea.id)
  assert.equal(knownNavigation.status, 'known')
  assert.deepEqual(knownNavigation.target.position, { x: firstClue.x, y: firstClue.y })

  const journalSession = createAreaSession()
  journalSession.quests = acceptQuestWithResult(journalSession.quests, earlyQuest.id, getAllClueStates(journalSession)).session
  const journal = selectJournalModel(journalSession, { currentLocationId: 'kampung-ilmu', visitedLocationIds: ['kampung-ilmu'], hasEnteredArea: true }, createSirahMastery())
  assert.ok(journal.quests.some((quest) => quest.id === earlyQuest.id && quest.totalObjectives === 2))
  assert.equal(journal.knowledge.length, 0, 'Uncompleted answers must not appear in the Journal')

  const current = createAreaSession()
  const legacyArea = structuredClone(current)
  legacyArea.questionRun.assignments = legacyArea.questionRun.assignments.slice(0, 9)
  for (const area of AREA_DEFINITIONS) {
    CONTENT_PACK_1_CLUE_IDS.forEach((id) => { delete legacyArea.areaStates[area.id].clues[id] })
  }
  packQuestIds.forEach((id) => { delete legacyArea.quests.quests[id] })
  const legacyPayload = {
    schemaVersion: 3,
    appVersion: '0.21.0',
    savedAt: new Date(0).toISOString(),
    playerProgression: createPlayerProgression(),
    masteryState: createSirahMastery(),
    runState: {
      mode: 'AREA_MAP',
      area: legacyArea,
      world: { currentLocationId: 'kampung-ilmu', visitedLocationIds: ['kampung-ilmu'], hasEnteredArea: true },
    },
  }
  const normalized = migrateSave(legacyPayload)
  const validated = validateSavePayload(normalized)
  assert.ok(validated, 'A valid v0.21 schema-3 save must normalize without migration')
  assert.equal(validated.runState.area.questionRun.assignments.length, 15)
  assert.ok(packQuestIds.every((id) => validated.runState.area.quests.quests[id].status === 'AVAILABLE'))
  assert.ok(CONTENT_PACK_1_CLUE_IDS.every((id) => getAllClueStates(validated.runState.area)[id].state === 'hidden'))

  const reset = createAreaSession()
  assert.equal(reset.questionRun.assignments.length, 15)
  assert.ok(CONTENT_PACK_1_CLUE_IDS.every((id) => getAllClueStates(reset)[id].state === 'hidden'))
  assert.ok(packQuestIds.every((id) => reset.quests.quests[id].status === 'AVAILABLE'))

  const npcQuestIds = NPC_DEFINITIONS.flatMap((npc) => npc.questIds)
  assert.ok(packQuestIds.every((id) => npcQuestIds.includes(id)), 'Every Pack 1 quest must have a consistent existing NPC association')

  const source = await readFile(new URL('../src/game/journal/journalSelectors.ts', import.meta.url), 'utf8')
  assert.match(source, /QUEST_DATA\.flatMap/)
  assert.match(source, /seenQuestionIds\.has\(question\.id\)/)
  assert.match(source, /state !== 'completed'/)

  console.log('Verified 3 Pack 1 quests, 6 reachable clues, 15 unique topic-correct assignments, multi-quest freedom, NPC/Journal/navigation integration and schema-3 save normalization.')
} finally {
  await server.close()
}
