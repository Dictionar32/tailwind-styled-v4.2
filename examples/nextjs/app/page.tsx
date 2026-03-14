import { Card } from "../components/card"

export default function Page() {
  return (
    <main className="mx-auto max-w-xl space-y-4 p-8">
      <h1 className="text-2xl font-bold">Next.js frontend example</h1>
      <Card title="Brand card" />
      <Card tone="neutral" title="Neutral card" />
    </main>
  )
}
