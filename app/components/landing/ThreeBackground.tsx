'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../theme/ThemeProvider';

type ParticleFieldProps = {
  count?: number;
  repelStrength?: number;
  returnStrength?: number;
  interactionRadius?: number;
  color: string;
};

function ParticleField({
  count = 1600,
  repelStrength = 0.08,
  returnStrength = 0.004,
  interactionRadius = 2.5,
  color,
}: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<Float32Array>(new Float32Array(count * 3));
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mousePoint = useRef(new THREE.Vector3());
  const mouseNdc = useRef(new THREE.Vector2(0, 0));
  const { gl } = useThree();

  const { viewport } = useThree();
  const basePositions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const width = viewport.width * 1.2;
    const height = viewport.height * 1.1;
    for (let i = 0; i < count; i += 1) {
      const index = i * 3;
      positions[index] = (Math.random() - 0.5) * width;
      positions[index + 1] = (Math.random() - 0.5) * height;
      positions[index + 2] = (Math.random() - 0.5) * 1.5;
    }
    return positions;
  }, [count, viewport.width, viewport.height]);

  const positions = useMemo(() => basePositions.slice(), [basePositions]);
  const driftSeed = useMemo(() => Math.random() * 1000, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      mouseNdc.current.set(x, y);
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [gl]);

  useFrame(({ camera, clock }) => {
    const points = pointsRef.current;
    if (!points) return;

    const time = clock.getElapsedTime();
    raycaster.setFromCamera(mouseNdc.current, camera);
    raycaster.ray.intersectPlane(plane, mousePoint.current);

    const pos = points.geometry.attributes.position.array as Float32Array;
    const vel = velocitiesRef.current;
    const mx = mousePoint.current.x;
    const my = mousePoint.current.y;
    const radiusSq = interactionRadius * interactionRadius;

    for (let i = 0; i < count; i += 1) {
      const index = i * 3;
      const px = pos[index];
      const py = pos[index + 1];
      const pz = pos[index + 2];

      const bx = basePositions[index];
      const by = basePositions[index + 1];
      const bz = basePositions[index + 2];

      let vx = vel[index];
      let vy = vel[index + 1];
      let vz = vel[index + 2];

      const dx = px - mx;
      const dy = py - my;
      const distSq = dx * dx + dy * dy;

      if (distSq < radiusSq) {
        const force = (1 - distSq / radiusSq) * repelStrength;
        const invDist = 1 / Math.max(Math.sqrt(distSq), 0.001);
        vx += dx * invDist * force;
        vy += dy * invDist * force;
      }

      vx += (bx - px) * returnStrength;
      vy += (by - py) * returnStrength;
      vz += (bz - pz) * returnStrength;

      const drift = 0.002;
      vx += Math.sin(time * 0.3 + bx + driftSeed) * drift;
      vy += Math.cos(time * 0.28 + by + driftSeed) * drift;

      vx *= 0.9;
      vy *= 0.9;
      vz *= 0.9;

      pos[index] += vx;
      pos[index + 1] += vy;
      pos[index + 2] += vz;

      vel[index] = vx;
      vel[index + 1] = vy;
      vel[index + 2] = vz;
    }

    points.geometry.attributes.position.needsUpdate = true;

    camera.position.x = Math.sin(time * 0.08) * 0.35;
    camera.position.y = Math.cos(time * 0.06) * 0.25;
    camera.lookAt(0, 0, 0);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.05} sizeAttenuation />
    </points>
  );
}

export default function ThreeBackground() {
  const { theme } = useTheme();
  const colors = theme === 'dark'
    ? { background: '#0a0a0a', points: '#f1f1f1' }
    : { background: '#f7f7f7', points: '#111111' };

  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 0, 12], fov: 55 }} dpr={[1, 2]}>
        <color attach="background" args={[colors.background]} />
        <ParticleField color={colors.points} />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-full bg-[linear-gradient(to_top,_var(--background),_transparent)]" />
    </div>
  );
}
