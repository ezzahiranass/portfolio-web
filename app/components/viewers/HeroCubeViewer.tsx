"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import GUI from "lil-gui";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";

type CubeControls = {
  size: number;
  posX: number;
  posY: number;
  posZ: number;
  rotXSpeed: number;
  rotYSpeed: number;
  color: string;
  opacity: number;
  wireframe: boolean;
  wireOpacity: number;
};

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

function Cube({ controls }: { controls: CubeControls }) {
  const groupRef = useRef<THREE.Group | null>(null);
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(controls.color) },
      uOpacity: { value: controls.opacity },
    }),
    [controls.color, controls.opacity]
  );

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.x += controls.rotXSpeed;
    group.rotation.y += controls.rotYSpeed;
  });

  return (
    <group
      ref={groupRef}
      position={[controls.posX, controls.posY, controls.posZ]}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[controls.size, controls.size, controls.size]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          uniforms={uniforms}
          vertexShader={`
            void main() {
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 uColor;
            uniform float uOpacity;

            void main() {
              gl_FragColor = vec4(uColor, uOpacity);
            }
          `}
        />
      </mesh>
      <mesh visible={controls.wireframe}>
        <boxGeometry args={[controls.size, controls.size, controls.size]} />
        <meshBasicMaterial
          color="#ffffff"
          wireframe
          transparent
          opacity={controls.wireOpacity}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

const initialControls: CubeControls = {
  size: 1.6,
  posX: 0,
  posY: 0,
  posZ: 0,
  rotXSpeed: 0.01,
  rotYSpeed: 0.015,
  color: "#8bd3ff",
  opacity: 0.24,
  wireframe: true,
  wireOpacity: 0.95,
};

export default function HeroCubeViewer() {
  const guiRef = useRef<HTMLDivElement | null>(null);
  const [controls, setControls] = useState<CubeControls>(initialControls);
  const controlsRef = useRef<CubeControls>(initialControls);
  const [isCanvasEnabled, setIsCanvasEnabled] = useState(false);

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

  useEffect(() => {
    if (!guiRef.current) return undefined;

    const gui = new GUI({
      container: guiRef.current,
      width: 220,
      title: "Cube Controls",
    });

    const sync = () => {
      setControls({ ...controlsRef.current });
    };

    const transforms = gui.addFolder("Transform");
    transforms.add(controlsRef.current, "size", 0.4, 3, 0.05).name("Size").onChange(sync);
    transforms.add(controlsRef.current, "posX", -2, 2, 0.01).name("X").onChange(sync);
    transforms.add(controlsRef.current, "posY", -2, 2, 0.01).name("Y").onChange(sync);
    transforms.add(controlsRef.current, "posZ", -2, 2, 0.01).name("Z").onChange(sync);
    transforms.open();

    const motion = gui.addFolder("Motion");
    motion.add(controlsRef.current, "rotXSpeed", -0.08, 0.08, 0.001).name("Spin X").onChange(sync);
    motion.add(controlsRef.current, "rotYSpeed", -0.08, 0.08, 0.001).name("Spin Y").onChange(sync);
    motion.open();

    const material = gui.addFolder("Material");
    material.addColor(controlsRef.current, "color").name("Color").onChange(sync);
    material.add(controlsRef.current, "opacity", 0.05, 0.9, 0.01).name("Opacity").onChange(sync);
    material.add(controlsRef.current, "wireframe").name("Wireframe").onChange(sync);
    material.add(controlsRef.current, "wireOpacity", 0.05, 1, 0.01).name("Wire Opacity").onChange(sync);
    material.open();

    return () => {
      gui.destroy();
    };
  }, []);

  return (
    <div className="hero-cube-viewer" aria-label="Hero cube viewer">
      <div ref={guiRef} className="hero-cube-viewer__gui" />
      {isCanvasEnabled ? (
        <Canvas
          className="hero-cube-viewer__canvas"
          gl={{ alpha: true, antialias: true }}
          camera={{ position: [3.2, 2.4, 4.2], fov: 45 }}
          frameloop="always"
          resize={{ scroll: true, debounce: { scroll: 0, resize: 0 } }}
        >
          <SceneBootstrap />
          <ambientLight intensity={0.75} />
          <directionalLight position={[4, 5, 3]} intensity={1.15} />
          <Cube controls={controls} />
          <OrbitControls enablePan={false} />
        </Canvas>
      ) : null}
    </div>
  );
}
