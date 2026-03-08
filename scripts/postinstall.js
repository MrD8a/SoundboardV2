const { mkdirSync, writeFileSync, existsSync } = require('fs')
const { join } = require('path')

const stubs = {
  'zlib-sync': 'module.exports = null;',
  'bufferutil': 'module.exports = {};',
  'utf-8-validate': 'module.exports = {};',
  'erlpack': 'module.exports = null;'
}

const nodeModules = join(__dirname, '..', 'node_modules')

for (const [name, code] of Object.entries(stubs)) {
  const dir = join(nodeModules, name)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, version: '0.0.0', main: 'index.js' }))
    writeFileSync(join(dir, 'index.js'), code)
  }
}
