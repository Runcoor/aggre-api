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

// Admin · GitHub Import page. Mirrors the design bundle's
// page-import-review.jsx: URL → parse → manifest preview → AI generate
// → ready-for-review banner.

import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Search,
  Loader,
  Check,
  X,
  Github,
  RefreshCw,
} from 'lucide-react';
import { API, showError, showSuccess } from '../../../helpers';
import { SKILL_PLAZA_STYLES } from '../styles';

const STEP_LABELS = [
  { id: 'idle', label: '待输入' },
  { id: 'pending', label: '排队' },
  { id: 'fetching', label: '正在解析' },
  { id: 'generating', label: '生成文章' },
  { id: 'done', label: '生成完成' },
];

const SkillsAdminImport = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState(null);
  const pollRef = useRef(null);

  // Poll job status while it's pending/fetching/generating.
  useEffect(() => {
    if (!job) return undefined;
    if (job.status === 'done' || job.status === 'failed') return undefined;
    pollRef.current = setInterval(() => {
      API.get(`/api/skill-plaza/admin/imports/${job.id}`)
        .then((res) => {
          if (res.data?.success) setJob(res.data.data);
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(pollRef.current);
  }, [job]);

  const startImport = () => {
    if (!url.trim()) {
      showError(t('请输入 GitHub 仓库地址'));
      return;
    }
    setSubmitting(true);
    API.post('/api/skill-plaza/admin/imports', {
      repo_url: url.trim(),
      branch: branch.trim(),
    })
      .then((res) => {
        if (res.data?.success) {
          setJob(res.data.data);
          showSuccess(t('已创建导入任务,正在后台执行'));
        } else {
          showError(res.data?.message || '提交失败');
        }
      })
      .catch((e) => showError(e?.message || '提交失败'))
      .finally(() => setSubmitting(false));
  };

  const stepIdx = STEP_LABELS.findIndex(
    (s) => s.id === (job?.status || 'idle'),
  );
  const metadata = parseMetadata(job?.metadata_json);

  return (
    <>
      <style>{SKILL_PLAZA_STYLES}</style>
      <div className='skp-root'>
        <div className='skp-page skp-narrow'>
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
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 12.5,
                color: 'var(--text-muted)',
                marginBottom: 4,
              }}
            >
              {t('管理员工作台')}
            </div>
            <h1
              style={{
                fontSize: 26,
                letterSpacing: '-0.4px',
                margin: '0 0 6px 0',
              }}
            >
              {t('从 GitHub 导入 Skill')}
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              {t(
                '粘贴一个 github.com 仓库地址,系统会自动解析 Skill 资源并生成中英双语教程草稿。',
              )}
            </p>
          </div>

          {/* Stepper */}
          <div className='skp-stepper'>
            {STEP_LABELS.map((s, i) => {
              const state =
                i < stepIdx ? 'done' : i === stepIdx ? 'active' : '';
              return (
                <div key={s.id} className={'skp-step ' + state}>
                  <span className='num'>{i + 1}</span>
                  {t(s.label)}
                </div>
              );
            })}
          </div>

          {/* Form */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 14,
              padding: 18,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 12,
                color: 'var(--text-primary)',
              }}
            >
              <span>
                <Github
                  size={16}
                  style={{ verticalAlign: '-3px', marginRight: 6 }}
                />{' '}
                {t('仓库地址')}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  fontWeight: 400,
                }}
              >
                {t('仅支持 github.com')}
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 160px auto',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder='https://github.com/owner/repo'
                style={{
                  height: 44,
                  padding: '0 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border-default)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder='main'
                style={{
                  height: 44,
                  padding: '0 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border-default)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <button
                disabled={submitting}
                onClick={startImport}
                style={{
                  height: 44,
                  padding: '0 18px',
                  borderRadius: 10,
                  border: 0,
                  color: '#fff',
                  cursor: submitting ? 'wait' : 'pointer',
                  background: 'linear-gradient(135deg,#0072ff,#00c6ff)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,114,255,0.25)',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? <Loader size={16} /> : <Search size={16} />}
                {submitting ? t('提交中...') : t('开始解析')}
              </button>
            </div>

            <div className='skp-banner'>
              <ShieldCheck size={16} />
              <div>
                <strong>{t('安全说明:')}</strong>
                {t(
                  '仅以只读方式读取文件,不会执行仓库中的任何代码。单文件 ≤ 1MB、仓库总计 ≤ 200MB、最多读取 200 个文件。',
                )}
              </div>
            </div>
          </div>

          {/* Job status */}
          {job && (
            <>
              {job.status === 'failed' && (
                <div className='skp-banner warn'>
                  <X size={16} />
                  <div>
                    <strong>{t('导入失败:')}</strong>{' '}
                    {job.error_message || t('未知错误')}
                  </div>
                </div>
              )}

              {job.status === 'fetching' && (
                <div className='skp-banner'>
                  <Loader
                    size={16}
                    style={{ animation: 'skp-spin 1.2s linear infinite' }}
                  />
                  {t('正在从 GitHub 解析仓库结构与文件内容...')}
                </div>
              )}

              {job.status === 'generating' && (
                <div className='skp-banner'>
                  <Loader
                    size={16}
                    style={{ animation: 'skp-spin 1.2s linear infinite' }}
                  />
                  {t('正在调用 AI 生成中英双语教程,约 30~60 秒...')}
                </div>
              )}

              {metadata && (
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 14,
                    padding: 18,
                    marginBottom: 16,
                  }}
                >
                  <h3
                    style={{
                      fontSize: 15,
                      margin: '0 0 12px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {t('检测结果')}
                  </h3>
                  <div>
                    {(metadata.files || []).slice(0, 12).map((f) => (
                      <div key={f.path} className='skp-detect-item found'>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                          }}
                        >
                          <span
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              background: '#16a34a',
                              color: '#fff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Check size={14} />
                          </span>
                          <div>
                            <div className='file-name'>{f.path}</div>
                            <div
                              style={{
                                fontSize: 12,
                                color: 'var(--text-muted)',
                                marginTop: 2,
                              }}
                            >
                              {f.size} bytes
                            </div>
                          </div>
                        </div>
                        <span
                          style={{ fontSize: 12.5, color: 'var(--text-muted)' }}
                        >
                          {t('已检测到')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2,1fr)',
                      gap: 10,
                      marginTop: 12,
                    }}
                  >
                    <Meta
                      k='Commit'
                      v={(metadata.commit_hash || '').slice(0, 12)}
                      mono
                    />
                    <Meta k='License' v={metadata.license || '-'} />
                    <Meta
                      k={t('仓库大小')}
                      v={`${metadata.repo_size_kb || 0} KB`}
                    />
                    <Meta
                      k={t('已读字节')}
                      v={`${metadata.total_bytes || 0} B`}
                    />
                  </div>
                </div>
              )}

              {job.status === 'done' && (
                <div
                  className='skp-banner ok'
                  style={{ justifyContent: 'space-between' }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <Check size={16} />{' '}
                    {t('双语教程已生成,请进入审核页编辑并发布')}
                  </div>
                  <button
                    onClick={() =>
                      navigate(`/skills/admin/review/${job.skill_id}`)
                    }
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      height: 32,
                      padding: '0 14px',
                      borderRadius: 8,
                      border: 0,
                      color: '#fff',
                      cursor: 'pointer',
                      background: 'linear-gradient(135deg,#0072ff,#00c6ff)',
                      fontSize: 13,
                    }}
                  >
                    {t('前往审核')} <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}

          <style>{`@keyframes skp-spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ height: 60 }} />
        </div>
      </div>
    </>
  );
};

const Meta = ({ k, v, mono }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 12px',
      borderRadius: 8,
      background: 'var(--bg-base)',
      fontSize: 12.5,
    }}
  >
    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
    <strong
      style={{
        color: 'var(--text-primary)',
        fontFamily: mono ? 'monospace' : 'inherit',
      }}
    >
      {v}
    </strong>
  </div>
);

function parseMetadata(json) {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export default SkillsAdminImport;
