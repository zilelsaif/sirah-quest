import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile, readdir, stat } from 'node:fs/promises'
import { createServer } from 'vite'

const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
try {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  const { getCameraMetrics, CAMERA_ZOOM_LIMITS } = await server.ssrLoadModule('/src/game/camera/cameraConfig.ts')
  const { QUESTION_BANK } = await server.ssrLoadModule('/src/game/questions/questionBank.ts')
  const { QUEST_DATA } = await server.ssrLoadModule('/src/game/quests/questData.ts')
  const { ALL_AREA_CLUES, AREA_REGISTRY } = await server.ssrLoadModule('/src/game/areas/areaRegistry.ts')
  const { WORLD_OBJECT_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/worldObjectData.ts')
  const { LANDMARK_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/landmarkData.ts')
  const { SAVE_SCHEMA_VERSION, SAVE_APP_VERSION } = await server.ssrLoadModule('/src/game/save/config.ts')

  assert.equal(pkg.version, '0.29.0'); assert.equal(SAVE_SCHEMA_VERSION, 3); assert.equal(SAVE_APP_VERSION, '0.29.0')
  assert.equal(QUEST_DATA.length, 15); assert.equal(ALL_AREA_CLUES.length, 21); assert.equal(QUESTION_BANK.length, 24)
  assert.equal(Object.keys(AREA_REGISTRY).length, 3); assert.equal(WORLD_OBJECT_DEFINITIONS.length, 6); assert.equal(LANDMARK_DEFINITIONS.length, 6)
  assert.deepEqual(Object.fromEntries(['early-life', 'first-revelation', 'hijrah'].map((id) => [id, QUESTION_BANK.filter(({ topicId }) => topicId === id).length])), { 'early-life': 8, 'first-revelation': 8, hijrah: 8 })
  const currentBank = await readFile(new URL('../src/game/questions/questionBank.ts', import.meta.url), 'utf8')
  const releasedBank = execFileSync('git', ['show', 'v0.28.0:src/game/questions/questionBank.ts'], { encoding: 'utf8' }).replaceAll('\r\n', '\n')
  const editorialBank = releasedBank
    .replace("option('abu-talib', 'Abu Talib', 'Abu Talib')", "option('abu-talib', 'Abu Talib bin Abdul Muttalib', 'Abu Talib ibn Abd al-Muttalib')")
    .replace("option('hamzah', 'Hamzah', 'Hamzah')", "option('hamzah', 'Hamzah bin Abdul Muttalib', 'Hamzah ibn Abd al-Muttalib')")
    .replace("option('abbas', 'Al-Abbas', 'Al-Abbas')", "option('abbas', 'Al-Abbas bin Abdul Muttalib', 'Al-Abbas ibn Abd al-Muttalib')")
    .replace("option('hira', 'Gua Hira', 'Cave of Hira')", 'option(\'hira\', "Gua Hira\'", "Cave of Hira\'")')
    .replace("text('Wahyu pertama diterima di Gua Hira berhampiran Makkah.', 'The first revelation was received in the Cave of Hira near Makkah.')", 'text("Wahyu pertama diterima di Gua Hira\' berhampiran Makkah.", "The first revelation was received in the Cave of Hira\' near Makkah.")')
  assert.equal(currentBank.replaceAll('\r\n', '\n'), editorialBank, 'Only the two owner-approved editorial corrections may differ from v0.28.0')

  const viewports = [[1920, 1080], [1366, 768], [1024, 768], [390, 844], [844, 390], [360, 640], [800, 450]]
  for (const [width, height] of viewports) {
    const normal = getCameraMetrics(width, height, 'normal'); const wide = getCameraMetrics(width, height, 'wide')
    assert.ok(normal.zoom >= CAMERA_ZOOM_LIMITS.min && normal.zoom <= CAMERA_ZOOM_LIMITS.max, `${width}x${height} normal zoom`)
    assert.ok(wide.zoom >= CAMERA_ZOOM_LIMITS.min && wide.zoom <= normal.zoom, `${width}x${height} wide zoom`)
    assert.ok(wide.worldViewWidth >= normal.worldViewWidth && wide.worldViewHeight >= normal.worldViewHeight)
  }

  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const bootstrap = await readFile(new URL('../src/game/bootstrap.ts', import.meta.url), 'utf8')
  const canvas = await readFile(new URL('../src/game/GameCanvas.tsx', import.meta.url), 'utf8')
  const scene = await readFile(new URL('../src/game/scenes/TestScene.ts', import.meta.url), 'utf8')
  const movement = await readFile(new URL('../src/game/player/MovementController.ts', import.meta.url), 'utf8')
  const navigation = await readFile(new URL('../src/game/navigation/ExplorationNavigation.tsx', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')
  const music = await readFile(new URL('../src/game/audio/BackgroundMusicPlayer.tsx', import.meta.url), 'utf8')
  assert.match(bootstrap, /mode: Phaser\.Scale\.RESIZE/); assert.match(bootstrap, /activePointers: 2/)
  assert.match(scene, /this\.scale\.on\(Phaser\.Scale\.Events\.RESIZE/); assert.match(scene, /this\.scale\.off\(Phaser\.Scale\.Events\.RESIZE/)
  assert.match(canvas, /game\.destroy\(true\)/); assert.match(movement, /if \(!enabled\)[\s\S]*?cancelPointerTarget\(\)/)
  const priorities = ['npcManager?.handlePointerDown', 'clueManager?.handlePointerDown', 'worldObjectManager?.handlePointerDown']
  assert.ok(priorities.every((value, index) => index === 0 || scene.indexOf(priorities[index - 1]) < scene.indexOf(value)))
  assert.match(scene, /interfaceLocked \|\| this\.cluePanelLocked \|\| this\.npcPanelLocked \|\| this\.worldObjectPanelLocked/)
  assert.match(app, /addEventListener\('pagehide', flush\)/); assert.match(app, /removeEventListener\('pagehide', flush\)/)
  assert.match(app, /addEventListener\('keydown', handleEscape, true\)/); assert.match(app, /restoreOverlayFocus/)
  assert.match(styles, /\.game-canvas\s*\{[\s\S]*?touch-action:\s*none;/); assert.match(styles, /overflow-x:\s*hidden/)
  assert.match(styles, /min-height:\s*44px/); assert.match(styles, /button:focus-visible/); assert.match(styles, /prefers-reduced-motion:\s*reduce/)
  assert.match(styles, /\.mini-map\s*\{[\s\S]*?right:\s*0\.75rem/); assert.match(styles, /\.quest-compass\s*\{[\s\S]*?bottom:\s*0\.75rem;[\s\S]*?left:\s*0\.75rem/)
  const northStar = navigation.match(/<svg className="north-star"[\s\S]*?<\/svg>/)?.[0] ?? ''
  assert.ok(northStar); assert.doesNotMatch(northStar, /<text|>\s*(?:N|North|Utara)\s*</i); assert.match(northStar, /aria-label=\{NORTH_STAR_LABEL\.bm\}/)
  assert.match(styles, /\.north-star\s*\{[\s\S]*?pointer-events:\s*none;/)
  assert.match(app, /lazy\(\(\) => import\('\.\/game\/GameCanvas'\)/); assert.match(app, /lazy\(\(\) => import\('\.\/game\/review\/ReviewPanel'\)/)
  assert.match(music, /preload = 'none'/); assert.match(music, /onClick=\{togglePlayback\}/); assert.match(music, /audioCleanupRef\.current\(\)/)

  const releaseAssets = await readdir(new URL('../releases/v0.28.0/assets/', import.meta.url))
  for (const expected of [/GameCanvas-.*\.js/, /ReviewPanel-.*\.js/, /index-.*\.css/, /sirahquestbg2-.*\.mp3/, /world-map-v015-.*\.webp/]) assert.ok(releaseAssets.some((name) => expected.test(name)))
  const audio = releaseAssets.find((name) => name.endsWith('.mp3')); const map = releaseAssets.find((name) => name.endsWith('.webp'))
  assert.equal((await stat(new URL(`../releases/v0.28.0/assets/${audio}`, import.meta.url))).size, 2264024)
  assert.equal((await stat(new URL(`../releases/v0.28.0/assets/${map}`, import.meta.url))).size, 603684)
  execFileSync('git', ['diff', '--quiet', '--', 'releases'], { stdio: 'ignore' })
  console.log('Verified v0.29 device compatibility invariants across 7 viewports, resize/cleanup lifecycle, touch/modal input, HUD/North Star coexistence, accessibility boundaries, lazy loading, deferred audio, two approved editorial corrections and immutable archives.')
} finally { await server.close() }
