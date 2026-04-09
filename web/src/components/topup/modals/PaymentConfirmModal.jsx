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
import { Modal, Skeleton } from '@douyinfe/semi-ui';
import { SiAlipay, SiWechat, SiStripe } from 'react-icons/si';
import { CreditCard } from 'lucide-react';

const PaymentConfirmModal = ({
  t,
  open,
  onlineTopUp,
  handleCancel,
  confirmLoading,
  topUpCount,
  renderQuotaWithAmount,
  amountLoading,
  renderAmount,
  payWay,
  payMethods,
  // 新增：用于显示折扣明细
  amountNumber,
  discountRate,
}) => {
  const hasDiscount =
    discountRate && discountRate > 0 && discountRate < 1 && amountNumber > 0;
  const originalAmount = hasDiscount ? amountNumber / discountRate : 0;
  const discountAmount = hasDiscount ? originalAmount - amountNumber : 0;
  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <span className='w-6 h-6 flex items-center justify-center' style={{ borderRadius: 'var(--radius-sm)', background: 'var(--accent-light)', color: 'var(--accent)' }}>
            <CreditCard size={14} />
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('充值确认')}
          </span>
        </div>
      }
      visible={open}
      onOk={onlineTopUp}
      onCancel={handleCancel}
      maskClosable={false}
      size='small'
      centered
      confirmLoading={confirmLoading}
      okButtonProps={{ style: { background: 'var(--accent-gradient)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)' } }}
      cancelButtonProps={{ style: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' } }}
    >
      <div
        className='rounded-[var(--radius-lg)] p-4'
        style={{
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div className='space-y-3'>
          <div className='flex justify-between items-center'>
            <span className='text-sm font-medium' style={{ color: 'var(--text-secondary)' }}>
              {t('充值数量')}
            </span>
            <span className='text-sm' style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {renderQuotaWithAmount(topUpCount)}
            </span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-sm font-medium' style={{ color: 'var(--text-secondary)' }}>
              {t('实付金额')}
            </span>
            {amountLoading ? (
              <Skeleton.Title style={{ width: '60px', height: '16px' }} />
            ) : (
              <div className='flex items-baseline gap-2'>
                <span className='text-sm font-bold' style={{ color: 'var(--error)', fontFamily: 'var(--font-mono)' }}>
                  {renderAmount()}
                </span>
                {hasDiscount && (
                  <span className='text-xs font-medium' style={{ color: 'var(--error)' }}>
                    {Math.round(discountRate * 100)}%
                  </span>
                )}
              </div>
            )}
          </div>
          {hasDiscount && !amountLoading && (
            <>
              <div className='flex justify-between items-center'>
                <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                  {t('原价')}
                </span>
                <span className='text-xs line-through' style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {`${originalAmount.toFixed(2)} ${t('元')}`}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                  {t('优惠')}
                </span>
                <span className='text-xs font-medium' style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
                  {`- ${discountAmount.toFixed(2)} ${t('元')}`}
                </span>
              </div>
            </>
          )}
          <div className='flex justify-between items-center'>
            <span className='text-sm font-medium' style={{ color: 'var(--text-secondary)' }}>
              {t('支付方式')}
            </span>
            <div className='flex items-center'>
              {(() => {
                const payMethod = payMethods.find(
                  (method) => method.type === payWay,
                );
                if (payMethod) {
                  return (
                    <>
                      {payMethod.type === 'alipay' ? (
                        <SiAlipay className='mr-2' size={16} color='#1677FF' />
                      ) : payMethod.type === 'wxpay' ? (
                        <SiWechat className='mr-2' size={16} color='#07C160' />
                      ) : payMethod.type === 'stripe' ? (
                        <SiStripe className='mr-2' size={16} color='#635BFF' />
                      ) : (
                        <CreditCard
                          className='mr-2'
                          size={16}
                          color={payMethod.color || 'var(--text-muted)'}
                        />
                      )}
                      <span className='text-sm' style={{ color: 'var(--text-primary)' }}>
                        {payMethod.name}
                      </span>
                    </>
                  );
                } else {
                  if (payWay === 'alipay') {
                    return (
                      <>
                        <SiAlipay className='mr-2' size={16} color='#1677FF' />
                        <span className='text-sm' style={{ color: 'var(--text-primary)' }}>{t('支付宝')}</span>
                      </>
                    );
                  } else if (payWay === 'stripe') {
                    return (
                      <>
                        <SiStripe className='mr-2' size={16} color='#635BFF' />
                        <span className='text-sm' style={{ color: 'var(--text-primary)' }}>Stripe</span>
                      </>
                    );
                  } else {
                    return (
                      <>
                        <SiWechat className='mr-2' size={16} color='#07C160' />
                        <span className='text-sm' style={{ color: 'var(--text-primary)' }}>{t('微信')}</span>
                      </>
                    );
                  }
                }
              })()}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentConfirmModal;
