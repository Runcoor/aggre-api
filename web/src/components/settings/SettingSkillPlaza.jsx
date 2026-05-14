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

// SKILLS 广场 — admin settings panel (lives under /console/setting?tab=skill-plaza).
// Lets the admin enable the module, pick the generation model, tune the
// system-prompt templates, and configure resource caps.

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Github, Shield, RefreshCw, Save } from 'lucide-react';
import { API, showError, showSuccess } from '../../helpers';

// Each key maps 1:1 to a backend SkillPlazaSetting field. Defaults match
// setting/operation_setting/skill_plaza_setting.go.
const DEFAULTS = {
  'skill_plaza_setting.enabled': false,
  'skill_plaza_setting.test_mode': false,
  'skill_plaza_setting.test_mode_users': 'Runcoor',
  'skill_plaza_setting.generation_model': 'gpt-5',
  'skill_plaza_setting.server_token': '',
  'skill_plaza_setting.server_base_url': '',
  'skill_plaza_setting.gen_system_prompt_zh': '',
  'skill_plaza_setting.gen_system_prompt_en': '',
  'skill_plaza_setting.gen_temperature': 0.3,
  'skill_plaza_setting.gen_max_tokens': 4096,
  'skill_plaza_setting.github_pat': '',
  'skill_plaza_setting.max_repo_size_mb': 200,
  'skill_plaza_setting.max_file_size_kb': 1024,
  'skill_plaza_setting.max_file_count': 200,
};

const SettingSkillPlaza = () => {
  const { t } = useTranslation();
  const [values, setValues] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);

  // We hit the dedicated /api/skill-plaza/admin/settings endpoint instead
  // of the generic /api/option/. The former is AdminAuth-gated; the latter
  // is RootAuth (super-admin only). Without this split a regular admin
  // can read the settings page but every save silently 401s.
  const load = async () => {
    try {
      const res = await API.get('/api/skill-plaza/admin/settings');
      const { success, data } = res.data || {};
      if (!success) {
        showError(res.data?.message || 'load failed');
        return;
      }
      // Translate the backend struct (snake_case keys) into the flat
      // dotted keys the form uses, so the rest of the form code doesn't
      // need to change.
      const next = { ...DEFAULTS };
      next['skill_plaza_setting.enabled'] = !!data.enabled;
      next['skill_plaza_setting.test_mode'] = !!data.test_mode;
      next['skill_plaza_setting.test_mode_users'] =
        data.test_mode_users == null ? '' : String(data.test_mode_users);
      next['skill_plaza_setting.generation_model'] = data.generation_model || '';
      next['skill_plaza_setting.server_token'] = data.server_token || '';
      next['skill_plaza_setting.server_base_url'] = data.server_base_url || '';
      next['skill_plaza_setting.gen_system_prompt_zh'] = data.gen_system_prompt_zh || '';
      next['skill_plaza_setting.gen_system_prompt_en'] = data.gen_system_prompt_en || '';
      next['skill_plaza_setting.gen_temperature'] =
        typeof data.gen_temperature === 'number' ? data.gen_temperature : 0.3;
      next['skill_plaza_setting.gen_max_tokens'] =
        Number(data.gen_max_tokens) || 4096;
      next['skill_plaza_setting.github_pat'] = data.github_pat || '';
      next['skill_plaza_setting.max_repo_size_mb'] =
        Number(data.max_repo_size_mb) || 200;
      next['skill_plaza_setting.max_file_size_kb'] =
        Number(data.max_file_size_kb) || 1024;
      next['skill_plaza_setting.max_file_count'] =
        Number(data.max_file_count) || 200;
      setValues(next);
    } catch (e) {
      showError(e?.message || 'load failed');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveAll = async () => {
    setLoading(true);
    try {
      const payload = {
        enabled: !!values['skill_plaza_setting.enabled'],
        test_mode: !!values['skill_plaza_setting.test_mode'],
        test_mode_users: values['skill_plaza_setting.test_mode_users'] || '',
        generation_model: values['skill_plaza_setting.generation_model'],
        server_token: values['skill_plaza_setting.server_token'],
        server_base_url: values['skill_plaza_setting.server_base_url'],
        gen_system_prompt_zh: values['skill_plaza_setting.gen_system_prompt_zh'],
        gen_system_prompt_en: values['skill_plaza_setting.gen_system_prompt_en'],
        gen_temperature: Number(values['skill_plaza_setting.gen_temperature']),
        gen_max_tokens: Number(values['skill_plaza_setting.gen_max_tokens']),
        github_pat: values['skill_plaza_setting.github_pat'],
        max_repo_size_mb: Number(values['skill_plaza_setting.max_repo_size_mb']),
        max_file_size_kb: Number(values['skill_plaza_setting.max_file_size_kb']),
        max_file_count: Number(values['skill_plaza_setting.max_file_count']),
      };
      const res = await API.put('/api/skill-plaza/admin/settings', payload);
      if (res.data?.success) {
        showSuccess(t('已保存所有设置'));
      } else {
        showError(res.data?.message);
      }
    } catch (e) {
      showError(e?.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => {
    const target = e?.target ?? {};
    let v;
    if (target.type === 'checkbox') v = target.checked;
    else if (target.type === 'number') v = Number(target.value);
    else v = target.value;
    setValues((prev) => ({ ...prev, [k]: v }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Enable + status */}
      <Section
        icon={<Sparkles size={16} />}
        title={t('SKILLS 广场模块')}
        subtitle={t(
          '总开关关闭时,顶部导航不会显示「SKILLS 广场」菜单,公共页面也会 404。',
        )}
      >
        <Row label={t('启用模块 (总开关)')}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <input
              type='checkbox'
              checked={!!values['skill_plaza_setting.enabled']}
              onChange={set('skill_plaza_setting.enabled')}
            />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {values['skill_plaza_setting.enabled']
                ? t('已启用')
                : t('已禁用')}
            </span>
          </label>
        </Row>
        <Row label={t('测试模式')}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <input
              type='checkbox'
              checked={!!values['skill_plaza_setting.test_mode']}
              onChange={set('skill_plaza_setting.test_mode')}
              disabled={!values['skill_plaza_setting.enabled']}
            />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {values['skill_plaza_setting.test_mode']
                ? t('仅超级管理员和白名单用户可见')
                : t('所有访客可见')}
            </span>
          </label>
        </Row>
        <Row label={t('白名单用户名')}>
          <TextInput
            value={values['skill_plaza_setting.test_mode_users']}
            onChange={set('skill_plaza_setting.test_mode_users')}
            placeholder='Runcoor, alice, bob'
            disabled={
              !values['skill_plaza_setting.enabled'] ||
              !values['skill_plaza_setting.test_mode']
            }
          />
        </Row>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            paddingLeft: 234,
            marginTop: -4,
          }}
        >
          {t(
            '测试模式打开后,前台只对超级管理员 (role=100) 和下面白名单中的用户名可见。逗号分隔,大小写不敏感。普通管理员仍可通过 /console/skill-plaza 后台预览。',
          )}
        </div>
      </Section>

      {/* AI generation */}
      <Section
        icon={<Sparkles size={16} />}
        title={t('AI 教程生成')}
        subtitle={t(
          '调用本平台 /v1/chat/completions 生成中英文教程草稿,务必填写一个管理员专用 Token。',
        )}
      >
        <Row label={t('生成模型')}>
          <TextInput
            value={values['skill_plaza_setting.generation_model']}
            onChange={set('skill_plaza_setting.generation_model')}
            placeholder='gpt-5 / claude-opus-4-7'
          />
        </Row>
        <Row label={t('调用 Token (Server Token)')}>
          <TextInput
            value={values['skill_plaza_setting.server_token']}
            onChange={set('skill_plaza_setting.server_token')}
            placeholder='sk-...'
            type='password'
          />
        </Row>
        <Row label={t('Server Base URL (可选)')}>
          <TextInput
            value={values['skill_plaza_setting.server_base_url']}
            onChange={set('skill_plaza_setting.server_base_url')}
            placeholder='http://127.0.0.1:3000 (默认)'
          />
        </Row>
        <Row label={t('温度')}>
          <TextInput
            type='number'
            value={values['skill_plaza_setting.gen_temperature']}
            onChange={set('skill_plaza_setting.gen_temperature')}
            step='0.1'
            min='0'
            max='2'
          />
        </Row>
        <Row label={t('最大 Token')}>
          <TextInput
            type='number'
            value={values['skill_plaza_setting.gen_max_tokens']}
            onChange={set('skill_plaza_setting.gen_max_tokens')}
            step='256'
            min='256'
            max='32000'
          />
        </Row>
        <Row label={t('中文系统提示词')} stack>
          <Textarea
            value={values['skill_plaza_setting.gen_system_prompt_zh']}
            onChange={set('skill_plaza_setting.gen_system_prompt_zh')}
            rows={6}
          />
        </Row>
        <Row label={t('英文系统提示词')} stack>
          <Textarea
            value={values['skill_plaza_setting.gen_system_prompt_en']}
            onChange={set('skill_plaza_setting.gen_system_prompt_en')}
            rows={6}
          />
        </Row>
      </Section>

      {/* GitHub fetch */}
      <Section
        icon={<Github size={16} />}
        title={t('GitHub 抓取')}
        subtitle={t(
          '可选 PAT 提升 API 限频。资源上限是防御性限制,异常仓库不会拖垮服务。',
        )}
      >
        <Row label={t('GitHub PAT (可选)')}>
          <TextInput
            value={values['skill_plaza_setting.github_pat']}
            onChange={set('skill_plaza_setting.github_pat')}
            placeholder='ghp_...'
            type='password'
          />
        </Row>
        <Row label={t('仓库最大 MB')}>
          <TextInput
            type='number'
            value={values['skill_plaza_setting.max_repo_size_mb']}
            onChange={set('skill_plaza_setting.max_repo_size_mb')}
            min='10'
            max='1024'
          />
        </Row>
        <Row label={t('单文件最大 KB')}>
          <TextInput
            type='number'
            value={values['skill_plaza_setting.max_file_size_kb']}
            onChange={set('skill_plaza_setting.max_file_size_kb')}
            min='16'
            max='10240'
          />
        </Row>
        <Row label={t('最多读取文件数')}>
          <TextInput
            type='number'
            value={values['skill_plaza_setting.max_file_count']}
            onChange={set('skill_plaza_setting.max_file_count')}
            min='10'
            max='1000'
          />
        </Row>
      </Section>

      {/* Save */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={load}
          style={{
            height: 36,
            padding: '0 14px',
            borderRadius: 8,
            border: '1px solid var(--border-default)',
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
          }}
        >
          <RefreshCw size={14} /> {t('刷新')}
        </button>
        <button
          onClick={saveAll}
          disabled={loading}
          style={{
            height: 36,
            padding: '0 18px',
            borderRadius: 8,
            border: 0,
            color: '#fff',
            background: 'linear-gradient(135deg,#0072ff,#00c6ff)',
            cursor: loading ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,114,255,0.25)',
            opacity: loading ? 0.7 : 1,
          }}
        >
          <Save size={14} /> {loading ? t('保存中...') : t('保存所有设置')}
        </button>
      </div>

      {/* Safety note */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: 14,
          background: 'var(--bg-base)',
          borderRadius: 10,
          color: 'var(--text-secondary)',
          fontSize: 12.5,
          alignItems: 'flex-start',
        }}
      >
        <Shield size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          {t(
            '安全:GitHub 抓取仅读取 SKILL.md / README / agents/*.yaml / references/*.md 等白名单文件,绝不执行仓库脚本。AI 生成时将抓取内容包裹在 <UNTRUSTED_SOURCE_DOC> 标签内,防止 Prompt injection。',
          )}
        </div>
      </div>
    </div>
  );
};

const Section = ({ icon, title, subtitle, children }) => (
  <div
    style={{
      background: 'var(--surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 14,
      padding: 18,
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
        fontWeight: 600,
        color: 'var(--text-primary)',
      }}
    >
      {icon} <span>{title}</span>
    </div>
    {subtitle && (
      <div
        style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 14 }}
      >
        {subtitle}
      </div>
    )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {children}
    </div>
  </div>
);

const Row = ({ label, children, stack }) => (
  <div
    style={{
      display: stack ? 'flex' : 'grid',
      flexDirection: 'column',
      gridTemplateColumns: '220px 1fr',
      gap: stack ? 6 : 14,
      alignItems: stack ? 'stretch' : 'center',
    }}
  >
    <div
      style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}
    >
      {label}
    </div>
    <div>{children}</div>
  </div>
);

const TextInput = (props) => (
  <input
    {...props}
    style={{
      width: '100%',
      height: 36,
      padding: '0 12px',
      borderRadius: 8,
      border: '1px solid var(--border-default)',
      background: 'var(--surface)',
      color: 'var(--text-primary)',
      fontSize: 13.5,
      outline: 'none',
      ...(props.style || {}),
    }}
  />
);

const Textarea = (props) => (
  <textarea
    {...props}
    style={{
      width: '100%',
      padding: 12,
      borderRadius: 8,
      border: '1px solid var(--border-default)',
      background: 'var(--surface)',
      color: 'var(--text-primary)',
      fontSize: 13,
      lineHeight: 1.7,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      resize: 'vertical',
      outline: 'none',
      ...(props.style || {}),
    }}
  />
);

export default SettingSkillPlaza;
