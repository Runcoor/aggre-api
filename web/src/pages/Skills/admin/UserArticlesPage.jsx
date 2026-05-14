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

// SKILLS 广场 — 用户投稿审核管理 (P4-5).
//
// Admin queue for user-submitted articles. Filter by status pill, click a
// row to expand the full preview, then approve / reject (with reason) /
// offline. Audit log entries are written server-side for each action.

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Archive,
  Trash2,
  Eye,
  EyeOff,
  User as UserIcon,
  Tag,
} from 'lucide-react';
import { API, showError, showSuccess } from '../../../helpers';
import { MarkdownRenderer } from '../../../components/common/markdown/MarkdownRenderer';
import { SKILL_PLAZA_STYLES } from '../styles';

const STATUS_PILLS = [
  { id: 'pending', name: '待审核' },
  { id: 'approved', name: '已发布' },
  { id: 'rejected', name: '已驳回' },
  { id: 'offline', name: '已下架' },
  { id: 'draft', name: '草稿' },
  { id: '', name: '全部' },
];

const STATUS_META = {
  draft: { label: '草稿', color: '#64748b', bg: '#f1f5f9' },
  pending: { label: '待审核', color: '#a16207', bg: '#fef3c7' },
  approved: { label: '已发布', color: '#15803d', bg: '#dcfce7' },
  rejected: { label: '已驳回', color: '#b91c1c', bg: '#fee2e2' },
  offline: { label: '已下架', color: '#475569', bg: '#e2e8f0' },
};

const TYPE_LABEL = {
  tutorial: '教程',
  review: '测评',
  showcase: '案例',
  troubleshooting: '排错',
  prompts: 'Prompt',
  comparison: '对比',
};

const UserArticlesPage = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    API.get('/api/skill-plaza/admin/user-articles', {
      params: { status, page_size: 50 },
    })
      .then((res) => {
        if (res.data?.success) {
          setItems(res.data.data?.items || []);
          setCounts(res.data.data?.counts || {});
        } else showError(res.data?.message || t('加载失败'));
      })
      .catch((e) => showError(e?.message || t('加载失败')))
      .finally(() => setLoading(false));
  }, [status, t]);

  useEffect(() => {
    load();
  }, [load]);

  const expand = useCallback(
    async (id) => {
      if (expanded === id) {
        setExpanded(null);
        setDetail(null);
        return;
      }
      setExpanded(id);
      setDetail(null);
      try {
        const res = await API.get(`/api/skill-plaza/admin/user-articles/${id}`);
        if (res.data?.success) setDetail(res.data.data);
        else showError(res.data?.message);
      } catch (e) {
        showError(e?.message);
      }
    },
    [expanded],
  );

  const approve = useCallback(
    async (id) => {
      try {
        const res = await API.post(
          `/api/skill-plaza/admin/user-articles/${id}/approve`,
        );
        if (res.data?.success) {
          showSuccess(t('已通过审核'));
          load();
          if (expanded === id) {
            setDetail(res.data.data);
          }
        } else showError(res.data?.message);
      } catch (e) {
        showError(e?.message);
      }
    },
    [load, expanded, t],
  );

  const reject = useCallback(
    async (id) => {
      // eslint-disable-next-line no-alert
      const reason = window.prompt(t('请输入驳回理由 (会显示给作者):'));
      if (reason === null) return;
      try {
        const res = await API.post(
          `/api/skill-plaza/admin/user-articles/${id}/reject`,
          { reason },
        );
        if (res.data?.success) {
          showSuccess(t('已驳回'));
          load();
          if (expanded === id) setDetail(res.data.data);
        } else showError(res.data?.message);
      } catch (e) {
        showError(e?.message);
      }
    },
    [load, expanded, t],
  );

  const offline = useCallback(
    async (id) => {
      // eslint-disable-next-line no-alert
      const reason = window.prompt(t('请输入下架原因 (可留空):'));
      if (reason === null) return;
      try {
        const res = await API.post(
          `/api/skill-plaza/admin/user-articles/${id}/offline`,
          { reason: reason || '' },
        );
        if (res.data?.success) {
          showSuccess(t('已下架'));
          load();
          if (expanded === id) setDetail(res.data.data);
        } else showError(res.data?.message);
      } catch (e) {
        showError(e?.message);
      }
    },
    [load, expanded, t],
  );

  const remove = useCallback(
    async (id) => {
      // eslint-disable-next-line no-alert
      if (!window.confirm(t('确定删除这篇投稿吗？删除后无法恢复。'))) return;
      try {
        const res = await API.delete(
          `/api/skill-plaza/admin/user-articles/${id}`,
        );
        if (res.data?.success) {
          showSuccess(t('已删除'));
          load();
          if (expanded === id) {
            setExpanded(null);
            setDetail(null);
          }
        } else showError(res.data?.message);
      } catch (e) {
        showError(e?.message);
      }
    },
    [load, expanded, t],
  );

  return (
    <>
      <style>{SKILL_PLAZA_STYLES}</style>
      <div className='skp-root'>
        <div className='skp-page'>
          <div style={{ marginBottom: 18 }}>
            <Link
              to='/skills/admin'
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12.5,
                color: 'var(--text-muted)',
                textDecoration: 'none',
                marginBottom: 4,
              }}
            >
              <ArrowLeft size={12} /> {t('返回管理工作台')}
            </Link>
            <h1 style={{ fontSize: 26, margin: '4px 0 6px' }}>
              {t('用户投稿审核')}
            </h1>
            <p
              style={{
                color: 'var(--text-secondary)',
                margin: 0,
                fontSize: 13,
              }}
            >
              {t(
                '用户提交的教程 / 案例 / 测评 / 对比等内容。审核通过后即在广场公开。',
              )}
            </p>
          </div>

          {/* Status pills */}
          <div className='skp-filter-bar'>
            <div className='skp-filter-row'>
              <span className='skp-label-sm'>{t('状态')}</span>
              {STATUS_PILLS.map((p) => (
                <button
                  key={p.id || 'all'}
                  className={'skp-pill' + (status === p.id ? ' active' : '')}
                  onClick={() => {
                    setStatus(p.id);
                    setExpanded(null);
                    setDetail(null);
                  }}
                >
                  {t(p.name)}
                  {counts[p.id] !== undefined && (
                    <span className='count'> {counts[p.id]}</span>
                  )}
                </button>
              ))}
              <button
                className='skp-pill'
                style={{ marginLeft: 'auto' }}
                onClick={load}
              >
                <RefreshCw size={12} /> {t('刷新')}
              </button>
            </div>
          </div>

          {/* List */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            {items.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                {loading ? t('加载中…') : t('暂无投稿')}
              </div>
            ) : (
              items.map((a) => {
                const meta = STATUS_META[a.status] || STATUS_META.draft;
                const isOpen = expanded === a.id;
                return (
                  <div
                    key={a.id}
                    style={{
                      borderBottom: '1px solid var(--border-default)',
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          '90px 1.8fr 1fr 0.6fr 1fr 1.4fr',
                        padding: '12px 18px',
                        alignItems: 'center',
                        fontSize: 13,
                      }}
                    >
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: meta.bg,
                          color: meta.color,
                          fontSize: 11,
                          fontWeight: 600,
                          textAlign: 'center',
                        }}
                      >
                        {t(meta.label)}
                      </span>
                      <div
                        style={{
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          paddingRight: 12,
                        }}
                      >
                        {a.title}
                      </div>
                      <div
                        style={{
                          color: 'var(--text-secondary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <UserIcon size={12} />{' '}
                        {a.author_name || `#${a.author_id}`}
                      </div>
                      <span
                        style={{
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: 'var(--bg-base)',
                          color: 'var(--text-muted)',
                          fontSize: 11,
                          fontWeight: 500,
                          textAlign: 'center',
                        }}
                      >
                        {t(TYPE_LABEL[a.type] || a.type)}
                      </span>
                      <span
                        style={{ color: 'var(--text-muted)', fontSize: 12 }}
                      >
                        {new Date(
                          (a.updated_at || 0) * 1000,
                        ).toLocaleString()}
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          gap: 6,
                          justifyContent: 'flex-end',
                        }}
                      >
                        <button
                          className='skp-pill'
                          onClick={() => expand(a.id)}
                        >
                          {isOpen ? <EyeOff size={12} /> : <Eye size={12} />}{' '}
                          {isOpen ? t('收起') : t('查看')}
                        </button>
                        {a.status === 'pending' && (
                          <>
                            <button
                              className='skp-pill'
                              style={{
                                color: '#16a34a',
                                borderColor: '#dcfce7',
                              }}
                              onClick={() => approve(a.id)}
                            >
                              <CheckCircle2 size={12} /> {t('通过')}
                            </button>
                            <button
                              className='skp-pill'
                              style={{
                                color: '#dc2626',
                                borderColor: '#fee2e2',
                              }}
                              onClick={() => reject(a.id)}
                            >
                              <XCircle size={12} /> {t('驳回')}
                            </button>
                          </>
                        )}
                        {a.status === 'approved' && (
                          <button
                            className='skp-pill'
                            style={{
                              color: '#a16207',
                              borderColor: '#fef3c7',
                            }}
                            onClick={() => offline(a.id)}
                          >
                            <Archive size={12} /> {t('下架')}
                          </button>
                        )}
                        {a.status !== 'approved' && (
                          <button
                            className='skp-pill'
                            style={{ color: '#b91c1c' }}
                            onClick={() => remove(a.id)}
                            title={t('删除')}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {isOpen && (
                      <div
                        style={{
                          background: 'var(--bg-base)',
                          padding: '16px 18px',
                          borderTop: '1px dashed var(--border-default)',
                        }}
                      >
                        {!detail ? (
                          <div
                            style={{
                              color: 'var(--text-muted)',
                              fontSize: 13,
                            }}
                          >
                            {t('加载中…')}
                          </div>
                        ) : (
                          <>
                            {detail.cover_image && (
                              <img
                                src={detail.cover_image}
                                alt='cover'
                                style={{
                                  width: '100%',
                                  maxWidth: 480,
                                  borderRadius: 8,
                                  marginBottom: 12,
                                }}
                              />
                            )}
                            <div
                              style={{
                                color: 'var(--text-secondary)',
                                fontSize: 13,
                                marginBottom: 10,
                              }}
                            >
                              {detail.summary}
                            </div>
                            {detail.tags && detail.tags.length > 0 && (
                              <div
                                style={{
                                  display: 'flex',
                                  gap: 6,
                                  flexWrap: 'wrap',
                                  marginBottom: 14,
                                }}
                              >
                                {detail.tags.map((tg) => (
                                  <span
                                    key={tg}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3,
                                      padding: '2px 8px',
                                      borderRadius: 4,
                                      background: 'var(--surface)',
                                      color: 'var(--text-secondary)',
                                      fontSize: 12,
                                    }}
                                  >
                                    <Tag size={10} /> {tg}
                                  </span>
                                ))}
                              </div>
                            )}
                            {detail.reject_reason && (
                              <div
                                style={{
                                  background: '#fee2e2',
                                  color: '#b91c1c',
                                  padding: '8px 12px',
                                  borderRadius: 6,
                                  fontSize: 13,
                                  marginBottom: 12,
                                }}
                              >
                                <strong>{t('当前驳回理由')}:</strong>{' '}
                                {detail.reject_reason}
                              </div>
                            )}
                            <div
                              style={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border-default)',
                                borderRadius: 8,
                                padding: '14px 18px',
                                maxHeight: 600,
                                overflow: 'auto',
                              }}
                            >
                              <MarkdownRenderer
                                content={detail.content || ''}
                                fontSize={14}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div style={{ height: 60 }} />
        </div>
      </div>
    </>
  );
};

export default UserArticlesPage;
