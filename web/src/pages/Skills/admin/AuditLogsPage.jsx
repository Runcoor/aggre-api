/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

For commercial licensing, please contact support@quantumnous.com
*/

// SKILLS 广场 — admin audit log timeline. Read-only history of admin
// actions: article publish/unpublish, skill delete, report resolve,
// settings update. Useful for after-the-fact attribution and sanity
// checks during the soft-launch phase.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  History,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trash2,
  Settings,
  Flag,
  FileText,
} from 'lucide-react';
import { API, showError } from '../../../helpers';
import { SKILL_PLAZA_STYLES } from '../styles';

const ACTION_META = {
  'article.publish': {
    icon: <CheckCircle2 size={14} color='#16a34a' />,
    label: '发布文章',
    color: '#16a34a',
  },
  'article.unpublish': {
    icon: <XCircle size={14} color='#a16207' />,
    label: '下架文章',
    color: '#a16207',
  },
  'skill.delete': {
    icon: <Trash2 size={14} color='#dc2626' />,
    label: '删除 Skill',
    color: '#dc2626',
  },
  'skill.update': {
    icon: <FileText size={14} color='#0072ff' />,
    label: '编辑 Skill',
    color: '#0072ff',
  },
  'skill.import': {
    icon: <FileText size={14} color='#0072ff' />,
    label: '导入 Skill',
    color: '#0072ff',
  },
  'report.resolve': {
    icon: <Flag size={14} color='#dc2626' />,
    label: '处理举报',
    color: '#dc2626',
  },
  'settings.update': {
    icon: <Settings size={14} color='#6366f1' />,
    label: '更新设置',
    color: '#6366f1',
  },
};

const FILTER_PILLS = [
  { id: '', name: '全部' },
  { id: 'article.publish', name: '发布' },
  { id: 'article.unpublish', name: '下架' },
  { id: 'skill.delete', name: '删除' },
  { id: 'report.resolve', name: '举报处理' },
  { id: 'settings.update', name: '设置' },
];

const AuditLogsPage = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    API.get('/api/skill-plaza/admin/audit-logs', {
      params: { action, limit: 200 },
    })
      .then((res) => {
        if (res.data?.success) {
          setItems(res.data.data?.items || []);
        } else showError(res.data?.message || '加载失败');
      })
      .catch((e) => showError(e?.message || '加载失败'))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

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
              {t('审核日志')}
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 13 }}>
              {t('记录每次管理员动作,便于事后追溯与权责审计。')}
            </p>
          </div>

          <div className='skp-filter-bar'>
            <div className='skp-filter-row'>
              <span className='skp-label-sm'>{t('动作')}</span>
              {FILTER_PILLS.map((p) => (
                <button
                  key={p.id || 'all'}
                  className={'skp-pill' + (action === p.id ? ' active' : '')}
                  onClick={() => setAction(p.id)}
                >
                  {t(p.name)}
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
                {loading ? t('加载中...') : t('暂无记录')}
              </div>
            ) : (
              items.map((row) => {
                const meta =
                  ACTION_META[row.action] || {
                    icon: <History size={14} />,
                    label: row.action,
                    color: 'var(--text-secondary)',
                  };
                return (
                  <div
                    key={row.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '180px 140px 1fr 160px',
                      padding: '12px 18px',
                      alignItems: 'center',
                      borderBottom: '1px solid var(--border-default)',
                      fontSize: 13,
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        color: meta.color,
                        fontWeight: 500,
                      }}
                    >
                      {meta.icon}
                      <span>{t(meta.label)}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {row.admin_name || `#${row.admin_id}`}
                    </div>
                    <div style={{ color: 'var(--text-primary)' }}>
                      {row.summary || '-'}
                    </div>
                    <div
                      style={{
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      {new Date((row.created_at || 0) * 1000).toLocaleString()}
                    </div>
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

export default AuditLogsPage;
