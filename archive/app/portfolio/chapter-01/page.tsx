export default function ChapterOnePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-16">
        <a
          href="/"
          className="w-fit rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[var(--foreground)]"
        >
          Back to Landing
        </a>
        <h1 className="text-4xl font-black uppercase tracking-tight">
          Chapter 01
        </h1>
        <p className="max-w-2xl text-base text-[var(--muted)]">
          Placeholder page for the first portfolio chapter. Swap in your hero,
          case study content, media, and highlights.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {["Hero Visual", "Process", "System", "Outcome"].map((block) => (
            <div
              key={block}
              className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <div className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                {block}
              </div>
              <div className="mt-3 h-40 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
