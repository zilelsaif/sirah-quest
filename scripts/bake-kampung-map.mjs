import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const assetDir = join(root, 'src/assets/environments/kampung-ilmu')
const outputPath = join(assetDir, 'kampung-ilmu-background.webp')
const previewPath = join(root, 'docs/qa/n09g-kampung-ilmu-composite-preview.png')
const width = 2200
const height = 1600

async function loadTsData(relativePath) {
  const source = readFileSync(join(root, relativePath), 'utf8')
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
}

function pngSize(path) {
  const data = readFileSync(path)
  assert.equal(data.toString('ascii', 1, 4), 'PNG', `${path} is not a PNG`)
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) }
}

function xml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character])
}

function assetUrl(filename) {
  return xml(pathToFileURL(join(assetDir, filename)).href)
}

function image(filename, x, bottomY, scale, opacity = 1) {
  const size = pngSize(join(assetDir, filename))
  const renderedWidth = size.width * scale
  const renderedHeight = size.height * scale
  return `<image href="${assetUrl(filename)}" x="${(x - renderedWidth / 2).toFixed(3)}" y="${(bottomY - renderedHeight).toFixed(3)}" width="${renderedWidth.toFixed(3)}" height="${renderedHeight.toFixed(3)}" opacity="${opacity}"/>`
}

function pathElement(path, extraWidth, stroke, opacity = 1) {
  const points = path.points.map(([x, y]) => `${x},${y}`).join(' ')
  return `<polyline points="${points}" fill="none" stroke="${stroke}" stroke-width="${path.width + extraWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`
}

function findExecutable(candidates) {
  const found = candidates.find(existsSync) ?? candidates.map((candidate) => {
    try {
      return execFileSync('where.exe', [candidate], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split(/\r?\n/)[0]
    } catch {
      return undefined
    }
  }).find((candidate) => candidate && existsSync(candidate))
  assert.ok(found, `Required executable was not found: ${candidates.join(', ')}`)
  return found
}

const layout = await loadTsData('src/game/visuals/kampungEnvironmentLayout.ts')
const registrySource = readFileSync(join(root, 'src/game/areas/areaRegistry.ts'), 'utf8')
const kampungBlock = registrySource.slice(registrySource.indexOf("id: KAMPUNG_ILMU_AREA_ID"), registrySource.indexOf("id: BAZAR_LAMA_AREA_ID"))
assert.match(kampungBlock, /width: 2200/)
assert.match(kampungBlock, /height: 1600/)
const obstacleMatches = [...kampungBlock.matchAll(/\{ x: (\d+), y: (\d+), width: (\d+), height: (\d+), color: 0x[\da-f]+(?:, visualType: '[^']+')? \}/gi)]
const obstacles = obstacleMatches.slice(0, 14).map((match) => ({ x: +match[1], y: +match[2], width: +match[3], height: +match[4] }))
assert.equal(obstacles.length, 14, 'Expected the protected 14 Kampung obstacle footprints')

const tempDir = join(tmpdir(), `sirah-quest-n09g-${process.pid}`)
mkdirSync(tempDir, { recursive: true })
mkdirSync(dirname(previewPath), { recursive: true })

const decorations = ['ki_v01_grass_tuft.png', 'ki_v02_wildflowers.png', 'ki_v03_shrub.png', 'ki_v04_small_rocks.png']
const frontYardAssets = { grassTuft: decorations[0], wildflowers: decorations[1], shrub: decorations[2], smallRocks: decorations[3] }
const cropAssets = [decorations[0], decorations[1], decorations[2]]

const staticLayers = []
staticLayers.push(`<rect width="${width}" height="${height}" fill="url(#grass)"/>`)
staticLayers.push(`<g clip-path="url(#variation-mask)" opacity="0.34"><rect width="${width}" height="${height}" fill="url(#variation)"/></g>`)
for (const road of [...layout.KAMPUNG_ROAD_PATHS, ...layout.KAMPUNG_ENTRANCE_PATHS]) {
  staticLayers.push(pathElement(road, road.width > 30 ? 24 : 8, 'url(#dirt-edge)', road.width > 30 ? 0.52 : 0.46))
  staticLayers.push(pathElement(road, 0, 'url(#dirt-fill)'))
  if (road.width > 30) staticLayers.push(pathElement(road, -6, 'url(#dirt-mottle)', 0.24))
}

layout.KAMPUNG_GARDEN_ROWS.forEach(({ obstacleIndex, planterBottoms }) => {
  const obstacle = obstacles[obstacleIndex]
  staticLayers.push(`<rect x="${obstacle.x + 7}" y="${obstacle.y + 5}" width="${obstacle.width - 14}" height="${obstacle.height - 10}" rx="18" fill="#6f4b2d" fill-opacity="0.78" stroke="#9b7445" stroke-opacity="0.58" stroke-width="3"/>`)
  planterBottoms.forEach((bottomY, cropIndex) => {
    staticLayers.push(image(cropAssets[(obstacleIndex + cropIndex) % cropAssets.length], obstacle.x + obstacle.width / 2, bottomY - 42, 0.18 + cropIndex * 0.015))
  })
})

layout.KAMPUNG_DECORATION_POINTS.forEach(([x, y], index) => {
  staticLayers.push(image(decorations[index % decorations.length], x, y, 0.29 + (index % 4) * 0.028))
})
layout.KAMPUNG_FRONT_YARD_DETAILS.forEach(({ texture, point: [x, y], scale }) => {
  staticLayers.push(image(frontYardAssets[texture], x, y, scale))
})

const obstacleAssets = [
  'ki-b01_house_wide.png', 'ki-p05_raised_planter.png', 'ki-b01_house_wide.png', 'ki-b02_house_compact.png',
  'ki-b01_house_wide.png', 'ki-b02_house_compact.png', 'ki-b01_house_wide.png', 'ki-f02_fence_vertical.png',
  'ki-f02_fence_vertical.png', 'ki-f02_fence_vertical.png', 'ki-b03_learning_hall.png', 'ki-f01_fence_horizontal.png',
  'ki-b05_storage_shed.png', 'ki-b01_house_wide.png',
]
const previewLayers = [...staticLayers]
obstacles.forEach((obstacle, index) => {
  if (index === layout.KAMPUNG_TREE_PLACEMENT.obstacleIndex) {
    const [x, y] = layout.KAMPUNG_TREE_PLACEMENT.point
    previewLayers.push(`<ellipse cx="${x + 7}" cy="${y + 4}" rx="48" ry="12" fill="#07101d" opacity="0.22"/>`)
    previewLayers.push(image('ki-t01_tree.png', x, y, layout.KAMPUNG_TREE_PLACEMENT.scale))
    return
  }
  if (layout.KAMPUNG_GARDEN_ROWS.some((row) => row.obstacleIndex === index)) {
    const row = layout.KAMPUNG_GARDEN_ROWS.find((candidate) => candidate.obstacleIndex === index)
    row.planterBottoms.forEach((bottomY) => previewLayers.push(image('ki-p05_raised_planter.png', obstacle.x + obstacle.width / 2, bottomY, Math.min(70 / pngSize(join(assetDir, 'ki-p05_raised_planter.png')).width, 82 / pngSize(join(assetDir, 'ki-p05_raised_planter.png')).height))))
    return
  }
  const filename = obstacleAssets[index]
  const size = pngSize(join(assetDir, filename))
  const scale = Math.min(obstacle.width * (filename.includes('fence_vertical') ? 0.92 : 1.08) / size.width, 1)
  const bottomY = obstacle.y + obstacle.height
  previewLayers.push(`<ellipse cx="${obstacle.x + obstacle.width / 2 + 7}" cy="${bottomY + 4}" rx="${Math.max(17, size.width * scale * 0.35)}" ry="${Math.min(12, Math.max(4.5, size.height * scale * 0.04))}" fill="#07101d" opacity="0.22"/>`)
  previewLayers.push(image(filename, obstacle.x + obstacle.width / 2, bottomY, scale))
})
previewLayers.push(image('ki-p02_trail_sign_blank.png', 362, 613, 0.23))

function svg(layers) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>
  <pattern id="grass" width="512" height="512" patternUnits="userSpaceOnUse"><image href="${assetUrl('ki_g01_grass_base.png')}" width="512" height="512"/></pattern>
  <pattern id="variation" width="512" height="512" patternUnits="userSpaceOnUse" patternTransform="translate(173 89)"><image href="${assetUrl('ki_g02_grass_variation.png')}" width="512" height="512"/></pattern>
  <pattern id="dirt-edge" width="512" height="512" patternUnits="userSpaceOnUse" patternTransform="translate(91 147)"><image href="${assetUrl('ki_g04_dirt_edge.png')}" width="512" height="512"/></pattern>
  <pattern id="dirt-fill" width="512" height="512" patternUnits="userSpaceOnUse" patternTransform="translate(37 61)"><image href="${assetUrl('ki_g03_dirt_fill.png')}" width="512" height="512"/></pattern>
  <pattern id="dirt-mottle" width="598" height="598" patternUnits="userSpaceOnUse" patternTransform="translate(181 113)"><image href="${assetUrl('ki_g03_dirt_fill.png')}" width="598" height="598"/></pattern>
  <clipPath id="variation-mask">
    <ellipse cx="410" cy="1180" rx="150" ry="105"/><ellipse cx="480" cy="1125" rx="108" ry="71"/><ellipse cx="330" cy="1225" rx="96" ry="61"/>
    <ellipse cx="1810" cy="330" rx="175" ry="125"/><ellipse cx="1869" cy="275" rx="126" ry="85"/><ellipse cx="1739" cy="375" rx="112" ry="73"/>
    <ellipse cx="1810" cy="900" rx="180" ry="125"/><ellipse cx="1858" cy="845" rx="130" ry="85"/><ellipse cx="1748" cy="945" rx="115" ry="73"/>
    <ellipse cx="250" cy="1390" rx="140" ry="90"/><ellipse cx="287" cy="1335" rx="101" ry="61"/><ellipse cx="197" cy="1435" rx="90" ry="52"/>
  </clipPath>
</defs>${layers.join('')}</svg>`
}

const backgroundSvg = join(tempDir, 'background.svg')
const previewSvg = join(tempDir, 'preview.svg')
const backgroundPng = join(tempDir, 'background.png')
writeFileSync(backgroundSvg, svg(staticLayers))
writeFileSync(previewSvg, svg(previewLayers))

const chrome = findExecutable([
  'chrome.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  `${process.env.LOCALAPPDATA ?? ''}/Google/Chrome/Application/chrome.exe`,
])
const ffmpeg = findExecutable([
  'ffmpeg.exe',
  `${process.env.LOCALAPPDATA ?? ''}/Microsoft/WinGet/Links/ffmpeg.exe`,
  `${process.env.LOCALAPPDATA ?? ''}/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffmpeg.exe`,
])

function screenshot(input, output) {
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--force-device-scale-factor=1', `--window-size=${width},${height}`, `--screenshot=${output}`, pathToFileURL(input).href], { stdio: 'pipe' })
  const size = pngSize(output)
  assert.deepEqual(size, { width, height })
}

try {
  screenshot(backgroundSvg, backgroundPng)
  screenshot(previewSvg, previewPath)
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', backgroundPng, '-c:v', 'libwebp', '-quality', '92', '-compression_level', '6', '-pix_fmt', 'yuv420p', outputPath], { stdio: 'pipe' })
  const hash = createHash('sha256').update(readFileSync(outputPath)).digest('hex')
  console.log(JSON.stringify({ output: basename(outputPath), width, height, bytes: readFileSync(outputPath).length, sha256: hash, preview: previewPath }, null, 2))
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}
