export interface LocalizedDialogueText {
  bm: string
  en: string
}

export interface DialogueChoice {
  id: string
  text: LocalizedDialogueText
  nextNodeId: string
}

export interface DialogueNode {
  id: string
  text: LocalizedDialogueText
  nextNodeId?: string
  choices?: DialogueChoice[]
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
