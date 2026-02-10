'use client';

import { useEffect, useState } from 'react';
import { Canvas, type CanvasProps } from '@react-three/fiber';

export default function ClientOnlyCanvas(props: CanvasProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <Canvas {...props} />;
}
