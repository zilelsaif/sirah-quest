import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

const values = new Map()
let failReads = false
let failWrites = false
globalThis.window = { localStorage: {
  getItem: (key) => { if (failReads) throw new Error('read unavailable'); return values.get(key) ?? null },
  setItem: (key, value) => { if (failWrites) throw new Error('quota'); values.set(key, String(value)) },
  removeItem: (key) => values.delete(key),
  key: (index) => [...values.keys()][index] ?? null,
  get length() { return values.size },
} }

const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
try {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  const { QUESTION_BANK } = await server.ssrLoadModule('/src/game/questions/questionBank.ts')
  const { QUEST_DATA } = await server.ssrLoadModule('/src/game/quests/questData.ts')
  const { ALL_AREA_CLUES, AREA_REGISTRY } = await server.ssrLoadModule('/src/game/areas/areaRegistry.ts')
  const { WORLD_OBJECT_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/worldObjectData.ts')
  const { LANDMARK_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/landmarkData.ts')
  const { createAreaSession } = await server.ssrLoadModule('/src/game/session/createSession.ts')
  const { createPlayerProgression } = await server.ssrLoadModule('/src/game/progression/PlayerProgression.ts')
  const { createSirahMastery } = await server.ssrLoadModule('/src/game/mastery/SirahMastery.ts')
  const { saveGame, loadGameSave, saveManualGame, loadManualGame, createSavePayload } = await server.ssrLoadModule('/src/game/save/SaveManager.ts')
  const { SAVE_SCHEMA_VERSION, SAVE_APP_VERSION, SAVE_STORAGE_KEY, MANUAL_SAVE_STORAGE_KEY } = await server.ssrLoadModule('/src/game/save/config.ts')
  const { getEligibleReviewQuestions, createReviewSession, answerReviewQuestion } = await server.ssrLoadModule('/src/game/review/reviewEngine.ts')

  assert.equal(pkg.version, '0.29.0')
  assert.equal(SAVE_SCHEMA_VERSION, 3)
  assert.equal(SAVE_APP_VERSION, '0.29.0')
  assert.equal(QUEST_DATA.length, 15)
  assert.equal(ALL_AREA_CLUES.length, 21)
  assert.equal(QUESTION_BANK.length, 24)
  assert.equal(new Set(QUESTION_BANK.map(({ id }) => id)).size, 24)
  assert.deepEqual(Object.fromEntries(['early-life', 'first-revelation', 'hijrah'].map((topic) => [topic, QUESTION_BANK.filter(({ topicId }) => topicId === topic).length])), { 'early-life': 8, 'first-revelation': 8, hijrah: 8 })
  assert.equal(WORLD_OBJECT_DEFINITIONS.length, 6)
  assert.equal(LANDMARK_DEFINITIONS.length, 6)
  assert.equal(Object.keys(AREA_REGISTRY).length, 3)
  for (const question of QUESTION_BANK) {
    assert.ok(question.options.some(({ id }) => id === question.correctOptionId), `${question.id} correct option`)
    assert.ok(question.explanation.bm && question.explanation.en, `${question.id} bilingual explanation`)
    assert.equal(question.reviewStatus, 'pending-editorial-review')
  }
  const currentBank = await readFile(new URL('../src/game/questions/questionBank.ts', import.meta.url), 'utf8')
  const releasedBank = execFileSync('git', ['show', 'v0.27.0:src/game/questions/questionBank.ts'], { encoding: 'utf8' })
  assert.equal(currentBank.replaceAll('\r\n', '\n'), releasedBank.replaceAll('\r\n', '\n'), 'Original questions must remain byte-identical to v0.27.0')

  const state = { mode: 'AREA_MAP', playerSession: { progression: createPlayerProgression(), run: createAreaSession() }, worldSession: { currentLocationId: 'kampung-ilmu', visitedLocationIds: ['kampung-ilmu'], hasEnteredArea: true }, masteryState: createSirahMastery() }
  const payload = createSavePayload(state, '2026-01-01T00:00:00.000Z')
  assert.equal(payload.schemaVersion, 3); assert.equal(payload.appVersion, '0.29.0')
  saveGame(state); saveManualGame(state, 'Kampung Ilmu')
  assert.equal(loadGameSave().status, 'loaded'); assert.equal(loadManualGame().status, 'loaded')
  const autosaveBefore = values.get(SAVE_STORAGE_KEY); const manualBefore = values.get(MANUAL_SAVE_STORAGE_KEY)
  failReads = true
  assert.equal(loadGameSave().status, 'unavailable'); assert.equal(loadManualGame().status, 'unavailable')
  failReads = false
  assert.equal(values.get(SAVE_STORAGE_KEY), autosaveBefore); assert.equal(values.get(MANUAL_SAVE_STORAGE_KEY), manualBefore)
  failWrites = true
  assert.throws(() => saveGame(state)); assert.throws(() => saveManualGame(state, 'Kampung Ilmu'))
  failWrites = false

  const first = QUESTION_BANK[0]
  state.masteryState.questionRecords[first.id] = { bestScore: 8 }
  const eligible = getEligibleReviewQuestions(state.masteryState)
  assert.deepEqual(eligible.map(({ id }) => id), [first.id])
  const stateBefore = structuredClone(state)
  const review = createReviewSession(state.masteryState, first.topicId, () => 0)
  const answered = answerReviewQuestion(review, review.assignments[0].question.correctOptionId)
  assert.equal(answered.correctCount, 1); assert.deepEqual(state, stateBefore, 'Review scoring must remain session-only')

  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const navigation = await readFile(new URL('../src/game/navigation/ExplorationNavigation.tsx', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')
  const music = await readFile(new URL('../src/game/audio/BackgroundMusicPlayer.tsx', import.meta.url), 'utf8')
  assert.match(app, /lazy\(\(\) => import\('\.\/game\/GameCanvas'\)/)
  assert.match(app, /lazy\(\(\) => import\('\.\/game\/review\/ReviewPanel'\)/)
  assert.match(app, /addEventListener\('keydown', handleEscape, true\)/)
  const northStar = navigation.match(/<svg className="north-star"[\s\S]*?<\/svg>/)?.[0] ?? ''
  assert.ok(northStar); assert.doesNotMatch(northStar, /<text|>\s*(?:N|North|Utara)\s*</i)
  assert.match(styles, /\.north-star\s*\{[\s\S]*?pointer-events:\s*none;/)
  assert.match(music, /onClick=\{togglePlayback\}/); assert.match(music, /preload = 'none'/)
  execFileSync('git', ['diff', '--quiet', '--', 'releases'], { stdio: 'ignore' })
  console.log('Verified v0.28 pre-beta invariants: 15/21/24/3x8/6/6/3, schema-3 save recovery including read/write failures, immutable questions, isolated review, North Star, Escape, lazy loading, deferred audio and historical releases.')
} finally { await server.close() }
