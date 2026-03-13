import readline from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"

export interface MigrateWizardOptions {
  dryRun: boolean
  includeConfig: boolean
  includeClasses: boolean
  includeImports: boolean
}

function yes(answer: string): boolean {
  const v = answer.trim().toLowerCase()
  return v === "y" || v === "yes"
}

export async function runMigrationWizard(): Promise<MigrateWizardOptions> {
  const rl = readline.createInterface({ input, output })

  try {
    console.log("\n🚀 Tailwind Styled v4 Migration Wizard")

    const dryRunAnswer = await rl.question("Gunakan dry-run? (Y/n): ")
    const includeConfigAnswer = await rl.question("Migrasi file config dasar? (Y/n): ")
    const includeClassesAnswer = await rl.question("Migrasi class lama (flex-grow/shrink)? (Y/n): ")
    const includeImportsAnswer = await rl.question(
      "Migrasi import tailwind-styled-components -> tailwind-styled-v4? (Y/n): "
    )

    return {
      dryRun: dryRunAnswer.trim() ? yes(dryRunAnswer) : true,
      includeConfig: includeConfigAnswer.trim() ? yes(includeConfigAnswer) : true,
      includeClasses: includeClassesAnswer.trim() ? yes(includeClassesAnswer) : true,
      includeImports: includeImportsAnswer.trim() ? yes(includeImportsAnswer) : true,
    }
  } finally {
    rl.close()
  }
}
