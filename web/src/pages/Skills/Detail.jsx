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
  MessageSquare,
  Bookmark,
  Share2,
} from 'lucide-react';
import { API, showError } from '../../helpers';
import { SKILL_PLAZA_STYLES, SourceBadge } from './styles';

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

              {/* Phase 2 tab placeholders */}
              <div
                style={{
                  marginTop: 40,
                  paddingTop: 24,
                  borderTop: '1px solid var(--border-default)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    borderBottom: '1px solid var(--border-default)',
                    marginBottom: 16,
                  }}
                >
                  <button
                    className='skp-pill active'
                    style={{
                      borderRadius: 0,
                      border: 0,
                      borderBottom: '2px solid #0072ff',
                      background: 'transparent',
                      color: '#0072ff',
                      fontWeight: 600,
                    }}
                  >
                    {t('评论与评分')}
                  </button>
                  <button
                    className='skp-pill'
                    style={{
                      borderRadius: 0,
                      border: 0,
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {t('使用案例')}
                  </button>
                </div>
                <div
                  style={{
                    padding: 20,
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-base)',
                    border: '1px dashed var(--border-default)',
                    borderRadius: 10,
                  }}
                >
                  {t('评分、评论、案例分享功能将在下一阶段开放。敬请期待。')}
                </div>
              </div>
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
                <h4>{t('操作')}</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className='skp-pill'>
                    <Bookmark size={12} /> {t('收藏')}
                  </button>
                  <button className='skp-pill'>
                    <Star size={12} /> {t('评分')}
                  </button>
                  <button className='skp-pill'>
                    <Share2 size={12} /> {t('分享')}
                  </button>
                  <button className='skp-pill'>
                    <MessageSquare size={12} /> {t('评论')}
                  </button>
                </div>
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 12,
                    color: 'var(--text-muted)',
                  }}
                >
                  {t('暂未开放,敬请期待')}
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

export default SkillsDetail;
