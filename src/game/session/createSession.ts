import { CLUE_DATA } from '../clues/clueData'
import { createQuestionRun } from '../questions/questionRun'
import type { AreaSessionState } from './types'

export function createAreaSession(): AreaSessionState {
  return {
    questionRun: createQuestionRun(CLUE_DATA.length),
    playerPosition: { x: 300, y: 300 },
    clues: Object.fromEntries(
      CLUE_DATA.map((clue) => [
        clue.id,
        { state: clue.state, lastAnswerWasIncorrect: false },
      ]),
    ),
  }
}
