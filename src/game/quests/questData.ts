import type { QuestDefinition } from './types'
import { XP_REWARDS } from '../progression/progressionConfig'
import { BAZAR_LAMA_AREA_ID, KAMPUNG_ILMU_AREA_ID } from '../areas/areaRegistry'

export const MAX_ACTIVE_QUESTS = 3
export { KAMPUNG_ILMU_AREA_ID }

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
    completionXP: XP_REWARDS.mainQuestCompletion,
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
    completionXP: XP_REWARDS.sideQuestCompletion,
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
    completionXP: XP_REWARDS.sideQuestCompletion,
  },
  {
    id: 'quest-jejak-bazar-lama', type: 'main', titleBM: 'Jejak Bazar Lama', titleEN: 'Trail of the Old Bazaar',
    descriptionBM: 'Terokai lorong bazar fantasi dan temui catatan pembelajaran kehidupan awal.',
    descriptionEN: 'Explore the fantasy bazaar lanes and find an early-life learning record.',
    areaIds: [BAZAR_LAMA_AREA_ID], topicId: 'early-life', prerequisiteQuestIds: [], initialStatus: 'AVAILABLE', completionXP: XP_REWARDS.mainQuestCompletion,
    objectives: [{ id: 'objective-bazar-early-life', type: 'complete-clue', relatedAreaId: BAZAR_LAMA_AREA_ID, relatedClueId: 'bazar-clue-1' }],
  },
  {
    id: 'quest-catatan-wahyu', type: 'side', titleBM: 'Catatan Wahyu', titleEN: 'Revelation Record',
    descriptionBM: 'Cari catatan pembelajaran tentang wahyu pertama di sekitar Bazar Lama.',
    descriptionEN: 'Find a learning record about the first revelation around the Old Bazaar.',
    areaIds: [BAZAR_LAMA_AREA_ID], topicId: 'first-revelation', prerequisiteQuestIds: [], initialStatus: 'AVAILABLE', completionXP: XP_REWARDS.sideQuestCompletion,
    objectives: [{ id: 'objective-bazar-first-revelation', type: 'complete-clue', relatedAreaId: BAZAR_LAMA_AREA_ID, relatedClueId: 'bazar-clue-2' }],
  },
  {
    id: 'quest-laluan-musafir', type: 'side', titleBM: 'Laluan Musafir', titleEN: 'Traveller’s Route',
    descriptionBM: 'Jejaki fragmen perjalanan untuk melengkapkan pembelajaran tentang Hijrah.',
    descriptionEN: 'Trace a travel fragment to complete a learning objective about the Hijrah.',
    areaIds: [BAZAR_LAMA_AREA_ID], topicId: 'hijrah', prerequisiteQuestIds: [], initialStatus: 'AVAILABLE', completionXP: XP_REWARDS.sideQuestCompletion,
    objectives: [{ id: 'objective-bazar-hijrah', type: 'complete-clue', relatedAreaId: BAZAR_LAMA_AREA_ID, relatedClueId: 'bazar-clue-3' }],
  },
]

