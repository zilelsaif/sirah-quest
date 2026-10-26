import type { NormalizedPosition } from './types'

export type FutureSiteCategory = 'coast' | 'forest' | 'highland' | 'river' | 'ruins' | 'desert'

export interface ReservedWorldMapSite {
  id: string
  normalizedPosition: NormalizedPosition
  region: string
  category: FutureSiteCategory
}

// Spatial design capacity only. These entries are deliberately not WorldLocation records
// and must never be rendered as playable nodes or used for travel/quest availability.
export const RESERVED_WORLD_MAP_SITES: ReservedWorldMapSite[] = [
  { id: 'reserved-northwest-coast', normalizedPosition: { x: 0.12, y: 0.2 }, region: 'Pesisir Barat Laut', category: 'coast' },
  { id: 'reserved-northern-lake', normalizedPosition: { x: 0.4, y: 0.2 }, region: 'Tasik Utara', category: 'river' },
  { id: 'reserved-northern-ruins', normalizedPosition: { x: 0.55, y: 0.18 }, region: 'Dataran Utara', category: 'ruins' },
  { id: 'reserved-eastern-highland', normalizedPosition: { x: 0.82, y: 0.2 }, region: 'Tanah Tinggi Timur', category: 'highland' },
  { id: 'reserved-eastern-desert', normalizedPosition: { x: 0.78, y: 0.42 }, region: 'Gurun Timur', category: 'desert' },
  { id: 'reserved-river-crossing', normalizedPosition: { x: 0.57, y: 0.48 }, region: 'Lintasan Sungai', category: 'river' },
  { id: 'reserved-deep-forest', normalizedPosition: { x: 0.38, y: 0.7 }, region: 'Hutan Selatan', category: 'forest' },
  { id: 'reserved-southern-wetland', normalizedPosition: { x: 0.27, y: 0.82 }, region: 'Tanah Paya Selatan', category: 'river' },
  { id: 'reserved-southern-arch', normalizedPosition: { x: 0.65, y: 0.79 }, region: 'Gerbang Batu', category: 'ruins' },
  { id: 'reserved-southeast-coast', normalizedPosition: { x: 0.87, y: 0.76 }, region: 'Pesisir Tenggara', category: 'coast' },
  { id: 'reserved-central-grove', normalizedPosition: { x: 0.5, y: 0.61 }, region: 'Lembah Tengah', category: 'forest' },
  { id: 'reserved-far-east-pass', normalizedPosition: { x: 0.93, y: 0.55 }, region: 'Laluan Timur Jauh', category: 'highland' },
]

