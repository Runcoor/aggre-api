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
import { Avatar } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

const roleMap = {
  1: { label: '普通用户', color: 'var(--text-muted)', bg: 'var(--surface-active)' },
  10: { label: '管理员', color: 'var(--accent)', bg: 'rgba(0,122,255,0.12)' },
  100: { label: '超级管理员', color: 'var(--warning)', bg: 'rgba(255,149,0,0.12)' },
};

function statusStyle(user, t) {
  // gorm.DeletedAt marshals to null when not deleted; truthy means deleted.
  if (user.DeletedAt) {
    return { label: t('已注销'), color: 'var(--error)', bg: 'rgba(255,59,48,0.12)' };
  }
  if (user.status === 2) {
    return { label: t('已禁用'), color: 'var(--error)', bg: 'rgba(255,59,48,0.12)' };
  }
  return { label: t('已启用'), color: 'var(--success)', bg: 'rgba(52,199,89,0.12)' };
}

const Pill = ({ color, bg, children }) => (
  <span
    className='inline-flex items-center text-xs px-2 py-0.5 font-medium'
    style={{ borderRadius: 'var(--radius-sm)', background: bg, color }}
  >
    {children}
  </span>
);

const IdentityCard = ({ user }) => {
  const { t } = useTranslation();
  if (!user) return null;
  const role = roleMap[user.role] || roleMap[1];
  const status = statusStyle(user, t);
  return (
    <div
      style={{
        padding: 16,
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
      }}
    >
      <Avatar size='large' color='blue'>
        {(user.username || '?').slice(0, 1).toUpperCase()}
      </Avatar>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>{user.username}</span>
          <Pill color={role.color} bg={role.bg}>{t(role.label)}</Pill>
          <Pill color={status.color} bg={status.bg}>{status.label}</Pill>
          {user.group ? (
            <Pill color='var(--text-secondary)' bg='var(--surface-active)'>
              {t('分组')}: {user.group}
            </Pill>
          ) : null}
        </div>
        <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
          {user.display_name ? <span>{user.display_name} · </span> : null}
          {user.email ? <span>{user.email} · </span> : null}
          <span>ID: {user.id}</span>
        </div>
        {user.remark ? (
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
            {t('备注')}: {user.remark}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default IdentityCard;
