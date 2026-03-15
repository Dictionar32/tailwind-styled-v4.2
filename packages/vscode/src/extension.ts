import * as path from "node:path"
import * as vscode from "vscode"
import { analyzeWorkspace } from "@tailwind-styled/analyzer"

let outputChannel: vscode.OutputChannel | undefined

function getWorkspaceRoot(): string | null {
  const folder = vscode.workspace.workspaceFolders?.[0]
  return folder?.uri.fsPath ?? null
}

function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("Tailwind Styled")
  }
  return outputChannel
}

function toSummary(report: ReturnType<typeof analyzeWorkspace>): string {
  const topClasses = report.topClasses
    .slice(0, 3)
    .map((item) => `${item.name} (${item.count})`)
    .join(", ")

  return [
    `Files: ${report.totalFiles}`,
    `Unique classes: ${report.uniqueClassCount}`,
    `Occurrences: ${report.totalClassOccurrences}`,
    topClasses.length > 0 ? `Top: ${topClasses}` : "Top: -",
  ].join(" • ")
}

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand("tailwindStyled.analyzeWorkspace", async () => {
    const root = getWorkspaceRoot()
    if (!root) {
      vscode.window.showWarningMessage("Tailwind Styled: open a workspace folder first.")
      return
    }

    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Tailwind Styled: analyzing workspace",
          cancellable: false,
        },
        async () => {
          const report = analyzeWorkspace(root)
          const message = toSummary(report)
          vscode.window.showInformationMessage(message)

          const output = getOutputChannel()
          output.clear()
          output.appendLine(`Workspace: ${path.basename(root)}`)
          output.appendLine(JSON.stringify(report, null, 2))
          output.show(true)
        }
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      vscode.window.showErrorMessage(`Tailwind Styled: analysis failed — ${message}`)
    }
  })

  context.subscriptions.push(disposable)
  context.subscriptions.push({ dispose: () => outputChannel?.dispose() })
}

export function deactivate(): void {
  outputChannel?.dispose()
  outputChannel = undefined
}
