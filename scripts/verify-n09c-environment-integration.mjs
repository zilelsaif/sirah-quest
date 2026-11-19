import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root))
const text = async (path) => (await read(path)).toString('utf8')
const manifest = JSON.parse(await text('docs/N09_C_Asset_Manifest.json'))

assert.equal(manifest.areaId, 'kampung-ilmu-area')
assert.deepEqual(manifest.worldSize, [2200, 1600])
assert.equal(manifest.assetCount, 23)
assert.equal(manifest.assets.length, 23)
assert.equal(new Set(manifest.assets.map(({ id }) => id)).size, 23)
assert.equal(new Set(manifest.assets.map(({ file }) => file)).size, 23)
assert.equal(manifest.obstacleVisualMapping.length, 14)

for (const asset of manifest.assets) {
  const filename = asset.file.split('/').at(-1)
  const buffer = await read(`src/assets/environments/kampung-ilmu/${filename}`)
  assert.equal(createHash('sha256').update(buffer).digest('hex'), asset.sha256, `${asset.id} hash`)
  assert.deepEqual([...buffer.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `${asset.id} PNG`)
  assert.deepEqual([buffer.readUInt32BE(16), buffer.readUInt32BE(20)], asset.size, `${asset.id} dimensions`)
}

const [scene, renderer, environmentManifest, manager, packageJson, saveConfig] = await Promise.all([
  text('src/game/scenes/TestScene.ts'), text('src/game/visuals/EnvironmentRenderer.ts'),
  text('src/game/visuals/kampungEnvironmentManifest.ts'), text('src/game/worldObjects/WorldObjectManager.ts'),
  text('package.json'), text('src/game/save/config.ts'),
])
assert.match(scene, /this\.area\.id === KAMPUNG_ILMU_AREA_ID\) \{[\s\S]*preloadKampungEnvironmentVisuals\(this\)/)
assert.match(renderer, /renderKampungGround\(scene, area\)/)
assert.match(renderer, /renderKampungObstacle\(scene, obstacle, index, bakedKampung\)/)
assert.match(renderer, /setScale\(scale\)/)
assert.doesNotMatch(renderer, /setDisplaySize/)
assert.match(environmentManifest, /KAMPUNG_OBSTACLE_TEXTURES/)
assert.match(environmentManifest, /if \(!scene\.textures\.exists\(key\)\) scene\.load\.image/)
assert.match(environmentManifest, /KAMPUNG_RESERVED_TEXTURE_URLS/)
assert.match(environmentManifest, /deliberately excluded from the runtime preload list/)
assert.match(manager, /KAMPUNG_TEXTURES\.toolChestOpen/)
assert.match(manager, /KAMPUNG_TEXTURES\.noticeBoard/)
assert.match(manager, /KAMPUNG_TEXTURES\.oldWell/)
assert.match(manager, /KAMPUNG_TEXTURES\.readingHut/)
assert.match(saveConfig, /SAVE_SCHEMA_VERSION = 3/)
assert.equal(JSON.parse(packageJson).scripts['n09c:verify'], 'node scripts/verify-n09c-environment-integration.mjs')

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { QUEST_DATA } = await server.ssrLoadModule('/src/game/quests/questData.ts')
  const { ALL_AREA_CLUES, AREA_DEFINITIONS } = await server.ssrLoadModule('/src/game/areas/areaRegistry.ts')
  const { QUESTION_BANK } = await server.ssrLoadModule('/src/game/questions/questionBank.ts')
  const { NPC_DEFINITIONS } = await server.ssrLoadModule('/src/game/npcs/npcData.ts')
  const { WORLD_OBJECT_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/worldObjectData.ts')
  const { LANDMARK_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/landmarkData.ts')
  assert.deepEqual(
    [QUEST_DATA.length, ALL_AREA_CLUES.length, QUESTION_BANK.length, AREA_DEFINITIONS.length,
      NPC_DEFINITIONS.length, WORLD_OBJECT_DEFINITIONS.length, LANDMARK_DEFINITIONS.length],
    [15, 21, 24, 3, 2, 6, 6],
  )
  const kampung = AREA_DEFINITIONS.find(({ id }) => id === 'kampung-ilmu-area')
  assert.deepEqual([kampung.width, kampung.height, kampung.obstacles.length], [2200, 1600, 14])
  assert.deepEqual(kampung.obstacles.map(({ x, y, width, height }) => [x, y, width, height]),
    manifest.obstacleVisualMapping.map(({ footprint }) => [footprint.x, footprint.y, footprint.width, footprint.height]))
} finally {
  await server.close()
}

console.log('Verified N09-C 23/23 immutable asset hashes and dimensions, Kampung-only lazy preload, 14 unchanged collision footprints, uniform scaling, interactive art states, and protected 15/21/24/3/2/6/6/schema-3 invariants.')
