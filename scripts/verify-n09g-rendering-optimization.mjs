import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const rootUrl = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, rootUrl), 'utf8')
const run = (script) => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url))], { encoding: 'utf8' })
  assert.equal(result.status, 0, `${script} failed:\n${result.stdout}\n${result.stderr}`)
}

run('./verify-n09f-performance-map.mjs')

const bakedAsset = fileURLToPath(new URL('src/assets/environments/kampung-ilmu/kampung-ilmu-background.webp', rootUrl))
const preview = fileURLToPath(new URL('docs/qa/n09g-kampung-ilmu-composite-preview.png', rootUrl))
const baker = read('scripts/bake-kampung-map.mjs')
const renderer = read('src/game/visuals/EnvironmentRenderer.ts')
const manifest = read('src/game/visuals/kampungEnvironmentManifest.ts')
const fog = read('src/game/fog/FogOfWar.ts')
const scene = read('src/game/scenes/TestScene.ts')
const config = read('src/game/performance/renderingConfig.ts')
const diagnostics = read('src/game/performance/FrameDiagnostics.tsx')
const hud = read('src/game/ui/AdventureHUD.tsx')

assert.ok(existsSync(bakedAsset) && statSync(bakedAsset).size > 100_000, 'baked WebP is missing or unexpectedly small')
assert.ok(existsSync(preview) && statSync(preview).size > 100_000, 'full-map composite preview is missing')
assert.match(baker, /const width = 2200/)
assert.match(baker, /const height = 1600/)
assert.match(baker, /KAMPUNG_ROAD_PATHS/)
assert.match(baker, /KAMPUNG_ENTRANCE_PATHS/)
assert.match(baker, /KAMPUNG_GARDEN_ROWS/)
assert.match(baker, /compression_level', '6'/)
assert.match(manifest, /kampung-ilmu-background\.webp/)
assert.match(manifest, /scene\.load\.image\(KAMPUNG_TEXTURES\.bakedBackground/)

assert.match(config, /kampungRenderMode: 'baked'/, 'baked mode must be the default')
assert.match(config, /fogEdgeMode: 'classic'/, 'classic fog must be the default')
assert.match(scene, /fogEdgeMode === 'soft'/, 'soft fog must only be enabled explicitly')
assert.match(fog, /activeMaskCount: this\.useSoftVisibleEdge \? 3 : 2/)
assert.match(renderer, /renderBakedKampungGround/)
assert.match(renderer, /maximumTextureSize < Math\.max\(area\.width, area\.height\)/, 'texture-size fallback is missing')
assert.match(renderer, /modeUsed: bakedKampung \? 'baked' : 'modular'/, 'modular fallback reporting is missing')
assert.match(renderer, /activeMaskCount: area\.id === KAMPUNG_ILMU_AREA_ID && !bakedKampung \? 6 : 0/)
assert.match(hud, />Baked</)
assert.match(hud, />Modular</)
assert.match(hud, />Classic Fog</)
assert.match(hud, />Soft Fog</)
assert.match(diagnostics, /sceneLoadMs/)
assert.match(diagnostics, /displayObjectCount/)
assert.match(diagnostics, /activeMaskCount/)
assert.match(diagnostics, /textureCount/)

const registry = read('src/game/areas/areaRegistry.ts')
const kampungBlock = registry.slice(registry.indexOf('id: KAMPUNG_ILMU_AREA_ID'), registry.indexOf('id: BAZAR_LAMA_AREA_ID'))
assert.equal((kampungBlock.match(/\{ x: \d+, y: \d+, width: \d+, height: \d+, color:/g) ?? []).length, 14)
assert.equal((kampungBlock.match(/title: /g) ?? []).length, 7)

console.log('N09-G rendering optimization and performance recovery verification passed.')
