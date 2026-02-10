'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

type GlassRailingProps = {
  y: number;
  x: number;
  z: number;
  width: number;
  thickness: number;
  rotationY: number;
};

const RAILING_HEIGHT = 0.9;
const GLASS_COLOR = '#3f3f3f';
const GLASS_OPACITY = 0.35;
const OUTLINE_COLOR = 0xcfcfcf;
const OUTLINE_OPACITY = 0.35;
const OUTLINE_THRESHOLD = 30;

export default function GlassRailing({
  y,
  x,
  z,
  width,
  thickness,
  rotationY,
}: GlassRailingProps) {
  const edges = useMemo(() => {
    const box = new THREE.BoxGeometry(width, RAILING_HEIGHT, thickness);
    const wire = new THREE.EdgesGeometry(box, OUTLINE_THRESHOLD);
    box.dispose();
    return wire;
  }, [width, thickness]);

  useEffect(() => () => edges.dispose(), [edges]);

  return (
    <group position={[0, y, 0]} rotation={[0, rotationY, 0]}>
      <mesh position={[x, 0, z]}>
        <boxGeometry args={[width, RAILING_HEIGHT, thickness]} />
        <meshStandardMaterial
          color={GLASS_COLOR}
          transparent
          opacity={GLASS_OPACITY}
        />
        <lineSegments geometry={edges}>
          <lineBasicMaterial
            color={OUTLINE_COLOR}
            transparent
            opacity={OUTLINE_OPACITY}
          />
        </lineSegments>
      </mesh>
    </group>
  );
}
