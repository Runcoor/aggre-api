/*
Copyright (C) 2025 QuantumNous

TextAnimate — drop-in scroll-triggered text reveal. CSS-only animation,
no framer-motion. The wrapper itself becomes the rendered tag (h1, h2,
p, span, …) so layout/semantic structure is preserved — pass `as`.

Variants:
  fadeUp — opacity 0→1 + translateY(12px→0) + slight blur. For headlines.
  fade   — opacity only. For subtitles and body text.
  blur   — opacity 0→1 + blur(8px→0). For accent text.

The animation fires once when the element first scrolls into view (or
immediately on mount if already in view, which is what the hero needs).
Honors prefers-reduced-motion via CSS media query.
*/

import React, { useEffect, useRef, useState } from 'react';
import './TextAnimate.css';

const TextAnimate = ({
  as: Tag = 'span',
  variant = 'fadeUp',
  delay = 0,
  duration = 700,
  rootMargin = '-5% 0px',
  className = '',
  style = {},
  children,
  ...rest
}) => {
  const ref = useRef(null);
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If View Transitions or IO unsupported, just play immediately.
    if (typeof IntersectionObserver === 'undefined') {
      setPlayed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPlayed(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  const mergedStyle = {
    '--ta-delay': `${delay}ms`,
    '--ta-duration': `${duration}ms`,
    ...style,
  };

  const cls = [
    'text-animate',
    `ta-${variant}`,
    played ? 'is-playing' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag ref={ref} className={cls} style={mergedStyle} {...rest}>
      {children}
    </Tag>
  );
};

export default TextAnimate;
