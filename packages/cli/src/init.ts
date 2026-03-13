import fs from "node:fs"
import path from "node:path"

export interface InitReport {
  created: string[]
  skipped: string[]
}

function ensureFile(filePath: string, content: string, report: InitReport): void {
  if (fs.existsSync(filePath)) {
    report.skipped.push(filePath)
    return
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content)
  report.created.push(filePath)
}

export function runInitCli(rawArgs: string[]): void {
  const asJson = rawArgs.includes("--json")
  const target = rawArgs.find((a) => !a.startsWith("-")) ?? "."
  const root = path.resolve(process.cwd(), target)
  const report: InitReport = { created: [], skipped: [] }

  ensureFile(
    path.join(root, "src", "tailwind.css"),
    '@import "tailwindcss";\n\n@theme {\n  --color-primary: #3b82f6;\n  --spacing-section: 3rem;\n}\n',
    report
  )

  ensureFile(
    path.join(root, "tailwind-styled.config.json"),
    JSON.stringify(
      {
        version: 1,
        cssEntry: "src/tailwind.css",
      },
      null,
      2
    ) + "\n",
    report
  )

  if (asJson) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  console.log("\n🚀 Init complete")
  console.log(`Created: ${report.created.length}`)
  for (const f of report.created) console.log(`  + ${path.relative(root, f)}`)
  if (report.skipped.length > 0) {
    console.log(`Skipped: ${report.skipped.length}`)
    for (const f of report.skipped) console.log(`  - ${path.relative(root, f)} (exists)`)
  }
}
