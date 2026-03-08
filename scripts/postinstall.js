const { execSync } = require('child_process')
const { join, dirname } = require('path')
const { existsSync } = require('fs')

const electronDir = join(__dirname, '..', 'node_modules', 'electron')
if (existsSync(electronDir)) {
  try {
    const electronVersion = require(join(electronDir, 'package.json')).version
    execSync(
      `npx prebuild-install --runtime electron --target ${electronVersion}`,
      { cwd: join(__dirname, '..', 'node_modules', 'better-sqlite3'), stdio: 'inherit' }
    )
    console.log(`Rebuilt better-sqlite3 for Electron ${electronVersion}`)
  } catch {
    console.warn('Could not rebuild better-sqlite3 for Electron — may fail at runtime')
  }
}
