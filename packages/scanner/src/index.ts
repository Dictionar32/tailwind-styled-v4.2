import fs from "node:fs"
import path from "node:path"

import { extractAllClasses } from "@tailwind-styled/compiler"

import { ScanCache } from "./cache"
import { SmartCache } from "./smart-cache"
import { parseJsxLikeClasses } from "./ast-parser"

type NativeParsedClass = { raw?: string }
type NativeParserBinding = { parse_classes?: (input: string) => NativeParsedClass[] }

let nativeParserBinding: NativeParserBinding | null | undefined
let nativeParserInitError: string | null = null
let nativeParserLogged = false

function canUseCjsRequire(): boolean {
  return typeof require === "function"
}

function debugNative(message: string): void {
  if (process.env.TWS_DEBUG_SCANNER !== "1") return
  if (nativeParserLogged) return
  nativeParserLogged = true
  console.warn(`[scanner:native] ${message}`)
}

function loadNativeParserBinding(): NativeParserBinding | null {
  if (nativeParserBinding !== undefined) return nativeParserBinding

  if (!canUseCjsRequire()) {
    nativeParserBinding = null
    nativeParserInitError = "require is unavailable in current module format"
    debugNative(`fallback to JS: ${nativeParserInitError}`)
    return nativeParserBinding
  }

  const candidates = [
    path.resolve(process.cwd(), "native/tailwind_styled_parser.node"),
    path.resolve(process.cwd(), "native/build/Release/tailwind_styled_parser.node"),
  ]

  for (const fullPath of candidates) {
    if (!fs.existsSync(fullPath)) continue
    try {
      const required = require(fullPath) as NativeParserBinding
      if (required && typeof required.parse_classes === "function") {
        nativeParserBinding = required
        debugNative(`using native parser from ${fullPath}`)
        return nativeParserBinding
      }
    } catch (error) {
      nativeParserInitError = error instanceof Error ? error.message : String(error)
    }
  }

  nativeParserBinding = null
  if (!nativeParserInitError) {
    nativeParserInitError = "native .node binding not found"
  }
  debugNative(`fallback to JS: ${nativeParserInitError}`)
  return nativeParserBinding
}

function normalizeWithNativeParser(tokens: string[]): string[] | null {
  const binding = loadNativeParserBinding()
  if (!binding || typeof binding.parse_classes !== "function") return null

  try {
    const parsed = binding.parse_classes(tokens.join(" "))
    const normalized = parsed.map((item) => item.raw?.trim() ?? "").filter(Boolean)
    return Array.from(new Set(normalized))
  } catch (error) {
    nativeParserInitError = error instanceof Error ? error.message : String(error)
    debugNative(`runtime error, fallback to JS: ${nativeParserInitError}`)
    return null
  }
}

export interface ScanWorkspaceOptions {
  includeExtensions?: string[]
  ignoreDirectories?: string[]
  useCache?: boolean
  cacheDir?: string
  smartInvalidation?: boolean
}

export interface ScanFileResult {
  file: string
  classes: string[]
}

export interface ScanWorkspaceResult {
  files: ScanFileResult[]
  totalFiles: number
  uniqueClasses: string[]
}

export const DEFAULT_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]
export const DEFAULT_IGNORES = ["node_modules", ".git", ".next", "dist", "out", ".turbo", ".cache"]

export function scanSource(source: string): string[] {
  const baseClasses = extractAllClasses(source)
  let jsxClasses: string[] = []
  try {
    jsxClasses = parseJsxLikeClasses(source)
  } catch {
    jsxClasses = []
  }

  const merged = Array.from(new Set([...baseClasses, ...jsxClasses]))
  const nativeNormalized = normalizeWithNativeParser(merged)
  if (nativeNormalized) return nativeNormalized

  return merged
}

export function isScannableFile(filePath: string, includeExtensions = DEFAULT_EXTENSIONS): boolean {
  return includeExtensions.includes(path.extname(filePath))
}

export function scanFile(filePath: string): ScanFileResult {
  const source = fs.readFileSync(filePath, "utf8")
  return {
    file: filePath,
    classes: scanSource(source),
  }
}

export function scanWorkspace(
  rootDir: string,
  options: ScanWorkspaceOptions = {}
): ScanWorkspaceResult {
  const includeExtensions = options.includeExtensions ?? DEFAULT_EXTENSIONS
  const ignoreDirectories = new Set(options.ignoreDirectories ?? DEFAULT_IGNORES)
  const useCache = options.useCache ?? true
  const smartInvalidation = options.smartInvalidation ?? true

  const files: ScanFileResult[] = []
  const unique = new Set<string>()
  const cache = useCache ? new ScanCache(rootDir, { cacheDir: options.cacheDir }) : null
  const smartCache = cache && smartInvalidation ? new SmartCache(cache) : null
  const candidates: string[] = []

  function walk(dir: string) {
    if (!fs.existsSync(dir)) return

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        if (ignoreDirectories.has(entry.name)) continue
        walk(fullPath)
        continue
      }

      if (!isScannableFile(fullPath, includeExtensions)) continue
      candidates.push(fullPath)
    }
  }

  walk(rootDir)

  const ordered = smartCache
    ? smartCache.rankFiles(candidates).map((item) => ({ filePath: item.filePath, stat: item.stat }))
    : candidates.map((filePath) => ({ filePath, stat: fs.statSync(filePath) }))

  for (const { filePath, stat } of ordered) {
    let result: ScanFileResult | null = null

    if (cache) {
      const cached = cache.get(filePath)
      if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
        result = { file: filePath, classes: cached.classes }
        cache.touch(filePath)
      }
    }

    if (!result) {
      result = scanFile(filePath)
      if (cache) {
        cache.set(filePath, {
          mtimeMs: stat.mtimeMs,
          size: stat.size,
          classes: result.classes,
          hitCount: 1,
          lastSeenMs: Date.now(),
        })
      }
    }

    files.push(result)
    for (const cls of result.classes) unique.add(cls)
  }

  if (smartCache) {
    smartCache.invalidateMissing(new Set(candidates))
  }
  cache?.save()

  return {
    files,
    totalFiles: files.length,
    uniqueClasses: Array.from(unique).sort(),
  }
}
