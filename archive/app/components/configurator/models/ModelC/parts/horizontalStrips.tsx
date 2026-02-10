'use client';

import OutlinedBox from './OutlinedBox';

type HorizontalStripsProps = {
  y: number;
  x: number;
  z: number;
  width: number;
  height: number;
  thickness: number;
  spacing: number;
  rotationY: number;
};

export default function HorizontalStrips({
  y,
  x,
  z,
  width,
  height,
  thickness,
  spacing,
  rotationY,
}: HorizontalStripsProps) {
  const unit = thickness + spacing;
  let count = Math.floor(height / unit);
  if (height - count * unit <= 1e-4 && count > 1) {
    count -= 1;
  }
  count = Math.max(1, count);
  const startY = -height / 2 + thickness / 2;

  return (
    <group position={[0, y, 0]} rotation={[0, rotationY, 0]}>
      {Array.from({ length: count }).map((_, index) => (
        <OutlinedBox
          key={`strip-${index}`}
          width={width}
          height={thickness}
          length={thickness}
          position={[x, startY + index * (thickness + spacing), z]}
        />
      ))}
    </group>
  );
}
