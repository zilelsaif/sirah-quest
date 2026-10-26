import { createServer } from 'vite'

const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })

try {
  const { WORLD_LOCATIONS, WORLD_ROUTE_LINKS } = await server.ssrLoadModule('/src/world/locationData.ts')
  const { RESERVED_WORLD_MAP_SITES } = await server.ssrLoadModule('/src/world/worldMapLayout.ts')
  const expectedIds = ['kampung-ilmu', 'bazar-lama', 'perpustakaan-hikmah', 'bukit-pengintai']
  const expectedRoutes = [
    'bazar-lama|bukit-pengintai',
    'bazar-lama|kampung-ilmu',
    'bazar-lama|perpustakaan-hikmah',
  ]

  if (WORLD_LOCATIONS.map(({ id }) => id).join(',') !== expectedIds.join(',')) {
    throw new Error('Canonical World Map location IDs changed')
  }
  const allCoordinates = [
    ...WORLD_LOCATIONS.map(({ normalizedPosition }) => normalizedPosition),
    ...RESERVED_WORLD_MAP_SITES.map(({ normalizedPosition }) => normalizedPosition),
  ]
  if (allCoordinates.some(({ x, y }) => x < 0 || x > 1 || y < 0 || y > 1)) {
    throw new Error('World Map coordinate lies outside normalized 0..1 space')
  }
  if (new Set(RESERVED_WORLD_MAP_SITES.map(({ id }) => id)).size !== RESERVED_WORLD_MAP_SITES.length) {
    throw new Error('Reserved site IDs are not unique')
  }
  if (RESERVED_WORLD_MAP_SITES.length < 8 || RESERVED_WORLD_MAP_SITES.some(({ id }) => expectedIds.includes(id))) {
    throw new Error('Reserved-site capacity is insufficient or overlaps a playable ID')
  }
  const actualRoutes = WORLD_ROUTE_LINKS
    .map(({ from, to }) => [from, to].sort().join('|'))
    .sort()
  if (actualRoutes.join(',') !== expectedRoutes.sort().join(',')) {
    throw new Error(`Route topology changed: ${actualRoutes.join(', ')}`)
  }
  const lookout = WORLD_LOCATIONS.find(({ id }) => id === 'bukit-pengintai')
  if (lookout?.status !== 'locked') throw new Error('Bukit Pengintai must remain locked')

  console.log(`Verified ${WORLD_LOCATIONS.length} canonical locations, ${WORLD_ROUTE_LINKS.length} unchanged routes, and ${RESERVED_WORLD_MAP_SITES.length} non-playable reserved sites.`)
} finally {
  await server.close()
}
