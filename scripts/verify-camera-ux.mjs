import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })

try {
  const { CAMERA_ZOOM_LIMITS, getCameraMetrics } = await server.ssrLoadModule(
    '/src/game/camera/cameraConfig.ts',
  )
  const { DEFAULT_PLAYER_STATS } = await server.ssrLoadModule(
    '/src/game/config/playerStats.ts',
  )
  const { VISION_RADIUS_PER_RANK } = await server.ssrLoadModule(
    '/src/game/progression/progressionConfig.ts',
  )

  const cases = [
    { label: '1920x1080 desktop', width: 1024, height: 704 },
    { label: '1366x768 desktop', width: 1024, height: 522 },
    { label: '768x1024 tablet', width: 736, height: 696 },
    { label: '390x844 portrait', width: 369, height: 523 },
    { label: '360x800 portrait', width: 339, height: 496 },
    { label: '844x390 landscape', width: 812, height: 352 },
  ]

  for (const viewport of cases) {
    const normal = getCameraMetrics(viewport.width, viewport.height, 'normal')
    const wide = getCameraMetrics(viewport.width, viewport.height, 'wide')
    if (normal.zoom < CAMERA_ZOOM_LIMITS.min || normal.zoom > CAMERA_ZOOM_LIMITS.max) {
      throw new Error(`${viewport.label}: normal zoom is outside its safe limits`)
    }
    if (wide.zoom < CAMERA_ZOOM_LIMITS.min || wide.zoom > normal.zoom) {
      throw new Error(`${viewport.label}: wide zoom is outside its safe limits`)
    }
    if (wide.worldViewWidth < normal.worldViewWidth || wide.worldViewHeight < normal.worldViewHeight) {
      throw new Error(`${viewport.label}: wide mode did not increase the world view`)
    }
    console.log(
      `${viewport.label}: canvas ${viewport.width}x${viewport.height}; ` +
      `normal ${normal.zoom.toFixed(2)} => ${normal.worldViewWidth.toFixed(0)}x${normal.worldViewHeight.toFixed(0)}; ` +
      `wide ${wide.zoom.toFixed(2)} => ${wide.worldViewWidth.toFixed(0)}x${wide.worldViewHeight.toFixed(0)}`,
    )
  }

  const visionRadii = [0, 1, 5].map(
    (rank) => DEFAULT_PLAYER_STATS.visionRadius + rank * VISION_RADIUS_PER_RANK,
  )
  if (visionRadii.join(',') !== '320,360,520') {
    throw new Error(`Unexpected vision progression: ${visionRadii.join(',')}`)
  }
  console.log(`Vision radii remain world-space gameplay values: ${visionRadii.join(', ')}`)
} finally {
  await server.close()
}
