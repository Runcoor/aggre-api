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
import { Modal, Button, Checkbox } from '@douyinfe/semi-ui';
import { getTaskLogsColumns } from '../TaskLogsColumnDefs';

const ColumnSelectorModal = ({
  showColumnSelector,
  setShowColumnSelector,
  visibleColumns,
  handleColumnVisibilityChange,
  handleSelectAll,
  initDefaultColumns,
  COLUMN_KEYS,
  isAdminUser,
  copyText,
  openContentModal,
  t,
}) => {
  // Get all columns for display in selector
  const allColumns = getTaskLogsColumns({
    t,
    COLUMN_KEYS,
    copyText,
    openContentModal,
    isAdminUser,
  });

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
            <Button type='tertiary' onClick={() => setShowColumnSelector(false)}>
              {t('取消')}
            </Button>
            <Button type='primary' theme='solid' onClick={() => setShowColumnSelector(false)}>
              {t('确定')}
            </Button>
          </div>
        </div>
      }
    >
      <div className='flex items-center justify-between mb-3 px-1'>
        <Checkbox
          checked={Object.values(visibleColumns).every((v) => v === true)}
          indeterminate={
            Object.values(visibleColumns).some((v) => v === true) &&
            !Object.values(visibleColumns).every((v) => v === true)
          }
          onChange={(e) => handleSelectAll(e.target.checked)}
        >
          <span className='text-sm font-medium' style={{ color: 'var(--text-primary)' }}>
            {t('全选')}
          </span>
        </Checkbox>
      </div>
      <div
        className='flex flex-wrap max-h-96 overflow-y-auto p-4'
        style={{
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          background: 'var(--bg-subtle)',
        }}
      >
        {allColumns.map((column) => {
          // Skip admin-only columns for non-admin users
          if (!isAdminUser && column.key === COLUMN_KEYS.CHANNEL) {
            return null;
          }

          return (
            <div key={column.key} className='w-1/2 mb-4 pr-2'>
              <Checkbox
                checked={!!visibleColumns[column.key]}
                onChange={(e) =>
                  handleColumnVisibilityChange(column.key, e.target.checked)
                }
              >
                {column.title}
              </Checkbox>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default ColumnSelectorModal;
