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

// SKILLS 广场 — 作者公开主页 /skills/u/:username (P4-6).
//
// Lists the user's approved articles + aggregate stats + a tiered level
// badge. Public — anyone (logged in or not) can view another author's
// home. The level tier is computed server-side from articles + likes; we
// just style it here.

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Award,
  FileText,
  Heart,
  Eye,
  MessageSquare,
  Bookmark,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { API, showError } from '../../helpers';
import { SKILL_PLAZA_STYLES } from './styles';

const LEVEL_BADGES = {
  1: { name: '新人', color: '#64748b', bg: '#f1f5f9' },
  2: { name: '活跃', color: '#0ea5e9', bg: '#e0f2fe' },
  3: { name: '资深', color: '#7c3aed', bg: '#ede9fe' },
  4: { name: '大佬', color: '#d97706', bg: '#fef3c7' },
  5: { name: '传奇', color: '#dc2626', bg: '#fee2e2' },
};

const TYPE_LABEL = {
  tutorial: '教程',
  review: '测评',
  showcase: '案例',
  troubleshooting: '排错',
  prompts: 'Prompt',
  comparison: '对比',
};

const UserHomePage = () => {
  const { t } = useTranslation();
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    API.get(`/api/skill-plaza/u/${encodeURIComponent(username)}`)
      .then((res) => {
        if (res.data?.success) setData(res.data.data);
        else showError(res.data?.message || t('加载失败'));
      })
      .catch((e) => showError(e?.message || t('加载失败')))
      .finally(() => setLoading(false));
  }, [username, t]);

  if (loading) {
    return (
      <div
        style={{
          padding: 60,
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        {t('加载中…')}
      </div>
    );
  }

  if (!data) {
    return (
      <>
        <style>{SKILL_PLAZA_STYLES}</style>
        <div className='skp-root'>
          <div className='skp-page skp-narrow'>
            <Link
              to='/skills'
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
              <ArrowLeft size={12} /> {t('返回广场')}
            </Link>
            <div
              style={{
                padding: 60,
                textAlign: 'center',
                color: 'var(--text-muted)',
                background: 'var(--surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 14,
              }}
            >
              {t('用户不存在或主页不公开。')}
            </div>
          </div>
        </div>
      </>
    );
  }

  const p = data.profile || {};
  const articles = data.articles || [];
  const badge = LEVEL_BADGES[p.level] || LEVEL_BADGES[1];
  const initial = (p.display_name || p.username || '?').slice(0, 1).toUpperCase();

  return (
    <>
      <style>{SKILL_PLAZA_STYLES}</style>
      <div className='skp-root'>
        <div className='skp-page'>
          <Link
            to='/skills'
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
            <ArrowLeft size={12} /> {t('返回广场')}
          </Link>

          {/* Hero */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              padding: '22px 0 8px',
            }}
          >
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                background:
                  'linear-gradient(135deg,#0072ff 0%,#00c6ff 100%)',
                color: '#fff',
                fontSize: 36,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 28,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                {p.display_name || p.username}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: badge.bg,
                    color: badge.color,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <Award size={12} /> Lv{p.level} · {t(badge.name)}
                </span>
              </h1>
              <div
                style={{
                  marginTop: 4,
                  color: 'var(--text-muted)',
                  fontSize: 13,
                }}
              >
                @{p.username}
              </div>
              {p.joined_at > 0 && (
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 12.5,
                    marginTop: 8,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Calendar size={12} />{' '}
                  {t('加入于 {{d}}').replace(
                    '{{d}}',
                    new Date(p.joined_at * 1000).toLocaleDateString(),
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12,
              margin: '20px 0',
            }}
          >
            <Stat Icon={FileText} label={t('已发布文章')} value={p.article_count} />
            <Stat
              Icon={Heart}
              label={t('收到的赞')}
              value={p.total_likes}
              tint='#dc2626'
            />
            <Stat
              Icon={Eye}
              label={t('累计浏览')}
              value={p.total_views}
              tint='#0ea5e9'
            />
            <Stat
              Icon={MessageSquare}
              label={t('评论数')}
              value={p.comment_count}
              tint='#7c3aed'
            />
            <Stat
              Icon={Bookmark}
              label={t('收藏数')}
              value={p.favorite_count}
              tint='#d97706'
            />
          </div>

          {/* Articles list */}
          <h2 style={{ fontSize: 18, margin: '20px 0 12px' }}>
            {t('已发布的文章')}
          </h2>
          {articles.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
                color: 'var(--text-muted)',
                background: 'var(--surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 14,
                fontSize: 13,
              }}
            >
              {t('Ta 还没有发布过文章。')}
            </div>
          ) : (
            <div className='skp-grid'>
              {articles.map((a) => (
                <Link
                  key={a.id}
                  to={`/skills/article/${a.slug}`}
                  className='skp-card'
                >
                  {a.cover_image && (
                    <div className='skp-card-cover'>
                      <img
                        src={a.cover_image}
                        alt=''
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  )}
                  <div className='skp-card-body'>
                    <div className='skp-card-row'>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: 'var(--bg-base)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {t(TYPE_LABEL[a.type] || a.type)}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {new Date(
                          (a.published_at || 0) * 1000,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className='skp-card-title'>{a.title}</div>
                    <div className='skp-card-summary'>{a.summary}</div>
                    {a.tags && a.tags.length > 0 && (
                      <div className='skp-card-tags'>
                        {a.tags.slice(0, 3).map((tg) => (
                          <span key={tg} className='skp-mini-tag'>
                            #{tg}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className='skp-card-meta'>
                      <span>
                        <Eye size={11} /> {a.view_count || 0}
                      </span>
                      <span>
                        <Heart size={11} /> {a.like_count || 0}
                      </span>
                      {a.skill_slug && (
                        <Link
                          to={`/skills/${a.skill_slug}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            color: '#0072ff',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <ExternalLink size={11} /> {a.skill_name}
                        </Link>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div style={{ height: 80 }} />
        </div>
      </div>
    </>
  );
};

const Stat = ({ Icon, label, value, tint = '#0072ff' }) => (
  <div
    style={{
      padding: 14,
      background: 'var(--surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}
  >
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        background: tint + '22',
        color: tint,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={18} />
    </div>
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value || 0}</div>
    </div>
  </div>
);

export default UserHomePage;
