#!/usr/bin/env node
/**
 * tailwind-styled-v4 — Bundle Stats Visualizer
 *
 * npx tailwind-styled stats [dir]
 *
 * Reports:
 *   - Total CSS byte size (estimated)
 *   - Size breakdown per component
 *   - Size breakdown per route/file
 *   - Duplicate class savings potential
 */

import fs from "node:fs"
import path from "node:path"
import type { AnalysisReport } from "./analyze"
import { analyzeProject } from "./analyze"

// ─────────────────────────────────────────────────────────────────────────────
// CSS size estimator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estimate bytes a Tailwind class generates.
 * Based on average Tailwind v4 utility sizes.
 */
function estimateClassBytes(cls: string): number {
  // Base CSS rule overhead: `.class { ... }\n` ≈ 20 bytes
  const base = 20

  // Estimate declaration length by class type
  if (cls.startsWith("bg-")) return base + 28 // background-color: rgb(...)
  if (cls.startsWith("text-")) return base + 22 // color: rgb(...)
  if (cls.startsWith("border-")) return base + 20
  if (cls.startsWith("p-") || cls.startsWith("px-") || cls.startsWith("py-")) return base + 18
  if (cls.startsWith("m-") || cls.startsWith("mx-") || cls.startsWith("my-")) return base + 18
  if (cls.startsWith("w-") || cls.startsWith("h-")) return base + 12
  if (cls.startsWith("flex")) return base + 16
  if (cls.startsWith("grid")) return base + 20
  if (cls.startsWith("rounded")) return base + 18
  if (cls.startsWith("shadow")) return base + 30
  if (cls.startsWith("transition")) return base + 40
  if (cls.startsWith("font-")) return base + 16
  if (cls.startsWith("opacity")) return base + 12
  if (cls.startsWith("ring")) return base + 30
  if (cls.includes("[")) return base + cls.length + 5 // arbitrary value
  return base + 15
}

function estimateGzip(bytes: number): number {
  // Rough gzip ratio for CSS: ~30-40% of original
  return Math.round(bytes * 0.35)
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats computation
// ─────────────────────────────────────────────────────────────────────────────

export interface ComponentStat {
  name: string
  file: string
  classCount: number
  estimatedBytes: number
  percentage: number
}

export interface FileStat {
  file: string
  componentCount: number
  estimatedBytes: number
  percentage: number
}

export interface BundleStats {
  totalBytes: number
  gzipBytes: number
  uniqueClassBytes: number
  duplicateSavingsBytes: number
  byComponent: ComponentStat[]
  byFile: FileStat[]
  report: AnalysisReport
}

export function computeStats(report: AnalysisReport): BundleStats {
  // Count class occurrences and bytes
  const classCounts = new Map<string, number>()
  for (const comp of report.componentDefs) {
    for (const cls of comp.classes) {
      classCounts.set(cls, (classCounts.get(cls) ?? 0) + 1)
    }
  }

  // Total bytes if all classes were separate
  let totalBytes = 0
  const classBytes = new Map<string, number>()
  for (const [cls] of classCounts) {
    const bytes = estimateClassBytes(cls)
    classBytes.set(cls, bytes)
    totalBytes += bytes
  }

  // Deduplicated total (each unique class only once)
  const uniqueClassBytes = Array.from(classBytes.values()).reduce((a, b) => a + b, 0)
  const duplicateSavingsBytes = totalBytes - uniqueClassBytes

  // Per component
  const byComponent: ComponentStat[] = report.componentDefs
    .map((comp) => {
      const bytes = comp.classes.reduce((sum, cls) => sum + estimateClassBytes(cls), 0)
      return {
        name: comp.name,
        file: comp.file,
        classCount: comp.classes.length,
        estimatedBytes: bytes,
        percentage: 0,
      }
    })
    .sort((a, b) => b.estimatedBytes - a.estimatedBytes)

  // Assign percentages
  for (const stat of byComponent) {
    stat.percentage =
      uniqueClassBytes > 0 ? Math.round((stat.estimatedBytes / uniqueClassBytes) * 100) : 0
  }

  // Per file
  const fileMap = new Map<string, { components: number; bytes: number }>()
  for (const stat of byComponent) {
    const f = fileMap.get(stat.file) ?? { components: 0, bytes: 0 }
    f.components++
    f.bytes += stat.estimatedBytes
    fileMap.set(stat.file, f)
  }

  const byFile: FileStat[] = Array.from(fileMap.entries())
    .map(([file, { components, bytes }]) => ({
      file,
      componentCount: components,
      estimatedBytes: bytes,
      percentage: Math.round((bytes / uniqueClassBytes) * 100),
    }))
    .sort((a, b) => b.estimatedBytes - a.estimatedBytes)

  return {
    totalBytes,
    gzipBytes: estimateGzip(uniqueClassBytes),
    uniqueClassBytes,
    duplicateSavingsBytes,
    byComponent,
    byFile,
    report,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Output
// ─────────────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

function barChart(pct: number, width = 24): string {
  const filled = Math.round((pct / 100) * width)
  return "█".repeat(filled) + "░".repeat(width - filled)
}

export function printBundleStats(stats: BundleStats, json = false): void {
  if (json) {
    console.log(JSON.stringify(stats, null, 2))
    return
  }

  const { totalBytes, gzipBytes, uniqueClassBytes, duplicateSavingsBytes, byComponent, byFile } =
    stats
  const bar = "─".repeat(60)

  console.log(`\n┌${bar}┐`)
  console.log(`│  tailwind-styled-v4 — Bundle Stats${" ".repeat(25)}│`)
  console.log(`├${bar}┤`)
  console.log(`│  Total estimated CSS:      ${formatBytes(uniqueClassBytes).padEnd(32)}│`)
  console.log(`│  Gzipped (est.):           ${formatBytes(gzipBytes).padEnd(32)}│`)
  console.log(`│  Without dedup:            ${formatBytes(totalBytes).padEnd(32)}│`)
  console.log(`│  Savings from atomic CSS:  ${formatBytes(duplicateSavingsBytes).padEnd(32)}│`)
  console.log(`└${bar}┘`)

  console.log(`\n  BY COMPONENT (top ${Math.min(byComponent.length, 15)})`)
  console.log(`  ${"─".repeat(58)}`)
  for (const stat of byComponent.slice(0, 15)) {
    const label = `${stat.name} (${stat.classCount} cls)`.padEnd(28)
    const bar_ = barChart(stat.percentage, 16)
    const size = formatBytes(stat.estimatedBytes).padStart(8)
    const pct = `${stat.percentage}%`.padStart(4)
    console.log(`  ${label} ${bar_} ${size} ${pct}`)
  }

  if (byFile.length > 0) {
    console.log(`\n  BY FILE (top ${Math.min(byFile.length, 10)})`)
    console.log(`  ${"─".repeat(58)}`)
    for (const stat of byFile.slice(0, 10)) {
      const fileLabel = stat.file.length > 35 ? `...${stat.file.slice(-32)}` : stat.file
      console.log(`  ${fileLabel.padEnd(40)} ${formatBytes(stat.estimatedBytes).padStart(8)}`)
    }
  }

  console.log("")
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI entry
// ─────────────────────────────────────────────────────────────────────────────

export function runStatsCli(args: string[]): void {
  const jsonFlag = args.includes("--json")
  const dirArg = args.find((a) => !a.startsWith("--")) ?? "."
  const dir = path.resolve(process.cwd(), dirArg)

  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`)
    process.exit(1)
  }

  console.log(`\nComputing bundle stats for ${dir}...`)
  const report = analyzeProject(dir)
  const stats = computeStats(report)
  printBundleStats(stats, jsonFlag)
}
