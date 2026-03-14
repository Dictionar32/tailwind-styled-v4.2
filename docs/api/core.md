# Core API

## `tw`
<<<<<<< ours
Tagged template untuk membuat komponen dengan kelas utilitas.

```ts
import { tw } from "tailwind-styled"

=======
Tagged template untuk membuat class utilitas.

```ts
import { tw } from "tailwind-styled-v4"
>>>>>>> theirs
const Button = tw.button`px-4 py-2 bg-blue-600 text-white rounded`
```

## `styled`
<<<<<<< ours
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
=======
Factory API berbasis objek dengan variants/defaultVariants/compoundVariants.

```ts
import { styled } from "tailwind-styled-v4"
const card = styled({ base: "rounded border p-4", variants: { tone: { brand: "border-blue-500" } } })
```

## `cx`
Utility merge class string kondisional.

```ts
import { cx } from "tailwind-styled-v4"
const className = cx("p-4", isActive && "bg-blue-500")
```

## `liveToken`
Runtime token store untuk update nilai token dinamis.

```ts
import { liveToken, setToken } from "tailwind-styled-v4"
const tokens = liveToken({ brand: "#2563eb" })
setToken("brand", "#0ea5e9")
>>>>>>> theirs
```
