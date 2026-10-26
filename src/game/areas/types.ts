import type { ClueDefinition } from '../clues/types'
import type { PlayerPosition } from '../session/types'

export type AreaObstacleVisual = 'wall' | 'shelf' | 'table' | 'stall' | 'crate' | 'village'
export interface AreaObstacle { x: number; y: number; width: number; height: number; color: number; visualType?: AreaObstacleVisual }
export interface AreaLandmark { type: 'circle' | 'star'; x: number; y: number; size: number; color: number }
export interface AreaZone {
  id: string
  areaId: string
  nameBM: string
  nameEN: string
  x: number
  y: number
  width: number
  height: number
  accessPoint: PlayerPosition
  environment: 'village' | 'garden' | 'learning' | 'outskirts' | 'market' | 'warehouse' | 'caravan' | 'reading' | 'archive' | 'courtyard' | 'study'
  futureContentNote: string
}
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
  zones: AreaZone[]
  clues: ClueDefinition[]
}

