# Examples

## 1) Parser v4

```ts
import { parseTailwindClasses } from "tailwind-styled-v4"

const parsed = parseTailwindClasses("dark:hover:bg-blue-500/50 bg-(--brand)")
```

## 2) CSS-first Theme Reader

```ts
import { extractThemeFromCSS } from "tailwind-styled-v4"

const theme = extractThemeFromCSS(`
@theme {
  --color-primary: #3b82f6;
  --color-brand: var(--color-primary);
}
`)
```

## 3) Styled Resolver

```ts
import { styled } from "tailwind-styled-v4"

const button = styled({
  base: "px-4 py-2 rounded",
  variants: {
    intent: {
      primary: "bg-blue-500 text-white",
      secondary: "bg-gray-200 text-gray-900",
    },
  },
  defaultVariants: { intent: "primary" },
})
```
