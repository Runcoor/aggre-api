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

// SKILLS 广场 — public detail page.
// Three-column: TOC | Article body | Sidebar (Skill info + ratings/comments
// placeholder tabs for phase 2).

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Star,
  Share2,
  Eye,
  Calendar,
} from 'lucide-react';
import { API, showError, showSuccess } from '../../helpers';
import { SKILL_PLAZA_STYLES, StatusBadge } from './styles';
import DetailSocial, { FavoriteButton } from './DetailSocial';
import { DocumentMarkdownRenderer } from '../../components/common/markdown/DocumentMarkdownRenderer';

function slugify(text) {
  return (
    'h-' +
    String(text)
      .toLowerCase()
      .replace(/[^a-z0-9一-龥]+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

function extractHeadings(md) {
  if (!md) return [];
  const out = [];
  const re = /^##\s+(.+)$/gm;
  let m;
  while ((m = re.exec(md)) !== null) {
    out.push({ text: m[1], id: slugify(m[1]) });
  }
  return out;
}

const SkillsDetail = () => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const language = searchParams.get('lang') || 'zh-CN';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  // moduleDisabled mirrors Plaza.jsx — when the gated /api/skill-plaza/*
  // path returns 404 (module off or test-mode blocked), we render a
  // friendly placeholder instead of toasting an error.
  const [moduleDisabled, setModuleDisabled] = useState(false);

  useEffect(() => {
    let aborted = false;
    setLoading(true);
    setModuleDisabled(false);
    API.get(`/api/skill-plaza/skills/${encodeURIComponent(slug)}`, {
      params: { language },
    })
      .then((res) => {
        if (aborted) return;
        if (res.data?.success) setData(res.data.data);
        else showError(res.data?.message || '加载失败');
      })
      .catch((e) => {
        if (aborted) return;
        if (e?.response?.status === 404) {
          setModuleDisabled(true);
        } else {
          showError(e?.message || '加载失败');
        }
      })
      .finally(() => {
        if (!aborted) setLoading(false);
      });
    return () => {
      aborted = true;
    };
  }, [slug, language]);

  const article = data?.article;
  const skill = data?.skill;
  const headings = useMemo(
    () => extractHeadings(article?.body || ''),
    [article?.body],
  );
  // Stable slugger so MarkdownContent's React.memo doesn't bust every render.
  // Same algorithm as extractHeadings, so the TOC anchors line up.
  const headingIdSlugger = useCallback((text) => slugify(text), []);

  if (loading) {
    return (
      <>
        <style>{SKILL_PLAZA_STYLES}</style>
        <div className='skp-root'>
          <div className='skp-page'>
            <p style={{ color: 'var(--text-muted)' }}>{t('加载中...')}</p>
          </div>
        </div>
      </>
    );
  }
  if (moduleDisabled) {
    return (
      <>
        <style>{SKILL_PLAZA_STYLES}</style>
        <div className='skp-root'>
          <div className='skp-page'>
            <div
              style={{
                marginTop: 60,
                padding: 40,
                textAlign: 'center',
                color: 'var(--text-muted)',
                background: 'var(--surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 14,
              }}
            >
              <div style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>
                {t('SKILLS 广场暂未开放')}
              </div>
              <div style={{ fontSize: 13 }}>
                {t('管理员尚未启用该模块,或当前账号不在测试可见范围内。')}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  if (!article || !skill) {
    return (
      <>
        <style>{SKILL_PLAZA_STYLES}</style>
        <div className='skp-root'>
          <div className='skp-page'>
            <Link
              to='/skills'
              style={{
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ArrowLeft size={14} /> {t('返回 SKILLS 广场')}
            </Link>
            <div style={{ marginTop: 40, color: 'var(--text-muted)' }}>
              {t('未找到该 Skill')}
            </div>
          </div>
        </div>
      </>
    );
  }

  const tags = data.tags || [];
  const langs = data.available_languages || [language];
  const publishedAt = article.published_at || article.updated_at;

  return (
    <>
      <style>{SKILL_PLAZA_STYLES}</style>
      <div className='skp-root'>
        <div className='skp-page skp-wide'>
          {/* Breadcrumb */}
          <div
            style={{
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--text-muted)',
              fontSize: 13,
            }}
          >
            <Link
              to='/skills'
              style={{
                color: 'inherit',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <ArrowLeft size={12} /> {t('SKILLS 广场')}
            </Link>
            <span>/</span>
            {skill.category && (
              <>
                <span>{skill.category}</span>
                <span>/</span>
              </>
            )}
            <span style={{ color: 'var(--text-secondary)' }}>{skill.name}</span>
          </div>

          {/* Article header — strict design match: badges row → title → meta */}
          <header className='skp-detail-header'>
            <div className='skp-detail-badges'>
              <StatusBadge status={skill.status || 'published'} />
              {tags.slice(0, 6).map((tg) => (
                <span key={tg} className='skp-mini-tag'>
                  {tg}
                </span>
              ))}
            </div>

            <h1>{article.title}</h1>

            {article.summary && (
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 15,
                  lineHeight: 1.7,
                  margin: '8px 0 0 0',
                }}
              >
                {article.summary}
              </p>
            )}

            <div className='skp-detail-meta'>
              {publishedAt > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Calendar size={13} />
                  {t('发布于')}{' '}
                  {new Date(publishedAt * 1000).toLocaleDateString()}
                </span>
              )}
              {skill.rating_count > 0 && (
                <>
                  <span className='sep'>·</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Star
                      size={13}
                      color='#f59e0b'
                      fill='#f59e0b'
                    />
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {(skill.rating_average || 0).toFixed(1)}
                    </strong>
                    <span style={{ color: 'var(--text-muted)' }}>
                      ({skill.rating_count} {t('评分')})
                    </span>
                  </span>
                </>
              )}
              {skill.view_count > 0 && (
                <>
                  <span className='sep'>·</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Eye size={13} />
                    {skill.view_count} {t('阅读')}
                  </span>
                </>
              )}

              {langs.length > 1 && (
                <div className='skp-tab-bar' style={{ marginLeft: 'auto' }}>
                  {langs.map((l) => (
                    <button
                      key={l}
                      onClick={() => setSearchParams({ lang: l })}
                      className={l === language ? 'active' : ''}
                    >
                      {l === 'en' ? 'English' : '中文'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* Three-column layout */}
          <div className='skp-detail-layout'>
            {/* TOC */}
            <aside className='skp-toc'>
              <h4>{t('本文目录')}</h4>
              <ol>
                {headings.map((h, i) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`}>
                      <span className='toc-num'>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {h.text}
                    </a>
                  </li>
                ))}
              </ol>
            </aside>

            {/* Body */}
            <main>
              <article>
                <DocumentMarkdownRenderer
                  content={article.body || ''}
                  headingIdSlugger={headingIdSlugger}
                />
              </article>

              <DetailSocial
                slug={slug}
                onSkillRefreshed={(s) => {
                  if (s) {
                    // Bottom RatingForm gave us the fresh Skill row;
                    // splice it into our local state so the sidebar
                    // reflects the new aggregates without a full reload.
                    setData((prev) => (prev ? { ...prev, skill: s } : prev));
                  } else {
                    // Comments don't return the Skill — re-fetch detail
                    // so comment_count on the sidebar stays accurate.
                    API.get(
                      `/api/skill-plaza/skills/${encodeURIComponent(slug)}`,
                      { params: { language } },
                    )
                      .then((res) => {
                        if (res.data?.success) setData(res.data.data);
                      })
                      .catch(() => {});
                  }
                }}
              />
            </main>

            {/* Sidebar */}
            <aside
              style={{
                position: 'sticky',
                top: 84,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div className='skp-side-card'>
                <h4>
                  <span>{t('Skill 信息')}</span>
                </h4>
                <div className='kv'>
                  <span>{t('分类')}</span>
                  <strong>{skill.category || '-'}</strong>
                </div>
                {skill.license && (
                  <div className='kv'>
                    <span>License</span>
                    <strong>{skill.license}</strong>
                  </div>
                )}
              </div>

              <div className='skp-side-card'>
                <h4>{t('标签')}</h4>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(data.tags || []).length === 0 ? (
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {t('暂无')}
                    </span>
                  ) : (
                    (data.tags || []).map((tag) => (
                      <span key={tag} className='skp-mini-tag'>
                        {tag}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className='skp-side-card'>
                <h4>{t('数据')}</h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3,1fr)',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <SideStat
                    icon={<Star size={14} color='#f59e0b' fill='#f59e0b' />}
                    value={(skill.rating_average || 0).toFixed(1)}
                    label={`${skill.rating_count || 0} ${t('评分')}`}
                  />
                  <SideStat
                    value={skill.favorite_count || 0}
                    label={t('收藏')}
                  />
                  <SideStat
                    value={skill.comment_count || 0}
                    label={t('评论')}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <FavoriteButton
                    slug={slug}
                    onCountChange={(n) =>
                      setData((prev) =>
                        prev
                          ? {
                              ...prev,
                              skill: { ...prev.skill, favorite_count: n },
                            }
                          : prev,
                      )
                    }
                  />
                  <button
                    className='skp-pill'
                    onClick={() => {
                      const url = window.location.href;
                      navigator.clipboard
                        ?.writeText(url)
                        .then(() => showSuccess(t('链接已复制')))
                        .catch(() => {});
                    }}
                  >
                    <Share2 size={12} /> {t('分享')}
                  </button>
                </div>
              </div>
            </aside>
          </div>

          <div style={{ height: 60 }} />
        </div>
      </div>
    </>
  );
};

function SideStat({ icon, value, label }) {
  return (
    <div
      style={{
        padding: '8px 6px',
        background: 'var(--bg-base)',
        borderRadius: 8,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}
      >
        {icon} <span>{value}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

export default SkillsDetail;
