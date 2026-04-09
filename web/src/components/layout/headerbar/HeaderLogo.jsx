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
// No Semi imports needed — using native elements with CSS variables
import SkeletonWrapper from '../components/SkeletonWrapper';

const HeaderLogo = ({
  isMobile,
  isConsoleRoute,
  logo,
  logoLoaded,
  isLoading,
  systemName,
  isSelfUseMode,
  isDemoSiteMode,
  t,
}) => {
  if (isMobile && isConsoleRoute) {
    return null;
  }

  return (
    <Link
      to='/'
      className='flex items-center'
      style={{ textDecoration: 'none' }}
    >
      <SkeletonWrapper loading={isLoading} type='title' width={140} height={32}>
        <>
          <img
            src='/logo-light.png'
            alt='logo'
            className='brand-logo brand-logo-light'
            style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
          />
          <img
            src='/logo-dark.png'
            alt='logo'
            className='brand-logo brand-logo-dark'
            style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
          />
        </>
      </SkeletonWrapper>
      {(isSelfUseMode || isDemoSiteMode) && !isLoading && (
        <span
          className='whitespace-nowrap ml-2 hidden md:inline-flex'
          style={{
            alignItems: 'center',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            padding: '0 6px',
            lineHeight: '20px',
            fontWeight: 500,
            color: isSelfUseMode ? '#AF52DE' : 'var(--accent)',
            background: isSelfUseMode ? 'rgba(175, 82, 222, 0.12)' : 'var(--accent-light)',
          }}
        >
          {isSelfUseMode ? t('自用模式') : t('演示站点')}
        </span>
      )}
    </Link>
  );
};

export default HeaderLogo;
