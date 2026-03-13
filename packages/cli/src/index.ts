#!/usr/bin/env node
/**
 * tailwind-styled-v4 — CLI
 *
 * Commands:
 *   npx tailwind-styled create [name]       — scaffold new project
 *   npx tailwind-styled analyze [dir]       — CSS usage analyzer
 *   npx tailwind-styled stats [dir]         — bundle size stats
 *   npx tailwind-styled extract [dir]       — detect repeated patterns
 *   npx tailwind-styled extract --write     — also write shared file
 */

import { runAnalyzeCli } from "./analyze"
import { runExtractCli } from "./extract"
import { runInitCli } from "./init"
import { runMigrateCli } from "./migrate"
import { runScanCli } from "./scan"
import { runStatsCli } from "./stats"

const args = process.argv.slice(2)
const command = args[0]
const restArgs = args.slice(1)

const HELP = `
tailwind-styled-v4 CLI

Commands:
  create [name]            Scaffold a new project
  init [dir]               Initialize Tailwind v4 CSS-first files
  scan [dir]               Scan workspace and summarize Tailwind classes
  migrate [dir]            Apply basic migration transforms to v4
  migrate [dir] --dry-run  Preview migration without writing files
  analyze [dir]            CSS usage analyzer — duplicates, unused variants
  stats [dir]              Bundle size breakdown by component and file
  extract [dir]            Detect repeated patterns, suggest shared components
  extract [dir] --write    Also write extracted components to file

Flags:
  --json                   Output results as JSON
  --write                  (extract only) Write suggestions to file
  --dry-run                (migrate only) Preview without file writes
  --wizard                 (migrate only) Interactive migration options

Examples:
  npx tailwind-styled init
  npx tailwind-styled scan ./src
  npx tailwind-styled migrate ./src --dry-run
  npx tailwind-styled migrate ./src --wizard
  npx tailwind-styled analyze ./src
  npx tailwind-styled stats ./src --json
  npx tailwind-styled extract ./src --write
`

switch (command) {
  case "create":
    import("./createApp").then((m) => m.main?.())
    break
  case "init":
    runInitCli(restArgs)
    break
  case "scan":
    runScanCli(restArgs)
    break
  case "migrate":
    runMigrateCli(restArgs).catch((err) => {
      console.error("Migration failed:", err)
      process.exit(1)
    })
    break
  case "analyze":
    runAnalyzeCli(restArgs)
    break
  case "stats":
    runStatsCli(restArgs)
    break
  case "extract":
    runExtractCli(restArgs)
    break
  case "help":
  case "--help":
  case "-h":
  case undefined:
    console.log(HELP)
    break
  default:
    console.error(`Unknown command: ${command}`)
    console.log(HELP)
    process.exit(1)
}
