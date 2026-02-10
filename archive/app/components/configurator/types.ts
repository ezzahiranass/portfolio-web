'use client';

import type GUI from 'lil-gui';
import type { ReactElement } from 'react';

export type ParamValue = boolean | number | string;
export type ParamValues = Record<string, ParamValue>;

export type ModelDefinition = {
  id: string;
  name: string;
  defaults: ParamValues;
  camera?: {
    position: [number, number, number];
    fov?: number;
  };
  render: (params: ParamValues) => ReactElement;
  buildGui: (
    gui: GUI,
    params: ParamValues,
    onChange: (next: ParamValues) => void
  ) => void;
  buildStats?: (
    gui: GUI,
    params: ParamValues,
    onChange: (next: ParamValues) => void
  ) => void;
};
