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
import { Modal } from '@douyinfe/semi-ui';
import { IconDelete } from '@douyinfe/semi-icons';

const DeleteUserModal = ({
  visible,
  onCancel,
  onConfirm,
  user,
  users,
  activePage,
  refresh,
  manageUser,
  t,
}) => {
  const handleConfirm = async () => {
    await manageUser(user.id, 'delete', user);
    await refresh();
    setTimeout(() => {
      if (users.length === 0 && activePage > 1) {
        refresh(activePage - 1);
      }
    }, 100);
    onCancel(); // Close modal after success
  };

  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <span
            className='w-6 h-6 flex items-center justify-center'
            style={{
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 59, 48, 0.12)',
              color: 'var(--error)',
            }}
          >
            <IconDelete size={14} />
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('确定是否要注销此用户？')}
          </span>
        </div>
      }
      visible={visible}
      onCancel={onCancel}
      onOk={handleConfirm}
      okButtonProps={{
        style: {
          background: 'var(--error)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius-md)',
        },
      }}
      cancelButtonProps={{
        style: {
          borderRadius: 'var(--radius-md)',
          background: 'var(--surface-active)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
        },
      }}
    >
      <p className='text-sm m-0' style={{ color: 'var(--text-secondary)' }}>
        {t('相当于删除用户，此修改将不可逆')}
      </p>
    </Modal>
  );
};

export default DeleteUserModal;
