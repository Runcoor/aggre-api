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

import React, { useEffect, useState, useRef } from 'react';
import { Form } from '@douyinfe/semi-ui';
import { API, showError, showNotice } from '../../helpers';
import { useTranslation } from 'react-i18next';

import StepNavigation from './components/StepNavigation';
import DatabaseStep from './components/steps/DatabaseStep';
import AdminStep from './components/steps/AdminStep';
import UsageModeStep from './components/steps/UsageModeStep';
import CompleteStep from './components/steps/CompleteStep';

const SetupWizard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState({
    status: false,
    root_init: false,
    database_type: '',
  });
  const [currentStep, setCurrentStep] = useState(0);
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    usageMode: 'external',
  });

  // 确保默认选中“对外运营模式”，并同步到表单
  useEffect(() => {
    if (formRef.current) {
      formRef.current.setValue('usageMode', 'external');
    }
  }, []);

  // 定义步骤内容
  const steps = [
    {
      title: t('数据库检查'),
      description: t('验证数据库连接状态'),
    },
    {
      title: t('管理员账号'),
      description: t('设置管理员登录信息'),
    },
    {
      title: t('使用模式'),
      description: t('选择系统运行模式'),
    },
    {
      title: t('完成初始化'),
      description: t('确认设置并完成初始化'),
    },
  ];

  useEffect(() => {
    fetchSetupStatus();
  }, []);

  const fetchSetupStatus = async () => {
    try {
      const res = await API.get('/api/setup');
      const { success, data } = res.data;
      if (success) {
        setSetupStatus(data);

        // If setup is already completed, redirect to home
        if (data.status) {
          window.location.href = '/';
          return;
        }

        // 设置当前步骤 - 默认从数据库检查开始
        setCurrentStep(0);
      } else {
        showError(t('获取初始化状态失败'));
      }
    } catch (error) {
      console.error('Failed to fetch setup status:', error);
      showError(t('获取初始化状态失败'));
    }
  };

  const handleUsageModeChange = (e) => {
    const nextMode = e?.target?.value ?? e;
    setFormData((prev) => ({ ...prev, usageMode: nextMode }));
    // 同步到表单，便于 getValues() 拿到 usageMode
    if (formRef.current) {
      formRef.current.setValue('usageMode', nextMode);
    }
  };

  const next = () => {
    // 验证当前步骤是否可以继续
    if (!canProceedToNext()) {
      return;
    }

    const current = currentStep + 1;
    setCurrentStep(current);
  };

  // 验证是否可以继续到下一步
  const canProceedToNext = () => {
    switch (currentStep) {
      case 0: // 数据库检查步骤
        return true; // 数据库检查总是可以继续
      case 1: // 管理员账号步骤
        if (setupStatus.root_init) {
          return true; // 如果已经初始化，可以继续
        }
        // 检查必填字段
        if (
          !formData.username ||
          !formData.password ||
          !formData.confirmPassword
        ) {
          showError(t('请填写完整的管理员账号信息'));
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          showError(t('两次输入的密码不一致'));
          return false;
        }
        if (formData.password.length < 8) {
          showError(t('密码长度至少为8个字符'));
          return false;
        }
        return true;
      case 2: // 使用模式步骤
        if (!formData.usageMode) {
          showError(t('请选择使用模式'));
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const prev = () => {
    const current = currentStep - 1;
    setCurrentStep(current);
  };

  const onSubmit = () => {
    if (!formRef.current) {
      console.error('Form reference is null');
      showError(t('表单引用错误，请刷新页面重试'));
      return;
    }

    const values = formRef.current.getValues();

    // For root_init=false, validate admin username and password
    if (!setupStatus.root_init) {
      if (!values.username || !values.username.trim()) {
        showError(t('请输入管理员用户名'));
        return;
      }

      if (!values.password || values.password.length < 8) {
        showError(t('密码长度至少为8个字符'));
        return;
      }

      if (values.password !== values.confirmPassword) {
        showError(t('两次输入的密码不一致'));
        return;
      }
    }

    // Prepare submission data
    const formValues = { ...values };
    const usageMode = values.usageMode;
    formValues.SelfUseModeEnabled = usageMode === 'self';
    formValues.DemoSiteEnabled = usageMode === 'demo';

    // Remove usageMode as it's not needed by the backend
    delete formValues.usageMode;

    // 提交表单至后端
    setLoading(true);

    // Submit to backend
    API.post('/api/setup', formValues)
      .then((res) => {
        const { success, message } = res.data;

        if (success) {
          showNotice(t('系统初始化成功，正在跳转...'));
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          showError(message || t('初始化失败，请重试'));
        }
      })
      .catch((error) => {
        console.error('API error:', error);
        showError(t('系统初始化失败，请重试'));
        setLoading(false);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // 获取步骤内容
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <DatabaseStep setupStatus={setupStatus} t={t} />;
      case 1:
        return (
          <AdminStep
            setupStatus={setupStatus}
            formData={formData}
            setFormData={setFormData}
            formRef={formRef}
            t={t}
          />
        );
      case 2:
        return (
          <UsageModeStep
            formData={formData}
            handleUsageModeChange={handleUsageModeChange}
            t={t}
          />
        );
      case 3:
        return (
          <CompleteStep setupStatus={setupStatus} formData={formData} t={t} />
        );
      default:
        return null;
    }
  };

  const stepNavigationProps = {
    currentStep,
    steps,
    prev,
    next,
    onSubmit,
    loading,
    t,
  };

  return (
    <div
      className='min-h-screen flex items-center justify-center px-4 py-8'
      style={{ background: 'var(--bg-base)' }}
    >
      <div className='w-full max-w-xl'>
        {/* macOS Setup Assistant Card */}
        <div
          className='rounded-[var(--radius-lg)]'
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-float)',
            overflow: 'hidden',
          }}
        >
          {/* Header with title */}
          <div
            className='px-6 pt-6 pb-4 text-center'
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <h1
              className='text-xl font-semibold'
              style={{
                fontFamily: 'var(--font-serif)',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {t('系统初始化')}
            </h1>
            <p
              className='text-xs mt-1'
              style={{ color: 'var(--text-muted)', margin: 0 }}
            >
              {t('欢迎使用，请完成以下设置以开始使用系统')}
            </p>
          </div>

          {/* macOS-style step dots */}
          <div
            className='flex items-center justify-center gap-2 py-4 px-6'
            style={{ background: 'var(--bg-subtle)' }}
          >
            {steps.map((item, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              return (
                <div key={item.title} className='flex items-center gap-2'>
                  {index > 0 && (
                    <div
                      style={{
                        width: '24px',
                        height: '1px',
                        background: isCompleted
                          ? 'var(--accent)'
                          : 'var(--border-default)',
                        transition: 'background-color 150ms ease-out',
                      }}
                    />
                  )}
                  <div className='flex flex-col items-center gap-1'>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: isActive
                          ? 'var(--accent)'
                          : isCompleted
                            ? 'var(--accent)'
                            : 'var(--border-default)',
                        transition: 'background-color 150ms ease-out',
                        boxShadow: isActive
                          ? '0 0 0 3px rgba(0, 114, 255, 0.22)'
                          : 'none',
                      }}
                    />
                    <span
                      className='text-xs hidden sm:block'
                      style={{
                        color: isActive
                          ? 'var(--accent)'
                          : isCompleted
                            ? 'var(--text-primary)'
                            : 'var(--text-muted)',
                        fontWeight: isActive ? 600 : 400,
                        whiteSpace: 'nowrap',
                        transition: 'color 150ms ease-out',
                      }}
                    >
                      {item.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Form content area */}
          <div className='px-6 py-5'>
            <Form
              getFormApi={(formApi) => {
                formRef.current = formApi;
              }}
              initValues={formData}
            >
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  style={{
                    display: currentStep === idx ? 'block' : 'none',
                  }}
                >
                  {React.cloneElement(getStepContent(idx), {
                    ...stepNavigationProps,
                    renderNavigationButtons: () => (
                      <StepNavigation {...stepNavigationProps} />
                    ),
                  })}
                </div>
              ))}
            </Form>
          </div>
        </div>

        {/* Footer credit — subtle */}
        <p
          className='text-center mt-4 text-xs'
          style={{ color: 'var(--text-muted)' }}
        >
          {t('系统初始化')} — ChongYa
        </p>
      </div>
    </div>
  );
};

export default SetupWizard;
