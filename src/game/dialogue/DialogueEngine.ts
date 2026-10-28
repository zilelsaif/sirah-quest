import { DIALOGUE_DEFINITIONS } from './dialogueData'
import type { DialogueChoice, DialogueSession } from './types'

export function createDialogueSession(dialogueId: string): DialogueSession {
  const dialogue = DIALOGUE_DEFINITIONS.find((candidate) => candidate.id === dialogueId)
  if (!dialogue) throw new Error(`Unknown dialogue: ${dialogueId}`)
  return { dialogueId, nodeId: dialogue.startNodeId }
}

export function getDialogueNode(session: DialogueSession) {
  const dialogue = DIALOGUE_DEFINITIONS.find(
    (candidate) => candidate.id === session.dialogueId,
  )
  const node = dialogue?.nodes.find((candidate) => candidate.id === session.nodeId)
  if (!dialogue || !node) throw new Error(`Invalid dialogue session: ${session.dialogueId}/${session.nodeId}`)
  return node
}

export function advanceDialogue(session: DialogueSession): DialogueSession | null {
  const node = getDialogueNode(session)
  if (!node.nextNodeId) return null
  return { ...session, nodeId: node.nextNodeId }
}

export function chooseDialogueResponse(
  session: DialogueSession,
  choiceId: string,
): DialogueSession | null {
  const node = getDialogueNode(session)
  const choice: DialogueChoice | undefined = node.choices?.find(
    (candidate) => candidate.id === choiceId,
  )
  return choice ? { ...session, nodeId: choice.nextNodeId } : null
}
