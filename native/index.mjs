import fs from "node:fs"
import path from "node:path"

let nativeBinding = null

const candidates = [
  "./tailwind_styled_parser.node",
  "./build/Release/tailwind_styled_parser.node",
]

for (const rel of candidates) {
  const full = path.resolve(path.dirname(new URL(import.meta.url).pathname), rel)
  if (fs.existsSync(full)) {
    nativeBinding = await import(full)
    break
  }
}

export function hasNativeBinding() {
  return nativeBinding !== null
}

export function parseClassesNative(input) {
  if (!nativeBinding || typeof nativeBinding.parse_classes !== "function") {
    throw new Error("Native parser binding is not available")
  }
  return nativeBinding.parse_classes(input)
}
