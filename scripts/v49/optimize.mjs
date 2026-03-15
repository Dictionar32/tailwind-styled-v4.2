#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/v49/optimize.mjs <file> [--constant-folding] [--partial-eval]')
  process.exit(1)
}

const abs = path.resolve(process.cwd(), file)
const source = fs.readFileSync(abs, 'utf8')

const constantFolding = process.argv.includes('--constant-folding')
const partialEval = process.argv.includes('--partial-eval')

let out = source
if (constantFolding) {
  out = out.replace(/\btrue\s*\?\s*([^:;]+)\s*:\s*([^;\n]+)/g, '$1')
}
if (partialEval) {
  out = out.replace(/\s+/g, ' ').trim()
}

console.log(JSON.stringify({
  file,
  constantFolding,
  partialEval,
  originalBytes: source.length,
  optimizedBytes: out.length,
  reduction: `${(((source.length - out.length) / Math.max(1, source.length)) * 100).toFixed(2)}%`
}, null, 2))
