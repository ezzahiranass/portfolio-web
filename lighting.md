You don’t need another file. The “washed / reflective / low-contrast” look is coming from **two things in this same file**:

1. Your pages are using whatever FBX material they came with (often **Phong/Standard**) and you’re lighting them with **multiple strong lights**. Even with `roughness=1` and `shininess=0`, you still get shading gradients + tonemapping/gamma effects that kill text crispness.

2. Your textures aren’t being configured for “readable UI/text” rendering (color space + anisotropy + filtering + toneMapping flag).

If you want “paper in HD” (crisp, contrasty, not affected by lighting), the right move is **unlit pages**.

## Fix: make page materials unlit + disable tonemapping for pages

### A) Replace the page material with `MeshBasicMaterial` (unlit)

In **both** `assignTextureToMaterial` helpers (you have one inside the init effect and one inside the page-update effect), change the logic so that for **LeftPageMaterial/RightPageMaterial** you **swap to MeshBasicMaterial** instead of tweaking the existing Phong/Standard.

Drop-in replacement for `assignTextureToMaterial` (use this version in both places):

```ts
const assignTextureToMaterial = (
  material: THREE.Material,
  texture: THREE.Texture,
  mesh: THREE.Mesh,
  index: number
) => {
  // Configure texture for crisp text
  texture.colorSpace = THREE.SRGBColorSpace;      // important for correct contrast
  texture.anisotropy = 8;                         // good default; can push to max later
  texture.magFilter = THREE.LinearFilter;         // sharp-ish without alias shimmer
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  // ✅ Unlit material so page content is not affected by lights/shading
  const pageMat = new THREE.MeshBasicMaterial({
    map: texture,
    color: 0xffffff,     // don't tint pages gray
    toneMapped: false,   // don't let renderer tonemap it
  });
  pageMat.needsUpdate = true;

  if (Array.isArray(mesh.material)) {
    const newMaterials = [...mesh.material];
    newMaterials[index] = pageMat;
    mesh.material = newMaterials;
  } else {
    mesh.material = pageMat;
  }

  return true;
};
```

This instantly removes “reflective / bright gradients / unclear text”. The page will look like a flat UI quad with a texture.

### B) Don’t flip the texture unless you truly need it

You currently do `texture.flipY = true`. For most image files used as textures, **Three usually expects `flipY = false`** (especially if you’re coming from GLTF conventions). If your pages are currently upright only because you flip them, keep it — but if you’re unsure, test `false`. Wrong flip can subtly blur because you’re fighting UV orientation across imports.

So in `configureTexture`, I’d start with:

```ts
texture.flipY = false;
```

(If it becomes upside down, set it back to true — but pick the correct one and keep it consistent.)

### C) (Optional but good) Clamp anisotropy to your renderer max

If you want to be precise, grab renderer max anisotropy once:

```ts
const { gl } = useThree();
const maxAniso = gl.capabilities.getMaxAnisotropy();
texture.anisotropy = Math.min(16, maxAniso);
```

(You’d need to move texture config into a place that can access `gl`, or pass maxAniso down.)

## Make the renderer stop “cinematic” tonemapping globally (optional)

Even if pages are unlit, you might still want the whole scene to look more “CAD-like” and less filmic:

Change your `<Canvas>` to disable tonemapping:

```tsx
<Canvas
  gl={{
    antialias: true,
    toneMapping: THREE.NoToneMapping,
  }}
>
```

Or simplest in R3F: add `flat`:

```tsx
<Canvas flat>
```

(That pushes things toward “what you see is what the texture is”.)

## About your lights

Right now you’re blasting the scene with ambient + hemisphere + 3 directionals + point light. If you go unlit pages, lights won’t affect readability anymore, so you can leave them for the cover/back — but I’d still reduce it because it’s doing more harm than good visually.

At minimum, I’d do:

* ambientLight intensity ~0.3
* one directional light ~0.6
* remove the rest

But again: unlit pages is the real win.

---

If you apply **only one change**, do **A** (MeshBasicMaterial + toneMapped:false + SRGBColorSpace). That’s the “sharp paper” look you’re describing.
