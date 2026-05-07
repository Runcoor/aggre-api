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

import React, { useEffect, useMemo, useState } from 'react';
import { Banner, Modal } from '@douyinfe/semi-ui';
import {
  Crown,
  Clock,
  Package,
  TrendingUp,
  Lock,
  X,
  Check,
  ArrowRight,
  CreditCard,
} from 'lucide-react';
import {
  SiStripe,
  SiWechat,
  SiAlipay,
  SiBitcoin,
} from 'react-icons/si';
import { getCurrencyConfig } from '../../../helpers/render';
import {
  formatSubscriptionDuration,
  formatSubscriptionResetPeriod,
} from '../../../helpers/subscriptionFormat';

const SPM_STYLES = `
.spm-modal .semi-modal{border-radius:24px;overflow:hidden;
  box-shadow:0 1px 0 rgba(255,255,255,.6) inset,
    0 30px 80px -30px rgba(11,21,48,.30),
    0 8px 20px -10px rgba(11,21,48,.10);}
.spm-modal .semi-modal-content{border-radius:24px;background:var(--surface)}
.spm-modal .semi-modal-body{padding:0}
html.dark .spm-modal .semi-modal{
  box-shadow:0 1px 0 rgba(255,255,255,.04) inset,
    0 30px 80px -30px rgba(0,0,0,.7),
    0 8px 20px -10px rgba(0,0,0,.5);}

.spm-root{font-family:'Inter','PingFang SC','Hiragino Sans GB','Microsoft YaHei',system-ui,sans-serif;
  -webkit-font-smoothing:antialiased;color:var(--text-primary)}
.spm-mono{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,Consolas,monospace;
  font-variant-numeric:tabular-nums}

/* ===== header ===== */
.spm-head{display:flex;align-items:center;justify-content:space-between;
  padding:16px 22px 12px;position:relative}
.spm-head-l{display:flex;align-items:center;gap:12px}
.spm-crown{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;
  color:#fff;background:var(--accent-gradient);
  box-shadow:0 8px 20px -8px rgba(0,114,255,.55), inset 0 1px 0 rgba(255,255,255,.35)}
.spm-head h2{margin:0;font-size:16.5px;font-weight:700;letter-spacing:-.005em;
  color:var(--text-primary)}
.spm-head .spm-sub{margin:1px 0 0;font-size:11.5px;color:var(--text-secondary);
  font-weight:500;letter-spacing:.02em}
.spm-x{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;
  color:var(--text-secondary);background:transparent;border:1px solid transparent;
  cursor:pointer;transition:.15s}
.spm-x:hover{background:var(--bg-subtle);color:var(--text-primary);
  border-color:var(--border-subtle)}

/* ===== plan card ===== */
.spm-plan{margin:2px 18px 0;padding:14px 16px 12px;border-radius:16px;
  background:linear-gradient(180deg,#f7faff 0%,#fff 100%);
  border:1px solid var(--border-subtle);position:relative;overflow:hidden}
html.dark .spm-plan{
  background:linear-gradient(180deg,
    color-mix(in srgb, #0072ff 10%, var(--surface)) 0%,
    var(--surface) 100%)}
.spm-plan::before{content:"";position:absolute;width:240px;height:240px;border-radius:50%;
  background:radial-gradient(circle,rgba(0,198,255,.18),transparent 60%);
  right:-80px;top:-110px;pointer-events:none}
.spm-plan-top{display:flex;align-items:flex-start;justify-content:space-between;
  gap:14px;position:relative;z-index:1}
.spm-plan-name{display:flex;flex-direction:column;gap:6px;min-width:0;flex:1}
.spm-pill{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;
  font-size:10.5px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;
  padding:4px 9px;border-radius:99px;color:#0072ff;
  background:linear-gradient(135deg,rgba(0,114,255,.10),rgba(0,198,255,.10));
  border:1px solid rgba(0,114,255,.18);white-space:nowrap}
.spm-pill i{width:5px;height:5px;border-radius:50%;background:var(--accent-gradient)}
.spm-nm{font-size:19px;font-weight:700;letter-spacing:-.01em;line-height:1.2;
  color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.spm-price{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0}
.spm-now{font-family:'JetBrains Mono','SF Mono',ui-monospace,monospace;
  font-size:32px;font-weight:700;letter-spacing:-.02em;line-height:1;
  background:var(--accent-gradient);-webkit-background-clip:text;background-clip:text;
  color:transparent;font-variant-numeric:tabular-nums}
.spm-now .cur{font-size:16px;vertical-align:top;margin-right:1px;font-weight:600}
.spm-was{font-family:'JetBrains Mono','SF Mono',ui-monospace,monospace;font-size:12px;
  color:var(--text-muted);text-decoration:line-through;font-variant-numeric:tabular-nums}
.spm-save{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:#15803d;background:rgba(22,163,74,.10);padding:2px 7px;border-radius:99px;margin-top:2px}
html.dark .spm-save{color:#4ade80;background:rgba(74,222,128,.14)}

.spm-specs{margin-top:10px;padding-top:10px;border-top:1px dashed var(--border-subtle);
  display:flex;flex-direction:column;position:relative;z-index:1}
.spm-spec{display:grid;grid-template-columns:90px 1fr;align-items:center;
  padding:5px 0;gap:14px}
.spm-spec:first-child{padding-top:0}
.spm-spec:last-child{padding-bottom:0}
.spm-spec .k{font-size:12px;font-weight:500;color:var(--text-secondary);
  display:inline-flex;align-items:center;gap:6px}
.spm-spec .k svg{flex-shrink:0;opacity:.7}
.spm-spec .v{font-size:13px;font-weight:600;color:var(--text-primary);letter-spacing:-.005em;
  text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.spm-spec .v .dim{color:var(--text-secondary);font-weight:500;margin-left:4px}

/* ===== payment ===== */
.spm-paysec{padding:14px 22px 4px}
.spm-lbl{font-size:11px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;
  color:var(--text-secondary);margin-bottom:10px;
  display:flex;align-items:center;justify-content:space-between}
.spm-secure{display:inline-flex;align-items:center;gap:5px;
  color:#16a34a;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:none}
html.dark .spm-secure{color:#4ade80}

.spm-pay-opts{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.spm-pay-opts .spm-pay--full{grid-column:1 / -1}
.spm-pay{position:relative;padding:9px 12px 9px 14px;border:1.5px solid var(--border-subtle);
  border-radius:12px;background:var(--surface);cursor:pointer;
  transition:.18s cubic-bezier(.2,.8,.2,1);display:flex;align-items:center;gap:12px;
  min-width:0}
.spm-pay:hover{border-color:rgba(0,114,255,.30);background:var(--bg-subtle)}
html.dark .spm-pay:hover{border-color:rgba(0,198,255,.35)}
.spm-glyph{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;
  flex-shrink:0;background:var(--bg-subtle);color:var(--text-primary)}
.spm-glyph.g-wx{background:linear-gradient(135deg,#dcfce7,#bbf7d0);color:#07C160}
.spm-glyph.g-alipay{background:linear-gradient(135deg,#dbeafe,#bfdbfe);color:#1677FF}
.spm-glyph.g-crypto{background:linear-gradient(135deg,#fef3c7,#fde68a);color:#F7931A}
.spm-glyph.g-card{background:linear-gradient(135deg,#dbeafe,#bfdbfe);color:#1d4ed8}
.spm-glyph.g-stripe{background:linear-gradient(135deg,#ede9fe,#ddd6fe);color:#635BFF}
html.dark .spm-glyph.g-wx{background:rgba(7,193,96,.15)}
html.dark .spm-glyph.g-alipay{background:rgba(22,119,255,.18)}
html.dark .spm-glyph.g-crypto{background:rgba(247,147,26,.16);color:#F7B96B}
html.dark .spm-glyph.g-card{background:rgba(29,78,216,.20);color:#60a5fa}
html.dark .spm-glyph.g-stripe{background:rgba(99,91,255,.18);color:#a89bff}

.spm-pay-txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.spm-pay-nm{font-size:13.5px;font-weight:600;color:var(--text-primary);line-height:1.15;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.spm-pay-meta{font-size:11px;color:var(--text-secondary);font-weight:500;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.spm-check{flex-shrink:0;width:20px;height:20px;border-radius:50%;
  border:1.5px solid var(--border-subtle);background:var(--surface);
  display:grid;place-items:center;transition:.15s}
.spm-check svg{opacity:0;transform:scale(.6);transition:.15s;color:#fff}
.spm-pay--selected{border-color:#0072ff;
  background:linear-gradient(180deg,rgba(0,114,255,.04),rgba(0,198,255,.04));
  box-shadow:0 0 0 3px rgba(0,114,255,.10)}
html.dark .spm-pay--selected{
  background:linear-gradient(180deg,rgba(0,114,255,.08),rgba(0,198,255,.08));
  box-shadow:0 0 0 3px rgba(0,114,255,.18)}
.spm-pay--selected .spm-check{background:var(--accent-gradient);border-color:transparent;
  box-shadow:0 6px 14px -6px rgba(0,114,255,.55)}
.spm-pay--selected .spm-check svg{opacity:1;transform:scale(1)}

.spm-banner-wrap{padding:10px 22px 0}

/* ===== footer ===== */
.spm-foot{margin-top:12px;padding:12px 22px 14px;display:flex;align-items:center;
  justify-content:space-between;gap:14px;border-top:1px solid var(--border-subtle);
  background:transparent}
.spm-total{display:flex;flex-direction:column;gap:2px}
.spm-total .l{font-size:10.5px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;
  color:var(--text-secondary)}
.spm-total .v{font-family:'JetBrains Mono','SF Mono',ui-monospace,monospace;
  font-size:22px;font-weight:700;letter-spacing:-.01em;line-height:1;
  font-variant-numeric:tabular-nums}
.spm-total .v .cur{font-size:13px;color:var(--text-secondary);font-weight:600;margin-right:2px}
.spm-total .em{background:var(--accent-gradient);-webkit-background-clip:text;
  background-clip:text;color:transparent}
.spm-btn-pay{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;
  border-radius:12px;border:none;background:var(--accent-gradient);color:#fff;
  font-family:inherit;font-size:14px;font-weight:700;letter-spacing:.01em;cursor:pointer;
  box-shadow:0 1px 0 rgba(255,255,255,.35) inset,
    0 12px 24px -10px rgba(0,114,255,.55),
    0 2px 4px rgba(11,21,48,.10);
  transition:transform .15s, box-shadow .15s, filter .15s;
  position:relative;overflow:hidden}
.spm-btn-pay::after{content:"";position:absolute;inset:0;
  background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,.25) 50%,transparent 70%);
  transform:translateX(-100%);transition:.5s}
.spm-btn-pay:hover:not(:disabled){transform:translateY(-1px);
  box-shadow:0 1px 0 rgba(255,255,255,.4) inset,
    0 16px 30px -10px rgba(0,114,255,.65),
    0 2px 4px rgba(11,21,48,.10)}
.spm-btn-pay:hover:not(:disabled)::after{transform:translateX(100%)}
.spm-btn-pay:active:not(:disabled){transform:translateY(0)}
.spm-btn-pay:disabled{opacity:.55;cursor:not-allowed;filter:grayscale(.4)}

.spm-fine{padding:8px 22px 16px;margin:0;font-size:11px;color:var(--text-secondary);
  line-height:1.55;text-align:center}
.spm-fine a{color:#0072ff;text-decoration:none;font-weight:600}
.spm-fine a:hover{text-decoration:underline}

@media (max-width:520px){
  .spm-pay-opts{grid-template-columns:1fr}
  .spm-now{font-size:28px}
}
`;

// Build a unified payment options array. Preserves existing prop contract:
// epay options drive selectedEpayMethod (kept in sync with internal selection).
const buildPaymentOptions = ({
  hasStripe,
  hasCreem,
  epayMethods = [],
  t,
}) => {
  const opts = [];
  if (hasStripe) {
    opts.push({
      key: 'stripe',
      glyphClass: 'g-stripe',
      icon: <SiStripe size={18} />,
      name: 'Stripe',
      meta: 'Visa · Mastercard · AmEx',
    });
  }
  if (hasCreem) {
    opts.push({
      key: 'creem',
      glyphClass: 'g-card',
      icon: <CreditCard size={18} strokeWidth={1.8} />,
      name: 'Creem',
      meta: t('信用卡 / 全球支付'),
    });
  }
  for (const m of epayMethods) {
    const type = m.type;
    const name = (m.name || '').toLowerCase();
    if (type === 'nowpayments') {
      opts.push({
        key: 'epay:' + type,
        glyphClass: 'g-crypto',
        icon: <SiBitcoin size={18} />,
        name: t('加密货币支付'),
        meta: 'USDT · USDC',
      });
    } else if (type === 'dodopayments') {
      opts.push({
        key: 'epay:' + type,
        glyphClass: 'g-card',
        icon: <CreditCard size={18} strokeWidth={1.8} />,
        name: t('信用卡 / 全球支付'),
        meta: 'Visa · Mastercard · AmEx · WeChat',
      });
    } else if (type.includes('wxpay') || type === 'wechat' || name.includes('微信')) {
      opts.push({
        key: 'epay:' + type,
        glyphClass: 'g-wx',
        icon: <SiWechat size={20} />,
        name: t('微信支付'),
        meta: t('扫码即时到账'),
      });
    } else if (type.includes('alipay') || name.includes('支付宝')) {
      opts.push({
        key: 'epay:' + type,
        glyphClass: 'g-alipay',
        icon: <SiAlipay size={20} />,
        name: t('支付宝'),
        meta: t('扫码即时到账'),
      });
    } else {
      opts.push({
        key: 'epay:' + type,
        glyphClass: 'g-card',
        icon: <CreditCard size={18} strokeWidth={1.8} />,
        name: m.name || type,
        meta: '',
      });
    }
  }
  return opts;
};

const SubscriptionPurchaseModal = ({
  t,
  visible,
  onCancel,
  selectedPlan,
  paying,
  selectedEpayMethod,
  setSelectedEpayMethod,
  epayMethods = [],
  enableOnlineTopUp = false,
  enableStripeTopUp = false,
  enableCreemTopUp = false,
  purchaseLimitInfo = null,
  onPayStripe,
  onPayCreem,
  onPayEpay,
  onPayNowPayments,
  onPayDodoPayments,
}) => {
  const plan = selectedPlan?.plan;
  const { symbol, rate } = getCurrencyConfig();
  const price = plan ? Number(plan.price_amount || 0) : 0;
  const convertedPrice = price * rate;
  const displayPrice = convertedPrice.toFixed(
    Number.isInteger(convertedPrice) ? 0 : 2,
  );
  const originalPrice = plan ? Number(plan.original_price_amount || 0) : 0;
  const hasOriginalPrice = originalPrice > 0 && originalPrice !== price;
  const convertedOriginalPrice = originalPrice * rate;
  const displayOriginalPrice = convertedOriginalPrice.toFixed(
    Number.isInteger(convertedOriginalPrice) ? 0 : 2,
  );
  const savings = hasOriginalPrice
    ? (convertedOriginalPrice - convertedPrice).toFixed(
        Number.isInteger(convertedOriginalPrice - convertedPrice) ? 0 : 2,
      )
    : null;
  const discountPct = hasOriginalPrice
    ? Math.round((1 - price / originalPrice) * 100)
    : 0;

  const hasStripe = enableStripeTopUp && !!plan?.stripe_price_id;
  const hasCreem = enableCreemTopUp && !!plan?.creem_product_id;
  const hasEpay = enableOnlineTopUp && epayMethods.length > 0;
  const hasAnyPayment = hasStripe || hasCreem || hasEpay;

  const purchaseLimit = Number(purchaseLimitInfo?.limit || 0);
  const purchaseCount = Number(purchaseLimitInfo?.count || 0);
  const purchaseLimitReached =
    purchaseLimit > 0 && purchaseCount >= purchaseLimit;

  const options = useMemo(
    () =>
      buildPaymentOptions({
        hasStripe,
        hasCreem,
        epayMethods: hasEpay ? epayMethods : [],
        t,
      }),
    [hasStripe, hasCreem, hasEpay, epayMethods, t],
  );

  const [internalSelected, setInternalSelected] = useState(null);

  // Auto-pick first option when modal opens or options change
  useEffect(() => {
    if (!visible) return;
    if (options.length === 0) {
      setInternalSelected(null);
      return;
    }
    if (!internalSelected || !options.find((o) => o.key === internalSelected)) {
      setInternalSelected(options[0].key);
    }
  }, [visible, options, internalSelected]);

  // Sync external selectedEpayMethod when an epay option is chosen (back-compat)
  useEffect(() => {
    if (!internalSelected) return;
    if (internalSelected.startsWith('epay:')) {
      const type = internalSelected.slice(5);
      if (type !== selectedEpayMethod) setSelectedEpayMethod?.(type);
    }
  }, [internalSelected, selectedEpayMethod, setSelectedEpayMethod]);

  const handleConfirm = () => {
    if (!internalSelected || paying || purchaseLimitReached) return;
    if (internalSelected === 'stripe') return onPayStripe?.();
    if (internalSelected === 'creem') return onPayCreem?.();
    if (internalSelected === 'epay:nowpayments') return onPayNowPayments?.();
    if (internalSelected === 'epay:dodopayments') return onPayDodoPayments?.();
    if (internalSelected.startsWith('epay:')) return onPayEpay?.();
  };

  // Pill content: tier label + (optional) discount badge
  const tierLabel = (plan?.upgrade_group || t('订阅套餐')).toString().toUpperCase();
  const pillText =
    discountPct > 0
      ? `${tierLabel} · ${t('限时')} ${discountPct}% OFF`
      : tierLabel;

  const resetPeriodLabel = plan ? formatSubscriptionResetPeriod(plan, t) : '';
  const showResetPeriod =
    plan && resetPeriodLabel && resetPeriodLabel !== t('不重置');

  return (
    <Modal
      visible={visible}
      onCancel={onCancel}
      header={null}
      footer={null}
      closable={false}
      width={460}
      bodyStyle={{ padding: 0 }}
      centered
      maskClosable
      className='spm-modal'
    >
      <style>{SPM_STYLES}</style>
      {plan ? (
        <div className='spm-root'>
          {/* header */}
          <header className='spm-head'>
            <div className='spm-head-l'>
              <div className='spm-crown' aria-hidden='true'>
                <Crown size={20} strokeWidth={1.8} />
              </div>
              <div>
                <h2>{t('购买订阅套餐')}</h2>
                <p className='spm-sub'>{t('确认订单详情后完成支付')}</p>
              </div>
            </div>
            <button
              type='button'
              className='spm-x'
              aria-label={t('关闭')}
              onClick={onCancel}
            >
              <X size={16} strokeWidth={2} />
            </button>
          </header>

          {/* plan card */}
          <section className='spm-plan'>
            <div className='spm-plan-top'>
              <div className='spm-plan-name'>
                <span className='spm-pill'>
                  <i />
                  {pillText}
                </span>
                <div className='spm-nm' title={plan.title}>
                  {plan.title}
                </div>
              </div>
              <div className='spm-price'>
                <div className='spm-now'>
                  <span className='cur'>{symbol}</span>
                  {displayPrice}
                </div>
                {hasOriginalPrice && (
                  <>
                    <div className='spm-was'>
                      {symbol}
                      {displayOriginalPrice}
                    </div>
                    <div className='spm-save'>
                      {t('省')} {symbol}
                      {savings}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className='spm-specs'>
              <div className='spm-spec'>
                <span className='k'>
                  <Clock size={12} strokeWidth={2} />
                  {t('有效期')}
                </span>
                <span className='v'>
                  {formatSubscriptionDuration(plan, t)}
                  {showResetPeriod && (
                    <span className='dim'>· {resetPeriodLabel}</span>
                  )}
                </span>
              </div>
              {plan?.quota_description ? (
                <div className='spm-spec'>
                  <span className='k'>
                    <Package size={12} strokeWidth={2} />
                    {t('总额度')}
                  </span>
                  <span className='v'>{plan.quota_description}</span>
                </div>
              ) : null}
              {plan?.upgrade_group ? (
                <div className='spm-spec'>
                  <span className='k'>
                    <TrendingUp size={12} strokeWidth={2} />
                    {t('升级分组')}
                  </span>
                  <span className='v'>{plan.upgrade_group}</span>
                </div>
              ) : null}
            </div>
          </section>

          {/* purchase limit warning */}
          {purchaseLimitReached && (
            <div className='spm-banner-wrap'>
              <Banner
                type='warning'
                description={`${t('已达到购买上限')} (${purchaseCount}/${purchaseLimit})`}
                style={{ borderRadius: 'var(--radius-lg)' }}
                closeIcon={null}
              />
            </div>
          )}

          {/* payment methods */}
          <section className='spm-paysec'>
            <div className='spm-lbl'>
              <span>{t('支付方式')}</span>
              <span className='spm-secure'>
                <Lock size={11} strokeWidth={2.4} />
                {t('SSL 加密')}
              </span>
            </div>
            {hasAnyPayment ? (
              <div className='spm-pay-opts'>
                {options.map((opt, idx) => {
                  const selected = internalSelected === opt.key;
                  const fullSpan =
                    options.length % 2 === 1 && idx === options.length - 1;
                  return (
                    <button
                      type='button'
                      key={opt.key}
                      className={[
                        'spm-pay',
                        selected ? 'spm-pay--selected' : '',
                        fullSpan ? 'spm-pay--full' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setInternalSelected(opt.key)}
                      disabled={purchaseLimitReached}
                    >
                      <div className={`spm-glyph ${opt.glyphClass}`} aria-hidden='true'>
                        {opt.icon}
                      </div>
                      <div className='spm-pay-txt'>
                        <div className='spm-pay-nm'>{opt.name}</div>
                        {opt.meta && <div className='spm-pay-meta'>{opt.meta}</div>}
                      </div>
                      <span className='spm-check'>
                        <Check size={11} strokeWidth={3.5} />
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <Banner
                type='info'
                description={t('管理员未开启在线支付功能，请联系管理员配置。')}
                style={{ borderRadius: 'var(--radius-lg)' }}
                closeIcon={null}
              />
            )}
          </section>

          {/* footer */}
          <footer className='spm-foot'>
            <div className='spm-total'>
              <span className='l'>{t('应付金额')}</span>
              <span className='v spm-mono'>
                <span className='cur'>{symbol}</span>
                <span className='em'>{displayPrice}</span>
              </span>
            </div>
            <button
              type='button'
              className='spm-btn-pay'
              onClick={handleConfirm}
              disabled={
                paying ||
                !hasAnyPayment ||
                !internalSelected ||
                purchaseLimitReached
              }
            >
              {paying ? t('处理中...') : t('确认支付')}
              {!paying && <ArrowRight size={14} strokeWidth={2.4} />}
            </button>
          </footer>

          <p className='spm-fine'>
            {t('点击确认支付即代表您同意')}{' '}
            <a href='/terms-of-service' target='_blank' rel='noreferrer'>
              {t('服务条款')}
            </a>
            。
          </p>
        </div>
      ) : null}
    </Modal>
  );
};

export default SubscriptionPurchaseModal;
