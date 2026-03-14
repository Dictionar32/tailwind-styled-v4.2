import { styled } from "tailwind-styled-v4"

const card = styled({
  base: "rounded-lg border p-4",
  variants: { tone: { brand: "border-blue-500 bg-blue-50", neutral: "border-slate-300 bg-white" } },
  defaultVariants: { tone: "brand" },
})

export function Card({ tone = "brand", title }: { tone?: "brand" | "neutral"; title: string }) {
  return <article className={card({ tone })}>{title}</article>
}
