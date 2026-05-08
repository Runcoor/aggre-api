/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/

import React, { useEffect, useMemo, useState } from 'react';
import {
  Banner,
  Button,
  Input,
  Modal,
  Skeleton,
  Tag,
  TextArea,
  Tooltip,
  Typography,
} from '@douyinfe/semi-ui';
import { IconPlus, IconClock } from '@douyinfe/semi-icons';
import { Users, Crown, Shield, User, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API, isAdmin, showError, showSuccess } from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';

const { Text } = Typography;

// Status constants kept in sync with model/team_application.go.
const APP_PENDING = 0;
const APP_APPROVED = 1;
const APP_REJECTED = 2;
const APP_CANCELED = 3;

const TeamPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const _isMobile = useIsMobile();
  const admin = isAdmin();

  const [teams, setTeams] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Apply / direct-create modal (label switches by role).
  const [applyVisible, setApplyVisible] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamReason, setTeamReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Join by invite code
  const [joinVisible, setJoinVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  const pendingApp = useMemo(
    () => applications.find((a) => a.status === APP_PENDING),
    [applications],
  );

  const loadAll = async () => {
    setLoading(true);
    try {
      const [tRes, aRes] = await Promise.all([
        API.get('/api/team'),
        API.get('/api/team/apply/self'),
      ]);
      if (tRes.data?.success) setTeams(tRes.data.data || []);
      if (aRes.data?.success) setApplications(aRes.data.data || []);
    } catch (e) {
      // Network failures handled below in individual UI states.
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSubmit = async () => {
    if (!teamName.trim()) {
      showError(t('团队名称不能为空'));
      return;
    }
    setSubmitting(true);
    try {
      // Admins create directly; common users go through approval.
      const url = admin ? '/api/team' : '/api/team/apply';
      const payload = admin
        ? { name: teamName.trim() }
        : { name: teamName.trim(), reason: teamReason.trim() };
      const res = await API.post(url, payload);
      if (res.data?.success) {
        showSuccess(admin ? t('团队创建成功') : t('申请已提交，等待管理员审核'));
        setApplyVisible(false);
        setTeamName('');
        setTeamReason('');
        loadAll();
      } else {
        showError(res.data?.message || t('提交失败'));
      }
    } catch {
      showError(t('请求失败'));
    }
    setSubmitting(false);
  };

  const handleWithdraw = async (appId) => {
    try {
      const res = await API.delete(`/api/team/apply/${appId}`);
      if (res.data?.success) {
        showSuccess(t('已撤回申请'));
        loadAll();
      } else {
        showError(res.data?.message || t('撤回失败'));
      }
    } catch {
      showError(t('请求失败'));
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      showError(t('请输入邀请码'));
      return;
    }
    setJoining(true);
    try {
      const res = await API.post(`/api/team/join/${inviteCode.trim()}`);
      if (res.data?.success) {
        showSuccess(`${t('已加入团队')}: ${res.data.data?.team_name || ''}`);
        setJoinVisible(false);
        setInviteCode('');
        loadAll();
      } else showError(res.data?.message || t('加入失败'));
    } catch {
      showError(t('请求失败'));
    }
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

  const renderAppStatus = (status) => {
    if (status === APP_PENDING)
      return <Tag color='blue' shape='circle'>{t('待审核')}</Tag>;
    if (status === APP_APPROVED)
      return <Tag color='green' shape='circle'>{t('已通过')}</Tag>;
    if (status === APP_REJECTED)
      return <Tag color='red' shape='circle'>{t('已驳回')}</Tag>;
    return <Tag color='grey' shape='circle'>{t('已撤回')}</Tag>;
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
            {admin
              ? t('创建或加入团队，共享 API 额度')
              : t('申请创建或加入团队，由管理员审核后开通')}
          </Text>
        </div>
        <div className='flex gap-2'>
          <Button theme='light' type='primary' onClick={() => setJoinVisible(true)}
            style={{ borderRadius: 'var(--radius-md)' }}>
            {t('加入团队')}
          </Button>
          <Tooltip
            content={pendingApp && !admin ? t('已有待审核的申请') : ''}
            trigger={pendingApp && !admin ? 'hover' : 'custom'}
          >
            <Button
              theme='solid'
              type='primary'
              icon={<IconPlus />}
              disabled={!admin && !!pendingApp}
              onClick={() => setApplyVisible(true)}
              style={{
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-gradient)',
                border: 'none',
                fontWeight: 600,
              }}
            >
              {admin ? t('创建团队') : t('申请创建团队')}
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Pending application banner */}
      {pendingApp && !admin && (
        <Banner
          type='info'
          icon={<IconClock />}
          closeIcon={null}
          fullMode={false}
          description={
            <div className='flex items-center justify-between gap-3 w-full'>
              <span>
                {t('您的团队创建申请')} <strong>「{pendingApp.name}」</strong>{' '}
                {t('正在等待管理员审核')}
              </span>
              <Button size='small' type='tertiary' onClick={() => handleWithdraw(pendingApp.id)}>
                {t('撤回申请')}
              </Button>
            </div>
          }
          style={{ marginBottom: 16, borderRadius: 'var(--radius-md)' }}
        />
      )}

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
            {admin
              ? t('创建一个团队或使用邀请码加入')
              : t('提交申请或使用邀请码加入团队')}
          </Text>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          {teams.map((item) => {
            const team = item.team;
            const role = item.role;
            const memberCount = item.member_count;

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

                <div className='flex items-center text-xs' style={{ color: 'var(--text-muted)' }}>
                  <span className='flex items-center gap-1'>
                    <Users size={12} />
                    {memberCount} {t('位成员')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Application history (non-admin only — admins see review list separately) */}
      {!admin && applications.length > 0 && (
        <div className='mt-10'>
          <div className='flex items-center gap-2 mb-3'>
            <FileText size={16} style={{ color: 'var(--text-muted)' }} />
            <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t('我的申请记录')}
            </Text>
          </div>
          <div
            className='rounded-[var(--radius-lg)] overflow-hidden'
            style={{ border: '1px solid var(--border-default)', background: 'var(--surface)' }}
          >
            {applications.map((app, i) => (
              <div
                key={app.id}
                className='flex items-center justify-between px-4 py-3'
                style={{
                  borderTop: i === 0 ? 'none' : '1px solid var(--border-default)',
                }}
              >
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Text strong style={{ color: 'var(--text-primary)' }}>{app.name}</Text>
                    {renderAppStatus(app.status)}
                  </div>
                  {app.review_comment && (
                    <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {t('审核意见')}: {app.review_comment}
                    </Text>
                  )}
                </div>
                <Text style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {new Date(app.created_at * 1000).toLocaleString()}
                </Text>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apply / Create modal */}
      <Modal
        title={admin ? t('创建团队') : t('申请创建团队')}
        visible={applyVisible}
        onCancel={() => setApplyVisible(false)}
        footer={null}
        centered
        size='small'
      >
        <div className='space-y-4 pb-2'>
          <div>
            <Text style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              {t('团队名称')}
            </Text>
            <Input
              value={teamName}
              onChange={setTeamName}
              placeholder={t('输入团队名称')}
              showClear
              style={{ borderRadius: 'var(--radius-md)' }}
            />
          </div>
          {!admin && (
            <div>
              <Text style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                {t('申请理由')}
              </Text>
              <TextArea
                value={teamReason}
                onChange={setTeamReason}
                placeholder={t('简单描述团队用途，方便管理员审核')}
                rows={4}
                maxLength={2000}
                showCounter
                style={{ borderRadius: 'var(--radius-md)' }}
              />
            </div>
          )}
          <Button
            theme='solid'
            type='primary'
            block
            loading={submitting}
            onClick={handleSubmit}
            style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', border: 'none', fontWeight: 600, height: 40 }}
          >
            {admin ? t('创建') : t('提交申请')}
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
