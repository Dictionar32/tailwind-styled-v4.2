# Core API

## `tw`
Tagged template untuk membuat komponen dengan kelas utilitas.

```ts
import { tw } from "tailwind-styled-v4"

const Button = tw.button`px-4 py-2 bg-blue-600 text-white rounded`

import { styled } from "tailwind-styled-v4"

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

import { cx } from "tailwind-styled-v4"
const className = cx("p-4", isActive && "bg-blue-500")

import { liveToken, setToken } from "tailwind-styled-v4"
const tokens = liveToken({ brand: "#2563eb" })
setToken("brand", "#0ea5e9")

setToken("primary", "#3b82f6")
setToken("spacing.section", "3rem")

