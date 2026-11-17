import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const [canvas, dialogue, styles, packageJson, saveConfig] = await Promise.all([
  read('src/game/GameCanvas.tsx'), read('src/game/dialogue/DialoguePanel.tsx'),
  read('src/styles.css'), read('package.json'), read('src/game/save/config.ts'),
])

assert.match(canvas, /const \[selectedClueOptionId, setSelectedClueOptionId\] = useState\(''\)/)
assert.match(canvas, /<option value="">Pilih jawapan…<\/option>/)
assert.match(canvas, /openClue\.options\.map/)
assert.match(canvas, /disabled=\{openClue\.eliminatedOptionIds\.includes\(option\.id\)\}/)
assert.match(canvas, /openClue\?\.eliminatedOptionIds\.includes\(selectedClueOptionId\)[\s\S]*setSelectedClueOptionId\(''\)/)
assert.match(canvas, /const submitClueAnswer[\s\S]*answerClue\(selectedClueOptionId\)/)
assert.match(canvas, /disabled=\{openClue\.state === 'completed' \|\| !selectedClueOptionId\}/)
assert.match(canvas, /<details className="clue-panel__english">/)
assert.match(canvas, /getScene\(\)\?\.useHint\(\)/)
assert.match(dialogue, /npc-hall-keeper-n07c\.png/)
assert.match(dialogue, /hasApprovedPortrait = npc\.id === 'npc-penjaga-balai-ilmu'/)
assert.match(dialogue, /usesChoiceMenu = choices\.length > 4/)
assert.match(dialogue, /<option value="">Pilih pilihan…<\/option>/)
assert.match(dialogue, /onChoose\(selectedChoiceId\)/)
assert.match(dialogue, /choices\.length > 0 && !usesChoiceMenu/)
assert.match(dialogue, /aria-label=\{expanded \? 'Kecilkan dialog' : 'Besarkan dialog'\}/)
assert.match(dialogue, /aria-label="Tutup dialog"/)
assert.match(dialogue, /aria-label=\{node\.nextNodeId \? 'Teruskan' : 'Tamat Perbualan'\}/)
assert.match(styles, /\.dialogue-panel__portrait[\s\S]*background-size: 400% 400%/)
assert.match(styles, /\.dialogue-panel__choice-menu[\s\S]*min-height: 44px/)
assert.match(styles, /\.clue-panel__answer-field select[\s\S]*min-height: 44px/)
assert.match(styles, /\.clue-panel__actions[\s\S]*grid-template-columns: repeat\(3/)
assert.match(styles, /@media \(max-width: 32rem\)[\s\S]*dialogue-panel__choice-menu/)
assert.match(saveConfig, /SAVE_SCHEMA_VERSION = 3/)
assert.equal(JSON.parse(packageJson).scripts['n08c:verify'], 'node scripts/verify-n08c-jrpg-interface.mjs')

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { QUEST_DATA } = await server.ssrLoadModule('/src/game/quests/questData.ts')
  const { ALL_AREA_CLUES, AREA_DEFINITIONS } = await server.ssrLoadModule('/src/game/areas/areaRegistry.ts')
  const { QUESTION_BANK } = await server.ssrLoadModule('/src/game/questions/questionBank.ts')
  const { NPC_DEFINITIONS } = await server.ssrLoadModule('/src/game/npcs/npcData.ts')
  const { WORLD_OBJECT_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/worldObjectData.ts')
  const { LANDMARK_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/landmarkData.ts')
  assert.deepEqual([QUEST_DATA.length, ALL_AREA_CLUES.length, QUESTION_BANK.length, AREA_DEFINITIONS.length, NPC_DEFINITIONS.length, WORLD_OBJECT_DEFINITIONS.length, LANDMARK_DEFINITIONS.length], [15, 21, 24, 3, 2, 6, 6])
} finally { await server.close() }

console.log('Verified N08-C explicit dropdown answer submission, hint elimination, completed review, English disclosure, approved Keeper portrait, compact long-choice quest menu, JRPG controls, responsive touch targets and protected 15/21/24/3/2/6/6/schema-3 invariants.')
