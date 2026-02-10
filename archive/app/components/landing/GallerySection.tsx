"use client";

import { useMemo, useState } from "react";
import { assetPath } from "@/app/lib/assetPath";
import GalleryCarousel from "./GalleryCarousel";

type GalleryCategory = "All" | "Exterior" | "Interior" | "Site Analysis";

type GalleryItem = {
  id: string;
  title: string;
  src: string;
  category: Exclude<GalleryCategory, "All">;
  caption: string;
};

const galleryItems: GalleryItem[] = [
  {
    id: "exterior-01",
    title: "Exterior Render 01",
    src: assetPath("/images/exterior-renders/ISSUU PDF Downloader_page-0014.jpg"),
    category: "Exterior",
    caption: "Facade study with daylight balancing.",
  },
  {
    id: "exterior-02",
    title: "Exterior Render 02",
    src: assetPath("/images/exterior-renders/ISSUU PDF Downloader_page-0015.jpg"),
    category: "Exterior",
    caption: "Entry sequence and public edge framing.",
  },
  {
    id: "exterior-03",
    title: "Exterior Render 03",
    src: assetPath("/images/exterior-renders/ISSUU PDF Downloader_page-0016.jpg"),
    category: "Exterior",
    caption: "Material rhythm across elevations.",
  },
  {
    id: "exterior-04",
    title: "Exterior Render 04",
    src: assetPath("/images/exterior-renders/ISSUU PDF Downloader_page-0017.jpg"),
    category: "Exterior",
    caption: "Urban corner perspective with signage.",
  },
  {
    id: "interior-01",
    title: "Interior Render 01",
    src: assetPath("/images/interior-renders/epsilon-designs-kids-room3.jpg"),
    category: "Interior",
    caption: "Warm palette for shared living space.",
  },
  {
    id: "interior-02",
    title: "Interior Render 02",
    src: assetPath("/images/interior-renders/epsilon-designs-parents12.jpg"),
    category: "Interior",
    caption: "Layered lighting to soften the envelope.",
  },
  {
    id: "interior-03",
    title: "Interior Render 03",
    src: assetPath("/images/interior-renders/epsilon-designs-untitled1.jpg"),
    category: "Interior",
    caption: "Compact suite with integrated storage.",
  },
  {
    id: "site-01",
    title: "Site Analysis 01",
    src: assetPath("/images/site-analysis/axos_10 - Photo.png"),
    category: "Site Analysis",
    caption: "Context diagram and circulation flow.",
  },
];

const filters: GalleryCategory[] = ["All", "Exterior", "Interior", "Site Analysis"];

export default function GallerySection() {
  const [activeFilter, setActiveFilter] = useState<GalleryCategory>("All");
  const [selectedId, setSelectedId] = useState<string | null>(
    galleryItems[0]?.id ?? null
  );

  const filteredItems = useMemo(() => {
    if (activeFilter === "All") return galleryItems;
    return galleryItems.filter((item) => item.category === activeFilter);
  }, [activeFilter]);

  const selectedItem = filteredItems.find((item) => item.id === selectedId) ?? filteredItems[0];

  return (
    <section className="w-full bg-[var(--surface)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-16">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="title-font text-3xl font-black uppercase tracking-tight">
              Gallery + Filters
            </div>
            <div className="mt-2 text-sm text-[var(--muted)]">
              Browse by project type and drill into each highlight.
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {filters.map((filter) => {
              const isActive = filter === activeFilter;
              return (
                <button
                  key={filter}
                  className={[
                    "rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors",
                    isActive
                      ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                      : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--surface-strong)]",
                  ].join(" ")}
                  onClick={() => {
                    setActiveFilter(filter);
                    const nextFirst = filter === "All"
                      ? galleryItems[0]
                      : galleryItems.find((item) => item.category === filter);
                    setSelectedId(nextFirst?.id ?? null);
                  }}
                  type="button"
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>
        <GalleryCarousel
          items={filteredItems}
          selectedId={selectedId}
          onSelect={(item) => setSelectedId(item.id)}
        />
        {selectedItem && (
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--background)] p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
              Selected Highlight
            </div>
            <div className="mt-2 text-lg font-semibold">{selectedItem.title}</div>
            <div className="mt-2 text-sm text-[var(--muted)]">
              {selectedItem.caption}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
