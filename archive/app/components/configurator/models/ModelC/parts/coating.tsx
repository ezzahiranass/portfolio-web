'use client';

import OutlinedBox from './OutlinedBox';

type CoatingProps = {
  y: number;
  x: number;
  z: number;
  width: number;
  length: number;
  height: number;
  rotationY: number;
};

export default function Coating({
  y,
  x,
  z,
  width,
  length,
  height,
  rotationY,
}: CoatingProps) {
  return (
    <group position={[0, y, 0]} rotation={[0, rotationY, 0]}>
      <OutlinedBox
        width={width}
        height={height}
        length={length}
        position={[x, 0, z]}
      />
    </group>
  );
}
