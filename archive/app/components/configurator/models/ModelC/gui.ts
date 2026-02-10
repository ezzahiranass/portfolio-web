'use client';

import type GUI from 'lil-gui';
import type { ParamValues } from '../../types';

type Params = ParamValues & {
  floors: number;
  floorHeight: number;
  groundFloorHeight: number;
  roofHeight: number;
  totalHeight?: number;
  overhang: number;
  roofWallHeight: number;
  slabThickness: number;
  balconyLeft: boolean;
  balconyRight: boolean;
  balconyWidth: number;
  balconyRailing: string;
  windowWidth: number;
  window_type: string;
  balcony_window_type: string;
  stripHeight: number;
  stripSpacing: number;
  setback: number;
  groundSurface?: number;
  floorSurface?: number;
  totalSurface?: number;
  floorsCount?: number;
};

export function buildModelCGui(
  gui: GUI,
  params: ParamValues,
  onChange: (next: ParamValues) => void
) {
  const state = params as Params;
  let floorFolders: GUI[] = [];
  const controls = gui.addFolder('Building');
  const floorsCtrl = controls.add(state, 'floors', 1, 10, 1).name('Number of Floors');
  const floorHeightCtrl = controls.add(state, 'floorHeight', 2, 6, 0.1).name('Floor Height');
  const groundHeightCtrl = controls.add(state, 'groundFloorHeight', 2, 8, 0.1).name('Ground Floor Height');
  const roofHeightCtrl = controls.add(state, 'roofHeight', 0.5, 6, 0.1).name('Roof Height');
  const overhangCtrl = controls.add(state, 'overhang', 0, 3, 0.1).name('Overhang');
  const setbackCtrl = controls.add(state, 'setback', 0, 1, 0.1).name('Road Setback');
  const roofWallHeightCtrl = controls.add(state, 'roofWallHeight', 0.2, 2.5, 0.1).name('Roof Wall Height');
  const slabCtrl = controls.add(state, 'slabThickness', 0.05, 0.5, 0.05).name('Slab Thickness');
  const windowWidthCtrl = controls.add(state, 'windowWidth', 0.5, 3, 0.1).name('Window Width');
  const windowTypeCtrl = controls.add(state, 'window_type', ['Big', 'Small']).name('Window Type');
  const balconyWindowTypeCtrl = controls
    .add(state, 'balcony_window_type', ['Big', 'Small'])
    .name('Balcony Window Type');

  const computeTotalHeight = () => (
    state.groundFloorHeight
    + state.floors * state.floorHeight
    + (state.floors + 1) * state.slabThickness
    + state.roofHeight
  );
  const sizeX = 17.5;
  const sizeZBase = 13.1;
  const computeStats = () => {
    state.floorsCount = state.floors;
    const sizeZ = Math.max(sizeZBase * (1 - state.setback / 3), 0.1);
    state.groundSurface = Number((sizeX * sizeZ).toFixed(2));
    state.floorSurface = Number((sizeX * (sizeZ + state.overhang)).toFixed(2));
    state.totalSurface = Number(
      (state.groundSurface + state.floors * state.floorSurface).toFixed(2)
    );
  };
  state.totalHeight = Number(computeTotalHeight().toFixed(2));
  computeStats();
  controls.open();

  const balcony = gui.addFolder('Balcony');
  const balconyLeftCtrl = balcony.add(state, 'balconyLeft').name('Balcony Left');
  const balconyRightCtrl = balcony.add(state, 'balconyRight').name('Balcony Right');
  const balconyWidthCtrl = balcony.add(state, 'balconyWidth', 0.5, 6, 0.1).name('Balcony Width');
  const balconyRailingCtrl = balcony.add(state, 'balconyRailing', ['Glass', 'Metal']).name('Balcony Railing');
  balcony.open();

  const coating = gui.addFolder('Coating');
  const stripHeightCtrl = coating
    .add(state, 'stripHeight', 0.02, 0.3, 0.01)
    .name('Strip Height');
  const stripSpacingCtrl = coating
    .add(state, 'stripSpacing', 0.02, 0.5, 0.01)
    .name('Strip Spacing');
  const syncStripVisibility = () => {
    const showStrips = Array.from({ length: state.floors }).some((_, index) => (
      state[`windowCoating_${index}` as keyof Params] === 'Horizontal Strips'
      || state[`windowCoating_${index}` as keyof Params] === 'Vertical Strips'
      || state[`balconyCoating_${index}` as keyof Params] === 'Horizontal Strips'
      || state[`balconyCoating_${index}` as keyof Params] === 'Vertical Strips'
    ));
    coating.domElement.style.display = showStrips ? '' : 'none';
    stripHeightCtrl.domElement.style.display = showStrips ? '' : 'none';
    stripSpacingCtrl.domElement.style.display = showStrips ? '' : 'none';
  };
  syncStripVisibility();
  coating.open();

  
  const sync = () => {
    state.totalHeight = Number(computeTotalHeight().toFixed(2));
    computeStats();
    syncStripVisibility();
    rebuildFloorPanels();
    onChange({ ...state });
  };


  const rebuildFloorPanels = () => {
    floorFolders.forEach((folder) => folder.destroy());
    floorFolders = Array.from({ length: state.floors }).map((_, index) => {
      const windowKey = `windowCoating_${index}` as keyof Params;
      const balconyKey = `balconyCoating_${index}` as keyof Params;
      const key = `balconyWall_${index}` as keyof Params;
      if (state[windowKey] === undefined) {
        state[windowKey] = 'Arch';
      }
      if (state[balconyKey] === undefined) {
        state[balconyKey] = 'None';
      }
      if (state[key] === undefined) {
        state[key] = true;
      }
      const floorFolder = gui.addFolder(`Floor ${index + 1}`);
      floorFolder
        .add(state, windowKey, ['Arch', 'Horizontal Strips', 'Vertical Strips', 'None'])
        .name('Window Coating')
        .onChange(sync);
      floorFolder
        .add(state, balconyKey, ['Arch', 'Horizontal Strips', 'Vertical Strips', 'None'])
        .name('Balcony Coating')
        .onChange(sync);
      floorFolder.add(state, key).name('Balcony Wall').onChange(sync);
      return floorFolder;
    });
  };
  rebuildFloorPanels();

  floorsCtrl.onChange(sync);
  floorHeightCtrl.onChange(sync);
  groundHeightCtrl.onChange(sync);
  roofHeightCtrl.onChange(sync);
  overhangCtrl.onChange(sync);
  setbackCtrl.onChange(sync);
  roofWallHeightCtrl.onChange(sync);
  slabCtrl.onChange(sync);
  windowWidthCtrl.onChange(sync);
  windowTypeCtrl.onChange(sync);
  balconyWindowTypeCtrl.onChange(sync);
  balconyLeftCtrl.onChange(sync);
  balconyRightCtrl.onChange(sync);
  balconyWidthCtrl.onChange(sync);
  balconyRailingCtrl.onChange(sync);
  stripHeightCtrl.onChange(sync);
  stripSpacingCtrl.onChange(sync);
}
