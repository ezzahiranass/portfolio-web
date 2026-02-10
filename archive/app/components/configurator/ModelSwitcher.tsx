'use client';

import type { ModelDefinition } from './types';

type ModelSwitcherProps = {
  models: ModelDefinition[];
  activeId: string;
  onSelect: (id: string) => void;
};

export default function ModelSwitcher({ models, activeId, onSelect }: ModelSwitcherProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {models.map((model) => (
        <button
          key={model.id}
          className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest ${
            activeId === model.id
              ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
              : 'border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]'
          }`}
          onClick={() => onSelect(model.id)}
          type="button"
        >
          {model.name}
        </button>
      ))}
    </div>
  );
}
