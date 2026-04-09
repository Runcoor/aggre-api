/*
Copyright (C) 2025 QuantumNous

Mobile-only top navigation drawer. The inline <Navigation /> is hidden on
mobile because it overflows and overlaps the action buttons; this slide-in
drawer surfaces the same nav links so users can still reach Pricing, Docs,
Tools, etc. on small screens.
*/

import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@douyinfe/semi-ui';
import { IconClose, IconMenu } from '@douyinfe/semi-icons';

const isEntryActive = (link, pathname) => {
  if (link.children && link.children.length > 0) {
    return link.children.some((c) => isEntryActive(c, pathname));
  }
  if (link.to === '/') return pathname === '/';
  if (!link.to) return false;
  return pathname === link.to || pathname.startsWith(link.to + '/');
};

const MobileNavDrawer = ({
  open,
  onToggle,
  onClose,
  mainNavLinks,
  userState,
  pricingRequireAuth,
  t,
}) => {
  const location = useLocation();

  // Close on route change
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const renderItem = (link, depth = 0) => {
    const active = isEntryActive(link, location.pathname);

    let targetPath = link.to;
    if (link.itemKey === 'console' && !userState?.user) targetPath = '/login';
    if (link.itemKey === 'pricing' && pricingRequireAuth && !userState?.user) {
      targetPath = '/login';
    }

    const itemStyle = {
      display: 'flex',
      alignItems: 'center',
      padding: depth === 0 ? '12px 14px' : '10px 14px 10px 28px',
      borderRadius: 'var(--radius-md)',
      fontSize: depth === 0 ? 14 : 13,
      fontWeight: active ? 600 : 500,
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      background: active
        ? 'linear-gradient(135deg, rgba(0, 114, 255, 0.12) 0%, rgba(0, 198, 255, 0.18) 100%)'
        : 'transparent',
      textDecoration: 'none',
      transition: 'background 150ms ease-out, color 150ms ease-out',
    };

    if (link.children && link.children.length > 0) {
      return (
        <div key={link.itemKey} style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              ...itemStyle,
              color: 'var(--text-muted)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '14px 14px 6px',
              background: 'transparent',
            }}
          >
            {link.text}
          </div>
          {link.children.map((c) => renderItem(c, 1))}
        </div>
      );
    }

    if (link.isExternal) {
      return (
        <a
          key={link.itemKey}
          href={link.externalLink}
          target='_blank'
          rel='noopener noreferrer'
          style={itemStyle}
          onClick={onClose}
        >
          {link.text}
        </a>
      );
    }

    return (
      <Link key={link.itemKey} to={targetPath} style={itemStyle} onClick={onClose}>
        {link.text}
      </Link>
    );
  };

  return (
    <>
      <Button
        icon={open ? <IconClose className='text-lg' /> : <IconMenu className='text-lg' />}
        aria-label={open ? t('关闭菜单') : t('打开菜单')}
        onClick={onToggle}
        theme='borderless'
        type='tertiary'
        className='!w-8 !h-8 !p-0 flex items-center justify-center'
        style={{
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-secondary)',
          transition: 'background-color 150ms ease-out',
        }}
      />

      {open && (
        <>
          <div
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              top: 'var(--header-height)',
              zIndex: 96,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 'var(--header-height)',
              left: 0,
              bottom: 0,
              width: '78vw',
              maxWidth: 300,
              zIndex: 97,
              background: 'var(--surface)',
              borderRight: '1px solid var(--border-default)',
              padding: '14px 10px',
              overflowY: 'auto',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              animation: 'mobileNavIn 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {mainNavLinks.map((link) => renderItem(link))}
          </div>
          <style>{`@keyframes mobileNavIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
        </>
      )}
    </>
  );
};

export default MobileNavDrawer;
