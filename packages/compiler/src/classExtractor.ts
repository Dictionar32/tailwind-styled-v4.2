/**
 * tailwind-styled-v4 — classExtractor
 *
 * FIX #02: Remove .slice(0, -1) workaround for broken TEMPLATE_RE.
 * TEMPLATE_RE trailing space is now fixed in twDetector.ts.
 *
 * Ekstrak semua Tailwind class dari source untuk safelist generation.
 */

import { parseComponentConfig } from "./astParser"
import { EXTEND_RE, OBJECT_RE, TEMPLATE_RE } from "./twDetector"

const VALID_CLASS_RE = /^[-a-z0-9:/[\]!.()+%]+$/

function parseClasses(raw: string): string[] {
  return raw
    .split(/[\n\s]+/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0 && VALID_CLASS_RE.test(c))
}

export function extractAllClasses(source: string): string[] {
  const classes = new Set<string>()
  const add = (str: string) => {
    for (const c of parseClasses(str)) classes.add(c)
  }

  let m: RegExpExecArray | null

  // FIX #02: Use TEMPLATE_RE directly — no more .slice(0, -1) workaround
  // because trailing space in TEMPLATE_RE is now fixed in twDetector.ts
  const re1 = new RegExp(TEMPLATE_RE.source, "g")
  while ((m = re1.exec(source)) !== null) {
    add(m[3]) // group 3 = content (after adding server. group to TEMPLATE_RE)
  }

  // UPGRADE #4: Use proper AST parser for object configs
  const re2 = new RegExp(OBJECT_RE.source, "g")
  while ((m = re2.exec(source)) !== null) {
    const parsed = parseComponentConfig(m[3])
    if (parsed.base) add(parsed.base)
    for (const vMap of Object.values(parsed.variants)) {
      for (const cls of Object.values(vMap)) add(cls)
    }
    for (const compound of parsed.compounds) {
      if (compound.class) add(compound.class)
    }
  }

  const re3 = new RegExp(EXTEND_RE.source, "g")
  while ((m = re3.exec(source)) !== null) add(m[2])

  // className="..." in JSX
  const classNameRe = /className\s*=\s*["']([^"']+)["']/g
  while ((m = classNameRe.exec(source)) !== null) add(m[1])

  return Array.from(classes).sort()
}

export { parseClasses }
// Re-export for backward compat — now use parseComponentConfig from astParser
export function extractBaseFromObject(objectStr: string): string {
  return parseComponentConfig(objectStr).base
}
export function extractVariantsFromObject(
  objectStr: string
): Record<string, Record<string, string>> {
  return parseComponentConfig(objectStr).variants
}
