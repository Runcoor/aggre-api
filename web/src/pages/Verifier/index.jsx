/*
Copyright (C) 2025 QuantumNous

Model Verifier — verify whether a proxied AI endpoint is actually serving the
real upstream model (vs. silently substituting a cheaper one). Two-stage probe
implemented purely client-side; no backend required.

Page layout: left sub-nav (验证 / 验证记录 / 安全说明) + main content panel.
Theming: uses existing CSS variables, automatic dark mode.
i18n: keys under verifier.* in en.json and zh-CN.json.
*/

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button, Input, Select, Spin, Toast } from '@douyinfe/semi-ui';
import {
  ShieldCheck,
  History,
  Info,
  Cpu,
  KeyRound,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
} from 'lucide-react';
import { runVerification, detectFormat, fetchAvailableModels } from './verifierEngine';
import { useIsMobile } from '../../hooks/common/useIsMobile';

const STORAGE_KEY = 'cy-verifier-history-v1';
const HISTORY_LIMIT = 20;

// ─── Suggested presets ──────────────────────────────────────────────────────
const PRESETS = [
  // ─── Latest flagship models (highest priority) ───
  { label: 'Claude Sonnet 4.6', model: 'claude-sonnet-4-6', format: 'anthropic' },
  { label: 'Claude Opus 4.6', model: 'claude-opus-4-6', format: 'anthropic' },
  { label: 'GPT-5.4', model: 'gpt-5.4', format: 'openai' },
  { label: 'GPT-5.3 Codex', model: 'gpt-5.3-codex', format: 'openai' },
  { label: 'Gemini 3.1 Pro Preview', model: 'gemini-3.1-pro-preview', format: 'google' },
  { label: 'Gemini 3 Pro Preview', model: 'gemini-3-pro-preview', format: 'google' },
  { label: 'Claude Opus 4.5', model: 'claude-opus-4-5-20251101', format: 'anthropic' },
  { label: 'Claude Sonnet 4.5', model: 'claude-sonnet-4-5-20250929', format: 'anthropic' },
  { label: 'Grok 4 Heavy', model: 'grok-4-heavy', format: 'openai' },
  { label: 'Grok 4.1 Thinking', model: 'grok-4.1-thinking', format: 'openai' },
  { label: 'Grok 4.1 Expert', model: 'grok-4.1-expert', format: 'openai' },
  // ─── Stable / previous generation ───
  { label: 'Claude 3.5 Sonnet', model: 'claude-3-5-sonnet-20241022', format: 'anthropic' },
  { label: 'GPT-4o', model: 'gpt-4o', format: 'openai' },
  { label: 'GPT-4o mini', model: 'gpt-4o-mini', format: 'openai' },
  { label: 'o1', model: 'o1', format: 'openai' },
  { label: 'Gemini 2.5 Pro', model: 'gemini-2.5-pro', format: 'google' },
];

// ─── Storage helpers ────────────────────────────────────────────────────────
function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}
function saveHistory(arr) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(0, HISTORY_LIMIT)));
  } catch (e) { /* ignore quota */ }
}

// ─── Reusable atoms ─────────────────────────────────────────────────────────
// Collapsible single-line preview row. Shows first line of text by default,
// click chevron to expand and reveal full text + raw JSON payload.
const ReplyRow = ({ label, text, raw }) => {
  const [open, setOpen] = useState(false);
  const preview = (text || '(empty)').replace(/\s+/g, ' ').trim();
  const isEmpty = !text;

  return (
    <div
      style={{
        background: 'var(--surface-hover)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {label}
        </span>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 12,
            color: isEmpty ? 'var(--text-muted)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontStyle: isEmpty ? 'italic' : 'normal',
          }}
        >
          {preview}
        </span>
        {open ? (
          <ChevronUp size={14} color='var(--text-muted)' style={{ flexShrink: 0 }} />
        ) : (
          <ChevronDown size={14} color='var(--text-muted)' style={{ flexShrink: 0 }} />
        )}
      </button>
      {open && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Full text
            </div>
            <pre
              style={{
                margin: 0,
                padding: 10,
                background: 'var(--bg-base)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 11,
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 240,
                overflow: 'auto',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {text || '(empty)'}
            </pre>
          </div>
          {raw && (
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Raw payload
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: 10,
                  background: 'var(--bg-base)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: 300,
                  overflow: 'auto',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {JSON.stringify(raw, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StatusIcon = ({ status, size = 16 }) => {
  if (status === 'pass')
    return <CheckCircle2 size={size} style={{ color: '#10b981' }} />;
  if (status === 'warning')
    return <AlertTriangle size={size} style={{ color: '#f59e0b' }} />;
  return <XCircle size={size} style={{ color: '#ef4444' }} />;
};

const ScoreGauge = ({ score, t }) => {
  const verdict =
    score >= 85 ? t('verifier.verdict.authentic')
    : score >= 60 ? t('verifier.verdict.suspicious')
    : t('verifier.verdict.counterfeit');
  const verdictColor =
    score >= 85 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const ringGradient =
    score >= 85
      ? 'conic-gradient(#10b981 0% ' + score + '%, var(--surface-active) ' + score + '% 100%)'
      : score >= 60
        ? 'conic-gradient(#f59e0b 0% ' + score + '%, var(--surface-active) ' + score + '% 100%)'
        : 'conic-gradient(#ef4444 0% ' + score + '%, var(--surface-active) ' + score + '% 100%)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface)',
        border: '1px solid var(--border-default)',
      }}
    >
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: ringGradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 148,
            height: 148,
            borderRadius: '50%',
            background: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 44, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
            {score}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.05em' }}>
            {t('verifier.scoreLabel')}
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: 16,
          padding: '4px 14px',
          borderRadius: '999px',
          background: verdictColor + '1a',
          color: verdictColor,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {verdict}
      </div>
    </div>
  );
};

// ─── Sub-views ──────────────────────────────────────────────────────────────

const VerifyView = ({ t, onResult }) => {
  const isMobile = useIsMobile();
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('claude-3-5-sonnet-20241022');
  const [format, setFormat] = useState('auto');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  // Model discovery state
  const [fetching, setFetching] = useState(false);
  const [fetchedModels, setFetchedModels] = useState(null); // null = never fetched
  const [modelFilter, setModelFilter] = useState('');

  const resolvedFormat = useMemo(
    () => (format === 'auto' ? detectFormat(url, model) : format),
    [format, url, model],
  );

  const handleFetchModels = useCallback(async () => {
    if (!url) return Toast.error(t('verifier.validation.urlRequired'));
    if (!apiKey) return Toast.error(t('verifier.validation.keyRequired'));
    setFetching(true);
    try {
      const list = await fetchAvailableModels({
        baseUrl: url, apiKey, format: resolvedFormat,
      });
      setFetchedModels(list);
      if (list.length === 0) {
        Toast.warning(t('verifier.fetch.empty'));
      } else {
        Toast.success(t('verifier.fetch.done', { count: list.length }));
      }
    } catch (e) {
      setFetchedModels([]); // mark as "tried and failed"
      Toast.error(t('verifier.fetch.failed') + ': ' + (e.message || String(e)));
    } finally {
      setFetching(false);
    }
  }, [url, apiKey, resolvedFormat, t]);

  const filteredFetched = useMemo(() => {
    if (!fetchedModels || fetchedModels.length === 0) return [];
    const q = modelFilter.trim().toLowerCase();
    if (!q) return fetchedModels;
    return fetchedModels.filter((m) => m.toLowerCase().includes(q));
  }, [fetchedModels, modelFilter]);

  const start = useCallback(async () => {
    if (!url) return Toast.error(t('verifier.validation.urlRequired'));
    if (!apiKey) return Toast.error(t('verifier.validation.keyRequired'));
    if (!model) return Toast.error(t('verifier.validation.modelRequired'));

    setRunning(true);
    setResult(null);
    setError(null);
    try {
      const r = await runVerification({
        baseUrl: url,
        apiKey,
        model,
        format: resolvedFormat,
        t,
      });
      setResult(r);
      onResult(r);
      Toast.success(t('verifier.toastDone'));
    } catch (e) {
      setError(e.message || String(e));
      Toast.error(t('verifier.toastFailed'));
    } finally {
      setRunning(false);
    }
  }, [url, apiKey, model, resolvedFormat, t, onResult]);

  const fieldLabel = {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    letterSpacing: '0.06em',
    marginBottom: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };
  const card = {
    background: 'var(--surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)',
    padding: 24,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          {t('verifier.heroTitle')} <span style={{ color: 'var(--accent)' }}>{t('verifier.heroAccent')}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 14, lineHeight: 1.6, maxWidth: 640 }}>
          {t('verifier.heroDesc')}
        </p>
      </div>

      {/* Feature row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {[
          { icon: Globe, title: t('verifier.feat.input.title'), desc: t('verifier.feat.input.desc') },
          { icon: Cpu, title: t('verifier.feat.detect.title'), desc: t('verifier.feat.detect.desc') },
          { icon: ShieldCheck, title: t('verifier.feat.report.title'), desc: t('verifier.feat.report.desc') },
        ].map((f) => (
          <div key={f.title} style={card}>
            <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <f.icon size={16} color='#fff' />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{f.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Config */}
      <div style={card}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          <div>
            <div style={fieldLabel}><Globe size={12} /> {t('verifier.field.url')}</div>
            <Input
              value={url}
              onChange={setUrl}
              placeholder='https://api.your-proxy.com'
              size='large'
            />
          </div>
          <div>
            <div style={fieldLabel}><KeyRound size={12} /> {t('verifier.field.apiKey')}</div>
            <Input
              value={apiKey}
              onChange={setApiKey}
              placeholder='sk-...'
              mode='password'
              size='large'
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 16, marginTop: 16 }}>
          <div>
            <div style={fieldLabel}>
              <Cpu size={12} /> {t('verifier.field.model')}
              <button
                type='button'
                onClick={handleFetchModels}
                disabled={fetching || !url || !apiKey}
                style={{
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 10px',
                  borderRadius: '999px',
                  background: (!url || !apiKey) ? 'var(--surface-hover)' : 'var(--accent-gradient)',
                  color: (!url || !apiKey) ? 'var(--text-muted)' : '#fff',
                  border: 'none',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  cursor: (!url || !apiKey || fetching) ? 'not-allowed' : 'pointer',
                  opacity: fetching ? 0.7 : 1,
                  textTransform: 'none',
                }}
                title={(!url || !apiKey) ? t('verifier.fetch.needInputs') : ''}
              >
                <RefreshCw size={10} style={{ animation: fetching ? 'cy-spin 1s linear infinite' : 'none' }} />
                {fetching ? t('verifier.fetch.fetching') : t('verifier.fetch.button')}
              </button>
            </div>
            <Input
              value={model}
              onChange={setModel}
              placeholder='gpt-4o / claude-3-5-sonnet / gemini-2.5-pro'
              size='large'
            />
          </div>
          <div>
            <div style={fieldLabel}>{t('verifier.field.format')}</div>
            <Select
              value={format}
              onChange={setFormat}
              size='large'
              style={{ width: '100%' }}
              optionList={[
                { label: t('verifier.format.auto') + ` (${resolvedFormat})`, value: 'auto' },
                { label: 'OpenAI / Compatible', value: 'openai' },
                { label: 'Anthropic (Claude)', value: 'anthropic' },
                { label: 'Google (Gemini)', value: 'google' },
              ]}
            />
          </div>
        </div>

        {/* Fetched-models panel */}
        {fetchedModels !== null && (
          <div style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-hover)',
            border: '1px solid var(--border-subtle)',
          }}>
            {fetchedModels.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={12} style={{ color: '#f59e0b' }} />
                {t('verifier.fetch.fallbackHint')}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                    {t('verifier.fetch.available', { count: fetchedModels.length })}
                  </span>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={11} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type='text'
                      value={modelFilter}
                      onChange={(e) => setModelFilter(e.target.value)}
                      placeholder={t('verifier.fetch.filterPlaceholder')}
                      style={{
                        width: '100%',
                        padding: '4px 8px 4px 24px',
                        fontSize: 11,
                        background: 'var(--bg-base)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 4,
                  maxHeight: 140,
                  overflow: 'auto',
                }}>
                  {filteredFetched.map((id) => {
                    const active = model === id;
                    return (
                      <button
                        key={id}
                        type='button'
                        onClick={() => setModel(id)}
                        style={{
                          padding: '3px 10px',
                          fontSize: 11,
                          borderRadius: '999px',
                          background: active ? 'var(--accent-gradient)' : 'var(--bg-base)',
                          color: active ? '#fff' : 'var(--text-secondary)',
                          border: active ? 'none' : '1px solid var(--border-default)',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono)',
                          transition: 'all 120ms ease-out',
                        }}
                      >
                        {id}
                      </button>
                    );
                  })}
                  {filteredFetched.length === 0 && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 8px' }}>
                      {t('verifier.fetch.noMatch')}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Quick presets */}
        <div style={{ marginTop: 16 }}>
          <div style={{ ...fieldLabel, marginBottom: 8 }}>{t('verifier.presets')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { setModel(p.model); setFormat(p.format); }}
                style={{
                  padding: '4px 12px',
                  fontSize: 12,
                  borderRadius: '999px',
                  background: model === p.model ? 'var(--accent-gradient)' : 'var(--surface-hover)',
                  color: model === p.model ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <Button
            theme='solid'
            type='primary'
            size='large'
            block
            loading={running}
            onClick={start}
            style={{
              background: 'var(--accent-gradient)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              height: 48,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            {running ? t('verifier.running') : t('verifier.start')}
          </Button>
        </div>
      </div>

      <div
        style={{
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
          padding: '48px 40px 40px',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#f0ece2',
            margin: 0,
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-serif)',
          }}
        >
          {t('verifier.cta.title')}
        </h2>
        <p
          style={{
            color: 'rgba(240,236,226,0.6)',
            fontSize: 14,
            lineHeight: 1.7,
            marginTop: 12,
            maxWidth: 480,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {t('verifier.cta.desc')}
        </p>

        <div style={{ marginTop: 28 }}>
          <Link to='/console' style={{ textDecoration: 'none' }}>
            <Button
              theme='solid'
              type='primary'
              size='large'
              style={{
                background: 'var(--accent-gradient)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                height: 48,
                padding: '0 40px',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <ShieldCheck size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              {t('verifier.cta.start')}
            </Button>
          </Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20, flexWrap: 'wrap' }}>
          <Link
            to='/pricing'
            style={{ color: 'rgba(240,236,226,0.5)', fontSize: 13, textDecoration: 'none', transition: 'color 150ms ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(240,236,226,0.85)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(240,236,226,0.5)'; }}
          >
            {t('verifier.cta.models')}
          </Link>
          <span style={{ color: 'rgba(240,236,226,0.15)' }}>|</span>
          <Link
            to='/docs'
            style={{ color: 'rgba(240,236,226,0.5)', fontSize: 13, textDecoration: 'none', transition: 'color 150ms ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(240,236,226,0.85)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(240,236,226,0.5)'; }}
          >
            {t('verifier.cta.docs')}
          </Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 0, marginTop: 28, flexWrap: 'wrap' }}>
          {[
            t('verifier.cta.tagOpenai'),
            t('verifier.cta.tagAnthropic'),
            t('verifier.cta.tagGemini'),
          ].map((tag, i) => (
            <span
              key={tag}
              style={{
                padding: '4px 14px',
                fontSize: 12,
                color: 'rgba(240,236,226,0.4)',
                borderLeft: i > 0 ? '1px solid rgba(240,236,226,0.12)' : 'none',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: 16,
            display: 'flex',
            gap: 12,
          }}
        >
          <XCircle size={18} color='#ef4444' style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{t('verifier.errorTitle')}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, wordBreak: 'break-all' }}>{error}</div>
          </div>
        </div>
      )}

      {/* Loading */}
      {running && (
        <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 }}>
          <Spin />
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t('verifier.runningHint')}</span>
        </div>
      )}

      {/* Result */}
      {result && !running && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '280px 1fr', gap: 20 }}>
          <ScoreGauge score={result.score} t={t} />
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                {t('verifier.resultTitle')}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {t('verifier.reportId')}: {result.id}
              </span>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { icon: Clock, label: t('verifier.stat.latency'), val: result.latency + ' ms' },
                { icon: Zap, label: t('verifier.stat.tps'), val: result.tps.toFixed(1) },
                { label: t('verifier.stat.input'), val: result.inputTokens },
                { label: t('verifier.stat.output'), val: result.outputTokens },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-hover)',
                  }}
                >
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                    {s.val}
                  </div>
                </div>
              ))}
            </div>

            {/* Checks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result.checks.map((c) => (
                <div
                  key={c.key}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-hover)',
                  }}
                >
                  <StatusIcon status={c.status} size={18} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{c.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Raw replies — one-line preview, click to expand */}
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ReplyRow label={t('verifier.stage1')} text={result.stage1Reply} raw={result.stage1Raw} />
              {(result.stage2Reply || result.stage2Raw) && (
                <ReplyRow label={t('verifier.stage2')} text={result.stage2Reply} raw={result.stage2Raw} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const HistoryView = ({ t, history, onClear }) => {
  const card = {
    background: 'var(--surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)',
    padding: 24,
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {t('verifier.history.title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 13 }}>
            {t('verifier.history.desc')}
          </p>
        </div>
        {history.length > 0 && (
          <Button
            theme='borderless'
            type='tertiary'
            icon={<Trash2 size={14} />}
            onClick={onClear}
          >
            {t('verifier.history.clear')}
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: 60 }}>
          <History size={32} color='var(--text-muted)' style={{ marginBottom: 12 }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{t('verifier.history.empty')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map((h) => (
            <div
              key={h.id}
              style={{
                ...card,
                padding: 16,
                display: 'grid',
                gridTemplateColumns: '56px minmax(0, 1fr) auto',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background:
                    h.score >= 85 ? 'rgba(16, 185, 129, 0.12)'
                    : h.score >= 60 ? 'rgba(245, 158, 11, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)',
                  color:
                    h.score >= 85 ? '#10b981'
                    : h.score >= 60 ? '#f59e0b'
                    : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {h.score}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {h.model}
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: '999px', background: 'var(--surface-hover)', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {h.format}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, wordBreak: 'break-all' }}>
                  {h.endpoint}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                  {new Date(h.timestamp).toLocaleString()} · {h.id}
                </div>
              </div>
              <div
                style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: 11,
                  fontWeight: 600,
                  background:
                    h.score >= 85 ? 'rgba(16, 185, 129, 0.12)'
                    : h.score >= 60 ? 'rgba(245, 158, 11, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)',
                  color:
                    h.score >= 85 ? '#10b981'
                    : h.score >= 60 ? '#f59e0b'
                    : '#ef4444',
                }}
              >
                {h.score >= 85 ? t('verifier.verdict.authentic')
                  : h.score >= 60 ? t('verifier.verdict.suspicious')
                  : t('verifier.verdict.counterfeit')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SafetyView = ({ t }) => {
  const card = {
    background: 'var(--surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)',
    padding: 28,
  };
  const sections = [
    {
      icon: ShieldCheck,
      title: t('verifier.safety.localTitle'),
      body: t('verifier.safety.localBody'),
    },
    {
      icon: KeyRound,
      title: t('verifier.safety.keyTitle'),
      body: t('verifier.safety.keyBody'),
    },
    {
      icon: History,
      title: t('verifier.safety.historyTitle'),
      body: t('verifier.safety.historyBody'),
    },
    {
      icon: Cpu,
      title: t('verifier.safety.algoTitle'),
      body: t('verifier.safety.algoBody'),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          {t('verifier.safety.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 13, maxWidth: 640 }}>
          {t('verifier.safety.intro')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {sections.map((s) => (
          <div key={s.title} style={card}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <s.icon size={20} color='#fff' />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{s.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
              {s.body}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 16,
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(0, 114, 255, 0.05)',
          border: '1px solid rgba(0, 114, 255, 0.2)',
          display: 'flex',
          gap: 12,
        }}
      >
        <Info size={18} color='var(--accent)' style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {t('verifier.safety.reminder')}
        </div>
      </div>
    </div>
  );
};

// ─── Main page ──────────────────────────────────────────────────────────────

const Verifier = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [view, setView] = useState('verify');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleResult = useCallback((r) => {
    setHistory((prev) => {
      const next = [r, ...prev].slice(0, HISTORY_LIMIT);
      saveHistory(next);
      return next;
    });
  }, []);

  const handleClear = useCallback(() => {
    saveHistory([]);
    setHistory([]);
    Toast.success(t('verifier.history.cleared'));
  }, [t]);

  const navItems = [
    { key: 'verify', label: t('verifier.nav.verify'), icon: ShieldCheck },
    { key: 'history', label: t('verifier.nav.history'), icon: History },
    { key: 'safety', label: t('verifier.nav.safety'), icon: Info },
  ];

  return (
    <div
      style={{
        minHeight: 'calc(100vh - var(--header-height))',
        background: 'var(--bg-base)',
        padding: isMobile ? '20px 14px' : '32px 24px',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '220px 1fr',
          gap: isMobile ? 16 : 24,
        }}
      >
        {/* Left sub-nav */}
        <aside
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: isMobile ? 6 : 12,
            height: 'fit-content',
            position: isMobile ? 'static' : 'sticky',
            top: 'calc(var(--header-height) + 24px)',
            display: isMobile ? 'flex' : 'block',
            gap: isMobile ? 4 : 0,
            overflowX: isMobile ? 'auto' : 'visible',
          }}
        >
          {navItems.map((it) => {
            const active = view === it.key;
            return (
              <button
                key={it.key}
                onClick={() => setView(it.key)}
                style={{
                  width: isMobile ? 'auto' : '100%',
                  flex: isMobile ? '1 0 auto' : 'unset',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? 6 : 12,
                  padding: isMobile ? '8px 12px' : '12px 14px',
                  marginBottom: isMobile ? 0 : 4,
                  borderRadius: 'var(--radius-md)',
                  background: active ? 'var(--accent-gradient)' : 'transparent',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  transition: 'all 150ms ease-out',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                <it.icon size={16} />
                <span style={{ letterSpacing: '0.02em' }}>{it.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Main content */}
        <main>
          {view === 'verify' && <VerifyView t={t} onResult={handleResult} />}
          {view === 'history' && <HistoryView t={t} history={history} onClear={handleClear} />}
          {view === 'safety' && <SafetyView t={t} />}
        </main>
      </div>
    </div>
  );
};

export default Verifier;
