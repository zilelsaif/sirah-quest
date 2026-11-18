import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })

try {
  const engine = await server.ssrLoadModule('/src/game/dialogue/DialogueEngine.ts')
  const { createQuestSession } = await server.ssrLoadModule('/src/game/quests/QuestManager.ts')
  const { QUEST_DATA } = await server.ssrLoadModule('/src/game/quests/questData.ts')
  const { AREA_DEFINITIONS, ALL_AREA_CLUES } = await server.ssrLoadModule('/src/game/areas/areaRegistry.ts')
  const { NPC_DEFINITIONS } = await server.ssrLoadModule('/src/game/npcs/npcData.ts')
  const { QUESTION_BANK } = await server.ssrLoadModule('/src/game/questions/questionBank.ts')
  const { WORLD_OBJECT_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/worldObjectData.ts')
  const { LANDMARK_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/landmarkData.ts')
  const { SAVE_SCHEMA_VERSION } = await server.ssrLoadModule('/src/game/save/config.ts')

  const available = createQuestSession()
  const availableStart = engine.createDialogueSession('dialogue-penjaga-balai-ilmu', { quests: available })
  assert.equal(availableStart.nodeId, 'n07d-prologue-available')
  const notNow = engine.getDialogueChoice(availableStart, 'n07d-not-now', { quests: available })
  assert.ok(notNow)
  assert.equal(notNow.action, undefined, 'Not now must never accept a quest')
  assert.equal(engine.chooseDialogueResponse(availableStart, 'n07d-not-now', { quests: available }).nodeId, 'keeper-menu')
  const guidance = engine.chooseDialogueResponse(availableStart, 'n07d-offer-help', { quests: available })
  const offer = engine.advanceDialogue(guidance)
  assert.equal(offer.nodeId, 'quest-jejak-permulaan-offer')
  const accept = engine.getDialogueChoice(offer, 'quest-jejak-permulaan-accept', { quests: available })
  const decline = engine.getDialogueChoice(offer, 'quest-jejak-permulaan-decline', { quests: available })
  assert.deepEqual(accept.action, { type: 'ACCEPT_QUEST', questId: 'quest-jejak-permulaan' })
  assert.equal(decline.action, undefined)

  const active = structuredClone(available)
  active.quests['quest-jejak-permulaan'].status = 'ACTIVE'
  assert.equal(engine.createDialogueSession('dialogue-penjaga-balai-ilmu', { quests: active }).nodeId, 'n07d-prologue-active')

  const completed = structuredClone(available)
  completed.quests['quest-jejak-permulaan'].status = 'COMPLETED'
  completed.quests['quest-jejak-permulaan'].objectives['objective-early-life-clue'] = true
  assert.equal(engine.createDialogueSession('dialogue-penjaga-balai-ilmu', { quests: completed }).nodeId, 'n07d-prologue-completed')

  const menu = { dialogueId: 'dialogue-penjaga-balai-ilmu', nodeId: 'keeper-menu' }
  const otherMenu = { dialogueId: 'dialogue-penjaga-balai-ilmu', nodeId: 'keeper-other-menu' }
  assert.equal(engine.getVisibleDialogueChoices(menu, { quests: available }).length, 3)
  assert.equal(engine.getVisibleDialogueChoices(otherMenu, { quests: available }).length, 10)
  assert.equal(QUEST_DATA.length, 15)
  assert.equal(ALL_AREA_CLUES.length, 21)
  assert.equal(QUESTION_BANK.length, 24)
  assert.equal(AREA_DEFINITIONS.length, 3)
  assert.equal(NPC_DEFINITIONS.length, 2)
  assert.equal(WORLD_OBJECT_DEFINITIONS.length, 6)
  assert.equal(LANDMARK_DEFINITIONS.length, 6)
  assert.equal(AREA_DEFINITIONS.find(({ id }) => id === 'kampung-ilmu-area').obstacles.length, 14)
  assert.equal(SAVE_SCHEMA_VERSION, 3)

  const [dialogueData, panel, gameCanvas, styles, environment, questManager] = await Promise.all([
    read('src/game/dialogue/dialogueData.ts'),
    read('src/game/dialogue/DialoguePanel.tsx'),
    read('src/game/GameCanvas.tsx'),
    read('src/styles.css'),
    read('src/game/visuals/EnvironmentRenderer.ts'),
    read('src/game/quests/QuestManager.ts'),
  ])
  assert.match(dialogueData, /N07-D PROTOTYPE \/ narrative review pending/)
  assert.match(dialogueData, /type: 'ACCEPT_QUEST'/)
  assert.doesNotMatch(dialogueData, /clue-1[^\n]*(?:430|400)/)
  assert.match(panel, /role="dialog"/)
  assert.match(panel, /aria-modal="true"/)
  assert.doesNotMatch(panel, /document\.body\.style\.overflow/)
  assert.match(gameCanvas, /setInterfaceLocked\(interfaceLocked \|\| isExplorationMapOpen \|\| openDialogue !== null/)
  assert.match(styles, /\.dialogue-overlay[\s\S]*background: transparent/)
  assert.match(gameCanvas, /let disposed = false[\s\S]*if \(!disposed && !resetRequestedRef\.current\)[\s\S]*disposed = true[\s\S]*game\.destroy\(true\)/)
  assert.match(gameCanvas, /<div className="game-canvas-shell">[\s\S]*\{openDialogue && \([\s\S]*<DialoguePanel/)
  assert.match(styles, /\.dialogue-overlay \{[\s\S]*position: absolute/)
  assert.match(styles, /\.dialogue-panel[\s\S]*max-height: min\(54%, 18rem\)/)
  assert.match(styles, /\.dialogue-panel\.dialogue-panel--expanded[\s\S]*height: calc\(100% - 1\.3rem\)[\s\S]*max-height: calc\(100% - 1\.3rem\)/)
  assert.match(styles, /\.dialogue-panel__content[\s\S]*overflow-y: auto[\s\S]*touch-action: pan-y/)
  assert.match(panel, /aria-expanded=\{expanded\}[\s\S]*Kecilkan[\s\S]*Besarkan/)
  assert.match(styles, /@media \(max-width: 40rem\), \(max-height: 32rem\)[\s\S]*grid-template-columns: 1fr/)
  assert.match(environment, /KAMPUNG_TEXTURES\.trailSign/)
  assert.match(environment, /if \(area\.id === KAMPUNG_ILMU_AREA_ID && !bakedKampung\) renderKampungGround\(scene, area\)/)
  assert.doesNotMatch(environment, /obstacles\.push|setCollision/)
  assert.doesNotMatch(questManager, /n07d|Jejak Ilmu|Laluan yang Terputus/i)

  console.log('Verified N07-D conditional story, explicit consent, 10 Keeper offers, compact dialogue dock, preserved trail-sign layer and unchanged 15/21/24/3/2/6/6/schema-3 invariants.')
} finally {
  await server.close()
}
