import type { AreaDefinition } from './types'

export const KAMPUNG_ILMU_AREA_ID = 'kampung-ilmu-area'
export const BAZAR_LAMA_AREA_ID = 'bazar-lama-area'

const commonClue = { interactionRadius: 78, state: 'hidden' as const }

export const AREA_DEFINITIONS: AreaDefinition[] = [
  {
    id: KAMPUNG_ILMU_AREA_ID,
    nameBM: 'Kampung Ilmu',
    nameEN: 'Village of Knowledge',
    width: 1600,
    height: 1200,
    spawn: { x: 300, y: 300 },
    backgroundColor: 0x294c43,
    gridColor: 0xffffff,
    obstacles: [
      { x: 520, y: 220, width: 240, height: 90, color: 0x8d5a3b },
      { x: 900, y: 510, width: 110, height: 300, color: 0x5f6f52 },
      { x: 260, y: 760, width: 320, height: 100, color: 0x456990 },
      { x: 1180, y: 860, width: 210, height: 130, color: 0x9b7e46 },
    ],
    landmarks: [
      { type: 'circle', x: 1320, y: 250, size: 90, color: 0x5ca4a9 },
      { type: 'star', x: 770, y: 930, size: 70, color: 0xe0b44c },
    ],
    clues: [
      { ...commonClue, id: 'clue-1', title: 'Clue 1', questionTopicId: 'early-life', x: 430, y: 400 },
      { ...commonClue, id: 'clue-2', title: 'Clue 2', questionTopicId: 'first-revelation', x: 820, y: 430 },
      { ...commonClue, id: 'clue-3', title: 'Clue 3', questionTopicId: 'hijrah', x: 1100, y: 740 },
    ],
  },
  {
    id: BAZAR_LAMA_AREA_ID,
    nameBM: 'Bazar Lama',
    nameEN: 'Old Bazaar',
    width: 1680,
    height: 1240,
    spawn: { x: 180, y: 1040 },
    backgroundColor: 0x765235,
    gridColor: 0xf6d69a,
    obstacles: [
      { x: 0, y: 0, width: 1680, height: 90, color: 0x4d3428 },
      { x: 0, y: 1150, width: 1680, height: 90, color: 0x4d3428 },
      { x: 300, y: 180, width: 280, height: 150, color: 0xa95f3c },
      { x: 760, y: 150, width: 170, height: 310, color: 0x8c4b36 },
      { x: 1110, y: 190, width: 360, height: 140, color: 0xb77745 },
      { x: 210, y: 610, width: 250, height: 170, color: 0x9b633e },
      { x: 680, y: 700, width: 320, height: 120, color: 0xb96f3f },
      { x: 1240, y: 610, width: 220, height: 230, color: 0x8c5238 },
      { x: 430, y: 950, width: 260, height: 120, color: 0x5f4333 },
      { x: 1040, y: 970, width: 320, height: 100, color: 0x5f4333 },
    ],
    landmarks: [
      { type: 'circle', x: 840, y: 585, size: 72, color: 0x4d8f94 },
      { type: 'star', x: 1490, y: 1010, size: 62, color: 0xe0b44c },
    ],
    clues: [
      { ...commonClue, id: 'bazar-clue-1', title: 'Bekas Skrol', questionTopicId: 'early-life', x: 560, y: 500 },
      { ...commonClue, id: 'bazar-clue-2', title: 'Catatan Perjalanan', questionTopicId: 'first-revelation', x: 1120, y: 510 },
      { ...commonClue, id: 'bazar-clue-3', title: 'Fragmen Peta', questionTopicId: 'hijrah', x: 1460, y: 930 },
    ],
  },
]

export const AREA_REGISTRY = Object.fromEntries(AREA_DEFINITIONS.map((area) => [area.id, area])) as Record<string, AreaDefinition>
export const ALL_AREA_CLUES = AREA_DEFINITIONS.flatMap((area) => area.clues)
export function getAreaDefinition(areaId: string) { return AREA_REGISTRY[areaId] }

