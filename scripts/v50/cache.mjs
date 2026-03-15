#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const cmd = process.argv[2]
const cacheDir = path.resolve(process.cwd(), '.tw-cache')
fs.mkdirSync(cacheDir, { recursive: true })

if (cmd === 'enable') {
  const remote = process.argv[3] || 'local'
  fs.writeFileSync(path.join(cacheDir, 'config.json'), JSON.stringify({ remote, enabledAt: new Date().toISOString() }, null, 2) + '\n')
  console.log(`cache enabled (${remote})`)
  process.exit(0)
}

if (cmd === 'status') {
  const cfg = path.join(cacheDir, 'config.json')
  if (!fs.existsSync(cfg)) {
    console.log('cache not enabled')
    process.exit(0)
  }
  console.log(fs.readFileSync(cfg, 'utf8'))
  process.exit(0)
}

console.error('Usage: node scripts/v50/cache.mjs <enable [remote]|status>')
process.exit(1)
