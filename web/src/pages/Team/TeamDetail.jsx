/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/

import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Spin } from '@douyinfe/semi-ui';
import { VChart } from '@visactor/react-vchart';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API, renderQuota, showError, showSuccess } from '../../helpers';
import { displayAmountToQuota, quotaToDisplayAmount } from '../../helpers/quota';
import { copy } from '../../helpers/utils';
import { TIcon } from './teamIcons';
import { avatarColor, formatStableTime, initials } from './teamUiKit';
import './team-design.css';

const CHART_CONFIG = { mode: 'desktop-browser' };

const StatCard = ({ label, value, foot, icon }) => (
  <div className='td-stat-card'>
    <div className='stat-label'>
      {icon}
      {label}
    </div>
    <div className='stat-value'>{value}</div>
    {foot && <div className='stat-foot'>{foot}</div>}
  </div>
);

const RolePill = ({ role, t }) => {
  if (role >= 100) {
    return (
      <span className='td-pill td-pill-gold'>
        <TIcon.Crown />
        {t('创建者')}
      </span>
    );
  }
  if (role >= 10) {
    return (
      <span className='td-pill td-pill-purple'>
        <TIcon.Shield size={11} />
        {t('管理员')}
      </span>
    );
  }
  return (
    <span className='td-pill td-pill-info'>
      <TIcon.Users size={11} />
      {t('成员')}
    </span>
  );
};

// Lightweight td-styled modal host: Semi Modal shell + td-modal body.
const TdModal = ({ visible, onClose, icon, iconKind, title, children }) => (
  <Modal
    visible={visible}
    onCancel={onClose}
    header={null}
    footer={null}
    closable={false}
    centered
    width={460}
    className='td-modal-host'
    bodyStyle={{ padding: 0 }}
  >
    <div className='td-modal'>
      <div className='td-modal-head'>
        <div className='left'>
          <div className={'ic-wrap' + (iconKind ? ' ' + iconKind : '')}>{icon}</div>
          <div>
            <h3>{title}</h3>
          </div>
        </div>
        <button type='button' className='td-modal-close' onClick={onClose}>
          <TIcon.X />
        </button>
      </div>
      {children}
    </div>
  </Modal>
);

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
  const [activeTab, setActiveTab] = useState('members');

  // Add member modal
  const [addMemberVisible, setAddMemberVisible] = useState(false);
  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  // Team-owned token modal
  const [teamTokenModalVisible, setTeamTokenModalVisible] = useState(false);
  const [teamTokenName, setTeamTokenName] = useState('');
  const [creatingTeamToken, setCreatingTeamToken] = useState(false);
  const [createdTeamTokenKey, setCreatedTeamTokenKey] = useState('');
  const [teamTokenUserId, setTeamTokenUserId] = useState(0);

  // Per-member quota-limit editing
  const [quotaModalVisible, setQuotaModalVisible] = useState(false);
  const [quotaTarget, setQuotaTarget] = useState(null); // { userId, name }
  const [quotaAmount, setQuotaAmount] = useState(0);
  const [savingQuota, setSavingQuota] = useState(false);

  // Destructive confirmations
  const [removeTarget, setRemoveTarget] = useState(null); // { userId, name }
  const [deleteTokenTarget, setDeleteTokenTarget] = useState(null); // { id, name }

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
      // non-admin or query failure: hide the usage tab
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

  const handleRemoveMember = async () => {
    if (!removeTarget) return;
    try {
      const res = await API.delete(`/api/team/${id}/member/${removeTarget.userId}`);
      if (res.data?.success) {
        showSuccess(t('已移除'));
        setRemoveTarget(null);
        loadMembers();
      } else {
        showError(res.data?.message || t('移除失败'));
      }
    } catch {
      showError(t('请求失败'));
    }
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
      const quotaLimit = Number(quotaAmount) > 0 ? displayAmountToQuota(quotaAmount) : 0;
      const res = await API.put(`/api/team/${id}/member/${quotaTarget.userId}/quota`, {
        quota_limit: quotaLimit,
      });
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

  const handleDeleteTeamToken = async () => {
    if (!deleteTokenTarget) return;
    try {
      const res = await API.delete(`/api/team/${id}/team-token/${deleteTokenTarget.id}`);
      if (res.data?.success) {
        showSuccess(t('已删除'));
        setDeleteTokenTarget(null);
        loadTeamTokens();
      } else {
        showError(res.data?.message || t('删除失败'));
      }
    } catch {
      showError(t('请求失败'));
    }
  };

  const handleBuyTeamSubscription = () => {
    navigate(`/plans?team_id=${id}`);
  };

  // Derived helpers
  const memberNameById = useMemo(() => {
    const map = {};
    members.forEach((m) => {
      const uid = m.member?.user_id;
      if (uid) map[uid] = m.display_name || m.username || `#${uid}`;
    });
    return map;
  }, [members]);

  const memberOptions = useMemo(
    () => [
      { value: 0, label: t('我自己（管理员）') },
      ...members
        .filter((m) => m.member?.user_id)
        .map((m) => ({
          value: m.member.user_id,
          label: `${m.display_name || m.username} @${m.username}`,
        })),
    ],
    [members, t],
  );

  const ownerName = useMemo(() => {
    const o = members.find((m) => (m.member?.role || 0) >= 100);
    return o ? o.display_name || o.username : '';
  }, [members]);

  const activeSubCount = useMemo(
    () => teamSubs.filter((it) => (it.subscription || {}).status === 'active').length,
    [teamSubs],
  );

  const trendSpec = useMemo(() => {
    if (!usage?.daily) return null;
    return {
      type: 'area',
      data: [{ id: 'usage', values: usage.daily || [] }],
      xField: 'date',
      yField: 'quota',
      line: { style: { stroke: '#0072ff', lineWidth: 2, curveType: 'monotone' } },
      area: {
        style: {
          fill: {
            gradient: 'linear',
            x0: 0,
            y0: 0,
            x1: 0,
            y1: 1,
            stops: [
              { offset: 0, color: '#00c6ff', opacity: 0.35 },
              { offset: 1, color: '#0072ff', opacity: 0.04 },
            ],
          },
          curveType: 'monotone',
        },
      },
      point: { visible: false },
      axes: [
        { orient: 'bottom', label: { style: { fontSize: 10, fill: '#8593a3' } } },
        {
          orient: 'left',
          label: { style: { fontSize: 10, fill: '#8593a3' } },
          grid: { style: { lineDash: [3, 3], stroke: 'rgba(128,128,128,0.15)' } },
        },
      ],
      legends: { visible: false },
      tooltip: {
        mark: {
          content: [
            { key: () => t('消费'), value: (datum) => renderQuota(datum.quota || 0) },
            { key: () => t('请求'), value: (datum) => `${datum.requests || 0}` },
          ],
        },
      },
    };
  }, [usage, t]);

  if (loading || !team) {
    return (
      <div className='team-design w-full max-w-[1240px] mx-auto px-7 pt-7 pb-20'>
        <div className='py-20 text-center'>
          <Spin size='large' />
        </div>
      </div>
    );
  }

  const inviteUrl = `${window.location.origin}/console/team/join/${team.invite_code}`;
  const summary = usage?.summary || {};
  const tabs = [
    { key: 'members', label: t('成员'), icon: <TIcon.Users /> },
    { key: 'tokens', label: t('Token'), icon: <TIcon.Key /> },
    { key: 'subscriptions', label: t('订阅'), icon: <TIcon.Sub /> },
    ...(isAdmin && usage ? [{ key: 'usage', label: t('用量'), icon: <TIcon.Activity /> }] : []),
  ];

  return (
    <div className='team-design w-full max-w-[1240px] mx-auto px-7 pt-7 pb-20'>
      <button
        type='button'
        className='td-back-link'
        onClick={() => navigate('/console/team')}
      >
        <TIcon.ArrowLeft />
        {t('返回团队列表')}
      </button>

      <div className='td-detail-head'>
        <div className={'td-avatar lg ' + avatarColor(team.id)}>{initials(team.name)}</div>
        <div className='ident'>
          <div className='name-row'>
            <h2>{team.name}</h2>
            {team.status === 1 ? (
              <span className='td-pill td-pill-ok'>● {t('正常')}</span>
            ) : (
              <span className='td-pill td-pill-danger'>● {t('已禁用')}</span>
            )}
          </div>
          <div className='meta-row'>
            {ownerName && (
              <span>
                <TIcon.Crown />
                {t('创建者')} <strong>{ownerName}</strong>
              </span>
            )}
            <span style={{ color: 'var(--td-ink-300)' }}>·</span>
            <span>
              <TIcon.Calendar />
              {t('创建于')} {formatStableTime(team.created_at)}
            </span>
            <span style={{ color: 'var(--td-ink-300)' }}>·</span>
            <span className='td-mono' style={{ color: 'var(--td-ink-400)' }}>
              ID #{team.id}
            </span>
          </div>
        </div>
        <div className='actions'>
          {isOwner && (
            <button
              type='button'
              className='td-btn td-btn-ghost'
              onClick={handleBuyTeamSubscription}
            >
              <TIcon.Sub />
              {t('购买团队订阅')}
            </button>
          )}
          {isOwner && (
            <button
              type='button'
              className='td-btn td-btn-primary'
              onClick={() => setAddMemberVisible(true)}
            >
              <TIcon.UserPlus />
              {t('添加成员')}
            </button>
          )}
        </div>
      </div>

      <div className='td-stat-strip'>
        <StatCard
          label={t('成员')}
          value={members.length}
          icon={<TIcon.Users />}
          foot={t('包含创建者')}
        />
        <StatCard
          label={t('活跃订阅')}
          value={activeSubCount}
          icon={<TIcon.Sub />}
          foot={activeSubCount === 0 ? t('暂无订阅') : t('正在使用')}
        />
        <StatCard
          label={t('今日消费')}
          value={renderQuota(summary.today_quota || 0)}
          icon={<TIcon.Coin />}
          foot={`${summary.today_requests || 0} ${t('次请求')}`}
        />
        <StatCard
          label={t('本月消费')}
          value={renderQuota(summary.month_quota || 0)}
          icon={<TIcon.Wallet />}
          foot={t('自然月累计')}
        />
      </div>

      <div className='td-invite-card' style={{ marginBottom: 16 }}>
        <div className='stat-label'>
          <TIcon.Link />
          {t('邀请链接')}
        </div>
        <div className='td-invite-row'>
          <div className='td-invite-link'>{inviteUrl}</div>
          <button
            type='button'
            className='td-icon-btn'
            title={t('复制')}
            onClick={() => {
              copy(inviteUrl);
              showSuccess(t('已复制邀请链接'));
            }}
          >
            <TIcon.Copy />
          </button>
          {isOwner && (
            <button
              type='button'
              className='td-icon-btn'
              title={t('重新生成')}
              onClick={handleRegenerateInvite}
            >
              <TIcon.Refresh />
            </button>
          )}
        </div>
      </div>

      <div className='td-sub-tabs'>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type='button'
            className={'td-sub-tab' + (activeTab === tab.key ? ' active' : '')}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Members tab ─── */}
      {activeTab === 'members' && (
        <>
          <div className='td-section-head'>
            <div>
              <div className='title'>{t('成员列表')}</div>
              <div className='meta'>
                {t('共')} {members.length} {t('位成员')}
              </div>
            </div>
            {isOwner && (
              <div className='actions'>
                <button
                  type='button'
                  className='td-btn td-btn-primary td-btn-sm'
                  onClick={() => setAddMemberVisible(true)}
                >
                  <TIcon.UserPlus />
                  {t('添加成员')}
                </button>
              </div>
            )}
          </div>

          <div className='td-table-card'>
            <div className='td-table-scroll'>
              <table className='td-t'>
                <thead>
                  <tr>
                    <th>{t('用户')}</th>
                    <th style={{ width: 130 }}>{t('角色')}</th>
                    <th style={{ width: 210 }}>{t('额度上限')}</th>
                    <th style={{ width: 170 }}>{t('加入时间')}</th>
                    {isOwner && (
                      <th className='actions' style={{ width: 100 }}>
                        {t('操作')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isOwner ? 5 : 4}
                        style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--td-ink-400)' }}
                      >
                        {t('暂无成员')}
                      </td>
                    </tr>
                  ) : (
                    members.map((m) => {
                      const mm = m.member || {};
                      const role = mm.role || 0;
                      const isOwnerMember = role >= 100;
                      const limit = mm.quota_limit || 0;
                      const used = mm.used_quota || 0;
                      return (
                        <tr key={mm.id || mm.user_id}>
                          <td>
                            <div className='td-user-cell'>
                              <div className={'td-avatar ' + avatarColor(mm.user_id)}>
                                {initials(m.display_name || m.username)}
                              </div>
                              <div className='info'>
                                <div className='name'>
                                  {m.display_name || m.username || `#${mm.user_id}`}
                                </div>
                                <div className='sub'>{m.email || `@${m.username || mm.user_id}`}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <RolePill role={role} t={t} />
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 12.5 }}>
                                {renderQuota(used)} /{' '}
                                {limit > 0 ? renderQuota(limit) : t('不限')}
                              </span>
                              {isAdmin && !isOwnerMember && (
                                <button
                                  type='button'
                                  className='td-btn td-btn-ghost td-btn-sm'
                                  onClick={() =>
                                    openQuotaModal(
                                      mm.user_id,
                                      m.display_name || m.username,
                                      limit,
                                    )
                                  }
                                >
                                  {t('设置')}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className='td-mono' style={{ color: 'var(--td-ink-500)', fontSize: 12 }}>
                            {formatStableTime(mm.joined_at)}
                          </td>
                          {isOwner && (
                            <td className='actions'>
                              {isOwnerMember ? (
                                <span style={{ fontSize: 11.5, color: 'var(--td-ink-400)' }}>—</span>
                              ) : (
                                <button
                                  type='button'
                                  className='td-icon-btn danger'
                                  title={t('移除')}
                                  onClick={() =>
                                    setRemoveTarget({
                                      userId: mm.user_id,
                                      name: m.display_name || m.username || `#${mm.user_id}`,
                                    })
                                  }
                                >
                                  <TIcon.Trash />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── Tokens tab ─── */}
      {activeTab === 'tokens' && (
        <>
          <div className='td-section-head'>
            <div>
              <div className='title'>{t('团队令牌')}</div>
              <div className='meta'>{t('由团队签发的 API 令牌，请求会直接走团队订阅扣费。')}</div>
            </div>
            {isAdmin && (
              <div className='actions'>
                <button
                  type='button'
                  className='td-btn td-btn-primary td-btn-sm'
                  onClick={() => {
                    setCreatedTeamTokenKey('');
                    setTeamTokenName('');
                    setTeamTokenUserId(0);
                    setTeamTokenModalVisible(true);
                  }}
                >
                  <TIcon.Plus />
                  {t('创建团队令牌')}
                </button>
              </div>
            )}
          </div>

          {teamTokens.length === 0 ? (
            <div className='td-empty-mini'>
              <div className='td-empty-mini-ic'>
                <TIcon.Key size={18} />
              </div>
              <div>{t('暂无团队令牌')}</div>
            </div>
          ) : (
            <div className='td-table-card'>
              <div className='td-table-scroll'>
                <table className='td-t'>
                  <thead>
                    <tr>
                      <th>{t('名称')}</th>
                      <th>{t('密钥')}</th>
                      <th style={{ width: 160 }}>{t('归属')}</th>
                      <th style={{ width: 90 }}>{t('状态')}</th>
                      {isAdmin && (
                        <th className='actions' style={{ width: 80 }}>
                          {t('操作')}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {teamTokens.map((tk) => (
                      <tr key={tk.id}>
                        <td>
                          <strong>{tk.name || `Token #${tk.id}`}</strong>
                        </td>
                        <td className='td-mono' style={{ fontSize: 12, color: 'var(--td-ink-500)' }}>
                          {tk.key ? `sk-${tk.key}` : '****'}
                        </td>
                        <td style={{ fontSize: 12.5 }}>{memberNameById[tk.user_id] || '—'}</td>
                        <td>
                          {tk.status === 1 ? (
                            <span className='td-pill td-pill-ok'>● {t('启用')}</span>
                          ) : (
                            <span className='td-pill td-pill-danger'>● {t('禁用')}</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className='actions'>
                            <button
                              type='button'
                              className='td-icon-btn danger'
                              title={t('删除')}
                              onClick={() => setDeleteTokenTarget({ id: tk.id, name: tk.name })}
                            >
                              <TIcon.Trash />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Subscriptions tab ─── */}
      {activeTab === 'subscriptions' && (
        <>
          <div className='td-section-head'>
            <div>
              <div className='title'>{t('团队订阅')}</div>
              <div className='meta'>
                {t('团队订阅独立于个人订阅，订阅周期内团队令牌的所有请求会从该订阅扣额度，到期或额度耗尽后自动停用。')}
              </div>
            </div>
            {isOwner && (
              <div className='actions'>
                <button
                  type='button'
                  className='td-btn td-btn-primary td-btn-sm'
                  onClick={handleBuyTeamSubscription}
                >
                  <TIcon.Plus />
                  {t('购买团队订阅')}
                </button>
              </div>
            )}
          </div>

          {teamSubs.length === 0 ? (
            <div className='td-empty-mini'>
              <div className='td-empty-mini-ic'>
                <TIcon.Sub size={18} />
              </div>
              <div>{t('暂无团队订阅')}</div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 14,
              }}
            >
              {teamSubs.map((item) => {
                const sub = item.subscription || {};
                const total = Number(sub.amount_total || 0);
                const used = Number(sub.amount_used || 0);
                const remain = Math.max(0, total - used);
                const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
                return (
                  <div
                    key={sub.id}
                    style={{
                      background: 'var(--td-card)',
                      border: '1px solid var(--td-line)',
                      borderRadius: 12,
                      padding: '14px 16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <strong style={{ fontSize: 14 }}>{`Plan #${sub.plan_id}`}</strong>
                      {sub.status === 'active' ? (
                        <span className='td-pill td-pill-ok'>● {t('生效中')}</span>
                      ) : (
                        <span className='td-pill td-pill-muted'>● {sub.status}</span>
                      )}
                    </div>
                    {total > 0 && (
                      <>
                        <div
                          style={{
                            width: '100%',
                            height: 5,
                            borderRadius: 9999,
                            background: 'var(--td-line)',
                            overflow: 'hidden',
                            marginBottom: 6,
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              background: 'linear-gradient(90deg,#00c6ff,#0072ff)',
                            }}
                          />
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--td-ink-500)' }}>
                          {t('剩余')} {renderQuota(remain)} / {renderQuota(total)}
                        </div>
                      </>
                    )}
                    <div
                      className='td-mono'
                      style={{ fontSize: 12, color: 'var(--td-ink-500)', marginTop: 4 }}
                    >
                      {t('结束于')} {formatStableTime(sub.end_time)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── Usage tab (admin only) ─── */}
      {activeTab === 'usage' && usage && (
        <>
          <div className='td-stat-strip'>
            <StatCard
              label={t('总请求数')}
              value={summary.total_requests || 0}
              icon={<TIcon.Activity />}
            />
            <StatCard
              label={t('累计消费')}
              value={renderQuota(summary.total_quota || 0)}
              icon={<TIcon.Coin />}
            />
            <StatCard
              label={t('今日请求')}
              value={summary.today_requests || 0}
              icon={<TIcon.Clock />}
            />
            <StatCard
              label={t('本月消费')}
              value={renderQuota(summary.month_quota || 0)}
              icon={<TIcon.Wallet />}
            />
          </div>

          <div className='td-section-head'>
            <div>
              <div className='title'>{t('近 30 天消费趋势')}</div>
              <div className='meta'>{t('每日消费与请求数')}</div>
            </div>
          </div>
          <div
            style={{
              background: 'var(--td-card)',
              border: '1px solid var(--td-line)',
              borderRadius: 12,
              padding: 16,
              height: 300,
              marginBottom: 16,
            }}
          >
            {trendSpec && <VChart spec={trendSpec} option={CHART_CONFIG} />}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: 14,
            }}
          >
            <div>
              <div className='td-section-head'>
                <div>
                  <div className='title'>{t('按成员')}</div>
                </div>
              </div>
              <div className='td-table-card'>
                <div className='td-table-scroll'>
                  <table className='td-t'>
                    <thead>
                      <tr>
                        <th>{t('成员')}</th>
                        <th className='num' style={{ width: 90 }}>
                          {t('请求')}
                        </th>
                        <th className='num' style={{ width: 120 }}>
                          {t('消费')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(usage.by_member || []).length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            style={{ textAlign: 'center', padding: 24, color: 'var(--td-ink-400)' }}
                          >
                            {t('近 30 天暂无消费记录')}
                          </td>
                        </tr>
                      ) : (
                        (usage.by_member || []).map((r) => (
                          <tr key={r.user_id}>
                            <td>{r.display_name || r.username || `#${r.user_id}`}</td>
                            <td className='num'>{r.requests || 0}</td>
                            <td className='num'>{renderQuota(r.quota || 0)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <div className='td-section-head'>
                <div>
                  <div className='title'>{t('按令牌')}</div>
                </div>
              </div>
              <div className='td-table-card'>
                <div className='td-table-scroll'>
                  <table className='td-t'>
                    <thead>
                      <tr>
                        <th>{t('令牌')}</th>
                        <th className='num' style={{ width: 90 }}>
                          {t('请求')}
                        </th>
                        <th className='num' style={{ width: 120 }}>
                          {t('消费')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(usage.by_token || []).length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            style={{ textAlign: 'center', padding: 24, color: 'var(--td-ink-400)' }}
                          >
                            {t('暂无数据')}
                          </td>
                        </tr>
                      ) : (
                        (usage.by_token || []).map((r) => (
                          <tr key={r.token_id}>
                            <td>{r.token_name || '—'}</td>
                            <td className='num'>{r.requests || 0}</td>
                            <td className='num'>{renderQuota(r.quota || 0)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Add member modal ─── */}
      <TdModal
        visible={addMemberVisible}
        onClose={() => setAddMemberVisible(false)}
        icon={<TIcon.UserPlus size={18} />}
        title={t('添加成员')}
      >
        <div className='td-modal-body'>
          <div className='td-form-row'>
            <label className='td-form-label'>
              {t('用户ID')}
              <span className='req'>*</span>
            </label>
            <input
              className='td-form-input'
              value={addMemberUserId}
              onChange={(e) => setAddMemberUserId(e.target.value)}
              placeholder={t('输入用户ID')}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
            />
            <div className='td-form-hint'>{t('也可以分享邀请码让成员自行加入')}</div>
          </div>
        </div>
        <div className='td-modal-foot'>
          <button type='button' className='td-btn td-btn-ghost' onClick={() => setAddMemberVisible(false)}>
            {t('取消')}
          </button>
          <button
            type='button'
            className='td-btn td-btn-primary'
            disabled={addingMember}
            onClick={handleAddMember}
          >
            {t('添加')}
          </button>
        </div>
      </TdModal>

      {/* ─── Create team token modal ─── */}
      <TdModal
        visible={teamTokenModalVisible}
        onClose={() => {
          setTeamTokenModalVisible(false);
          setCreatedTeamTokenKey('');
          setTeamTokenName('');
        }}
        icon={<TIcon.Key size={18} />}
        title={createdTeamTokenKey ? t('团队令牌已创建') : t('创建团队令牌')}
      >
        {createdTeamTokenKey ? (
          <>
            <div className='td-modal-body'>
              <div className='td-modal-alert warn'>
                <TIcon.Info />
                {t('请立即复制密钥，关闭后将无法再次查看完整密钥。')}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 12,
                  background: 'var(--td-bg)',
                  border: '1px solid var(--td-line)',
                  borderRadius: 8,
                  padding: '8px 12px',
                }}
              >
                <code
                  className='td-mono'
                  style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12 }}
                >
                  sk-{createdTeamTokenKey}
                </code>
                <button
                  type='button'
                  className='td-icon-btn'
                  title={t('复制')}
                  onClick={() => {
                    copy(`sk-${createdTeamTokenKey}`);
                    showSuccess(t('已复制'));
                  }}
                >
                  <TIcon.Copy />
                </button>
              </div>
            </div>
            <div className='td-modal-foot'>
              <button
                type='button'
                className='td-btn td-btn-primary'
                onClick={() => {
                  setTeamTokenModalVisible(false);
                  setCreatedTeamTokenKey('');
                }}
              >
                {t('完成')}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className='td-modal-body'>
              <div className='td-form-row'>
                <label className='td-form-label'>{t('令牌名称（可选）')}</label>
                <input
                  className='td-form-input'
                  value={teamTokenName}
                  onChange={(e) => setTeamTokenName(e.target.value)}
                  placeholder={t('令牌名称（可选）')}
                />
              </div>
              <div className='td-form-row'>
                <label className='td-form-label'>{t('归属成员')}</label>
                <select
                  className='td-select'
                  value={teamTokenUserId}
                  onChange={(e) => setTeamTokenUserId(Number(e.target.value))}
                >
                  {memberOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <div className='td-form-hint'>
                  {t('令牌归属到某成员后，该成员的用量与限流将单独统计；请求仍从团队订阅扣费。')}
                </div>
              </div>
            </div>
            <div className='td-modal-foot'>
              <button
                type='button'
                className='td-btn td-btn-ghost'
                onClick={() => setTeamTokenModalVisible(false)}
              >
                {t('取消')}
              </button>
              <button
                type='button'
                className='td-btn td-btn-primary'
                disabled={creatingTeamToken}
                onClick={handleCreateTeamToken}
              >
                {t('创建')}
              </button>
            </div>
          </>
        )}
      </TdModal>

      {/* ─── Set member quota modal ─── */}
      <TdModal
        visible={quotaModalVisible}
        onClose={() => setQuotaModalVisible(false)}
        icon={<TIcon.Coin size={18} />}
        title={t('设置成员额度上限')}
      >
        <div className='td-modal-body'>
          {quotaTarget && (
            <div className='td-form-row'>
              <label className='td-form-label'>{t('成员')}</label>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{quotaTarget.name}</div>
            </div>
          )}
          <div className='td-form-row'>
            <label className='td-form-label'>{t('额度上限')}</label>
            <input
              className='td-form-input'
              type='number'
              min={0}
              step='0.01'
              value={quotaAmount}
              onChange={(e) => setQuotaAmount(e.target.value)}
            />
            <div className='td-form-hint'>
              {t('上限为该成员可消耗的团队订阅额度总量，累计不重置，用尽后该成员的请求将被拒绝。')}
              （{t('0 表示不限制')}）
            </div>
          </div>
        </div>
        <div className='td-modal-foot'>
          <button type='button' className='td-btn td-btn-ghost' onClick={() => setQuotaModalVisible(false)}>
            {t('取消')}
          </button>
          <button
            type='button'
            className='td-btn td-btn-primary'
            disabled={savingQuota}
            onClick={handleSaveQuota}
          >
            {t('保存')}
          </button>
        </div>
      </TdModal>

      {/* ─── Remove member confirm ─── */}
      <TdModal
        visible={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        icon={<TIcon.UserMinus size={18} />}
        iconKind='danger'
        title={t('确认移除')}
      >
        <div className='td-modal-body'>
          <p style={{ fontSize: 13.5, color: 'var(--td-ink-600)', margin: 0 }}>
            {t('确定要移除成员')} <strong>{removeTarget?.name}</strong>?
          </p>
        </div>
        <div className='td-modal-foot'>
          <button type='button' className='td-btn td-btn-ghost' onClick={() => setRemoveTarget(null)}>
            {t('取消')}
          </button>
          <button type='button' className='td-btn td-btn-danger-ghost' onClick={handleRemoveMember}>
            {t('移除')}
          </button>
        </div>
      </TdModal>

      {/* ─── Delete token confirm ─── */}
      <TdModal
        visible={!!deleteTokenTarget}
        onClose={() => setDeleteTokenTarget(null)}
        icon={<TIcon.Trash size={18} />}
        iconKind='danger'
        title={t('确认删除')}
      >
        <div className='td-modal-body'>
          <p style={{ fontSize: 13.5, color: 'var(--td-ink-600)', margin: 0 }}>
            {t('删除后该团队令牌将立即失效，且无法恢复。')}
          </p>
        </div>
        <div className='td-modal-foot'>
          <button type='button' className='td-btn td-btn-ghost' onClick={() => setDeleteTokenTarget(null)}>
            {t('取消')}
          </button>
          <button type='button' className='td-btn td-btn-danger-ghost' onClick={handleDeleteTeamToken}>
            {t('删除')}
          </button>
        </div>
      </TdModal>
    </div>
  );
};

export default TeamDetail;
