import type { BilingualText } from '../game/questions/types'

export type LocationStatus = 'playable' | 'coming-soon' | 'locked'

export interface NormalizedPosition {
  x: number
  y: number
}

export interface WorldLocation {
  id: string
  nameBM: string
  nameEN: string
  descriptionBM: string
  descriptionEN: string
  normalizedPosition: NormalizedPosition
  connections: string[]
  status: LocationStatus
  areaId?: string
  unlockRequirements: string[]
  visited: boolean
  labelPlacement?: 'above' | 'below' | 'left' | 'right'
}
