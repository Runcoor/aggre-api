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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Spin } from '@douyinfe/semi-ui';
import { VChart } from '@visactor/react-vchart';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  API,
  renderQuota,
  showError,
  showSuccess,
} from '../../../helpers';
import { TIcon } from '../../Team/teamIcons';
import {
  avatarColor,
  formatStableTime,
  initials,
} from '../../Team/teamUiKit';
import '../../Team/team-design.css';

const CHART_CONFIG = { mode: 'desktop-browser' };

const RolePill = ({ role, ownerId, userId, t }) => {
  const isOwner = role >= 100 || (ownerId && userId && ownerId === userId);
  if (isOwner) {
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

const AdminTeamDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const teamId = Number(id);

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameVal, setRenameVal] = useState('');
  const [renaming, setRenaming] = useState(false);

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferUserId, setTransferUserId] = useState('');
  const [transferring, setTransferring] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [statusToggleOpen, setStatusToggleOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(
        `/api/admin/teams/${teamId}?include_deleted=true`,
      );
      if (res.data?.success) {
        setDetail(res.data.data);
      } else {
        showError(res.data?.message || t('加载团队详情失败'));
      }
    } catch {
      showError(t('请求失败'));
    } finally {
      setLoading(false);
    }
  }, [teamId, t]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading || !detail) {
    return (
      <div className='team-design w-full max-w-[1240px] mx-auto px-7 pt-7 pb-20'>
        <div className='py-12 text-center'>
          <Spin size='large' />
        </div>
      </div>
    );
  }

  const team = detail.team || {};
  const owner = detail.owner;
  const isDeleted = !!detail.is_deleted;
  const isActive = team.status === 1;

  const onRename = async () => {
    const name = renameVal.trim();
    if (!name) {
      showError(t('团队名称不能为空'));
      return;
    }
    setRenaming(true);
    try {
      const res = await API.put(`/api/admin/teams/${teamId}`, { name });
      if (res.data?.success) {
        showSuccess(t('已更新团队名称'));
        setRenameOpen(false);
        fetchDetail();
      } else {
        showError(res.data?.message || t('更新失败'));
      }
    } catch {
      showError(t('请求失败'));
    } finally {
      setRenaming(false);
    }
  };

  const onToggleStatus = async () => {
    try {
      const res = await API.put(`/api/admin/teams/${teamId}`, {
        status: isActive ? 2 : 1,
      });
      if (res.data?.success) {
        showSuccess(isActive ? t('已禁用团队') : t('已启用团队'));
        fetchDetail();
      } else {
        showError(res.data?.message || t('操作失败'));
      }
    } catch {
      showError(t('请求失败'));
    } finally {
      setStatusToggleOpen(false);
    }
  };

  const onTransfer = async () => {
    const uid = parseInt(transferUserId, 10);
    if (!Number.isFinite(uid) || uid <= 0) {
      showError(t('请输入用户 ID'));
      return;
    }
    setTransferring(true);
    try {
      const res = await API.post(
        `/api/admin/teams/${teamId}/transfer-owner`,
        { to_user_id: uid },
      );
      if (res.data?.success) {
        showSuccess(t('已转让所有者'));
        setTransferOpen(false);
        setTransferUserId('');
        fetchDetail();
      } else {
        showError(res.data?.message || t('转让失败'));
      }
    } catch {
      showError(t('请求失败'));
    } finally {
      setTransferring(false);
    }
  };

  const onDelete = async () => {
    if (deleteConfirm.trim() !== team.name) {
      showError(t('请输入完整的团队名称以确认'));
      return;
    }
    setDeleting(true);
    try {
      const res = await API.delete(`/api/admin/teams/${teamId}`);
      if (res.data?.success) {
        showSuccess(t('团队已删除'));
        navigate('/console/team?tab=admin-list', { replace: true });
      } else {
        showError(res.data?.message || t('删除失败'));
      }
    } catch {
      showError(t('请求失败'));
    } finally {
      setDeleting(false);
    }
  };

  const renderStatusPill = () => {
    if (isDeleted) {
      return <span className='td-pill td-pill-muted'>● {t('已删除')}</span>;
    }
    if (team.status === 2) {
      return <span className='td-pill td-pill-muted'>● {t('已禁用')}</span>;
    }
    return <span className='td-pill td-pill-ok'>● {t('正常')}</span>;
  };

  const memberCount = detail.member_count || 0;
  const activeSubs = (detail.active_subscriptions || []).length;
  const todayQuota = detail.today_quota || 0;
  const monthQuota = detail.month_quota || 0;

  return (
    <div className='team-design w-full max-w-[1240px] mx-auto px-7 pt-7 pb-20'>
      <button
        type='button'
        className='td-back-link'
        onClick={() => navigate('/console/team?tab=admin-list')}
      >
        <TIcon.ArrowLeft />
        {t('返回团队列表')}
      </button>

      <div className='td-detail-head'>
        <div className={'td-avatar lg ' + avatarColor(team.id)}>
          {initials(team.name)}
        </div>
        <div className='ident'>
          <div className='name-row'>
            <h2>{team.name}</h2>
            {renderStatusPill()}
          </div>
          <div className='meta-row'>
            {owner && (
              <span>
                <TIcon.Crown />
                {t('创建者')}{' '}
                <strong>{owner.display_name || owner.username || `#${owner.id}`}</strong>
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
        {!isDeleted && (
          <div className='actions'>
            <button
              type='button'
              className='td-btn td-btn-ghost'
              onClick={() => {
                setRenameVal(team.name);
                setRenameOpen(true);
              }}
            >
              <TIcon.Edit />
              {t('改名')}
            </button>
            <button
              type='button'
              className='td-btn td-btn-ghost'
              onClick={() => setTransferOpen(true)}
            >
              <TIcon.Crown />
              {t('转让所有者')}
            </button>
            <button
              type='button'
              className='td-btn td-btn-warn-ghost'
              onClick={() => setStatusToggleOpen(true)}
            >
              <TIcon.Power />
              {isActive ? t('禁用') : t('启用')}
            </button>
            <button
              type='button'
              className='td-btn td-btn-danger-ghost'
              onClick={() => setDeleteOpen(true)}
            >
              <TIcon.Trash />
              {t('删除')}
            </button>
          </div>
        )}
      </div>

      <div className='td-stat-strip'>
        <StatCard
          label={t('成员')}
          value={memberCount}
          icon={<TIcon.Users />}
          foot={t('包含创建者')}
        />
        <StatCard
          label={t('活跃订阅')}
          value={activeSubs}
          icon={<TIcon.Sub />}
          foot={activeSubs === 0 ? t('暂无订阅') : t('正在使用')}
        />
        <StatCard
          label={t('今日消费')}
          value={renderQuota(todayQuota)}
          icon={<TIcon.Coin />}
          foot={t('UTC+8 当日')}
        />
        <StatCard
          label={t('本月消费')}
          value={renderQuota(monthQuota)}
          icon={<TIcon.Wallet />}
          foot={t('自然月累计')}
        />
      </div>

      <div className='td-sub-tabs'>
        <button
          type='button'
          className={'td-sub-tab' + (activeTab === 'members' ? ' active' : '')}
          onClick={() => setActiveTab('members')}
        >
          <TIcon.Users />
          {t('成员')}
        </button>
        <button
          type='button'
          className={'td-sub-tab' + (activeTab === 'tokens' ? ' active' : '')}
          onClick={() => setActiveTab('tokens')}
        >
          <TIcon.Key />
          {t('Token')}
        </button>
        <button
          type='button'
          className={'td-sub-tab' + (activeTab === 'subscriptions' ? ' active' : '')}
          onClick={() => setActiveTab('subscriptions')}
        >
          <TIcon.Sub />
          {t('订阅')}
        </button>
        <button
          type='button'
          className={'td-sub-tab' + (activeTab === 'usage' ? ' active' : '')}
          onClick={() => setActiveTab('usage')}
        >
          <TIcon.Activity />
          {t('用量')}
        </button>
      </div>

      {activeTab === 'members' && (
        <MembersTab teamId={teamId} ownerId={team.owner_id} t={t} />
      )}
      {activeTab === 'tokens' && <TokensTab teamId={teamId} t={t} />}
      {activeTab === 'subscriptions' && (
        <SubscriptionsTab teamId={teamId} t={t} />
      )}
      {activeTab === 'usage' && <UsageTab teamId={teamId} t={t} />}

      <RenameModal
        visible={renameOpen}
        value={renameVal}
        renaming={renaming}
        onChange={setRenameVal}
        onClose={() => setRenameOpen(false)}
        onSubmit={onRename}
        t={t}
      />

      <TransferModal
        visible={transferOpen}
        userId={transferUserId}
        transferring={transferring}
        onChange={setTransferUserId}
        onClose={() => setTransferOpen(false)}
        onSubmit={onTransfer}
        t={t}
      />

      <DeleteModal
        visible={deleteOpen}
        teamName={team.name}
        confirm={deleteConfirm}
        deleting={deleting}
        onChange={setDeleteConfirm}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteConfirm('');
        }}
        onSubmit={onDelete}
        t={t}
      />

      <StatusToggleModal
        visible={statusToggleOpen}
        isActive={isActive}
        onClose={() => setStatusToggleOpen(false)}
        onSubmit={onToggleStatus}
        t={t}
      />
    </div>
  );
};

// ─── Members Tab ──────────────────────────────────────────────────────────────

const MembersTab = ({ teamId, ownerId, t }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addUserId, setAddUserId] = useState('');
  const [addRole, setAddRole] = useState(1);
  const [adding, setAdding] = useState(false);

  const [removeTarget, setRemoveTarget] = useState(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/api/admin/teams/${teamId}/members`);
      if (res.data?.success) setMembers(res.data.data || []);
      else showError(res.data?.message || t('获取成员失败'));
    } catch {
      showError(t('请求失败'));
    } finally {
      setLoading(false);
    }
  }, [teamId, t]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const onAdd = async () => {
    const uid = parseInt(addUserId, 10);
    if (!Number.isFinite(uid) || uid <= 0) {
      showError(t('请输入用户 ID'));
      return;
    }
    setAdding(true);
    try {
      const res = await API.post(`/api/admin/teams/${teamId}/members`, {
        user_id: uid,
        role: addRole,
      });
      if (res.data?.success) {
        showSuccess(t('已添加成员'));
        setAddOpen(false);
        setAddUserId('');
        fetchMembers();
      } else {
        showError(res.data?.message || t('添加失败'));
      }
    } catch {
      showError(t('请求失败'));
    } finally {
      setAdding(false);
    }
  };

  const onRoleChange = async (userId, newRole) => {
    try {
      const res = await API.put(
        `/api/admin/teams/${teamId}/members/${userId}`,
        { role: newRole },
      );
      if (res.data?.success) {
        showSuccess(t('角色已更新'));
        fetchMembers();
      } else {
        showError(res.data?.message || t('操作失败'));
      }
    } catch {
      showError(t('请求失败'));
    }
  };

  const onRemove = async () => {
    if (!removeTarget) return;
    try {
      const res = await API.delete(
        `/api/admin/teams/${teamId}/members/${removeTarget.userId}`,
      );
      if (res.data?.success) {
        showSuccess(t('已移除成员'));
        setRemoveTarget(null);
        fetchMembers();
      } else {
        showError(res.data?.message || t('操作失败'));
      }
    } catch {
      showError(t('请求失败'));
    }
  };

  return (
    <>
      <div className='td-section-head'>
        <div>
          <div className='title'>{t('成员列表')}</div>
          <div className='meta'>
            {t('共')} {members.length} {t('位成员')}
          </div>
        </div>
        <div className='actions'>
          <button
            type='button'
            className='td-btn td-btn-ghost td-btn-sm'
            onClick={fetchMembers}
          >
            <TIcon.Refresh />
            {t('刷新')}
          </button>
          <button
            type='button'
            className='td-btn td-btn-primary td-btn-sm'
            onClick={() => setAddOpen(true)}
          >
            <TIcon.UserPlus />
            {t('添加成员')}
          </button>
        </div>
      </div>

      <div className='td-table-card'>
        <div className='td-table-scroll'>
          <table className='td-t'>
            <thead>
              <tr>
                <th>{t('用户')}</th>
                <th style={{ width: 160 }}>{t('角色')}</th>
                <th style={{ width: 170 }}>{t('加入时间')}</th>
                <th className='actions' style={{ width: 200 }}>
                  {t('操作')}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '36px 16px' }}>
                    <Spin />
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--td-ink-400)' }}
                  >
                    {t('暂无成员')}
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const role = m.member?.role || 0;
                  const isOwner = role >= 100 || m.user_id === ownerId;
                  return (
                    <tr key={m.user_id}>
                      <td>
                        <div className='td-user-cell'>
                          <div className={'td-avatar ' + avatarColor(m.user_id)}>
                            {initials(m.display_name || m.username)}
                          </div>
                          <div className='info'>
                            <div className='name'>
                              {m.display_name || m.username || `#${m.user_id}`}
                            </div>
                            <div className='sub'>
                              {m.email || `@${m.username || m.user_id}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <RolePill role={role} ownerId={ownerId} userId={m.user_id} t={t} />
                      </td>
                      <td className='td-mono' style={{ color: 'var(--td-ink-500)', fontSize: 12 }}>
                        {formatStableTime(m.member?.joined_at)}
                      </td>
                      <td className='actions'>
                        {isOwner ? (
                          <span style={{ fontSize: 11.5, color: 'var(--td-ink-400)' }}>
                            {t('需先转让')}
                          </span>
                        ) : (
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              type='button'
                              className='td-btn td-btn-ghost td-btn-sm'
                              onClick={() =>
                                onRoleChange(m.user_id, role >= 10 ? 1 : 10)
                              }
                            >
                              {role >= 10 ? t('设为成员') : t('设为管理员')}
                            </button>
                            <button
                              type='button'
                              className='td-icon-btn danger'
                              title={t('移除')}
                              onClick={() =>
                                setRemoveTarget({
                                  userId: m.user_id,
                                  name: m.display_name || m.username || `#${m.user_id}`,
                                })
                              }
                            >
                              <TIcon.Trash />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddMemberModal
        visible={addOpen}
        userId={addUserId}
        role={addRole}
        adding={adding}
        onUserId={setAddUserId}
        onRole={setAddRole}
        onClose={() => setAddOpen(false)}
        onSubmit={onAdd}
        t={t}
      />

      <RemoveMemberModal
        target={removeTarget}
        onClose={() => setRemoveTarget(null)}
        onSubmit={onRemove}
        t={t}
      />
    </>
  );
};

// ─── Tokens Tab ───────────────────────────────────────────────────────────────

const TokensTab = ({ teamId, t }) => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/api/admin/teams/${teamId}/tokens`);
      if (res.data?.success) setTokens(res.data.data || []);
      else showError(res.data?.message || t('获取令牌失败'));
    } catch {
      showError(t('请求失败'));
    } finally {
      setLoading(false);
    }
  }, [teamId, t]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const onDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await API.delete(
        `/api/admin/teams/${teamId}/tokens/${deleteTarget.id}`,
      );
      if (res.data?.success) {
        showSuccess(t('已删除令牌'));
        setDeleteTarget(null);
        fetchTokens();
      } else {
        showError(res.data?.message || t('操作失败'));
      }
    } catch {
      showError(t('请求失败'));
    }
  };

  return (
    <>
      <div className='td-alert'>
        <span className='icon'>
          <TIcon.Info />
        </span>
        <div>
          {t('由')} <strong>{t('团队签发')}</strong>{' '}
          {t('的 API 令牌，调用产生的费用会直接从团队订阅扣额度。')}
        </div>
      </div>
      <div className='td-section-head'>
        <div>
          <div className='title'>{t('团队令牌')}</div>
          <div className='meta'>
            {tokens.length} {t('个令牌')}
          </div>
        </div>
        <div className='actions'>
          <button
            type='button'
            className='td-btn td-btn-ghost td-btn-sm'
            onClick={fetchTokens}
          >
            <TIcon.Refresh />
            {t('刷新')}
          </button>
        </div>
      </div>

      {tokens.length === 0 && !loading ? (
        <div className='td-empty-mini'>
          <div className='td-empty-mini-ic'>
            <TIcon.Key size={18} />
          </div>
          <div>{t('暂无团队令牌')}</div>
          <div style={{ fontSize: 12, color: 'var(--td-ink-400)', marginTop: 4 }}>
            {t('创建后，凭此令牌的请求将走团队订阅扣费')}
          </div>
        </div>
      ) : (
        <div className='td-table-card'>
          <div className='td-table-scroll'>
            <table className='td-t'>
              <thead>
                <tr>
                  <th style={{ width: 70 }}>ID</th>
                  <th>{t('名称')}</th>
                  <th>{t('密钥')}</th>
                  <th className='num' style={{ width: 110 }}>
                    {t('已用')}
                  </th>
                  <th style={{ width: 170 }}>{t('创建时间')}</th>
                  <th className='actions' style={{ width: 90 }}>
                    {t('操作')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px 16px' }}>
                      <Spin />
                    </td>
                  </tr>
                ) : (
                  tokens.map((tk) => (
                    <tr key={tk.id}>
                      <td className='id-cell'>#{tk.id}</td>
                      <td>
                        <strong>{tk.name}</strong>
                      </td>
                      <td className='td-mono' style={{ fontSize: 12, color: 'var(--td-ink-500)' }}>
                        {tk.key}
                      </td>
                      <td className='num'>{renderQuota(tk.used_quota || 0)}</td>
                      <td className='td-mono' style={{ color: 'var(--td-ink-500)', fontSize: 12 }}>
                        {formatStableTime(tk.created_time)}
                      </td>
                      <td className='actions'>
                        <button
                          type='button'
                          className='td-icon-btn danger'
                          onClick={() =>
                            setDeleteTarget({ id: tk.id, name: tk.name })
                          }
                          title={t('删除')}
                        >
                          <TIcon.Trash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        visible={!!deleteTarget}
        title={t('删除该令牌？')}
        message={t('删除后立即失效，无法恢复。')}
        confirmText={t('删除')}
        kind='danger'
        onClose={() => setDeleteTarget(null)}
        onSubmit={onDelete}
        t={t}
      />
    </>
  );
};

// ─── Subscriptions Tab ────────────────────────────────────────────────────────

const SubscriptionsTab = ({ teamId, t }) => {
  const [data, setData] = useState({ active: [], all_subscriptions: [] });
  const [loading, setLoading] = useState(false);
  const [terminateTarget, setTerminateTarget] = useState(null);

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/api/admin/teams/${teamId}/subscriptions`);
      if (res.data?.success) {
        setData(res.data.data || { active: [], all_subscriptions: [] });
      } else {
        showError(res.data?.message || t('获取订阅失败'));
      }
    } catch {
      showError(t('请求失败'));
    } finally {
      setLoading(false);
    }
  }, [teamId, t]);

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]);

  const onTerminate = async () => {
    if (!terminateTarget) return;
    try {
      const res = await API.post(
        `/api/admin/teams/${teamId}/subscriptions/${terminateTarget.id}/terminate`,
        { reason: 'admin_terminate' },
      );
      if (res.data?.success) {
        showSuccess(t('已终止订阅'));
        setTerminateTarget(null);
        fetchSubs();
      } else {
        showError(res.data?.message || t('操作失败'));
      }
    } catch {
      showError(t('请求失败'));
    }
  };

  const active = data.active || [];
  const history = data.all_subscriptions || [];

  return (
    <>
      <div className='td-alert'>
        <span className='icon'>
          <TIcon.Info />
        </span>
        <div>
          {t('团队订阅独立于个人订阅。订阅周期内，团队令牌的所有请求会从此订阅扣额度，到期或额度耗尽后自动停用。')}
        </div>
      </div>
      <div className='td-section-head'>
        <div>
          <div className='title'>{t('活跃订阅')}</div>
          <div className='meta'>
            {active.length} {t('个生效中')}
          </div>
        </div>
        <div className='actions'>
          <button
            type='button'
            className='td-btn td-btn-ghost td-btn-sm'
            onClick={fetchSubs}
          >
            <TIcon.Refresh />
            {t('刷新')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className='py-8 text-center'>
          <Spin />
        </div>
      ) : active.length === 0 ? (
        <div className='td-empty-mini' style={{ marginBottom: 24 }}>
          <div className='td-empty-mini-ic'>
            <TIcon.Sub size={18} />
          </div>
          <div>{t('该团队暂无活跃订阅')}</div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {active.map((item) => {
            const s = item.subscription || {};
            const planLabel = `Plan #${s.plan_id}`;
            return (
            <div
              key={s.id}
              style={{
                background: 'var(--td-card)',
                border: '1px solid var(--td-line)',
                borderRadius: 12,
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <strong style={{ fontSize: 14 }}>{planLabel}</strong>
                <button
                  type='button'
                  className='td-btn td-btn-danger-ghost td-btn-sm'
                  onClick={() => setTerminateTarget({ id: s.id, name: planLabel })}
                >
                  {t('终止')}
                </button>
              </div>
              <div style={{ fontSize: 12, color: 'var(--td-ink-500)' }}>
                {t('已用')} {renderQuota(s.amount_used || 0)} /{' '}
                {renderQuota(s.amount_total || 0)}
              </div>
              <div
                className='td-mono'
                style={{ fontSize: 12, color: 'var(--td-ink-500)', marginTop: 4 }}
              >
                {t('结束于')} {formatStableTime(s.end_time)}
              </div>
            </div>
            );
          })}
        </div>
      )}

      <div className='td-section-head'>
        <div>
          <div className='title'>{t('订阅历史')}</div>
        </div>
      </div>

      <div className='td-table-card'>
        <div className='td-table-scroll'>
          <table className='td-t'>
            <thead>
              <tr>
                <th style={{ width: 70 }}>ID</th>
                <th>{t('套餐')}</th>
                <th>{t('状态')}</th>
                <th style={{ width: 200 }}>{t('已用 / 总额')}</th>
                <th style={{ width: 170 }}>{t('结束时间')}</th>
                <th>{t('来源')}</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--td-ink-400)' }}
                  >
                    {t('暂无订阅记录')}
                  </td>
                </tr>
              ) : (
                history.map((item) => {
                  const h = item.subscription || {};
                  return (
                  <tr key={h.id}>
                    <td className='id-cell'>#{h.id}</td>
                    <td>
                      <strong>{`Plan #${h.plan_id}`}</strong>
                    </td>
                    <td>
                      {h.status === 'active' && (
                        <span className='td-pill td-pill-ok'>● {t('生效中')}</span>
                      )}
                      {h.status === 'cancelled' && (
                        <span className='td-pill td-pill-danger'>● {t('已取消')}</span>
                      )}
                      {h.status !== 'active' && h.status !== 'cancelled' && (
                        <span className='td-pill td-pill-muted'>● {h.status}</span>
                      )}
                    </td>
                    <td>
                      {renderQuota(h.amount_used || 0)} /{' '}
                      {renderQuota(h.amount_total || 0)}
                    </td>
                    <td className='td-mono' style={{ color: 'var(--td-ink-500)', fontSize: 12 }}>
                      {formatStableTime(h.end_time)}
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--td-ink-400)' }}>
                      {h.source || '—'}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        visible={!!terminateTarget}
        title={t('终止该订阅？')}
        message={t('终止后立即停止计费，不会退款。')}
        confirmText={t('终止订阅')}
        kind='warn'
        onClose={() => setTerminateTarget(null)}
        onSubmit={onTerminate}
        t={t}
      />
    </>
  );
};

// ─── Usage Tab ────────────────────────────────────────────────────────────────

const UsageTab = ({ teamId, t }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/api/admin/teams/${teamId}/usage?days=30`);
      if (res.data?.success) setReport(res.data.data);
      else showError(res.data?.message || t('获取用量失败'));
    } catch {
      showError(t('请求失败'));
    } finally {
      setLoading(false);
    }
  }, [teamId, t]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const trendSpec = useMemo(() => {
    if (!report) return null;
    return {
      type: 'area',
      data: [{ id: 'usage', values: report.daily || [] }],
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
      crosshair: {
        xField: {
          visible: true,
          line: { style: { stroke: 'rgba(128,128,128,0.3)', lineDash: [3, 3] } },
        },
      },
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
  }, [report, t]);

  if (loading || !report) {
    return (
      <div className='py-12 text-center'>
        <Spin size='large' />
      </div>
    );
  }

  const summary = report.summary || {};
  const byMember = report.by_member || [];
  const byToken = report.by_token || [];

  return (
    <>
      <div className='td-stat-strip'>
        <StatCard
          label={t('总请求数')}
          value={summary.total_requests || 0}
          icon={<TIcon.Activity />}
        />
        <StatCard
          label={t('总消费')}
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
          <div className='meta'>
            {t('每日消费与请求数（按 UTC+8）')}
          </div>
        </div>
        <div className='actions'>
          <button
            type='button'
            className='td-btn td-btn-ghost td-btn-sm'
            onClick={fetchUsage}
          >
            <TIcon.Refresh />
            {t('刷新')}
          </button>
        </div>
      </div>

      <div
        style={{
          background: 'var(--td-card)',
          border: '1px solid var(--td-line)',
          borderRadius: 12,
          padding: 16,
          height: 320,
          marginBottom: 16,
        }}
      >
        {trendSpec && <VChart spec={trendSpec} option={CHART_CONFIG} />}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 14,
        }}
      >
        <UsageBreakdown
          title={t('按成员')}
          rows={byMember}
          columns={[
            { label: t('用户'), key: 'name', render: (r) => r.display_name || r.username || `#${r.user_id}` },
            { label: t('请求'), key: 'requests', align: 'right' },
            { label: t('消费'), key: 'quota', align: 'right', render: (r) => renderQuota(r.quota || 0) },
          ]}
          rowKey='user_id'
          t={t}
        />
        <UsageBreakdown
          title={t('按令牌')}
          rows={byToken}
          columns={[
            { label: t('令牌'), key: 'name', render: (r) => r.token_name || '—' },
            { label: t('请求'), key: 'requests', align: 'right' },
            { label: t('消费'), key: 'quota', align: 'right', render: (r) => renderQuota(r.quota || 0) },
          ]}
          rowKey='token_id'
          t={t}
        />
      </div>
    </>
  );
};

const UsageBreakdown = ({ title, rows, columns, rowKey, t }) => (
  <div>
    <div className='td-section-head'>
      <div>
        <div className='title'>{title}</div>
      </div>
    </div>
    <div className='td-table-card'>
      <div className='td-table-scroll'>
        <table className='td-t'>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.label} className={c.align === 'right' ? 'num' : ''}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ textAlign: 'center', padding: 24, color: 'var(--td-ink-400)' }}
                >
                  {t('暂无数据')}
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={(r[rowKey] || idx) + '-' + idx}>
                  {columns.map((c) => (
                    <td key={c.label} className={c.align === 'right' ? 'num' : ''}>
                      {c.render ? c.render(r) : r[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ─── Header action modals ────────────────────────────────────────────────────

const RenameModal = ({ visible, value, renaming, onChange, onClose, onSubmit, t }) => (
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
          <div className='ic-wrap'>
            <TIcon.Edit size={18} />
          </div>
          <div>
            <h3>{t('修改团队名称')}</h3>
          </div>
        </div>
        <button type='button' className='td-modal-close' onClick={onClose}>
          <TIcon.X />
        </button>
      </div>
      <div className='td-modal-body'>
        <div className='td-form-row'>
          <label className='td-form-label'>
            {t('团队名称')}
            <span className='req'>*</span>
          </label>
          <input
            className='td-form-input'
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={24}
          />
          <div className='td-form-hint'>{t('最多 24 个字符')}</div>
        </div>
      </div>
      <div className='td-modal-foot'>
        <button type='button' className='td-btn td-btn-ghost' onClick={onClose}>
          {t('取消')}
        </button>
        <button
          type='button'
          className='td-btn td-btn-primary'
          disabled={!value.trim() || renaming}
          onClick={onSubmit}
        >
          {t('保存')}
        </button>
      </div>
    </div>
  </Modal>
);

const TransferModal = ({ visible, userId, transferring, onChange, onClose, onSubmit, t }) => (
  <Modal
    visible={visible}
    onCancel={onClose}
    header={null}
    footer={null}
    closable={false}
    centered
    width={500}
    className='td-modal-host'
    bodyStyle={{ padding: 0 }}
  >
    <div className='td-modal'>
      <div className='td-modal-head'>
        <div className='left'>
          <div className='ic-wrap warn'>
            <TIcon.Crown size={18} />
          </div>
          <div>
            <h3>{t('转让团队所有者')}</h3>
            <p>{t('所有者权限转移后无法撤销，请谨慎操作。')}</p>
          </div>
        </div>
        <button type='button' className='td-modal-close' onClick={onClose}>
          <TIcon.X />
        </button>
      </div>
      <div className='td-modal-body'>
        <div className='td-modal-alert warn'>
          {t('转让后旧所有者将自动降为管理员，新所有者必须已经是该团队成员。')}
        </div>
        <div className='td-form-row'>
          <label className='td-form-label'>
            {t('新所有者用户 ID')}
            <span className='req'>*</span>
          </label>
          <input
            className='td-form-input mono'
            type='number'
            value={userId}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t('用户 ID')}
            min={1}
          />
        </div>
      </div>
      <div className='td-modal-foot'>
        <button type='button' className='td-btn td-btn-ghost' onClick={onClose}>
          {t('取消')}
        </button>
        <button
          type='button'
          className='td-btn td-btn-warn-ghost'
          disabled={!userId || transferring}
          onClick={onSubmit}
        >
          {t('确认转让')}
        </button>
      </div>
    </div>
  </Modal>
);

const DeleteModal = ({ visible, teamName, confirm, deleting, onChange, onClose, onSubmit, t }) => (
  <Modal
    visible={visible}
    onCancel={onClose}
    header={null}
    footer={null}
    closable={false}
    centered
    width={500}
    className='td-modal-host'
    bodyStyle={{ padding: 0 }}
  >
    <div className='td-modal'>
      <div className='td-modal-head'>
        <div className='left'>
          <div className='ic-wrap danger'>
            <TIcon.Trash size={18} />
          </div>
          <div>
            <h3>{t('删除团队？')}</h3>
            <p>
              {t('删除后无法恢复，所有团队令牌、订阅与用量记录会一并移除。')}
            </p>
          </div>
        </div>
        <button type='button' className='td-modal-close' onClick={onClose}>
          <TIcon.X />
        </button>
      </div>
      <div className='td-modal-body'>
        <div className='td-modal-alert'>
          {t('该操作会软删团队及其成员、令牌，并终止所有活跃订阅（不退款）。')}
        </div>
        <div className='td-form-row'>
          <label className='td-form-label'>
            {t('输入团队名称以确认')}
            <span className='td-form-label-aside'>{t('不可恢复')}</span>
          </label>
          <input
            className='td-form-input mono'
            value={confirm}
            onChange={(e) => onChange(e.target.value)}
            placeholder={teamName}
          />
        </div>
      </div>
      <div className='td-modal-foot'>
        <button type='button' className='td-btn td-btn-ghost' onClick={onClose}>
          {t('取消')}
        </button>
        <button
          type='button'
          className='td-btn td-btn-danger-ghost'
          disabled={confirm.trim() !== teamName || deleting}
          onClick={onSubmit}
        >
          <TIcon.Trash />
          {t('永久删除')}
        </button>
      </div>
    </div>
  </Modal>
);

const StatusToggleModal = ({ visible, isActive, onClose, onSubmit, t }) => (
  <Modal
    visible={visible}
    onCancel={onClose}
    header={null}
    footer={null}
    closable={false}
    centered
    width={440}
    className='td-modal-host'
    bodyStyle={{ padding: 0 }}
  >
    <div className='td-modal'>
      <div className='td-modal-head'>
        <div className='left'>
          <div className={'ic-wrap' + (isActive ? ' warn' : '')}>
            <TIcon.Power size={18} />
          </div>
          <div>
            <h3>{isActive ? t('禁用团队？') : t('启用团队？')}</h3>
            <p>
              {isActive
                ? t('禁用后该团队的所有令牌将立即返回 401，可随时启用。')
                : t('启用后该团队的令牌将恢复可用。')}
            </p>
          </div>
        </div>
        <button type='button' className='td-modal-close' onClick={onClose}>
          <TIcon.X />
        </button>
      </div>
      <div className='td-modal-foot'>
        <button type='button' className='td-btn td-btn-ghost' onClick={onClose}>
          {t('取消')}
        </button>
        <button
          type='button'
          className={isActive ? 'td-btn td-btn-warn-ghost' : 'td-btn td-btn-primary'}
          onClick={onSubmit}
        >
          {isActive ? t('确认禁用') : t('确认启用')}
        </button>
      </div>
    </div>
  </Modal>
);

const AddMemberModal = ({ visible, userId, role, adding, onUserId, onRole, onClose, onSubmit, t }) => (
  <Modal
    visible={visible}
    onCancel={onClose}
    header={null}
    footer={null}
    closable={false}
    centered
    width={480}
    className='td-modal-host'
    bodyStyle={{ padding: 0 }}
  >
    <div className='td-modal'>
      <div className='td-modal-head'>
        <div className='left'>
          <div className='ic-wrap'>
            <TIcon.UserPlus size={18} />
          </div>
          <div>
            <h3>{t('添加成员')}</h3>
            <p>{t('通过用户 ID 直接添加成员到团队')}</p>
          </div>
        </div>
        <button type='button' className='td-modal-close' onClick={onClose}>
          <TIcon.X />
        </button>
      </div>
      <div className='td-modal-body'>
        <div className='td-form-row'>
          <label className='td-form-label'>
            {t('用户 ID')}
            <span className='req'>*</span>
          </label>
          <input
            className='td-form-input mono'
            type='number'
            value={userId}
            onChange={(e) => onUserId(e.target.value)}
            placeholder={t('用户 ID')}
            min={1}
          />
        </div>
        <div className='td-form-row'>
          <label className='td-form-label'>{t('角色')}</label>
          <div
            className='td-role-radio'
            onClick={() => onRole(1)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '12px 14px',
              border: '1px solid ' + (role === 1 ? 'var(--td-blue-1)' : 'var(--td-line)'),
              background: role === 1 ? 'var(--td-grad-soft)' : 'transparent',
              borderRadius: 10,
              cursor: 'pointer',
              marginBottom: 8,
            }}
          >
            <Dot checked={role === 1} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <TIcon.Users size={13} />
                {t('成员')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--td-ink-500)', marginTop: 3 }}>
                {t('可使用团队订阅与令牌，无管理权限')}
              </div>
            </div>
          </div>
          <div
            className='td-role-radio'
            onClick={() => onRole(10)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '12px 14px',
              border: '1px solid ' + (role === 10 ? 'var(--td-blue-1)' : 'var(--td-line)'),
              background: role === 10 ? 'var(--td-grad-soft)' : 'transparent',
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            <Dot checked={role === 10} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <TIcon.Shield size={13} />
                {t('管理员')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--td-ink-500)', marginTop: 3 }}>
                {t('可邀请/移除成员，管理团队令牌与订阅')}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='td-modal-foot'>
        <button type='button' className='td-btn td-btn-ghost' onClick={onClose}>
          {t('取消')}
        </button>
        <button
          type='button'
          className='td-btn td-btn-primary'
          disabled={!userId || adding}
          onClick={onSubmit}
        >
          <TIcon.Check />
          {t('添加')}
        </button>
      </div>
    </div>
  </Modal>
);

const Dot = ({ checked }) => (
  <span
    style={{
      width: 16,
      height: 16,
      borderRadius: '50%',
      border: '1.5px solid ' + (checked ? 'var(--td-blue-1)' : 'var(--td-ink-300)'),
      flex: 'none',
      marginTop: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {checked && (
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0072ff, #00c6ff)',
        }}
      />
    )}
  </span>
);

const RemoveMemberModal = ({ target, onClose, onSubmit, t }) => (
  <Modal
    visible={!!target}
    onCancel={onClose}
    header={null}
    footer={null}
    closable={false}
    centered
    width={440}
    className='td-modal-host'
    bodyStyle={{ padding: 0 }}
  >
    {target && (
      <div className='td-modal'>
        <div className='td-modal-head'>
          <div className='left'>
            <div className='ic-wrap danger'>
              <TIcon.UserMinus size={18} />
            </div>
            <div>
              <h3>{t('移除该成员？')}</h3>
              <p>
                {t('移除')} <strong>「{target.name}」</strong>{' '}
                {t('后，该用户将无法继续使用团队订阅与令牌。')}
              </p>
            </div>
          </div>
          <button type='button' className='td-modal-close' onClick={onClose}>
            <TIcon.X />
          </button>
        </div>
        <div className='td-modal-foot'>
          <button type='button' className='td-btn td-btn-ghost' onClick={onClose}>
            {t('取消')}
          </button>
          <button
            type='button'
            className='td-btn td-btn-danger-ghost'
            onClick={onSubmit}
          >
            {t('确认移除')}
          </button>
        </div>
      </div>
    )}
  </Modal>
);

const ConfirmModal = ({ visible, title, message, confirmText, kind, onClose, onSubmit, t }) => {
  const isDanger = kind === 'danger';
  const isWarn = kind === 'warn';
  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      header={null}
      footer={null}
      closable={false}
      centered
      width={440}
      className='td-modal-host'
      bodyStyle={{ padding: 0 }}
    >
      <div className='td-modal'>
        <div className='td-modal-head'>
          <div className='left'>
            <div className={'ic-wrap' + (isDanger ? ' danger' : isWarn ? ' warn' : '')}>
              {isDanger ? <TIcon.Trash size={18} /> : <TIcon.Info size={18} />}
            </div>
            <div>
              <h3>{title}</h3>
              {message && <p>{message}</p>}
            </div>
          </div>
          <button type='button' className='td-modal-close' onClick={onClose}>
            <TIcon.X />
          </button>
        </div>
        <div className='td-modal-foot'>
          <button type='button' className='td-btn td-btn-ghost' onClick={onClose}>
            {t('取消')}
          </button>
          <button
            type='button'
            className={
              isDanger
                ? 'td-btn td-btn-danger-ghost'
                : isWarn
                  ? 'td-btn td-btn-warn-ghost'
                  : 'td-btn td-btn-primary'
            }
            onClick={onSubmit}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AdminTeamDetail;
