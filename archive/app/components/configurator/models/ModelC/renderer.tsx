'use client';

import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ParamValues } from '../../types';
import { assetPath } from '@/app/lib/assetPath';
import Roof from './parts/roof';
import Floor from './parts/floor';
import GroundFloor from './parts/groundFloor';
import Overhang from './parts/overhang';
import Slab from './parts/slab';
import Coating from './parts/coating';
import Arch from './parts/arch';
import HorizontalStrips from './parts/horizontalStrips';
import VerticalStrips from './parts/verticalStrips';
import GlassRailing from './parts/glassRailing';
import WindowBig from './parts/windowBig';
import WindowSmall from './parts/windowSmall';

const MAN_MODELS = [
  assetPath('/assets/man1.glb'),
  assetPath('/assets/man2.glb'),
  assetPath('/assets/man3.glb'),
  assetPath('/assets/man4.glb'),
  assetPath('/assets/man5.glb'),
  assetPath('/assets/man6.glb'),
];

type Params = ParamValues & {
  floors: number;
  floorHeight: number;
  groundFloorHeight: number;
  roofHeight: number;
  rotationY: number;
  overhang: number;
  roofWallHeight: number;
  slabThickness: number;
  balconyLeft: boolean;
  balconyRight: boolean;
  balconyWidth: number;
  balconyRailing: string;
  windowWidth: number;
  window_type: string;
  balcony_window_type: string;
  stripHeight: number;
  stripSpacing: number;
  setback: number;
};

type HumanModelProps = {
  src: string;
  position: [number, number, number];
  rotationY: number;
  scale?: number;
};

type GroundAssetProps = {
  src: string;
  position: [number, number, number];
  rotationY: number;
  scale?: number | [number, number, number];
  materialTone?: 'default' | 'black';
  rotateInPlace?: boolean;
  localRotationY?: number;
  localScale?: [number, number, number];
};

function GroundAsset({
  src,
  position,
  rotationY,
  scale = 1,
  materialTone = 'default',
  rotateInPlace = false,
  localRotationY = 0,
  localScale,
}: GroundAssetProps) {
  const { scene } = useGLTF(src);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const materialColor = useMemo(
    () => (materialTone === 'black' ? new THREE.Color('#111111') : null),
    [materialTone]
  );
  const localCenter = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    box.getCenter(center);
    return center;
  }, [cloned]);

  useEffect(() => {
    cloned.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const material = child.material;
      if (Array.isArray(material)) {
        material.forEach((mat) => {
          if (materialColor && 'color' in mat) {
            (mat as THREE.MeshStandardMaterial).color.copy(materialColor);
            (mat as THREE.MeshStandardMaterial).roughness = 0.7;
            (mat as THREE.MeshStandardMaterial).metalness = 0.05;
          }
          mat.polygonOffset = true;
          mat.polygonOffsetFactor = 1;
          mat.polygonOffsetUnits = 1;
        });
      } else if (material) {
        if (materialColor && 'color' in material) {
          (material as THREE.MeshStandardMaterial).color.copy(materialColor);
          (material as THREE.MeshStandardMaterial).roughness = 0.7;
          (material as THREE.MeshStandardMaterial).metalness = 0.05;
        }
        material.polygonOffset = true;
        material.polygonOffsetFactor = 1;
        material.polygonOffsetUnits = 1;
      }

      if (child.geometry) {
        const wireGeom = new THREE.EdgesGeometry(child.geometry, 50);
        const wireMat = new THREE.LineBasicMaterial({
          color: 0xcfcfcf,
          transparent: true,
          opacity: 0.25,
        });
        const wireframe = new THREE.LineSegments(wireGeom, wireMat);
        wireframe.name = '__wireframe_overlay';
        wireframe.renderOrder = 1;
        child.add(wireframe);
      }
    });

    return () => {
      cloned.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        child.children
          .filter((node) => node.name === '__wireframe_overlay')
          .forEach((node) => {
            child.remove(node);
            const line = node as THREE.LineSegments;
            line.geometry.dispose();
            if (Array.isArray(line.material)) {
              line.material.forEach((mat) => mat.dispose());
            } else {
              line.material.dispose();
            }
          });
      });
    };
  }, [cloned]);

  if (rotateInPlace) {
    const centerOffset = new THREE.Vector3(-localCenter.x, 0, -localCenter.z);
    const innerScale = localScale ?? [1, 1, 1];
    return (
      <group position={[0, position[1], 0]} rotation={[0, rotationY, 0]} scale={scale}>
        <group position={[position[0], 0, position[2]]}>
          <group rotation={[0, localRotationY, 0]} scale={innerScale}>
            <group position={[centerOffset.x, centerOffset.y, centerOffset.z]}>
              <primitive object={cloned} />
            </group>
          </group>
        </group>
      </group>
    );
  }

  return (
    <group position={[0, position[1], 0]} rotation={[0, rotationY, 0]} scale={scale}>
      <group position={[position[0], 0, position[2]]} scale={localScale ?? [1, 1, 1]}>
        <primitive object={cloned} />
      </group>
    </group>
  );
}

function HumanModel({
  src,
  position,
  rotationY,
  scale = 1,
}: HumanModelProps) {
  const { scene } = useGLTF(src);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const replacement = new THREE.MeshStandardMaterial({
          color: '#ffffff',
          roughness: 0.7,
          metalness: 0.0,
        });
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
        child.material = replacement;
      }
    });
  }, [cloned]);

  return (
    <group position={[0, position[1], 0]} rotation={[0, rotationY, 0]} scale={scale}>
      <group position={[position[0], 0, position[2]]}>
        <primitive object={cloned} />
      </group>
    </group>
  );
}

export function ModelCRenderer({ params }: { params: ParamValues }) {
  const typed = params as Params;
  const { scene } = useGLTF(assetPath('/assets/city_rabat.glb'));
  const defaultMaterialColor = new THREE.Color('#3f3f3f');
  const wireframeColor = 0x333333;
  const rotationY = (typed.rotationY * Math.PI) / 180;
  const sizeX = 17.5;
  const slabCount = typed.floors + 1;
  const baseHeight = typed.groundFloorHeight
    + typed.floors * typed.floorHeight
    + slabCount * typed.slabThickness;
  const totalHeight = baseHeight + typed.roofHeight;
  const sizeZBase = 13.1;
  const sizeZ = Math.max(sizeZBase * (1 - typed.setback / 3), 0.1);
  const sizeZDeduction = sizeZBase - sizeZ;
  const setbackEffective = Math.min(Math.max(typed.setback + sizeZDeduction, 1), 4.5) +1.25;
  const zOffset = sizeZDeduction / 2;
  const zOffsetX = Math.sin(rotationY) * zOffset;
  const zOffsetZ = Math.cos(rotationY) * zOffset;
  const overhangLength = typed.overhang;
  const overhangZ = -sizeZ / 2 - overhangLength / 2;
  const coatingThickness = 0.1;
  const coatingZ = -sizeZ / 2 - typed.overhang - coatingThickness / 2;
  const coatingHeight = typed.floors * typed.floorHeight
    + typed.floors * typed.slabThickness
    + typed.roofWallHeight;
  const coatingY = typed.groundFloorHeight + coatingHeight / 2;
  const balconyLeft = typed.balconyLeft ? typed.balconyWidth : 0;
  const balconyRight = typed.balconyRight ? typed.balconyWidth : 0;
  const overhangWidth = Math.max(sizeX - balconyLeft - balconyRight, 0.1);
  const overhangX = (balconyRight - balconyLeft) / 2;
  const coatingSegmentWidth = Math.max((overhangWidth - 2 * typed.windowWidth) / 3, 0.1);
  const coatingX1 = -overhangWidth / 2 + coatingSegmentWidth / 2;
  const coatingX2 = coatingX1 + coatingSegmentWidth + typed.windowWidth;
  const coatingX3 = coatingX2 + coatingSegmentWidth + typed.windowWidth;
  const archThickness = coatingThickness;
  const archWidth = typed.windowWidth;
  const archHeight = typed.floorHeight + typed.slabThickness;
  const archGapX1 = coatingX1 + coatingSegmentWidth / 2 + typed.windowWidth / 2;
  const archGapX2 = coatingX2 + coatingSegmentWidth / 2 + typed.windowWidth / 2;
  const archBalconyXLeft = -sizeX / 2 + typed.balconyWidth / 2;
  const archBalconyXRight = sizeX / 2 - typed.balconyWidth / 2;
  const balconyArchCount = typed.balconyWidth > 2.5 ? 2 : 1;
  const balconyArchGap = 0;
  const balconyArchWidth = balconyArchCount === 1
    ? Math.max(typed.balconyWidth - 0.1, 0.2)
    : Math.max((typed.balconyWidth - balconyArchGap) / 2, 0.2);
  const balconyArchOffsets = balconyArchCount === 1
    ? [0]
    : [-(balconyArchWidth / 2 + balconyArchGap / 2), (balconyArchWidth / 2 + balconyArchGap / 2)];
  const slabLength = sizeZ + typed.overhang;
  const slabOffsetZ = -typed.overhang / 2;
  const stripThickness = typed.stripHeight;
  const stripSpacing = typed.stripSpacing;
  const railingThickness = 0.05;
  const railingHeight = 0.9;
  const railingZ = overhangZ - overhangLength / 2 + railingThickness / 2;
  const windowZ = -sizeZ / 2 - typed.overhang + 0.02;
  const balconyWindowZ = -sizeZ / 2 + 0.02;
  const frontDoorX = -2  + sizeX / 2;
  const leftEdgeX = 1 -sizeX / 2;
  const garageRightLimit = frontDoorX - 2;
  const garageSpan = Math.max(garageRightLimit - leftEdgeX, 0.1);
  const garageDoorX1 = leftEdgeX + garageSpan * (1 / 6);
  const garageDoorX2 = leftEdgeX + garageSpan * (3 / 6);
  const garageDoorX3 = leftEdgeX + garageSpan * (5 / 6);
  const garageDoorScaleY = Math.max(typed.groundFloorHeight/2, 0.1);
  const awningY = Math.max(typed.groundFloorHeight, 0);
  const potXLeft = -4 + sizeX / 2;
  const potXRight = -garageDoorX3 - 4.8;
  const plantPotPlacements = useMemo(() => {
    const placements: Array<{ key: string; position: [number, number, number] }> = [];
    const baseZ =-1.2 - sizeZ / 2;
    const spacingZ = 2.3;
    const rows = Math.max(1, Math.min(4, Math.floor(setbackEffective / spacingZ) + 1));
    for (let i = 0; i < rows; i += 1) {
      const z = baseZ - i * spacingZ;
      placements.push({ key: `pot-left-${i}`, position: [potXLeft, 0, z] });
      placements.push({ key: `pot-right-${i}`, position: [potXRight, 0, z] });
    }
    return placements;
  }, [potXLeft, potXRight, sizeZ, setbackEffective]);
  const lastPotPlacements = useMemo(() => {
    const baseZ = -1.2 - sizeZ / 2;
    const spacingZ = 2.3;
    const rows = Math.max(1, Math.min(4, Math.floor(setbackEffective / spacingZ) + 1));
    const lastZ = baseZ - rows * spacingZ +0.8;
    return [
      { key: 'last-pot-left', position: [potXLeft-0.9, 0, lastZ] as [number, number, number] },
      { key: 'last-pot-right', position: [potXRight+0.9, 0, lastZ] as [number, number, number] },
      { key: 'last-pot-left-2', position: [potXLeft-0.9-2.2, 0, lastZ] as [number, number, number] },
      { key: 'last-pot-right-2', position: [potXRight+0.9+2.2, 0, lastZ] as [number, number, number] },
      // { key: 'last-pot-left-3', position: [potXLeft-0.9-2.2-2.2, 0, lastZ] as [number, number, number] },
      // { key: 'last-pot-right-3', position: [potXRight+0.9+2.2+2.2, 0, lastZ] as [number, number, number] },
    ];
  }, [potXLeft, potXRight, sizeZ, setbackEffective]);
  const tablePlacements = useMemo(() => {
    const placements: Array<{ key: string; position: [number, number, number] }> = [];
    const xMin = 2-sizeX / 2;
    const xMax = -5.5+sizeX / 2;
    const zMax = -1.5-sizeZ / 2;
    const zMin = -sizeZ / 2 - setbackEffective;
    const tableSpacingZ = 2.0;
    const zSpan = Math.max(zMax - zMin, 0);
    const cols = Math.max(2, Math.min(4, Math.floor(zSpan / tableSpacingZ) + 1));
    const xSpan = xMax - xMin;
    const xPositions: [number, number, number] = [
      xMin + xSpan * 0.2,
      xMin + xSpan * 0.5,
      xMin + xSpan * 0.8,
    ];
    for (let col = 0; col < cols; col += 1) {
      const z = zMax - col * tableSpacingZ;
      if (z < zMin - 0.001) break;
      for (let row = 0; row < 3; row += 1) {
        const jitterX = (Math.random() - 0.5) * 0.4;
        const jitterZ = (Math.random() - 0.5) * 0.2;
        placements.push({
          key: `table-${row}-${col}`,
          position: [xPositions[row] + jitterX, 0, z + jitterZ],
        });
      }
    }
    return placements;
  }, [sizeX, sizeZ, setbackEffective]);
  const humanPlacements = useMemo(() => {
    if (typed.overhang < 0.4) return [];
    const placements: Array<HumanModelProps & { key: string }> = [];
    const balconySurface = typed.overhang * typed.balconyWidth;
    const maxPeople = Math.min(Math.floor(balconySurface / 1.2), 6);
    if (maxPeople < 1) return [];
    const pickModel = () => MAN_MODELS[Math.floor(Math.random() * MAN_MODELS.length)];
    const randomCount = () => 1 + Math.floor(Math.random() * maxPeople);
    const xMargin = Math.max(typed.balconyWidth * 0.15, 0.2);
    const zMargin = Math.max(typed.overhang * 0.15, 0.15);
    const xJitterRange = Math.max(typed.balconyWidth / 2 - xMargin, 0);
    const humanOverhangZ = -overhangZ;
    const zMin = humanOverhangZ - typed.overhang / 2 + zMargin;
    const zMax = humanOverhangZ + typed.overhang / 2 - zMargin;

    for (let index = 0; index < typed.floors; index += 1) {
      const slabBaseY = typed.groundFloorHeight
        + index * (typed.floorHeight + typed.slabThickness);
      const floorBaseY = slabBaseY + typed.slabThickness;
      const y = floorBaseY + 0.02;
      if (typed.balconyLeft) {
        const count = randomCount();
        for (let i = 0; i < count; i += 1) {
          const x = archBalconyXLeft + (Math.random() - 0.5) * 2 * xJitterRange;
          const z = zMin + Math.random() * (zMax - zMin);
          placements.push({
            key: `human-left-${index}-${i}`,
            src: pickModel(),
            position: [x, y, z],
            rotationY: rotationY + Math.PI,
          });
        }
      }
      if (typed.balconyRight) {
        const count = randomCount();
        for (let i = 0; i < count; i += 1) {
          const x = archBalconyXRight + (Math.random() - 0.5) * 2 * xJitterRange;
          const z = zMin + Math.random() * (zMax - zMin);
          placements.push({
            key: `human-right-${index}-${i}`,
            src: pickModel(),
            position: [x, y, z],
            rotationY: rotationY + Math.PI,
          });
        }
      }
    }

    return placements;
  }, [
    typed.overhang,
    typed.floors,
    typed.groundFloorHeight,
    typed.floorHeight,
    typed.slabThickness,
    typed.balconyLeft,
    typed.balconyRight,
    typed.balconyWidth,
    archBalconyXLeft,
    archBalconyXRight,
    overhangZ,
    rotationY,
  ]);
  useEffect(() => {
    const overlayGroup = new THREE.Group();
    scene.traverse((child: any) => {
      if (!(child instanceof THREE.Mesh)) return;
      const material = child.material;
      const applyDefaultMaterial = (mat: THREE.Material) => {
        const colored = mat as THREE.MeshStandardMaterial;
        if (colored.color) {
          colored.color.copy(defaultMaterialColor);
        }
        colored.transparent = true;
        colored.opacity = 0.5;
        colored.depthWrite = false;
      };
      if (Array.isArray(material)) {
        material.forEach((mat) => {
          applyDefaultMaterial(mat);
          mat.polygonOffset = true;
          mat.polygonOffsetFactor = 1;
          mat.polygonOffsetUnits = 1;
        });
      } else if (material) {
        applyDefaultMaterial(material);
        material.polygonOffset = true;
        material.polygonOffsetFactor = 1;
        material.polygonOffsetUnits = 1;
      }

      if (child.geometry) {
        const wireGeom = new THREE.EdgesGeometry(child.geometry, 30);
        const wireMat = new THREE.LineBasicMaterial({
          color: wireframeColor,
          polygonOffset: true,
          polygonOffsetFactor: 2,
          polygonOffsetUnits: 4,
        });
        const wireframe = new THREE.LineSegments(wireGeom, wireMat);
        wireframe.name = '__wireframe_overlay';
        wireframe.renderOrder = 1;
        child.add(wireframe);
      }
    });

    scene.add(overlayGroup);

    return () => {
      scene.traverse((child: any) => {
        if (!(child instanceof THREE.Mesh)) return;
        child.children
          .filter((node) => node.name === '__wireframe_overlay')
          .forEach((node) => {
            child.remove(node);
            const line = node as THREE.LineSegments;
            line.geometry.dispose();
            if (Array.isArray(line.material)) {
              line.material.forEach((mat) => mat.dispose());
            } else {
              line.material.dispose();
            }
          });
      });
      scene.remove(overlayGroup);
    };
  }, [scene]);

  return (
    <>
      <primitive object={scene} position={[0, -0.45, 0]} />
      <group position={[zOffsetX, 0, zOffsetZ]}>
      <GroundAsset
        src={assetPath('/assets/door1.glb')}
        position={[frontDoorX, 0, -sizeZ / 2]}
        rotationY={rotationY}
      />
      <GroundAsset
        src={assetPath('/assets/garage_door.glb')}
        position={[garageDoorX1, 0, -sizeZ / 2]}
        rotationY={rotationY}
        scale={[1, garageDoorScaleY/2.5, 1]}
      />
      <GroundAsset
        src={assetPath('/assets/garage_door.glb')}
        position={[garageDoorX2, 0, -sizeZ / 2]}
        rotationY={rotationY}
        scale={[1, garageDoorScaleY/2.5, 1]}
      />
      <GroundAsset
        src={assetPath('/assets/garage_door.glb')}
        position={[garageDoorX3, 0, -sizeZ / 2]}
        rotationY={rotationY}
        scale={[1, garageDoorScaleY/2.5, 1]}
      />
      <GroundAsset
        src={assetPath('/assets/awning.glb')}
        position={[garageDoorX2, awningY-1.7, -sizeZ / 2]}
        rotationY={rotationY}
        materialTone="black"
        localScale={[1, 1, setbackEffective]}
        rotateInPlace
      />
      {plantPotPlacements.map((pot) => (
        <GroundAsset
          key={pot.key}
          src={assetPath('/assets/plant_pot.glb')}
          position={pot.position}
          rotationY={rotationY}
          materialTone="black"
        />
      ))}
      {lastPotPlacements.map((pot) => (
        <GroundAsset
          key={pot.key}
          src={assetPath('/assets/plant_pot.glb')}
          position={pot.position}
          rotationY={rotationY}
          localRotationY={Math.PI / 2}
          materialTone="black"
          rotateInPlace
        />
      ))}
      {tablePlacements.map((table) => (
        <GroundAsset
          key={table.key}
          src={assetPath('/assets/table_4.glb')}
          position={table.position}
          rotationY={rotationY}
          materialTone="black"
        />
      ))}
      <GroundFloor
        width={sizeX}
        length={sizeZ}
        height={typed.groundFloorHeight}
        rotationY={rotationY}
      />
      {Array.from({ length: typed.floors }).map((_, index) => {
        const slabBaseY = typed.groundFloorHeight
          + index * (typed.floorHeight + typed.slabThickness);
        const floorBaseY = slabBaseY + typed.slabThickness;
        const floorBalconyWall = typed[`balconyWall_${index}`] !== false;
        const floorBalconyCoating = (typed[`balconyCoating_${index}`] as string | undefined) ?? 'None';
        const floorWindowCoating = (typed[`windowCoating_${index}`] as string | undefined) ?? 'None';
        const floorWindowType = typed.window_type ?? 'Big';
        const balconyWindowType = typed.balcony_window_type ?? 'Big';
        const railingY = slabBaseY + typed.slabThickness + railingHeight / 2;

        return (
        <group key={`floor-${index}`}>
          <Floor
            y={floorBaseY + typed.floorHeight / 2}
            z={0}
            width={sizeX}
            length={sizeZ}
            height={typed.floorHeight}
            rotationY={rotationY}
          />
          <Overhang
            y={floorBaseY + typed.floorHeight / 2}
            x={overhangX}
            z={overhangZ}
            width={overhangWidth}
            fullWidth={sizeX}
            length={overhangLength}
            height={typed.floorHeight}
            rotationY={rotationY}
            balconyLeft={typed.balconyLeft}
            balconyRight={typed.balconyRight}
            balconyWall={floorBalconyWall}
          />
          {typed.balconyRailing === 'Glass' && typed.balconyLeft ? (
            <GlassRailing
              x={archBalconyXRight}
              y={railingY}
              z={railingZ}
              width={typed.balconyWidth}
              thickness={railingThickness}
              rotationY={rotationY}
            />
          ) : null}
          {typed.balconyRailing === 'Glass' && typed.balconyRight ? (
            <GlassRailing
              x={archBalconyXLeft}
              y={railingY}
              z={railingZ}
              width={typed.balconyWidth}
              thickness={railingThickness}
              rotationY={rotationY}
            />
          ) : null}
          <Slab
            y={slabBaseY + typed.slabThickness / 2 + 0.01}
            z={slabOffsetZ}
            width={sizeX}
            length={slabLength}
            height={typed.slabThickness}
            rotationY={rotationY}
          />
          {floorWindowType === 'Big' ? (
            <>
              <WindowBig
                x={overhangX + archGapX1}
                y={slabBaseY + archHeight / 2}
                z={windowZ}
                width={archWidth}
                height={archHeight}
                rotationY={rotationY}
              />
              <WindowBig
                x={overhangX + archGapX2}
                y={slabBaseY + archHeight / 2}
                z={windowZ}
                width={archWidth}
                height={archHeight}
                rotationY={rotationY}
              />
              {typed.balconyLeft && balconyWindowType === 'Big' ? (
                <WindowBig
                  x={archBalconyXRight}
                  y={slabBaseY + archHeight / 2}
                  z={balconyWindowZ}
                  width={typed.balconyWidth}
                  height={archHeight}
                  rotationY={rotationY}
                />
              ) : null}
              {typed.balconyRight && balconyWindowType === 'Big' ? (
                <WindowBig
                  x={archBalconyXLeft}
                  y={slabBaseY + archHeight / 2}
                  z={balconyWindowZ}
                  width={typed.balconyWidth}
                  height={archHeight}
                  rotationY={rotationY}
                />
              ) : null}
            </>
          ) : null}
          {floorWindowType === 'Small' ? (
            <>
              <WindowSmall
                x={overhangX + archGapX1}
                y={slabBaseY + archHeight / 2}
                z={windowZ}
                rotationY={rotationY}
              />
              <WindowSmall
                x={overhangX + archGapX2}
                y={slabBaseY + archHeight / 2}
                z={windowZ}
                rotationY={rotationY}
              />
              {typed.balconyLeft && balconyWindowType === 'Small' ? (
                <WindowSmall
                  x={archBalconyXRight}
                  y={slabBaseY + archHeight / 2}
                  z={balconyWindowZ}
                  rotationY={rotationY}
                />
              ) : null}
              {typed.balconyRight && balconyWindowType === 'Small' ? (
                <WindowSmall
                  x={archBalconyXLeft}
                  y={slabBaseY + archHeight / 2}
                  z={balconyWindowZ}
                  rotationY={rotationY}
                />
              ) : null}
            </>
          ) : null}
          {balconyWindowType === 'Big' && floorWindowType !== 'Big' ? (
            <>
              {typed.balconyLeft ? (
                <WindowBig
                  x={archBalconyXRight}
                  y={slabBaseY + archHeight / 2}
                  z={balconyWindowZ}
                  width={typed.balconyWidth}
                  height={archHeight}
                  rotationY={rotationY}
                />
              ) : null}
              {typed.balconyRight ? (
                <WindowBig
                  x={archBalconyXLeft}
                  y={slabBaseY + archHeight / 2}
                  z={balconyWindowZ}
                  width={typed.balconyWidth}
                  height={archHeight}
                  rotationY={rotationY}
                />
              ) : null}
            </>
          ) : null}
          {balconyWindowType === 'Small' && floorWindowType !== 'Small' ? (
            <>
              {typed.balconyLeft ? (
                <WindowSmall
                  x={archBalconyXRight}
                  y={slabBaseY + archHeight / 2}
                  z={balconyWindowZ}
                  rotationY={rotationY}
                />
              ) : null}
              {typed.balconyRight ? (
                <WindowSmall
                  x={archBalconyXLeft}
                  y={slabBaseY + archHeight / 2}
                  z={balconyWindowZ}
                  rotationY={rotationY}
                />
              ) : null}
            </>
          ) : null}
          {floorWindowCoating === 'Arch' ? (
            <>
              <Arch
                x={overhangX + archGapX1}
                y={slabBaseY + archHeight / 2}
                z={coatingZ}
                width={archWidth}
                height={archHeight}
                thickness={archThickness}
                rotationY={rotationY}
              />
              <Arch
                x={overhangX + archGapX2}
                y={slabBaseY + archHeight / 2}
                z={coatingZ}
                width={archWidth}
                height={archHeight}
                thickness={archThickness}
                rotationY={rotationY}
              />
            </>
          ) : null}
          {floorWindowCoating === 'Horizontal Strips' ? (
            <>
              <HorizontalStrips
                x={overhangX + archGapX1}
                y={slabBaseY + archHeight / 2}
                z={coatingZ}
                width={archWidth}
                height={archHeight}
                thickness={stripThickness}
                spacing={stripSpacing}
                rotationY={rotationY}
              />
              <HorizontalStrips
                x={overhangX + archGapX2}
                y={slabBaseY + archHeight / 2}
                z={coatingZ}
                width={archWidth}
                height={archHeight}
                thickness={stripThickness}
                spacing={stripSpacing}
                rotationY={rotationY}
              />
            </>
          ) : null}
          {floorWindowCoating === 'Vertical Strips' ? (
            <>
              <VerticalStrips
                x={overhangX + archGapX1}
                y={slabBaseY + archHeight / 2}
                z={coatingZ}
                width={archWidth}
                height={archHeight}
                thickness={stripThickness}
                spacing={stripSpacing}
                rotationY={rotationY}
              />
              <VerticalStrips
                x={overhangX + archGapX2}
                y={slabBaseY + archHeight / 2}
                z={coatingZ}
                width={archWidth}
                height={archHeight}
                thickness={stripThickness}
                spacing={stripSpacing}
                rotationY={rotationY}
              />
            </>
          ) : null}
          {floorBalconyCoating === 'Arch' && typed.balconyLeft
            ? balconyArchOffsets.map((offset) => (
              <Arch
                key={`balcony-left-${index}-${offset}`}
                x={archBalconyXRight + offset}
                y={slabBaseY + archHeight / 2}
                z={coatingZ}
                width={balconyArchWidth}
                height={archHeight}
                thickness={archThickness}
                rotationY={rotationY}
              />
            ))
            : null}
          {floorBalconyCoating === 'Horizontal Strips' && typed.balconyLeft ? (
            <HorizontalStrips
              x={archBalconyXRight}
              y={slabBaseY + archHeight / 2}
              z={coatingZ}
              width={typed.balconyWidth}
              height={archHeight}
              thickness={stripThickness}
              spacing={stripSpacing}
              rotationY={rotationY}
            />
          ) : null}
          {floorBalconyCoating === 'Vertical Strips' && typed.balconyLeft ? (
            <VerticalStrips
              x={archBalconyXRight}
              y={slabBaseY + archHeight / 2}
              z={coatingZ}
              width={typed.balconyWidth}
              height={archHeight}
              thickness={stripThickness}
              spacing={stripSpacing}
              rotationY={rotationY}
            />
          ) : null}
          {floorBalconyCoating === 'Arch' && typed.balconyRight
            ? balconyArchOffsets.map((offset) => (
              <Arch
                key={`balcony-right-${index}-${offset}`}
                x={archBalconyXLeft + offset}
                y={slabBaseY + archHeight / 2}
                z={coatingZ}
                width={balconyArchWidth}
                height={archHeight}
                thickness={archThickness}
                rotationY={rotationY}
              />
            ))
            : null}
          {floorBalconyCoating === 'Horizontal Strips' && typed.balconyRight ? (
            <HorizontalStrips
              x={archBalconyXLeft}
              y={slabBaseY + archHeight / 2}
              z={coatingZ}
              width={typed.balconyWidth}
              height={archHeight}
              thickness={stripThickness}
              spacing={stripSpacing}
              rotationY={rotationY}
            />
          ) : null}
          {floorBalconyCoating === 'Vertical Strips' && typed.balconyRight ? (
            <VerticalStrips
              x={archBalconyXLeft}
              y={slabBaseY + archHeight / 2}
              z={coatingZ}
              width={typed.balconyWidth}
              height={archHeight}
              thickness={stripThickness}
              spacing={stripSpacing}
              rotationY={rotationY}
            />
          ) : null}
        </group>
        );
      })}
      <Coating
        y={coatingY}
        x={overhangX + coatingX1}
        z={coatingZ}
        width={coatingSegmentWidth}
        length={coatingThickness}
        height={coatingHeight}
        rotationY={rotationY}
      />
      <Coating
        y={coatingY}
        x={overhangX + coatingX2}
        z={coatingZ}
        width={coatingSegmentWidth}
        length={coatingThickness}
        height={coatingHeight}
        rotationY={rotationY}
      />
      <Coating
        y={coatingY}
        x={overhangX + coatingX3}
        z={coatingZ}
        width={coatingSegmentWidth}
        length={coatingThickness}
        height={coatingHeight}
        rotationY={rotationY}
      />
      <Slab
        y={
          typed.groundFloorHeight
          + typed.floors * typed.floorHeight
          + typed.floors * typed.slabThickness
          + typed.slabThickness / 2
        }
        z={slabOffsetZ}
        width={sizeX}
        length={slabLength}
        height={typed.slabThickness}
        rotationY={rotationY}
      />
      <Roof
        totalHeight={totalHeight}
        roofHeight={typed.roofHeight}
        rotationY={rotationY}
        sizeX={sizeX}
        sizeZ={sizeZ}
        overhang={typed.overhang}
        roofWallHeight={typed.roofWallHeight}
      />
      {humanPlacements.map((human) => (
        <HumanModel
          key={human.key}
          src={human.src}
          position={human.position}
          rotationY={human.rotationY}
          scale={human.scale}
        />
      ))}
      </group>
    </>
  );
}

useGLTF.preload(assetPath('/assets/city_rabat.glb'));
useGLTF.preload(assetPath('/assets/door1.glb'));
useGLTF.preload(assetPath('/assets/garage_door.glb'));
useGLTF.preload(assetPath('/assets/awning.glb'));
useGLTF.preload(assetPath('/assets/plant_pot.glb'));
useGLTF.preload(assetPath('/assets/table_4.glb'));
MAN_MODELS.forEach((model) => useGLTF.preload(model));
