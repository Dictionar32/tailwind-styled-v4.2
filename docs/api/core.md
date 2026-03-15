# Core API

Dokumen ini menjelaskan API inti dari `tailwind-styled-v4`.

## `tw`
`tw` adalah tagged-template helper untuk membuat komponen berbasis utility classes.

```ts
import { tw } from "tailwind-styled-v4"

const Button = tw.button`px-4 py-2 rounded bg-blue-600 text-white`
```

## `styled`
`styled` dipakai untuk konfigurasi komponen berbasis object (`base`, `variants`, `defaultVariants`, dll).

```ts
import { styled } from "tailwind-styled-v4"

const Card = styled("div", {
  base: "rounded border bg-white p-4",
  variants: {
    tone: {
      neutral: "border-slate-200",
      brand: "border-blue-500",
    },
  },
  defaultVariants: { tone: "neutral" },
})
```

## `cx`
`cx` menggabungkan class name secara kondisional.

```ts
import { cx } from "tailwind-styled-v4"

const className = cx("p-4", isActive && "bg-blue-500")
```

## `liveToken`
`liveToken` dan `setToken` membantu mengelola token runtime secara terpusat.

```ts
import { liveToken, setToken } from "tailwind-styled-v4"

const tokens = liveToken({ brand: "#2563eb" })
setToken("brand", "#0ea5e9")
setToken("primary", "#3b82f6")
setToken("spacing.section", "3rem")
```

> Gunakan API ini saat membutuhkan theming dinamis tanpa meninggalkan utility-first workflow.
