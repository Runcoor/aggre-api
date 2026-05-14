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

// SKILLS 广场 — "我的中心" (My Center) page.
// Three tabs: 收藏 / 评分 / 评论. Each tab lists the user's contributions
// linked back to the source skill. Phase 2 placeholder design: scaffolded
// to host "我的发布 / 草稿 / 案例" tabs in V1.1 without a redesign.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bookmark,
  Star,
  MessageSquare,
  ArrowLeft,
  Inbox,
} from 'lucide-react';
import { API, showError, getUserIdFromLocalStorage } from '../../helpers';
import { SKILL_PLAZA_STYLES, SourceBadge, ProceduralCover } from './styles';

const TABS = [
  { id: 'favorites', icon: Bookmark, label: '收藏' },
  { id: 'ratings', icon: Star, label: '我的评分' },
  { id: 'comments', icon: MessageSquare, label: '我的评论' },
];

const MyCenter = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userId = getUserIdFromLocalStorage();
  const [tab, setTab] = useState('favorites');
  const [data, setData] = useState({
    favorites: [],
    ratings: [],
    comments: [],
  });
  const [loading, setLoading] = useState(false);

  // Redirect logged-out users to login. We keep this client-side to avoid
  // a flash of empty state — and so anyone deep-linking can come back here
  // after login.
  useEffect(() => {
    if (userId <= 0) navigate('/login', { replace: true });
  }, [userId, navigate]);

  useEffect(() => {
    if (userId <= 0) return;
    setLoading(true);
    const url =
      tab === 'favorites'
        ? '/api/skill-plaza/me/favorites'
        : tab === 'ratings'
          ? '/api/skill-plaza/me/ratings'
          : '/api/skill-plaza/me/comments';
    API.get(url)
      .then((res) => {
        if (res.data?.success) {
          setData((prev) => ({ ...prev, [tab]: res.data.data?.items || [] }));
        } else {
          showError(res.data?.message);
        }
      })
      .catch((e) => showError(e?.message))
      .finally(() => setLoading(false));
  }, [tab, userId]);

  if (userId <= 0) return null;

  return (
    <>
      <style>{SKILL_PLAZA_STYLES}</style>
      <div className='skp-root'>
        <div className='skp-page'>
          {/* Header */}
          <div style={{ marginBottom: 18 }}>
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
              <ArrowLeft size={12} /> {t('返回 SKILLS 广场')}
            </Link>
            <h1
              style={{
                fontSize: 28,
                margin: '4px 0 0',
                letterSpacing: '-0.4px',
              }}
            >
              {t('我的中心')}
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: '6px 0 0' }}>
              {t('管理你的收藏、评分和评论。')}
            </p>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              borderBottom: '1px solid var(--border-default)',
              marginBottom: 18,
            }}
          >
            {TABS.map((tt) => {
              const Icon = tt.icon;
              const count = data[tt.id]?.length || 0;
              return (
                <button
                  key={tt.id}
                  onClick={() => setTab(tt.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 14px',
                    background: 'transparent',
                    border: 0,
                    fontSize: 14,
                    fontWeight: tab === tt.id ? 600 : 500,
                    color: tab === tt.id ? '#0072ff' : 'var(--text-secondary)',
                    borderBottom:
                      tab === tt.id
                        ? '2px solid #0072ff'
                        : '2px solid transparent',
                    cursor: 'pointer',
                    marginBottom: -1,
                  }}
                >
                  <Icon size={14} /> {t(tt.label)}
                  <span
                    style={{
                      marginLeft: 4,
                      fontSize: 12,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 13,
              }}
            >
              {t('加载中...')}
            </div>
          ) : tab === 'favorites' ? (
            <FavoritesList items={data.favorites} />
          ) : tab === 'ratings' ? (
            <RatingsList items={data.ratings} />
          ) : (
            <CommentsList items={data.comments} />
          )}

          <div style={{ height: 60 }} />
        </div>
      </div>
    </>
  );
};

function EmptyState({ message }) {
  const { t } = useTranslation();
  return (
    <div
      style={{
        padding: '60px 0',
        textAlign: 'center',
        color: 'var(--text-muted)',
      }}
    >
      <Inbox size={22} style={{ opacity: 0.5, marginBottom: 8 }} />
      <div style={{ fontSize: 14 }}>{message}</div>
      <div style={{ fontSize: 12.5, marginTop: 4, opacity: 0.7 }}>
        {t('去 SKILLS 广场看看吧')}
      </div>
      <Link
        to='/skills'
        style={{
          display: 'inline-block',
          marginTop: 14,
          padding: '7px 16px',
          borderRadius: 8,
          color: '#fff',
          background: 'linear-gradient(135deg,#0072ff,#00c6ff)',
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        {t('去浏览')}
      </Link>
    </div>
  );
}

function FavoritesList({ items }) {
  const { t } = useTranslation();
  if (!items.length) return <EmptyState message={t('你还没有收藏任何 Skill')} />;
  return (
    <div className='skp-grid'>
      {items.map((s) => (
        <Link key={s.id} to={`/skills/${s.slug}`} className='skp-card'>
          <ProceduralCover seed={s.cover_seed || s.slug} label={s.name} />
          <div className='skp-card-body'>
            <div className='skp-card-row'>
              <SourceBadge type={s.source_type} />
              <span
                style={{
                  fontSize: 11.5,
                  color: 'var(--text-muted)',
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Star size={12} color='#f59e0b' fill='#f59e0b' />
                {(s.rating_average || 0).toFixed(1)}
              </span>
            </div>
            <h3 className='skp-card-title'>{s.name}</h3>
            <p
              className='skp-card-summary'
              style={{
                color: 'var(--text-muted)',
                fontSize: 12,
                fontFamily: 'monospace',
              }}
            >
              {s.slug}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function RatingsList({ items }) {
  const { t } = useTranslation();
  if (!items.length) return <EmptyState message={t('你还没有给任何 Skill 打分')} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map(({ rating, skill }) => (
        <Link
          key={rating.id}
          to={`/skills/${skill.slug}`}
          style={{
            display: 'block',
            padding: 14,
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 12,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 6,
            }}
          >
            <strong style={{ fontSize: 14 }}>{skill.name}</strong>
            <SourceBadge type={skill.source_type} />
            <span
              style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}
            >
              {new Date((rating.updated_at || 0) * 1000).toLocaleDateString()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 12.5, marginTop: 6 }}>
            <Dim label={t('易用性')} v={rating.usability} />
            <Dim label={t('实用性')} v={rating.practicality} />
            <Dim label={t('清晰度')} v={rating.clarity} />
            <Dim label={t('稳定性')} v={rating.stability} />
            <Dim label={t('创新性')} v={rating.innovation} />
            <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}>
              {t('总分')}{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {(rating.overall || 0).toFixed(1)}
              </strong>
            </span>
          </div>
          {rating.comment && (
            <div
              style={{
                marginTop: 10,
                padding: 10,
                background: 'var(--bg-base)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
              }}
            >
              {rating.comment}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}

function Dim({ label, v }) {
  return (
    <span style={{ color: 'var(--text-muted)' }}>
      {label}{' '}
      <strong style={{ color: 'var(--text-primary)' }}>{v || 0}</strong>
    </span>
  );
}

function CommentsList({ items }) {
  const { t } = useTranslation();
  if (!items.length) return <EmptyState message={t('你还没有发表过评论')} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map(({ comment, skill }) => (
        <Link
          key={comment.id}
          to={`/skills/${skill.slug}`}
          style={{
            display: 'block',
            padding: 14,
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 12,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8,
            }}
          >
            <strong style={{ fontSize: 14 }}>{skill.name}</strong>
            <SourceBadge type={skill.source_type} />
            <span
              style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}
            >
              {new Date((comment.created_at || 0) * 1000).toLocaleString()}
            </span>
          </div>
          <div
            style={{
              fontSize: 14,
              color: 'var(--text-primary)',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}
          >
            {comment.content}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default MyCenter;
