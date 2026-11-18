import Phaser from 'phaser'
import type { AreaDefinition, AreaObstacle, AreaObstacleVisual, AreaZone } from '../areas/types'
import { BAZAR_LAMA_AREA_ID, KAMPUNG_ILMU_AREA_ID, PERPUSTAKAAN_HIKMAH_AREA_ID } from '../areas/areaRegistry'
import { getAreaVisuals, VISUAL_PALETTE } from './visualTheme'
import { kampungWorldDepth, KAMPUNG_OBSTACLE_TEXTURES, KAMPUNG_TEXTURES } from './kampungEnvironmentManifest'
import {
  KAMPUNG_DECORATION_POINTS,
  KAMPUNG_GARDEN_ROWS,
  KAMPUNG_ROAD_PATHS,
  type KampungRoadPath,
} from './kampungEnvironmentLayout'

type EnvironmentGraphics = Phaser.GameObjects.Graphics

function drawGroundShadow(graphics: EnvironmentGraphics, obstacle: AreaObstacle, color: number) {
  graphics.fillStyle(color, 0.28)
  graphics.fillRoundedRect(obstacle.x + 9, obstacle.y + 11, obstacle.width, obstacle.height, 5)
}

function drawObstacleFrame(graphics: EnvironmentGraphics, obstacle: AreaObstacle, trim: number) {
  const radius = Math.min(7, obstacle.width / 8, obstacle.height / 8)
  graphics.fillStyle(obstacle.color, 1)
  graphics.fillRoundedRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, radius)
  graphics.lineStyle(3, VISUAL_PALETTE.ink, 0.62)
  graphics.strokeRoundedRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, radius)
  graphics.fillStyle(trim, 0.55)
  graphics.fillRoundedRect(obstacle.x + 6, obstacle.y + 6, Math.max(4, obstacle.width - 12), Math.max(3, Math.min(8, obstacle.height - 12)), 3)
}

function drawWall(graphics: EnvironmentGraphics, obstacle: AreaObstacle, trim: number) {
  drawObstacleFrame(graphics, obstacle, trim)
  graphics.lineStyle(1, VISUAL_PALETTE.parchment, 0.16)
  const horizontal = obstacle.width >= obstacle.height
  if (horizontal) {
    for (let x = obstacle.x + 64; x < obstacle.x + obstacle.width; x += 64) graphics.lineBetween(x, obstacle.y + 10, x, obstacle.y + obstacle.height - 7)
    graphics.lineBetween(obstacle.x + 5, obstacle.y + obstacle.height - 10, obstacle.x + obstacle.width - 5, obstacle.y + obstacle.height - 10)
  } else {
    for (let y = obstacle.y + 64; y < obstacle.y + obstacle.height; y += 64) graphics.lineBetween(obstacle.x + 7, y, obstacle.x + obstacle.width - 7, y)
    graphics.lineBetween(obstacle.x + obstacle.width - 10, obstacle.y + 5, obstacle.x + obstacle.width - 10, obstacle.y + obstacle.height - 5)
  }
}

function drawShelf(graphics: EnvironmentGraphics, obstacle: AreaObstacle, trim: number) {
  drawObstacleFrame(graphics, obstacle, trim)
  graphics.fillStyle(0x3e2e25, 0.55)
  graphics.fillRect(obstacle.x + 8, obstacle.y + 20, obstacle.width - 16, obstacle.height - 29)
  const horizontal = obstacle.width >= obstacle.height
  if (horizontal) {
    for (let x = obstacle.x + 36; x < obstacle.x + obstacle.width - 12; x += 38) {
      graphics.lineStyle(3, trim, 0.8)
      graphics.lineBetween(x, obstacle.y + 18, x, obstacle.y + obstacle.height - 9)
    }
    for (let x = obstacle.x + 17; x < obstacle.x + obstacle.width - 10; x += 24) {
      const bookHeight = 14 + ((x / 24) % 3) * 6
      graphics.lineStyle(5, x % 48 === 0 ? VISUAL_PALETTE.lapis : VISUAL_PALETTE.gold, 0.82)
      graphics.lineBetween(x, obstacle.y + obstacle.height - 11, x, obstacle.y + obstacle.height - 11 - bookHeight)
    }
  } else {
    for (let y = obstacle.y + 62; y < obstacle.y + obstacle.height - 8; y += 62) {
      graphics.lineStyle(3, trim, 0.78)
      graphics.lineBetween(obstacle.x + 7, y, obstacle.x + obstacle.width - 7, y)
    }
    for (let y = obstacle.y + 34; y < obstacle.y + obstacle.height - 12; y += 31) {
      graphics.lineStyle(5, y % 62 === 0 ? VISUAL_PALETTE.gold : VISUAL_PALETTE.lapis, 0.8)
      graphics.lineBetween(obstacle.x + 17, y, obstacle.x + obstacle.width - 17, y)
    }
  }
}

function drawTable(graphics: EnvironmentGraphics, obstacle: AreaObstacle, trim: number) {
  drawObstacleFrame(graphics, obstacle, trim)
  graphics.fillStyle(VISUAL_PALETTE.cream, 0.18)
  graphics.fillRoundedRect(obstacle.x + 10, obstacle.y + 9, obstacle.width - 20, Math.max(8, obstacle.height * 0.34), 4)
  graphics.fillStyle(VISUAL_PALETTE.ink, 0.36)
  const leg = Math.min(12, obstacle.width * 0.08)
  graphics.fillRect(obstacle.x + 14, obstacle.y + obstacle.height - 16, leg, 10)
  graphics.fillRect(obstacle.x + obstacle.width - 14 - leg, obstacle.y + obstacle.height - 16, leg, 10)
  graphics.lineStyle(2, VISUAL_PALETTE.parchment, 0.18)
  graphics.lineBetween(obstacle.x + 12, obstacle.y + obstacle.height / 2, obstacle.x + obstacle.width - 12, obstacle.y + obstacle.height / 2)
}

function drawMarketStall(graphics: EnvironmentGraphics, obstacle: AreaObstacle) {
  drawObstacleFrame(graphics, obstacle, VISUAL_PALETTE.softGold)
  const awningHeight = Math.min(34, obstacle.height * 0.28)
  const stripeWidth = Math.max(24, obstacle.width / 7)
  for (let x = obstacle.x + 5, stripe = 0; x < obstacle.x + obstacle.width - 5; x += stripeWidth, stripe += 1) {
    graphics.fillStyle(stripe % 2 === 0 ? 0xb94f43 : VISUAL_PALETTE.cream, 0.88)
    graphics.fillRect(x, obstacle.y + 6, Math.min(stripeWidth, obstacle.x + obstacle.width - 5 - x), awningHeight)
  }
  graphics.lineStyle(4, VISUAL_PALETTE.earth, 0.72)
  graphics.lineBetween(obstacle.x + 12, obstacle.y + awningHeight + 7, obstacle.x + 12, obstacle.y + obstacle.height - 8)
  graphics.lineBetween(obstacle.x + obstacle.width - 12, obstacle.y + awningHeight + 7, obstacle.x + obstacle.width - 12, obstacle.y + obstacle.height - 8)
  graphics.lineStyle(5, VISUAL_PALETTE.softGold, 0.58)
  graphics.lineBetween(obstacle.x + 8, obstacle.y + obstacle.height * 0.7, obstacle.x + obstacle.width - 8, obstacle.y + obstacle.height * 0.7)
}

function drawCrateGroup(graphics: EnvironmentGraphics, obstacle: AreaObstacle) {
  drawObstacleFrame(graphics, obstacle, VISUAL_PALETTE.sandstone)
  const cell = Math.max(44, Math.min(78, obstacle.height - 14))
  for (let x = obstacle.x + 8; x + 20 < obstacle.x + obstacle.width; x += cell) {
    const width = Math.min(cell - 8, obstacle.x + obstacle.width - x - 8)
    graphics.lineStyle(2, VISUAL_PALETTE.cream, 0.38)
    graphics.strokeRect(x, obstacle.y + 10, width, obstacle.height - 20)
    graphics.lineBetween(x, obstacle.y + 10, x + width, obstacle.y + obstacle.height - 10)
    graphics.lineBetween(x + width, obstacle.y + 10, x, obstacle.y + obstacle.height - 10)
  }
}

function drawVillageStructure(graphics: EnvironmentGraphics, obstacle: AreaObstacle, trim: number) {
  drawObstacleFrame(graphics, obstacle, trim)
  graphics.fillStyle(0x4d3027, 0.72)
  const doorwayWidth = Math.min(36, obstacle.width * 0.22)
  graphics.fillRoundedRect(obstacle.x + obstacle.width / 2 - doorwayWidth / 2, obstacle.y + obstacle.height * 0.52, doorwayWidth, obstacle.height * 0.48 - 5, 3)
  graphics.fillStyle(VISUAL_PALETTE.lapis, 0.58)
  const windowSize = Math.min(24, obstacle.height * 0.22)
  graphics.fillRect(obstacle.x + 20, obstacle.y + obstacle.height * 0.46, windowSize, windowSize)
  if (obstacle.width > 180) graphics.fillRect(obstacle.x + obstacle.width - 20 - windowSize, obstacle.y + obstacle.height * 0.46, windowSize, windowSize)
  graphics.lineStyle(3, VISUAL_PALETTE.softGold, 0.5)
  graphics.lineBetween(obstacle.x + 6, obstacle.y + 18, obstacle.x + obstacle.width - 6, obstacle.y + 18)
}

function drawFloorPattern(graphics: EnvironmentGraphics, area: AreaDefinition, color: number) {
  graphics.lineStyle(1, color, 0.09)
  const tile = area.id === PERPUSTAKAAN_HIKMAH_AREA_ID ? 96 : 128
  for (let x = 0; x <= area.width; x += tile) graphics.lineBetween(x, 0, x, area.height)
  for (let y = 0; y <= area.height; y += tile) graphics.lineBetween(0, y, area.width, y)
  graphics.fillStyle(color, 0.08)
  for (let y = tile / 2; y < area.height; y += tile * 2) {
    for (let x = tile / 2; x < area.width; x += tile * 2) graphics.fillCircle(x, y, 6)
  }
}

function drawLightwell(graphics: EnvironmentGraphics, x: number, y: number, radius: number) {
  graphics.fillStyle(0x1f5f5b, 0.2)
  graphics.fillCircle(x + 7, y + 9, radius + 8)
  graphics.fillStyle(0x4d9ca3, 0.92)
  graphics.fillCircle(x, y, radius)
  graphics.lineStyle(12, 0xd8c99f, 0.88)
  graphics.strokeCircle(x, y, radius + 5)
  graphics.lineStyle(3, VISUAL_PALETTE.parchment, 0.48)
  graphics.strokeCircle(x, y, radius - 12)
  graphics.fillStyle(VISUAL_PALETTE.parchment, 0.12)
  graphics.fillEllipse(x - radius * 0.22, y - radius * 0.25, radius * 0.75, radius * 0.34)
}

function createOrganicTerrainMask(
  scene: Phaser.Scene,
  paths: readonly KampungRoadPath[],
  widthExpansion: number,
  phase: number,
) {
  const source = new Phaser.GameObjects.Graphics(scene)
  source.fillStyle(0xffffff, 1)
  paths.forEach((path, pathIndex) => {
    const points = path.points.map(([x, y]) => new Phaser.Math.Vector2(x, y))
    points.slice(0, -1).forEach((point, segmentIndex) => {
      const next = points[segmentIndex + 1]
      const distance = point.distance(next)
      const steps = Math.ceil(distance / 26)
      for (let step = 0; step <= steps; step += 1) {
        const progress = step / steps
        const x = Phaser.Math.Linear(point.x, next.x, progress)
        const y = Phaser.Math.Linear(point.y, next.y, progress)
        const irregularity = Math.sin((step + segmentIndex * 11 + pathIndex * 7 + phase) * 1.71) * 3
          + Math.cos((step + pathIndex * 5 + phase) * 0.83) * 2
        source.fillCircle(x, y, (path.width + widthExpansion) / 2 + irregularity)
      }
    })
  })
  const mask = source.createGeometryMask()
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    mask.destroy()
    source.destroy()
  })
  return mask
}

function createLandscapeVariationMask(scene: Phaser.Scene) {
  const source = new Phaser.GameObjects.Graphics(scene).fillStyle(0xffffff, 1)
  const clusters = [
    [410, 1180, 300, 210], [1810, 330, 350, 250],
    [1810, 900, 360, 250], [250, 1390, 280, 180],
  ] as const
  clusters.forEach(([x, y, width, height], index) => {
    source.fillEllipse(x, y, width, height)
    source.fillEllipse(x + 70 - index * 11, y - 55, width * 0.72, height * 0.68)
    source.fillEllipse(x - 80 + index * 9, y + 45, width * 0.64, height * 0.58)
  })
  const mask = source.createGeometryMask()
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    mask.destroy()
    source.destroy()
  })
  return mask
}

function renderKampungGround(scene: Phaser.Scene, area: AreaDefinition) {
  scene.add.tileSprite(0, 0, area.width, area.height, KAMPUNG_TEXTURES.grassBase)
    .setOrigin(0).setDepth(0)
  const variation = scene.add.tileSprite(0, 0, area.width, area.height, KAMPUNG_TEXTURES.grassVariation)
    .setOrigin(0).setDepth(0.05).setAlpha(0.34).setTilePosition(173, 89)
  variation.setMask(createLandscapeVariationMask(scene))

  const pathEdge = scene.add.tileSprite(0, 0, area.width, area.height, KAMPUNG_TEXTURES.dirtEdge)
    .setOrigin(0).setDepth(0.18).setAlpha(0.52).setTilePosition(91, 147)
  pathEdge.setMask(createOrganicTerrainMask(scene, KAMPUNG_ROAD_PATHS, 24, 7))
  const pathFill = scene.add.tileSprite(0, 0, area.width, area.height, KAMPUNG_TEXTURES.dirtFill)
    .setOrigin(0).setDepth(0.19).setTilePosition(37, 61)
  pathFill.setMask(createOrganicTerrainMask(scene, KAMPUNG_ROAD_PATHS, 0, 19))

  const decorationKeys = [
    KAMPUNG_TEXTURES.grassTuft, KAMPUNG_TEXTURES.wildflowers,
    KAMPUNG_TEXTURES.shrub, KAMPUNG_TEXTURES.smallRocks,
  ] as const
  KAMPUNG_DECORATION_POINTS.forEach(([x, y], index) => {
    scene.add.image(x, y, decorationKeys[index % decorationKeys.length])
      .setOrigin(0.5, 1).setScale(0.29 + (index % 4) * 0.028).setDepth(kampungWorldDepth(y, -4))
  })
  scene.add.image(362, 613, KAMPUNG_TEXTURES.trailSign).setOrigin(0.5, 1).setScale(0.23)
    .setDepth(kampungWorldDepth(613))
  scene.add.text(362, 552, 'Jejak Ilmu', {
    color: '#fff2c9', fontFamily: 'Georgia, serif', fontSize: '11px', fontStyle: 'bold',
    padding: { x: 3, y: 2 },
  }).setOrigin(0.5).setDepth(kampungWorldDepth(613, 1))
}

function addKampungContactShadow(scene: Phaser.Scene, obstacle: AreaObstacle) {
  const centerX = obstacle.x + obstacle.width / 2 + 8
  const bottomY = obstacle.y + obstacle.height
  const width = Math.max(48, obstacle.width * 0.78)
  scene.add.ellipse(centerX, bottomY + 6, width, Math.min(28, obstacle.height * 0.2), 0x07101d, 0.22)
    .setDepth(kampungWorldDepth(bottomY, -2))
}

function renderKampungGardenRow(scene: Phaser.Scene, obstacle: AreaObstacle, index: number) {
  const row = KAMPUNG_GARDEN_ROWS.find(({ obstacleIndex }) => obstacleIndex === index)
  if (!row || !scene.textures.exists(KAMPUNG_TEXTURES.raisedPlanter)) return false

  const soil = scene.add.graphics().setDepth(0.3)
  soil.fillStyle(0x6f4b2d, 0.78)
  soil.fillRoundedRect(obstacle.x + 7, obstacle.y + 5, obstacle.width - 14, obstacle.height - 10, 18)
  soil.lineStyle(3, 0x9b7445, 0.58)
  soil.strokeRoundedRect(obstacle.x + 7, obstacle.y + 5, obstacle.width - 14, obstacle.height - 10, 18)

  const planterSource = scene.textures.get(KAMPUNG_TEXTURES.raisedPlanter).getSourceImage() as {
    width: number, height: number,
  }
  const planterScale = Math.min(70 / planterSource.width, 82 / planterSource.height)
  const cropTextures = [KAMPUNG_TEXTURES.grassTuft, KAMPUNG_TEXTURES.wildflowers, KAMPUNG_TEXTURES.shrub]
  row.planterBottoms.forEach((bottomY, cropIndex) => {
    scene.add.image(obstacle.x + obstacle.width / 2, bottomY, KAMPUNG_TEXTURES.raisedPlanter)
      .setOrigin(0.5, 1).setScale(planterScale).setDepth(kampungWorldDepth(bottomY))
    const cropKey = cropTextures[(index + cropIndex) % cropTextures.length]
    scene.add.image(obstacle.x + obstacle.width / 2, bottomY - 42, cropKey)
      .setOrigin(0.5, 1).setScale(0.18 + cropIndex * 0.015)
      .setDepth(kampungWorldDepth(bottomY, 1))
  })

  if (row.boundaryFence && scene.textures.exists(KAMPUNG_TEXTURES.fenceVertical)) {
    const fenceX = row.boundaryFence === 'west' ? obstacle.x + 31 : obstacle.x + obstacle.width - 31
    ;[895, 1025].forEach((bottomY) => {
      scene.add.image(fenceX, bottomY, KAMPUNG_TEXTURES.fenceVertical)
        .setOrigin(0.5, 1).setScale(0.31).setDepth(kampungWorldDepth(bottomY, -1))
    })
  }
  return true
}

function renderKampungObstacle(scene: Phaser.Scene, obstacle: AreaObstacle, index: number) {
  if (renderKampungGardenRow(scene, obstacle, index)) return true
  const mapping = KAMPUNG_OBSTACLE_TEXTURES[index]
  if (!mapping) return false
  const keys = typeof mapping === 'string' ? [mapping] : mapping
  if (keys.some((key) => !scene.textures.exists(key))) return false
  addKampungContactShadow(scene, obstacle)
  const segmentHeight = obstacle.height / keys.length
  keys.forEach((key, pieceIndex) => {
    const texture = scene.textures.get(key).getSourceImage() as { width: number, height: number }
    const maxWidth = obstacle.width * (key === KAMPUNG_TEXTURES.fenceVertical ? 0.92 : 1.08)
    const maxHeight = keys.length > 1 ? segmentHeight * 1.08 : Number.POSITIVE_INFINITY
    const scale = Math.min(maxWidth / texture.width, maxHeight / texture.height)
    scene.add.image(
      obstacle.x + obstacle.width / 2,
      obstacle.y + segmentHeight * (pieceIndex + 1),
      key,
    ).setOrigin(0.5, 1).setScale(scale)
      .setDepth(kampungWorldDepth(obstacle.y + segmentHeight * (pieceIndex + 1)))
  })
  return true
}

const ZONE_COLORS: Record<AreaZone['environment'], number> = {
  village: 0x8d6b48,
  garden: 0x6f8b59,
  learning: 0x456990,
  outskirts: 0x596a4b,
  market: 0xb77745,
  warehouse: 0x684a38,
  caravan: 0x9a7049,
  reading: 0x628b91,
  archive: 0x4b6874,
  courtyard: 0x5b9185,
  study: 0x6e654f,
}

function drawZones(scene: Phaser.Scene, graphics: EnvironmentGraphics, area: AreaDefinition) {
  const zones = area.zones
  zones.forEach((zone) => {
    const color = ZONE_COLORS[zone.environment]
    if (area.id !== KAMPUNG_ILMU_AREA_ID) {
      graphics.fillStyle(color, 0.13)
      graphics.fillRoundedRect(zone.x, zone.y, zone.width, zone.height, 24)
      graphics.lineStyle(3, color, 0.34)
      graphics.strokeRoundedRect(zone.x, zone.y, zone.width, zone.height, 24)
    }
    scene.add.text(zone.x + 22, zone.y + 20, zone.nameBM, {
      color: area.id === KAMPUNG_ILMU_AREA_ID ? '#f7e8bc' : '#fff7df',
      fontFamily: 'Georgia, serif',
      fontSize: area.id === KAMPUNG_ILMU_AREA_ID ? '14px' : '18px',
      fontStyle: 'bold',
      backgroundColor: area.id === KAMPUNG_ILMU_AREA_ID ? '#263a2db8' : '#0b1628aa',
      padding: area.id === KAMPUNG_ILMU_AREA_ID ? { x: 7, y: 4 } : { x: 9, y: 5 },
    }).setDepth(area.id === KAMPUNG_ILMU_AREA_ID ? 6 : 2)
  })
}

function drawByVisualType(
  graphics: EnvironmentGraphics,
  obstacle: AreaObstacle,
  visualType: AreaObstacleVisual,
  trim: number,
) {
  if (visualType === 'wall') drawWall(graphics, obstacle, trim)
  else if (visualType === 'shelf') drawShelf(graphics, obstacle, trim)
  else if (visualType === 'table') drawTable(graphics, obstacle, trim)
  else if (visualType === 'stall') drawMarketStall(graphics, obstacle)
  else if (visualType === 'crate') drawCrateGroup(graphics, obstacle)
  else drawVillageStructure(graphics, obstacle, trim)
}

export function renderEnvironment(scene: Phaser.Scene, area: AreaDefinition) {
  const visuals = getAreaVisuals(area.id)
  scene.add.rectangle(0, 0, area.width, area.height, visuals.ground).setOrigin(0)
  if (area.id === KAMPUNG_ILMU_AREA_ID) renderKampungGround(scene, area)
  const ground = scene.add.graphics()
  drawZones(scene, ground, area)
  if (area.id !== KAMPUNG_ILMU_AREA_ID) {
    drawFloorPattern(ground, area, area.gridColor)
    ground.lineStyle(42, visuals.path, 0.34)
    ground.beginPath()
    ground.moveTo(area.spawn.x, area.spawn.y)
    ground.lineTo(area.width / 2, area.height / 2)
    ground.lineTo(area.width * 0.78, area.height * 0.3)
    ground.strokePath()
  }

  const environment = scene.add.graphics()
  area.obstacles.forEach((obstacle, index) => {
    if (area.id === KAMPUNG_ILMU_AREA_ID && renderKampungObstacle(scene, obstacle, index)) return
    drawGroundShadow(environment, obstacle, visuals.shadow)
    if (obstacle.visualType) drawByVisualType(environment, obstacle, obstacle.visualType, visuals.structureTrim)
    else if (area.id === PERPUSTAKAAN_HIKMAH_AREA_ID) {
      if (index <= 2 || index === 13 || index === 14) drawWall(environment, obstacle, visuals.structureTrim)
      else if (index >= 3 && index <= 8) drawShelf(environment, obstacle, visuals.structureTrim)
      else if (index >= 9 && index <= 12) drawTable(environment, obstacle, visuals.structureTrim)
      else drawShelf(environment, obstacle, visuals.structureTrim)
    } else if (area.id === BAZAR_LAMA_AREA_ID) {
      if (index <= 1) drawWall(environment, obstacle, VISUAL_PALETTE.sandstone)
      else if (index >= 8) drawCrateGroup(environment, obstacle)
      else drawMarketStall(environment, obstacle)
    } else drawVillageStructure(environment, obstacle, visuals.structureTrim)
  })

  if (area.id !== KAMPUNG_ILMU_AREA_ID) area.landmarks.forEach((landmark) => {
    if (area.id === PERPUSTAKAAN_HIKMAH_AREA_ID && landmark.type === 'circle') drawLightwell(environment, landmark.x, landmark.y, landmark.size)
    else if (landmark.type === 'circle') {
      environment.fillStyle(landmark.color, 0.9)
      environment.fillCircle(landmark.x, landmark.y, landmark.size)
      environment.lineStyle(7, VISUAL_PALETTE.cream, 0.34)
      environment.strokeCircle(landmark.x, landmark.y, landmark.size)
    } else {
      environment.fillStyle(landmark.color, 0.9)
      const points = Array.from({ length: 16 }, (_, index) => {
        const angle = -Math.PI / 2 + (index * Math.PI) / 8
        const radius = index % 2 === 0 ? landmark.size : landmark.size * 0.45
        return new Phaser.Geom.Point(
          landmark.x + Math.cos(angle) * radius,
          landmark.y + Math.sin(angle) * radius,
        )
      })
      environment.fillPoints(points, true)
      environment.lineStyle(4, VISUAL_PALETTE.softGold, 0.55)
      environment.strokeCircle(landmark.x, landmark.y, landmark.size * 0.75)
    }
  })
}
