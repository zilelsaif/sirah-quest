import { cp, mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const releasesDirectory = path.join(projectRoot, 'releases')
const outputDirectory = path.join(projectRoot, 'dist', 'releases')

await mkdir(outputDirectory, { recursive: true })

const entries = await readdir(releasesDirectory, { withFileTypes: true })

for (const entry of entries) {
  if (entry.isDirectory()) {
    await cp(
      path.join(releasesDirectory, entry.name),
      path.join(outputDirectory, entry.name),
      { recursive: true },
    )
  }
}

