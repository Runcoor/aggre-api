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

// Admin console — landing page for SKILLS 广场 management. Shows
// recent skills + a CTA to import a new repo from GitHub.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Github, Eye, Edit3, Trash2, RefreshCw } from 'lucide-react';
import { API, showError, showSuccess } from '../../../helpers';
import { SKILL_PLAZA_STYLES, SourceBadge, StatusBadge } from '../styles';

const AdminConsole = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  const load = () => {
    setLoading(true);
    const params = filterStatus
      ? { status: filterStatus, page_size: 100 }
      : { page_size: 100 };
    API.get('/api/skill-plaza/admin/skills', { params })
      .then((res) => {
        if (res.data?.success) {
          setItems(res.data.data?.items || []);
          setTotal(res.data.data?.total || 0);
        } else showError(res.data?.message || '加载失败');
      })
      .catch((e) => showError(e?.message || '加载失败'))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [filterStatus]);

  const onDelete = (id) => {
    if (
      !window.confirm(t('确定删除该 Skill 及其所有文章草稿吗?此操作不可撤销。'))
    )
      return;
    API.delete(`/api/skill-plaza/admin/skills/${id}`)
      .then((res) => {
        if (res.data?.success) {
          showSuccess(t('已删除'));
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}
          >
            <div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {t('管理员工作台')}
              </div>
              <h1
                style={{
                  fontSize: 28,
                  margin: '4px 0 0',
                  letterSpacing: '-0.4px',
                }}
              >
                {t('SKILLS 广场 · 内容管理')}
              </h1>
              <p style={{ color: 'var(--text-secondary)', margin: '6px 0 0' }}>
                {t(
                  '粘贴 GitHub 仓库地址,系统自动生成中英双语教程草稿,审核通过后发布到广场。',
                )}
              </p>
            </div>
            <Link
              to='/skills/admin/import'
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 10,
                color: '#fff',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
                background: 'linear-gradient(135deg,#0072ff,#00c6ff)',
                boxShadow: '0 4px 12px rgba(0,114,255,0.25)',
              }}
            >
              <Plus size={16} /> {t('从 GitHub 导入')}
            </Link>
          </div>

          {/* KPI strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              gap: 12,
              marginBottom: 18,
            }}
          >
            <KPI label={t('共计 Skill')} value={total} />
            <KPI
              label={t('已发布')}
              value={items.filter((s) => s.status === 'published').length}
            />
            <KPI
              label={t('草稿')}
              value={items.filter((s) => s.status === 'draft').length}
            />
            <KPI
              label={t('需更新')}
              value={
                items.filter(
                  (s) => s.status === 'needs_update' || s.status === 'expired',
                ).length
              }
            />
          </div>

          {/* Filter pills */}
          <div className='skp-filter-bar'>
            <div className='skp-filter-row'>
              <span className='skp-label-sm'>{t('状态')}</span>
              {[
                { id: '', name: '全部' },
                { id: 'draft', name: '草稿' },
                { id: 'review', name: '待审核' },
                { id: 'published', name: '已发布' },
                { id: 'offline', name: '已下架' },
                { id: 'needs_update', name: '需更新' },
              ].map((s) => (
                <button
                  key={s.id || 'all'}
                  className={
                    'skp-pill' + (filterStatus === s.id ? ' active' : '')
                  }
                  onClick={() => setFilterStatus(s.id)}
                >
                  {t(s.name)}
                </button>
              ))}
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
                gridTemplateColumns: '2.4fr 1fr 1.2fr 1fr 1.4fr',
                padding: '10px 18px',
                background: 'var(--bg-base)',
                color: 'var(--text-muted)',
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderBottom: '1px solid var(--border-default)',
              }}
            >
              <span>{t('Skill')}</span>
              <span>{t('来源')}</span>
              <span>{t('状态')}</span>
              <span>{t('Commit')}</span>
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
                {loading
                  ? t('加载中...')
                  : t('暂无 Skill,点击右上方按钮从 GitHub 导入')}
              </div>
            ) : (
              items.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2.4fr 1fr 1.2fr 1fr 1.4fr',
                    padding: '12px 18px',
                    alignItems: 'center',
                    fontSize: 13,
                    borderBottom: '1px solid var(--border-default)',
                  }}
                >
                  <div>
                    <div
                      style={{ fontWeight: 600, color: 'var(--text-primary)' }}
                    >
                      {s.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--text-muted)',
                        fontFamily: 'monospace',
                        marginTop: 2,
                      }}
                    >
                      {s.slug}
                    </div>
                  </div>
                  <SourceBadge type={s.source_type} />
                  <StatusBadge status={s.status} />
                  <code
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 11.5,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {s.commit_hash ? String(s.commit_hash).slice(0, 8) : '-'}
                  </code>
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <Link
                      to={`/skills/admin/review/${s.id}`}
                      className='skp-pill'
                    >
                      <Edit3 size={12} /> {t('审核')}
                    </Link>
                    {s.status === 'published' && (
                      <Link to={`/skills/${s.slug}`} className='skp-pill'>
                        <Eye size={12} /> {t('查看')}
                      </Link>
                    )}
                    {s.github_url && (
                      <a
                        href={s.github_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='skp-pill'
                      >
                        <Github size={12} />
                      </a>
                    )}
                    <button
                      className='skp-pill'
                      onClick={() => onDelete(s.id)}
                      style={{ color: '#dc2626', borderColor: '#fee2e2' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div
            style={{
              marginTop: 16,
              padding: 14,
              background: 'var(--bg-base)',
              borderRadius: 10,
              fontSize: 12.5,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <RefreshCw size={14} />
            {t(
              '提示:首次使用前需在「系统设置 → SKILLS 广场」启用模块并配置生成模型。',
            )}
          </div>

          <div style={{ height: 60 }} />
        </div>
      </div>
    </>
  );
};

const KPI = ({ label, value }) => (
  <div
    style={{
      padding: '16px 18px',
      background: 'var(--surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 14,
    }}
  >
    <div
      style={{
        fontSize: 24,
        fontWeight: 700,
        color: 'var(--text-primary)',
        letterSpacing: '-0.4px',
      }}
    >
      {value}
    </div>
    <div style={{ color: 'var(--text-muted)', fontSize: 12.5, marginTop: 4 }}>
      {label}
    </div>
  </div>
);

export default AdminConsole;
