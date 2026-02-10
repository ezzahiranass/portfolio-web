'use client';

import OutlinedBox from './OutlinedBox';

type OverhangProps = {
  y: number;
  x: number;
  z: number;
  width: number;
  fullWidth: number;
  length: number;
  height: number;
  rotationY: number;
  balconyLeft: boolean;
  balconyRight: boolean;
  balconyWall: boolean;
};

export default function Overhang({
  y,
  x,
  z,
  width,
  fullWidth,
  length,
  height,
  rotationY,
  balconyLeft,
  balconyRight,
  balconyWall,
}: OverhangProps) {
  const wallThickness = 0.2;
  const wallDepth = length;
  const leftWallX = -fullWidth / 2 + wallThickness / 2;
  const rightWallX = fullWidth / 2 - wallThickness / 2;
  return (
    <group position={[0, y, 0]} rotation={[0, rotationY, 0]}>
      <OutlinedBox width={width} height={height} length={length} position={[x, 0, z]} />
      {balconyWall && balconyLeft ? (
        <OutlinedBox
          width={wallThickness}
          height={height}
          length={wallDepth}
          position={[rightWallX, 0, z]}
        />
      ) : null}
      {balconyWall && balconyRight ? (
        <OutlinedBox
          width={wallThickness}
          height={height}
          length={wallDepth}
          position={[leftWallX, 0, z]}
        />
      ) : null}
    </group>
  );
}
