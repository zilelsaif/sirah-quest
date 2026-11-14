import { BAZAR_LAMA_AREA_ID, KAMPUNG_ILMU_AREA_ID, PERPUSTAKAAN_HIKMAH_AREA_ID } from '../areas/areaRegistry'
import type { WorldObjectDefinition } from './types'

const landmark = { kind: 'landmark' as const, interactionType: 'INSPECT' as const, interactionRadius: 88, discoveryRadius: 88, initialState: 'IDLE' as const }

export const LANDMARK_DEFINITIONS: WorldObjectDefinition[] = [
  {
    ...landmark, id: 'landmark-kampung-telaga-lama', areaId: KAMPUNG_ILMU_AREA_ID,
    nameBM: 'Telaga Lama', nameEN: 'Old Well', visualKey: 'old-well', position: { x: 1300, y: 600 },
    descriptionBM: 'Sebuah telaga rekaan yang menjadi tempat teduh dan persinggahan penduduk Kampung Ilmu.',
    descriptionEN: 'A fictional well that serves as a shaded resting place for residents of the Village of Knowledge.',
  },
  {
    ...landmark, id: 'landmark-kampung-pondok-bacaan', areaId: KAMPUNG_ILMU_AREA_ID,
    nameBM: 'Pondok Bacaan', nameEN: 'Reading Hut', visualKey: 'reading-hut', position: { x: 450, y: 1120 },
    descriptionBM: 'Sebuah pondok bacaan rekaan untuk pengembara berehat dan menyusun catatan pembelajaran.',
    descriptionEN: 'A fictional reading hut where travellers rest and organise learning notes.',
  },
  {
    ...landmark, id: 'landmark-bazar-gerbang-dagang', areaId: BAZAR_LAMA_AREA_ID,
    nameBM: 'Gerbang Dagang', nameEN: 'Trade Gate', visualKey: 'trade-gate', position: { x: 1650, y: 1050 },
    descriptionBM: 'Gerbang rekaan ini menandakan laluan masuk ke kawasan dagangan Bazar Lama.',
    descriptionEN: 'This fictional gate marks an entrance to the trading quarter of the Old Bazaar.',
  },
  {
    ...landmark, id: 'landmark-bazar-sudut-kafilah', areaId: BAZAR_LAMA_AREA_ID,
    nameBM: 'Sudut Kafilah', nameEN: 'Caravan Corner', visualKey: 'caravan-corner', position: { x: 2200, y: 1180 },
    descriptionBM: 'Sudut rekaan untuk kafilah berehat sebelum meneruskan perjalanan merentas dunia fantasi.',
    descriptionEN: 'A fictional corner where caravans rest before continuing through the fantasy world.',
  },
  {
    ...landmark, id: 'landmark-library-meja-manuskrip', areaId: PERPUSTAKAAN_HIKMAH_AREA_ID,
    nameBM: 'Meja Manuskrip', nameEN: 'Manuscript Table', visualKey: 'manuscript-table', position: { x: 1600, y: 950 },
    descriptionBM: 'Meja rekaan ini digunakan untuk menyusun salinan manuskrip pembelajaran tanpa mendakwa bahan sejarah sebenar.',
    descriptionEN: 'This fictional table is used to organise learning-manuscript copies and does not claim to hold historical artefacts.',
  },
  {
    ...landmark, id: 'landmark-library-sudut-peta', areaId: PERPUSTAKAAN_HIKMAH_AREA_ID,
    nameBM: 'Sudut Peta', nameEN: 'Map Corner', visualKey: 'map-corner', position: { x: 2140, y: 1130 },
    descriptionBM: 'Sudut rekaan yang mempamerkan peta dunia fantasi untuk rujukan para pengembara.',
    descriptionEN: 'A fictional corner displaying fantasy-world maps for travellers’ reference.',
  },
]

export function getLandmarksForArea(areaId: string) {
  return LANDMARK_DEFINITIONS.filter((landmarkDefinition) => landmarkDefinition.areaId === areaId)
}
