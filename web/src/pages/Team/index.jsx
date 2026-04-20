/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/

import React, { useEffect, useState } from 'react';
import {
  Button,
  Input,
  Typography,
  Modal,
  Skeleton,
  Tag,
  Tooltip,
} from '@douyinfe/semi-ui';
import { IconPlus, IconCopy } from '@douyinfe/semi-icons';
import { Users, Crown, Shield, User, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess, renderQuota } from '../../helpers';
import { copy } from '../../helpers/utils';
import { useIsMobile } from '../../hooks/common/useIsMobile';

const { Text } = Typography;

const TeamPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createVisible, setCreateVisible] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [creating, setCreating] = useState(false);

  // Join by invite code
  const [joinVisible, setJoinVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/team');
      if (res.data?.success) setTeams(res.data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadTeams(); }, []);

  const handleCreate = async () => {
    if (!teamName.trim()) { showError(t('团队名称不能为空')); return; }
    setCreating(true);
    try {
      const res = await API.post('/api/team', { name: teamName.trim() });
      if (res.data?.success) {
        showSuccess(t('团队创建成功'));
        setCreateVisible(false);
        setTeamName('');
        loadTeams();
      } else showError(res.data?.message || t('创建失败'));
    } catch { showError(t('请求失败')); }
    setCreating(false);
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) { showError(t('请输入邀请码')); return; }
    setJoining(true);
    try {
      const res = await API.post(`/api/team/join/${inviteCode.trim()}`);
      if (res.data?.success) {
        showSuccess(`${t('已加入团队')}: ${res.data.data?.team_name || ''}`);
        setJoinVisible(false);
        setInviteCode('');
        loadTeams();
      } else showError(res.data?.message || t('加入失败'));
    } catch { showError(t('请求失败')); }
    setJoining(false);
  };

  const getRoleIcon = (role) => {
    if (role >= 100) return <Crown size={14} style={{ color: 'var(--warning, #f59e0b)' }} />;
    if (role >= 10) return <Shield size={14} style={{ color: 'var(--accent)' }} />;
    return <User size={14} style={{ color: 'var(--text-muted)' }} />;
  };

  const getRoleLabel = (role) => {
    if (role >= 100) return t('创建者');
    if (role >= 10) return t('管理员');
    return t('成员');
  };

  return (
    <div className='w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', margin: 0 }}>
            {t('团队管理')}
          </h1>
          <Text style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {t('创建或加入团队，共享 API 额度')}
          </Text>
        </div>
        <div className='flex gap-2'>
          <Button theme='light' type='primary' onClick={() => setJoinVisible(true)}
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            {t('加入团队')}
          </Button>
          <Button theme='solid' type='primary' icon={<IconPlus />} onClick={() => setCreateVisible(true)}
            style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', border: 'none', fontWeight: 600 }}
          >
            {t('创建团队')}
          </Button>
        </div>
      </div>

      {/* Teams list */}
      {loading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          {[1, 2].map((i) => (
            <div key={i} className='rounded-[var(--radius-lg)] p-6' style={{ background: 'var(--surface)', border: '1px solid var(--border-default)' }}>
              <Skeleton.Title active style={{ width: '60%', marginBottom: 12 }} />
              <Skeleton.Paragraph active rows={2} />
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className='text-center py-16' style={{ color: 'var(--text-muted)' }}>
          <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <Text style={{ fontSize: 16, display: 'block', color: 'var(--text-muted)' }}>
            {t('暂无团队')}
          </Text>
          <Text style={{ fontSize: 13, display: 'block', color: 'var(--text-muted)', marginTop: 4 }}>
            {t('创建一个团队或使用邀请码加入')}
          </Text>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          {teams.map((item) => {
            const team = item.team;
            const role = item.role;
            const memberCount = item.member_count;
            const usedPercent = team.quota > 0 ? Math.min(100, Math.round((team.used_quota / team.quota) * 100)) : 0;

            return (
              <div
                key={team.id}
                className='rounded-[var(--radius-lg)] p-5 cursor-pointer transition-all duration-200'
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-default)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                }}
                onClick={() => navigate(`/console/team/${team.id}`)}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.03)'; }}
              >
                <div className='flex items-center justify-between mb-3'>
                  <h3 className='text-lg font-bold m-0 truncate' style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                    {team.name}
                  </h3>
                  <span className='inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 flex-shrink-0'
                    style={{ borderRadius: 9999, background: role >= 100 ? 'rgba(245,158,11,0.1)' : 'var(--surface-active)', color: role >= 100 ? 'var(--warning, #f59e0b)' : 'var(--text-secondary)' }}>
                    {getRoleIcon(role)}
                    {getRoleLabel(role)}
                  </span>
                </div>

                {/* Quota progress */}
                <div className='mb-3'>
                  <div className='flex justify-between text-xs mb-1.5'>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {renderQuota(team.used_quota)} / {team.quota > 0 ? renderQuota(team.quota) : t('未分配')}
                    </span>
                    {team.quota > 0 && (
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{usedPercent}%</span>
                    )}
                  </div>
                  <div style={{ width: '100%', height: 6, borderRadius: 9999, background: 'var(--surface-active)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${usedPercent}%`,
                      background: 'var(--accent-gradient)', borderRadius: 9999,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>

                <div className='flex items-center justify-between text-xs' style={{ color: 'var(--text-muted)' }}>
                  <span className='flex items-center gap-1'>
                    <Users size={12} />
                    {memberCount} {t('位成员')}
                  </span>
                  <span>{t('请求')} {team.request_count || 0}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal title={t('创建团队')} visible={createVisible} onCancel={() => setCreateVisible(false)}
        footer={null} centered size='small'>
        <div className='space-y-4 pb-2'>
          <Input value={teamName} onChange={setTeamName} placeholder={t('输入团队名称')} showClear
            style={{ borderRadius: 'var(--radius-md)' }} onEnterPress={handleCreate} />
          <Button theme='solid' type='primary' block loading={creating} onClick={handleCreate}
            style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', border: 'none', fontWeight: 600, height: 40 }}
          >
            {t('创建')}
          </Button>
        </div>
      </Modal>

      {/* Join modal */}
      <Modal title={t('加入团队')} visible={joinVisible} onCancel={() => setJoinVisible(false)}
        footer={null} centered size='small'>
        <div className='space-y-4 pb-2'>
          <Input value={inviteCode} onChange={setInviteCode} placeholder={t('输入邀请码')} showClear
            style={{ borderRadius: 'var(--radius-md)' }} onEnterPress={handleJoin} />
          <Button theme='solid' type='primary' block loading={joining} onClick={handleJoin}
            style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', border: 'none', fontWeight: 600, height: 40 }}
          >
            {t('加入')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default TeamPage;
