import type { PlayerPosition } from '../session/types'

export type NpcVisualKey = 'hall-keeper' | 'bazaar-traveller'

export interface NpcDefinition {
  id: string
  areaId: string
  nameBM: string
  nameEN: string
  roleBM: string
  roleEN: string
  position: PlayerPosition
  visualKey: NpcVisualKey
  interactionRadius: number
  dialogueId: string
}
