"use client";

import { useEffect, useRef } from "react";

type Particle = {
  originX: number;
  originY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  ease: number;
  friction: number;
  tint: number;
};

type Rgb = { r: number; g: number; b: number };

type ParticleGridProps = {
  className?: string;
  children?: React.ReactNode;
};

function hexToRgb(hex: string): Rgb | null {
  const cleaned = hex.replace("#", "").trim();
  if (!cleaned) return null;
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : cleaned;
  if (full.length !== 6) return null;
  const value = Number.parseInt(full, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export default function ParticleGrid({ className, children }: ParticleGridProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const shell = shellRef.current;
    if (!canvas || !shell) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const styles = getComputedStyle(document.documentElement);
    const accent =
      hexToRgb(styles.getPropertyValue("--accent")) ?? {
        r: 123,
        g: 123,
        b: 255,
      };
    const accentAlt =
      hexToRgb(styles.getPropertyValue("--accent-2")) ?? {
        r: 44,
        g: 224,
        b: 181,
      };

    const colors = [accent, accentAlt];
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    let particles: Particle[] = [];
    let animationFrame = 0;
    let bounds = shell.getBoundingClientRect();
    let radius = 120 * 120;

    const buildGrid = () => {
      bounds = shell.getBoundingClientRect();
      const width = Math.max(1, Math.floor(bounds.width));
      const height = Math.max(1, Math.floor(bounds.height));

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const gap = Math.max(18, Math.min(30, Math.round(width / 34)));
      radius = Math.pow(Math.max(90, gap * 3.5), 2);
      const nextParticles: Particle[] = [];

      for (let x = 0; x < width; x += gap) {
        for (let y = 0; y < height; y += gap) {
          const seed = Math.random();
          nextParticles.push({
            originX: x,
            originY: y,
            x,
            y,
            vx: 0,
            vy: 0,
            size: 1 + Math.floor(seed * 3),
            ease: 0.2,
            friction: 0.92 + seed * 0.05,
            tint: seed,
          });
        }
      }

      particles = nextParticles;
    };

    const render = () => {
      context.clearRect(0, 0, bounds.width, bounds.height);
      const { x: mx, y: my, active } = mouseRef.current;
      const time = performance.now() * 0.001;

      for (const particle of particles) {
        const idleWave =
          Math.sin(time * 0.6 + particle.originX * 0.03) +
          Math.cos(time * 0.55 + particle.originY * 0.03);

        if (active) {
          const dx = mx - particle.x;
          const dy = my - particle.y;
          const distance = dx * dx + dy * dy;
          if (distance < radius) {
            const angle = Math.atan2(dy, dx);
            const force = (-radius / distance) * 8;
            particle.vx += force * Math.cos(angle);
            particle.vy += force * Math.sin(angle);
          }
        }

        const drift = (0.6 + particle.tint * 0.8) * (active ? 0.35 : 1);
        particle.vx += idleWave * drift * 0.02;
        particle.vy += idleWave * drift * 0.02;

        particle.x +=
          (particle.vx *= particle.friction) +
          (particle.originX - particle.x) * particle.ease;
        particle.y +=
          (particle.vy *= particle.friction) +
          (particle.originY - particle.y) * particle.ease;

        const color = colors[particle.tint > 0.6 ? 1 : 0];
        const intensity = 0.18 + particle.tint * 0.45;
        context.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`;
        context.fillRect(particle.x, particle.y, particle.size, particle.size);
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = shell.getBoundingClientRect();
      mouseRef.current.x = event.clientX - rect.left;
      mouseRef.current.y = event.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
    };

    shell.addEventListener("pointermove", handlePointerMove);
    shell.addEventListener("pointerleave", handlePointerLeave);

    const resizeObserver = new ResizeObserver(buildGrid);
    resizeObserver.observe(shell);

    buildGrid();
    render();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      shell.removeEventListener("pointermove", handlePointerMove);
      shell.removeEventListener("pointerleave", handlePointerLeave);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className={`particle-shell${className ? ` ${className}` : ""}`} ref={shellRef}>
      <canvas className="particle-canvas" ref={canvasRef} aria-hidden="true" />
      <div className="particle-gridlines" aria-hidden="true" />
      <div className="particle-content">{children}</div>
    </div>
  );
}
