'use client';

import type GUI from 'lil-gui';
import type { ParamValues } from '../../types';
type Params = ParamValues & {
  towerType: string;
  bevel: number;
  bevelResolution: number;
  ghostSubdivisions: number;
  floorHeight: number;
  floors: number;
  slabThickness: number;
  centralColumnRadius: number;
  columnCount: number;
  columnRadius: number;
  columnRingOffset: number;
  showShell: boolean;
  showSite: boolean;
  twist: number;
  topInset: number;
  bottomOffset: number;
};

export function buildModelSketchGui(
  gui: GUI,
  params: ParamValues,
  onChange: (next: ParamValues) => void
) {
  const state = params as Params;
  const drawAction = {
    draw: () => window.dispatchEvent(new CustomEvent('sketch:draw')),
  };

  const drawCtrl = gui.add(drawAction, 'draw').name('Draw');
  const siteCtrl = gui.add(state, 'showSite').name('Show Site');
  const typeCtrl = gui
    .add(state, 'towerType', ['Twist', 'Voxel', 'Shanghai'])
    .name('Tower Type');

  const extrusion = gui.addFolder('Extrusion');
  const roundedCtrl = extrusion
    .add(state, 'bevel', 0, 1, 0.01)
    .name('Bevel');
  const bevelResCtrl = extrusion
    .add(state, 'bevelResolution', 1, 16, 1)
    .name('Bevel Resolution');
  const ghostCtrl = extrusion
    .add(state, 'ghostSubdivisions', 0, 10, 1)
    .name('Ghost Subdivisions');
  const heightCtrl = extrusion
    .add(state, 'floorHeight', 2.5, 10, 0.1)
    .name('Floor Height');
  const floorsCtrl = extrusion
    .add(state, 'floors', 2, 30, 1)
    .name('Number of Floors');
  const slabCtrl = extrusion
    .add(state, 'slabThickness', 0.05, 1, 0.01)
    .name('Slab Thickness');
  const shellCtrl = extrusion
    .add(state, 'showShell')
    .name('Shell');
  const columns = gui.addFolder('Columns');
  const centralColumnCtrl = columns
    .add(state, 'centralColumnRadius', 0.05, 2, 0.05)
    .name('Central Radius');
  const columnCountCtrl = columns
    .add(state, 'columnCount', 0, 24, 1)
    .name('Count');
  const columnRadiusCtrl = columns
    .add(state, 'columnRadius', 0.05, 1, 0.01)
    .name('Radius');
  const columnRingCtrl = columns
    .add(state, 'columnRingOffset', 0, 10, 0.1)
    .name('Ring Offset');
  columns.open();
  const twistCtrl = extrusion
    .add(state, 'twist', 0, 1, 0.01)
    .name('Twist');
  const topInsetCtrl = extrusion
    .add(state, 'topInset', 0, 0.9, 0.01)
    .name('Top Inset');
  const bottomOffsetCtrl = extrusion
    .add(state, 'bottomOffset', 0, 1, 0.01)
    .name('Bottom Offset');
  extrusion.open();

  const tools = gui.addFolder('Tools');
  tools.add({ clear: () => window.dispatchEvent(new CustomEvent('sketch:delete')) }, 'clear').name('Delete');
  tools.open();

  const updateDrawState = (isDrawing: boolean) => {
    drawCtrl.name(isDrawing ? 'Drawing...' : 'Draw');
    if (isDrawing) {
      drawCtrl.disable();
    } else {
      drawCtrl.enable();
    }
  };

  const handleDrawingEvent = (event: Event) => {
    const detail = (event as CustomEvent<boolean>).detail;
    updateDrawState(Boolean(detail));
  };

  window.addEventListener('sketch:drawing', handleDrawingEvent as EventListener);
  const originalDestroy = gui.destroy.bind(gui);
  gui.destroy = () => {
    window.removeEventListener('sketch:drawing', handleDrawingEvent as EventListener);
    originalDestroy();
  };

  const sync = () => onChange({ ...state });
  siteCtrl.onChange(sync);
  typeCtrl.onChange(sync);
  roundedCtrl.onChange(sync);
  bevelResCtrl.onChange(sync);
  ghostCtrl.onChange(sync);
  heightCtrl.onChange(sync);
  floorsCtrl.onChange(sync);
  slabCtrl.onChange(sync);
  shellCtrl.onChange(sync);
  centralColumnCtrl.onChange(sync);
  columnCountCtrl.onChange(sync);
  columnRadiusCtrl.onChange(sync);
  columnRingCtrl.onChange(sync);
  twistCtrl.onChange(sync);
  topInsetCtrl.onChange(sync);
  bottomOffsetCtrl.onChange(sync);

  updateDrawState(false);
}
