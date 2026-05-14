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

// Detail page — bottom social section (ratings / comments / favorite).
// Split out of Detail.jsx so the file stays readable. The detail page
// passes `slug` + `skillId` + an optional `onFavoriteCountChange` so the
// sidebar count animates together with the bookmark.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Star,
  Bookmark,
  MessageSquare,
  CheckCircle2,
  Send,
  Trash2,
} from 'lucide-react';
import { API, showError, showSuccess, getUserIdFromLocalStorage, isAdmin } from '../../helpers';

// Five-dim radar — pure SVG, 5 axes at 90° / 90°+72° / etc. Each axis is
// drawn at 0..5 scale. The fill polygon is the averaged values; the
// outline rings are at 1/2/3/4/5. Hover labels are out-of-scope here.
function RatingRadar({ values, size = 260, max = 5, color = '#0072ff' }) {
  // values: { usability, practicality, clarity, stability, innovation }
  const labels = [
    { key: 'usability', name: '易用性' },
    { key: 'practicality', name: '实用性' },
    { key: 'clarity', name: '文档清晰度' },
    { key: 'stability', name: '结果稳定性' },
    { key: 'innovation', name: '创新性' },
  ];
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 32; // leave room for labels
  // Start at top (−90°), step clockwise 72°.
  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / labels.length;
  const point = (i, valFrac) => {
    const a = angle(i);
    return [cx + Math.cos(a) * r * valFrac, cy + Math.sin(a) * r * valFrac];
  };
  // Outline rings at 0.2 / 0.4 / 0.6 / 0.8 / 1.0
  const rings = [0.2, 0.4, 0.6, 0.8, 1].map((frac) => {
    const pts = labels.map((_, i) => point(i, frac).join(',')).join(' ');
    return (
      <polygon
        key={frac}
        points={pts}
        fill='none'
        stroke='var(--border-default)'
        strokeWidth={frac === 1 ? 1 : 0.5}
        opacity={frac === 1 ? 1 : 0.6}
      />
    );
  });
  // Spoke lines
  const spokes = labels.map((_, i) => {
    const [x, y] = point(i, 1);
    return (
      <line
        key={i}
        x1={cx}
        y1={cy}
        x2={x}
        y2={y}
        stroke='var(--border-default)'
        strokeWidth={0.5}
        opacity={0.4}
      />
    );
  });
  // Value polygon
  const valFracs = labels.map((l) =>
    Math.max(0, Math.min(1, (values?.[l.key] || 0) / max)),
  );
  const valPoints = valFracs
    .map((f, i) => point(i, f).join(','))
    .join(' ');
  // Labels just outside the outer ring
  const labelNodes = labels.map((l, i) => {
    const a = angle(i);
    const lx = cx + Math.cos(a) * (r + 16);
    const ly = cy + Math.sin(a) * (r + 16);
    return (
      <text
        key={l.key}
        x={lx}
        y={ly}
        textAnchor='middle'
        dominantBaseline='middle'
        fontSize='11.5'
        fill='var(--text-secondary)'
      >
        {l.name}
      </text>
    );
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings}
      {spokes}
      <polygon
        points={valPoints}
        fill={color}
        fillOpacity={0.18}
        stroke={color}
        strokeWidth={1.5}
      />
      {labels.map((l, i) => {
        const f = valFracs[i];
        const [x, y] = point(i, f);
        return <circle key={l.key} cx={x} cy={y} r={3} fill={color} />;
      })}
      {labelNodes}
    </svg>
  );
}

// One row in the 5-dim rating form. The slider is 1–5; "0" means
// "未评分" so we deliberately don't allow it on the form (the
// initial state is 5 unless the user has rated before).
function DimRow({ label, value, onChange }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr 28px',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <div style={{ display: 'inline-flex', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type='button'
            onClick={() => onChange(n)}
            aria-label={`${label} ${n}`}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: '1px solid var(--border-default)',
              background:
                value >= n
                  ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
                  : 'var(--surface)',
              color: value >= n ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Star size={14} fill={value >= n ? '#fff' : 'none'} />
          </button>
        ))}
      </div>
      <strong style={{ textAlign: 'right', fontSize: 13 }}>{value}</strong>
    </div>
  );
}

function RatingForm({ slug, initial, onSubmitted }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    usability: initial?.usability || 5,
    practicality: initial?.practicality || 5,
    clarity: initial?.clarity || 5,
    stability: initial?.stability || 5,
    innovation: initial?.innovation || 5,
    verified_used: !!initial?.verified_used,
    comment: initial?.comment || '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = () => {
    setBusy(true);
    API.post(
      `/api/skill-plaza/skills/${encodeURIComponent(slug)}/rate`,
      form,
    )
      .then((res) => {
        if (res.data?.success) {
          showSuccess(t('评分已提交'));
          onSubmitted?.(res.data.data);
        } else {
          showError(res.data?.message);
        }
      })
      .catch((e) => showError(e?.message))
      .finally(() => setBusy(false));
  };

  return (
    <div
      style={{
        padding: 18,
        background: 'var(--surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
        {initial ? t('更新你的评分') : t('给这个 Skill 打分')}
      </div>
      <DimRow
        label={t('易用性')}
        value={form.usability}
        onChange={(v) => set('usability', v)}
      />
      <DimRow
        label={t('实用性')}
        value={form.practicality}
        onChange={(v) => set('practicality', v)}
      />
      <DimRow
        label={t('文档清晰度')}
        value={form.clarity}
        onChange={(v) => set('clarity', v)}
      />
      <DimRow
        label={t('结果稳定性')}
        value={form.stability}
        onChange={(v) => set('stability', v)}
      />
      <DimRow
        label={t('创新性')}
        value={form.innovation}
        onChange={(v) => set('innovation', v)}
      />
      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          color: 'var(--text-secondary)',
          margin: '8px 0',
          cursor: 'pointer',
        }}
      >
        <input
          type='checkbox'
          checked={form.verified_used}
          onChange={(e) => set('verified_used', e.target.checked)}
        />
        <CheckCircle2 size={14} color='#10b981' />
        {t('我已经使用过这个 Skill')}
      </label>
      <textarea
        value={form.comment}
        onChange={(e) => set('comment', e.target.value)}
        placeholder={t('可选:留下一句使用感受(2000 字以内)')}
        rows={3}
        maxLength={2000}
        style={{
          width: '100%',
          padding: 10,
          borderRadius: 8,
          border: '1px solid var(--border-default)',
          background: 'var(--bg-base)',
          fontSize: 13,
          fontFamily: 'inherit',
          resize: 'vertical',
          marginTop: 6,
        }}
      />
      <div style={{ marginTop: 10, textAlign: 'right' }}>
        <button
          onClick={submit}
          disabled={busy}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            border: 0,
            color: '#fff',
            background: 'linear-gradient(135deg,#0072ff,#00c6ff)',
            cursor: busy ? 'wait' : 'pointer',
            fontSize: 13,
            fontWeight: 600,
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? t('提交中...') : t('提交评分')}
        </button>
      </div>
    </div>
  );
}

function CommentItem({ c, currentUserId, onDeleted }) {
  const { t } = useTranslation();
  const canDelete = c.user_id === currentUserId || isAdmin();
  const remove = () => {
    if (!window.confirm(t('确定删除这条评论?'))) return;
    API.delete(`/api/skill-plaza/comments/${c.id}`)
      .then((res) => {
        if (res.data?.success) onDeleted?.(c.id);
        else showError(res.data?.message);
      })
      .catch((e) => showError(e?.message));
  };
  return (
    <div
      style={{
        padding: 14,
        background: 'var(--surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 10,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#0072ff,#00c6ff)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {c.user_avatar || '?'}
        </div>
        <strong style={{ fontSize: 13 }}>{c.user_name || `User ${c.user_id}`}</strong>
        <span
          style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 'auto' }}
        >
          {new Date((c.created_at || 0) * 1000).toLocaleString()}
        </span>
        {canDelete && (
          <button
            onClick={remove}
            title={t('删除')}
            style={{
              background: 'transparent',
              border: 0,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 4,
            }}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
      <div
        style={{
          fontSize: 14,
          color: 'var(--text-primary)',
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
        }}
      >
        {c.content}
      </div>
    </div>
  );
}

function CommentForm({ slug, onPosted }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = () => {
    const content = text.trim();
    if (!content) return;
    setBusy(true);
    API.post(`/api/skill-plaza/skills/${encodeURIComponent(slug)}/comments`, {
      content,
    })
      .then((res) => {
        if (res.data?.success) {
          setText('');
          onPosted?.(res.data.data);
        } else {
          showError(res.data?.message);
        }
      })
      .catch((e) => showError(e?.message))
      .finally(() => setBusy(false));
  };
  return (
    <div
      style={{
        padding: 14,
        background: 'var(--surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 10,
        marginBottom: 14,
      }}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('分享你的使用心得、问题或者吐槽... (2000 字以内)')}
        rows={3}
        maxLength={2000}
        style={{
          width: '100%',
          padding: 10,
          borderRadius: 8,
          border: '1px solid var(--border-default)',
          background: 'var(--bg-base)',
          fontSize: 13.5,
          fontFamily: 'inherit',
          resize: 'vertical',
        }}
      />
      <div
        style={{
          marginTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          {text.length}/2000
        </span>
        <button
          onClick={submit}
          disabled={busy || !text.trim()}
          style={{
            padding: '7px 16px',
            borderRadius: 8,
            border: 0,
            color: '#fff',
            background:
              busy || !text.trim()
                ? 'var(--text-muted)'
                : 'linear-gradient(135deg,#0072ff,#00c6ff)',
            cursor: busy || !text.trim() ? 'not-allowed' : 'pointer',
            fontSize: 13,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Send size={13} /> {busy ? t('提交中...') : t('发表评论')}
        </button>
      </div>
    </div>
  );
}

// Main exported section. Loads ratings + comments lazily after the
// article is rendered so the page first-paint isn't blocked.
export default function DetailSocial({ slug, onSkillRefreshed }) {
  const { t } = useTranslation();
  const userId = getUserIdFromLocalStorage();
  const loggedIn = userId > 0;
  const [tab, setTab] = useState('rating'); // 'rating' | 'comments'

  const [summary, setSummary] = useState(null); // { average, count, usability, ..., my_rating }
  const [comments, setComments] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);

  const loadSummary = () => {
    setLoadingSummary(true);
    API.get(
      `/api/skill-plaza/skills/${encodeURIComponent(slug)}/ratings`,
    )
      .then((res) => {
        if (res.data?.success) setSummary(res.data.data);
      })
      .catch(() => {})
      .finally(() => setLoadingSummary(false));
  };
  const loadComments = () => {
    setLoadingComments(true);
    API.get(
      `/api/skill-plaza/skills/${encodeURIComponent(slug)}/comments?limit=100`,
    )
      .then((res) => {
        if (res.data?.success) setComments(res.data.data?.items || []);
      })
      .catch(() => {})
      .finally(() => setLoadingComments(false));
  };

  useEffect(() => {
    loadSummary();
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const onRatingSubmitted = (data) => {
    // refresh summary + parent skill aggregates
    loadSummary();
    if (data?.skill) onSkillRefreshed?.(data.skill);
  };
  const onCommentPosted = (newComment) => {
    setComments((prev) => [newComment, ...prev]);
    // parent comment_count is on Skill — re-fetch detail to keep sidebar fresh
    onSkillRefreshed?.(null);
  };
  const onCommentDeleted = (id) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    onSkillRefreshed?.(null);
  };

  return (
    <div
      style={{
        marginTop: 40,
        paddingTop: 24,
        borderTop: '1px solid var(--border-default)',
      }}
    >
      {/* Tab strip */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          borderBottom: '1px solid var(--border-default)',
          marginBottom: 18,
        }}
      >
        {[
          {
            id: 'rating',
            label: `${t('评分')} (${summary?.count || 0})`,
          },
          {
            id: 'comments',
            label: `${t('评论')} (${comments.length})`,
          },
        ].map((t2) => (
          <button
            key={t2.id}
            onClick={() => setTab(t2.id)}
            style={{
              padding: '10px 14px',
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: tab === t2.id ? 600 : 500,
              color: tab === t2.id ? '#0072ff' : 'var(--text-secondary)',
              borderBottom:
                tab === t2.id ? '2px solid #0072ff' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t2.label}
          </button>
        ))}
      </div>

      {tab === 'rating' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {/* Radar + average */}
          <div
            style={{
              padding: 18,
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 8,
              }}
            >
              <strong style={{ fontSize: 14 }}>{t('多维评分')}</strong>
              <span
                style={{ color: 'var(--text-muted)', fontSize: 12 }}
              >
                {summary?.count || 0} {t('人评分')}
              </span>
            </div>
            <RatingRadar
              values={{
                usability: summary?.usability || 0,
                practicality: summary?.practicality || 0,
                clarity: summary?.clarity || 0,
                stability: summary?.stability || 0,
                innovation: summary?.innovation || 0,
              }}
            />
            <div
              style={{
                marginTop: 4,
                display: 'inline-flex',
                gap: 6,
                alignItems: 'center',
              }}
            >
              <Star size={18} color='#f59e0b' fill='#f59e0b' />
              <span style={{ fontSize: 22, fontWeight: 700 }}>
                {(summary?.average || 0).toFixed(1)}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                / 5.0
              </span>
            </div>
          </div>

          {/* Rating form */}
          <div>
            {loadingSummary ? (
              <div
                style={{
                  padding: 30,
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                }}
              >
                {t('加载中...')}
              </div>
            ) : loggedIn ? (
              <RatingForm
                slug={slug}
                initial={summary?.my_rating}
                onSubmitted={onRatingSubmitted}
              />
            ) : (
              <LoginPrompt
                message={t('登录后即可给这个 Skill 打分')}
              />
            )}
          </div>
        </div>
      )}

      {tab === 'comments' && (
        <div>
          {loggedIn ? (
            <CommentForm slug={slug} onPosted={onCommentPosted} />
          ) : (
            <LoginPrompt message={t('登录后即可发表评论')} />
          )}
          {loadingComments ? (
            <div
              style={{
                padding: 30,
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 13,
              }}
            >
              {t('加载中...')}
            </div>
          ) : comments.length === 0 ? (
            <div
              style={{
                padding: 30,
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 13,
                border: '1px dashed var(--border-default)',
                borderRadius: 10,
              }}
            >
              <MessageSquare
                size={18}
                style={{ opacity: 0.5, marginBottom: 6 }}
              />
              <div>{t('还没有评论。来抢沙发吧。')}</div>
            </div>
          ) : (
            comments.map((c) => (
              <CommentItem
                key={c.id}
                c={c}
                currentUserId={userId}
                onDeleted={onCommentDeleted}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// FavoriteButton — used by the sidebar. Toggles favorite state on click,
// shows the count, falls back to a login prompt on auth failures.
export function FavoriteButton({ slug, onCountChange }) {
  const { t } = useTranslation();
  const userId = getUserIdFromLocalStorage();
  const loggedIn = userId > 0;
  const [favored, setFavored] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loggedIn) return;
    API.get(
      `/api/skill-plaza/skills/${encodeURIComponent(slug)}/favorite-state`,
    )
      .then((res) => {
        if (res.data?.success) setFavored(!!res.data.data?.favored);
      })
      .catch(() => {});
  }, [slug, loggedIn]);

  const toggle = () => {
    if (!loggedIn) {
      showError(t('请先登录'));
      return;
    }
    setBusy(true);
    API.post(
      `/api/skill-plaza/skills/${encodeURIComponent(slug)}/favorite-toggle`,
    )
      .then((res) => {
        if (res.data?.success) {
          setFavored(!!res.data.data?.favored);
          if (typeof res.data.data?.favorite_count === 'number') {
            onCountChange?.(res.data.data.favorite_count);
          }
        } else {
          showError(res.data?.message);
        }
      })
      .catch((e) => showError(e?.message))
      .finally(() => setBusy(false));
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className='skp-pill'
      style={{
        borderColor: favored ? '#0072ff' : 'var(--border-default)',
        color: favored ? '#0072ff' : 'var(--text-secondary)',
        background: favored ? 'rgba(0,114,255,0.06)' : 'transparent',
        cursor: busy ? 'wait' : 'pointer',
      }}
    >
      <Bookmark
        size={12}
        fill={favored ? '#0072ff' : 'none'}
      />
      {favored ? t('已收藏') : t('收藏')}
    </button>
  );
}

function LoginPrompt({ message }) {
  const { t } = useTranslation();
  return (
    <div
      style={{
        padding: 24,
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: 13,
        background: 'var(--bg-base)',
        border: '1px dashed var(--border-default)',
        borderRadius: 10,
      }}
    >
      <div style={{ marginBottom: 8 }}>{message}</div>
      <Link
        to='/login'
        style={{
          display: 'inline-block',
          padding: '7px 16px',
          borderRadius: 8,
          color: '#fff',
          background: 'linear-gradient(135deg,#0072ff,#00c6ff)',
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        {t('去登录')}
      </Link>
    </div>
  );
}
