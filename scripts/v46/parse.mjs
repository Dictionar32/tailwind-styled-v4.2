#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/v46/parse.mjs <file>')
  process.exit(1)
}

const abs = path.resolve(process.cwd(), file)
const source = fs.readFileSync(abs, 'utf8')

let mode = 'fallback-regex'
let count = 0

try {
  const mod = await import('oxc-parser')
  if (typeof mod.parseSync === 'function') {
    mode = 'oxc-parser'
    const parsed = mod.parseSync(source, { sourceType: 'module' })
    const text = JSON.stringify(parsed)
    count = (text.match(/className/g) || []).length
  }
} catch {
  const classes = source.match(/class(Name)?\s*=\s*["'`][^"'`]+["'`]/g) || []
  count = classes.length
}

console.log(JSON.stringify({ file, mode, classLikeAttributes: count }, null, 2))
