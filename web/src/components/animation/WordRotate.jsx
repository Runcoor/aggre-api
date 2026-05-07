/*
Copyright (C) 2025 QuantumNous

WordRotate — cycles through a list of items in place, cross-fading
between them. CSS-only animation (no framer-motion). All items are
rendered into the same inline-grid cell so the wrapper sizes to the
widest item — no layout shift between rotations.

Pauses on hover by default so users can read a phrase that interests
them without it sliding away.
*/

import { useEffect, useState } from 'react';
import './WordRotate.css';

const WordRotate = ({
  items,
  interval = 2500,
  duration = 500,
  render,
  className = '',
  style = {},
  pauseOnHover = true,
}) => {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!items || items.length <= 1) return;
    if (isHovered) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, interval);
    return () => clearInterval(timer);
  }, [items, interval, isHovered]);

  if (!items || items.length === 0) return null;

  const cls = ['word-rotate', className].filter(Boolean).join(' ');

  return (
    <span
      className={cls}
      style={{ '--wr-duration': `${duration}ms`, ...style }}
      onMouseEnter={pauseOnHover ? () => setIsHovered(true) : undefined}
      onMouseLeave={pauseOnHover ? () => setIsHovered(false) : undefined}
    >
      {items.map((item, i) => (
        <span
          key={i}
          className={`word-rotate-item${i === index ? ' is-active' : ''}`}
          aria-hidden={i !== index}
        >
          {render(item, i)}
        </span>
      ))}
    </span>
  );
};

export default WordRotate;
