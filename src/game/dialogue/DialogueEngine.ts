import { DIALOGUE_DEFINITIONS } from './dialogueData'
import type {
  DialogueChoice,
  DialogueQuestCondition,
  DialogueQuestContext,
  DialogueSession,
} from './types'

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

export function isDialogueConditionMet(
  condition: DialogueQuestCondition | undefined,
  context: DialogueQuestContext,
) {
  if (!condition) return true
  const progress = context.quests.quests[condition.questId]
  if (!progress) return false
  if (condition.type === 'QUEST_STATUS') return progress.status === condition.status
  if (condition.type === 'OBJECTIVE_COMPLETED') {
    return Boolean(progress.objectives[condition.objectiveId]) === condition.completed
  }
  return (context.quests.trackedQuestId === condition.questId) === condition.tracked
}

export function getVisibleDialogueChoices(
  session: DialogueSession,
  context: DialogueQuestContext,
) {
  return (getDialogueNode(session).choices ?? []).filter((choice) =>
    isDialogueConditionMet(choice.condition, context),
  )
}

export function getDialogueChoice(
  session: DialogueSession,
  choiceId: string,
  context: DialogueQuestContext,
) {
  return getVisibleDialogueChoices(session, context).find((choice) => choice.id === choiceId)
}

export function advanceDialogue(session: DialogueSession): DialogueSession | null {
  const node = getDialogueNode(session)
  if (!node.nextNodeId) return null
  return { ...session, nodeId: node.nextNodeId }
}

export function chooseDialogueResponse(
  session: DialogueSession,
  choiceId: string,
  context?: DialogueQuestContext,
): DialogueSession | null {
  const choice: DialogueChoice | undefined = context
    ? getDialogueChoice(session, choiceId, context)
    : getDialogueNode(session).choices?.find((candidate) => candidate.id === choiceId)
  return choice ? { ...session, nodeId: choice.nextNodeId } : null
}
