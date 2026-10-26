import Phaser from 'phaser'
import type { AreaDefinition, AreaObstacle } from '../areas/types'
import { BAZAR_LAMA_AREA_ID, KAMPUNG_ILMU_AREA_ID, PERPUSTAKAAN_HIKMAH_AREA_ID } from '../areas/areaRegistry'
import { getAreaVisuals, VISUAL_PALETTE } from './visualTheme'

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

export function renderEnvironment(scene: Phaser.Scene, area: AreaDefinition) {
  const visuals = getAreaVisuals(area.id)
  scene.add.rectangle(0, 0, area.width, area.height, visuals.ground).setOrigin(0)
  const ground = scene.add.graphics()
  drawFloorPattern(ground, area, area.gridColor)
  ground.lineStyle(area.id === KAMPUNG_ILMU_AREA_ID ? 54 : 42, visuals.path, 0.34)
  ground.beginPath()
  ground.moveTo(area.spawn.x, area.spawn.y)
  ground.lineTo(area.width / 2, area.height / 2)
  ground.lineTo(area.width * 0.78, area.height * 0.3)
  ground.strokePath()

  const environment = scene.add.graphics()
  area.obstacles.forEach((obstacle, index) => {
    drawGroundShadow(environment, obstacle, visuals.shadow)
    if (area.id === PERPUSTAKAAN_HIKMAH_AREA_ID) {
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

  area.landmarks.forEach((landmark) => {
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
