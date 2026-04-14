import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '../../hooks/common/useIsMobile';

/*
 * Category data — each entry becomes a card on the guide index page.
 * `tools` are rendered as sub-links inside the detail pages (phase 2).
 */
const CATEGORIES = [
  {
    id: 'prerequisites',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    nameKey: '准备工作',
    descKey: 'guide_prerequisites_desc',
    count: 5,
    highlight: true,
  },
  {
    id: 'coding-assistants',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    nameKey: 'AI 编程助手',
    descKey: 'guide_coding_desc',
    count: 8,
  },
  {
    id: 'chat-clients',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    nameKey: 'AI 对话客户端',
    descKey: 'guide_chat_desc',
    count: 4,
  },
  {
    id: 'code-integration',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    nameKey: '代码调用',
    descKey: 'guide_code_desc',
    count: 3,
  },
  {
    id: 'image-generation',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    ),
    nameKey: '图片生成',
    descKey: 'guide_image_desc',
    count: 3,
  },
  {
    id: 'music-generation',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
      </svg>
    ),
    nameKey: '音乐生成',
    descKey: 'guide_music_desc',
    count: 1,
  },
  {
    id: 'video-generation',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" />
      </svg>
    ),
    nameKey: '视频生成',
    descKey: 'guide_video_desc',
    count: 2,
  },
  {
    id: 'tts',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    ),
    nameKey: '语音合成 (TTS)',
    descKey: 'guide_tts_desc',
    count: 2,
  },
  {
    id: 'stt',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    ),
    nameKey: '语音识别 (STT)',
    descKey: 'guide_stt_desc',
    count: 1,
  },
  {
    id: 'embeddings',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M12 2v4" /><path d="M12 18v4" /><path d="m4.93 4.93 2.83 2.83" /><path d="m16.24 16.24 2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" /><path d="m4.93 19.07 2.83-2.83" /><path d="m16.24 4.93 2.83 2.83" />
      </svg>
    ),
    nameKey: '文本嵌入 (Embeddings)',
    descKey: 'guide_embeddings_desc',
    count: 2,
  },
  {
    id: 'translation-tools',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" />
      </svg>
    ),
    nameKey: '翻译工具',
    descKey: 'guide_translation_desc',
    count: 2,
  },
];

export default function GuideIndex() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        paddingTop: 'var(--header-height)',
      }}
    >
      {/* Hero */}
      <section
        className='relative overflow-hidden'
        style={{ background: 'var(--bg-base)' }}
      >
        {/* Subtle gradient glow behind hero */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 600,
            height: 400,
            background: 'radial-gradient(ellipse, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          className='relative max-w-screen-lg mx-auto px-5 text-center'
          style={{ paddingTop: isMobile ? 48 : 72, paddingBottom: isMobile ? 40 : 56 }}
        >
          {/* Breadcrumb-like back link */}
          <Link
            to='/'
            className='inline-flex items-center gap-1.5 mb-6'
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            {t('返回首页')}
          </Link>

          <h1
            style={{
              fontSize: isMobile ? 28 : 40,
              fontWeight: 800,
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-primary)',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {t('从零开始使用指南')}
          </h1>
          <p
            style={{
              fontSize: isMobile ? 14 : 16,
              color: 'var(--text-secondary)',
              marginTop: 12,
              maxWidth: 480,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6,
            }}
          >
            {t('guide_subtitle')}
          </p>

          {/* Prerequisite hint */}
          <div
            className='inline-flex items-center gap-2.5'
            style={{
              marginTop: 28,
              padding: '10px 20px',
              borderRadius: 'var(--radius-lg, 12px)',
              background: 'color-mix(in srgb, var(--accent) 6%, var(--surface))',
              border: '1px solid color-mix(in srgb, var(--accent) 16%, var(--border-subtle))',
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
            </svg>
            <span>
              {t('guide_prerequisite')}
              <Link
                to='/console/token'
                style={{
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  fontWeight: 600,
                  marginLeft: 4,
                }}
              >
                {t('获取 API Key')} &rarr;
              </Link>
            </span>
          </div>
        </div>
      </section>

      {/* Category cards grid */}
      <section
        className='max-w-screen-lg mx-auto px-5'
        style={{ paddingBottom: isMobile ? 60 : 80 }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? '1fr'
              : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.id}
              to={`/guide/${cat.id}`}
              style={{
                textDecoration: 'none',
                opacity: 0,
                animation: `guideCardIn 0.45s ease-out ${0.04 * i}s forwards`,
                ...(cat.highlight && !isMobile ? { gridColumn: '1 / -1' } : {}),
              }}
            >
              <div
                className='guide-card'
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  padding: cat.highlight ? '20px 24px' : 20,
                  borderRadius: 'var(--radius-lg, 12px)',
                  border: cat.highlight ? 'none' : '1px solid var(--border-subtle)',
                  background: cat.highlight
                    ? 'var(--surface)'
                    : 'var(--surface)',
                  backgroundImage: cat.highlight
                    ? 'linear-gradient(var(--surface), var(--surface)), var(--accent-gradient)'
                    : 'none',
                  backgroundOrigin: 'border-box',
                  backgroundClip: cat.highlight ? 'padding-box, border-box' : 'border-box',
                  boxShadow: cat.highlight
                    ? 'inset 0 0 0 1.5px transparent, 0 2px 12px color-mix(in srgb, var(--accent) 8%, transparent)'
                    : 'none',
                  ...(cat.highlight ? {
                    borderWidth: '1.5px',
                    borderStyle: 'solid',
                    borderColor: 'transparent',
                    backgroundImage: 'linear-gradient(var(--surface), var(--surface)), var(--accent-gradient)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                  } : {}),
                  cursor: 'pointer',
                  transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.25s',
                  height: '100%',
                }}
                onMouseEnter={(e) => {
                  if (!cat.highlight) {
                    e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 40%, var(--border-subtle))';
                  }
                  e.currentTarget.style.boxShadow = '0 4px 24px color-mix(in srgb, var(--accent) 12%, transparent)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (!cat.highlight) {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }
                  e.currentTarget.style.boxShadow = cat.highlight
                    ? '0 2px 12px color-mix(in srgb, var(--accent) 8%, transparent)'
                    : 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    flexShrink: 0,
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-md, 8px)',
                    background: 'color-mix(in srgb, var(--accent) 8%, var(--bg-base))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                  }}
                >
                  {cat.icon}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 650,
                        color: 'var(--text-primary)',
                        lineHeight: 1.3,
                      }}
                    >
                      {t(cat.nameKey)}
                    </span>
                    {cat.highlight && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full, 9999px)',
                          background: 'var(--accent-gradient)',
                          color: '#fff',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          letterSpacing: '0.03em',
                        }}
                      >
                        {t('guide_start_here')}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 11,
                        padding: '1px 7px',
                        borderRadius: 'var(--radius-full, 9999px)',
                        background: 'color-mix(in srgb, var(--accent) 10%, var(--bg-base))',
                        color: 'var(--accent)',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cat.count}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--text-muted)',
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {t(cat.descKey)}
                  </p>
                </div>

                {/* Arrow */}
                <div
                  className='guide-card-arrow'
                  style={{
                    flexShrink: 0,
                    alignSelf: 'center',
                    color: 'var(--text-muted)',
                    transition: 'color 0.2s, transform 0.2s',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom link to full docs */}
        <div
          className='text-center'
          style={{ marginTop: 40, fontSize: 13, color: 'var(--text-muted)' }}
        >
          {t('guide_not_found')}{' '}
          <Link
            to='/docs'
            style={{
              color: 'var(--accent)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            {t('查看完整文档')} &rarr;
          </Link>
        </div>
      </section>

      <style>{`
        @keyframes guideCardIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .guide-card:hover .guide-card-arrow {
          color: var(--accent) !important;
          transform: translateX(3px);
        }
      `}</style>
    </div>
  );
}
