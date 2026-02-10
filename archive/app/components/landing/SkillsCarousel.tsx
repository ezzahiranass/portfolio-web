'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef } from 'react';

type Skill = {
  id: string;
  title: string;
  description: string;
  image: string | null;
  details?: string[];
};

type SkillsCarouselProps = {
  skills: Skill[];
  selectedId: string | null;
  onSelect: (skill: Skill) => void;
};

export default function SkillsCarousel({
  skills,
  selectedId,
  onSelect,
}: SkillsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isAdjustingRef = useRef(false);
  const loopedSkills = useMemo(() => [...skills, ...skills, ...skills], [skills]);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const setWidth = scroller.scrollWidth / 3;
    if (setWidth > 0) {
      scroller.scrollLeft = setWidth;
    }
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let rafId = 0;
    let isPaused = false;

    const handleEnter = () => {
      isPaused = true;
    };

    const handleLeave = () => {
      isPaused = false;
    };

    scroller.addEventListener('mouseenter', handleEnter);
    scroller.addEventListener('mouseleave', handleLeave);

    const step = () => {
      if (!isPaused) {
        scroller.scrollLeft += 0.5;
      }
      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(rafId);
      scroller.removeEventListener('mouseenter', handleEnter);
      scroller.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller || isAdjustingRef.current) return;

    const setWidth = scroller.scrollWidth / 3;
    if (setWidth === 0) return;

    if (scroller.scrollLeft <= setWidth * 0.5) {
      isAdjustingRef.current = true;
      scroller.scrollLeft += setWidth;
      isAdjustingRef.current = false;
    } else if (scroller.scrollLeft >= setWidth * 1.5) {
      isAdjustingRef.current = true;
      scroller.scrollLeft -= setWidth;
      isAdjustingRef.current = false;
    }
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="hide-scrollbar flex gap-6 overflow-x-auto pb-4 pr-10"
      >
        {loopedSkills.map((skill, index) => (
          <div
            key={`${skill.title}-${index}`}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            onClick={() => {
              const scroller = scrollerRef.current;
              const item = itemRefs.current[index];
              if (scroller && item) {
                const targetLeft =
                  item.offsetLeft + item.offsetWidth / 2 - scroller.clientWidth / 2;
                scroller.scrollTo({ left: targetLeft, behavior: 'smooth' });
              }
              onSelect(skill);
            }}
            className={`group relative min-w-[240px] cursor-pointer overflow-hidden rounded-3xl bg-[var(--surface)] transition-transform md:min-w-[260px] ${
              selectedId === skill.id ? 'scale-[1.02]' : ''
            }`}
          >
            <div className="relative aspect-square w-full bg-[var(--surface-strong)]">
              {skill.image ? (
                <Image
                  src={skill.image}
                  alt={`${skill.title} thumbnail`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs font-bold uppercase text-[var(--muted)]">
                  Thumbnail
                </div>
              )}
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-end bg-[linear-gradient(to_top,_rgba(0,0,0,0.75),_transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="p-4 text-white">
                <div className="text-base font-semibold">{skill.title}</div>
                <div className="text-xs text-white/70">{skill.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
