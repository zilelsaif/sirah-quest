import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

const memory = new Map()
globalThis.window = { localStorage: { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: (key) => memory.delete(key), key: (index) => [...memory.keys()][index] ?? null, get length() { return memory.size } } }
const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
const questIds = ['quest-nota-balai-ilmu-pack-2', 'quest-jejak-lembaran-pack-2', 'quest-catatan-musafir-pack-2']
const priorQuestManifest = {
  'quest-jejak-permulaan': ['clue-1'], 'quest-rahsia-wahyu-pertama': ['clue-2'], 'quest-perjalanan-hijrah': ['clue-3'],
  'quest-jejak-bazar-lama': ['bazar-clue-1'], 'quest-catatan-wahyu': ['bazar-clue-2'], 'quest-laluan-musafir': ['bazar-clue-3'],
  'quest-khazanah-hikmah': ['library-clue-1'], 'quest-catatan-permulaan-wahyu': ['library-clue-2'], 'quest-jejak-perjalanan-library': ['library-clue-3'],
  'quest-catatan-zaman-awal-pack-1': ['pack1-kampung-catatan-awal', 'pack1-bazar-catatan-awal'],
  'quest-lembaran-ilmu-pack-1': ['pack1-kampung-lembaran-ilmu', 'pack1-library-lembaran-ilmu'],
  'quest-jejak-perjalanan-pack-1': ['pack1-bazar-jejak-perjalanan', 'pack1-library-jejak-perjalanan'],
}

try {
  const { AREA_DEFINITIONS, ALL_AREA_CLUES, CONTENT_PACK_1_CLUE_IDS, CONTENT_PACK_2_CLUE_IDS } = await server.ssrLoadModule('/src/game/areas/areaRegistry.ts')
  const { QUEST_DATA, MAX_ACTIVE_QUESTS } = await server.ssrLoadModule('/src/game/quests/questData.ts')
  const { QUESTION_BANK } = await server.ssrLoadModule('/src/game/questions/questionBank.ts')
  const { selectQuestionsForTopics } = await server.ssrLoadModule('/src/game/questions/questionSelection.ts')
  const { createAreaSession, getAllClueStates } = await server.ssrLoadModule('/src/game/session/createSession.ts')
  const { acceptQuestWithResult, createQuestSession, setTrackedQuest, syncQuestProgress } = await server.ssrLoadModule('/src/game/quests/QuestManager.ts')
  const { Pathfinder } = await server.ssrLoadModule('/src/game/navigation/Pathfinder.ts')
  const { resolveTrackedQuestNavigation } = await server.ssrLoadModule('/src/game/navigation/questNavigation.ts')
  const { selectJournalModel } = await server.ssrLoadModule('/src/game/journal/journalSelectors.ts')
  const { createSirahMastery } = await server.ssrLoadModule('/src/game/mastery/SirahMastery.ts')
  const { migrateSave } = await server.ssrLoadModule('/src/game/save/migration.ts')
  const { validateSavePayload } = await server.ssrLoadModule('/src/game/save/validation.ts')
  const { createPlayerProgression } = await server.ssrLoadModule('/src/game/progression/PlayerProgression.ts')
  const { NPC_DEFINITIONS } = await server.ssrLoadModule('/src/game/npcs/npcData.ts')
  const { WORLD_OBJECT_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/worldObjectData.ts')

  assert.equal(QUEST_DATA.length, 15); assert.equal(ALL_AREA_CLUES.length, 21); assert.equal(QUESTION_BANK.length, 24)
  assert.equal(new Set(questIds).size, 3); assert.equal(new Set(CONTENT_PACK_2_CLUE_IDS).size, 6)
  assert.equal(new Set(QUEST_DATA.map(({ id }) => id)).size, 15); assert.equal(new Set(ALL_AREA_CLUES.map(({ id }) => id)).size, 21)
  const priorOrder = [...Object.values(priorQuestManifest).slice(0, 9).flat(), ...CONTENT_PACK_1_CLUE_IDS]
  assert.deepEqual(ALL_AREA_CLUES.slice(0, 15).map(({ id }) => id), priorOrder)
  assert.deepEqual(ALL_AREA_CLUES.slice(15).map(({ id }) => id), [...CONTENT_PACK_2_CLUE_IDS])
  for (const [id, clues] of Object.entries(priorQuestManifest)) assert.deepEqual(QUEST_DATA.find((q) => q.id === id)?.objectives.map((o) => o.relatedClueId), clues)

  const quests = questIds.map((id) => QUEST_DATA.find((q) => q.id === id)); assert.ok(quests.every(Boolean))
  quests.forEach((quest) => {
    assert.equal(quest.type, 'side'); assert.equal(quest.initialStatus, 'AVAILABLE'); assert.equal(quest.objectives.length, 2)
    quest.objectives.forEach((objective) => {
      const area = AREA_DEFINITIONS.find(({ id }) => id === objective.relatedAreaId)
      const clue = area?.clues.find(({ id }) => id === objective.relatedClueId)
      assert.ok(clue); assert.equal(clue.questionTopicId, quest.topicId); assert.ok(quest.areaIds.includes(area.id))
    })
  })
  const run = selectQuestionsForTopics(QUESTION_BANK, ALL_AREA_CLUES.map(({ questionTopicId }) => questionTopicId), [], () => 0)
  assert.equal(run.assignments.length, 21); assert.equal(new Set(run.assignments.map(({ question }) => question.id)).size, 21)
  const topicCounts = Object.groupBy(run.assignments, ({ question }) => question.topicId)
  assert.deepEqual(Object.fromEntries(Object.entries(topicCounts).map(([id, rows]) => [id, rows.length])), { 'early-life': 7, 'first-revelation': 7, hijrah: 7 })
  run.assignments.forEach((a, index) => assert.equal(a.question.topicId, ALL_AREA_CLUES[index].questionTopicId))

  for (const area of AREA_DEFINITIONS) {
    const pathfinder = new Pathfinder(area)
    const protectedPoints = [area.spawn, ...AREA_DEFINITIONS.flatMap(() => []), ...area.clues.filter((c) => !CONTENT_PACK_2_CLUE_IDS.includes(c.id)), ...WORLD_OBJECT_DEFINITIONS.filter((o) => o.areaId === area.id).map((o) => o.position), ...NPC_DEFINITIONS.filter((n) => n.areaId === area.id).map((n) => n.position)]
    for (const clue of area.clues.filter((c) => CONTENT_PACK_2_CLUE_IDS.includes(c.id))) {
      assert.ok(clue.x >= 0 && clue.y >= 0 && clue.x <= area.width && clue.y <= area.height)
      assert.ok(pathfinder.isPointWalkable(clue), `${clue.id} overlaps collision`)
      assert.ok(pathfinder.findPath(area.spawn, clue).length > 0, `${clue.id} is unreachable`)
      protectedPoints.forEach((p) => assert.ok(Math.hypot(clue.x - p.x, clue.y - p.y) >= 100, `${clue.id} lacks interaction clearance`))
    }
  }

  let session = createQuestSession(); const empty = getAllClueStates(createAreaSession()); session = { ...session, trackedQuestId: 'quest-jejak-permulaan' }
  questIds.forEach((id) => { const result = acceptQuestWithResult(session, id, empty); assert.equal(result.code, 'ACCEPTED'); assert.equal(result.session.trackedQuestId, 'quest-jejak-permulaan'); session = result.session })
  assert.equal(Object.values(session.quests).filter(({ status }) => status === 'ACTIVE').length, MAX_ACTIVE_QUESTS)
  assert.equal(acceptQuestWithResult(session, 'quest-jejak-permulaan', empty).code, 'ACTIVE_LIMIT_REACHED')
  const first = quests[0]; const clues = structuredClone(empty); clues[first.objectives[1].relatedClueId].state = 'completed'
  let progress = acceptQuestWithResult(createQuestSession(), first.id, clues).session; assert.equal(progress.quests[first.id].objectives[first.objectives[1].id], true)
  clues[first.objectives[0].relatedClueId].state = 'completed'; progress = syncQuestProgress(progress, clues); assert.equal(progress.quests[first.id].status, 'COMPLETED'); assert.strictEqual(syncQuestProgress(progress, clues), progress)

  const areaSession = createAreaSession(); areaSession.quests = setTrackedQuest(acceptQuestWithResult(areaSession.quests, first.id, getAllClueStates(areaSession)).session, first.id)
  assert.equal(resolveTrackedQuestNavigation(areaSession, first.objectives[0].relatedAreaId).target?.position, undefined)
  const journal = selectJournalModel(areaSession, { currentLocationId: 'kampung-ilmu', visitedLocationIds: ['kampung-ilmu'], hasEnteredArea: true }, createSirahMastery())
  assert.ok(journal.quests.some((q) => q.id === first.id && q.totalObjectives === 2)); assert.equal(journal.knowledge.length, 0)

  const contexts = WORLD_OBJECT_DEFINITIONS.flatMap((o) => o.questContexts ?? [])
  assert.deepEqual(contexts.map(({ questId }) => questId).sort(), [...questIds].sort())
  assert.ok(WORLD_OBJECT_DEFINITIONS.filter((o) => o.questContexts?.length).every((o) => o.interactionType === 'INSPECT' && o.initialState === 'IDLE'))
  assert.ok(contexts.every((c) => !/\b\d{3,4}\b|correct|jawapan/i.test(`${c.textBM} ${c.textEN}`)))
  const npcIds = NPC_DEFINITIONS.flatMap(({ questIds: ids }) => ids); assert.ok(questIds.every((id) => npcIds.includes(id)))

  const legacy = createAreaSession(); legacy.questionRun.assignments = legacy.questionRun.assignments.slice(0, 15)
  AREA_DEFINITIONS.forEach((area) => CONTENT_PACK_2_CLUE_IDS.forEach((id) => delete legacy.areaStates[area.id].clues[id])); questIds.forEach((id) => delete legacy.quests.quests[id])
  const payload = { schemaVersion: 3, appVersion: '0.24.0', savedAt: new Date(0).toISOString(), playerProgression: createPlayerProgression(), masteryState: createSirahMastery(), runState: { mode: 'AREA_MAP', area: legacy, world: { currentLocationId: 'kampung-ilmu', visitedLocationIds: ['kampung-ilmu'], hasEnteredArea: true } } }
  const valid = validateSavePayload(migrateSave(payload)); assert.ok(valid); assert.equal(valid.schemaVersion, 3); assert.equal(valid.runState.area.questionRun.assignments.length, 21)
  assert.ok(questIds.every((id) => valid.runState.area.quests.quests[id].status === 'AVAILABLE')); assert.ok(CONTENT_PACK_2_CLUE_IDS.every((id) => getAllClueStates(valid.runState.area)[id].state === 'hidden'))
  const reset = createAreaSession(); assert.equal(reset.questionRun.assignments.length, 21); assert.ok(questIds.every((id) => reset.quests.quests[id].status === 'AVAILABLE'))
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'); assert.match(app, /lazy\(\(\) => import\('\.\/game\/GameCanvas'\)/); assert.doesNotMatch(app, /import \{ GameCanvas \}/)
  console.log('Verified Pack 2: 3 quests, 6 reachable clues, 21 unique topic-correct assignments, context/NPC/Journal/navigation safety, schema-3 v0.24 normalization, reset behavior and lazy loading.')
} finally { await server.close() }
