'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { assetPath } from '@/app/lib/assetPath';

export default function CutoutHero() {
  const motionRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      const hero = document.getElementById('hero');
      const target = motionRef.current;
      if (!hero || !target) return;

      const viewportHeight = window.innerHeight || 1;
      const start = hero.offsetTop;
      const end = start + viewportHeight;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const progress = Math.min(
        Math.max((scrollY - start) / Math.max(end - start, 1), 0),
        1
      );
      const heroWidth = hero.clientWidth || 1;
      const targetWidth = target.offsetWidth || 0;
      const maxShift = Math.max(heroWidth - targetWidth, 0) * 0.5;
      const shift = -Math.round(maxShift * progress);
      target.style.setProperty('--cutout-shift', `${shift}px`);
    };

    const onScroll = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        update();
      });
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="cutout-enter group absolute bottom-0 right-0 z-30 w-[200px] sm:w-[200px] md:w-[500px] lg:w-[500px]">
      <div
        ref={motionRef}
        className="cutout-motion relative h-[200px] w-[200px] sm:h-[200px] sm:w-[200px] md:h-[500px] md:w-[500px] lg:h-[500px] lg:w-[500px]"
      >
        <Image
          alt="Cutout detail"
          className="pointer-events-none absolute inset-0 h-full w-full select-none opacity-100 group-hover:opacity-0"
          height={500}
          unoptimized
          src={assetPath('/images/cutout3.png')}
          width={500}
        />
        <Image
          alt="Cutout detail hover"
          className="pointer-events-none absolute inset-0 h-full w-full select-none opacity-0 group-hover:opacity-100"
          height={500}
          unoptimized
          src={assetPath('/images/cutout2.png')}
          width={500}
        />
      </div>
    </div>
  );
}
