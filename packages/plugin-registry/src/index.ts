import { spawnSync } from "node:child_process"
import registryData from "../registry.json"

export interface PluginInfo {
  name: string
  description: string
  version: string
  tags: string[]
  official?: boolean
}

interface RegistryData {
  official: PluginInfo[]
  community: PluginInfo[]
}

export interface InstallResult {
  plugin: string
  installed: boolean
  command: string
  exitCode: number
}

export class PluginRegistry {
  private readonly plugins: PluginInfo[]

  constructor() {
    const data = registryData as RegistryData
    const official = data.official.map((item) => ({
      name: item.name,
      description: item.description,
      version: item.version,
      tags: [...item.tags],
      official: true,
    }))
    const community = data.community.map((item) => ({
      name: item.name,
      description: item.description,
      version: item.version,
      tags: [...item.tags],
      official: false,
    }))
    this.plugins = [...official, ...community]
  }

  search(query: string): PluginInfo[] {
    const q = query.trim().toLowerCase()
    if (!q) return [...this.plugins]

    return this.plugins.filter((plugin) => {
      return (
        plugin.name.toLowerCase().includes(q) ||
        plugin.description.toLowerCase().includes(q) ||
        plugin.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    })
  }

  getAll(): PluginInfo[] {
    return [...this.plugins]
  }

  install(pluginName: string, options: { dryRun?: boolean } = {}): InstallResult {
    const command = `npm install ${pluginName}`
    if (options.dryRun) {
      return { plugin: pluginName, installed: true, command, exitCode: 0 }
    }

    const child = spawnSync("npm", ["install", pluginName], { stdio: "inherit" })
    return {
      plugin: pluginName,
      installed: child.status === 0,
      command,
      exitCode: child.status ?? 1,
    }
  }
}

export const registry = new PluginRegistry()
