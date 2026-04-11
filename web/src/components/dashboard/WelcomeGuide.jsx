import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@douyinfe/semi-ui';
import { StatusContext } from '../../context/Status';
import { Sparkles, Key, Terminal, ArrowRight, X, Copy, Check } from 'lucide-react';
import { copy } from '../../helpers';

const DISMISS_KEY = 'welcome_guide_dismissed';

const steps = (t, serverAddress) => [
  {
    icon: Sparkles,
    title: t('欢迎使用'),
    desc: t('您的账户已准备就绪。只需 3 步，即可开始使用 AI API。'),
    color: '#8b5cf6',
  },
  {
    icon: Key,
    title: t('创建 API Key'),
    desc: t('前往令牌管理页面，创建您的第一个 API Key。您可以为不同项目创建不同的 Key。'),
    action: '/console/token',
    actionLabel: t('前往创建'),
    color: '#3b82f6',
  },
  {
    icon: Terminal,
    title: t('发起第一次请求'),
    desc: t('复制下方地址，在您的代码或工具中配置 API Base URL，即可开始调用。'),
    code: serverAddress,
    color: '#10b981',
  },
];

const WelcomeGuide = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusState] = useContext(StatusContext);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);

  const serverAddress = (() => {
    const fromBackend = statusState?.status?.server_address || '';
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(fromBackend);
    if (fromBackend && !isLocal) return fromBackend;
    return window.location.origin;
  })();

  useEffect(() => {
    if (!localStorage.getItem(DISMISS_KEY)) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  const handleCopy = async () => {
    const ok = await copy(serverAddress + '/v1');
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (!visible) return null;

  const stepsData = steps(t, serverAddress);
  const current = stepsData[step];
  const Icon = current.icon;
  const isLast = step === stepsData.length - 1;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          animation: 'fadeIn 200ms ease',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(440px, calc(100vw - 32px))',
          background: 'var(--surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 0,
          zIndex: 10000,
          overflow: 'hidden',
          animation: 'slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Close */}
        <button
          onClick={dismiss}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 'var(--radius-sm)',
            zIndex: 1,
          }}
        >
          <X size={16} />
        </button>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 4, padding: '16px 24px 0' }}>
          {stepsData.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: i <= step ? 'var(--accent-gradient)' : 'var(--border-default)',
                transition: 'background 300ms ease',
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-lg)',
              background: `${current.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Icon size={26} style={{ color: current.color }} />
          </div>

          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
            {current.title}
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
            {current.desc}
          </p>

          {/* Code block for step 3 */}
          {current.code && (
            <div
              onClick={handleCopy}
              style={{
                marginTop: 16,
                padding: '10px 14px',
                background: 'var(--bg-base)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {serverAddress}/v1
              </span>
              {copied
                ? <Check size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                : <Copy size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: '20px 24px 24px', display: 'flex', gap: 10, justifyContent: 'center' }}>
          {step > 0 && (
            <Button
              theme='borderless'
              onClick={() => setStep(step - 1)}
              style={{ color: 'var(--text-secondary)', padding: '0 16px' }}
            >
              {t('上一步')}
            </Button>
          )}
          {current.action && (
            <Button
              onClick={() => { dismiss(); navigate(current.action); }}
              style={{
                borderRadius: 'var(--radius-md)',
                padding: '0 20px',
                background: 'var(--accent-gradient)',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
              }}
            >
              {current.actionLabel} <ArrowRight size={14} style={{ marginLeft: 4 }} />
            </Button>
          )}
          {!isLast ? (
            <Button
              theme='solid'
              type='primary'
              onClick={() => setStep(step + 1)}
              style={{
                borderRadius: 'var(--radius-md)',
                padding: '0 24px',
                background: 'var(--accent-gradient)',
                border: 'none',
                fontWeight: 600,
              }}
            >
              {t('下一步')} <ArrowRight size={14} style={{ marginLeft: 4 }} />
            </Button>
          ) : (
            <Button
              theme='solid'
              type='primary'
              onClick={dismiss}
              style={{
                borderRadius: 'var(--radius-md)',
                padding: '0 24px',
                background: 'var(--accent-gradient)',
                border: 'none',
                fontWeight: 600,
              }}
            >
              {t('开始使用')}
            </Button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, -45%); } to { opacity: 1; transform: translate(-50%, -50%); } }
      `}</style>
    </>,
    document.body
  );
};

export default WelcomeGuide;
