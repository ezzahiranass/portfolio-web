"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, OrbitControls, Text, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Layers3, SlidersHorizontal } from "lucide-react";
import { assetPath } from "../../lib/assetPath";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";

type ViewerControls = {
  groundFloors: number;
  firstTowerFloors: number;
  secondTowerFloors: number;
  firstTowerGreenery: number;
  secondTowerGreenery: number;
  peopleCount: number;
  peopleSeed: number;
  floorHeight: number;
  slabThickness: number;
  topNotchWidth: number;
  topNotchDepth: number;
  bottomNotchDepth: number;
};

type HeroCubeViewerProps = {
  initialControls?: Partial<ViewerControls>;
  showControls?: boolean;
};

type ControlSpec = {
  key: keyof ViewerControls;
  label: string;
  min: number;
  max: number;
  step: number;
  digits: number;
};

const EDGE_THRESHOLD_DEG = 20;
const BASE_HALF_WIDTH = 33.6;
const BASE_HALF_DEPTH = 21.2;
const TOWER_WIDTH = 15.2;
const TOWER_DEPTH = BASE_HALF_DEPTH * 1.72;
const TOWER_ROTATION_Y = -0.00;
const TOWER_OFFSET_X = BASE_HALF_WIDTH - 5.9;
const TOWER_OFFSET_Z = -0.25;
const TOWER_PODIUM_SCALE_X = 2.55;
const TOWER_PODIUM_SCALE_Z = 1.35;
const SECOND_TOWER_WIDTH = TOWER_WIDTH * 0.78;
const SECOND_TOWER_DEPTH = TOWER_DEPTH * 0.82;
const SECOND_TOWER_ROTATION_Y = TOWER_ROTATION_Y;
const MEDIAN_BLOCK_WIDTH = 5;
const MEDIAN_BLOCK_LENGTH_OFFSET = 1.2;
const COLUMN_SIZE = 0.5;
const COLUMN_INSET = 2;
const BASE_COLOR = "#8b9cff";
const BASE_OPACITY = 0.05;
const EDGE_COLOR = "#ffffff";
const EDGE_OPACITY = 0.1;
const LAYER_GREEN_COLOR = "#4ddb76";
const LAYER_CIRCULATION_COLOR = "#ff5b5b";
const LAYER_HOTEL_COLOR = "#ffffff";
const LAYER_EVENT_HALL_COLOR = "#ffd84d";
const LAYER_RECEPTION_COLOR = "#ff8a3d";
const LAYER_COMMERCIAL_COLOR = "#8a62ff";
const LAYER_SHARED_COLOR = "#4da3ff";
const OUTLINE_COLOR = "#ffffff";
const OUTLINE_STRENGTH = 1.5;
const OUTLINE_THICKNESS = 0.2;
const OUTLINE_GLOW = 0.0;
const CAMERA_FIT_PADDING = 2;
const CAMERA_FIT_ELEVATION = Math.PI / 4;
const DEFAULT_CAMERA_TARGET: [number, number, number] = [-0.383, 60.347, 16.501];
const DEFAULT_ORTHOGRAPHIC_CAMERA_POSITION: [number, number, number] = [-83.557, 193.876, 102.245];
const DEFAULT_ORTHOGRAPHIC_CAMERA_ZOOM = 2;
const DEFAULT_PERSPECTIVE_CAMERA_POSITION: [number, number, number] = [50, 20, 100];

const defaultControls: ViewerControls = {
  groundFloors: 4,
  firstTowerFloors: 18,
  secondTowerFloors: 24,
  firstTowerGreenery: 3,
  secondTowerGreenery: 4,
  peopleCount: 100,
  peopleSeed: 1,
  floorHeight: 3.2,
  slabThickness: 0.35,
  topNotchWidth: 15.1,
  topNotchDepth: 10.45,
  bottomNotchDepth: 18.1,
};

const controlConfig: ControlSpec[] = [
  { key: "groundFloors", label: "Ground Floors", min: 2, max: 5, step: 1, digits: 0 },
  { key: "firstTowerFloors", label: "First Tower Floors", min: 7, max: 30, step: 1, digits: 0 },
  { key: "secondTowerFloors", label: "Second Tower Floors", min: 8, max: 25, step: 1, digits: 0 },
  { key: "firstTowerGreenery", label: "First Tower Greenery", min: 0, max: 12, step: 1, digits: 0 },
  { key: "secondTowerGreenery", label: "Second Tower Greenery", min: 0, max: 12, step: 1, digits: 0 },
  { key: "peopleCount", label: "People", min: 15, max: 200, step: 1, digits: 0 },
  { key: "peopleSeed", label: "People Seed", min: 1, max: 999, step: 1, digits: 0 },
  { key: "floorHeight", label: "Floor Height", min: 2.4, max: 5, step: 0.1, digits: 1 },
  { key: "slabThickness", label: "Slab Thickness", min: 0.15, max: 1, step: 0.01, digits: 2 },
  { key: "topNotchWidth", label: "Top Notch Width", min: 2.2, max: 25.4, step: 0.05, digits: 2 },
  { key: "topNotchDepth", label: "Top Notch Depth", min: 0.6, max: 30.8, step: 0.02, digits: 2 },
  { key: "bottomNotchDepth", label: "Bottom Notch Depth", min: 0.6, max: 30.2, step: 0.02, digits: 2 },
];

const HUMAN_MODELS = [
  assetPath("/assets/man1.glb"),
  assetPath("/assets/man2.glb"),
  assetPath("/assets/man3.glb"),
  assetPath("/assets/man4.glb"),
  assetPath("/assets/man5.glb"),
  assetPath("/assets/man6.glb"),
];

type Point3 = [number, number, number];
type FootprintBounds = { minX: number; maxX: number; minZ: number; maxZ: number };
type ViewPreset = "front" | "top" | "right" | "left" | "back";

function computeGroundFootprintBounds(
  controls: Pick<ViewerControls, "topNotchWidth" | "topNotchDepth" | "bottomNotchDepth">
): FootprintBounds {
  const outline = createSlabOutline(controls);

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  outline.forEach((point) => {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minZ = Math.min(minZ, point.y);
    maxZ = Math.max(maxZ, point.y);
  });

  return { minX, maxX, minZ, maxZ };
}

function footprintLocalToWorld(localX: number, y: number, localZ: number): Point3 {
  const cos = Math.cos(TOWER_ROTATION_Y);
  const sin = Math.sin(TOWER_ROTATION_Y);
  const x = localX * cos - localZ * sin;
  const z = localX * sin + localZ * cos;
  return [x, y, z];
}

function DimensionLine({
  start,
  end,
  color = "#d8def0",
  fontSize = 1.5,
}: {
  start: Point3;
  end: Point3;
  color?: string;
  fontSize?: number;
}) {
  const label = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const distance = startVec.distanceTo(endVec);
    return `${distance.toFixed(2)} m`;
  }, [start, end]);

  const textPosition = useMemo<Point3>(() => {
    const midX = (start[0] + end[0]) * 0.5;
    const midY = (start[1] + end[1]) * 0.5 + 1.1;
    const midZ = (start[2] + end[2]) * 0.5;
    return [midX, midY, midZ];
  }, [start, end]);

  return (
    <>
      <Line points={[start, end]} color={color} lineWidth={1.2} transparent opacity={0.95} />
      <Text position={textPosition} fontSize={fontSize} color={color} anchorX="center" anchorY="middle">
        {label}
      </Text>
    </>
  );
}

function FootprintDimensions({
  controls,
  enabled,
}: {
  controls: ViewerControls;
  enabled: boolean;
}) {
  const bounds = useMemo(
    () =>
      computeGroundFootprintBounds({
        topNotchWidth: controls.topNotchWidth,
        topNotchDepth: controls.topNotchDepth,
        bottomNotchDepth: controls.bottomNotchDepth,
      }),
    [controls.topNotchWidth, controls.topNotchDepth, controls.bottomNotchDepth]
  );

  const dimensionGeometry = useMemo(() => {
    const y = Math.max(controls.slabThickness + 0.3, 0.45);
    const margin = 7;
    const dimZ = bounds.minZ - margin;
    const dimX = bounds.maxX + margin;
    const totalHeight =
      (controls.groundFloors + 1 + Math.max(controls.firstTowerFloors, controls.secondTowerFloors)) *
      controls.floorHeight;
    const towerBaseY = controls.groundFloors * controls.floorHeight;
    const towerStartY = towerBaseY + controls.floorHeight;
    const topYOffset = controls.slabThickness * 0.5 + 0.65;
    const towerDimOffset = 2.2;
    const secondTowerOffsetX =
      TOWER_OFFSET_X - ((TOWER_WIDTH * 0.5) + (MEDIAN_BLOCK_WIDTH - 1) + (SECOND_TOWER_WIDTH * 0.5));
    const groundHeight = towerBaseY;
    const tower1HeightTop = towerStartY + controls.firstTowerFloors * controls.floorHeight;
    const tower2HeightTop = towerStartY + controls.secondTowerFloors * controls.floorHeight;
    const groundDimX = bounds.minX - margin;
    const tower1DimX = TOWER_OFFSET_X - TOWER_WIDTH * 0.5 - towerDimOffset;
    const tower2DimX = secondTowerOffsetX - SECOND_TOWER_WIDTH * 0.5 - towerDimOffset;
    const floorDimX = bounds.minX - margin - towerDimOffset;

    const firstTowerTopY = towerStartY + (controls.firstTowerFloors - 1) * controls.floorHeight + topYOffset;
    const secondTowerTopY = towerStartY + (controls.secondTowerFloors - 1) * controls.floorHeight + topYOffset;

    const p = (x: number, pointY: number, z: number) => footprintLocalToWorld(x, pointY, z);

    return {
      y,
      lengthStart: p(bounds.minX, y, dimZ),
      lengthEnd: p(bounds.maxX, y, dimZ),
      widthStart: p(dimX, y, bounds.minZ),
      widthEnd: p(dimX, y, bounds.maxZ),
      heightStart: p(dimX, 0, bounds.minZ),
      heightEnd: p(dimX, totalHeight, bounds.minZ),
      groundHeightStart: p(groundDimX, 0, bounds.maxZ),
      groundHeightEnd: p(groundDimX, groundHeight, bounds.maxZ),
      floorHeightStart: p(floorDimX, 0, bounds.minZ),
      floorHeightEnd: p(floorDimX, controls.floorHeight, bounds.minZ),
      tower1HeightStart: p(tower1DimX, towerStartY, TOWER_OFFSET_Z + TOWER_DEPTH * 0.5),
      tower1HeightEnd: p(tower1DimX, tower1HeightTop, TOWER_OFFSET_Z + TOWER_DEPTH * 0.5),
      tower2HeightStart: p(tower2DimX, towerStartY, TOWER_OFFSET_Z - SECOND_TOWER_DEPTH * 0.5),
      tower2HeightEnd: p(tower2DimX, tower2HeightTop, TOWER_OFFSET_Z - SECOND_TOWER_DEPTH * 0.5),
      extAStart: p(bounds.minX, y, bounds.minZ),
      extAEnd: p(bounds.minX, y, dimZ),
      extBStart: p(bounds.maxX, y, bounds.minZ),
      extBEnd: p(bounds.maxX, y, dimZ),
      extCStart: p(bounds.maxX, y, bounds.minZ),
      extCEnd: p(dimX, y, bounds.minZ),
      extDStart: p(bounds.maxX, y, bounds.maxZ),
      extDEnd: p(dimX, y, bounds.maxZ),
      extHeightBottomStart: p(bounds.maxX, 0, bounds.minZ),
      extHeightBottomEnd: p(dimX, 0, bounds.minZ),
      extHeightTopStart: p(bounds.maxX, totalHeight, bounds.minZ),
      extHeightTopEnd: p(dimX, totalHeight, bounds.minZ),
      extGroundBottomStart: p(bounds.minX, 0, bounds.maxZ),
      extGroundBottomEnd: p(groundDimX, 0, bounds.maxZ),
      extGroundTopStart: p(bounds.minX, groundHeight, bounds.maxZ),
      extGroundTopEnd: p(groundDimX, groundHeight, bounds.maxZ),
      extFloorBottomStart: p(bounds.minX, 0, bounds.minZ),
      extFloorBottomEnd: p(floorDimX, 0, bounds.minZ),
      extFloorTopStart: p(bounds.minX, controls.floorHeight, bounds.minZ),
      extFloorTopEnd: p(floorDimX, controls.floorHeight, bounds.minZ),
      extTower1BottomStart: p(TOWER_OFFSET_X - TOWER_WIDTH * 0.5, towerStartY, TOWER_OFFSET_Z + TOWER_DEPTH * 0.5),
      extTower1BottomEnd: p(tower1DimX, towerStartY, TOWER_OFFSET_Z + TOWER_DEPTH * 0.5),
      extTower1TopStart: p(TOWER_OFFSET_X - TOWER_WIDTH * 0.5, tower1HeightTop, TOWER_OFFSET_Z + TOWER_DEPTH * 0.5),
      extTower1TopEnd: p(tower1DimX, tower1HeightTop, TOWER_OFFSET_Z + TOWER_DEPTH * 0.5),
      extTower2BottomStart: p(
        secondTowerOffsetX - SECOND_TOWER_WIDTH * 0.5,
        towerStartY,
        TOWER_OFFSET_Z - SECOND_TOWER_DEPTH * 0.5
      ),
      extTower2BottomEnd: p(tower2DimX, towerStartY, TOWER_OFFSET_Z - SECOND_TOWER_DEPTH * 0.5),
      extTower2TopStart: p(
        secondTowerOffsetX - SECOND_TOWER_WIDTH * 0.5,
        tower2HeightTop,
        TOWER_OFFSET_Z - SECOND_TOWER_DEPTH * 0.5
      ),
      extTower2TopEnd: p(tower2DimX, tower2HeightTop, TOWER_OFFSET_Z - SECOND_TOWER_DEPTH * 0.5),
      firstLengthStart: p(
        TOWER_OFFSET_X - TOWER_WIDTH * 0.5,
        firstTowerTopY,
        TOWER_OFFSET_Z - TOWER_DEPTH * 0.5 - towerDimOffset
      ),
      firstLengthEnd: p(
        TOWER_OFFSET_X + TOWER_WIDTH * 0.5,
        firstTowerTopY,
        TOWER_OFFSET_Z - TOWER_DEPTH * 0.5 - towerDimOffset
      ),
      firstWidthStart: p(
        TOWER_OFFSET_X + TOWER_WIDTH * 0.5 + towerDimOffset,
        firstTowerTopY,
        TOWER_OFFSET_Z - TOWER_DEPTH * 0.5
      ),
      firstWidthEnd: p(
        TOWER_OFFSET_X + TOWER_WIDTH * 0.5 + towerDimOffset,
        firstTowerTopY,
        TOWER_OFFSET_Z + TOWER_DEPTH * 0.5
      ),
      firstExtLengthAStart: p(TOWER_OFFSET_X - TOWER_WIDTH * 0.5, firstTowerTopY, TOWER_OFFSET_Z - TOWER_DEPTH * 0.5),
      firstExtLengthAEnd: p(
        TOWER_OFFSET_X - TOWER_WIDTH * 0.5,
        firstTowerTopY,
        TOWER_OFFSET_Z - TOWER_DEPTH * 0.5 - towerDimOffset
      ),
      firstExtLengthBStart: p(TOWER_OFFSET_X + TOWER_WIDTH * 0.5, firstTowerTopY, TOWER_OFFSET_Z - TOWER_DEPTH * 0.5),
      firstExtLengthBEnd: p(
        TOWER_OFFSET_X + TOWER_WIDTH * 0.5,
        firstTowerTopY,
        TOWER_OFFSET_Z - TOWER_DEPTH * 0.5 - towerDimOffset
      ),
      firstExtWidthAStart: p(TOWER_OFFSET_X + TOWER_WIDTH * 0.5, firstTowerTopY, TOWER_OFFSET_Z - TOWER_DEPTH * 0.5),
      firstExtWidthAEnd: p(
        TOWER_OFFSET_X + TOWER_WIDTH * 0.5 + towerDimOffset,
        firstTowerTopY,
        TOWER_OFFSET_Z - TOWER_DEPTH * 0.5
      ),
      firstExtWidthBStart: p(TOWER_OFFSET_X + TOWER_WIDTH * 0.5, firstTowerTopY, TOWER_OFFSET_Z + TOWER_DEPTH * 0.5),
      firstExtWidthBEnd: p(
        TOWER_OFFSET_X + TOWER_WIDTH * 0.5 + towerDimOffset,
        firstTowerTopY,
        TOWER_OFFSET_Z + TOWER_DEPTH * 0.5
      ),
      secondLengthStart: p(
        secondTowerOffsetX - SECOND_TOWER_WIDTH * 0.5,
        secondTowerTopY,
        TOWER_OFFSET_Z - SECOND_TOWER_DEPTH * 0.5 - towerDimOffset
      ),
      secondLengthEnd: p(
        secondTowerOffsetX + SECOND_TOWER_WIDTH * 0.5,
        secondTowerTopY,
        TOWER_OFFSET_Z - SECOND_TOWER_DEPTH * 0.5 - towerDimOffset
      ),
      secondWidthStart: p(
        secondTowerOffsetX + SECOND_TOWER_WIDTH * 0.5 + towerDimOffset,
        secondTowerTopY,
        TOWER_OFFSET_Z - SECOND_TOWER_DEPTH * 0.5
      ),
      secondWidthEnd: p(
        secondTowerOffsetX + SECOND_TOWER_WIDTH * 0.5 + towerDimOffset,
        secondTowerTopY,
        TOWER_OFFSET_Z + SECOND_TOWER_DEPTH * 0.5
      ),
      secondExtLengthAStart: p(
        secondTowerOffsetX - SECOND_TOWER_WIDTH * 0.5,
        secondTowerTopY,
        TOWER_OFFSET_Z - SECOND_TOWER_DEPTH * 0.5
      ),
      secondExtLengthAEnd: p(
        secondTowerOffsetX - SECOND_TOWER_WIDTH * 0.5,
        secondTowerTopY,
        TOWER_OFFSET_Z - SECOND_TOWER_DEPTH * 0.5 - towerDimOffset
      ),
      secondExtLengthBStart: p(
        secondTowerOffsetX + SECOND_TOWER_WIDTH * 0.5,
        secondTowerTopY,
        TOWER_OFFSET_Z - SECOND_TOWER_DEPTH * 0.5
      ),
      secondExtLengthBEnd: p(
        secondTowerOffsetX + SECOND_TOWER_WIDTH * 0.5,
        secondTowerTopY,
        TOWER_OFFSET_Z - SECOND_TOWER_DEPTH * 0.5 - towerDimOffset
      ),
      secondExtWidthAStart: p(
        secondTowerOffsetX + SECOND_TOWER_WIDTH * 0.5,
        secondTowerTopY,
        TOWER_OFFSET_Z - SECOND_TOWER_DEPTH * 0.5
      ),
      secondExtWidthAEnd: p(
        secondTowerOffsetX + SECOND_TOWER_WIDTH * 0.5 + towerDimOffset,
        secondTowerTopY,
        TOWER_OFFSET_Z - SECOND_TOWER_DEPTH * 0.5
      ),
      secondExtWidthBStart: p(
        secondTowerOffsetX + SECOND_TOWER_WIDTH * 0.5,
        secondTowerTopY,
        TOWER_OFFSET_Z + SECOND_TOWER_DEPTH * 0.5
      ),
      secondExtWidthBEnd: p(
        secondTowerOffsetX + SECOND_TOWER_WIDTH * 0.5 + towerDimOffset,
        secondTowerTopY,
        TOWER_OFFSET_Z + SECOND_TOWER_DEPTH * 0.5
      ),
    };
  }, [
    bounds,
    controls.slabThickness,
    controls.groundFloors,
    controls.firstTowerFloors,
    controls.secondTowerFloors,
    controls.floorHeight,
  ]);

  if (!enabled) return null;

  return (
    <group>
      <Line points={[dimensionGeometry.extAStart, dimensionGeometry.extAEnd]} color="#d8def0" lineWidth={1} />
      <Line points={[dimensionGeometry.extBStart, dimensionGeometry.extBEnd]} color="#d8def0" lineWidth={1} />
      <Line points={[dimensionGeometry.extCStart, dimensionGeometry.extCEnd]} color="#d8def0" lineWidth={1} />
      <Line points={[dimensionGeometry.extDStart, dimensionGeometry.extDEnd]} color="#d8def0" lineWidth={1} />
      <Line
        points={[dimensionGeometry.extHeightBottomStart, dimensionGeometry.extHeightBottomEnd]}
        color="#d8def0"
        lineWidth={1}
      />
      <Line
        points={[dimensionGeometry.extHeightTopStart, dimensionGeometry.extHeightTopEnd]}
        color="#d8def0"
        lineWidth={1}
      />
      <Line points={[dimensionGeometry.extGroundBottomStart, dimensionGeometry.extGroundBottomEnd]} color="#d8def0" lineWidth={1} />
      <Line points={[dimensionGeometry.extGroundTopStart, dimensionGeometry.extGroundTopEnd]} color="#d8def0" lineWidth={1} />
      <Line points={[dimensionGeometry.extFloorBottomStart, dimensionGeometry.extFloorBottomEnd]} color="#d8def0" lineWidth={1} />
      <Line points={[dimensionGeometry.extFloorTopStart, dimensionGeometry.extFloorTopEnd]} color="#d8def0" lineWidth={1} />
      <Line points={[dimensionGeometry.extTower1BottomStart, dimensionGeometry.extTower1BottomEnd]} color="#d8def0" lineWidth={1} />
      <Line points={[dimensionGeometry.extTower1TopStart, dimensionGeometry.extTower1TopEnd]} color="#d8def0" lineWidth={1} />
      <Line points={[dimensionGeometry.extTower2BottomStart, dimensionGeometry.extTower2BottomEnd]} color="#d8def0" lineWidth={1} />
      <Line points={[dimensionGeometry.extTower2TopStart, dimensionGeometry.extTower2TopEnd]} color="#d8def0" lineWidth={1} />
      <Line points={[dimensionGeometry.firstExtLengthAStart, dimensionGeometry.firstExtLengthAEnd]} color="#d8def0" lineWidth={1} />
      <Line points={[dimensionGeometry.firstExtLengthBStart, dimensionGeometry.firstExtLengthBEnd]} color="#d8def0" lineWidth={1} />
      <Line points={[dimensionGeometry.firstExtWidthAStart, dimensionGeometry.firstExtWidthAEnd]} color="#d8def0" lineWidth={1} />
      <Line points={[dimensionGeometry.firstExtWidthBStart, dimensionGeometry.firstExtWidthBEnd]} color="#d8def0" lineWidth={1} />
      <Line points={[dimensionGeometry.secondExtLengthAStart, dimensionGeometry.secondExtLengthAEnd]} color="#d8def0" lineWidth={1} />
      <Line points={[dimensionGeometry.secondExtLengthBStart, dimensionGeometry.secondExtLengthBEnd]} color="#d8def0" lineWidth={1} />
      <Line points={[dimensionGeometry.secondExtWidthAStart, dimensionGeometry.secondExtWidthAEnd]} color="#d8def0" lineWidth={1} />
      <Line points={[dimensionGeometry.secondExtWidthBStart, dimensionGeometry.secondExtWidthBEnd]} color="#d8def0" lineWidth={1} />

      <DimensionLine start={dimensionGeometry.lengthStart} end={dimensionGeometry.lengthEnd} />
      <DimensionLine start={dimensionGeometry.widthStart} end={dimensionGeometry.widthEnd} />
      <DimensionLine start={dimensionGeometry.heightStart} end={dimensionGeometry.heightEnd} />
      <DimensionLine start={dimensionGeometry.groundHeightStart} end={dimensionGeometry.groundHeightEnd} fontSize={1.2} />
      <DimensionLine start={dimensionGeometry.floorHeightStart} end={dimensionGeometry.floorHeightEnd} fontSize={1.2} />
      <DimensionLine start={dimensionGeometry.tower1HeightStart} end={dimensionGeometry.tower1HeightEnd} fontSize={1.2} />
      <DimensionLine start={dimensionGeometry.tower2HeightStart} end={dimensionGeometry.tower2HeightEnd} fontSize={1.2} />
      <DimensionLine start={dimensionGeometry.firstLengthStart} end={dimensionGeometry.firstLengthEnd} fontSize={1.2} />
      <DimensionLine start={dimensionGeometry.firstWidthStart} end={dimensionGeometry.firstWidthEnd} fontSize={1.2} />
      <DimensionLine start={dimensionGeometry.secondLengthStart} end={dimensionGeometry.secondLengthEnd} fontSize={1.2} />
      <DimensionLine start={dimensionGeometry.secondWidthStart} end={dimensionGeometry.secondWidthEnd} fontSize={1.2} />
    </group>
  );
}

function SceneBootstrap() {
  const { invalidate } = useThree();

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      invalidate();
    });
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [invalidate]);

  return null;
}

function OutlinePostprocessing({
  target,
}: {
  target: React.RefObject<THREE.Object3D | null>;
}) {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const outlinePassRef = useRef<OutlinePass | null>(null);

  useEffect(() => {
    const composer = new EffectComposer(gl);
    composer.addPass(new RenderPass(scene, camera));
    const outlinePass = new OutlinePass(
      new THREE.Vector2(size.width, size.height),
      scene,
      camera
    );
    outlinePass.edgeStrength = OUTLINE_STRENGTH;
    outlinePass.edgeThickness = OUTLINE_THICKNESS;
    outlinePass.edgeGlow = OUTLINE_GLOW;
    outlinePass.pulsePeriod = 0;
    outlinePass.visibleEdgeColor.set(OUTLINE_COLOR);
    outlinePass.hiddenEdgeColor.set(OUTLINE_COLOR);
    composer.addPass(outlinePass);

    composerRef.current = composer;
    outlinePassRef.current = outlinePass;

    return () => {
      composer.dispose();
      composerRef.current = null;
      outlinePassRef.current = null;
    };
  }, [gl, scene, camera, size.width, size.height]);

  useEffect(() => {
    if (!outlinePassRef.current) return;
    outlinePassRef.current.selectedObjects = target.current ? [target.current] : [];
  }, [target]);

  useFrame(() => {
    if (!outlinePassRef.current) return;
    if (outlinePassRef.current.selectedObjects.length === 0 && target.current) {
      outlinePassRef.current.selectedObjects = [target.current];
    }
  });

  useEffect(() => {
    composerRef.current?.setSize(size.width, size.height);
    outlinePassRef.current?.setSize(size.width, size.height);
  }, [size]);

  useFrame(() => {
    if (!composerRef.current) return;
    composerRef.current.render();
  }, 1);

  return null;
}

function AutoFitCamera({
  target,
  enabled,
}: {
  target: React.RefObject<THREE.Object3D | null>;
  enabled: boolean;
}) {
  const { camera, size } = useThree();

  const fit = () => {
    if (!target.current) return;
    const box = new THREE.Box3().setFromObject(target.current);
    if (box.isEmpty()) return;
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    const targetPos = sphere.center.clone();
    const currentDir = camera.position.clone().sub(targetPos);
    const fallbackDir = new THREE.Vector3(1, 0, 1);
    const horizontal = new THREE.Vector3(currentDir.x, 0, currentDir.z);
    const horizontalDir =
      horizontal.lengthSq() > 1e-6 ? horizontal.normalize() : fallbackDir.normalize();
    const direction = new THREE.Vector3(
      horizontalDir.x * Math.cos(CAMERA_FIT_ELEVATION),
      Math.sin(CAMERA_FIT_ELEVATION),
      horizontalDir.z * Math.cos(CAMERA_FIT_ELEVATION)
    ).normalize();

    if (camera instanceof THREE.PerspectiveCamera) {
      const perspective = camera as THREE.PerspectiveCamera;
      const fov = THREE.MathUtils.degToRad(perspective.fov);
      const aspect = size.width / size.height;
      const distance = Math.max(
        sphere.radius / Math.sin(fov / 2),
        sphere.radius / Math.sin(Math.atan(Math.tan(fov / 2) * aspect))
      );
      const nextPos = targetPos.clone().addScaledVector(direction, distance * CAMERA_FIT_PADDING);
      perspective.position.copy(nextPos);
      perspective.lookAt(targetPos);
      perspective.updateProjectionMatrix();
      return;
    }

    if (camera instanceof THREE.OrthographicCamera) return;
  };

  useEffect(() => {
    if (!enabled) return undefined;
    fit();
    const interval = window.setInterval(fit, 1000);
    return () => window.clearInterval(interval);
  }, [enabled, size.width, size.height]);

  return null;
}

function CameraDebugLogger({
  enabled,
  controlsRef,
}: {
  enabled: boolean;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();

  useFrame(() => {
    if (!enabled) return;

    const position = camera.position;
    const target = controlsRef.current?.target;
    const targetX = target?.x ?? DEFAULT_CAMERA_TARGET[0];
    const targetY = target?.y ?? DEFAULT_CAMERA_TARGET[1];
    const targetZ = target?.z ?? DEFAULT_CAMERA_TARGET[2];

    console.log("[HeroCubeViewer] camera frame", {
      position: [
        Number(position.x.toFixed(3)),
        Number(position.y.toFixed(3)),
        Number(position.z.toFixed(3)),
      ],
      target: [Number(targetX.toFixed(3)), Number(targetY.toFixed(3)), Number(targetZ.toFixed(3))],
    });
  });

  return null;
}

function CameraViewApplier({
  viewPreset,
  controlsRef,
}: {
  viewPreset: ViewPreset | null;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (!viewPreset) return;

    const target =
      controlsRef.current?.target.clone() ??
      new THREE.Vector3(
        DEFAULT_CAMERA_TARGET[0],
        DEFAULT_CAMERA_TARGET[1],
        DEFAULT_CAMERA_TARGET[2]
      );
    const distance = Math.max(camera.position.distanceTo(target), 1);
    const direction = new THREE.Vector3();

    if (viewPreset === "front") direction.set(0, 0, 1);
    if (viewPreset === "back") direction.set(0, 0, -1);
    if (viewPreset === "right") direction.set(1, 0, 0);
    if (viewPreset === "left") direction.set(-1, 0, 0);
    if (viewPreset === "top") direction.set(0, 1, 0);

    const nextPosition = target.clone().addScaledVector(direction, distance);
    const cameraRef = camera as THREE.PerspectiveCamera | THREE.OrthographicCamera;
    cameraRef.position.copy(nextPosition);
    cameraRef.up.set(0, 1, 0);
    cameraRef.lookAt(target);
    cameraRef.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
    }
  }, [camera, controlsRef, viewPreset]);

  return null;
}

function createSlabOutline({
  topNotchWidth,
  topNotchDepth,
  bottomNotchDepth,
}: Pick<ViewerControls, "topNotchWidth" | "topNotchDepth" | "bottomNotchDepth">): THREE.Vector2[] {
  const halfWidth = BASE_HALF_WIDTH;
  const halfDepth = BASE_HALF_DEPTH;

  const topInnerHalf = THREE.MathUtils.clamp(topNotchWidth * 0.5, 0.85, halfWidth - 1.1);
  const topNotchZ = halfDepth - THREE.MathUtils.clamp(topNotchDepth, 0.6, halfDepth - 0.65);
  const bottomCut = THREE.MathUtils.clamp(bottomNotchDepth, 0.6, halfDepth - 0.45);
  const bottomNotchZ = -halfDepth + bottomCut;
  const bottomInnerHalf = THREE.MathUtils.clamp(topInnerHalf * 1.24, topInnerHalf, halfWidth);

  // 12-vertex concave footprint.
  return [
    new THREE.Vector2(-halfWidth, halfDepth),
    new THREE.Vector2(-topInnerHalf, halfDepth),
    new THREE.Vector2(-topInnerHalf, topNotchZ),
    new THREE.Vector2(topInnerHalf, topNotchZ),
    new THREE.Vector2(topInnerHalf, halfDepth),
    new THREE.Vector2(halfWidth, halfDepth),
    new THREE.Vector2(halfWidth, -halfDepth),
    new THREE.Vector2(bottomInnerHalf, -halfDepth),
    new THREE.Vector2(bottomInnerHalf, bottomNotchZ),
    new THREE.Vector2(-bottomInnerHalf, bottomNotchZ),
    new THREE.Vector2(-bottomInnerHalf, -halfDepth),
    new THREE.Vector2(-halfWidth, -halfDepth),
  ];
}

function createGroundSlabGeometry(controls: ViewerControls): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const points = createSlabOutline(controls);
  shape.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    shape.lineTo(points[i].x, points[i].y);
  }
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: controls.slabThickness,
    bevelEnabled: false,
    curveSegments: 8,
    steps: 1,
  });

  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -controls.slabThickness * 0.5, 0);
  geometry.computeVertexNormals();
  return geometry;
}

function hashToUnit(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pickRandomFloors(count: number, total: number, seed: number): Set<number> {
  if (count <= 0 || total <= 0) return new Set();
  const capped = Math.min(count, total);
  const indices = Array.from({ length: total }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(hashToUnit(seed + i * 17.3) * (i + 1));
    const tmp = indices[i];
    indices[i] = indices[j];
    indices[j] = tmp;
  }
  return new Set(indices.slice(0, capped));
}

function InstancedPeople({
  src,
  instances,
}: {
  src: string;
  instances: Array<{ x: number; z: number; rot: number; scale: number }>;
}) {
  const { scene } = useGLTF(src);
  const mesh = useMemo(() => {
      let found: THREE.Mesh | null = null;
    scene.traverse((child) => {
        if (found) return;
        if (child instanceof THREE.Mesh) found = child;
      });
      return found;
  }, [scene]);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffffff",
      }),
    []
  );
  const ref = useRef<THREE.InstancedMesh | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!ref.current || !mesh) return;
    instances.forEach((instance, index) => {
      dummy.position.set(instance.x, 0, instance.z);
      dummy.rotation.set(0, instance.rot, 0);
      dummy.scale.setScalar(instance.scale);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(index, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [instances, dummy, mesh]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  if (!mesh) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[mesh.geometry, material, instances.length]}
      frustumCulled={false}
    />
  );
}

function PeopleInstances({ count, seed }: { count: number; seed: number }) {
  const placements = useMemo(() => {
    const density = Math.max(count / 100, 1);
    const spreadScale = Math.sqrt(density);
    const outerX = BASE_HALF_WIDTH * (1.85 + (spreadScale - 1) * 0.8);
    const outerZ = BASE_HALF_DEPTH * (1.85 + (spreadScale - 1) * 0.8);
    const innerX = BASE_HALF_WIDTH * 1.45;
    const innerZ = BASE_HALF_DEPTH * 1.45;
    const result: Array<{
      x: number;
      z: number;
      rot: number;
      scale: number;
      modelIndex: number;
    }> = [];
    const capped = Math.max(Math.round(count), 15);
    const seedOffset = Math.max(Math.round(seed), 1) * 100.137;
    for (let i = 0; i < capped; i += 1) {
      const angle = hashToUnit(seedOffset + i * 31.7) * Math.PI * 2;
      const radiusX = innerX + hashToUnit(seedOffset + i * 19.3 + 7) * (outerX - innerX);
      const radiusZ = innerZ + hashToUnit(seedOffset + i * 23.9 + 3) * (outerZ - innerZ);
      let x = Math.cos(angle) * radiusX;
      let z = Math.sin(angle) * radiusZ;
      if (Math.abs(x) < innerX && Math.abs(z) < innerZ) {
        x = Math.sign(x || 1) * innerX;
        z = Math.sign(z || 1) * innerZ;
      }
      result.push({
        x,
        z,
        rot: hashToUnit(seedOffset + i * 41.1) * Math.PI * 2,
        scale: 0.65 + hashToUnit(seedOffset + i * 17.9) * 0.25,
        modelIndex: Math.floor(hashToUnit(seedOffset + i * 11.7) * HUMAN_MODELS.length),
      });
    }
    return result;
  }, [count, seed]);

  const grouped = useMemo(() => {
    return HUMAN_MODELS.map((src, modelIndex) => ({
      src,
      instances: placements
        .filter((item) => item.modelIndex === modelIndex)
        .map(({ x, z, rot, scale }) => ({ x, z, rot, scale })),
    }));
  }, [placements]);

  return (
    <>
      {grouped.map((group, index) =>
        group.instances.length ? (
          <InstancedPeople key={`people-${index}`} src={group.src} instances={group.instances} />
        ) : null
      )}
    </>
  );
}

function BuildingSlabs({
  controls,
  layersEnabled,
}: {
  controls: ViewerControls;
  layersEnabled: boolean;
}) {
  const groundSlabGeometry = useMemo(() => createGroundSlabGeometry(controls), [controls]);
  const groundEdgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(groundSlabGeometry, EDGE_THRESHOLD_DEG),
    [groundSlabGeometry]
  );
  const towerSlabGeometry = useMemo(
    () => new THREE.BoxGeometry(TOWER_WIDTH, controls.slabThickness, TOWER_DEPTH),
    [controls.slabThickness]
  );
  const towerEdgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(towerSlabGeometry, EDGE_THRESHOLD_DEG),
    [towerSlabGeometry]
  );
  const secondTowerSlabGeometry = useMemo(
    () => new THREE.BoxGeometry(SECOND_TOWER_WIDTH, controls.slabThickness, SECOND_TOWER_DEPTH),
    [controls.slabThickness]
  );
  const secondTowerEdgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(secondTowerSlabGeometry, EDGE_THRESHOLD_DEG),
    [secondTowerSlabGeometry]
  );
  const towerPodiumGeometry = useMemo(
    () =>
      new THREE.BoxGeometry(
        TOWER_WIDTH * TOWER_PODIUM_SCALE_X,
        controls.slabThickness,
        TOWER_DEPTH * TOWER_PODIUM_SCALE_Z
      ),
    [controls.slabThickness]
  );
  const towerPodiumEdgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(towerPodiumGeometry, EDGE_THRESHOLD_DEG),
    [towerPodiumGeometry]
  );
  const medianBlockGeometry = useMemo(
    () =>
      new THREE.BoxGeometry(
        MEDIAN_BLOCK_WIDTH,
        1,
        Math.max(SECOND_TOWER_DEPTH - MEDIAN_BLOCK_LENGTH_OFFSET, 0.1)
      ),
    []
  );
  const medianFullGeometry = useMemo(
    () =>
      new THREE.BoxGeometry(
        MEDIAN_BLOCK_WIDTH,
        1,
        Math.max(SECOND_TOWER_DEPTH - MEDIAN_BLOCK_LENGTH_OFFSET, 0.1)
      ),
    []
  );
  const medianBlockEdgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(medianBlockGeometry, EDGE_THRESHOLD_DEG),
    [medianBlockGeometry]
  );
  const medianFullEdgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(medianFullGeometry, EDGE_THRESHOLD_DEG),
    [medianFullGeometry]
  );
  const columnGeometry = useMemo(() => new THREE.BoxGeometry(COLUMN_SIZE, 1, COLUMN_SIZE), []);
  const columnEdgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(columnGeometry, EDGE_THRESHOLD_DEG),
    [columnGeometry]
  );
  const monoMaterialProps = useMemo(
    () => ({
      color: BASE_COLOR,
      transparent: true,
      opacity: BASE_OPACITY,
      depthWrite: false,
    }),
    []
  );
  const lineMaterialProps = useMemo(
    () => ({
      color: EDGE_COLOR,
      transparent: true,
      opacity: EDGE_OPACITY,
      depthWrite: false,
    }),
    []
  );
  const layerGreenMaterialProps = useMemo(
    () => ({
      ...monoMaterialProps,
      color: LAYER_GREEN_COLOR,
      opacity: Math.max(BASE_OPACITY, 0.16),
    }),
    [monoMaterialProps]
  );
  const layerCirculationMaterialProps = useMemo(
    () => ({
      ...monoMaterialProps,
      color: LAYER_CIRCULATION_COLOR,
      opacity: Math.max(BASE_OPACITY, 0.16),
    }),
    [monoMaterialProps]
  );
  const layerHotelMaterialProps = useMemo(
    () => ({
      ...monoMaterialProps,
      color: LAYER_HOTEL_COLOR,
      opacity: Math.max(BASE_OPACITY, 0.18),
    }),
    [monoMaterialProps]
  );
  const layerEventMaterialProps = useMemo(
    () => ({
      ...monoMaterialProps,
      color: LAYER_EVENT_HALL_COLOR,
      opacity: Math.max(BASE_OPACITY, 0.18),
    }),
    [monoMaterialProps]
  );
  const layerReceptionMaterialProps = useMemo(
    () => ({
      ...monoMaterialProps,
      color: LAYER_RECEPTION_COLOR,
      opacity: Math.max(BASE_OPACITY, 0.18),
    }),
    [monoMaterialProps]
  );
  const layerCommercialMaterialProps = useMemo(
    () => ({
      ...monoMaterialProps,
      color: LAYER_COMMERCIAL_COLOR,
      opacity: Math.max(BASE_OPACITY, 0.18),
    }),
    [monoMaterialProps]
  );
  const layerSharedMaterialProps = useMemo(
    () => ({
      ...monoMaterialProps,
      color: LAYER_SHARED_COLOR,
      opacity: Math.max(BASE_OPACITY, 0.18),
    }),
    [monoMaterialProps]
  );

  const groundFloorIndices = useMemo(
    () => Array.from({ length: controls.groundFloors }, (_, floorIndex) => floorIndex),
    [controls.groundFloors]
  );
  const firstTowerFloorIndices = useMemo(
    () => Array.from({ length: controls.firstTowerFloors }, (_, floorIndex) => floorIndex),
    [controls.firstTowerFloors]
  );
  const secondTowerFloorIndices = useMemo(
    () => Array.from({ length: controls.secondTowerFloors }, (_, floorIndex) => floorIndex),
    [controls.secondTowerFloors]
  );
  const firstTowerGreenerySet = useMemo(
    () =>
      pickRandomFloors(
        controls.firstTowerGreenery,
        controls.firstTowerFloors,
        controls.firstTowerFloors * 13.1 + controls.firstTowerGreenery * 7.2
      ),
    [controls.firstTowerFloors, controls.firstTowerGreenery]
  );
  const secondTowerGreenerySet = useMemo(
    () =>
      pickRandomFloors(
        controls.secondTowerGreenery,
        controls.secondTowerFloors,
        controls.secondTowerFloors * 11.3 + controls.secondTowerGreenery * 9.1
      ),
    [controls.secondTowerFloors, controls.secondTowerGreenery]
  );
  const towerBaseY = useMemo(
    () => controls.groundFloors * controls.floorHeight,
    [controls.groundFloors, controls.floorHeight]
  );
  const towerPodiumY = useMemo(() => towerBaseY, [towerBaseY]);
  const towerStartY = useMemo(
    () => towerBaseY + controls.floorHeight,
    [towerBaseY, controls.floorHeight]
  );
  const medianGreenerySet = useMemo(() => {
    const combined = new Set<number>();
    firstTowerGreenerySet.forEach((index) => {
      if (index < controls.secondTowerFloors) combined.add(index);
    });
    secondTowerGreenerySet.forEach((index) => {
      if (index < controls.secondTowerFloors) combined.add(index);
    });
    return combined;
  }, [firstTowerGreenerySet, secondTowerGreenerySet, controls.secondTowerFloors]);
  const medianSegments = useMemo(() => {
    const segments: Array<{ start: number; end: number }> = [];
    let currentStart = 0;
    for (let i = 0; i < controls.secondTowerFloors; i += 1) {
      if (medianGreenerySet.has(i)) {
        if (i > currentStart) {
          segments.push({ start: currentStart, end: i });
        }
        currentStart = i + 1;
      }
    }
    if (currentStart < controls.secondTowerFloors) {
      segments.push({ start: currentStart, end: controls.secondTowerFloors });
    }
    return segments;
  }, [controls.secondTowerFloors, medianGreenerySet]);
  const secondTowerOffsetX = useMemo(
    () =>
      TOWER_OFFSET_X - ((TOWER_WIDTH * 0.5) + (MEDIAN_BLOCK_WIDTH-1) + (SECOND_TOWER_WIDTH * 0.5)),
    []
  );
  const podiumOffsetX = useMemo(
    () => (TOWER_OFFSET_X + secondTowerOffsetX) * 0.5,
    [secondTowerOffsetX]
  );
  const wallScaleY = useMemo(
    () => Math.max(controls.floorHeight / controls.slabThickness, 1),
    [controls.floorHeight, controls.slabThickness]
  );
  const wallOffsetY = useMemo(
    () => controls.slabThickness * 0.5 + controls.floorHeight * 0.5,
    [controls.slabThickness, controls.floorHeight]
  );
  const totalHeight = useMemo(
    () =>
      (controls.groundFloors + 1 + Math.max(controls.firstTowerFloors, controls.secondTowerFloors)) *
      controls.floorHeight,
    [controls.groundFloors, controls.firstTowerFloors, controls.secondTowerFloors, controls.floorHeight]
  );

  useEffect(() => {
    return () => {
      columnEdgesGeometry.dispose();
      columnGeometry.dispose();
      medianFullEdgesGeometry.dispose();
      medianFullGeometry.dispose();
      medianBlockEdgesGeometry.dispose();
      medianBlockGeometry.dispose();
      secondTowerEdgesGeometry.dispose();
      secondTowerSlabGeometry.dispose();
      towerPodiumEdgesGeometry.dispose();
      towerPodiumGeometry.dispose();
      towerEdgesGeometry.dispose();
      towerSlabGeometry.dispose();
      groundEdgesGeometry.dispose();
      groundSlabGeometry.dispose();
    };
  }, [
    groundSlabGeometry,
    groundEdgesGeometry,
    towerSlabGeometry,
    towerEdgesGeometry,
    towerPodiumGeometry,
    towerPodiumEdgesGeometry,
    secondTowerSlabGeometry,
    secondTowerEdgesGeometry,
    medianBlockGeometry,
    medianBlockEdgesGeometry,
    medianFullGeometry,
    medianFullEdgesGeometry,
    columnGeometry,
    columnEdgesGeometry,
  ]);

  return (
    <group position={[0, 0, 0]}>
      {groundFloorIndices.map((floorIndex) => (
        <mesh
          key={`ground-floor-${floorIndex}`}
          castShadow
          receiveShadow
          geometry={groundSlabGeometry}
          position={[0, floorIndex * controls.floorHeight, 0]}
          rotation={[0, TOWER_ROTATION_Y, 0]}
        >
          <meshBasicMaterial
            {...(layersEnabled
              ? floorIndex === 0
                ? layerReceptionMaterialProps
                : layerCommercialMaterialProps
              : monoMaterialProps)}
          />
          <lineSegments geometry={groundEdgesGeometry}>
            <lineBasicMaterial {...lineMaterialProps} />
          </lineSegments>
        </mesh>
      ))}
      {groundFloorIndices.map((floorIndex) => (
        <mesh
          key={`ground-wall-${floorIndex}`}
          castShadow
          receiveShadow
          geometry={groundSlabGeometry}
          position={[0, floorIndex * controls.floorHeight + wallOffsetY, 0]}
          rotation={[0, TOWER_ROTATION_Y, 0]}
          scale={[1, wallScaleY, 1]}
        >
          <meshBasicMaterial
            {...(layersEnabled
              ? floorIndex === 0
                ? layerReceptionMaterialProps
                : layerCommercialMaterialProps
              : monoMaterialProps)}
          />
          <lineSegments geometry={groundEdgesGeometry}>
            <lineBasicMaterial {...lineMaterialProps} />
          </lineSegments>
        </mesh>
      ))}

      {firstTowerFloorIndices.map((floorIndex) => (
        <mesh
          key={`first-tower-floor-${floorIndex}`}
          castShadow
          receiveShadow
          geometry={towerSlabGeometry}
          position={[TOWER_OFFSET_X, towerStartY + floorIndex * controls.floorHeight, TOWER_OFFSET_Z]}
          rotation={[0, TOWER_ROTATION_Y, 0]}
        >
          <meshBasicMaterial
            {...(layersEnabled && firstTowerGreenerySet.has(floorIndex)
              ? layerGreenMaterialProps
              : layersEnabled
                ? layerHotelMaterialProps
                : monoMaterialProps)}
          />
          <lineSegments geometry={towerEdgesGeometry}>
            <lineBasicMaterial {...lineMaterialProps} />
          </lineSegments>
        </mesh>
      ))}
      <mesh
        key="first-tower-roof"
        castShadow
        receiveShadow
        geometry={towerSlabGeometry}
        position={[
          TOWER_OFFSET_X,
          towerStartY + controls.firstTowerFloors * controls.floorHeight,
          TOWER_OFFSET_Z,
        ]}
        rotation={[0, TOWER_ROTATION_Y, 0]}
      >
        <meshBasicMaterial {...(layersEnabled ? layerSharedMaterialProps : monoMaterialProps)} />
        <lineSegments geometry={towerEdgesGeometry}>
          <lineBasicMaterial {...lineMaterialProps} />
        </lineSegments>
      </mesh>
      {secondTowerFloorIndices.map((floorIndex) => (
        <mesh
          key={`second-tower-floor-${floorIndex}`}
          castShadow
          receiveShadow
          geometry={secondTowerSlabGeometry}
          position={[
            secondTowerOffsetX,
            towerStartY + floorIndex * controls.floorHeight,
            TOWER_OFFSET_Z,
          ]}
          rotation={[0, SECOND_TOWER_ROTATION_Y, 0]}
        >
          <meshBasicMaterial
            {...(layersEnabled && secondTowerGreenerySet.has(floorIndex)
              ? layerGreenMaterialProps
              : layersEnabled
                ? layerHotelMaterialProps
                : monoMaterialProps)}
          />
          <lineSegments geometry={secondTowerEdgesGeometry}>
            <lineBasicMaterial {...lineMaterialProps} />
          </lineSegments>
        </mesh>
      ))}
      <mesh
        key="second-tower-roof"
        castShadow
        receiveShadow
        geometry={secondTowerSlabGeometry}
        position={[
          secondTowerOffsetX,
          towerStartY + controls.secondTowerFloors * controls.floorHeight,
          TOWER_OFFSET_Z,
        ]}
        rotation={[0, SECOND_TOWER_ROTATION_Y, 0]}
      >
        <meshBasicMaterial {...(layersEnabled ? layerSharedMaterialProps : monoMaterialProps)} />
        <lineSegments geometry={secondTowerEdgesGeometry}>
          <lineBasicMaterial {...lineMaterialProps} />
        </lineSegments>
      </mesh>
      {firstTowerFloorIndices.map((floorIndex) =>
        firstTowerGreenerySet.has(floorIndex) ? null : (
          <mesh
            key={`first-tower-wall-${floorIndex}`}
            castShadow
            receiveShadow
            geometry={towerSlabGeometry}
            position={[
              TOWER_OFFSET_X,
              towerStartY + floorIndex * controls.floorHeight + wallOffsetY,
              TOWER_OFFSET_Z,
            ]}
            rotation={[0, TOWER_ROTATION_Y, 0]}
            scale={[1, wallScaleY, 1]}
          >
            <meshBasicMaterial {...monoMaterialProps} />
            <lineSegments geometry={towerEdgesGeometry}>
              <lineBasicMaterial {...lineMaterialProps} />
            </lineSegments>
          </mesh>
        )
      )}
      <mesh
        key="first-tower-podium"
        castShadow
        receiveShadow
        geometry={towerPodiumGeometry}
        position={[podiumOffsetX, towerPodiumY, TOWER_OFFSET_Z]}
        rotation={[0, TOWER_ROTATION_Y, 0]}
      >
        <meshBasicMaterial {...(layersEnabled ? layerEventMaterialProps : monoMaterialProps)} />
        <lineSegments geometry={towerPodiumEdgesGeometry}>
          <lineBasicMaterial {...lineMaterialProps} />
        </lineSegments>
      </mesh>
      {medianSegments.map((segment, idx) => {
        const segmentHeight = (segment.end - segment.start) * controls.floorHeight;
        const centerY = towerStartY + (segment.start + segment.end) * 0.5 * controls.floorHeight;
        return (
          <mesh
            key={`median-block-${idx}`}
            castShadow
            receiveShadow
            geometry={medianBlockGeometry}
            position={[
              (TOWER_OFFSET_X + secondTowerOffsetX) * 0.5,
              centerY,
              TOWER_OFFSET_Z,
            ]}
            rotation={[0, TOWER_ROTATION_Y, 0]}
            scale={[1, segmentHeight, 1]}
          >
            <meshBasicMaterial
              {...(layersEnabled ? layerCirculationMaterialProps : monoMaterialProps)}
            />
            <lineSegments geometry={medianBlockEdgesGeometry}>
              <lineBasicMaterial {...lineMaterialProps} />
            </lineSegments>
          </mesh>
        );
      })}
      <mesh
        key="median-block-full"
        castShadow
        receiveShadow
        geometry={medianFullGeometry}
        position={[
          (TOWER_OFFSET_X + secondTowerOffsetX) * 0.5,
          towerStartY + (controls.secondTowerFloors * controls.floorHeight) * 0.5,
          TOWER_OFFSET_Z,
        ]}
        rotation={[0, TOWER_ROTATION_Y, 0]}
        scale={[0.86, controls.secondTowerFloors * controls.floorHeight, 0.86]}
      >
        <meshBasicMaterial {...(layersEnabled ? layerSharedMaterialProps : monoMaterialProps)} />
        <lineSegments geometry={medianFullEdgesGeometry}>
          <lineBasicMaterial {...lineMaterialProps} />
        </lineSegments>
      </mesh>
      <mesh
        key="first-tower-podium-wall"
        castShadow
        receiveShadow
        geometry={towerPodiumGeometry}
        position={[
          podiumOffsetX,
          towerPodiumY + wallOffsetY,
          TOWER_OFFSET_Z,
        ]}
        rotation={[0, TOWER_ROTATION_Y, 0]}
        scale={[1, wallScaleY, 1]}
      >
        <meshBasicMaterial {...(layersEnabled ? layerEventMaterialProps : monoMaterialProps)} />
        <lineSegments geometry={towerPodiumEdgesGeometry}>
          <lineBasicMaterial {...lineMaterialProps} />
        </lineSegments>
      </mesh>
      {secondTowerFloorIndices.map((floorIndex) =>
        secondTowerGreenerySet.has(floorIndex) ? null : (
          <mesh
            key={`second-tower-wall-${floorIndex}`}
            castShadow
            receiveShadow
            geometry={secondTowerSlabGeometry}
            position={[
              secondTowerOffsetX,
              towerStartY + floorIndex * controls.floorHeight + wallOffsetY,
              TOWER_OFFSET_Z,
            ]}
            rotation={[0, SECOND_TOWER_ROTATION_Y, 0]}
            scale={[1, wallScaleY, 1]}
          >
            <meshBasicMaterial {...monoMaterialProps} />
            <lineSegments geometry={secondTowerEdgesGeometry}>
              <lineBasicMaterial {...lineMaterialProps} />
            </lineSegments>
          </mesh>
        )
      )}

      {firstTowerFloorIndices.flatMap((floorIndex) => {
        if (!firstTowerGreenerySet.has(floorIndex)) return [];
        const baseY = towerStartY + floorIndex * controls.floorHeight;
        const centerY = baseY + controls.floorHeight * 0.5;
        const cornerDx = TOWER_WIDTH * 0.5 - COLUMN_INSET;
        const cornerDz = TOWER_DEPTH * 0.5 - COLUMN_INSET;
        const corners: Array<[number, number]> = [
          [TOWER_OFFSET_X - cornerDx, TOWER_OFFSET_Z - cornerDz],
          [TOWER_OFFSET_X + cornerDx, TOWER_OFFSET_Z - cornerDz],
          [TOWER_OFFSET_X - cornerDx, TOWER_OFFSET_Z + cornerDz],
          [TOWER_OFFSET_X + cornerDx, TOWER_OFFSET_Z + cornerDz],
        ];
        return corners.map(([x, z], index) => (
          <mesh
            key={`first-tower-column-${floorIndex}-${index}`}
            castShadow
            receiveShadow
            geometry={columnGeometry}
            position={[x, centerY, z]}
            rotation={[0, TOWER_ROTATION_Y, 0]}
            scale={[1, controls.floorHeight, 1]}
          >
            <meshBasicMaterial {...monoMaterialProps} />
            <lineSegments geometry={columnEdgesGeometry}>
              <lineBasicMaterial {...lineMaterialProps} />
            </lineSegments>
          </mesh>
        ));
      })}

      {secondTowerFloorIndices.flatMap((floorIndex) => {
        if (!secondTowerGreenerySet.has(floorIndex)) return [];
        const baseY = towerStartY + floorIndex * controls.floorHeight;
        const centerY = baseY + controls.floorHeight * 0.5;
        const cornerDx = SECOND_TOWER_WIDTH * 0.5 - COLUMN_INSET;
        const cornerDz = SECOND_TOWER_DEPTH * 0.5 - COLUMN_INSET;
        const corners: Array<[number, number]> = [
          [secondTowerOffsetX - cornerDx, TOWER_OFFSET_Z - cornerDz],
          [secondTowerOffsetX + cornerDx, TOWER_OFFSET_Z - cornerDz],
          [secondTowerOffsetX - cornerDx, TOWER_OFFSET_Z + cornerDz],
          [secondTowerOffsetX + cornerDx, TOWER_OFFSET_Z + cornerDz],
        ];
        return corners.map(([x, z], index) => (
          <mesh
            key={`second-tower-column-${floorIndex}-${index}`}
            castShadow
            receiveShadow
            geometry={columnGeometry}
            position={[x, centerY, z]}
            rotation={[0, SECOND_TOWER_ROTATION_Y, 0]}
            scale={[1, controls.floorHeight, 1]}
          >
            <meshBasicMaterial {...monoMaterialProps} />
            <lineSegments geometry={columnEdgesGeometry}>
              <lineBasicMaterial {...lineMaterialProps} />
            </lineSegments>
          </mesh>
        ));
      })}
    </group>
  );
}

export default function HeroCubeViewer({
  initialControls,
  showControls = true,
}: HeroCubeViewerProps) {
  const [controls, setControls] = useState<ViewerControls>({
    ...defaultControls,
    ...initialControls,
  });
  const [isCanvasEnabled, setIsCanvasEnabled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [controlsEnabled, setControlsEnabled] = useState(false);
  const [autoRotateEnabled, setAutoRotateEnabled] = useState(false);
  const [autoRandomizeEnabled, setAutoRandomizeEnabled] = useState(true);
  const [autoFitEnabled, setAutoFitEnabled] = useState(false);
  const [dimensionsEnabled, setDimensionsEnabled] = useState(true);
  const [orthographicEnabled, setOrthographicEnabled] = useState(true);
  const [layersEnabled, setLayersEnabled] = useState(false);
  const [layersLegendExpanded, setLayersLegendExpanded] = useState(true);
  const [viewPreset, setViewPreset] = useState<ViewPreset | null>(null);
  const buildingRef = useRef<THREE.Group | null>(null);
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    let rafA = 0;
    let rafB = 0;

    const enableCanvas = () => {
      rafA = requestAnimationFrame(() => {
        rafB = requestAnimationFrame(() => {
          setIsCanvasEnabled(true);
        });
      });
    };

    if (document.visibilityState === "visible") {
      enableCanvas();
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        enableCanvas();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelAnimationFrame(rafA);
      cancelAnimationFrame(rafB);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const updateControl = (key: keyof ViewerControls, value: number) => {
    const nextValue =
      key === "groundFloors" ||
      key === "firstTowerFloors" ||
      key === "secondTowerFloors" ||
      key === "firstTowerGreenery" ||
      key === "secondTowerGreenery" ||
      key === "peopleCount" ||
      key === "peopleSeed"
        ? Math.round(value)
        : value;
    setControls((prev) => ({
      ...prev,
      [key]: nextValue,
    }));
  };

  useEffect(() => {
    if (!autoRandomizeEnabled || isHovered) return undefined;
    const interval = window.setInterval(() => {
      setControls((prev) => {
        const next = { ...prev };
        controlConfig.forEach((item, index) => {
          const seed = Date.now() * 0.0001 + index * 17.3;
          const unit = hashToUnit(seed);
          const raw = item.min + unit * (item.max - item.min);
          const value =
            item.key === "groundFloors" ||
            item.key === "firstTowerFloors" ||
            item.key === "secondTowerFloors" ||
            item.key === "firstTowerGreenery" ||
            item.key === "secondTowerGreenery" ||
            item.key === "peopleCount" ||
            item.key === "peopleSeed"
              ? Math.round(raw)
              : raw;
          (next as Record<string, number>)[item.key] = value;
        });
        return next;
      });
    }, 1000);
    return () => {
      window.clearInterval(interval);
    };
  }, [autoRandomizeEnabled, isHovered]);

  return (
    <div
      className="hero-cube-viewer"
      aria-label="Hero parametric slab viewer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={(event) => {
        if (event.button === 1) event.preventDefault();
      }}
      onAuxClick={(event) => {
        if (event.button === 1) event.preventDefault();
      }}
    >
      {isHovered ? (
        <div className="hero-cube-viewer__controls-shell">
          {showControls && controlsEnabled ? (
            <div className="hero-cube-viewer__controls" aria-label="Viewer controls">
              <p className="hero-cube-viewer__group-title">Slabs</p>
              <div className="hero-cube-viewer__buttons">
                <button
                  className="hero-cube-viewer__button"
                  type="button"
                  onClick={() => setAutoRotateEnabled((prev) => !prev)}
                >
                  Autorotate {autoRotateEnabled ? "ON" : "OFF"}
                </button>
                <button
                  className="hero-cube-viewer__button"
                  type="button"
                  onClick={() => setOrthographicEnabled((prev) => !prev)}
                >
                  Projection {orthographicEnabled ? "ORTHO" : "PERSPECTIVE"}
                </button>
                <button
                  className="hero-cube-viewer__button"
                  type="button"
                  onClick={() => setAutoRandomizeEnabled((prev) => !prev)}
                >
                  Auto Randomize {autoRandomizeEnabled ? "ON" : "OFF"}
                </button>
                <button
                  className="hero-cube-viewer__button"
                  type="button"
                  onClick={() => setAutoFitEnabled((prev) => !prev)}
                >
                  Auto Fit {autoFitEnabled ? "ON" : "OFF"}
                </button>
                <button
                  className="hero-cube-viewer__button"
                  type="button"
                  onClick={() => setDimensionsEnabled((prev) => !prev)}
                >
                  Dimensions {dimensionsEnabled ? "ON" : "OFF"}
                </button>
              </div>
              {controlConfig.map((item) => (
                <label key={item.key} className="hero-cube-viewer__control">
                  <span className="hero-cube-viewer__control-label">{item.label}</span>
                  <div className="hero-cube-viewer__control-row">
                    <input
                      className="hero-cube-viewer__slider"
                      type="range"
                      min={item.min}
                      max={item.max}
                      step={item.step}
                      value={controls[item.key]}
                      onChange={(event) => updateControl(item.key, Number(event.target.value))}
                    />
                    <span className="hero-cube-viewer__control-value">
                      {controls[item.key].toFixed(item.digits)}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          ) : null}
          <button
            className="hero-cube-viewer__controls-toggle"
            type="button"
            aria-label={controlsEnabled ? "Hide controls" : "Show controls"}
            aria-pressed={controlsEnabled}
            onClick={() => setControlsEnabled((prev) => !prev)}
          >
            <SlidersHorizontal aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {isHovered ? (
        <div className="hero-cube-viewer__view-presets" aria-label="Camera view presets">
          <button
            className="hero-cube-viewer__controls-toggle"
            type="button"
            aria-label="Front view"
            onClick={() => setViewPreset("front")}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            className="hero-cube-viewer__controls-toggle"
            type="button"
            aria-label="Top view"
            onClick={() => setViewPreset("top")}
          >
            <ChevronDown aria-hidden="true" />
          </button>
          <button
            className="hero-cube-viewer__controls-toggle"
            type="button"
            aria-label="Side view"
            onClick={() => setViewPreset("right")}
          >
            <ChevronUp aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {isHovered ? (
        <div className="hero-cube-viewer__layers-toggle-wrap">
          <button
            className="hero-cube-viewer__controls-toggle"
            type="button"
            aria-label="Toggle layers"
            aria-pressed={layersEnabled}
            onClick={() => setLayersEnabled((prev) => !prev)}
          >
            <Layers3 aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {layersEnabled && isHovered ? (
        <div className="hero-cube-viewer__legend" aria-label="Layers legend">
          <div className="hero-cube-viewer__legend-header">
            <p className="hero-cube-viewer__legend-title">Layers</p>
            <button
              className="hero-cube-viewer__legend-toggle"
              type="button"
              aria-label={layersLegendExpanded ? "Collapse layers legend" : "Expand layers legend"}
              aria-pressed={layersLegendExpanded}
              onClick={() => setLayersLegendExpanded((prev) => !prev)}
            >
              {layersLegendExpanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
            </button>
          </div>
          {layersLegendExpanded ? (
            <>
              <div className="hero-cube-viewer__legend-item">
                <span
                  className="hero-cube-viewer__legend-swatch"
                  style={{ backgroundColor: LAYER_GREEN_COLOR }}
                  aria-hidden="true"
                />
                <span>Green Floors</span>
              </div>
              <div className="hero-cube-viewer__legend-item">
                <span
                  className="hero-cube-viewer__legend-swatch"
                  style={{ backgroundColor: LAYER_HOTEL_COLOR }}
                  aria-hidden="true"
                />
                <span>Hotel Rooms</span>
              </div>
              <div className="hero-cube-viewer__legend-item">
                <span
                  className="hero-cube-viewer__legend-swatch"
                  style={{ backgroundColor: LAYER_EVENT_HALL_COLOR }}
                  aria-hidden="true"
                />
                <span>Event Hall</span>
              </div>
              <div className="hero-cube-viewer__legend-item">
                <span
                  className="hero-cube-viewer__legend-swatch"
                  style={{ backgroundColor: LAYER_RECEPTION_COLOR }}
                  aria-hidden="true"
                />
                <span>Reception Hall &amp; Restauration</span>
              </div>
              <div className="hero-cube-viewer__legend-item">
                <span
                  className="hero-cube-viewer__legend-swatch"
                  style={{ backgroundColor: LAYER_COMMERCIAL_COLOR }}
                  aria-hidden="true"
                />
                <span>Commercial Center &amp; Leisure</span>
              </div>
              <div className="hero-cube-viewer__legend-item">
                <span
                  className="hero-cube-viewer__legend-swatch"
                  style={{ backgroundColor: LAYER_CIRCULATION_COLOR }}
                  aria-hidden="true"
                />
                <span>Circulation</span>
              </div>
              <div className="hero-cube-viewer__legend-item">
                <span
                  className="hero-cube-viewer__legend-swatch"
                  style={{ backgroundColor: LAYER_SHARED_COLOR }}
                  aria-hidden="true"
                />
                <span>Shared Spaces</span>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {isCanvasEnabled ? (
        <Canvas
          key={orthographicEnabled ? "ortho-camera" : "perspective-camera"}
          className="hero-cube-viewer__canvas"
          gl={{ alpha: true, antialias: true }}
          orthographic={orthographicEnabled}
          camera={
            orthographicEnabled
              ? {
                  position: DEFAULT_ORTHOGRAPHIC_CAMERA_POSITION,
                  zoom: DEFAULT_ORTHOGRAPHIC_CAMERA_ZOOM,
                }
              : {
                  position: DEFAULT_PERSPECTIVE_CAMERA_POSITION,
                  fov: 42,
                }
          }
          frameloop="always"
          resize={{ scroll: true, debounce: { scroll: 0, resize: 0 } }}
        >
          <SceneBootstrap />
          <ambientLight intensity={0.75} />
          <directionalLight position={[4, 5, 3]} intensity={1.15} />
          <group ref={buildingRef}>
            <BuildingSlabs controls={controls} layersEnabled={layersEnabled} />
          </group>
          <PeopleInstances count={controls.peopleCount} seed={controls.peopleSeed} />
          <FootprintDimensions controls={controls} enabled={dimensionsEnabled && isHovered} />
          <OutlinePostprocessing target={buildingRef} />
          <AutoFitCamera
            target={buildingRef}
            enabled={autoFitEnabled && autoRandomizeEnabled && !isHovered}
          />
          <CameraViewApplier viewPreset={viewPreset} controlsRef={orbitControlsRef} />
          <CameraDebugLogger enabled={isHovered} controlsRef={orbitControlsRef} />
          <OrbitControls
            ref={orbitControlsRef}
            enablePan
            autoRotate={autoRotateEnabled}
            autoRotateSpeed={isHovered ? 2 : 5}
            target={DEFAULT_CAMERA_TARGET}
            mouseButtons={{
              LEFT: THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.PAN,
              RIGHT: THREE.MOUSE.DOLLY,
            }}
          />
        </Canvas>
      ) : null}
    </div>
  );
}

HUMAN_MODELS.forEach((model) => useGLTF.preload(model));
