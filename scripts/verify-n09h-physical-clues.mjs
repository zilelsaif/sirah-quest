import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'

await import('./verify-n09g-h1-fog-isolation.mjs')

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const expected = [
  ['clue-1', 'early-life', 430, 400, 'ki-c01-kitab-permulaan.png', '496fe4d09fd2a5f60fcb3982df4031d4bff85d73d8cae67e2227047af14e4c41'],
  ['clue-2', 'first-revelation', 820, 430, 'ki-c02-gulungan-catatan-wahyu.png', '60cc823387c427190e7dbb9812d62ffd7ac83dc95cfea3b2df06d4cae875635b'],
  ['clue-3', 'hijrah', 1100, 740, 'ki-c03-peta-perjalanan.png', 'beab60d2b0d75b073a2e31e2803c8981eb8d0fea1d0083ede0dcac8ac9e48060'],
  ['pack1-kampung-catatan-awal', 'early-life', 1450, 400, 'ki-c04-buku-catatan-kampung.png', '26b0d2f5b1b7c4fa7c70596e8f68483b8ca1915ebbd91ccd372f99aff92dca8b'],
  ['pack1-kampung-lembaran-ilmu', 'first-revelation', 1450, 1150, 'ki-c05-himpunan-lembaran-ilmu.png', '7d4b88f91b4fabdcb16ac5dc429449f712eff27caa16b5a9ef511d2396e27346'],
  ['pack2-kampung-nota-balai', 'early-life', 1200, 1100, 'ki-c06-buku-nota-balai.png', '951b416d7cd68f5bcdc153f93dd1678d0144afb57cddb3afcaa2564741efc5a0'],
  ['pack2-kampung-jejak-lembaran', 'first-revelation', 2000, 620, 'ki-c07-bekas-manuskrip.png', '3be2d32fe665959891fb444f72c2fbd0b019e69b244b73abeeb4ce2a5042bdbc'],
]

for (const [, , , , file, hash] of expected) {
  const bytes = readFileSync(new URL(`../src/assets/clues/kampung-ilmu/${file}`, import.meta.url))
  assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, `${file} hash changed`)
  assert.equal(bytes.readUInt32BE(16), 256, `${file} width changed`)
  assert.equal(bytes.readUInt32BE(20), 256, `${file} height changed`)
  assert.equal(bytes[25], 6, `${file} must remain RGBA PNG`)
}

const manifest = read('src/game/clues/kampungClueVisualManifest.ts')
const manager = read('src/game/clues/ClueManager.ts')
const scene = read('src/game/scenes/TestScene.ts')
const canvas = read('src/game/GameCanvas.tsx')
const panel = read('src/game/clues/ClueInspectionPanel.tsx')
const types = read('src/game/clues/types.ts')
const styles = read('src/styles.css')
const packageJson = JSON.parse(read('package.json'))

for (const [clueId, , , , file] of expected) {
  assert.match(manifest, new RegExp(`'${clueId.replaceAll('-', '\\-')}'`))
  assert.match(manifest, new RegExp(file.replaceAll('.', '\\.')))
}
assert.equal((manifest.match(/status: 'PROTOTYPE_VISUAL_QA_PENDING'/g) ?? []).length, 2)
assert.match(manifest, /origin: \[0\.5, 0\.90625\]/)
assert.match(manifest, /scale: 0\.22/)
assert.match(manifest, /if \(!scene\.textures\.exists\(textureKey\)\) scene\.load\.image/)
assert.match(scene, /preloadKampungClueVisuals\(this\)/)
assert.match(manager, /this\.scene\.textures\.exists\(physicalMetadata\.textureKey\)/)
assert.match(manager, /else \{[\s\S]*base = this\.scene\.add\.ellipse/)
assert.match(manager, /kampungWorldDepth\(definition\.y\) \+ 0\.5/)
assert.match(manager, /usesPhysicalInspection \? 'inspection' : 'question'/)
assert.match(manager, /this\.scene\.registry\.get\('areaId'\) === KAMPUNG_ILMU_AREA_ID/)
assert.match(manager, /continueOpenClue\(\)[\s\S]*this\.openStage = 'question'/)
assert.match(manager, /this\.openStage !== 'question'/)
assert.match(manager, /this\.openStage = undefined[\s\S]*onMovementLockChange\(false\)/)
assert.doesNotMatch(manager, /new WorldObjectManager|new ClueManager/)
assert.match(types, /kind: 'inspection'/)
assert.match(types, /kind: 'question'/)
assert.match(canvas, /openClue\?\.kind === 'inspection'/)
assert.match(canvas, /continueClueInspection/)
assert.match(panel, /Baca Soalan \/ Read Question/)
assert.match(panel, /Semak Semula \/ Review/)
assert.match(panel, /Prop pembelajaran rekaan/)
assert.match(styles, /\.clue-inspection-panel[\s\S]*position: absolute[\s\S]*background:/)

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
try {
  const { AREA_REGISTRY } = await server.ssrLoadModule('/src/game/areas/areaRegistry.ts')
  const { CLUE_DISCOVERY_RADIUS } = await server.ssrLoadModule('/src/game/clues/clueData.ts')
  const kampung = AREA_REGISTRY['kampung-ilmu-area']
  assert.equal(CLUE_DISCOVERY_RADIUS, 150)
  assert.deepEqual(kampung.clues.map(({ id, questionTopicId, x, y, interactionRadius }) =>
    [id, questionTopicId, x, y, interactionRadius]), expected.map(([id, topic, x, y]) => [id, topic, x, y, 78]))
} finally {
  await server.close()
}

assert.equal(packageJson.scripts['n09h:verify'], 'node scripts/verify-n09h-physical-clues.mjs')
console.log('Verified N09-H-C 7/7 immutable RGBA clue assets and ID-keyed metadata, exact coordinates/topics/radii, Kampung-only preload, per-texture fallback, physical Y-depth, inspection→question lifecycle, movement-lock cleanup, responsive bilingual inspection and preserved N09-G-H1 baseline.')
