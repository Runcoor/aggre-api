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

import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  API,
  showError,
  showInfo,
  showSuccess,
  renderQuota,
  renderQuotaWithAmount,
  getQuotaPerUnit,
} from '../../helpers';
import { Modal, Skeleton, Tooltip } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../../context/User';
import { StatusContext } from '../../context/Status';
import { SiAlipay, SiWechat, SiStripe } from 'react-icons/si';
import {
  CreditCard,
  TicketCheck,
  Minus,
  Plus,
  Check,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import SubscriptionPlansCard from '../../components/topup/SubscriptionPlansCard';
import PaymentConfirmModal from '../../components/topup/modals/PaymentConfirmModal';

/* ─── Scoped styles (theme-aware, dark-mode via CSS vars, mobile responsive) ─── */
const STYLES = `
/* Theme tokens for this page (light defaults). Re-declared per scope so we
   don't fight with global Semi tokens or accidentally bleed elsewhere. */
.rcv2 {
  --rcv2-line:        var(--border-default);
  --rcv2-line-2:      var(--border-subtle);
  --rcv2-soft:        var(--surface-active);
  --rcv2-ink:         var(--text-primary);
  --rcv2-ink-2:       var(--text-secondary);
  --rcv2-muted:       var(--text-secondary);
  --rcv2-muted-2:     var(--text-muted);
  --rcv2-success:     #10b981;
  --rcv2-success-fg:  #0f9d6e;
  --rcv2-brand-grad:  var(--accent-gradient);
  --rcv2-brand-soft:  linear-gradient(135deg, rgba(0,114,255,0.08), rgba(0,198,255,0.08));
  --rcv2-grid-stroke: rgba(0,114,255,0.06);
  --rcv2-trust-bg:    linear-gradient(135deg, rgba(0,114,255,0.05), rgba(0,198,255,0.05)), var(--surface);
  --rcv2-trust-border:rgba(0,114,255,0.18);
  --rcv2-sub-card-bg: linear-gradient(180deg, rgba(0,114,255,0.03), var(--surface));
  --rcv2-shadow-card: 0 8px 20px -12px rgba(11,21,48,0.10);
  --rcv2-shadow-summary: 0 20px 40px -24px rgba(11,21,48,0.20);
  --rcv2-shadow-pay-btn: 0 14px 28px -10px rgba(0,114,255,0.55), inset 0 1px 0 rgba(255,255,255,0.30);
  --rcv2-shadow-pill: 0 8px 18px -6px rgba(0,114,255,0.55), inset 0 1px 0 rgba(255,255,255,0.30);
  --rcv2-shadow-card-hover: 0 14px 30px -16px rgba(0,114,255,0.40);
}
html.dark .rcv2 {
  --rcv2-line:        rgba(255,255,255,0.07);
  --rcv2-line-2:      rgba(255,255,255,0.04);
  --rcv2-soft:        rgba(255,255,255,0.05);
  --rcv2-grid-stroke: rgba(56,182,255,0.08);
  --rcv2-trust-bg:    linear-gradient(135deg, rgba(56,182,255,0.07), rgba(0,198,255,0.05)), var(--surface);
  --rcv2-trust-border:rgba(56,182,255,0.24);
  --rcv2-sub-card-bg: linear-gradient(180deg, rgba(56,182,255,0.05), var(--surface));
  --rcv2-shadow-card: 0 8px 20px -12px rgba(0,0,0,0.40);
  --rcv2-shadow-summary: 0 20px 40px -24px rgba(0,0,0,0.55);
  --rcv2-shadow-card-hover: 0 14px 30px -16px rgba(56,182,255,0.30);
}

@keyframes rcv2-fade-up { from {opacity:0; transform:translateY(8px)} to {opacity:1; transform:translateY(0)} }
@keyframes rcv2-rise    { from {opacity:0; transform:translateY(12px)} to {opacity:1; transform:translateY(0)} }
@keyframes rcv2-shield  { 0%,100% {transform:scale(1)} 50% {transform:scale(1.06)} }
@keyframes rcv2-sweep   { 0%,100% {left:-80%} 50% {left:120%} }

/* ============== top tabs ============== */
.rcv2-top-tabs { display:flex; justify-content:center; margin-bottom:18px;
  animation: rcv2-fade-up .45s cubic-bezier(.2,.9,.25,1.2) both; }
.rcv2-top-tabs .group { position:relative; display:inline-flex; padding:5px; border-radius:14px;
  background: var(--surface); border:1px solid var(--rcv2-line); box-shadow: var(--rcv2-shadow-card); }
.rcv2-top-tabs .pill { position:absolute; top:5px; left:5px; height:calc(100% - 10px);
  background: var(--rcv2-brand-grad); border-radius:10px;
  box-shadow: var(--rcv2-shadow-pill);
  transition: left .35s cubic-bezier(.5,1.5,.5,1), width .35s cubic-bezier(.5,1.5,.5,1); z-index:0; }
.rcv2-top-tabs button { position:relative; z-index:1; border:none; background:transparent; cursor:pointer;
  padding:10px 28px; border-radius:10px; font:inherit; font-size:14px; font-weight:700;
  color: var(--rcv2-muted); letter-spacing:.02em; transition:color .25s; }
.rcv2-top-tabs button.active { color:#fff; }

/* ============== trust banner ============== */
.rcv2-trust { position:relative; border-radius:18px; padding:20px 22px;
  background: var(--rcv2-trust-bg); border:1px solid var(--rcv2-trust-border);
  overflow:hidden; margin-bottom:18px;
  animation: rcv2-fade-up .5s cubic-bezier(.2,.9,.25,1.2) .05s both; }
.rcv2-trust .grid-bg { position:absolute; inset:0; opacity:.5; pointer-events:none;
  background-image:
    linear-gradient(var(--rcv2-grid-stroke) 1px, transparent 1px),
    linear-gradient(90deg, var(--rcv2-grid-stroke) 1px, transparent 1px);
  background-size:32px 32px;
  -webkit-mask-image: radial-gradient(500px 200px at 95% 50%, #000 0%, transparent 70%);
  mask-image: radial-gradient(500px 200px at 95% 50%, #000 0%, transparent 70%); }
.rcv2-trust .row { position:relative; z-index:1; display:flex; align-items:center; gap:18px; flex-wrap:wrap; }
.rcv2-trust .icon { width:44px; height:44px; border-radius:12px; flex-shrink:0;
  background: var(--rcv2-brand-grad); color:#fff; display:grid; place-items:center;
  box-shadow: var(--rcv2-shadow-pill); }
.rcv2-trust .icon svg { animation: rcv2-shield 3s ease-in-out infinite; }
.rcv2-trust h3 { margin:0; font-size:15px; font-weight:800; letter-spacing:-.005em;
  color: var(--rcv2-ink); display:flex; align-items:center; gap:8px; }
.rcv2-trust h3 .new { font-size:9.5px; font-weight:800; letter-spacing:.10em;
  padding:2px 7px; border-radius:5px; background: var(--rcv2-brand-grad); color:#fff; }
.rcv2-trust p { margin:4px 0 0; font-size:12.5px; color: var(--rcv2-ink-2); line-height:1.65; max-width:680px; }
.rcv2-trust p b { color: var(--accent); font-weight:700; }
.rcv2-trust .ctas { margin-left:auto; display:flex; gap:8px; flex-wrap:wrap; }
.rcv2-tbtn { height:36px; padding:0 14px; border-radius:10px; border:1px solid transparent;
  font:inherit; font-size:12.5px; font-weight:700; cursor:pointer;
  display:inline-flex; align-items:center; gap:6px; transition:.18s; white-space:nowrap; }
.rcv2-tbtn.primary { background: var(--rcv2-brand-grad); color:#fff;
  box-shadow: 0 10px 18px -8px rgba(0,114,255,.55), inset 0 1px 0 rgba(255,255,255,.3); }
.rcv2-tbtn.primary:hover { transform:translateY(-1px); }
.rcv2-tbtn.primary[disabled] { background: var(--surface-active); color: var(--text-muted);
  box-shadow:none; cursor:not-allowed; transform:none; }
.rcv2-tbtn.primary[disabled]:hover { transform:none; }
.rcv2-tbtn.primary .p { font-family: var(--font-mono); padding:1px 6px; border-radius:5px;
  background: rgba(255,255,255,.22); margin-right:2px; font-weight:800; }
.rcv2-tbtn.primary[disabled] .p { background: rgba(0,0,0,0.06); color: var(--text-muted); }
html.dark .rcv2-tbtn.primary[disabled] .p { background: rgba(255,255,255,.08); }
.rcv2-tbtn.ghost { background: var(--surface); border-color: var(--rcv2-line); color: var(--rcv2-ink-2); }
.rcv2-tbtn.ghost:hover { border-color: rgba(0,114,255,.35); color: var(--accent); background: var(--rcv2-brand-soft); }

.rcv2-trust .badges { display:flex; gap:6px; margin-top:10px; flex-wrap:wrap; }
.rcv2-trust .badges .b { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:700;
  padding:4px 9px; border-radius:99px; background: var(--surface);
  border:1px solid var(--rcv2-line); color: var(--rcv2-ink-2); }
.rcv2-trust .badges .b svg { color: var(--rcv2-success); }

/* ============== layout ============== */
.rcv2-page { animation: rcv2-fade-up .4s cubic-bezier(.2,.9,.25,1.2) both; }
.rcv2-lay  { display:grid; grid-template-columns:1fr 340px; gap:18px; align-items:flex-start; }

.rcv2-sec-title { margin:0 0 12px; font-size:14px; font-weight:800; color: var(--rcv2-ink);
  letter-spacing:-.005em; display:flex; align-items:center; gap:8px; }
.rcv2-sec-title small { font-size:11px; font-weight:600; color: var(--rcv2-muted); letter-spacing:0; }

/* ============== amount grid ============== */
.rcv2-amounts { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; }
.rcv2-amt-card { position:relative; border-radius:14px; padding:18px 16px; cursor:pointer;
  background: var(--surface); border:1px solid var(--rcv2-line); transition:.18s;
  text-align:left; outline:none; font:inherit;
  animation: rcv2-rise .45s cubic-bezier(.2,.9,.25,1.2) both; }
.rcv2-amt-card:nth-child(1){animation-delay:.10s}
.rcv2-amt-card:nth-child(2){animation-delay:.15s}
.rcv2-amt-card:nth-child(3){animation-delay:.20s}
.rcv2-amt-card:nth-child(4){animation-delay:.25s}
.rcv2-amt-card:nth-child(5){animation-delay:.30s}
.rcv2-amt-card:nth-child(6){animation-delay:.35s}
.rcv2-amt-card:hover { border-color: rgba(0,114,255,.30); transform:translateY(-2px);
  box-shadow: var(--rcv2-shadow-card-hover); }
.rcv2-amt-card.sel { border-color: var(--accent);
  background: linear-gradient(180deg, var(--surface), rgba(0,114,255,.04));
  box-shadow: 0 0 0 3px var(--accent-light), var(--rcv2-shadow-card-hover); }
.rcv2-amt-card .v { font-family: var(--font-mono); font-size:26px; font-weight:800;
  color: var(--rcv2-ink); letter-spacing:-.01em; }
.rcv2-amt-card .rmb { font-size:12.5px; color: var(--rcv2-muted-2);
  text-decoration:line-through; margin-top:4px; font-family: var(--font-mono); }
.rcv2-amt-card .rmb.plain { text-decoration:none; }
.rcv2-amt-card .disc { position:absolute; top:10px; right:10px; font-size:10.5px; font-weight:800;
  padding:3px 8px; border-radius:7px; background: var(--rcv2-brand-grad); color:#fff;
  box-shadow:0 4px 10px -3px rgba(0,114,255,.55); }
.rcv2-amt-card .check { position:absolute; top:10px; right:10px; width:22px; height:22px; border-radius:50%;
  background: var(--rcv2-brand-grad); color:#fff; display:grid; place-items:center;
  transform:scale(0); opacity:0; transition:.2s;
  box-shadow:0 4px 10px -3px rgba(0,114,255,.55); }
.rcv2-amt-card.sel .check { transform:scale(1); opacity:1; }
.rcv2-amt-card.sel .disc { display:none; }

/* ============== custom amount ============== */
.rcv2-custom { margin-top:16px; border-radius:14px; padding:14px;
  background: var(--surface); border:1px solid var(--rcv2-line);
  display:flex; align-items:center; gap:10px;
  animation: rcv2-rise .45s cubic-bezier(.2,.9,.25,1.2) .40s both; }
.rcv2-custom .ipt { flex:1; display:flex; align-items:center; gap:8px;
  padding:0 14px; height:46px; border-radius:11px;
  background: var(--rcv2-soft); border:1px solid transparent; transition:.15s; }
.rcv2-custom .ipt:focus-within { background: var(--surface); border-color: var(--accent);
  box-shadow:0 0 0 3px var(--accent-light); }
.rcv2-custom .ipt .pre { color: var(--rcv2-muted); font-family: var(--font-mono); font-size:16px; font-weight:700; }
.rcv2-custom .ipt input { flex:1; border:none; outline:none; background:transparent;
  font:inherit; font-family: var(--font-mono); font-size:16px; font-weight:700; color: var(--rcv2-ink);
  width:100%; min-width:0; }
.rcv2-stepper { display:flex; gap:6px; }
.rcv2-stepper button { width:38px; height:38px; border-radius:10px; border:1px solid var(--rcv2-line);
  background: var(--surface); color: var(--rcv2-ink-2); cursor:pointer; display:grid; place-items:center;
  transition:.15s; }
.rcv2-stepper button:hover { background: var(--rcv2-brand-soft); border-color: rgba(0,114,255,.25); color: var(--accent); }

/* ============== payment methods ============== */
.rcv2-pays { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.rcv2-pay { cursor:pointer; border-radius:14px; padding:14px 16px;
  background: var(--surface); border:1px solid var(--rcv2-line);
  display:flex; align-items:center; gap:12px; transition:.18s; position:relative;
  text-align:left; outline:none; font:inherit; width:100%; }
.rcv2-pay:hover { border-color: rgba(0,114,255,.30); transform:translateY(-1px); }
.rcv2-pay.sel  { border-color: var(--accent);
  background: linear-gradient(180deg, var(--surface), rgba(0,114,255,.03));
  box-shadow: 0 0 0 3px var(--accent-light); }
.rcv2-pay .pi { width:38px; height:38px; border-radius:10px; display:grid; place-items:center; flex-shrink:0; }
.rcv2-pay b  { display:block; font-size:13.5px; font-weight:700; color: var(--rcv2-ink); margin-bottom:2px; }
.rcv2-pay .desc { font-size:11.5px; color: var(--rcv2-muted); font-weight:500; }
.rcv2-pay .rd { position:absolute; top:14px; right:14px; width:16px; height:16px; border-radius:50%;
  border:1.5px solid var(--rcv2-line); transition:.15s; }
.rcv2-pay.sel .rd { border-color: var(--accent); background: var(--accent); box-shadow: inset 0 0 0 3px var(--surface); }
.rcv2-pay .body { flex:1; min-width:0; padding-right:18px; }

/* ============== redemption code row ============== */
.rcv2-code-row { display:flex; gap:8px;
  animation: rcv2-rise .45s cubic-bezier(.2,.9,.25,1.2) .55s both; }
.rcv2-code-row .ipt { flex:1; display:flex; align-items:center; gap:8px;
  padding:0 14px; height:46px; border-radius:11px;
  background: var(--surface); border:1px solid var(--rcv2-line); transition:.15s; }
.rcv2-code-row .ipt:focus-within { border-color: var(--accent); box-shadow:0 0 0 3px var(--accent-light); }
.rcv2-code-row .ipt svg { color: var(--rcv2-muted-2); }
.rcv2-code-row .ipt input { flex:1; border:none; outline:none; background:transparent;
  font:inherit; font-size:13.5px; color: var(--rcv2-ink); min-width:0; width:100%; }
.rcv2-code-row .ipt input::placeholder { color: var(--rcv2-muted-2); }
.rcv2-code-row button { height:46px; padding:0 22px; border-radius:11px; border:none; cursor:pointer;
  background: var(--rcv2-brand-grad); color:#fff; font:inherit; font-size:13.5px; font-weight:700;
  box-shadow:0 10px 18px -8px rgba(0,114,255,.55), inset 0 1px 0 rgba(255,255,255,.30); transition:.18s; }
.rcv2-code-row button:hover { transform:translateY(-1px); }
.rcv2-code-row button[disabled] { opacity:.6; cursor:not-allowed; transform:none; }

/* ============== summary ============== */
.rcv2-summary { position:sticky; top:24px; border-radius:18px; padding:22px;
  background: var(--surface); border:1px solid var(--rcv2-line);
  box-shadow: var(--rcv2-shadow-summary);
  animation: rcv2-rise .5s cubic-bezier(.2,.9,.25,1.2) .15s both; }
.rcv2-summary h3  { margin:0 0 4px; font-size:15px; font-weight:800; color: var(--rcv2-ink); }
.rcv2-summary .sub{ margin:0 0 16px; font-size:12px; color: var(--rcv2-muted); }
.rcv2-summary .row{ display:flex; justify-content:space-between; align-items:center;
  padding:8px 0; border-bottom:1px dashed var(--rcv2-line-2); font-size:13px; color: var(--rcv2-ink-2); }
.rcv2-summary .row:last-of-type { border-bottom:none; }
.rcv2-summary .row b { font-family: var(--font-mono); font-weight:700; color: var(--rcv2-ink); }
.rcv2-summary .row.disc b { color: var(--rcv2-success); }
.rcv2-summary .total { margin-top:14px; padding-top:14px; border-top:2px solid var(--rcv2-line);
  display:flex; justify-content:space-between; align-items:baseline; }
.rcv2-summary .total .lbl { font-size:13px; font-weight:700; color: var(--rcv2-ink-2); }
.rcv2-summary .total .price { font-family: var(--font-mono); font-size:28px; font-weight:800;
  letter-spacing:-.01em; background: var(--rcv2-brand-grad);
  -webkit-background-clip:text; background-clip:text; color:transparent; }
.rcv2-summary .pay-btn { margin-top:16px; width:100%; height:48px; border:none; border-radius:13px;
  cursor:pointer; background: var(--rcv2-brand-grad); color:#fff;
  font:inherit; font-size:14.5px; font-weight:800; letter-spacing:.02em;
  box-shadow: var(--rcv2-shadow-pay-btn);
  transition:.18s; display:inline-flex; align-items:center; justify-content:center; gap:8px;
  position:relative; overflow:hidden; }
.rcv2-summary .pay-btn::before { content:""; position:absolute; top:0; left:-80%; width:60%; height:100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);
  animation: rcv2-sweep 3.5s ease-in-out infinite; }
.rcv2-summary .pay-btn:hover { transform:translateY(-1px);
  box-shadow:0 20px 36px -12px rgba(0,114,255,.65), inset 0 1px 0 rgba(255,255,255,.3); }
.rcv2-summary .pay-btn[disabled] { opacity:.55; cursor:not-allowed; transform:none; }
.rcv2-summary .pay-btn[disabled]::before { animation:none; }

/* ============== back link ============== */
.rcv2-back { display:inline-flex; align-items:center; gap:6px;
  margin-bottom:14px; padding:6px 12px 6px 8px; border-radius:9px;
  border:1px solid transparent; background:transparent; cursor:pointer;
  font:inherit; font-size:13px; font-weight:600; color: var(--rcv2-muted);
  transition:.18s; }
.rcv2-back:hover { color: var(--accent); background: var(--surface); border-color: var(--rcv2-line); }

/* ============== mobile (≤980px) ============== */
@media (max-width: 980px) {
  .rcv2-lay { grid-template-columns:1fr; }
  .rcv2-summary { position:static; }
  .rcv2-amounts { grid-template-columns:repeat(2, 1fr); }
  .rcv2-pays { grid-template-columns:1fr; }
  .rcv2-trust .ctas { margin-left:0; width:100%; }
  .rcv2-trust .ctas .rcv2-tbtn { flex:1; justify-content:center; }
}
@media (max-width: 480px) {
  .rcv2-top-tabs button { padding:9px 18px; font-size:13px; }
  .rcv2-trust { padding:18px 16px; }
  .rcv2-trust .row { gap:14px; }
}

/* ============== Semi adjustments — hide stray InputNumber chrome ============== */
.rcv2 .semi-input-number-suffix { display:none !important; }
.rcv2 input[type=number]::-webkit-inner-spin-button,
.rcv2 input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
.rcv2 input[type=number] { -moz-appearance: textfield; }
`;

/* ─── Epay form submit ─── */
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

const RechargePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [userState, userDispatch] = useContext(UserContext);
  const [statusState] = useContext(StatusContext);

  const [activeTab, setActiveTab] = useState('subscription');

  /* ─── Topup state (mirrored from topup/index.jsx) ─── */
  const [topupLoading, setTopupLoading] = useState(true);
  const [topupInfo, setTopupInfo] = useState({
    amount_options: [],
    discount: {},
  });
  const [payMethods, setPayMethods] = useState([]);
  const [enableOnlineTopUp, setEnableOnlineTopUp] = useState(false);
  const [enableStripeTopUp, setEnableStripeTopUp] = useState(false);
  const [enableCreemTopUp, setEnableCreemTopUp] = useState(false);
  const [creemProducts, setCreemProducts] = useState([]);
  const [enableWaffoTopUp, setEnableWaffoTopUp] = useState(false);
  const [waffoPayMethods, setWaffoPayMethods] = useState([]);
  const [waffoMinTopUp, setWaffoMinTopUp] = useState(1);
  const [enableCryptomusTopUp, setEnableCryptomusTopUp] = useState(false);
  const [cryptomusMinTopUp, setCryptomusMinTopUp] = useState(1);
  const [enableNowPaymentsTopUp, setEnableNowPaymentsTopUp] = useState(false);
  const [nowpaymentsMinTopUp, setNowpaymentsMinTopUp] = useState(1);
  const [enableDodoPaymentsTopUp, setEnableDodoPaymentsTopUp] = useState(false);
  const [dodopaymentsMinTopUp, setDodopaymentsMinTopUp] = useState(1);
  const [enableWaffoPancakeTopUp, setEnableWaffoPancakeTopUp] = useState(false);
  const [waffoPancakeMinTopUp, setWaffoPancakeMinTopUp] = useState(10);
  const [priceRatio, setPriceRatio] = useState(statusState?.status?.price || 1);
  const [minTopUp, setMinTopUp] = useState(1);
  const [topUpCount, setTopUpCount] = useState(1);
  const [presetAmounts, setPresetAmounts] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [selectedPayMethod, setSelectedPayMethod] = useState('');
  const [amount, setAmount] = useState(0);
  const [amountLoading, setAmountLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [payWay, setPayWay] = useState('');
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [redemptionCode, setRedemptionCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topUpLink, setTopUpLink] = useState('');
  const [statusLoading, setStatusLoading] = useState(true);
  // Dynamic min top-up from backend — reflects first-topup eligibility.
  // <=1 means user is in their first-time window (eligible for $1 trial pack).
  const [firstTimeMinTopUp, setFirstTimeMinTopUp] = useState(1);

  /* ─── Top-tab sliding pill (refs and pos; effect runs below after all state) ─── */
  const topupBtnRef = useRef(null);
  const subBtnRef = useRef(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  /* ─── Subscription state ─── */
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [billingPreference, setBillingPreference] =
    useState('subscription_first');
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [allSubscriptions, setAllSubscriptions] = useState([]);

  /* ─── Creem modal ─── */
  const [creemOpen, setCreemOpen] = useState(false);
  const [selectedCreemProduct, setSelectedCreemProduct] = useState(null);

  /* ─── Pill position effect — declared after all state to avoid TDZ ─── */
  useEffect(() => {
    const updatePill = () => {
      const active =
        activeTab === 'topup' ? topupBtnRef.current : subBtnRef.current;
      if (active)
        setPillStyle({ left: active.offsetLeft, width: active.offsetWidth });
    };
    updatePill();
    window.addEventListener('resize', updatePill);
    return () => window.removeEventListener('resize', updatePill);
  }, [activeTab, topupLoading, subscriptionLoading]);

  /* ─── Data loading ─── */
  useEffect(() => {
    getTopupInfo();
    getSubscriptionPlans();
    getSubscriptionSelf();
    getUserQuota();
  }, []);

  useEffect(() => {
    if (statusState?.status) {
      setPriceRatio(statusState.status.price || 1);
      setTopUpLink(statusState.status.top_up_link || '');
      setStatusLoading(false);
    }
  }, [statusState?.status]);

  // Auto-select tab based on subscription availability
  useEffect(() => {
    if (!subscriptionLoading && subscriptionPlans.length === 0) {
      setActiveTab('topup');
    }
  }, [subscriptionLoading, subscriptionPlans]);

  const getUserQuota = async () => {
    try {
      const res = await API.get('/api/user/self');
      if (res.data?.success)
        userDispatch({ type: 'login', payload: res.data.data });
    } catch {}
  };

  const getSubscriptionPlans = async () => {
    setSubscriptionLoading(true);
    try {
      const res = await API.get('/api/subscription/plans');
      if (res.data?.success) setSubscriptionPlans(res.data.data || []);
    } catch {
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const getSubscriptionSelf = async () => {
    try {
      const res = await API.get('/api/subscription/self');
      if (res.data?.success) {
        setBillingPreference(
          res.data.data?.billing_preference || 'subscription_first',
        );
        setActiveSubscriptions(res.data.data?.subscriptions || []);
        setAllSubscriptions(res.data.data?.all_subscriptions || []);
      }
    } catch {}
  };

  const updateBillingPreference = async (pref) => {
    const prev = billingPreference;
    setBillingPreference(pref);
    try {
      const res = await API.put('/api/subscription/self/preference', {
        billing_preference: pref,
      });
      if (res.data?.success) {
        showSuccess(t('更新成功'));
        setBillingPreference(res.data.data?.billing_preference || pref);
      } else {
        showError(res.data?.message || t('更新失败'));
        setBillingPreference(prev);
      }
    } catch {
      showError(t('请求失败'));
      setBillingPreference(prev);
    }
  };

  const getTopupInfo = async () => {
    setTopupLoading(true);
    try {
      const res = await API.get('/api/user/topup/info');
      const { success, data } = res.data;
      if (success && data) {
        setTopupInfo({
          amount_options: data.amount_options || [],
          discount: data.discount || {},
        });
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
        setEnableCreemTopUp(!!data.enable_creem_topup);
        setEnableWaffoTopUp(!!data.enable_waffo_topup);
        setWaffoPayMethods(data.waffo_pay_methods || []);
        setWaffoMinTopUp(data.waffo_min_topup || 1);
        setEnableCryptomusTopUp(!!data.enable_cryptomus_topup);
        setCryptomusMinTopUp(data.cryptomus_min_topup || 1);
        setEnableNowPaymentsTopUp(!!data.enable_nowpayments_topup);
        setNowpaymentsMinTopUp(data.nowpayments_min_topup || 1);
        setEnableDodoPaymentsTopUp(!!data.enable_dodopayments_topup);
        setDodopaymentsMinTopUp(data.dodopayments_min_topup || 1);
        setEnableWaffoPancakeTopUp(!!data.enable_waffo_pancake_topup);
        setWaffoPancakeMinTopUp(data.waffo_pancake_min_topup || 10);
        const min = data.enable_online_topup
          ? data.min_topup
          : data.enable_stripe_topup
            ? data.stripe_min_topup
            : data.enable_waffo_topup
              ? data.waffo_min_topup
              : 1;
        setMinTopUp(min);
        setTopUpCount(min);
        // Capture the dynamic min — `data.min_topup` already accounts for
        // HasSuccessTopUp on the backend (1 for first-time users, 10 or
        // MinTopUpAfterFirst after their first successful top-up).
        setFirstTimeMinTopUp(Number(data.min_topup) || 1);
        try {
          setCreemProducts(JSON.parse(data.creem_products || '[]'));
        } catch {
          setCreemProducts([]);
        }
        // Presets
        const opts = data.amount_options || [];
        const disc = data.discount || {};
        if (opts.length > 0) {
          setPresetAmounts(
            opts.map((v) => ({ value: v, discount: disc[v] || 1.0 })),
          );
        } else {
          setPresetAmounts(
            [1, 5, 10, 30, 50, 100].map((m) => ({
              value: min * m,
              discount: disc[min * m] || 1.0,
            })),
          );
        }
        getAmountFn(min);
      }
    } catch {
    } finally {
      setTopupLoading(false);
    }
  };

  /* ─── Amount calculation ─── */
  const getAmountFn = async (value) => {
    if (value === undefined) value = topUpCount;
    setAmountLoading(true);
    try {
      const res = await API.post('/api/user/amount', {
        amount: parseFloat(value),
      });
      if (res.data?.message === 'success') setAmount(parseFloat(res.data.data));
      else setAmount(0);
    } catch {
    } finally {
      setAmountLoading(false);
    }
  };

  const getStripeAmountFn = async (value) => {
    if (value === undefined) value = topUpCount;
    setAmountLoading(true);
    try {
      const res = await API.post('/api/user/stripe/amount', {
        amount: parseFloat(value),
      });
      if (res.data?.message === 'success') setAmount(parseFloat(res.data.data));
      else setAmount(0);
    } catch {
    } finally {
      setAmountLoading(false);
    }
  };

  const renderAmount = () => amount + ' ' + t('元');

  /* ─── Payment handlers ─── */
  const preTopUp = async (payment) => {
    setPayWay(payment);
    setPaymentLoading(true);
    try {
      if (payment === 'stripe') await getStripeAmountFn();
      else await getAmountFn();
      if (topUpCount < minTopUp) {
        showError(t('充值数量不能小于') + minTopUp);
        return;
      }
      setOpen(true);
    } catch {
      showError(t('获取金额失败'));
    } finally {
      setPaymentLoading(false);
    }
  };

  // openCheckoutPopup must be called synchronously inside the click handler
  // (before any await). Browsers grant popup permission only while the user
  // gesture is still on the call stack — once a Promise resolves, that grant
  // is gone and window.open is blocked. We open about:blank up-front and
  // navigate it once the backend returns the real checkout URL.
  const openCheckoutPopup = () => {
    try {
      return window.open('about:blank', '_blank');
    } catch {
      return null;
    }
  };

  const navigateCheckoutPopup = (popup, url) => {
    if (popup && !popup.closed) {
      try {
        popup.location.href = url;
        return;
      } catch {
        popup.close();
      }
    }
    // Popup never opened (extreme blocker) — fall back to a direct call,
    // which will likely be blocked too, but at least surfaces the URL.
    window.open(url, '_blank');
  };

  const onlineTopUp = async () => {
    if (topUpCount < minTopUp) {
      showError(t('充值数量不能小于') + minTopUp);
      return;
    }
    // Stripe goes to a hosted page (new window). Epay-style methods submit
    // a form to the gateway, which is its own navigation — no popup needed.
    const popup = payWay === 'stripe' ? openCheckoutPopup() : null;
    setConfirmLoading(true);
    try {
      let res;
      if (payWay === 'stripe') {
        res = await API.post('/api/user/stripe/pay', {
          amount: parseInt(topUpCount),
          payment_method: 'stripe',
        });
      } else {
        res = await API.post('/api/user/pay', {
          amount: parseInt(topUpCount),
          payment_method: payWay,
        });
      }
      if (res?.data?.message === 'success') {
        if (payWay === 'stripe') {
          navigateCheckoutPopup(popup, res.data.data.pay_link);
        } else {
          submitEpayForm({ url: res.data.url, params: res.data.data });
        }
      } else {
        popup?.close();
        showError(res?.data?.data || res?.data?.message || t('支付失败'));
      }
    } catch {
      popup?.close();
      showError(t('支付请求失败'));
    } finally {
      setOpen(false);
      setConfirmLoading(false);
    }
  };

  const topUp = async () => {
    if (!redemptionCode) {
      showInfo(t('请输入兑换码！'));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await API.post('/api/user/topup', { key: redemptionCode });
      const { success, message, data } = res.data;
      if (success) {
        showSuccess(t('兑换成功！'));
        Modal.success({
          title: t('兑换成功！'),
          content: t('成功兑换额度：') + renderQuota(data),
          centered: true,
        });
        if (userState.user)
          userDispatch({
            type: 'login',
            payload: { ...userState.user, quota: userState.user.quota + data },
          });
        setRedemptionCode('');
      } else showError(message);
    } catch {
      showError(t('请求失败'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const cryptomusTopUp = async () => {
    const min = Math.max(cryptomusMinTopUp || 1, minTopUp || 1);
    if (topUpCount < min) {
      showError(t('充值数量不能小于') + min);
      return;
    }
    const popup = openCheckoutPopup();
    setPaymentLoading(true);
    try {
      const res = await API.post('/api/user/cryptomus/pay', {
        amount: parseInt(topUpCount),
      });
      if (res.data?.message === 'success' && res.data.data?.pay_link) {
        navigateCheckoutPopup(popup, res.data.data.pay_link);
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

  const nowpaymentsTopUp = async () => {
    const min = Math.max(nowpaymentsMinTopUp || 1, minTopUp || 1);
    if (topUpCount < min) {
      showError(t('充值数量不能小于') + min);
      return;
    }
    const popup = openCheckoutPopup();
    setPaymentLoading(true);
    try {
      const res = await API.post('/api/user/nowpayments/pay', {
        amount: parseInt(topUpCount),
      });
      if (res.data?.message === 'success' && res.data.data?.pay_link) {
        navigateCheckoutPopup(popup, res.data.data.pay_link);
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

  const dodopaymentsTopUp = async () => {
    const min = Math.max(dodopaymentsMinTopUp || 1, minTopUp || 1);
    if (topUpCount < min) {
      showError(t('充值数量不能小于') + min);
      return;
    }
    const popup = openCheckoutPopup();
    setPaymentLoading(true);
    try {
      const res = await API.post('/api/user/dodopayments/pay', {
        amount: parseInt(topUpCount),
      });
      if (res.data?.message === 'success' && res.data.data?.pay_link) {
        navigateCheckoutPopup(popup, res.data.data.pay_link);
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

  const waffoPancakeTopUp = async () => {
    const min = Math.max(waffoPancakeMinTopUp || 10, minTopUp || 1);
    if (topUpCount < min) {
      showError(t('充值数量不能小于') + min);
      return;
    }
    const popup = openCheckoutPopup();
    setPaymentLoading(true);
    try {
      const res = await API.post('/api/user/waffo-pancake/pay', {
        amount: parseInt(topUpCount),
      });
      if (res.data?.message === 'success' && res.data.data?.payment_url) {
        navigateCheckoutPopup(popup, res.data.data.payment_url);
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

  const waffoTopUp = async (idx) => {
    if (topUpCount < waffoMinTopUp) {
      showError(t('充值数量不能小于') + waffoMinTopUp);
      return;
    }
    const popup = openCheckoutPopup();
    setPaymentLoading(true);
    try {
      const body = { amount: parseInt(topUpCount) };
      if (idx != null) body.pay_method_index = idx;
      const res = await API.post('/api/user/waffo/pay', body);
      if (res.data?.message === 'success' && res.data.data?.payment_url) {
        navigateCheckoutPopup(popup, res.data.data.payment_url);
      } else {
        popup?.close();
        showError(res.data?.data || t('支付请求失败'));
      }
    } catch {
      popup?.close();
      showError(t('支付请求失败'));
    } finally {
      setPaymentLoading(false);
    }
  };

  const creemPreTopUp = (product) => {
    setSelectedCreemProduct(product);
    setCreemOpen(true);
  };
  const onlineCreemTopUp = async () => {
    if (!selectedCreemProduct?.productId) {
      showError(t('产品配置错误，请联系管理员'));
      return;
    }
    const popup = openCheckoutPopup();
    setConfirmLoading(true);
    try {
      const res = await API.post('/api/user/creem/pay', {
        product_id: selectedCreemProduct.productId,
        payment_method: 'creem',
      });
      if (res.data?.message === 'success') {
        navigateCheckoutPopup(popup, res.data.data.checkout_url);
      } else {
        popup?.close();
        showError(res.data?.data || res.data?.message || t('支付失败'));
      }
    } catch {
      showError(t('支付请求失败'));
    } finally {
      setCreemOpen(false);
      setConfirmLoading(false);
    }
  };

  const selectPresetAmount = (preset) => {
    setTopUpCount(preset.value);
    setSelectedPreset(preset.value);
    const discount = preset.discount || topupInfo.discount[preset.value] || 1.0;
    setAmount(preset.value * priceRatio * discount);
  };

  /* ─── Derived ─── */
  const epayMethods = payMethods.filter(
    (m) =>
      m.type !== 'stripe' &&
      m.type !== 'creem' &&
      m.type !== 'waffo' &&
      m.type !== 'waffo-pancake' &&
      m.type !== 'cryptomus' &&
      m.type !== 'nowpayments' &&
      m.type !== 'dodopayments',
  );
  const hasOnlinePay =
    enableOnlineTopUp ||
    enableStripeTopUp ||
    enableWaffoTopUp ||
    enableWaffoPancakeTopUp ||
    enableCryptomusTopUp ||
    enableNowPaymentsTopUp ||
    enableDodoPaymentsTopUp;
  const currentDiscount = topupInfo?.discount?.[topUpCount] || 1.0;
  const actualPay = topUpCount * priceRatio * currentDiscount;
  const hasDiscount = currentDiscount < 1.0;
  const showSubscriptionTab =
    !subscriptionLoading && subscriptionPlans.length > 0;

  // $1 trial pack: only first-time users qualify. The backend's
  // `data.min_topup` already reflects HasSuccessTopUp — a value of 1 means
  // the user hasn't completed a successful top-up yet.
  const isTrialEligible = firstTimeMinTopUp <= 1 && hasOnlinePay;

  // Pick the first sensible pay method when none is selected — used by the
  // $1 trial CTA so a one-tap purchase is possible from the banner.
  const firstAvailablePayMethod = () => {
    if (enableOnlineTopUp && epayMethods.length > 0)
      return epayMethods[0].type;
    if (enableStripeTopUp) return 'stripe';
    if (enableWaffoPancakeTopUp) return 'waffo-pancake';
    if (enableDodoPaymentsTopUp) return 'dodopayments';
    if (enableCryptomusTopUp) return 'cryptomus';
    if (enableNowPaymentsTopUp) return 'nowpayments';
    return '';
  };

  const onClickTrial = () => {
    if (!isTrialEligible) return;
    if (showSubscriptionTab) setActiveTab('topup');
    setTopUpCount(1);
    setSelectedPreset(null);
    getAmountFn(1);
    if (!selectedPayMethod) {
      const next = firstAvailablePayMethod();
      if (next) setSelectedPayMethod(next);
    }
    // Smooth-scroll to the summary so the user can confirm and pay in one tap.
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  };

  // Single dispatch for the summary "确认支付" button — routes by selected rail.
  const handleConfirmPay = () => {
    if (!selectedPayMethod) return;
    if (selectedPayMethod === 'cryptomus') return cryptomusTopUp();
    if (selectedPayMethod === 'nowpayments') return nowpaymentsTopUp();
    if (selectedPayMethod === 'dodopayments') return dodopaymentsTopUp();
    if (selectedPayMethod === 'waffo-pancake') return waffoPancakeTopUp();
    return preTopUp(selectedPayMethod);
  };

  return (
    <>
      <style>{STYLES}</style>
      <div
        className='rcv2'
        style={{
          minHeight: 'calc(100vh - var(--header-height))',
          padding: isMobile ? '24px 16px 48px' : '32px 24px 64px',
          background:
            'radial-gradient(1200px 600px at 80% -10%, rgba(0,198,255,0.16), transparent 60%), radial-gradient(1000px 500px at 0% 110%, rgba(0,114,255,0.16), transparent 55%), var(--bg-base)',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          {/* ─── Back link ─── */}
          <button
            className='rcv2-back'
            onClick={() => navigate('/console/topup')}
          >
            <ArrowLeft size={14} />
            {t('返回钱包')}
          </button>

          {/* ─── Top tabs (sliding pill) ─── */}
          {showSubscriptionTab && (
            <div className='rcv2-top-tabs'>
              <div className='group'>
                <span
                  className='pill'
                  style={{ left: pillStyle.left, width: pillStyle.width }}
                />
                <button
                  ref={topupBtnRef}
                  className={activeTab === 'topup' ? 'active' : ''}
                  onClick={() => setActiveTab('topup')}
                >
                  {t('额度充值')}
                </button>
                <button
                  ref={subBtnRef}
                  className={activeTab === 'subscription' ? 'active' : ''}
                  onClick={() => setActiveTab('subscription')}
                >
                  {t('订阅套餐')}
                </button>
              </div>
            </div>
          )}

          {/* ─── Trust banner ─── */}
          <section className='rcv2-trust'>
            <div className='grid-bg' />
            <div className='row'>
              <div className='icon' aria-hidden='true'>
                <ShieldCheck size={22} />
              </div>
              <div style={{ minWidth: 0, flex: '1 1 320px' }}>
                <h3>
                  {t('为什么可以放心充值？')}
                  <span className='new'>{t('放心计费')}</span>
                </h3>
                <p>
                  {t('首次使用？建议先购买')}{' '}
                  <b>{t('$1 试用包')}</b>
                  {t('，完成 API 接入测试后再继续充值。所有模型采用')}
                  <b>{t('公开价格')}</b>
                  {t(
                    '展示，站内不设置复杂倍率，不存在隐藏扣费公式 —— 你看到的模型价格，就是实际计费依据。',
                  )}
                </p>
                <div className='badges'>
                  <span className='b'>
                    <Check size={11} strokeWidth={3} />
                    {t('低门槛体验')}
                  </span>
                  <span className='b'>
                    <Check size={11} strokeWidth={3} />
                    {t('透明计费')}
                  </span>
                  <span className='b'>
                    <Check size={11} strokeWidth={3} />
                    {t('按量扣费')}
                  </span>
                  <span className='b'>
                    <Check size={11} strokeWidth={3} />
                    {t('价格公开')}
                  </span>
                </div>
              </div>
              <div className='ctas'>
                {topupLoading ? (
                  <button
                    className='rcv2-tbtn primary'
                    disabled
                    type='button'
                  >
                    <span className='p'>$1</span>
                    {t('购买试用包')}
                  </button>
                ) : (
                  <Tooltip
                    content={
                      isTrialEligible
                        ? t('立即体验 $1 试用包')
                        : t('你已使用过 $1 试用包，无法重复购买')
                    }
                  >
                    <span style={{ display: 'inline-flex' }}>
                      <button
                        className='rcv2-tbtn primary'
                        disabled={!isTrialEligible}
                        onClick={onClickTrial}
                        type='button'
                      >
                        <span className='p'>$1</span>
                        {isTrialEligible
                          ? t('购买试用包')
                          : t('您已试用')}
                        {isTrialEligible && (
                          <ArrowRight size={13} strokeWidth={2.4} />
                        )}
                      </button>
                    </span>
                  </Tooltip>
                )}
                <button
                  className='rcv2-tbtn ghost'
                  onClick={() => navigate('/pricing')}
                  type='button'
                >
                  <Search size={13} strokeWidth={2.2} />
                  {t('查看模型价格')}
                </button>
              </div>
            </div>
          </section>

          {/* ─── Page content ─── */}
          {topupLoading ? (
            <div style={{ padding: '12px 4px' }}>
              <Skeleton.Paragraph active rows={6} />
            </div>
          ) : activeTab === 'subscription' && showSubscriptionTab ? (
            <div className='rcv2-page' key='sub'>
              <SubscriptionPlansCard
                t={t}
                loading={subscriptionLoading}
                plans={subscriptionPlans}
                payMethods={payMethods}
                enableOnlineTopUp={enableOnlineTopUp}
                enableStripeTopUp={enableStripeTopUp}
                enableCreemTopUp={enableCreemTopUp}
                billingPreference={billingPreference}
                onChangeBillingPreference={updateBillingPreference}
                activeSubscriptions={activeSubscriptions}
                allSubscriptions={allSubscriptions}
                reloadSubscriptionSelf={getSubscriptionSelf}
                withCard={false}
              />
            </div>
          ) : (
            <div className='rcv2-page' key='topup'>
              <div className='rcv2-lay'>
                <div>
                  {/* ─── Amount grid ─── */}
                  {hasOnlinePay && (
                    <>
                      <h3 className='rcv2-sec-title'>
                        {t('选择充值金额')}
                        <small>
                          · {t('美元单位，等值人民币结算')}
                        </small>
                      </h3>
                      <div className='rcv2-amounts'>
                        {presetAmounts.map((p) => {
                          const disc =
                            p.discount ||
                            topupInfo?.discount?.[p.value] ||
                            1.0;
                          const origCny = p.value * priceRatio;
                          const actCny = origCny * disc;
                          const hasDsc = disc < 1.0;
                          const isSelected = selectedPreset === p.value;
                          return (
                            <button
                              key={p.value}
                              type='button'
                              className={`rcv2-amt-card${isSelected ? ' sel' : ''}`}
                              onClick={() => selectPresetAmount(p)}
                            >
                              <div className='v'>${p.value}</div>
                              <div
                                className={`rmb${hasDsc ? '' : ' plain'}`}
                              >
                                ¥{(hasDsc ? origCny : actCny).toFixed(0)}
                              </div>
                              {hasDsc && (
                                <span className='disc'>
                                  {(disc * 10).toFixed(1)}
                                  {t('折')}
                                </span>
                              )}
                              <span className='check'>
                                <Check size={11} strokeWidth={3.4} />
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom amount + stepper */}
                      <div className='rcv2-custom'>
                        <div className='ipt'>
                          <span className='pre'>$</span>
                          <input
                            type='number'
                            inputMode='numeric'
                            min={minTopUp}
                            step={1}
                            value={topUpCount}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const v =
                                raw === '' ? 0 : Math.max(0, parseInt(raw, 10) || 0);
                              setTopUpCount(v);
                              setSelectedPreset(null);
                              getAmountFn(v);
                            }}
                            aria-label={t('自定义充值金额')}
                          />
                        </div>
                        <div className='rcv2-stepper'>
                          <button
                            type='button'
                            aria-label={t('减少')}
                            onClick={() => {
                              const v = Math.max(minTopUp, topUpCount - 1);
                              setTopUpCount(v);
                              setSelectedPreset(null);
                              getAmountFn(v);
                            }}
                          >
                            <Minus size={14} strokeWidth={2.4} />
                          </button>
                          <button
                            type='button'
                            aria-label={t('增加')}
                            onClick={() => {
                              const v = topUpCount + 1;
                              setTopUpCount(v);
                              setSelectedPreset(null);
                              getAmountFn(v);
                            }}
                          >
                            <Plus size={14} strokeWidth={2.4} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ─── Payment methods ─── */}
                  {hasOnlinePay && (
                    <>
                      <h3
                        className='rcv2-sec-title'
                        style={{ marginTop: 26 }}
                      >
                        {t('选择支付方式')}
                      </h3>
                      <div className='rcv2-pays'>
                        {/* Stripe */}
                        {enableStripeTopUp &&
                          payMethods
                            .filter((m) => m.type === 'stripe')
                            .map(() => (
                              <button
                                key='stripe'
                                type='button'
                                className={`rcv2-pay${selectedPayMethod === 'stripe' ? ' sel' : ''}`}
                                onClick={() => setSelectedPayMethod('stripe')}
                              >
                                <div
                                  className='pi'
                                  style={{
                                    background: 'rgba(99,91,255,0.10)',
                                    color: '#635BFF',
                                  }}
                                >
                                  <SiStripe size={20} />
                                </div>
                                <div className='body'>
                                  <b>Stripe</b>
                                  <span className='desc'>{t('国际支付')}</span>
                                </div>
                                <span className='rd' />
                              </button>
                            ))}
                        {/* EPay-style: wxpay / alipay / generic */}
                        {enableOnlineTopUp &&
                          epayMethods.map((m) => (
                            <button
                              key={m.type}
                              type='button'
                              className={`rcv2-pay${selectedPayMethod === m.type ? ' sel' : ''}`}
                              onClick={() => setSelectedPayMethod(m.type)}
                            >
                              <div
                                className='pi'
                                style={
                                  m.type === 'alipay'
                                    ? {
                                        background: 'rgba(22,119,255,0.10)',
                                        color: '#1677FF',
                                      }
                                    : m.type === 'wxpay'
                                      ? {
                                          background: 'rgba(22,163,74,0.10)',
                                          color: '#15803d',
                                        }
                                      : {
                                          background: 'var(--surface-active)',
                                          color: 'var(--text-secondary)',
                                        }
                                }
                              >
                                {m.type === 'alipay' ? (
                                  <SiAlipay size={20} />
                                ) : m.type === 'wxpay' ? (
                                  <SiWechat size={20} />
                                ) : (
                                  <CreditCard size={18} />
                                )}
                              </div>
                              <div className='body'>
                                <b>{m.name ? t(m.name) : ''}</b>
                                <span className='desc'>{t('即时到账')}</span>
                              </div>
                              <span className='rd' />
                            </button>
                          ))}
                        {/* Cryptomus (USDT) */}
                        {enableCryptomusTopUp && (
                          <button
                            type='button'
                            className={`rcv2-pay${selectedPayMethod === 'cryptomus' ? ' sel' : ''}`}
                            onClick={() => setSelectedPayMethod('cryptomus')}
                          >
                            <div
                              className='pi'
                              style={{
                                background: 'rgba(247,147,26,0.10)',
                                color: '#F7931A',
                                fontFamily: 'var(--font-mono)',
                                fontSize: 16,
                                fontWeight: 800,
                              }}
                            >
                              ₮
                            </div>
                            <div className='body'>
                              <b>{t('USDT / 加密货币')}</b>
                              <span className='desc'>
                                {t('链上到账，低手续费')}
                              </span>
                            </div>
                            <span className='rd' />
                          </button>
                        )}
                        {/* NowPayments (multi-chain crypto) */}
                        {enableNowPaymentsTopUp && (
                          <button
                            type='button'
                            className={`rcv2-pay${selectedPayMethod === 'nowpayments' ? ' sel' : ''}`}
                            onClick={() => setSelectedPayMethod('nowpayments')}
                          >
                            <div
                              className='pi'
                              style={{
                                background: 'rgba(245,158,11,0.10)',
                                color: '#b45309',
                              }}
                            >
                              <svg
                                width='18'
                                height='18'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2.2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              >
                                <path d='M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.155-6.2L8.29 4.26m5.908 1.042.348-1.97M7.48 20.364l3.126-17.727' />
                              </svg>
                            </div>
                            <div className='body'>
                              <b>{t('加密货币支付')}</b>
                              <span className='desc'>
                                {t('链上到账，多链支持')}
                              </span>
                            </div>
                            <span className='rd' />
                          </button>
                        )}
                        {/* DodoPayments (cards / global) */}
                        {enableDodoPaymentsTopUp && (
                          <button
                            type='button'
                            className={`rcv2-pay${selectedPayMethod === 'dodopayments' ? ' sel' : ''}`}
                            onClick={() => setSelectedPayMethod('dodopayments')}
                          >
                            <div
                              className='pi'
                              style={{
                                background: 'rgba(122,90,248,0.12)',
                                color: '#7A5AF8',
                              }}
                            >
                              <CreditCard size={18} />
                            </div>
                            <div className='body'>
                              <b>{t('信用卡 / 全球支付')}</b>
                              <span className='desc'>
                                {t('Visa / Mastercard / 本地支付，按 USD 结算')}
                              </span>
                            </div>
                            <span className='rd' />
                          </button>
                        )}
                        {/* Waffo Pancake — Stripe-style hosted checkout */}
                        {enableWaffoPancakeTopUp && (
                          <button
                            type='button'
                            className={`rcv2-pay${selectedPayMethod === 'waffo-pancake' ? ' sel' : ''}`}
                            onClick={() =>
                              setSelectedPayMethod('waffo-pancake')
                            }
                          >
                            <div
                              className='pi'
                              style={{
                                background: 'rgba(0,184,217,0.10)',
                                color: '#00B8D9',
                              }}
                            >
                              <CreditCard size={18} />
                            </div>
                            <div className='body'>
                              <b>{t('信用卡支付')}</b>
                              <span className='desc'>
                                {t('Visa / Mastercard / Apple Pay, 按 USD 结算')}
                              </span>
                            </div>
                            <span className='rd' />
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {/* ─── Redemption code ─── */}
                  <h3
                    className='rcv2-sec-title'
                    style={{ marginTop: 26 }}
                  >
                    {t('兑换充值码')}
                  </h3>
                  <div className='rcv2-code-row'>
                    <div className='ipt'>
                      <TicketCheck size={14} strokeWidth={2.2} />
                      <input
                        value={redemptionCode}
                        onChange={(e) =>
                          setRedemptionCode(e.target.value)
                        }
                        placeholder={t('输入充值码')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') topUp();
                        }}
                      />
                    </div>
                    <button
                      type='button'
                      onClick={topUp}
                      disabled={isSubmitting}
                    >
                      {t('兑换')}
                    </button>
                  </div>
                </div>

                {/* ─── Right: Order summary (sticky) ─── */}
                {hasOnlinePay && (
                  <aside className='rcv2-summary'>
                    <h3>{t('订单摘要')}</h3>
                    <p className='sub'>{t('确认你的充值详情')}</p>
                    {(() => {
                      // USD-settled rails skip the CNY conversion.
                      const isCryptoRail =
                        selectedPayMethod === 'cryptomus' ||
                        selectedPayMethod === 'nowpayments' ||
                        selectedPayMethod === 'dodopayments' ||
                        selectedPayMethod === 'waffo-pancake';
                      const symbol = isCryptoRail ? '$' : '¥';
                      const rate = isCryptoRail ? 1 : priceRatio;
                      const baseTotal = topUpCount * rate;
                      const discountPart = baseTotal * (1 - currentDiscount);
                      const settlement = baseTotal * currentDiscount;
                      const payMethodLabel = (() => {
                        if (!selectedPayMethod) return t('未选择');
                        if (selectedPayMethod === 'stripe') return 'Stripe';
                        if (selectedPayMethod === 'cryptomus')
                          return t('USDT / 加密货币');
                        if (selectedPayMethod === 'nowpayments')
                          return t('加密货币支付');
                        if (selectedPayMethod === 'dodopayments')
                          return t('信用卡 / 全球支付');
                        if (selectedPayMethod === 'waffo-pancake')
                          return t('信用卡支付');
                        const m = epayMethods.find(
                          (x) => x.type === selectedPayMethod,
                        );
                        return m?.name ? t(m.name) : selectedPayMethod;
                      })();
                      return (
                        <>
                          <div className='row'>
                            <span>{t('充值金额')}</span>
                            <b>${Number(topUpCount).toFixed(2)}</b>
                          </div>
                          {!isCryptoRail && (
                            <div className='row'>
                              <span>{t('等值人民币')}</span>
                              <b>¥{(topUpCount * priceRatio).toFixed(2)}</b>
                            </div>
                          )}
                          {hasDiscount && (
                            <div className='row disc'>
                              <span>
                                {t('优惠折扣')}（
                                {(currentDiscount * 10).toFixed(1)}
                                {t('折')}）
                              </span>
                              <b>
                                − {symbol}
                                {discountPart.toFixed(2)}
                              </b>
                            </div>
                          )}
                          <div className='row'>
                            <span>{t('支付方式')}</span>
                            <b>{payMethodLabel}</b>
                          </div>
                          <div className='total'>
                            <span className='lbl'>{t('实付金额')}</span>
                            <span className='price'>
                              {symbol}
                              {settlement.toFixed(2)}
                            </span>
                          </div>
                          <button
                            type='button'
                            className='pay-btn'
                            disabled={
                              !selectedPayMethod || paymentLoading
                            }
                            onClick={handleConfirmPay}
                          >
                            {paymentLoading
                              ? t('处理中…')
                              : t('确认支付')}
                            <ArrowRight size={15} strokeWidth={2.4} />
                          </button>
                        </>
                      );
                    })()}
                  </aside>
                )}
              </div>
            </div>
          )}
        </div>
      </div>


      {/* ─── Modals ─── */}
      <PaymentConfirmModal
        t={t}
        open={open}
        onlineTopUp={onlineTopUp}
        handleCancel={() => setOpen(false)}
        confirmLoading={confirmLoading}
        topUpCount={topUpCount}
        renderQuotaWithAmount={renderQuotaWithAmount}
        amountLoading={amountLoading}
        renderAmount={renderAmount}
        payWay={payWay}
        payMethods={payMethods}
        amountNumber={amount}
        discountRate={topupInfo?.discount?.[topUpCount] || 1.0}
      />
      <Modal
        title={t('确定要充值 $')}
        visible={creemOpen}
        onOk={onlineCreemTopUp}
        onCancel={() => {
          setCreemOpen(false);
          setSelectedCreemProduct(null);
        }}
        maskClosable={false}
        size='small'
        centered
        confirmLoading={confirmLoading}
      >
        {selectedCreemProduct && (
          <div className='space-y-2'>
            <div
              className='flex justify-between py-1.5'
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <span style={{ color: 'var(--text-muted)' }}>
                {t('产品名称')}
              </span>
              <span style={{ color: 'var(--text-primary)' }}>
                {selectedCreemProduct.name}
              </span>
            </div>
            <div
              className='flex justify-between py-1.5'
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <span style={{ color: 'var(--text-muted)' }}>{t('价格')}</span>
              <span style={{ color: 'var(--text-primary)' }}>
                ${selectedCreemProduct.price}
              </span>
            </div>
            <p
              className='text-sm pt-2'
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('是否确认充值？')}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default RechargePage;
