/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/

import React, { useEffect, useState } from 'react';
import {
  Banner,
  Button,
  Input,
  InputNumber,
  Modal,
  Select,
  Skeleton,
  Table,
  Tag,
  Typography,
} from '@douyinfe/semi-ui';
import { IconCopy, IconDelete, IconPlus, IconRefresh } from '@douyinfe/semi-icons';
import { ArrowLeft, Crown, Key } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API, renderQuota, showError, showSuccess } from '../../helpers';
import { displayAmountToQuota, quotaToDisplayAmount } from '../../helpers/quota';
import { copy } from '../../helpers/utils';

const { Text } = Typography;

const TeamDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [team, setTeam] = useState(null);
  const [myRole, setMyRole] = useState(0);
  const [members, setMembers] = useState([]);
  const [teamTokens, setTeamTokens] = useState([]);
  const [teamSubs, setTeamSubs] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add member modal
  const [addMemberVisible, setAddMemberVisible] = useState(false);
  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  // Team-owned token modal
  const [teamTokenModalVisible, setTeamTokenModalVisible] = useState(false);
  const [teamTokenName, setTeamTokenName] = useState('');
  const [creatingTeamToken, setCreatingTeamToken] = useState(false);
  const [createdTeamTokenKey, setCreatedTeamTokenKey] = useState('');
  // Member the new token is issued on behalf of. 0 = the issuing admin.
  const [teamTokenUserId, setTeamTokenUserId] = useState(0);

  // Per-member quota-limit editing
  const [quotaModalVisible, setQuotaModalVisible] = useState(false);
  const [quotaTarget, setQuotaTarget] = useState(null); // { userId, name }
  const [quotaAmount, setQuotaAmount] = useState(0); // display amount (0 = unlimited)
  const [savingQuota, setSavingQuota] = useState(false);

  const isOwner = myRole >= 100;
  const isAdmin = myRole >= 10;

  const loadTeam = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/api/team/${id}`);
      if (res.data?.success) {
        setTeam(res.data.data.team);
        setMyRole(res.data.data.role);
      } else {
        showError(res.data?.message || t('加载失败'));
        navigate('/console/team');
      }
    } catch {
      navigate('/console/team');
    }
    setLoading(false);
  };

  const loadMembers = async () => {
    try {
      const res = await API.get(`/api/team/${id}/member`);
      if (res.data?.success) setMembers(res.data.data || []);
    } catch {
      // empty list on failure
    }
  };

  const loadTeamTokens = async () => {
    try {
      const res = await API.get(`/api/team/${id}/team-token`);
      if (res.data?.success) setTeamTokens(res.data.data || []);
    } catch {
      // empty list on failure
    }
  };

  const loadTeamSubs = async () => {
    try {
      const res = await API.get(`/api/team/${id}/subscription`);
      if (res.data?.success) setTeamSubs(res.data.data?.subscriptions || []);
    } catch {
      // empty list on failure
    }
  };

  // Usage stats are admin-only on the backend (TeamRoleAdmin). Members get a
  // 403 here, so we silently keep usage null for them.
  const loadUsage = async () => {
    try {
      const res = await API.get(`/api/team/${id}/usage`);
      if (res.data?.success) setUsage(res.data.data?.usage || null);
    } catch {
      // non-admin or query failure: hide the usage section
    }
  };

  useEffect(() => {
    loadTeam();
    loadMembers();
    loadTeamTokens();
    loadTeamSubs();
    loadUsage();
  }, [id]);

  const handleAddMember = async () => {
    const uid = parseInt(addMemberUserId);
    if (!uid || uid <= 0) {
      showError(t('请输入有效的用户ID'));
      return;
    }
    setAddingMember(true);
    try {
      const res = await API.post(`/api/team/${id}/member`, { user_id: uid });
      if (res.data?.success) {
        showSuccess(t('成员添加成功'));
        setAddMemberVisible(false);
        setAddMemberUserId('');
        loadMembers();
      } else {
        showError(res.data?.message || t('添加失败'));
      }
    } catch {
      showError(t('请求失败'));
    }
    setAddingMember(false);
  };

  const handleRemoveMember = (userId, username) => {
    Modal.confirm({
      title: t('确认移除'),
      content: `${t('确定要移除成员')} ${username || userId}?`,
      centered: true,
      onOk: async () => {
        try {
          const res = await API.delete(`/api/team/${id}/member/${userId}`);
          if (res.data?.success) {
            showSuccess(t('已移除'));
            loadMembers();
          } else {
            showError(res.data?.message || t('移除失败'));
          }
        } catch {
          showError(t('请求失败'));
        }
      },
    });
  };

  const openQuotaModal = (userId, name, currentLimitQuota) => {
    setQuotaTarget({ userId, name });
    setQuotaAmount(currentLimitQuota > 0 ? quotaToDisplayAmount(currentLimitQuota) : 0);
    setQuotaModalVisible(true);
  };

  const handleSaveQuota = async () => {
    if (!quotaTarget) return;
    setSavingQuota(true);
    try {
      const quotaLimit = quotaAmount > 0 ? displayAmountToQuota(quotaAmount) : 0;
      const res = await API.put(
        `/api/team/${id}/member/${quotaTarget.userId}/quota`,
        { quota_limit: quotaLimit },
      );
      if (res.data?.success) {
        showSuccess(t('已保存'));
        setQuotaModalVisible(false);
        setQuotaTarget(null);
        loadMembers();
      } else {
        showError(res.data?.message || t('保存失败'));
      }
    } catch {
      showError(t('请求失败'));
    }
    setSavingQuota(false);
  };

  const handleRegenerateInvite = async () => {
    try {
      const res = await API.post(`/api/team/${id}/invite`);
      if (res.data?.success) {
        showSuccess(t('邀请码已重新生成'));
        loadTeam();
      } else {
        showError(res.data?.message || t('操作失败'));
      }
    } catch {
      showError(t('请求失败'));
    }
  };

  const handleCreateTeamToken = async () => {
    setCreatingTeamToken(true);
    try {
      const res = await API.post(`/api/team/${id}/team-token`, {
        name: teamTokenName.trim(),
        user_id: teamTokenUserId || 0,
      });
      if (res.data?.success) {
        const key = res.data.data?.key || '';
        setCreatedTeamTokenKey(key);
        setTeamTokenName('');
        setTeamTokenUserId(0);
        loadTeamTokens();
      } else {
        showError(res.data?.message || t('创建失败'));
      }
    } catch {
      showError(t('请求失败'));
    }
    setCreatingTeamToken(false);
  };

  const handleDeleteTeamToken = (tokenId) => {
    Modal.confirm({
      title: t('确认删除'),
      content: t('删除后该团队令牌将立即失效，且无法恢复。'),
      centered: true,
      onOk: async () => {
        try {
          const res = await API.delete(`/api/team/${id}/team-token/${tokenId}`);
          if (res.data?.success) {
            showSuccess(t('已删除'));
            loadTeamTokens();
          } else {
            showError(res.data?.message || t('删除失败'));
          }
        } catch {
          showError(t('请求失败'));
        }
      },
    });
  };

  const handleBuyTeamSubscription = () => {
    navigate(`/plans?team_id=${id}`);
  };

  if (loading || !team) {
    return (
      <div className='w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12'>
        <Skeleton.Title active style={{ width: '40%', marginBottom: 24 }} />
        <Skeleton.Paragraph active rows={6} />
      </div>
    );
  }

  // user_id -> display label, for showing a team token's owning member.
  const memberNameById = {};
  members.forEach((m) => {
    const uid = m.member?.user_id;
    if (uid) memberNameById[uid] = m.display_name || m.username || `User #${uid}`;
  });
  // Options for the "issue on behalf of" selector. 0 = the issuing admin.
  const memberOptions = [
    { value: 0, label: t('我自己（管理员）') },
    ...members
      .filter((m) => m.member?.user_id)
      .map((m) => ({
        value: m.member.user_id,
        label: `${m.display_name || m.username} @${m.username}`,
      })),
  ];

  const memberColumns = [
    {
      title: t('用户'),
      dataIndex: 'username',
      render: (text, record) => (
        <div>
          <Text strong>{record.display_name || text}</Text>
          <Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>
            @{text}
          </Text>
        </div>
      ),
    },
    {
      title: t('角色'),
      dataIndex: 'member',
      width: 100,
      render: (_, record) => {
        const r = record.member?.role || 0;
        return r >= 100 ? (
          <Tag color='amber'>{t('创建者')}</Tag>
        ) : r >= 10 ? (
          <Tag color='blue'>{t('管理员')}</Tag>
        ) : (
          <Tag>{t('成员')}</Tag>
        );
      },
    },
    {
      title: t('加入时间'),
      dataIndex: 'member',
      width: 170,
      render: (_, record) => (
        <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {record.member?.joined_at
            ? new Date(record.member.joined_at * 1000).toLocaleString()
            : '—'}
        </Text>
      ),
    },
    {
      title: t('额度上限'),
      dataIndex: 'member',
      width: 190,
      render: (_, record) => {
        const m = record.member || {};
        const limit = m.quota_limit || 0;
        const used = m.used_quota || 0;
        const isOwnerMember = m.role >= 100;
        return (
          <div className='flex items-center gap-2'>
            <Text style={{ fontSize: 12 }}>
              {renderQuota(used)} / {limit > 0 ? renderQuota(limit) : t('不限')}
            </Text>
            {isAdmin && !isOwnerMember && (
              <Button
                size='small'
                theme='borderless'
                type='tertiary'
                onClick={() =>
                  openQuotaModal(m.user_id, record.display_name || record.username, limit)
                }
              >
                {t('设置')}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (isOwner) {
    memberColumns.push({
      title: t('操作'),
      width: 100,
      render: (_, record) => {
        const userId = record.member?.user_id;
        const isOwnerMember = record.member?.role >= 100;
        return isOwnerMember ? null : (
          <Button
            size='small'
            theme='light'
            type='danger'
            onClick={() => handleRemoveMember(userId, record.username)}
          >
            {t('移除')}
          </Button>
        );
      },
    });
  }

  return (
    <div className='w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8'>
      {/* Header */}
      <div>
        <Button
          theme='borderless'
          type='tertiary'
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate('/console/team')}
          style={{ marginBottom: 12, borderRadius: 'var(--radius-md)' }}
        >
          {t('返回团队列表')}
        </Button>
        <div className='flex items-center justify-between flex-wrap gap-4'>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {team.name}
          </h1>
          {isOwner && (
            <Button
              theme='light'
              type='primary'
              icon={<IconPlus />}
              onClick={() => setAddMemberVisible(true)}
              style={{ borderRadius: 'var(--radius-md)' }}
            >
              {t('添加成员')}
            </Button>
          )}
        </div>
      </div>

      {/* Stats cards: members count + invite link */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
        <div
          className='rounded-[var(--radius-lg)] p-5'
          style={{ background: 'var(--surface)', border: '1px solid var(--border-default)' }}
        >
          <p
            className='text-[10px] uppercase tracking-widest font-semibold mb-1'
            style={{ color: 'var(--text-muted)' }}
          >
            {t('成员')}
          </p>
          <p
            className='text-2xl font-extrabold'
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}
          >
            {members.length}
          </p>
          <p className='text-xs mt-2' style={{ color: 'var(--text-muted)' }}>
            {t('包含创建者与全部加入的成员')}
          </p>
        </div>

        <div
          className='rounded-[var(--radius-lg)] p-5'
          style={{ background: 'var(--surface)', border: '1px solid var(--border-default)' }}
        >
          <p
            className='text-[10px] uppercase tracking-widest font-semibold mb-1'
            style={{ color: 'var(--text-muted)' }}
          >
            {t('邀请链接')}
          </p>
          <div className='flex items-center gap-2 mt-1'>
            <code
              className='text-xs font-bold truncate'
              style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}
            >
              {`${window.location.origin}/console/team/join/${team.invite_code}`}
            </code>
            <Button
              size='small'
              theme='borderless'
              type='tertiary'
              icon={<IconCopy />}
              onClick={() => {
                copy(`${window.location.origin}/console/team/join/${team.invite_code}`);
                showSuccess(t('已复制邀请链接'));
              }}
            />
            {isOwner && (
              <Button
                size='small'
                theme='borderless'
                type='tertiary'
                icon={<IconRefresh />}
                onClick={handleRegenerateInvite}
              />
            )}
          </div>
          <p className='text-xs mt-2' style={{ color: 'var(--text-muted)' }}>
            {t('分享邀请链接邀请成员加入')}
          </p>
        </div>
      </div>

      {/* Members table */}
      <div>
        <h2
          className='text-lg font-bold mb-4'
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
        >
          {t('成员列表')}
        </h2>
        <Table
          columns={memberColumns}
          dataSource={members}
          rowKey={(record) => record.member?.id}
          pagination={false}
          size='small'
          style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
        />
      </div>

      {/* Member usage stats (admin only) */}
      {isAdmin && usage && (
        <div>
          <h2
            className='text-lg font-bold mb-4'
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
          >
            {t('成员用量')}
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-5 mb-4'>
            {[
              { label: t('今日消费'), value: usage.summary?.today_quota || 0, req: usage.summary?.today_requests || 0 },
              { label: t('本月消费'), value: usage.summary?.month_quota || 0, req: usage.summary?.month_requests || 0 },
              { label: t('累计消费'), value: usage.summary?.total_quota || 0, req: usage.summary?.total_requests || 0 },
            ].map((card) => (
              <div
                key={card.label}
                className='rounded-[var(--radius-lg)] p-5'
                style={{ background: 'var(--surface)', border: '1px solid var(--border-default)' }}
              >
                <p
                  className='text-[10px] uppercase tracking-widest font-semibold mb-1'
                  style={{ color: 'var(--text-muted)' }}
                >
                  {card.label}
                </p>
                <p
                  className='text-2xl font-extrabold'
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}
                >
                  {renderQuota(card.value)}
                </p>
                <p className='text-xs mt-2' style={{ color: 'var(--text-muted)' }}>
                  {card.req} {t('次请求')}
                </p>
              </div>
            ))}
          </div>
          <Banner
            type='info'
            closeIcon={null}
            description={t('按成员统计近 30 天的请求数与消费额度，数据来自团队令牌的调用记录。')}
            style={{ borderRadius: 'var(--radius-md)', marginBottom: 12 }}
          />
          <Table
            columns={[
              {
                title: t('成员'),
                dataIndex: 'username',
                render: (text, record) => (
                  <div>
                    <Text strong>{record.display_name || text || `User #${record.user_id}`}</Text>
                    {text && (
                      <Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>
                        @{text}
                      </Text>
                    )}
                  </div>
                ),
              },
              {
                title: t('请求数'),
                dataIndex: 'requests',
                width: 120,
                render: (v) => <Text>{v || 0}</Text>,
              },
              {
                title: t('消费额度'),
                dataIndex: 'quota',
                width: 140,
                render: (v) => <Text strong>{renderQuota(v || 0)}</Text>,
              },
            ]}
            dataSource={usage.by_member || []}
            rowKey={(record) => record.user_id}
            pagination={false}
            size='small'
            empty={t('近 30 天暂无消费记录')}
            style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
          />
        </div>
      )}

      {/* Team subscriptions */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h2
            className='text-lg font-bold m-0'
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
          >
            {t('团队订阅')}
          </h2>
          {isOwner && (
            <Button
              size='small'
              theme='solid'
              type='primary'
              icon={<IconPlus />}
              onClick={handleBuyTeamSubscription}
              style={{
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-gradient)',
                border: 'none',
                fontWeight: 600,
              }}
            >
              {t('购买团队订阅')}
            </Button>
          )}
        </div>
        <Banner
          type='info'
          closeIcon={null}
          description={t(
            '团队订阅独立于个人订阅，订阅周期内团队令牌的所有请求会从该订阅扣额度，到期或额度耗尽后自动停用。',
          )}
          style={{ borderRadius: 'var(--radius-md)', marginBottom: 12 }}
        />
        {teamSubs.length === 0 ? (
          <div
            className='text-center py-8 rounded-[var(--radius-lg)]'
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-muted)',
            }}
          >
            <Crown size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
            <Text style={{ fontSize: 13 }}>{t('暂无团队订阅')}</Text>
          </div>
        ) : (
          <div className='space-y-2'>
            {teamSubs.map((item) => {
              const sub = item.subscription || {};
              const total = Number(sub.amount_total || 0);
              const used = Number(sub.amount_used || 0);
              const remain = Math.max(0, total - used);
              const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
              return (
                <div
                  key={sub.id}
                  className='p-3 rounded-[var(--radius-md)]'
                  style={{ background: 'var(--surface)', border: '1px solid var(--border-default)' }}
                >
                  <div className='flex items-center gap-3'>
                    <Crown size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <div className='flex-1 min-w-0'>
                      <Text strong className='truncate block' style={{ fontSize: 13 }}>
                        {`Plan #${sub.plan_id}`}
                      </Text>
                      <Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {t('结束于')}{' '}
                        {sub.end_time ? new Date(sub.end_time * 1000).toLocaleString() : '—'}
                      </Text>
                    </div>
                    <Tag size='small' color={sub.status === 'active' ? 'green' : 'grey'}>
                      {sub.status}
                    </Tag>
                  </div>
                  {total > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div
                        style={{
                          width: '100%',
                          height: 4,
                          borderRadius: 9999,
                          background: 'var(--border-subtle)',
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)' }} />
                      </div>
                      <Text
                        style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}
                      >
                        {t('剩余')} {renderQuota(remain)} / {renderQuota(total)}
                      </Text>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Team-owned tokens */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h2
            className='text-lg font-bold m-0'
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
          >
            {t('团队令牌')}
          </h2>
          {isAdmin && (
            <Button
              size='small'
              theme='light'
              type='primary'
              icon={<IconPlus />}
              onClick={() => {
                setCreatedTeamTokenKey('');
                setTeamTokenName('');
                setTeamTokenUserId(0);
                setTeamTokenModalVisible(true);
              }}
              style={{ borderRadius: 'var(--radius-md)' }}
            >
              {t('创建团队令牌')}
            </Button>
          )}
        </div>
        <Banner
          type='info'
          closeIcon={null}
          description={t('由团队签发的 API 令牌，请求会直接走团队订阅扣费。')}
          style={{ borderRadius: 'var(--radius-md)', marginBottom: 12 }}
        />
        {teamTokens.length === 0 ? (
          <div
            className='text-center py-8 rounded-[var(--radius-lg)]'
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-muted)',
            }}
          >
            <Key size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
            <Text style={{ fontSize: 13 }}>{t('暂无团队令牌')}</Text>
          </div>
        ) : (
          <div className='space-y-2'>
            {teamTokens.map((tk) => (
              <div
                key={tk.id}
                className='flex items-center gap-3 p-3 rounded-[var(--radius-md)]'
                style={{ background: 'var(--surface)', border: '1px solid var(--border-default)' }}
              >
                <Key size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <div className='flex-1 min-w-0'>
                  <Text strong className='truncate block' style={{ fontSize: 13 }}>
                    {tk.name || `Token #${tk.id}`}
                  </Text>
                  <Text
                    style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                  >
                    {tk.key || '****'}
                  </Text>
                  {memberNameById[tk.user_id] && (
                    <Text style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>
                      {t('归属')}：{memberNameById[tk.user_id]}
                    </Text>
                  )}
                </div>
                <Tag size='small' color={tk.status === 1 ? 'green' : 'grey'}>
                  {tk.status === 1 ? t('启用') : t('禁用')}
                </Tag>
                {isAdmin && (
                  <Button
                    size='small'
                    theme='borderless'
                    type='danger'
                    icon={<IconDelete />}
                    onClick={() => handleDeleteTeamToken(tk.id)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add member modal */}
      <Modal
        title={t('添加成员')}
        visible={addMemberVisible}
        onCancel={() => setAddMemberVisible(false)}
        footer={null}
        centered
        size='small'
      >
        <div className='space-y-4 pb-2'>
          <Input
            value={addMemberUserId}
            onChange={setAddMemberUserId}
            placeholder={t('输入用户ID')}
            showClear
            style={{ borderRadius: 'var(--radius-md)' }}
            onEnterPress={handleAddMember}
          />
          <Banner
            type='info'
            closeIcon={null}
            description={t('也可以分享邀请码让成员自行加入')}
            style={{ borderRadius: 'var(--radius-md)' }}
          />
          <Button
            theme='solid'
            type='primary'
            block
            loading={addingMember}
            onClick={handleAddMember}
            style={{
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-gradient)',
              border: 'none',
              fontWeight: 600,
              height: 40,
            }}
          >
            {t('添加')}
          </Button>
        </div>
      </Modal>

      {/* Create team token modal */}
      <Modal
        title={createdTeamTokenKey ? t('团队令牌已创建') : t('创建团队令牌')}
        visible={teamTokenModalVisible}
        onCancel={() => {
          setTeamTokenModalVisible(false);
          setCreatedTeamTokenKey('');
          setTeamTokenName('');
        }}
        footer={null}
        centered
        size='small'
      >
        {createdTeamTokenKey ? (
          <div className='space-y-4 pb-2'>
            <Banner
              type='warning'
              closeIcon={null}
              description={t('请立即复制密钥，关闭后将无法再次查看完整密钥。')}
              style={{ borderRadius: 'var(--radius-md)' }}
            />
            <div
              className='flex items-center gap-2 p-3 rounded-[var(--radius-md)]'
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}
            >
              <code className='flex-1 truncate' style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                sk-{createdTeamTokenKey}
              </code>
              <Button
                size='small'
                theme='borderless'
                type='primary'
                icon={<IconCopy />}
                onClick={() => {
                  copy(`sk-${createdTeamTokenKey}`);
                  showSuccess(t('已复制'));
                }}
              />
            </div>
            <Button
              theme='solid'
              type='primary'
              block
              onClick={() => {
                setTeamTokenModalVisible(false);
                setCreatedTeamTokenKey('');
              }}
              style={{
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-gradient)',
                border: 'none',
                fontWeight: 600,
                height: 40,
              }}
            >
              {t('完成')}
            </Button>
          </div>
        ) : (
          <div className='space-y-4 pb-2'>
            <Input
              value={teamTokenName}
              onChange={setTeamTokenName}
              placeholder={t('令牌名称（可选）')}
              showClear
              style={{ borderRadius: 'var(--radius-md)' }}
              onEnterPress={handleCreateTeamToken}
            />
            <div>
              <Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                {t('归属成员')}
              </Text>
              <Select
                value={teamTokenUserId}
                onChange={setTeamTokenUserId}
                optionList={memberOptions}
                style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
              />
            </div>
            <Banner
              type='info'
              closeIcon={null}
              description={t('令牌归属到某成员后，该成员的用量与限流将单独统计；请求仍从团队订阅扣费。')}
              style={{ borderRadius: 'var(--radius-md)' }}
            />
            <Button
              theme='solid'
              type='primary'
              block
              loading={creatingTeamToken}
              onClick={handleCreateTeamToken}
              style={{
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-gradient)',
                border: 'none',
                fontWeight: 600,
                height: 40,
              }}
            >
              {t('创建')}
            </Button>
          </div>
        )}
      </Modal>

      {/* Set member quota limit modal */}
      <Modal
        title={t('设置成员额度上限')}
        visible={quotaModalVisible}
        onCancel={() => setQuotaModalVisible(false)}
        footer={null}
        centered
        size='small'
      >
        <div className='space-y-4 pb-2'>
          {quotaTarget && (
            <Text style={{ fontSize: 13 }}>
              {t('成员')}：<Text strong>{quotaTarget.name}</Text>
            </Text>
          )}
          <div>
            <Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              {t('额度上限')}（{t('0 表示不限制')}）
            </Text>
            <InputNumber
              value={quotaAmount}
              onChange={setQuotaAmount}
              min={0}
              precision={2}
              style={{ width: '100%' }}
            />
          </div>
          <Banner
            type='info'
            closeIcon={null}
            description={t('上限为该成员可消耗的团队订阅额度总量，累计不重置，用尽后该成员的请求将被拒绝。')}
            style={{ borderRadius: 'var(--radius-md)' }}
          />
          <Button
            theme='solid'
            type='primary'
            block
            loading={savingQuota}
            onClick={handleSaveQuota}
            style={{
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-gradient)',
              border: 'none',
              fontWeight: 600,
              height: 40,
            }}
          >
            {t('保存')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default TeamDetail;
