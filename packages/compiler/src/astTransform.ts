/**
 * tailwind-styled-v4 v2 — AST Transform (RSC-Aware)
 *
 * FIXES:
 *  #01 — Double-merge base in variant component className array
 *  #08 — Idempotency guard — skip if already transformed
 *
 * Pipeline:
 *   source code
 *     ↓ idempotency check (new)
 *     ↓ analyze RSC context
 *     ↓ hoist components (if needed)
 *     ↓ detect tw.server.* vs tw.*
 *     ↓ extract + merge classes
 *     ↓ compile variants → lookup table (variant-only, no base dupe)
 *     ↓ generate React.forwardRef component
 *     ↓ auto "use client" if interactive
 *     ↓ strip tw import
 *     ↓ inject transform marker
 */

import { normalizeClasses } from "./classMerger"
import { hoistComponents } from "./componentHoister"
import { analyzeFile, injectClientDirective } from "./rscAnalyzer"
import { hasTwUsage, isAlreadyTransformed, isDynamic, TRANSFORM_MARKER } from "./twDetector"
import { compileVariants, generateVariantCode, parseObjectConfig } from "./variantCompiler"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TransformOptions {
  mode?: "zero-runtime" | "runtime" | "extract-only"
  autoClientBoundary?: boolean
  addDataAttr?: boolean
  hoist?: boolean
  filename?: string
}

export interface TransformResult {
  code: string
  classes: string[]
  rsc?: {
    isServer: boolean
    needsClientDirective: boolean
    clientReasons: string[]
  }
  changed: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Patterns — updated to include server. group
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATE_RE = /\btw\.(server\.)?(\w+)`((?:[^`\\]|\\.)*)`/g
const OBJECT_RE = /\btw\.(server\.)?(\w+)\(\s*(\{[\s\S]*?\})\s*\)/g
const EXTEND_RE = /(\w+)\.extend`((?:[^`\\]|\\.)*)`/g
const WRAP_RE = /\btw\((\w+)\)`((?:[^`\\]|\\.)*)`/g

let _idCounter = 0
function genId(): string {
  return `c${(++_idCounter).toString(36)}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Static component output
// ─────────────────────────────────────────────────────────────────────────────

function renderStaticComponent(
  tag: string,
  classes: string,
  opts: { addDataAttr: boolean; isServer: boolean; compName?: string }
): string {
  const { addDataAttr, compName } = opts
  const fnName = compName ? `_Tw_${compName}` : `_Tw_${tag}`
  const dataAttr = addDataAttr
    ? `, "data-tw": "${fnName}:${classes.split(" ").slice(0, 3).join(" ")}${classes.split(" ").length > 3 ? "..." : ""}"`
    : ""

  return `React.forwardRef(function ${fnName}(props, ref) {
  var _c = props.className;
  var _r = Object.assign({}, props);
  delete _r.className;
  return React.createElement("${tag}", Object.assign({ ref }, _r${dataAttr}, { className: [${JSON.stringify(classes)}, _c].filter(Boolean).join(" ") }));
})`
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant component output
//
// FIX #01: base is injected here in className array.
//          lookup table contains ONLY variant-specific classes (not base).
//          Previously: compileVariants pre-merged base into table → double base.
// ─────────────────────────────────────────────────────────────────────────────

function renderVariantComponent(
  tag: string,
  id: string,
  base: string,
  variantKeys: string[],
  defaults: Record<string, string>,
  opts: { addDataAttr: boolean; isServer: boolean }
): string {
  const { addDataAttr } = opts
  const fnName = `_TwV_${tag}_${id}`
  const dataAttr = addDataAttr ? `, "data-tw": "${fnName}"` : ""

  // Destructure variant props to prevent leaking to DOM
  const vKeys = variantKeys.map((k) => `"${k}"`).join(", ")
  const destructure =
    variantKeys.length > 0
      ? `var _vp = {}; [${vKeys}].forEach(function(k){ _vp[k] = props[k]; delete _rest[k]; });`
      : ""

  // FIX #01: table values are variant-only (no base pre-merged).
  // base is injected separately as first element — correct, no duplication.
  const variantLookup =
    variantKeys.length > 0
      ? variantKeys
          .map(
            (k) =>
              `(__vt_${id}["${k}"] && __vt_${id}["${k}"][_vp["${k}"] ?? ${JSON.stringify(defaults[k] ?? "")}] || "")`
          )
          .join(", ")
      : ""

  // FIX #01: [base, ...variantClasses, className] — base appears exactly once
  const classParts =
    variantKeys.length > 0
      ? `[${JSON.stringify(base)}, ${variantLookup}, _rest.className]`
      : `[${JSON.stringify(base)}, _rest.className]`

  return `React.forwardRef(function ${fnName}(props, ref) {
  var _rest = Object.assign({}, props);
  delete _rest.className;
  ${destructure}
  return React.createElement("${tag}", Object.assign({ ref }, _rest${dataAttr}, { className: ${classParts}.filter(Boolean).join(" ") }));
})`
}

// ─────────────────────────────────────────────────────────────────────────────
// Main transform — RSC-Aware pipeline
// ─────────────────────────────────────────────────────────────────────────────

export function transformSource(source: string, opts: TransformOptions = {}): TransformResult {
  const {
    mode = "zero-runtime",
    autoClientBoundary = true,
    addDataAttr = false,
    hoist = true,
    filename = "",
  } = opts

  // ── Fast exits ────────────────────────────────────────────────────────
  if (!hasTwUsage(source)) {
    return { code: source, classes: [], changed: false }
  }

  // FIX #08: Idempotency guard — do not transform already-transformed code
  if (isAlreadyTransformed(source)) {
    return { code: source, classes: [], changed: false }
  }

  if (mode === "runtime" || mode === "extract-only") {
    return { code: source, classes: [], changed: false }
  }

  // ── STEP 1: RSC Analysis ───────────────────────────────────────────────
  const rscAnalysis = analyzeFile(source, filename)

  // ── STEP 2: Component Hoisting ─────────────────────────────────────────
  let code = source
  if (hoist) {
    const hoistResult = hoistComponents(source)
    if (hoistResult.hoisted.length > 0) {
      code = hoistResult.code
      if (process.env.NODE_ENV !== "production") {
        for (const w of hoistResult.warnings) {
          console.warn(w)
        }
      }
    }
  }

  let changed = false
  const allClasses: string[] = []
  const prelude: string[] = []
  let needsReact = false

  // ── STEP 3a: tw.tag`classes` → static forwardRef ───────────────────────
  code = code.replace(
    TEMPLATE_RE,
    (match, serverMark: string | undefined, tag: string, content: string) => {
      if (isDynamic(content)) return match

      const classes = normalizeClasses(content)
      if (!classes) return match

      const isServerOnly = !!serverMark
      allClasses.push(...classes.split(/\s+/).filter(Boolean))
      changed = true
      needsReact = true

      const rendered = renderStaticComponent(tag, classes, {
        addDataAttr,
        isServer: rscAnalysis.isServer || isServerOnly,
      })

      return isServerOnly ? `/* @server-only */ ${rendered}` : rendered
    }
  )

  // ── STEP 3b: tw.tag({...}) → lookup table + variant forwardRef ─────────
  code = code.replace(
    OBJECT_RE,
    (match, serverMark: string | undefined, tag: string, objectStr: string) => {
      const { base, variants, compounds, defaults } = parseObjectConfig(objectStr)
      if (!base && Object.keys(variants).length === 0) return match

      const isServerOnly = !!serverMark

      allClasses.push(...base.split(/\s+/).filter(Boolean))
      for (const vMap of Object.values(variants)) {
        for (const cls of Object.values(vMap)) {
          allClasses.push(...cls.split(/\s+/).filter(Boolean))
        }
      }

      changed = true
      needsReact = true

      const id = genId()
      // FIX #01: compileVariants no longer merges base into table
      const compiled = compileVariants(base, variants, compounds, defaults)
      prelude.push(generateVariantCode(id, compiled))

      const variantKeys = Object.keys(variants)
      const rendered = renderVariantComponent(tag, id, base, variantKeys, defaults, {
        addDataAttr,
        isServer: rscAnalysis.isServer || isServerOnly,
      })

      return isServerOnly ? `/* @server-only */ ${rendered}` : rendered
    }
  )

  // ── STEP 3c: tw(Component)`classes` ─────────────────────────────────────
  code = code.replace(WRAP_RE, (match, compName: string, content: string) => {
    if (isDynamic(content)) return match

    const classes = normalizeClasses(content)
    if (!classes) return match

    allClasses.push(...classes.split(/\s+/).filter(Boolean))
    changed = true
    needsReact = true

    return `React.forwardRef(function _TwWrap_${compName}(props, ref) {
  var _c = [${JSON.stringify(classes)}, props.className].filter(Boolean).join(" ");
  return React.createElement(${compName}, Object.assign({}, props, { ref, className: _c }));
})`
  })

  // ── STEP 3d: Component.extend`classes` ──────────────────────────────────
  code = code.replace(EXTEND_RE, (match, compName: string, content: string) => {
    if (isDynamic(content)) return match

    const extra = normalizeClasses(content)
    if (!extra) return match

    allClasses.push(...extra.split(/\s+/).filter(Boolean))
    changed = true
    needsReact = true

    return `React.forwardRef(function _TwExt_${compName}(props, ref) {
  var _c = [${JSON.stringify(extra)}, props.className].filter(Boolean).join(" ");
  return React.createElement(${compName}, Object.assign({}, props, { ref, className: _c }));
})`
  })

  if (!changed) {
    return { code: source, classes: [], rsc: rscAnalysis, changed: false }
  }

  // ── STEP 4: Inject variant lookup tables (prelude) ─────────────────────
  if (prelude.length > 0) {
    const importEnd = findAfterImports(code)
    code = `${code.slice(0, importEnd)}\n${prelude.join("\n")}\n${code.slice(importEnd)}`
  }

  // ── STEP 5: Ensure React import ─────────────────────────────────────────
  if (needsReact && !hasReactImport(source)) {
    code = `import React from "react";\n${code}`
  }

  // ── STEP 6: RSC auto client boundary ────────────────────────────────────
  if (autoClientBoundary && rscAnalysis.needsClientDirective) {
    code = injectClientDirective(code)
  }

  // ── STEP 7: Strip tw import when fully transformed ──────────────────────
  const stillUsesTw = /\btw\.(server\.)?\w+[`(]/.test(code) || /\btw\(\w+\)/.test(code)
  if (!stillUsesTw) {
    code = code.replace(
      /import\s*\{[^}]*\btw\b[^}]*\}\s*from\s*["']tailwind-styled-v4["'];?\n?/g,
      ""
    )
  }

  // ── STEP 8: Inject transform marker (FIX #08 — idempotency) ─────────────
  code = `${TRANSFORM_MARKER}\n${code}`

  return {
    code,
    classes: Array.from(new Set(allClasses)),
    rsc: {
      isServer: rscAnalysis.isServer,
      needsClientDirective: rscAnalysis.needsClientDirective,
      clientReasons: rscAnalysis.clientReasons,
    },
    changed: true,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function hasReactImport(source: string): boolean {
  return (
    source.includes("import React") ||
    source.includes("from 'react'") ||
    source.includes('from "react"')
  )
}

function findAfterImports(source: string): number {
  const lines = source.split("\n")
  let lastImportIdx = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (
      line.startsWith("import ") ||
      line.startsWith('"use client"') ||
      line.startsWith("'use client'") ||
      line.startsWith(TRANSFORM_MARKER) ||
      line === ""
    ) {
      lastImportIdx = i
    } else if (line && !line.startsWith("//") && !line.startsWith("/*")) {
      break
    }
  }

  return lines.slice(0, lastImportIdx + 1).join("\n").length + 1
}

export { hasTwUsage as shouldProcess }
