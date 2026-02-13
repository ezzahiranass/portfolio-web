'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import ThemedSurfaceMaterial from '../../../ThemedSurfaceMaterial';
import { useConfiguratorThemePalette } from '../../../theme';

type OutlinedBoxProps = {
  width: number;
  height: number;
  length: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  castShadow?: boolean;
  tone?: 'surface' | 'surfaceAlt' | 'surfaceDark' | 'accent' | 'accent2' | 'muted' | 'glass';
  opacity?: number;
};

const OUTLINE_OPACITY = 0.2;
const OUTLINE_THRESHOLD = 30;

export default function OutlinedBox({
  width,
  height,
  length,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  castShadow = true,
  tone = 'surface',
  opacity = 1,
}: OutlinedBoxProps) {
  const theme = useConfiguratorThemePalette();
  const edges = useMemo(() => {
    const box = new THREE.BoxGeometry(width, height, length);
    const wire = new THREE.EdgesGeometry(box, OUTLINE_THRESHOLD);
    box.dispose();
    return wire;
  }, [width, height, length]);

  useEffect(() => () => edges.dispose(), [edges]);

  return (
    <mesh castShadow={castShadow} position={position} rotation={rotation}>
      <boxGeometry args={[width, height, length]} />
      <ThemedSurfaceMaterial tone={tone} opacity={opacity} transparent={opacity < 1} />
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={theme.lineSoft} transparent opacity={OUTLINE_OPACITY} />
      </lineSegments>
    </mesh>
  );
}
