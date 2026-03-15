import { parseTailwindClasses } from "@tailwind-styled/compiler"

export function buildSample(source) {
  return parseTailwindClasses(source)
}
