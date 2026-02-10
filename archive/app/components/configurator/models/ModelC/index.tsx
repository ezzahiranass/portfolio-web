'use client';

import type { ModelDefinition } from '../../types';
import { modelCDefaults } from './params';
import { ModelCRenderer } from './renderer';
import { buildModelCGui } from './gui';
import { buildModelCStats } from './stats';

export const modelC: ModelDefinition = {
  id: 'model-c',
  name: 'Building Configurator',
  defaults: modelCDefaults,
  camera: { position: [-30, 50, -30] },
  render: (params) => <ModelCRenderer params={params} />,
  buildGui: buildModelCGui,
  buildStats: buildModelCStats,
};
