import Link from "next/link";

const cards = [
  {
    title: "3D Book Viewer",
    description: "Interactive PDF viewer with page turns and lighting.",
    href: "/portfolio/viewer",
    tone: "from-neutral-900/70 via-neutral-800/40 to-neutral-700/10",
  },
  {
    title: "Chapter 01",
    description: "Foundation, framing, and the first story beat.",
    href: "/portfolio/chapter-01",
    tone: "from-neutral-900/60 via-neutral-800/30 to-neutral-700/10",
  },
  {
    title: "Chapter 02",
    description: "Systems, iterations, and the pivotal pivot.",
    href: "/portfolio/chapter-02",
    tone: "from-neutral-900/60 via-neutral-800/30 to-neutral-700/10",
  },
  {
    title: "Chapter 03",
    description: "Final delivery, outcomes, and reflection.",
    href: "/portfolio/chapter-03",
    tone: "from-neutral-900/60 via-neutral-800/30 to-neutral-700/10",
  },
];

export default function PortfolioHubPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.18),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.12),transparent_70%)] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-12 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.16),transparent_70%)] blur-[120px]" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16">
        <div className="flex flex-col gap-6">
          <Link
            href="/"
            className="w-fit rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--foreground)] transition-colors hover:bg-[var(--surface-strong)]"
          >
            Back to Landing
          </Link>
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--muted)]">
              Portfolio Index
            </p>
            <h1 className="text-4xl font-semibold uppercase tracking-tight sm:text-5xl">
              Curated work, mapped as chapters.
            </h1>
            <p className="max-w-2xl text-base text-[var(--muted)]">
              Explore the interactive book viewer or jump straight into each
              chapter. Each section is a focused narrative with its own visual
              and process highlights.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_60px_-50px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:-translate-y-1"
            >
              <div
                className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br ${card.tone}`}
              />
              <div className="relative flex h-full flex-col justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--muted)]">
                    Navigate
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold">{card.title}</h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {card.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em]">
                  Enter
                  <span className="text-lg">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
