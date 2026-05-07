/*
Copyright (C) 2025 QuantumNous

TextAnimate — drop-in scroll-triggered text reveal. CSS-only animation,
no framer-motion. The wrapper itself becomes the rendered tag (h1, h2,
p, span, …) so layout/semantic structure is preserved — pass `as`.

Variants:
  fadeUp         — opacity + translateY + slight blur. For headlines.
  fade           — opacity only. For subtitles and body text.
  blur           — opacity + blur. For accent / decorative text.
  scaleUp        — opacity + scale(0.85→1) + blur, with back-out
                   easing for a slight "pop" overshoot. Bold headlines.
  slideLeftChar  — character-level slide-in from the right. Each char
                   gets its own translate + opacity + blur transition,
                   staggered by `stagger` ms. Only works when children
                   is a plain string; falls back to whole-block fade
                   when JSX is passed.

The animation fires once when the element first scrolls into view (or
immediately on mount if already in view). Honors prefers-reduced-motion
via the CSS media query in TextAnimate.css.
*/

import React, { useEffect, useRef, useState } from 'react';
import './TextAnimate.css';

const TextAnimate = ({
  as: Tag = 'span',
  variant = 'fadeUp',
  delay = 0,
  duration = 700,
  stagger = 30,
  rootMargin = '0px 0px 10% 0px',
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
    '--ta-stagger': `${stagger}ms`,
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

  // Char-level variants need to split the string into per-character spans
  // so each char can carry its own --ta-char-i index. Falls back to
  // whole-block animation if children isn't a plain string.
  const isCharVariant = variant === 'slideLeftChar';
  let content = children;

  if (isCharVariant && typeof children === 'string') {
    content = Array.from(children).map((ch, i) => (
      <span
        key={i}
        className='ta-char'
        style={{ '--ta-char-i': i }}
      >
        {ch}
      </span>
    ));
  }

  return (
    <Tag ref={ref} className={cls} style={mergedStyle} {...rest}>
      {content}
    </Tag>
  );
};

export default TextAnimate;
