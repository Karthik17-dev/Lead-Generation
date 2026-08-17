'use client';

import { useReducedMotion } from 'motion/react';
import { useTheme } from 'next-themes';
import { memo, useEffect, useRef } from 'react';

export const ShaderWallpaper = memo(function ShaderWallpaper() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const reduceMotion = useReducedMotion() ?? false;
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
      const dotSpacing = 20;
      const baseRadius = 1.2;
      const cx = width / 2;
      const cy = height * 0.45;
      const maxDist = Math.hypot(width, height) * 0.6;

      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)';

      const t = reduceMotion ? 0 : frame * 0.006;

      for (let x = 0; x < width; x += dotSpacing) {
        for (let y = 0; y < height; y += dotSpacing) {
          const dist = Math.hypot(x - cx, y - cy);
          if (dist > maxDist) continue;
          const factor = Math.max(0, 1 - dist / maxDist);
          const wave = Math.sin(x * 0.015 + y * 0.015 + t) * 0.2;
          const r = baseRadius * Math.max(0.2, (factor + wave * 0.25) * 1.1);

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
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-60"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
});
