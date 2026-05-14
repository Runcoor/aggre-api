/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

For commercial licensing, please contact support@quantumnous.com
*/

// SKILLS 广场 — admin reports queue. Filters by status (open / resolved /
// dismissed / all) and lets the admin resolve or dismiss each row. Comment
// reports get a deep-link to the parent skill so the admin can jump to
// the offending thread.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { API, showError, showSuccess } from '../../../helpers';
import { SKILL_PLAZA_STYLES } from '../styles';

const STATUS_PILLS = [
  { id: 'open', name: '待处理' },
  { id: 'resolved', name: '已处理' },
  { id: 'dismissed', name: '已驳回' },
  { id: 'all', name: '全部' },
];

const TARGET_LABEL = {
  comment: '评论',
  skill: 'Skill',
  showcase: '案例',
};

const ReportsPage = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [openCount, setOpenCount] = useState(0);
  const [status, setStatus] = useState('open');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    API.get('/api/skill-plaza/admin/reports', { params: { status } })
      .then((res) => {
        if (res.data?.success) {
          setItems(res.data.data?.items || []);
          setOpenCount(res.data.data?.open_count || 0);
        } else showError(res.data?.message || '加载失败');
      })
      .catch((e) => showError(e?.message || '加载失败'))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const resolve = (id, nextStatus) => {
    API.post(`/api/skill-plaza/admin/reports/${id}/resolve`, {
      status: nextStatus,
    })
      .then((res) => {
        if (res.data?.success) {
          showSuccess(
            nextStatus === 'resolved' ? t('已标记为处理完成') : t('已驳回举报'),
          );
          load();
        } else showError(res.data?.message);
      })
      .catch((e) => showError(e?.message));
  };

  return (
    <>
      <style>{SKILL_PLAZA_STYLES}</style>
      <div className='skp-root'>
        <div className='skp-page'>
          {/* Header */}
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
              {t('举报队列')}
              <span
                style={{
                  marginLeft: 12,
                  padding: '2px 10px',
                  background: openCount > 0 ? '#fee2e2' : 'var(--bg-base)',
                  color: openCount > 0 ? '#b91c1c' : 'var(--text-muted)',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {openCount} {t('待处理')}
              </span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 13 }}>
              {t(
                '用户对评论 / Skill / 案例发起的举报。处理完成会保留记录以便追溯。',
              )}
            </p>
          </div>

          {/* Filter pills */}
          <div className='skp-filter-bar'>
            <div className='skp-filter-row'>
              <span className='skp-label-sm'>{t('状态')}</span>
              {STATUS_PILLS.map((s) => (
                <button
                  key={s.id}
                  className={'skp-pill' + (status === s.id ? ' active' : '')}
                  onClick={() => setStatus(s.id)}
                >
                  {t(s.name)}
                </button>
              ))}
              <button
                onClick={load}
                className='skp-pill'
                style={{ marginLeft: 'auto' }}
              >
                <RefreshCw size={12} /> {t('刷新')}
              </button>
            </div>
          </div>

          {/* Table */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '0.8fr 1fr 2fr 1fr 1fr 1.4fr',
                padding: '10px 18px',
                background: 'var(--bg-base)',
                color: 'var(--text-muted)',
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderBottom: '1px solid var(--border-default)',
              }}
            >
              <span>{t('类型')}</span>
              <span>{t('目标')}</span>
              <span>{t('举报原因')}</span>
              <span>{t('举报人')}</span>
              <span>{t('状态')}</span>
              <span style={{ textAlign: 'right' }}>{t('操作')}</span>
            </div>
            {items.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                {loading ? t('加载中...') : t('暂无举报')}
              </div>
            ) : (
              items.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '0.8fr 1fr 2fr 1fr 1fr 1.4fr',
                    padding: '12px 18px',
                    alignItems: 'center',
                    fontSize: 13,
                    borderBottom: '1px solid var(--border-default)',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {t(TARGET_LABEL[r.target_type] || r.target_type)}
                  </span>
                  <code
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    #{r.target_id}
                  </code>
                  <div
                    style={{
                      color: 'var(--text-secondary)',
                      whiteSpace: 'pre-wrap',
                      maxHeight: 60,
                      overflow: 'hidden',
                      lineHeight: 1.5,
                    }}
                  >
                    {r.reason || (
                      <em style={{ color: 'var(--text-muted)' }}>
                        {t('(未填写)')}
                      </em>
                    )}
                  </div>
                  <code
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                    }}
                  >
                    #{r.reporter_id}
                  </code>
                  <StatusBadge status={r.status} />
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      justifyContent: 'flex-end',
                    }}
                  >
                    {r.target_type === 'skill' && (
                      <Link
                        to={`/skills/admin/review/${r.target_id}`}
                        className='skp-pill'
                        title={t('查看 Skill')}
                      >
                        <ExternalLink size={12} />
                      </Link>
                    )}
                    {r.status === 'open' && (
                      <>
                        <button
                          className='skp-pill'
                          style={{ color: '#16a34a', borderColor: '#dcfce7' }}
                          onClick={() => resolve(r.id, 'resolved')}
                          title={t('已处理')}
                        >
                          <CheckCircle2 size={12} /> {t('已处理')}
                        </button>
                        <button
                          className='skp-pill'
                          style={{ color: '#dc2626', borderColor: '#fee2e2' }}
                          onClick={() => resolve(r.id, 'dismissed')}
                          title={t('驳回')}
                        >
                          <XCircle size={12} /> {t('驳回')}
                        </button>
                      </>
                    )}
                    {r.status !== 'open' && (
                      <button
                        className='skp-pill'
                        onClick={() => resolve(r.id, 'open')}
                        title={t('重新打开')}
                      >
                        {t('重新打开')}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ height: 60 }} />
        </div>
      </div>
    </>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    open: { bg: '#fee2e2', fg: '#b91c1c', label: '待处理' },
    resolved: { bg: '#dcfce7', fg: '#15803d', label: '已处理' },
    dismissed: { bg: '#f1f5f9', fg: '#64748b', label: '已驳回' },
  };
  const m = map[status] || { bg: '#f1f5f9', fg: '#64748b', label: status };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        background: m.bg,
        color: m.fg,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {m.label}
    </span>
  );
};

export default ReportsPage;
