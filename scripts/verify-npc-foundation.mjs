import { createServer } from 'vite'

const server = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true },
})

try {
  const { AREA_REGISTRY } = await server.ssrLoadModule('/src/game/areas/areaRegistry.ts')
  const { Pathfinder } = await server.ssrLoadModule('/src/game/navigation/Pathfinder.ts')
  const { NPC_DEFINITIONS } = await server.ssrLoadModule('/src/game/npcs/npcData.ts')
  const { DIALOGUE_DEFINITIONS } = await server.ssrLoadModule('/src/game/dialogue/dialogueData.ts')
  const { createDialogueSession, getDialogueNode, advanceDialogue, chooseDialogueResponse } =
    await server.ssrLoadModule('/src/game/dialogue/DialogueEngine.ts')

  if (NPC_DEFINITIONS.length !== 2) throw new Error(`Expected 2 NPCs, found ${NPC_DEFINITIONS.length}`)
  const npcIds = new Set()
  const dialogueIds = new Set(DIALOGUE_DEFINITIONS.map((dialogue) => dialogue.id))

  for (const npc of NPC_DEFINITIONS) {
    if (npcIds.has(npc.id)) throw new Error(`Duplicate NPC ID: ${npc.id}`)
    npcIds.add(npc.id)
    const area = AREA_REGISTRY[npc.areaId]
    if (!area) throw new Error(`${npc.id} references an unknown area`)
    if (!dialogueIds.has(npc.dialogueId)) throw new Error(`${npc.id} references an unknown dialogue`)
    if (!npc.nameBM || !npc.nameEN || !npc.roleBM || !npc.roleEN) {
      throw new Error(`${npc.id} has incomplete bilingual identity data`)
    }
    const pathfinder = new Pathfinder(area)
    if (!pathfinder.isPointWalkable(npc.position)) throw new Error(`${npc.id} is on blocked ground`)
    if (pathfinder.findPath(area.spawn, npc.position).length === 0) {
      throw new Error(`${npc.id} is unreachable from the area spawn`)
    }
    if (Math.hypot(npc.position.x - area.spawn.x, npc.position.y - area.spawn.y) < 150) {
      throw new Error(`${npc.id} is too close to the player spawn`)
    }
    for (const clue of area.clues) {
      if (Math.hypot(npc.position.x - clue.x, npc.position.y - clue.y) < npc.interactionRadius + clue.interactionRadius) {
        throw new Error(`${npc.id} interaction area overlaps ${clue.id}`)
      }
    }
  }

  let linearCount = 0
  let branchingCount = 0
  for (const dialogue of DIALOGUE_DEFINITIONS) {
    const nodeIds = new Set(dialogue.nodes.map((node) => node.id))
    if (!nodeIds.has(dialogue.startNodeId)) throw new Error(`${dialogue.id} has an invalid start node`)
    const session = createDialogueSession(dialogue.id)
    if (getDialogueNode(session).id !== dialogue.startNodeId) throw new Error(`${dialogue.id} did not start correctly`)
    for (const node of dialogue.nodes) {
      if (!node.text.bm || !node.text.en) throw new Error(`${dialogue.id}/${node.id} lacks bilingual text`)
      if (node.nextNodeId && !nodeIds.has(node.nextNodeId)) throw new Error(`${dialogue.id}/${node.id} has an invalid next node`)
      if (node.choices?.length) {
        branchingCount += 1
        const choiceIds = new Set()
        for (const choice of node.choices) {
          if (choiceIds.has(choice.id)) throw new Error(`${dialogue.id}/${node.id} has duplicate choice IDs`)
          choiceIds.add(choice.id)
          if (!choice.text.bm || !choice.text.en || !nodeIds.has(choice.nextNodeId)) {
            throw new Error(`${dialogue.id}/${node.id}/${choice.id} is invalid`)
          }
          const branch = chooseDialogueResponse({ dialogueId: dialogue.id, nodeId: node.id }, choice.id)
          if (!branch || branch.nodeId !== choice.nextNodeId) throw new Error(`${choice.id} did not branch correctly`)
        }
      } else if (node.nextNodeId) {
        linearCount += 1
        const next = advanceDialogue({ dialogueId: dialogue.id, nodeId: node.id })
        if (!next || next.nodeId !== node.nextNodeId) throw new Error(`${dialogue.id}/${node.id} did not advance`)
      }
    }
  }

  if (linearCount === 0 || branchingCount === 0) throw new Error('Both linear and branching dialogue examples are required')
  console.log(`Verified ${npcIds.size} reachable NPCs, ${DIALOGUE_DEFINITIONS.length} bilingual dialogues, ${linearCount} linear links and ${branchingCount} branching node.`)
} finally {
  await server.close()
}
