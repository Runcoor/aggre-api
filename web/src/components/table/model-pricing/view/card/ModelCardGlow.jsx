/*
Copyright (C) 2025 QuantumNous

ModelCardGlow — wrapper that adds a cursor-tracking BorderGlow effect
(react-bits.dev) to the model pricing card. Tracks pointer movement and
updates --edge-proximity / --cursor-angle CSS vars consumed by the
companion stylesheet.

The wrapper is structurally invisible: bg/border/shadow stay on the
inner article so the existing selected/hover styling keeps working. We
just paint the glow on top.

Usage:
  <ModelCardGlow disabled={isSelected}>
    <article ...>...</article>
  </ModelCardGlow>
*/

import React, { useCallback, useRef } from 'react';
import './ModelCardGlow.css';

const ModelCardGlow = ({ children, disabled = false, className = '' }) => {
  const ref = useRef(null);

  const handlePointerMove = useCallback(
    (e) => {
      if (disabled || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = x - cx;
      const dy = y - cy;

      // Edge proximity in [0, 1] — 0 at center, 1 at the nearest edge.
      let kx = Infinity;
      let ky = Infinity;
      if (dx !== 0) kx = cx / Math.abs(dx);
      if (dy !== 0) ky = cy / Math.abs(dy);
      const edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);

      // Cursor angle in degrees — 0 deg points up, increases clockwise.
      let degrees = 0;
      if (dx !== 0 || dy !== 0) {
        const radians = Math.atan2(dy, dx);
        degrees = radians * (180 / Math.PI) + 90;
        if (degrees < 0) degrees += 360;
      }

      ref.current.style.setProperty(
        '--edge-proximity',
        `${(edge * 100).toFixed(3)}`,
      );
      ref.current.style.setProperty(
        '--cursor-angle',
        `${degrees.toFixed(3)}deg`,
      );
    },
    [disabled],
  );

  return (
    <div
      ref={ref}
      className={`model-card-glow ${disabled ? 'is-disabled' : ''} ${className}`.trim()}
      onPointerMove={handlePointerMove}
    >
      <span className='model-card-glow-edge' aria-hidden />
      <div className='model-card-glow-inner'>{children}</div>
    </div>
  );
};

export default ModelCardGlow;
