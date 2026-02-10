'use client';

import ClientOnlyCanvas from '@/app/components/three/ClientOnlyCanvas';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import GUI from 'lil-gui';
import CanvasKickstart from '@/app/components/three/CanvasKickstart';

type ConfigState = {
  width: number;
  height: number;
  depth: number;
  elevation: number;
  wireframe: boolean;
  showShadow: boolean;
  accent: string;
};

type GroundProps = {
  showShadow: boolean;
};

function Ground({ showShadow }: GroundProps) {
  const shadowMaterial = useMemo(() => new THREE.ShadowMaterial({
    color: '#000000',
    opacity: 0.25,
  }), []);

  return (
    <>
      <gridHelper args={[12, 12, '#c7c7c7', '#c7c7c7']} position={[0, -0.5, 0]} />
      {showShadow ? (
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.51, 0]}>
          <planeGeometry args={[24, 24]} />
          <primitive object={shadowMaterial} />
        </mesh>
      ) : null}
    </>
  );
}

export default function ConfiguratorViewer() {
  const [config, setConfig] = useState<ConfigState>({
    width: 1.4,
    height: 1.1,
    depth: 1.0,
    elevation: 0.15,
    wireframe: false,
    showShadow: true,
    accent: '#5b7cff',
  });
  const guiRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!guiRef.current) return undefined;

    const gui = new GUI({ container: guiRef.current, width: 240, title: 'Configurator' });
    const state = { ...config };

    const dimensions = gui.addFolder('Dimensions');
    const widthCtrl = dimensions.add(state, 'width', 0.6, 3.0, 0.1).name('Width');
    const heightCtrl = dimensions.add(state, 'height', 0.6, 3.0, 0.1).name('Height');
    const depthCtrl = dimensions.add(state, 'depth', 0.6, 3.0, 0.1).name('Depth');
    const elevationCtrl = dimensions.add(state, 'elevation', 0, 1.0, 0.05).name('Lift');
    dimensions.open();

    const style = gui.addFolder('Style');
    const wireframeCtrl = style.add(state, 'wireframe').name('Wireframe');
    const shadowCtrl = style.add(state, 'showShadow').name('Shadow');
    const colorCtrl = style.addColor(state, 'accent').name('Accent');
    style.open();

    const actions = {
      randomize: () => {
        const next = {
          width: Number((0.8 + Math.random() * 2.2).toFixed(2)),
          height: Number((0.8 + Math.random() * 2.2).toFixed(2)),
          depth: Number((0.8 + Math.random() * 2.2).toFixed(2)),
          elevation: Number((Math.random() * 0.6).toFixed(2)),
          wireframe: Math.random() > 0.6,
          showShadow: Math.random() > 0.3,
          accent: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
        };
        setConfig(next);
        widthCtrl.setValue(next.width);
        heightCtrl.setValue(next.height);
        depthCtrl.setValue(next.depth);
        elevationCtrl.setValue(next.elevation);
        wireframeCtrl.setValue(next.wireframe);
        shadowCtrl.setValue(next.showShadow);
        colorCtrl.setValue(next.accent);
      },
      reset: () => {
        const next = {
          width: 1.4,
          height: 1.1,
          depth: 1.0,
          elevation: 0.15,
          wireframe: false,
          showShadow: true,
          accent: '#5b7cff',
        };
        setConfig(next);
        widthCtrl.setValue(next.width);
        heightCtrl.setValue(next.height);
        depthCtrl.setValue(next.depth);
        elevationCtrl.setValue(next.elevation);
        wireframeCtrl.setValue(next.wireframe);
        shadowCtrl.setValue(next.showShadow);
        colorCtrl.setValue(next.accent);
      },
    };

    const actionsFolder = gui.addFolder('Actions');
    actionsFolder.add(actions, 'randomize').name('Randomize');
    actionsFolder.add(actions, 'reset').name('Reset');

    const sync = () => setConfig({ ...state });
    widthCtrl.onChange(sync);
    heightCtrl.onChange(sync);
    depthCtrl.onChange(sync);
    elevationCtrl.onChange(sync);
    wireframeCtrl.onChange(sync);
    shadowCtrl.onChange(sync);
    colorCtrl.onChange(sync);

    return () => {
      gui.destroy();
    };
  }, []);

  return (
    <div className="relative h-64 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]">
      <div ref={guiRef} className="absolute right-3 top-3 z-10" />
      <ClientOnlyCanvas shadows camera={{ position: [1, 1, 1], fov: 50 }}>
        <CanvasKickstart />
        <color attach="background" args={['#f2f2f2']} />
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
        <Ground showShadow={config.showShadow} />
        <mesh
          castShadow
          position={[0, config.height / 2 + config.elevation - 0.5, 0]}
        >
          <boxGeometry args={[config.width, config.height, config.depth]} />
          <meshStandardMaterial color={config.accent} wireframe={config.wireframe} />
        </mesh>
        <OrbitControls
          makeDefault
          enablePan
          enableZoom
          enableRotate
          mouseButtons={{
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.ROTATE,
            RIGHT: -1 as unknown as THREE.MOUSE,
          }}
        />
      </ClientOnlyCanvas>
    </div>
  );
}
