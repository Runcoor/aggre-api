/*
Copyright (C) 2025 QuantumNous

GooeyNav — adapted from React Bits (react-bits.dev) for QuantumNous header.

Adaptations vs. the original component:
  - Uses React Router's `useNavigate` / `useLocation` instead of <a href> + activeIndex prop
  - Supports dropdown entries (items with `children`) — clicking opens a panel,
    no navigation happens. Active state propagates from any active child route.
  - Uses brand --accent-gradient for the active pill instead of plain white
  - Particle palette is tuned to brand blue gradient stops in GooeyNav.css
*/

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './GooeyNav.css';

// Pseudo-random offset in [-n/2, n/2). Stateless, lives at module scope so
// useCallback hooks below don't need to track it as a dep.
const noise = (n = 1) => n / 2 - Math.random() * n;

const isEntryActive = (link, pathname) => {
  if (link.children && link.children.length > 0) {
    return link.children.some((c) => isEntryActive(c, pathname));
  }
  if (link.to === '/') return pathname === '/';
  if (!link.to) return false;
  return pathname === link.to || pathname.startsWith(link.to + '/');
};

const ChevronDown = () => (
  <svg
    className='chevron'
    viewBox='0 0 24 24'
    fill='none'
    aria-hidden
  >
    <path
      d='M6 9l6 6 6-6'
      stroke='currentColor'
      strokeWidth='2.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const DropdownPanel = ({ children, onClose, anchorEl }) => {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!anchorEl) return;
    const update = () => {
      const r = anchorEl.getBoundingClientRect();
      const containerRect = anchorEl
        .closest('.gooey-nav-container')
        ?.getBoundingClientRect();
      if (!containerRect) return;
      setPos({
        left: r.left - containerRect.left,
        top: r.bottom - containerRect.top + 6,
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchorEl]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        if (anchorEl && anchorEl.contains(e.target)) return;
        onClose?.();
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [anchorEl, onClose]);

  return (
    <div
      ref={ref}
      className='gooey-nav-dropdown-panel'
      style={{ left: pos.left, top: pos.top }}
      onMouseLeave={onClose}
    >
      {children}
    </div>
  );
};

const GooeyNav = ({
  items,
  animationTime = 600,
  particleCount = 15,
  particleDistances = [90, 10],
  particleR = 100,
  timeVariance = 300,
  colors = [1, 2, 3, 1, 2, 3, 1, 4],
  onItemNavigate,
}) => {
  const containerRef = useRef(null);
  const navRef = useRef(null);
  const filterRef = useRef(null);
  const textRef = useRef(null);
  const itemRefs = useRef({});
  const navigate = useNavigate();
  const location = useLocation();

  // Active index derives from the current URL — keeps in sync with browser nav,
  // back/forward buttons, deep links, etc.
  const activeIndex = (() => {
    const idx = items.findIndex((l) => isEntryActive(l, location.pathname));
    return idx >= 0 ? idx : 0;
  })();

  const [openDropdownKey, setOpenDropdownKey] = useState(null);

  const getXY = useCallback((distance, pointIndex, totalPoints) => {
    const angle =
      ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  }, []);

  const createParticle = useCallback(
    (i, t, d, r) => {
      const rotate = noise(r / 10);
      return {
        start: getXY(d[0], particleCount - i, particleCount),
        end: getXY(d[1] + noise(7), particleCount - i, particleCount),
        time: t,
        scale: 1 + noise(0.2),
        color: colors[Math.floor(Math.random() * colors.length)],
        rotate:
          rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10,
      };
    },
    [colors, particleCount, getXY],
  );

  const makeParticles = useCallback(
    (element) => {
      const d = particleDistances;
      const r = particleR;
      const bubbleTime = animationTime * 2 + timeVariance;
      element.style.setProperty('--time', `${bubbleTime}ms`);

      for (let i = 0; i < particleCount; i++) {
        const t = animationTime * 2 + noise(timeVariance * 2);
        const p = createParticle(i, t, d, r);
        element.classList.remove('active');

        setTimeout(() => {
          const particle = document.createElement('span');
          const point = document.createElement('span');
          particle.classList.add('particle');
          particle.style.setProperty('--start-x', `${p.start[0]}px`);
          particle.style.setProperty('--start-y', `${p.start[1]}px`);
          particle.style.setProperty('--end-x', `${p.end[0]}px`);
          particle.style.setProperty('--end-y', `${p.end[1]}px`);
          particle.style.setProperty('--time', `${p.time}ms`);
          particle.style.setProperty('--scale', `${p.scale}`);
          particle.style.setProperty(
            '--color',
            `var(--color-${p.color}, white)`,
          );
          particle.style.setProperty('--rotate', `${p.rotate}deg`);

          point.classList.add('point');
          particle.appendChild(point);
          element.appendChild(particle);
          requestAnimationFrame(() => {
            element.classList.add('active');
          });
          setTimeout(() => {
            try {
              element.removeChild(particle);
            } catch {
              /* noop */
            }
          }, t);
        }, 30);
      }
    },
    [animationTime, particleCount, particleDistances, particleR, timeVariance, createParticle],
  );

  const updateEffectPosition = useCallback((element) => {
    if (!containerRef.current || !filterRef.current || !textRef.current)
      return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = element.getBoundingClientRect();

    const styles = {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`,
    };
    Object.assign(filterRef.current.style, styles);
    Object.assign(textRef.current.style, styles);
    // Pull the visible text only (skip the chevron SVG)
    const labelEl = element.querySelector('[data-label]') || element;
    textRef.current.innerText = labelEl.innerText;
  }, []);

  const triggerEffect = useCallback(
    (liEl) => {
      updateEffectPosition(liEl);

      if (filterRef.current) {
        filterRef.current
          .querySelectorAll('.particle')
          .forEach((p) => filterRef.current.removeChild(p));
      }

      if (textRef.current) {
        textRef.current.classList.remove('active');
        // Force reflow so the keyframe restarts
        // eslint-disable-next-line no-unused-expressions
        void textRef.current.offsetWidth;
        textRef.current.classList.add('active');
      }

      if (filterRef.current) {
        makeParticles(filterRef.current);
      }
    },
    [makeParticles, updateEffectPosition],
  );

  const handleItemClick = (e, item, index) => {
    e.preventDefault();
    const liEl = itemRefs.current[item.itemKey];
    if (!liEl) return;

    const isActive = index === activeIndex;
    const hasChildren = item.children && item.children.length > 0;

    // Skip the burst when re-clicking the active plain item (matches the
    // original GooeyNav UX). Dropdown triggers always burst+toggle so the
    // user gets visual feedback when opening Tools.
    if (!isActive || hasChildren) {
      triggerEffect(liEl);
    }

    if (hasChildren) {
      setOpenDropdownKey((prev) =>
        prev === item.itemKey ? null : item.itemKey,
      );
      return;
    }

    setOpenDropdownKey(null);

    // Resolve target path (allow consumers to override per item, e.g. console -> login when logged out)
    const targetPath = onItemNavigate?.(item) ?? item.to;
    if (item.isExternal && item.externalLink) {
      window.open(item.externalLink, '_blank', 'noopener,noreferrer');
      return;
    }
    if (targetPath) navigate(targetPath);
  };

  const handleKeyDown = (e, item, index) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleItemClick(e, item, index);
    } else if (e.key === 'Escape') {
      setOpenDropdownKey(null);
    }
  };

  // Sync the visual effect when the route changes externally (e.g. user clicks
  // a link elsewhere, hits browser back, or deep-links into a route).
  useEffect(() => {
    if (!navRef.current || !containerRef.current) return;
    const activeItem = items[activeIndex];
    const liEl = activeItem ? itemRefs.current[activeItem.itemKey] : null;
    if (liEl) {
      updateEffectPosition(liEl);
      textRef.current?.classList.add('active');
    }

    const ro = new ResizeObserver(() => {
      const li = activeItem ? itemRefs.current[activeItem.itemKey] : null;
      if (li) updateEffectPosition(li);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [activeIndex, items, updateEffectPosition]);

  const openItem = items.find((it) => it.itemKey === openDropdownKey);
  const openAnchor = openItem ? itemRefs.current[openItem.itemKey] : null;

  return (
    <div className='gooey-nav-container' ref={containerRef}>
      <nav>
        <ul ref={navRef}>
          {items.map((item, index) => {
            const active = isEntryActive(item, location.pathname);
            const hasChildren = item.children && item.children.length > 0;
            const open = openDropdownKey === item.itemKey;

            return (
              <li
                key={item.itemKey}
                ref={(el) => {
                  if (el) itemRefs.current[item.itemKey] = el;
                  else delete itemRefs.current[item.itemKey];
                }}
                className={active ? 'active' : ''}
                data-open={open ? 'true' : 'false'}
              >
                <button
                  type='button'
                  onClick={(e) => handleItemClick(e, item, index)}
                  onKeyDown={(e) => handleKeyDown(e, item, index)}
                  aria-haspopup={hasChildren ? 'menu' : undefined}
                  aria-expanded={hasChildren ? open : undefined}
                >
                  <span data-label>{item.text}</span>
                  {hasChildren && <ChevronDown />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <span className='effect filter' ref={filterRef} aria-hidden />
      <span className='effect text' ref={textRef} aria-hidden />

      {openItem && openAnchor && (
        <DropdownPanel
          anchorEl={openAnchor}
          onClose={() => setOpenDropdownKey(null)}
        >
          {openItem.children.map((child) => (
            <a
              key={child.itemKey}
              href={child.to}
              className='gooey-nav-dropdown-item'
              onClick={(e) => {
                e.preventDefault();
                setOpenDropdownKey(null);
                if (child.isExternal && child.externalLink) {
                  window.open(child.externalLink, '_blank', 'noopener,noreferrer');
                } else if (child.to) {
                  navigate(child.to);
                }
              }}
            >
              {child.icon && <span className='icon'>{child.icon}</span>}
              <div className='body'>
                <span>{child.text}</span>
                {child.description && (
                  <span className='desc'>{child.description}</span>
                )}
              </div>
            </a>
          ))}
        </DropdownPanel>
      )}
    </div>
  );
};

export default GooeyNav;
