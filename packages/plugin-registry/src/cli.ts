#!/usr/bin/env node
import { PluginRegistryError, registry } from "./index"

function printHelp(): void {
  console.log(`tw-plugin commands:
  search <query>
  install <package> [--dry-run] [--allow-external] [--yes]
  list`)
}

function isTruthyFlag(args: string[], flag: string): boolean {
  return args.includes(flag)
}

function firstNonFlag(args: string[]): string | undefined {
  return args.find((item) => !item.startsWith("-"))
}

function maybeRed(text: string): string {
  if (!process.stderr.isTTY) return text
  return `\x1b[31m${text}\x1b[0m`
}

function printError(error: unknown): never {
  if (error instanceof PluginRegistryError) {
    const normalized = error.toObject()
    console.error(maybeRed(`[${normalized.code}] ${normalized.message}`))
    if (normalized.context) {
      console.error(maybeRed(`context: ${JSON.stringify(normalized.context)}`))
    }
    process.exit(1)
  }

  const message = error instanceof Error ? error.message : String(error)
  console.error(maybeRed(`[UNEXPECTED_ERROR] ${message}`))
  process.exit(1)
}

function run(): void {
  const [, , command, ...rest] = process.argv

  if (!command || command === "--help" || command === "-h") {
    printHelp()
    return
  }

  if (command === "search") {
    const query = rest.join(" ")
    const results = registry.search(query)
    if (results.length === 0) {
      console.log("No plugins found")
      process.exit(0)
    }

    for (const plugin of results) {
      const scope = plugin.official ? "official" : "community"
      console.log(`${plugin.name}@${plugin.version} [${scope}]`)
      console.log(`  ${plugin.description}`)
      console.log(`  tags: ${plugin.tags.join(", ")}`)
    }
    return
  }

  if (command === "list") {
    const results = registry.getAll()
    for (const plugin of results) {
      console.log(`${plugin.name}@${plugin.version}`)
    }
    return
  }

  if (command === "install") {
    const pluginName = firstNonFlag(rest)
    const dryRun = isTruthyFlag(rest, "--dry-run")
    const allowExternal = isTruthyFlag(rest, "--allow-external")
    const confirmExternal = isTruthyFlag(rest, "--yes")

    if (!pluginName) {
      console.error(maybeRed("Missing plugin name"))
      process.exit(1)
    }

    try {
      const result = registry.install(pluginName, {
        dryRun,
        allowExternal,
        confirmExternal,
      })
      console.log(`Installed: ${result.plugin}`)
      return
    } catch (error) {
      printError(error)
    }
  }

  console.error(maybeRed(`Unknown command: ${command}`))
  printHelp()
  process.exit(1)
}

run()
