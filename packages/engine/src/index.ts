import fs from "node:fs"
import path from "node:path"

import { generateCssForClasses, mergeClassesStatic } from "@tailwind-styled/compiler"
import { scanWorkspace, type ScanWorkspaceOptions, type ScanWorkspaceResult } from "@tailwind-styled/scanner"

import { applyIncrementalChange } from "./incremental"
import { EngineMetricsCollector, type EngineMetricsSnapshot } from "./metrics"
import { watchWorkspace, type WorkspaceWatcher } from "./watch"
import {
  type EnginePlugin,
  runAfterBuild,
  runAfterScan,
  runBeforeBuild,
  runBeforeScan,
  runOnError,
  runTransformClasses,
} from "./plugin-api"

const DEFAULT_LARGE_FILE_THRESHOLD_BYTES = 10 * 1024 * 1024
const DEFAULT_FLUSH_DEBOUNCE_MS = 100
const DEFAULT_MAX_EVENTS_PER_FLUSH = 100

export interface EngineOptions {
  root?: string
  scanner?: ScanWorkspaceOptions
  compileCss?: boolean
  tailwindConfigPath?: string
  plugins?: EnginePlugin[]
}

export interface EngineWatchOptions {
  debounceMs?: number
  maxEventsPerFlush?: number
  largeFileThreshold?: number
}

export interface BuildResult {
  scan: ScanWorkspaceResult
  mergedClassList: string
  css: string
}

type EngineBuildWatchEventType = "initial" | "change" | "unlink" | "full-rescan"

export type EngineWatchEvent =
  | {
      type: EngineBuildWatchEventType
      filePath?: string
      result: BuildResult
      metrics?: EngineMetricsSnapshot
    }
  | {
      type: "error"
      filePath?: string
      error: string
      metrics?: EngineMetricsSnapshot
    }

export interface TailwindStyledEngine {
  scan(): Promise<ScanWorkspaceResult>
  build(): Promise<BuildResult>
  watch(onEvent: (event: EngineWatchEvent) => void, options?: EngineWatchOptions): Promise<{ close(): void }>
}

async function buildFromScan(
  scan: ScanWorkspaceResult,
  root: string,
  options: EngineOptions
): Promise<BuildResult> {
  const plugins = options.plugins ?? []
  const context = { root, timestamp: Date.now() }

  await runBeforeBuild(plugins, scan, context)
  const transformedClasses = await runTransformClasses(plugins, scan.uniqueClasses, context)
  const mergedClassList = mergeClassesStatic(transformedClasses.join(" "))

  let css = ""
  if (options.compileCss !== false && mergedClassList.length > 0) {
    css = await generateCssForClasses(
      mergedClassList.split(/\s+/).filter(Boolean),
      undefined,
      root
    )
  }

  const result: BuildResult = {
    scan,
    mergedClassList,
    css,
  }

  return runAfterBuild(plugins, result, context)
}

export async function createEngine(options: EngineOptions = {}): Promise<TailwindStyledEngine> {
  const root = options.root ?? process.cwd()
  const resolvedRoot = path.resolve(root)

  const plugins = options.plugins ?? []

  const doScan = async (): Promise<ScanWorkspaceResult> => {
    const context = { root: resolvedRoot, timestamp: Date.now() }
    await runBeforeScan(plugins, context)
    const scan = scanWorkspace(resolvedRoot, options.scanner)
    return runAfterScan(plugins, scan, context)
  }

  return {
    scan: doScan,
    async build(): Promise<BuildResult> {
      return buildFromScan(await doScan(), resolvedRoot, options)
    },
    async watch(
      onEvent: (event: EngineWatchEvent) => void,
      watchOptions: EngineWatchOptions = {}
    ): Promise<{ close(): void }> {
      const flushDebounceMs = watchOptions.debounceMs ?? DEFAULT_FLUSH_DEBOUNCE_MS
      const maxEventsPerFlush = watchOptions.maxEventsPerFlush ?? DEFAULT_MAX_EVENTS_PER_FLUSH
      const largeFileThreshold = watchOptions.largeFileThreshold ?? DEFAULT_LARGE_FILE_THRESHOLD_BYTES

      let currentScan = await doScan()
      onEvent({ type: "initial", result: await buildFromScan(currentScan, resolvedRoot, options) })

      let timer: NodeJS.Timeout | null = null
      const queue: Array<{ type: "change" | "unlink"; filePath: string }> = []
      const metrics = new EngineMetricsCollector()

      const scheduleFlush = (): void => {
        if (timer) return
        timer = setTimeout(() => {
          timer = null
          void flushBatch()
        }, flushDebounceMs)
      }

      const shouldForceFullRescan = (event: { type: "change" | "unlink"; filePath: string }): boolean => {
        if (event.type === "unlink") return false
        try {
          const stat = fs.statSync(event.filePath)
          if (stat.size > largeFileThreshold) {
            metrics.markSkippedLargeFile()
            return true
          }
        } catch {
          return false
        }
        return false
      }

      const flushBatch = async (): Promise<void> => {
        if (queue.length === 0) return

        const batch = queue.splice(0, maxEventsPerFlush)
        metrics.markBatchProcessed(batch.length)

        let forceRescan = false
        for (const event of batch) {
          if (shouldForceFullRescan(event)) {
            forceRescan = true
            break
          }
        }

        const lastEvent = batch[batch.length - 1]
        let emittedType: EngineBuildWatchEventType = lastEvent.type

        try {
          if (forceRescan) {
            currentScan = await doScan()
            metrics.markFullRescan()
            emittedType = "full-rescan"
          } else {
            for (const event of batch) {
              currentScan = applyIncrementalChange(currentScan, event.filePath, event.type, options.scanner)
              metrics.markIncremental()
            }
          }
        } catch {
          currentScan = await doScan()
          metrics.markFullRescan()
          emittedType = "full-rescan"
        }

        const started = Date.now()
        const result = await buildFromScan(currentScan, resolvedRoot, options)
        metrics.markBuildDuration(Date.now() - started)

        onEvent({
          type: emittedType,
          filePath: lastEvent.filePath,
          result,
          metrics: metrics.snapshot(),
        })

        if (queue.length > 0) scheduleFlush()
      }

      const watcher: WorkspaceWatcher = watchWorkspace(
        resolvedRoot,
        (event) => {
          queue.push(event)
          metrics.markEventReceived(queue.length)
          scheduleFlush()
        },
        {
          ignoreDirectories: options.scanner?.ignoreDirectories,
          debounceMs: flushDebounceMs,
          onError: (error, directory) => {
            const context = { root: resolvedRoot, timestamp: Date.now() }
            void runOnError(plugins, error, context)
            onEvent({
              type: "error",
              filePath: directory,
              error: error.message,
              metrics: metrics.snapshot(),
            })
          },
        }
      )

      return {
        close() {
          if (timer) clearTimeout(timer)
          watcher.close()
        },
      }
    },
  }
}

export { applyIncrementalChange } from "./incremental"
export { EngineMetricsCollector } from "./metrics"
export { watchWorkspace } from "./watch"
export type { EnginePlugin, EnginePluginContext } from "./plugin-api"
