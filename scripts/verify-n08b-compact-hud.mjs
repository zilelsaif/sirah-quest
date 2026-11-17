import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const [app, hud, styles, gameCanvas, worldMap, tutorial, immersive, saveConfig] = await Promise.all([
  read('src/App.tsx'), read('src/game/ui/AdventureHUD.tsx'), read('src/styles.css'),
  read('src/game/GameCanvas.tsx'), read('src/world/WorldMap.tsx'),
  read('src/game/onboarding/TutorialPanel.tsx'), read('src/game/ui/ImmersiveModeControl.tsx'),
  read('src/game/save/config.ts'),
])

assert.match(app, /<AdventureHUD[\s\S]*immersiveControl=\{<ImmersiveModeControl/)
assert.equal((app.match(/<BackgroundMusicPlayer/g) ?? []).length, 1, 'one stable audio controller')
assert.match(app, /cameraViewMode=\{cameraViewMode\}/)
assert.match(app, /mapViewMode=\{mapViewMode\}/)
assert.match(gameCanvas, /cameraViewMode: CameraViewMode/)
assert.doesNotMatch(gameCanvas, /className="camera-toolbar"/)
assert.match(worldMap, /mapViewMode: 'region' \| 'location'/)
assert.doesNotMatch(worldMap, /world-map__view-controls/)
assert.match(tutorial, /showHelpTrigger/)
assert.match(app, /showHelpTrigger=\{false\}/)
for (const label of ['Log Quest', 'Jurnal', 'Buka menu pengembaraan', 'Watak', 'Pembelajaran', 'Paparan & Audio', 'Simpanan', 'Bantuan & Lain-lain', 'Naik Taraf', 'Penguasaan', 'Ulang Kaji', 'Panduan', 'Padam Semua Kemajuan']) assert.match(hud, new RegExp(label.replace(/[&]/g, '&amp;|&')))
assert.match(hud, /mode === 'AREA_MAP'[\s\S]*Kembali ke Peta Dunia/)
assert.match(hud, /disabled=\{!props\.reviewAvailable\}/)
assert.match(hud, /aria-expanded=\{props\.menuOpen\}/)
assert.match(hud, /role="dialog" aria-modal="true"/)
assert.match(hud, /event\.key !== 'Escape'/)
assert.match(hud, /menuTriggerRef\.current\?\.focus\(\)/)
assert.match(styles, /\.adventure-hud[\s\S]*grid-template-columns/)
assert.match(styles, /\.adventure-menu-overlay\[hidden\]/)
assert.match(styles, /@media \(max-width: 32rem\)[\s\S]*align-items: flex-end/)
assert.match(styles, /@media \(max-height: 32rem\) and \(orientation: landscape\)/)
assert.match(styles, /safe-area-inset-bottom/)
assert.match(immersive, /'windowed' \| 'native-fullscreen' \| 'focus-mode'/)
assert.match(gameCanvas, /disposed = true[\s\S]*game\.destroy\(true\)/)
assert.match(saveConfig, /SAVE_SCHEMA_VERSION = 3/)

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { QUEST_DATA } = await server.ssrLoadModule('/src/game/quests/questData.ts')
  const { ALL_AREA_CLUES, AREA_DEFINITIONS } = await server.ssrLoadModule('/src/game/areas/areaRegistry.ts')
  const { QUESTION_BANK } = await server.ssrLoadModule('/src/game/questions/questionBank.ts')
  const { NPC_DEFINITIONS } = await server.ssrLoadModule('/src/game/npcs/npcData.ts')
  assert.equal(QUEST_DATA.length, 15)
  assert.equal(ALL_AREA_CLUES.length, 21)
  assert.equal(QUESTION_BANK.length, 24)
  assert.equal(AREA_DEFINITIONS.length, 3)
  assert.equal(NPC_DEFINITIONS.length, 2)
} finally { await server.close() }

console.log('Verified N08-B shared compact HUD, one controlled grouped menu, authoritative camera/map/audio/save/tutorial actions, responsive focus handling, N08-A/N07-D preservation and 15/21/24/3/2/schema-3 invariants.')
