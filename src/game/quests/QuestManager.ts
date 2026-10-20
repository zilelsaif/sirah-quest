import type { ClueSessionState } from '../session/types'
import { MAX_ACTIVE_QUESTS, QUEST_DATA } from './questData'
import type { QuestDefinition, QuestSessionState } from './types'

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
  const progress = session.quests[questId]
  if (!progress || progress.status !== 'AVAILABLE') return session
  const activeCount = Object.values(session.quests).filter(
    (quest) => quest.status === 'ACTIVE',
  ).length
  if (activeCount >= maxActiveQuests) return session

  const accepted = {
    ...session,
    acceptedQuestIds: [...session.acceptedQuestIds, questId],
    quests: {
      ...session.quests,
      [questId]: { ...progress, status: 'ACTIVE' as const },
    },
  }
  return syncQuestProgress(accepted, clues, quests)
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

