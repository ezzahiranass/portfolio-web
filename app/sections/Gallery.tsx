"use client";

import { useEffect, useMemo, useRef } from "react";

const galleryItems = [
  {
    id: "exterior-01",
    title: "Exterior Render 01",
    src: "/images/exterior-renders/ISSUU PDF Downloader_page-0014.jpg",
    caption: "Facade study with daylight balancing.",
  },
  {
    id: "exterior-02",
    title: "Exterior Render 02",
    src: "/images/exterior-renders/ISSUU PDF Downloader_page-0015.jpg",
    caption: "Entry sequence and public edge framing.",
  },
  {
    id: "exterior-03",
    title: "Exterior Render 03",
    src: "/images/exterior-renders/ISSUU PDF Downloader_page-0016.jpg",
    caption: "Material rhythm across elevations.",
  },
  {
    id: "exterior-04",
    title: "Exterior Render 04",
    src: "/images/exterior-renders/ISSUU PDF Downloader_page-0017.jpg",
    caption: "Urban corner perspective with signage.",
  },
  {
    id: "interior-01",
    title: "Interior Render 01",
    src: "/images/interior-renders/epsilon-designs-kids-room3.jpg",
    caption: "Warm palette for shared living space.",
  },
  {
    id: "interior-02",
    title: "Interior Render 02",
    src: "/images/interior-renders/epsilon-designs-parents12.jpg",
    caption: "Layered lighting to soften the envelope.",
  },
  {
    id: "site-01",
    title: "Site Analysis 01",
    src: "/images/site-analysis/axos_10 - Photo.png",
    caption: "Context diagram and circulation flow.",
  },
];

export default function Gallery() {
  const railRef = useRef<HTMLDivElement | null>(null);
  const isResettingRef = useRef(false);

  const loopedItems = useMemo(() => {
    if (galleryItems.length === 0) return [];
    return [...galleryItems, ...galleryItems, ...galleryItems];
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const segment = rail.scrollWidth / 3;
    if (segment > 0) {
      rail.scrollLeft = segment;
    }
  }, []);

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
  }, []);

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
    <section id="gallery" className="section section--alt">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow mono">Gallery</p>
            <h2 className="title">Architectural frames and studies.</h2>
          </div>
          <p className="subtitle">
            A continuous ribbon of renders, interior studies, and site analysis.
          </p>
        </div>
        <div
          className="gallery-scroller hide-scrollbar"
          ref={railRef}
          onScroll={handleScroll}
        >
          {loopedItems.map((item, index) => (
            <div key={`${item.id}-${index}`} className="gallery-card">
              <div className="gallery-media">
                <img src={item.src} alt={item.title} />
              </div>
              <div className="gallery-caption">
                <div className="mono">{item.title}</div>
                <p>{item.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
