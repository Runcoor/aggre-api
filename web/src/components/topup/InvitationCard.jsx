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
import { Copy, Users, ArrowUpRight, CheckCircle2 } from 'lucide-react';

const InvitationCard = ({
  t,
  userState,
  renderQuota,
  setOpenTransfer,
  affLink,
  handleAffLinkClick,
}) => {
  return (
    <section className='grid grid-cols-1 md:grid-cols-2 gap-5'>
      {/* 左: 收益统计 */}
      <div
        className='flex flex-col justify-between'
        style={{
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 24px',
          minHeight: 260,
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <h3
            className='text-xl font-extrabold mb-6'
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
          >
            {t('wallet.earningsStats')}
          </h3>
          <div className='grid grid-cols-2 gap-6'>
            <div>
              <p
                className='text-[10px] font-bold uppercase tracking-widest mb-1.5'
                style={{ color: 'var(--text-muted)' }}
              >
                {t('待使用收益')}
              </p>
              <p
                className='text-2xl sm:text-3xl font-extrabold'
                style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}
              >
                {renderQuota(userState?.user?.aff_quota || 0)}
              </p>
            </div>
            <div>
              <p
                className='text-[10px] font-bold uppercase tracking-widest mb-1.5'
                style={{ color: 'var(--text-muted)' }}
              >
                {t('总收益')}
              </p>
              <p
                className='text-2xl sm:text-3xl font-extrabold'
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
              >
                {renderQuota(userState?.user?.aff_history_quota || 0)}
              </p>
            </div>
          </div>
        </div>
        <Button
          theme='light'
          type='tertiary'
          block
          disabled={
            !userState?.user?.aff_quota ||
            userState?.user?.aff_quota <= 0
          }
          onClick={() => setOpenTransfer(true)}
          className='!mt-6 !py-3'
          style={{
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface-active)',
            fontWeight: 700,
          }}
        >
          <ArrowUpRight size={16} className='mr-1.5' />
          {t('wallet.transferToBalance')}
        </Button>
      </div>

      {/* 右: 邀请奖励 */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 24px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
        }}
      >
        <h3
          className='text-xl font-extrabold mb-5'
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
        >
          {t('邀请奖励')}
        </h3>

        <div className='space-y-5'>
          {/* 邀请人数 */}
          <div className='flex items-center gap-3'>
            <span
              className='flex items-center justify-center flex-shrink-0'
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-light)',
              }}
            >
              <Users size={16} style={{ color: 'var(--accent)' }} />
            </span>
            <div>
              <p className='text-xs font-medium' style={{ color: 'var(--text-muted)' }}>{t('邀请人数')}</p>
              <p className='text-lg font-bold' style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {userState?.user?.aff_count || 0}
              </p>
            </div>
          </div>

          {/* 邀请链接 */}
          <div>
            <label
              className='text-[10px] font-bold uppercase tracking-widest mb-2 block'
              style={{ color: 'var(--text-muted)' }}
            >
              {t('wallet.yourReferralLink')}
            </label>
            <div className='flex gap-2'>
              <div
                className='flex-grow px-3 py-2.5 text-xs truncate'
                style={{
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                }}
              >
                {affLink}
              </div>
              <Button
                type='primary'
                theme='solid'
                onClick={handleAffLinkClick}
                icon={<Copy size={14} />}
                style={{
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  flexShrink: 0,
                }}
              />
            </div>
          </div>

          {/* 奖励说明 */}
          <div>
            <label
              className='text-[10px] font-bold uppercase tracking-widest mb-3 block'
              style={{ color: 'var(--text-muted)' }}
            >
              {t('wallet.rewardRules')}
            </label>
            <ul className='space-y-3'>
              <li className='flex items-start gap-2.5'>
                <CheckCircle2 size={16} className='mt-0.5 flex-shrink-0' style={{ color: 'var(--accent)' }} />
                <span className='text-sm leading-snug' style={{ color: 'var(--text-secondary)' }}>
                  {t('邀请好友注册，好友充值后您可获得相应奖励')}
                </span>
              </li>
              <li className='flex items-start gap-2.5'>
                <CheckCircle2 size={16} className='mt-0.5 flex-shrink-0' style={{ color: 'var(--accent)' }} />
                <span className='text-sm leading-snug' style={{ color: 'var(--text-secondary)' }}>
                  {t('通过划转功能将奖励额度转入到您的账户余额中')}
                </span>
              </li>
              <li className='flex items-start gap-2.5'>
                <CheckCircle2 size={16} className='mt-0.5 flex-shrink-0' style={{ color: 'var(--accent)' }} />
                <span className='text-sm leading-snug' style={{ color: 'var(--text-secondary)' }}>
                  {t('邀请的好友越多，获得的奖励越多')}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InvitationCard;
