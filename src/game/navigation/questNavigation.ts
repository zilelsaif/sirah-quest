import { AREA_REGISTRY } from '../areas/areaRegistry'
import type { AreaSessionState, PlayerPosition } from '../session/types'
import { QUEST_DATA } from '../quests/questData'

export interface LocalizedNavigationText {
  bm: string
  en: string
}

export interface QuestNavigationTarget {
  questId: string
  questTitle: LocalizedNavigationText
  objectiveId: string
  areaId: string
  areaName: LocalizedNavigationText
  clueId: string
  position?: PlayerPosition
  state: 'unknown' | 'known'
  guidance: LocalizedNavigationText
}

export interface QuestNavigationState {
  status: 'untracked' | 'unknown' | 'known' | 'cross-area' | 'completed'
  target?: QuestNavigationTarget
  guidance: LocalizedNavigationText
}

function isPositionExplored(
  session: AreaSessionState,
  areaId: string,
  position: PlayerPosition,
) {
  return session.areaStates[areaId]?.fogDiscoveryPoints.some(
    (point) => Math.hypot(position.x - point.x, position.y - point.y) <= point.radius,
  ) ?? false
}

export function resolveTrackedQuestNavigation(
  session: AreaSessionState,
  currentAreaId: string,
): QuestNavigationState {
  const trackedQuestId = session.quests.trackedQuestId
  if (!trackedQuestId) {
    return {
      status: 'untracked',
      guidance: {
        bm: 'Jejak satu misi untuk menggunakan kompas misi.',
        en: 'Track a quest to use the quest compass.',
      },
    }
  }

  const quest = QUEST_DATA.find((candidate) => candidate.id === trackedQuestId)
  const progress = session.quests.quests[trackedQuestId]
  if (!quest || !progress) {
    return {
      status: 'untracked',
      guidance: {
        bm: 'Misi yang dijejak tidak dapat dikenal pasti.',
        en: 'The tracked quest could not be identified.',
      },
    }
  }

  const objective = quest.objectives.find(
    (candidate) => !progress.objectives[candidate.id],
  )
  if (!objective) {
    return {
      status: 'completed',
      guidance: {
        bm: 'Semua objektif misi ini telah selesai.',
        en: 'All objectives for this quest are complete.',
      },
    }
  }

  const area = AREA_REGISTRY[objective.relatedAreaId]
  const clue = area?.clues.find((candidate) => candidate.id === objective.relatedClueId)
  const clueState = session.areaStates[objective.relatedAreaId]?.clues[objective.relatedClueId]?.state
  const exactPositionIsKnown = Boolean(
    clue &&
    clueState !== undefined &&
    clueState !== 'hidden' &&
    isPositionExplored(session, objective.relatedAreaId, clue),
  )
  const isCurrentArea = objective.relatedAreaId === currentAreaId
  const areaName = {
    bm: area?.nameBM ?? 'Kawasan tidak diketahui',
    en: area?.nameEN ?? 'Unknown area',
  }

  const target: QuestNavigationTarget = {
    questId: quest.id,
    questTitle: { bm: quest.titleBM, en: quest.titleEN },
    objectiveId: objective.id,
    areaId: objective.relatedAreaId,
    areaName,
    clueId: objective.relatedClueId,
    state: exactPositionIsKnown ? 'known' : 'unknown',
    guidance: isCurrentArea
      ? exactPositionIsKnown
        ? {
            bm: 'Kompas menunjukkan arah terus ke sasaran yang telah ditemui.',
            en: 'The compass shows a direct bearing to the discovered target.',
          }
        : {
            bm: 'Teruskan meneroka untuk menemukan sasaran misi.',
            en: 'Keep exploring to discover the quest target.',
          }
      : {
          bm: `Pergi ke ${areaName.bm} melalui Peta Dunia.`,
          en: `Travel to ${areaName.en} through the World Map.`,
        },
  }

  if (isCurrentArea && exactPositionIsKnown && clue) {
    target.position = { x: clue.x, y: clue.y }
  }

  return {
    status: isCurrentArea ? (exactPositionIsKnown ? 'known' : 'unknown') : 'cross-area',
    target,
    guidance: target.guidance,
  }
}
