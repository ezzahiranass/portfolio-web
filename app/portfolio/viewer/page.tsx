'use client';

import { useState } from 'react';
import Link from 'next/link';
import BookViewer from './components/BookViewer';
import AnimationControls from './components/AnimationControls';

export default function Home() {
  const [playAction, setPlayAction] = useState<((actionName: string) => void) | null>(null);

  const handlePlayActionReady = (playActionFn: (actionName: string) => void) => {
    setPlayAction(() => playActionFn);
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <div className="absolute top-4 left-4 z-50">
        <Link
          href="/portfolio"
          className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-white/30 bg-white/20 text-black shadow-lg backdrop-blur-md transition-colors hover:bg-white/30 dark:border-white/20 dark:bg-black/20 dark:text-white dark:hover:bg-black/30"
          aria-label="Back to portfolio"
          title="Back to portfolio"
        >
          ←
        </Link>
      </div>
      <div className="absolute top-4 right-4 z-50">
        <a
          href="/Portfolio_EzzahirAnass_2024.pdf"
          download
          className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-white/30 bg-white/20 text-black shadow-lg backdrop-blur-md transition-colors hover:bg-white/30 dark:border-white/20 dark:bg-black/20 dark:text-white dark:hover:bg-black/30"
          aria-label="Download PDF"
          title="Download PDF"
        >
          ⬇
        </a>
      </div>
      <div className="w-full h-full">
        <BookViewer onPlayActionReady={handlePlayActionReady} />
      </div>
    </div>
  );
}
