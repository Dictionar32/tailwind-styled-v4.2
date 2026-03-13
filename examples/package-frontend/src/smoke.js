import { styled } from "tailwind-styled-v4"

const button = styled({
  base: "rounded-md px-4 py-2",
  variants: { intent: { primary: "bg-blue-600 text-white", ghost: "bg-transparent text-blue-700" } },
  defaultVariants: { intent: "primary" },
})

console.log(button({ intent: "ghost" }))
