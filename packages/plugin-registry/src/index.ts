import { spawnSync } from "node:child_process"
import registryData from "../registry.json"

const PLUGIN_NAME_REGEX = /^(@[a-z0-9-]+\/)?[a-z0-9-]+$/

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

export type PluginRegistryErrorCode =
  | "INVALID_PLUGIN_NAME"
  | "PLUGIN_NOT_FOUND"
  | "EXTERNAL_CONFIRMATION_REQUIRED"
  | "INSTALL_COMMAND_FAILED"
  | "INSTALL_FAILED"

export interface PluginRegistryErrorPayload {
  code: PluginRegistryErrorCode
  message: string
  context?: Record<string, unknown>
}

export class PluginRegistryError extends Error {
  readonly code: PluginRegistryErrorCode
  readonly context?: Record<string, unknown>

  constructor(payload: PluginRegistryErrorPayload) {
    super(payload.message)
    this.name = "PluginRegistryError"
    this.code = payload.code
    this.context = payload.context
  }

  toObject(): PluginRegistryErrorPayload {
    return {
      code: this.code,
      message: this.message,
      context: this.context,
    }
  }
}

export interface InstallOptions {
  dryRun?: boolean
  npmBin?: string
  allowExternal?: boolean
  confirmExternal?: boolean
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

  getByName(pluginName: string): PluginInfo | undefined {
    return this.plugins.find((plugin) => plugin.name === pluginName)
  }

  install(pluginName: string, options: InstallOptions = {}): InstallResult {
    const npmBin = options.npmBin ?? process.env.TW_PLUGIN_NPM_BIN ?? "npm"

    if (!PLUGIN_NAME_REGEX.test(pluginName)) {
      throw new PluginRegistryError({
        code: "INVALID_PLUGIN_NAME",
        message: `Nama plugin tidak valid: '${pluginName}'.`,
        context: {
          pluginName,
          expectedPattern: String(PLUGIN_NAME_REGEX),
        },
      })
    }

    const knownPlugin = this.getByName(pluginName)
    const isExternal = !knownPlugin

    if (isExternal && !options.allowExternal) {
      throw new PluginRegistryError({
        code: "PLUGIN_NOT_FOUND",
        message: `Plugin '${pluginName}' tidak ditemukan di registry. Coba cari dengan 'tw-plugin search <keyword>'.`,
        context: {
          pluginName,
          allowExternal: false,
        },
      })
    }

    if (isExternal && options.allowExternal && !options.confirmExternal) {
      throw new PluginRegistryError({
        code: "EXTERNAL_CONFIRMATION_REQUIRED",
        message: `Plugin eksternal '${pluginName}' butuh konfirmasi. Jalankan ulang dengan --allow-external --yes.`,
        context: {
          pluginName,
          allowExternal: true,
        },
      })
    }

    const command = `${npmBin} install ${pluginName}`
    if (options.dryRun) {
      return { plugin: pluginName, installed: true, command, exitCode: 0 }
    }

    const child = spawnSync(npmBin, ["install", pluginName], { stdio: "inherit" })
    if (child.error) {
      throw new PluginRegistryError({
        code: "INSTALL_COMMAND_FAILED",
        message: `Gagal menjalankan perintah install: ${command}`,
        context: {
          pluginName,
          command,
          reason: child.error.message,
        },
      })
    }

    if (child.status !== 0) {
      throw new PluginRegistryError({
        code: "INSTALL_FAILED",
        message: `Install gagal (${child.status ?? 1}): ${command}`,
        context: {
          pluginName,
          command,
          exitCode: child.status ?? 1,
        },
      })
    }

    return {
      plugin: pluginName,
      installed: true,
      command,
      exitCode: 0,
    }
  }
}

export const registry = new PluginRegistry()
