import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './PaymentSuccessModal.css';

const PaymentSuccessModal = ({
  visible,
  onClose,
  amountLabel,
  onViewDetails,
  onGetStarted,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!visible) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, onClose]);

  if (!visible) return null;

  return createPortal(
    <div
      className='ps-scrim'
      role='dialog'
      aria-modal='true'
      aria-labelledby='ps-title'
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className='ps-panel'>
        <button className='ps-x-btn' onClick={onClose} aria-label={t('关闭')}>
          <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.2'
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden='true'
          >
            <path d='M18 6 6 18' />
            <path d='m6 6 12 12' />
          </svg>
        </button>

        <header className='ps-hero'>
          <div className='ps-confetti' aria-hidden='true'>
            <i /><i /><i /><i /><i /><i /><i /><i />
          </div>

          <div className='ps-check-wrap' aria-hidden='true'>
            <div className='ps-check-circle'>
              <svg
                width='34'
                height='34'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='3'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M5 12.5l4.5 4.5L19 7.5' />
              </svg>
            </div>
          </div>

          <h1 id='ps-title'>{t('充值成功')}</h1>
          <p className='ps-lead'>
            {t('余额已到账')}
            {amountLabel ? (
              <>
                {' · '}
                <span className='ps-amt'>+{amountLabel}</span>
              </>
            ) : null}
          </p>
        </header>

        <div className='ps-body'>
          <div className='ps-tip'>
            <p>
              {t(
                '你可以随时在「余额明细」和「用量明细」中查看充值记录、调用记录与扣费明细。',
              )}
            </p>
            <p>
              {t(
                '如果你是首次使用，建议先完成一次测试调用，再接入正式项目。',
              )}
            </p>
          </div>
        </div>

        <footer className='ps-foot'>
          <button
            className='ps-btn ps-btn-ghost'
            type='button'
            onClick={onViewDetails}
          >
            {t('查看明细')}
          </button>
          <button
            className='ps-btn ps-btn-primary'
            type='button'
            onClick={onGetStarted}
          >
            {t('开始使用')}
            <svg
              width='14'
              height='14'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.4'
              strokeLinecap='round'
              strokeLinejoin='round'
              aria-hidden='true'
            >
              <path d='M5 12h14' />
              <path d='m13 5 7 7-7 7' />
            </svg>
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
};

export default PaymentSuccessModal;
