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
import { Modal, Spin } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { API, renderQuota, showError, showSuccess } from '../../../helpers';
import { TIcon } from '../../Team/teamIcons';
import {
  avatarColor,
  formatStableTime,
  initials,
} from '../../Team/teamUiKit';
import '../../Team/team-design.css';
import './detail-modal.css';

const APP_PENDING = 0;
const APP_APPROVED = 1;
const APP_REJECTED = 2;
const APP_CANCELED = 3;

// Split a formatted currency string ("$1.23" / "¥0.00") into the leading
// non-digit symbol and the numeric tail so the design can render the
// currency in a smaller, dimmer style.
const splitCurrency = (formatted) => {
  const s = String(formatted ?? '');
  const m = s.match(/^([^\d-]*)(-?[\d.,]+)(.*)$/);
  if (!m) return { cur: '', val: s, unit: '' };
  return { cur: m[1].trim(), val: m[2], unit: m[3].trim() };
};

const StatusPill = ({ status, t }) => {
  if (status === APP_PENDING) {
    return <span className='td-pill td-pill-warn'>● {t('待审核')}</span>;
  }
  if (status === APP_APPROVED) {
    return (
      <span className='td-pill td-pill-ok'>
        <TIcon.Check size={11} />
        {t('已通过')}
      </span>
    );
  }
  if (status === APP_REJECTED) {
    return (
      <span className='td-pill td-pill-danger'>
        <TIcon.X size={11} />
        {t('已驳回')}
      </span>
    );
  }
  return <span className='td-pill td-pill-muted'>● {t('已撤回')}</span>;
};

const TeamApplicationsAdmin = ({ embedded = false }) => {
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('0');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

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
      const res = await API.get(
        `/api/admin/team-applications?${params.toString()}`,
      );
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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(total, page * pageSize);

  const body = (
    <>
      <div className='td-toolbar'>
        <div className='td-toolbar-hint'>
          {t('审核用户提交的团队创建申请')}
        </div>
        <select
          className='td-select'
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value='0'>{t('待审核')}</option>
          <option value='-1'>{t('全部状态')}</option>
          <option value='1'>{t('已通过')}</option>
          <option value='2'>{t('已驳回')}</option>
          <option value='3'>{t('已撤回')}</option>
        </select>
        <button
          type='button'
          className='td-btn td-btn-ghost'
          onClick={fetchList}
        >
          <TIcon.Refresh />
          {t('刷新')}
        </button>
      </div>

      <div className='td-table-card'>
        <div className='td-table-scroll'>
          <table className='td-t'>
            <thead>
              <tr>
                <th>{t('申请人')}</th>
                <th>{t('团队名称')}</th>
                <th>{t('申请理由')}</th>
                <th className='num' style={{ width: 130 }}>
                  {t('钱包余额')}
                </th>
                <th style={{ width: 110 }}>{t('状态')}</th>
                <th style={{ width: 170 }}>{t('提交时间')}</th>
                <th className='actions' style={{ width: 130 }}>
                  {t('操作')}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px' }}>
                    <Spin />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--td-ink-400)' }}
                  >
                    {t('暂无申请')}
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const app = row.application || {};
                  const name = row.display_name || row.username || `#${app.user_id}`;
                  const sub = row.username || `ID: ${app.user_id}`;
                  const isPending = app.status === APP_PENDING;
                  return (
                    <tr key={app.id}>
                      <td>
                        <div className='td-user-cell'>
                          <div className={'td-avatar ' + avatarColor(app.user_id)}>
                            {initials(name)}
                          </div>
                          <div className='info'>
                            <div className='name'>{name}</div>
                            <div className='sub'>@{sub}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{app.name}</strong>
                      </td>
                      <td
                        style={{
                          color: 'var(--td-ink-500)',
                          maxWidth: 240,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={app.reason || ''}
                      >
                        {app.reason || (
                          <span style={{ color: 'var(--td-ink-400)' }}>—</span>
                        )}
                      </td>
                      <td className='num'>{renderQuota(row.user_quota || 0)}</td>
                      <td>
                        <StatusPill status={app.status} t={t} />
                      </td>
                      <td className='td-mono' style={{ color: 'var(--td-ink-500)', fontSize: 12 }}>
                        {formatStableTime(app.created_at)}
                      </td>
                      <td className='actions'>
                        {isPending ? (
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              type='button'
                              className='td-btn td-btn-primary td-btn-sm'
                              onClick={() => openDetail(app.id)}
                            >
                              <TIcon.Eye />
                              {t('审核')}
                            </button>
                          </div>
                        ) : (
                          <button
                            type='button'
                            className='td-btn td-btn-ghost td-btn-sm'
                            onClick={() => openDetail(app.id)}
                          >
                            <TIcon.Eye />
                            {t('查看')}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className='td-table-foot'>
          <div>
            {t('显示第')} {rangeStart} {t('条 - 第')} {rangeEnd} {t('条，共')} {total} {t('条')}
          </div>
          <div className='td-pager'>
            <button
              type='button'
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <TIcon.ChevronLeft />
            </button>
            <button type='button' className='active'>
              {page}
            </button>
            <button
              type='button'
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <TIcon.ChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* Design-faithful detail / review modal. */}
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
    </>
  );

  if (embedded) return body;
  return (
    <div className='team-design w-full max-w-[1240px] mx-auto px-7 pt-7 pb-20'>
      <div className='td-head'>
        <div>
          <h1 className='td-title'>{t('团队审批')}</h1>
          <div className='td-sub'>
            {t('审核用户提交的团队创建申请')}
          </div>
        </div>
      </div>
      {body}
    </div>
  );
};

// ---------- Detail modal icons (own scoped set, kept stylistically distinct
//            from team-design icons because the modal has its own palette) ----

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

const STATUS_PILL = {
  [APP_PENDING]: { cls: 'warn', label: '待审核' },
  [APP_APPROVED]: { cls: 'ok', label: '已通过' },
  [APP_REJECTED]: { cls: 'err', label: '已驳回' },
  [APP_CANCELED]: { cls: 'neut', label: '已撤回' },
};

const DetailBody = ({
  t,
  detail,
  reviewComment,
  setReviewComment,
  onApprove,
  onReject,
  onClose,
  reviewing,
}) => {
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
              {t('提交时间')} ·{' '}
              <span className='mono'>{formatStableTime(app.created_at)}</span>
              {app.reviewed_at ? (
                <>
                  {' '}
                  · {t('审核时间')}{' '}
                  <span className='mono'>{formatStableTime(app.reviewed_at)}</span>
                </>
              ) : null}
            </p>
          </div>
        </div>
        <button className='x' aria-label={t('关闭')} onClick={onClose} type='button'>
          <IcClose />
        </button>
      </header>

      <div className='body'>
        <div className='reason' title={app.reason || ''}>
          <span className='lbl'>
            <IcInfo size={11} />
            {t('申请理由')}
          </span>
          <span className='val'>
            {app.reason ? app.reason : <em className='dim'>{t('未填写')}</em>}
          </span>
        </div>

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
                        {t('到期')}{' '}
                        <span className='mono'>{formatStableTime(sub.end_time)}</span>
                      </span>
                    </div>
                    <span className='sub-tag'>{t('生效中')}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

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
      <span className={`v ${empty ? 'dim' : ''}`}>
        {empty ? placeholder || '—' : v}
      </span>
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
