#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/v47/minify.mjs <file>')
  process.exit(1)
}

const abs = path.resolve(process.cwd(), file)
const source = fs.readFileSync(abs, 'utf8')
let code = source
let mode = 'fallback-whitespace'

try {
  const mod = await import('oxc-minify')
  if (typeof mod.minify === 'function') {
    mode = 'oxc-minify'
    const result = await mod.minify(source, { mangle: false })
    code = result?.code || source
  }
} catch {
  code = source.replace(/\s+/g, ' ').trim()
}

console.log(JSON.stringify({ file, mode, original: source.length, minified: code.length }, null, 2))
