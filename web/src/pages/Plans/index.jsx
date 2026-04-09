/*
Copyright (C) 2025 QuantumNous

Plans / Pricing page — three-tier pay-as-you-go layout.
  - Free            : free access to selected models
  - Pay As You Go   : the popular middle tier, billed per request
  - Volume + Support: enterprise tier with discounts + dedicated channel

Mobile-responsive, dark-mode aware, fully i18n. All CSS variables.
Animations: stagger fade-in, hover lift, popular-card glow pulse.
*/

import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../../context/User';
import {
  Sparkles,
  Zap,
  Crown,
  Check,
  X,
  MessageSquare,
  ArrowRight,
  Star,
} from 'lucide-react';

// ─── Plan card ──────────────────────────────────────────────────────────────
const PlanCard = ({
  index,
  popular,
  badge,
  icon: Icon,
  iconColor,
  name,
  priceLabel,
  priceUnit,
  description,
  features,
  cta,
  ctaTo,
  ctaExternal,
  outlined,
  t,
}) => {
  const [hover, setHover] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const tm = setTimeout(() => setMounted(true), 80 + index * 120);
    return () => clearTimeout(tm);
  }, [index]);

  const accent = popular
    ? 'linear-gradient(135deg, rgba(0, 114, 255, 0.18) 0%, rgba(0, 198, 255, 0.10) 50%, transparent 100%)'
    : 'transparent';

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: 'var(--surface)',
        border: popular ? '1.5px solid rgba(0, 114, 255, 0.45)' : '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl, 18px)',
        padding: '32px 28px 28px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: popular
          ? (hover
              ? '0 16px 48px rgba(0, 114, 255, 0.22), 0 0 0 1px rgba(0, 114, 255, 0.3) inset'
              : '0 8px 32px rgba(0, 114, 255, 0.16), 0 0 0 1px rgba(0, 114, 255, 0.18) inset')
          : (hover
              ? '0 12px 36px rgba(0, 0, 0, 0.10)'
              : '0 2px 8px rgba(0, 0, 0, 0.04)'),
        transform: mounted
          ? `translateY(${hover ? -6 : 0}px)`
          : 'translateY(20px)',
        opacity: mounted ? 1 : 0,
        transition: 'all 360ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        // No overflow:hidden here — otherwise the popular badge (top: -14px)
        // gets clipped. The tinted overlay below gets its own border-radius
        // to stay within the card's rounded corners.
        zIndex: popular ? 2 : 1,
      }}
    >
      {/* Tinted overlay for popular card — matches card border-radius so
          corners stay rounded without clipping the external badge. */}
      {popular && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: accent,
            pointerEvents: 'none',
            opacity: 0.85,
            borderRadius: 'inherit',
          }}
        />
      )}

      {/* Most popular badge */}
      {badge && (
        <div
          style={{
            position: 'absolute',
            top: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '5px 16px',
            borderRadius: '999px',
            background: 'var(--accent-gradient)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            boxShadow: '0 6px 20px rgba(0, 114, 255, 0.35)',
            zIndex: 3,
          }}
        >
          <Star size={11} fill='#fff' stroke='none' />
          {badge}
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            background: popular
              ? 'var(--accent-gradient)'
              : 'var(--surface-hover)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 18,
          }}
        >
          <Icon size={22} color={popular ? '#fff' : iconColor || 'var(--text-primary)'} />
        </div>

        {/* Tier label */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: popular ? 'var(--accent)' : 'var(--text-muted)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          {name.label}
        </div>

        {/* Plan title */}
        <h3
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {name.title}
        </h3>

        {/* Price */}
        <div style={{ marginTop: 16, marginBottom: 16, display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {priceLabel}
          </span>
          {priceUnit && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {priceUnit}
            </span>
          )}
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: '0 0 22px',
          }}
        >
          {description}
        </p>

        {/* Feature list */}
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            flex: 1,
          }}
        >
          {features.map((f, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                fontSize: 13,
                color: f.muted ? 'var(--text-muted)' : 'var(--text-secondary)',
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: f.muted
                    ? 'var(--surface-hover)'
                    : popular
                      ? 'rgba(0, 114, 255, 0.15)'
                      : 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 1,
                }}
              >
                {f.muted ? (
                  <X size={11} color='var(--text-muted)' />
                ) : (
                  <Check size={11} color={popular ? 'var(--accent)' : '#10b981'} strokeWidth={3} />
                )}
              </span>
              <span>{f.text}</span>
            </li>
          ))}
        </ul>

        {/* CTA button */}
        <div style={{ marginTop: 28 }}>
          {ctaExternal ? (
            <a
              href={ctaExternal}
              target='_blank'
              rel='noopener noreferrer'
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <CTAButton popular={popular} outlined={outlined} label={cta} />
            </a>
          ) : (
            <Link to={ctaTo || '/console'} style={{ textDecoration: 'none', display: 'block' }}>
              <CTAButton popular={popular} outlined={outlined} label={cta} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── CTA button ────────────────────────────────────────────────────────────
const CTAButton = ({ popular, outlined, label }) => {
  const [hover, setHover] = useState(false);
  if (popular) {
    return (
      <button
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: '100%',
          padding: '13px 20px',
          fontSize: 14,
          fontWeight: 600,
          color: '#fff',
          background: 'var(--accent-gradient)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          transition: 'all 200ms ease-out',
          boxShadow: hover
            ? '0 10px 28px rgba(0, 114, 255, 0.40)'
            : '0 4px 16px rgba(0, 114, 255, 0.25)',
          transform: hover ? 'translateY(-1px)' : 'translateY(0)',
          letterSpacing: '0.01em',
        }}
      >
        {label}
      </button>
    );
  }
  if (outlined) {
    return (
      <button
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: '100%',
          padding: '13px 20px',
          fontSize: 14,
          fontWeight: 600,
          color: hover ? '#fff' : 'var(--text-primary)',
          background: hover ? 'var(--text-primary)' : 'var(--surface)',
          border: '1.5px solid var(--text-primary)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          transition: 'all 200ms ease-out',
          letterSpacing: '0.01em',
        }}
      >
        {label}
      </button>
    );
  }
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%',
        padding: '13px 20px',
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--text-primary)',
        background: hover ? 'var(--surface-hover)' : 'transparent',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'all 200ms ease-out',
        letterSpacing: '0.01em',
      }}
    >
      {label}
    </button>
  );
};

// ─── Comparison table ──────────────────────────────────────────────────────
const ComparisonTable = ({ t }) => {
  const rows = [
    {
      label: t('plans.compare.modelAccess'),
      free: t('plans.compare.modelAccess_free'),
      paid: t('plans.compare.modelAccess_paid'),
      enterprise: t('plans.compare.modelAccess_enterprise'),
    },
    {
      label: t('plans.compare.requestLimit'),
      free: t('plans.compare.requestLimit_free'),
      paid: t('plans.compare.requestLimit_paid'),
      enterprise: t('plans.compare.requestLimit_enterprise'),
    },
    {
      label: t('plans.compare.contextWindow'),
      free: '32K',
      paid: t('plans.compare.contextWindow_paid'),
      enterprise: t('plans.compare.contextWindow_enterprise'),
    },
    {
      label: t('plans.compare.support'),
      free: t('plans.compare.support_free'),
      paid: t('plans.compare.support_paid'),
      enterprise: t('plans.compare.support_enterprise'),
    },
    {
      label: t('plans.compare.discount'),
      free: '—',
      paid: t('plans.compare.discount_paid'),
      enterprise: t('plans.compare.discount_enterprise'),
    },
    {
      label: t('plans.compare.sla'),
      free: '—',
      paid: t('plans.compare.sla_paid'),
      enterprise: '99.9%',
    },
    {
      label: t('plans.compare.api'),
      free: t('plans.compare.api_free'),
      paid: t('plans.compare.api_paid'),
      enterprise: t('plans.compare.api_enterprise'),
    },
  ];

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Desktop table */}
      <div className='cy-plans-table-desktop' style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
          }}
        >
          <thead>
            <tr style={{ background: 'linear-gradient(90deg, rgba(0,114,255,0.05), rgba(0,198,255,0.08), rgba(0,114,255,0.04))' }}>
              {[
                t('plans.compare.feature'),
                t('plans.tier.free'),
                t('plans.tier.paid'),
                t('plans.tier.enterprise'),
              ].map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: '16px 24px',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <td style={{ padding: '16px 24px', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {row.label}
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                  {row.free}
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--accent)', fontWeight: 600 }}>
                  {row.paid}
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                  {row.enterprise}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards stack */}
      <div className='cy-plans-table-mobile' style={{ display: 'none', flexDirection: 'column' }}>
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              padding: '14px 18px',
              borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {row.label}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[['free', row.free], ['paid', row.paid], ['enterprise', row.enterprise]].map(([key, val]) => (
                <div key={key}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                    {key === 'free' ? t('plans.tier.free') : key === 'paid' ? t('plans.tier.paid') : t('plans.tier.enterprise')}
                  </div>
                  <div style={{ fontSize: 12, color: key === 'paid' ? 'var(--accent)' : 'var(--text-primary)', fontWeight: key === 'paid' ? 600 : 500 }}>
                    {val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────
const PlansPage = () => {
  const { t } = useTranslation();
  const [userState] = useContext(UserContext);
  const isLoggedIn = !!userState?.user;
  const [heroVisible, setHeroVisible] = useState(false);
  const [tableVisible, setTableVisible] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    setHeroVisible(true);
    const t1 = setTimeout(() => setTableVisible(true), 700);
    const t2 = setTimeout(() => setCtaVisible(true), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const plans = [
    {
      icon: Sparkles,
      iconColor: '#10b981',
      name: { label: t('plans.tier.free'), title: t('plans.free.title') },
      priceLabel: t('plans.free.price'),
      priceUnit: '',
      description: t('plans.free.desc'),
      features: [
        { text: t('plans.free.f1') },
        { text: t('plans.free.f2') },
        { text: t('plans.free.f3') },
        { text: t('plans.free.f4'), muted: true },
        { text: t('plans.free.f5'), muted: true },
      ],
      cta: t('plans.free.cta'),
      ctaTo: '/register',
    },
    {
      popular: true,
      badge: t('plans.popular'),
      icon: Zap,
      name: { label: t('plans.tier.paid'), title: t('plans.paid.title') },
      priceLabel: t('plans.paid.price'),
      priceUnit: t('plans.paid.priceUnit'),
      description: t('plans.paid.desc'),
      features: [
        { text: t('plans.paid.f1') },
        { text: t('plans.paid.f2') },
        { text: t('plans.paid.f3') },
        { text: t('plans.paid.f4') },
        { text: t('plans.paid.f5') },
      ],
      cta: t('plans.paid.cta'),
      ctaTo: '/console/topup',
    },
    {
      icon: Crown,
      iconColor: '#a855f7',
      name: { label: t('plans.tier.enterprise'), title: t('plans.enterprise.title') },
      priceLabel: t('plans.enterprise.price'),
      priceUnit: '',
      description: t('plans.enterprise.desc'),
      features: [
        { text: t('plans.enterprise.f1') },
        { text: t('plans.enterprise.f2') },
        { text: t('plans.enterprise.f3') },
        { text: t('plans.enterprise.f4') },
        { text: t('plans.enterprise.f5') },
      ],
      cta: t('plans.enterprise.cta'),
      ctaTo: '/about',
      outlined: true,
    },
  ];

  return (
    <div
      style={{
        minHeight: 'calc(100vh - var(--header-height))',
        background: 'var(--bg-base)',
        padding: '60px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background blobs — subtle vibrancy */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -120,
          left: '20%',
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 114, 255, 0.10) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 200,
          right: '15%',
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 198, 255, 0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: 1180, margin: '0 auto', position: 'relative' }}>
        {/* Hero */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 60,
            transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
            opacity: heroVisible ? 1 : 0,
            transition: 'all 600ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 14px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, rgba(0, 114, 255, 0.10), rgba(0, 198, 255, 0.16))',
              border: '1px solid rgba(0, 114, 255, 0.20)',
              color: 'var(--accent)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 18,
            }}
          >
            <Sparkles size={11} />
            {t('plans.hero.kicker')}
          </div>
          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            {t('plans.hero.title1')}
            <br />
            <span
              style={{
                background: 'var(--accent-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {t('plans.hero.title2')}
            </span>
          </h1>
          <p
            style={{
              fontSize: 15,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              maxWidth: 580,
              margin: '20px auto 0',
            }}
          >
            {t('plans.hero.desc')}
          </p>
        </div>

        {/* Plan cards */}
        <div
          className='cy-plans-grid'
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            alignItems: 'stretch',
            marginBottom: 80,
            maxWidth: 1100,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {plans.map((p, i) => (
            <PlanCard key={i} index={i} {...p} t={t} />
          ))}
        </div>

        {/* Comparison */}
        <div
          style={{
            transform: tableVisible ? 'translateY(0)' : 'translateY(30px)',
            opacity: tableVisible ? 1 : 0,
            transition: 'all 600ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          <h2
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--text-primary)',
              textAlign: 'center',
              margin: '0 0 32px',
              letterSpacing: '-0.02em',
            }}
          >
            {t('plans.compare.title')}
          </h2>
          <ComparisonTable t={t} />
        </div>

        {/* CTA banner */}
        <div
          style={{
            marginTop: 80,
            borderRadius: 'var(--radius-xl, 18px)',
            background: 'linear-gradient(135deg, rgba(0, 114, 255, 0.10) 0%, rgba(0, 198, 255, 0.06) 100%)',
            border: '1px solid rgba(0, 114, 255, 0.20)',
            padding: '48px 32px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            transform: ctaVisible ? 'translateY(0)' : 'translateY(30px)',
            opacity: ctaVisible ? 1 : 0,
            transition: 'all 600ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          <h3
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {t('plans.cta.title')}
          </h3>
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              maxWidth: 480,
              margin: '12px auto 28px',
              lineHeight: 1.6,
            }}
          >
            {t('plans.cta.desc')}
          </p>
          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link to={isLoggedIn ? '/console' : '/register'} style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '12px 28px',
                  fontSize: 14,
                  fontWeight: 600,
                  background: 'var(--accent-gradient)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 6px 24px rgba(0, 114, 255, 0.32)',
                  transition: 'transform 200ms ease, box-shadow 200ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 32px rgba(0, 114, 255, 0.42)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 114, 255, 0.32)';
                }}
              >
                {isLoggedIn ? t('plans.cta.primaryAuth') : t('plans.cta.primary')}
                <ArrowRight size={14} />
              </button>
            </Link>
            <Link to='/about' style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '12px 28px',
                  fontSize: 14,
                  fontWeight: 600,
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background 200ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
              >
                <MessageSquare size={14} />
                {t('plans.cta.secondary')}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;
