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
import { CheckCircle } from 'lucide-react';

/**
 * 完成步骤组件 — macOS Setup Summary
 */
const CompleteStep = ({
  setupStatus,
  formData,
  renderNavigationButtons,
  t,
}) => {
  const summaryItems = [
    {
      label: t('数据库类型'),
      value:
        setupStatus.database_type === 'sqlite'
          ? 'SQLite'
          : setupStatus.database_type === 'mysql'
            ? 'MySQL'
            : 'PostgreSQL',
    },
    {
      label: t('管理员账号'),
      value: setupStatus.root_init
        ? t('已初始化')
        : formData.username || t('未设置'),
    },
    {
      label: t('使用模式'),
      value:
        formData.usageMode === 'external'
          ? t('对外运营模式')
          : formData.usageMode === 'self'
            ? t('自用模式')
            : t('演示站点模式'),
    },
  ];

  return (
    <div className='text-center'>
      {/* Success icon */}
      <div
        className='mx-auto mb-3 flex items-center justify-center'
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'var(--success)',
          opacity: 0.9,
        }}
      >
        <CheckCircle size={24} color='#fff' />
      </div>

      {/* Heading — serif */}
      <h2
        className='text-lg font-semibold mb-1'
        style={{
          fontFamily: 'var(--font-serif)',
          color: 'var(--text-primary)',
        }}
      >
        {t('准备完成初始化')}
      </h2>
      <p
        className='text-sm mb-5'
        style={{ color: 'var(--text-secondary)' }}
      >
        {t('请确认以下设置信息，点击"初始化系统"开始配置')}
      </p>

      {/* macOS-style summary card */}
      <div
        className='rounded-[var(--radius-md)] text-left'
        style={{
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}
      >
        {summaryItems.map((item, index) => (
          <div
            key={item.label}
            className='flex justify-between items-center px-4 py-3'
            style={{
              borderBottom:
                index < summaryItems.length - 1
                  ? '1px solid var(--border-subtle)'
                  : 'none',
            }}
          >
            <span
              className='text-sm'
              style={{ color: 'var(--text-secondary)' }}
            >
              {item.label}
            </span>
            <span
              className='text-sm font-medium'
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {renderNavigationButtons && renderNavigationButtons()}
    </div>
  );
};

export default CompleteStep;
