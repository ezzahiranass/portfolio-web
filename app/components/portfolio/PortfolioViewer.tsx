'use client';

import BookViewer from '@/app/portfolio/viewer/components/BookViewer';

type PortfolioViewerProps = {
  className?: string;
  onPlayActionReady?: (playAction: (actionName: string) => void) => void;
};

export default function PortfolioViewer({
  className = '',
  onPlayActionReady,
}: PortfolioViewerProps) {
  const handlePlayActionReady =
    onPlayActionReady ?? (() => {});

  return (
    <div className={className}>
      <BookViewer onPlayActionReady={handlePlayActionReady} />
    </div>
  );
}
