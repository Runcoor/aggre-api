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
import { Button } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Forbidden = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div
      className='flex items-center justify-center min-h-screen px-4'
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        className='text-center max-w-md w-full px-8 py-12'
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Large error code — serif, muted */}
        <h1
          className='text-7xl font-semibold leading-none mb-2'
          style={{
            fontFamily: 'var(--font-serif)',
            color: 'var(--text-muted)',
          }}
        >
          403
        </h1>

        {/* Title */}
        <h2
          className='text-lg font-semibold mb-2'
          style={{
            fontFamily: 'var(--font-serif)',
            color: 'var(--text-primary)',
          }}
        >
          {t('访问被拒绝')}
        </h2>

        {/* Description */}
        <p
          className='text-sm mb-8'
          style={{ color: 'var(--text-secondary)' }}
        >
          {t('您无权访问此页面，请联系管理员')}
        </p>

        {/* Action buttons */}
        <div className='flex items-center justify-center gap-3'>
          <Button
            onClick={() => navigate(-1)}
            style={{
              background: 'var(--surface-active)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              height: '36px',
              padding: '0 20px',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'opacity 150ms ease-out',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {t('返回上页')}
          </Button>
          <Button
            theme='solid'
            onClick={() => navigate('/')}
            style={{
              background: 'var(--accent-gradient)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              height: '36px',
              padding: '0 20px',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'opacity 150ms ease-out',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {t('返回首页')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
