import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const readText = (path) => readFile(path, 'utf8')

async function verifyPng(path, expectedHash) {
  const bytes = await readFile(path)
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${path} must be a PNG`)
  assert.equal(bytes.readUInt32BE(16), 512, `${path} width`)
  assert.equal(bytes.readUInt32BE(20), 768, `${path} height`)
  assert.equal(bytes[24], 8, `${path} bit depth`)
  assert.equal(bytes[25], 6, `${path} must be RGBA`)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedHash, `${path} SHA-256`)
}

await Promise.all([
  verifyPng('src/assets/characters/player-kampung-n07c.png', '6704bb79db7faa313ca79e9ecfdf30faba5004a2a45b45629b277fb08cba6baf'),
  verifyPng('src/assets/characters/npc-hall-keeper-n07c.png', '41b9c3db04bce4c43a35a0bbadb5b75d78a9f0ec25ca0035fd4888efa7d99a7a'),
])

const [manifest, scene, renderer, manager, areas, npcs, saveConfig] = await Promise.all([
  readText('src/game/visuals/characterVisualManifest.ts'),
  readText('src/game/scenes/TestScene.ts'),
  readText('src/game/npcs/NpcRenderer.ts'),
  readText('src/game/npcs/NpcManager.ts'),
  readText('src/game/areas/areaRegistry.ts'),
  readText('src/game/npcs/npcData.ts'),
  readText('src/game/save/config.ts'),
])

assert.match(manifest, /frameWidth: 128/)
assert.match(manifest, /frameHeight: 192/)
assert.match(manifest, /frameCount: 16/)
assert.match(manifest, /origin: \[0\.5, 1\]/)
assert.match(manifest, /front: \{ idle: 0, walk: \[1, 2, 3\] \}/)
assert.match(manifest, /back: \{ idle: 4, walk: \[5, 6, 7\] \}/)
assert.match(manifest, /left: \{ idle: 8, walk: \[9, 10, 11\] \}/)
assert.match(manifest, /right: \{ idle: 12, walk: \[13, 14, 15\] \}/)
assert.match(manifest, /textureKey: 'n07c-player-kampung'/)
assert.match(manifest, /textureKey: 'n07c-npc-hall-keeper'/)
assert.match(manifest, /scene\.textures\.exists\(visual\.textureKey\)/)
assert.match(manifest, /if \(!texture\.has\(String\(frame\)\)\) return undefined/)
assert.match(manifest, /displacement\.x > 0 \? 'right' : 'left'/)
assert.match(manifest, /displacement\.y > 0 \? 'front' : 'back'/)
assert.match(manifest, /return previous/)

assert.match(scene, /const previousPlayerPosition = this\.player/)
assert.ok(scene.indexOf('this.movementController?.update(delta)') < scene.indexOf('this.updatePlayerVisual(previousPlayerPosition, delta)'), 'animation must use post-movement displacement')
assert.match(scene, /this\.add\.container\(x, y, \[shadow, \.\.\.fallbackParts\]\)/)
assert.match(scene, /if \(sprite\) \{/)
assert.match(scene, /this\.playerWalkElapsedMs = moving \? this\.playerWalkElapsedMs \+ delta : 0/)
assert.match(scene, /this\.events\.once\(Phaser\.Scenes\.Events\.SHUTDOWN/)

assert.match(renderer, /const isKeeper = npc\.visualKey === 'hall-keeper'/)
assert.match(renderer, /HALL_KEEPER_VISUAL\.frames\.front\.idle/)
assert.match(renderer, /sprite\.setData\('npcId', npc\.id\)\.setInteractive/)
assert.match(renderer, /if \(sprite\) \{/)
assert.match(renderer, /return visual/)
assert.match(manager, /this\.npcs\.forEach\(\(\{ visual \}\) => visual\.destroy\(\)\)/)
assert.match(manager, /this\.interactionPrompt\.destroy\(\)/)
assert.doesNotMatch(manager, /textures\.(remove|destroy)/)

assert.match(areas, /width: 2200,[\s\S]*height: 1600,[\s\S]*spawn: \{ x: 300, y: 300 \}/)
assert.match(areas, /id: 'clue-1'[\s\S]*x: 430, y: 400/)
assert.match(npcs, /id: 'npc-penjaga-balai-ilmu'[\s\S]*position: \{ x: 500, y: 600 \}[\s\S]*visualKey: 'hall-keeper'/)
assert.match(npcs, /id: 'npc-pengembara-bazar'[\s\S]*visualKey: 'bazaar-traveller'/)
assert.match(saveConfig, /SAVE_SCHEMA_VERSION = 3/)

console.log('N07-C Phaser integration verification passed.')
