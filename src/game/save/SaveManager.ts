import { migrateSave } from './migration'
import { PREVIOUS_QUESTION_IDS_KEY, SAVE_APP_VERSION, SAVE_CORRUPT_KEY_PREFIX, SAVE_SCHEMA_VERSION, SAVE_STORAGE_KEY } from './config'
import type { PersistedGameState, SaveLoadResult, SavePayload } from './types'
import { validateSavePayload } from './validation'

function storage() { return window.localStorage }

export function createSavePayload(state: PersistedGameState): SavePayload {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    appVersion: SAVE_APP_VERSION,
    savedAt: new Date().toISOString(),
    playerProgression: state.playerSession.progression,
    masteryState: state.masteryState,
    runState: { mode: state.mode, area: state.playerSession.run, world: state.worldSession },
  }
}

export function loadGameSave(): SaveLoadResult {
  let raw: string | null
  try { raw = storage().getItem(SAVE_STORAGE_KEY) } catch { return { status: 'unavailable', state: null, message: 'Storan pelayar tidak tersedia.' } }
  if (!raw) return { status: 'empty', state: null }
  try {
    const parsed: unknown = JSON.parse(raw)
    const version = parsed && typeof parsed === 'object' ? (parsed as { schemaVersion?: unknown }).schemaVersion : undefined
    if (typeof version === 'number' && version > SAVE_SCHEMA_VERSION) return { status: 'incompatible', state: null, message: 'Data simpanan berasal daripada versi aplikasi yang lebih baharu.' }
    const payload = validateSavePayload(migrateSave(parsed))
    if (!payload) throw new Error('invalid save')
    return { status: 'loaded', savedAt: payload.savedAt, state: { mode: payload.runState.mode, playerSession: { progression: payload.playerProgression, run: payload.runState.area }, worldSession: payload.runState.world, masteryState: payload.masteryState } }
  } catch {
    try { storage().setItem(`${SAVE_CORRUPT_KEY_PREFIX}${Date.now()}`, raw) } catch { /* best effort */ }
    return { status: 'corrupt', state: null, message: 'Data simpanan rosak telah diketepikan. Permainan baharu dimulakan dengan selamat.' }
  }
}

export function saveGame(state: PersistedGameState) {
  storage().setItem(SAVE_STORAGE_KEY, JSON.stringify(createSavePayload(state)))
}

export function clearSirahQuestStorage() {
  const keys: string[] = []
  for (let index = 0; index < storage().length; index += 1) {
    const key = storage().key(index)
    if (key === SAVE_STORAGE_KEY || key === PREVIOUS_QUESTION_IDS_KEY || key?.startsWith(SAVE_CORRUPT_KEY_PREFIX)) keys.push(key)
  }
  keys.forEach((key) => storage().removeItem(key))
}

