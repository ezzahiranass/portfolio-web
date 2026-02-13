'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState, type MutableRefObject } from 'react';
import GUI from 'lil-gui';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { ModelDefinition, ParamValues } from './types';
import {
  ConfiguratorThemeProvider,
  useConfiguratorThemePalette,
} from './theme';

type ConfiguratorShellProps = {
  model: ModelDefinition;
};

function ShiftMmbPan({
  controlsRef,
}: {
  controlsRef: MutableRefObject<OrbitControlsImpl | null>;
}) {
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

function SceneTheme() {
  const theme = useConfiguratorThemePalette();
  const gridRef = useRef<THREE.GridHelper | null>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const materials = Array.isArray(grid.material) ? grid.material : [grid.material];
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = 0.18;
      material.depthWrite = false;
      material.needsUpdate = true;
    });
  }, [theme.gridMajor, theme.gridMinor]);

  return (
    <>
      <color attach="background" args={[theme.bg]} />
      <fog attach="fog" args={[theme.fog, 50, 500]} />
      <ambientLight intensity={0.6} color={theme.ambientLight} />
      <directionalLight
        castShadow
        color={theme.keyLight}
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
      <gridHelper
        ref={gridRef}
        args={[400, 200, theme.gridMajor, theme.gridMinor]}
        position={[0, 0, 0]}
      />
    </>
  );
}

export default function ConfiguratorShell({ model }: ConfiguratorShellProps) {
  const guiRef = useRef<HTMLDivElement | null>(null);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [params, setParams] = useState<ParamValues>(() => ({ ...model.defaults }));
  const [isCanvasEnabled, setIsCanvasEnabled] = useState(false);
  const cameraPosition = model.camera?.position ?? ([1, 1, 1] as [number, number, number]);
  const cameraFov = model.camera?.fov ?? 50;

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

    if (document.visibilityState === 'visible') {
      enableCanvas();
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        enableCanvas();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelAnimationFrame(rafA);
      cancelAnimationFrame(rafB);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

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
      className="configurator-shell"
      id={`configurator-${model.id}`}
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
      <div ref={statsRef} className="configurator-shell__stats" />
      <div ref={guiRef} className="configurator-shell__gui" />
      <ConfiguratorThemeProvider>
        {isCanvasEnabled ? (
          <Canvas
            shadows
            camera={{
              position: cameraPosition,
              fov: cameraFov,
              near: 0.5,
              far: 10000,
            }}
            frameloop="always"
            resize={{ scroll: true, debounce: { scroll: 0, resize: 0 } }}
          >
            <SceneBootstrap />
            <ShiftMmbPan controlsRef={controlsRef} />
            <ZoomOnSketchCommit />
            <SceneTheme />
            <Suspense fallback={null}>
              {model.render(params)}
            </Suspense>
            <DreiOrbitControls
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
          </Canvas>
        ) : null}
      </ConfiguratorThemeProvider>
    </div>
  );
}
