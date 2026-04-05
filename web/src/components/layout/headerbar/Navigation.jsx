/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React from 'react';
import { Link } from 'react-router-dom';
import SkeletonWrapper from '../components/SkeletonWrapper';

const navLinkStyle = {
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  borderRadius: 'var(--radius-sm)',
  transition: 'color 150ms ease-out, background-color 150ms ease-out',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
};

const handleMouseEnter = (e) => {
  e.currentTarget.style.color = 'var(--text-primary)';
  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
};

const handleMouseLeave = (e) => {
  e.currentTarget.style.color = 'var(--text-secondary)';
  e.currentTarget.style.backgroundColor = 'transparent';
};

const Navigation = ({
  mainNavLinks,
  isMobile,
  isLoading,
  userState,
  pricingRequireAuth,
}) => {
  const renderNavLinks = () => {
    const padding = isMobile ? '4px 8px' : '6px 12px';

    return mainNavLinks.map((link) => {
      const linkContent = <span>{link.text}</span>;

      if (link.isExternal) {
        return (
          <a
            key={link.itemKey}
            href={link.externalLink}
            target='_blank'
            rel='noopener noreferrer'
            style={{ ...navLinkStyle, padding }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {linkContent}
          </a>
        );
      }

      let targetPath = link.to;
      if (link.itemKey === 'console' && !userState.user) {
        targetPath = '/login';
      }
      if (link.itemKey === 'pricing' && pricingRequireAuth && !userState.user) {
        targetPath = '/login';
      }

      return (
        <Link
          key={link.itemKey}
          to={targetPath}
          style={{ ...navLinkStyle, padding }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {linkContent}
        </Link>
      );
    });
  };

  return (
    <nav className='flex flex-1 items-center gap-0.5 mx-3 md:mx-6 overflow-x-auto whitespace-nowrap scrollbar-hide'>
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
