#!/usr/bin/env node
/**
 * tailwind-styled-v4 — Style Extractor
 *
 * npx tailwind-styled extract [dir]
 *
 * Detects repeated style patterns across components and
 * generates extraction suggestions with ready-to-use code.
 *
 * Example output:
 *
 *   PATTERN: "flex items-center gap-2"
 *   Found in: Header, Nav, Card (3 components)
 *   → Extract to:
 *
 *   export const HStack = tw.div`flex items-center gap-2`
 */

import fs from "node:fs"
import path from "node:path"
import type { ComponentDef } from "./analyze"
import { analyzeProject } from "./analyze"

// ─────────────────────────────────────────────────────────────────────────────
// Pattern detection
// ─────────────────────────────────────────────────────────────────────────────

interface PatternOccurrence {
  component: string
  file: string
  fullBase: string
}

interface ExtractCandidate {
  pattern: string
  occurrences: PatternOccurrence[]
  suggestedName: string
  suggestedTag: string
  suggestedCode: string
  savings: number // number of characters saved
}

/** Semantic name guesser based on classes */
function guessComponentName(classes: string[]): { name: string; tag: string } {
  const cls = classes.join(" ")

  // Layout patterns
  if (cls.includes("flex") && cls.includes("items-center") && cls.includes("gap")) {
    return { name: "HStack", tag: "div" }
  }
  if (cls.includes("flex") && cls.includes("flex-col") && cls.includes("gap")) {
    return { name: "VStack", tag: "div" }
  }
  if (cls.includes("grid") && cls.includes("gap")) {
    return { name: "Grid", tag: "div" }
  }
  if (cls.includes("container") || (cls.includes("max-w") && cls.includes("mx-auto"))) {
    return { name: "Container", tag: "div" }
  }

  // Typography
  if (cls.includes("text-") && cls.includes("font-bold")) {
    return { name: "Heading", tag: "h2" }
  }
  if (cls.includes("text-") && cls.includes("leading-")) {
    return { name: "Text", tag: "p" }
  }
  if (cls.includes("uppercase") || cls.includes("tracking-")) {
    return { name: "Label", tag: "span" }
  }

  // Buttons / interactive
  if (cls.includes("cursor-pointer") || cls.includes("hover:")) {
    if (cls.includes("px-") && cls.includes("py-")) {
      return { name: "Button", tag: "button" }
    }
    return { name: "Clickable", tag: "div" }
  }

  // Cards / surfaces
  if (cls.includes("rounded") && cls.includes("shadow")) {
    return { name: "Card", tag: "div" }
  }
  if (cls.includes("border") && cls.includes("rounded")) {
    return { name: "Box", tag: "div" }
  }

  // Padding only → Box
  if (cls.includes("p-") && classes.length <= 4) {
    return { name: "Box", tag: "div" }
  }

  return { name: "Shared", tag: "div" }
}

/** Build n-grams from a class array */
function buildNgrams(classes: string[], minN = 3, maxN = 6): string[] {
  const ngrams: string[] = []
  for (let n = minN; n <= Math.min(maxN, classes.length); n++) {
    for (let i = 0; i <= classes.length - n; i++) {
      ngrams.push(classes.slice(i, i + n).join(" "))
    }
  }
  return ngrams
}

export interface ExtractionReport {
  candidates: ExtractCandidate[]
  totalPatternsFound: number
  potentialSavingsChars: number
}

export function findExtractionCandidates(components: ComponentDef[]): ExtractionReport {
  // Build pattern → occurrences map
  const patternMap = new Map<string, PatternOccurrence[]>()

  for (const comp of components) {
    if (comp.classes.length < 3) continue

    const ngrams = buildNgrams(comp.classes)
    for (const ngram of ngrams) {
      const key = ngram
      if (!patternMap.has(key)) patternMap.set(key, [])
      patternMap.get(key)!.push({
        component: comp.name,
        file: comp.file,
        fullBase: comp.base,
      })
    }
  }

  // Filter: must appear in 2+ distinct components
  const candidates: ExtractCandidate[] = []

  for (const [pattern, occurrences] of patternMap) {
    const uniqueComponents = new Set(occurrences.map((o) => o.component))
    if (uniqueComponents.size < 2) continue

    const unique = [...new Set(occurrences.map((o) => o.component))].map(
      (name) => occurrences.find((o) => o.component === name)!
    )

    const classes = pattern.split(/\s+/)
    const { name, tag } = guessComponentName(classes)

    // Generate suggested code
    const varName =
      name +
      (candidates.filter((c) => c.suggestedName === name).length > 0
        ? candidates.filter((c) => c.suggestedName === name).length + 1
        : "")

    const suggestedCode = `export const ${varName} = tw.${tag}\`${pattern}\``
    const savings = (pattern.length + 10) * (unique.length - 1)

    candidates.push({
      pattern,
      occurrences: unique,
      suggestedName: varName,
      suggestedTag: tag,
      suggestedCode,
      savings,
    })
  }

  // Sort by savings (most impactful first) and deduplicate subsets
  candidates.sort((a, b) => {
    // Prefer longer patterns (more specific)
    const lenDiff = b.pattern.split(" ").length - a.pattern.split(" ").length
    if (lenDiff !== 0) return lenDiff
    return b.occurrences.length - a.occurrences.length
  })

  // Remove candidates whose pattern is a subset of a higher-ranked one
  const finalCandidates: ExtractCandidate[] = []
  const usedPatterns = new Set<string>()

  for (const c of candidates) {
    let isSubset = false
    for (const used of usedPatterns) {
      if (used.includes(c.pattern)) {
        isSubset = true
        break
      }
    }
    if (!isSubset) {
      finalCandidates.push(c)
      usedPatterns.add(c.pattern)
    }
    if (finalCandidates.length >= 15) break
  }

  return {
    candidates: finalCandidates,
    totalPatternsFound: candidates.length,
    potentialSavingsChars: candidates.reduce((sum, c) => sum + c.savings, 0),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Output
// ─────────────────────────────────────────────────────────────────────────────

export function printExtractionReport(report: ExtractionReport, json = false): void {
  if (json) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  const { candidates, totalPatternsFound } = report
  const bar = "─".repeat(58)

  console.log(`\n┌${bar}┐`)
  console.log(`│  tailwind-styled-v4 — Style Extractor${" ".repeat(20)}│`)
  console.log(`├${bar}┤`)
  console.log(`│  Patterns analyzed: ${String(totalPatternsFound).padEnd(38)}│`)
  console.log(`│  Extraction candidates: ${String(candidates.length).padEnd(34)}│`)
  console.log(`└${bar}┘`)

  if (candidates.length === 0) {
    console.log("\n  ✓ No repeated patterns found. Codebase is well-organized.\n")
    return
  }

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]
    const names = c.occurrences.map((o) => o.component).join(", ")
    const files = [...new Set(c.occurrences.map((o) => o.file))].join(", ")

    console.log(`\n  [${i + 1}] "${c.pattern}"`)
    console.log(`      Found in ${c.occurrences.length} components: ${names}`)
    console.log(`      Files: ${files}`)
    console.log(`\n      → Suggested extraction:`)
    console.log(`\n        ${c.suggestedCode}\n`)
  }

  // Generate a complete shared file suggestion
  if (candidates.length > 0) {
    console.log(`  ${"─".repeat(58)}`)
    console.log(`  → Create src/components/shared.tsx:\n`)
    console.log(`  import { tw } from "tailwind-styled-v4"\n`)
    for (const c of candidates.slice(0, 8)) {
      console.log(`  ${c.suggestedCode}`)
    }
    console.log("")
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Write output to file
// ─────────────────────────────────────────────────────────────────────────────

export function writeExtractionFile(report: ExtractionReport, outFile: string): void {
  const lines: string[] = [
    `// Auto-generated by tailwind-styled extract`,
    `// Shared components extracted from repeated patterns`,
    ``,
    `import { tw } from "tailwind-styled-v4"`,
    ``,
  ]

  for (const c of report.candidates.slice(0, 10)) {
    lines.push(`// From: ${c.occurrences.map((o) => o.component).join(", ")}`)
    lines.push(c.suggestedCode)
    lines.push("")
  }

  fs.writeFileSync(outFile, lines.join("\n"), "utf-8")
  console.log(`\n  Extraction written to: ${outFile}\n`)
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI entry
// ─────────────────────────────────────────────────────────────────────────────

export function runExtractCli(args: string[]): void {
  const jsonFlag = args.includes("--json")
  const writeFlag = args.includes("--write")
  const dirArg = args.find((a) => !a.startsWith("--")) ?? "."
  const dir = path.resolve(process.cwd(), dirArg)

  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`)
    process.exit(1)
  }

  console.log(`\nScanning ${dir} for repeated patterns...`)
  const analysisReport = analyzeProject(dir)
  const report = findExtractionCandidates(analysisReport.componentDefs)
  printExtractionReport(report, jsonFlag)

  if (writeFlag && !jsonFlag) {
    const outFile = path.join(dir, "shared-components.extracted.tsx")
    writeExtractionFile(report, outFile)
  }
}
