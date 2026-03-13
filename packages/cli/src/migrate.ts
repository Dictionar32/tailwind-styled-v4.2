import fs from "node:fs"
import path from "node:path"

import { runMigrationWizard } from "./migrateWizard"

export interface MigrateReport {
  scannedFiles: number
  updatedFiles: number
  classRenames: number
  importRenames: number
  configWrites: number
  dryRun: boolean
}

function findSourceFiles(dir: string): string[] {
  const out: string[] = []
  const exts = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"])

  function walk(d: string) {
    if (!fs.existsSync(d)) return
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name)
      if (entry.isDirectory()) {
        if (["node_modules", ".git", "dist", ".next", "out", ".turbo"].includes(entry.name)) continue
        walk(full)
      } else if (exts.has(path.extname(entry.name))) {
        out.push(full)
      }
    }
  }

  walk(dir)
  return out
}

function migrateSource(
  source: string,
  opts: { includeImports: boolean; includeClasses: boolean }
): { output: string; classRenames: number; importRenames: number } {
  let next = source
  let classRenames = 0
  let importRenames = 0

  if (opts.includeImports) {
    next = next.replace(/tailwind-styled-components/g, () => {
      importRenames++
      return "tailwind-styled-v4"
    })
  }

  if (opts.includeClasses) {
    next = next.replace(/\bflex-grow\b/g, () => {
      classRenames++
      return "grow"
    })

    next = next.replace(/\bflex-shrink\b/g, () => {
      classRenames++
      return "shrink"
    })
  }

  return { output: next, classRenames, importRenames }
}

function migrateConfig(root: string, dryRun: boolean): number {
  const cssPath = path.join(root, "src", "tailwind.css")
  if (fs.existsSync(cssPath)) return 0
  if (dryRun) return 1

  fs.mkdirSync(path.dirname(cssPath), { recursive: true })
  fs.writeFileSync(
    cssPath,
    '@import "tailwindcss";\n\n@theme {\n  --color-primary: #3b82f6;\n  --spacing-section: 3rem;\n}\n'
  )
  return 1
}

export async function runMigrateCli(rawArgs: string[]): Promise<void> {
  const asJson = rawArgs.includes("--json")
  const target = rawArgs.find((a) => !a.startsWith("-")) ?? "."
  const root = path.resolve(process.cwd(), target)

  let dryRun = rawArgs.includes("--dry-run")
  let includeConfig = true
  let includeClasses = true
  let includeImports = true

  if (rawArgs.includes("--wizard")) {
    const picked = await runMigrationWizard()
    dryRun = picked.dryRun
    includeConfig = picked.includeConfig
    includeClasses = picked.includeClasses
    includeImports = picked.includeImports
  }

  const files = findSourceFiles(root)
  const report: MigrateReport = {
    scannedFiles: files.length,
    updatedFiles: 0,
    classRenames: 0,
    importRenames: 0,
    configWrites: 0,
    dryRun,
  }

  if (includeConfig) {
    report.configWrites += migrateConfig(root, dryRun)
  }

  for (const file of files) {
    const source = fs.readFileSync(file, "utf8")
    const migrated = migrateSource(source, { includeImports, includeClasses })

    if (migrated.output !== source) {
      report.updatedFiles++
      if (!dryRun) fs.writeFileSync(file, migrated.output)
    }

    report.classRenames += migrated.classRenames
    report.importRenames += migrated.importRenames
  }

  if (asJson) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  console.log("\n🔄 Migration report")
  console.log(`Scanned files : ${report.scannedFiles}`)
  console.log(`Updated files : ${report.updatedFiles}${dryRun ? " (dry-run)" : ""}`)
  console.log(`Class renames : ${report.classRenames}`)
  console.log(`Import renames: ${report.importRenames}`)
  console.log(`Config writes : ${report.configWrites}${dryRun ? " (dry-run)" : ""}`)
}
