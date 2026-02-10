"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three-stdlib";
import { assetPath } from "../lib/assetPath";

const filters = [
  "All",
  "Housing",
  "Civic",
  "Parametric",
  "Research",
  "Built",
];

const KNOWN_TOTAL_PAGES = 62;

type BookState = "open" | "closed-left" | "closed-right";

type BookModelProps = {
  currentPageIndex: number;
  onActionsReady: (playAction: (actionName: string) => void) => void;
};

function CameraController({ resetKey }: { resetKey: number }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 50, 0);
    camera.lookAt(0, 0, 0);
    camera.up.set(0, 1, 0);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 25;
      camera.updateProjectionMatrix();
    }
  }, [camera, resetKey]);

  return null;
}

function LimitedOrbitControls({
  resetKey,
  onDefaultChange,
}: {
  resetKey: number;
  onDefaultChange: (isDefault: boolean) => void;
}) {
  const controlsRef = useRef<any>(null);
  const panBoundsRef = useRef({
    minX: -7,
    maxX: 7,
    minY: -7,
    maxY: 7,
    minZ: -7,
    maxZ: 7,
  });
  const defaultCameraPositionRef = useRef(new THREE.Vector3(0, 50, 0));
  const defaultTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const defaultDirectionRef = useRef(
    new THREE.Spherical().setFromVector3(
      defaultCameraPositionRef.current.clone().sub(defaultTargetRef.current)
    )
  );
  const lastDefaultStateRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!controlsRef.current) return;
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
    controlsRef.current.saveState();
    controlsRef.current.reset();
  }, [resetKey]);

  useEffect(() => {
    if (!controlsRef.current) return;
    controlsRef.current.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: -1 as unknown as THREE.MOUSE,
    };
  }, []);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const { minX, maxX, minY, maxY, minZ, maxZ } = panBoundsRef.current;
    const target = controls.target;

    const clampedX = Math.min(Math.max(target.x, minX), maxX);
    const clampedY = Math.min(Math.max(target.y, minY), maxY);
    const clampedZ = Math.min(Math.max(target.z, minZ), maxZ);

    if (clampedX !== target.x || clampedY !== target.y || clampedZ !== target.z) {
      const deltaX = clampedX - target.x;
      const deltaY = clampedY - target.y;
      const deltaZ = clampedZ - target.z;

      target.set(clampedX, clampedY, clampedZ);
      controls.object.position.x += deltaX;
      controls.object.position.y += deltaY;
      controls.object.position.z += deltaZ;
      controls.update();
    }

    const position = controls.object.position as THREE.Vector3;
    const targetDistance = target.distanceTo(defaultTargetRef.current);
    const currentDirection = position.clone().sub(target);
    const currentSpherical = new THREE.Spherical().setFromVector3(currentDirection);
    const defaultSpherical = defaultDirectionRef.current;
    const angleEpsilon = 0.002;
    const thetaMatch = Math.abs(currentSpherical.theta - defaultSpherical.theta) < angleEpsilon;
    const phiMatch = Math.abs(currentSpherical.phi - defaultSpherical.phi) < angleEpsilon;
    const isDefault = targetDistance < 0.01 && thetaMatch && phiMatch;
    if (lastDefaultStateRef.current !== isDefault) {
      lastDefaultStateRef.current = isDefault;
      onDefaultChange(isDefault);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan
      enableZoom
      enableRotate
      minDistance={15}
      maxDistance={60}
      dampingFactor={0.08}
      enableDamping
    />
  );
}

function BookModel({ currentPageIndex, onActionsReady }: BookModelProps) {
  const fbx = useLoader(FBXLoader, assetPath("/assets/Book.fbx"), (loader) => {
    loader.setResourcePath(assetPath("/assets/Book.fbm/"));
  });
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Map<string, THREE.AnimationAction>>(new Map());
  const initializedRef = useRef(false);
  const pageMaterialsRef = useRef<{
    leftPage: THREE.Material | null;
    rightPage: THREE.Material | null;
    leftMesh: THREE.Mesh | null;
    rightMesh: THREE.Mesh | null;
    leftIndex: number;
    rightIndex: number;
  }>({
    leftPage: null,
    rightPage: null,
    leftMesh: null,
    rightMesh: null,
    leftIndex: -1,
    rightIndex: -1,
  });

  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const cover = loader.load(assetPath("/pdf-pages/Cover.png"), undefined, undefined, () => {
      loader.load(assetPath("/pages/Cover.png"));
    });
    const back = loader.load(assetPath("/pdf-pages/back.png"), undefined, undefined, () => {
      loader.load(assetPath("/pages/back.png"));
    });

    const configure = (texture: THREE.Texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.flipY = true;
      texture.needsUpdate = true;
    };

    configure(cover);
    configure(back);
    return { cover, back, loader };
  }, []);

  const assignTextureToMaterial = useCallback(
    (material: THREE.Material, texture: THREE.Texture, mesh: THREE.Mesh, index: number) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.generateMipmaps = true;
      texture.needsUpdate = true;

      const pageMat = new THREE.MeshBasicMaterial({
        map: texture,
        color: 0xffffff,
        toneMapped: false,
      });

      if (Array.isArray(mesh.material)) {
        const next = [...mesh.material];
        next[index] = pageMat;
        mesh.material = next;
      } else {
        mesh.material = pageMat;
      }
    },
    []
  );

  const loadPageTextures = useCallback(
    (pageIndex: number) => {
      const leftPageNum = pageIndex * 2 + 1;
      const rightPageNum = pageIndex * 2 + 2;
      const { leftPage, rightPage, leftMesh, rightMesh, leftIndex, rightIndex } =
        pageMaterialsRef.current;

      const tryLoad = (pageNum: number): Promise<THREE.Texture | null> => {
        return new Promise((resolve) => {
          const tryPath = (path: string) => {
            textures.loader.load(
              path,
              (texture) => {
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                texture.flipY = true;
                texture.needsUpdate = true;
                resolve(texture);
              },
              undefined,
              () => {
                if (path.endsWith(".png")) {
                  tryPath(assetPath(`/pdf-pages/${pageNum}.PNG`));
                } else {
                  resolve(null);
                }
              }
            );
          };
          tryPath(assetPath(`/pdf-pages/${pageNum}.png`));
        });
      };

      Promise.all([tryLoad(leftPageNum), tryLoad(rightPageNum)]).then(
        ([leftTexture, rightTexture]) => {
          if (leftPage && leftTexture && leftMesh) {
            assignTextureToMaterial(leftPage, leftTexture, leftMesh, leftIndex);
          }
          if (rightPage && rightTexture && rightMesh) {
            assignTextureToMaterial(rightPage, rightTexture, rightMesh, rightIndex);
          }
        }
      );
    },
    [assignTextureToMaterial, textures]
  );

  useEffect(() => {
    if (!fbx || initializedRef.current) return;
    initializedRef.current = true;

    const box = new THREE.Box3().setFromObject(fbx);
    const center = box.getCenter(new THREE.Vector3());
    fbx.position.sub(center);

    fbx.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const mesh = object as THREE.Mesh;
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];

        materials.forEach((material, index) => {
          const name = material.name || "";
          if (name.includes("CoverMaterial") || name === "CoverMaterial") {
            assignTextureToMaterial(material, textures.cover, mesh, index);
          }
          if (name.includes("BackMaterial") || name === "BackMaterial") {
            assignTextureToMaterial(material, textures.back, mesh, index);
          }
          if (name.includes("LeftPageMaterial") || name === "LeftPageMaterial") {
            pageMaterialsRef.current.leftPage = material;
            pageMaterialsRef.current.leftMesh = mesh;
            pageMaterialsRef.current.leftIndex = index;
          }
          if (name.includes("RightPageMaterial") || name === "RightPageMaterial") {
            pageMaterialsRef.current.rightPage = material;
            pageMaterialsRef.current.rightMesh = mesh;
            pageMaterialsRef.current.rightIndex = index;
          }
        });
      }
    });

    if (fbx.animations && fbx.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(fbx);
      mixerRef.current = mixer;
      fbx.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopOnce, 0);
        action.clampWhenFinished = true;
        actionsRef.current.set(clip.name, action);
        const shortName = clip.name.replace(/^Book Armature\|/, "");
        actionsRef.current.set(shortName, action);
      });
    }

    loadPageTextures(currentPageIndex);

    const playAction = (actionName: string) => {
      const action = actionsRef.current.get(actionName);
      if (!action || !mixerRef.current) return;
      mixerRef.current.stopAllAction();
      action.reset();
      action.enabled = true;
      action.setLoop(THREE.LoopOnce, 0);
      action.clampWhenFinished = true;
      action.setEffectiveTimeScale(1);
      action.setEffectiveWeight(1);
      action.fadeIn(0.15);
      action.play();
    };

    onActionsReady(playAction);
  }, [fbx, assignTextureToMaterial, textures, onActionsReady, currentPageIndex, loadPageTextures]);

  useEffect(() => {
    if (!initializedRef.current) return;
    loadPageTextures(currentPageIndex);
  }, [currentPageIndex, loadPageTextures]);

  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  return <primitive object={fbx} />;
}

export default function PortfolioViewer() {
  const totalPages = KNOWN_TOTAL_PAGES;
  const maxPageIndex = Math.max(Math.ceil(totalPages / 2) - 1, 0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [bookState, setBookState] = useState<BookState>("open");
  const playActionRef = useRef<((actionName: string) => void) | null>(null);
  const [isCameraDefault, setIsCameraDefault] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const viewerRef = useRef<HTMLDivElement | null>(null);

  const handleActionsReady = (playAction: (actionName: string) => void) => {
    playActionRef.current = playAction;
  };

  const handleNext = () => {
    if (bookState === "closed-right") {
      playActionRef.current?.("Open Book State");
      setBookState("open");
      setCurrentPageIndex(0);
      setResetKey((prev) => prev + 1);
      return;
    }

    if (currentPageIndex < maxPageIndex) {
      setCurrentPageIndex((prev) => prev + 1);
      setResetKey((prev) => prev + 1);
    } else {
      playActionRef.current?.("Close Book State Left");
      setBookState("closed-left");
      setResetKey((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (bookState === "closed-left") {
      playActionRef.current?.("Open Book State");
      setBookState("open");
      setCurrentPageIndex(maxPageIndex);
      setResetKey((prev) => prev + 1);
      return;
    }

    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
      setResetKey((prev) => prev + 1);
    } else {
      playActionRef.current?.("Close Book State Right");
      setBookState("closed-right");
      setResetKey((prev) => prev + 1);
    }
  };

  const handleSliderChange = (value: number) => {
    if (bookState !== "open") {
      playActionRef.current?.("Open Book State");
      setBookState("open");
    }
    setCurrentPageIndex(value);
    setResetKey((prev) => prev + 1);
  };

  const handleToggleFullscreen = useCallback(async () => {
    const element = viewerRef.current;
    if (!element) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await element.requestFullscreen();
      }
    } catch {
      // ignore fullscreen errors
    }
  }, []);

  const leftPage = totalPages ? currentPageIndex * 2 + 1 : 0;
  const rightPage = totalPages
    ? Math.min(currentPageIndex * 2 + 2, totalPages)
    : 0;

  return (
    <section id="portfolio" className="section section--alt">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow mono">Portfolio Viewer</p>
            <h2 className="title">Architecture, systems, and prototypes.</h2>
          </div>
          <p className="subtitle">
            Case studies spanning architectural projects, computational research,
            and digital tooling.
          </p>
        </div>
        <div className="viewer">
          <div className="viewer-screen has-viewer viewer-screen--full" ref={viewerRef}>
            <div className="viewer-canvas">
              <Canvas camera={{ position: [0, 50, 0], fov: 25 }} dpr={[1, 2]}>
                <color attach="background" args={["#0b1022"]} />
                <CameraController resetKey={resetKey} />
                <ambientLight intensity={0.7} />
                <hemisphereLight
                  intensity={0.6}
                  color={0xffffff}
                  groundColor={0x1b2b55}
                />
                <directionalLight position={[10, 12, 6]} intensity={0.9} />
                <directionalLight position={[-10, 6, -6]} intensity={0.5} />
                <BookModel
                  currentPageIndex={currentPageIndex}
                  onActionsReady={handleActionsReady}
                />
                <LimitedOrbitControls
                  resetKey={resetKey}
                  onDefaultChange={setIsCameraDefault}
                />
              </Canvas>
            </div>
            {showOverlay ? (
              <div className="viewer-overlay">
                <div>
                  <p className="mono">Interactive Viewer</p>
                  <h3>Open the Book Viewer</h3>
                  <p className="subtitle">
                    Drag to pan, scroll to zoom, and use the arrows to flip pages.
                  </p>
                  <button
                    className="btn btn--primary"
                    type="button"
                    onClick={() => setShowOverlay(false)}
                  >
                    Open the Viewer
                  </button>
                </div>
              </div>
            ) : null}
            <button
              className="viewer-control viewer-control--left"
              type="button"
              onClick={handlePrev}
              aria-label="Previous page"
              disabled={bookState === "closed-right"}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              className="viewer-control viewer-control--right"
              type="button"
              onClick={handleNext}
              aria-label="Next page"
              disabled={bookState === "closed-left"}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
            <div className="viewer-slider">
              <span className="mono">{leftPage}-{rightPage}</span>
              <input
                className="range-modern"
                type="range"
                min={0}
                max={maxPageIndex}
                value={currentPageIndex}
                onChange={(event) => handleSliderChange(Number(event.target.value))}
              />
              <span className="mono">{totalPages}</span>
            </div>
            {!isCameraDefault ? (
              <button
                className="viewer-reset"
                type="button"
                onClick={() => setResetKey((prev) => prev + 1)}
                aria-label="Reset view"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 3-6.7" />
                  <path d="M3 5v4h4" />
                </svg>
              </button>
            ) : null}
            <div className="viewer-top-actions">
              <button
                className="viewer-icon"
                type="button"
                onClick={handleToggleFullscreen}
                aria-label="Toggle fullscreen"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H3v5" />
                  <path d="M21 8V3h-5" />
                  <path d="M3 16v5h5" />
                  <path d="M16 21h5v-5" />
                </svg>
              </button>
              <a
                className="viewer-icon"
                href={assetPath("/Portfolio_EzzahirAnass_2026.pdf")}
                download
                aria-label="Download PDF"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v10" />
                  <path d="M8 9l4 4 4-4" />
                  <path d="M5 21h14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
