import { styled } from "tailwind-styled-v4"

export const button = styled({
  base: "rounded-md px-4 py-2 font-medium transition",
  variants: {
    intent: {
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      ghost: "bg-transparent text-blue-700 hover:bg-blue-50",
    },
  },
  defaultVariants: { intent: "primary" },
})
