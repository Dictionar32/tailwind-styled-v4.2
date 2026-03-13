# Core API

## `tw`
Tagged template untuk membuat komponen dengan kelas utilitas.

```ts
import { tw } from "tailwind-styled"

const Button = tw.button`px-4 py-2 bg-blue-600 text-white rounded`
```

## `styled`
Factory API berbasis objek untuk komponen dengan variant.

```ts
import { styled } from "tailwind-styled"

const Card = styled("div", {
  base: "rounded border bg-white",
  variants: {
    tone: {
      neutral: "border-slate-200",
      brand: "border-blue-500",
    },
  },
  defaultVariants: { tone: "neutral" },
})
```
