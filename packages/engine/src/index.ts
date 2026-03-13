import path from "node:path"

import { generateCssForClasses, mergeClassesStatic } from "@tailwind-styled/compiler"
import { scanWorkspace, type ScanWorkspaceOptions, type ScanWorkspaceResult } from "@tailwind-styled/scanner"

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

export interface TailwindStyledEngine {
  scan(): ScanWorkspaceResult
  build(): Promise<BuildResult>
}

export async function createEngine(options: EngineOptions = {}): Promise<TailwindStyledEngine> {
  const root = options.root ?? process.cwd()

  const doScan = (): ScanWorkspaceResult => scanWorkspace(path.resolve(root), options.scanner)

  return {
    scan: doScan,
    async build(): Promise<BuildResult> {
      const scan = doScan()
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
    },
  }
}
