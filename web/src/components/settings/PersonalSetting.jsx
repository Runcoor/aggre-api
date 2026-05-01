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

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  API,
  copy,
  isAdmin,
  isRoot,
  renderQuota,
  showError,
  showInfo,
  showSuccess,
  setStatusData,
  prepareCredentialCreationOptions,
  buildRegistrationResult,
  isPasskeySupported,
  setUserData,
} from '../../helpers';
import { UserContext } from '../../context/User';
import { useTranslation } from 'react-i18next';

import AccountManagement from './personal/cards/AccountManagement';
import NotificationSettings from './personal/cards/NotificationSettings';
import CheckinCalendar from './personal/cards/CheckinCalendar';
import EmailBindModal from './personal/modals/EmailBindModal';
import WeChatBindModal from './personal/modals/WeChatBindModal';
import AccountDeleteModal from './personal/modals/AccountDeleteModal';
import ChangePasswordModal from './personal/modals/ChangePasswordModal';
import {
  AasIcons as I,
  AccountSettingsStyles,
} from './personal/_shared/AccountSettingsStyles';

const NAV_ITEMS = (t, bindingMeta) => [
  { id: 'profile', label: t('个人资料'), icon: 'User' },
  {
    id: 'account',
    label: t('账户绑定'),
    icon: 'Link',
    meta: bindingMeta,
  },
  { id: 'security', label: t('安全设置'), icon: 'Shield' },
  { id: 'notifications', label: t('通知配置'), icon: 'Bell' },
  { id: 'pricing', label: t('价格策略'), icon: 'Tag' },
  { id: 'privacy', label: t('隐私设置'), icon: 'Lock' },
];

// Detect a friendly local timezone label like "(GMT+08:00) Asia/Shanghai".
const detectTimezone = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const offsetMin = -new Date().getTimezoneOffset();
    const sign = offsetMin >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMin);
    const h = String(Math.floor(abs / 60)).padStart(2, '0');
    const m = String(abs % 60).padStart(2, '0');
    return `(GMT${sign}${h}:${m}) ${tz}`;
  } catch (e) {
    return 'UTC';
  }
};

const PersonalSetting = () => {
  const [userState, userDispatch] = useContext(UserContext);
  let navigate = useNavigate();
  const { t } = useTranslation();

  const [inputs, setInputs] = useState({
    wechat_verification_code: '',
    email_verification_code: '',
    email: '',
    self_account_deletion_confirmation: '',
    original_password: '',
    set_new_password: '',
    set_new_password_confirmation: '',
  });
  const [status, setStatus] = useState({});
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showWeChatBindModal, setShowWeChatBindModal] = useState(false);
  const [showEmailBindModal, setShowEmailBindModal] = useState(false);
  const [showAccountDeleteModal, setShowAccountDeleteModal] = useState(false);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [disableButton, setDisableButton] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [systemToken, setSystemToken] = useState('');
  const [passkeyStatus, setPasskeyStatus] = useState({ enabled: false });
  const [passkeyRegisterLoading, setPasskeyRegisterLoading] = useState(false);
  const [passkeyDeleteLoading, setPasskeyDeleteLoading] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    warningType: 'email',
    warningThreshold: 100000,
    webhookUrl: '',
    webhookSecret: '',
    notificationEmail: '',
    barkUrl: '',
    gotifyUrl: '',
    gotifyToken: '',
    gotifyPriority: 5,
    upstreamModelUpdateNotifyEnabled: false,
    acceptUnsetModelRatioModel: false,
    recordIpLog: false,
  });

  const [activeNav, setActiveNav] = useState('profile');
  const [dirty, setDirty] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    let saved = localStorage.getItem('status');
    if (saved) {
      const parsed = JSON.parse(saved);
      setStatus(parsed);
      if (parsed.turnstile_check) {
        setTurnstileEnabled(true);
        setTurnstileSiteKey(parsed.turnstile_site_key);
      } else {
        setTurnstileEnabled(false);
        setTurnstileSiteKey('');
      }
    }
    (async () => {
      try {
        const res = await API.get('/api/status');
        const { success, data } = res.data;
        if (success && data) {
          setStatus(data);
          setStatusData(data);
          if (data.turnstile_check) {
            setTurnstileEnabled(true);
            setTurnstileSiteKey(data.turnstile_site_key);
          } else {
            setTurnstileEnabled(false);
            setTurnstileSiteKey('');
          }
        }
      } catch (e) {
        // keep local status
      }
    })();

    getUserData();

    isPasskeySupported()
      .then(setPasskeySupported)
      .catch(() => setPasskeySupported(false));
  }, []);

  useEffect(() => {
    let countdownInterval = null;
    if (disableButton && countdown > 0) {
      countdownInterval = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      setDisableButton(false);
      setCountdown(30);
    }
    return () => clearInterval(countdownInterval);
  }, [disableButton, countdown]);

  useEffect(() => {
    if (userState?.user?.setting) {
      const settings = JSON.parse(userState.user.setting);
      setNotificationSettings({
        warningType: settings.notify_type || 'email',
        warningThreshold: settings.quota_warning_threshold || 500000,
        webhookUrl: settings.webhook_url || '',
        webhookSecret: settings.webhook_secret || '',
        notificationEmail: settings.notification_email || '',
        barkUrl: settings.bark_url || '',
        gotifyUrl: settings.gotify_url || '',
        gotifyToken: settings.gotify_token || '',
        gotifyPriority:
          settings.gotify_priority !== undefined ? settings.gotify_priority : 5,
        upstreamModelUpdateNotifyEnabled:
          settings.upstream_model_update_notify_enabled === true,
        acceptUnsetModelRatioModel:
          settings.accept_unset_model_ratio_model || false,
        recordIpLog: settings.record_ip_log || false,
      });
      setDirty(false);
    }
  }, [userState?.user?.setting]);

  // Anchor scroll-spy.
  useEffect(() => {
    const ids = ['profile', 'account', 'security', 'notifications', 'pricing', 'privacy'];
    const headerOffset = 120;
    const handler = () => {
      const scrollY = window.scrollY + headerOffset;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(`sec-${id}`);
        if (el && el.offsetTop <= scrollY) current = id;
      }
      setActiveNav((prev) => (prev === current ? prev : current));
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleInputChange = (name, value) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const generateAccessToken = async () => {
    const res = await API.get('/api/user/token');
    const { success, message, data } = res.data;
    if (success) {
      setSystemToken(data);
      await copy(data);
      showSuccess(t('令牌已重置并已复制到剪贴板'));
    } else {
      showError(message);
    }
  };

  const loadPasskeyStatus = async () => {
    try {
      const res = await API.get('/api/user/passkey');
      const { success, data, message } = res.data;
      if (success) {
        setPasskeyStatus({
          enabled: data?.enabled || false,
          last_used_at: data?.last_used_at || null,
          backup_eligible: data?.backup_eligible || false,
          backup_state: data?.backup_state || false,
        });
      } else {
        showError(message);
      }
    } catch (error) {
      // keep default
    }
  };

  const handleRegisterPasskey = async () => {
    if (!passkeySupported || !window.PublicKeyCredential) {
      showInfo(t('当前设备不支持 Passkey'));
      return;
    }
    setPasskeyRegisterLoading(true);
    try {
      const beginRes = await API.post('/api/user/passkey/register/begin');
      const { success, message, data } = beginRes.data;
      if (!success) {
        showError(message || t('无法发起 Passkey 注册'));
        return;
      }

      const publicKey = prepareCredentialCreationOptions(
        data?.options || data?.publicKey || data,
      );
      const credential = await navigator.credentials.create({ publicKey });
      const payload = buildRegistrationResult(credential);
      if (!payload) {
        showError(t('Passkey 注册失败，请重试'));
        return;
      }

      const finishRes = await API.post(
        '/api/user/passkey/register/finish',
        payload,
      );
      if (finishRes.data.success) {
        showSuccess(t('Passkey 注册成功'));
        await loadPasskeyStatus();
      } else {
        showError(finishRes.data.message || t('Passkey 注册失败，请重试'));
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        showInfo(t('已取消 Passkey 注册'));
      } else {
        showError(t('Passkey 注册失败，请重试'));
      }
    } finally {
      setPasskeyRegisterLoading(false);
    }
  };

  const handleRemovePasskey = async () => {
    setPasskeyDeleteLoading(true);
    try {
      const res = await API.delete('/api/user/passkey');
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('Passkey 已解绑'));
        await loadPasskeyStatus();
      } else {
        showError(message || t('操作失败，请重试'));
      }
    } catch (error) {
      showError(t('操作失败，请重试'));
    } finally {
      setPasskeyDeleteLoading(false);
    }
  };

  const getUserData = async () => {
    let res = await API.get(`/api/user/self`);
    const { success, message, data } = res.data;
    if (success) {
      userDispatch({ type: 'login', payload: data });
      setUserData(data);
      await loadPasskeyStatus();
    } else {
      showError(message);
    }
  };

  const deleteAccount = async () => {
    if (inputs.self_account_deletion_confirmation !== userState.user.username) {
      showError(t('请输入你的账户名以确认删除！'));
      return;
    }

    const res = await API.delete('/api/user/self');
    const { success, message } = res.data;

    if (success) {
      showSuccess(t('账户已删除！'));
      await API.get('/api/user/logout');
      userDispatch({ type: 'logout' });
      localStorage.removeItem('user');
      navigate('/login');
    } else {
      showError(message);
    }
  };

  const bindWeChat = async () => {
    if (inputs.wechat_verification_code === '') return;
    const res = await API.post('/api/oauth/wechat/bind', {
      code: inputs.wechat_verification_code,
    });
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('微信账户绑定成功！'));
      setShowWeChatBindModal(false);
    } else {
      showError(message);
    }
  };

  const changePassword = async () => {
    if (inputs.set_new_password === '') {
      showError(t('请输入新密码！'));
      return;
    }
    if (inputs.original_password === inputs.set_new_password) {
      showError(t('新密码需要和原密码不一致！'));
      return;
    }
    if (inputs.set_new_password !== inputs.set_new_password_confirmation) {
      showError(t('两次输入的密码不一致！'));
      return;
    }
    const res = await API.put(`/api/user/self`, {
      original_password: inputs.original_password,
      password: inputs.set_new_password,
    });
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('密码修改成功！'));
      setShowWeChatBindModal(false);
    } else {
      showError(message);
    }
    setShowChangePasswordModal(false);
  };

  const sendVerificationCode = async () => {
    if (inputs.email === '') {
      showError(t('请输入邮箱！'));
      return;
    }
    setDisableButton(true);
    if (turnstileEnabled && turnstileToken === '') {
      showInfo(t('请稍后几秒重试，Turnstile 正在检查用户环境！'));
      return;
    }
    setLoading(true);
    const res = await API.get(
      `/api/verification?email=${inputs.email}&turnstile=${turnstileToken}`,
    );
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('验证码发送成功，请检查邮箱！'));
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const bindEmail = async () => {
    if (inputs.email_verification_code === '') {
      showError(t('请输入邮箱验证码！'));
      return;
    }
    setLoading(true);
    const res = await API.post('/api/oauth/email/bind', {
      email: inputs.email,
      code: inputs.email_verification_code,
    });
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('邮箱账户绑定成功！'));
      setShowEmailBindModal(false);
      userState.user.email = inputs.email;
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const handleNotificationSettingChange = (type, value) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [type]:
        value && value.target
          ? value.target.value !== undefined
            ? value.target.value
            : value.target.checked
          : value,
    }));
  };

  const saveNotificationSettings = async () => {
    setSavingNotif(true);
    try {
      const res = await API.put('/api/user/setting', {
        notify_type: notificationSettings.warningType,
        quota_warning_threshold: parseFloat(
          notificationSettings.warningThreshold,
        ),
        webhook_url: notificationSettings.webhookUrl,
        webhook_secret: notificationSettings.webhookSecret,
        notification_email: notificationSettings.notificationEmail,
        bark_url: notificationSettings.barkUrl,
        gotify_url: notificationSettings.gotifyUrl,
        gotify_token: notificationSettings.gotifyToken,
        gotify_priority: (() => {
          const parsed = parseInt(notificationSettings.gotifyPriority);
          return isNaN(parsed) ? 5 : parsed;
        })(),
        upstream_model_update_notify_enabled:
          notificationSettings.upstreamModelUpdateNotifyEnabled === true,
        accept_unset_model_ratio_model:
          notificationSettings.acceptUnsetModelRatioModel,
        record_ip_log: notificationSettings.recordIpLog,
      });

      if (res.data.success) {
        showSuccess(t('设置保存成功'));
        setDirty(false);
        await getUserData();
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(t('设置保存失败'));
    } finally {
      setSavingNotif(false);
    }
  };

  const discardNotificationChanges = () => {
    if (userState?.user?.setting) {
      const settings = JSON.parse(userState.user.setting);
      setNotificationSettings({
        warningType: settings.notify_type || 'email',
        warningThreshold: settings.quota_warning_threshold || 500000,
        webhookUrl: settings.webhook_url || '',
        webhookSecret: settings.webhook_secret || '',
        notificationEmail: settings.notification_email || '',
        barkUrl: settings.bark_url || '',
        gotifyUrl: settings.gotify_url || '',
        gotifyToken: settings.gotify_token || '',
        gotifyPriority:
          settings.gotify_priority !== undefined ? settings.gotify_priority : 5,
        upstreamModelUpdateNotifyEnabled:
          settings.upstream_model_update_notify_enabled === true,
        acceptUnsetModelRatioModel:
          settings.accept_unset_model_ratio_model || false,
        recordIpLog: settings.record_ip_log || false,
      });
    }
    setDirty(false);
  };

  // Compute the binding count for the nav badge ("2/7" etc.). Mirrors
  // AccountManagement: count a provider only if it's enabled at the site
  // level, OR the user has already bound it (so it stays visible).
  const bindingMeta = useMemo(() => {
    const u = userState?.user || {};
    const candidates = [
      { visible: true, bound: !!u.email },
      { visible: !!status?.wechat_login || !!u.wechat_id, bound: !!u.wechat_id },
      { visible: !!status?.github_oauth || !!u.github_id, bound: !!u.github_id },
      { visible: !!status?.discord_oauth || !!u.discord_id, bound: !!u.discord_id },
      { visible: !!status?.telegram_oauth || !!u.telegram_id, bound: !!u.telegram_id },
      { visible: !!status?.linuxdo_oauth || !!u.linux_do_id, bound: !!u.linux_do_id },
      { visible: !!status?.oidc_enabled || !!u.oidc_id, bound: !!u.oidc_id },
    ];
    const total = candidates.filter((c) => c.visible).length;
    const bound = candidates.filter((c) => c.visible && c.bound).length;
    return total > 0 ? `${bound}/${total}` : null;
  }, [userState?.user, status]);

  const navItems = NAV_ITEMS(t, bindingMeta);

  // ----- profile card data -----
  const username = userState?.user?.username || 'null';
  const displayName = userState?.user?.display_name || username;
  const initial = (username && username[0] ? username[0] : 'A').toUpperCase();
  const avatarSrc = userState?.user?.avatar || null;
  const balance = renderQuota(userState?.user?.quota, 2);
  const usedQuota = renderQuota(userState?.user?.used_quota, 2);
  const requestCount = userState?.user?.request_count ?? 0;
  const groupName = userState?.user?.group || t('默认');
  const roleLabel = isRoot()
    ? t('超级管理员')
    : isAdmin()
    ? t('管理员')
    : t('普通用户');

  // ----- profile section data -----
  const userEmail = userState?.user?.email || '';
  const timezone = useMemo(() => detectTimezone(), []);

  const jumpTo = (id) => {
    const el = document.getElementById(`sec-${id}`);
    if (!el) return;
    const top =
      el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <div className='aas-root'>
      <AccountSettingsStyles />

      <div className='aas-page'>
        {/* topbar — eyebrow title, matches dashboard */}
        <div className='aas-topbar'>
          <div className='aas-eyebrow'>
            {(status?.system_name || 'Aggre Token')} · {t('账户设置')}
          </div>
        </div>

        {/* layout */}
        <div className='aas-app-grid'>
          {/* sticky sidebar */}
          <aside className='aas-side'>
            <div className='aas-profile-card'>
              <div className='aas-pc-row'>
                <div className='aas-pc-ava'>
                  {!avatarFailed && avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={username}
                      onError={() => setAvatarFailed(true)}
                    />
                  ) : (
                    initial
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 className='aas-pc-name' title={displayName}>
                    {displayName}
                  </h2>
                  <div className='aas-pc-at' title={`@${username}`}>
                    @{username}
                  </div>
                  <span className='aas-pc-role' title={`${groupName} · ${roleLabel}`}>
                    <I.Spark size={10} /> {groupName} · {roleLabel}
                  </span>
                </div>
              </div>
              <div className='aas-pc-balance'>
                <div className='aas-pc-lbl'>{t('当前余额')}</div>
                <div
                  className='aas-pc-val aas-mono'
                  title={String(balance)}
                >
                  {balance}
                </div>
                <div className='aas-pc-sub'>
                  {t('可用额度 · 累计 {{count}} 次调用', {
                    count: requestCount,
                  })}
                </div>
              </div>
              <div className='aas-pc-mini'>
                <div>
                  <div className='aas-pc-mlbl'>{t('历史消耗')}</div>
                  <div
                    className='aas-pc-mval aas-mono'
                    title={String(usedQuota)}
                  >
                    {usedQuota}
                  </div>
                  <div className='aas-pc-msub'>
                    {t('{{count}} 次', { count: requestCount })}
                  </div>
                </div>
                <div>
                  <div className='aas-pc-mlbl'>{t('请求次数')}</div>
                  <div className='aas-pc-mval aas-mono'>
                    {requestCount}
                  </div>
                  <div className='aas-pc-msub'>{t('自注册以来')}</div>
                </div>
              </div>
            </div>

            <nav className='aas-anchors'>
              {navItems.map((item) => {
                const IconCmp = I[item.icon];
                return (
                  <button
                    key={item.id}
                    type='button'
                    className={`aas-anchor ${activeNav === item.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveNav(item.id);
                      jumpTo(item.id);
                    }}
                  >
                    <span className='aas-anchor-ic'>
                      {IconCmp ? <IconCmp size={15} /> : null}
                    </span>
                    <span className='aas-anchor-ct'>{item.label}</span>
                    {item.meta && (
                      <span className='aas-anchor-tag'>{item.meta}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* main column */}
          <div className='aas-main'>
            {/* Optional check-in calendar — kept inline before profile section */}
            {status?.checkin_enabled && (
              <CheckinCalendar
                t={t}
                status={status}
                turnstileEnabled={turnstileEnabled}
                turnstileSiteKey={turnstileSiteKey}
              />
            )}

            {/* === PROFILE === */}
            <section className='aas-section' id='sec-profile'>
              <div className='aas-section-head'>
                <div className='aas-head-ttl'>
                  <div className='aas-head-ic'>
                    <I.User size={14} />
                  </div>
                  <div>
                    <h3>{t('个人资料')}</h3>
                    <div className='aas-head-sub'>
                      {t('用于账户登录与对外展示')}
                    </div>
                  </div>
                </div>
                <div className='aas-head-right'>
                  <button
                    className='aas-btn sm'
                    onClick={() => setShowEmailBindModal(true)}
                  >
                    {userEmail ? t('更换邮箱') : t('绑定邮箱')}
                  </button>
                </div>
              </div>
              <div className='aas-fields'>
                <div className='aas-field'>
                  <div className='aas-field-label'>
                    {t('主邮箱')}
                    <span className='aas-field-meta'>
                      {userEmail ? t('已验证') : t('未绑定')}
                    </span>
                  </div>
                  <div className='aas-input'>
                    <I.Mail size={14} />
                    <input
                      readOnly
                      value={userEmail}
                      placeholder={t('未绑定邮箱')}
                    />
                    {userEmail && (
                      <span className='aas-tag success'>{t('已验证')}</span>
                    )}
                  </div>
                </div>
                <div className='aas-field'>
                  <div className='aas-field-label'>
                    {t('时区')}
                    <span className='aas-field-meta'>
                      {t('影响计费周期')}
                    </span>
                  </div>
                  <div className='aas-input'>
                    <I.Globe size={14} />
                    <input readOnly value={timezone} />
                  </div>
                </div>
              </div>
            </section>

            {/* AccountManagement renders sec-account + sec-security */}
            <AccountManagement
              t={t}
              userState={userState}
              status={status}
              systemToken={systemToken}
              setShowEmailBindModal={setShowEmailBindModal}
              setShowWeChatBindModal={setShowWeChatBindModal}
              generateAccessToken={generateAccessToken}
              setShowChangePasswordModal={setShowChangePasswordModal}
              setShowAccountDeleteModal={setShowAccountDeleteModal}
              passkeyStatus={passkeyStatus}
              passkeySupported={passkeySupported}
              passkeyRegisterLoading={passkeyRegisterLoading}
              passkeyDeleteLoading={passkeyDeleteLoading}
              onPasskeyRegister={handleRegisterPasskey}
              onPasskeyDelete={handleRemovePasskey}
            />

            {/* NotificationSettings renders sec-notifications + sec-pricing + sec-privacy + sec-sidebar */}
            <NotificationSettings
              t={t}
              notificationSettings={notificationSettings}
              handleNotificationSettingChange={handleNotificationSettingChange}
              markNotificationDirty={() => setDirty(true)}
            />
          </div>
        </div>
      </div>

      {/* Save bar — portalled to body, only mounted while there are
         unsaved changes. Floats fixed near the viewport bottom. */}
      {dirty &&
        createPortal(
          <div className='aas-save-bar show'>
            <span className='aas-dot' />
            <span>{t('有未保存的更改')}</span>
            <button
              className='aas-discard'
              onClick={discardNotificationChanges}
            >
              {t('放弃')}
            </button>
            <button
              className='aas-save-action'
              onClick={saveNotificationSettings}
              disabled={savingNotif}
            >
              {savingNotif ? '…' : t('保存设置')}
            </button>
          </div>,
          document.body,
        )}

      {/* Modals — kept outside the scoped root so Semi portal styles don't leak */}
      <EmailBindModal
        t={t}
        showEmailBindModal={showEmailBindModal}
        setShowEmailBindModal={setShowEmailBindModal}
        inputs={inputs}
        handleInputChange={handleInputChange}
        sendVerificationCode={sendVerificationCode}
        bindEmail={bindEmail}
        disableButton={disableButton}
        loading={loading}
        countdown={countdown}
        turnstileEnabled={turnstileEnabled}
        turnstileSiteKey={turnstileSiteKey}
        setTurnstileToken={setTurnstileToken}
      />
      <WeChatBindModal
        t={t}
        showWeChatBindModal={showWeChatBindModal}
        setShowWeChatBindModal={setShowWeChatBindModal}
        inputs={inputs}
        handleInputChange={handleInputChange}
        bindWeChat={bindWeChat}
        status={status}
      />
      <AccountDeleteModal
        t={t}
        showAccountDeleteModal={showAccountDeleteModal}
        setShowAccountDeleteModal={setShowAccountDeleteModal}
        inputs={inputs}
        handleInputChange={handleInputChange}
        deleteAccount={deleteAccount}
        userState={userState}
        turnstileEnabled={turnstileEnabled}
        turnstileSiteKey={turnstileSiteKey}
        setTurnstileToken={setTurnstileToken}
      />
      <ChangePasswordModal
        t={t}
        showChangePasswordModal={showChangePasswordModal}
        setShowChangePasswordModal={setShowChangePasswordModal}
        inputs={inputs}
        handleInputChange={handleInputChange}
        changePassword={changePassword}
        turnstileEnabled={turnstileEnabled}
        turnstileSiteKey={turnstileSiteKey}
        setTurnstileToken={setTurnstileToken}
      />
    </div>
  );
};

export default PersonalSetting;
