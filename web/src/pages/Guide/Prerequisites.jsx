import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '../../hooks/common/useIsMobile';

/* ─── Section data ─────────────────────────────────────────────────────────── */

const SECTIONS = [
  {
    id: 'email',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
    titleKey: 'prereq_email_title',
    steps: [
      {
        type: 'text',
        contentKey: 'prereq_email_why',
      },
      {
        type: 'steps',
        titleKey: 'prereq_email_gmail_title',
        items: [
          { contentKey: 'prereq_email_step1' },
          { contentKey: 'prereq_email_step2' },
          { contentKey: 'prereq_email_step3' },
          { contentKey: 'prereq_email_step4' },
          { contentKey: 'prereq_email_step5' },
        ],
        links: [
          { label: 'Google Account', url: 'https://accounts.google.com/signup', desc: 'prereq_link_gmail_desc' },
          { label: 'Outlook', url: 'https://outlook.live.com/owa/?nlp=1&signup=1', desc: 'prereq_link_outlook_desc' },
          { label: 'ProtonMail', url: 'https://proton.me/mail', desc: 'prereq_link_proton_desc' },
        ],
      },
      {
        type: 'tip',
        contentKey: 'prereq_email_tip',
      },
    ],
  },
  {
    id: 'network',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /><path d="M2 12h20" />
      </svg>
    ),
    titleKey: 'prereq_network_title',
    steps: [
      {
        type: 'text',
        contentKey: 'prereq_network_why',
      },
      {
        type: 'steps',
        titleKey: 'prereq_network_how_title',
        disclaimerKey: 'prereq_network_disclaimer',
        items: [
          { contentKey: 'prereq_network_step1' },
          { contentKey: 'prereq_network_step2' },
          { contentKey: 'prereq_network_step3' },
        ],
        links: [
          { label: '良心云', url: 'https://xn--9kqz23b19z.com/#/register?code=aIASGAfI', desc: 'prereq_link_lxy_desc', badge: 'prereq_badge_recommend' },
          { label: '飞鸟云', url: 'https://feiniaoyun.xyz/#/register?code=ZneSMcKl', desc: 'prereq_link_fny_desc', badge: 'prereq_badge_fast' },
          { label: '便宜机场', url: 'https://xn--wtq35pfyd55o.com/#/register?code=W4ktqYvy', desc: 'prereq_link_pyjc_desc', badge: 'prereq_badge_cheap' },
          { label: '宝可梦', url: 'https://love.p6m6.com/#/register?code=NJtffoXR', desc: 'prereq_link_bkm_desc', badge: 'prereq_badge_stable' },
          { label: '雪山', url: 'https://www.xueshan.us/#/register?code=ONMR3sY8', desc: 'prereq_link_xs_desc', badge: 'prereq_badge_premium' },
        ],
      },
      {
        type: 'tip',
        contentKey: 'prereq_network_tip',
      },
      {
        type: 'comparison',
        titleKey: 'prereq_network_diy_title',
        descKey: 'prereq_network_diy_desc',
        rows: [
          { labelKey: 'prereq_cmp_privacy', airportKey: 'prereq_cmp_privacy_airport', selfKey: 'prereq_cmp_privacy_self' },
          { labelKey: 'prereq_cmp_speed', airportKey: 'prereq_cmp_speed_airport', selfKey: 'prereq_cmp_speed_self' },
          { labelKey: 'prereq_cmp_stability', airportKey: 'prereq_cmp_stability_airport', selfKey: 'prereq_cmp_stability_self' },
          { labelKey: 'prereq_cmp_cost', airportKey: 'prereq_cmp_cost_airport', selfKey: 'prereq_cmp_cost_self' },
          { labelKey: 'prereq_cmp_difficulty', airportKey: 'prereq_cmp_difficulty_airport', selfKey: 'prereq_cmp_difficulty_self' },
          { labelKey: 'prereq_cmp_control', airportKey: 'prereq_cmp_control_airport', selfKey: 'prereq_cmp_control_self' },
        ],
        linkUrl: '#',
        linkKey: 'prereq_network_diy_link',
      },
    ],
  },
  {
    id: 'vps',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><circle cx="6" cy="6" r="1" /><circle cx="6" cy="18" r="1" />
      </svg>
    ),
    titleKey: 'prereq_vps_title',
    steps: [
      {
        type: 'text',
        contentKey: 'prereq_vps_why',
      },
      {
        type: 'steps',
        titleKey: 'prereq_vps_how_title',
        disclaimerKey: 'prereq_vps_disclaimer',
        items: [
          { contentKey: 'prereq_vps_step1' },
          { contentKey: 'prereq_vps_step2' },
          { contentKey: 'prereq_vps_step3' },
          { contentKey: 'prereq_vps_step4' },
        ],
        links: [
          { label: 'RackNerd', url: 'https://my.racknerd.com/aff.php?aff=19327', desc: 'prereq_link_racknerd_desc', badge: 'prereq_badge_cheap' },
          { label: 'VMISS', url: 'https://app.vmiss.com/aff.php?aff=4943', desc: 'prereq_link_vmiss_desc', badge: 'prereq_badge_cheap' },
          { label: 'DMIT', url: 'https://www.dmit.io/aff.php?aff=20550', desc: 'prereq_link_dmit_desc', badge: 'prereq_badge_premium' },
          { label: 'GoMami', url: 'https://gomami.io/aff.php?aff=478', desc: 'prereq_link_gomami_desc', badge: 'prereq_badge_asia' },
          { label: 'V.PS', url: 'https://vps.hosting/?affid=2237', desc: 'prereq_link_vps_desc', badge: 'prereq_badge_eu' },
          { label: 'Evoxt', url: 'https://console.evoxt.com/aff.php?aff=3909', desc: 'prereq_link_evoxt_desc', badge: 'prereq_badge_global' },
          { label: 'ZoroCloud', url: 'https://my.zorocloud.com/aff.php?aff=1286', desc: 'prereq_link_zorocloud_desc', badge: 'prereq_badge_cn_opt' },
          { label: 'ZgoCloud', url: 'https://clients.zgovps.com/?affid=1463', desc: 'prereq_link_zgocloud_desc', badge: 'prereq_badge_hk' },
          { label: 'Lisahost', url: 'https://lisahost.com/aff.php?aff=9787', desc: 'prereq_link_lisahost_desc', badge: 'prereq_badge_cn_opt' },
          { label: 'Yinnet', url: 'https://www.yin-net.com/aff.php?aff=712', desc: 'prereq_link_yinnet_desc', badge: 'prereq_badge_stable' },
        ],
      },
      {
        type: 'tip',
        contentKey: 'prereq_vps_tip',
      },
    ],
  },
  {
    id: 'terminal',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
    titleKey: 'prereq_terminal_title',
    steps: [
      {
        type: 'text',
        contentKey: 'prereq_terminal_why',
      },
      {
        type: 'steps',
        titleKey: 'prereq_terminal_tools_title',
        items: [
          { contentKey: 'prereq_terminal_step1' },
          { contentKey: 'prereq_terminal_step2' },
          { contentKey: 'prereq_terminal_step3' },
        ],
        links: [
          { label: 'Termius', url: 'https://termius.com/', desc: 'prereq_link_termius_desc' },
          { label: 'Tabby', url: 'https://tabby.sh/', desc: 'prereq_link_tabby_desc' },
          { label: 'FinalShell', url: 'https://www.hostbuf.com/t/988.html', desc: 'prereq_link_finalshell_desc' },
        ],
      },
    ],
  },
  {
    id: 'payment',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    titleKey: 'prereq_payment_title',
    steps: [
      {
        type: 'text',
        contentKey: 'prereq_payment_why',
      },
      {
        type: 'steps',
        titleKey: 'prereq_payment_methods_title',
        items: [
          { contentKey: 'prereq_payment_step1' },
          { contentKey: 'prereq_payment_step2' },
          { contentKey: 'prereq_payment_step3' },
        ],
      },
      {
        type: 'tip',
        contentKey: 'prereq_payment_tip',
      },
    ],
  },
];

/* ─── Reusable sub-components ──────────────────────────────────────────────── */

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

function LinkCard({ label, url, desc, badge, t }) {
  return (
    <a
      href={url}
      target='_blank'
      rel='noopener noreferrer'
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 'var(--radius-md, 8px)',
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-base)',
        textDecoration: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 40%, var(--border-subtle))';
        e.currentTarget.style.boxShadow = '0 2px 8px color-mix(in srgb, var(--accent) 8%, transparent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 650, fontSize: 13, color: 'var(--text-primary)' }}>
            {label}
          </span>
          {badge && (
            <span
              style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 'var(--radius-full, 9999px)',
                background: 'color-mix(in srgb, var(--accent) 12%, var(--bg-base))',
                color: 'var(--accent)',
                fontWeight: 600,
              }}
            >
              {t(badge)}
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0', lineHeight: 1.4 }}>
          {t(desc)}
        </p>
      </div>
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink: 0 }}
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  );
}

/* ─── TOC sidebar (desktop) ────────────────────────────────────────────────── */

function TableOfContents({ sections, activeId, t }) {
  return (
    <nav
      style={{
        position: 'sticky',
        top: 'calc(var(--header-height) + 24px)',
        width: 200,
        flexShrink: 0,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: 12,
        }}
      >
        {t('prereq_toc')}
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sections.map((s) => {
          const isActive = activeId === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                style={{
                  display: 'block',
                  padding: '5px 12px',
                  fontSize: 13,
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: 'none',
                  borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                  transition: 'color 0.2s, border-color 0.2s',
                  borderRadius: 0,
                }}
              >
                {t(s.titleKey)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ─── Main page ────────────────────────────────────────────────────────────── */

export default function GuidePrerequisites() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const sectionRefs = useRef({});

  // Intersection observer for TOC highlight
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    for (const sec of SECTIONS) {
      const el = sectionRefs.current[sec.id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        paddingTop: 'var(--header-height)',
      }}
    >
      {/* Header */}
      <div
        className='max-w-screen-lg mx-auto px-5'
        style={{ paddingTop: isMobile ? 32 : 48, paddingBottom: isMobile ? 24 : 32 }}
      >
        <Link
          to='/guide'
          className='inline-flex items-center gap-1.5 mb-5'
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
          {t('prereq_back')}
        </Link>

        <h1
          style={{
            fontSize: isMobile ? 26 : 36,
            fontWeight: 800,
            fontFamily: 'var(--font-serif)',
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {t('prereq_page_title')}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
          {t('prereq_page_desc')}
        </p>
      </div>

      {/* Body: TOC + Content */}
      <div
        className='max-w-screen-lg mx-auto px-5'
        style={{
          display: 'flex',
          gap: 48,
          paddingBottom: 80,
          alignItems: 'flex-start',
        }}
      >
        {/* TOC — desktop only */}
        {!isMobile && <TableOfContents sections={SECTIONS} activeId={activeId} t={t} />}

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 40 }}>
          {SECTIONS.map((section) => (
            <article
              key={section.id}
              id={section.id}
              ref={(el) => (sectionRefs.current[section.id] = el)}
              style={{
                borderRadius: 'var(--radius-lg, 12px)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--surface)',
                overflow: 'hidden',
              }}
            >
              {/* Section header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: 'color-mix(in srgb, var(--accent) 3%, var(--surface))',
                }}
              >
                <span style={{ color: 'var(--accent)', display: 'flex' }}>{section.icon}</span>
                <h2
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  {t(section.titleKey)}
                </h2>
              </div>

              {/* Section body */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {section.steps.map((step, si) => {
                  if (step.type === 'text') {
                    return (
                      <p
                        key={si}
                        style={{
                          fontSize: 14,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.7,
                          margin: 0,
                        }}
                      >
                        {t(step.contentKey)}
                      </p>
                    );
                  }

                  if (step.type === 'tip') {
                    return (
                      <div
                        key={si}
                        style={{
                          display: 'flex',
                          gap: 10,
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md, 8px)',
                          background: 'color-mix(in srgb, var(--accent) 5%, var(--bg-base))',
                          border: '1px solid color-mix(in srgb, var(--accent) 12%, var(--border-subtle))',
                          fontSize: 13,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
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
                        <span>{t(step.contentKey)}</span>
                      </div>
                    );
                  }

                  if (step.type === 'steps') {
                    return (
                      <div key={si} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {step.titleKey && (
                          <h3
                            style={{
                              fontSize: 14,
                              fontWeight: 650,
                              color: 'var(--text-primary)',
                              margin: 0,
                            }}
                          >
                            {t(step.titleKey)}
                          </h3>
                        )}

                        {/* Numbered steps */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {step.items.map((item, ii) => (
                            <div
                              key={ii}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 10,
                                fontSize: 13,
                                color: 'var(--text-secondary)',
                                lineHeight: 1.6,
                              }}
                            >
                              <StepNumber n={ii + 1} />
                              <span style={{ paddingTop: 1 }}>{t(item.contentKey)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Resource links */}
                        {step.links && step.links.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                            {step.disclaimerKey && (
                              <div
                                style={{
                                  display: 'flex',
                                  gap: 10,
                                  padding: '10px 14px',
                                  borderRadius: 'var(--radius-md, 8px)',
                                  background: 'color-mix(in srgb, var(--warning, #f59e0b) 6%, var(--bg-base))',
                                  border: '1px solid color-mix(in srgb, var(--warning, #f59e0b) 15%, var(--border-subtle))',
                                  fontSize: 12,
                                  color: 'var(--text-secondary)',
                                  lineHeight: 1.6,
                                }}
                              >
                                <svg
                                  width="15" height="15" viewBox="0 0 24 24" fill="none"
                                  stroke="color-mix(in srgb, var(--warning, #f59e0b) 80%, var(--text-muted))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                  style={{ flexShrink: 0, marginTop: 1 }}
                                >
                                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <span>{t(step.disclaimerKey)}</span>
                              </div>
                            )}
                            <p
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                margin: 0,
                              }}
                            >
                              {t('prereq_resources')}
                            </p>
                            {step.links.map((link, li) => (
                              <LinkCard key={li} {...link} t={t} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (step.type === 'comparison') {
                    return (
                      <div
                        key={si}
                        style={{
                          borderRadius: 'var(--radius-md, 8px)',
                          border: '1px solid var(--border-subtle)',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Header */}
                        <div
                          style={{
                            padding: '14px 16px',
                            background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 6%, var(--surface)), color-mix(in srgb, var(--accent) 3%, var(--surface)))',
                            borderBottom: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <span style={{ fontSize: 14, fontWeight: 650, color: 'var(--text-primary)' }}>
                              {t(step.titleKey)}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                            {t(step.descKey)}
                          </p>
                        </div>

                        {/* Comparison table */}
                        <div style={{ overflowX: 'auto' }}>
                          <table
                            style={{
                              width: '100%',
                              borderCollapse: 'collapse',
                              fontSize: 13,
                              minWidth: 400,
                            }}
                          >
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface)' }}>
                                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', width: '28%' }}></th>
                                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', width: '36%' }}>
                                  {t('prereq_cmp_col_airport')}
                                </th>
                                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', width: '36%', color: 'var(--accent)' }}>
                                  {t('prereq_cmp_col_self')}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {step.rows.map((row, ri) => (
                                <tr
                                  key={ri}
                                  style={{
                                    borderBottom: ri < step.rows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                                    transition: 'background 0.15s',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 3%, var(--surface))'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                    {t(row.labelKey)}
                                  </td>
                                  <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    {t(row.airportKey)}
                                  </td>
                                  <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    {t(row.selfKey)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Self-build guide link */}
                        <div
                          style={{
                            padding: '12px 16px',
                            borderTop: '1px solid var(--border-subtle)',
                            background: 'var(--surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {t('prereq_network_diy_cta')}
                          </span>
                          <a
                            href={step.linkUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 12,
                              fontWeight: 600,
                              color: 'var(--accent)',
                              textDecoration: 'none',
                              padding: '4px 12px',
                              borderRadius: 'var(--radius-full, 9999px)',
                              border: '1px solid color-mix(in srgb, var(--accent) 25%, var(--border-subtle))',
                              transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 6%, transparent)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            {t(step.linkKey)}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </article>
          ))}

          {/* Next step CTA */}
          <div
            style={{
              textAlign: 'center',
              padding: '32px 20px',
              borderRadius: 'var(--radius-lg, 12px)',
              background: 'color-mix(in srgb, var(--accent) 4%, var(--surface))',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <p style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              {t('prereq_done_title')}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
              {t('prereq_done_desc')}
            </p>
            <Link
              to='/guide'
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 20px',
                borderRadius: 'var(--radius-md, 8px)',
                background: 'var(--accent-gradient)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px color-mix(in srgb, var(--accent) 25%, transparent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              {t('prereq_next_step')}
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
