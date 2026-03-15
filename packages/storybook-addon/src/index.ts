export type VariantMatrix = Record<string, Array<string | number | boolean>>

export function enumerateVariantProps(matrix: VariantMatrix): Array<Record<string, string | number | boolean>> {
  const keys = Object.keys(matrix)
  if (keys.length === 0) return [{}]

  const result: Array<Record<string, string | number | boolean>> = []

  function walk(index: number, current: Record<string, string | number | boolean>) {
    if (index >= keys.length) {
      result.push({ ...current })
      return
    }

    const key = keys[index]
    const values = matrix[key] ?? []

    for (const value of values) {
      current[key] = value
      walk(index + 1, current)
    }
  }

  walk(0, {})
  return result
}
