"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";

type GalleryItem = {
  id: string;
  title: string;
  src: string;
  caption: string;
};

type GalleryCarouselProps = {
  items: GalleryItem[];
  selectedId: string | null;
  onSelect: (item: GalleryItem) => void;
};

export default function GalleryCarousel({
  items,
  selectedId,
  onSelect,
}: GalleryCarouselProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const itemNodes = useRef<Array<HTMLDivElement | null>>([]);
  const isResettingRef = useRef(false);

  const loopedItems = useMemo(() => {
    if (items.length === 0) return [];
    return [...items, ...items, ...items];
  }, [items]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const segment = rail.scrollWidth / 3;
    if (segment > 0) {
      rail.scrollLeft = segment;
    }
  }, [items]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    let rafId = 0;
    let isPaused = false;

    const handleEnter = () => {
      isPaused = true;
    };

    const handleLeave = () => {
      isPaused = false;
    };

    rail.addEventListener("mouseenter", handleEnter);
    rail.addEventListener("mouseleave", handleLeave);

    const step = () => {
      if (!isPaused) {
        rail.scrollLeft += 0.5;
      }
      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(rafId);
      rail.removeEventListener("mouseenter", handleEnter);
      rail.removeEventListener("mouseleave", handleLeave);
    };
  }, [items]);

  const handleScroll = () => {
    const rail = railRef.current;
    if (!rail || isResettingRef.current) return;

    const segment = rail.scrollWidth / 3;
    if (segment === 0) return;

    if (rail.scrollLeft < segment * 0.55) {
      isResettingRef.current = true;
      rail.scrollLeft += segment;
      isResettingRef.current = false;
    }

    if (rail.scrollLeft > segment * 1.45) {
      isResettingRef.current = true;
      rail.scrollLeft -= segment;
      isResettingRef.current = false;
    }
  };

  return (
    <div className="relative">
      <div
        ref={railRef}
        onScroll={handleScroll}
        className="hide-scrollbar flex gap-6 overflow-x-auto pb-4 pr-10"
      >
        {loopedItems.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            ref={(node) => {
              itemNodes.current[index] = node;
            }}
            onClick={() => {
              const rail = railRef.current;
              const node = itemNodes.current[index];
              if (rail && node) {
                const leftTarget =
                  node.offsetLeft + node.offsetWidth / 2 - rail.clientWidth / 2;
                rail.scrollTo({ left: leftTarget, behavior: "smooth" });
              }
              onSelect(item);
            }}
            className={`group relative min-w-[240px] cursor-pointer overflow-hidden rounded-3xl bg-[var(--background)] transition-transform md:min-w-[260px] ${
              selectedId === item.id ? "scale-[1.02]" : ""
            }`}
          >
            <div className="relative aspect-square w-full bg-[var(--surface-strong)]">
              <Image
                src={item.src}
                alt={item.title}
                fill
                className="object-cover"
                sizes="260px"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-end bg-[linear-gradient(to_top,_rgba(0,0,0,0.7),_transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="p-4 text-white">
                <div className="text-base font-semibold">{item.title}</div>
                <div className="text-xs text-white/70">{item.caption}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
