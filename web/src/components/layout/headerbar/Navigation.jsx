/*
Copyright (C) 2025 QuantumNous

Top navigation with:
  - Active-route indicator (gradient pill background + primary text)
  - Hover dropdown support for links with `children` (e.g. Tools menu)
  - Auto dark-mode via CSS variables
*/

import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SkeletonWrapper from '../components/SkeletonWrapper';

const baseLinkStyle = {
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  borderRadius: 'var(--radius-md)',
  transition: 'color 150ms ease-out, background 150ms ease-out, font-weight 150ms ease-out',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  position: 'relative',
  cursor: 'pointer',
  background: 'transparent',
  border: 'none',
  fontFamily: 'inherit',
};

const activeLinkStyle = {
  color: 'var(--text-primary)',
  fontWeight: 600,
  background: 'linear-gradient(135deg, rgba(0, 114, 255, 0.12) 0%, rgba(0, 198, 255, 0.18) 100%)',
  boxShadow: '0 0 0 1px rgba(0, 114, 255, 0.18) inset',
};

// Is a nav entry considered "active" given the current pathname?
// - Exact home match (/ and /home-old stay separate)
// - For routes like /console and /docs, match the prefix
// - For dropdowns with children, active if any child matches
const isEntryActive = (link, pathname) => {
  if (link.children && link.children.length > 0) {
    return link.children.some((c) => isEntryActive(c, pathname));
  }
  if (link.to === '/') return pathname === '/';
  if (!link.to) return false;
  return pathname === link.to || pathname.startsWith(link.to + '/');
};

// ── Dropdown sub-item ───────────────────────────────────────────────────────
const DropdownItem = ({ link, onClose }) => {
  const [hover, setHover] = useState(false);
  return (
    <Link
      to={link.to}
      onClick={onClose}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        textDecoration: 'none',
        color: hover ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: hover ? 'var(--surface-hover)' : 'transparent',
        borderRadius: 'var(--radius-sm)',
        fontSize: 13,
        fontWeight: hover ? 600 : 500,
        transition: 'all 120ms ease-out',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {link.icon && (
        <span style={{ display: 'inline-flex', color: 'var(--text-muted)' }}>
          {link.icon}
        </span>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span>{link.text}</span>
        {link.description && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
            {link.description}
          </span>
        )}
      </div>
    </Link>
  );
};

// ── Dropdown trigger (for entries with children) ────────────────────────────
const DropdownNavEntry = ({ link, active, padding }) => {
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const wrapperRef = useRef(null);

  const cancelClose = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    timerRef.current = setTimeout(() => setOpen(false), 140);
  };

  // Close on click-outside (for click-to-toggle behavior)
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div
      ref={wrapperRef}
      style={{ position: 'relative' }}
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={scheduleClose}
    >
      <button
        type='button'
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        style={{
          ...baseLinkStyle,
          padding,
          ...(active ? activeLinkStyle : {}),
        }}
      >
        <span>{link.text}</span>
        <svg
          width='10'
          height='10'
          viewBox='0 0 24 24'
          fill='none'
          style={{
            opacity: 0.7,
            transition: 'transform 180ms ease-out',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path d='M6 9l6 6 6-6' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
      </button>
      {open && (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: 260,
            padding: 6,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.02) inset',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            zIndex: 9999,
          }}
        >
          {link.children.map((child) => (
            <DropdownItem key={child.itemKey} link={child} onClose={() => setOpen(false)} />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Plain nav link ─────────────────────────────────────────────────────────
const PlainNavLink = ({ link, active, targetPath, padding }) => {
  const [hover, setHover] = useState(false);
  const style = {
    ...baseLinkStyle,
    padding,
    ...(active
      ? activeLinkStyle
      : hover
        ? { color: 'var(--text-primary)', background: 'var(--surface-hover)' }
        : {}),
  };

  if (link.isExternal) {
    return (
      <a
        href={link.externalLink}
        target='_blank'
        rel='noopener noreferrer'
        style={style}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <span>{link.text}</span>
      </a>
    );
  }

  return (
    <Link
      to={targetPath}
      style={style}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span>{link.text}</span>
    </Link>
  );
};

// ── Main Navigation ────────────────────────────────────────────────────────
const Navigation = ({
  mainNavLinks,
  isMobile,
  isLoading,
  userState,
  pricingRequireAuth,
}) => {
  const location = useLocation();
  const padding = isMobile ? '4px 10px' : '6px 14px';

  // On mobile, the inline nav links overflow and overlap the action buttons
  // (notifications / theme / language / user). They are surfaced via a
  // dedicated mobile nav drawer instead — see headerbar/index.jsx.
  if (isMobile) return null;

  const renderNavLinks = () => {
    return mainNavLinks.map((link) => {
      const active = isEntryActive(link, location.pathname);

      if (link.children && link.children.length > 0) {
        return (
          <DropdownNavEntry
            key={link.itemKey}
            link={link}
            active={active}
            padding={padding}
          />
        );
      }

      let targetPath = link.to;
      if (link.itemKey === 'console' && !userState.user) targetPath = '/login';
      if (link.itemKey === 'pricing' && pricingRequireAuth && !userState.user) {
        targetPath = '/login';
      }

      return (
        <PlainNavLink
          key={link.itemKey}
          link={link}
          active={active}
          targetPath={targetPath}
          padding={padding}
        />
      );
    });
  };

  return (
    <nav
      className='flex flex-1 items-center gap-1 mx-3 md:mx-6 whitespace-nowrap'
      style={{ overflow: 'visible' }}
    >
      <SkeletonWrapper
        loading={isLoading}
        type='navigation'
        count={4}
        width={60}
        height={16}
        isMobile={isMobile}
      >
        {renderNavLinks()}
      </SkeletonWrapper>
    </nav>
  );
};

export default Navigation;
