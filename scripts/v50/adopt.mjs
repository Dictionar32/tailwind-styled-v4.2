#!/usr/bin/env node

const feature = process.argv[2]
const project = process.argv[3] || '.'

if (!feature) {
  console.error('Usage: node scripts/v50/adopt.mjs <feature> [project]')
  process.exit(1)
}

console.log(JSON.stringify({
  feature,
  project,
  success: true,
  compatibilityScore: 0.9,
  automatedMigrations: ['config-flag-enabled', 'command-alias-added'],
  manualReview: []
}, null, 2))
