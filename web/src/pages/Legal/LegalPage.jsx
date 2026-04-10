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
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Enterprise-grade legal document layout.
 *
 * Props:
 *   title           : string (already translated)
 *   subtitle        : string (already translated)
 *   lastUpdated     : string (already translated, e.g. "Last updated: March 1, 2026")
 *   sections        : [{ id, title, paragraphs?: string[], list?: string[], note?: string }]
 *
 * All theming is driven by CSS variables so dark mode works automatically.
 */
const LegalPage = ({ title, subtitle, lastUpdated, sections }) => {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState(sections?.[0]?.id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handler = () => {
      let current = sections?.[0]?.id;
      for (const s of sections || []) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top < 160) current = s.id;
      }
      setActiveId(current);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [sections]);

  const toc = useMemo(
    () => (sections || []).map((s) => ({ id: s.id, label: s.title })),
    [sections],
  );

  return (
    <div
      className='w-full'
      style={{
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        marginTop: 'calc(-1 * var(--header-height))',
        paddingTop: 'var(--header-height)',
      }}
    >
      {/* ==== Hero ==== */}
      <section
        className='relative overflow-hidden'
        style={{
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div
          className='absolute pointer-events-none'
          style={{
            top: '-80px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 700,
            height: 420,
            borderRadius: '50%',
            background: 'var(--accent-gradient)',
            filter: 'blur(120px)',
            opacity: 0.15,
          }}
        />
        <div className='relative max-w-5xl mx-auto px-5 pt-28 pb-16 md:pt-36 md:pb-20'>
          <Link
            to='/'
            className='inline-flex items-center gap-1 text-xs uppercase tracking-widest mb-6'
            style={{ color: 'var(--text-muted)' }}
          >
            ← {t('返回首页')}
          </Link>
          <h1
            className='text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4'
            style={{
              fontFamily: 'var(--font-serif)',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className='text-base md:text-lg max-w-2xl'
              style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
            >
              {subtitle}
            </p>
          )}
          {lastUpdated && (
            <div
              className='inline-flex items-center gap-2 mt-6 px-3 py-1.5 text-xs font-medium'
              style={{
                borderRadius: 'var(--radius-full, 9999px)',
                background: 'var(--surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
              }}
            >
              <span
                className='inline-block w-1.5 h-1.5 rounded-full'
                style={{ background: 'var(--accent)' }}
              />
              {lastUpdated}
            </div>
          )}
        </div>
      </section>

      {/* ==== Body ==== */}
      <section className='py-16 md:py-24'>
        <div className='max-w-5xl mx-auto px-5 flex flex-col md:flex-row gap-10 lg:gap-16'>
          {/* TOC */}
          <aside className='md:w-56 shrink-0 md:sticky md:top-24 self-start hidden md:block'>
            <div
              className='text-xs font-semibold uppercase tracking-widest mb-4'
              style={{ color: 'var(--text-muted)' }}
            >
              {t('目录')}
            </div>
            <nav className='flex flex-col gap-1'>
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className='text-sm py-1.5 px-3 transition-colors'
                  style={{
                    color:
                      activeId === item.id
                        ? 'var(--accent)'
                        : 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    background:
                      activeId === item.id ? 'var(--accent-light)' : 'transparent',
                    borderLeft:
                      activeId === item.id
                        ? '2px solid var(--accent)'
                        : '2px solid transparent',
                  }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <article
            className='flex-1 min-w-0'
            style={{
              color: 'var(--text-primary)',
              fontSize: '1rem',
              lineHeight: 1.8,
            }}
          >
            {(sections || []).map((s, idx) => (
              <section
                key={s.id}
                id={s.id}
                className={idx === 0 ? '' : 'mt-14'}
                style={{ scrollMarginTop: 'calc(var(--header-height) + 24px)' }}
              >
                <h2
                  className='text-2xl md:text-3xl font-bold mb-5'
                  style={{
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  <span style={{ color: 'var(--accent)', marginRight: 12 }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  {s.title}
                </h2>
                {(s.paragraphs || []).map((p, i) => (
                  <p
                    key={i}
                    className='mb-4'
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {p}
                  </p>
                ))}
                {s.list && s.list.length > 0 && (
                  <ul className='my-4 space-y-2 pl-1'>
                    {s.list.map((li, i) => (
                      <li
                        key={i}
                        className='flex gap-3'
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <span
                          style={{
                            color: 'var(--accent)',
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          ▸
                        </span>
                        <span>{li}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {s.note && (
                  <div
                    className='mt-5 p-4 text-sm'
                    style={{
                      background: 'var(--accent-light)',
                      border: '1px solid rgba(0,114,255,0.15)',
                      borderLeft: '3px solid var(--accent)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      lineHeight: 1.7,
                    }}
                  >
                    {s.note}
                  </div>
                )}
              </section>
            ))}

            {/* Footer nav */}
            <div
              className='mt-20 pt-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center'
              style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
              <div
                className='text-sm'
                style={{ color: 'var(--text-muted)' }}
              >
                {t('如有疑问，请联系我们的合规团队')}
                {' — '}
                <a
                  href='mailto:support@aggretoken.com'
                  style={{ color: 'var(--accent)', textDecoration: 'none' }}
                >
                  support@aggretoken.com
                </a>
              </div>
              <div className='flex gap-6 text-sm'>
                <Link
                  to='/privacy-policy'
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t('隐私政策')}
                </Link>
                <Link
                  to='/terms-of-service'
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t('服务条款')}
                </Link>
                <Link
                  to='/security'
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t('安全')}
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};

export default LegalPage;
