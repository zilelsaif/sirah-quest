import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'vite'

const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })

try {
  const { WORLD_LOCATIONS } = await server.ssrLoadModule('/src/world/locationData.ts')
  const { clampContextMenuPosition, getWorldMapLocationAction } = await server.ssrLoadModule('/src/world/worldMapMenu.ts')
  const { SAVE_SCHEMA_VERSION } = await server.ssrLoadModule('/src/game/save/config.ts')
  const { QUESTION_BANK } = await server.ssrLoadModule('/src/game/questions/questionBank.ts')
  const { WORLD_OBJECT_DEFINITIONS } = await server.ssrLoadModule('/src/game/worldObjects/worldObjectData.ts')

  const kampung = WORLD_LOCATIONS.find(({ id }) => id === 'kampung-ilmu')
  const bazar = WORLD_LOCATIONS.find(({ id }) => id === 'bazar-lama')
  const library = WORLD_LOCATIONS.find(({ id }) => id === 'perpustakaan-hikmah')
  const locked = WORLD_LOCATIONS.find(({ status }) => status === 'locked')
  assert.equal(getWorldMapLocationAction(kampung, kampung.id, new Set(kampung.connections)), 'ENTER')
  assert.equal(getWorldMapLocationAction(bazar, kampung.id, new Set(kampung.connections)), 'TRAVEL')
  assert.equal(getWorldMapLocationAction(library, kampung.id, new Set(kampung.connections)), 'UNAVAILABLE')
  assert.equal(getWorldMapLocationAction(locked, 'bazar-lama', new Set(['bukit-pengintai'])), 'LOCKED')
  assert.ok(WORLD_LOCATIONS.filter(({ status }) => status === 'coming-soon').every((location) =>
    getWorldMapLocationAction(location, kampung.id, new Set([location.id])) === 'COMING_SOON'))

  const layouts = [
    { viewportWidth: 1920, viewportHeight: 760 },
    { viewportWidth: 1366, viewportHeight: 620 },
    { viewportWidth: 390, viewportHeight: 360 },
    { viewportWidth: 844, viewportHeight: 300 },
    { viewportWidth: 1024, viewportHeight: 600 },
  ]
  for (const viewport of layouts) {
    for (const anchor of [{ x: 0, y: 0 }, { x: viewport.viewportWidth - 44, y: viewport.viewportHeight - 44 }]) {
      const result = clampContextMenuPosition({
        anchorX: anchor.x, anchorY: anchor.y, anchorWidth: 44, anchorHeight: 44,
        menuWidth: Math.min(240, viewport.viewportWidth - 16), menuHeight: Math.min(170, viewport.viewportHeight - 16),
        ...viewport,
      })
      assert.ok(result.left >= 8 && result.top >= 8)
      assert.ok(result.left + Math.min(240, viewport.viewportWidth - 16) <= viewport.viewportWidth - 8)
      assert.ok(result.top + Math.min(170, viewport.viewportHeight - 16) <= viewport.viewportHeight - 8)
    }
  }

  const worldMapSource = await readFile(new URL('../src/world/WorldMap.tsx', import.meta.url), 'utf8')
  assert.match(worldMapSource, /selectedLocationId === locationId[\s\S]*closeLocationMenu/)
  assert.match(worldMapSource, /document\.addEventListener\('pointerdown', handleOutsidePointer\)/)
  assert.match(worldMapSource, /event\.key !== 'Escape'/)
  assert.match(worldMapSource, /setSelectedLocationId\(locationId\)/)
  assert.match(worldMapSource, /onTravel\(location\.id\)/, 'Existing travel callback must remain authoritative')
  assert.match(worldMapSource, /onEnterArea\(selectedLocation\.areaId!\)/)
  assert.match(worldMapSource, /className={`world-location-menu/)
  assert.match(worldMapSource, /nodeRefs\.current\.get\(selectedLocationId\)/)
  assert.match(worldMapSource, /selectedTriggerRef\.current\?\.focus\(\)/)
  assert.equal((worldMapSource.match(/className={`world-location-menu/g) ?? []).length, 1)

  const audioPath = new URL('../src/assets/audio/sirahquestbg2.mp3', import.meta.url)
  const audioStats = await stat(audioPath)
  const audioHeader = await readFile(audioPath).then((buffer) => buffer.subarray(0, 3).toString('ascii'))
  assert.equal(audioStats.size, 2_264_024)
  assert.ok(audioHeader === 'ID3' || audioHeader.startsWith('\xff\xfb'), 'Chosen asset must have an MP3 header')

  const playerSource = await readFile(new URL('../src/game/audio/BackgroundMusicPlayer.tsx', import.meta.url), 'utf8')
  const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.equal((playerSource.match(/new Audio\(/g) ?? []).length, 1)
  assert.match(playerSource, /audio\.loop = true/)
  assert.match(playerSource, /DEFAULT_VOLUME = 0\.3/)
  assert.match(playerSource, /void audio\.play\(\)\.catch/)
  assert.match(playerSource, /intentPlayingRef\.current/)
  assert.match(playerSource, /document\.hidden/)
  assert.match(playerSource, /document\.addEventListener\('visibilitychange'/)
  assert.match(playerSource, /document\.removeEventListener\('visibilitychange'/)
  assert.match(playerSource, /audio\.removeEventListener\('play'/)
  assert.match(playerSource, /type="range"/)
  assert.match(playerSource, /setMuted/)
  assert.match(playerSource, /sirahQuest\.audio\.preferences\.v1/)
  assert.doesNotMatch(playerSource, /sirahQuest\.save/)
  assert.equal((appSource.match(/<BackgroundMusicPlayer \/>/g) ?? []).length, 1)

  assert.equal(SAVE_SCHEMA_VERSION, 3)
  assert.equal(QUESTION_BANK.length, 24)
  assert.equal(WORLD_OBJECT_DEFINITIONS.length, 6)
  console.log('Verified one anchored World Map menu, authoritative location actions, five responsive bounds, bundled MP3, one gesture-driven looping audio controller, visibility cleanup, schema 3, 24 questions and 6 world objects.')
} finally {
  await server.close()
}
