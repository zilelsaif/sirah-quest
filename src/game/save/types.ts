import type { PlayerProgressionState } from '../progression/types'
import type { AreaSessionState, GameMode, WorldSessionState } from '../session/types'
import type { SirahMasteryState } from '../mastery/types'

export interface PlayerSessionState {
  run: AreaSessionState
  progression: PlayerProgressionState
}

export interface PersistedGameState {
  mode: GameMode
  playerSession: PlayerSessionState
  worldSession: WorldSessionState
  masteryState: SirahMasteryState
}

export interface SavePayload {
  schemaVersion: number
  appVersion: string
  savedAt: string
  playerProgression: PlayerProgressionState
  masteryState: SirahMasteryState
  runState: {
    mode: GameMode
    area: AreaSessionState
    world: WorldSessionState
  }
}

export type SaveLoadStatus = 'empty' | 'loaded' | 'corrupt' | 'incompatible' | 'unavailable'

export interface SaveLoadResult {
  status: SaveLoadStatus
  state: PersistedGameState | null
  savedAt?: string
  message?: string
}

