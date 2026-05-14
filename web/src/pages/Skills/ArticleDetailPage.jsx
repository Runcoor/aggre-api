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

// SKILLS 广场 — 用户投稿文章详情 (P4-3 / P4-6 配套).
//
// Read-only public page for an approved user article. Fetches by slug,
// renders the Markdown body, shows author / tags / linked skill. Lives
// on /skills/article/:slug to keep it out of the way of the Skill
// detail route /skills/:slug.

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Eye,
  Heart,
  Tag,
  ExternalLink,
  Calendar,
  User as UserIcon,
} from 'lucide-react';
import { API, showError } from '../../helpers';
import { MarkdownRenderer } from '../../components/common/markdown/MarkdownRenderer';
import { SKILL_PLAZA_STYLES } from './styles';

const TYPE_LABEL = {
  tutorial: '教程',
  review: '测评',
  showcase: '案例',
  troubleshooting: '排错',
  prompts: 'Prompt',
  comparison: '对比',
};

const ArticleDetailPage = () => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    API.get(`/api/skill-plaza/user-articles/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (res.data?.success) setArticle(res.data.data);
        else showError(res.data?.message || t('加载失败'));
      })
      .catch((e) => showError(e?.message || t('加载失败')))
      .finally(() => setLoading(false));
  }, [slug, t]);

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
        {t('加载中…')}
      </div>
    );
  }

  if (!article) {
    return (
      <>
        <style>{SKILL_PLAZA_STYLES}</style>
        <div className='skp-root'>
          <div className='skp-page skp-narrow'>
            <Link
              to='/skills'
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12.5,
                color: 'var(--text-muted)',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={12} /> {t('返回广场')}
            </Link>
            <div
              style={{
                padding: 60,
                textAlign: 'center',
                color: 'var(--text-muted)',
                background: 'var(--surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 14,
                marginTop: 16,
              }}
            >
              {t('文章不存在或已下架。')}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{SKILL_PLAZA_STYLES}</style>
      <div className='skp-root'>
        <div className='skp-page skp-narrow'>
          <Link
            to='/skills'
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12.5,
              color: 'var(--text-muted)',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={12} /> {t('返回广场')}
          </Link>

          <div style={{ marginTop: 14, marginBottom: 18 }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: 12,
                fontWeight: 600,
                padding: '2px 10px',
                borderRadius: 4,
                background: '#eff6ff',
                color: '#2563eb',
                marginBottom: 12,
              }}
            >
              {t(TYPE_LABEL[article.type] || article.type)}
            </span>
            <h1 style={{ fontSize: 32, lineHeight: 1.25, margin: '0 0 12px' }}>
              {article.title}
            </h1>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
                color: 'var(--text-secondary)',
                fontSize: 13,
              }}
            >
              {article.author_name && (
                <Link
                  to={`/skills/u/${encodeURIComponent(article.author_name)}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                  }}
                >
                  <UserIcon size={12} /> {article.author_name}
                </Link>
              )}
              {article.published_at > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Calendar size={12} />{' '}
                  {new Date(article.published_at * 1000).toLocaleDateString()}
                </span>
              )}
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <Eye size={12} /> {article.view_count || 0}
              </span>
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <Heart size={12} /> {article.like_count || 0}
              </span>
              {article.skill_slug && (
                <Link
                  to={`/skills/${article.skill_slug}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    color: '#0072ff',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={12} /> {article.skill_name}
                </Link>
              )}
            </div>
            {article.tags && article.tags.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                  marginTop: 10,
                }}
              >
                {article.tags.map((tg) => (
                  <span
                    key={tg}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'var(--bg-base)',
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                    }}
                  >
                    <Tag size={10} /> {tg}
                  </span>
                ))}
              </div>
            )}
          </div>

          {article.cover_image && (
            <img
              src={article.cover_image}
              alt=''
              style={{
                width: '100%',
                maxWidth: '100%',
                borderRadius: 12,
                marginBottom: 18,
              }}
            />
          )}

          {article.summary && (
            <div
              style={{
                padding: '12px 16px',
                borderLeft: '3px solid #0072ff',
                background: 'var(--bg-base)',
                color: 'var(--text-secondary)',
                fontSize: 14,
                marginBottom: 18,
                borderRadius: '0 8px 8px 0',
              }}
            >
              {article.summary}
            </div>
          )}

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 12,
              padding: '24px 28px',
            }}
          >
            <MarkdownRenderer content={article.content || ''} fontSize={15} />
          </div>
          <div style={{ height: 80 }} />
        </div>
      </div>
    </>
  );
};

export default ArticleDetailPage;
