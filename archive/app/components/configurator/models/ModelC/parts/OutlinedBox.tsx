'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

type OutlinedBoxProps = {
  width: number;
  height: number;
  length: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  castShadow?: boolean;
};

const BOX_COLOR = '#3f3f3f';
const OUTLINE_COLOR = 0xcfcfcf;
const OUTLINE_OPACITY = 0.5;
const OUTLINE_THRESHOLD = 30;

export default function OutlinedBox({
  width,
  height,
  length,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  castShadow = true,
}: OutlinedBoxProps) {
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
      <meshStandardMaterial color={BOX_COLOR} />
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={OUTLINE_COLOR} transparent opacity={OUTLINE_OPACITY} />
      </lineSegments>
    </mesh>
  );
}
