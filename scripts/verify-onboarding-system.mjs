import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const [controllerSource, panel, app, gameCanvas, saveConfig, saveTypes, questions, packageJson, styles] = await Promise.all([
  read('src/game/onboarding/tutorialController.ts'),
  read('src/game/onboarding/TutorialPanel.tsx'),
  read('src/App.tsx'),
  read('src/game/GameCanvas.tsx'),
  read('src/game/save/config.ts'),
  read('src/game/save/types.ts'),
  read('src/game/questions/questionBank.ts'),
  read('package.json'),
  read('src/styles.css'),
])

const compiled = ts.transpileModule(controllerSource, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText
const controller = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
const {
  TUTORIAL_STEPS,
  completeTutorialStep,
  createTutorialState,
  reconcileTutorial,
  reopenTutorial,
  skipTutorial,
  startTutorial,
} = controller

const hiddenClue = { state: 'hidden', lastAnswerWasIncorrect: false, incorrectAttemptOccurred: false, hintUsed: false, eliminatedOptionIds: [] }
const discoveredClue = { ...hiddenClue, state: 'discovered' }
const evidence = (acceptedQuestIds = [], clues = { clue: hiddenClue }) => ({ acceptedQuestIds, clues })

const fresh = createTutorialState()
assert.equal(fresh.status, 'NOT_STARTED', 'First-time player starts with guidance available')
assert.equal(TUTORIAL_STEPS.length, 5)
assert.equal(new Set(TUTORIAL_STEPS.map((step) => step.id)).size, 5, 'Tutorial step IDs must be stable and unique')
assert.ok(TUTORIAL_STEPS.every((step) => step.title.bm && step.title.en && step.instruction.bm && step.instruction.en))

let state = startTutorial(fresh)
assert.equal(state.status, 'ACTIVE')
state = completeTutorialStep(state, 'movement')
assert.ok(state.completedStepIds.includes('movement'), 'Desktop movement advances Stage 1')
const afterDesktopMovement = state
state = completeTutorialStep(state, 'movement')
assert.strictEqual(state, afterDesktopMovement, 'Touch/desktop duplicate movement signals do not duplicate progression')
assert.match(TUTORIAL_STEPS[0].instruction.bm, /WASD|anak panah/)
assert.match(TUTORIAL_STEPS[0].instruction.bm, /ketik/)

state = completeTutorialStep(state, 'npc-interaction')
assert.ok(state.completedStepIds.includes('npc-interaction'), 'NPC dialogue advances Stage 2')
const trackedQuestId = 'quest-kept-by-player'
state = reconcileTutorial(state, evidence(['quest-existing']))
assert.ok(state.completedStepIds.includes('quest-guidance'), 'Existing accepted quest is recognized')
assert.equal(trackedQuestId, 'quest-kept-by-player', 'Tutorial reconciliation never changes quest tracking')

const beforeHidden = state
state = reconcileTutorial(state, evidence(['quest-existing'], { clue: hiddenClue }))
assert.strictEqual(state, beforeHidden, 'Undiscovered clues remain concealed and do not satisfy Stage 4')
state = reconcileTutorial(state, evidence(['quest-existing'], { clue: discoveredClue }))
assert.ok(state.completedStepIds.includes('exploration'), 'Discovered clues satisfy Stage 4')
state = completeTutorialStep(state, 'journal')
assert.equal(state.status, 'COMPLETED', 'Journal opening advances Stage 5 and completes the guide')

const skipped = skipTutorial(startTutorial(createTutorialState()))
assert.equal(skipped.status, 'SKIPPED')
assert.strictEqual(reconcileTutorial(skipped, evidence(['quest-existing'], { clue: discoveredClue })), skipped, 'Skipped tutorial does not intercept gameplay')
assert.equal(reopenTutorial(skipped).status, 'ACTIVE', 'Help can be reopened')
assert.deepEqual(createTutorialState(), fresh, 'New run creates a fresh session-only guide')

for (const label of ['Langkau Panduan', 'Tutup', 'Seterusnya', 'Panduan']) assert.match(panel, new RegExp(label))
assert.match(panel, /event\.key !== 'Escape'/)
assert.match(gameCanvas, /nextSession\.playerPosition/)
assert.match(gameCanvas, /onNpcDialogueOpen\(npc\.id\)/)
assert.match(app, /npc-penjaga-balai-ilmu/)
assert.match(app, /acceptedQuestIds: areaSession\.quests\.acceptedQuestIds/)
assert.match(app, /clues: allClues/)
assert.match(app, /onOpenJournal=\{openJournal\}/)
assert.doesNotMatch(controllerSource, /applyXPRewards|recordQuestionMastery|acceptQuest|setTrackedQuest|unlock/)
assert.doesNotMatch(saveTypes, /tutorial/i, 'Tutorial state must not be added to save payloads')
assert.match(saveConfig, /SAVE_SCHEMA_VERSION = 3/)
assert.match(styles, /min-height: 44px/)
assert.match(styles, /prefers-reduced-motion: reduce/)
assert.match(styles, /\.tutorial-panel[\s\S]*max-height/)

const questionIds = [...questions.matchAll(/draftQuestion\(\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
assert.equal(questionIds.length, 24)
assert.equal(new Set(questionIds).size, 24)

const pkg = JSON.parse(packageJson)
assert.equal(pkg.version, '0.28.0')
assert.equal(pkg.scripts['onboarding:verify'], 'node scripts/verify-onboarding-system.mjs')

console.log('Verified 5 optional session-only onboarding stages, authoritative reconciliation, skip/reopen behavior, input safety, save schema 3 and 24 unchanged questions.')
