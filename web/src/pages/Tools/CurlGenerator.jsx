/*
Copyright (C) 2025 QuantumNous

cURL / SDK code generator. Visually compose a chat-completion request and
get copy-ready code in 4 languages (cURL, Python, Node.js, Go).
Fully client-side, no backend call — runs entirely on the user's machine.
*/

import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, TextArea, Select, Toast, Button } from '@douyinfe/semi-ui';
import {
  Terminal,
  Copy,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Globe,
  KeyRound,
  Cpu,
} from 'lucide-react';

// ─── Shared styles ──────────────────────────────────────────────────────────
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

// ─── Format escapers ────────────────────────────────────────────────────────
const escapeShellArg = (s) =>
  "'" + String(s).replace(/'/g, "'\\''") + "'";
const escapeJsString = (s) => JSON.stringify(String(s));
const escapePyString = (s) => JSON.stringify(String(s));

// ─── Code generators ────────────────────────────────────────────────────────
const generators = {
  curl: ({ url, apiKey, bodyJson }) => {
    const body = bodyJson.replace(/'/g, "'\\''");
    return `curl ${url} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}" \\
  -d ${escapeShellArg(body)}`;
  },

  python: ({ url, apiKey, body }) => {
    // Convert JSON literals to Python literals so the generated code is
    // directly executable: true → True, false → False, null → None.
    // We only replace when the token stands alone (not inside a string).
    const jsonToPy = (s) =>
      s.replace(/: true(,|\n|\s|$)/g, ': True$1')
       .replace(/: false(,|\n|\s|$)/g, ': False$1')
       .replace(/: null(,|\n|\s|$)/g, ': None$1')
       .replace(/\[true(,|\])/g, '[True$1')
       .replace(/\[false(,|\])/g, '[False$1');
    const pyDict = jsonToPy(JSON.stringify(body, null, 4));
    return `import requests

url = ${escapePyString(url)}
headers = {
    "Content-Type": "application/json",
    "Authorization": ${escapePyString(`Bearer ${apiKey || 'YOUR_API_KEY'}`)},
}
payload = ${pyDict}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`;
  },

  node: ({ url, apiKey, body }) => {
    return `const response = await fetch(${escapeJsString(url)}, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': ${escapeJsString(`Bearer ${apiKey || 'YOUR_API_KEY'}`)},
  },
  body: JSON.stringify(${JSON.stringify(body, null, 2)}),
});

const data = await response.json();
console.log(data);`;
  },

  go: ({ url, apiKey, body }) => {
    const escGo = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    const bodyLiteral = JSON.stringify(body).replace(/`/g, '\\`');
    return `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

func main() {
    body := []byte(\`${bodyLiteral}\`)

    req, _ := http.NewRequest("POST", ${escGo(url)}, bytes.NewBuffer(body))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer ${apiKey || 'YOUR_API_KEY'}")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    respBody, _ := io.ReadAll(resp.Body)
    fmt.Println(string(respBody))

    _ = json.Unmarshal(respBody, &map[string]any{})
}`;
  },
};

// ─── Main component ─────────────────────────────────────────────────────────
const CurlGenerator = () => {
  const { t } = useTranslation();
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o');
  const [temperature, setTemperature] = useState('0.7');
  const [maxTokens, setMaxTokens] = useState('2048');
  const [stream, setStream] = useState(false);
  const [lang, setLang] = useState('curl');
  const [copied, setCopied] = useState(false);

  // messages start with a single user message; user can add more
  const [messages, setMessages] = useState([
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
  ]);

  const fullUrl = useMemo(() => {
    const base = baseUrl.trim().replace(/\/+$/, '').replace(/\/v1\/chat\/completions\/?$/i, '').replace(/\/v1\/?$/i, '');
    return `${base}/v1/chat/completions`;
  }, [baseUrl]);

  const body = useMemo(() => {
    const b = {
      model: model || 'gpt-4o',
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    };
    const temp = parseFloat(temperature);
    if (!isNaN(temp)) b.temperature = temp;
    const max = parseInt(maxTokens, 10);
    if (!isNaN(max) && max > 0) b.max_tokens = max;
    if (stream) b.stream = true;
    return b;
  }, [model, messages, temperature, maxTokens, stream]);

  const bodyJson = useMemo(() => JSON.stringify(body, null, 2), [body]);

  const generated = useMemo(() => {
    const gen = generators[lang];
    if (!gen) return '';
    return gen({ url: fullUrl, apiKey, body, bodyJson });
  }, [lang, fullUrl, apiKey, body, bodyJson]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generated);
      setCopied(true);
      Toast.success(t('tools.curl.copied'));
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      Toast.error(t('tools.curl.copyFailed'));
    }
  }, [generated, t]);

  const addMessage = () => {
    setMessages((prev) => [...prev, { role: 'user', content: '' }]);
  };
  const removeMessage = (idx) => {
    setMessages((prev) => prev.filter((_, i) => i !== idx));
  };
  const updateMessage = (idx, patch) => {
    setMessages((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  };

  const langTabs = [
    { key: 'curl', label: 'cURL' },
    { key: 'python', label: 'Python' },
    { key: 'node', label: 'Node.js' },
    { key: 'go', label: 'Go' },
  ];

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
            <Terminal size={18} color='#fff' />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {t('tools.curl.title')}
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, maxWidth: 640, margin: 0 }}>
          {t('tools.curl.desc')}
        </p>
      </div>

      {/* Config */}
      <div style={card}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={fieldLabel}><Globe size={12} /> {t('tools.curl.field.url')}</div>
            <Input value={baseUrl} onChange={setBaseUrl} size='large' placeholder='https://api.openai.com' />
          </div>
          <div>
            <div style={fieldLabel}><KeyRound size={12} /> {t('tools.curl.field.apiKey')}</div>
            <Input value={apiKey} onChange={setApiKey} mode='password' size='large' placeholder='sk-...' />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginTop: 16 }}>
          <div>
            <div style={fieldLabel}><Cpu size={12} /> {t('tools.curl.field.model')}</div>
            <Input value={model} onChange={setModel} size='large' placeholder='gpt-4o' />
          </div>
          <div>
            <div style={fieldLabel}>{t('tools.curl.field.temperature')}</div>
            <Input value={temperature} onChange={setTemperature} size='large' placeholder='0.7' />
          </div>
          <div>
            <div style={fieldLabel}>{t('tools.curl.field.maxTokens')}</div>
            <Input value={maxTokens} onChange={setMaxTokens} size='large' placeholder='2048' />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type='checkbox'
              checked={stream}
              onChange={(e) => setStream(e.target.checked)}
              style={{ accentColor: '#0072ff' }}
            />
            {t('tools.curl.field.stream')}
          </label>
        </div>
      </div>

      {/* Messages */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('tools.curl.messagesTitle')}
          </div>
          <Button
            size='small'
            theme='borderless'
            icon={<Plus size={14} />}
            onClick={addMessage}
          >
            {t('tools.curl.addMessage')}
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr 32px',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <Select
                value={m.role}
                onChange={(v) => updateMessage(idx, { role: v })}
                style={{ width: '100%' }}
                optionList={[
                  { label: 'system', value: 'system' },
                  { label: 'user', value: 'user' },
                  { label: 'assistant', value: 'assistant' },
                  { label: 'tool', value: 'tool' },
                ]}
              />
              <TextArea
                value={m.content}
                onChange={(v) => updateMessage(idx, { content: v })}
                placeholder={t('tools.curl.messagePlaceholder')}
                autosize={{ minRows: 2, maxRows: 6 }}
                style={{ borderRadius: 'var(--radius-md)' }}
              />
              <button
                type='button'
                onClick={() => removeMessage(idx)}
                disabled={messages.length <= 1}
                style={{
                  width: 32,
                  height: 32,
                  border: 'none',
                  background: 'transparent',
                  color: messages.length <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                  cursor: messages.length <= 1 ? 'not-allowed' : 'pointer',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={t('tools.curl.removeMessage')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Generated code */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={14} color='var(--accent)' />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              {t('tools.curl.generatedTitle')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {langTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setLang(tab.key)}
                style={{
                  padding: '4px 12px',
                  fontSize: 12,
                  borderRadius: 'var(--radius-sm)',
                  background: lang === tab.key ? 'var(--accent-gradient)' : 'var(--surface-hover)',
                  color: lang === tab.key ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  fontWeight: lang === tab.key ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 120ms ease-out',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            background: 'var(--bg-base)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}
        >
          <pre
            style={{
              margin: 0,
              padding: '16px 52px 16px 16px',
              fontSize: 12,
              lineHeight: 1.55,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxHeight: 420,
              overflow: 'auto',
            }}
          >
            {generated}
          </pre>
          <button
            onClick={copy}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 32,
              height: 32,
              border: '1px solid var(--border-default)',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              color: copied ? '#10b981' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 120ms ease-out',
            }}
            title={t('tools.curl.copy')}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CurlGenerator;
