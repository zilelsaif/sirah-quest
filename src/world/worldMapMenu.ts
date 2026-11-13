import type { WorldLocation } from './types'

export interface ContextMenuPositionInput {
  anchorX: number
  anchorY: number
  anchorWidth: number
  anchorHeight: number
  menuWidth: number
  menuHeight: number
  viewportWidth: number
  viewportHeight: number
  padding?: number
  gap?: number
}

export interface ContextMenuPosition {
  left: number
  top: number
  placement: 'right' | 'left'
}

export function clampContextMenuPosition(input: ContextMenuPositionInput): ContextMenuPosition {
  const padding = input.padding ?? 8
  const gap = input.gap ?? 10
  const rightLeft = input.anchorX + input.anchorWidth + gap
  const leftLeft = input.anchorX - input.menuWidth - gap
  const fitsRight = rightLeft + input.menuWidth <= input.viewportWidth - padding
  const placement = fitsRight || leftLeft < padding ? 'right' : 'left'
  const rawLeft = placement === 'right' ? rightLeft : leftLeft
  const rawTop = input.anchorY + input.anchorHeight / 2 - input.menuHeight / 2
  return {
    left: Math.max(padding, Math.min(rawLeft, input.viewportWidth - input.menuWidth - padding)),
    top: Math.max(padding, Math.min(rawTop, input.viewportHeight - input.menuHeight - padding)),
    placement,
  }
}

export type WorldMapLocationAction = 'ENTER' | 'TRAVEL' | 'LOCKED' | 'COMING_SOON' | 'UNAVAILABLE'

export function getWorldMapLocationAction(
  location: WorldLocation,
  currentLocationId: string,
  connectedIds: ReadonlySet<string>,
): WorldMapLocationAction {
  if (location.status === 'locked') return 'LOCKED'
  if (location.status === 'coming-soon') return 'COMING_SOON'
  if (location.id === currentLocationId && location.status === 'playable' && location.areaId) return 'ENTER'
  if (connectedIds.has(location.id)) return 'TRAVEL'
  return 'UNAVAILABLE'
}
