'use client';

import Floor from './floor';

type GroundFloorProps = {
  width: number;
  length: number;
  height: number;
  rotationY: number;
};

export default function GroundFloor({
  width,
  length,
  height,
  rotationY,
}: GroundFloorProps) {
  return (
    <Floor
      y={height / 2}
      z={0}
      width={width}
      length={length}
      height={height}
      rotationY={rotationY}
    />
  );
}
