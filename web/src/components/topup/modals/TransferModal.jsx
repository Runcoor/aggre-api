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
import { Modal, Input, InputNumber } from '@douyinfe/semi-ui';
import { CreditCard } from 'lucide-react';

const TransferModal = ({
  t,
  openTransfer,
  transfer,
  handleTransferCancel,
  userState,
  renderQuota,
  getQuotaPerUnit,
  transferAmount,
  setTransferAmount,
}) => {
  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <span className='w-6 h-6 flex items-center justify-center' style={{ borderRadius: 'var(--radius-sm)', background: 'var(--accent-light)', color: 'var(--accent)' }}>
            <CreditCard size={14} />
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('划转邀请额度')}
          </span>
        </div>
      }
      visible={openTransfer}
      onOk={transfer}
      onCancel={handleTransferCancel}
      maskClosable={false}
      centered
      okButtonProps={{ style: { background: 'var(--accent-gradient)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)' } }}
      cancelButtonProps={{ style: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' } }}
    >
      <div className='space-y-4'>
        <div>
          <span className='block mb-2 text-sm font-medium' style={{ color: 'var(--text-primary)' }}>
            {t('可用邀请收益')}
          </span>
          <Input
            value={renderQuota(userState?.user?.aff_quota)}
            disabled
            className='!rounded-lg'
          />
        </div>
        <div>
          <span className='block mb-2 text-sm font-medium' style={{ color: 'var(--text-primary)' }}>
            {t('划转金额')} · <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t('最低 $1.00')}</span>
          </span>
          <InputNumber
            min={1}
            max={(userState?.user?.aff_quota || 0) / getQuotaPerUnit()}
            value={transferAmount / getQuotaPerUnit()}
            precision={2}
            step={1}
            prefix='$'
            onChange={(value) =>
              setTransferAmount(Math.round((value || 0) * getQuotaPerUnit()))
            }
            className='w-full !rounded-lg'
          />
        </div>
      </div>
    </Modal>
  );
};

export default TransferModal;
