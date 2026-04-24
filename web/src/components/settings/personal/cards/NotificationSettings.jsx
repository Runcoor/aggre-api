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

import React, { useRef, useEffect, useState, useContext } from 'react';
import {
  Button,
  Form,
  Toast,
  Switch,
  Card,
  Row,
  Col,
} from '@douyinfe/semi-ui';
import { IconMail, IconBell } from '@douyinfe/semi-icons';
import {
  renderQuotaWithPrompt,
  API,
  showSuccess,
  showError,
} from '../../../../helpers';
import { StatusContext } from '../../../../context/Status';
import { UserContext } from '../../../../context/User';
import { useUserPermissions } from '../../../../hooks/common/useUserPermissions';
import {
  mergeAdminConfig,
  useSidebar,
} from '../../../../hooks/common/useSidebar';

// Tight row used inside each <section>'s right column.
const settingRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '12px 16px',
  background: 'var(--surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
};

const NotificationSettings = ({
  t,
  notificationSettings,
  handleNotificationSettingChange,
  saveNotificationSettings,
}) => {
  const formApiRef = useRef(null);
  const [statusState] = useContext(StatusContext);
  const [userState] = useContext(UserContext);
  const isAdminOrRoot = (userState?.user?.role || 0) >= 10;

  // Sidebar settings state
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [sidebarModulesUser, setSidebarModulesUser] = useState({
    chat: { enabled: true, playground: true, chat: true },
    console: {
      enabled: true,
      detail: true,
      token: true,
      log: true,
      midjourney: true,
      task: true,
    },
    personal: { enabled: true, topup: true, personal: true },
    admin: {
      enabled: true,
      channel: true,
      models: true,
      deployment: true,
      subscription: true,
      redemption: true,
      'login-log': true,
      user: true,
      setting: true,
    },
  });
  const [adminConfig, setAdminConfig] = useState(null);

  const {
    hasSidebarSettingsPermission,
    isSidebarSectionAllowed,
    isSidebarModuleAllowed,
  } = useUserPermissions();

  const { refreshUserConfig } = useSidebar();

  const handleSectionChange = (sectionKey) => (checked) => {
    setSidebarModulesUser((prev) => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], enabled: checked },
    }));
  };

  const handleModuleChange = (sectionKey, moduleKey) => (checked) => {
    setSidebarModulesUser((prev) => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], [moduleKey]: checked },
    }));
  };

  const saveSidebarSettings = async () => {
    setSidebarLoading(true);
    try {
      const res = await API.put('/api/user/self', {
        sidebar_modules: JSON.stringify(sidebarModulesUser),
      });
      if (res.data.success) {
        showSuccess(t('侧边栏设置保存成功'));
        await refreshUserConfig();
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(t('保存失败'));
    }
    setSidebarLoading(false);
  };

  const resetSidebarModules = () => {
    setSidebarModulesUser({
      chat: { enabled: true, playground: true, chat: true },
      console: {
        enabled: true,
        detail: true,
        token: true,
        log: true,
        midjourney: true,
        task: true,
      },
      personal: { enabled: true, topup: true, personal: true },
      admin: {
        enabled: true,
        channel: true,
        models: true,
        deployment: true,
        subscription: true,
        redemption: true,
        'login-log': true,
        user: true,
        setting: true,
      },
    });
  };

  useEffect(() => {
    const loadSidebarConfigs = async () => {
      try {
        if (statusState?.status?.SidebarModulesAdmin) {
          try {
            const adminConf = JSON.parse(statusState.status.SidebarModulesAdmin);
            setAdminConfig(mergeAdminConfig(adminConf));
          } catch {
            setAdminConfig(mergeAdminConfig(null));
          }
        } else {
          setAdminConfig(mergeAdminConfig(null));
        }

        const userRes = await API.get('/api/user/self');
        if (userRes.data.success && userRes.data.data.sidebar_modules) {
          let userConf;
          if (typeof userRes.data.data.sidebar_modules === 'string') {
            userConf = JSON.parse(userRes.data.data.sidebar_modules);
          } else {
            userConf = userRes.data.data.sidebar_modules;
          }
          setSidebarModulesUser(userConf);
        }
      } catch (error) {
        console.error('加载边栏配置失败:', error);
      }
    };

    loadSidebarConfigs();
  }, [statusState]);

  useEffect(() => {
    if (formApiRef.current && notificationSettings) {
      formApiRef.current.setValues(notificationSettings);
    }
  }, [notificationSettings]);

  const handleFormChange = (field, value) => {
    handleNotificationSettingChange(field, value);
  };

  const isAllowedByAdmin = (sectionKey, moduleKey = null) => {
    if (!adminConfig) return true;
    if (moduleKey) {
      return (
        adminConfig[sectionKey]?.enabled && adminConfig[sectionKey]?.[moduleKey]
      );
    }
    return adminConfig[sectionKey]?.enabled;
  };

  const sectionConfigs = [
    {
      key: 'chat',
      title: t('聊天区域'),
      description: t('操练场和聊天功能'),
      modules: [
        { key: 'playground', title: t('操练场'), description: t('AI模型测试环境') },
        { key: 'chat', title: t('聊天'), description: t('聊天会话管理') },
      ],
    },
    {
      key: 'console',
      title: t('控制台区域'),
      description: t('数据管理和日志查看'),
      modules: [
        { key: 'detail', title: t('数据看板'), description: t('系统数据统计') },
        { key: 'token', title: t('令牌管理'), description: t('API令牌管理') },
        { key: 'log', title: t('使用日志'), description: t('API使用记录') },
        { key: 'midjourney', title: t('绘图日志'), description: t('绘图任务记录') },
        { key: 'task', title: t('任务日志'), description: t('系统任务记录') },
      ],
    },
    {
      key: 'personal',
      title: t('个人中心区域'),
      description: t('用户个人功能'),
      modules: [
        { key: 'topup', title: t('钱包管理'), description: t('余额充值管理') },
        { key: 'personal', title: t('个人设置'), description: t('个人信息设置') },
      ],
    },
    {
      key: 'admin',
      title: t('管理员区域'),
      description: t('系统管理功能'),
      modules: [
        { key: 'channel', title: t('渠道管理'), description: t('API渠道配置') },
        { key: 'models', title: t('模型管理'), description: t('AI模型配置') },
        { key: 'deployment', title: t('模型部署'), description: t('模型部署管理') },
        { key: 'subscription', title: t('订阅管理'), description: t('订阅套餐管理') },
        { key: 'redemption', title: t('兑换码管理'), description: t('兑换码生成管理') },
        { key: 'login-log', title: t('登录日志'), description: t('用户登录记录') },
        { key: 'user', title: t('用户管理'), description: t('用户账户管理') },
        { key: 'ai-news', title: t('AI 前沿信息'), description: t('每日 AI 资讯订阅') },
        { key: 'setting', title: t('系统设置'), description: t('系统参数配置') },
      ],
    },
  ]
    .filter((section) => isSidebarSectionAllowed(section.key))
    .map((section) => ({
      ...section,
      modules: section.modules.filter((m) => isSidebarModuleAllowed(section.key, m.key)),
    }))
    .filter((section) => section.modules.length > 0 && isAllowedByAdmin(section.key));

  const handleSubmit = () => {
    if (formApiRef.current) {
      formApiRef.current
        .validate()
        .then(() => saveNotificationSettings())
        .catch((errors) => {
          console.log('表单验证失败:', errors);
          Toast.error(t('请检查表单填写是否正确'));
        });
    } else {
      saveNotificationSettings();
    }
  };

  // ---- Layout primitives matching AccountManagement ----

  const SectionGrid = ({ title, description, children }) => (
    <section className='grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8'>
      <div className='lg:col-span-1'>
        <h2
          className='text-xl sm:text-2xl font-bold mb-3'
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
        >
          {title}
        </h2>
        <p className='text-sm leading-relaxed' style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      </div>
      <div className='lg:col-span-2 flex flex-col gap-3'>{children}</div>
    </section>
  );

  const ToggleRow = ({ icon, title, description, checked, onChange }) => (
    <div style={settingRow}>
      {icon ? (
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-active)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
      ) : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className='font-semibold text-sm' style={{ color: 'var(--text-primary)' }}>
          {title}
        </div>
        {description ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>
            {description}
          </div>
        ) : null}
      </div>
      <Switch checked={checked} onChange={onChange} size='default' />
    </div>
  );

  return (
    <Form
      getFormApi={(api) => (formApiRef.current = api)}
      initValues={notificationSettings}
      onSubmit={handleSubmit}
    >
      {() => (
        <div className='flex flex-col gap-8 sm:gap-10'>
          {/* ===== 通知配置 ===== */}
          <SectionGrid
            title={t('通知配置')}
            description={t('配置接收通知的方式与额度预警阈值')}
          >
            <ToggleRow
              icon={<IconMail size='small' />}
              title={t('邮件通知')}
              description={t('启用后将通过邮件接收预警和系统通知')}
              checked={notificationSettings.warningType === 'email'}
              onChange={(checked) =>
                handleFormChange('warningType', checked ? 'email' : '')
              }
            />
            {isAdminOrRoot && (
              <ToggleRow
                icon={<IconBell size='small' />}
                title={t('上游模型更新通知')}
                description={t('仅管理员可见,接收上游模型变更提醒')}
                checked={!!notificationSettings.upstreamModelUpdateNotifyEnabled}
                onChange={(value) =>
                  handleFormChange('upstreamModelUpdateNotifyEnabled', value)
                }
              />
            )}

            <div
              style={{
                ...settingRow,
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 12,
              }}
            >
              <div>
                <Form.AutoComplete
                  field='warningThreshold'
                  label={
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {t('额度预警阈值')}{' '}
                      {renderQuotaWithPrompt(notificationSettings.warningThreshold)}
                    </span>
                  }
                  placeholder={t('请输入预警额度')}
                  data={[
                    { value: 100000, label: '0.2$' },
                    { value: 500000, label: '1$' },
                    { value: 1000000, label: '2$' },
                    { value: 5000000, label: '10$' },
                  ]}
                  onChange={(val) => handleFormChange('warningThreshold', val)}
                  prefix={<IconBell />}
                  style={{ width: '100%' }}
                  rules={[
                    { required: true, message: t('请输入预警阈值') },
                    {
                      validator: (rule, value) => {
                        const numValue = Number(value);
                        if (isNaN(numValue) || numValue <= 0) {
                          return Promise.reject(t('预警阈值必须为正数'));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                />
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {t('当钱包或订阅剩余额度低于此数值时,系统将通过选择的方式发送通知')}
                </div>
              </div>

              {notificationSettings.warningType === 'email' && (
                <div>
                  <Form.Input
                    field='notificationEmail'
                    label={
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {t('通知邮箱')}
                      </span>
                    }
                    placeholder={t('留空则使用账号绑定的邮箱')}
                    onChange={(val) => handleFormChange('notificationEmail', val)}
                    prefix={<IconMail />}
                    showClear
                    style={{ width: '100%' }}
                  />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {t('设置用于接收额度预警的邮箱地址,不填则使用账号绑定的邮箱')}
                  </div>
                </div>
              )}
            </div>
          </SectionGrid>

          {/* ===== 价格设置 ===== */}
          <SectionGrid
            title={t('价格设置')}
            description={t('管理模型费用计算的全局偏好')}
          >
            <ToggleRow
              title={t('接受未设置价格模型')}
              description={t(
                '当模型没有设置价格时仍接受调用,仅当您信任该网站时使用,可能会产生高额费用',
              )}
              checked={!!notificationSettings.acceptUnsetModelRatioModel}
              onChange={(value) => handleFormChange('acceptUnsetModelRatioModel', value)}
            />
          </SectionGrid>

          {/* ===== 隐私设置 ===== */}
          <SectionGrid
            title={t('隐私设置')}
            description={t('配置数据采集和留存策略')}
          >
            <ToggleRow
              title={t('记录请求与错误日志IP')}
              description={t('开启后,仅"消费"和"错误"日志将记录您的客户端IP地址')}
              checked={!!notificationSettings.recordIpLog}
              onChange={(value) => handleFormChange('recordIpLog', value)}
            />
          </SectionGrid>

          {/* ===== 边栏设置 ===== */}
          {hasSidebarSettingsPermission() && (
            <SectionGrid
              title={t('边栏设置')}
              description={t('您可以个性化设置侧边栏的要显示功能')}
            >
              <div className='flex flex-col gap-4'>
                {sectionConfigs.map((section) => (
                  <div key={section.key} className='flex flex-col gap-2'>
                    <ToggleRow
                      title={section.title}
                      description={section.description}
                      checked={sidebarModulesUser[section.key]?.enabled !== false}
                      onChange={handleSectionChange(section.key)}
                    />
                    <Row gutter={[8, 8]} style={{ marginLeft: 8, marginRight: 0 }}>
                      {section.modules
                        .filter((m) => isAllowedByAdmin(section.key, m.key))
                        .map((module) => (
                          <Col key={module.key} xs={24} sm={12}>
                            <Card
                              className={
                                sidebarModulesUser[section.key]?.enabled !== false
                                  ? ''
                                  : 'opacity-50'
                              }
                              bodyStyle={{ padding: '10px 12px' }}
                              style={{
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-subtle)',
                              }}
                            >
                              <div className='flex justify-between items-center'>
                                <div className='flex-1 min-w-0'>
                                  <div
                                    className='font-semibold text-sm'
                                    style={{ color: 'var(--text-primary)' }}
                                  >
                                    {module.title}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: 'var(--text-muted)',
                                      marginTop: 2,
                                    }}
                                  >
                                    {module.description}
                                  </div>
                                </div>
                                <Switch
                                  checked={
                                    sidebarModulesUser[section.key]?.[module.key] !== false
                                  }
                                  onChange={handleModuleChange(section.key, module.key)}
                                  size='small'
                                  disabled={
                                    sidebarModulesUser[section.key]?.enabled === false
                                  }
                                />
                              </div>
                            </Card>
                          </Col>
                        ))}
                    </Row>
                  </div>
                ))}

                <div
                  className='flex justify-end gap-2 pt-3 mt-1'
                  style={{ borderTop: '1px solid var(--border-subtle)' }}
                >
                  <Button
                    type='tertiary'
                    onClick={resetSidebarModules}
                    className='!rounded-[var(--radius-md)]'
                  >
                    {t('重置为默认')}
                  </Button>
                  <Button
                    type='primary'
                    onClick={saveSidebarSettings}
                    loading={sidebarLoading}
                    className='!rounded-[var(--radius-md)]'
                  >
                    {t('保存边栏设置')}
                  </Button>
                </div>
              </div>
            </SectionGrid>
          )}

          {/* ===== Save Button ===== */}
          <div className='flex justify-end'>
            <Button
              type='primary'
              size='large'
              onClick={handleSubmit}
              className='!rounded-[var(--radius-md)]'
              style={{ paddingLeft: 32, paddingRight: 32 }}
            >
              {t('保存设置')}
            </Button>
          </div>
        </div>
      )}
    </Form>
  );
};

export default NotificationSettings;
