'use client';

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { assetPath } from '@/app/lib/assetPath';

type WindowSmallProps = {
  y: number;
  x: number;
  z: number;
  rotationY: number;
};

export default function WindowSmall({
  y,
  x,
  z,
  rotationY,
}: WindowSmallProps) {
  const { scene } = useGLTF(assetPath('/assets/window_medium.glb'));
  const { center } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const boxCenter = new THREE.Vector3();
    box.getCenter(boxCenter);
    return { center: boxCenter };
  }, [scene]);
  const model = useMemo(() => scene.clone(true), [scene]);

  return (
    <group position={[0, y, 0]} rotation={[0, rotationY, 0]}>
      <primitive object={model} position={[x - center.x, -center.y, z - center.z]} />
    </group>
  );
}

useGLTF.preload(assetPath('/assets/window_medium.glb'));
