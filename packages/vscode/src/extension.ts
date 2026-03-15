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

async function analyzeWorkspaceCommand(): Promise<void> {
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
}

async function installPluginCommand(): Promise<void> {
  const pluginName = await vscode.window.showInputBox({
    prompt: "Plugin package name",
    placeHolder: "@tailwind-styled/plugin-animation",
  })

  if (!pluginName) return

  const output = getOutputChannel()
  output.show(true)
  output.appendLine(`[plugin] requested install: ${pluginName}`)
  vscode.window.showInformationMessage(`Tailwind Styled: install request captured for ${pluginName}`)
}

async function createComponentCommand(): Promise<void> {
  const componentName = await vscode.window.showInputBox({
    prompt: "Component name",
    placeHolder: "Button",
    validateInput: (value) => (value.trim().length === 0 ? "Component name is required" : undefined),
  })

  if (!componentName) return

  const editor = vscode.window.activeTextEditor
  if (!editor) {
    vscode.window.showWarningMessage("Tailwind Styled: open a file to insert component snippet.")
    return
  }

  const snippet = new vscode.SnippetString(
    `const ${componentName} = tw.div\`\n  px-4 py-2 rounded-md\n\`\n\nexport default ${componentName}\n`
  )

  await editor.insertSnippet(snippet)
  vscode.window.showInformationMessage(`Tailwind Styled: inserted ${componentName} snippet.`)
}

export function activate(context: vscode.ExtensionContext): void {
  const commands = [
    vscode.commands.registerCommand("tailwindStyled.analyzeWorkspace", analyzeWorkspaceCommand),
    vscode.commands.registerCommand("tailwindStyled.installPlugin", installPluginCommand),
    vscode.commands.registerCommand("tailwindStyled.createComponent", createComponentCommand),
  ]

  for (const command of commands) {
    context.subscriptions.push(command)
  }
  context.subscriptions.push({ dispose: () => outputChannel?.dispose() })
}

export function deactivate(): void {
  outputChannel?.dispose()
  outputChannel = undefined
}
