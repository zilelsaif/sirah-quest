import type { ClueState } from '../clues/types'
import type { QuestionRun } from '../questions/types'
import type { QuestSessionState } from '../quests/types'

export type GameMode = 'WORLD_MAP' | 'AREA_MAP'

export interface PlayerPosition {
  x: number
  y: number
}

export interface ClueSessionState {
  state: ClueState
  lastAnswerWasIncorrect: boolean
}

export interface AreaSessionState {
  questionRun: QuestionRun
  playerPosition: PlayerPosition
  clues: Record<string, ClueSessionState>
  quests: QuestSessionState
}

export interface WorldSessionState {
  currentLocationId: string
  visitedLocationIds: string[]
  hasEnteredArea: boolean
}
