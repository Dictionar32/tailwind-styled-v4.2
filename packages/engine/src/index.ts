import path from "node:path"

import { generateCssForClasses, mergeClassesStatic } from "@tailwind-styled/compiler"
import { scanWorkspace, type ScanWorkspaceOptions, type ScanWorkspaceResult } from "@tailwind-styled/scanner"

import { applyIncrementalChange } from "./incremental"
import { watchWorkspace, type WorkspaceWatcher } from "./watch"

export interface EngineOptions {
  root?: string
  scanner?: ScanWorkspaceOptions
  compileCss?: boolean
  tailwindConfigPath?: string
}

export interface BuildResult {
  scan: ScanWorkspaceResult
  mergedClassList: string
  css: string
}

export interface EngineWatchEvent {
  type: "initial" | "change" | "unlink"
  filePath?: string
  result: BuildResult
}

export interface TailwindStyledEngine {
  scan(): ScanWorkspaceResult
  build(): Promise<BuildResult>
  watch(onEvent: (event: EngineWatchEvent) => void): Promise<{ close(): void }>
}

async function buildFromScan(
  scan: ScanWorkspaceResult,
  root: string,
  options: EngineOptions
): Promise<BuildResult> {
  const mergedClassList = mergeClassesStatic(scan.uniqueClasses.join(" "))

  let css = ""
  if (options.compileCss !== false && mergedClassList.length > 0) {
    css = await generateCssForClasses(
      mergedClassList.split(/\s+/).filter(Boolean),
      undefined,
      root
    )
  }

  return {
    scan,
    mergedClassList,
    css,
  }
}

export async function createEngine(options: EngineOptions = {}): Promise<TailwindStyledEngine> {
  const root = options.root ?? process.cwd()
  const resolvedRoot = path.resolve(root)

  const doScan = (): ScanWorkspaceResult => scanWorkspace(resolvedRoot, options.scanner)

  return {
    scan: doScan,
    async build(): Promise<BuildResult> {
      return buildFromScan(doScan(), resolvedRoot, options)
    },
    async watch(onEvent: (event: EngineWatchEvent) => void): Promise<{ close(): void }> {
      let currentScan = doScan()
      onEvent({ type: "initial", result: await buildFromScan(currentScan, resolvedRoot, options) })

      let scheduled = false
      const queue: Array<{ type: "change" | "unlink"; filePath: string }> = []

      const flush = async () => {
        if (scheduled) return
        scheduled = true
        setTimeout(async () => {
          scheduled = false
          const next = queue.shift()
          if (!next) return

          try {
            currentScan = applyIncrementalChange(currentScan, next.filePath, next.type, options.scanner)
          } catch {
            currentScan = doScan()
          }

          const result = await buildFromScan(currentScan, resolvedRoot, options)
          onEvent({ type: next.type, filePath: next.filePath, result })

          if (queue.length > 0) void flush()
        }, 50)
      }

      const watcher: WorkspaceWatcher = watchWorkspace(
        resolvedRoot,
        (event) => {
          queue.push(event)
          void flush()
        },
        { ignoreDirectories: options.scanner?.ignoreDirectories }
      )

      return {
        close() {
          watcher.close()
        },
      }
    },
  }
}

export { applyIncrementalChange } from "./incremental"
export { watchWorkspace } from "./watch"
