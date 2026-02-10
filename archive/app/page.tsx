import ThreeBackground from "./components/landing/ThreeBackground";
import SkillsSection from "./components/landing/SkillsSection";
import RoadmapSection from "./components/landing/RoadmapSection";
import experienceData from "../public/data/experience.json";
import educationData from "../public/data/education.json";
import ThemeToggle from "./components/theme/ThemeToggle";
import ConfiguratorSection from "./components/configurator/ConfiguratorSection";
import Image from "next/image";
import CutoutHero from "./components/landing/CutoutHero";
import { assetPath } from "@/app/lib/assetPath";
import PortfolioViewer from "./components/portfolio/PortfolioViewer";
import GallerySection from "./components/landing/GallerySection";
import ChatbotWidget from "./components/landing/ChatbotWidget";
import ViewerIntroOverlay from "./components/landing/ViewerIntroOverlay";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="fixed inset-x-0 top-0 z-50 h-[var(--nav-height)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]">
            Ezzahir Anass
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main>
        <section
          id="hero"
          className="relative flex min-h-screen w-full items-center overflow-hidden bg-[var(--background)] pt-24"
        >
          <div className="absolute inset-0">
            <ThreeBackground />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.08),_transparent_55%)]" />
          </div>
          <Image
            alt="Paper border"
            className="pointer-events-none absolute left-0 right-0 top-[var(--nav-height)] z-30 w-full select-none"
            height={120}
            unoptimized
            src={assetPath("/images/paper-border.png")}
            width={2400}
          />
          <div
            className="pointer-events-none absolute inset-0 z-[2] opacity-55 text-[var(--foreground)]"
            style={{
              backgroundImage:
                "linear-gradient(to right, color-mix(in oklab, currentColor 28%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, currentColor 28%, transparent) 1px, transparent 1px)",
              backgroundSize: "64px 64px, 64px 64px",
              backgroundPosition: "center",
              maskImage:
                "linear-gradient(to right, transparent, black 14%, black 86%, transparent), linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 14%, black 86%, transparent), linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)",
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
              maskSize: "100% 100%",
              WebkitMaskSize: "100% 100%",
            }}
          />
          <CutoutHero />
          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-20 text-[var(--foreground)]">
            <h1 className="title-font max-w-2xl text-5xl font-black uppercase tracking-tight">
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
            <div className="title-font text-3xl font-black uppercase tracking-tight">
              Skills Section
            </div>
            <SkillsSection />
          </div>
        </section>

        <section className="w-full bg-[var(--surface)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-16">
            <div className="title-font text-3xl font-black uppercase tracking-tight">
              Portfolio Viewer
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--background)] p-4 md:p-6">
              <ViewerIntroOverlay
                title="Interactive Book Viewer"
                description="Flip through the portfolio as a 3D book with page controls, fullscreen, and chapter shortcuts."
                buttonLabel="Start Viewing"
              >
                <div className="h-[520px] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]">
                  <PortfolioViewer className="h-full w-full" />
                </div>
              </ViewerIntroOverlay>
            </div>
          </div>
        </section>

        <section className="w-full bg-[var(--background)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-16">
            <div className="title-font text-3xl font-black uppercase tracking-tight">
              Roadmap Experience
            </div>
            <RoadmapSection data={{ experience: experienceData, education: educationData }} />
          </div>
        </section>

        <section className="w-full bg-[var(--surface)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-16">
            <div className="title-font text-3xl font-black uppercase tracking-tight">
              Showcase GIFs
            </div>
            <div className="flex flex-col gap-8">
              {[
                {
                  title: "Urban Rhythm",
                  description: "Urban.gif — parametric facade animation study.",
                  image: assetPath("/images/urban.gif"),
                },
                {
                  title: "Light Strips",
                  description: "Placeholder description for upcoming showcase.",
                  image: assetPath("/images/diagram6.png"),
                },
                {
                  title: "Material Flow",
                  description: "Placeholder description for upcoming showcase.",
                  image: assetPath("/images/exterior-renders/ISSUU PDF Downloader_page-0016.jpg"),
                },
              ].map((item, index) => {
                const isReversed = index === 1;
                return (
                  <div
                    key={item.title}
                    className="flex flex-col gap-6 rounded-3xl border border-[var(--border)] bg-[var(--background)] p-6 md:flex-row md:items-center"
                  >
                    <div
                      className={[
                        "flex w-full md:w-1/2",
                        isReversed ? "md:order-2" : "md:order-1",
                      ].join(" ")}
                    >
                      <div className="relative h-52 w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]">
                        <Image
                          alt={item.title}
                          className="h-full w-full object-cover"
                          height={480}
                          unoptimized
                          src={item.image}
                          width={720}
                        />
                      </div>
                    </div>
                    <div
                      className={[
                        "flex w-full flex-col gap-3 md:w-1/2",
                        isReversed ? "md:order-1 md:text-right" : "md:order-2",
                      ].join(" ")}
                    >
                      <div className="text-xl font-semibold">{item.title}</div>
                      <div className="text-sm text-[var(--muted)]">
                        {item.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="w-full bg-[var(--background)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-16">
            <div className="title-font text-3xl font-black uppercase tracking-tight">
              ThreeJS Parametric Configurator
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8">
              <ViewerIntroOverlay
                title="Parametric Configurator"
                description="Adjust geometry and material controls in real time to explore design variants."
                buttonLabel="Open Configurator"
              >
                <div>
                  <ConfiguratorSection />
                  <div className="mt-4 text-sm text-[var(--muted)]">
                    Controls, toggles, and parametric options go here.
                  </div>
                </div>
              </ViewerIntroOverlay>
            </div>
          </div>
        </section>

        <GallerySection />

        <section
          id="about"
          className="relative flex min-h-screen w-full items-center overflow-hidden bg-[var(--background)] pt-24"
        >
          <div className="absolute inset-0">
            <ThreeBackground />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.08),_transparent_55%)]" />
          </div>
          <Image
            alt="Paper border"
            className="pointer-events-none absolute left-0 right-0 top-0 z-30 w-full select-none"
            height={120}
            unoptimized
            src={assetPath("/images/paper-border.png")}
            width={2400}
          />
          <div
            className="pointer-events-none absolute inset-0 z-[2] opacity-55 text-[var(--foreground)]"
            style={{
              backgroundImage:
                "linear-gradient(to right, color-mix(in oklab, currentColor 28%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, currentColor 28%, transparent) 1px, transparent 1px)",
              backgroundSize: "64px 64px, 64px 64px",
              backgroundPosition: "center",
              maskImage:
                "linear-gradient(to right, transparent, black 14%, black 86%, transparent), linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 14%, black 86%, transparent), linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)",
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
              maskSize: "100% 100%",
              WebkitMaskSize: "100% 100%",
            }}
          />
          <CutoutHero enableMotion={false} />
          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-20 text-[var(--foreground)]">
            <h2 className="title-font max-w-2xl text-5xl font-black uppercase tracking-tight">
              ABOUT ME
            </h2>
            <p className="max-w-2xl text-lg font-medium text-[var(--muted)]">
              As an architect and self-taught software developer specializing in the intersection of design and technology, I create custom plugins, automations, and digital solutions for 3D software to streamline architectural Visualization and 3D design workflows. Passionate about leveraging cutting-edge technology to enhance conceptualization and elevate the design process. I aim to combine my architectural expertise with programming skills to drive efficiency and push creative boundaries in the field.
            </p>
          </div>
        </section>

        <section className="w-full bg-[var(--background)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-16">
            <div className="title-font text-3xl font-black uppercase tracking-tight">
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
      <ChatbotWidget />
    </div>
  );
}
