import { SAVE_SCHEMA_VERSION } from './config'
import { createSirahMastery } from '../mastery/SirahMastery'

export function migrateSave(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  const schemaVersion = (value as { schemaVersion?: unknown }).schemaVersion
  if (schemaVersion === SAVE_SCHEMA_VERSION) return value

  if (schemaVersion === 1) {
    const legacy = value as Record<string, unknown>
    const runState = legacy.runState as Record<string, unknown> | undefined
    const area = runState?.area as Record<string, unknown> | undefined
    const clues = area?.clues as Record<string, unknown> | undefined
    const migratedClues = clues
      ? Object.fromEntries(Object.entries(clues).map(([id, clue]) => [id, {
          ...(clue as Record<string, unknown>),
          incorrectAttemptOccurred: false,
          hintUsed: false,
        }]))
      : clues
    return {
      ...legacy,
      schemaVersion: 2,
      appVersion: '0.10.0',
      masteryState: createSirahMastery(),
      runState: runState ? { ...runState, area: area ? { ...area, clues: migratedClues } : area } : runState,
    }
  }

  // Add explicit v1 -> v2 migrations here when the schema changes.
  return value
}

