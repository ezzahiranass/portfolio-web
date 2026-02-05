'use client';

import { useRef, useEffect, Suspense, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { assetPath } from '@/app/lib/assetPath';

type BookState = 'open' | 'closed-left' | 'closed-right' | null;
const publicPath = assetPath;

function BookModel({ 
  onActionsReady,
  currentPageIndex,
  onPageMaterialsReady,
  onBookStateChange
}: { 
  onActionsReady: (playAction: (actionName: string) => void) => void;
  currentPageIndex: number;
  onPageMaterialsReady: (materials: { leftPage: THREE.Material | null; rightPage: THREE.Material | null }) => void;
  onBookStateChange: (state: BookState) => void;
}) {
  const fbx = useFBX(publicPath('/assets/Book.fbx'));
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Map<string, THREE.AnimationAction>>(new Map());
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const armatureRef = useRef<THREE.Object3D | null>(null);
  const clipsRef = useRef<THREE.AnimationClip[]>([]);
  const initializedRef = useRef(false);
  const currentStateRef = useRef<BookState>('closed-right');
  const transitionQueueRef = useRef<string[]>([]);
  const isTransitioningRef = useRef(false);
  const pageMaterialsRef = useRef<{ leftPage: THREE.Material | null; rightPage: THREE.Material | null; leftMesh: THREE.Mesh | null; rightMesh: THREE.Mesh | null; leftIndex: number; rightIndex: number }>({
    leftPage: null,
    rightPage: null,
    leftMesh: null,
    rightMesh: null,
    leftIndex: -1,
    rightIndex: -1
  });

  useEffect(() => {
    // Prevent re-initialization
    if (fbx && !initializedRef.current) {
      initializedRef.current = true;
      // Log all objects in the scene
      console.log('=== FBX Scene Objects ===');
      const allObjects: THREE.Object3D[] = [];
      fbx.traverse((object) => {
        allObjects.push(object);
        console.log(`Object: ${object.name || 'unnamed'}, Type: ${object.type}, Children: ${object.children.length}`);
      });
      console.log('Total objects in scene:', allObjects.length);
      console.log('All objects:', allObjects);

      // Center the model
      const box = new THREE.Box3().setFromObject(fbx);
      const center = box.getCenter(new THREE.Vector3());
      fbx.position.sub(center);

      // Load and assign textures to cover and back materials
      const textureLoader = new THREE.TextureLoader();
      
      // Define static material to texture mappings (cover and back)
      // Try pdf-pages first, then fall back to pages
      const staticMaterialTextures = [
        {
          materialName: 'CoverMaterial',
          texturePath: publicPath('/pdf-pages/Cover.png'),
          fallbackPaths: [
            publicPath('/pdf-pages/cover.png'),
            publicPath('/pages/cover.png'),
            publicPath('/pages/Cover.png')
          ]
        },
        {
          materialName: 'BackMaterial',
          texturePath: publicPath('/pdf-pages/back.png'),
          fallbackPaths: [publicPath('/pages/back.png')]
        }
      ];
      
      // Helper function to configure texture
      const configureTexture = (texture: THREE.Texture) => {
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.flipY = true;
        texture.needsUpdate = true;
      };
      
      // Helper function to assign texture to material
      const assignTextureToMaterial = (
        material: THREE.Material,
        texture: THREE.Texture,
        mesh: THREE.Mesh,
        index: number
      ) => {
        if (material instanceof THREE.MeshPhongMaterial || 
            material instanceof THREE.MeshStandardMaterial ||
            material instanceof THREE.MeshBasicMaterial ||
            material instanceof THREE.MeshLambertMaterial) {
          
          // Check if mesh has UVs
          const hasUVs = mesh.geometry?.attributes?.uv !== undefined;
          if (!hasUVs) {
            console.error(`WARNING: Mesh "${mesh.name || 'unnamed'}" does not have UV coordinates! The texture will not display.`);
          }
          
          // Assign texture and set color to slightly darker for reduced brightness and better contrast
          (material as any).map = texture;
          (material as any).color = new THREE.Color(0xcccccc); // Slightly darker than white for reduced brightness and better contrast
          
          // Reduce reflectivity by adjusting material properties
          if (material instanceof THREE.MeshPhongMaterial) {
            (material as any).shininess = 0; // No shininess for matte look
            (material as any).specular = new THREE.Color(0x000000); // No specular highlights
          } else if (material instanceof THREE.MeshStandardMaterial) {
            (material as any).roughness = 1.0; // Maximum roughness (matte, no reflection)
            (material as any).metalness = 0.0; // No metalness
          }
          
          // Reduce emissive to prevent over-brightness
          if ((material as any).emissive !== undefined) {
            (material as any).emissive = new THREE.Color(0x000000);
          }
          
          material.needsUpdate = true;
          texture.needsUpdate = true;
          
          // Force mesh to update by cloning material array if needed
          if (Array.isArray(mesh.material)) {
            const newMaterials = [...mesh.material];
            newMaterials[index] = material;
            mesh.material = newMaterials;
          }
          
          return true;
        }
        return false;
      };
      
      // Function to load and assign page textures
      const loadPageTextures = (pageIndex: number) => {
        const leftPageNum = pageIndex * 2 + 1;
        const rightPageNum = pageIndex * 2 + 2;
        
        // Try both lowercase and uppercase extensions
        const tryLoadTexture = (pageNum: number): Promise<THREE.Texture | null> => {
          return new Promise((resolve) => {
            const tryPath = (path: string) => {
              textureLoader.load(
                path,
                (texture) => {
                  configureTexture(texture);
                  resolve(texture);
                },
                undefined,
                () => {
                  // Try next path
                  if (path.endsWith('.png')) {
                    tryPath(publicPath(`/pdf-pages/${pageNum}.PNG`));
                  } else {
                    resolve(null);
                  }
                }
              );
            };
            tryPath(publicPath(`/pdf-pages/${pageNum}.png`));
          });
        };
        
        Promise.all([tryLoadTexture(leftPageNum), tryLoadTexture(rightPageNum)])
          .then(([leftTexture, rightTexture]) => {
            const { leftPage, rightPage, leftMesh, rightMesh, leftIndex, rightIndex } = pageMaterialsRef.current;
            
            if (leftPage && leftTexture && leftMesh !== null) {
              assignTextureToMaterial(leftPage, leftTexture, leftMesh, leftIndex);
              console.log(`✓ Loaded page ${leftPageNum} to LeftPageMaterial`);
            }
            
            if (rightPage && rightTexture && rightMesh !== null) {
              assignTextureToMaterial(rightPage, rightTexture, rightMesh, rightIndex);
              console.log(`✓ Loaded page ${rightPageNum} to RightPageMaterial`);
            }
            
            if (!leftTexture) {
              console.warn(`⚠ Page ${leftPageNum} image not found`);
            }
            if (!rightTexture) {
              console.warn(`⚠ Page ${rightPageNum} image not found`);
            }
          });
      };
      
      // Load static textures (cover and back) with fallback support
      const staticTexturePromises = staticMaterialTextures.map(({ materialName, texturePath, fallbackPaths = [] }: any) => {
        return new Promise<{ materialName: string; texture: THREE.Texture }>((resolve, reject) => {
          const pathsToTry = [texturePath, ...(fallbackPaths || [])];
          let currentPathIndex = 0;
          
          const tryLoad = () => {
            if (currentPathIndex >= pathsToTry.length) {
              console.error(`Failed to load texture for ${materialName} after trying all paths`);
              reject(new Error(`Could not load texture for ${materialName}`));
              return;
            }
            
            const path = pathsToTry[currentPathIndex];
            textureLoader.load(
              path,
              (texture) => {
                configureTexture(texture);
                console.log(`Texture loaded for ${materialName}:`, path);
                resolve({ materialName, texture });
              },
              undefined,
              (error) => {
                // Try next fallback path
                currentPathIndex++;
                if (currentPathIndex < pathsToTry.length) {
                  console.log(`Failed to load ${path}, trying next: ${pathsToTry[currentPathIndex]}`);
                  tryLoad();
                } else {
                  console.error(`Error loading texture for ${materialName} from all paths:`, error);
                  reject(error);
                }
              }
            );
          };
          tryLoad();
        });
      });
      
      // Wait for static textures to load, then assign them and find page materials
      Promise.all(staticTexturePromises)
        .then((loadedTextures) => {
          console.log('Static textures loaded, assigning to materials...');
          
          // Create a map of material names to textures
          const textureMap = new Map<string, THREE.Texture>();
          loadedTextures.forEach(({ materialName, texture }) => {
            textureMap.set(materialName, texture);
          });
          
          // Traverse the model to find and assign materials
          const foundMaterials = new Set<string>();
          
          fbx.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              const mesh = object as THREE.Mesh;
              
              // Check if mesh has materials
              if (mesh.material) {
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                
                materials.forEach((material, index) => {
                  // Handle static materials (cover and back)
                  for (const { materialName } of staticMaterialTextures) {
                    if (material.name === materialName || material.name.includes(materialName)) {
                      const texture = textureMap.get(materialName);
                      if (texture) {
                        console.log(`Assigning texture to ${materialName} on mesh:`, mesh.name);
                        if (assignTextureToMaterial(material, texture, mesh, index)) {
                          foundMaterials.add(materialName);
                          console.log(`✓ ${materialName} texture assigned successfully`);
                        }
                      }
                    }
                  }
                  
                  // Store page material references
                  if (material.name === 'LeftPageMaterial' || material.name.includes('LeftPageMaterial')) {
                    pageMaterialsRef.current.leftPage = material;
                    pageMaterialsRef.current.leftMesh = mesh;
                    pageMaterialsRef.current.leftIndex = index;
                    console.log('Found LeftPageMaterial');
                  }
                  if (material.name === 'RightPageMaterial' || material.name.includes('RightPageMaterial')) {
                    pageMaterialsRef.current.rightPage = material;
                    pageMaterialsRef.current.rightMesh = mesh;
                    pageMaterialsRef.current.rightIndex = index;
                    console.log('Found RightPageMaterial');
                  }
                });
              }
            }
          });
          
          // Notify parent that page materials are ready
          onPageMaterialsReady({
            leftPage: pageMaterialsRef.current.leftPage,
            rightPage: pageMaterialsRef.current.rightPage
          });
          
          // Log which materials were found
          staticMaterialTextures.forEach(({ materialName }) => {
            if (!foundMaterials.has(materialName)) {
              console.warn(`⚠ ${materialName} not found in model`);
            }
          });
        })
        .catch((error) => {
          console.error('Error loading textures:', error);
        });

      // Log animations found
      console.log('=== FBX Animations ===');
      console.log('Total animations:', fbx.animations?.length || 0);
      if (fbx.animations && fbx.animations.length > 0) {
        fbx.animations.forEach((clip, index) => {
          console.log(`Animation ${index + 1}:`, {
            name: clip.name,
            duration: clip.duration,
            tracks: clip.tracks.length,
            tracksInfo: clip.tracks.map(track => ({
              name: track.name,
              type: track.constructor.name,
              times: track.times.length
            }))
          });
        });
        clipsRef.current = fbx.animations;
      }

      // Set up animation mixer (but don't create actions yet)
      if (fbx.animations && fbx.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(fbx);
        mixerRef.current = mixer;

        // Find the Book Armature
        const armature = fbx.getObjectByName('Book Armature') || fbx;
        armatureRef.current = armature;
        console.log('=== Book Armature ===');
        console.log('Armature found:', armature.name);
        console.log('Armature object:', armature);
        console.log('Armature type:', armature.type);
        console.log('Armature children:', armature.children.length);
        if (armature.children.length > 0) {
          console.log('Armature children:', armature.children.map(child => ({
            name: child.name,
            type: child.type
          })));
        }

        // Helper function to create a pose clip from an animation (extracts final frame)
        const createPoseClip = (sourceClip: THREE.AnimationClip): THREE.AnimationClip => {
          const poseTracks: THREE.KeyframeTrack[] = [];
          
          sourceClip.tracks.forEach(track => {
            const times = track.times;
            const values = track.values;
            const lastIndex = times.length - 1;
            const stride = track.getValueSize();
            const finalValues: number[] = [];
            
            // Extract final values
            for (let i = 0; i < stride; i++) {
              finalValues.push(values[lastIndex * stride + i]);
            }
            
            // Create track with single keyframe at time 0 (the pose)
            const poseTrack = new (track.constructor as any)(
              track.name,
              [0], // Single time point
              finalValues
            );
            
            poseTracks.push(poseTrack);
          });
          
          // Create clip with very short duration (just for blending)
          return new THREE.AnimationClip(
            `Pose_${sourceClip.name}`,
            0.1, // Very short duration
            poseTracks
          );
        };

        // Helper function to transition to a state
        const transitionToState = (targetState: BookState, actionName: string) => {
          if (isTransitioningRef.current) {
            // Queue the transition
            transitionQueueRef.current.push(actionName);
            return;
          }

          console.log(`=== Transitioning to ${targetState} ===`);
          console.log('Current state:', currentStateRef.current);
          console.log('Target state:', targetState);
          
          // Check if action already exists in cache
          let action = actionsRef.current.get(actionName);
          
          if (!action) {
            // Create pose clip on-demand
            console.log('Creating pose clip on-demand:', actionName);
            
            // Find the clip that matches the action name
            let sourceClip = clipsRef.current.find(clip => {
              const clipName = clip.name.replace(/^Book Armature\|/, '');
              return clipName === actionName || clip.name === actionName;
            });
            
            if (sourceClip && mixerRef.current && armatureRef.current) {
              // Create pose clip from the animation
              const poseClip = createPoseClip(sourceClip);
              
              // Create action from pose clip
              action = mixerRef.current.clipAction(poseClip, armatureRef.current);
              action.setLoop(THREE.LoopOnce, 0);
              action.clampWhenFinished = true;
              
              // Store in cache
              actionsRef.current.set(actionName, action);
              
              // Also store with the full name
              const fullName = sourceClip.name;
              if (fullName !== actionName) {
                actionsRef.current.set(fullName, action);
              }
              
              console.log(`Pose clip created: ${sourceClip.name} -> stored as: ${actionName}`);
            } else {
              console.warn('Clip not found for action:', actionName);
              console.log('Available clips:', clipsRef.current.map(c => c.name));
              return;
            }
          }
          
          if (action) {
            isTransitioningRef.current = true;
            
            // Stop current action with fade out
            if (currentActionRef.current) {
              currentActionRef.current.fadeOut(1.0);
            }
            
            // Set pose clip to final frame immediately (it's already a pose, so just blend to it)
            action.reset();
            action.time = 0; // Start at the pose
            action.fadeIn(1.0); // 1 second fade in
            action.play();
            currentActionRef.current = action;
            
            // Update state after transition completes
            setTimeout(() => {
              currentStateRef.current = targetState;
              isTransitioningRef.current = false;
              onBookStateChange(targetState); // Notify parent of state change
              
              // Process queued transitions
              if (transitionQueueRef.current.length > 0) {
                const nextAction = transitionQueueRef.current.shift()!;
                // Determine target state from action name
                let nextState: BookState = null;
                if (nextAction === 'Open Book State') nextState = 'open';
                else if (nextAction === 'Close Book State Left') nextState = 'closed-left';
                else if (nextAction === 'Close Book State Right') nextState = 'closed-right';
                
                if (nextState) {
                  transitionToState(nextState, nextAction);
                }
              }
            }, 1000); // After fade completes
          }
        };

        // Create playAction function with state tracking logic
        const playAction = (actionName: string) => {
          console.log('=== Requested Action ===');
          console.log('Action name:', actionName);
          console.log('Current state:', currentStateRef.current);
          
          // Determine target state
          let targetState: BookState = null;
          if (actionName === 'Open Book State') targetState = 'open';
          else if (actionName === 'Close Book State Left') targetState = 'closed-left';
          else if (actionName === 'Close Book State Right') targetState = 'closed-right';
          
          if (!targetState) {
            console.warn('Unknown action:', actionName);
            return;
          }
          
          // State transition logic
          if (targetState === 'open') {
            // If already open, do nothing
            if (currentStateRef.current === 'open') {
              console.log('Book is already open, ignoring request');
              return;
            }
          }
          
          // Direct transition
          transitionToState(targetState, actionName);
        };

        onActionsReady(playAction);
        
        // Notify parent of initial state
        onBookStateChange('closed-right');
      } else {
        console.warn('No animations found in FBX file');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fbx]); // Only depend on fbx, not onActionsReady

  // Effect to update pages when page index changes
  useEffect(() => {
    if (!fbx || !initializedRef.current) return;
    
    const textureLoader = new THREE.TextureLoader();
    
    const configureTexture = (texture: THREE.Texture) => {
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.flipY = true;
      texture.needsUpdate = true;
    };
    
    const assignTextureToMaterial = (
      material: THREE.Material,
      texture: THREE.Texture,
      mesh: THREE.Mesh,
      index: number
    ) => {
      if (material instanceof THREE.MeshPhongMaterial || 
          material instanceof THREE.MeshStandardMaterial ||
          material instanceof THREE.MeshBasicMaterial ||
          material instanceof THREE.MeshLambertMaterial) {
        
        // Assign texture and set color to slightly darker for reduced brightness and better contrast
        (material as any).map = texture;
        (material as any).color = new THREE.Color(0xcccccc); // Slightly darker than white for reduced brightness and better contrast
        
        // Reduce reflectivity by adjusting material properties
        if (material instanceof THREE.MeshPhongMaterial) {
          (material as any).shininess = 0; // No shininess for matte look
          (material as any).specular = new THREE.Color(0x000000); // No specular highlights
        } else if (material instanceof THREE.MeshStandardMaterial) {
          (material as any).roughness = 1.0; // Maximum roughness (matte, no reflection)
          (material as any).metalness = 0.0; // No metalness
        }
        
        // Reduce emissive to prevent over-brightness
        if ((material as any).emissive !== undefined) {
          (material as any).emissive = new THREE.Color(0x000000);
        }
        
        material.needsUpdate = true;
        texture.needsUpdate = true;
        
        if (Array.isArray(mesh.material)) {
          const newMaterials = [...mesh.material];
          newMaterials[index] = material;
          mesh.material = newMaterials;
        }
        return true;
      }
      return false;
    };
    
    const leftPageNum = currentPageIndex * 2 + 1;
    const rightPageNum = currentPageIndex * 2 + 2;
    
    const tryLoadTexture = (pageNum: number): Promise<THREE.Texture | null> => {
      return new Promise((resolve) => {
        const tryPath = (path: string) => {
          textureLoader.load(
            path,
            (texture) => {
              configureTexture(texture);
              resolve(texture);
            },
            undefined,
            () => {
              if (path.endsWith('.png')) {
                tryPath(publicPath(`/pdf-pages/${pageNum}.PNG`));
              } else {
                resolve(null);
              }
            }
          );
        };
        tryPath(publicPath(`/pdf-pages/${pageNum}.png`));
      });
    };
    
    Promise.all([tryLoadTexture(leftPageNum), tryLoadTexture(rightPageNum)])
      .then(([leftTexture, rightTexture]) => {
        const { leftPage, rightPage, leftMesh, rightMesh, leftIndex, rightIndex } = pageMaterialsRef.current;
        
        if (leftPage && leftTexture && leftMesh !== null) {
          assignTextureToMaterial(leftPage, leftTexture, leftMesh, leftIndex);
          console.log(`✓ Updated LeftPageMaterial with page ${leftPageNum}`);
        }
        
        if (rightPage && rightTexture && rightMesh !== null) {
          assignTextureToMaterial(rightPage, rightTexture, rightMesh, rightIndex);
          console.log(`✓ Updated RightPageMaterial with page ${rightPageNum}`);
        }
        
        if (!leftTexture) {
          console.warn(`⚠ Page ${leftPageNum} image not found`);
        }
        if (!rightTexture) {
          console.warn(`⚠ Page ${rightPageNum} image not found`);
        }
      });
  }, [fbx, currentPageIndex]);

  // Update animation mixer on each frame
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  if (!fbx) return null;

  return <primitive object={fbx} />;
}

function CameraController() {
  const { camera } = useThree();
  
  useEffect(() => {
    // Set initial camera position - moved backward for better view
    camera.position.set(0, 50, 0); // Z value increased to move camera backward
    camera.lookAt(0, 0, 0);
    camera.up.set(0, 1, 0);
    
    // Make camera more orthographic-like by reducing FOV
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 25; // Lower FOV (default is 50) makes it more orthographic-like
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  // Note: Removed forced top view constraint for debugging (rotation enabled)

  return null;
}

function LimitedOrbitControls() {
  const controlsRef = useRef<any>(null);
  
  useEffect(() => {
    if (controlsRef.current) {
      // Set middle mouse to pan instead of dolly (zoom)
      controlsRef.current.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.PAN, // Middle mouse = pan
        RIGHT: THREE.MOUSE.ROTATE,
      };
    }
  }, []);
  
  return <OrbitControls ref={controlsRef} makeDefault />;
}

export default function BookViewer({ onPlayActionReady }: { onPlayActionReady: (playAction: (actionName: string) => void) => void }) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [maxPageIndex, setMaxPageIndex] = useState(0);
  const [pageMaterialsReady, setPageMaterialsReady] = useState(false);
  const [bookState, setBookState] = useState<BookState>('closed-right'); // Start with book closed right
  const playActionRef = useRef<((actionName: string) => void) | null>(null);
  const hasInitializedRef = useRef(false);
  
  const handleBookStateChange = (state: BookState) => {
    setBookState(state);
  };
  
  const handleActionsReady = (playAction: (actionName: string) => void) => {
    playActionRef.current = playAction;
    onPlayActionReady(playAction);
    
    // Trigger close right on initial load
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      // Small delay to ensure book model is ready
      setTimeout(() => {
        playAction('Close Book State Right');
      }, 100);
    }
  };
  
  const handlePageMaterialsReady = (materials: { leftPage: THREE.Material | null; rightPage: THREE.Material | null }) => {
    if (materials.leftPage && materials.rightPage) {
      setPageMaterialsReady(true);
      // Check if pages exist - just validate 1.png and 2.png exist
      const checkMaxPages = async () => {
        const textureLoader = new THREE.TextureLoader();
        
        const tryLoad = (pageNum: number): Promise<boolean> => {
          return new Promise((resolve) => {
            textureLoader.load(
              publicPath(`/pdf-pages/${pageNum}.png`),
              () => resolve(true),
              undefined,
              () => {
                // Try uppercase
                textureLoader.load(
                  publicPath(`/pdf-pages/${pageNum}.PNG`),
                  () => resolve(true),
                  undefined,
                  () => resolve(false)
                );
              }
            );
          });
        };
        
        // Just check if 1.png and 2.png exist
        const page1Exists = await tryLoad(1);
        const page2Exists = await tryLoad(2);
        
        if (!page1Exists && !page2Exists) {
          console.warn('No page images found (1.png, 2.png)');
          setMaxPageIndex(0);
          return;
        }
        
        // If pages exist, set a high default maxIndex
        // It will be corrected naturally when user navigates or when pages fail to load
        // This prevents checking for non-existent pages like 49, 50, etc.
        setMaxPageIndex(100); // High default, will be limited by actual page availability
        console.log('Pages 1.png and 2.png found, maxIndex set to default (will be corrected on navigation)');
      };
      checkMaxPages();
    }
  };
  
  const handleNextPage = () => {
    // If book is closed-right, open it and go to first page
    if (bookState === 'closed-right') {
      if (playActionRef.current) {
        playActionRef.current('Open Book State');
        setCurrentPageIndex(0);
      }
      return;
    }
    
    if (currentPageIndex < maxPageIndex) {
      setCurrentPageIndex(prev => prev + 1);
    } else {
      // No more pages, close book left
      if (playActionRef.current) {
        playActionRef.current('Close Book State Left');
      }
    }
  };
  
  const handlePreviousPage = () => {
    // If book is closed-left, open it and go to last page
    if (bookState === 'closed-left') {
      if (playActionRef.current) {
        playActionRef.current('Open Book State');
        setCurrentPageIndex(maxPageIndex);
      }
      return;
    }
    
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    } else {
      // At first page, close book right
      if (playActionRef.current) {
        playActionRef.current('Close Book State Right');
      }
    }
  };

  return (
    <div className="w-full h-full relative">
      <Canvas>
        <Suspense fallback={null}>
          <CameraController />
          {/* Reduced ambient light for less brightness */}
          <ambientLight intensity={0.8} />
          {/* Hemisphere light for natural lighting */}
          <hemisphereLight intensity={0.6} color={0xffffff} groundColor={0x444444} />
          {/* Multiple directional lights from different angles */}
          <directionalLight position={[10, 10, 5]} intensity={0.8} />
          <directionalLight position={[-10, 10, -5]} intensity={0.6} />
          <directionalLight position={[0, 10, 0]} intensity={0.6} />
          {/* Point light for additional illumination */}
          <pointLight position={[0, 5, 0]} intensity={0.6} />
          <BookModel 
            onActionsReady={handleActionsReady} 
            currentPageIndex={currentPageIndex}
            onPageMaterialsReady={handlePageMaterialsReady}
            onBookStateChange={handleBookStateChange}
          />
          <LimitedOrbitControls />
        </Suspense>
      </Canvas>
      
      {/* Page Navigation Buttons */}
      {pageMaterialsReady && (
        <div className="absolute bottom-4 right-4 z-50 flex gap-2">
          <button
            onClick={handlePreviousPage}
            disabled={currentPageIndex === 0 && bookState === 'closed-right'}
            className="backdrop-blur-md bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/20 rounded-lg px-4 py-2 text-sm font-medium text-black dark:text-white shadow-lg hover:bg-white/30 dark:hover:bg-black/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={currentPageIndex >= maxPageIndex && bookState === 'closed-left'}
            className="backdrop-blur-md bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/20 rounded-lg px-4 py-2 text-sm font-medium text-black dark:text-white shadow-lg hover:bg-white/30 dark:hover:bg-black/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
