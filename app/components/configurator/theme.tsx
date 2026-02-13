'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as THREE from 'three';

export type ConfiguratorThemePalette = {
  bg: string;
  fog: string;
  surface: string;
  surfaceAlt: string;
  surfaceDark: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  line: string;
  lineSoft: string;
  gridMajor: string;
  gridMinor: string;
  glass: string;
  ambientLight: string;
  keyLight: string;
};

const FALLBACK_THEME: ConfiguratorThemePalette = {
  bg: '#0a0b10',
  fog: '#1f2230',
  surface: '#34384a',
  surfaceAlt: '#2e3552',
  surfaceDark: '#1b1f2f',
  text: '#e7eaf6',
  muted: '#a6adbf',
  accent: '#7b7bff',
  accent2: '#2ce0b5',
  line: '#9ea7c2',
  lineSoft: '#6f7894',
  gridMajor: '#545b72',
  gridMinor: '#2b3044',
  glass: '#3b5260',
  ambientLight: '#f0f3ff',
  keyLight: '#bfd0ff',
};

const CONFIGURATOR_THEME_KEYS = [
  '--bg',
  '--bg-soft',
  '--text',
  '--muted',
  '--accent',
  '--accent-2',
] as const;

type ThemeKey = (typeof CONFIGURATOR_THEME_KEYS)[number];

type ThemeSnapshot = Record<ThemeKey, string>;

const ConfiguratorThemeContext = createContext<ConfiguratorThemePalette>(FALLBACK_THEME);

const toHex = (color: THREE.Color) => `#${color.getHexString()}`;

function readCssVar(styles: CSSStyleDeclaration, name: ThemeKey, fallback: string) {
  const value = styles.getPropertyValue(name).trim();
  return value || fallback;
}

function colorFromCss(value: string, fallback: string) {
  const color = new THREE.Color();
  try {
    color.set(value);
  } catch {
    color.set(fallback);
  }
  return color;
}

function readThemeSnapshot(): ThemeSnapshot {
  if (typeof window === 'undefined') {
    return {
      '--bg': FALLBACK_THEME.bg,
      '--bg-soft': FALLBACK_THEME.surfaceAlt,
      '--text': FALLBACK_THEME.text,
      '--muted': FALLBACK_THEME.muted,
      '--accent': FALLBACK_THEME.accent,
      '--accent-2': FALLBACK_THEME.accent2,
    };
  }

  const styles = getComputedStyle(document.documentElement);
  return {
    '--bg': readCssVar(styles, '--bg', FALLBACK_THEME.bg),
    '--bg-soft': readCssVar(styles, '--bg-soft', FALLBACK_THEME.surfaceAlt),
    '--text': readCssVar(styles, '--text', FALLBACK_THEME.text),
    '--muted': readCssVar(styles, '--muted', FALLBACK_THEME.muted),
    '--accent': readCssVar(styles, '--accent', FALLBACK_THEME.accent),
    '--accent-2': readCssVar(styles, '--accent-2', FALLBACK_THEME.accent2),
  };
}

function snapshotsMatch(a: ThemeSnapshot, b: ThemeSnapshot) {
  return CONFIGURATOR_THEME_KEYS.every((key) => a[key] === b[key]);
}

function buildPalette(snapshot: ThemeSnapshot): ConfiguratorThemePalette {
  const bg = colorFromCss(snapshot['--bg'], FALLBACK_THEME.bg);
  const bgSoft = colorFromCss(snapshot['--bg-soft'], FALLBACK_THEME.surfaceAlt);
  const text = colorFromCss(snapshot['--text'], FALLBACK_THEME.text);
  const muted = colorFromCss(snapshot['--muted'], FALLBACK_THEME.muted);
  const accent = colorFromCss(snapshot['--accent'], FALLBACK_THEME.accent);
  const accent2 = colorFromCss(snapshot['--accent-2'], FALLBACK_THEME.accent2);

  const surface = bg.clone().lerp(text, 0.22);
  const surfaceAlt = bgSoft.clone().lerp(accent, 0.2);
  const surfaceDark = bg.clone().lerp(accent, 0.08);
  const fog = bg.clone().lerp(text, 0.14);
  const line = text.clone().lerp(accent, 0.2);
  const lineSoft = muted.clone().lerp(bg, 0.42);
  const gridMajor = accent.clone().lerp(text, 0.35).lerp(bg, 0.84);
  const gridMinor = bg.clone().lerp(muted, 0.12);
  const glass = accent2.clone().lerp(bg, 0.7);
  const ambientLight = text.clone().lerp(accent2, 0.15);
  const keyLight = accent.clone().lerp(text, 0.55);

  return {
    bg: toHex(bg),
    fog: toHex(fog),
    surface: toHex(surface),
    surfaceAlt: toHex(surfaceAlt),
    surfaceDark: toHex(surfaceDark),
    text: toHex(text),
    muted: toHex(muted),
    accent: toHex(accent),
    accent2: toHex(accent2),
    line: toHex(line),
    lineSoft: toHex(lineSoft),
    gridMajor: toHex(gridMajor),
    gridMinor: toHex(gridMinor),
    glass: toHex(glass),
    ambientLight: toHex(ambientLight),
    keyLight: toHex(keyLight),
  };
}

export function ConfiguratorThemeProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<ThemeSnapshot>(() => readThemeSnapshot());

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let raf = 0;

    const refreshSnapshot = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const next = readThemeSnapshot();
        setSnapshot((prev) => (snapshotsMatch(prev, next) ? prev : next));
      });
    };

    refreshSnapshot();

    const observer = new MutationObserver(refreshSnapshot);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme'],
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme'],
    });

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onMediaChange = () => refreshSnapshot();
    if ('addEventListener' in media) {
      media.addEventListener('change', onMediaChange);
    } else {
      media.addListener(onMediaChange);
    }

    const poll = window.setInterval(refreshSnapshot, 900);
    window.addEventListener('themechange', refreshSnapshot);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      if ('removeEventListener' in media) {
        media.removeEventListener('change', onMediaChange);
      } else {
        media.removeListener(onMediaChange);
      }
      window.removeEventListener('themechange', refreshSnapshot);
      clearInterval(poll);
    };
  }, []);

  const palette = useMemo(() => buildPalette(snapshot), [snapshot]);

  return (
    <ConfiguratorThemeContext.Provider value={palette}>
      {children}
    </ConfiguratorThemeContext.Provider>
  );
}

export function useConfiguratorThemePalette() {
  return useContext(ConfiguratorThemeContext);
}
