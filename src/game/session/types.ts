import type { ClueState } from '../clues/types'
import type { QuestionRun } from '../questions/types'
import type { QuestSessionState } from '../quests/types'

export type GameMode = 'WORLD_MAP' | 'AREA_MAP'

export interface PlayerPosition {
  x: number
  y: number
}

export interface FogDiscoveryPoint extends PlayerPosition {
  radius: number
}

export interface ClueSessionState {
  state: ClueState
  lastAnswerWasIncorrect: boolean
  incorrectAttemptOccurred: boolean
  hintUsed: boolean
  eliminatedOptionIds: string[]
}

export interface AreaSessionState {
  questionRun: QuestionRun
  playerPosition: PlayerPosition
  clues: Record<string, ClueSessionState>
  quests: QuestSessionState
  remainingHints: number
  fogDiscoveryPoints: FogDiscoveryPoint[]
}

export interface WorldSessionState {
  currentLocationId: string
  visitedLocationIds: string[]
  hasEnteredArea: boolean
}
