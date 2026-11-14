import {
  BAZAR_LAMA_AREA_ID,
  KAMPUNG_ILMU_AREA_ID,
  PERPUSTAKAAN_HIKMAH_AREA_ID,
} from '../areas/areaRegistry'
import type { WorldObjectDefinition } from './types'

const interactionRadius = 88

export const WORLD_OBJECT_DEFINITIONS: WorldObjectDefinition[] = [
  {
    id: 'world-object-kampung-notice-board', areaId: KAMPUNG_ILMU_AREA_ID,
    nameBM: 'Papan Makluman', nameEN: 'Notice Board',
    descriptionBM: 'Papan ini memaparkan pesanan harian rekaan untuk para pengembara dan penduduk kampung.',
    descriptionEN: 'This board displays fictional daily notices for travellers and village residents.',
    position: { x: 1060, y: 360 }, visualKey: 'notice-board', interactionType: 'INSPECT',
    interactionRadius, initialState: 'IDLE',
    questContexts: [{
      questId: 'quest-nota-balai-ilmu-pack-2',
      textBM: 'Satu pesanan menyebut dua nota pembelajaran tersebar antara Kampung Ilmu dan Bazar Lama.',
      textEN: 'A notice mentions two learning notes shared between the Village of Knowledge and the Old Bazaar.',
    }],
  },
  {
    id: 'world-object-kampung-tool-chest', areaId: KAMPUNG_ILMU_AREA_ID,
    nameBM: 'Peti Peralatan', nameEN: 'Tool Chest',
    descriptionBM: 'Sebuah peti peralatan umum untuk kerja penyelenggaraan kampung.',
    descriptionEN: 'A shared tool chest for routine village maintenance.',
    position: { x: 670, y: 1040 }, visualKey: 'tool-chest', interactionType: 'TOGGLE',
    interactionRadius, initialState: 'CLOSED',
  },
  {
    id: 'world-object-bazar-direction-board', areaId: BAZAR_LAMA_AREA_ID,
    nameBM: 'Papan Arah Bazar', nameEN: 'Bazaar Direction Board',
    descriptionBM: 'Papan rekaan ini membantu pengunjung mengenali lorong dagangan dan kawasan rehat.',
    descriptionEN: 'This fictional sign helps visitors identify trading lanes and rest areas.',
    position: { x: 970, y: 570 }, visualKey: 'direction-board', interactionType: 'INSPECT',
    interactionRadius, initialState: 'IDLE',
    questContexts: [{
      questId: 'quest-catatan-musafir-pack-2',
      textBM: 'Tanda umum ini mengingatkan musafir supaya menyemak catatan pembelajaran di Bazar Lama dan Perpustakaan Hikmah.',
      textEN: 'This general sign reminds travellers to review learning records in the Old Bazaar and the Library of Wisdom.',
    }],
  },
  {
    id: 'world-object-bazar-trade-chest', areaId: BAZAR_LAMA_AREA_ID,
    nameBM: 'Peti Dagangan', nameEN: 'Trade Chest',
    descriptionBM: 'Peti kosong yang digunakan sebagai hiasan tempat simpanan dagangan rekaan.',
    descriptionEN: 'An empty chest used as a fictional market-storage prop.',
    position: { x: 1510, y: 1090 }, visualKey: 'trade-chest', interactionType: 'TOGGLE',
    interactionRadius, initialState: 'CLOSED',
  },
  {
    id: 'world-object-library-reference-shelf', areaId: PERPUSTAKAAN_HIKMAH_AREA_ID,
    nameBM: 'Rak Rujukan', nameEN: 'Reference Shelf',
    descriptionBM: 'Rak ini menyimpan katalog rekaan untuk membantu pengunjung menyusun bahan bacaan.',
    descriptionEN: 'This shelf holds fictional catalogues that help visitors organise reading materials.',
    position: { x: 780, y: 650 }, visualKey: 'reference-shelf', interactionType: 'INSPECT',
    interactionRadius, initialState: 'IDLE',
    questContexts: [{
      questId: 'quest-jejak-lembaran-pack-2',
      textBM: 'Katalog rekaan merujuk kepada lembaran pembelajaran di Kampung Ilmu dan Perpustakaan Hikmah.',
      textEN: 'A fictional catalogue refers to learning pages in the Village of Knowledge and the Library of Wisdom.',
    }],
  },
  {
    id: 'world-object-library-reading-lamp', areaId: PERPUSTAKAAN_HIKMAH_AREA_ID,
    nameBM: 'Lampu Bacaan', nameEN: 'Reading Lamp',
    descriptionBM: 'Lampu kecil untuk sudut bacaan. Cahayanya hanya hiasan dan tidak mengubah jarak penglihatan.',
    descriptionEN: 'A small reading-corner lamp. Its light is cosmetic and does not change vision range.',
    position: { x: 1280, y: 700 }, visualKey: 'reading-lamp', interactionType: 'TOGGLE',
    interactionRadius, initialState: 'OFF',
  },
]

export function getWorldObjectsForArea(areaId: string) {
  return WORLD_OBJECT_DEFINITIONS.filter((object) => object.areaId === areaId)
}
