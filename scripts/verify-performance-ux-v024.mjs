import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })

try {
  const { SAVE_SCHEMA_VERSION } = await server.ssrLoadModule('/src/game/save/config.ts')
  const { QUESTION_BANK } = await server.ssrLoadModule('/src/game/questions/questionBank.ts')
  const { WORLD_OBJECT_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/worldObjectData.ts')
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const canvas = await readFile(new URL('../src/game/GameCanvas.tsx', import.meta.url), 'utf8')
  const bootstrap = await readFile(new URL('../src/game/bootstrap.ts', import.meta.url), 'utf8')
  const scene = await readFile(new URL('../src/game/scenes/TestScene.ts', import.meta.url), 'utf8')
  const audio = await readFile(new URL('../src/game/audio/BackgroundMusicPlayer.tsx', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')

  assert.match(app, /lazy\(\(\) => import\('\.\/game\/GameCanvas'\)/)
  assert.doesNotMatch(app, /import \{ GameCanvas \} from '\.\/game\/GameCanvas'/)
  assert.match(app, /<Suspense fallback=\{<div className="game-loading" role="status">/)
  assert.match(canvas, /isSceneReady/)
  assert.match(canvas, /game-scene-loading/)
  assert.match(bootstrap, /onSceneReady: \(diagnostics: SceneRenderDiagnostics\) => void/)
  assert.match(scene, /this\.onSceneReady\(\{[\s\S]*sceneLoadMs:[\s\S]*displayObjectCount:[\s\S]*activeMaskCount:/)
  assert.match(styles, /prefers-reduced-motion: reduce[\s\S]*game-scene-loading::before/)

  assert.equal((audio.match(/new Audio\(/g) ?? []).length, 1)
  assert.match(audio, /const ensureAudio = \(\) =>/)
  assert.match(audio, /audio\.preload = 'none'/)
  assert.match(audio, /const togglePlayback = \(\) => \{[\s\S]*const audio = ensureAudio\(\)/)
  assert.doesNotMatch(audio.slice(0, audio.indexOf('const ensureAudio')), /new Audio\(/)
  assert.match(audio, /sirahQuest\.audio\.preferences\.v1/)

  assert.equal(SAVE_SCHEMA_VERSION, 3)
  assert.equal(QUESTION_BANK.length, 24)
  assert.equal(WORLD_OBJECT_DEFINITIONS.length, 6)
  console.log('Verified lazy Area/Phaser loading, real scene-ready feedback, deferred gesture-only audio initialization, reduced-motion support, schema 3, 24 questions and 6 world objects.')
} finally {
  await server.close()
}
