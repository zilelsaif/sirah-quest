import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

await import('./verify-n09g-rendering-optimization.mjs')

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const [fog, config, scene, diagnostics, navigation, canvas, renderer, packageJson] = await Promise.all([
  read('src/game/fog/FogOfWar.ts'),
  read('src/game/performance/renderingConfig.ts'),
  read('src/game/scenes/TestScene.ts'),
  read('src/game/performance/FrameDiagnostics.tsx'),
  read('src/game/navigation/ExplorationNavigation.tsx'),
  read('src/game/GameCanvas.tsx'),
  read('src/game/visuals/EnvironmentRenderer.ts'),
  read('package.json'),
])

assert.match(fog, /addDynamicTexture\(textureKey, mapWidth, mapHeight\)/)
assert.match(fog, /createBitmapMask\(this\.exploredMaskTexture\)/)
assert.match(fog, /this\.exploredMaskTexture\.stamp\([\s\S]*scale: visionRadius \/ 32/)
assert.match(fog, /initialDiscoveryPoints\.forEach[\s\S]*this\.exploredMaskTexture\.draw\(reconstruction\)/)
assert.match(fog, /scene\.game\.renderer\.type === Phaser\.WEBGL/)
assert.match(fog, /explorationStrategy: this\.rasterExploration \? 'cached-raster' : 'geometry'/)
assert.match(fog, /exploredGeometryCommands: this\.rasterExploration \? 0 : this\.discoveryPoints\.length/)
assert.match(config, /import\.meta\.env\.DEV[\s\S]*n09gIsolation/)
assert.match(config, /'explored-disabled'[\s\S]*'all-disabled'[\s\S]*'mini-map-disabled'[\s\S]*'minimal-scene'/)
assert.match(config, /n09gSyntheticPoints[\s\S]*Math\.min\(syntheticPoints, 2500\)/)
assert.match(scene, /fogIsolationMode === 'normal' && !syntheticDiscoveryPoints \? \(points\) =>/)
assert.match(scene, /UNMASKED_RENDERER_WEBGL/)
assert.match(scene, /canvasPhysicalWidth: this\.game\.canvas\.width/)
assert.match(scene, /discoveryPointCount: fogDiagnostics\.discoveryPointCount/)
assert.match(diagnostics, /rawFrameIntervals/)
assert.match(diagnostics, /recordMiniMapDraw\(\)/)
assert.match(diagnostics, /recordReactCommit\(\)/)
assert.match(navigation, /disabledRendering\?: boolean/)
assert.match(canvas, /disabledRendering=\{renderingConfig\.miniMapDisabled\}/)
assert.match(renderer, /minimal && bakedKampung/)
assert.equal(JSON.parse(packageJson).scripts['n09g-h1:verify'], 'node scripts/verify-n09g-h1-fog-isolation.mjs')

console.log('Verified N09-G H1 cached-raster WebGL exploration with Canvas fallback, bounded runtime geometry, save-isolated development bypasses, renderer/GPU/canvas/discovery/frame/map/React instrumentation, and minimal-scene isolation.')
