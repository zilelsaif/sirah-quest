import { ALL_AREA_CLUES, AREA_DEFINITIONS } from '../areas/areaRegistry'
import { createQuestionRun } from '../questions/questionRun'
import { createQuestSession } from '../quests/QuestManager'
import type { AreaSessionState, ClueSessionState } from './types'

export function createAreaSession(maxHints = 1): AreaSessionState {
  return {
    questionRun: createQuestionRun(ALL_AREA_CLUES.map((clue) => clue.questionTopicId)),
    areaStates: Object.fromEntries(AREA_DEFINITIONS.map((area) => [area.id, {
      playerPosition: { ...area.spawn },
      clues: Object.fromEntries(area.clues.map((clue) => [clue.id, { state: clue.state, lastAnswerWasIncorrect: false, incorrectAttemptOccurred: false, hintUsed: false, eliminatedOptionIds: [] }])),
      fogDiscoveryPoints: [],
    }])),
    quests: createQuestSession(),
    remainingHints: Math.max(0, maxHints),
  }
}

export function getAllClueStates(session: AreaSessionState): Record<string, ClueSessionState> {
  return Object.assign({}, ...Object.values(session.areaStates).map((area) => area.clues))
}
