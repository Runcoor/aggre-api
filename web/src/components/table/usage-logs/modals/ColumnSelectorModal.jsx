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
import { Modal, Button, Checkbox, RadioGroup, Radio } from '@douyinfe/semi-ui';
import { getLogsColumns } from '../UsageLogsColumnDefs';

const ColumnSelectorModal = ({
  showColumnSelector,
  setShowColumnSelector,
  visibleColumns,
  handleColumnVisibilityChange,
  handleSelectAll,
  initDefaultColumns,
  billingDisplayMode,
  setBillingDisplayMode,
  COLUMN_KEYS,
  isAdminUser,
  copyText,
  showUserInfoFunc,
  t,
}) => {
  const handleBillingDisplayModeChange = (eventOrValue) => {
    setBillingDisplayMode(eventOrValue?.target?.value ?? eventOrValue);
  };

  const isTokensDisplay =
    typeof localStorage !== 'undefined' &&
    localStorage.getItem('quota_display_type') === 'TOKENS';

  // Get all columns for display in selector
  const allColumns = getLogsColumns({
    t,
    COLUMN_KEYS,
    copyText,
    showUserInfoFunc,
    isAdminUser,
    billingDisplayMode,
  });

  const displayColumns = allColumns.filter((column) => {
    if (
      !isAdminUser &&
      (column.key === COLUMN_KEYS.CHANNEL ||
        column.key === COLUMN_KEYS.USERNAME ||
        column.key === COLUMN_KEYS.RETRY)
    ) {
      return false;
    }
    return true;
  });

  const allChecked = Object.values(visibleColumns).every((v) => v === true);
  const someChecked = Object.values(visibleColumns).some((v) => v === true);

  return (
    <Modal
      title={
        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600 }}>
          {t('列设置')}
        </span>
      }
      visible={showColumnSelector}
      onCancel={() => setShowColumnSelector(false)}
      centered
      footer={
        <div className='flex items-center justify-between'>
          <Button
            type='tertiary'
            theme='borderless'
            size='small'
            onClick={() => initDefaultColumns()}
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('重置')}
          </Button>
          <div className='flex gap-2'>
            <Button
              type='tertiary'
              onClick={() => setShowColumnSelector(false)}
            >
              {t('取消')}
            </Button>
            <Button
              type='primary'
              theme='solid'
              onClick={() => setShowColumnSelector(false)}
            >
              {t('确定')}
            </Button>
          </div>
        </div>
      }
    >
      {/* Billing display mode */}
      <div className='mb-4'>
        <div
          className='text-xs font-medium mb-2'
          style={{
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          {t('计费显示模式')}
        </div>
        <RadioGroup
          type='button'
          value={billingDisplayMode}
          onChange={handleBillingDisplayModeChange}
        >
          <Radio value='price'>
            {isTokensDisplay ? t('价格模式') : t('价格模式（默认）')}
          </Radio>
          <Radio value='ratio'>
            {isTokensDisplay ? t('倍率模式（默认）') : t('倍率模式')}
          </Radio>
        </RadioGroup>
      </div>

      {/* Select all header */}
      <div className='flex items-center justify-between mb-3 px-1'>
        <Checkbox
          checked={allChecked}
          indeterminate={someChecked && !allChecked}
          onChange={(e) => handleSelectAll(e.target.checked)}
        >
          <span className='text-sm font-medium' style={{ color: 'var(--text-primary)' }}>
            {t('全选')}
          </span>
        </Checkbox>
        <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
          {Object.values(visibleColumns).filter(Boolean).length} / {displayColumns.length}
        </span>
      </div>

      {/* Column grid */}
      <div
        className='flex flex-wrap max-h-96 overflow-y-auto p-4'
        style={{
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          background: 'var(--bg-subtle)',
        }}
      >
        {displayColumns.map((column) => (
          <div key={column.key} className='w-1/2 mb-3 pr-2'>
            <Checkbox
              checked={!!visibleColumns[column.key]}
              onChange={(e) =>
                handleColumnVisibilityChange(column.key, e.target.checked)
              }
            >
              <span className='text-sm' style={{ color: 'var(--text-primary)' }}>
                {column.title}
              </span>
            </Checkbox>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default ColumnSelectorModal;
