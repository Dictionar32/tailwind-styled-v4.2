export interface ParsedClassModifier {
  type: "opacity" | "arbitrary"
  value: string
}

export interface ParsedClass {
  raw: string
  base: string
  variants: string[]
  modifier?: ParsedClassModifier
}

/**
 * Split Tailwind class string while preserving bracket/parenthesis expressions
 * such as: `bg-[url(data:image/svg+xml;...)]` or `bg-(--brand)`.
 */
export function splitClassList(input: string): string[] {
  const out: string[] = []
  let token = ""
  let square = 0
  let round = 0
  let escaped = false

  for (const ch of input) {
    if (escaped) {
      token += ch
      escaped = false
      continue
    }

    if (ch === "\\") {
      token += ch
      escaped = true
      continue
    }

    if (ch === "[") square++
    else if (ch === "]") square = Math.max(0, square - 1)
    else if (ch === "(") round++
    else if (ch === ")") round = Math.max(0, round - 1)

    const isSpace = /\s/.test(ch)
    if (isSpace && square === 0 && round === 0) {
      if (token.trim().length > 0) out.push(token.trim())
      token = ""
      continue
    }

    token += ch
  }

  if (token.trim().length > 0) out.push(token.trim())
  return out
}

/**
 * Parse Tailwind v4-aware class token into variants + base + modifier metadata.
 */
export function parseClassToken(rawToken: string): ParsedClass {
  const parts: string[] = []
  let current = ""
  let square = 0
  let round = 0
  let escaped = false

  for (const ch of rawToken) {
    if (escaped) {
      current += ch
      escaped = false
      continue
    }

    if (ch === "\\") {
      current += ch
      escaped = true
      continue
    }

    if (ch === "[") square++
    else if (ch === "]") square = Math.max(0, square - 1)
    else if (ch === "(") round++
    else if (ch === ")") round = Math.max(0, round - 1)

    if (ch === ":" && square === 0 && round === 0) {
      parts.push(current)
      current = ""
      continue
    }

    current += ch
  }
  parts.push(current)

  const variants = parts.slice(0, -1).filter(Boolean)
  const baseToken = parts[parts.length - 1] ?? ""

  const parsed: ParsedClass = {
    raw: rawToken,
    base: baseToken,
    variants,
  }

  const opacityMatch = baseToken.match(/^(.*)\/(\d{1,3})$/)
  if (opacityMatch && opacityMatch[1].length > 0) {
    parsed.base = opacityMatch[1]
    parsed.modifier = { type: "opacity", value: opacityMatch[2] }
    return parsed
  }

  const arbitraryMatch = baseToken.match(/\((--[a-zA-Z0-9_-]+)\)/)
  if (arbitraryMatch) {
    parsed.modifier = { type: "arbitrary", value: arbitraryMatch[1] }
  }

  return parsed
}

export function parseTailwindClasses(input: string): ParsedClass[] {
  return splitClassList(input).map(parseClassToken)
}
