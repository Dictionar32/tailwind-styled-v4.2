#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const cmd = process.argv[2]
const tokenPath = path.join(process.cwd(), 'tokens.sync.json')

if (cmd === 'init') {
  if (!fs.existsSync(tokenPath)) {
    fs.writeFileSync(tokenPath, JSON.stringify({ version: 1, tokens: {} }, null, 2) + '\n')
  }
  console.log(`initialized ${tokenPath}`)
  process.exit(0)
}

if (cmd === 'pull' || cmd === 'push') {
  if (!fs.existsSync(tokenPath)) {
    console.error('tokens.sync.json not found. Run `tw sync init` first.')
    process.exit(1)
  }
  console.log(`${cmd} simulated for ${tokenPath}`)
  process.exit(0)
}

console.error('Usage: node scripts/v45/sync.mjs <init|pull|push>')
process.exit(1)
