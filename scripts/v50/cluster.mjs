#!/usr/bin/env node
import os from 'node:os'

const cmd = process.argv[2]
const workers = Number(process.argv[3] || os.cpus().length)

if (cmd === 'init') {
  console.log(JSON.stringify({ status: 'initialized', workers }, null, 2))
  process.exit(0)
}

if (cmd === 'build') {
  console.log(JSON.stringify({ status: 'build-dispatched', workers, simulated: true }, null, 2))
  process.exit(0)
}

console.error('Usage: node scripts/v50/cluster.mjs <init|build> [workers]')
process.exit(1)
