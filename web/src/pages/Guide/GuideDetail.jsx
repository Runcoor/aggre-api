import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { StatusContext } from '../../context/Status';
import { copy } from '../../helpers';
import GUIDE_CONTENT from './guideContent';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function useLang() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  // Collapse zh-TW, zh-Hans etc. to zh
  if (lang && lang.startsWith('zh')) return 'zh';
  return 'en';
}

function t(obj, lang) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.en || obj.zh || '';
}

function replaceVars(str, baseUrl, apiKey) {
  return str
    .replace(/\{\{BASE_URL\}\}/g, baseUrl)
    .replace(/\{\{API_KEY\}\}/g, apiKey);
}

/* ─── Code Block ───────────────────────────────────────────────────────────── */

function CodeBlock({ code, baseUrl, apiKey }) {
  const [copied, setCopied] = useState(false);
  const content = replaceVars(code.content, baseUrl, apiKey);

  const handleCopy = () => {
    copy(content, '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md, 8px)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        fontSize: 13,
        fontFamily: 'var(--font-mono)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          background: 'var(--surface-active)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}
      >
        <span>{code.filename}</span>
        <button
          onClick={handleCopy}
          style={{
            background: 'none',
            border: 'none',
            color: copied ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 4,
            transition: 'color 0.2s',
            fontFamily: 'inherit',
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      {/* Content */}
      <pre
        style={{
          margin: 0,
          padding: '12px 14px',
          background: 'var(--bg-base)',
          overflowX: 'auto',
          lineHeight: 1.6,
          color: 'var(--text-primary)',
          whiteSpace: 'pre',
        }}
      >
        <code>{content}</code>
      </pre>
    </div>
  );
}

/* ─── Step Number ──────────────────────────────────────────────────────────── */

function StepNumber({ n }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: 'var(--accent-gradient)',
        color: '#fff',
        fontSize: 11,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {n}
    </span>
  );
}

/* ─── TOC Sidebar ──────────────────────────────────────────────────────────── */

function TOC({ tools, activeId, lang }) {
  return (
    <nav style={{ position: 'sticky', top: 'calc(var(--header-height) + 24px)', width: 200, flexShrink: 0 }}>
      <p
        style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12,
        }}
      >
        {lang === 'zh' ? '本页工具' : 'Tools'}
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {tools.map((tool) => {
          const isActive = activeId === tool.id;
          return (
            <li key={tool.id}>
              <a
                href={`#${tool.id}`}
                style={{
                  display: 'block', padding: '5px 12px', fontSize: 13,
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 400, textDecoration: 'none',
                  borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                  transition: 'color 0.2s, border-color 0.2s',
                }}
              >
                {tool.name}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ─── Tool Card ────────────────────────────────────────────────────────────── */

function ToolCard({ tool, lang, baseUrl, apiKey }) {
  return (
    <article
      style={{
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px solid var(--border-subtle)',
        background: 'var(--surface)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'color-mix(in srgb, var(--accent) 3%, var(--surface))',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {tool.name}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
            {t(tool.desc, lang)}
          </p>
        </div>
        {tool.url && (
          <a
            href={tool.url}
            target='_blank'
            rel='noopener noreferrer'
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 12, color: 'var(--accent)', textDecoration: 'none',
              padding: '4px 10px', borderRadius: 'var(--radius-full, 9999px)',
              border: '1px solid color-mix(in srgb, var(--accent) 25%, var(--border-subtle))',
              whiteSpace: 'nowrap', transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 6%, transparent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {lang === 'zh' ? '官网' : 'Website'}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Node.js required banner */}
        {tool.nodejsRequired && (
          <Link
            to='/guide/nodejs-setup'
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 'var(--radius-md, 8px)',
              background: 'linear-gradient(135deg, color-mix(in srgb, #339933 8%, var(--bg-base)), color-mix(in srgb, #68A063 5%, var(--bg-base)))',
              border: '1px solid color-mix(in srgb, #339933 20%, var(--border-subtle))',
              textDecoration: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'color-mix(in srgb, #339933 40%, var(--border-subtle))';
              e.currentTarget.style.boxShadow = '0 2px 8px color-mix(in srgb, #339933 10%, transparent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'color-mix(in srgb, #339933 20%, var(--border-subtle))';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 6,
              background: 'linear-gradient(135deg, #339933, #68A063)',
              flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
              </svg>
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {lang === 'zh' ? '前置要求：安装 Node.js' : 'Prerequisite: Install Node.js'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                {lang === 'zh' ? '点击查看安装教程 →' : 'Click for setup guide →'}
              </span>
            </div>
          </Link>
        )}

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: 13, fontWeight: 650, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {lang === 'zh' ? '操作步骤' : 'Steps'}
          </h3>
          {tool.steps.map((step, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
              }}
            >
              <StepNumber n={i + 1} />
              <span style={{ paddingTop: 1 }}>{t(step, lang)}</span>
            </div>
          ))}
        </div>

        {/* Code */}
        {tool.code && <CodeBlock code={tool.code} baseUrl={baseUrl} apiKey={apiKey} />}

        {/* Tip */}
        {tool.tip && (
          <div
            style={{
              display: 'flex', gap: 10, padding: '12px 14px',
              borderRadius: 'var(--radius-md, 8px)',
              background: 'color-mix(in srgb, var(--accent) 5%, var(--bg-base))',
              border: '1px solid color-mix(in srgb, var(--accent) 12%, var(--border-subtle))',
              fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
            }}
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: 2 }}
            >
              <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
              <line x1="9" y1="21" x2="15" y2="21" />
            </svg>
            <span>{t(tool.tip, lang)}</span>
          </div>
        )}

        {/* Video tutorials — embedded iframe */}
        {tool.videos && tool.videos.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 650, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {lang === 'zh' ? '视频教程' : 'Video Tutorials'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tool.videos.map((v, vi) => {
                // Convert bilibili/youtube URLs to embeddable format
                let embedUrl = '';
                if (v.platform === 'bilibili') {
                  const bvMatch = v.url.match(/BV[\w]+/);
                  if (bvMatch) embedUrl = `https://player.bilibili.com/player.html?bvid=${bvMatch[0]}&autoplay=0&high_quality=1`;
                } else {
                  const ytMatch = v.url.match(/(?:v=|youtu\.be\/)([\w-]+)/);
                  if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
                }
                return (
                  <div key={vi} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {embedUrl && (
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          paddingBottom: '56.25%',
                          borderRadius: 'var(--radius-md, 8px)',
                          overflow: 'hidden',
                          border: '1px solid var(--border-subtle)',
                          background: '#000',
                        }}
                      >
                        <iframe
                          src={embedUrl}
                          style={{
                            position: 'absolute',
                            top: 0, left: 0,
                            width: '100%', height: '100%',
                            border: 'none',
                          }}
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <span
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                            background: v.platform === 'bilibili' ? '#fb7299' : '#ff0000',
                            color: '#fff', fontSize: 10,
                          }}
                        >
                          {v.platform === 'bilibili' ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z" />
                            </svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z" />
                            </svg>
                          )}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t(v.title, lang)}{v.author ? ` · ${v.author}` : ''}
                        </span>
                      </div>
                      <a
                        href={v.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        style={{
                          fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none',
                          whiteSpace: 'nowrap', flexShrink: 0,
                          transition: 'color 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                        {v.platform === 'bilibili'
                          ? (lang === 'zh' ? '在B站打开 ↗' : 'Open on Bilibili ↗')
                          : (lang === 'zh' ? '在YouTube打开 ↗' : 'Open on YouTube ↗')
                        }
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* External links / tutorials */}
        {tool.externalLinks && tool.externalLinks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 650, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
              {lang === 'zh' ? '详细图文教程' : 'Detailed Guides'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tool.externalLinks.map((link, li) => (
                <a
                  key={li}
                  href={link.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', borderRadius: 'var(--radius-md, 8px)',
                    border: '1px solid var(--border-subtle)', background: 'var(--bg-base)',
                    textDecoration: 'none', fontSize: 13, color: 'var(--text-secondary)',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 30%, var(--border-subtle))'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span style={{ flex: 1 }}>{t(link.title, lang)}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */

export default function GuideDetail() {
  const { categoryId } = useParams();
  const lang = useLang();
  const isMobile = useIsMobile();
  const [statusState] = useContext(StatusContext);
  const category = GUIDE_CONTENT[categoryId];
  const [activeId, setActiveId] = useState(category?.tools?.[0]?.id || '');
  const toolRefs = useRef({});

  const baseUrl = useMemo(() => {
    const addr = statusState?.status?.server_address;
    if (addr) return addr.replace(/\/$/, '');
    return window.location.origin;
  }, [statusState?.status?.server_address]);

  const apiKey = 'sk-your-api-key';

  // Intersection observer for TOC
  useEffect(() => {
    if (!category) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    for (const tool of category.tools) {
      const el = toolRefs.current[tool.id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [category]);

  if (!category) return <Navigate to='/guide' replace />;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingTop: 'var(--header-height)' }}>
      {/* Header */}
      <div
        className='max-w-screen-lg mx-auto px-5'
        style={{ paddingTop: isMobile ? 32 : 48, paddingBottom: isMobile ? 24 : 32 }}
      >
        <Link
          to='/guide'
          className='inline-flex items-center gap-1.5 mb-5'
          style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          {lang === 'zh' ? '返回指南' : 'Back to Guide'}
        </Link>

        <h1
          style={{
            fontSize: isMobile ? 26 : 36, fontWeight: 800,
            fontFamily: 'var(--font-serif)', color: 'var(--text-primary)',
            lineHeight: 1.2, margin: 0,
          }}
        >
          {t(category.title, lang)}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
          {t(category.desc, lang)}
        </p>
      </div>

      {/* Body: TOC + Content */}
      <div
        className='max-w-screen-lg mx-auto px-5'
        style={{ display: 'flex', gap: 48, paddingBottom: 80, alignItems: 'flex-start' }}
      >
        {!isMobile && <TOC tools={category.tools} activeId={activeId} lang={lang} />}

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>
          {category.tools.map((tool) => (
            <div key={tool.id} id={tool.id} ref={(el) => (toolRefs.current[tool.id] = el)}>
              <ToolCard tool={tool} lang={lang} baseUrl={baseUrl} apiKey={apiKey} />
            </div>
          ))}

          {/* Bottom nav */}
          <div
            style={{
              textAlign: 'center', padding: '24px 20px', borderRadius: 'var(--radius-lg, 12px)',
              background: 'color-mix(in srgb, var(--accent) 4%, var(--surface))',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Link
              to='/guide'
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 20px', borderRadius: 'var(--radius-md, 8px)',
                background: 'var(--accent-gradient)', color: '#fff',
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px color-mix(in srgb, var(--accent) 25%, transparent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              {lang === 'zh' ? '查看其他教程' : 'Browse Other Tutorials'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
