import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const [app, control, styles, gameCanvas, saveConfig, packageJson] = await Promise.all([
  read('src/App.tsx'),
  read('src/game/ui/ImmersiveModeControl.tsx'),
  read('src/styles.css'),
  read('src/game/GameCanvas.tsx'),
  read('src/game/save/config.ts'),
  read('package.json'),
])

assert.match(control, /'windowed' \| 'native-fullscreen' \| 'focus-mode'/)
assert.match(control, /host\.requestFullscreen\(\)/)
assert.match(control, /document\.fullscreenElement === hostRef\.current/)
assert.match(control, /fullscreenchange/)
assert.match(control, /fullscreenerror/)
assert.match(control, /visibilitychange/)
assert.match(control, /window\.addEventListener\('focus', reconcileNativeFullscreen\)/)
assert.match(control, /window\.requestAnimationFrame[\s\S]*document\.fullscreenElement !== host/)
assert.match(control, /enterFocusMode\(\)/)
assert.match(control, /aria-label=\{label\}/)
assert.match(control, /aria-pressed=\{active\}/)
assert.match(control, /Mod Fokus/)
assert.match(control, /document\.body\.style\.overflow = 'hidden'/)
assert.match(control, /document\.body\.style\.overflow = bodyOverflowRef\.current/)
assert.match(control, /escapeBlocked/)
assert.match(app, /ref=\{appShellRef\}/)
assert.match(app, /data-immersive-mode=\{immersiveMode\}/)
assert.match(app, /<ImmersiveModeControl[\s\S]*hostRef=\{appShellRef\}/)
assert.match(app, /<ImmersiveModeControl[\s\S]*<WorldMap[\s\S]*<GameCanvas[\s\S]*<QuestLog/)
assert.doesNotMatch(app, /key=\{immersiveMode\}/)
assert.match(styles, /\.immersive-toggle[\s\S]*width: 44px[\s\S]*height: 44px/)
assert.match(styles, /\.app-shell\.is-focus-mode[\s\S]*position: fixed[\s\S]*height: 100dvh[\s\S]*overflow: auto/)
assert.match(styles, /\.app-shell:fullscreen/)
assert.match(styles, /safe-area-inset-top/)
assert.match(styles, /\.app-shell\.is-immersive \.game-canvas/)
assert.match(gameCanvas, /disposed = true[\s\S]*game\.destroy\(true\)/)
assert.match(saveConfig, /SAVE_SCHEMA_VERSION = 3/)
assert.equal(JSON.parse(packageJson).version, '0.29.0')

console.log('Verified N08-A native fullscreen/focus fallback state, stable App host, accessible control, cleanup, responsive immersive layout, N07-D disposal guard and schema-3 invariants.')
