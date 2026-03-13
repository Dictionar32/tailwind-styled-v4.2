import { performance } from "node:perf_hooks"

import { parseTailwindClasses } from "../packages/core/dist/index.js"
import { hasNativeBinding, parseClassesNative } from "../native/index.mjs"

const SAMPLE = "dark:hover:bg-blue-500/50 bg-(--brand) px-4 py-2 flex-grow flex-shrink"
const COUNT = 5000

function bench(label, fn) {
  const start = performance.now()
  for (let i = 0; i < COUNT; i++) fn()
  const ms = performance.now() - start
  return { label, ms: Number(ms.toFixed(2)) }
}

const js = bench("js", () => parseTailwindClasses(SAMPLE))

let native = null
if (hasNativeBinding()) {
  native = bench("native", () => parseClassesNative(SAMPLE))
}

console.log(
  JSON.stringify(
    {
      count: COUNT,
      js,
      native,
      speedup: native ? Number((js.ms / native.ms).toFixed(2)) : null,
    },
    null,
    2
  )
)
