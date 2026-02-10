'use client';

import { useMemo, useState } from 'react';
import ConfiguratorShell from './ConfiguratorShell';
import ModelSwitcher from './ModelSwitcher';
import { configuratorModels } from './models';

export default function ConfiguratorSection() {
  const models = useMemo(() => configuratorModels, []);
  const [activeId, setActiveId] = useState(models[0]?.id ?? '');
  const activeModel = models.find((model) => model.id === activeId) ?? models[0];

  if (!activeModel) return null;

  return (
    <div className="flex flex-col gap-6">
      <ModelSwitcher models={models} activeId={activeId} onSelect={setActiveId} />
      <ConfiguratorShell model={activeModel} />
    </div>
  );
}
