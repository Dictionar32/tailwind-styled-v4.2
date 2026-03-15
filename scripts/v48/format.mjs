#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const file = process.argv[2]
const write = process.argv.includes('--write')
if (!file) {
  console.error('Usage: node scripts/v48/format.mjs <file> [--write]')
  process.exit(1)
}

const abs = path.resolve(process.cwd(), file)
const src = fs.readFileSync(abs, 'utf8')
const out = src
  .split('\n')
  .map((line) => line.replace(/\s+$/g, ''))
  .join('\n')

if (write) {
  fs.writeFileSync(abs, out)
  console.log(`formatted ${file}`)
} else {
  console.log(out)
}
