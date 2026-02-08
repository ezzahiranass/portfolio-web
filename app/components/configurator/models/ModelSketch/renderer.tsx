'use client';

import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { ParamValues } from '../../types';
import { assetPath } from '@/app/lib/assetPath';

type Mode = 'draw' | 'edit';

type ModelSketchRendererProps = {
  params: ParamValues;
};

type Params = ParamValues & {
  towerType: string;
  bevel: number;
  bevelResolution: number;
  ghostSubdivisions: number;
  floorHeight: number;
  floors: number;
  slabThickness: number;
  centralColumnRadius: number;
  columnCount: number;
  columnRadius: number;
  columnRingOffset: number;
  showShell: boolean;
  showSite: boolean;
  twist: number;
  topInset: number;
  bottomOffset: number;
};

type TowerParams = {
  towerType: string;
  bevel: number;
  bevelResolution: number;
  ghostSubdivisions: number;
  floorHeight: number;
  floors: number;
  slabThickness: number;
  centralColumnRadius: number;
  columnCount: number;
  columnRadius: number;
  columnRingOffset: number;
  showShell: boolean;
  twist: number;
  topInset: number;
  bottomOffset: number;
};

type Tower = {
  points: THREE.Vector3[];
  isClosed: boolean;
  params: TowerParams;
};

const degToRad = (deg: number) => (deg * Math.PI) / 180;
const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

const subdividePolyline = (
  points: THREE.Vector3[],
  isClosed: boolean,
  subdivisions: number
) => {
  if (points.length < 2 || subdivisions <= 0) {
    return points.map((point) => point.clone());
  }

  const result: THREE.Vector3[] = [];
  const segments = isClosed ? points.length : points.length - 1;

  for (let i = 0; i < segments; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    result.push(current.clone());

    for (let s = 1; s <= subdivisions; s += 1) {
      const t = s / (subdivisions + 1);
      result.push(
        new THREE.Vector3(
          lerp(current.x, next.x, t),
          lerp(current.y, next.y, t),
          lerp(current.z, next.z, t)
        )
      );
    }
  }

  if (!isClosed) {
    result.push(points[points.length - 1].clone());
  }

  return result;
};

export function ModelSketchRenderer({ params }: ModelSketchRendererProps) {
  const state = params as Params;
  const [mode, setMode] = useState<Mode>('draw');
  const [isDrawing, setIsDrawing] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [previewPoint, setPreviewPoint] = useState<THREE.Vector3 | null>(null);
  const [cursorPoint, setCursorPoint] = useState<THREE.Vector3 | null>(null);
  const [closeToStart, setCloseToStart] = useState(false);
  const [tower, setTower] = useState<Tower>({
    points: [],
    isClosed: false,
    params: {
      towerType: state.towerType,
      bevel: state.bevel,
      bevelResolution: Math.round(state.bevelResolution ?? 4),
      ghostSubdivisions: Math.round(state.ghostSubdivisions ?? 10),
      floorHeight: state.floorHeight,
      floors: Math.round(state.floors),
      slabThickness: state.slabThickness ?? 1,
      centralColumnRadius: state.centralColumnRadius ?? 0.4,
      columnCount: Math.round(state.columnCount ?? 0),
      columnRadius: state.columnRadius ?? 0.15,
      columnRingOffset: state.columnRingOffset ?? 0.6,
      showShell: state.showShell ?? true,
      twist: state.twist,
      topInset: state.topInset ?? 0,
      bottomOffset: state.bottomOffset ?? 0,
    },
  });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const { camera, size } = useThree();
  const { scene: dubaiScene } = useGLTF(assetPath('/assets/dubai.glb'));
  const dubaiClone = useMemo(() => dubaiScene.clone(true), [dubaiScene]);

  useEffect(() => {
    dubaiClone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mesh = child as THREE.Mesh;
      const material = mesh.material;
      const materials = Array.isArray(material) ? material : [material];
      materials.forEach((mat) => {
        if (!mat || typeof mat !== 'object') return;
        const m = mat as THREE.MeshStandardMaterial;
        m.color.set(0x000000);
        m.transparent = true;
        m.opacity = 0.5;
        m.roughness = 0.7;
        m.metalness = 0.05;
        m.depthWrite = true;
      });
      if (mesh.geometry) {
        const edgesGeom = new THREE.EdgesGeometry(mesh.geometry, 20);
        const edgesMat = new THREE.LineBasicMaterial({
          color: 0x333333,
          transparent: false,
        });
        const lineSegments = new THREE.LineSegments(edgesGeom, edgesMat);
        lineSegments.name = '__wireframe_overlay';
        lineSegments.renderOrder = 1;
        mesh.add(lineSegments);
      }
    });
  }, [dubaiClone]);

  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const floorHeight = Math.max(state.floorHeight ?? 0, 0);
  const floors = Math.max(Math.round(state.floors ?? 0), 0);
  const slabThickness = Math.max(state.slabThickness ?? 1, 0.1);
  const centralColumnRadius = Math.max(state.centralColumnRadius ?? 0, 0);
  const columnCount = Math.max(Math.round(state.columnCount ?? 0), 0);
  const columnRadius = Math.max(state.columnRadius ?? 0, 0);
  const columnRingOffset = Math.max(state.columnRingOffset ?? 0, 0);
  const showShell = state.showShell ?? true;
  const twistFactor = Math.max(state.twist ?? 0, 0);
  const topInset = Math.max(state.topInset ?? 0, 0);
  const bottomOffset = state.bottomOffset ?? 0;
  const bevel = Math.max(state.bevel ?? 0, 0);
  const bevelResolution = Math.min(Math.max(Math.round(state.bevelResolution ?? 4), 1), 16);
  const ghostSubdivisions = Math.max(Math.round(state.ghostSubdivisions ?? 0), 0);

  useEffect(() => {
    setTower((prev) => ({
      ...prev,
      params: {
        towerType: state.towerType,
        bevel,
        bevelResolution,
        ghostSubdivisions,
        floorHeight,
        floors,
        slabThickness,
        centralColumnRadius,
        columnCount,
        columnRadius,
        columnRingOffset,
        showShell,
        twist: twistFactor,
        topInset,
        bottomOffset,
      },
    }));
  }, [bevel, bevelResolution, floorHeight, floors, ghostSubdivisions, slabThickness, centralColumnRadius, columnCount, columnRadius, columnRingOffset, showShell, topInset, bottomOffset, state.towerType, twistFactor]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (mode !== 'draw' || !isDrawing) return;
      if (event.key === 'Enter' && mode === 'draw') {
        setIsDrawing(false);
        setMode('edit');
        setTower((prev) => ({
          ...prev,
          isClosed: prev.points.length > 1,
        }));
        window.dispatchEvent(new CustomEvent('sketch:commit'));
        setPreviewPoint(null);
        setCursorPoint(null);
        setCloseToStart(false);
        return;
      }
      if (event.key === 'Backspace') {
        event.preventDefault();
        setTower((prev) => ({
          ...prev,
          points: prev.points.slice(0, -1),
        }));
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsDrawing(false);
        setMode('edit');
        setPreviewPoint(null);
        setCursorPoint(null);
        setCloseToStart(false);
        return;
      }
    };
    const onDraw = () => {
      setTower((prev) => ({
        ...prev,
        points: [],
        isClosed: false,
      }));
      setMode('draw');
      setIsDrawing(true);
      setPreviewPoint(null);
      setCursorPoint(null);
      setCloseToStart(false);
    };
    const onDelete = () => {
      setTower((prev) => ({
        ...prev,
        points: [],
        isClosed: false,
      }));
      setIsDrawing(true);
      setMode('draw');
      setPreviewPoint(null);
      setCursorPoint(null);
      setCloseToStart(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('sketch:draw', onDraw as EventListener);
    window.addEventListener('sketch:delete', onDelete as EventListener);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('sketch:draw', onDraw as EventListener);
      window.removeEventListener('sketch:delete', onDelete as EventListener);
    };
  }, [mode]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sketch:drawing', { detail: isDrawing && mode === 'draw' }));
  }, [isDrawing, mode]);

  const addPointFromEvent = (event: ThreeEvent<PointerEvent>) => {
    const point = new THREE.Vector3();
    const hasIntersection = event.ray.intersectPlane(plane, point);
    if (!hasIntersection) return;
    setTower((prev) => ({ ...prev, points: [...prev.points, point.clone()] }));
  };

  const updatePointFromEvent = (event: ThreeEvent<PointerEvent>, index: number) => {
    const point = new THREE.Vector3();
    const hasIntersection = event.ray.intersectPlane(plane, point);
    if (!hasIntersection) return;
    setTower((prev) => ({
      ...prev,
      points: prev.points.map((existing, i) => (i === index ? point.clone() : existing)),
    }));
  };

  const handlePlanePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    if (mode === 'edit') {
      const closest = getClosestPointIndex(event);
      if (closest !== null) {
        setDragIndex(closest);
      }
      return;
    }
    if (mode !== 'draw' || !isDrawing) return;
    if (closeToStart && tower.points.length > 2) {
      setIsDrawing(false);
      setMode('edit');
      setTower((prev) => ({
        ...prev,
        isClosed: true,
      }));
      setPreviewPoint(null);
      setCursorPoint(null);
      setCloseToStart(false);
      return;
    }
    addPointFromEvent(event);
  };

  const handlePlanePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (mode === 'draw' && isDrawing) {
      const point = new THREE.Vector3();
      const hasIntersection = event.ray.intersectPlane(plane, point);
      if (hasIntersection) {
        let snapped = false;
        if (tower.points.length > 1) {
          const pointer = event.pointer;
          const start = tower.points[0];
          const projected = start.clone().project(camera);
          const dx = (projected.x - pointer.x) * (size.width / 2);
          const dy = (projected.y - pointer.y) * (size.height / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);
          const cameraDistance = camera.position.distanceTo(start);
          const threshold = Math.min(24, 8 + cameraDistance * 0.2);
          snapped = distance <= threshold;
          setCloseToStart(snapped);
          if (snapped) {
            setCursorPoint(start.clone());
            setPreviewPoint(start.clone());
          }
        }

        if (!snapped) {
          setCursorPoint(point.clone());
          setPreviewPoint(point.clone());
        }
      }
    } else if (closeToStart) {
      setCloseToStart(false);
    }
    if (mode === 'edit') {
      const closest = getClosestPointIndex(event);
      setHoverIndex(closest);
    }
    if (mode !== 'edit' || dragIndex === null) return;
    if ((event.buttons & 1) !== 1) return;
    event.stopPropagation();
    updatePointFromEvent(event, dragIndex);
  };

  const handlePlanePointerUp = () => {
    if (dragIndex !== null) {
      setDragIndex(null);
    }
  };

  const getClosestPointIndex = (event: ThreeEvent<PointerEvent>) => {
    if (tower.points.length === 0) return null;
    const pointer = event.pointer;
    let closestIndex: number | null = null;
    let closestDistance = Infinity;

    for (let i = 0; i < tower.points.length; i += 1) {
      const point = tower.points[i];
      const projected = point.clone().project(camera);
      const dx = (projected.x - pointer.x) * (size.width / 2);
      const dy = (projected.y - pointer.y) * (size.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      const cameraDistance = camera.position.distanceTo(point);
      const threshold = Math.min(28, 10 + cameraDistance * 0.25);

      if (distance <= threshold && distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }

    return closestIndex;
  };

  const rotatePoint = (point: THREE.Vector3, angleRad: number) => {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    return new THREE.Vector3(
      point.x * cos - point.z * sin,
      point.y,
      point.x * sin + point.z * cos
    );
  };

  const baseProfilePoints = useMemo(() => {
    if (tower.points.length === 0) return [];
    if (!tower.isClosed || bevel <= 0 || tower.points.length < 3) {
      const densified = subdividePolyline(tower.points, tower.isClosed, ghostSubdivisions);
      return tower.isClosed ? [...densified, densified[0]] : densified;
    }

    const points = tower.points.map((point) => new THREE.Vector3(point.x, point.y, point.z));
    const arcs: THREE.Vector3[][] = [];

    for (let i = 0; i < points.length; i += 1) {
      const prev = points[(i - 1 + points.length) % points.length];
      const current = points[i];
      const next = points[(i + 1) % points.length];

      const vPrev = new THREE.Vector3(prev.x - current.x, 0, prev.z - current.z);
      const vNext = new THREE.Vector3(next.x - current.x, 0, next.z - current.z);

      const lenPrev = vPrev.length();
      const lenNext = vNext.length();
      if (lenPrev < 1e-4 || lenNext < 1e-4) {
        arcs.push([current.clone()]);
        continue;
      }

      const dirPrev = vPrev.clone().normalize();
      const dirNext = vNext.clone().normalize();
      const maxD = Math.min(lenPrev, lenNext) * 0.45;
      const d = bevel <= 1 ? bevel * maxD : Math.min(bevel, maxD);

      const p1 = new THREE.Vector3(
        current.x + dirPrev.x * d,
        current.y,
        current.z + dirPrev.z * d
      );
      const p2 = new THREE.Vector3(
        current.x + dirNext.x * d,
        current.y,
        current.z + dirNext.z * d
      );
      const arc: THREE.Vector3[] = [];
      const interior = dirPrev.angleTo(dirNext);
      const res = Math.max(tower.params.bevelResolution, 1);

      if (interior <= 1e-4 || d <= 1e-4) {
        arc.push(p1, p2);
      } else {
        const centerDir = dirPrev.clone().add(dirNext.clone()).normalize();
        const radius = d / Math.sin(interior / 2);
        const center = new THREE.Vector3(
          current.x + centerDir.x * radius,
          current.y,
          current.z + centerDir.z * radius
        );
        const startAngle = Math.atan2(p1.z - center.z, p1.x - center.x);
        const endAngle = Math.atan2(p2.z - center.z, p2.x - center.x);
        const crossY = dirPrev.clone().cross(dirNext).y;
        let delta = endAngle - startAngle;
        if (crossY > 0 && delta <= 0) delta += Math.PI * 2;
        if (crossY < 0 && delta >= 0) delta -= Math.PI * 2;
        for (let s = 0; s <= res; s += 1) {
          const t = s / res;
          const angle = startAngle + delta * t;
          arc.push(new THREE.Vector3(
            center.x + Math.cos(angle) * radius,
            current.y,
            center.z + Math.sin(angle) * radius
          ));
        }
      }

      arcs.push(arc);
    }

    const withSubdivisions: THREE.Vector3[] = [];
    for (let i = 0; i < points.length; i += 1) {
      const nextIndex = (i + 1) % points.length;
      const nextArc = arcs[nextIndex];
      const currentArc = arcs[i];
      if (currentArc.length === 0 || nextArc.length === 0) continue;
      const p2 = currentArc[currentArc.length - 1];
      const nextP1 = nextArc[0];

      withSubdivisions.push(...currentArc.map((point) => point.clone()));

      for (let s = 1; s <= ghostSubdivisions; s += 1) {
        const t = s / (ghostSubdivisions + 1);
        withSubdivisions.push(
          new THREE.Vector3(
            lerp(p2.x, nextP1.x, t),
            lerp(p2.y, nextP1.y, t),
            lerp(p2.z, nextP1.z, t)
          )
        );
      }
    }

    if (withSubdivisions.length > 0) {
      withSubdivisions.push(withSubdivisions[0].clone());
    }

    return withSubdivisions;
  }, [bevel, bevelResolution, ghostSubdivisions, tower.isClosed, tower.points]);

  const baseLineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    if (baseProfilePoints.length > 0) {
      geometry.setFromPoints(baseProfilePoints);
    }
    return geometry;
  }, [baseProfilePoints]);

  const previewLineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    if (previewPoint && tower.points.length > 0 && mode === 'draw' && isDrawing) {
      geometry.setFromPoints([tower.points[tower.points.length - 1], previewPoint]);
    }
    return geometry;
  }, [isDrawing, mode, previewPoint, tower.points]);

  const towerData = useMemo(() => {
    const basePoints = baseProfilePoints;
    if (!tower.isClosed || basePoints.length < 2 || tower.params.floors < 1) {
      return {
        sideLineGeometries: [] as THREE.BufferGeometry[],
        sideFaceGeometry: null as THREE.BufferGeometry | null,
        floorGeometries: [] as THREE.BufferGeometry[],
        wallGeometries: [] as THREE.BufferGeometry[],
      };
    }

    const totalTwist = 180 * tower.params.twist;
    const floorsCount = Math.max(tower.params.floors, 2);
    const ghostSegments = Math.max(tower.params.ghostSubdivisions, 0);
    const stepsPerSegment = ghostSegments + 1;
    const totalSteps = (floorsCount - 1) * stepsPerSegment;
    const totalLevels = totalSteps + 1;
    const centroid = basePoints.reduce(
      (acc, point) => new THREE.Vector3(acc.x + point.x, acc.y + point.y, acc.z + point.z),
      new THREE.Vector3(0, 0, 0)
    ).multiplyScalar(1 / basePoints.length);

    const levelPoints = Array.from({ length: totalLevels }, (_, level) => {
      const t = totalSteps === 0 ? 0 : level / totalSteps;
      const angle = degToRad(totalTwist * t);
      const scale = Math.max(1 - tower.params.topInset * t, 0.05);
      const height = tower.params.floorHeight * (level / stepsPerSegment);
      return basePoints.map((point) => {
        const local = new THREE.Vector3(
          point.x - centroid.x,
          point.y,
          point.z - centroid.z
        ).multiplyScalar(1 + tower.params.bottomOffset);
        const scaled = new THREE.Vector3(local.x * scale, local.y, local.z * scale);
        const rotated = rotatePoint(scaled, angle);
        return new THREE.Vector3(
          rotated.x + centroid.x,
          rotated.y + height,
          rotated.z + centroid.z
        );
      });
    });

    const floorGeometries: THREE.BufferGeometry[] = [];
    const slabThickness = tower.params.slabThickness;
    for (let floorIndex = 0; floorIndex < floorsCount; floorIndex += 1) {
      const level = floorIndex * stepsPerSegment;
      const ring = levelPoints[level];
      if (!ring || ring.length < 3) continue;

      const sanitized = [...ring];
      const first = sanitized[0];
      const last = sanitized[sanitized.length - 1];
      if (first.distanceToSquared(last) < 1e-6) {
        sanitized.pop();
      }

      if (sanitized.length < 3) continue;

      const shape = new THREE.Shape(
        sanitized.map((point) => new THREE.Vector2(point.x, point.z))
      );
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: slabThickness,
        bevelEnabled: false,
        steps: 1,
      });
      geometry.rotateX(Math.PI / 2);
      geometry.translate(0, ring[0].y + 0.1, 0);
      floorGeometries.push(geometry);
    }

    const sideLineGeometries: THREE.BufferGeometry[] = [];
    for (let level = 0; level < levelPoints.length - 1; level += 1) {
      const current = levelPoints[level];
      const next = levelPoints[level + 1];
      for (let i = 0; i < current.length - 1; i += 1) {
        const geometry = new THREE.BufferGeometry();
        geometry.setFromPoints([current[i], next[i]]);
        sideLineGeometries.push(geometry);
      }
    }

    const positions: number[] = [];
    for (let level = 0; level < levelPoints.length - 1; level += 1) {
      const current = levelPoints[level];
      const next = levelPoints[level + 1];
      for (let i = 0; i < current.length - 1; i += 1) {
        const p0 = current[i];
        const p1 = current[i + 1];
        const p0t = next[i];
        const p1t = next[i + 1];
        positions.push(
          p0.x, p0.y, p0.z,
          p1.x, p1.y, p1.z,
          p1t.x, p1t.y, p1t.z,
          p0.x, p0.y, p0.z,
          p1t.x, p1t.y, p1t.z,
          p0t.x, p0t.y, p0t.z,
        );
      }
    }

    const sideFaceGeometry = tower.params.showShell
      ? new THREE.BufferGeometry()
      : null;
    if (sideFaceGeometry) {
      sideFaceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      sideFaceGeometry.computeVertexNormals();
    }

    const wallGeometries: THREE.BufferGeometry[] = [];

    return {
      sideLineGeometries,
      sideFaceGeometry,
      floorGeometries,
      wallGeometries,
      centroid,
      floorsCount,
    };
  }, [tower, baseProfilePoints]);

  const showSite = state.showSite ?? true;

  return (
    <group>
      {showSite ? <primitive object={dubaiClone} position={[0, 0, 0]} scale={1} /> : null}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerDown={handlePlanePointerDown}
        onPointerMove={handlePlanePointerMove}
        onPointerUp={handlePlanePointerUp}
      >
        <planeGeometry args={[400, 400]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {baseProfilePoints.length > 1 ? (
        <lineSegments geometry={baseLineGeometry}>
          <lineBasicMaterial color="#f59e0b" linewidth={2} />
        </lineSegments>
      ) : null}

      {previewPoint && tower.points.length > 0 && mode === 'draw' && isDrawing ? (
        <>
          <lineSegments geometry={previewLineGeometry}>
            <lineBasicMaterial color="#fbbf24" linewidth={2} />
          </lineSegments>
          <mesh position={[previewPoint.x, previewPoint.y, previewPoint.z]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
        </>
      ) : null}

      {cursorPoint && mode === 'draw' && isDrawing ? (
        <mesh position={[cursorPoint.x, cursorPoint.y + 0.02, cursorPoint.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshBasicMaterial color="#000000" transparent opacity={0} />
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(0.5, 0.5)]} />
            <lineBasicMaterial color={closeToStart ? '#22c55e' : '#fbbf24'} linewidth={2} />
          </lineSegments>
        </mesh>
      ) : null}

      {towerData.sideLineGeometries.map((geometry, index) => (
        <lineSegments key={`side-${index}`} geometry={geometry}>
          <lineBasicMaterial color="#d1d5db" linewidth={1} transparent opacity={0.6} />
        </lineSegments>
      ))}

      {towerData.sideFaceGeometry ? (
        <mesh geometry={towerData.sideFaceGeometry}>
          <meshStandardMaterial color="#ffffff" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      ) : null}

      {towerData.floorGeometries.map((geometry, index) => (
        <mesh key={`floor-${index}`} geometry={geometry}>
          <meshStandardMaterial color="#f8fafc" transparent opacity={0.92} />
        </mesh>
      ))}

      {towerData.centroid && towerData.floorsCount ? (
        <>
          {centralColumnRadius > 0 ? (
            <mesh position={[towerData.centroid.x, ((towerData.floorsCount - 1) * floorHeight - slabThickness) * 0.5, towerData.centroid.z]}>
              <cylinderGeometry args={[centralColumnRadius, centralColumnRadius, (towerData.floorsCount - 1) * floorHeight, 32]} />
              <meshStandardMaterial color="#cbd5f5" transparent opacity={0.9} />
            </mesh>
          ) : null}
          {columnCount > 0 && columnRadius > 0 && (centralColumnRadius + columnRingOffset) > 0 ? (
            Array.from({ length: columnCount }, (_, idx) => {
              const angle = (idx / columnCount) * Math.PI * 2;
              const ringRadius = centralColumnRadius + columnRingOffset;
              const x = towerData.centroid.x + Math.cos(angle) * ringRadius;
              const z = towerData.centroid.z + Math.sin(angle) * ringRadius;
              return (
                <mesh key={`column-${idx}`} position={[x, ((towerData.floorsCount - 1) * floorHeight - slabThickness) * 0.5, z]}>
                  <cylinderGeometry args={[columnRadius, columnRadius, (towerData.floorsCount - 1) * floorHeight, 20]} />
                  <meshStandardMaterial color="#e2e8f0" transparent opacity={0.9} />
                </mesh>
              );
            })
          ) : null}
        </>
      ) : null}

      {tower.points.map((point, index) => (
        (() => {
          const isDragging = dragIndex === index;
          const isHovered = hoverIndex === index;
          const radius = isDragging ? 0.35 : isHovered ? 0.3 : 0.2;
          const color = isDragging ? '#38bdf8' : isHovered ? '#fbbf24' : '#94a3b8';

          return (
        <mesh
          key={`point-${index}`}
          position={[point.x, point.y, point.z]}
          onPointerDown={(event) => {
            if (mode !== 'edit') return;
            if (event.button !== 0) return;
            event.stopPropagation();
            setDragIndex(index);
          }}
          onPointerUp={handlePlanePointerUp}
          onPointerOver={() => {
            if (mode !== 'edit') return;
            setHoverIndex(index);
          }}
          onPointerOut={() => {
            setHoverIndex((prev) => (prev === index ? null : prev));
          }}
        >
          <sphereGeometry args={[radius, 16, 16]} />
          <meshStandardMaterial color={mode === 'edit' ? color : '#94a3b8'} />
        </mesh>
          );
        })()
      ))}
    </group>
  );
}

useGLTF.preload(assetPath('/assets/dubai.glb'));
