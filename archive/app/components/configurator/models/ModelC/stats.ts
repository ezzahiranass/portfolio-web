'use client';

import type GUI from 'lil-gui';
import type { ParamValues } from '../../types';

type Params = ParamValues & {
  totalHeight?: number;
  floorsCount?: number;
  groundSurface?: number;
  floorSurface?: number;
  totalSurface?: number;
};

export function buildModelCStats(
  gui: GUI,
  params: ParamValues,
  _onChange: (next: ParamValues) => void
) {
  const state = params as Params;
  gui.domElement.style.marginTop = '0';

  gui.add(state, 'totalHeight').name('Total Height').listen().disable();
  gui.add(state, 'floorsCount').name('Number of Floors').listen().disable();
  gui.add(state, 'groundSurface').name('Ground Surface').listen().disable();
  gui.add(state, 'floorSurface').name('Floor Surface').listen().disable();
  gui.add(state, 'totalSurface').name('Total Surface').listen().disable();
}
