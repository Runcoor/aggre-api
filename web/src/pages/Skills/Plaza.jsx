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

// SKILLS 广场 — public landing page (Plaza).
// Lists published skills with search / category / source filters.

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Inbox,
  Star,
  Bookmark,
  MessageSquare,
  Globe,
  Settings,
  ArrowRight,
  SlidersHorizontal,
  User,
} from 'lucide-react';
import {
  API,
  isAdmin,
  showError,
  getUserIdFromLocalStorage,
} from '../../helpers';
import { SKILL_PLAZA_STYLES, ProceduralCover } from './styles';

// Categories are user-facing — keep them concrete and broad so common
// AI workflows have a home. Order matches loose popularity.
const CATEGORIES = [
  { id: '', name: '全部' },
  { id: 'coding', name: '编程辅助' },
  { id: 'writing', name: '写作创作' },
  { id: 'data', name: '数据分析' },
  { id: 'research', name: '研究调研' },
  { id: 'design', name: '设计' },
  { id: 'multimodal', name: '多模态' },
  { id: 'image', name: '图像生成' },
  { id: 'audio_video', name: '音视频' },
  { id: 'productivity', name: '效率办公' },
  { id: 'document', name: '文档处理' },
  { id: 'translation', name: '翻译' },
  { id: 'education', name: '学习教育' },
  { id: 'marketing', name: '市场营销' },
  { id: 'customer_service', name: '客户服务' },
  { id: 'finance_legal', name: '金融法律' },
  { id: 'health', name: '健康医疗' },
  { id: 'devops', name: 'DevOps' },
  { id: 'agent', name: 'AI Agent' },
  { id: 'prompt', name: 'Prompt 工程' },
  { id: 'other', name: '其他' },
];

const SORTS = [
  { id: 'latest', name: '最新' },
  { id: 'updated', name: '最近更新' },
];

// categoryLabel maps a category id back to its display name.
// Falls back to the raw id (capitalized) if the id isn't recognized —
// so older skills with manual categories still render something.
function categoryLabel(id) {
  if (!id) return '';
  const hit = CATEGORIES.find((c) => c.id === id);
  return hit ? hit.name : id;
}

const SkillsPlaza = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('latest');
  const [language, setLanguage] = useState('zh-CN');

  // useMemo so the param object is referentially stable until the user
  // actually changes a filter — avoids re-fetching during unrelated
  // state updates (e.g. typing then clicking elsewhere).
  const params = useMemo(
    () => ({
      category,
      sort,
      language,
      search,
      page: 1,
      page_size: 60,
    }),
    [category, sort, language, search],
  );

  // moduleDisabled is true when the gated /api/skill-plaza/* path returns
  // 404 — i.e. the module hasn't been enabled in admin settings yet.
  // We render a placeholder hero instead of dumping the user into a
  // broken toast so the page degrades gracefully for visitors.
  const [moduleDisabled, setModuleDisabled] = useState(false);

  useEffect(() => {
    let aborted = false;
    setLoading(true);
    setModuleDisabled(false);
    API.get('/api/skill-plaza/skills', { params })
      .then((res) => {
        if (aborted) return;
        if (res.data?.success) {
          setItems(res.data.data?.items || []);
          setTotal(res.data.data?.total || 0);
        } else {
          showError(res.data?.message || '加载失败');
        }
      })
      .catch((e) => {
        if (aborted) return;
        // 404 means the feature flag is off for non-admins; that's a
        // soft state, not a failure worth toasting.
        if (e?.response?.status === 404) {
          setModuleDisabled(true);
          setItems([]);
          setTotal(0);
        } else {
          showError(e?.message || '加载失败');
        }
      })
      .finally(() => {
        if (!aborted) setLoading(false);
      });
    return () => {
      aborted = true;
    };
  }, [params]);

  const admin = isAdmin();
  const loggedIn = getUserIdFromLocalStorage() > 0;

  return (
    <>
      <style>{SKILL_PLAZA_STYLES}</style>
      <div className='skp-root'>
        <div className='skp-page'>
          {/* Hero */}
          <section className='skp-hero'>
            <h1>{t('发现你的下一个 AI Skill')}</h1>
            <p>
              {t(
                '浏览社区精选教程、官方 GitHub 导入与真实使用案例。中英双语沉淀,管理员审核保证质量。',
              )}
            </p>

            <div className='skp-search'>
              <Search size={18} color='var(--text-muted)' />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('搜索 Skill 名称或关键词,例如 "PDF 解析"')}
              />
              <button
                onClick={() => {
                  /* search already wired to state */
                }}
                style={{
                  height: 38,
                  padding: '0 16px',
                  borderRadius: 10,
                  border: 0,
                  color: '#fff',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg,#0072ff,#00c6ff)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 12px rgba(0,114,255,0.25)',
                }}
              >
                {t('搜索')} <ArrowRight size={14} />
              </button>
            </div>

            <div className='skp-stats'>
              <div className='skp-stat'>
                <strong>{total}</strong> Skills
              </div>
              <div className='skp-stat'>
                <Globe size={13} /> <span>{t('中英双语')}</span>
              </div>
              <span
                style={{
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 14,
                  flexWrap: 'wrap',
                }}
              >
                {loggedIn && (
                  <Link
                    to='/skills/me'
                    className='skp-stat'
                    style={{
                      textDecoration: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    <User size={13} /> {t('我的中心')}
                  </Link>
                )}
                {admin && (
                  <>
                    <Link
                      to='/skills/admin'
                      className='skp-stat'
                      style={{
                        textDecoration: 'none',
                        color: '#0072ff',
                        cursor: 'pointer',
                      }}
                    >
                      <Settings size={14} /> {t('管理员工作台')}
                    </Link>
                    <Link
                      to='/console/setting?tab=skill-plaza'
                      className='skp-stat'
                      style={{
                        textDecoration: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      <SlidersHorizontal size={13} /> {t('模块设置')}
                    </Link>
                  </>
                )}
              </span>
            </div>
          </section>

          {/* Filter bar */}
          <div className='skp-filter-bar'>
            <div className='skp-filter-row'>
              <span className='skp-label-sm'>{t('分类')}</span>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id || 'all'}
                  className={'skp-pill' + (category === c.id ? ' active' : '')}
                  onClick={() => setCategory(c.id)}
                >
                  {t(c.name)}
                </button>
              ))}
            </div>

            <div className='skp-filter-row'>
              <span className='skp-label-sm'>{t('排序')}</span>
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  className={'skp-pill' + (sort === s.id ? ' active' : '')}
                  onClick={() => setSort(s.id)}
                >
                  {t(s.name)}
                </button>
              ))}
              <span
                style={{ marginLeft: 'auto', display: 'inline-flex', gap: 6 }}
              >
                {['zh-CN', 'en'].map((lng) => (
                  <button
                    key={lng}
                    className={'skp-pill' + (language === lng ? ' active' : '')}
                    onClick={() => setLanguage(lng)}
                  >
                    {lng === 'zh-CN' ? t('中文') : 'EN'}
                  </button>
                ))}
              </span>
            </div>
          </div>

          {/* Sort row */}
          <div
            style={{
              marginBottom: 14,
              color: 'var(--text-muted)',
              fontSize: 13,
            }}
          >
            {loading
              ? t('加载中...')
              : `${t('共')} ${items.length} ${t('个结果')}`}
          </div>

          {/* Disabled banner — only shown to visitors when the module
              hasn't been enabled yet. Admins bypass the gate and see
              real content instead. */}
          {moduleDisabled && (
            <div
              style={{
                padding: 24,
                background: 'var(--bg-base)',
                border: '1px dashed var(--border-default)',
                borderRadius: 12,
                textAlign: 'center',
                color: 'var(--text-muted)',
                marginBottom: 20,
              }}
            >
              <Inbox
                size={22}
                style={{ opacity: 0.5, marginBottom: 8, verticalAlign: 'middle' }}
              />
              <div style={{ fontSize: 14 }}>
                {t('SKILLS 广场正在筹备中,敬请期待')}
              </div>
            </div>
          )}

          {/* Grid */}
          {items.length === 0 && !loading && !moduleDisabled ? (
            <div
              style={{
                textAlign: 'center',
                padding: '72px 0',
                color: 'var(--text-muted)',
              }}
            >
              <Inbox
                size={20}
                style={{
                  marginBottom: 10,
                  opacity: 0.5,
                  verticalAlign: 'middle',
                }}
              />
              <div style={{ fontSize: 14 }}>
                {t('暂时还没有可展示的 Skill')}
              </div>
              <div style={{ fontSize: 12.5, marginTop: 4, opacity: 0.7 }}>
                {t('换个分类或关键词试试,管理员可在工作台导入更多内容')}
              </div>
            </div>
          ) : (
            <div className='skp-grid'>
              {items.map((item) => (
                <Link
                  key={item.id}
                  to={`/skills/${item.slug}?lang=${item.language || language}`}
                  className='skp-card'
                >
                  <ProceduralCover
                    seed={item.cover_seed || item.slug}
                    label={item.name}
                  />
                  <div className='skp-card-body'>
                    <div className='skp-card-row'>
                      {item.category && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: 11.5,
                            color: 'var(--text-muted)',
                            background: 'var(--bg-base)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 4,
                            padding: '2px 8px',
                          }}
                        >
                          {t(categoryLabel(item.category))}
                        </span>
                      )}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11.5,
                          color: 'var(--text-muted)',
                          marginLeft: 'auto',
                        }}
                      >
                        <Globe size={12} />{' '}
                        {item.language === 'en' ? 'EN' : '中'}
                      </span>
                    </div>
                    <h3 className='skp-card-title'>
                      {item.title || item.name}
                    </h3>
                    <p className='skp-card-summary'>{item.summary}</p>
                    <div className='skp-card-tags'>
                      {(item.tags || []).slice(0, 3).map((tag) => (
                        <span key={tag} className='skp-mini-tag'>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className='skp-card-meta'>
                      <span
                        style={{
                          display: 'inline-flex',
                          gap: 4,
                          alignItems: 'center',
                          fontSize: 13,
                        }}
                      >
                        <Star size={14} color='#f59e0b' fill='#f59e0b' />
                        <strong>{(item.rating_average || 0).toFixed(1)}</strong>
                        <span style={{ color: 'var(--text-muted)' }}>
                          · {item.rating_count || 0}
                        </span>
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          gap: 12,
                          color: 'var(--text-muted)',
                          fontSize: 12,
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Bookmark size={12} /> {item.favorite_count || 0}
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <MessageSquare size={12} /> {item.comment_count || 0}
                        </span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div style={{ height: 60 }} />
        </div>
      </div>
    </>
  );
};

export default SkillsPlaza;
