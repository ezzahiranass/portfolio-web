'use client';

import { useState } from 'react';

export default function AnimationControls({ playAction }: { playAction: (actionName: string) => void }) {
  const [isConverting, setIsConverting] = useState(false);
  const [convertMessage, setConvertMessage] = useState<string | null>(null);

  const handlePlayAction = (actionName: string) => {
    playAction(actionName);
  };

  const handleConvertPDF = async () => {
    setIsConverting(true);
    setConvertMessage(null);
    
    try {
      const response = await fetch('/api/convert-pdf');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setConvertMessage(`Success! Converted ${data.pagesConverted} pages.`);
        // Reload page after a short delay to show new images
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setConvertMessage(data.error || 'Conversion failed');
      }
    } catch (error: any) {
      setConvertMessage(`Error: ${error.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 z-50 flex flex-col gap-2">
      <button
        onClick={() => handlePlayAction('Open Book State')}
        className="backdrop-blur-md bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/20 rounded-lg px-4 py-2 text-sm font-medium text-black dark:text-white shadow-lg hover:bg-white/30 dark:hover:bg-black/30 transition-colors"
      >
        Open Book State
      </button>
      <button
        onClick={() => handlePlayAction('Close Book State Left')}
        className="backdrop-blur-md bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/20 rounded-lg px-4 py-2 text-sm font-medium text-black dark:text-white shadow-lg hover:bg-white/30 dark:hover:bg-black/30 transition-colors"
      >
        Close Book State Left
      </button>
      <button
        onClick={() => handlePlayAction('Close Book State Right')}
        className="backdrop-blur-md bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/20 rounded-lg px-4 py-2 text-sm font-medium text-black dark:text-white shadow-lg hover:bg-white/30 dark:hover:bg-black/30 transition-colors"
      >
        Close Book State Right
      </button>
      <div className="border-t border-white/20 my-1"></div>
      <button
        onClick={handleConvertPDF}
        disabled={isConverting}
        className="backdrop-blur-md bg-blue-500/20 dark:bg-blue-500/20 border border-blue-400/30 dark:border-blue-400/20 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-blue-500/30 dark:hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConverting ? 'Converting PDF...' : 'Convert PDF to Images'}
      </button>
      {convertMessage && (
        <div className={`text-xs px-2 py-1 rounded ${
          convertMessage.includes('Success') 
            ? 'bg-green-500/20 text-green-300' 
            : 'bg-red-500/20 text-red-300'
        }`}>
          {convertMessage}
        </div>
      )}
    </div>
  );
}

