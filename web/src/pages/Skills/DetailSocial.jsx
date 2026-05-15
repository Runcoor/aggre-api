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

// Detail page — bottom social section (ratings + comments + favorite).
//
// Visual structure follows the design bundle's `page-detail.jsx` —
// stacked sections instead of tabs, radar + dimension breakdown card,
// J-shaped 5-star distribution, modern comment list with one-level
// reply threading.
//
// State + API wiring is unchanged from the prior tab-based version;
// only the layout and styling were rewritten.

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Star,
  Bookmark,
  MessageSquare,
  CheckCircle2,
  Send,
  Trash2,
  Heart,
  Reply,
  Flag,
  X as XIcon,
  Edit3,
} from 'lucide-react';
import {
  API,
  showError,
  showSuccess,
  getUserIdFromLocalStorage,
  isAdmin,
} from '../../helpers';

// Five-dim radar — pure SVG, 5 axes at 72° intervals. Outline rings at
// 0.2/0.4/0.6/0.8/1.0; fill polygon at the current values.
function RatingRadar({ values, size = 220, max = 5, color = '#0072ff' }) {
  const { t } = useTranslation();
  const labels = [
    { key: 'usability', name: t('易用性') },
    { key: 'practicality', name: t('实用性') },
    { key: 'clarity', name: t('文档清晰度') },
    { key: 'stability', name: t('结果稳定性') },
    { key: 'innovation', name: t('创新性') },
  ];
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 34;
  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / labels.length;
  const point = (i, valFrac) => {
    const a = angle(i);
    return [cx + Math.cos(a) * r * valFrac, cy + Math.sin(a) * r * valFrac];
  };
  const rings = [0.2, 0.4, 0.6, 0.8, 1].map((frac) => {
    const pts = labels.map((_, i) => point(i, frac).join(',')).join(' ');
    return (
      <polygon
        key={frac}
        points={pts}
        fill='none'
        stroke='var(--border-default)'
        strokeWidth={frac === 1 ? 1 : 0.5}
        opacity={frac === 1 ? 1 : 0.55}
      />
    );
  });
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
  const valFracs = labels.map((l) =>
    Math.max(0, Math.min(1, (values?.[l.key] || 0) / max)),
  );
  const valPoints = valFracs.map((f, i) => point(i, f).join(',')).join(' ');
  const labelNodes = labels.map((l, i) => {
    const a = angle(i);
    const lx = cx + Math.cos(a) * (r + 18);
    const ly = cy + Math.sin(a) * (r + 18);
    return (
      <text
        key={l.key}
        x={lx}
        y={ly}
        textAnchor='middle'
        dominantBaseline='middle'
        fontSize='11'
        fill='var(--text-secondary)'
        fontWeight='500'
      >
        {l.name}
      </text>
    );
  });
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flexShrink: 0 }}
    >
      {rings}
      {spokes}
      <polygon
        points={valPoints}
        fill={color}
        fillOpacity={0.16}
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

// Static star row (display only).
function StaticStars({ value = 0, size = 14, max = 5 }) {
  return (
    <span className='skp-rating-stars' aria-label={`${value}/${max}`}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i + 1 <= Math.round(value);
        return (
          <Star
            key={i}
            size={size}
            color={filled ? '#f59e0b' : 'var(--border-default)'}
            fill={filled ? '#f59e0b' : 'none'}
          />
        );
      })}
    </span>
  );
}

// Interactive 5-star picker — one row of the rate form.
function RateCell({ label, value, onChange }) {
  return (
    <div className='skp-rate-cell'>
      <div className='skp-rate-label'>{label}</div>
      <div className='skp-rate-stars'>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type='button'
            onClick={() => onChange(n)}
            className={value >= n ? 'on' : ''}
            aria-label={`${label} ${n}`}
          >
            <Star size={14} fill={value >= n ? '#fff' : 'none'} />
          </button>
        ))}
      </div>
    </div>
  );
}

function RatingDrawer({ slug, initial, onSubmitted, onCancel }) {
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
    API.post(`/api/skill-plaza/skills/${encodeURIComponent(slug)}/rate`, form)
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
    <div className='skp-rate-drawer'>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <strong style={{ fontSize: 14.5, color: 'var(--text-primary)' }}>
          {initial ? t('更新你的评分') : t('填写你的评分')}
        </strong>
        {onCancel && (
          <button
            onClick={onCancel}
            aria-label={t('取消')}
            style={{
              background: 'transparent',
              border: 0,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
            }}
          >
            <XIcon size={16} />
          </button>
        )}
      </div>

      <div className='skp-rate-grid'>
        <RateCell
          label={t('易用性')}
          value={form.usability}
          onChange={(v) => set('usability', v)}
        />
        <RateCell
          label={t('实用性')}
          value={form.practicality}
          onChange={(v) => set('practicality', v)}
        />
        <RateCell
          label={t('文档清晰度')}
          value={form.clarity}
          onChange={(v) => set('clarity', v)}
        />
        <RateCell
          label={t('结果稳定性')}
          value={form.stability}
          onChange={(v) => set('stability', v)}
        />
        <RateCell
          label={t('创新性')}
          value={form.innovation}
          onChange={(v) => set('innovation', v)}
        />
      </div>

      <textarea
        value={form.comment}
        onChange={(e) => set('comment', e.target.value)}
        placeholder={t('说说你的使用体验、踩坑和建议(可选,2000 字以内)')}
        rows={3}
        maxLength={2000}
        className='skp-comment-textarea'
        style={{ marginBottom: 12 }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <input
            type='checkbox'
            checked={form.verified_used}
            onChange={(e) => set('verified_used', e.target.checked)}
            style={{ accentColor: '#0072ff' }}
          />
          <CheckCircle2 size={14} color='#16a34a' />
          {t('我已经使用过这个 Skill (将获得「已使用」标识)')}
        </label>
        <div style={{ display: 'inline-flex', gap: 8 }}>
          {onCancel && (
            <button className='skp-rate-cta ghost' onClick={onCancel}>
              {t('取消')}
            </button>
          )}
          <button
            className='skp-submit-btn'
            onClick={submit}
            disabled={busy}
            style={busy ? { opacity: 0.7, cursor: 'wait' } : undefined}
          >
            <Send size={13} />
            {busy ? t('提交中...') : t('提交评分')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Single comment — handles its own optimistic like state.
function CommentItem({
  c,
  replies,
  currentUserId,
  loggedIn,
  onDeleted,
  onReply,
  onLikeChanged,
  isReply,
}) {
  const { t } = useTranslation();
  const canDelete = c.user_id === currentUserId || isAdmin();
  const [liked, setLiked] = useState(!!c.liked_by_me);
  const [likeCount, setLikeCount] = useState(c.like_count || 0);
  const [busyLike, setBusyLike] = useState(false);

  useEffect(() => {
    setLiked(!!c.liked_by_me);
    setLikeCount(c.like_count || 0);
  }, [c.liked_by_me, c.like_count]);

  const remove = () => {
    if (!window.confirm(t('确定删除这条评论?'))) return;
    API.delete(`/api/skill-plaza/comments/${c.id}`)
      .then((res) => {
        if (res.data?.success) onDeleted?.(c.id);
        else showError(res.data?.message);
      })
      .catch((e) => showError(e?.message));
  };

  const toggleLike = () => {
    if (!loggedIn) {
      showError(t('登录后即可点赞'));
      return;
    }
    if (busyLike) return;
    const nextLiked = !liked;
    const nextCount = likeCount + (nextLiked ? 1 : -1);
    setLiked(nextLiked);
    setLikeCount(Math.max(0, nextCount));
    setBusyLike(true);
    API.post(`/api/skill-plaza/comments/${c.id}/like`)
      .then((res) => {
        if (res.data?.success) {
          const { liked: serverLiked, like_count } = res.data.data || {};
          setLiked(!!serverLiked);
          setLikeCount(like_count || 0);
          onLikeChanged?.(c.id, !!serverLiked, like_count || 0);
        } else {
          setLiked(!nextLiked);
          setLikeCount(likeCount);
          showError(res.data?.message);
        }
      })
      .catch((e) => {
        setLiked(!nextLiked);
        setLikeCount(likeCount);
        showError(e?.message);
      })
      .finally(() => setBusyLike(false));
  };

  const report = () => {
    const reason = window.prompt(
      t('请说明举报原因 (可选,1000 字以内):'),
      '',
    );
    if (reason === null) return;
    API.post('/api/skill-plaza/reports', {
      target_type: 'comment',
      target_id: c.id,
      reason: reason || '',
    })
      .then((res) => {
        if (res.data?.success) {
          showSuccess(t('已提交举报,管理员会尽快处理'));
        } else {
          showError(res.data?.message);
        }
      })
      .catch((e) => showError(e?.message));
  };

  const displayName = c.user_name || `User ${c.user_id}`;
  const avatarLetter = (c.user_avatar || displayName.charAt(0) || '?')
    .toString()
    .charAt(0)
    .toUpperCase();

  return (
    <div className={'skp-comment' + (isReply ? ' is-reply' : '')}>
      <div className='skp-comment-avatar' aria-hidden='true'>
        {avatarLetter}
      </div>
      <div className='skp-comment-body'>
        <div className='skp-comment-head'>
          <span className='name'>{displayName}</span>
          {c.verified_used && (
            <span className='skp-verified-pill'>
              <CheckCircle2 size={10} />
              {t('已使用')}
            </span>
          )}
          {typeof c.rating === 'number' && c.rating > 0 && (
            <StaticStars value={c.rating} size={11} />
          )}
          <span className='skp-comment-time'>
            {new Date((c.created_at || 0) * 1000).toLocaleString()}
          </span>
        </div>
        <div className='skp-comment-text'>{c.content}</div>
        <div className='skp-comment-actions'>
          <button
            className={'skp-comment-action' + (liked ? ' liked' : '')}
            onClick={toggleLike}
            disabled={busyLike}
            title={liked ? t('取消点赞') : t('点赞')}
          >
            <Heart
              size={13}
              fill={liked ? '#e0245e' : 'none'}
              strokeWidth={liked ? 0 : 2}
            />
            <span>{likeCount > 0 ? likeCount : t('赞')}</span>
          </button>
          {!isReply && (
            <button
              className='skp-comment-action'
              onClick={() => onReply?.(c)}
              title={t('回复')}
            >
              <Reply size={13} />
              <span>{t('回复')}</span>
            </button>
          )}
          {loggedIn && c.user_id !== currentUserId && (
            <button
              className='skp-comment-action'
              onClick={report}
              title={t('举报')}
            >
              <Flag size={12} />
            </button>
          )}
          {canDelete && (
            <button
              className='skp-comment-action danger'
              onClick={remove}
              title={t('删除')}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>

        {!isReply && replies && replies.length > 0 && (
          <div className='skp-comment-replies'>
            {replies.map((r) => (
              <CommentItem
                key={r.id}
                c={r}
                currentUserId={currentUserId}
                loggedIn={loggedIn}
                onDeleted={onDeleted}
                onLikeChanged={onLikeChanged}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentForm({ slug, replyTo, onCancelReply, onPosted }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [sensitiveHits, setSensitiveHits] = useState([]);
  useEffect(() => {
    setText('');
    setSensitiveHits([]);
  }, [replyTo?.id]);
  const submit = () => {
    const content = text.trim();
    if (!content) return;
    setBusy(true);
    setSensitiveHits([]);
    const payload = { content };
    if (replyTo?.id) payload.parent_id = replyTo.id;
    API.post(
      `/api/skill-plaza/skills/${encodeURIComponent(slug)}/comments`,
      payload,
    )
      .then((res) => {
        if (res.data?.success) {
          setText('');
          onPosted?.(res.data.data);
        } else {
          const hits = res.data?.data?.sensitive_words;
          if (Array.isArray(hits) && hits.length > 0) {
            setSensitiveHits(hits);
          }
          showError(res.data?.message);
        }
      })
      .catch((e) => showError(e?.message))
      .finally(() => setBusy(false));
  };

  return (
    <div className={'skp-comment-form' + (replyTo ? ' replying' : '')}>
      {replyTo && (
        <span className='skp-reply-chip'>
          <Reply size={11} />
          {t('回复 @')}
          {replyTo.user_name || `User ${replyTo.user_id}`}
          <button onClick={onCancelReply} title={t('取消回复')}>
            <XIcon size={12} />
          </button>
        </span>
      )}
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (sensitiveHits.length > 0) setSensitiveHits([]);
        }}
        placeholder={
          replyTo
            ? t('回复 @{{name}}...', {
                name: replyTo.user_name || `User ${replyTo.user_id}`,
              })
            : t('分享你的使用心得、问题或者吐槽... (2000 字以内)')
        }
        rows={3}
        maxLength={2000}
        className={
          'skp-comment-textarea' +
          (sensitiveHits.length > 0 ? ' error' : '')
        }
      />
      {sensitiveHits.length > 0 && (
        <div className='skp-sensitive-warn'>
          {t('包含敏感词:{{words}},请修改后重试。', {
            words: sensitiveHits.join('、'),
          })}
        </div>
      )}
      <div className='skp-comment-form-actions'>
        <span className='skp-char-count'>{text.length}/2000</span>
        <button
          className='skp-submit-btn'
          onClick={submit}
          disabled={busy || !text.trim()}
        >
          <Send size={13} />
          {busy
            ? t('提交中...')
            : replyTo
              ? t('发表回复')
              : t('发表评论')}
        </button>
      </div>
    </div>
  );
}

// Main export — drives the bottom-of-detail social UI.
export default function DetailSocial({ slug, onSkillRefreshed }) {
  const { t } = useTranslation();
  const userId = getUserIdFromLocalStorage();
  const loggedIn = userId > 0;

  const [summary, setSummary] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [showRateForm, setShowRateForm] = useState(false);
  // 'recent' | 'popular' | 'verified-only'
  const [sortMode, setSortMode] = useState('recent');

  const loadSummary = () => {
    setLoadingSummary(true);
    API.get(`/api/skill-plaza/skills/${encodeURIComponent(slug)}/ratings`)
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

  // Build one-level tree + apply sort/filter.
  const commentTree = useMemo(() => {
    const replies = {};
    let tops = [];
    for (const c of comments) {
      if (c.parent_id && c.parent_id > 0) {
        if (!replies[c.parent_id]) replies[c.parent_id] = [];
        replies[c.parent_id].push(c);
      } else {
        tops.push(c);
      }
    }
    if (sortMode === 'verified-only') {
      tops = tops.filter((c) => c.verified_used);
    }
    if (sortMode === 'popular') {
      tops.sort(
        (a, b) =>
          (b.like_count || 0) - (a.like_count || 0) ||
          (b.created_at || 0) - (a.created_at || 0),
      );
    } else {
      tops.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    }
    Object.values(replies).forEach((arr) =>
      arr.sort((a, b) => (a.created_at || 0) - (b.created_at || 0)),
    );
    return { tops, replies };
  }, [comments, sortMode]);

  const onRatingSubmitted = (data) => {
    loadSummary();
    setShowRateForm(false);
    if (data?.skill) onSkillRefreshed?.(data.skill);
  };
  const onCommentPosted = (newComment) => {
    setComments((prev) => [newComment, ...prev]);
    setReplyTo(null);
    onSkillRefreshed?.(null);
  };
  const onCommentDeleted = (id) => {
    setComments((prev) =>
      prev.filter((c) => c.id !== id && c.parent_id !== id),
    );
    if (replyTo?.id === id) setReplyTo(null);
    onSkillRefreshed?.(null);
  };
  const onCommentLikeChanged = (id, liked, count) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, liked_by_me: liked, like_count: count } : c,
      ),
    );
  };

  // Build the 5/4/3/2/1 distribution. Backend may return summary.distribution
  // as {5: n, 4: n, ...}; fall back to all-zeros if absent so the UI is still
  // structurally complete.
  const distribution = useMemo(() => {
    const out = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const src = summary?.distribution;
    if (src && typeof src === 'object') {
      for (let k = 1; k <= 5; k++) out[k] = Number(src[k] || src[String(k)] || 0);
    }
    return out;
  }, [summary]);
  const totalRatings = useMemo(
    () => Object.values(distribution).reduce((a, b) => a + b, 0),
    [distribution],
  );
  const ratingCount = summary?.count || totalRatings || 0;
  const ratingAverage = summary?.average || 0;

  // Dim breakdown rows — labels + short descriptions per design spec.
  const dimRows = [
    {
      key: 'usability',
      label: t('易用性'),
      desc: t('安装、上手、文档查阅的整体顺滑度'),
    },
    {
      key: 'practicality',
      label: t('实用性'),
      desc: t('是否能解决真实工作中的问题'),
    },
    {
      key: 'clarity',
      label: t('文档清晰度'),
      desc: t('README / SKILL.md 的完整与可读性'),
    },
    {
      key: 'stability',
      label: t('结果稳定性'),
      desc: t('相同输入产出的可重现程度'),
    },
    {
      key: 'innovation',
      label: t('创新性'),
      desc: t('解决问题的方法是否有亮点'),
    },
  ];

  return (
    <div className='skp-social'>
      {/* ──────────── Multi-dim ratings ──────────── */}
      <section className='skp-social-section'>
        <div className='skp-section-h'>
          <div>
            <h2 className='skp-section-title'>{t('多维度评分')}</h2>
            <p className='skp-section-sub'>
              {ratingCount > 0
                ? t('由 {{n}} 位用户基于真实使用经验提供', {
                    n: ratingCount,
                  })
                : t('还没有人评分,来当第一个吧')}
            </p>
          </div>
          <div className='skp-section-tools'>
            {loggedIn ? (
              <button
                className='skp-rate-cta'
                onClick={() => setShowRateForm((v) => !v)}
              >
                <Edit3 size={13} />
                {summary?.my_rating
                  ? t('更新评分')
                  : showRateForm
                    ? t('收起表单')
                    : t('我要评分')}
              </button>
            ) : (
              <Link to='/login' className='skp-rate-cta'>
                <Edit3 size={13} />
                {t('登录后评分')}
              </Link>
            )}
          </div>
        </div>

        {loadingSummary ? (
          <div className='skp-empty-state'>{t('加载中...')}</div>
        ) : (
          <div className='skp-rating-card'>
            {/* Left: big average + 5-star distribution */}
            <div className='skp-rating-summary'>
              <div className='skp-rating-big'>
                <span className='num'>{ratingAverage.toFixed(1)}</span>
                <span className='max'>/ 5.0</span>
              </div>
              <StaticStars value={ratingAverage} size={16} />
              <div className='skp-rating-count'>
                {ratingCount > 0
                  ? t('共 {{n}} 人评分', { n: ratingCount })
                  : t('暂无评分')}
              </div>
              <div className='skp-rating-dist'>
                {[5, 4, 3, 2, 1].map((star) => {
                  const n = distribution[star] || 0;
                  const pct =
                    totalRatings > 0 ? (n / totalRatings) * 100 : 0;
                  return (
                    <div key={star} className='skp-dist-row'>
                      <span className='star-label'>
                        {star}
                        <Star size={10} color='#f59e0b' fill='#f59e0b' />
                      </span>
                      <span
                        className='skp-dist-bar'
                        role='progressbar'
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <span
                          className='skp-dist-fill'
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className='skp-dist-count'>{n}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: radar + 5-dim breakdown */}
            <div className='skp-rating-radar-row'>
              <RatingRadar
                values={{
                  usability: summary?.usability || 0,
                  practicality: summary?.practicality || 0,
                  clarity: summary?.clarity || 0,
                  stability: summary?.stability || 0,
                  innovation: summary?.innovation || 0,
                }}
              />
              <div className='skp-dim-list'>
                {dimRows.map((row) => {
                  const v = Number(summary?.[row.key] || 0);
                  const pct = Math.max(0, Math.min(100, (v / 5) * 100));
                  return (
                    <div key={row.key} className='skp-dim-row'>
                      <div style={{ minWidth: 0 }}>
                        <div className='label'>{row.label}</div>
                        <div className='desc'>{row.desc}</div>
                      </div>
                      <span
                        className='skp-dim-bar'
                        role='progressbar'
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <span
                          className='skp-dim-fill'
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className='score'>
                        <Star
                          size={12}
                          color='#f59e0b'
                          fill='#f59e0b'
                        />
                        {v.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {showRateForm && loggedIn && (
          <RatingDrawer
            slug={slug}
            initial={summary?.my_rating}
            onSubmitted={onRatingSubmitted}
            onCancel={() => setShowRateForm(false)}
          />
        )}
      </section>

      {/* ──────────── Comments ──────────── */}
      <section className='skp-social-section'>
        <div className='skp-section-h'>
          <div>
            <h2 className='skp-section-title'>
              {t('评论')} · {comments.length}
            </h2>
            <p className='skp-section-sub'>
              {t('讨论使用体验、踩坑和建议')}
            </p>
          </div>
          <div className='skp-section-tools'>
            <button
              className={
                'skp-sort-pill' + (sortMode === 'recent' ? ' active' : '')
              }
              onClick={() => setSortMode('recent')}
            >
              {t('按时间')}
            </button>
            <button
              className={
                'skp-sort-pill' + (sortMode === 'popular' ? ' active' : '')
              }
              onClick={() => setSortMode('popular')}
            >
              {t('按热度')}
            </button>
            <button
              className={
                'skp-sort-pill' +
                (sortMode === 'verified-only' ? ' active' : '')
              }
              onClick={() => setSortMode('verified-only')}
            >
              {t('只看已使用')}
            </button>
          </div>
        </div>

        {loggedIn ? (
          <CommentForm
            slug={slug}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            onPosted={onCommentPosted}
          />
        ) : (
          <div className='skp-login-prompt'>
            <div className='skp-login-prompt-text'>
              {t('登录后即可发表评论')}
            </div>
            <Link to='/login' className='skp-submit-btn'>
              {t('去登录')}
            </Link>
          </div>
        )}

        {loadingComments ? (
          <div className='skp-empty-state'>{t('加载中...')}</div>
        ) : commentTree.tops.length === 0 ? (
          <div className='skp-empty-state'>
            <MessageSquare size={20} className='icon' />
            <div>
              {sortMode === 'verified-only'
                ? t('暂无已使用用户的评论')
                : t('还没有评论。来抢沙发吧。')}
            </div>
          </div>
        ) : (
          <div className='skp-comment-list'>
            {commentTree.tops.map((c) => (
              <CommentItem
                key={c.id}
                c={c}
                replies={commentTree.replies[c.id]}
                currentUserId={userId}
                loggedIn={loggedIn}
                onDeleted={onCommentDeleted}
                onReply={(target) => setReplyTo(target)}
                onLikeChanged={onCommentLikeChanged}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// FavoriteButton — used by the sidebar. Toggles favorite state on click,
// surfaces the current count.
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
      <Bookmark size={12} fill={favored ? '#0072ff' : 'none'} />
      {favored ? t('已收藏') : t('收藏')}
    </button>
  );
}
