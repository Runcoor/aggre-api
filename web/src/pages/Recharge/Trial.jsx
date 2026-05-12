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

import React, { useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Skeleton, Tooltip } from '@douyinfe/semi-ui';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Info,
  PiggyBank,
  HelpCircle,
  ListChecks,
  Search,
  Zap,
} from 'lucide-react';
import {
  API,
  showError,
  renderQuotaWithAmount,
} from '../../helpers';
import { UserContext } from '../../context/User';
import { StatusContext } from '../../context/Status';
import PaymentConfirmModal from '../../components/topup/modals/PaymentConfirmModal';

/* ─── Theme-aware styles (.tpkg scope, light defaults, dark overrides) ─── */
const STYLES = `
.tpkg {
  --tpkg-line:        var(--border-default);
  --tpkg-soft:        var(--surface-active);
  --tpkg-ink:         var(--text-primary);
  --tpkg-ink-2:       var(--text-secondary);
  --tpkg-muted:       var(--text-secondary);
  --tpkg-muted-2:     var(--text-muted);
  --tpkg-brand-grad:  var(--accent-gradient);
  --tpkg-brand-soft:  linear-gradient(135deg, rgba(0,114,255,0.08), rgba(0,198,255,0.08));
  --tpkg-grid:        rgba(0,114,255,0.06);
  --tpkg-card-bg:     var(--surface);
  --tpkg-card-shadow:
    0 1px 0 rgba(255,255,255,0.6) inset,
    0 30px 80px -30px rgba(11,21,48,0.25),
    0 10px 24px -12px rgba(11,21,48,0.10);
  --tpkg-pay-shadow:
    0 14px 28px -10px rgba(0,114,255,0.55),
    inset 0 1px 0 rgba(255,255,255,0.30);
  --tpkg-blob-a:      #00c6ff;
  --tpkg-blob-b:      #0072ff;
}
html.dark .tpkg {
  --tpkg-line:        rgba(255,255,255,0.08);
  --tpkg-soft:        rgba(255,255,255,0.05);
  --tpkg-grid:        rgba(56,182,255,0.10);
  --tpkg-card-bg:     var(--surface);
  --tpkg-card-shadow:
    0 1px 0 rgba(255,255,255,0.04) inset,
    0 30px 80px -30px rgba(0,0,0,0.55),
    0 10px 24px -12px rgba(0,0,0,0.40);
  --tpkg-pay-shadow:
    0 14px 28px -10px rgba(0,114,255,0.55),
    inset 0 1px 0 rgba(255,255,255,0.18);
  --tpkg-blob-a:      #38b6ff;
  --tpkg-blob-b:      #1a85ff;
}

@keyframes tpkg-fade-up { from {opacity:0; transform:translateY(8px)} to {opacity:1; transform:translateY(0)} }
@keyframes tpkg-rise    { from {opacity:0; transform:translateY(16px) scale(.98)} to {opacity:1; transform:translateY(0) scale(1)} }
@keyframes tpkg-slide-in{ from {opacity:0; transform:translateX(-6px)} to {opacity:1; transform:translateX(0)} }
@keyframes tpkg-dot     { 0%,100%{box-shadow:0 0 0 0 rgba(0,114,255,.5)} 50%{box-shadow:0 0 0 5px rgba(0,114,255,0)} }
@keyframes tpkg-sweep   { 0%,100% {left:-80%} 50% {left:120%} }
@keyframes tpkg-drift   { 0%,100% {transform:translate(0,0)} 50% {transform:translate(-16px,10px)} }

.tpkg-back-row { margin-bottom:18px; }
.tpkg-back {
  display:inline-flex; align-items:center; gap:6px;
  padding:7px 12px; border-radius:10px;
  background: transparent; border:1px solid var(--tpkg-line);
  color: var(--tpkg-ink-2); font:inherit; font-size:12.5px; font-weight:600;
  cursor:pointer; transition:.18s;
}
.tpkg-back:hover { color: var(--accent); border-color: rgba(0,114,255,.35); background: var(--tpkg-brand-soft); }

.tpkg-eyebrow {
  display:inline-flex; align-items:center; gap:8px;
  padding:5px 11px; border-radius:99px;
  background: var(--surface); border:1px solid var(--tpkg-line);
  font-size:11px; font-weight:700; color: var(--accent);
  letter-spacing:.10em; text-transform:uppercase;
  animation: tpkg-fade-up .5s cubic-bezier(.2,.9,.25,1.2) both;
}
.tpkg-eyebrow i { width:6px; height:6px; border-radius:50%; background: var(--accent);
  box-shadow:0 0 0 0 rgba(0,114,255,.5); animation: tpkg-dot 1.8s ease-in-out infinite; }

.tpkg-title { margin:14px 0 8px; font-size:30px; font-weight:800; letter-spacing:-.02em;
  color: var(--tpkg-ink);
  animation: tpkg-fade-up .5s cubic-bezier(.2,.9,.25,1.2) .05s both; }
.tpkg-kicker { margin:0 0 24px; font-size:14px; color: var(--tpkg-muted); line-height:1.6; max-width:560px;
  animation: tpkg-fade-up .5s cubic-bezier(.2,.9,.25,1.2) .1s both; }

/* hero card */
.tpkg-card { position:relative; border-radius:24px; border:1px solid var(--tpkg-line);
  background: var(--tpkg-card-bg); overflow:hidden;
  box-shadow: var(--tpkg-card-shadow);
  animation: tpkg-rise .55s cubic-bezier(.2,.9,.25,1.2) .15s both; }
.tpkg-grid-bg { position:absolute; inset:0; opacity:.5; pointer-events:none;
  background-image:
    linear-gradient(var(--tpkg-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--tpkg-grid) 1px, transparent 1px);
  background-size:32px 32px;
  -webkit-mask-image: radial-gradient(620px 280px at 70% 0%, #000 30%, transparent 80%);
  mask-image: radial-gradient(620px 280px at 70% 0%, #000 30%, transparent 80%); }
.tpkg-blob { position:absolute; border-radius:50%; filter:blur(40px); opacity:.40; pointer-events:none; }
.tpkg-blob.b1 { top:-50px; right:-30px; width:240px; height:240px; background: var(--tpkg-blob-a);
  animation: tpkg-drift 9s ease-in-out infinite; }
.tpkg-blob.b2 { bottom:-60px; left:30%; width:200px; height:200px; background: var(--tpkg-blob-b);
  animation: tpkg-drift 11s ease-in-out infinite reverse; }

.tpkg-inner { position:relative; z-index:1; padding:30px 32px 28px;
  display:grid; grid-template-columns:1.1fr .9fr; gap:32px; }

.tpkg-left h3 { margin:0; font-size:22px; font-weight:800; letter-spacing:-.01em;
  color: var(--tpkg-ink); display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.tpkg-ribbon { display:inline-flex; align-items:center; gap:5px;
  padding:3px 9px; border-radius:7px;
  background: var(--tpkg-brand-grad); color:#fff;
  font-size:10.5px; font-weight:800; letter-spacing:.10em;
  box-shadow: 0 6px 14px -6px rgba(0,114,255,.55); }
.tpkg-sub { margin:8px 0 18px; font-size:13.5px; color: var(--tpkg-muted); line-height:1.65; }

.tpkg-price { display:flex; align-items:baseline; gap:10px; margin-bottom:18px;
  padding:14px 16px; border-radius:14px;
  background: var(--tpkg-brand-soft); border:1px solid rgba(0,114,255,.14); }
.tpkg-price .cur { font-family: var(--font-mono); font-size:18px; font-weight:700;
  color: var(--accent); align-self:flex-start; margin-top:8px; }
.tpkg-price .num { font-family: var(--font-mono); font-size:52px; font-weight:800;
  line-height:1; letter-spacing:-.02em;
  background: var(--tpkg-brand-grad); -webkit-background-clip:text; background-clip:text; color:transparent; }
.tpkg-price .eq { font-size:12.5px; font-weight:600; color: var(--tpkg-ink-2);
  margin-left:auto; text-align:right; line-height:1.4; }
.tpkg-price .eq b { display:block; color: var(--accent); font-family: var(--font-mono);
  font-size:16px; font-weight:800; margin-top:2px; }

.tpkg-list-title { font-size:11px; font-weight:700; color: var(--tpkg-muted);
  letter-spacing:.12em; text-transform:uppercase; margin:0 0 10px; }
.tpkg-list { margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:8px; }
.tpkg-list li { display:flex; align-items:center; gap:10px;
  font-size:13px; color: var(--tpkg-ink-2);
  animation: tpkg-slide-in .5s cubic-bezier(.2,.9,.25,1.2) both; }
.tpkg-list li:nth-child(1){ animation-delay:.25s; }
.tpkg-list li:nth-child(2){ animation-delay:.30s; }
.tpkg-list li:nth-child(3){ animation-delay:.35s; }
.tpkg-list li:nth-child(4){ animation-delay:.40s; }
.tpkg-list li:nth-child(5){ animation-delay:.45s; }
.tpkg-list li .dot { width:18px; height:18px; border-radius:50%; flex-shrink:0;
  background: var(--tpkg-brand-soft); color: var(--accent);
  display:grid; place-items:center;
  border:1px solid rgba(0,114,255,.18); }
.tpkg-list li b { color: var(--tpkg-ink); font-weight:700; }

.tpkg-right { display:flex; flex-direction:column; gap:14px; }
.tpkg-tags { display:flex; flex-wrap:wrap; gap:6px; }
.tpkg-tag { display:inline-flex; align-items:center; gap:5px;
  padding:5px 10px; border-radius:8px;
  background: var(--surface); border:1px solid var(--tpkg-line);
  font-size:11.5px; font-weight:700; color: var(--tpkg-ink-2);
  transition:.18s;
  animation: tpkg-fade-up .5s cubic-bezier(.2,.9,.25,1.2) both; }
.tpkg-tag:nth-child(1){ animation-delay:.20s; }
.tpkg-tag:nth-child(2){ animation-delay:.25s; }
.tpkg-tag:nth-child(3){ animation-delay:.30s; }
.tpkg-tag:nth-child(4){ animation-delay:.35s; }
.tpkg-tag:nth-child(5){ animation-delay:.40s; }
.tpkg-tag:hover { border-color: rgba(0,114,255,.35); color: var(--accent); background: var(--tpkg-brand-soft); }
.tpkg-tag svg { color: var(--accent); flex-shrink:0; }

.tpkg-actions { display:flex; flex-direction:column; gap:8px; margin-top:auto; }
.tpkg-btn { height:46px; padding:0 18px; border-radius:13px; border:1px solid transparent;
  font:inherit; font-size:14px; font-weight:700; letter-spacing:.01em; cursor:pointer;
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  transition:.18s; width:100%; }
.tpkg-btn.primary { background: var(--tpkg-brand-grad); color:#fff;
  box-shadow: var(--tpkg-pay-shadow); position:relative; overflow:hidden; }
.tpkg-btn.primary::before {
  content:""; position:absolute; top:0; left:-80%; width:60%; height:100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);
  animation: tpkg-sweep 3.5s ease-in-out infinite; }
.tpkg-btn.primary:hover { transform: translateY(-1px);
  box-shadow: 0 20px 36px -12px rgba(0,114,255,.65), inset 0 1px 0 rgba(255,255,255,.3); }
.tpkg-btn.primary:active { transform: translateY(0); }
.tpkg-btn.primary[disabled] { background: var(--tpkg-soft); color: var(--tpkg-muted-2);
  box-shadow:none; cursor:not-allowed; transform:none; }
.tpkg-btn.primary[disabled]::before { display:none; }
.tpkg-btn.primary .price { font-family: var(--font-mono); font-size:13px; font-weight:800;
  padding:2px 7px; border-radius:6px; background: rgba(255,255,255,.20); margin-left:4px; }
.tpkg-btn.primary[disabled] .price { background: rgba(0,0,0,0.06); color: var(--tpkg-muted-2); }
html.dark .tpkg-btn.primary[disabled] .price { background: rgba(255,255,255,.08); }
.tpkg-btn.primary svg { transition: transform .2s; }
.tpkg-btn.primary:hover svg { transform: translateX(3px); }
.tpkg-btn.ghost { background: var(--surface); border-color: var(--tpkg-line); color: var(--tpkg-ink-2); }
.tpkg-btn.ghost:hover { border-color: rgba(0,114,255,.35); color: var(--accent); background: var(--tpkg-brand-soft); }

/* rules section */
.tpkg-rules { margin-top:20px; padding:20px 22px; border-radius:16px;
  background: var(--surface); border:1px solid var(--tpkg-line);
  animation: tpkg-fade-up .5s cubic-bezier(.2,.9,.25,1.2) .5s both; }
.tpkg-rules h4 { margin:0 0 12px; font-size:13px; font-weight:700; color: var(--tpkg-ink);
  display:flex; align-items:center; gap:8px; }
.tpkg-rules h4 svg { color: var(--accent); }
.tpkg-rules ol { margin:0; padding:0; list-style:none; counter-reset:r;
  display:flex; flex-direction:column; gap:7px; }
.tpkg-rules ol li { counter-increment:r;
  display:flex; align-items:flex-start; gap:10px;
  font-size:12.5px; line-height:1.65; color: var(--tpkg-ink-2); }
.tpkg-rules ol li::before { content: counter(r); flex-shrink:0;
  width:20px; height:20px; border-radius:6px;
  font-family: var(--font-mono); font-size:11px; font-weight:800;
  color: var(--accent); background: var(--tpkg-brand-soft);
  border:1px solid rgba(0,114,255,.14);
  display:grid; place-items:center; margin-top:1px; }
.tpkg-rules ol li b { color: var(--tpkg-ink); font-weight:700; }

@media (max-width: 720px) {
  .tpkg-inner { grid-template-columns: 1fr; gap:20px; padding:24px; }
  .tpkg-price .num { font-size:42px; }
  .tpkg-title { font-size:24px; }
}
`;

/* Submit an HTML form to the upstream epay gateway. Mirrors Recharge/index.jsx. */
function submitEpayForm({ url, params }) {
  const form = document.createElement('form');
  form.action = url;
  form.method = 'POST';
  const isSafari =
    navigator.userAgent.indexOf('Safari') > -1 &&
    navigator.userAgent.indexOf('Chrome') < 1;
  if (!isSafari) form.target = '_blank';
  Object.keys(params || {}).forEach((key) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = params[key];
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

/* Open about:blank synchronously inside a click handler so the browser keeps
   the popup-permission grant alive until the async backend call returns. */
function openCheckoutPopup() {
  try {
    return window.open('about:blank', '_blank');
  } catch {
    return null;
  }
}
function navigateCheckoutPopup(popup, url) {
  if (popup && !popup.closed) {
    try {
      popup.location.href = url;
      return;
    } catch {
      popup.close();
    }
  }
  window.open(url, '_blank');
}

const TRIAL_AMOUNT = 1;

const TrialPackagePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [, userDispatch] = useContext(UserContext);
  const [statusState] = useContext(StatusContext);

  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);

  /* Pay-method availability mirrored from the topup info endpoint. */
  const [payMethods, setPayMethods] = useState([]);
  const [enableOnlineTopUp, setEnableOnlineTopUp] = useState(false);
  const [enableStripeTopUp, setEnableStripeTopUp] = useState(false);
  const [enableCryptomusTopUp, setEnableCryptomusTopUp] = useState(false);
  const [enableNowPaymentsTopUp, setEnableNowPaymentsTopUp] = useState(false);
  const [enableDodoPaymentsTopUp, setEnableDodoPaymentsTopUp] = useState(false);
  const [enableWaffoPancakeTopUp, setEnableWaffoPancakeTopUp] = useState(false);

  /* Epay confirm modal state */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [amountLoading, setAmountLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const [payWay, setPayWay] = useState('');

  const priceRatio = statusState?.status?.price || 1;
  const renderAmount = () => amount + ' ' + t('元');

  /* ─── Bootstrap: read topup info to determine trial eligibility ─── */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/api/user/topup/info');
        const { success, data } = res.data || {};
        if (success && data) {
          let methods = data.pay_methods || [];
          if (typeof methods === 'string') methods = JSON.parse(methods);
          methods = (methods || [])
            .filter((m) => m.name && m.type)
            .map((m) => {
              m.min_topup = Number(m.min_topup) || 0;
              if (m.type === 'stripe' && !m.min_topup)
                m.min_topup = Number(data.stripe_min_topup) || 0;
              return m;
            });
          setPayMethods(methods);
          setEnableOnlineTopUp(!!data.enable_online_topup);
          setEnableStripeTopUp(!!data.enable_stripe_topup);
          setEnableCryptomusTopUp(!!data.enable_cryptomus_topup);
          setEnableNowPaymentsTopUp(!!data.enable_nowpayments_topup);
          setEnableDodoPaymentsTopUp(!!data.enable_dodopayments_topup);
          setEnableWaffoPancakeTopUp(!!data.enable_waffo_pancake_topup);
          // Backend's `min_topup` already accounts for HasSuccessTopUp:
          //  1 → first-time user, eligible for $1 trial
          // 10 (or MinTopUpAfterFirst) → user has already topped up before
          setEligible((Number(data.min_topup) || 1) <= 1);
        }
      } catch {
        /* fall through — purchase button stays disabled */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ─── Pre-flight: figure out the equivalent CNY for $1 (best-effort) ─── */
  const getAmountFn = async (value) => {
    setAmountLoading(true);
    try {
      const res = await API.post('/api/user/amount', {
        amount: parseFloat(value),
      });
      if (res.data?.message === 'success') setAmount(parseFloat(res.data.data));
      else setAmount(0);
    } catch {
      setAmount(0);
    } finally {
      setAmountLoading(false);
    }
  };
  const getStripeAmountFn = async (value) => {
    setAmountLoading(true);
    try {
      const res = await API.post('/api/user/stripe/amount', {
        amount: parseFloat(value),
      });
      if (res.data?.message === 'success') setAmount(parseFloat(res.data.data));
      else setAmount(0);
    } catch {
      setAmount(0);
    } finally {
      setAmountLoading(false);
    }
  };

  /* Pick the first available pay method whose min_topup is ≤ $1. */
  const pickTrialMethod = () => {
    if (enableOnlineTopUp) {
      const m = payMethods.find(
        (p) =>
          p.type !== 'stripe' &&
          p.type !== 'waffo-pancake' &&
          (Number(p.min_topup) || 0) <= TRIAL_AMOUNT,
      );
      if (m) return { kind: 'epay', type: m.type };
    }
    if (enableStripeTopUp) {
      const m = payMethods.find((p) => p.type === 'stripe');
      if (!m || (Number(m.min_topup) || 0) <= TRIAL_AMOUNT)
        return { kind: 'stripe' };
    }
    if (enableWaffoPancakeTopUp) return { kind: 'waffo-pancake' };
    if (enableDodoPaymentsTopUp) return { kind: 'dodopayments' };
    if (enableCryptomusTopUp) return { kind: 'cryptomus' };
    if (enableNowPaymentsTopUp) return { kind: 'nowpayments' };
    return null;
  };

  /* ─── Payment handlers ─── */
  const preTopUp = async (kind, type) => {
    setPayWay(type || kind);
    setPaymentLoading(true);
    try {
      if (kind === 'stripe') await getStripeAmountFn(TRIAL_AMOUNT);
      else await getAmountFn(TRIAL_AMOUNT);
      setConfirmOpen(true);
    } catch {
      showError(t('获取金额失败'));
    } finally {
      setPaymentLoading(false);
    }
  };

  const onlineTopUp = async () => {
    const popup = payWay === 'stripe' ? openCheckoutPopup() : null;
    setConfirmLoading(true);
    try {
      let res;
      if (payWay === 'stripe') {
        res = await API.post('/api/user/stripe/pay', {
          amount: TRIAL_AMOUNT,
          payment_method: 'stripe',
        });
      } else {
        res = await API.post('/api/user/pay', {
          amount: TRIAL_AMOUNT,
          payment_method: payWay,
        });
      }
      if (res?.data?.message === 'success') {
        if (payWay === 'stripe')
          navigateCheckoutPopup(popup, res.data.data.pay_link);
        else submitEpayForm({ url: res.data.url, params: res.data.data });
      } else {
        popup?.close();
        showError(res?.data?.data || res?.data?.message || t('支付失败'));
      }
    } catch {
      popup?.close();
      showError(t('支付请求失败'));
    } finally {
      setConfirmOpen(false);
      setConfirmLoading(false);
    }
  };

  const popupPay = async (endpoint, linkField) => {
    const popup = openCheckoutPopup();
    setPaymentLoading(true);
    try {
      const res = await API.post(endpoint, { amount: TRIAL_AMOUNT });
      const link = res.data?.data?.[linkField];
      if (res.data?.message === 'success' && link) {
        navigateCheckoutPopup(popup, link);
      } else {
        popup?.close();
        showError(res.data?.data || res.data?.message || t('支付请求失败'));
      }
    } catch {
      popup?.close();
      showError(t('支付请求失败'));
    } finally {
      setPaymentLoading(false);
    }
  };

  const buyTrial = () => {
    if (!eligible) return;
    const picked = pickTrialMethod();
    if (!picked) {
      showError(t('当前没有可用的支付方式'));
      return;
    }
    if (picked.kind === 'epay') return preTopUp('epay', picked.type);
    if (picked.kind === 'stripe') return preTopUp('stripe', 'stripe');
    if (picked.kind === 'cryptomus')
      return popupPay('/api/user/cryptomus/pay', 'pay_link');
    if (picked.kind === 'nowpayments')
      return popupPay('/api/user/nowpayments/pay', 'pay_link');
    if (picked.kind === 'dodopayments')
      return popupPay('/api/user/dodopayments/pay', 'pay_link');
    if (picked.kind === 'waffo-pancake')
      return popupPay('/api/user/waffo-pancake/pay', 'payment_url');
  };

  /* ─── Render ─── */
  return (
    <>
      <style>{STYLES}</style>
      <div
        className='tpkg'
        style={{
          minHeight: 'calc(100vh - var(--header-height))',
          padding: '32px 24px 64px',
          background:
            'radial-gradient(1200px 600px at 80% -10%, rgba(0,198,255,0.16), transparent 60%), radial-gradient(1000px 500px at 0% 110%, rgba(0,114,255,0.16), transparent 55%), var(--bg-base)',
        }}
      >
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div className='tpkg-back-row'>
            <button
              type='button'
              className='tpkg-back'
              onClick={() => navigate('/console/recharge')}
            >
              <ArrowLeft size={14} />
              {t('返回充值')}
            </button>
          </div>

          <span className='tpkg-eyebrow'>
            <i />
            {t('Recommended · 推荐')}
          </span>
          <h2 className='tpkg-title'>{t('最快体验方式 · $1 试用包')}</h2>
          <p className='tpkg-kicker'>
            {t(
              '无需大额预付，仅需 1 美元即可获得等值 API 调用额度，验证你的接入是否畅通。',
            )}
          </p>

          {loading ? (
            <div style={{ padding: '12px 4px' }}>
              <Skeleton.Paragraph active rows={8} />
            </div>
          ) : (
            <article className='tpkg-card'>
              <div className='tpkg-grid-bg' />
              <span className='tpkg-blob b1' />
              <span className='tpkg-blob b2' />

              <div className='tpkg-inner'>
                {/* LEFT */}
                <div className='tpkg-left'>
                  <h3>
                    {t('$1 试用包')}
                    <span className='tpkg-ribbon'>HOT</span>
                  </h3>
                  <p className='tpkg-sub'>
                    {t(
                      '适合首次接入、测试模型、验证 Claude Code / Cursor / OpenAI SDK 是否可用。',
                    )}
                  </p>

                  <div className='tpkg-price'>
                    <span className='cur'>$</span>
                    <span className='num'>1</span>
                    <span className='eq'>
                      {t('等值额度')}
                      <b>≈ ¥{(TRIAL_AMOUNT * priceRatio).toFixed(2)}</b>
                    </span>
                  </div>

                  <p className='tpkg-list-title'>{t('适合用于')}</p>
                  <ul className='tpkg-list'>
                    <li>
                      <span className='dot'>
                        <Check size={10} strokeWidth={3} />
                      </span>
                      <span>
                        {t('测试')} <b>API Key</b> {t('是否可用')}
                      </span>
                    </li>
                    <li>
                      <span className='dot'>
                        <Check size={10} strokeWidth={3} />
                      </span>
                      <span>
                        {t('测试')} <b>Claude / GPT / Gemini</b>{' '}
                        {t('等模型调用')}
                      </span>
                    </li>
                    <li>
                      <span className='dot'>
                        <Check size={10} strokeWidth={3} />
                      </span>
                      <span>
                        {t('测试')} <b>{t('流式输出')}</b>
                      </span>
                    </li>
                    <li>
                      <span className='dot'>
                        <Check size={10} strokeWidth={3} />
                      </span>
                      <span>
                        {t('测试')} <b>OpenAI-Compatible</b> {t('接口')}
                      </span>
                    </li>
                    <li>
                      <span className='dot'>
                        <Check size={10} strokeWidth={3} />
                      </span>
                      <span>
                        {t('测试')}{' '}
                        <b>Claude Code / Cursor / Cline / Cherry Studio</b>{' '}
                        {t('工具接入')}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* RIGHT */}
                <div className='tpkg-right'>
                  <p className='tpkg-list-title' style={{ margin: 0 }}>
                    {t('核心卖点')}
                  </p>
                  <div className='tpkg-tags'>
                    <span className='tpkg-tag'>
                      <PiggyBank size={11} strokeWidth={2.4} />
                      {t('低成本试用')}
                    </span>
                    <span className='tpkg-tag'>
                      <HelpCircle size={11} strokeWidth={2.4} />
                      {t('无需大额充值')}
                    </span>
                    <span className='tpkg-tag'>
                      <ListChecks size={11} strokeWidth={2.4} />
                      {t('按量扣费')}
                    </span>
                    <span className='tpkg-tag'>
                      <Search size={11} strokeWidth={2.4} />
                      {t('价格透明')}
                    </span>
                    <span className='tpkg-tag'>
                      <Zap size={11} strokeWidth={2.4} />
                      {t('适合首次接入')}
                    </span>
                  </div>

                  <div className='tpkg-actions'>
                    {eligible ? (
                      <button
                        type='button'
                        className='tpkg-btn primary'
                        onClick={buyTrial}
                        disabled={paymentLoading}
                      >
                        {t('立即购买')}{' '}
                        <span className='price'>${TRIAL_AMOUNT}</span>{' '}
                        {t('试用包')}
                        <ArrowRight size={15} strokeWidth={2.4} />
                      </button>
                    ) : (
                      <Tooltip
                        content={t(
                          '你已使用过 $1 试用包，无法重复购买',
                        )}
                      >
                        <span style={{ display: 'inline-flex', width: '100%' }}>
                          <button
                            type='button'
                            className='tpkg-btn primary'
                            disabled
                          >
                            <span className='price'>${TRIAL_AMOUNT}</span>
                            {t('您已购买过试用包')}
                          </button>
                        </span>
                      </Tooltip>
                    )}
                    <button
                      type='button'
                      className='tpkg-btn ghost'
                      onClick={() => navigate('/docs')}
                    >
                      <BookOpen size={14} strokeWidth={2.2} />
                      {t('查看接入教程')}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* rules */}
          <section className='tpkg-rules'>
            <h4>
              <Info size={14} strokeWidth={2.2} />
              {t('$1 试用包规则说明')}
            </h4>
            <ol>
              <li>
                <span>
                  {t('$1 试用包为')} <b>{t('正式余额')}</b>
                  {t('，可用于平台内支持的模型调用。')}
                </span>
              </li>
              <li>
                <span>
                  {t('试用包余额按照')} <b>{t('模型公开价格')}</b>{' '}
                  {t('正常扣费。')}
                </span>
              </li>
              <li>
                <span>
                  {t('试用包不代表无限使用，不同模型的消耗速度取决于')}{' '}
                  <b>{t('输入、输出 token 数量')}</b>。
                </span>
              </li>
              <li>
                <span>
                  {t('建议首次用户先使用')}{' '}
                  <b>{t('轻量模型或推荐模型')}</b> {t('完成接入测试。')}
                </span>
              </li>
              <li>
                <span>
                  {t('如遇')} <b>{t('支付成功但余额未到账')}</b>
                  {t('，请联系客服处理。')}
                </span>
              </li>
            </ol>
          </section>
        </div>
      </div>

      {/* epay confirm modal — only used when an epay-style method is chosen */}
      <PaymentConfirmModal
        t={t}
        open={confirmOpen}
        onlineTopUp={onlineTopUp}
        handleCancel={() => setConfirmOpen(false)}
        confirmLoading={confirmLoading}
        topUpCount={TRIAL_AMOUNT}
        renderQuotaWithAmount={renderQuotaWithAmount}
        amountLoading={amountLoading}
        renderAmount={renderAmount}
        payWay={payWay}
        payMethods={payMethods}
        amountNumber={amount}
        discountRate={1.0}
      />
    </>
  );
};

export default TrialPackagePage;
