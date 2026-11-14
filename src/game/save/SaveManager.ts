import { migrateSave } from './migration'
import { MANUAL_SAVE_SLOT_VERSION, MANUAL_SAVE_STORAGE_KEY, PREVIOUS_QUESTION_IDS_KEY, SAVE_APP_VERSION, SAVE_CORRUPT_KEY_PREFIX, SAVE_SCHEMA_VERSION, SAVE_STORAGE_KEY } from './config'
import type { ManualSaveEnvelope, ManualSaveLoadResult, PersistedGameState, SaveLoadResult, SavePayload } from './types'
import { validateSavePayload } from './validation'

function storage() { return window.localStorage }

export function createSavePayload(state: PersistedGameState, savedAt = new Date().toISOString()): SavePayload {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    appVersion: SAVE_APP_VERSION,
    savedAt,
    playerProgression: state.playerSession.progression,
    masteryState: state.masteryState,
    runState: { mode: state.mode, area: state.playerSession.run, world: state.worldSession },
  }
}

function stateFromPayload(payload: SavePayload): PersistedGameState {
  return { mode: payload.runState.mode, playerSession: { progression: payload.playerProgression, run: payload.runState.area }, worldSession: payload.runState.world, masteryState: payload.masteryState }
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
    return { status: 'loaded', savedAt: payload.savedAt, state: stateFromPayload(payload) }
  } catch {
    try { storage().setItem(`${SAVE_CORRUPT_KEY_PREFIX}${Date.now()}`, raw) } catch { /* best effort */ }
    return { status: 'corrupt', state: null, message: 'Data simpanan rosak telah diketepikan. Permainan baharu dimulakan dengan selamat.' }
  }
}

export function saveGame(state: PersistedGameState) {
  storage().setItem(SAVE_STORAGE_KEY, JSON.stringify(createSavePayload(state)))
}

export function createManualSaveEnvelope(state: PersistedGameState, locationNameBM: string, savedAt = new Date().toISOString()): ManualSaveEnvelope {
  const clues = Object.values(state.playerSession.run.areaStates).flatMap((area) => Object.values(area.clues))
  return {
    slotVersion: MANUAL_SAVE_SLOT_VERSION,
    metadata: {
      savedAt,
      locationId: state.worldSession.currentLocationId,
      locationNameBM,
      level: state.playerSession.progression.level,
      completedQuests: Object.values(state.playerSession.run.quests.quests).filter(({ status }) => status === 'COMPLETED').length,
      completedClues: clues.filter(({ state: clueState }) => clueState === 'completed').length,
    },
    payload: createSavePayload(state, savedAt),
  }
}

export function saveManualGame(state: PersistedGameState, locationNameBM: string) {
  const envelope = createManualSaveEnvelope(state, locationNameBM)
  storage().setItem(MANUAL_SAVE_STORAGE_KEY, JSON.stringify(envelope))
  return envelope.metadata
}

export function loadManualGame(): ManualSaveLoadResult {
  let raw: string | null
  try { raw = storage().getItem(MANUAL_SAVE_STORAGE_KEY) } catch { return { status: 'unavailable', state: null, message: 'Storan pelayar tidak tersedia.' } }
  if (!raw) return { status: 'empty', state: null, message: 'Tiada simpanan manual.' }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') throw new Error('invalid envelope')
    const envelope = parsed as Partial<ManualSaveEnvelope>
    if (envelope.slotVersion !== MANUAL_SAVE_SLOT_VERSION || !envelope.metadata || !envelope.payload) throw new Error('unsupported envelope')
    if (
      typeof envelope.metadata.savedAt !== 'string' ||
      typeof envelope.metadata.locationId !== 'string' ||
      typeof envelope.metadata.locationNameBM !== 'string' ||
      !Number.isInteger(envelope.metadata.level) || envelope.metadata.level < 1 ||
      !Number.isInteger(envelope.metadata.completedQuests) || envelope.metadata.completedQuests < 0 ||
      !Number.isInteger(envelope.metadata.completedClues) || envelope.metadata.completedClues < 0
    ) throw new Error('invalid metadata')
    const payload = validateSavePayload(migrateSave(envelope.payload))
    if (!payload || envelope.metadata.savedAt !== payload.savedAt || Number.isNaN(Date.parse(envelope.metadata.savedAt))) throw new Error('invalid manual save')
    return { status: 'loaded', state: stateFromPayload(payload), savedAt: payload.savedAt, metadata: envelope.metadata }
  } catch {
    return { status: 'corrupt', state: null, message: 'Simpanan manual rosak atau tidak disokong. Kemajuan semasa tidak diubah.' }
  }
}

export function clearSirahQuestStorage() {
  const keys: string[] = []
  for (let index = 0; index < storage().length; index += 1) {
    const key = storage().key(index)
    if (key === SAVE_STORAGE_KEY || key === MANUAL_SAVE_STORAGE_KEY || key === PREVIOUS_QUESTION_IDS_KEY || key?.startsWith(SAVE_CORRUPT_KEY_PREFIX)) keys.push(key)
  }
  keys.forEach((key) => storage().removeItem(key))
}

