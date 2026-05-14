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

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Star,
  Share2,
} from 'lucide-react';
import { API, showError, showSuccess } from '../../helpers';
import { SKILL_PLAZA_STYLES, SourceBadge } from './styles';
import DetailSocial, { FavoriteButton } from './DetailSocial';

// Minimal Markdown → HTML — keeps the bundle small and avoids
// pulling in a Markdown library just for this page. Handles headings,
// paragraphs, code fences, inline code, bold, italics, links, lists,
// blockquotes. Anything else falls through as text.
function renderMarkdown(md) {
  if (!md) return '';
  let html = String(md);
  // Code fences
  html = html.replace(/```([a-z]*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre><code class="lang-${lang}">${escaped}</code></pre>`;
  });
  // Headings (preserve anchors for TOC)
  html = html.replace(
    /^### (.+)$/gm,
    (_m, t) => `<h3 id="${slugify(t)}">${t}</h3>`,
  );
  html = html.replace(
    /^## (.+)$/gm,
    (_m, t) => `<h2 id="${slugify(t)}">${t}</h2>`,
  );
  html = html.replace(
    /^# (.+)$/gm,
    (_m, t) => `<h1 id="${slugify(t)}">${t}</h1>`,
  );
  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  // Unordered lists
  html = html.replace(/(^|\n)((?:- .+\n?)+)/g, (m, pre, block) => {
    const items = block
      .trim()
      .split('\n')
      .map((line) => `<li>${line.replace(/^- /, '')}</li>`)
      .join('');
    return `${pre}<ul>${items}</ul>`;
  });
  // Ordered lists
  html = html.replace(/(^|\n)((?:\d+\. .+\n?)+)/g, (m, pre, block) => {
    const items = block
      .trim()
      .split('\n')
      .map((line) => `<li>${line.replace(/^\d+\. /, '')}</li>`)
      .join('');
    return `${pre}<ol>${items}</ol>`;
  });
  // Inline code, bold, italics, links
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) => {
    const safe = /^(https?:|mailto:|#)/.test(url) ? url : '#';
    return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  });
  // Paragraphs — wrap remaining bare lines.
  html = html
    .split(/\n{2,}/)
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      if (/^<(h\d|ul|ol|pre|blockquote)/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');
  return html;
}

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

  useEffect(() => {
    let aborted = false;
    setLoading(true);
    API.get(`/api/skill-plaza/skills/${encodeURIComponent(slug)}`, {
      params: { language },
    })
      .then((res) => {
        if (aborted) return;
        if (res.data?.success) setData(res.data.data);
        else showError(res.data?.message || '加载失败');
      })
      .catch((e) => {
        if (!aborted) showError(e?.message || '加载失败');
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
  const bodyHtml = useMemo(
    () => renderMarkdown(article?.body || ''),
    [article?.body],
  );

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

  return (
    <>
      <style>{SKILL_PLAZA_STYLES}</style>
      <div className='skp-root'>
        <div className='skp-page'>
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
            <span style={{ color: 'var(--text-secondary)' }}>{skill.name}</span>
          </div>

          {/* Article header */}
          <header className='skp-detail-header'>
            <div className='skp-detail-meta' style={{ marginBottom: 8 }}>
              <SourceBadge type={skill.source_type} />
              <span>·</span>
              <span>
                {new Date(
                  (article.published_at || article.updated_at) * 1000,
                ).toLocaleDateString()}
              </span>
              <span>·</span>
              <span style={{ display: 'inline-flex', gap: 6 }}>
                {(data.available_languages || [language]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setSearchParams({ lang: l })}
                    className={'skp-pill' + (l === language ? ' active' : '')}
                    style={{ height: 24, padding: '0 10px', fontSize: 11.5 }}
                  >
                    {l === 'en' ? 'EN' : '中文'}
                  </button>
                ))}
              </span>
            </div>
            <h1>{article.title}</h1>
            {article.summary && (
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 15,
                  lineHeight: 1.7,
                  margin: '6px 0 0 0',
                }}
              >
                {article.summary}
              </p>
            )}
          </header>

          {/* GitHub source */}
          {skill.github_url && (
            <div className='skp-github-source'>
              <Github size={22} color='var(--text-primary)' />
              <div style={{ flex: 1 }}>
                <div className='repo-name'>
                  {skill.owner}/{skill.repo_name}
                </div>
                <div className='repo-meta'>
                  {skill.commit_hash && (
                    <code>{String(skill.commit_hash).slice(0, 8)}</code>
                  )}
                  {skill.license && (
                    <span>
                      {t('许可证')}:{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {skill.license}
                      </strong>
                    </span>
                  )}
                  {skill.repo_updated_at > 0 && (
                    <span>
                      {t('更新于')}{' '}
                      {new Date(
                        skill.repo_updated_at * 1000,
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <a
                href={skill.github_url}
                target='_blank'
                rel='noopener noreferrer'
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: 'var(--surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  fontSize: 13,
                }}
              >
                {t('在 GitHub 查看')} <ExternalLink size={14} />
              </a>
            </div>
          )}

          {/* Three-column layout */}
          <div className='skp-detail-layout'>
            {/* TOC */}
            <aside className='skp-toc'>
              <h4>{t('目录')}</h4>
              <ol
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  counterReset: 'toc',
                }}
              >
                {headings.map((h, i) => (
                  <li
                    key={h.id}
                    style={{
                      counterIncrement: 'toc',
                      padding: '7px 10px',
                      borderRadius: 6,
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      borderLeft: '2px solid transparent',
                    }}
                  >
                    <a
                      href={`#${h.id}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      <span
                        style={{
                          color: 'var(--text-muted)',
                          fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, monospace',
                          fontSize: 11,
                          marginRight: 6,
                        }}
                      >
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
              <article
                className='skp-prose'
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />

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
                <h4>{t('Skill 信息')}</h4>
                <div className='kv'>
                  <span>{t('分类')}</span>
                  <strong>{skill.category || '-'}</strong>
                </div>
                <div className='kv'>
                  <span>{t('来源')}</span>
                  <strong>{skill.source_type}</strong>
                </div>
                {skill.commit_hash && (
                  <div className='kv'>
                    <span>Commit</span>
                    <strong style={{ fontFamily: 'monospace' }}>
                      {String(skill.commit_hash).slice(0, 8)}
                    </strong>
                  </div>
                )}
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
