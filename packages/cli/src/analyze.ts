#!/usr/bin/env node
/**
 * tailwind-styled-v4 — CSS Analyzer
 *
 * npx tailwind-styled analyze [dir]
 *
 * Scans a project for tw() component definitions and reports:
 *   - Duplicate class patterns (candidates for shared components)
 *   - Unused variants (variants defined but never passed)
 *   - Most-used class groups
 *   - Component count and class density
 */

import fs from "node:fs"
import path from "node:path"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ComponentDef {
  name: string
  file: string
  base: string
  variants: Record<string, string[]>
  classes: string[]
}

interface DuplicatePattern {
  pattern: string
  components: Array<{ name: string; file: string }>
  count: number
}

interface UnusedVariant {
  component: string
  file: string
  variantKey: string
  variantValue: string
}

export interface AnalysisReport {
  totalComponents: number
  totalUniqueClasses: number
  totalClassOccurrences: number
  duplicatePatterns: DuplicatePattern[]
  unusedVariants: UnusedVariant[]
  topClasses: Array<{ class: string; count: number }>
  componentDefs: ComponentDef[]
  scannedFiles: number
}

// ─────────────────────────────────────────────────────────────────────────────
// File scanner
// ─────────────────────────────────────────────────────────────────────────────

function findSourceFiles(dir: string): string[] {
  const files: string[] = []
  const exts = new Set([".ts", ".tsx", ".js", ".jsx"])

  function walk(d: string) {
    if (!fs.existsSync(d)) return
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!["node_modules", ".next", "dist", ".git", "out", ".turbo"].includes(entry.name)) {
          walk(path.join(d, entry.name))
        }
      } else if (exts.has(path.extname(entry.name))) {
        files.push(path.join(d, entry.name))
      }
    }
  }

  walk(dir)
  return files
}

// ─────────────────────────────────────────────────────────────────────────────
// Parser — extract tw component definitions from source
// ─────────────────────────────────────────────────────────────────────────────

/** Extract classes from template literal: tw.div`p-4 bg-white` */
function extractTemplateLiteral(source: string): Array<{ name: string; classes: string[] }> {
  const results: Array<{ name: string; classes: string[] }> = []

  // Pattern: const Name = tw.tag`classes`
  const tplRe = /(?:const|let)\s+(\w+)\s*=\s*tw(?:\.\w+)?\.\w+`([^`]*)`/g
  let m: RegExpExecArray | null
  while ((m = tplRe.exec(source)) !== null) {
    const name = m[1]
    const raw = m[2].trim().replace(/\s+/g, " ")
    results.push({ name, classes: raw.split(/\s+/).filter(Boolean) })
  }

  return results
}

/** Extract from object config: tw.button({ base: "...", variants: {...} }) */
function extractObjectConfig(source: string): ComponentDef[] {
  const results: ComponentDef[] = []

  // Pattern: const Name = tw.tag({ ... })
  const objRe = /(?:const|let)\s+(\w+)\s*=\s*tw(?:\.\w+)?\.\w+\(\{([\s\S]*?)\}\)/g
  let m: RegExpExecArray | null
  while ((m = objRe.exec(source)) !== null) {
    const name = m[1]
    const body = m[2]

    // Extract base
    const baseMatch = body.match(/base\s*:\s*["'`]([^"'`]*)["'`]/)
    const base = baseMatch?.[1]?.trim().replace(/\s+/g, " ") ?? ""
    const classes = base.split(/\s+/).filter(Boolean)

    // Extract variants
    const variants: Record<string, string[]> = {}
    const variantMatch = body.match(/variants\s*:\s*\{([\s\S]*?)\}(?=\s*,|\s*\})/)
    if (variantMatch) {
      const variantBody = variantMatch[1]
      // Extract each variant key
      const keyRe = /(\w+)\s*:\s*\{([^}]*)\}/g
      let km: RegExpExecArray | null
      while ((km = keyRe.exec(variantBody)) !== null) {
        const key = km[1]
        const values = [...km[2].matchAll(/(\w+)\s*:\s*["'`]([^"'`]*)["'`]/g)].map((v) => v[1])
        variants[key] = values
      }
    }

    results.push({ name, file: "", base, variants, classes })
  }

  return results
}

/** Extract variant usages: <Component size="lg" /> */
function extractVariantUsages(source: string): Map<string, Set<string>> {
  const usages = new Map<string, Set<string>>()

  // Pattern: <ComponentName propKey="value"
  const jsxRe = /<([A-Z]\w*)\s([^>]*)/g
  let m: RegExpExecArray | null
  while ((m = jsxRe.exec(source)) !== null) {
    const compName = m[1]
    const propsStr = m[2]
    if (!usages.has(compName)) usages.set(compName, new Set())

    // Extract prop keys
    const propRe = /(\w+)=/g
    let pm: RegExpExecArray | null
    while ((pm = propRe.exec(propsStr)) !== null) {
      usages.get(compName)!.add(pm[1])
    }
  }

  return usages
}

// ─────────────────────────────────────────────────────────────────────────────
// Analysis
// ─────────────────────────────────────────────────────────────────────────────

function findDuplicates(components: ComponentDef[]): DuplicatePattern[] {
  // Build n-gram patterns (3+ classes)
  const patternMap = new Map<string, Array<{ name: string; file: string }>>()

  for (const comp of components) {
    if (comp.classes.length < 3) continue

    // All consecutive 3-class windows
    for (let i = 0; i <= comp.classes.length - 3; i++) {
      const pattern = comp.classes.slice(i, i + 3).join(" ")
      if (!patternMap.has(pattern)) patternMap.set(pattern, [])
      patternMap.get(pattern)!.push({ name: comp.name, file: comp.file })
    }

    // Also check the full base string
    if (comp.classes.length >= 4) {
      const full = comp.base
      if (!patternMap.has(full)) patternMap.set(full, [])
      patternMap.get(full)!.push({ name: comp.name, file: comp.file })
    }
  }

  return Array.from(patternMap.entries())
    .filter(([, comps]) => {
      // Only if from 2+ different components
      const names = new Set(comps.map((c) => c.name))
      return names.size >= 2
    })
    .map(([pattern, comps]) => {
      const seen = new Set<string>()
      const unique = comps.filter((c) => {
        if (seen.has(c.name)) return false
        seen.add(c.name)
        return true
      })
      return { pattern, components: unique, count: unique.length }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
}

function findUnusedVariants(
  components: ComponentDef[],
  allUsages: Map<string, Set<string>>
): UnusedVariant[] {
  const unused: UnusedVariant[] = []

  for (const comp of components) {
    const usedProps = allUsages.get(comp.name) ?? new Set()
    for (const [variantKey, values] of Object.entries(comp.variants)) {
      if (!usedProps.has(variantKey)) {
        // Entire variant key never used
        for (const val of values) {
          unused.push({
            component: comp.name,
            file: comp.file,
            variantKey,
            variantValue: val,
          })
        }
      }
    }
  }

  return unused.slice(0, 30)
}

function countClasses(components: ComponentDef[]): Array<{ class: string; count: number }> {
  const counts = new Map<string, number>()
  for (const comp of components) {
    for (const cls of comp.classes) {
      counts.set(cls, (counts.get(cls) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([cls, count]) => ({ class: cls, count }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Main analysis function
// ─────────────────────────────────────────────────────────────────────────────

export function analyzeProject(dir: string): AnalysisReport {
  const files = findSourceFiles(dir)
  const allComponents: ComponentDef[] = []
  const allUsages = new Map<string, Set<string>>()

  for (const file of files) {
    let source: string
    try {
      source = fs.readFileSync(file, "utf-8")
    } catch {
      continue
    }

    const relFile = path.relative(dir, file)

    // Template literals
    for (const { name, classes } of extractTemplateLiteral(source)) {
      allComponents.push({ name, file: relFile, base: classes.join(" "), variants: {}, classes })
    }

    // Object configs
    for (const def of extractObjectConfig(source)) {
      allComponents.push({ ...def, file: relFile })
    }

    // Usages
    const usages = extractVariantUsages(source)
    for (const [name, props] of usages) {
      if (!allUsages.has(name)) allUsages.set(name, new Set())
      for (const p of props) allUsages.get(name)!.add(p)
    }
  }

  // Deduplicate components (same name + file)
  const seen = new Set<string>()
  const unique = allComponents.filter((c) => {
    const key = `${c.file}:${c.name}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const allClasses = unique.flatMap((c) => c.classes)
  const uniqueClasses = new Set(allClasses)

  return {
    totalComponents: unique.length,
    totalUniqueClasses: uniqueClasses.size,
    totalClassOccurrences: allClasses.length,
    duplicatePatterns: findDuplicates(unique),
    unusedVariants: findUnusedVariants(unique, allUsages),
    topClasses: countClasses(unique),
    componentDefs: unique,
    scannedFiles: files.length,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI output
// ─────────────────────────────────────────────────────────────────────────────

export function printAnalysisReport(report: AnalysisReport, json = false): void {
  if (json) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  const {
    totalComponents,
    totalUniqueClasses,
    duplicatePatterns,
    unusedVariants,
    topClasses,
    scannedFiles,
  } = report

  const bar = "─".repeat(55)
  console.log(`\n┌${bar}┐`)
  console.log(`│  tailwind-styled-v4 — CSS Analyzer${" ".repeat(20)}│`)
  console.log(`├${bar}┤`)
  console.log(`│  Files scanned:     ${String(scannedFiles).padEnd(34)}│`)
  console.log(`│  Components found:  ${String(totalComponents).padEnd(34)}│`)
  console.log(`│  Unique classes:    ${String(totalUniqueClasses).padEnd(34)}│`)
  console.log(`│  Duplicate patterns:${String(duplicatePatterns.length).padEnd(34)}│`)
  console.log(`│  Unused variants:   ${String(unusedVariants.length).padEnd(34)}│`)
  console.log(`└${bar}┘`)

  if (duplicatePatterns.length > 0) {
    console.log(`\n  DUPLICATE PATTERNS (top ${Math.min(duplicatePatterns.length, 10)})`)
    console.log(`  ${"─".repeat(52)}`)
    for (const dup of duplicatePatterns.slice(0, 10)) {
      const names = dup.components.map((c) => c.name).join(", ")
      console.log(`\n  "${dup.pattern}"`)
      console.log(`  → Used in ${dup.count} components: ${names}`)
    }
  }

  if (unusedVariants.length > 0) {
    console.log(`\n  UNUSED VARIANTS`)
    console.log(`  ${"─".repeat(52)}`)
    for (const u of unusedVariants.slice(0, 10)) {
      console.log(`  ${u.component}.${u.variantKey}="${u.variantValue}" — never used  (${u.file})`)
    }
  }

  if (topClasses.length > 0) {
    console.log(`\n  MOST USED CLASSES`)
    console.log(`  ${"─".repeat(52)}`)
    for (const { class: cls, count } of topClasses.slice(0, 10)) {
      const bar_ = "█".repeat(Math.min(count * 2, 20))
      console.log(`  ${cls.padEnd(30)} ${bar_} ${count}`)
    }
  }

  console.log("")
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI entry
// ─────────────────────────────────────────────────────────────────────────────

export function runAnalyzeCli(args: string[]): void {
  const jsonFlag = args.includes("--json")
  const dirArg = args.find((a) => !a.startsWith("--")) ?? "."
  const dir = path.resolve(process.cwd(), dirArg)

  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`)
    process.exit(1)
  }

  console.log(`\nAnalyzing ${dir}...`)
  const report = analyzeProject(dir)
  printAnalysisReport(report, jsonFlag)
}
