#!/usr/bin/env node
import fs from 'node:fs'

const result = {
  generatedAt: new Date().toISOString(),
  parser: {
    oxc: { status: 'optional', note: 'uses oxc-parser when installed' },
    fallback: { status: 'active', note: 'regex parser fallback for local prototype' }
  },
  lint: { mode: 'parallel-simulated', source: 'scripts/v48/lint-parallel.mjs' }
}

fs.mkdirSync('docs/benchmark', { recursive: true })
fs.writeFileSync('docs/benchmark/toolchain-comparison.json', JSON.stringify(result, null, 2) + '\n')
console.log('wrote docs/benchmark/toolchain-comparison.json')
