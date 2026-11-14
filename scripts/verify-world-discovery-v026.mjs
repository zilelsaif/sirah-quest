import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

const values = new Map()
globalThis.window = { localStorage: {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: (key) => values.delete(key),
  key: (index) => [...values.keys()][index] ?? null,
  get length() { return values.size },
} }
const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })

try {
  const { LANDMARK_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/landmarkData.ts')
  const { WORLD_OBJECT_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/worldObjectData.ts')
  const { attemptLandmarkDiscovery } = await server.ssrLoadModule('/src/game/worldObjects/landmarkDiscovery.ts')
  const { AREA_DEFINITIONS, ALL_AREA_CLUES } = await server.ssrLoadModule('/src/game/areas/areaRegistry.ts')
  const { NPC_DEFINITIONS } = await server.ssrLoadModule('/src/game/npcs/npcData.ts')
  const { Pathfinder } = await server.ssrLoadModule('/src/game/navigation/Pathfinder.ts')
  const { createAreaSession } = await server.ssrLoadModule('/src/game/session/createSession.ts')
  const { selectJournalModel } = await server.ssrLoadModule('/src/game/journal/journalSelectors.ts')
  const { createSirahMastery } = await server.ssrLoadModule('/src/game/mastery/SirahMastery.ts')
  const { createPlayerProgression } = await server.ssrLoadModule('/src/game/progression/PlayerProgression.ts')
  const { createSavePayload, saveGame, loadGameSave, saveManualGame, loadManualGame } = await server.ssrLoadModule('/src/game/save/SaveManager.ts')
  const { migrateSave } = await server.ssrLoadModule('/src/game/save/migration.ts')
  const { validateSavePayload } = await server.ssrLoadModule('/src/game/save/validation.ts')
  const { SAVE_SCHEMA_VERSION, SAVE_STORAGE_KEY } = await server.ssrLoadModule('/src/game/save/config.ts')
  const { QUEST_DATA } = await server.ssrLoadModule('/src/game/quests/questData.ts')
  const { QUESTION_BANK } = await server.ssrLoadModule('/src/game/questions/questionBank.ts')

  assert.equal(LANDMARK_DEFINITIONS.length, 6)
  assert.equal(new Set(LANDMARK_DEFINITIONS.map(({ id }) => id)).size, 6)
  assert.equal(WORLD_OBJECT_DEFINITIONS.length, 6)
  assert.deepEqual(WORLD_OBJECT_DEFINITIONS.map(({ id, interactionType, initialState }) => ({ id, interactionType, initialState })), [
    { id: 'world-object-kampung-notice-board', interactionType: 'INSPECT', initialState: 'IDLE' },
    { id: 'world-object-kampung-tool-chest', interactionType: 'TOGGLE', initialState: 'CLOSED' },
    { id: 'world-object-bazar-direction-board', interactionType: 'INSPECT', initialState: 'IDLE' },
    { id: 'world-object-bazar-trade-chest', interactionType: 'TOGGLE', initialState: 'CLOSED' },
    { id: 'world-object-library-reference-shelf', interactionType: 'INSPECT', initialState: 'IDLE' },
    { id: 'world-object-library-reading-lamp', interactionType: 'TOGGLE', initialState: 'OFF' },
  ])
  AREA_DEFINITIONS.forEach((area) => assert.equal(LANDMARK_DEFINITIONS.filter(({ areaId }) => areaId === area.id).length, 2))

  for (const area of AREA_DEFINITIONS) {
    const pathfinder = new Pathfinder(area)
    const protectedPoints = [area.spawn, ...area.clues, ...WORLD_OBJECT_DEFINITIONS.filter(({ areaId }) => areaId === area.id).map(({ position }) => position), ...NPC_DEFINITIONS.filter(({ areaId }) => areaId === area.id).map(({ position }) => position)]
    for (const landmark of LANDMARK_DEFINITIONS.filter(({ areaId }) => areaId === area.id)) {
      assert.ok(pathfinder.isPointWalkable(landmark.position), `${landmark.id} overlaps collision geometry`)
      assert.ok(pathfinder.findPath(area.spawn, landmark.position).length > 0, `${landmark.id} is unreachable`)
      assert.ok(landmark.position.x >= 88 && landmark.position.x <= area.width - 88 && landmark.position.y >= 88 && landmark.position.y <= area.height - 88)
      protectedPoints.forEach((point) => assert.ok(Math.hypot(landmark.position.x - point.x, landmark.position.y - point.y) >= 100, `${landmark.id} lacks critical-object clearance`))
    }
  }

  const landmark = LANDMARK_DEFINITIONS[0]
  assert.equal(attemptLandmarkDiscovery([], landmark, landmark.areaId, 20, false).newlyDiscovered, false, 'Fog-hidden inspection must not discover')
  assert.equal(attemptLandmarkDiscovery([], landmark, landmark.areaId, 200, true).newlyDiscovered, false, 'Distant inspection must not discover')
  assert.equal(attemptLandmarkDiscovery([], landmark, 'wrong-area', 20, true).newlyDiscovered, false, 'Wrong-area inspection must not discover')
  const first = attemptLandmarkDiscovery([], landmark, landmark.areaId, 20, true); assert.equal(first.newlyDiscovered, true); assert.deepEqual(first.discoveredIds, [landmark.id])
  const repeat = attemptLandmarkDiscovery(first.discoveredIds, landmark, landmark.areaId, 20, true); assert.equal(repeat.newlyDiscovered, false); assert.deepEqual(repeat.discoveredIds, first.discoveredIds)

  const world = { currentLocationId: 'kampung-ilmu', visitedLocationIds: ['kampung-ilmu'], hasEnteredArea: true }
  const fresh = createAreaSession(); assert.deepEqual(fresh.discoveredLandmarkIds, [])
  let journal = selectJournalModel(fresh, world, createSirahMastery()); assert.equal(journal.landmarkDiscoveries.discovered, 0); assert.equal(journal.landmarkDiscoveries.total, 6)
  assert.ok(journal.landmarkDiscoveries.areas.flatMap(({ landmarks }) => landmarks).every((entry) => entry.nameBM === '???' && !('position' in entry)))
  fresh.discoveredLandmarkIds = [landmark.id]
  journal = selectJournalModel(fresh, world, createSirahMastery()); assert.equal(journal.landmarkDiscoveries.discovered, 1); assert.equal(journal.landmarkDiscoveries.areas[0].discovered, 1); assert.equal(journal.landmarkDiscoveries.areas[0].landmarks[0].descriptionBM, landmark.descriptionBM)

  const state = { mode: 'AREA_MAP', playerSession: { progression: createPlayerProgression(), run: fresh }, worldSession: world, masteryState: createSirahMastery() }
  saveGame(state); assert.deepEqual(loadGameSave().state.playerSession.run.discoveredLandmarkIds, [landmark.id], 'Autosave must restore discoveries')
  saveManualGame(state, 'Kampung Ilmu')
  state.playerSession.run.discoveredLandmarkIds = [landmark.id, LANDMARK_DEFINITIONS[1].id]
  assert.deepEqual(loadManualGame().state.playerSession.run.discoveredLandmarkIds, [landmark.id], 'Manual load must roll discovery back to its snapshot')

  const oldPayload = structuredClone(createSavePayload(state)); delete oldPayload.runState.area.discoveredLandmarkIds
  const oldValidated = validateSavePayload(migrateSave(oldPayload)); assert.ok(oldValidated); assert.deepEqual(oldValidated.runState.area.discoveredLandmarkIds, [])
  const duplicate = structuredClone(createSavePayload(state)); duplicate.runState.area.discoveredLandmarkIds = [landmark.id, landmark.id]; assert.equal(validateSavePayload(migrateSave(duplicate)), null)
  const unknown = structuredClone(createSavePayload(state)); unknown.runState.area.discoveredLandmarkIds = ['unknown']; assert.equal(validateSavePayload(migrateSave(unknown)), null)
  const invalid = structuredClone(createSavePayload(state)); invalid.runState.area.discoveredLandmarkIds = 'bad'; assert.equal(validateSavePayload(migrateSave(invalid)), null)
  values.set(SAVE_STORAGE_KEY, JSON.stringify(unknown)); assert.equal(loadGameSave().status, 'corrupt')

  assert.equal(QUEST_DATA.length, 15); assert.equal(ALL_AREA_CLUES.length, 21); assert.equal(QUESTION_BANK.length, 24); assert.equal(SAVE_SCHEMA_VERSION, 3)
  const managerSource = await readFile(new URL('../src/game/worldObjects/WorldObjectManager.ts', import.meta.url), 'utf8')
  const sceneSource = await readFile(new URL('../src/game/scenes/TestScene.ts', import.meta.url), 'utf8')
  const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.match(managerSource, /object\.visual\.setVisible\(distance <= visionRadius\)/)
  assert.match(sceneSource, /npcManager\?\.interactWithActiveNpc\(\) \|\|\s*this\.clueManager\?\.interactWithActiveClue\(\) \|\|\s*this\.worldObjectManager\?\.interactWithActiveObject\(\)/)
  assert.match(appSource, /lazy\(\(\) => import\('\.\/game\/GameCanvas'\)/)
  assert.doesNotMatch(appSource, /import \{ GameCanvas \}/)
  execFileSync('git', ['diff', '--quiet', '--', 'releases'], { stdio: 'ignore' })
  console.log('Verified 6 reachable landmarks, collision clearance, proximity/fog/idempotent discovery, spoiler-safe Journal records, schema-3 autosave/manual rollback, old-save defaults, corrupt-data rejection and unchanged 15/21/24/6 foundations.')
} finally { await server.close() }
