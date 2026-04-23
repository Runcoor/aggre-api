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

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Empty, Popconfirm, Spin, Tag } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess } from '../../../helpers';

const Row = ({ label, status, action }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      background: 'var(--surface)',
      borderRadius: 'var(--radius-lg)',
      marginBottom: 8,
    }}
  >
    <div>
      <div style={{ fontWeight: 500 }}>{label}</div>
      <div style={{ marginTop: 4 }}>{status}</div>
    </div>
    <div>{action}</div>
  </div>
);

const SecurityTab = ({ userId, security, onChanged }) => {
  const { t } = useTranslation();
  const [bindings, setBindings] = useState([]);
  const [loading, setLoading] = useState(false);

  const refetchBindings = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await API.get(`/api/user/${userId}/oauth/bindings`);
      if (res?.data?.success) {
        setBindings(res.data.data || []);
      } else {
        showError(res?.data?.message || 'failed');
      }
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refetchBindings();
  }, [refetchBindings]);

  const onDisable2FA = async () => {
    try {
      const res = await API.delete(`/api/user/${userId}/2fa`);
      if (res?.data?.success) {
        showSuccess(t('已禁用 2FA'));
        onChanged && onChanged();
      } else {
        showError(res?.data?.message || 'failed');
      }
    } catch (e) {
      showError(e);
    }
  };

  const onResetPasskey = async () => {
    try {
      const res = await API.delete(`/api/user/${userId}/reset_passkey`);
      if (res?.data?.success) {
        showSuccess(t('已重置 Passkey'));
        onChanged && onChanged();
      } else {
        showError(res?.data?.message || 'failed');
      }
    } catch (e) {
      showError(e);
    }
  };

  const onUnbind = async (providerId) => {
    try {
      const res = await API.delete(`/api/user/${userId}/oauth/bindings/${providerId}`);
      if (res?.data?.success) {
        showSuccess(t('已解绑'));
        await refetchBindings();
        onChanged && onChanged();
      } else {
        showError(res?.data?.message || 'failed');
      }
    } catch (e) {
      showError(e);
    }
  };

  return (
    <div style={{ padding: 12 }}>
      <Row
        label={t('两步验证 (2FA)')}
        status={
          security?.two_factor_enabled ? (
            <Tag color='green'>{t('已开启')}</Tag>
          ) : (
            <Tag color='grey'>{t('未开启')}</Tag>
          )
        }
        action={
          security?.two_factor_enabled ? (
            <Popconfirm title={t('确认禁用该用户的 2FA？')} onConfirm={onDisable2FA}>
              <Button type='danger'>{t('禁用 2FA')}</Button>
            </Popconfirm>
          ) : null
        }
      />
      <Row
        label='Passkey'
        status={
          security?.passkey_enabled ? (
            <Tag color='green'>{t('已设置')}</Tag>
          ) : (
            <Tag color='grey'>{t('未设置')}</Tag>
          )
        }
        action={
          security?.passkey_enabled ? (
            <Popconfirm title={t('确认重置该用户的 Passkey？')} onConfirm={onResetPasskey}>
              <Button>{t('重置 Passkey')}</Button>
            </Popconfirm>
          ) : null
        }
      />

      <div
        style={{
          padding: 12,
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ fontWeight: 500, marginBottom: 8 }}>{t('OAuth 绑定')}</div>
        {loading ? (
          <Spin />
        ) : bindings.length === 0 ? (
          <Empty title={t('未绑定任何 OAuth 账号')} />
        ) : (
          bindings.map((b) => (
            <div
              key={b.provider_id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 8,
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <div style={{ fontWeight: 500 }}>{b.provider_name || b.provider_slug}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {b.provider_user_id || ''}
                </div>
              </div>
              <Popconfirm title={t('确认解绑？')} onConfirm={() => onUnbind(b.provider_id)}>
                <Button size='small' type='danger'>{t('解绑')}</Button>
              </Popconfirm>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SecurityTab;
