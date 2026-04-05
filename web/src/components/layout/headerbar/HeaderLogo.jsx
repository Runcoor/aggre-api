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
import { Typography, Tag } from '@douyinfe/semi-ui';
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
      className='flex items-center gap-2.5'
      style={{ textDecoration: 'none' }}
    >
      <div
        className='relative flex-shrink-0'
        style={{ width: '28px', height: '28px' }}
      >
        <SkeletonWrapper loading={isLoading || !logoLoaded} type='image' />
        <img
          src={logo}
          alt='logo'
          className={`absolute inset-0 w-full h-full transition-opacity duration-150 ${!isLoading && logoLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ borderRadius: 'var(--radius-sm)', objectFit: 'contain' }}
        />
      </div>
      <div className='hidden md:flex items-center gap-2'>
        <SkeletonWrapper
          loading={isLoading}
          type='title'
          width={120}
          height={24}
        >
          <span
            className='text-base font-semibold'
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-serif)',
              letterSpacing: '-0.01em',
            }}
          >
            {systemName}
          </span>
        </SkeletonWrapper>
        {(isSelfUseMode || isDemoSiteMode) && !isLoading && (
          <Tag
            color={isSelfUseMode ? 'purple' : 'blue'}
            size='small'
            className='whitespace-nowrap'
            style={{
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              padding: '0 6px',
              lineHeight: '20px',
            }}
          >
            {isSelfUseMode ? t('自用模式') : t('演示站点')}
          </Tag>
        )}
      </div>
    </Link>
  );
};

export default HeaderLogo;
