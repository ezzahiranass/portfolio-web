import ThreeBackground from "./components/landing/ThreeBackground";
import SkillsSection from "./components/landing/SkillsSection";
import RoadmapSection from "./components/landing/RoadmapSection";
import experienceData from "../public/data/experience.json";
import educationData from "../public/data/education.json";
import ThemeToggle from "./components/theme/ThemeToggle";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="fixed inset-x-0 top-0 z-50 bg-[var(--background)]/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]">
            Your Name
          </div>
          <nav className="flex items-center gap-3 text-sm">
            {[
              "Hero",
              "Skills",
              "Portfolio",
              "Roadmap",
              "Showcase",
              "Viewer",
              "Gallery",
              "Contact",
            ].map((label) => (
              <a
                key={label}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs uppercase tracking-widest text-[var(--foreground)]"
                href="#"
              >
                {label}
              </a>
            ))}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main>
        <section className="relative flex min-h-screen w-full items-center overflow-hidden bg-[var(--background)] pt-24">
          <div className="absolute inset-0">
            <ThreeBackground />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.08),_transparent_55%)]" />
          </div>
          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-20 text-[var(--foreground)]">
            <h1 className="max-w-2xl text-5xl font-black uppercase tracking-tight">
              DESIGN THROUGH TECHNOLOGY
            </h1>
            <p className="max-w-2xl text-lg font-medium text-[var(--muted)]">
              I design and develop digital experiences that bridge creativity and technology.
            </p>
            <div className="flex flex-wrap gap-4 text-sm font-semibold uppercase tracking-widest">
              <span className="rounded-full border border-[var(--border)] bg-[var(--foreground)] px-4 py-2 text-[var(--background)]">
                CTA Button
              </span>
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[var(--foreground)]">
                Secondary Action
              </span>
            </div>
          </div>
        </section>

        <section className="w-full bg-[var(--background)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-16">
            <div className="text-3xl font-black uppercase tracking-tight">
              Skills Section
            </div>
            <SkillsSection />
          </div>
        </section>

        <section className="w-full bg-[var(--surface)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-16">
            <div className="text-3xl font-black uppercase tracking-tight">
              Portfolio Chapters
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { label: "Chapter 01", href: "/portfolio/chapter-01" },
                { label: "Chapter 02", href: "/portfolio/chapter-02" },
                { label: "Chapter 03", href: "/portfolio/chapter-03" },
              ].map((chapter) => (
                <a
                  key={chapter.label}
                  href={chapter.href}
                  className="group rounded-3xl border border-[var(--border)] bg-[var(--background)] p-6"
                >
                  <div className="h-40 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground)]">
                    <div className="flex h-full items-center justify-center text-sm font-bold uppercase text-[var(--muted)]">
                      Thumbnail
                    </div>
                  </div>
                  <div className="mt-4 text-xl font-semibold">
                    {chapter.label}
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    Click to view work.
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full bg-[var(--background)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-16">
            <div className="text-3xl font-black uppercase tracking-tight">
              Roadmap Experience
            </div>
            <RoadmapSection data={{ experience: experienceData, education: educationData }} />
          </div>
        </section>

        <section className="w-full bg-[var(--surface)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-16">
            <div className="text-3xl font-black uppercase tracking-tight">
              Showcase GIFs
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {["GIF 01", "GIF 02", "GIF 03"].map((label) => (
                <div
                  key={label}
                  className="rounded-3xl border border-[var(--border)] bg-[var(--background)] p-6"
                >
                  <div className="h-36 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]">
                    <div className="flex h-full items-center justify-center text-sm font-bold uppercase text-[var(--muted)]">
                      {label}
                    </div>
                  </div>
                  <div className="mt-4 text-lg font-semibold">
                    Description Title
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    Short description of the visual.
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full bg-[var(--background)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-16">
            <div className="text-3xl font-black uppercase tracking-tight">
              ThreeJS Parametric Configurator
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8">
              <div className="h-64 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground)]">
                <div className="flex h-full items-center justify-center text-sm font-bold uppercase text-[var(--muted)]">
                  Building Configurator Viewer
                </div>
              </div>
              <div className="mt-4 text-sm text-[var(--muted)]">
                Controls, toggles, and parametric options go here.
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-[var(--surface)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-16">
            <div className="text-3xl font-black uppercase tracking-tight">
              Gallery + Filters
            </div>
            <div className="flex flex-wrap gap-3">
              {["All", "Computational", "Plans", "Diagrams", "Renders"].map(
                (filter) => (
                  <button
                    key={filter}
                    className="rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-xs font-bold uppercase tracking-widest"
                    type="button"
                  >
                    {filter}
                  </button>
                )
              )}
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={`gallery-${index}`}
                  className="min-w-[220px] rounded-3xl border border-[var(--border)] bg-[var(--background)] p-4"
                >
                  <div className="h-32 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground)]">
                    <div className="flex h-full items-center justify-center text-xs font-bold uppercase text-[var(--muted)]">
                      Render {index + 1}
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-[var(--muted)]">
                    Render caption text.
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full bg-[var(--background)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-16">
            <div className="text-3xl font-black uppercase tracking-tight">
              Contact Section
            </div>
            <form className="grid gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 md:grid-cols-2">
              <input
                className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm"
                placeholder="Name"
              />
              <input
                className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm"
                placeholder="Email"
                type="email"
              />
              <input
                className="md:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm"
                placeholder="Subject"
              />
              <textarea
                className="md:col-span-2 min-h-[140px] rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm"
                placeholder="Message"
              />
              <button
                className="md:col-span-2 rounded-2xl bg-[var(--foreground)] px-6 py-4 text-sm font-bold uppercase tracking-widest text-[var(--background)]"
                type="button"
              >
                Send Message
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-[var(--muted)] md:flex-row">
          <div className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[var(--foreground)]">
            Contact
          </div>
          <div className="flex gap-3 text-xs uppercase tracking-widest">
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)]">
              Instagram
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)]">
              LinkedIn
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)]">
              Behance
            </span>
          </div>
          <div>hello@example.com</div>
        </div>
      </footer>
    </div>
  );
}
