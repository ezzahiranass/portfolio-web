"use client";
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { buildSegmentPositions, getGeometryEdgeData } from "./edgeData";

export type StylizedEdgesProps = {
  targetRef: RefObject<THREE.Object3D | null>;
  thresholdAngle?: number;
  thinWidthPx?: number;
  silhouetteWidthPx?: number;
  thinColor?: THREE.ColorRepresentation;
  silhouetteColor?: THREE.ColorRepresentation;
  thinOpacity?: number;
  silhouetteOpacity?: number;
  depthTest?: boolean;
  depthWrite?: boolean;
  includeBoundaryInSilhouette?: boolean;
  enabled?: boolean;
};

type MeshEntry = {
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>;
  lineThin: LineSegments2;
  lineSilhouette: LineSegments2;
  geomThin: LineSegmentsGeometry;
  geomSilhouette: LineSegmentsGeometry;
  matThin: LineMaterial;
  matSilhouette: LineMaterial;
  positions: Float32Array;
  faceNormals: Float32Array;
  faceCenters: Float32Array;
  edges: Array<{ a: number; b: number; f0: number; f1: number }>;
  faceSigns: Float32Array;
  silhouetteBuffer: Float32Array;
};

const DEFAULTS = {
  thresholdAngle: 20,
  thinWidthPx: 0.7,
  silhouetteWidthPx: 1.35,
  thinColor: "#ffffff",
  silhouetteColor: "#ffffff",
  thinOpacity: 0.38,
  silhouetteOpacity: 0.58,
  depthTest: true,
  depthWrite: false,
  includeBoundaryInSilhouette: true,
  enabled: true,
} as const;

const FACE_SIGN_EPSILON = 1e-6;

function applyMaterialStyle(
  material: LineMaterial,
  color: THREE.ColorRepresentation,
  opacity: number,
  linewidth: number,
  depthTest: boolean,
  depthWrite: boolean
) {
  material.color.set(color);
  material.opacity = opacity;
  material.transparent = opacity < 1;
  material.linewidth = linewidth;
  material.depthTest = depthTest;
  material.depthWrite = depthWrite;
  material.toneMapped = false;
  material.needsUpdate = true;
}

export default function StylizedEdges({
  targetRef,
  thresholdAngle = DEFAULTS.thresholdAngle,
  thinWidthPx = DEFAULTS.thinWidthPx,
  silhouetteWidthPx = DEFAULTS.silhouetteWidthPx,
  thinColor = DEFAULTS.thinColor,
  silhouetteColor = DEFAULTS.silhouetteColor,
  thinOpacity = DEFAULTS.thinOpacity,
  silhouetteOpacity = DEFAULTS.silhouetteOpacity,
  depthTest = DEFAULTS.depthTest,
  depthWrite = DEFAULTS.depthWrite,
  includeBoundaryInSilhouette = DEFAULTS.includeBoundaryInSilhouette,
  enabled = DEFAULTS.enabled,
}: StylizedEdgesProps) {
  const { camera, gl, size } = useThree();
  const entriesRef = useRef<MeshEntry[]>([]);
  const lastTargetRef = useRef<THREE.Object3D | null>(null);
  const needsRebuildRef = useRef(true);
  const resolutionRef = useRef({ width: -1, height: -1 });
  const normalMatrix = useMemo(() => new THREE.Matrix3(), []);
  const cameraPosition = useMemo(() => new THREE.Vector3(), []);
  const normalWorld = useMemo(() => new THREE.Vector3(), []);
  const centerWorld = useMemo(() => new THREE.Vector3(), []);
  const viewDir = useMemo(() => new THREE.Vector3(), []);

  const disposeEntries = () => {
    const entries = entriesRef.current;
    for (const entry of entries) {
      entry.lineThin.removeFromParent();
      entry.lineSilhouette.removeFromParent();
      entry.geomThin.dispose();
      entry.geomSilhouette.dispose();
      entry.matThin.dispose();
      entry.matSilhouette.dispose();
    }
    entriesRef.current = [];
  };

  const rebuildEntries = (target: THREE.Object3D | null) => {
    disposeEntries();
    if (!target || !enabled) return;

    const nextEntries: MeshEntry[] = [];
    target.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      if ((node as THREE.InstancedMesh).isInstancedMesh) return;
      if ((node as THREE.SkinnedMesh).isSkinnedMesh) return;
      if ((node as { isLineSegments2?: boolean }).isLineSegments2) return;
      if (!node.visible) return;

      const geometry = node.geometry;
      if (!(geometry instanceof THREE.BufferGeometry)) return;

      const edgeData = getGeometryEdgeData(geometry, thresholdAngle);
      if (edgeData.positions.length === 0 || edgeData.edges.length === 0) return;

      const featureEdges = edgeData.edges.filter((edge) => edge.isFeature);
      const thinPositions =
        featureEdges.length > 0
          ? buildSegmentPositions(edgeData.positions, featureEdges)
          : new Float32Array(6);
      const silhouetteBuffer = new Float32Array(Math.max(1, edgeData.edges.length) * 6);

      const geomThin = new LineSegmentsGeometry();
      geomThin.setPositions(thinPositions);
      geomThin.instanceCount = featureEdges.length;

      const matThin = new LineMaterial();
      applyMaterialStyle(matThin, thinColor, thinOpacity, thinWidthPx, depthTest, depthWrite);
      const lineThin = new LineSegments2(geomThin, matThin);
      lineThin.frustumCulled = false;

      const geomSilhouette = new LineSegmentsGeometry();
      geomSilhouette.setPositions(silhouetteBuffer);
      geomSilhouette.instanceCount = 0;

      const matSilhouette = new LineMaterial();
      applyMaterialStyle(
        matSilhouette,
        silhouetteColor,
        silhouetteOpacity,
        silhouetteWidthPx,
        depthTest,
        depthWrite
      );
      const lineSilhouette = new LineSegments2(geomSilhouette, matSilhouette);
      lineSilhouette.frustumCulled = false;

      node.add(lineThin);
      node.add(lineSilhouette);

      nextEntries.push({
        mesh: node,
        lineThin,
        lineSilhouette,
        geomThin,
        geomSilhouette,
        matThin,
        matSilhouette,
        positions: edgeData.positions,
        faceNormals: edgeData.faceNormals,
        faceCenters: edgeData.faceCenters,
        edges: edgeData.edges.map((edge) => ({
          a: edge.a,
          b: edge.b,
          f0: edge.f0,
          f1: edge.f1,
        })),
        faceSigns: new Float32Array(edgeData.faceNormals.length / 3),
        silhouetteBuffer,
      });
    });

    entriesRef.current = nextEntries;
    const width = size.width * gl.getPixelRatio();
    const height = size.height * gl.getPixelRatio();
    resolutionRef.current.width = width;
    resolutionRef.current.height = height;
    for (const entry of entriesRef.current) {
      entry.matThin.resolution.set(width, height);
      entry.matSilhouette.resolution.set(width, height);
    }
  };

  useEffect(() => {
    needsRebuildRef.current = true;
  }, [thresholdAngle, includeBoundaryInSilhouette, enabled]);

  useEffect(() => {
    const width = size.width * gl.getPixelRatio();
    const height = size.height * gl.getPixelRatio();
    for (const entry of entriesRef.current) {
      applyMaterialStyle(entry.matThin, thinColor, thinOpacity, thinWidthPx, depthTest, depthWrite);
      applyMaterialStyle(
        entry.matSilhouette,
        silhouetteColor,
        silhouetteOpacity,
        silhouetteWidthPx,
        depthTest,
        depthWrite
      );
      entry.matThin.resolution.set(width, height);
      entry.matSilhouette.resolution.set(width, height);
    }
  }, [
    thinColor,
    thinOpacity,
    thinWidthPx,
    silhouetteColor,
    silhouetteOpacity,
    silhouetteWidthPx,
    depthTest,
    depthWrite,
    size.width,
    size.height,
    gl,
  ]);

  useEffect(() => {
    return () => {
      disposeEntries();
    };
  }, []);

  useFrame(() => {
    const target = targetRef.current;
    const targetChanged = target !== lastTargetRef.current;
    if (targetChanged || needsRebuildRef.current) {
      lastTargetRef.current = target;
      rebuildEntries(target);
      needsRebuildRef.current = false;
    }

    if (!enabled || entriesRef.current.length === 0) return;

    const width = size.width * gl.getPixelRatio();
    const height = size.height * gl.getPixelRatio();
    if (width !== resolutionRef.current.width || height !== resolutionRef.current.height) {
      resolutionRef.current.width = width;
      resolutionRef.current.height = height;
      for (const entry of entriesRef.current) {
        entry.matThin.resolution.set(width, height);
        entry.matSilhouette.resolution.set(width, height);
      }
    }

    camera.getWorldPosition(cameraPosition);

    for (const entry of entriesRef.current) {
      const meshVisible = entry.mesh.visible;
      entry.lineThin.visible = meshVisible && entry.geomThin.instanceCount > 0;
      entry.lineSilhouette.visible = meshVisible;
      if (!meshVisible) continue;

      normalMatrix.getNormalMatrix(entry.mesh.matrixWorld);
      const faceCount = entry.faceSigns.length;
      for (let faceIndex = 0; faceIndex < faceCount; faceIndex += 1) {
        const base = faceIndex * 3;
        const nx = entry.faceNormals[base];
        const ny = entry.faceNormals[base + 1];
        const nz = entry.faceNormals[base + 2];
        if (nx === 0 && ny === 0 && nz === 0) {
          entry.faceSigns[faceIndex] = 0;
          continue;
        }

        normalWorld.set(nx, ny, nz).applyMatrix3(normalMatrix).normalize();
        centerWorld
          .set(entry.faceCenters[base], entry.faceCenters[base + 1], entry.faceCenters[base + 2])
          .applyMatrix4(entry.mesh.matrixWorld);
        viewDir.subVectors(cameraPosition, centerWorld).normalize();
        entry.faceSigns[faceIndex] = normalWorld.dot(viewDir);
      }

      let writeOffset = 0;
      for (const edge of entry.edges) {
        let isSilhouette = false;
        if (edge.f1 === -1) {
          isSilhouette = includeBoundaryInSilhouette;
        } else {
          const s0 = entry.faceSigns[edge.f0];
          const s1 = entry.faceSigns[edge.f1];
          const signProduct = s0 * s1;
          const bothNearZero =
            Math.abs(s0) <= FACE_SIGN_EPSILON && Math.abs(s1) <= FACE_SIGN_EPSILON;
          isSilhouette = !bothNearZero && signProduct <= 0;
        }

        if (!isSilhouette) continue;

        const aBase = edge.a * 3;
        const bBase = edge.b * 3;
        entry.silhouetteBuffer[writeOffset] = entry.positions[aBase];
        entry.silhouetteBuffer[writeOffset + 1] = entry.positions[aBase + 1];
        entry.silhouetteBuffer[writeOffset + 2] = entry.positions[aBase + 2];
        entry.silhouetteBuffer[writeOffset + 3] = entry.positions[bBase];
        entry.silhouetteBuffer[writeOffset + 4] = entry.positions[bBase + 1];
        entry.silhouetteBuffer[writeOffset + 5] = entry.positions[bBase + 2];
        writeOffset += 6;
      }

      entry.geomSilhouette.instanceCount = writeOffset / 6;

      const attrStart = entry.geomSilhouette.getAttribute(
        "instanceStart"
      ) as THREE.InterleavedBufferAttribute | undefined;
      const attrEnd = entry.geomSilhouette.getAttribute(
        "instanceEnd"
      ) as THREE.InterleavedBufferAttribute | undefined;
      if (attrStart && attrEnd) {
        attrStart.data.needsUpdate = true;
        attrEnd.data.needsUpdate = true;
      }
    }
  });

  return null;
}
