import type { QuestAcceptanceCode } from '../quests/QuestManager'
import type { QuestSessionState, QuestStatus } from '../quests/types'

export interface LocalizedDialogueText {
  bm: string
  en: string
}

export type DialogueQuestCondition =
  | { type: 'QUEST_STATUS'; questId: string; status: QuestStatus }
  | { type: 'OBJECTIVE_COMPLETED'; questId: string; objectiveId: string; completed: boolean }
  | { type: 'QUEST_TRACKED'; questId: string; tracked: boolean }

export interface AcceptQuestDialogueAction {
  type: 'ACCEPT_QUEST'
  questId: string
}

export type DialogueAction = AcceptQuestDialogueAction

export interface DialogueChoice {
  id: string
  text: LocalizedDialogueText
  nextNodeId: string
  condition?: DialogueQuestCondition
  action?: DialogueAction
}

export interface DialogueNode {
  id: string
  text: LocalizedDialogueText
  nextNodeId?: string
  choices?: DialogueChoice[]
  questId?: string
}

export interface DialogueDefinition {
  id: string
  startNodeId: string
  nodes: DialogueNode[]
}

export interface DialogueSession {
  dialogueId: string
  nodeId: string
}

export interface DialogueQuestContext {
  quests: QuestSessionState
}

export interface DialogueActionFeedback {
  code: QuestAcceptanceCode
  message: LocalizedDialogueText
  tone: 'success' | 'warning'
}
