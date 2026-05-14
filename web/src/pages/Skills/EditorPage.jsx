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

// SKILLS 广场 — 用户编辑器 (P4-2 + P4-4).
//
// One editor for all 6 article types (tutorial / review / showcase /
// troubleshooting / prompts / comparison). Uses a textarea + toolbar +
// react-markdown preview to stay zero-dep — CodeMirror was considered
// but adds ~250KB to the bundle and the V1.1 brief is "good enough to
// write a Markdown post, not a code IDE".
//
// Self-driving behavior:
//   - 30s autosave timer: when dirty, PUTs to /me/articles/:id and pushes
//     a snapshot for the version history.
//   - First save on a new editor session creates the draft and rewrites
//     the URL from /skills/editor → /skills/editor/:id so reloads stick.
//   - Submit runs sensitive-word filter on the server; the response
//     surfaces hits inline in a banner above the editor.

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Save,
  Send,
  History,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Eye,
  EyeOff,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  API,
  showError,
  showSuccess,
  getUserIdFromLocalStorage,
} from '../../helpers';
import { MarkdownRenderer } from '../../components/common/markdown/MarkdownRenderer';
import { SKILL_PLAZA_STYLES } from './styles';

const TYPE_OPTIONS = [
  { id: 'tutorial', name: '教程' },
  { id: 'review', name: '测评' },
  { id: 'showcase', name: '案例分享' },
  { id: 'troubleshooting', name: '问题排查' },
  { id: 'prompts', name: 'Prompt 合集' },
  { id: 'comparison', name: '对比' },
];

const STATUS_META = {
  draft: { label: '草稿', color: '#64748b', bg: '#f1f5f9' },
  pending: { label: '待审核', color: '#a16207', bg: '#fef3c7' },
  approved: { label: '已发布', color: '#15803d', bg: '#dcfce7' },
  rejected: { label: '已驳回', color: '#b91c1c', bg: '#fee2e2' },
  offline: { label: '已下架', color: '#475569', bg: '#e2e8f0' },
};

const AUTOSAVE_INTERVAL_MS = 30000;
const COVER_MAX_BYTES = 180 * 1024; // base64-inlined cover budget
const IMAGE_INLINE_MAX_BYTES = 120 * 1024; // per dropped image

// wrapSelection — insert prefix/suffix around the current textarea
// selection (or at the cursor if empty). Returns the next state {value,
// selStart, selEnd}.
function wrapSelection(value, start, end, prefix, suffix, placeholder = '') {
  const selected = value.slice(start, end);
  const inner = selected || placeholder;
  const next = value.slice(0, start) + prefix + inner + suffix + value.slice(end);
  const cursorStart = start + prefix.length;
  const cursorEnd = cursorStart + inner.length;
  return { value: next, selStart: cursorStart, selEnd: cursorEnd };
}

// insertLinePrefix — toggle line-leading prefix on every selected line.
function insertLinePrefix(value, start, end, prefix) {
  const before = value.slice(0, start);
  const target = value.slice(start, end || start);
  const after = value.slice(end || start);
  const lineStartIdx = before.lastIndexOf('\n') + 1;
  const lines = (before.slice(lineStartIdx) + target).split('\n');
  const transformed = lines.map((l) => prefix + l).join('\n');
  const next = before.slice(0, lineStartIdx) + transformed + after;
  return {
    value: next,
    selStart: lineStartIdx,
    selEnd: lineStartIdx + transformed.length,
  };
}

const EditorPage = () => {
  const { t } = useTranslation();
  const { id: idParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = getUserIdFromLocalStorage();

  // Preset type from ?type= query — used by /skills/showcase/new which
  // routes here with type=showcase, and similar shortcuts.
  const initialType = searchParams.get('type') || 'tutorial';
  const initialSkillId = parseInt(searchParams.get('skill_id') || '0', 10) || 0;

  const [articleId, setArticleId] = useState(
    idParam ? parseInt(idParam, 10) : 0,
  );
  const [status, setStatus] = useState('draft');
  const [type, setType] = useState(initialType);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [skillId, setSkillId] = useState(initialSkillId);
  const [coverImage, setCoverImage] = useState('');

  const [skillsOptions, setSkillsOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [versions, setVersions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sensitiveHits, setSensitiveHits] = useState([]);
  const [rejectReason, setRejectReason] = useState('');

  const textareaRef = useRef(null);
  const fileImgRef = useRef(null);
  const fileCoverRef = useRef(null);

  // Guard: logged-out users get bounced.
  useEffect(() => {
    if (userId <= 0) navigate('/login', { replace: true });
  }, [userId, navigate]);

  // Initial load — fetch the article when editing existing or skip when new.
  useEffect(() => {
    if (!articleId) return;
    setLoading(true);
    API.get(`/api/skill-plaza/me/articles/${articleId}`)
      .then((res) => {
        if (res.data?.success) {
          const a = res.data.data;
          setStatus(a.status || 'draft');
          setType(a.type || 'tutorial');
          setTitle(a.title || '');
          setSummary(a.summary || '');
          setContent(a.content || '');
          setTags((a.tags || []).join(', '));
          setSkillId(a.skill_id || 0);
          setCoverImage(a.cover_image || '');
          setRejectReason(a.reject_reason || '');
          setDirty(false);
          setLastSavedAt(a.updated_at || 0);
        } else {
          showError(res.data?.message || t('加载失败'));
          navigate('/skills/me');
        }
      })
      .catch((e) => {
        showError(e?.message || t('加载失败'));
        navigate('/skills/me');
      })
      .finally(() => setLoading(false));
  }, [articleId, navigate, t]);

  // Load Skill options once (for the optional 关联 Skill dropdown).
  useEffect(() => {
    API.get('/api/skill-plaza/skills', { params: { page_size: 200 } })
      .then((res) => {
        if (res.data?.success) {
          setSkillsOptions(res.data.data?.items || []);
        }
      })
      .catch(() => {});
  }, []);

  // Mark dirty on every editable change.
  const markDirty = useCallback(() => setDirty(true), []);

  // saveOnce — persist current state to backend. When the article hasn't
  // been created yet, POST; otherwise PUT. Returns the article id.
  const saveOnce = useCallback(
    async ({ silent = false, snapshotSource = 'auto' } = {}) => {
      if (saving) return articleId;
      setSaving(true);
      try {
        const tagList = tags
          .split(/[,，\s]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        const payload = {
          type,
          title: title.trim() || '(未命名草稿)',
          summary: summary.trim(),
          content,
          tags: tagList,
          skill_id: skillId || 0,
          cover_image: coverImage,
          language: 'zh-CN',
        };
        let nextId = articleId;
        if (!articleId) {
          const res = await API.post('/api/skill-plaza/user-articles', payload);
          if (!res.data?.success)
            throw new Error(res.data?.message || t('保存失败'));
          nextId = res.data.data?.id;
          setArticleId(nextId);
          setStatus(res.data.data?.status || 'draft');
          // Rewrite URL so refresh keeps editing the same draft.
          window.history.replaceState(null, '', `/skills/editor/${nextId}`);
        } else {
          const res = await API.put(
            `/api/skill-plaza/me/articles/${articleId}`,
            payload,
          );
          if (!res.data?.success)
            throw new Error(res.data?.message || t('保存失败'));
        }
        // Push a snapshot — best-effort, never blocks save.
        if (nextId) {
          API.post(
            `/api/skill-plaza/me/articles/${nextId}/snapshot?source=${snapshotSource}`,
          ).catch(() => {});
        }
        setLastSavedAt(Math.floor(Date.now() / 1000));
        setDirty(false);
        if (!silent) showSuccess(t('已保存草稿'));
        return nextId;
      } catch (e) {
        if (!silent) showError(e?.message || t('保存失败'));
        return articleId;
      } finally {
        setSaving(false);
      }
    },
    [
      saving,
      articleId,
      tags,
      type,
      title,
      summary,
      content,
      skillId,
      coverImage,
      t,
    ],
  );

  // Autosave loop — every 30s, save when dirty.
  useEffect(() => {
    const handle = setInterval(() => {
      if (dirty && !saving && !submitting) {
        saveOnce({ silent: true, snapshotSource: 'auto' }).catch(() => {});
      }
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(handle);
  }, [dirty, saving, submitting, saveOnce]);

  // Warn on close when dirty.
  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Toolbar action — applies a textarea transform and pushes cursor.
  const apply = useCallback(
    (transform) => {
      const el = textareaRef.current;
      if (!el) return;
      const next = transform(content, el.selectionStart, el.selectionEnd);
      setContent(next.value);
      markDirty();
      // Restore selection after React re-renders.
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(next.selStart, next.selEnd);
      });
    },
    [content, markDirty],
  );

  // Image insert — base64 inline. Anything over IMAGE_INLINE_MAX_BYTES
  // gets rejected with a toast.
  const insertImage = useCallback(
    (file) => {
      if (!file) return;
      if (file.size > IMAGE_INLINE_MAX_BYTES) {
        showError(
          t('图片超出 {{n}}KB，请先压缩').replace(
            '{{n}}',
            Math.round(IMAGE_INLINE_MAX_BYTES / 1024),
          ),
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        apply((value, s, _e) => {
          const md = `\n![图片](${dataUrl})\n`;
          return {
            value: value.slice(0, s) + md + value.slice(s),
            selStart: s + md.length,
            selEnd: s + md.length,
          };
        });
      };
      reader.readAsDataURL(file);
    },
    [apply, t],
  );

  const onDropTextarea = useCallback(
    (e) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith('image/')) {
        insertImage(file);
      }
    },
    [insertImage],
  );

  // Cover image — separate slot, also base64 inline.
  const handleCoverPick = useCallback(
    (file) => {
      if (!file) return;
      if (file.size > COVER_MAX_BYTES) {
        showError(
          t('封面图超出 {{n}}KB，请先压缩').replace(
            '{{n}}',
            Math.round(COVER_MAX_BYTES / 1024),
          ),
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImage(e.target.result);
        markDirty();
      };
      reader.readAsDataURL(file);
    },
    [markDirty, t],
  );

  const loadVersions = useCallback(async () => {
    if (!articleId) return;
    try {
      const res = await API.get(
        `/api/skill-plaza/me/articles/${articleId}/versions`,
      );
      if (res.data?.success) setVersions(res.data.data?.items || []);
    } catch (e) {
      /* swallow — opening history is best-effort */
    }
  }, [articleId]);

  const restoreVersion = useCallback(
    async (vid) => {
      if (!articleId) return;
      // eslint-disable-next-line no-restricted-globals
      if (!confirm(t('恢复到这个版本将覆盖当前内容，确定继续吗？'))) return;
      try {
        const res = await API.post(
          `/api/skill-plaza/me/articles/${articleId}/versions/${vid}/restore`,
        );
        if (res.data?.success) {
          const a = res.data.data;
          setTitle(a.title || '');
          setSummary(a.summary || '');
          setContent(a.content || '');
          setTags((a.tags || []).join(', '));
          setDirty(false);
          setLastSavedAt(a.updated_at || 0);
          showSuccess(t('已恢复到该版本'));
          setShowHistory(false);
        } else {
          showError(res.data?.message || t('恢复失败'));
        }
      } catch (e) {
        showError(e?.message || t('恢复失败'));
      }
    },
    [articleId, t],
  );

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !content.trim()) {
      showError(t('标题和正文都不能为空'));
      return;
    }
    setSubmitting(true);
    setSensitiveHits([]);
    try {
      // Always save first so the server has the latest content.
      const id = await saveOnce({ silent: true, snapshotSource: 'manual' });
      if (!id) {
        setSubmitting(false);
        return;
      }
      const res = await API.post(`/api/skill-plaza/me/articles/${id}/submit`);
      if (res.data?.success) {
        showSuccess(t('已提交,等待审核'));
        navigate('/skills/me?tab=articles');
      } else {
        // Sensitive-word block returns success:false + data.sensitive_words.
        const hits = res.data?.data?.sensitive_words;
        if (Array.isArray(hits) && hits.length > 0) {
          setSensitiveHits(hits);
          showError(t('包含敏感词，请修改后重试'));
        } else {
          showError(res.data?.message || t('提交失败'));
        }
      }
    } catch (e) {
      showError(e?.message || t('提交失败'));
    } finally {
      setSubmitting(false);
    }
  }, [title, content, saveOnce, navigate, t]);

  const canEdit =
    !articleId || status === 'draft' || status === 'rejected';
  const statusMeta = STATUS_META[status] || STATUS_META.draft;

  const wordCount = useMemo(
    () => Array.from(content).length,
    [content],
  );
  const byteCount = useMemo(
    () => new Blob([content]).size,
    [content],
  );

  return (
    <>
      <style>{SKILL_PLAZA_STYLES}</style>
      <div className='skp-root'>
        <div className='skp-page' style={{ maxWidth: 1440 }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <Link
                to='/skills/me'
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12.5,
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  marginBottom: 4,
                }}
              >
                <ArrowLeft size={12} /> {t('返回我的中心')}
              </Link>
              <h1 style={{ fontSize: 22, margin: '4px 0 0' }}>
                {articleId ? t('编辑投稿') : t('新建投稿')}
                <span
                  style={{
                    marginLeft: 12,
                    padding: '2px 10px',
                    background: statusMeta.bg,
                    color: statusMeta.color,
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    verticalAlign: 2,
                  }}
                >
                  {t(statusMeta.label)}
                </span>
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {lastSavedAt > 0 && (
                <span
                  style={{ color: 'var(--text-muted)', fontSize: 12 }}
                  title={new Date(lastSavedAt * 1000).toLocaleString()}
                >
                  {dirty
                    ? t('有未保存的修改…')
                    : t('已保存 · {{time}}').replace(
                        '{{time}}',
                        new Date(lastSavedAt * 1000).toLocaleTimeString(),
                      )}
                </span>
              )}
              <button
                className='skp-pill'
                onClick={() => setShowPreview((v) => !v)}
                title={t('切换预览')}
              >
                {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}{' '}
                {showPreview ? t('隐藏预览') : t('显示预览')}
              </button>
              {articleId > 0 && (
                <button
                  className='skp-pill'
                  onClick={() => {
                    if (!showHistory) loadVersions();
                    setShowHistory((v) => !v);
                  }}
                >
                  <History size={12} /> {t('版本历史')}
                </button>
              )}
              <button
                className='skp-pill'
                disabled={saving || !canEdit}
                onClick={() =>
                  saveOnce({ silent: false, snapshotSource: 'manual' })
                }
              >
                <Save size={12} /> {saving ? t('保存中…') : t('保存草稿')}
              </button>
              <button
                className='skp-pill'
                style={{
                  background: 'linear-gradient(135deg,#0072ff,#00c6ff)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                }}
                disabled={submitting || !canEdit}
                onClick={handleSubmit}
              >
                <Send size={12} /> {submitting ? t('提交中…') : t('提交审核')}
              </button>
            </div>
          </div>

          {/* Reject banner */}
          {status === 'rejected' && rejectReason && (
            <div
              style={{
                background: '#fee2e2',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 12,
                fontSize: 13,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>{t('上次审核被驳回:')}</strong> {rejectReason}
                <div style={{ marginTop: 4, fontSize: 12, opacity: 0.85 }}>
                  {t('修改后可重新提交。')}
                </div>
              </div>
            </div>
          )}

          {/* Sensitive-word banner */}
          {sensitiveHits.length > 0 && (
            <div
              style={{
                background: '#fef3c7',
                color: '#a16207',
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 12,
                fontSize: 13,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>{t('检测到敏感词:')}</strong>{' '}
                {sensitiveHits.join('、')}
                <div style={{ marginTop: 4, fontSize: 12, opacity: 0.85 }}>
                  {t('请修改后再提交审核。')}
                </div>
              </div>
            </div>
          )}

          {!canEdit && (
            <div
              style={{
                background: '#e2e8f0',
                color: '#475569',
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 12,
                fontSize: 13,
              }}
            >
              {t(
                '当前状态不可编辑。审核完成后,可联系管理员将文章下线再编辑。',
              )}
            </div>
          )}

          {/* Meta row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <Field label={t('文章类型')}>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  markDirty();
                }}
                disabled={!canEdit}
                style={inputStyle}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {t(o.name)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('关联 Skill (可选)')}>
              <select
                value={skillId}
                onChange={(e) => {
                  setSkillId(parseInt(e.target.value, 10) || 0);
                  markDirty();
                }}
                disabled={!canEdit}
                style={inputStyle}
              >
                <option value={0}>{t('— 不关联 —')}</option>
                {skillsOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('标签 (逗号分隔)')}>
              <input
                type='text'
                value={tags}
                onChange={(e) => {
                  setTags(e.target.value);
                  markDirty();
                }}
                disabled={!canEdit}
                placeholder='claude, prompt, debug'
                style={inputStyle}
              />
            </Field>
            <Field label={t('封面图')}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {coverImage && (
                  <img
                    src={coverImage}
                    alt='cover'
                    style={{
                      width: 56,
                      height: 32,
                      objectFit: 'cover',
                      borderRadius: 4,
                      border: '1px solid var(--border-default)',
                    }}
                  />
                )}
                <button
                  className='skp-pill'
                  disabled={!canEdit}
                  onClick={() => fileCoverRef.current?.click()}
                >
                  <ImageIcon size={12} />{' '}
                  {coverImage ? t('更换') : t('上传')}
                </button>
                {coverImage && (
                  <button
                    className='skp-pill'
                    disabled={!canEdit}
                    onClick={() => {
                      setCoverImage('');
                      markDirty();
                    }}
                    style={{ color: '#b91c1c' }}
                  >
                    {t('移除')}
                  </button>
                )}
                <input
                  ref={fileCoverRef}
                  type='file'
                  accept='image/*'
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    handleCoverPick(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </div>
            </Field>
          </div>

          {/* Title + summary */}
          <Field label={t('标题')}>
            <input
              type='text'
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                markDirty();
              }}
              disabled={!canEdit}
              placeholder={t('一句话讲清楚你要分享什么')}
              maxLength={200}
              style={{ ...inputStyle, fontSize: 16, fontWeight: 600 }}
            />
          </Field>
          <Field label={t('摘要 (展示在卡片上)')}>
            <textarea
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                markDirty();
              }}
              disabled={!canEdit}
              rows={2}
              maxLength={500}
              placeholder={t('一两句话概括,会显示在广场卡片上。')}
              style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
            />
          </Field>

          {/* Toolbar */}
          <Toolbar
            disabled={!canEdit}
            onAction={(action) => {
              if (!canEdit) return;
              apply((val, s, e) => {
                switch (action) {
                  case 'bold':
                    return wrapSelection(val, s, e, '**', '**', t('粗体'));
                  case 'italic':
                    return wrapSelection(val, s, e, '*', '*', t('斜体'));
                  case 'h2':
                    return insertLinePrefix(val, s, e, '## ');
                  case 'h3':
                    return insertLinePrefix(val, s, e, '### ');
                  case 'ul':
                    return insertLinePrefix(val, s, e, '- ');
                  case 'ol':
                    return insertLinePrefix(val, s, e, '1. ');
                  case 'quote':
                    return insertLinePrefix(val, s, e, '> ');
                  case 'code':
                    return wrapSelection(val, s, e, '`', '`', 'code');
                  case 'codeblock':
                    return wrapSelection(
                      val,
                      s,
                      e,
                      '\n```\n',
                      '\n```\n',
                      '// code',
                    );
                  case 'link':
                    return wrapSelection(
                      val,
                      s,
                      e,
                      '[',
                      '](https://)',
                      t('链接文字'),
                    );
                  default:
                    return { value: val, selStart: s, selEnd: e };
                }
              });
            }}
            onImage={() => fileImgRef.current?.click()}
          />
          <input
            ref={fileImgRef}
            type='file'
            accept='image/*'
            style={{ display: 'none' }}
            onChange={(e) => {
              insertImage(e.target.files?.[0]);
              e.target.value = '';
            }}
          />

          {/* Split editor + preview */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                markDirty();
              }}
              onDrop={onDropTextarea}
              onDragOver={(e) => e.preventDefault()}
              disabled={!canEdit}
              rows={26}
              placeholder={t(
                '正文 (Markdown)。可以拖拽图片到此处插入。\n\n## 二级标题\n- 列表\n> 引用',
              )}
              style={{
                ...inputStyle,
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 13.5,
                lineHeight: 1.6,
                resize: 'vertical',
                minHeight: 480,
              }}
            />
            {showPreview && (
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  padding: '16px 20px',
                  minHeight: 480,
                  overflowX: 'auto',
                }}
              >
                {content.trim() ? (
                  <MarkdownRenderer content={content} fontSize={14} />
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {t('预览会在这里展示…')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer stats */}
          <div
            style={{
              marginTop: 10,
              display: 'flex',
              gap: 16,
              color: 'var(--text-muted)',
              fontSize: 12,
            }}
          >
            <span>{t('字数')}: {wordCount}</span>
            <span>{t('字节')}: {Math.round(byteCount / 1024)} KB / 200 KB</span>
            {byteCount > 200 * 1024 && (
              <span style={{ color: '#b91c1c', fontWeight: 600 }}>
                <AlertTriangle size={12} style={{ verticalAlign: -2 }} />{' '}
                {t('超出限制,请精简')}
              </span>
            )}
          </div>

          {/* Version history drawer */}
          {showHistory && (
            <div
              onClick={() => setShowHistory(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.35)',
                zIndex: 50,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: 380,
                  height: '100%',
                  background: 'var(--surface)',
                  borderLeft: '1px solid var(--border-default)',
                  padding: 18,
                  overflowY: 'auto',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 12px',
                    fontSize: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <History size={16} /> {t('版本历史')}
                </h3>
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    marginTop: 0,
                  }}
                >
                  {t(
                    '每次自动保存或手动保存都会生成快照,最近 50 条可回滚。',
                  )}
                </p>
                {versions.length === 0 ? (
                  <div
                    style={{
                      color: 'var(--text-muted)',
                      padding: '40px 0',
                      textAlign: 'center',
                      fontSize: 13,
                    }}
                  >
                    {t('暂无历史版本')}
                  </div>
                ) : (
                  versions.map((v) => (
                    <div
                      key={v.id}
                      style={{
                        padding: '10px 0',
                        borderBottom: '1px solid var(--border-default)',
                        fontSize: 13,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 500 }}>
                            {new Date(v.created_at * 1000).toLocaleString()}
                          </span>
                          <span
                            style={{
                              marginLeft: 8,
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: 'var(--bg-base)',
                              color: 'var(--text-muted)',
                              fontSize: 11,
                            }}
                          >
                            {v.source === 'manual' ? t('手动') : t('自动')}
                          </span>
                        </div>
                        <button
                          className='skp-pill'
                          disabled={!canEdit}
                          onClick={() => restoreVersion(v.id)}
                          title={t('恢复到此版本')}
                        >
                          <RotateCcw size={12} /> {t('恢复')}
                        </button>
                      </div>
                      <div
                        style={{
                          color: 'var(--text-secondary)',
                          marginTop: 4,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {v.title || t('(无标题)')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {loading && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(255,255,255,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 40,
                fontSize: 14,
                color: 'var(--text-secondary)',
              }}
            >
              {t('加载中…')}
            </div>
          )}
          <div style={{ height: 80 }} />
        </div>
      </div>
    </>
  );
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--border-default)',
  background: 'var(--surface)',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
};

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 10 }}>
    <label
      style={{
        display: 'block',
        fontSize: 12,
        color: 'var(--text-muted)',
        marginBottom: 4,
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

const Toolbar = ({ disabled, onAction, onImage }) => {
  const Btn = ({ Icon, k, title }) => (
    <button
      className='skp-pill'
      type='button'
      disabled={disabled}
      onClick={() => onAction(k)}
      title={title}
      style={{ padding: '6px 8px' }}
    >
      <Icon size={14} />
    </button>
  );
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap',
        marginBottom: 8,
        padding: '6px 8px',
        background: 'var(--bg-base)',
        border: '1px solid var(--border-default)',
        borderRadius: 8,
      }}
    >
      <Btn Icon={Bold} k='bold' title='粗体 (Bold)' />
      <Btn Icon={Italic} k='italic' title='斜体 (Italic)' />
      <Btn Icon={Heading2} k='h2' title='H2' />
      <Btn Icon={Heading3} k='h3' title='H3' />
      <Btn Icon={List} k='ul' title='无序列表' />
      <Btn Icon={ListOrdered} k='ol' title='有序列表' />
      <Btn Icon={Quote} k='quote' title='引用' />
      <Btn Icon={Code} k='code' title='行内代码' />
      <Btn Icon={CheckCircle2} k='codeblock' title='代码块' />
      <Btn Icon={LinkIcon} k='link' title='链接' />
      <button
        className='skp-pill'
        type='button'
        disabled={disabled}
        onClick={onImage}
        title='插入图片 (或拖到正文)'
        style={{ padding: '6px 8px' }}
      >
        <ImageIcon size={14} />
      </button>
    </div>
  );
};

export default EditorPage;
