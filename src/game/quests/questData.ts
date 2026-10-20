import type { QuestDefinition } from './types'

export const MAX_ACTIVE_QUESTS = 3
export const KAMPUNG_ILMU_AREA_ID = 'kampung-ilmu-area'

export const QUEST_DATA: QuestDefinition[] = [
  {
    id: 'quest-jejak-permulaan',
    type: 'main',
    titleBM: 'Jejak Permulaan',
    titleEN: 'Trail of Beginnings',
    descriptionBM: 'Temui petunjuk tentang kehidupan awal Nabi Muhammad ﷺ.',
    descriptionEN: 'Find a clue about the early life of Prophet Muhammad ﷺ.',
    areaIds: [KAMPUNG_ILMU_AREA_ID],
    topicId: 'early-life',
    objectives: [
      {
        id: 'objective-early-life-clue',
        type: 'complete-clue',
        relatedAreaId: KAMPUNG_ILMU_AREA_ID,
        relatedClueId: 'clue-1',
      },
    ],
    prerequisiteQuestIds: [],
    initialStatus: 'AVAILABLE',
  },
  {
    id: 'quest-rahsia-wahyu-pertama',
    type: 'side',
    titleBM: 'Rahsia Wahyu Pertama',
    titleEN: 'Secret of the First Revelation',
    descriptionBM: 'Siasat petunjuk tentang peristiwa wahyu pertama.',
    descriptionEN: 'Investigate a clue about the first revelation.',
    areaIds: [KAMPUNG_ILMU_AREA_ID],
    topicId: 'first-revelation',
    objectives: [
      {
        id: 'objective-first-revelation-clue',
        type: 'complete-clue',
        relatedAreaId: KAMPUNG_ILMU_AREA_ID,
        relatedClueId: 'clue-2',
      },
    ],
    prerequisiteQuestIds: [],
    initialStatus: 'AVAILABLE',
  },
  {
    id: 'quest-perjalanan-hijrah',
    type: 'side',
    titleBM: 'Perjalanan Hijrah',
    titleEN: 'The Hijrah Journey',
    descriptionBM: 'Temui petunjuk tentang perjalanan Hijrah ke Madinah.',
    descriptionEN: 'Find a clue about the Hijrah journey to Madinah.',
    areaIds: [KAMPUNG_ILMU_AREA_ID],
    topicId: 'hijrah',
    objectives: [
      {
        id: 'objective-hijrah-clue',
        type: 'complete-clue',
        relatedAreaId: KAMPUNG_ILMU_AREA_ID,
        relatedClueId: 'clue-3',
      },
    ],
    prerequisiteQuestIds: [],
    initialStatus: 'AVAILABLE',
  },
]

