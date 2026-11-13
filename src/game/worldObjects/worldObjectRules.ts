import type {
  WorldObjectDefinition,
  WorldObjectInteractionResult,
  WorldObjectSessionState,
  WorldObjectState,
} from './types'
import { WORLD_OBJECT_DEFINITIONS } from './worldObjectData'

export const WORLD_OBJECT_INTERACTION_COOLDOWN_MS = 220

export function createWorldObjectSession(): WorldObjectSessionState {
  return Object.fromEntries(WORLD_OBJECT_DEFINITIONS.map((object) => [object.id, object.initialState]))
}

export function isWorldObjectInRange(definition: WorldObjectDefinition, playerX: number, playerY: number) {
  return Math.hypot(definition.position.x - playerX, definition.position.y - playerY) <= definition.interactionRadius
}

export function getToggledWorldObjectState(state: WorldObjectState): WorldObjectState {
  if (state === 'CLOSED') return 'OPEN'
  if (state === 'OPEN') return 'CLOSED'
  if (state === 'OFF') return 'ON'
  if (state === 'ON') return 'OFF'
  return state
}

export function applyWorldObjectInteraction(
  definition: WorldObjectDefinition,
  currentState: WorldObjectState,
  distance: number,
  now: number,
  lastInteractionAt = Number.NEGATIVE_INFINITY,
): WorldObjectInteractionResult {
  if (distance > definition.interactionRadius || now - lastInteractionAt < WORLD_OBJECT_INTERACTION_COOLDOWN_MS) {
    return { accepted: false, nextState: currentState }
  }
  if (definition.interactionType === 'INSPECT') return { accepted: true, nextState: currentState }
  const nextState = getToggledWorldObjectState(currentState)
  const feedbackBM = nextState === 'OPEN' ? 'Peti dibuka.'
    : nextState === 'CLOSED' ? 'Peti ditutup.'
      : nextState === 'ON' ? 'Lampu dinyalakan.'
        : 'Lampu dipadamkan.'
  return { accepted: true, nextState, feedbackBM }
}
