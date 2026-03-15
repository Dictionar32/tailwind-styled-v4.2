#!/usr/bin/env node
import { registry } from "./index"

function printHelp(): void {
  console.log(`tw-plugin commands:\n  search <query>\n  install <package> [--dry-run]\n  list`)
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
    const pluginName = rest.find((item) => !item.startsWith("-"))
    const dryRun = rest.includes("--dry-run")

    if (!pluginName) {
      console.error("Missing plugin name")
      process.exit(1)
    }

    const result = registry.install(pluginName, { dryRun })
    if (!result.installed) {
      console.error(`Install failed (${result.exitCode}): ${result.command}`)
      process.exit(result.exitCode)
    }

    console.log(`Installed: ${pluginName}`)
    return
  }

  console.error(`Unknown command: ${command}`)
  printHelp()
  process.exit(1)
}

run()
