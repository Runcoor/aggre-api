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
import { RadioGroup, Radio } from '@douyinfe/semi-ui';

/**
 * 使用模式选择 — macOS option cards
 */
const UsageModeStep = ({
  formData,
  handleUsageModeChange,
  renderNavigationButtons,
  t,
}) => {
  return (
    <>
      <p
        className='text-sm mb-3'
        style={{ color: 'var(--text-secondary)' }}
      >
        {t('选择系统运行模式')}
      </p>
      <RadioGroup
        value={formData.usageMode}
        onChange={handleUsageModeChange}
        type='card'
        direction='vertical'
        className='w-full'
        aria-label='使用模式选择'
        name='usage-mode-selection'
      >
        <Radio
          value='external'
          extra={
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              {t('适用于为多个用户提供服务的场景')}
            </span>
          }
          style={{ width: '100%', marginBottom: '8px' }}
        >
          {t('对外运营模式')}
        </Radio>
        <Radio
          value='self'
          extra={
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              {t('适用于个人使用的场景，不需要设置模型价格')}
            </span>
          }
          style={{ width: '100%', marginBottom: '8px' }}
        >
          {t('自用模式')}
        </Radio>
        <Radio
          value='demo'
          extra={
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              {t('适用于展示系统功能的场景，提供基础功能演示')}
            </span>
          }
          style={{ width: '100%' }}
        >
          {t('演示站点模式')}
        </Radio>
      </RadioGroup>
      {renderNavigationButtons && renderNavigationButtons()}
    </>
  );
};

export default UsageModeStep;
