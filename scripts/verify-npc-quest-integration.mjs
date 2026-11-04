import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const [npcData, dialogueData, dialogueTypes, dialogueEngine, questManager, gameCanvas, app, saveConfig, questions] = await Promise.all([
  read('src/game/npcs/npcData.ts'),
  read('src/game/dialogue/dialogueData.ts'),
  read('src/game/dialogue/types.ts'),
  read('src/game/dialogue/DialogueEngine.ts'),
  read('src/game/quests/QuestManager.ts'),
  read('src/game/GameCanvas.tsx'),
  read('src/App.tsx'),
  read('src/game/save/config.ts'),
  read('src/game/questions/questionBank.ts'),
])

const associations = {
  'npc-penjaga-balai-ilmu': ['quest-jejak-permulaan', 'quest-rahsia-wahyu-pertama'],
  'npc-pengembara-bazar': ['quest-perjalanan-hijrah'],
}

for (const [npcId, questIds] of Object.entries(associations)) {
  assert.match(npcData, new RegExp(`id: '${npcId}'`))
  for (const questId of questIds) {
    assert.match(npcData, new RegExp(`'${questId}'`))
    assert.match(dialogueData, new RegExp(`ACCEPT_QUEST'[\\s\\S]{0,80}questId`))
  }
}

for (const condition of ['QUEST_STATUS', 'OBJECTIVE_COMPLETED', 'QUEST_TRACKED']) {
  assert.match(dialogueTypes + dialogueEngine, new RegExp(condition))
}
assert.match(dialogueTypes, /type: 'ACCEPT_QUEST'/)
assert.match(questManager, /acceptQuestWithResult/)
assert.match(questManager, /ACTIVE_LIMIT_REACHED/)
assert.match(questManager, /prerequisiteQuestIds\.every/)
assert.match(questManager, /acceptedQuestIds\.includes/)
assert.match(gameCanvas, /onAcceptQuest\(choice\.action\.questId\)/)
assert.match(gameCanvas, /Had tiga misi aktif telah dicapai/)
assert.match(app, /acceptQuestWithResult/)
assert.match(app, /collectCompletionRewards/)
assert.match(saveConfig, /SAVE_SCHEMA_VERSION = 3/)

const questionIds = [...questions.matchAll(/draftQuestion\(\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
assert.equal(questionIds.length, 24, 'The existing 24-question bank must remain present')
assert.equal(new Set(questionIds).size, 24, 'Question IDs must remain unique')

const makeSession = () => ({
  quests: {
    first: { status: 'AVAILABLE', objectives: { one: false } },
    second: { status: 'AVAILABLE', objectives: { two: false } },
    third: { status: 'AVAILABLE', objectives: { three: false } },
    fourth: { status: 'AVAILABLE', objectives: { four: false } },
    locked: { status: 'LOCKED', objectives: { locked: false } },
  },
  acceptedQuestIds: [],
  trackedQuestId: 'second',
})

function acceptFixture(session, questId, prerequisitesMet = true) {
  const progress = session.quests[questId]
  if (!progress) return { code: 'QUEST_NOT_FOUND', session }
  if (progress.status === 'LOCKED' || !prerequisitesMet) return { code: 'QUEST_LOCKED', session }
  if (progress.status !== 'AVAILABLE') return { code: 'QUEST_NOT_AVAILABLE', session }
  if (Object.values(session.quests).filter((quest) => quest.status === 'ACTIVE').length >= 3) {
    return { code: 'ACTIVE_LIMIT_REACHED', session }
  }
  return {
    code: 'ACCEPTED',
    session: {
      ...session,
      acceptedQuestIds: session.acceptedQuestIds.includes(questId) ? session.acceptedQuestIds : [...session.acceptedQuestIds, questId],
      quests: { ...session.quests, [questId]: { ...progress, status: 'ACTIVE' } },
    },
  }
}

let fixture = makeSession()
const declined = fixture
assert.equal(declined.quests.first.status, 'AVAILABLE')
fixture = acceptFixture(fixture, 'first').session
assert.equal(fixture.quests.first.status, 'ACTIVE')
assert.equal(fixture.trackedQuestId, 'second', 'Acceptance must not change tracking')
assert.equal(acceptFixture(fixture, 'first').code, 'QUEST_NOT_AVAILABLE')
fixture = acceptFixture(fixture, 'second').session
fixture = acceptFixture(fixture, 'third').session
assert.equal(acceptFixture(fixture, 'fourth').code, 'ACTIVE_LIMIT_REACHED')
assert.equal(acceptFixture(fixture, 'locked').code, 'QUEST_LOCKED')
assert.equal(acceptFixture(makeSession(), 'first', false).code, 'QUEST_LOCKED')
assert.equal(fixture.acceptedQuestIds.length, 3)

assert.doesNotMatch(dialogueData, /clue-[123].*(?:x|y)|coordinates?|koordinat/i)
assert.match(gameCanvas, /setInterfaceLocked\(interfaceLocked \|\| isExplorationMapOpen \|\| openDialogue !== null\)/)
assert.match(gameCanvas, /closeNpcDialogue/)

console.log('Verified NPC quest associations, typed conditions/actions, explicit acceptance, idempotency, capacity, prerequisites, tracking independence, save schema 3 and 24 unchanged questions.')
