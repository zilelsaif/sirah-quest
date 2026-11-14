import type { WorldObjectDefinition } from './types'

export interface LandmarkDiscoveryResult {
  discoveredIds: string[]
  newlyDiscovered: boolean
}

export function attemptLandmarkDiscovery(
  discoveredIds: readonly string[],
  definition: WorldObjectDefinition,
  currentAreaId: string,
  distance: number,
  fogVisible: boolean,
): LandmarkDiscoveryResult {
  const alreadyDiscovered = discoveredIds.includes(definition.id)
  const eligible = definition.kind === 'landmark' &&
    definition.areaId === currentAreaId &&
    fogVisible &&
    distance <= (definition.discoveryRadius ?? definition.interactionRadius)
  if (!eligible || alreadyDiscovered) return { discoveredIds: [...discoveredIds], newlyDiscovered: false }
  return { discoveredIds: [...discoveredIds, definition.id], newlyDiscovered: true }
}
