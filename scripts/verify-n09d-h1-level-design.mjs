import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

await import('./verify-n09d-environment-refinement.mjs')

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const [renderer, layoutSource, packageJson] = await Promise.all([
  read('src/game/visuals/EnvironmentRenderer.ts'),
  read('src/game/visuals/kampungEnvironmentLayout.ts'),
  read('package.json'),
])

function segmentIntersectsRect([x0, y0], [x1, y1], rect, padding) {
  const minX = rect.x - padding
  const maxX = rect.x + rect.width + padding
  const minY = rect.y - padding
  const maxY = rect.y + rect.height + padding
  let tMin = 0
  let tMax = 1
  const dx = x1 - x0
  const dy = y1 - y0
  for (const [origin, delta, min, max] of [[x0, dx, minX, maxX], [y0, dy, minY, maxY]]) {
    if (Math.abs(delta) < 1e-9) {
      if (origin >= min && origin <= max) continue
      return false
    }
    let near = (min - origin) / delta
    let far = (max - origin) / delta
    if (near > far) [near, far] = [far, near]
    tMin = Math.max(tMin, near)
    tMax = Math.min(tMax, far)
    if (tMin > tMax) return false
  }
  return true
}

assert.match(renderer, /KAMPUNG_ROAD_PATHS/)
assert.match(renderer, /renderKampungGardenRow/)
assert.match(renderer, /KAMPUNG_TEXTURES\.raisedPlanter/)
assert.match(renderer, /fillRoundedRect\(obstacle\.x \+ 7, obstacle\.y \+ 5/)
assert.match(renderer, /KAMPUNG_TEXTURES\.fenceVertical/)
assert.match(layoutSource, /main-village-road/)
assert.match(layoutSource, /upper-house-access/)
assert.match(layoutSource, /garden-west-aisle/)
assert.match(layoutSource, /balai-ilmu-approach/)
assert.match(layoutSource, /village-outskirts-trail/)
assert.equal(JSON.parse(packageJson).scripts['n09d-h1:verify'], 'node scripts/verify-n09d-h1-level-design.mjs')

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { AREA_DEFINITIONS } = await server.ssrLoadModule('/src/game/areas/areaRegistry.ts')
  const { KAMPUNG_ROAD_PATHS, KAMPUNG_GARDEN_ROWS, KAMPUNG_RESIDENTIAL_ENTRANCES,
    KAMPUNG_DECORATION_POINTS } = await server.ssrLoadModule('/src/game/visuals/kampungEnvironmentLayout.ts')
  const kampung = AREA_DEFINITIONS.find(({ id }) => id === 'kampung-ilmu-area')

  assert.equal(KAMPUNG_ROAD_PATHS.length, 8)
  assert.equal(new Set(KAMPUNG_ROAD_PATHS.map(({ id }) => id)).size, 8)
  for (const road of KAMPUNG_ROAD_PATHS) {
    assert.ok(road.width >= 48 && road.width <= 84, `${road.id} has a deliberate walkable width`)
    for (let index = 0; index < road.points.length - 1; index += 1) {
      for (let obstacleIndex = 0; obstacleIndex < kampung.obstacles.length; obstacleIndex += 1) {
        const overlaps = segmentIntersectsRect(
          road.points[index], road.points[index + 1], kampung.obstacles[obstacleIndex], road.width / 2 + 17,
        )
        assert.equal(overlaps, false, `${road.id} segment ${index} overlaps O${String(obstacleIndex + 1).padStart(2, '0')}`)
      }
    }
  }

  assert.deepEqual(KAMPUNG_GARDEN_ROWS.map(({ obstacleIndex }) => obstacleIndex), [7, 8, 9])
  KAMPUNG_GARDEN_ROWS.forEach(({ obstacleIndex, planterBottoms }) => {
    const obstacle = kampung.obstacles[obstacleIndex]
    assert.equal(planterBottoms.length, 3)
    planterBottoms.forEach((bottomY) => {
      assert.ok(bottomY > obstacle.y && bottomY <= obstacle.y + obstacle.height)
    })
    KAMPUNG_ROAD_PATHS.forEach((road) => {
      for (let index = 0; index < road.points.length - 1; index += 1) {
        assert.equal(segmentIntersectsRect(
          road.points[index], road.points[index + 1], obstacle, road.width / 2 + 17,
        ), false, `cultivated O${obstacleIndex + 1} overlaps ${road.id}`)
      }
    })
  })

  assert.deepEqual(KAMPUNG_RESIDENTIAL_ENTRANCES.map(({ obstacleIndex }) => obstacleIndex), [4, 5, 6])
  KAMPUNG_RESIDENTIAL_ENTRANCES.forEach(({ obstacleIndex, roadId, point }) => {
    const obstacle = kampung.obstacles[obstacleIndex]
    const road = KAMPUNG_ROAD_PATHS.find(({ id }) => id === roadId)
    assert.ok(road.points.some(([x, y]) => x === point[0] && y === point[1]), `${roadId} reaches entrance`)
    assert.ok(Math.abs(point[0] - (obstacle.x + obstacle.width / 2)) <= 1)
    assert.ok(point[1] > obstacle.y + obstacle.height && point[1] - (obstacle.y + obstacle.height) <= 50)
  })

  assert.equal(KAMPUNG_DECORATION_POINTS.length, 24)
  assert.equal(new Set(KAMPUNG_DECORATION_POINTS.map((point) => point.join(','))).size, 24)
  assert.equal(kampung.clues.length, 7)
} finally {
  await server.close()
}

console.log('Verified N09-D H1 full-width roads avoid all 14 obstacle footprints, three collider-backed crop rows avoid roads, residential paths reach three house entrances, and deterministic composition preserves seven Kampung clues.')
