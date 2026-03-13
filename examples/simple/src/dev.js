import { styled } from "tailwind-styled-v4"

const alert = styled({
  base: "rounded border px-3 py-2",
  variants: { intent: { info: "border-blue-400 bg-blue-50", danger: "border-red-400 bg-red-50" } },
  defaultVariants: { intent: "info" },
})

console.log("dev class =>", alert({ intent: "danger" }))
