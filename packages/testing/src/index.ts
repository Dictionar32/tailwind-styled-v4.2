export function toHaveClass(className: string) {
  return (value: { classList?: { contains: (name: string) => boolean } }) => {
    const pass = Boolean(value?.classList?.contains(className))
    return {
      pass,
      message: () => `expected element ${pass ? "not " : ""}to contain class '${className}'`,
    }
  }
}

export function snapshotVariants<T>(render: (variant: T) => string, variants: T[]) {
  return variants.map((variant) => ({
    variant,
    output: render(variant),
  }))
}
