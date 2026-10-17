export type ClueState = 'hidden' | 'discovered' | 'completed'

export interface ClueDefinition {
  id: string
  title: string
  text: string
  x: number
  y: number
  interactionRadius: number
  state: ClueState
}

export interface CluePanelData {
  id: string
  title: string
  text: string
  state: ClueState
}

export interface ClueCounts {
  total: number
  discovered: number
  completed: number
}

