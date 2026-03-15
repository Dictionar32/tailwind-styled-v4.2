#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const htmlFile = process.argv[2]
const cssFile = process.argv[3]
if (!htmlFile || !cssFile) {
  console.error('Usage: node scripts/v49/critical-css.mjs <html-file> <css-file>')
  process.exit(1)
}

const html = fs.readFileSync(path.resolve(process.cwd(), htmlFile), 'utf8')
const css = fs.readFileSync(path.resolve(process.cwd(), cssFile), 'utf8')

const classNames = new Set((html.match(/class="([^"]+)"/g) || []).flatMap((m) => m.replace(/class="|"/g, '').split(/\s+/)))
const criticalRules = css
  .split('}')
  .filter((rule) => {
    for (const cls of classNames) {
      if (rule.includes(`.${cls}`)) return true
    }
    return false
  })
  .map((rule) => `${rule}}`)
  .join('\n')

console.log(JSON.stringify({
  htmlFile,
  cssFile,
  classesDetected: classNames.size,
  criticalBytes: criticalRules.length,
  inline: `<style>${criticalRules}</style>`
}, null, 2))
