'use client';

import OutlinedBox from './OutlinedBox';

type FloorProps = {
  y: number;
  z: number;
  width: number;
  length: number;
  height: number;
  rotationY: number;
};

export default function Floor({
  y,
  z,
  width,
  length,
  height,
  rotationY,
}: FloorProps) {
  return (
    <group position={[0, y, 0]} rotation={[0, rotationY, 0]}>
      <OutlinedBox width={width} height={height} length={length} position={[0, 0, z]} />
    </group>
  );
}
