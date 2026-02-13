import * as THREE from "three";

export type EdgeRecord = {
  a: number;
  b: number;
  f0: number;
  f1: number;
  isFeature: boolean;
};

export type GeometryEdgeData = {
  positions: Float32Array;
  faces: Uint32Array;
  faceNormals: Float32Array;
  faceCenters: Float32Array;
  edges: EdgeRecord[];
  featureEdgeCount: number;
};

type EdgeAdjacency = {
  a: number;
  b: number;
  f0: number;
  f1: number;
};

const DEFAULT_THRESHOLD = 20;
const EPSILON = 1e-12;
const edgeDataCache = new WeakMap<THREE.BufferGeometry, Map<number, GeometryEdgeData>>();

function clampThresholdAngle(value: number | undefined): number {
  const fallback = Number.isFinite(value) ? (value as number) : DEFAULT_THRESHOLD;
  return THREE.MathUtils.clamp(fallback, 0, 180);
}

function toUint32IndexArray(index: THREE.BufferAttribute | null, vertexCount: number): Uint32Array {
  if (!index) {
    const generated = new Uint32Array(vertexCount);
    for (let i = 0; i < vertexCount; i += 1) {
      generated[i] = i;
    }
    return generated;
  }

  const src = index.array as ArrayLike<number>;
  const out = new Uint32Array(src.length);
  for (let i = 0; i < src.length; i += 1) {
    out[i] = src[i];
  }
  return out;
}

function createEdgeKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export function getGeometryEdgeData(
  geometry: THREE.BufferGeometry,
  thresholdAngle: number = DEFAULT_THRESHOLD
): GeometryEdgeData {
  const clampedThreshold = clampThresholdAngle(thresholdAngle);
  const thresholdKey = Math.round(clampedThreshold * 1000) / 1000;
  let byThreshold = edgeDataCache.get(geometry);
  if (!byThreshold) {
    byThreshold = new Map<number, GeometryEdgeData>();
    edgeDataCache.set(geometry, byThreshold);
  }

  const cached = byThreshold.get(thresholdKey);
  if (cached) {
    return cached;
  }

  const positionAttr = geometry.getAttribute("position");
  if (!positionAttr || positionAttr.itemSize < 3) {
    const empty: GeometryEdgeData = {
      positions: new Float32Array(0),
      faces: new Uint32Array(0),
      faceNormals: new Float32Array(0),
      faceCenters: new Float32Array(0),
      edges: [],
      featureEdgeCount: 0,
    };
    byThreshold.set(thresholdKey, empty);
    return empty;
  }

  const vertexCount = positionAttr.count;
  const positions = new Float32Array(vertexCount * 3);
  for (let i = 0; i < vertexCount; i += 1) {
    const base = i * 3;
    positions[base] = positionAttr.getX(i);
    positions[base + 1] = positionAttr.getY(i);
    positions[base + 2] = positionAttr.getZ(i);
  }

  const indices = toUint32IndexArray(geometry.index, vertexCount);
  const faceCount = Math.floor(indices.length / 3);
  const faces = new Uint32Array(faceCount * 3);
  const faceNormals = new Float32Array(faceCount * 3);
  const faceCenters = new Float32Array(faceCount * 3);
  const edgeMap = new Map<string, EdgeAdjacency>();

  const v0 = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  const n = new THREE.Vector3();
  const c = new THREE.Vector3();

  for (let faceIndex = 0; faceIndex < faceCount; faceIndex += 1) {
    const base = faceIndex * 3;
    const i0 = indices[base];
    const i1 = indices[base + 1];
    const i2 = indices[base + 2];
    faces[base] = i0;
    faces[base + 1] = i1;
    faces[base + 2] = i2;

    if (i0 >= vertexCount || i1 >= vertexCount || i2 >= vertexCount) {
      continue;
    }

    const i0p = i0 * 3;
    const i1p = i1 * 3;
    const i2p = i2 * 3;

    v0.set(positions[i0p], positions[i0p + 1], positions[i0p + 2]);
    v1.set(positions[i1p], positions[i1p + 1], positions[i1p + 2]);
    v2.set(positions[i2p], positions[i2p + 1], positions[i2p + 2]);

    e1.subVectors(v1, v0);
    e2.subVectors(v2, v0);
    n.crossVectors(e1, e2);
    if (n.lengthSq() > EPSILON) {
      n.normalize();
      faceNormals[base] = n.x;
      faceNormals[base + 1] = n.y;
      faceNormals[base + 2] = n.z;
    }

    c.copy(v0).add(v1).add(v2).multiplyScalar(1 / 3);
    faceCenters[base] = c.x;
    faceCenters[base + 1] = c.y;
    faceCenters[base + 2] = c.z;

    const addAdjacency = (a: number, b: number) => {
      if (a === b) return;
      const lo = a < b ? a : b;
      const hi = a < b ? b : a;
      const key = createEdgeKey(lo, hi);
      const existing = edgeMap.get(key);
      if (!existing) {
        edgeMap.set(key, { a: lo, b: hi, f0: faceIndex, f1: -1 });
        return;
      }
      if (existing.f1 === -1 && existing.f0 !== faceIndex) {
        existing.f1 = faceIndex;
      }
    };

    addAdjacency(i0, i1);
    addAdjacency(i1, i2);
    addAdjacency(i2, i0);
  }

  const cosThreshold = Math.cos(THREE.MathUtils.degToRad(clampedThreshold));
  const edges: EdgeRecord[] = [];
  let featureEdgeCount = 0;
  for (const adjacency of edgeMap.values()) {
    let isFeature = false;
    if (adjacency.f1 === -1) {
      isFeature = true;
    } else {
      const n0Base = adjacency.f0 * 3;
      const n1Base = adjacency.f1 * 3;
      const n0x = faceNormals[n0Base];
      const n0y = faceNormals[n0Base + 1];
      const n0z = faceNormals[n0Base + 2];
      const n1x = faceNormals[n1Base];
      const n1y = faceNormals[n1Base + 1];
      const n1z = faceNormals[n1Base + 2];
      const n0LenSq = n0x * n0x + n0y * n0y + n0z * n0z;
      const n1LenSq = n1x * n1x + n1y * n1y + n1z * n1z;
      if (n0LenSq > EPSILON && n1LenSq > EPSILON) {
        const dot = THREE.MathUtils.clamp(n0x * n1x + n0y * n1y + n0z * n1z, -1, 1);
        isFeature = dot <= cosThreshold;
      }
    }

    if (isFeature) {
      featureEdgeCount += 1;
    }

    edges.push({
      a: adjacency.a,
      b: adjacency.b,
      f0: adjacency.f0,
      f1: adjacency.f1,
      isFeature,
    });
  }

  const result: GeometryEdgeData = {
    positions,
    faces,
    faceNormals,
    faceCenters,
    edges,
    featureEdgeCount,
  };
  byThreshold.set(thresholdKey, result);
  return result;
}

export function buildSegmentPositions(
  vertexPositions: Float32Array,
  edges: readonly Pick<EdgeRecord, "a" | "b">[]
): Float32Array {
  const out = new Float32Array(edges.length * 6);
  let offset = 0;
  for (const edge of edges) {
    const aBase = edge.a * 3;
    const bBase = edge.b * 3;
    out[offset] = vertexPositions[aBase];
    out[offset + 1] = vertexPositions[aBase + 1];
    out[offset + 2] = vertexPositions[aBase + 2];
    out[offset + 3] = vertexPositions[bBase];
    out[offset + 4] = vertexPositions[bBase + 1];
    out[offset + 5] = vertexPositions[bBase + 2];
    offset += 6;
  }
  return out;
}
