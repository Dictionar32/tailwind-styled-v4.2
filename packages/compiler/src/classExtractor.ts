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
const TEMPLATE_SCAN_RE = new RegExp(TEMPLATE_RE.source, "g")
const OBJECT_SCAN_RE = new RegExp(OBJECT_RE.source, "g")
const EXTEND_SCAN_RE = new RegExp(EXTEND_RE.source, "g")
const CLASS_NAME_RE = /className\s*=\s*["']([^"']+)["']/g

function resetRegex(regex: RegExp): void {
  regex.lastIndex = 0
}

function parseClasses(raw: string): string[] {
  const parsed: string[] = []

  for (const token of raw.split(/[\n\s]+/)) {
    if (!token) continue
    const normalized = token.trim()
    if (!normalized || !VALID_CLASS_RE.test(normalized)) continue
    parsed.push(normalized)
  }

  return parsed
}

export function extractAllClasses(source: string): string[] {
  const classes = new Set<string>()
  const add = (str: string) => {
    for (const c of parseClasses(str)) classes.add(c)
  }

  let m: RegExpExecArray | null

  // FIX #02: Use TEMPLATE_RE directly — no more .slice(0, -1) workaround
  // because trailing space in TEMPLATE_RE is now fixed in twDetector.ts
  resetRegex(TEMPLATE_SCAN_RE)
  while ((m = TEMPLATE_SCAN_RE.exec(source)) !== null) {
    add(m[3]) // group 3 = content (after adding server. group to TEMPLATE_RE)
  }

  // UPGRADE #4: Use proper AST parser for object configs
  resetRegex(OBJECT_SCAN_RE)
  while ((m = OBJECT_SCAN_RE.exec(source)) !== null) {
    const parsed = parseComponentConfig(m[3])
    if (parsed.base) add(parsed.base)
    for (const vMap of Object.values(parsed.variants)) {
      for (const cls of Object.values(vMap)) add(cls)
    }
    for (const compound of parsed.compounds) {
      if (compound.class) add(compound.class)
    }
  }

  resetRegex(EXTEND_SCAN_RE)
  while ((m = EXTEND_SCAN_RE.exec(source)) !== null) add(m[2])

  // className="..." in JSX
  resetRegex(CLASS_NAME_RE)
  while ((m = CLASS_NAME_RE.exec(source)) !== null) add(m[1])

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
