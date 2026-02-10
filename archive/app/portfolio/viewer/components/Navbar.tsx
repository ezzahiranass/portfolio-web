'use client';

export default function Navbar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 p-4">
      <div className="backdrop-blur-md bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-lg px-6 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-black dark:text-white">
            Book Viewer
          </h1>
          <div className="flex gap-4">
            <button className="text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors">
              Menu
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

