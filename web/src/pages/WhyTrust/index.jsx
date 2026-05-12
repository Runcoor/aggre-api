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

import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  MessageSquare,
  Search,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { getSystemName } from '../../helpers/utils';

/* ─── Theme-aware styles (.wt scope, light defaults, dark overrides) ─── */
const STYLES = `
.wt {
  --wt-line:        var(--border-default);
  --wt-line-2:      var(--border-subtle);
  --wt-soft:        var(--surface-active);
  --wt-ink:         var(--text-primary);
  --wt-ink-2:       var(--text-secondary);
  --wt-muted:       var(--text-secondary);
  --wt-muted-2:     var(--text-muted);
  --wt-brand-grad:  var(--accent-gradient);
  --wt-brand-soft:  linear-gradient(135deg, rgba(0,114,255,0.08), rgba(0,198,255,0.08));
  --wt-grid:        rgba(0,114,255,0.06);
  --wt-surface:     var(--surface);
  --wt-row-hover:   linear-gradient(90deg, rgba(0,114,255,0.03), transparent);
  --wt-warn-fg:     #b45309;
  --wt-warn-bg:     linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02));
  --wt-warn-bd:     rgba(245,158,11,0.18);
  --wt-shadow-card: 0 1px 0 rgba(255,255,255,0.6) inset, 0 20px 40px -28px rgba(11,21,48,0.18);
  --wt-success:     #10b981;
}
html.dark .wt {
  --wt-line:        rgba(255,255,255,0.08);
  --wt-line-2:      rgba(255,255,255,0.05);
  --wt-soft:        rgba(255,255,255,0.04);
  --wt-grid:        rgba(56,182,255,0.10);
  --wt-row-hover:   linear-gradient(90deg, rgba(56,182,255,0.06), transparent);
  --wt-warn-fg:     #fbbf24;
  --wt-warn-bg:     linear-gradient(135deg, rgba(245,158,11,0.10), rgba(245,158,11,0.04));
  --wt-warn-bd:     rgba(245,158,11,0.28);
  --wt-shadow-card: 0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 40px -28px rgba(0,0,0,0.50);
}

@keyframes wt-dot { 0%,100% {box-shadow:0 0 0 0 rgba(0,114,255,.5)} 50% {box-shadow:0 0 0 5px rgba(0,114,255,0)} }
@keyframes wt-bob { 0%,100% {transform:translateY(0)} 50% {transform:translateY(-6px)} }

.wt-reveal { opacity:0; transform:translateY(14px);
  transition: opacity .6s cubic-bezier(.2,.9,.25,1.2), transform .6s cubic-bezier(.2,.9,.25,1.2); }
.wt-reveal.in { opacity:1; transform:translateY(0); }

/* hero */
.wt-hero { text-align:center; margin-bottom:48px; }
.wt-eyebrow { display:inline-flex; align-items:center; gap:8px;
  padding:5px 12px; border-radius:99px;
  background: var(--wt-surface); border:1px solid var(--wt-line);
  font-size:11px; font-weight:700; color: var(--accent);
  letter-spacing:.12em; text-transform:uppercase; }
.wt-eyebrow i { width:6px; height:6px; border-radius:50%; background: var(--accent);
  box-shadow: 0 0 0 0 rgba(0,114,255,.5); animation: wt-dot 1.8s ease-in-out infinite; }
.wt-title { margin:18px 0 12px; font-size:42px; font-weight:800; letter-spacing:-.02em;
  line-height:1.15; color: var(--wt-ink); }
.wt-title em { font-style:normal;
  background: var(--wt-brand-grad); -webkit-background-clip:text; background-clip:text; color:transparent; }
.wt-sub { margin:0 auto; max-width:680px; font-size:15px; line-height:1.7; color: var(--wt-muted); }
.wt-sub b { color: var(--wt-ink); font-weight:700; }

/* commit cards */
.wt-commits { margin-top:36px; display:grid; grid-template-columns: repeat(4, 1fr); gap:14px; }
.wt-commit { position:relative; border-radius:16px; padding:20px;
  background: var(--wt-surface); border:1px solid var(--wt-line);
  transition:.25s; text-align:left; overflow:hidden; }
.wt-commit:hover { transform: translateY(-3px); border-color: rgba(0,114,255,.25);
  box-shadow: 0 20px 40px -24px rgba(0,114,255,.30); }
.wt-commit .ico { width:38px; height:38px; border-radius:11px; display:grid; place-items:center;
  background: var(--wt-brand-soft); color: var(--accent);
  border:1px solid rgba(0,114,255,.14); margin-bottom:12px;
  transition:.25s; }
.wt-commit:hover .ico { background: var(--wt-brand-grad); color:#fff; border-color: transparent;
  box-shadow: 0 10px 20px -8px rgba(0,114,255,.55); }
.wt-commit h4 { margin:0 0 5px; font-size:14px; font-weight:800; color: var(--wt-ink); letter-spacing:-.005em; }
.wt-commit p { margin:0; font-size:12px; color: var(--wt-muted); line-height:1.6; }

/* section block */
.wt-block { margin-top:28px; position:relative; border-radius:22px; padding:36px;
  background: var(--wt-surface); border:1px solid var(--wt-line);
  box-shadow: var(--wt-shadow-card); overflow:hidden; }
.wt-grid-bg { position:absolute; inset:0; opacity:.4; pointer-events:none;
  background-image:
    linear-gradient(var(--wt-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--wt-grid) 1px, transparent 1px);
  background-size:32px 32px;
  -webkit-mask-image: radial-gradient(520px 220px at 90% 0%, #000 0%, transparent 75%);
  mask-image: radial-gradient(520px 220px at 90% 0%, #000 0%, transparent 75%); }
.wt-head { display:flex; align-items:center; gap:14px; margin-bottom:18px; position:relative; z-index:1; }
.wt-num { flex-shrink:0; width:44px; height:44px; border-radius:13px;
  background: var(--wt-brand-grad); color:#fff;
  display:grid; place-items:center;
  font-family: var(--font-mono); font-size:18px; font-weight:800;
  box-shadow: 0 12px 24px -8px rgba(0,114,255,.55), inset 0 1px 0 rgba(255,255,255,.3); }
.wt-h2 { margin:0; font-size:22px; font-weight:800; color: var(--wt-ink); letter-spacing:-.01em; line-height:1.3; }
.wt-lead { margin:0 0 18px; font-size:14px; line-height:1.75; color: var(--wt-ink-2);
  max-width:760px; position:relative; z-index:1; }
.wt-lead b { color: var(--wt-ink); font-weight:700; }
.wt-hl { background: linear-gradient(180deg, transparent 62%, rgba(0,198,255,.22) 62%);
  padding:0 2px; color: var(--wt-ink); font-weight:700; }
html.dark .wt-hl { background: linear-gradient(180deg, transparent 62%, rgba(0,198,255,.32) 62%); }

/* fact pills */
.wt-facts { display:flex; flex-wrap:wrap; gap:8px; position:relative; z-index:1; }
.wt-fact { display:inline-flex; align-items:center; gap:7px;
  padding:7px 13px; border-radius:99px;
  background: var(--wt-brand-soft); border:1px solid rgba(0,114,255,.14);
  font-size:12.5px; font-weight:700; color: var(--accent);
  transition:.18s; }
.wt-fact:hover { transform: translateY(-1px); background: var(--wt-surface); border-color: rgba(0,114,255,.30); }
.wt-fact svg { flex-shrink:0; }

/* bullet list */
.wt-bul { margin:6px 0 0; padding:0; list-style:none;
  display:grid; grid-template-columns: 1fr 1fr; gap:8px 22px;
  position:relative; z-index:1; }
.wt-bul li { display:flex; align-items:flex-start; gap:9px;
  font-size:13px; color: var(--wt-ink-2); line-height:1.6; }
.wt-bul li .dot { width:18px; height:18px; border-radius:6px; flex-shrink:0;
  background: var(--wt-brand-soft); color: var(--accent);
  display:grid; place-items:center; border:1px solid rgba(0,114,255,.14);
  margin-top:1px; }
.wt-bul li b { color: var(--wt-ink); font-weight:700; }

/* table */
.wt-tbl-wrap { position:relative; z-index:1; border:1px solid var(--wt-line);
  border-radius:14px; overflow:hidden; background: var(--wt-surface); }
.wt-tbl { width:100%; border-collapse:collapse; font-size:13px; }
.wt-tbl thead { background: var(--wt-soft); }
.wt-tbl th { text-align:left; padding:12px 14px; font-size:11px; font-weight:700; color: var(--wt-muted);
  letter-spacing:.08em; text-transform:uppercase; border-bottom:1px solid var(--wt-line); }
.wt-tbl td { padding:12px 14px; border-bottom:1px dashed var(--wt-line-2);
  color: var(--wt-ink-2); font-family: var(--font-mono); font-size:12.5px; }
.wt-tbl tr:last-child td { border-bottom:none; }
.wt-tbl td.t { font-family: var(--font-mono); color: var(--wt-ink); font-weight:700; }
.wt-tbl td .ok { display:inline-flex; align-items:center; gap:4px; color: var(--wt-success); font-weight:700; }
.wt-tbl td .ok i { width:6px; height:6px; border-radius:50%; background: var(--wt-success); }
.wt-tbl td .cost { color: var(--accent); font-weight:700; }
.wt-tbl tbody tr { transition:.15s; }
.wt-tbl tbody tr:hover { background: var(--wt-row-hover); }

/* warn */
.wt-warn { position:relative; z-index:1; margin-top:14px;
  border-radius:14px; padding:16px 18px 16px 50px;
  background: var(--wt-warn-bg); border:1px solid var(--wt-warn-bd);
  font-size:13px; line-height:1.65; color: var(--wt-ink-2); }
.wt-warn .icon { position:absolute; left:16px; top:14px;
  width:22px; height:22px; border-radius:7px;
  background: rgba(245,158,11,.14); border:1px solid rgba(245,158,11,.22);
  display:grid; place-items:center; color: var(--wt-warn-fg); }
.wt-warn b { color: var(--wt-warn-fg); font-weight:800; }

/* contact (last) */
.wt-contact { margin-top:28px; text-align:center; padding:46px 36px;
  position:relative; border-radius:24px; overflow:hidden;
  background:
    radial-gradient(420px 220px at 50% -30%, rgba(0,198,255,.30), transparent 60%),
    radial-gradient(380px 220px at 50% 110%, rgba(0,114,255,.22), transparent 60%),
    var(--wt-surface);
  border:1px solid var(--wt-line); }
.wt-contact h2 { margin:0 0 8px; font-size:26px; font-weight:800; letter-spacing:-.01em;
  color: var(--wt-ink); position:relative; z-index:1; }
.wt-contact p { margin:0 auto; max-width:520px; font-size:14px; line-height:1.7;
  color: var(--wt-muted); position:relative; z-index:1; }
.wt-contact p b { color: var(--wt-ink); font-weight:700; }
.wt-contact .arrow { position:relative; z-index:1; margin:22px auto 0;
  width:54px; height:54px; border-radius:16px;
  background: var(--wt-brand-grad); color:#fff;
  display:grid; place-items:center;
  box-shadow: 0 14px 28px -10px rgba(0,114,255,.55);
  animation: wt-bob 2.2s ease-in-out infinite; }

@media (max-width: 880px) {
  .wt-commits { grid-template-columns: repeat(2, 1fr); }
  .wt-bul { grid-template-columns: 1fr; }
  .wt-title { font-size:32px; }
  .wt-block { padding:24px 22px; }
  .wt-contact { padding:36px 22px; }
  .wt-tbl th, .wt-tbl td { padding:10px 10px; font-size:12px; }
}
@media (max-width: 480px) {
  .wt-commits { grid-template-columns: 1fr; }
  .wt-title { font-size:26px; }
  .wt-sub { font-size:13.5px; }
  .wt-h2 { font-size:18px; }
  .wt-num { width:38px; height:38px; font-size:16px; }
  .wt-tbl th, .wt-tbl td { padding:9px 8px; font-size:11.5px; }
}
`;

/* Small wrapper for the check icon used in many list bullets and fact pills */
const Bullet = () => (
  <span className='dot'>
    <Check size={10} strokeWidth={3} />
  </span>
);

const FactPill = ({ children }) => (
  <span className='wt-fact'>
    <Check size={12} strokeWidth={3} />
    {children}
  </span>
);

const WhyTrust = () => {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  const systemName = getSystemName();

  /* Reveal-on-scroll: faithful to the design's IntersectionObserver effect. */
  useEffect(() => {
    if (!rootRef.current) return;
    const els = rootRef.current.querySelectorAll('.wt-reveal');
    // Show the hero immediately so the top of the page never appears blank.
    const hero = rootRef.current.querySelector('.wt-hero');
    requestAnimationFrame(() => hero && hero.classList.add('in'));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <style>{STYLES}</style>
      <div
        ref={rootRef}
        className='wt'
        style={{
          minHeight: 'calc(100vh - var(--header-height))',
          padding: '48px 24px 80px',
          background:
            'radial-gradient(1200px 600px at 80% -10%, rgba(0,198,255,0.16), transparent 60%), radial-gradient(1000px 500px at 0% 110%, rgba(0,114,255,0.16), transparent 55%), var(--bg-base)',
        }}
      >
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          {/* HERO */}
          <header className='wt-hero wt-reveal'>
            <span className='wt-eyebrow'>
              <i />
              {t('放心计费 · Trust & Billing')}
            </span>
            <h1 className='wt-title'>
              {t('充值前的顾虑，')}
              <em>{t('我们都写清楚')}</em>
            </h1>
            <p className='wt-sub'>
              {t(
                '{{name}} 面向开发者和团队提供统一的 AI API 接入服务。我们知道 API 充值最重要的是',
                { name: systemName },
              )}
              <b>{t('透明、稳定、可查、可联系')}</b>
              {t(
                '，因此把模型价格、扣费规则、用量明细和支持方式全部公开展示。',
              )}
            </p>

            <div className='wt-commits'>
              <div className='wt-commit wt-reveal'>
                <div className='ico'>
                  <Search size={18} strokeWidth={2.2} />
                </div>
                <h4>{t('价格透明')}</h4>
                <p>{t('所有模型公开展示价格，统一 1 倍率，无隐藏换算。')}</p>
              </div>
              <div className='wt-commit wt-reveal'>
                <div className='ico'>
                  <Zap size={18} strokeWidth={2.2} />
                </div>
                <h4>{t('低门槛试用')}</h4>
                <p>{t('首次可购买 $1 试用包，先测试再长期使用。')}</p>
              </div>
              <div className='wt-commit wt-reveal'>
                <div className='ico'>
                  <TrendingUp size={18} strokeWidth={2.2} />
                </div>
                <h4>{t('用量可查')}</h4>
                <p>{t('每次调用消耗都能在控制台逐条查看。')}</p>
              </div>
              <div className='wt-commit wt-reveal'>
                <div className='ico'>
                  <MessageSquare size={18} strokeWidth={2.2} />
                </div>
                <h4>{t('问题可联系')}</h4>
                <p>{t('支付、到账、调用异常均可联系客服处理。')}</p>
              </div>
            </div>
          </header>

          {/* 1 — Pricing */}
          <section className='wt-block wt-reveal'>
            <div className='wt-grid-bg' />
            <div className='wt-head'>
              <div className='wt-num'>1</div>
              <h2 className='wt-h2'>
                {t('所有模型价格透明，统一 1 倍率')}
              </h2>
            </div>
            <p className='wt-lead'>
              {t('{{name}} ', { name: systemName })}
              <b>{t('不使用复杂倍率计费')}</b>
              {t(
                '。你在模型价格页看到的价格，',
              )}
              <span className='wt-hl'>{t('就是平台实际计费依据')}</span>
              {t(
                '。我们不会让用户再去计算模型倍率、渠道倍率、余额倍率或隐藏换算规则。',
              )}
              <br />
              <br />
              {t(
                '对于开发者来说，你只需要关注：选择哪个模型、输入了多少 token、输出了多少 token、本次调用消耗了多少余额。',
              )}{' '}
              <b>{t('所有用量都可以在后台查看。')}</b>
            </p>
            <div className='wt-facts'>
              <FactPill>{t('无隐藏倍率')}</FactPill>
              <FactPill>{t('无复杂换算')}</FactPill>
              <FactPill>{t('无强制套餐')}</FactPill>
              <FactPill>{t('无最低长期订阅')}</FactPill>
              <FactPill>{t('按实际调用量消耗')}</FactPill>
            </div>
          </section>

          {/* 2 — Trial */}
          <section className='wt-block wt-reveal'>
            <div className='wt-grid-bg' />
            <div className='wt-head'>
              <div className='wt-num'>2</div>
              <h2 className='wt-h2'>
                {t('首次使用，可以先用 $1 试用包测试')}
              </h2>
            </div>
            <p className='wt-lead'>
              {t('我们')}
              <b>{t('不建议')}</b>
              {t('新用户一开始就大额充值。如果你只是想验证 API 是否适合自己的项目，可以先购买')}{' '}
              <span className='wt-hl'>{t('$1 试用包')}</span>
              {t(
                '。试用包可以用于测试模型调用、工具接入、流式输出和接口兼容性。确认可用后，再根据实际需求继续充值。',
              )}
            </p>
            <ul className='wt-bul'>
              <li>
                <Bullet />
                <span>
                  <b>OpenAI SDK</b> {t('接入')}
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  <b>Claude Code</b> {t('接入')}
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  <b>Cursor</b> {t('接入')}
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  <b>Cline / Roo Code</b> {t('接入')}
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  <b>Cherry Studio / Chatbox</b> {t('接入')}
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  {t('自研项目')} <b>{t('API 调用')}</b>
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  <b>{t('流式响应')}</b>
                  {t('测试')}
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  <b>{t('模型响应质量')}</b>
                  {t('测试')}
                </span>
              </li>
            </ul>
          </section>

          {/* 3 — Usage detail */}
          <section className='wt-block wt-reveal'>
            <div className='wt-grid-bg' />
            <div className='wt-head'>
              <div className='wt-num'>3</div>
              <h2 className='wt-h2'>{t('每次调用都可以查看明细')}</h2>
            </div>
            <p className='wt-lead'>
              {t('充值后，余额')}
              <b>{t('不会"凭空减少"')}</b>
              {t(
                '。你可以在控制台查看调用记录和用量明细，包括：调用时间、使用模型、输入 token、输出 token、请求状态、本次消耗与剩余余额。',
              )}
            </p>
            <div className='wt-tbl-wrap'>
              <table className='wt-tbl'>
                <thead>
                  <tr>
                    <th>{t('时间')}</th>
                    <th>{t('模型')}</th>
                    <th>{t('输入')}</th>
                    <th>{t('输出')}</th>
                    <th>{t('状态')}</th>
                    <th>{t('消耗')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className='t'>2026-05-12 14:20</td>
                    <td>claude-sonnet-4.7</td>
                    <td>xxx</td>
                    <td>xxx</td>
                    <td>
                      <span className='ok'>
                        <i />
                        {t('成功')}
                      </span>
                    </td>
                    <td className='cost'>$0.0xx</td>
                  </tr>
                  <tr>
                    <td className='t'>2026-05-12 14:23</td>
                    <td>gpt-5.5</td>
                    <td>xxx</td>
                    <td>xxx</td>
                    <td>
                      <span className='ok'>
                        <i />
                        {t('成功')}
                      </span>
                    </td>
                    <td className='cost'>$0.0xx</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4 — Auto credit */}
          <section className='wt-block wt-reveal'>
            <div className='wt-grid-bg' />
            <div className='wt-head'>
              <div className='wt-num'>4</div>
              <h2 className='wt-h2'>{t('充值成功后自动到账')}</h2>
            </div>
            <p className='wt-lead'>
              {t('正常情况下，支付完成后余额会')}
              <b>{t('自动到账')}</b>
              {t('。如果出现以下情况：')}
            </p>
            <ul className='wt-bul'>
              <li>
                <Bullet />
                <span>{t('支付成功但余额未更新')}</span>
              </li>
              <li>
                <Bullet />
                <span>{t('支付页面显示成功但控制台未到账')}</span>
              </li>
              <li>
                <Bullet />
                <span>{t('重复支付')}</span>
              </li>
              <li>
                <Bullet />
                <span>{t('充值金额异常')}</span>
              </li>
            </ul>
            <p className='wt-lead' style={{ marginTop: 14 }}>
              {t('请及时联系客服，我们会根据支付记录进行处理。')}
            </p>
          </section>

          {/* 5 — Call errors */}
          <section className='wt-block wt-reveal'>
            <div className='wt-grid-bg' />
            <div className='wt-head'>
              <div className='wt-num'>5</div>
              <h2 className='wt-h2'>{t('调用异常时如何处理？')}</h2>
            </div>
            <p className='wt-lead'>
              {t(
                'API 调用过程中可能会遇到模型繁忙、请求超时、参数错误、余额不足、限速等情况。我们建议你优先检查：',
              )}
            </p>
            <ul className='wt-bul'>
              <li>
                <Bullet />
                <span>
                  <b>API Key</b> {t('是否正确')}
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  <b>Base URL</b> {t('是否正确')}
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  <b>{t('模型名称')}</b>
                  {t('是否正确')}
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  <b>{t('账户余额')}</b>
                  {t('是否充足')}
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  <b>{t('请求参数')}</b>
                  {t('是否符合模型要求')}
                </span>
              </li>
            </ul>
            <p className='wt-lead' style={{ marginTop: 14 }}>
              {t('如仍无法解决，可以将错误信息提交给客服。')}
            </p>
          </section>

          {/* 6 — Audience */}
          <section className='wt-block wt-reveal'>
            <div className='wt-grid-bg' />
            <div className='wt-head'>
              <div className='wt-num'>6</div>
              <h2 className='wt-h2'>
                {t('适合谁使用 {{name}}？', { name: systemName })}
              </h2>
            </div>
            <ul className='wt-bul'>
              <li>
                <Bullet />
                <span>{t('需要统一接入多个 AI 模型的开发者')}</span>
              </li>
              <li>
                <Bullet />
                <span>
                  {t('使用')}{' '}
                  <b>Claude Code、Cursor、Cline</b>{' '}
                  {t('等 AI 编程工具的用户')}
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  {t('需要')} <b>OpenAI-Compatible</b> {t('API 的项目')}
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  {t('希望统一管理')} <b>{t('API Key 和用量')}</b>
                  {t('的团队')}
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  {t('希望')}
                  <b>{t('先小额测试、再按需充值')}</b>
                  {t('的用户')}
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  {t('需要清晰')}
                  <b>{t('余额和用量记录')}</b>
                  {t('的用户')}
                </span>
              </li>
            </ul>
          </section>

          {/* 7 — Not suitable */}
          <section className='wt-block wt-reveal'>
            <div className='wt-grid-bg' />
            <div className='wt-head'>
              <div className='wt-num'>7</div>
              <h2 className='wt-h2'>{t('哪些情况不建议直接大额充值？')}</h2>
            </div>
            <p className='wt-lead'>
              {t('如果你是首次使用，我们')}
              <b>{t('不建议')}</b>
              {t('直接大额充值。以下情况建议先购买')}{' '}
              <span className='wt-hl'>{t('$1 试用包')}</span>
              {t('测试：')}
            </p>
            <ul className='wt-bul'>
              <li>
                <Bullet />
                <span>{t('第一次接入 API')}</span>
              </li>
              <li>
                <Bullet />
                <span>
                  {t('第一次使用')}{' '}
                  <b>Claude Code / Cursor / Cline</b>
                </span>
              </li>
              <li>
                <Bullet />
                <span>{t('不确定模型是否满足项目需求')}</span>
              </li>
              <li>
                <Bullet />
                <span>{t('不确定当前网络环境是否稳定')}</span>
              </li>
              <li>
                <Bullet />
                <span>{t('不确定请求量和预算')}</span>
              </li>
              <li>
                <Bullet />
                <span>
                  {t('需要验证')}
                  <b>{t('流式输出')}</b>
                  {t('效果')}
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  {t('需要验证')}
                  <b>{t('模型响应质量')}</b>
                </span>
              </li>
            </ul>
            <div className='wt-warn'>
              <span className='icon'>
                <AlertTriangle size={14} strokeWidth={2.4} />
              </span>
              <b>{t('强提醒：')}</b>
              {t('建议先小额测试，确认可用后再继续充值。')}
            </div>
          </section>

          {/* 8 — No watering down */}
          <section className='wt-block wt-reveal'>
            <div className='wt-grid-bg' />
            <div className='wt-head'>
              <div className='wt-num'>8</div>
              <h2 className='wt-h2'>{t('模型绝不掺水 · 官方原版直连')}</h2>
            </div>
            <p className='wt-lead'>
              {t('我们提供的所有模型均为')}
              <span className='wt-hl'>{t('官方原版模型')}</span>
              {t('，与你直接访问 OpenAI、Anthropic、Google 等官方接口得到的结果')}
              <b>{t('完全一致')}</b>
              {t('。{{name}} 不会替换模型版本、不会蒸馏模型、不会限制上下文长度、不会偷偷降级到更小的模型。', {
                name: systemName,
              })}
            </p>
            <ul className='wt-bul'>
              <li>
                <Bullet />
                <span>
                  <b>{t('不替换')}</b>
                  {t('模型版本')}
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  <b>{t('不蒸馏')}</b>
                  {t('到小模型')}
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  <b>{t('不限制')}</b>
                  {t('上下文长度')}
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  <b>{t('不偷偷降级')}</b>
                  {t('请求')}
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  {t('与官方')} <b>{t('完全一致')}</b> {t('的响应')}
                </span>
              </li>
              <li>
                <Bullet />
                <span>
                  {t('支持')}
                  <b>{t('官方所有参数')}</b>
                </span>
              </li>
            </ul>
          </section>

          {/* Contact */}
          <section className='wt-contact wt-reveal'>
            <div className='wt-grid-bg' />
            <h2>{t('还有问题？可以联系我们')}</h2>
            <p>
              {t('您可以通过网站')}
              <b>{t('右下角的智能客服')}</b>
              {t('获取人工客服的联系方式。')}
            </p>
            <div className='arrow'>
              <ArrowRight size={22} strokeWidth={2.4} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default WhyTrust;
