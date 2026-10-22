import type { WorldLocation } from './types'
import { BAZAR_LAMA_AREA_ID } from '../game/areas/areaRegistry'

export const STARTING_LOCATION_ID = 'kampung-ilmu'

export const WORLD_LOCATIONS: WorldLocation[] = [
  {
    id: STARTING_LOCATION_ID,
    nameBM: 'Kampung Ilmu',
    nameEN: 'Village of Knowledge',
    descriptionBM: 'Sebuah kampung tenang tempat perjalanan pembelajaran bermula.',
    descriptionEN: 'A peaceful village where the learning journey begins.',
    normalizedPosition: { x: 24, y: 39 },
    connections: ['bazar-lama'],
    status: 'playable',
    areaId: 'kampung-ilmu-area',
    unlockRequirements: [],
    visited: true,
  },
  {
    id: 'bazar-lama',
    nameBM: 'Bazar Lama',
    nameEN: 'Old Bazaar',
    descriptionBM: 'Pusat dagangan lama yang menghubungkan pengembara dari pelbagai wilayah.',
    descriptionEN: 'An old trading centre linking travellers from many regions.',
    normalizedPosition: { x: 49, y: 68 },
    connections: ['kampung-ilmu', 'perpustakaan-hikmah', 'bukit-pengintai'],
    status: 'playable',
    areaId: BAZAR_LAMA_AREA_ID,
    unlockRequirements: [],
    visited: false,
  },
  {
    id: 'perpustakaan-hikmah',
    nameBM: 'Perpustakaan Hikmah',
    nameEN: 'Library of Wisdom',
    descriptionBM: 'Khazanah ilmu di dataran tinggi yang masih belum dibuka.',
    descriptionEN: 'A highland treasury of knowledge that is not yet open.',
    normalizedPosition: { x: 64, y: 25 },
    connections: ['bazar-lama'],
    status: 'locked',
    unlockRequirements: ['future-story-progression'],
    visited: false,
  },
  {
    id: 'bukit-pengintai',
    nameBM: 'Bukit Pengintai',
    nameEN: 'Lookout Hill',
    descriptionBM: 'Puncak tinggi yang menghadap laluan jauh di ufuk.',
    descriptionEN: 'A high peak overlooking distant routes on the horizon.',
    normalizedPosition: { x: 87, y: 43 },
    connections: ['bazar-lama'],
    status: 'locked',
    unlockRequirements: ['future-story-progression'],
    visited: false,
  },
]

export function getWorldLocation(locationId: string) {
  return WORLD_LOCATIONS.find((location) => location.id === locationId)
}
