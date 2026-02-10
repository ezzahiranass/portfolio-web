'use client';

import { useThree } from '@react-three/fiber';
import ClientOnlyCanvas from '@/app/components/three/ClientOnlyCanvas';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import GUI from 'lil-gui';
import * as THREE from 'three';
import type { ModelDefinition, ParamValues } from './types';
import CanvasKickstart from '@/app/components/three/CanvasKickstart';

type ConfiguratorShellProps = {
  model: ModelDefinition;
};

function ShiftMmbPan({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  const { gl } = useThree();

  useEffect(() => {
    const controls = controlsRef.current;
    const el = gl.domElement;
    if (!controls || !el) return undefined;

    const setRotate = () => {
      controls.mouseButtons = {
        LEFT: -1 as unknown as THREE.MOUSE,
        MIDDLE: THREE.MOUSE.ROTATE,
        RIGHT: -1 as unknown as THREE.MOUSE,
      };
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 1) return;
      if (event.shiftKey) {
        controls.mouseButtons = {
          LEFT: -1 as unknown as THREE.MOUSE,
          MIDDLE: THREE.MOUSE.PAN,
          RIGHT: -1 as unknown as THREE.MOUSE,
        };
      } else {
        setRotate();
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.button !== 1) return;
      setRotate();
    };

    setRotate();
    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('pointerup', handlePointerUp);

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointerup', handlePointerUp);
    };
  }, [controlsRef, gl]);

  return null;
}

function ZoomOnSketchCommit() {
  const { camera } = useThree();

  useEffect(() => {
    let raf = 0;
    let startTime = 0;

    const handleCommit = () => {
      if (raf) cancelAnimationFrame(raf);
      const from = camera.position.clone();
      const to = new THREE.Vector3(-50, 2, -50);
      const duration = 700;
      startTime = performance.now();

      const tick = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        camera.position.lerpVectors(from, to, eased);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        if (t < 1) {
          raf = requestAnimationFrame(tick);
        }
      };

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('sketch:commit', handleCommit as EventListener);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('sketch:commit', handleCommit as EventListener);
    };
  }, [camera]);

  return null;
}

export default function ConfiguratorShell({ model }: ConfiguratorShellProps) {
  const guiRef = useRef<HTMLDivElement | null>(null);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<any>(null);
  const [params, setParams] = useState<ParamValues>(() => ({ ...model.defaults }));
  const cameraPosition = model.camera?.position ?? ([1, 1, 1] as [number, number, number]);
  const cameraFov = model.camera?.fov ?? 50;

  useEffect(() => {
    setParams({ ...model.defaults });
  }, [model]);

  useEffect(() => {
    if (!guiRef.current) return undefined;

    const gui = new GUI({ container: guiRef.current, width: 240, title: model.name });
    const statsGui = model.buildStats && statsRef.current
      ? new GUI({ container: statsRef.current, width: 240, title: 'Stats' })
      : null;

    const state: ParamValues = { ...model.defaults };
    const onChange = (next: ParamValues) => setParams({ ...next });

    model.buildGui(gui, state, onChange);
    if (statsGui && model.buildStats) {
      model.buildStats(statsGui, state, onChange);
    }

    return () => {
      gui.destroy();
      statsGui?.destroy();
    };
  }, [model]);

  return (
    <div
      className="relative h-[32rem] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]"
      onContextMenu={(event) => event.preventDefault()}
      onMouseDown={(event) => {
        if (event.button === 1) {
          event.preventDefault();
        }
      }}
      onAuxClick={(event) => {
        if (event.button === 1) {
          event.preventDefault();
        }
      }}
    >
      <div ref={statsRef} className="absolute left-3 top-3 z-10" />
      <div
        ref={guiRef}
        className="absolute right-3 top-3 z-10 max-h-[calc(100%-24px)] overflow-auto"
      />
      <ClientOnlyCanvas
        shadows
        camera={{
          position: cameraPosition,
          fov: cameraFov,
          near: 0.5,
          far: 10000,
        }}
      >
        <CanvasKickstart />
        <ShiftMmbPan controlsRef={controlsRef} />
        <ZoomOnSketchCommit />
        <color attach="background" args={['#3f3f3f']} />
        <fog attach="fog" args={['#3f3f3f', 50, 500]} />
        <ambientLight intensity={0.6} />
        <directionalLight
          castShadow
          intensity={1.0}
          position={[3, 5, 2]}
          shadow-mapSize={[1024, 1024]}
          shadow-camera-near={0.1}
          shadow-camera-far={20}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
        />
        <gridHelper args={[400, 200, 0x5a5a5a, 0x2a2a2a]} position={[0, 0, 0]} />
        {model.render(params)}
        <OrbitControls
          makeDefault
          enablePan
          enableZoom
          enableRotate
          ref={controlsRef}
          mouseButtons={{
            LEFT: -1 as unknown as THREE.MOUSE,
            MIDDLE: THREE.MOUSE.ROTATE,
            RIGHT: -1 as unknown as THREE.MOUSE,
          }}
          maxDistance={300}
        />
      </ClientOnlyCanvas>
    </div>
  );
}
