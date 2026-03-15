#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const cssFile = process.argv[2]
if (!cssFile) {
  console.error('Usage: node scripts/v47/shake-css.mjs <css-file>')
  process.exit(1)
}

const abs = path.resolve(process.cwd(), cssFile)
const css = fs.readFileSync(abs, 'utf8')
const lines = css.split('\n')
const kept = lines.filter((line) => !line.includes('UNUSED_CLASS_SENTINEL'))
const result = kept.join('\n')

console.log(JSON.stringify({ file: cssFile, originalLines: lines.length, finalLines: kept.length }, null, 2))
fs.writeFileSync(abs, result)
