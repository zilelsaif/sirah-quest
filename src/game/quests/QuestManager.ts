import type { ClueSessionState } from '../session/types'
import { MAX_ACTIVE_QUESTS, QUEST_DATA } from './questData'
import type { QuestDefinition, QuestSessionState } from './types'

export type QuestAcceptanceCode =
  | 'ACCEPTED'
  | 'QUEST_NOT_FOUND'
  | 'QUEST_LOCKED'
  | 'QUEST_NOT_AVAILABLE'
  | 'ACTIVE_LIMIT_REACHED'

export interface QuestAcceptanceResult {
  code: QuestAcceptanceCode
  session: QuestSessionState
}

export function createQuestSession(
  quests: readonly QuestDefinition[] = QUEST_DATA,
): QuestSessionState {
  return {
    quests: Object.fromEntries(
      quests.map((quest) => [
        quest.id,
        {
          status: quest.initialStatus,
          objectives: Object.fromEntries(quest.objectives.map((objective) => [objective.id, false])),
        },
      ]),
    ),
    acceptedQuestIds: [],
    trackedQuestId: null,
  }
}

export function acceptQuest(
  session: QuestSessionState,
  questId: string,
  clues: Record<string, ClueSessionState>,
  quests: readonly QuestDefinition[] = QUEST_DATA,
  maxActiveQuests = MAX_ACTIVE_QUESTS,
): QuestSessionState {
  return acceptQuestWithResult(session, questId, clues, quests, maxActiveQuests).session
}

export function acceptQuestWithResult(
  session: QuestSessionState,
  questId: string,
  clues: Record<string, ClueSessionState>,
  quests: readonly QuestDefinition[] = QUEST_DATA,
  maxActiveQuests = MAX_ACTIVE_QUESTS,
): QuestAcceptanceResult {
  const definition = quests.find((quest) => quest.id === questId)
  const progress = session.quests[questId]
  if (!definition || !progress) return { code: 'QUEST_NOT_FOUND', session }
  const prerequisitesMet = definition.prerequisiteQuestIds.every(
    (requiredId) => session.quests[requiredId]?.status === 'COMPLETED',
  )
  if (progress.status === 'LOCKED' || !prerequisitesMet) {
    return { code: 'QUEST_LOCKED', session }
  }
  if (progress.status !== 'AVAILABLE') return { code: 'QUEST_NOT_AVAILABLE', session }
  const activeCount = Object.values(session.quests).filter(
    (quest) => quest.status === 'ACTIVE',
  ).length
  if (activeCount >= maxActiveQuests) return { code: 'ACTIVE_LIMIT_REACHED', session }

  const accepted = {
    ...session,
    acceptedQuestIds: session.acceptedQuestIds.includes(questId)
      ? session.acceptedQuestIds
      : [...session.acceptedQuestIds, questId],
    quests: {
      ...session.quests,
      [questId]: { ...progress, status: 'ACTIVE' as const },
    },
  }
  return { code: 'ACCEPTED', session: syncQuestProgress(accepted, clues, quests) }
}

export function setTrackedQuest(
  session: QuestSessionState,
  questId: string | null,
): QuestSessionState {
  if (questId === null) return { ...session, trackedQuestId: null }
  if (session.quests[questId]?.status !== 'ACTIVE') return session
  return { ...session, trackedQuestId: questId }
}

export function syncQuestProgress(
  session: QuestSessionState,
  clues: Record<string, ClueSessionState>,
  quests: readonly QuestDefinition[] = QUEST_DATA,
): QuestSessionState {
  let changed = false
  let trackedQuestId = session.trackedQuestId
  const nextQuests = { ...session.quests }

  quests.forEach((quest) => {
    const current = session.quests[quest.id]
    if (!current || current.status !== 'ACTIVE') return

    const objectives = { ...current.objectives }
    quest.objectives.forEach((objective) => {
      if (!objectives[objective.id] && clues[objective.relatedClueId]?.state === 'completed') {
        objectives[objective.id] = true
        changed = true
      }
    })

    const completed = quest.objectives.every((objective) => objectives[objective.id])
    if (completed || changed) {
      nextQuests[quest.id] = {
        status: completed ? 'COMPLETED' : 'ACTIVE',
        objectives,
      }
      if (completed && trackedQuestId === quest.id) trackedQuestId = null
    }
  })

  if (!changed && trackedQuestId === session.trackedQuestId) return session
  return { ...session, quests: nextQuests, trackedQuestId }
}

export function getQuestProgress(
  quest: QuestDefinition,
  session: QuestSessionState,
) {
  const objectives = session.quests[quest.id]?.objectives ?? {}
  const completed = quest.objectives.filter((objective) => objectives[objective.id]).length
  return { completed, total: quest.objectives.length }
}

