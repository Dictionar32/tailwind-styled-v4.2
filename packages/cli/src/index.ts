#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"

import { runAnalyzeCli } from "./analyze"
import { runExtractCli } from "./extract"
import { runInitCli } from "./init"
import { runMigrateCli } from "./migrate"
import { runScanCli } from "./scan"
import { runStatsCli } from "./stats"

const args = process.argv.slice(2)
const command = args[0]
const restArgs = args.slice(1)

type PluginInfo = {
  name: string
  description: string
  version: string
  tags: string[]
  official?: boolean
}

const HELP = `
tailwind-styled-v4 CLI (tw)

Unified commands (v4.3):
  tw plugin search <query>         Search plugins
  tw plugin list                   List registry plugins
  tw plugin install <name>         Install plugin package
  tw create <name> [--template=..] Create project from template
  tw dashboard [--port=3000]       Start dashboard server
  tw test [--watch]                Run test command shortcut
  tw storybook --variants='{...}'  Expand variant matrix
  tw code --docs                   Show VS Code extension docs URL
  tw studio [--project=.]          Open platform studio mode
  tw deploy [name]                 Deploy/publish component metadata
  tw ai "prompt"                   Generate component scaffold from prompt
  tw sync <init|pull|push>         Token sync workflow (local scaffold)
  tw audit                         Emit project audit JSON summary
  tw share <name>                  Print share payload template
  tw parse <file>                  Parse file with Oxc-first prototype
  tw transform <file> [out]        Transform file with Oxc-first prototype
  tw minify <file>                 Minify file with Oxc-first prototype
  tw shake <cssFile>               Remove sentinel-unused CSS rules
  tw lint [dir] [workers]          Parallel lint prototype
  tw format <file> [--write]       Formatter prototype
  tw lsp                           Start LSP prototype
  tw benchmark                     Write toolchain benchmark snapshot
  tw optimize <file>               Compile-time optimization prototype
  tw split [root] [outDir]         Route-based CSS chunk prototype
  tw critical <html> <css>         Critical CSS extraction prototype
  tw cache <enable|status> [arg]   Remote cache prototype controls
  tw cluster <init|build> [n]      Distributed build cluster prototype
  tw adopt <feature> [project]     Incremental adoption prototype
  tw metrics [port]                Real-time metrics server prototype

Existing commands:
  tw init [dir]
  tw scan [dir]
  tw migrate [dir] [--dry-run|--wizard]
  tw analyze [dir]
  tw stats [dir]
  tw extract [dir] [--write]
`

function runShellCommand(binary: string, cmdArgs: string[]): void {
  const child = spawn(binary, cmdArgs, { stdio: "inherit" })
  child.on("exit", (code) => process.exit(code ?? 0))
}

function readFlag(name: string, argv: string[]): string | null {
  const raw = argv.find((arg) => arg.startsWith(`--${name}=`))
  return raw ? raw.split("=").slice(1).join("=") : null
}

function loadRegistry(): PluginInfo[] {
  const registryPath = path.resolve(process.cwd(), "packages/plugin-registry/registry.json")
  const raw = fs.readFileSync(registryPath, "utf8")
  const data = JSON.parse(raw) as { official: PluginInfo[]; community: PluginInfo[] }
  return [
    ...data.official.map((item) => ({ ...item, official: true })),
    ...data.community.map((item) => ({ ...item, official: false })),
  ]
}

function enumerateVariantProps(matrix: Record<string, Array<string | number | boolean>>) {
  const keys = Object.keys(matrix)
  if (keys.length === 0) return [{}]
  const result: Array<Record<string, string | number | boolean>> = []

  function walk(index: number, current: Record<string, string | number | boolean>) {
    if (index >= keys.length) {
      result.push({ ...current })
      return
    }
    const key = keys[index]
    const values = matrix[key] ?? []
    for (const value of values) {
      current[key] = value
      walk(index + 1, current)
    }
  }

  walk(0, {})
  return result
}

async function runUnifiedCommand(): Promise<boolean> {
  if (command === "create") {
    const createMod = await import("./createApp")
    process.argv = [process.argv[0], process.argv[1], ...restArgs]
    await createMod.main()
    return true
  }

  if (command === "plugin") {
    const subcommand = restArgs[0]
    const pluginArgs = restArgs.slice(1)
    const plugins = loadRegistry()

    if (subcommand === "search") {
      const query = pluginArgs.join(" ").toLowerCase().trim()
      const results = plugins.filter((plugin) => {
        if (!query) return true
        return (
          plugin.name.toLowerCase().includes(query) ||
          plugin.description.toLowerCase().includes(query) ||
          plugin.tags.some((tag) => tag.toLowerCase().includes(query))
        )
      })
      console.table(results)
      return true
    }

    if (subcommand === "list") {
      console.table(plugins)
      return true
    }

    if (subcommand === "install") {
      const pluginName = pluginArgs[0]
      if (!pluginName) {
        console.error("Missing plugin name")
        process.exit(1)
      }
      runShellCommand("npm", ["install", pluginName])
      return true
    }

    console.error("Unknown plugin command")
    process.exit(1)
  }

  if (command === "dashboard") {
    const port = readFlag("port", restArgs) ?? process.env.PORT ?? "3000"
    const child = spawn("npm", ["run", "dev", "-w", "@tailwind-styled/dashboard"], {
      stdio: "inherit",
      env: { ...process.env, PORT: port },
    })
    child.on("exit", (code) => process.exit(code ?? 0))
    return true
  }

  if (command === "test") {
    const watch = restArgs.includes("--watch")
    runShellCommand("npm", watch ? ["run", "test", "--", "--watch"] : ["run", "test"])
    return true
  }

  if (command === "storybook") {
    const variantsRaw = readFlag("variants", restArgs)
    if (!variantsRaw) {
      console.error("Missing --variants='{" + '"size":["sm","md"]' + "}'")
      process.exit(1)
    }
    const matrix = JSON.parse(variantsRaw) as Record<string, Array<string | number | boolean>>
    const rows = enumerateVariantProps(matrix)
    console.log(JSON.stringify(rows, null, 2))
    return true
  }


  if (command === "studio") {
    const project = readFlag("project", restArgs) ?? process.cwd()
    console.log(`studio mode prepared for: ${project}`)
    console.log("tip: combine with `tw dashboard --port=3000` for metrics view")
    return true
  }

  if (command === "deploy") {
    const name = restArgs[0] ?? "component"
    const payload = {
      name,
      version: "0.1.0",
      generatedAt: new Date().toISOString(),
      source: process.cwd(),
    }
    console.log(JSON.stringify(payload, null, 2))
    return true
  }

  if (command === "ai") {
    const prompt = restArgs.join(" ").trim()
    if (!prompt) {
      console.error('Usage: tw ai "describe component"')
      process.exit(1)
    }
    runShellCommand(process.execPath, ["scripts/v45/ai.mjs", prompt])
    return true
  }

  if (command === "sync") {
    const syncCmd = restArgs[0]
    if (!syncCmd) {
      console.error("Usage: tw sync <init|pull|push>")
      process.exit(1)
    }
    runShellCommand(process.execPath, ["scripts/v45/sync.mjs", syncCmd])
    return true
  }

  if (command === "audit") {
    runShellCommand(process.execPath, ["scripts/v45/audit.mjs"])
    return true
  }

  if (command === "share") {
    const name = restArgs[0] ?? "component-name"
    console.log(JSON.stringify({
      name,
      channel: "community",
      command: `tw share ${name}`,
      note: "attach README, usage example, and version tag",
    }, null, 2))
    return true
  }


  if (command === "parse") {
    const file = restArgs[0]
    if (!file) {
      console.error("Usage: tw parse <file>")
      process.exit(1)
    }
    runShellCommand(process.execPath, ["scripts/v46/parse.mjs", file])
    return true
  }

  if (command === "transform") {
    const file = restArgs[0]
    const out = restArgs[1]
    if (!file) {
      console.error("Usage: tw transform <file> [outFile]")
      process.exit(1)
    }
    const args = ["scripts/v46/transform.mjs", file]
    if (out) args.push(out)
    runShellCommand(process.execPath, args)
    return true
  }

  if (command === "minify") {
    const file = restArgs[0]
    if (!file) {
      console.error("Usage: tw minify <file>")
      process.exit(1)
    }
    runShellCommand(process.execPath, ["scripts/v47/minify.mjs", file])
    return true
  }

  if (command === "shake") {
    const file = restArgs[0]
    if (!file) {
      console.error("Usage: tw shake <css-file>")
      process.exit(1)
    }
    runShellCommand(process.execPath, ["scripts/v47/shake-css.mjs", file])
    return true
  }

  if (command === "lint") {
    const dir = restArgs[0] ?? "."
    const workers = restArgs[1] ?? "0"
    runShellCommand(process.execPath, ["scripts/v48/lint-parallel.mjs", dir, workers])
    return true
  }

  if (command === "format") {
    const file = restArgs.find((arg) => !arg.startsWith("-"))
    if (!file) {
      console.error("Usage: tw format <file> [--write]")
      process.exit(1)
    }
    const args = ["scripts/v48/format.mjs", file]
    if (restArgs.includes("--write")) args.push("--write")
    runShellCommand(process.execPath, args)
    return true
  }

  if (command === "lsp") {
    runShellCommand(process.execPath, ["scripts/v48/lsp.mjs"])
    return true
  }

  if (command === "benchmark") {
    runShellCommand(process.execPath, ["scripts/v48/benchmark-toolchains.mjs"])
    return true
  }

  if (command === "optimize") {
    const file = restArgs[0]
    if (!file) {
      console.error("Usage: tw optimize <file> [--constant-folding] [--partial-eval]")
      process.exit(1)
    }
    runShellCommand(process.execPath, ["scripts/v49/optimize.mjs", ...restArgs])
    return true
  }

  if (command === "split") {
    const root = restArgs[0] ?? "."
    const outDir = restArgs[1] ?? "artifacts/route-css"
    runShellCommand(process.execPath, ["scripts/v49/split-routes.mjs", root, outDir])
    return true
  }

  if (command === "critical") {
    const html = restArgs[0]
    const css = restArgs[1]
    if (!html || !css) {
      console.error("Usage: tw critical <html-file> <css-file>")
      process.exit(1)
    }
    runShellCommand(process.execPath, ["scripts/v49/critical-css.mjs", html, css])
    return true
  }

  if (command === "cache") {
    const sub = restArgs[0]
    const extra = restArgs[1]
    const args = ["scripts/v50/cache.mjs"]
    if (sub) args.push(sub)
    if (extra) args.push(extra)
    runShellCommand(process.execPath, args)
    return true
  }

  if (command === "cluster") {
    const sub = restArgs[0]
    const workers = restArgs[1]
    const args = ["scripts/v50/cluster.mjs"]
    if (sub) args.push(sub)
    if (workers) args.push(workers)
    runShellCommand(process.execPath, args)
    return true
  }

  if (command === "adopt") {
    const feature = restArgs[0]
    const project = restArgs[1]
    const args = ["scripts/v50/adopt.mjs"]
    if (feature) args.push(feature)
    if (project) args.push(project)
    runShellCommand(process.execPath, args)
    return true
  }

  if (command === "metrics") {
    const port = restArgs[0] ?? "3030"
    runShellCommand(process.execPath, ["scripts/v50/metrics.mjs", port])
    return true
  }

  if (command === "code") {
    if (restArgs.includes("--docs")) {
      console.log("https://marketplace.visualstudio.com/search?term=tailwind-styled&target=VSCode")
      return true
    }
    if (restArgs.includes("--install")) {
      runShellCommand("code", ["--install-extension", "tailwind-styled.tailwind-styled-v4"])
      return true
    }

    console.log("Use: tw code --docs | tw code --install")
    return true
  }

  return false
}

runUnifiedCommand()
  .then((handled) => {
    if (handled) return

    switch (command) {
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
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
