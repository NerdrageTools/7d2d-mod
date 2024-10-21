import chokidar from 'chokidar'
import { cp, rm } from 'node:fs/promises'
import * as path from 'path'

const modName = 'NerdRAGE_Zombies'
const sourceDir = path.resolve(__dirname, modName)
const targetDir = path.resolve('/mnt/c/Users/Troy/AppData/Roaming/7DaysToDie/Mods', modName)

async function copyFile(sourcePath: string, targetPath: string) {
  try {
    await cp(sourcePath, targetPath, { recursive: false, force: true })
    console.log(`Copied: ${path.relative(sourceDir, sourcePath)}`)
  } catch (error) {
    console.error(`Error copying ${sourcePath}:`, error)
  }
}

async function removeFile(targetPath: string) {
  try {
    await rm(targetPath, { force: true })
    console.log(`Removed: ${path.relative(targetDir, targetPath)}`)
  } catch (error) {
    console.error(`Error removing ${targetPath}:`, error)
  }
}

async function copyEntireDirectory() {
  try {
    await cp(sourceDir, targetDir, { recursive: true, force: true })
    console.log(`Copied entire directory from ${sourceDir} to ${targetDir}`)
  } catch (error) {
    console.error(`Error copying entire directory:`, error)
  }
}

async function startWatching() {
  await copyEntireDirectory()

  console.log(`Watching ${sourceDir} for changes...`)

  const watcher = chokidar.watch(sourceDir, {
    persistent: true,
    ignoreInitial: true,
    usePolling: true,
    interval: 100,
    binaryInterval: 300,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  })

  watcher
    .on('all', (event, filePath) => {
      const relativePath = path.relative(sourceDir, filePath)
      const targetPath = path.join(targetDir, relativePath)

      switch (event) {
        case 'add':
        case 'change':
          copyFile(filePath, targetPath)
          break
        case 'unlink':
          removeFile(targetPath)
          break
      }
    })
    .on('error', (error) => console.error(`Watcher error: ${error}`))

  // Prevent the script from exiting immediately
  process.on('SIGINT', () => {
    console.log('Stopping watcher...')
    watcher.close()
    process.exit(0)
  })
}

startWatching()
