'use client';

import OutlinedBox from './OutlinedBox';

type VerticalStripsProps = {
  y: number;
  x: number;
  z: number;
  width: number;
  height: number;
  thickness: number;
  spacing: number;
  rotationY: number;
};

export default function VerticalStrips({
  y,
  x,
  z,
  width,
  height,
  thickness,
  spacing,
  rotationY,
}: VerticalStripsProps) {
  const unit = thickness + spacing;
  let count = Math.floor(width / unit);
  if (width - count * unit <= 1e-4 && count > 1) {
    count -= 1;
  }
  count = Math.max(1, count);
  const startX = -width / 2 + thickness / 2;

  return (
    <group position={[0, y, 0]} rotation={[0, rotationY, 0]}>
      {Array.from({ length: count }).map((_, index) => (
        <OutlinedBox
          key={`strip-${index}`}
          width={thickness}
          height={height}
          length={thickness}
          position={[x + startX + index * unit, 0, z]}
        />
      ))}
    </group>
  );
}
