import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

const values = new Map()
let failWrites = false
globalThis.window = { localStorage: {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => { if (failWrites) throw new Error('quota'); values.set(key, String(value)) },
  removeItem: (key) => values.delete(key),
  key: (index) => [...values.keys()][index] ?? null,
  get length() { return values.size },
} }
const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })

try {
  const { QUEST_DATA, MAX_ACTIVE_QUESTS } = await server.ssrLoadModule('/src/game/quests/questData.ts')
  const { NPC_DEFINITIONS } = await server.ssrLoadModule('/src/game/npcs/npcData.ts')
  const { DIALOGUE_DEFINITIONS } = await server.ssrLoadModule('/src/game/dialogue/dialogueData.ts')
  const { acceptQuestWithResult, createQuestSession, setTrackedQuest } = await server.ssrLoadModule('/src/game/quests/QuestManager.ts')
  const { createAreaSession, getAllClueStates } = await server.ssrLoadModule('/src/game/session/createSession.ts')
  const { createPlayerProgression } = await server.ssrLoadModule('/src/game/progression/PlayerProgression.ts')
  const { createSirahMastery } = await server.ssrLoadModule('/src/game/mastery/SirahMastery.ts')
  const { saveGame, saveManualGame, loadManualGame } = await server.ssrLoadModule('/src/game/save/SaveManager.ts')
  const { SAVE_STORAGE_KEY, MANUAL_SAVE_STORAGE_KEY, SAVE_SCHEMA_VERSION } = await server.ssrLoadModule('/src/game/save/config.ts')
  const { ALL_AREA_CLUES } = await server.ssrLoadModule('/src/game/areas/areaRegistry.ts')
  const { QUESTION_BANK } = await server.ssrLoadModule('/src/game/questions/questionBank.ts')
  const { WORLD_OBJECT_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/worldObjectData.ts')

  const questLogSource = await readFile(new URL('../src/game/quests/QuestLog.tsx', import.meta.url), 'utf8')
  const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(questLogSource, /onAccept|Terima Quest|acceptQuest/)
  assert.match(questLogSource, /Terima misi ini melalui NPC/)
  assert.doesNotMatch(appSource, /handleAcceptQuest =|onAccept=/)

  assert.equal(QUEST_DATA.length, 15); assert.equal(ALL_AREA_CLUES.length, 21); assert.equal(QUESTION_BANK.length, 24); assert.equal(WORLD_OBJECT_DEFINITIONS.length, 6); assert.equal(SAVE_SCHEMA_VERSION, 3)
  const npcQuestIds = NPC_DEFINITIONS.flatMap(({ questIds }) => questIds)
  assert.equal(new Set(npcQuestIds).size, 15); assert.deepEqual(new Set(npcQuestIds), new Set(QUEST_DATA.map(({ id }) => id)))
  for (const npc of NPC_DEFINITIONS) {
    const dialogue = DIALOGUE_DEFINITIONS.find(({ id }) => id === npc.dialogueId)
    assert.ok(dialogue)
    npc.questIds.forEach((questId) => assert.ok(dialogue.nodes.some((node) => node.choices?.some((choice) => choice.action?.type === 'ACCEPT_QUEST' && choice.action.questId === questId))))
  }

  const clues = getAllClueStates(createAreaSession())
  let quests = createQuestSession(); const trackedBefore = 'quest-jejak-permulaan'; quests = { ...quests, trackedQuestId: trackedBefore }
  for (const questId of NPC_DEFINITIONS[0].questIds.slice(0, MAX_ACTIVE_QUESTS)) {
    const accepted = acceptQuestWithResult(quests, questId, clues); assert.equal(accepted.code, 'ACCEPTED'); assert.equal(accepted.session.trackedQuestId, trackedBefore); quests = accepted.session
  }
  assert.equal(acceptQuestWithResult(quests, NPC_DEFINITIONS[1].questIds[0], clues).code, 'ACTIVE_LIMIT_REACHED')
  assert.equal(acceptQuestWithResult(quests, NPC_DEFINITIONS[0].questIds[0], clues).code, 'QUEST_NOT_AVAILABLE')
  const tracked = setTrackedQuest({ ...createQuestSession(), quests: quests.quests }, NPC_DEFINITIONS[0].questIds[0]); assert.equal(tracked.trackedQuestId, NPC_DEFINITIONS[0].questIds[0])

  const state = { mode: 'AREA_MAP', playerSession: { progression: createPlayerProgression(), run: createAreaSession() }, worldSession: { currentLocationId: 'kampung-ilmu', visitedLocationIds: ['kampung-ilmu'], hasEnteredArea: true }, masteryState: createSirahMastery() }
  state.playerSession.run.quests = quests
  saveGame(state); const autosaveBefore = values.get(SAVE_STORAGE_KEY)
  const metadata = saveManualGame(state, 'Kampung Ilmu')
  assert.equal(values.get(SAVE_STORAGE_KEY), autosaveBefore); assert.ok(values.has(MANUAL_SAVE_STORAGE_KEY)); assert.equal(metadata.locationId, 'kampung-ilmu'); assert.equal(metadata.locationNameBM, 'Kampung Ilmu'); assert.equal(metadata.level, 1)
  const loaded = loadManualGame(); assert.equal(loaded.status, 'loaded'); assert.equal(loaded.state.mode, 'AREA_MAP'); assert.equal(loaded.state.worldSession.currentLocationId, 'kampung-ilmu'); assert.deepEqual(loaded.state.playerSession.run.quests, quests)
  assert.deepEqual(loadManualGame().state, loaded.state, 'Repeated loads must be stable')
  const refreshedRaw = values.get(MANUAL_SAVE_STORAGE_KEY); assert.ok(refreshedRaw); assert.equal(loadManualGame().status, 'loaded', 'Manual slot must survive a refresh-equivalent re-read')
  values.set(MANUAL_SAVE_STORAGE_KEY, '{bad json'); assert.equal(loadManualGame().status, 'corrupt'); assert.equal(values.get(SAVE_STORAGE_KEY), autosaveBefore)
  values.delete(MANUAL_SAVE_STORAGE_KEY); assert.equal(loadManualGame().status, 'empty')
  failWrites = true; assert.throws(() => saveManualGame(state, 'Kampung Ilmu')); failWrites = false; assert.equal(values.get(SAVE_STORAGE_KEY), autosaveBefore)

  assert.match(appSource, /addEventListener\('keydown', handleEscape, true\)/)
  assert.match(appSource, /event\.stopImmediatePropagation\(\)/)
  const priority = ['manualDialog', 'isResetConfirmOpen', 'isQuestLogOpen', 'isJournalOpen', 'isUpgradePanelOpen', 'isMasteryPanelOpen', 'levelUpNotification', 'isTutorialOpen']
  let last = -1; priority.forEach((token) => { const index = appSource.indexOf(`if (${token}`, last + 1); assert.ok(index > last, `${token} Escape priority missing`); last = index })
  assert.match(appSource, /restoreOverlayFocus/); assert.match(appSource, /manualDialog !== null/)
  assert.match(appSource, /key=\{gameInstanceKey\}/); assert.match(appSource, /lazy\(\(\) => import\('\.\/game\/GameCanvas'\)/)
  assert.match(appSource, /<BackgroundMusicPlayer \/>/)
  console.log('Verified NPC-only access for 15 quests, manual schema-3 save/load isolation and failures, single-layer Escape priority, focus/input restoration, 15/21/24/3/6 invariants, lazy loading and audio controls.')
} finally { await server.close() }
