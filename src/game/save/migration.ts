import { SAVE_SCHEMA_VERSION } from './config'

export function migrateSave(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  const schemaVersion = (value as { schemaVersion?: unknown }).schemaVersion
  if (schemaVersion === SAVE_SCHEMA_VERSION) return value

  // Add explicit v1 -> v2 migrations here when the schema changes.
  return value
}

