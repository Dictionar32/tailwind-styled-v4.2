import { useMemo, useState } from "react"
import { liveToken, setToken, styled } from "tailwind-styled-v4"

const card = styled({
  base: "rounded-xl border p-5 transition",
  variants: {
    tone: {
      light: "bg-white text-slate-900 border-slate-200",
      dark: "bg-slate-900 text-slate-100 border-slate-700",
    },
  },
  defaultVariants: { tone: "light" },
})

export function App() {
  const [dark, setDark] = useState(false)
  const tokens = useMemo(() => liveToken({ brand: dark ? "#0ea5e9" : "#2563eb" }), [dark])

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <section className={card({ tone: dark ? "dark" : "light" })}>
        <h1 className="mb-2 text-xl font-semibold">Frontend package demo (Vite)</h1>
        <p className="mb-4 text-sm opacity-80">{tokens.brand}</p>
        <button
          className="rounded px-3 py-2 text-white"
          style={{ background: tokens.brand }}
          onClick={() => {
            const next = !dark
            setDark(next)
            setToken("brand", next ? "#0ea5e9" : "#2563eb")
          }}
        >
          Toggle Theme Token
        </button>
      </section>
    </main>
  )
}
