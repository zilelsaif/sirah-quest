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
  const { QUESTION_BANK } = await server.ssrLoadModule('/src/game/questions/questionBank.ts')
  const { getEligibleReviewQuestions, createReviewSession, answerReviewQuestion, advanceReviewSession } = await server.ssrLoadModule('/src/game/review/reviewEngine.ts')
  const { createSirahMastery, getTopicMastery } = await server.ssrLoadModule('/src/game/mastery/SirahMastery.ts')
  const { createAreaSession } = await server.ssrLoadModule('/src/game/session/createSession.ts')
  const { createPlayerProgression } = await server.ssrLoadModule('/src/game/progression/PlayerProgression.ts')
  const { saveManualGame, loadManualGame } = await server.ssrLoadModule('/src/game/save/SaveManager.ts')
  const { SAVE_SCHEMA_VERSION, MANUAL_SAVE_STORAGE_KEY } = await server.ssrLoadModule('/src/game/save/config.ts')
  const { QUEST_DATA } = await server.ssrLoadModule('/src/game/quests/questData.ts')
  const { ALL_AREA_CLUES } = await server.ssrLoadModule('/src/game/areas/areaRegistry.ts')
  const { WORLD_OBJECT_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/worldObjectData.ts')
  const { LANDMARK_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/landmarkData.ts')

  assert.equal(QUESTION_BANK.length, 24)
  assert.deepEqual(Object.fromEntries(['early-life', 'first-revelation', 'hijrah'].map((topicId) => [topicId, QUESTION_BANK.filter((question) => question.topicId === topicId).length])), { 'early-life': 8, 'first-revelation': 8, hijrah: 8 })
  const currentBank = await readFile(new URL('../src/game/questions/questionBank.ts', import.meta.url), 'utf8')
  const baselineBank = execFileSync('git', ['show', 'v0.26.0:src/game/questions/questionBank.ts'], { encoding: 'utf8' }).replaceAll('\r\n', '\n')
  const editorialBank = baselineBank
    .replace("option('abu-talib', 'Abu Talib', 'Abu Talib')", "option('abu-talib', 'Abu Talib bin Abdul Muttalib', 'Abu Talib ibn Abd al-Muttalib')")
    .replace("option('hamzah', 'Hamzah', 'Hamzah')", "option('hamzah', 'Hamzah bin Abdul Muttalib', 'Hamzah ibn Abd al-Muttalib')")
    .replace("option('abbas', 'Al-Abbas', 'Al-Abbas')", "option('abbas', 'Al-Abbas bin Abdul Muttalib', 'Al-Abbas ibn Abd al-Muttalib')")
    .replace("option('hira', 'Gua Hira', 'Cave of Hira')", 'option(\'hira\', "Gua Hira\'", "Cave of Hira\'")')
    .replace("text('Wahyu pertama diterima di Gua Hira berhampiran Makkah.', 'The first revelation was received in the Cave of Hira near Makkah.')", 'text("Wahyu pertama diterima di Gua Hira\' berhampiran Makkah.", "The first revelation was received in the Cave of Hira\' near Makkah.")')
  assert.equal(currentBank.replaceAll('\r\n', '\n'), editorialBank, 'Only the two owner-approved editorial corrections may differ from the released question bank')

  const mastery = createSirahMastery()
  const earlyQuestions = QUESTION_BANK.filter(({ topicId }) => topicId === 'early-life')
  mastery.questionRecords[earlyQuestions[0].id] = { bestScore: 8 }
  assert.deepEqual(getEligibleReviewQuestions(mastery).map(({ id }) => id), [earlyQuestions[0].id])
  assert.equal(getEligibleReviewQuestions(mastery, 'first-revelation').length, 0)
  assert.ok(!getEligibleReviewQuestions(mastery).some(({ id }) => id === earlyQuestions[1].id), 'Assigned or banked questions without a saved score must remain locked')
  const masteryBefore = structuredClone(mastery)
  const session = createReviewSession(mastery, 'early-life', () => 0)
  assert.ok(session); assert.equal(session.assignments.length, 1)
  const assignment = session.assignments[0]
  assert.deepEqual(new Set(assignment.shuffledOptions.map(({ id }) => id)), new Set(assignment.question.options.map(({ id }) => id)))
  assert.equal(session.answeredOptionId, null, 'No answer may be exposed before submission')
  const incorrectId = assignment.shuffledOptions.find(({ id }) => id !== assignment.question.correctOptionId).id
  const incorrect = answerReviewQuestion(session, incorrectId); assert.equal(incorrect.correctCount, 0); assert.equal(incorrect.answeredOptionId, incorrectId)
  assert.strictEqual(answerReviewQuestion(incorrect, assignment.question.correctOptionId), incorrect, 'Duplicate answer submission must be ignored')
  assert.equal(advanceReviewSession(session).complete, false, 'Unanswered review question must not advance')
  assert.equal(advanceReviewSession(incorrect).complete, true)
  const correctSession = createReviewSession(mastery, 'early-life', () => 0)
  const correct = answerReviewQuestion(correctSession, correctSession.assignments[0].question.correctOptionId); assert.equal(correct.correctCount, 1)
  assert.deepEqual(mastery, masteryBefore, 'Review must not alter authoritative Mastery')

  const run = createAreaSession(); const runBefore = structuredClone(run); const progression = createPlayerProgression(); const progressionBefore = structuredClone(progression)
  answerReviewQuestion(correctSession, correctSession.assignments[0].question.correctOptionId)
  assert.deepEqual(run, runBefore, 'Review must not alter clues, quests, assignments or landmarks'); assert.deepEqual(progression, progressionBefore, 'Review must not grant XP')
  assert.equal(getTopicMastery(mastery, 'early-life').covered, 1)

  const world = { currentLocationId: 'kampung-ilmu', visitedLocationIds: ['kampung-ilmu'], hasEnteredArea: true }
  const state = { mode: 'AREA_MAP', playerSession: { progression, run }, worldSession: world, masteryState: mastery }
  saveManualGame(state, 'Kampung Ilmu')
  mastery.questionRecords[earlyQuestions[1].id] = { bestScore: 10 }
  const restored = loadManualGame(); assert.equal(restored.status, 'loaded'); assert.deepEqual(restored.state.masteryState, masteryBefore); assert.deepEqual(getEligibleReviewQuestions(restored.state.masteryState).map(({ id }) => id), [earlyQuestions[0].id])
  assert.doesNotMatch(values.get(MANUAL_SAVE_STORAGE_KEY), /reviewSession|correctCount|answeredOptionId/, 'Review state must not persist')

  const clueManager = await readFile(new URL('../src/game/clues/ClueManager.ts', import.meta.url), 'utf8')
  const canvas = await readFile(new URL('../src/game/GameCanvas.tsx', import.meta.url), 'utf8')
  const masteryPanel = await readFile(new URL('../src/game/mastery/SirahMasteryPanel.tsx', import.meta.url), 'utf8')
  const reviewPanel = await readFile(new URL('../src/game/review/ReviewPanel.tsx', import.meta.url), 'utf8')
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.match(clueManager, /bm: 'Betul\. Petunjuk ini telah diselesaikan\.'/); assert.match(clueManager, /bm: 'Belum Tepat\./)
  assert.match(clueManager, /explanation: isCompleted \? question\.explanation : undefined/)
  assert.match(clueManager, /this\.openClue\.lastAnswerWasIncorrect = true/); assert.match(clueManager, /this\.openClue\.incorrectAttemptOccurred = true/)
  assert.match(canvas, /openClue\.state === 'completed' \? 'Teruskan' : 'Tutup'/)
  assert.match(masteryPanel, /Petunjuk selesai:/); assert.match(masteryPanel, /Soalan dengan rekod skor terbaik:/); assert.match(masteryPanel, /Cubaan yang belum diselesaikan tidak disimpan/)
  assert.match(reviewPanel, /disabled=\{answered\}/); assert.match(reviewPanel, /assignment\.question\.explanation\.bm/); assert.match(reviewPanel, /previousFocusRef/); assert.match(reviewPanel, /min-height|Ulang Kaji/)
  assert.match(app, /lazy\(\(\) => import\('\.\/game\/GameCanvas'\)/); assert.match(app, /lazy\(\(\) => import\('\.\/game\/review\/ReviewPanel'\)/); assert.doesNotMatch(app, /import \{ GameCanvas \}/)
  assert.ok(app.indexOf('if (manualDialog)') < app.indexOf('else if (isReviewOpen)') && app.indexOf('else if (isReviewOpen)') < app.indexOf('else if (isJournalOpen)'))
  assert.equal(QUEST_DATA.length, 15); assert.equal(ALL_AREA_CLUES.length, 21); assert.equal(WORLD_OBJECT_DEFINITIONS.length, 6); assert.equal(LANDMARK_DEFINITIONS.length, 6); assert.equal(SAVE_SCHEMA_VERSION, 3)
  execFileSync('git', ['diff', '--quiet', '--', 'releases'], { stdio: 'ignore' })
  console.log('Verified 24-question source with only the two owner-approved editorial corrections, authoritative eligibility/Mastery, isolated review scoring, feedback spoiler policy, manual rollback, Escape/focus safety, 15/21/6/6/schema-3 invariants and lazy loading.')
} finally { await server.close() }
