export type CameraViewMode = 'normal' | 'wide'

export interface CameraMetrics {
  viewportWidth: number
  viewportHeight: number
  zoom: number
  worldViewWidth: number
  worldViewHeight: number
}

export const CAMERA_ZOOM_LIMITS = {
  min: 0.68,
  max: 1,
} as const

export function getResponsiveNormalZoom(width: number, height: number) {
  if (width <= 480 && height > width) return 0.76
  if (height <= 480 && width > height) return 0.82
  if (width <= 820) return 0.9
  return 1
}

export function getCameraZoom(width: number, height: number, mode: CameraViewMode) {
  const normalZoom = getResponsiveNormalZoom(width, height)
  const requestedZoom = mode === 'wide' ? normalZoom - 0.08 : normalZoom
  return Math.min(CAMERA_ZOOM_LIMITS.max, Math.max(CAMERA_ZOOM_LIMITS.min, requestedZoom))
}

export function getCameraMetrics(
  viewportWidth: number,
  viewportHeight: number,
  mode: CameraViewMode,
): CameraMetrics {
  const zoom = getCameraZoom(viewportWidth, viewportHeight, mode)
  return {
    viewportWidth,
    viewportHeight,
    zoom,
    worldViewWidth: viewportWidth / zoom,
    worldViewHeight: viewportHeight / zoom,
  }
}
