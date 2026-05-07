/*
Copyright (C) 2025 QuantumNous

CountUp — animates a number from 0 to a target value when the element
scrolls into view. RAF-based, no framer-motion dependency. Mutates the
DOM directly via ref so it doesn't trigger 60 React re-renders/sec.
*/

import { useEffect, useRef } from 'react';

const formatValue = (val, decimals, separator) =>
  val.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, separator);

const easings = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};

const CountUp = ({
  value,
  duration = 1800,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = ',',
  easing = 'easeOut',
  triggerOnView = true,
  threshold = 0.2,
  className = '',
  style,
  ...rest
}) => {
  const containerRef = useRef(null);
  const numberRef = useRef(null);
  const easeFn = easings[easing] || easings.easeOut;
  const initialText = formatValue(0, decimals, separator);

  useEffect(() => {
    let rafId = null;
    let observer = null;
    let started = false;

    const setText = (text) => {
      if (numberRef.current) numberRef.current.textContent = text;
    };

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setText(formatValue(value, decimals, separator));
      return;
    }

    const start = () => {
      if (started) return;
      started = true;
      const startTime = performance.now();
      const tick = (now) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = easeFn(t);
        setText(formatValue(eased * value, decimals, separator));
        if (t < 1) {
          rafId = requestAnimationFrame(tick);
        }
      };
      rafId = requestAnimationFrame(tick);
    };

    if (!triggerOnView) {
      start();
    } else if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            start();
            observer.disconnect();
          }
        },
        { threshold },
      );
      if (containerRef.current) observer.observe(containerRef.current);
    } else {
      start();
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (observer) observer.disconnect();
    };
  }, [value, duration, decimals, separator, easing, triggerOnView, threshold, easeFn]);

  return (
    <span ref={containerRef} className={className} style={style} {...rest}>
      {prefix}
      <span ref={numberRef}>{initialText}</span>
      {suffix}
    </span>
  );
};

export default CountUp;
