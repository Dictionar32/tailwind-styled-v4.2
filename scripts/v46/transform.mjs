#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const file = process.argv[2]
const out = process.argv[3]
if (!file) {
  console.error('Usage: node scripts/v46/transform.mjs <file> [outFile]')
  process.exit(1)
}

const abs = path.resolve(process.cwd(), file)
const code = fs.readFileSync(abs, 'utf8')
let transformed = code
let mode = 'identity'

try {
  const mod = await import('oxc-transform')
  if (typeof mod.transform === 'function') {
    mode = 'oxc-transform'
    const result = mod.transform(file, code, { typescript: file.endsWith('.ts') || file.endsWith('.tsx') })
    transformed = result?.code || code
  }
} catch {}

if (out) {
  fs.writeFileSync(path.resolve(process.cwd(), out), transformed)
  console.log(`wrote ${out} (${mode})`)
} else {
  console.log(transformed)
}
