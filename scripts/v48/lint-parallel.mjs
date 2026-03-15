#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const root = path.resolve(process.cwd(), process.argv[2] || '.')
const workers = Number(process.argv[3] || os.cpus().length)
const exts = new Set(['.ts', '.tsx', '.js', '.jsx'])

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.git')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (exts.has(path.extname(entry.name))) acc.push(full)
  }
  return acc
}

const files = walk(root)
const diagnostics = files.map((file) => {
  const src = fs.readFileSync(file, 'utf8')
  const count = (src.match(/TODO|FIXME/g) || []).length
  return { file: path.relative(process.cwd(), file), diagnostics: count }
})

console.log(JSON.stringify({ workers, files: diagnostics.length, diagnostics }, null, 2))
