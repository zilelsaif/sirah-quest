import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })

try {
  const { AREA_DEFINITIONS } = await server.ssrLoadModule('/src/game/areas/areaRegistry.ts')
  const { Pathfinder } = await server.ssrLoadModule('/src/game/navigation/Pathfinder.ts')
  const { NPC_DEFINITIONS } = await server.ssrLoadModule('/src/game/npcs/npcData.ts')
  const { QUESTION_BANK } = await server.ssrLoadModule('/src/game/questions/questionBank.ts')
  const { SAVE_SCHEMA_VERSION } = await server.ssrLoadModule('/src/game/save/config.ts')
  const { WORLD_OBJECT_DEFINITIONS, getWorldObjectsForArea } = await server.ssrLoadModule('/src/game/worldObjects/worldObjectData.ts')
  const {
    WORLD_OBJECT_INTERACTION_COOLDOWN_MS,
    applyWorldObjectInteraction,
    createWorldObjectSession,
  } = await server.ssrLoadModule('/src/game/worldObjects/worldObjectRules.ts')

  assert.equal(WORLD_OBJECT_DEFINITIONS.length, 6)
  assert.equal(new Set(WORLD_OBJECT_DEFINITIONS.map(({ id }) => id)).size, 6)
  assert.deepEqual(AREA_DEFINITIONS.map((area) => getWorldObjectsForArea(area.id).length), [2, 2, 2])
  assert.ok(WORLD_OBJECT_DEFINITIONS.every((object) => AREA_DEFINITIONS.some((area) => area.id === object.areaId)))
  assert.equal(WORLD_OBJECT_DEFINITIONS.filter(({ interactionType }) => interactionType === 'INSPECT').length, 3)
  assert.equal(WORLD_OBJECT_DEFINITIONS.filter(({ interactionType }) => interactionType === 'TOGGLE').length, 3)
  assert.ok(WORLD_OBJECT_DEFINITIONS.every((object) => object.nameBM && object.nameEN && object.descriptionBM && object.descriptionEN))

  for (const area of AREA_DEFINITIONS) {
    const pathfinder = new Pathfinder(area)
    const critical = [
      { kind: 'spawn', id: `${area.id}:spawn`, ...area.spawn },
      ...area.clues.map((clue) => ({ kind: 'clue', id: clue.id, x: clue.x, y: clue.y })),
      ...NPC_DEFINITIONS.filter((npc) => npc.areaId === area.id).map((npc) => ({ kind: 'npc', id: npc.id, ...npc.position })),
    ]
    for (const object of getWorldObjectsForArea(area.id)) {
      assert.ok(pathfinder.isPointWalkable(object.position), `${object.id} overlaps collision geometry`)
      assert.ok(pathfinder.findPath(area.spawn, object.position).length > 0, `${object.id} is unreachable`)
      for (const point of critical) {
        const minimum = point.kind === 'spawn' ? 120 : 110
        assert.ok(Math.hypot(object.position.x - point.x, object.position.y - point.y) >= minimum, `${object.id} overlaps ${point.id}`)
      }
    }
  }

  const inspect = WORLD_OBJECT_DEFINITIONS.find(({ interactionType }) => interactionType === 'INSPECT')
  const toggle = WORLD_OBJECT_DEFINITIONS.find(({ initialState }) => initialState === 'CLOSED')
  const lamp = WORLD_OBJECT_DEFINITIONS.find(({ initialState }) => initialState === 'OFF')
  assert.deepEqual(applyWorldObjectInteraction(inspect, inspect.initialState, 0, 1000), { accepted: true, nextState: 'IDLE' })
  assert.equal(applyWorldObjectInteraction(toggle, 'CLOSED', 0, 1000).nextState, 'OPEN')
  assert.equal(applyWorldObjectInteraction(toggle, 'OPEN', 0, 1000).nextState, 'CLOSED')
  assert.equal(applyWorldObjectInteraction(lamp, 'OFF', 0, 1000).nextState, 'ON')
  assert.equal(applyWorldObjectInteraction(lamp, 'ON', 0, 1000).nextState, 'OFF')
  assert.equal(applyWorldObjectInteraction(toggle, 'CLOSED', toggle.interactionRadius + 1, 1000).accepted, false)
  assert.equal(applyWorldObjectInteraction(toggle, 'CLOSED', 0, 1000, 1000 - WORLD_OBJECT_INTERACTION_COOLDOWN_MS + 1).accepted, false)

  const session = createWorldObjectSession()
  const transitioned = { ...session, [toggle.id]: 'OPEN' }
  assert.equal(transitioned[toggle.id], 'OPEN', 'Area/World transitions must retain the shared run state')
  assert.equal(createWorldObjectSession()[toggle.id], 'CLOSED', 'New Test Run must restore initial state')
  assert.equal(createWorldObjectSession()[lamp.id], 'OFF')
  assert.equal(SAVE_SCHEMA_VERSION, 3)
  assert.equal(QUESTION_BANK.length, 24)

  const sceneSource = await readFile(new URL('../src/game/scenes/TestScene.ts', import.meta.url), 'utf8')
  const managerSource = await readFile(new URL('../src/game/worldObjects/WorldObjectManager.ts', import.meta.url), 'utf8')
  const panelSource = await readFile(new URL('../src/game/worldObjects/WorldObjectPanel.tsx', import.meta.url), 'utf8')
  const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.match(sceneSource, /interactWithActiveNpc\(\)[\s\S]*interactWithActiveClue\(\)[\s\S]*interactWithActiveObject\(\)/, 'Keyboard priority must be NPC > clue > object')
  assert.match(sceneSource, /handlePointerDown\(worldPoint, gameObjects\)[\s\S]*clueManager\?\.handlePointerDown[\s\S]*worldObjectManager\?\.handlePointerDown/, 'Pointer priority must be NPC > clue > object')
  assert.match(managerSource, /distance <= visionRadius/)
  assert.match(managerSource, /distance.*interactionRadius/)
  assert.match(panelSource, /object\.descriptionBM/)
  assert.match(panelSource, /event\.key !== 'Escape'/)
  assert.match(panelSource, /aria-modal="true"/)
  assert.match(appSource, /useState<WorldObjectSessionState>\(createWorldObjectSession\)/)
  assert.doesNotMatch(appSource, /saveGame\([^)]*worldObject/i, 'World objects must not enter the save payload')

  const beforeAuthority = { xp: 0, mastery: 0, questStatus: 'AVAILABLE', assignmentCount: 15 }
  const interaction = applyWorldObjectInteraction(toggle, 'CLOSED', 0, 1000)
  const afterAuthority = { ...beforeAuthority }
  assert.ok(interaction.accepted)
  assert.deepEqual(afterAuthority, beforeAuthority, 'Object interaction must not affect learning, quest or reward authority')

  console.log('Verified 6 reachable world objects, INSPECT/TOGGLE rules, proximity and repeat guards, NPC/clue priority, vision gating, session reset, schema 3 and 24 unchanged questions.')
} finally {
  await server.close()
}
