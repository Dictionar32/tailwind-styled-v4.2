import { test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const pkgDir = path.resolve(__dirname, "..")
const cliPath = path.join(pkgDir, "dist/cli.js")

function runCli(args, env = {}) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: pkgDir,
    encoding: "utf8",
    env: { ...process.env, ...env },
  })
}

test("search returns plugin from registry", () => {
  const run = runCli(["search", "animation"])
  assert.equal(run.status, 0)
  assert.match(run.stdout, /@tailwind-styled\/plugin-animation@1\.0\.0/)
})

test("list returns registry plugin entries", () => {
  const run = runCli(["list"])
  assert.equal(run.status, 0)
  assert.match(run.stdout, /@tailwind-styled\/plugin-forms@1\.0\.0/)
})

test("install --dry-run succeeds for registry plugin", () => {
  const run = runCli(["install", "@tailwind-styled/plugin-animation", "--dry-run"])
  assert.equal(run.status, 0)
  assert.match(run.stdout, /Installed: @tailwind-styled\/plugin-animation/)
})

test("install without plugin name exits non-zero", () => {
  const run = runCli(["install"])
  assert.notEqual(run.status, 0)
  assert.match(run.stderr, /Missing plugin name/)
})

test("unknown command exits non-zero", () => {
  const run = runCli(["unknown-cmd"])
  assert.notEqual(run.status, 0)
  assert.match(run.stderr, /Unknown command: unknown-cmd/)
})

test("plugin not in registry shows actionable message", () => {
  const run = runCli(["install", "left-pad", "--dry-run"])
  assert.notEqual(run.status, 0)
  assert.match(run.stderr, /PLUGIN_NOT_FOUND/)
  assert.match(run.stderr, /tw-plugin search <keyword>/)
})

test("external plugin requires --yes confirmation", () => {
  const run = runCli(["install", "left-pad", "--dry-run", "--allow-external"])
  assert.notEqual(run.status, 0)
  assert.match(run.stderr, /EXTERNAL_CONFIRMATION_REQUIRED/)
})

test("external plugin allowed with --allow-external --yes", () => {
  const run = runCli(["install", "left-pad", "--dry-run", "--allow-external", "--yes"])
  assert.equal(run.status, 0)
  assert.match(run.stdout, /Installed: left-pad/)
})

test("invalid plugin name gets standardized error", () => {
  const run = runCli(["install", "bad;name", "--dry-run"])
  assert.notEqual(run.status, 0)
  assert.match(run.stderr, /INVALID_PLUGIN_NAME/)
})

test("install failure path returns non-zero", () => {
  const run = runCli(["install", "@tailwind-styled/plugin-animation"], {
    TW_PLUGIN_NPM_BIN: "__missing_npm_bin__",
  })
  assert.notEqual(run.status, 0)
  assert.match(run.stderr, /INSTALL_COMMAND_FAILED/)
})
