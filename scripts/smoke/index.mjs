#!/usr/bin/env node
import { execSync } from "node:child_process"
import path from "node:path"

const cli = `node ${path.join("packages", "cli", "dist", "index.js")}`
const commands = [
  `${cli} parse packages/scanner/src/index.ts`,
  `${cli} transform packages/cli/src/index.ts artifacts/transform-output.js`,
  `${cli} minify packages/cli/src/index.ts`,
  `${cli} lint packages/cli/src 2`,
  `${cli} format packages/cli/src/index.ts`,
  `${cli} lsp --help`,
  `${cli} stats packages/cli/src`,
]

for (const cmd of commands) {
  console.log(`Running: ${cmd}`)
  try {
    execSync(cmd, { stdio: "inherit" })
  } catch {
    console.error(`❌ Failed: ${cmd}`)
    process.exit(1)
  }
}

console.log("✅ All smoke tests passed")
