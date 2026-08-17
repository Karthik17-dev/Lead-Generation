'use client';

import { useReducedMotion } from 'motion/react';
import { useTheme } from 'next-themes';
import { memo, useEffect, useRef } from 'react';

export function useWallpaperTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const reduceMotion = useReducedMotion() ?? false;
  return { isDark, bg: isDark ? '#121214' : '#ffffff', reduceMotion };
}

/**
 * Pure Canvas 2D Dither wallpaper — creates the exact subtle Bayer dot matrix
 * radial backdrop without WebGL / Three.js shader compilation overhead or console noise.
 */
export const DitherShader = memo(function DitherShader() {
  const { isDark, reduceMotion } = useWallpaperTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let frame = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const dotSpacing = 18;
      const baseRadius = 1.3;
      const cx = width / 2;
      const cy = height * 0.44;
      const maxDist = Math.hypot(width, height) * 0.58;

      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.10)';

      const t = reduceMotion ? 0 : frame * 0.005;

      for (let x = 0; x < width; x += dotSpacing) {
        for (let y = 0; y < height; y += dotSpacing) {
          const dist = Math.hypot(x - cx, y - cy);
          if (dist > maxDist) continue;
          const factor = Math.max(0, 1 - dist / maxDist);
          // subtle wave factor
          const wave = Math.sin(x * 0.02 + y * 0.02 + t) * 0.2;
          const r = baseRadius * Math.max(0.2, (factor + wave * 0.3) * 1.1);

          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const loop = () => {
      frame++;
      draw();
      if (!reduceMotion) {
        animId = requestAnimationFrame(loop);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    if (!reduceMotion) {
      animId = requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isDark, reduceMotion]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
});

/**
 * Pure Canvas 2D Silk gradient wallpaper.
 */
export const SilkShader = memo(function SilkShader() {
  const { isDark, reduceMotion } = useWallpaperTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let frame = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const t = reduceMotion ? 0 : frame * 0.003;
      const g = ctx.createLinearGradient(
        width * 0.3 + Math.sin(t) * 50,
        0,
        width * 0.7 + Math.cos(t) * 50,
        height,
      );

      if (isDark) {
        g.addColorStop(0, '#121214');
        g.addColorStop(0.5, '#1a1b1f');
        g.addColorStop(1, '#17181c');
      } else {
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.5, '#f4f4f7');
        g.addColorStop(1, '#eaeaf0');
      }

      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    };

    const loop = () => {
      frame++;
      draw();
      if (!reduceMotion) {
        animId = requestAnimationFrame(loop);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    if (!reduceMotion) {
      animId = requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isDark, reduceMotion]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-60" />
    </div>
  );
});
