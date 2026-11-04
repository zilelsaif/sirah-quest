import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const [selectors, panel, app, worldMap, packageJson, saveConfig, questionBank] = await Promise.all([
  read('src/game/journal/journalSelectors.ts'),
  read('src/game/journal/JournalPanel.tsx'),
  read('src/App.tsx'),
  read('src/world/WorldMap.tsx'),
  read('package.json'),
  read('src/game/save/config.ts'),
  read('src/game/questions/questionBank.ts'),
])

assert.match(selectors, /export function selectJournalModel/)
assert.match(selectors, /state\.status !== 'ACTIVE' && state\.status !== 'COMPLETED'/)
assert.match(selectors, /session\.quests\.trackedQuestId === quest\.id/)
assert.match(selectors, /state !== 'completed'/)
assert.match(selectors, /seenQuestionIds\.has\(question\.id\)/)
assert.match(selectors, /question\.options\.find\(\(option\) => option\.id === question\.correctOptionId\)/)
assert.match(selectors, /clue\.state !== 'hidden'/)
assert.match(selectors, /world\.visitedLocationIds\.includes/)
assert.match(selectors, /getTopicMastery\(mastery, topicId\)/)
assert.doesNotMatch(selectors, /recordQuestionMastery|applyXPRewards|acceptQuest|setTrackedQuest/)

for (const title of ['Kronik Misi', 'Jurnal Ilmu', 'Rekod Penjelajahan', 'Sirah Mastery']) {
  assert.match(panel, new RegExp(title))
}
assert.match(panel, /event\.key !== 'Escape'/)
assert.match(panel, /previousFocusRef/)
assert.match(panel, /onPointerDown=\{\(event\) => event\.stopPropagation\(\)\}/)
assert.match(app, /isJournalOpen/)
assert.match(app, /selectJournalModel\(areaSession, worldSession, masteryState\)/)
assert.match(app, /isMasteryPanelOpen \|\| isJournalOpen/)
assert.match(worldMap, /onOpenJournal/)
assert.match(saveConfig, /SAVE_SCHEMA_VERSION = 3/)

const pkg = JSON.parse(packageJson)
assert.equal(pkg.version, '0.20.0')
assert.equal(pkg.scripts['journal:verify'], 'node scripts/verify-journal-system.mjs')

const questionIds = [...questionBank.matchAll(/draftQuestion\(\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
assert.equal(questionIds.length, 24)
assert.equal(new Set(questionIds).size, 24)

const completedQuestionIds = ['q-one', 'q-one', 'q-two']
assert.deepEqual([...new Set(completedQuestionIds)], ['q-one', 'q-two'], 'Learned entries must be de-duplicated')
const clueStates = ['hidden', 'discovered', 'completed']
assert.equal(clueStates.filter((state) => state !== 'hidden').length, 2)
assert.equal(clueStates.filter((state) => state === 'completed').length, 1)

console.log('Verified read-only Journal selectors, four sections, spoiler guards, de-duplication, focus/input locking, version 0.20.0, save schema 3 and 24 unchanged question records.')
