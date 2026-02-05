'use client';

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { assetPath } from '@/app/lib/assetPath';

type WindowBigProps = {
  y: number;
  x: number;
  z: number;
  width: number;
  height: number;
  rotationY: number;
};

export default function WindowBig({
  y,
  x,
  z,
  width,
  height,
  rotationY,
}: WindowBigProps) {
  const { scene } = useGLTF(assetPath('/assets/window_big.glb'));
  const { size, center } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const boxSize = new THREE.Vector3();
    const boxCenter = new THREE.Vector3();
    box.getSize(boxSize);
    box.getCenter(boxCenter);
    return { size: boxSize, center: boxCenter };
  }, [scene]);
  const model = useMemo(() => scene.clone(true), [scene]);
  const scaleX = width / size.x;
  const scaleY = height / size.y;
  const scaleZ = scaleX;

  return (
    <group position={[0, y, 0]} rotation={[0, rotationY, 0]}>
      <group position={[x, 0, z]} scale={[scaleX, scaleY, scaleZ]}>
        <primitive object={model} position={[-center.x, -center.y, -center.z]} />
      </group>
    </group>
  );
}

useGLTF.preload(assetPath('/assets/window_big.glb'));
