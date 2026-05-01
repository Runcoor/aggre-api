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

import React, { useState, useContext } from 'react';
import { renderQuotaWithPrompt } from '../../../../helpers';
import { UserContext } from '../../../../context/User';
import { AasIcons as I } from '../_shared/AccountSettingsStyles';

const NotificationSettings = ({
  t,
  notificationSettings,
  handleNotificationSettingChange,
  markNotificationDirty,
}) => {
  const [userState] = useContext(UserContext);
  const isAdminOrRoot = (userState?.user?.role || 0) >= 10;

  const [advancedOpen, setAdvancedOpen] = useState(false);

  const setField = (field, value) => {
    handleNotificationSettingChange(field, value);
    if (markNotificationDirty) markNotificationDirty();
  };

  const setRawField = (field, e) => {
    handleNotificationSettingChange(field, e.target.value);
    if (markNotificationDirty) markNotificationDirty();
  };

  const Switch = ({ checked, onChange, disabled }) => (
    <button
      type='button'
      className={`aas-switch ${checked ? 'on' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-pressed={checked}
    />
  );

  return (
    <>
      {/* === NOTIFICATIONS === */}
      <section className='aas-section' id='sec-notifications'>
        <div className='aas-section-head'>
          <div className='aas-head-ttl'>
            <div className='aas-head-ic'>
              <I.Bell size={14} />
            </div>
            <div>
              <h3>{t('通知配置')}</h3>
              <div className='aas-head-sub'>
                {t('接收方式与额度阈值')}
              </div>
            </div>
          </div>
        </div>
        <div className='aas-pref first'>
          <div className='aas-pref-glyph'>
            <I.Mail size={14} />
          </div>
          <div className='aas-pref-info'>
            <div className='aas-pref-title'>{t('邮件通知')}</div>
            <div className='aas-pref-desc'>
              {t('启用后将通过邮件接收预警和系统通知')}
            </div>
          </div>
          <Switch
            checked={notificationSettings.warningType === 'email'}
            onChange={(v) => setField('warningType', v ? 'email' : '')}
          />
        </div>
        {isAdminOrRoot && (
          <div className='aas-pref'>
            <div className='aas-pref-glyph muted'>
              <I.Bell size={14} />
            </div>
            <div className='aas-pref-info'>
              <div className='aas-pref-title'>
                {t('上游模型更新通知')}{' '}
                <span className='aas-tag muted'>{t('仅管理员')}</span>
              </div>
              <div className='aas-pref-desc'>
                {t('接收上游模型变更提醒')}
              </div>
            </div>
            <Switch
              checked={
                !!notificationSettings.upstreamModelUpdateNotifyEnabled
              }
              onChange={(v) =>
                setField('upstreamModelUpdateNotifyEnabled', v)
              }
            />
          </div>
        )}

        <div className='aas-thresh'>
          <div className='aas-field'>
            <div className='aas-field-label'>
              {t('额度预警阈值')}
              <span className='aas-field-meta'>
                {renderQuotaWithPrompt(notificationSettings.warningThreshold)}
              </span>
            </div>
            <div className='aas-input'>
              <I.Alert size={14} style={{ color: '#d97706' }} />
              <input
                type='text'
                value={notificationSettings.warningThreshold}
                onChange={(e) => setRawField('warningThreshold', e)}
              />
              <span className='aas-suffix'>tokens</span>
            </div>
            <div className='aas-field-help'>
              {t('当余额低于此数值时，系统将通过选择的方式发送通知')}
            </div>
          </div>
          <div className='aas-field'>
            <div className='aas-field-label'>
              {t('通知邮箱')}
              <span className='aas-field-meta'>{t('可选')}</span>
            </div>
            <div className='aas-input'>
              <I.Mail size={14} />
              <input
                type='text'
                value={notificationSettings.notificationEmail}
                onChange={(e) => setRawField('notificationEmail', e)}
                placeholder={t('留空则使用账号绑定的邮箱')}
              />
            </div>
            <div className='aas-field-help'>
              {t('不填则使用账号绑定的邮箱')}
            </div>
          </div>
        </div>

        {/* Advanced channels (webhook / bark / gotify) — collapsed by default */}
        <div
          className='aas-advanced'
          onClick={() => setAdvancedOpen((v) => !v)}
        >
          <span className='aas-advanced-l'>
            <I.Send size={13} />
            {t('高级通知通道')}
          </span>
          <span
            className='aas-advanced-r'
            style={{
              transform: advancedOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <I.Chevron size={14} />
          </span>
        </div>
        {advancedOpen && (
          <div className='aas-advanced-grid'>
            <div className='aas-field'>
              <div className='aas-field-label'>{t('Webhook URL')}</div>
              <div className='aas-input'>
                <I.Webhook size={14} />
                <input
                  type='text'
                  value={notificationSettings.webhookUrl}
                  onChange={(e) => setRawField('webhookUrl', e)}
                  placeholder='https://'
                />
              </div>
            </div>
            <div className='aas-field'>
              <div className='aas-field-label'>{t('Webhook Secret')}</div>
              <div className='aas-input'>
                <I.Lock size={14} />
                <input
                  type='text'
                  value={notificationSettings.webhookSecret}
                  onChange={(e) => setRawField('webhookSecret', e)}
                />
              </div>
            </div>
            <div className='aas-field'>
              <div className='aas-field-label'>Bark URL</div>
              <div className='aas-input'>
                <I.Bell size={14} />
                <input
                  type='text'
                  value={notificationSettings.barkUrl}
                  onChange={(e) => setRawField('barkUrl', e)}
                  placeholder='https://api.day.app/...'
                />
              </div>
            </div>
            <div className='aas-field'>
              <div className='aas-field-label'>Gotify URL</div>
              <div className='aas-input'>
                <I.Bell size={14} />
                <input
                  type='text'
                  value={notificationSettings.gotifyUrl}
                  onChange={(e) => setRawField('gotifyUrl', e)}
                  placeholder='https://gotify.example.com'
                />
              </div>
            </div>
            <div className='aas-field'>
              <div className='aas-field-label'>Gotify Token</div>
              <div className='aas-input'>
                <I.Key size={14} />
                <input
                  type='text'
                  value={notificationSettings.gotifyToken}
                  onChange={(e) => setRawField('gotifyToken', e)}
                />
              </div>
            </div>
            <div className='aas-field'>
              <div className='aas-field-label'>
                Gotify Priority
                <span className='aas-field-meta'>0-10</span>
              </div>
              <div className='aas-input'>
                <I.Sliders size={14} />
                <input
                  type='number'
                  min='0'
                  max='10'
                  value={notificationSettings.gotifyPriority}
                  onChange={(e) => setRawField('gotifyPriority', e)}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* === PRICING === */}
      <section className='aas-section' id='sec-pricing'>
        <div className='aas-section-head'>
          <div className='aas-head-ttl'>
            <div className='aas-head-ic'>
              <I.Tag size={14} />
            </div>
            <div>
              <h3>{t('价格策略')}</h3>
              <div className='aas-head-sub'>{t('计费与模型策略')}</div>
            </div>
          </div>
        </div>
        <div className='aas-pref first'>
          <div className='aas-pref-glyph warn'>
            <I.Tag size={14} />
          </div>
          <div className='aas-pref-info'>
            <div className='aas-pref-title'>
              {t('接受未设置价格的模型')}{' '}
              <span className='aas-tag warn'>{t('谨慎')}</span>
            </div>
            <div className='aas-pref-desc'>
              {t('当模型没有设置价格时仍接受调用，可能产生高额费用')}
            </div>
          </div>
          <Switch
            checked={!!notificationSettings.acceptUnsetModelRatioModel}
            onChange={(v) => setField('acceptUnsetModelRatioModel', v)}
          />
        </div>
      </section>

      {/* === PRIVACY === */}
      <section className='aas-section' id='sec-privacy'>
        <div className='aas-section-head'>
          <div className='aas-head-ttl'>
            <div className='aas-head-ic'>
              <I.Lock size={14} />
            </div>
            <div>
              <h3>{t('隐私设置')}</h3>
              <div className='aas-head-sub'>{t('日志与可观测性')}</div>
            </div>
          </div>
        </div>
        <div className='aas-pref first'>
          <div className='aas-pref-glyph muted'>
            <I.Eye size={14} />
          </div>
          <div className='aas-pref-info'>
            <div className='aas-pref-title'>
              {t('记录请求与错误日志 IP')}
            </div>
            <div className='aas-pref-desc'>
              {t('开启后，"消费"和"错误"日志中将记录您的客户端 IP 地址')}
            </div>
          </div>
          <Switch
            checked={!!notificationSettings.recordIpLog}
            onChange={(v) => setField('recordIpLog', v)}
          />
        </div>
      </section>

    </>
  );
};

export default NotificationSettings;
