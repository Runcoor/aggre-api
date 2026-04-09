/*
Copyright (C) 2025 QuantumNous

Endpoint latency tester. Runs N small chat-completion probes against the
specified endpoint, measures per-request latency + first-token latency (for
streaming), computes P50/P95/P99/avg/min/max, and renders a live bar chart.

Fully client-side. Supports OpenAI-compatible endpoints (the most common).
*/

import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Select, Toast, Button } from '@douyinfe/semi-ui';
import {
  Gauge,
  Play,
  Square,
  Globe,
  KeyRound,
  Cpu,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

// ─── Styles ─────────────────────────────────────────────────────────────────
const card = {
  background: 'var(--surface)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  padding: 24,
};
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

// ─── Statistics ─────────────────────────────────────────────────────────────
function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((sorted.length * p) / 100));
  return sorted[idx];
}
function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ─── Single probe (streaming) ──────────────────────────────────────────────
async function probeOnce({ endpoint, apiKey, model, signal }) {
  // Reasoning models (gpt-5 / o1 / o3 / o4 / thinking variants) use
  // max_completion_tokens instead of max_tokens and need reasoning_effort set
  // low so they don't burn the whole budget thinking. Non-reasoning models
  // keep the classic max_tokens param.
  const m = (model || '').toLowerCase();
  const isReasoning =
    m.startsWith('o1') || m.startsWith('o3') || m.startsWith('o4') ||
    m.startsWith('gpt-5') || m.includes('thinking') || m.includes('reasoning');

  const body = {
    model,
    messages: [{ role: 'user', content: 'Say hi in 3 words only.' }],
    stream: true,
  };
  if (isReasoning) {
    body.max_completion_tokens = 512;
    body.reasoning_effort = 'low';
  } else {
    body.max_tokens = 32;
  }

  const startedAt = performance.now();
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'text/event-stream',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => '');
    throw new Error(`HTTP ${resp.status}: ${err.slice(0, 120)}`);
  }
  if (!resp.body) throw new Error('no body');

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let firstTokenAt = null;
  let buffer = '';
  let tokenCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (firstTokenAt === null) firstTokenAt = performance.now();
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') continue;
      try {
        const j = JSON.parse(data);
        const delta = j?.choices?.[0]?.delta;
        if (delta?.content) tokenCount += 1;
      } catch (e) { /* ignore */ }
    }
  }
  const doneAt = performance.now();

  return {
    totalMs: Math.round(doneAt - startedAt),
    firstTokenMs: firstTokenAt ? Math.round(firstTokenAt - startedAt) : null,
    tokens: tokenCount,
  };
}

// ─── Stat card ──────────────────────────────────────────────────────────────
const StatCard = ({ label, value, unit, color }) => (
  <div
    style={{
      padding: '14px 16px',
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface-hover)',
      border: '1px solid var(--border-subtle)',
    }}
  >
    <div
      style={{
        fontSize: 10,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: 600,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 22,
        fontWeight: 700,
        color: color || 'var(--text-primary)',
        marginTop: 4,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4, fontWeight: 500 }}>
        {unit}
      </span>
    </div>
  </div>
);

// ─── Main component ────────────────────────────────────────────────────────
const LatencyTester = () => {
  const { t } = useTranslation();
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [count, setCount] = useState('10');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]); // [{totalMs, firstTokenMs, tokens, error}]
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const abortRef = useRef(null);

  const endpoint = `${baseUrl.trim().replace(/\/+$/, '').replace(/\/v1\/chat\/completions\/?$/i, '').replace(/\/v1\/?$/i, '')}/v1/chat/completions`;

  const start = useCallback(async () => {
    if (!baseUrl) return Toast.error(t('tools.latency.validation.urlRequired'));
    if (!apiKey) return Toast.error(t('tools.latency.validation.keyRequired'));
    if (!model) return Toast.error(t('tools.latency.validation.modelRequired'));
    const n = parseInt(count, 10);
    if (!n || n < 1 || n > 100) return Toast.error(t('tools.latency.validation.countRange'));

    setRunning(true);
    setResults([]);
    setProgress({ done: 0, total: n });
    const controller = new AbortController();
    abortRef.current = controller;

    const collected = [];
    for (let i = 0; i < n; i++) {
      if (controller.signal.aborted) break;
      try {
        const r = await probeOnce({ endpoint, apiKey, model, signal: controller.signal });
        collected.push(r);
      } catch (e) {
        if (e.name === 'AbortError') break;
        collected.push({ error: e.message || String(e) });
      }
      setResults([...collected]);
      setProgress({ done: i + 1, total: n });
    }
    setRunning(false);
    abortRef.current = null;
    if (!controller.signal.aborted) {
      const okCount = collected.filter((r) => !r.error).length;
      if (okCount > 0) Toast.success(t('tools.latency.done', { count: okCount }));
    }
  }, [baseUrl, apiKey, model, count, endpoint, t]);

  const stop = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setRunning(false);
  }, []);

  // Compute statistics from successful results only
  const stats = React.useMemo(() => {
    const ok = results.filter((r) => !r.error);
    const total = ok.map((r) => r.totalMs);
    const firstToken = ok.map((r) => r.firstTokenMs).filter((x) => x !== null);
    const errors = results.length - ok.length;
    return {
      ok: ok.length,
      errors,
      total: {
        avg: Math.round(average(total)),
        min: total.length ? Math.min(...total) : 0,
        max: total.length ? Math.max(...total) : 0,
        p50: Math.round(percentile(total, 50)),
        p95: Math.round(percentile(total, 95)),
        p99: Math.round(percentile(total, 99)),
      },
      firstToken: {
        avg: Math.round(average(firstToken)),
        p50: Math.round(percentile(firstToken, 50)),
        p95: Math.round(percentile(firstToken, 95)),
      },
    };
  }, [results]);

  // Bar chart max for scaling
  const maxBar = React.useMemo(() => {
    const vals = results.filter((r) => !r.error).map((r) => r.totalMs);
    return vals.length ? Math.max(...vals) : 1;
  }, [results]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Gauge size={18} color='#fff' />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {t('tools.latency.title')}
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, maxWidth: 640, margin: 0 }}>
          {t('tools.latency.desc')}
        </p>
      </div>

      {/* Config */}
      <div style={card}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={fieldLabel}><Globe size={12} /> {t('tools.latency.field.url')}</div>
            <Input value={baseUrl} onChange={setBaseUrl} size='large' placeholder='https://api.your-proxy.com' />
          </div>
          <div>
            <div style={fieldLabel}><KeyRound size={12} /> {t('tools.latency.field.apiKey')}</div>
            <Input value={apiKey} onChange={setApiKey} mode='password' size='large' placeholder='sk-...' />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginTop: 16 }}>
          <div>
            <div style={fieldLabel}><Cpu size={12} /> {t('tools.latency.field.model')}</div>
            <Input value={model} onChange={setModel} size='large' placeholder='gpt-4o-mini' />
          </div>
          <div>
            <div style={fieldLabel}>{t('tools.latency.field.count')}</div>
            <Select
              value={count}
              onChange={setCount}
              size='large'
              style={{ width: '100%' }}
              optionList={[
                { label: '5', value: '5' },
                { label: '10', value: '10' },
                { label: '20', value: '20' },
                { label: '50', value: '50' },
                { label: '100', value: '100' },
              ]}
            />
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          {!running ? (
            <Button
              theme='solid'
              type='primary'
              size='large'
              block
              onClick={start}
              style={{
                background: 'var(--accent-gradient)',
                border: 'none',
                height: 48,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <Play size={14} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              {t('tools.latency.start')}
            </Button>
          ) : (
            <Button
              theme='solid'
              type='danger'
              size='large'
              block
              onClick={stop}
              style={{ height: 48, fontSize: 14, fontWeight: 600 }}
            >
              <Square size={14} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              {t('tools.latency.stop')} ({progress.done}/{progress.total})
            </Button>
          )}
        </div>
      </div>

      {/* Stats + chart */}
      {results.length > 0 && (
        <>
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={14} color='var(--accent)' />
              {t('tools.latency.statsTitle')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              <StatCard label={t('tools.latency.stat.avg')} value={stats.total.avg} unit='ms' />
              <StatCard label='P50' value={stats.total.p50} unit='ms' color='#10b981' />
              <StatCard label='P95' value={stats.total.p95} unit='ms' color='#f59e0b' />
              <StatCard label='P99' value={stats.total.p99} unit='ms' color='#ef4444' />
              <StatCard label={t('tools.latency.stat.min')} value={stats.total.min} unit='ms' />
              <StatCard label={t('tools.latency.stat.max')} value={stats.total.max} unit='ms' />
            </div>

            <div
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0, 114, 255, 0.05)',
                border: '1px solid rgba(0, 114, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={14} color='var(--accent)' />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {t('tools.latency.firstTokenLabel')}:
                </span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                avg <span style={{ color: 'var(--accent)' }}>{stats.firstToken.avg}</span> ms
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                P50 <span style={{ color: 'var(--accent)' }}>{stats.firstToken.p50}</span> ms
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                P95 <span style={{ color: 'var(--accent)' }}>{stats.firstToken.p95}</span> ms
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                {t('tools.latency.success')}: {stats.ok} · {t('tools.latency.errors')}: {stats.errors}
              </span>
            </div>
          </div>

          {/* Bar chart */}
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>
              {t('tools.latency.chartTitle')}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 180, padding: '0 2px' }}>
              {results.map((r, idx) => {
                if (r.error) {
                  return (
                    <div
                      key={idx}
                      title={r.error}
                      style={{
                        flex: 1,
                        minWidth: 8,
                        height: '100%',
                        background: 'rgba(239, 68, 68, 0.18)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '4px 4px 0 0',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        paddingTop: 4,
                      }}
                    >
                      <XCircle size={10} color='#ef4444' />
                    </div>
                  );
                }
                const h = maxBar ? (r.totalMs / maxBar) * 100 : 0;
                return (
                  <div
                    key={idx}
                    title={`${r.totalMs} ms · first token ${r.firstTokenMs ?? '-'} ms`}
                    style={{
                      flex: 1,
                      minWidth: 8,
                      height: `${Math.max(2, h)}%`,
                      background: 'var(--accent-gradient)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 220ms ease-out',
                    }}
                  />
                );
              })}
              {/* pad empty slots */}
              {Array.from({
                length: Math.max(0, progress.total - results.length),
              }).map((_, i) => (
                <div
                  key={`pad-${i}`}
                  style={{
                    flex: 1,
                    minWidth: 8,
                    height: '2%',
                    background: 'var(--surface-hover)',
                    borderRadius: '4px 4px 0 0',
                  }}
                />
              ))}
            </div>
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                color: 'var(--text-muted)',
              }}
            >
              <span>#1</span>
              <span>{t('tools.latency.axisMax', { max: maxBar })} ms</span>
              <span>#{progress.total}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LatencyTester;
