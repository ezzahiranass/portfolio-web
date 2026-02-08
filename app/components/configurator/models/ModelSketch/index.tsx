'use client';

import type { ModelDefinition } from '../../types';
import { modelSketchDefaults } from './params';
import { ModelSketchRenderer } from './renderer';
import { buildModelSketchGui } from './gui';

export const modelSketch: ModelDefinition = {
  id: 'model-sketch',
  name: 'Sketch Configurator',
  intro: {
    title: 'Sketch Configurator',
    description: 'Draw a footprint to generate a tower and then refine floors, twist, and facade.',
    buttonLabel: 'Start Sketching',
  },
  defaults: modelSketchDefaults,
  camera: { position: [25, 20, 25], fov: 50 },
  render: (params) => <ModelSketchRenderer params={params} />,
  buildGui: buildModelSketchGui,
};
