/*
Copyright (C) 2025 QuantumNous

KineticText — splits text into per-character spans and plays a
left-to-right wave on mouseenter. Wave runs to completion regardless
of hover state — moving the cursor away mid-wave does NOT cut it off,
which keeps the effect feeling deliberate rather than twitchy.

Re-trigger pattern: remove → force reflow → add the .kt-is-waving
class. Without the reflow CSS won't notice the class was ever absent
and animation-name won't restart.

The component itself is transparent to text-color/background — drop it
inside any styled wrapper (e.g. a gradient span with background-clip:
text) and the per-char transforms will inherit the parent's painted
appearance because background-clip sampling happens during the parent's
paint phase, before child transforms are composited.
*/

import { useCallback, useMemo, useRef } from 'react';
import './KineticText.css';

const KineticText = ({ text, className = '', style, ...rest }) => {
  const ref = useRef(null);
  const chars = useMemo(() => Array.from(String(text ?? '')), [text]);

  const triggerWave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('kt-is-waving');
    void el.offsetWidth;
    el.classList.add('kt-is-waving');
  }, []);

  return (
    <span
      ref={ref}
      className={`kinetic-text ${className}`.trim()}
      style={style}
      onMouseEnter={triggerWave}
      onFocus={triggerWave}
      {...rest}
    >
      {chars.map((ch, i) => (
        <span key={i} className='kt-char' style={{ '--kt-i': i }}>
          {ch}
        </span>
      ))}
    </span>
  );
};

export default KineticText;
