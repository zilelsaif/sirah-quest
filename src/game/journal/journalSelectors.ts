import { WORLD_LOCATIONS } from '../../world/locationData'
import { ALL_AREA_CLUES, AREA_DEFINITIONS } from '../areas/areaRegistry'
import { getTopicMastery } from '../mastery/SirahMastery'
import type { SirahMasteryState } from '../mastery/types'
import type { QuestionTopicId } from '../questions/types'
import { QUEST_DATA } from '../quests/questData'
import type { AreaSessionState, WorldSessionState } from '../session/types'
import type { JournalModel } from './types'
import { LANDMARK_DEFINITIONS } from '../worldObjects/landmarkData'

const TOPICS: QuestionTopicId[] = ['early-life', 'first-revelation', 'hijrah']

export function selectJournalModel(
  session: AreaSessionState,
  world: WorldSessionState,
  mastery: SirahMasteryState,
): JournalModel {
  const quests = QUEST_DATA.flatMap((quest) => {
    const state = session.quests.quests[quest.id]
    if (!state || (state.status !== 'ACTIVE' && state.status !== 'COMPLETED')) return []
    const location = WORLD_LOCATIONS.find((candidate) => quest.areaIds.includes(candidate.areaId ?? ''))
    const objectives = quest.objectives.map((objective) => ({
      id: objective.id,
      completed: Boolean(state.objectives[objective.id]),
    }))
    return [{
      id: quest.id,
      type: quest.type,
      titleBM: quest.titleBM,
      titleEN: quest.titleEN,
      areaBM: location?.nameBM ?? quest.areaIds[0],
      status: state.status,
      tracked: session.quests.trackedQuestId === quest.id,
      completedObjectives: objectives.filter((objective) => objective.completed).length,
      totalObjectives: objectives.length,
      objectives,
    }]
  })

  const knowledge = [] as JournalModel['knowledge']
  const legacyKnowledge = [] as JournalModel['legacyKnowledge']
  const seenQuestionIds = new Set<string>()
  ALL_AREA_CLUES.forEach((clue, index) => {
    const area = AREA_DEFINITIONS.find((candidate) => candidate.clues.some((item) => item.id === clue.id))
    if (!area || session.areaStates[area.id]?.clues[clue.id]?.state !== 'completed') return
    const question = session.questionRun.assignments[index]?.question
    if (!question) {
      legacyKnowledge.push({ clueId: clue.id, areaBM: area.nameBM, clueTitle: clue.title })
      return
    }
    if (seenQuestionIds.has(question.id)) return
    const answer = question.options.find((option) => option.id === question.correctOptionId)
    if (!answer) return
    seenQuestionIds.add(question.id)
    knowledge.push({
      questionId: question.id,
      topicId: question.topicId,
      promptBM: question.prompt.bm,
      promptEN: question.prompt.en,
      answerBM: answer.text.bm,
      answerEN: answer.text.en,
      explanationBM: question.explanation.bm,
      explanationEN: question.explanation.en,
      reviewStatus: question.reviewStatus,
      areaBM: area.nameBM,
      clueTitle: clue.title,
    })
  })

  const exploration = AREA_DEFINITIONS.map((area) => {
    const location = WORLD_LOCATIONS.find((candidate) => candidate.areaId === area.id)
    const clueStates = Object.values(session.areaStates[area.id]?.clues ?? {})
    return {
      areaId: area.id,
      nameBM: area.nameBM,
      nameEN: area.nameEN,
      current: location?.id === world.currentLocationId,
      visited: Boolean(location && world.visitedLocationIds.includes(location.id)),
      discoveredClues: clueStates.filter((clue) => clue.state !== 'hidden').length,
      completedClues: clueStates.filter((clue) => clue.state === 'completed').length,
      totalClues: area.clues.length,
    }
  }).filter((area) => area.visited)

  const discoveredLandmarkIds = new Set(session.discoveredLandmarkIds)
  const landmarkAreas = AREA_DEFINITIONS.map((area) => {
    const landmarks = LANDMARK_DEFINITIONS.filter((landmark) => landmark.areaId === area.id).map((landmark) => {
      const discovered = discoveredLandmarkIds.has(landmark.id)
      return {
        id: landmark.id,
        discovered,
        nameBM: discovered ? landmark.nameBM : '???',
        descriptionBM: discovered ? landmark.descriptionBM : 'Belum ditemui.',
      }
    })
    return { areaId: area.id, nameBM: area.nameBM, discovered: landmarks.filter((landmark) => landmark.discovered).length, total: landmarks.length, landmarks }
  })

  return {
    quests,
    knowledge,
    legacyKnowledge,
    exploration,
    landmarkDiscoveries: { discovered: discoveredLandmarkIds.size, total: LANDMARK_DEFINITIONS.length, areas: landmarkAreas },
    mastery: TOPICS.map((topicId) => getTopicMastery(mastery, topicId)),
  }
}
