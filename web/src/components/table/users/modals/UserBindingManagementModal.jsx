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
import { useTranslation } from 'react-i18next';
import {
  API,
  showError,
  showSuccess,
  getOAuthProviderIcon,
} from '../../../../helpers';
import {
  Modal,
  Checkbox,
  Button,
} from '@douyinfe/semi-ui';
import {
  IconLink,
  IconMail,
  IconDelete,
  IconGithubLogo,
} from '@douyinfe/semi-icons';
import { SiDiscord, SiTelegram, SiWechat, SiLinux } from 'react-icons/si';
import MacSpinner from '../../../common/ui/MacSpinner';

const UserBindingManagementModal = ({
  visible,
  onCancel,
  userId,
  isMobile,
  formApiRef,
}) => {
  const { t } = useTranslation();
  const [bindingLoading, setBindingLoading] = React.useState(false);
  const [showBoundOnly, setShowBoundOnly] = React.useState(true);
  const [statusInfo, setStatusInfo] = React.useState({});
  const [customOAuthBindings, setCustomOAuthBindings] = React.useState([]);
  const [builtInBindings, setBuiltInBindings] = React.useState({});
  const [bindingActionLoading, setBindingActionLoading] = React.useState({});

  const loadBindingData = React.useCallback(async () => {
    if (!userId) return;

    setBindingLoading(true);
    try {
      const [statusRes, customBindingRes, userRes] = await Promise.all([
        API.get('/api/status'),
        API.get(`/api/user/${userId}/oauth/bindings`),
        API.get(`/api/user/${userId}`),
      ]);

      if (statusRes.data?.success) {
        setStatusInfo(statusRes.data.data || {});
      } else {
        showError(statusRes.data?.message || t('操作失败'));
      }

      if (customBindingRes.data?.success) {
        setCustomOAuthBindings(customBindingRes.data.data || []);
      } else {
        showError(customBindingRes.data?.message || t('操作失败'));
      }

      if (userRes.data?.success) {
        const userData = userRes.data.data || {};
        setBuiltInBindings({
          email: userData.email || '',
          github_id: userData.github_id || '',
          discord_id: userData.discord_id || '',
          oidc_id: userData.oidc_id || '',
          wechat_id: userData.wechat_id || '',
          telegram_id: userData.telegram_id || '',
          linux_do_id: userData.linux_do_id || '',
        });
      } else {
        showError(userRes.data?.message || t('操作失败'));
      }
    } catch (error) {
      showError(
        error.response?.data?.message || error.message || t('操作失败'),
      );
    } finally {
      setBindingLoading(false);
    }
  }, [t, userId]);

  React.useEffect(() => {
    if (!visible) return;
    setShowBoundOnly(true);
    setBindingActionLoading({});
    loadBindingData();
  }, [visible, loadBindingData]);

  const setBindingLoadingState = (key, value) => {
    setBindingActionLoading((prev) => ({ ...prev, [key]: value }));
  };

  const handleUnbindBuiltInAccount = (bindingItem) => {
    if (!userId) return;

    Modal.confirm({
      title: t('确认解绑'),
      content: t('确定要解绑 {{name}} 吗？', { name: bindingItem.name }),
      okText: t('确认'),
      cancelText: t('取消'),
      onOk: async () => {
        const loadingKey = `builtin-${bindingItem.key}`;
        setBindingLoadingState(loadingKey, true);
        try {
          const res = await API.delete(
            `/api/user/${userId}/bindings/${bindingItem.key}`,
          );
          if (!res.data?.success) {
            showError(res.data?.message || t('操作失败'));
            return;
          }
          setBuiltInBindings((prev) => ({
            ...prev,
            [bindingItem.field]: '',
          }));
          formApiRef.current?.setValue(bindingItem.field, '');
          showSuccess(t('解绑成功'));
        } catch (error) {
          showError(
            error.response?.data?.message || error.message || t('操作失败'),
          );
        } finally {
          setBindingLoadingState(loadingKey, false);
        }
      },
    });
  };

  const handleUnbindCustomOAuthAccount = (provider) => {
    if (!userId) return;

    Modal.confirm({
      title: t('确认解绑'),
      content: t('确定要解绑 {{name}} 吗？', { name: provider.name }),
      okText: t('确认'),
      cancelText: t('取消'),
      onOk: async () => {
        const loadingKey = `custom-${provider.id}`;
        setBindingLoadingState(loadingKey, true);
        try {
          const res = await API.delete(
            `/api/user/${userId}/oauth/bindings/${provider.id}`,
          );
          if (!res.data?.success) {
            showError(res.data?.message || t('操作失败'));
            return;
          }
          setCustomOAuthBindings((prev) =>
            prev.filter(
              (item) => Number(item.provider_id) !== Number(provider.id),
            ),
          );
          showSuccess(t('解绑成功'));
        } catch (error) {
          showError(
            error.response?.data?.message || error.message || t('操作失败'),
          );
        } finally {
          setBindingLoadingState(loadingKey, false);
        }
      },
    });
  };

  const currentValues = formApiRef.current?.getValues?.() || {};
  const getBuiltInBindingValue = (field) =>
    builtInBindings[field] || currentValues[field] || '';

  const builtInBindingItems = [
    {
      key: 'email',
      field: 'email',
      name: t('邮箱'),
      enabled: true,
      value: getBuiltInBindingValue('email'),
      icon: (
        <IconMail
          size='default'
          style={{ color: 'var(--text-secondary)' }}
        />
      ),
    },
    {
      key: 'github',
      field: 'github_id',
      name: 'GitHub',
      enabled: Boolean(statusInfo.github_oauth),
      value: getBuiltInBindingValue('github_id'),
      icon: (
        <IconGithubLogo
          size='default'
          style={{ color: 'var(--text-secondary)' }}
        />
      ),
    },
    {
      key: 'discord',
      field: 'discord_id',
      name: 'Discord',
      enabled: Boolean(statusInfo.discord_oauth),
      value: getBuiltInBindingValue('discord_id'),
      icon: (
        <SiDiscord size={20} style={{ color: 'var(--text-secondary)' }} />
      ),
    },
    {
      key: 'oidc',
      field: 'oidc_id',
      name: 'OIDC',
      enabled: Boolean(statusInfo.oidc_enabled),
      value: getBuiltInBindingValue('oidc_id'),
      icon: (
        <IconLink
          size='default'
          style={{ color: 'var(--text-secondary)' }}
        />
      ),
    },
    {
      key: 'wechat',
      field: 'wechat_id',
      name: t('微信'),
      enabled: Boolean(statusInfo.wechat_login),
      value: getBuiltInBindingValue('wechat_id'),
      icon: (
        <SiWechat size={20} style={{ color: 'var(--text-secondary)' }} />
      ),
    },
    {
      key: 'telegram',
      field: 'telegram_id',
      name: 'Telegram',
      enabled: Boolean(statusInfo.telegram_oauth),
      value: getBuiltInBindingValue('telegram_id'),
      icon: (
        <SiTelegram size={20} style={{ color: 'var(--text-secondary)' }} />
      ),
    },
    {
      key: 'linuxdo',
      field: 'linux_do_id',
      name: 'LinuxDO',
      enabled: Boolean(statusInfo.linuxdo_oauth),
      value: getBuiltInBindingValue('linux_do_id'),
      icon: (
        <SiLinux size={20} style={{ color: 'var(--text-secondary)' }} />
      ),
    },
  ];

  const customBindingMap = new Map(
    customOAuthBindings.map((item) => [Number(item.provider_id), item]),
  );

  const customProviderMap = new Map(
    (statusInfo.custom_oauth_providers || []).map((provider) => [
      Number(provider.id),
      provider,
    ]),
  );

  customOAuthBindings.forEach((binding) => {
    if (!customProviderMap.has(Number(binding.provider_id))) {
      customProviderMap.set(Number(binding.provider_id), {
        id: binding.provider_id,
        name: binding.provider_name,
        icon: binding.provider_icon,
      });
    }
  });

  const customBindingItems = Array.from(customProviderMap.values()).map(
    (provider) => {
      const binding = customBindingMap.get(Number(provider.id));
      return {
        key: `custom-${provider.id}`,
        providerId: provider.id,
        name: provider.name,
        enabled: true,
        value: binding?.provider_user_id || '',
        icon: getOAuthProviderIcon(
          provider.icon || binding?.provider_icon || '',
          20,
        ),
      };
    },
  );

  const allBindingItems = [
    ...builtInBindingItems.map((item) => ({ ...item, type: 'builtin' })),
    ...customBindingItems.map((item) => ({ ...item, type: 'custom' })),
  ];

  const boundCount = allBindingItems.filter((item) =>
    Boolean(item.value),
  ).length;

  const visibleBindingItems = showBoundOnly
    ? allBindingItems.filter((item) => Boolean(item.value))
    : allBindingItems;

  return (
    <Modal
      centered
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={isMobile ? '100%' : 760}
      title={
        <div className='flex items-center gap-2'>
          <span
            className='w-6 h-6 flex items-center justify-center'
            style={{ borderRadius: 'var(--radius-sm)', background: 'rgba(175, 82, 222, 0.12)', color: 'var(--info)' }}
          >
            <IconLink size={14} />
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('账户绑定管理')}
          </span>
        </div>
      }
    >
      <MacSpinner spinning={bindingLoading}>
        <div className='max-h-[68vh] overflow-y-auto pr-1 pb-2'>
          <div className='flex items-center justify-between mb-4 gap-3 flex-wrap'>
            <Checkbox
              checked={showBoundOnly}
              onChange={(e) => setShowBoundOnly(Boolean(e.target.checked))}
            >
              {t('仅显示已绑定')}
            </Checkbox>
            <span
              className='text-xs px-2 py-0.5'
              style={{
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-active)',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {boundCount} / {allBindingItems.length}
            </span>
          </div>

          {visibleBindingItems.length === 0 ? (
            <div
              className='rounded-[var(--radius-lg)] p-6 text-center'
              style={{ border: '1px dashed var(--border-default)', color: 'var(--text-muted)' }}
            >
              {t('暂无已绑定项')}
            </div>
          ) : (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
              {visibleBindingItems.map((item, index) => {
                const isBound = Boolean(item.value);
                const loadingKey =
                  item.type === 'builtin'
                    ? `builtin-${item.key}`
                    : `custom-${item.providerId}`;
                const statusText = isBound
                  ? item.value
                  : item.enabled
                    ? t('未绑定')
                    : t('未启用');
                const shouldSpanTwoColsOnDesktop =
                  visibleBindingItems.length % 2 === 1 &&
                  index === visibleBindingItems.length - 1;

                return (
                  <div
                    key={item.key}
                    className={`rounded-[var(--radius-lg)] p-4 ${shouldSpanTwoColsOnDesktop ? 'lg:col-span-2' : ''}`}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div className='flex items-center justify-between gap-3 min-h-[52px]'>
                      <div className='flex items-center gap-3 flex-1 min-w-0'>
                        <div
                          className='w-9 h-9 flex items-center justify-center flex-shrink-0'
                          style={{
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--surface-active)',
                          }}
                        >
                          {item.icon}
                        </div>
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-center gap-2' style={{ color: 'var(--text-primary)' }}>
                            <span className='text-sm font-medium'>{item.name}</span>
                            <span
                              className='text-[10px] px-1.5 py-0.5'
                              style={{
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--surface-active)',
                                color: 'var(--text-muted)',
                              }}
                            >
                              {item.type === 'builtin' ? t('内置') : t('自定义')}
                            </span>
                          </div>
                          <div
                            className='text-xs truncate mt-0.5'
                            style={{ color: isBound ? 'var(--text-secondary)' : 'var(--text-muted)', fontFamily: isBound ? 'var(--font-mono)' : 'inherit' }}
                          >
                            {statusText}
                          </div>
                        </div>
                      </div>
                      <Button
                        theme='borderless'
                        icon={<IconDelete />}
                        size='small'
                        disabled={!isBound}
                        loading={Boolean(bindingActionLoading[loadingKey])}
                        onClick={() => {
                          if (item.type === 'builtin') {
                            handleUnbindBuiltInAccount(item);
                            return;
                          }
                          handleUnbindCustomOAuthAccount({
                            id: item.providerId,
                            name: item.name,
                          });
                        }}
                        style={{
                          color: isBound ? 'var(--error)' : 'var(--text-muted)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        {t('解绑')}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </MacSpinner>
    </Modal>
  );
};

export default UserBindingManagementModal;
