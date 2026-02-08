'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

export default function CanvasKickstart() {
  const { gl, invalidate } = useThree();

  useEffect(() => {
    let raf = 0;
    let resizeObserver: ResizeObserver | null = null;
    let lastWidth = 0;
    let lastHeight = 0;
    let zeroSizeFrames = 0;

    const kick = (force = false) => {
      const rect = gl.domElement.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);

      if (width > 0 && height > 0) {
        zeroSizeFrames = 0;
        if (force || width !== lastWidth || height !== lastHeight) {
          lastWidth = width;
          lastHeight = height;
          gl.setSize(width, height, false);
        }
        invalidate();
        return;
      }

      // If we're still at 0x0, keep trying until layout settles.
      zeroSizeFrames += 1;
      if (zeroSizeFrames <= 60) {
        raf = requestAnimationFrame(() => kick(force));
      }
    };

    const schedule = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => kick(true));
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        schedule();
      }
    };

    schedule();

    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        schedule();
      });
      resizeObserver.observe(gl.domElement);
    }

    window.addEventListener('focus', schedule);
    window.addEventListener('resize', schedule);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      window.removeEventListener('focus', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [gl, invalidate]);

  return null;
}
