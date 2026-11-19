import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

await import('./verify-n09c-environment-integration.mjs')

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const [renderer, layout, fog, scene, clueManager, npcManager, objectManager, environmentManifest, packageJson] = await Promise.all([
  read('src/game/visuals/EnvironmentRenderer.ts'), read('src/game/visuals/kampungEnvironmentLayout.ts'),
  read('src/game/fog/FogOfWar.ts'),
  read('src/game/scenes/TestScene.ts'), read('src/game/clues/ClueManager.ts'), read('src/game/npcs/NpcManager.ts'),
  read('src/game/worldObjects/WorldObjectManager.ts'), read('src/game/visuals/kampungEnvironmentManifest.ts'),
  read('package.json'),
])

assert.match(renderer, /createOrganicTerrainMask/)
assert.match(renderer, /KAMPUNG_TEXTURES\.dirtEdge/)
assert.match(renderer, /KAMPUNG_TEXTURES\.dirtFill/)
assert.match(renderer, /createOrganicTerrainMask\(scene, KAMPUNG_ROAD_PATHS/)
assert.match(layout, /main-village-road[\s\S]*north-residential-road[\s\S]*balai-ilmu-approach/)
assert.doesNotMatch(renderer, /addTexturedPathSegment/)
assert.match(renderer, /createLandscapeVariationMask/)
assert.match(renderer, /Phaser\.Scenes\.Events\.SHUTDOWN[\s\S]*mask\.destroy\(\)[\s\S]*source\.destroy\(\)/)
assert.match(renderer, /addKampungContactShadow/)
assert.match(renderer, /const bottomY = obstacle\.y \+ segmentHeight[\s\S]*setDepth\(kampungWorldDepth\(bottomY\)\)/)
assert.match(renderer, /keys\.some\(\(key\) => !scene\.textures\.exists\(key\)\)/)
assert.match(renderer, /if \(area\.id !== KAMPUNG_ILMU_AREA_ID\) area\.landmarks\.forEach/)
assert.match(renderer, /if \(area\.id !== KAMPUNG_ILMU_AREA_ID\) \{[\s\S]*strokeRoundedRect/)
assert.match(renderer, /KAMPUNG_DECORATION_POINTS\.forEach/)
assert.match(layout, /KAMPUNG_DECORATION_POINTS[\s\S]*\[430, 940\]/)
assert.match(renderer, /'Jejak Ilmu'[\s\S]*setOrigin\(0\.5\)/)
assert.match(environmentManifest, /KAMPUNG_WORLD_DEPTH_BASE = 10/)
assert.match(environmentManifest, /KAMPUNG_WORLD_DEPTH_SCALE = 0\.03/)
assert.match(environmentManifest, /KAMPUNG_RESERVED_TEXTURE_URLS/)
assert.match(npcManager, /kampungWorldDepth\(definition\.position\.y\)/)
assert.match(objectManager, /kampungWorldDepth\(definition\.position\.y\)/)
assert.match(scene, /this\.player\.setDepth\(kampungWorldDepth\(this\.player\.y\)\)/)
assert.match(clueManager, /kampungWorldDepth\(definition\.y\) \+ 0\.5/)

assert.match(fog, /useSoftVisibleEdge = false/)
assert.match(fog, /this\.visibleFeather = scene\.add\.graphics\(\)\.setDepth\(90\.5\)/)
assert.match(fog, /visionRadius - inset/)
assert.match(fog, /visibleMaskSource\.clear\(\)\.fillStyle\(0xffffff\)\.fillCircle\(playerX, playerY, visionRadius\)/)
assert.match(fog, /exploredMaskSource\?\.fillStyle\(0xffffff\)\.fillCircle\(playerX, playerY, visionRadius\)/)
assert.match(scene, /this\.area\.id === KAMPUNG_ILMU_AREA_ID && this\.renderingConfig\.fogEdgeMode === 'soft'/)
assert.equal(JSON.parse(packageJson).scripts['n09d:verify'], 'node scripts/verify-n09d-environment-refinement.mjs')

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { AREA_DEFINITIONS } = await server.ssrLoadModule('/src/game/areas/areaRegistry.ts')
  const { NPC_DEFINITIONS } = await server.ssrLoadModule('/src/game/npcs/npcData.ts')
  const { WORLD_OBJECT_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/worldObjectData.ts')
  const { LANDMARK_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/landmarkData.ts')
  const kampung = AREA_DEFINITIONS.find(({ id }) => id === 'kampung-ilmu-area')
  assert.deepEqual(kampung.spawn, { x: 300, y: 300 })
  assert.deepEqual(kampung.clues.map(({ id, x, y }) => [id, x, y]), [
    ['clue-1', 430, 400], ['clue-2', 820, 430], ['clue-3', 1100, 740],
    ['pack1-kampung-catatan-awal', 1450, 400], ['pack1-kampung-lembaran-ilmu', 1450, 1150],
    ['pack2-kampung-nota-balai', 1200, 1100], ['pack2-kampung-jejak-lembaran', 2000, 620],
  ])
  assert.deepEqual(NPC_DEFINITIONS.filter(({ areaId }) => areaId === kampung.id)
    .map(({ id, position }) => [id, position.x, position.y]), [['npc-penjaga-balai-ilmu', 500, 600]])
  assert.deepEqual(WORLD_OBJECT_DEFINITIONS.filter(({ areaId }) => areaId === kampung.id)
    .map(({ id, position }) => [id, position.x, position.y]), [
      ['world-object-kampung-notice-board', 1060, 360],
      ['world-object-kampung-tool-chest', 670, 1040],
    ])
  assert.deepEqual(LANDMARK_DEFINITIONS.filter(({ areaId }) => areaId === kampung.id)
    .map(({ id, position }) => [id, position.x, position.y]), [
      ['landmark-kampung-telaga-lama', 1300, 600],
      ['landmark-kampung-pondok-bacaan', 450, 1120],
    ])
  assert.deepEqual(AREA_DEFINITIONS.filter(({ id }) => id !== kampung.id)
    .map(({ id, width, height, obstacles, clues }) => [id, width, height, obstacles.length, clues.length]), [
      ['bazar-lama-area', 2304, 1568, 20, 7],
      ['perpustakaan-hikmah-area', 2304, 1568, 29, 7],
    ])
} finally {
  await server.close()
}

console.log('Verified N09-D organic static terrain masks, contact shadows, deterministic composition, shared Kampung Y-depth, suppressed legacy geometry, selectable soft-fog logical-radius preservation, cleanup/fallback and unchanged spawn/NPC/clue/object/landmark positions.')
