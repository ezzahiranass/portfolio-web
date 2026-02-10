'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

/*
Arch profile (2D) + extrusion
- H -> A : left offset
- A (x0, 0) -> B (x0, archBaseY)
- B -> C via half-circle (center at x0 + innerWidth/2, archBaseY, radius = innerWidth/2)
- C -> D (x1, 0)
- D -> E (x1 + offset, 0) flush to total width
- E -> F (x1 + offset, height)
- F -> G (0, height)
- G -> H (0, 0) closes
Extrude along +Z by `thickness`, then center geometry around origin.
*/

type ArchProps = {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  thickness: number;
  rotationY: number;
};

const ARCH_COLOR = '#3f3f3f';
const OUTLINE_COLOR = 0xcfcfcf;
const OUTLINE_OPACITY = 0.5;
const OUTLINE_THRESHOLD = 30;

export default function Arch({
  x,
  y,
  z,
  width,
  height,
  thickness,
  rotationY,
}: ArchProps) {
  const geometry = useMemo(() => {
    const offset = Math.max(width * 0.2, 0.05);
    const innerWidth = Math.max(width - offset * 2, 0.1);
    const radius = innerWidth / 2;
    const archBaseY = Math.max(Math.min(height - radius, height * 0.6), 0);
    const totalWidth = width;
    const x0 = offset;
    const x1 = offset + innerWidth;

    const shape = new THREE.Shape();
    shape.moveTo(0, 0); // H
    shape.lineTo(x0, 0); // A
    shape.lineTo(x0, archBaseY); // B
    shape.absarc(x0 + innerWidth / 2, archBaseY, radius, Math.PI, 0, true); // B -> C (upper half)
    shape.lineTo(x1, 0); // D
    shape.lineTo(totalWidth, 0); // E
    shape.lineTo(totalWidth, height); // F
    shape.lineTo(0, height); // G
    shape.lineTo(0, 0); // H

    const extruded = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: false,
      curveSegments: 16,
    });

    // Center around origin so the group position controls placement cleanly.
    extruded.translate(-totalWidth / 2, -height / 2, -thickness / 2);
    return extruded;
  }, [width, height, thickness]);

  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, OUTLINE_THRESHOLD), [geometry]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      edges.dispose();
    };
  }, [geometry, edges]);

  return (
    <group position={[0, y, 0]} rotation={[0, rotationY, 0]}>
      <mesh castShadow position={[x, 0, z]} geometry={geometry}>
        <meshStandardMaterial color={ARCH_COLOR} />
        <lineSegments geometry={edges}>
          <lineBasicMaterial color={OUTLINE_COLOR} transparent opacity={OUTLINE_OPACITY} />
        </lineSegments>
      </mesh>
    </group>
  );
}
