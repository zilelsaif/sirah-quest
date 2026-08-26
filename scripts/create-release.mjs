import { cp, mkdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const version = process.argv[2]
const semanticVersionPattern = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

if (!semanticVersionPattern.test(version ?? '')) {
  console.error('Invalid version. Use semantic version format such as v0.0.1.')
  process.exit(1)
}

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const releasesDirectory = path.join(projectRoot, 'releases')
const releaseDirectory = path.join(releasesDirectory, version)
const temporaryBuildDirectory = path.join(projectRoot, '.release-build')

async function exists(filePath) {
  try {
    await stat(filePath)
    return true
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}

function runNodeScript(scriptPath, args) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: projectRoot,
    stdio: 'inherit',
  })

  if (result.error) throw result.error
  if (result.status !== 0) process.exitCode = result.status ?? 1

  return result.status === 0
}

if (await exists(releaseDirectory)) {
  console.error(`Release ${version} already exists. Existing releases are never overwritten.`)
  process.exit(1)
}

await mkdir(releasesDirectory, { recursive: true })
await rm(temporaryBuildDirectory, { recursive: true, force: true })

try {
  const typeScriptPath = path.join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc')
  const vitePath = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js')

  if (!runNodeScript(typeScriptPath, ['-b'])) {
    throw new Error('TypeScript build failed.')
  }

  if (
    !runNodeScript(vitePath, [
      'build',
      '--base',
      './',
      '--outDir',
      temporaryBuildDirectory,
    ])
  ) {
    throw new Error('Vite build failed.')
  }

  await cp(temporaryBuildDirectory, releaseDirectory, {
    recursive: true,
    errorOnExist: true,
    force: false,
  })

  console.log(`Release ${version} created successfully in releases/${version}/`)
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await rm(temporaryBuildDirectory, { recursive: true, force: true })
}
