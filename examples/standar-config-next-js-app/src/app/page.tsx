import { ThemeAndCartControls } from "@/components/theme-and-cart-controls";

const products = [
  { name: "Basic Tee", price: "$24", badge: "Best Seller" },
  { name: "Street Jacket", price: "$89", badge: "New" },
  { name: "Canvas Bag", price: "$35", badge: "Eco" },
];

export default function Home() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-6 py-8 md:px-10">
      <header className="rounded-2xl border p-6 shadow-sm" style={{ background: "var(--surface)" }}>
        <p className="text-xs font-semibold tracking-[0.18em] opacity-70">TAILWIND-STYLED v4.1 BACKLOG</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Hardening Existing Next.js Frontend</h1>
        <p className="mt-2 max-w-2xl opacity-80">
          Demo ini memakai app existing dan menunjukkan live token switching, interactive cart state, dan
          responsive layout berbasis container query.
        </p>
        <div className="mt-4">
          <ThemeAndCartControls />
        </div>
      </header>

      <section className="@container mt-8 rounded-2xl border p-4 md:p-6" style={{ background: "var(--surface)" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Products</h2>
          <span className="text-xs opacity-70">Container query demo</span>
        </div>

        <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @xl:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.name}
              className="rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md"
              style={{ background: "var(--surface-muted)" }}
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">{product.name}</h3>
                <span className="rounded-full border px-2 py-1 text-[10px] font-semibold">{product.badge}</span>
              </div>
              <p className="text-sm opacity-75">Comfortable daily wear with lightweight material.</p>
              <p className="mt-4 text-lg font-bold">{product.price}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
