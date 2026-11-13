import type { PlayerPosition } from '../session/types'

export type WorldObjectInteractionType = 'INSPECT' | 'TOGGLE'
export type WorldObjectState = 'IDLE' | 'CLOSED' | 'OPEN' | 'OFF' | 'ON'
export type WorldObjectVisualKey = 'notice-board' | 'tool-chest' | 'direction-board' | 'trade-chest' | 'reference-shelf' | 'reading-lamp'

export interface WorldObjectDefinition {
  id: string
  areaId: string
  nameBM: string
  nameEN: string
  descriptionBM: string
  descriptionEN: string
  position: PlayerPosition
  visualKey: WorldObjectVisualKey
  interactionType: WorldObjectInteractionType
  interactionRadius: number
  initialState: WorldObjectState
}

export type WorldObjectSessionState = Record<string, WorldObjectState>

export interface WorldObjectPanelData {
  id: string
  nameBM: string
  nameEN: string
  descriptionBM: string
  descriptionEN: string
}

export interface WorldObjectInteractionResult {
  accepted: boolean
  nextState: WorldObjectState
  feedbackBM?: string
}
