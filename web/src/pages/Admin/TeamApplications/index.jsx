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

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Modal,
  Select,
  Spin,
  Table,
  Tag,
  Typography,
} from '@douyinfe/semi-ui';
import { IconRefresh } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { API, renderQuota, showError, showSuccess } from '../../../helpers';
import './detail-modal.css';

const { Text } = Typography;

const APP_PENDING = 0;
const APP_APPROVED = 1;
const APP_REJECTED = 2;
const APP_CANCELED = 3;

const STATUS_OPTIONS = (t) => [
  { value: '0', label: t('待审核') },
  { value: '-1', label: t('全部状态') },
  { value: '1', label: t('已通过') },
  { value: '2', label: t('已驳回') },
  { value: '3', label: t('已撤回') },
];

const renderStatus = (status, t) => {
  switch (status) {
    case APP_PENDING:
      return <Tag color='blue'>{t('待审核')}</Tag>;
    case APP_APPROVED:
      return <Tag color='green'>{t('已通过')}</Tag>;
    case APP_REJECTED:
      return <Tag color='red'>{t('已驳回')}</Tag>;
    case APP_CANCELED:
      return <Tag color='grey'>{t('已撤回')}</Tag>;
    default:
      return <Tag>{status}</Tag>;
  }
};

// Format epoch seconds as "YYYY-MM-DD HH:MM:SS" — stable across locales,
// matches the design's mono timestamp style.
const formatStableTime = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// Split a formatted currency string ("$1.23" / "¥0.00") into the leading
// non-digit symbol and the numeric tail so the design can render the
// currency in a smaller, dimmer style.
const splitCurrency = (formatted) => {
  const s = String(formatted ?? '');
  const m = s.match(/^([^\d-]*)(-?[\d.,]+)(.*)$/);
  if (!m) return { cur: '', val: s, unit: '' };
  return { cur: m[1].trim(), val: m[2], unit: m[3].trim() };
};

// embedded=true is used when this component is rendered inside the Team
// page tabs container — the outer page already provides max-width chrome
// and a header, so we drop ours to avoid double-nesting.
const TeamApplicationsAdmin = ({ embedded = false }) => {
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('0');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Detail modal state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('p', page);
      params.set('size', pageSize);
      params.set('status', status);
      const res = await API.get(`/api/admin/team-applications?${params.toString()}`);
      if (res.data?.success) {
        setItems(res.data.data?.items || []);
        setTotal(res.data.data?.total || 0);
      } else {
        showError(res.data?.message || t('获取数据失败'));
      }
    } catch {
      showError(t('请求失败'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, status, t]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openDetail = async (appId) => {
    setDetailOpen(true);
    setDetail(null);
    setReviewComment('');
    setDetailLoading(true);
    try {
      const res = await API.get(`/api/admin/team-applications/${appId}`);
      if (res.data?.success) {
        setDetail(res.data.data);
      } else {
        showError(res.data?.message || t('加载详情失败'));
        setDetailOpen(false);
      }
    } catch {
      showError(t('请求失败'));
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!detail?.application?.id) return;
    setReviewing(true);
    try {
      const res = await API.post(
        `/api/admin/team-applications/${detail.application.id}/approve`,
        { comment: reviewComment.trim() },
      );
      if (res.data?.success) {
        showSuccess(t('已通过申请，团队已创建'));
        setDetailOpen(false);
        fetchList();
      } else {
        showError(res.data?.message || t('操作失败'));
      }
    } catch {
      showError(t('请求失败'));
    } finally {
      setReviewing(false);
    }
  };

  const handleReject = async () => {
    if (!detail?.application?.id) return;
    if (!reviewComment.trim()) {
      showError(t('请填写驳回原因'));
      return;
    }
    setReviewing(true);
    try {
      const res = await API.post(
        `/api/admin/team-applications/${detail.application.id}/reject`,
        { comment: reviewComment.trim() },
      );
      if (res.data?.success) {
        showSuccess(t('已驳回申请'));
        setDetailOpen(false);
        fetchList();
      } else {
        showError(res.data?.message || t('操作失败'));
      }
    } catch {
      showError(t('请求失败'));
    } finally {
      setReviewing(false);
    }
  };

  const columns = [
    {
      title: t('申请人'),
      dataIndex: 'username',
      width: 180,
      render: (text, record) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {record.display_name || text || `#${record.application?.user_id}`}
          </Text>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {text || `ID: ${record.application?.user_id}`}
          </div>
        </div>
      ),
    },
    {
      title: t('团队名称'),
      dataIndex: 'application',
      width: 180,
      render: (app) => <Text style={{ fontSize: 13 }}>{app?.name}</Text>,
    },
    {
      title: t('钱包余额'),
      dataIndex: 'user_quota',
      width: 130,
      render: (q) => <Text style={{ fontSize: 13 }}>{renderQuota(q || 0)}</Text>,
    },
    {
      title: t('状态'),
      dataIndex: 'application',
      width: 90,
      render: (app) => renderStatus(app?.status, t),
    },
    {
      title: t('提交时间'),
      dataIndex: 'application',
      width: 170,
      render: (app) => (
        <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {formatStableTime(app?.created_at)}
        </Text>
      ),
    },
    {
      title: t('操作'),
      dataIndex: 'application',
      width: 100,
      render: (app) => (
        <Button
          size='small'
          theme='light'
          type='primary'
          onClick={() => openDetail(app?.id)}
        >
          {t('查看')}
        </Button>
      ),
    },
  ];

  return (
    <div className={embedded ? '' : 'w-full max-w-7xl mx-auto px-4 sm:px-6 py-8'}>
      <div className='flex items-center justify-between mb-6'>
        {embedded ? (
          <Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {t('审核用户提交的团队创建申请')}
          </Text>
        ) : (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', margin: 0 }}>
              {t('团队审批')}
            </h1>
            <Text style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
              {t('审核用户提交的团队创建申请')}
            </Text>
          </div>
        )}
        <div className='flex items-center gap-2'>
          <Select
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            optionList={STATUS_OPTIONS(t)}
            style={{ width: 140 }}
          />
          <Button icon={<IconRefresh />} theme='light' onClick={fetchList}>
            {t('刷新')}
          </Button>
        </div>
      </div>

      <div
        className='rounded-[var(--radius-lg)]'
        style={{ background: 'var(--surface)', border: '1px solid var(--border-default)', overflow: 'hidden' }}
      >
        <Table
          columns={columns}
          dataSource={items}
          loading={loading}
          rowKey={(r) => r.application?.id}
          pagination={{
            currentPage: page,
            pageSize,
            total,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
          empty={
            <div className='text-center py-10' style={{ color: 'var(--text-muted)' }}>
              {t('暂无申请')}
            </div>
          }
        />
      </div>

      {/* Design-faithful detail / review modal. Semi <Modal> handles the
          backdrop, focus trap, and ESC; we strip its chrome (header /
          footer / close button) and render the design markup as the body. */}
      <Modal
        visible={detailOpen}
        onCancel={() => setDetailOpen(false)}
        header={null}
        footer={null}
        closable={false}
        centered
        width={680}
        className='tar-modal-wrap'
        bodyStyle={{ padding: 0 }}
      >
        {detailLoading || !detail ? (
          <div style={{ padding: 56, textAlign: 'center' }}>
            <Spin />
          </div>
        ) : (
          <DetailBody
            t={t}
            detail={detail}
            reviewComment={reviewComment}
            setReviewComment={setReviewComment}
            onApprove={handleApprove}
            onReject={handleReject}
            onClose={() => setDetailOpen(false)}
            reviewing={reviewing}
          />
        )}
      </Modal>
    </div>
  );
};

// ---------- Icons (inlined SVG to match the design's stroke widths) ----------

const IcFile = (p) => (
  <svg width={p.size || 18} height={p.size || 18} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
    <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
    <path d='M14 2v6h6' />
    <path d='m9 14 2 2 4-4' />
  </svg>
);
const IcClose = () => (
  <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <path d='M18 6 6 18' />
    <path d='m6 6 12 12' />
  </svg>
);
const IcInfo = (p) => (
  <svg width={p.size || 11} height={p.size || 11} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
    <circle cx='12' cy='12' r='9' />
    <path d='M12 8v4' />
    <path d='M12 16h.01' />
  </svg>
);
const IcUser = (p) => (
  <svg width={p.size || 12} height={p.size || 12} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <circle cx='12' cy='8' r='4' />
    <path d='M4 21a8 8 0 0 1 16 0' />
  </svg>
);
const IcMail = (p) => (
  <svg width={p.size || 10} height={p.size || 10} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <rect x='3' y='5' width='18' height='14' rx='2' />
    <path d='m3 7 9 6 9-6' />
  </svg>
);
const IcText = (p) => (
  <svg width={p.size || 10} height={p.size || 10} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <path d='M4 7h16' />
    <path d='M4 12h10' />
    <path d='M4 17h16' />
  </svg>
);
const IcCard = (p) => (
  <svg width={p.size || 10} height={p.size || 10} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <rect x='3' y='6' width='18' height='12' rx='2' />
    <path d='M7 10h.01' />
    <path d='M11 10h6' />
    <path d='M11 14h6' />
  </svg>
);
const IcWallet = (p) => (
  <svg width={p.size || 12} height={p.size || 12} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <rect x='2' y='6' width='20' height='14' rx='2.5' />
    <path d='M2 11h20' />
  </svg>
);
const IcCrown = (p) => (
  <svg width={p.size || 12} height={p.size || 12} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <path d='M3 8l4 3 5-6 5 6 4-3-2 11H5z' />
  </svg>
);
const IcLines = (p) => (
  <svg width={p.size || 12} height={p.size || 12} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <path d='M3 5h18' />
    <path d='M3 12h18' />
    <path d='M3 19h12' />
  </svg>
);
const IcCheck = () => (
  <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round'>
    <path d='m5 12 5 5 9-11' />
  </svg>
);

// ----------------------------- DetailBody -----------------------------

const STATUS_PILL = {
  [APP_PENDING]: { cls: 'warn', label: '待审核' },
  [APP_APPROVED]: { cls: 'ok', label: '已通过' },
  [APP_REJECTED]: { cls: 'err', label: '已驳回' },
  [APP_CANCELED]: { cls: 'neut', label: '已撤回' },
};

const DetailBody = ({ t, detail, reviewComment, setReviewComment, onApprove, onReject, onClose, reviewing }) => {
  const app = detail.application || {};
  const u = detail.user || {};
  const isPending = app.status === APP_PENDING;
  const pill = STATUS_PILL[app.status] || STATUS_PILL[APP_PENDING];

  const wallet = splitCurrency(renderQuota(u.quota || 0));
  const used = splitCurrency(renderQuota(u.used_quota || 0));
  const topUpCNY = (detail.topup_total_amount || 0).toFixed(2);
  const subs = detail.active_subscriptions || [];

  const reviewLen = (reviewComment || '').length;
  const REVIEW_MAX = 200;

  const handleReviewChange = (e) => {
    const v = e.target.value;
    if (v.length <= REVIEW_MAX) setReviewComment(v);
  };

  return (
    <div className='tar-modal'>
      {/* === header === */}
      <header className='m-head'>
        <div className='left'>
          <div className='ic' aria-hidden='true'>
            <IcFile size={18} />
          </div>
          <div>
            <h2>
              {app.name || '—'}
              <span className={`st ${pill.cls}`}>
                <i />
                {t(pill.label)}
              </span>
            </h2>
            <p className='meta'>
              {t('提交时间')} · <span className='mono'>{formatStableTime(app.created_at)}</span>
              {app.reviewed_at ? (
                <>
                  {' '}
                  · {t('审核时间')} <span className='mono'>{formatStableTime(app.reviewed_at)}</span>
                </>
              ) : null}
            </p>
          </div>
        </div>
        <button className='x' aria-label={t('关闭')} onClick={onClose} type='button'>
          <IcClose />
        </button>
      </header>

      {/* === body === */}
      <div className='body'>
        {/* reason callout — single-line ribbon */}
        <div className='reason' title={app.reason || ''}>
          <span className='lbl'>
            <IcInfo size={11} />
            {t('申请理由')}
          </span>
          <span className='val'>{app.reason ? app.reason : <em className='dim'>{t('未填写')}</em>}</span>
        </div>

        {/* applicant info — 4-col grid */}
        <section>
          <div className='sec-h'>
            <IcUser size={12} />
            <span className='t'>{t('申请人信息')}</span>
            <span className='line' />
          </div>
          <div className='info-grid'>
            <Field icon={<IcUser size={10} />} k={t('用户名')} v={u.username || '—'} />
            <Field icon={<IcMail size={10} />} k={t('邮箱')} v={u.email || ''} placeholder={t('未填写')} />
            <Field icon={<IcText size={10} />} k={t('显示名称')} v={u.display_name || ''} placeholder={t('未填写')} />
            <Field
              icon={<IcCard size={10} />}
              k={t('用户ID')}
              v={u.id ? <span className='mono'>#{u.id}</span> : '—'}
            />
          </div>
        </section>

        {/* account & billing — 6-col stat strip */}
        <section>
          <div className='sec-h'>
            <IcWallet size={12} />
            <span className='t'>{t('账户与计费')}</span>
            <span className='line' />
          </div>
          <div className='stats'>
            <Stat em label={t('钱包余额')} cur={wallet.cur} val={wallet.val} />
            <Stat label={t('累计已用')} cur={used.cur} val={used.val} />
            <Stat label={t('累计充值')} cur='¥' val={topUpCNY} />
            <Stat label={t('充值次数')} val={detail.topup_count || 0} unit={t('次')} />
            <Stat label={t('已拥有团队')} val={detail.owned_team_count || 0} />
            <Stat label={t('已加入团队')} val={detail.joined_team_count || 0} />
          </div>
        </section>

        {/* active subscriptions */}
        <section>
          <div className='sec-h'>
            <IcCrown size={12} />
            <span className='t'>{t('活跃订阅')}</span>
            <span className='line' />
          </div>
          {subs.length === 0 ? (
            <div className='sub-row'>
              <div className='ic' aria-hidden='true'>
                <IcCrown size={14} />
              </div>
              <span className='empty'>{t('暂无活跃订阅')}</span>
            </div>
          ) : (
            <div className='sub-list'>
              {subs.map((s, i) => {
                const sub = s.subscription || s;
                return (
                  <div className='sub-row active' key={i}>
                    <div className='ic' aria-hidden='true'>
                      <IcCrown size={14} />
                    </div>
                    <div className='sub-meta'>
                      <span className='sub-title'>
                        {sub.plan_title || sub.title || `Plan #${sub.plan_id}`}
                      </span>
                      <span className='sub-sub'>
                        {t('到期')} <span className='mono'>{formatStableTime(sub.end_time)}</span>
                      </span>
                    </div>
                    <span className='sub-tag'>{t('生效中')}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* review opinion (only when pending) */}
        {isPending ? (
          <section>
            <div className='sec-h'>
              <IcLines size={12} />
              <span className='t'>{t('审核意见')}</span>
              <span className='line' />
            </div>
            <div className='review'>
              <textarea
                value={reviewComment}
                onChange={handleReviewChange}
                placeholder={t('通过可选填，驳回必须说明原因')}
                rows={3}
              />
              <span className='count'>
                {reviewLen} / {REVIEW_MAX}
              </span>
            </div>
          </section>
        ) : app.review_comment ? (
          <section>
            <div className='sec-h'>
              <IcLines size={12} />
              <span className='t'>{t('审核意见')}</span>
              <span className='line' />
            </div>
            <div className='review-static'>{app.review_comment}</div>
          </section>
        ) : null}
      </div>

      {/* === footer === */}
      <footer className='foot'>
        {isPending ? (
          <>
            <span className='hint'>
              <IcInfo size={12} />
              {t('操作不可撤销，请确认信息')}
            </span>
            <div className='actions'>
              <button
                className='btn btn-ghost'
                type='button'
                onClick={onReject}
                disabled={reviewing}
              >
                <IcClose />
                {t('驳回')}
              </button>
              <button
                className='btn btn-pri'
                type='button'
                onClick={onApprove}
                disabled={reviewing}
              >
                <IcCheck />
                {t('通过并创建团队')}
              </button>
            </div>
          </>
        ) : (
          <>
            <span className='hint'>{t('该申请已结案')}</span>
            <div className='actions'>
              <button className='btn btn-ghost neutral' type='button' onClick={onClose}>
                {t('关闭')}
              </button>
            </div>
          </>
        )}
      </footer>
    </div>
  );
};

const Field = ({ icon, k, v, placeholder }) => {
  const empty = !v && v !== 0;
  return (
    <div className='field'>
      <span className='k'>
        {icon}
        {k}
      </span>
      <span className={`v ${empty ? 'dim' : ''}`}>{empty ? placeholder || '—' : v}</span>
    </div>
  );
};

const Stat = ({ em, label, cur, val, unit }) => (
  <div className={`stat ${em ? 'em' : ''}`}>
    <span className='k'>{label}</span>
    <span className='v'>
      {cur ? <span className='cur'>{cur}</span> : null}
      {val}
      {unit ? <span className='u'>{unit}</span> : null}
    </span>
  </div>
);

export default TeamApplicationsAdmin;
