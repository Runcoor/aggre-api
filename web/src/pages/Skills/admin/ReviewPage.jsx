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

// Admin · AI draft review page. Side-by-side ZH/EN editing with
// per-language publish/unpublish controls.

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, Eye, Save, RefreshCw, Trash2 } from 'lucide-react';
import { API, showError, showSuccess } from '../../../helpers';
import { SKILL_PLAZA_STYLES, SourceBadge, StatusBadge } from '../styles';

const CATEGORY_OPTIONS = [
  '',
  'writing',
  'data',
  'design',
  'devops',
  'research',
  'multimodal',
  'coding',
  'productivity',
];

const SkillsAdminReview = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLang, setActiveLang] = useState('zh-CN');
  const [saving, setSaving] = useState(false);

  // Per-language form state. Initialised from the loaded articles.
  const [editorState, setEditorState] = useState({}); // { [lang]: { title, summary, body } }

  const load = () => {
    setLoading(true);
    API.get(`/api/skill-plaza/admin/skills/${id}`)
      .then((res) => {
        if (res.data?.success) {
          const d = res.data.data;
          setData(d);
          const state = {};
          for (const a of d.articles || []) {
            state[a.language] = {
              title: a.title || '',
              summary: a.summary || '',
              body: a.body || '',
              id: a.id,
              status: a.status,
            };
          }
          setEditorState(state);
        } else showError(res.data?.message);
      })
      .catch((e) => showError(e?.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [id]);

  const skill = data?.skill;
  const tags = data?.tags || [];
  const articles = data?.articles || [];
  const articleForLang = useMemo(
    () => articles.find((a) => a.language === activeLang),
    [articles, activeLang],
  );

  const onSaveArticle = () => {
    const s = editorState[activeLang];
    if (!s?.id) return;
    setSaving(true);
    API.put(`/api/skill-plaza/admin/articles/${s.id}`, {
      title: s.title,
      summary: s.summary,
      body: s.body,
    })
      .then((res) => {
        if (res.data?.success) {
          showSuccess(t('已保存'));
          load();
        } else showError(res.data?.message);
      })
      .catch((e) => showError(e?.message))
      .finally(() => setSaving(false));
  };

  const onPublish = () => {
    const s = editorState[activeLang];
    if (!s?.id) return;
    if (!window.confirm(t('确定发布该语言版本到广场吗?'))) return;
    API.post(`/api/skill-plaza/admin/articles/${s.id}/publish`)
      .then((res) => {
        if (res.data?.success) {
          showSuccess(t('已发布'));
          load();
        } else showError(res.data?.message);
      })
      .catch((e) => showError(e?.message));
  };

  const onUnpublish = () => {
    const s = editorState[activeLang];
    if (!s?.id) return;
    if (!window.confirm(t('确定下架该语言版本吗?用户将看不到这篇教程。')))
      return;
    API.post(`/api/skill-plaza/admin/articles/${s.id}/unpublish`)
      .then((res) => {
        if (res.data?.success) {
          showSuccess(t('已下架'));
          load();
        } else showError(res.data?.message);
      })
      .catch((e) => showError(e?.message));
  };

  const onUpdateMeta = (patch) => {
    API.put(`/api/skill-plaza/admin/skills/${id}`, patch)
      .then((res) => {
        if (res.data?.success) {
          showSuccess(t('已保存'));
          load();
        } else showError(res.data?.message);
      })
      .catch((e) => showError(e?.message));
  };

  if (loading || !data) {
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

  const state = editorState[activeLang] || {
    title: '',
    summary: '',
    body: '',
    status: 'draft',
  };
  const updateField = (field, value) => {
    setEditorState((prev) => ({
      ...prev,
      [activeLang]: { ...(prev[activeLang] || {}), [field]: value },
    }));
  };

  return (
    <>
      <style>{SKILL_PLAZA_STYLES}</style>
      <div className='skp-root'>
        <div className='skp-page'>
          {/* Breadcrumb */}
          <div
            style={{
              marginBottom: 12,
              fontSize: 13,
              color: 'var(--text-muted)',
            }}
          >
            <Link
              to='/skills/admin'
              style={{
                color: 'inherit',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <ArrowLeft size={12} /> {t('返回管理工作台')}
            </Link>
          </div>

          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {t('管理员工作台 / AI 草稿审核')}
              </div>
              <h1 style={{ fontSize: 24, margin: '4px 0 0' }}>
                {t('审核:')} {skill?.name}
                <span style={{ marginLeft: 12 }}>
                  <SourceBadge type={skill?.source_type} />
                </span>
                <span style={{ marginLeft: 6 }}>
                  <StatusBadge status={skill?.status} />
                </span>
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={onSaveArticle}
                disabled={saving}
                className='skp-pill'
                style={{ height: 36, padding: '0 14px' }}
              >
                <Save size={14} /> {saving ? t('保存中...') : t('保存草稿')}
              </button>
              {state.status === 'published' ? (
                <button
                  onClick={onUnpublish}
                  className='skp-pill'
                  style={{
                    height: 36,
                    padding: '0 14px',
                    color: '#dc2626',
                    borderColor: '#fee2e2',
                  }}
                >
                  <Trash2 size={14} /> {t('下架本语言')}
                </button>
              ) : (
                <button
                  onClick={onPublish}
                  style={{
                    height: 36,
                    padding: '0 14px',
                    borderRadius: 999,
                    border: 0,
                    color: '#fff',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg,#0072ff,#00c6ff)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  <Check size={14} /> {t('通过并发布')}
                </button>
              )}
            </div>
          </div>

          {/* Two-column layout — summary on left, editor on right */}
          <div className='skp-review-layout'>
            {/* Left summary */}
            <aside
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div className='skp-side-card'>
                <h4>{t('解析摘要')}</h4>
                <div className='kv'>
                  <span>{t('仓库')}</span>
                  <strong style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {skill?.owner}/{skill?.repo_name}
                  </strong>
                </div>
                <div className='kv'>
                  <span>{t('分支')}</span>
                  <strong>{skill?.branch}</strong>
                </div>
                <div className='kv'>
                  <span>Commit</span>
                  <strong style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {String(skill?.commit_hash || '').slice(0, 12)}
                  </strong>
                </div>
                <div className='kv'>
                  <span>License</span>
                  <strong>{skill?.license || '-'}</strong>
                </div>
              </div>

              <div className='skp-side-card'>
                <h4>{t('文章语言')}</h4>
                {articles.map((a) => (
                  <div key={a.id} className='kv'>
                    <span>{a.language === 'en' ? 'English' : '中文'}</span>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>

              <div className='skp-side-card'>
                <h4>{t('元数据')}</h4>
                <div className='kv'>
                  <span>{t('分类')}</span>
                  <select
                    defaultValue={skill?.category || ''}
                    onChange={(e) => onUpdateMeta({ category: e.target.value })}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      border: '1px solid var(--border-default)',
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                    }}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c || t('未分类')}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      marginBottom: 6,
                    }}
                  >
                    {t('标签(逗号分隔)')}
                  </div>
                  <input
                    defaultValue={tags.join(', ')}
                    onBlur={(e) => {
                      const list = e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      onUpdateMeta({ tags: list });
                    }}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: '1px solid var(--border-default)',
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                    }}
                  />
                </div>
              </div>
            </aside>

            {/* Right editor */}
            <main>
              {/* Language tabs */}
              <div
                style={{
                  display: 'inline-flex',
                  gap: 4,
                  padding: 4,
                  background: 'var(--bg-base)',
                  borderRadius: 10,
                  marginBottom: 14,
                }}
              >
                {['zh-CN', 'en'].map((lng) => (
                  <button
                    key={lng}
                    onClick={() => setActiveLang(lng)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 7,
                      border: 0,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                      background:
                        activeLang === lng ? 'var(--surface)' : 'transparent',
                      color:
                        activeLang === lng
                          ? '#0072ff'
                          : 'var(--text-secondary)',
                      boxShadow:
                        activeLang === lng
                          ? '0 1px 2px rgba(11,17,32,0.04)'
                          : 'none',
                    }}
                  >
                    {lng === 'zh-CN'
                      ? '🇨🇳 ' + t('中文版本')
                      : '🇬🇧 English Version'}
                  </button>
                ))}
              </div>

              {!articleForLang ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    background: 'var(--surface)',
                    border: '1px dashed var(--border-default)',
                    borderRadius: 14,
                  }}
                >
                  {t('该语言版本尚未生成。请回到导入页重新解析。')}
                </div>
              ) : (
                <>
                  <Field label={t('标题')}>
                    <input
                      value={state.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label={t('摘要')}>
                    <textarea
                      rows={2}
                      value={state.summary}
                      onChange={(e) => updateField('summary', e.target.value)}
                      style={{
                        ...inputStyle,
                        height: 'auto',
                        resize: 'vertical',
                        padding: 10,
                      }}
                    />
                  </Field>

                  <Field label={t('正文(Markdown)')}>
                    <div
                      style={{
                        background: 'var(--bg-base)',
                        borderRadius: '10px 10px 0 0',
                        padding: '10px 12px',
                        border: '1px solid var(--border-default)',
                        borderBottom: 0,
                        fontSize: 12,
                        color: 'var(--text-muted)',
                      }}
                    >
                      {t('生成模型:')}{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {articleForLang.generated_by || '-'}
                      </strong>
                      <span style={{ marginLeft: 14 }}>
                        {t('Token:')} {articleForLang.token_input || 0} /{' '}
                        {articleForLang.token_output || 0}
                      </span>
                      <span style={{ float: 'right' }}>
                        {state.body.length} {t('字符')}
                      </span>
                    </div>
                    <textarea
                      value={state.body}
                      onChange={(e) => updateField('body', e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: 420,
                        padding: 18,
                        border: '1px solid var(--border-default)',
                        borderRadius: '0 0 10px 10px',
                        borderTop: 0,
                        fontFamily:
                          'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontSize: 13.5,
                        lineHeight: 1.8,
                        background: 'var(--surface)',
                        color: 'var(--text-primary)',
                        resize: 'vertical',
                        outline: 'none',
                      }}
                    />
                  </Field>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 14,
                      background: 'var(--surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                      {t('人工修订次数:')} {articleForLang.human_revisions || 0}
                      {articleForLang.edited_at > 0 && (
                        <span style={{ marginLeft: 10 }}>
                          · {t('最后编辑')}{' '}
                          {new Date(
                            articleForLang.edited_at * 1000,
                          ).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={onSaveArticle}
                        disabled={saving}
                        className='skp-pill'
                        style={{ height: 36, padding: '0 14px' }}
                      >
                        <Save size={14} /> {t('保存')}
                      </button>
                      {state.status === 'published' ? (
                        <button
                          onClick={onUnpublish}
                          className='skp-pill'
                          style={{
                            height: 36,
                            padding: '0 14px',
                            color: '#dc2626',
                            borderColor: '#fee2e2',
                          }}
                        >
                          <Trash2 size={14} /> {t('下架')}
                        </button>
                      ) : (
                        <button
                          onClick={onPublish}
                          style={{
                            height: 36,
                            padding: '0 14px',
                            borderRadius: 999,
                            border: 0,
                            color: '#fff',
                            cursor: 'pointer',
                            background:
                              'linear-gradient(135deg,#0072ff,#00c6ff)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12.5,
                            fontWeight: 600,
                          }}
                        >
                          <Check size={14} /> {t('通过并发布')}
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </main>
          </div>

          <div style={{ height: 60 }} />
        </div>
      </div>
    </>
  );
};

const inputStyle = {
  width: '100%',
  height: 38,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid var(--border-default)',
  background: 'var(--surface)',
  color: 'var(--text-primary)',
  fontSize: 13.5,
  outline: 'none',
};

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div
      style={{
        fontSize: 12.5,
        color: 'var(--text-secondary)',
        marginBottom: 6,
        fontWeight: 500,
      }}
    >
      {label}
    </div>
    {children}
  </div>
);

export default SkillsAdminReview;
