import { createServer } from 'vite'

const server = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true },
})

try {
  const { AREA_DEFINITIONS } = await server.ssrLoadModule('/src/game/areas/areaRegistry.ts')
  const { Pathfinder } = await server.ssrLoadModule('/src/game/navigation/Pathfinder.ts')
  const zoneIds = new Set()

  for (const area of AREA_DEFINITIONS) {
    const startedAt = performance.now()
    const pathfinder = new Pathfinder(area)
    const results = []

    for (const zone of area.zones) {
      if (zoneIds.has(zone.id)) throw new Error(`Duplicate zone ID: ${zone.id}`)
      zoneIds.add(zone.id)
      if (zone.areaId !== area.id) throw new Error(`${zone.id} references the wrong area`)
      if (
        zone.accessPoint.x < zone.x || zone.accessPoint.x > zone.x + zone.width ||
        zone.accessPoint.y < zone.y || zone.accessPoint.y > zone.y + zone.height
      ) throw new Error(`${zone.id} access point is outside its zone`)
      if (!pathfinder.isPointWalkable(zone.accessPoint)) throw new Error(`${zone.id} access point is blocked`)
      const route = pathfinder.findPath(area.spawn, zone.accessPoint)
      if (route.length === 0) throw new Error(`${zone.id} is unreachable from spawn`)
      results.push(`${zone.id}:${route.length}`)
    }

    for (const clue of area.clues) {
      if (pathfinder.findPath(area.spawn, clue).length === 0) {
        throw new Error(`${clue.id} is no longer reachable from spawn`)
      }
    }

    const blockedTarget = area.obstacles.at(-1)
    if (blockedTarget) {
      const fallbackRoute = pathfinder.findPath(area.spawn, {
        x: blockedTarget.x + blockedTarget.width / 2,
        y: blockedTarget.y + blockedTarget.height / 2,
      })
      if (fallbackRoute.length === 0) throw new Error(`${area.id} blocked-target fallback failed`)
    }

    const elapsed = performance.now() - startedAt
    console.log(`${area.id}: ${area.width}x${area.height}; zones ${results.join(', ')}; ${elapsed.toFixed(1)}ms`)
  }

  console.log(`Verified ${zoneIds.size} expanded zones and all existing clue routes.`)
} finally {
  await server.close()
}
