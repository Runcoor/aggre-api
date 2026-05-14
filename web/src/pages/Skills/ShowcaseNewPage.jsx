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

// SKILLS 广场 — 案例分享落地页 (P4-3).
//
// A guided entry into the editor that pre-fills type=showcase and prompts
// the user with a "what you'll need" checklist (prompt text, output
// screenshot, related skill). The actual writing happens inside
// EditorPage; this page exists to set expectations and reduce blank-page
// anxiety. A "直接进入编辑器" link bypasses the guide for repeat users.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ImageIcon,
  Wand2,
  Layers,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { API, getUserIdFromLocalStorage } from '../../helpers';
import { SKILL_PLAZA_STYLES } from './styles';

const TIPS = [
  {
    Icon: Wand2,
    title: '一段你用过的 Prompt',
    desc: '完整可复用的提示词,让别人能照着跑出类似效果。',
  },
  {
    Icon: ImageIcon,
    title: '至少一张输出截图',
    desc: '直接拖到正文里就行。建议先压缩到 100KB 以内。',
  },
  {
    Icon: Layers,
    title: '关联用到的 Skill (可选)',
    desc: '让浏览同一 Skill 的人能在 Detail 页看到你的案例。',
  },
];

const ShowcaseNewPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userId = getUserIdFromLocalStorage();
  const [skillId, setSkillId] = useState(0);
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    if (userId <= 0) navigate('/login', { replace: true });
  }, [userId, navigate]);

  useEffect(() => {
    API.get('/api/skill-plaza/skills', { params: { page_size: 200 } })
      .then((res) => {
        if (res.data?.success) {
          setSkills(res.data.data?.items || []);
        }
      })
      .catch(() => {});
  }, []);

  const startEditor = () => {
    const params = new URLSearchParams({ type: 'showcase' });
    if (skillId > 0) params.set('skill_id', String(skillId));
    navigate(`/skills/editor?${params.toString()}`);
  };

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
              marginBottom: 4,
            }}
          >
            <ArrowLeft size={12} /> {t('返回广场')}
          </Link>
          <h1 style={{ fontSize: 28, margin: '6px 0 8px' }}>
            {t('分享一个案例')}
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              margin: 0,
              fontSize: 14,
              maxWidth: 640,
            }}
          >
            {t(
              '把你用 AI 做出来的好东西分享给其他人 —— 一段 Prompt + 截图 + 几句说明,大概 5 分钟就能写完。',
            )}
          </p>

          <div
            style={{
              marginTop: 24,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {TIPS.map((tip) => (
              <div
                key={tip.title}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: '#eff6ff',
                    color: '#2563eb',
                    marginBottom: 10,
                  }}
                >
                  <tip.Icon size={18} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  {t(tip.title)}
                </div>
                <div
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 12.5,
                    lineHeight: 1.55,
                  }}
                >
                  {t(tip.desc)}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 24,
              padding: 18,
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 12,
            }}
          >
            <label
              style={{
                display: 'block',
                fontSize: 12,
                color: 'var(--text-muted)',
                marginBottom: 6,
              }}
            >
              {t('关联到一个 Skill (可选)')}
            </label>
            <select
              value={skillId}
              onChange={(e) => setSkillId(parseInt(e.target.value, 10) || 0)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-default)',
                background: 'var(--bg-base)',
                fontSize: 14,
              }}
            >
              <option value={0}>{t('— 不关联,后面也能改 —')}</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={startEditor}
              style={{
                marginTop: 14,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '11px 22px',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                borderRadius: 10,
                background: 'linear-gradient(135deg,#0072ff,#00c6ff)',
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,114,255,0.25)',
              }}
            >
              <CheckCircle2 size={16} /> {t('开始撰写')}{' '}
              <ChevronRight size={16} style={{ marginLeft: 4 }} />
            </button>
            <span
              style={{
                marginLeft: 12,
                color: 'var(--text-muted)',
                fontSize: 12.5,
              }}
            >
              {t('打开后会自动定位为「案例分享」类型。')}
            </span>
          </div>
          <div style={{ height: 60 }} />
        </div>
      </div>
    </>
  );
};

export default ShowcaseNewPage;
