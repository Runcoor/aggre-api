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

import React, { useMemo } from 'react';
import { Modal, Button, Checkbox } from '@douyinfe/semi-ui';

const ColumnSelectorModal = ({
  visible,
  onCancel,
  visibleColumns,
  onVisibleColumnsChange,
  columnKeys,
  t,
}) => {
  const columnOptions = useMemo(
    () => [
      { key: columnKeys.container_name, label: t('容器名称'), required: true },
      { key: columnKeys.status, label: t('状态') },
      { key: columnKeys.time_remaining, label: t('剩余时间') },
      { key: columnKeys.hardware_info, label: t('硬件配置') },
      { key: columnKeys.created_at, label: t('创建时间') },
      { key: columnKeys.actions, label: t('操作'), required: true },
    ],
    [columnKeys, t],
  );

  const handleColumnVisibilityChange = (key, checked) => {
    const column = columnOptions.find((option) => option.key === key);
    if (column?.required) return;
    onVisibleColumnsChange({
      ...visibleColumns,
      [key]: checked,
    });
  };

  const handleSelectAll = (checked) => {
    const updated = { ...visibleColumns };
    columnOptions.forEach(({ key, required }) => {
      updated[key] = required ? true : checked;
    });
    onVisibleColumnsChange(updated);
  };

  const handleReset = () => {
    const defaults = columnOptions.reduce((acc, { key }) => {
      acc[key] = true;
      return acc;
    }, {});
    onVisibleColumnsChange({
      ...visibleColumns,
      ...defaults,
    });
  };

  const allSelected = columnOptions.every(
    ({ key, required }) => required || visibleColumns[key],
  );
  const indeterminate =
    columnOptions.some(
      ({ key, required }) => !required && visibleColumns[key],
    ) && !allSelected;

  const handleConfirm = () => onCancel();

  return (
    <Modal
      title={
        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600 }}>
          {t('列设置')}
        </span>
      }
      visible={visible}
      onCancel={onCancel}
      centered
      footer={
        <div className='flex items-center justify-between'>
          <Button
            type='tertiary'
            theme='borderless'
            size='small'
            onClick={handleReset}
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('重置')}
          </Button>
          <div className='flex gap-2'>
            <Button type='tertiary' onClick={onCancel}>{t('取消')}</Button>
            <Button type='primary' theme='solid' onClick={handleConfirm}>
              {t('确定')}
            </Button>
          </div>
        </div>
      }
    >
      <div className='flex items-center justify-between mb-3 px-1'>
        <Checkbox
          checked={allSelected}
          indeterminate={indeterminate}
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
        {columnOptions.map(({ key, label, required }) => (
          <div key={key} className='w-1/2 mb-4 pr-2'>
            <Checkbox
              checked={!!visibleColumns[key]}
              disabled={required}
              onChange={(e) =>
                handleColumnVisibilityChange(key, e.target.checked)
              }
            >
              {label}
            </Checkbox>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default ColumnSelectorModal;
