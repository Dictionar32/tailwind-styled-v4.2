# Core API

## `tw`
Tagged template untuk membuat class utilitas.

```ts
import { tw } from "tailwind-styled-v4"
const Button = tw.button`px-4 py-2 bg-blue-600 text-white rounded`
```

## `styled`
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
```
