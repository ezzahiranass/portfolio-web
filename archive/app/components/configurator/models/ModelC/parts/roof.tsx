'use client';

import OutlinedBox from './OutlinedBox';

type RoofProps = {
  totalHeight: number;
  roofHeight: number;
  rotationY: number;
  sizeX: number;
  sizeZ: number;
  overhang: number;
  roofWallHeight: number;
};

export default function Roof({
  totalHeight,
  roofHeight,
  rotationY,
  sizeX,
  sizeZ,
  overhang,
  roofWallHeight,
}: RoofProps) {
  const trimThickness = 0.2;
  const roofDepth = sizeZ + overhang;
  const centerZ = -overhang / 2;
  const sideLengthX = sizeX;
  const sideLengthZ = roofDepth - trimThickness * 2;
  const leftRightZ = roofDepth / 2 - trimThickness / 2;
  const frontBackX = sizeX / 2 - trimThickness / 2;
  const wallY = -roofHeight / 2 + roofWallHeight / 2;

  return (
    <group position={[0, totalHeight - roofHeight / 2, 0]} rotation={[0, rotationY, 0]}>
      <OutlinedBox width={5} height={roofHeight} length={4} />
      <OutlinedBox
        width={sideLengthX}
        height={roofWallHeight}
        length={trimThickness}
        position={[0, wallY, centerZ + leftRightZ]}
      />
      <OutlinedBox
        width={sideLengthX}
        height={roofWallHeight}
        length={trimThickness}
        position={[0, wallY, centerZ - leftRightZ]}
      />
      <OutlinedBox
        width={trimThickness}
        height={roofWallHeight}
        length={sideLengthZ}
        position={[frontBackX, wallY, centerZ]}
      />
      <OutlinedBox
        width={trimThickness}
        height={roofWallHeight}
        length={sideLengthZ}
        position={[-frontBackX, wallY, centerZ]}
      />
    </group>
  );
}
