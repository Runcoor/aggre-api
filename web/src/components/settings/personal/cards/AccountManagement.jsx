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
import TelegramLoginButton from 'react-telegram-login';
import {
  API,
  copy,
  showError,
  showSuccess,
  onGitHubOAuthClicked,
  onOIDCClicked,
  onLinuxDOOAuthClicked,
  onDiscordOAuthClicked,
  onCustomOAuthClicked,
} from '../../../../helpers';
import TwoFASetting from '../components/TwoFASetting';
import { AasIcons as I } from '../_shared/AccountSettingsStyles';

const AccountManagement = ({
  t,
  userState,
  status,
  systemToken,
  setShowEmailBindModal,
  setShowWeChatBindModal,
  generateAccessToken,
  setShowChangePasswordModal,
  setShowAccountDeleteModal,
  passkeyStatus,
  passkeySupported,
  passkeyRegisterLoading,
  passkeyDeleteLoading,
  onPasskeyRegister,
  onPasskeyDelete,
}) => {
  const isBound = (accountId) => Boolean(accountId);
  const [showTelegramBindModal, setShowTelegramBindModal] =
    React.useState(false);
  const [customOAuthBindings, setCustomOAuthBindings] = React.useState([]);
  const [customOAuthLoading, setCustomOAuthLoading] = React.useState({});

  const loadCustomOAuthBindings = async () => {
    try {
      const res = await API.get('/api/user/oauth/bindings');
      if (res.data.success) {
        setCustomOAuthBindings(res.data.data || []);
      }
    } catch (error) {
      // ignore — this endpoint may not be enabled
    }
  };

  const handleUnbindCustomOAuth = (providerId, providerName) => {
    Modal.confirm({
      title: t('确认解绑'),
      content: t('确定要解绑 {{name}} 吗？', { name: providerName }),
      okText: t('确认'),
      cancelText: t('取消'),
      onOk: async () => {
        setCustomOAuthLoading((prev) => ({ ...prev, [providerId]: true }));
        try {
          const res = await API.delete(
            `/api/user/oauth/bindings/${providerId}`,
          );
          if (res.data.success) {
            showSuccess(t('解绑成功'));
            await loadCustomOAuthBindings();
          } else {
            showError(res.data.message);
          }
        } catch (error) {
          showError(
            error.response?.data?.message || error.message || t('操作失败'),
          );
        } finally {
          setCustomOAuthLoading((prev) => ({ ...prev, [providerId]: false }));
        }
      },
    });
  };

  const handleBindCustomOAuth = (provider) => onCustomOAuthClicked(provider);

  const isCustomOAuthBound = (providerId) => {
    const normalizedId = Number(providerId);
    return customOAuthBindings.some(
      (b) => Number(b.provider_id) === normalizedId,
    );
  };

  const getCustomOAuthBinding = (providerId) => {
    const normalizedId = Number(providerId);
    return customOAuthBindings.find(
      (b) => Number(b.provider_id) === normalizedId,
    );
  };

  React.useEffect(() => {
    loadCustomOAuthBindings();
  }, []);

  const passkeyEnabled = passkeyStatus?.enabled;
  const lastUsedLabel = passkeyStatus?.last_used_at
    ? new Date(passkeyStatus.last_used_at).toLocaleString()
    : t('尚未使用');

  // Build the providers list. Each entry produces a single binding card.
  const providerCards = [];

  providerCards.push({
    key: 'email',
    iconKey: 'email',
    icon: <I.Mail size={18} />,
    name: t('邮箱'),
    detail: userState.user?.email || t('未绑定'),
    primary: !!userState.user?.email,
    bound: !!userState.user?.email,
    actionLabel: userState.user?.email ? t('管理') : t('绑定'),
    onClick: () => setShowEmailBindModal(true),
    enabled: true,
  });

  if (status.wechat_login !== undefined) {
    providerCards.push({
      key: 'wechat',
      iconKey: 'wechat',
      icon: <I.WeChat size={18} />,
      name: t('微信'),
      detail:
        userState.user?.wechat_id ||
        (status.wechat_login ? t('未绑定') : t('未启用')),
      bound: isBound(userState.user?.wechat_id),
      actionLabel: isBound(userState.user?.wechat_id)
        ? t('管理')
        : status.wechat_login
          ? t('绑定')
          : t('未启用'),
      onClick: status.wechat_login
        ? () => setShowWeChatBindModal(true)
        : undefined,
      enabled: !!status.wechat_login,
    });
  }

  if (status.github_oauth !== undefined) {
    providerCards.push({
      key: 'github',
      iconKey: 'github',
      icon: <I.GitHub size={18} />,
      name: 'GitHub',
      detail:
        userState.user?.github_id ||
        (status.github_oauth ? t('未绑定') : t('未启用')),
      bound: isBound(userState.user?.github_id),
      actionLabel: isBound(userState.user?.github_id)
        ? t('已绑定')
        : status.github_oauth
          ? t('绑定')
          : t('未启用'),
      onClick:
        !isBound(userState.user?.github_id) && status.github_oauth
          ? () => onGitHubOAuthClicked(status.github_client_id)
          : undefined,
      enabled: !!status.github_oauth && !isBound(userState.user?.github_id),
    });
  }

  if (status.discord_oauth !== undefined) {
    providerCards.push({
      key: 'discord',
      iconKey: 'discord',
      icon: <I.Discord size={18} />,
      name: 'Discord',
      detail:
        userState.user?.discord_id ||
        (status.discord_oauth ? t('未绑定') : t('未启用')),
      bound: isBound(userState.user?.discord_id),
      actionLabel: isBound(userState.user?.discord_id)
        ? t('已绑定')
        : status.discord_oauth
          ? t('绑定')
          : t('未启用'),
      onClick:
        !isBound(userState.user?.discord_id) && status.discord_oauth
          ? () => onDiscordOAuthClicked(status.discord_client_id)
          : undefined,
      enabled: !!status.discord_oauth && !isBound(userState.user?.discord_id),
    });
  }

  if (status.telegram_oauth !== undefined) {
    providerCards.push({
      key: 'telegram',
      iconKey: 'telegram',
      icon: <I.Telegram size={18} />,
      name: 'Telegram',
      detail:
        userState.user?.telegram_id ||
        (status.telegram_oauth ? t('未绑定') : t('未启用')),
      bound: isBound(userState.user?.telegram_id),
      actionLabel: isBound(userState.user?.telegram_id)
        ? t('已绑定')
        : status.telegram_oauth
          ? t('绑定')
          : t('未启用'),
      onClick:
        !isBound(userState.user?.telegram_id) && status.telegram_oauth
          ? () => setShowTelegramBindModal(true)
          : undefined,
      enabled: !!status.telegram_oauth && !isBound(userState.user?.telegram_id),
    });
  }

  if (status.linuxdo_oauth !== undefined) {
    providerCards.push({
      key: 'linuxdo',
      iconKey: 'linuxdo',
      icon: <I.Linux size={18} />,
      name: 'LinuxDO',
      detail:
        userState.user?.linux_do_id ||
        (status.linuxdo_oauth ? t('未绑定') : t('未启用')),
      bound: isBound(userState.user?.linux_do_id),
      actionLabel: isBound(userState.user?.linux_do_id)
        ? t('已绑定')
        : status.linuxdo_oauth
          ? t('绑定')
          : t('未启用'),
      onClick:
        !isBound(userState.user?.linux_do_id) && status.linuxdo_oauth
          ? () => onLinuxDOOAuthClicked(status.linuxdo_client_id)
          : undefined,
      enabled: !!status.linuxdo_oauth && !isBound(userState.user?.linux_do_id),
    });
  }

  if (status.oidc_enabled !== undefined) {
    providerCards.push({
      key: 'oidc',
      iconKey: 'oidc',
      icon: <I.Oidc size={18} />,
      name: 'OIDC',
      detail:
        userState.user?.oidc_id ||
        (status.oidc_enabled ? t('未绑定') : t('未启用')),
      bound: isBound(userState.user?.oidc_id),
      actionLabel: isBound(userState.user?.oidc_id)
        ? t('已绑定')
        : status.oidc_enabled
          ? t('绑定')
          : t('未启用'),
      onClick:
        !isBound(userState.user?.oidc_id) && status.oidc_enabled
          ? () =>
              onOIDCClicked(
                status.oidc_authorization_endpoint,
                status.oidc_client_id,
              )
          : undefined,
      enabled: !!status.oidc_enabled && !isBound(userState.user?.oidc_id),
    });
  }

  if (status.custom_oauth_providers) {
    status.custom_oauth_providers.forEach((provider) => {
      const bound = isCustomOAuthBound(provider.id);
      const binding = getCustomOAuthBinding(provider.id);
      providerCards.push({
        key: `custom_${provider.slug}`,
        iconKey: 'custom',
        icon: <I.Plug size={16} />,
        name: provider.name,
        detail: bound ? binding?.provider_user_id || t('已绑定') : t('未绑定'),
        bound,
        actionLabel: bound ? t('解绑') : t('绑定'),
        onClick: bound
          ? () => handleUnbindCustomOAuth(provider.id, provider.name)
          : () => handleBindCustomOAuth(provider),
        enabled: true,
        loading: customOAuthLoading[provider.id],
        unbindStyle: bound,
      });
    });
  }

  const linkedCount = providerCards.filter((c) => c.bound).length;
  const totalCount = providerCards.length;

  // ---------- security checklist data ----------
  const securityChecklist = [
    {
      id: 'token',
      icon: <I.Key size={14} />,
      title: t('系统访问令牌'),
      desc: systemToken
        ? t('已生成 · 仅本次会话可见')
        : t('用于 API 调用的身份验证令牌 · 尚未生成'),
      done: !!systemToken,
      tag: systemToken
        ? { text: t('已生成'), kind: 'success' }
        : null,
      buttonLabel: systemToken ? t('重新生成') : t('生成令牌'),
      buttonIcon: <I.Refresh size={12} />,
      onClick: generateAccessToken,
      primary: false,
    },
    {
      id: 'password',
      icon: <I.Lock size={14} />,
      title: t('密码管理'),
      desc: t('定期更改密码可以提高账户安全性'),
      done: true,
      tag: null,
      buttonLabel: t('修改密码'),
      buttonIcon: <I.Arrow size={12} />,
      onClick: () => setShowChangePasswordModal(true),
      primary: false,
    },
    {
      id: 'passkey',
      icon: <I.Fingerprint size={14} />,
      title: t('Passkey 登录'),
      desc: passkeyEnabled
        ? t('已启用 · 最后使用：{{ts}}', { ts: lastUsedLabel })
        : !passkeySupported
          ? t('当前设备不支持 Passkey · 使用受支持的浏览器尝试')
          : t('使用生物识别免密登录 · 尚未注册'),
      done: !!passkeyEnabled,
      tag: passkeyEnabled
        ? { text: t('已启用'), kind: 'success' }
        : { text: t('推荐'), kind: 'brand' },
      buttonLabel: passkeyEnabled
        ? passkeyDeleteLoading
          ? '…'
          : t('解绑 Passkey')
        : passkeyRegisterLoading
          ? '…'
          : t('注册 Passkey'),
      buttonIcon: passkeyEnabled ? <I.Trash size={12} /> : <I.Plus size={12} />,
      onClick: passkeyEnabled
        ? () => {
            Modal.confirm({
              title: t('确认解绑 Passkey'),
              content: t('解绑后将无法使用 Passkey 登录，确定要继续吗？'),
              okText: t('确认解绑'),
              cancelText: t('取消'),
              okType: 'danger',
              onOk: onPasskeyDelete,
            });
          }
        : onPasskeyRegister,
      buttonClass: passkeyEnabled ? 'danger' : '',
      buttonDisabled: passkeyEnabled
        ? passkeyDeleteLoading
        : !passkeySupported || passkeyRegisterLoading,
      primary: false,
    },
  ];

  const completedCount = securityChecklist.filter((it) => it.done).length;
  const totalSecurityCount = securityChecklist.length + 1; // +1 for 2FA

  const tokenSuffix = systemToken
    ? `sk-${'*'.repeat(3)}${systemToken.slice(-4)}`
    : t('尚未生成');

  const copyToken = async (val) => {
    if (await copy(val)) showSuccess(t('已复制到剪贴板'));
  };

  return (
    <>
      {/* === ACCOUNT BINDINGS === */}
      <section className='aas-section' id='sec-account'>
        <div className='aas-section-head'>
          <div className='aas-head-ttl'>
            <div className='aas-head-ic'>
              <I.Link size={14} />
            </div>
            <div>
              <h3>{t('账户绑定')}</h3>
              <div className='aas-head-sub'>
                {t('外部身份提供方 · 已绑定')}{' '}
                <b>
                  {linkedCount}/{totalCount}
                </b>{' '}
                {t('个')}
              </div>
            </div>
          </div>
        </div>
        <div className='aas-bindings'>
          {providerCards.map((b) => {
            const onClick = b.onClick;
            const disabled = !onClick || b.loading;
            return (
              <div
                className={`aas-binding ${b.bound ? 'bound' : ''}`}
                key={b.key}
              >
                <div className={`aas-binding-icon ${b.iconKey}`}>{b.icon}</div>
                <div className='aas-binding-info'>
                  <div className='aas-binding-name'>
                    {b.name}
                    <span
                      className={`aas-binding-dot ${b.bound ? 'on' : 'off'}`}
                    />
                    {b.primary && (
                      <span className='aas-primary-tag'>{t('主')}</span>
                    )}
                  </div>
                  <div
                    className={`aas-binding-status ${b.bound ? 'bound' : ''}`}
                    title={b.detail}
                  >
                    {b.detail}
                  </div>
                </div>
                <button
                  className={`aas-binding-action ${b.unbindStyle ? 'unbind' : !b.bound && b.enabled ? 'brand' : ''} ${disabled ? 'disabled' : ''}`}
                  onClick={onClick}
                  disabled={disabled}
                >
                  {b.loading ? '…' : b.actionLabel}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Telegram bind modal stays here — uses TelegramLoginButton */}
      <Modal
        title={t('绑定 Telegram')}
        visible={showTelegramBindModal}
        onCancel={() => setShowTelegramBindModal(false)}
        footer={null}
      >
        <div
          className='my-3 text-sm'
          style={{ color: 'var(--text-secondary)' }}
        >
          {t('点击下方按钮通过 Telegram 完成绑定')}
        </div>
        <div className='flex justify-center'>
          <div className='scale-90'>
            <TelegramLoginButton
              dataAuthUrl='/api/oauth/telegram/bind'
              botName={status.telegram_bot_name}
            />
          </div>
        </div>
      </Modal>

      {/* === SECURITY === */}
      <section className='aas-section' id='sec-security'>
        <div className='aas-section-head'>
          <div className='aas-head-ttl'>
            <div className='aas-head-ic'>
              <I.Shield size={14} />
            </div>
            <div>
              <h3>{t('安全设置')}</h3>
              <div className='aas-head-sub'>
                <b>
                  {completedCount}/{totalSecurityCount}
                </b>{' '}
                {t('项已完成')} · {t('建议每 90 天轮换密钥')}
              </div>
            </div>
          </div>
        </div>
        <div className='aas-sec-list'>
          {securityChecklist.map((it) => (
            <div
              key={it.id}
              className={`aas-sec-row ${it.done ? 'done' : 'todo'}`}
            >
              <div className='aas-sec-check'>
                {it.done ? <I.Check size={14} /> : it.icon}
              </div>
              <div className='aas-sec-info'>
                <div className='aas-sec-title'>
                  {it.title}
                  {it.tag && (
                    <span className={`aas-tag ${it.tag.kind}`}>
                      {it.tag.text}
                    </span>
                  )}
                </div>
                <div className='aas-sec-desc'>{it.desc}</div>
                {it.id === 'token' && systemToken && (
                  <div className='aas-token-display'>
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={systemToken}
                    >
                      {systemToken}
                    </span>
                    <button onClick={() => copyToken(systemToken)}>
                      <I.Copy size={12} /> {t('复制')}
                    </button>
                  </div>
                )}
              </div>
              <button
                className={`aas-btn sm ${it.buttonClass || ''} ${it.primary ? 'primary' : ''}`}
                onClick={it.onClick}
                disabled={it.buttonDisabled}
              >
                {it.buttonIcon} {it.buttonLabel}
              </button>
            </div>
          ))}

          {/* 2FA — embedded full panel inside its own row container */}
          <div className='aas-sec-row' style={{ display: 'block' }}>
            <div style={{ padding: '4px 2px 8px' }}>
              <TwoFASetting t={t} />
            </div>
          </div>

          {/* Delete account — danger row */}
          <div className='aas-sec-row danger-row'>
            <div className='aas-sec-check'>
              <I.Power size={14} />
            </div>
            <div className='aas-sec-info'>
              <div className='aas-sec-title'>
                {t('删除账户')}{' '}
                <span className='aas-tag danger'>{t('不可逆')}</span>
              </div>
              <div className='aas-sec-desc'>
                {t(
                  '所有数据将被永久删除 · 包括 API 调用记录、计费记录与绑定关系',
                )}
              </div>
            </div>
            <button
              className='aas-btn danger sm'
              onClick={() => setShowAccountDeleteModal(true)}
            >
              <I.Trash size={12} /> {t('注销账户')}
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default AccountManagement;
