import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

await import('./verify-n09d-h1-level-design.mjs')

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const [renderer, layoutSource, manifestSource, objectManager, packageJson] = await Promise.all([
  read('src/game/visuals/EnvironmentRenderer.ts'), read('src/game/visuals/kampungEnvironmentLayout.ts'),
  read('src/game/visuals/kampungEnvironmentManifest.ts'), read('src/game/worldObjects/WorldObjectManager.ts'),
  read('package.json'),
])

function segmentIntersectsRect([x0, y0], [x1, y1], rect, padding) {
  const bounds = [rect.x - padding, rect.x + rect.width + padding, rect.y - padding, rect.y + rect.height + padding]
  let tMin = 0
  let tMax = 1
  for (const [origin, delta, min, max] of [[x0, x1 - x0, bounds[0], bounds[1]], [y0, y1 - y0, bounds[2], bounds[3]]]) {
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

assert.match(renderer, /KAMPUNG_ENTRANCE_PATHS/)
assert.match(renderer, /doorstepEdge\.setMask\(createOrganicTerrainMask\(scene, KAMPUNG_ENTRANCE_PATHS, 8/)
assert.match(renderer, /doorstepFill\.setMask\(createOrganicTerrainMask\(scene, KAMPUNG_ENTRANCE_PATHS, 0/)
assert.match(renderer, /renderKampungTree/)
assert.match(renderer, /KAMPUNG_TREE_PLACEMENT\.scale/)
assert.match(renderer, /addKampungContactShadow\([\s\S]*bottomY/)
assert.match(renderer, /pathMottle[\s\S]*setTileScale\(1\.17\)/)
assert.match(renderer, /Math\.ceil\(distance \/ 12\)/)
assert.match(renderer, /KAMPUNG_FRONT_YARD_DETAILS\.forEach/)
assert.match(layoutSource, /doorstep-storage-shed/)
assert.match(manifestSource, /\[KAMPUNG_TEXTURES\.tree, treeUrl\]/)
assert.doesNotMatch(manifestSource, /KAMPUNG_RESERVED_TEXTURE_URLS = \{[\s\S]*KAMPUNG_TEXTURES\.tree/)
assert.match(objectManager, /shadow\.setPosition\(7, 18\)\.setDisplaySize/)
assert.equal(JSON.parse(packageJson).scripts['n09e:verify'], 'node scripts/verify-n09e-final-environment.mjs')

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { AREA_DEFINITIONS } = await server.ssrLoadModule('/src/game/areas/areaRegistry.ts')
  const { NPC_DEFINITIONS } = await server.ssrLoadModule('/src/game/npcs/npcData.ts')
  const { WORLD_OBJECT_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/worldObjectData.ts')
  const { LANDMARK_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/landmarkData.ts')
  const { KAMPUNG_ENTRANCE_PATHS, KAMPUNG_ENTRANCE_TARGETS, KAMPUNG_TREE_PLACEMENT,
    KAMPUNG_FRONT_YARD_DETAILS } = await server.ssrLoadModule('/src/game/visuals/kampungEnvironmentLayout.ts')
  const kampung = AREA_DEFINITIONS.find(({ id }) => id === 'kampung-ilmu-area')

  assert.equal(KAMPUNG_ENTRANCE_PATHS.length, 5)
  assert.equal(KAMPUNG_ENTRANCE_TARGETS.length, 5)
  KAMPUNG_ENTRANCE_PATHS.forEach((path) => {
    const target = KAMPUNG_ENTRANCE_TARGETS.find(({ pathId }) => pathId === path.id)
    assert.ok(target, `${path.id} has an explicit building target`)
    for (let segment = 0; segment < path.points.length - 1; segment += 1) {
      kampung.obstacles.forEach((obstacle, obstacleIndex) => {
        if (obstacleIndex === target.obstacleIndex) return
        assert.equal(segmentIntersectsRect(path.points[segment], path.points[segment + 1], obstacle, 21), false,
          `${path.id} crosses non-target obstacle O${obstacleIndex + 1}`)
      })
    }
    const obstacle = kampung.obstacles[target.obstacleIndex]
    const endpoint = path.points.at(-1)
    assert.equal(endpoint[0], obstacle.x + obstacle.width / 2)
    assert.ok(Math.abs(endpoint[1] - (target.visibleGroundY + 20)) <= 1)
    const visualTop = endpoint[1] - 21
    assert.ok(obstacle.y + obstacle.height - visualTop <= target.maxVisualIntrusion)
  })

  const treeObstacle = kampung.obstacles[KAMPUNG_TREE_PLACEMENT.obstacleIndex]
  const [treeX, treeY] = KAMPUNG_TREE_PLACEMENT.point
  assert.ok(treeX >= treeObstacle.x && treeX <= treeObstacle.x + treeObstacle.width)
  assert.ok(treeY >= treeObstacle.y && treeY <= treeObstacle.y + treeObstacle.height)
  assert.ok(KAMPUNG_TREE_PLACEMENT.scale >= 0.4 && KAMPUNG_TREE_PLACEMENT.scale <= 0.5)
  const protectedPoints = [
    kampung.spawn,
    ...kampung.clues.map(({ x, y }) => ({ x, y })),
    ...NPC_DEFINITIONS.filter(({ areaId }) => areaId === kampung.id).map(({ position }) => position),
    ...WORLD_OBJECT_DEFINITIONS.filter(({ areaId }) => areaId === kampung.id).map(({ position }) => position),
    ...LANDMARK_DEFINITIONS.filter(({ areaId }) => areaId === kampung.id).map(({ position }) => position),
  ]
  protectedPoints.forEach(({ x, y }) => {
    assert.ok(Math.hypot(treeX - x, treeY - y) > 180, 'tree remains clear of protected interactions')
  })
  assert.equal(KAMPUNG_FRONT_YARD_DETAILS.length, 8)
  assert.equal(new Set(KAMPUNG_FRONT_YARD_DETAILS.map(({ point }) => point.join(','))).size, 8)
  assert.deepEqual([kampung.obstacles.length, kampung.clues.length], [14, 7])
} finally {
  await server.close()
}

console.log('Verified N09-E five aligned entrance aprons, safe collider-backed KI-T01 placement, per-asset contact shadows, deterministic front-yard detailing, smoother masked terrain, and preserved H1 road/crop clearance and protected interactions.')
