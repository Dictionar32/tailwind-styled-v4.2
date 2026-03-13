import fs from "node:fs"
import path from "node:path"

export interface WatcherOptions {
  ignoreDirectories?: string[]
}

export interface WatcherEvent {
  type: "change" | "unlink"
  filePath: string
}

export interface WorkspaceWatcher {
  close(): void
}

const DEFAULT_IGNORES = ["node_modules", ".git", ".next", "dist", "out", ".turbo", ".cache"]

export function watchWorkspace(
  rootDir: string,
  onEvent: (event: WatcherEvent) => void,
  options: WatcherOptions = {}
): WorkspaceWatcher {
  const ignoreDirectories = new Set(options.ignoreDirectories ?? DEFAULT_IGNORES)
  const watchers = new Map<string, fs.FSWatcher>()

  const shouldIgnore = (targetPath: string): boolean => {
    const parts = targetPath.split(path.sep)
    return parts.some((part) => ignoreDirectories.has(part))
  }

  const watchDir = (dir: string): void => {
    if (watchers.has(dir) || shouldIgnore(dir) || !fs.existsSync(dir)) return

    const watcher = fs.watch(dir, { persistent: true }, (_eventType, fileName) => {
      if (!fileName) return
      const fullPath = path.join(dir, fileName.toString())
      if (shouldIgnore(fullPath)) return

      if (fs.existsSync(fullPath)) {
        try {
          const stat = fs.statSync(fullPath)
          if (stat.isDirectory()) {
            watchDir(fullPath)
            return
          }
          onEvent({ type: "change", filePath: fullPath })
          return
        } catch {
          // ignore transient fs errors
        }
      }

      onEvent({ type: "unlink", filePath: fullPath })
    })

    watchers.set(dir, watcher)

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        watchDir(path.join(dir, entry.name))
      }
    }
  }

  watchDir(path.resolve(rootDir))

  return {
    close() {
      for (const watcher of watchers.values()) watcher.close()
      watchers.clear()
    },
  }
}
