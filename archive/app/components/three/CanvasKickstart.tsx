'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

export default function CanvasKickstart() {
  const { gl, invalidate } = useThree();
  
  useEffect(() => {
    let raf = 0;
    let retries = 0;
    const maxRetries = 60;
    const parent = gl.domElement.parentElement;
    if (!parent) return undefined;


    const kick = () => {
      const rect = parent.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        gl.setSize(rect.width, rect.height, false);
        invalidate();
      } else if (retries < maxRetries) {
        retries += 1;
        schedule();
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

    const resizeObserver = new ResizeObserver(() => {
      schedule();
    });
    resizeObserver.observe(parent);

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
      resizeObserver.disconnect();
      window.removeEventListener('focus', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [gl, invalidate]);

  return null;
}
