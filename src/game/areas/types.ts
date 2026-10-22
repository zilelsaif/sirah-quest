import type { ClueDefinition } from '../clues/types'
import type { PlayerPosition } from '../session/types'

export interface AreaObstacle { x: number; y: number; width: number; height: number; color: number }
export interface AreaLandmark { type: 'circle' | 'star'; x: number; y: number; size: number; color: number }
export interface AreaDefinition {
  id: string
  nameBM: string
  nameEN: string
  width: number
  height: number
  spawn: PlayerPosition
  backgroundColor: number
  gridColor: number
  obstacles: AreaObstacle[]
  landmarks: AreaLandmark[]
  clues: ClueDefinition[]
}

