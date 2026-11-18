import type { AreaDefinition } from '../areas/types'
import { KAMPUNG_ILMU_AREA_ID } from '../areas/areaRegistry'
import {
  KAMPUNG_ENTRANCE_PATHS,
  KAMPUNG_GARDEN_ROWS,
  KAMPUNG_ROAD_PATHS,
  KAMPUNG_TREE_PLACEMENT,
  type KampungRoadPath,
} from '../visuals/kampungEnvironmentLayout'

const baseMapCache = new Map<string, HTMLCanvasElement>()

function strokePath(context: CanvasRenderingContext2D, path: KampungRoadPath, scaleX: number, scaleY: number) {
  const first = path.points[0]
  if (!first) return
  context.beginPath()
  context.moveTo(first[0] * scaleX, first[1] * scaleY)
  path.points.slice(1).forEach(([x, y]) => context.lineTo(x * scaleX, y * scaleY))
  context.lineWidth = Math.max(2, path.width * ((scaleX + scaleY) / 2))
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.stroke()
}

function drawLandmark(context: CanvasRenderingContext2D, landmark: AreaDefinition['landmarks'][number], scaleX: number, scaleY: number) {
  const x = landmark.x * scaleX
  const y = landmark.y * scaleY
  const radius = Math.max(3, landmark.size * ((scaleX + scaleY) / 4))
  context.beginPath()
  if (landmark.type === 'circle') {
    context.arc(x, y, radius, 0, Math.PI * 2)
  } else {
    for (let point = 0; point < 10; point += 1) {
      const angle = -Math.PI / 2 + point * Math.PI / 5
      const distance = point % 2 === 0 ? radius : radius * 0.45
      const px = x + Math.cos(angle) * distance
      const py = y + Math.sin(angle) * distance
      if (point === 0) context.moveTo(px, py)
      else context.lineTo(px, py)
    }
    context.closePath()
  }
  context.fillStyle = '#d9b45f'
  context.fill()
  context.strokeStyle = '#fff0ba'
  context.lineWidth = 1.5
  context.stroke()
}

function drawGenericBase(context: CanvasRenderingContext2D, area: AreaDefinition, scaleX: number, scaleY: number) {
  context.fillStyle = '#315f54'
  context.fillRect(0, 0, area.width * scaleX, area.height * scaleY)
  context.fillStyle = '#8d704f'
  context.strokeStyle = '#d4b77b'
  context.lineWidth = 1.5
  area.obstacles.forEach((obstacle) => {
    context.fillRect(obstacle.x * scaleX, obstacle.y * scaleY, obstacle.width * scaleX, obstacle.height * scaleY)
    context.strokeRect(obstacle.x * scaleX, obstacle.y * scaleY, obstacle.width * scaleX, obstacle.height * scaleY)
  })
}

function drawKampungBase(context: CanvasRenderingContext2D, area: AreaDefinition, scaleX: number, scaleY: number) {
  context.fillStyle = '#527a4b'
  context.fillRect(0, 0, area.width * scaleX, area.height * scaleY)

  context.strokeStyle = '#9c7a4f'
  ;[...KAMPUNG_ROAD_PATHS, ...KAMPUNG_ENTRANCE_PATHS].forEach((path) => strokePath(context, path, scaleX, scaleY))
  context.strokeStyle = 'rgba(232, 199, 132, 0.55)'
  context.lineWidth = 1
  KAMPUNG_ROAD_PATHS.forEach((path) => strokePath(context, { ...path, width: Math.max(4, path.width - 12) }, scaleX, scaleY))

  const gardenIndices = new Set<number>(KAMPUNG_GARDEN_ROWS.map(({ obstacleIndex }) => obstacleIndex))
  area.obstacles.forEach((obstacle, index) => {
    const x = obstacle.x * scaleX
    const y = obstacle.y * scaleY
    const width = obstacle.width * scaleX
    const height = obstacle.height * scaleY
    if (gardenIndices.has(index)) {
      context.fillStyle = '#795632'
      context.fillRect(x, y, width, height)
      context.strokeStyle = '#b9a26a'
      context.lineWidth = 1
      for (let row = 0.2; row < 1; row += 0.28) {
        context.beginPath()
        context.moveTo(x + width * 0.18, y + height * row)
        context.lineTo(x + width * 0.82, y + height * row)
        context.stroke()
      }
      return
    }
    context.fillStyle = index === KAMPUNG_TREE_PLACEMENT.obstacleIndex ? '#315c39' : '#704d34'
    context.strokeStyle = index === KAMPUNG_TREE_PLACEMENT.obstacleIndex ? '#a8c57a' : '#e0bd7a'
    context.lineWidth = 1.5
    if (index === KAMPUNG_TREE_PLACEMENT.obstacleIndex) {
      context.beginPath()
      context.arc((obstacle.x + obstacle.width / 2) * scaleX, (obstacle.y + obstacle.height / 2) * scaleY, Math.max(width, height) * 0.45, 0, Math.PI * 2)
      context.fill()
      context.stroke()
    } else {
      context.fillRect(x, y, width, height)
      context.strokeRect(x, y, width, height)
    }
  })

  area.landmarks.forEach((landmark) => drawLandmark(context, landmark, scaleX, scaleY))
}

export function getStaticAreaMap(area: AreaDefinition, width: number, height: number) {
  const cacheKey = `${area.id}:${width}x${height}`
  const cached = baseMapCache.get(cacheKey)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return canvas
  const scaleX = width / area.width
  const scaleY = height / area.height
  if (area.id === KAMPUNG_ILMU_AREA_ID) drawKampungBase(context, area, scaleX, scaleY)
  else drawGenericBase(context, area, scaleX, scaleY)
  baseMapCache.set(cacheKey, canvas)
  return canvas
}

export function clearStaticAreaMapCache() {
  baseMapCache.clear()
}
