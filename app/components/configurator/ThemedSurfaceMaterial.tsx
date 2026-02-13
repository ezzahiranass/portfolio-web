'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useConfiguratorThemePalette } from './theme';

type SurfaceTone =
  | 'surface'
  | 'surfaceAlt'
  | 'surfaceDark'
  | 'accent'
  | 'accent2'
  | 'muted'
  | 'glass';

type ThemedSurfaceMaterialProps = {
  tone?: SurfaceTone;
  baseColor?: string;
  opacity?: number;
  transparent?: boolean;
  side?: THREE.Side;
  accentStrength?: number;
};

const VERTEX_SHADER = `
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const FRAGMENT_SHADER = `
uniform vec3 uBaseColor;
uniform vec3 uAccent;
uniform vec3 uAccent2;
uniform float uOpacity;
uniform float uAccentStrength;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  vec3 lightDir = normalize(vec3(0.35, 0.9, 0.2));

  float diffuse = max(dot(normal, lightDir), 0.0);
  float hemi = normal.y * 0.5 + 0.5;
  float rim = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);

  vec3 accentBand = mix(uAccent, uAccent2, hemi);
  vec3 shadedBase = uBaseColor * (0.45 + diffuse * 0.55);
  vec3 color = mix(shadedBase, accentBand, uAccentStrength * (0.35 + rim * 0.65));
  color += rim * 0.08 * uAccent2;

  gl_FragColor = vec4(color, uOpacity);
}
`;

function resolveToneColor(tone: SurfaceTone, palette: ReturnType<typeof useConfiguratorThemePalette>) {
  switch (tone) {
    case 'surfaceAlt':
      return palette.surfaceAlt;
    case 'surfaceDark':
      return palette.surfaceDark;
    case 'accent':
      return palette.accent;
    case 'accent2':
      return palette.accent2;
    case 'muted':
      return palette.muted;
    case 'glass':
      return palette.glass;
    case 'surface':
    default:
      return palette.surface;
  }
}

export default function ThemedSurfaceMaterial({
  tone = 'surface',
  baseColor,
  opacity = 1,
  transparent,
  side = THREE.FrontSide,
  accentStrength = 0.24,
}: ThemedSurfaceMaterialProps) {
  const palette = useConfiguratorThemePalette();
  const resolvedBase = baseColor ?? resolveToneColor(tone, palette);
  const uniforms = useMemo(
    () => ({
      uBaseColor: { value: new THREE.Color(resolvedBase) },
      uAccent: { value: new THREE.Color(palette.accent) },
      uAccent2: { value: new THREE.Color(palette.accent2) },
      uOpacity: { value: opacity },
      uAccentStrength: { value: accentStrength },
    }),
    [accentStrength, opacity, palette.accent, palette.accent2, resolvedBase]
  );

  return (
    <shaderMaterial
      vertexShader={VERTEX_SHADER}
      fragmentShader={FRAGMENT_SHADER}
      uniforms={uniforms}
      transparent={transparent ?? opacity < 1}
      side={side}
      depthWrite={opacity >= 1}
      toneMapped={false}
    />
  );
}
