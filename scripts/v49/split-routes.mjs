#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.cwd(), process.argv[2] || '.')
const outDir = path.resolve(process.cwd(), process.argv[3] || 'artifacts/route-css')

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.git')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (/page\.(t|j)sx?$/.test(entry.name)) acc.push(full)
  }
  return acc
}

const pages = walk(root)
fs.mkdirSync(outDir, { recursive: true })
const manifest = {}

for (const page of pages) {
  const route = page.replace(root, '').replace(/\\/g, '/').replace(/\/page\.(t|j)sx?$/, '') || '/'
  const cssFile = route.replace(/^\//, '').replace(/\//g, '_') || 'index'
  const outFile = path.join(outDir, `${cssFile}.css`)
  fs.writeFileSync(outFile, `/* route chunk for ${route} */\n`)
  manifest[route] = path.relative(process.cwd(), outFile)
}

const manifestPath = path.join(outDir, 'css-manifest.json')
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
console.log(`generated ${Object.keys(manifest).length} route css chunks`)
console.log(`manifest: ${manifestPath}`)
