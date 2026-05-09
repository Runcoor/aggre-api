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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Spin, Toast } from '@douyinfe/semi-ui';
import { API, copy, timestamp2string } from '../../../helpers';
import { isAdmin } from '../../../helpers/utils';
import BillDetailModal from './BillDetailModal';
import './topup-billing.css';

const PAYMENT_DEF = {
  wxpay: { cls: 'wx', label: '微信' },
  alipay: { cls: 'alipay', label: '支付宝' },
  stripe: { cls: 'stripe', label: 'Stripe' },
  creem: { cls: 'creem', label: 'Creem' },
  waffo: { cls: 'waffo', label: 'Waffo' },
};

const isSubscriptionTopup = (record) => {
  const tradeNo = (record?.trade_no || '').toLowerCase();
  return Number(record?.amount || 0) === 0 && tradeNo.startsWith('sub');
};

// "USR27...857" -> { tag: 'USER', suffix: '857' }
const deriveOrderTag = (tradeNo) => {
  if (!tradeNo) return { tag: '', suffix: '' };
  const upper = tradeNo.toUpperCase();
  let tag = '';
  if (upper.startsWith('SUB')) tag = 'SUBSCRIPTION';
  else if (upper.startsWith('USR')) tag = 'USER';
  else if (upper.startsWith('DODO')) tag = 'DODO';
  else if (upper.startsWith('NP')) tag = 'NOWPAY';
  else if (upper.startsWith('STR')) tag = 'STRIPE';
  else if (upper.startsWith('CRE')) tag = 'CREEM';
  else if (upper.startsWith('WAF')) tag = 'WAFFO';
  else tag = upper.replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'ORDER';
  // last 3 alphanumeric chars
  const m = tradeNo.match(/[A-Za-z0-9]+/g) || [];
  const last = m.length ? m[m.length - 1] : tradeNo;
  const suffix = last.slice(-3);
  return { tag, suffix };
};

// build [1,2,3,4,5] / [1,'…',4,5,6,'…',12] etc.
const buildPageList = (current, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const out = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) out.push('…');
  for (let i = start; i <= end; i++) out.push(i);
  if (end < totalPages - 1) out.push('…');
  out.push(totalPages);
  return out;
};

// format unix-seconds timestamp -> { d, t }
const splitTimestamp = (ts) => {
  if (!ts) return { d: '—', t: '' };
  const full = timestamp2string(ts);
  if (typeof full === 'string' && full.includes(' ')) {
    const [d, ...rest] = full.split(' ');
    return { d, t: rest.join(' ') };
  }
  return { d: String(full), t: '' };
};

const Icon = {
  Title: () => (
    <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
      <path d='M3 7h18' /><path d='M3 12h18' /><path d='M3 17h12' />
      <circle cx='19' cy='17' r='3' />
    </svg>
  ),
  X: () => (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
      <path d='M18 6 6 18' /><path d='m6 6 12 12' />
    </svg>
  ),
  Search: () => (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
      <circle cx='11' cy='11' r='7' /><path d='m20 20-3.5-3.5' />
    </svg>
  ),
  Doc: () => (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
      <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
      <path d='M14 2v6h6' />
    </svg>
  ),
  Copy: () => (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
      <rect x='9' y='9' width='11' height='11' rx='2' />
      <path d='M5 15V5a2 2 0 0 1 2-2h10' />
    </svg>
  ),
  Coin: () => (
    <svg width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
      <circle cx='12' cy='12' r='9' /><path d='M8 12h8' /><path d='M12 8v8' />
    </svg>
  ),
  Arrow: () => (
    <svg width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round'>
      <path d='M5 12h14' /><path d='m13 5 7 7-7 7' />
    </svg>
  ),
  PrevPage: () => (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round'>
      <path d='m15 18-6-6 6-6' />
    </svg>
  ),
  NextPage: () => (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round'>
      <path d='m9 6 6 6-6 6' />
    </svg>
  ),
  Inbox: () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round'>
      <polyline points='22 12 16 12 14 15 10 15 8 12 2 12' />
      <path d='M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z' />
    </svg>
  ),
};

const TopupHistoryModal = ({ visible, onCancel, t, userInfo }) => {
  const userIsAdmin = useMemo(() => isAdmin(), []);

  const [loading, setLoading] = useState(false);
  const [topups, setTopups] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [keywordDraft, setKeywordDraft] = useState('');
  const searchTimerRef = useRef(null);

  const [stats, setStats] = useState({ ok: 0, pending: 0, failed: 0, totalMoney: 0 });

  const [billVisible, setBillVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const apiBase = userIsAdmin ? '/api/user/topup' : '/api/user/topup/self';

  const loadTopups = async (currentPage, currentPageSize, kw) => {
    setLoading(true);
    try {
      const qs =
        `p=${currentPage}&page_size=${currentPageSize}` +
        (kw ? `&keyword=${encodeURIComponent(kw)}` : '');
      const res = await API.get(`${apiBase}?${qs}`);
      const { success, message, data } = res.data;
      if (success) {
        setTopups(data.items || []);
        setTotal(data.total || 0);
      } else {
        Toast.error({ content: message || t('加载失败') });
      }
    } catch (e) {
      Toast.error({ content: t('加载账单失败') });
    } finally {
      setLoading(false);
    }
  };

  // Independent stats fetch — pulls a wider window once per modal open.
  // Stats reflect all-time scope, so we don't refetch on per-page or
  // keyword changes; just on open and after admin 补单 succeeds.
  const loadStats = async () => {
    try {
      const res = await API.get(`${apiBase}?p=1&page_size=200`);
      if (!res.data?.success) return;
      const items = res.data.data?.items || [];
      let ok = 0, pending = 0, failed = 0, totalMoney = 0;
      items.forEach((r) => {
        if (r.status === 'success') {
          ok += 1;
          totalMoney += Number(r.money) || 0;
        } else if (r.status === 'pending') {
          pending += 1;
        } else if (r.status === 'failed' || r.status === 'expired') {
          failed += 1;
        }
      });
      setStats({ ok, pending, failed, totalMoney });
    } catch {
      /* non-fatal */
    }
  };

  useEffect(() => {
    if (!visible) return;
    loadTopups(page, pageSize, keyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, page, pageSize, keyword]);

  useEffect(() => {
    if (visible) {
      // reset on open so the modal always shows from page 1
      setPage(1);
      setKeyword('');
      setKeywordDraft('');
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const onKeywordInput = (v) => {
    setKeywordDraft(v);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      setKeyword(v);
    }, 220);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageList = buildPageList(page, totalPages);
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(total, page * pageSize);

  const handleAdminComplete = (tradeNo) => {
    Modal.confirm({
      title: t('确认补单'),
      content: t('是否将该订单标记为成功并为用户入账？'),
      onOk: async () => {
        try {
          const res = await API.post('/api/user/topup/complete', {
            trade_no: tradeNo,
          });
          const { success, message } = res.data;
          if (success) {
            Toast.success({ content: t('补单成功') });
            await loadTopups(page, pageSize, keyword);
            await loadStats();
          } else {
            Toast.error({ content: message || t('补单失败') });
          }
        } catch {
          Toast.error({ content: t('补单失败') });
        }
      },
    });
  };

  const onCopyTradeNo = async (e, tradeNo) => {
    e.stopPropagation();
    const ok = await copy(tradeNo);
    if (ok) Toast.success({ content: t('已复制订单号') });
  };

  const renderPaymentChip = (pm) => {
    const def = PAYMENT_DEF[pm];
    if (def) {
      return (
        <span className={`tbm-pm ${def.cls}`}>
          <span className='dot' />
          {t(def.label)}
        </span>
      );
    }
    return (
      <span className='tbm-pm'>
        <span className='dot' />
        {pm || '—'}
      </span>
    );
  };

  const renderCredits = (record) => {
    if (isSubscriptionTopup(record)) {
      return <span className='tbm-credits sub'>{t('订阅套餐')}</span>;
    }
    return (
      <span className='tbm-credits'>
        <Icon.Coin />
        {record.amount}
      </span>
    );
  };

  const renderStatus = (status) => {
    if (status === 'success') {
      return (
        <span className='tbm-st ok'>
          <i />
          {t('成功')}
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className='tbm-st warn'>
          <i />
          {t('待支付')}
        </span>
      );
    }
    if (status === 'failed' || status === 'expired') {
      return (
        <span className='tbm-st bad'>
          <i />
          {t(status === 'expired' ? '已过期' : '失败')}
        </span>
      );
    }
    return <span className='tbm-st'>{status}</span>;
  };

  const openDetail = (record) => {
    setSelectedRecord(record);
    setBillVisible(true);
  };

  return (
    <Modal
      visible={visible}
      onCancel={onCancel}
      header={null}
      footer={null}
      closable={false}
      maskClosable
      centered
      className='tbm-host'
      width={1040}
      style={{ maxWidth: 'calc(100vw - 32px)' }}
      bodyStyle={{ padding: 0 }}
    >
      <div className='tbm' role='dialog' aria-labelledby='tbm-title'>
        <header className='tbm-head'>
          <div className='ttl'>
            <div className='ic' aria-hidden='true'>
              <Icon.Title />
            </div>
            <div>
              <h2 id='tbm-title'>{t('充值账单')}</h2>
              <p className='sub'>{t('所有交易记录与状态明细')}</p>
            </div>
          </div>
          <button className='tbm-x' aria-label={t('关闭')} onClick={onCancel}>
            <Icon.X />
          </button>
        </header>

        <div className='tbm-tool'>
          <div className='tbm-search'>
            <Icon.Search />
            <input
              placeholder={t('搜索订单号')}
              value={keywordDraft}
              onChange={(e) => onKeywordInput(e.target.value)}
            />
          </div>
          <div className='tbm-stats'>
            <div className='tbm-stat ok'>
              <span className='l'>{t('成功')}</span>
              <span className='v'>{stats.ok}</span>
            </div>
            <div className='tbm-stat warn'>
              <span className='l'>{t('待支付')}</span>
              <span className='v'>{stats.pending}</span>
            </div>
            <div className='tbm-stat bad'>
              <span className='l'>{t('失败')}</span>
              <span className='v'>{stats.failed}</span>
            </div>
            <div className='tbm-stat'>
              <span className='l'>{t('总充值')}</span>
              <span className='v'>¥{stats.totalMoney.toFixed(0)}</span>
            </div>
          </div>
        </div>

        <div className='tbm-body'>
          {loading && (
            <div className='tbm-loading'>
              <Spin size='middle' />
            </div>
          )}
          {topups.length === 0 && !loading ? (
            <div className='tbm-empty'>
              <div className='ic'>
                <Icon.Inbox />
              </div>
              <div className='et'>{t('暂无充值记录')}</div>
              <div>{keyword ? t('试试更换搜索关键词') : t('完成第一笔充值后会显示在这里')}</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t('订单号')}</th>
                  <th>{t('支付方式')}</th>
                  <th>{t('充值额度')}</th>
                  <th className='right'>{t('支付金额')}</th>
                  <th>{t('状态')}</th>
                  {userIsAdmin && <th className='center'>{t('操作')}</th>}
                  <th className='right'>{t('创建时间')}</th>
                </tr>
              </thead>
              <tbody>
                {topups.map((row) => {
                  const { tag, suffix } = deriveOrderTag(row.trade_no);
                  const ts = splitTimestamp(row.create_time);
                  return (
                    <tr key={row.id}>
                      <td>
                        <div className='tbm-oid'>
                          <div className='docic'>
                            <Icon.Doc />
                          </div>
                          <div className='col'>
                            <span
                              className='num'
                              title={row.trade_no}
                              onClick={() => openDetail(row)}
                            >
                              {row.trade_no}
                            </span>
                            <span className='tag'>
                              {tag}
                              {suffix ? ` · #${suffix}` : ''}
                            </span>
                          </div>
                          <button
                            className='copy'
                            title={t('复制')}
                            onClick={(e) => onCopyTradeNo(e, row.trade_no)}
                          >
                            <Icon.Copy />
                          </button>
                        </div>
                      </td>
                      <td>{renderPaymentChip(row.payment_method)}</td>
                      <td>{renderCredits(row)}</td>
                      <td className='tbm-amt-col'>
                        <span className='tbm-amt'>
                          <span className='cur'>¥</span>
                          {Number(row.money || 0).toFixed(2)}
                        </span>
                      </td>
                      <td>{renderStatus(row.status)}</td>
                      {userIsAdmin && (
                        <td style={{ textAlign: 'center' }}>
                          {row.status === 'pending' ? (
                            <button
                              className='tbm-act'
                              onClick={() => handleAdminComplete(row.trade_no)}
                            >
                              {t('补单')}
                              <Icon.Arrow />
                            </button>
                          ) : (
                            <span className='tbm-act-empty'>—</span>
                          )}
                        </td>
                      )}
                      <td className='tbm-amt-col'>
                        <span className='tbm-time'>
                          <span className='d'>{ts.d}</span>
                          {ts.t && <span className='t'>{ts.t}</span>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <footer className='tbm-foot'>
          <div className='info'>
            {t('显示')} <b>{rangeStart}–{rangeEnd}</b> {t('条')} · {t('共')}{' '}
            <b>{total}</b> {t('条')}
          </div>
          <div className='tbm-pager'>
            <button
              disabled={page <= 1}
              aria-label={t('上一页')}
              onClick={() => setPage(page - 1)}
            >
              <Icon.PrevPage />
            </button>
            {pageList.map((p, idx) =>
              p === '…' ? (
                <span key={`e-${idx}`} className='ellip'>
                  …
                </span>
              ) : (
                <button
                  key={p}
                  className={p === page ? 'active' : ''}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ),
            )}
            <button
              disabled={page >= totalPages}
              aria-label={t('下一页')}
              onClick={() => setPage(page + 1)}
            >
              <Icon.NextPage />
            </button>
          </div>
          <div className='tbm-perpage'>
            {t('每页')}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </footer>
      </div>

      <BillDetailModal
        visible={billVisible}
        onCancel={() => {
          setBillVisible(false);
          setSelectedRecord(null);
        }}
        record={selectedRecord}
        userInfo={userInfo}
        t={t}
      />
    </Modal>
  );
};

export default TopupHistoryModal;
