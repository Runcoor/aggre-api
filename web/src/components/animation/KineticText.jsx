/*
Copyright (C) 2025 QuantumNous

KineticText — splits text into per-character spans and plays a
left-to-right wave on mouseenter.

Gradient mode (`gradient` prop): nesting spans inside a parent that
uses background-clip:text breaks the gradient — descendants aren't
sampled by the parent's clip. So when a gradient is requested we
hand each char its own copy of the gradient, sized to
N * char-width, with bg-position offset by index. Collectively the
chars reproduce the parent's left→right sweep. Approximate for
proportional fonts (slices are 1/N of bg width regardless of char's
own width) but the visual difference reads as smooth.

Wave runs to completion regardless of hover state — moving the
cursor away mid-wave does NOT cut it off. Re-trigger pattern:
remove → force reflow → add the .kt-is-waving class.
*/

import { useCallback, useMemo, useRef } from 'react';
import './KineticText.css';

const KineticText = ({
  text,
  gradient,
  className = '',
  style,
  ...rest
}) => {
  const ref = useRef(null);
  const chars = useMemo(() => Array.from(String(text ?? '')), [text]);
  const total = chars.length;

  const triggerWave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('kt-is-waving');
    void el.offsetWidth;
    el.classList.add('kt-is-waving');
  }, []);

  const wrapperClass = [
    'kinetic-text',
    gradient ? 'kinetic-text--gradient' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const wrapperStyle = {
    ...(gradient
      ? { '--kt-gradient': gradient, '--kt-total': total }
      : {}),
    ...style,
  };

  return (
    <span
      ref={ref}
      className={wrapperClass}
      style={wrapperStyle}
      onMouseEnter={triggerWave}
      onFocus={triggerWave}
      {...rest}
    >
      {chars.map((ch, i) => {
        const pos = total > 1 ? (i / (total - 1)) * 100 : 0;
        return (
          <span
            key={i}
            className='kt-char'
            style={{ '--kt-i': i, '--kt-pos': `${pos}%` }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};

export default KineticText;
