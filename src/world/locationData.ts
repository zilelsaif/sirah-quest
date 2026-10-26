import type { WorldLocation } from './types'
import { BAZAR_LAMA_AREA_ID, PERPUSTAKAAN_HIKMAH_AREA_ID } from '../game/areas/areaRegistry'

export const STARTING_LOCATION_ID = 'kampung-ilmu'

export const WORLD_LOCATIONS: WorldLocation[] = [
  {
    id: STARTING_LOCATION_ID,
    nameBM: 'Kampung Ilmu',
    nameEN: 'Village of Knowledge',
    descriptionBM: 'Sebuah kampung tenang tempat perjalanan pembelajaran bermula.',
    descriptionEN: 'A peaceful village where the learning journey begins.',
    normalizedPosition: { x: 0.25, y: 0.45 },
    connections: ['bazar-lama'],
    status: 'playable',
    areaId: 'kampung-ilmu-area',
    unlockRequirements: [],
    visited: true,
    labelPlacement: 'left',
  },
  {
    id: 'bazar-lama',
    nameBM: 'Bazar Lama',
    nameEN: 'Old Bazaar',
    descriptionBM: 'Pusat dagangan lama yang menghubungkan pengembara dari pelbagai wilayah.',
    descriptionEN: 'An old trading centre linking travellers from many regions.',
    normalizedPosition: { x: 0.33, y: 0.52 },
    connections: ['kampung-ilmu', 'perpustakaan-hikmah', 'bukit-pengintai'],
    status: 'playable',
    areaId: BAZAR_LAMA_AREA_ID,
    unlockRequirements: [],
    visited: false,
    labelPlacement: 'below',
  },
  {
    id: 'perpustakaan-hikmah',
    nameBM: 'Perpustakaan Hikmah',
    nameEN: 'Library of Wisdom',
    descriptionBM: 'Perpustakaan fantasi di dataran tinggi dengan arkib, ruang bacaan dan bilik peta.',
    descriptionEN: 'A highland fantasy library with archives, reading spaces, and a map room.',
    normalizedPosition: { x: 0.34, y: 0.35 },
    connections: ['bazar-lama'],
    status: 'playable',
    areaId: PERPUSTAKAAN_HIKMAH_AREA_ID,
    unlockRequirements: [],
    visited: false,
    labelPlacement: 'above',
  },
  {
    id: 'bukit-pengintai',
    nameBM: 'Bukit Pengintai',
    nameEN: 'Lookout Hill',
    descriptionBM: 'Puncak tinggi yang menghadap laluan jauh di ufuk.',
    descriptionEN: 'A high peak overlooking distant routes on the horizon.',
    normalizedPosition: { x: 0.42, y: 0.41 },
    connections: ['bazar-lama'],
    status: 'locked',
    unlockRequirements: ['future-story-progression'],
    visited: false,
    labelPlacement: 'right',
  },
]

export function getWorldLocation(locationId: string) {
  return WORLD_LOCATIONS.find((location) => location.id === locationId)
}

export const WORLD_ROUTE_LINKS = WORLD_LOCATIONS.flatMap((location) =>
  location.connections
    .filter((connectedId) => location.id.localeCompare(connectedId) < 0)
    .map((connectedId) => ({ from: location.id, to: connectedId })),
)
