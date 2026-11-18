import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const run = (script) => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url))], { encoding: 'utf8' })
  assert.equal(result.status, 0, `${script} failed:\n${result.stdout}\n${result.stderr}`)
}

run('./verify-n09e-final-environment.mjs')

const diagnostics = read('src/game/performance/FrameDiagnostics.tsx')
const gameCanvas = read('src/game/GameCanvas.tsx')
const hud = read('src/game/ui/AdventureHUD.tsx')
const map = read('src/game/navigation/illustratedAreaMap.ts')
const navigation = read('src/game/navigation/ExplorationNavigation.tsx')
const viteConfig = read('vite.config.ts')
const disabledDiagnostics = read('src/game/performance/FrameDiagnostics.disabled.tsx')
const layout = read('src/game/visuals/kampungEnvironmentLayout.ts')
const registry = read('src/game/areas/areaRegistry.ts')

assert.match(diagnostics, /FRAME_DIAGNOSTIC_BUFFER_SIZE = 600/, 'diagnostic sample buffer must be bounded')
assert.match(diagnostics, /FRAME_DIAGNOSTIC_UPDATE_MS = 500/, 'display snapshots must be limited to 2 Hz')
assert.match(diagnostics, /document\.hidden/, 'background-tab samples must be ignored')
assert.match(diagnostics, /p95FrameMs: percentile\(ordered, 0\.95\)/, 'P95 frame time must be calculated')
assert.match(diagnostics, /value > 33/, 'frames over 33 ms must be counted')
assert.match(diagnostics, /value > 50/, 'frames over 50 ms must be counted')
assert.match(diagnostics, /VITE_INCLUDE_PERFORMANCE_MONITOR !== 'false'/, 'future beta exclusion flag is missing')
assert.match(viteConfig, /VITE_INCLUDE_PERFORMANCE_MONITOR === 'false'/, 'build-time exclusion switch is missing')
assert.match(viteConfig, /FrameDiagnostics\.disabled\.tsx/, 'disabled build must replace the diagnostics module')
assert.match(disabledDiagnostics, /PERFORMANCE_MONITOR_INCLUDED = false/, 'disabled module must remove the monitor UI')
assert.match(gameCanvas, /game\.events\.on\('step', recordFrame\)/, 'monitor must sample real Phaser game steps')
assert.match(gameCanvas, /FrameDiagnosticsOverlay/, 'gameplay overlay is missing')
assert.match(hud, /Monitor FPS pembangunan/, 'Display & Audio toggle is missing')

assert.match(map, /baseMapCache = new Map/, 'static map cache is missing')
assert.match(map, /KAMPUNG_ROAD_PATHS/, 'illustrated map must use the accepted road layout')
assert.match(map, /KAMPUNG_ENTRANCE_PATHS/, 'illustrated map must include entrance paths')
assert.match(map, /KAMPUNG_GARDEN_ROWS/, 'illustrated map must include crop rows')
assert.match(map, /KAMPUNG_TREE_PLACEMENT/, 'illustrated map must include the integrated tree')
assert.match(map, /area\.landmarks\.forEach/, 'illustrated map must include existing landmarks')
assert.match(navigation, /clipDiscovery\(context, session\.fogDiscoveryPoints/, 'discovery clipping must remain active')
assert.match(navigation, /context\.drawImage\(staticBaseMap/, 'static base map must be reused')
assert.match(navigation, /state === 'hidden'\) return/, 'hidden clue markers must remain protected')
assert.match(navigation, /session\.playerPosition\.x \* scaleX/, 'player marker world-to-map mapping is missing')
assert.match(navigation, /x: \(clientX - bounds\.left\) \/ bounds\.width \* area\.width/, 'inverse map coordinate mapping is missing')

assert.match(registry, /KAMPUNG_ILMU_AREA_ID = 'kampung-ilmu-area'/)
assert.match(registry, /BAZAR_LAMA_AREA_ID = 'bazar-lama-area'/)
assert.match(registry, /PERPUSTAKAAN_HIKMAH_AREA_ID = 'perpustakaan-hikmah-area'/)
assert.equal((layout.match(/obstacleIndex:/g) ?? []).length >= 9, true, 'Kampung layout data appears incomplete')

console.log('N09-F performance diagnostics and illustrated map verification passed.')
