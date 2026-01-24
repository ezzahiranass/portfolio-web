'use client';

import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold uppercase tracking-widest text-[var(--foreground)] transition-colors hover:bg-[var(--surface-strong)]"
      aria-label="Toggle light and dark mode"
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
