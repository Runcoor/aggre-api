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
import {
  Button,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Spin,
  Switch,
  Table,
  TabPane,
  Tabs,
  Tag,
  Typography,
} from '@douyinfe/semi-ui';
import {
  IconChevronLeft,
  IconEdit,
  IconRefresh,
} from '@douyinfe/semi-icons';
import { Trash2, Crown, UserPlus, UserMinus } from 'lucide-react';
import { VChart } from '@visactor/react-vchart';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API, renderQuota, showError, showSuccess } from '../../../helpers';

const { Text } = Typography;
const CHART_CONFIG = { mode: 'desktop-browser' };

const formatStableTime = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const ROLE_OPTIONS = (t) => [
  { value: 1, label: t('成员') },
  { value: 10, label: t('管理员') },
];

const roleLabel = (role, t) => {
  if (role >= 100) return t('创建者');
  if (role >= 10) return t('管理员');
  return t('成员');
};

const AdminTeamDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const teamId = Number(id);

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');

  // ─── Header action modals ───
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameVal, setRenameVal] = useState('');
  const [renaming, setRenaming] = useState(false);

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferUserId, setTransferUserId] = useState();
  const [transferring, setTransferring] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/api/admin/teams/${teamId}?include_deleted=true`);
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
      <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center'>
        <Spin size='large' />
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

  const onToggleStatus = async (nextActive) => {
    try {
      const res = await API.put(`/api/admin/teams/${teamId}`, {
        status: nextActive ? 1 : 2,
      });
      if (res.data?.success) {
        showSuccess(nextActive ? t('已启用团队') : t('已禁用团队'));
        fetchDetail();
      } else {
        showError(res.data?.message || t('操作失败'));
      }
    } catch {
      showError(t('请求失败'));
    }
  };

  const onTransfer = async () => {
    if (!transferUserId || transferUserId <= 0) {
      showError(t('请输入用户 ID'));
      return;
    }
    setTransferring(true);
    try {
      const res = await API.post(
        `/api/admin/teams/${teamId}/transfer-owner`,
        { to_user_id: transferUserId },
      );
      if (res.data?.success) {
        showSuccess(t('已转让所有者'));
        setTransferOpen(false);
        setTransferUserId(undefined);
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
    if (isDeleted) return <Tag color='grey'>{t('已删除')}</Tag>;
    if (team.status === 2) return <Tag color='red'>{t('已禁用')}</Tag>;
    return <Tag color='green'>{t('正常')}</Tag>;
  };

  return (
    <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 py-8'>
      {/* Header */}
      <div className='flex items-center gap-2 mb-4'>
        <Button
          icon={<IconChevronLeft />}
          theme='borderless'
          onClick={() => navigate('/console/team?tab=admin-list')}
        >
          {t('返回团队列表')}
        </Button>
      </div>

      <div
        className='rounded-[var(--radius-lg)] p-6 mb-6'
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div className='flex items-start justify-between gap-4 flex-wrap'>
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-3 mb-2'>
              <h1
                className='m-0 truncate'
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--text-primary)',
                }}
              >
                {team.name}
              </h1>
              {renderStatusPill()}
            </div>
            <div className='flex items-center gap-4 flex-wrap'>
              <Text style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                ID: #{team.id}
              </Text>
              {owner && (
                <Text style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {t('创建者')}:{' '}
                  <strong style={{ color: 'var(--text-secondary)' }}>
                    {owner.display_name || owner.username}
                  </strong>{' '}
                  ({owner.email})
                </Text>
              )}
              <Text style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {t('创建于')} {formatStableTime(team.created_at)}
              </Text>
              <Text style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {detail.member_count} {t('位成员')}
              </Text>
            </div>
          </div>

          {!isDeleted && (
            <div className='flex items-center gap-2 flex-wrap'>
              <Button
                icon={<IconEdit />}
                theme='light'
                onClick={() => {
                  setRenameVal(team.name);
                  setRenameOpen(true);
                }}
              >
                {t('改名')}
              </Button>
              <Popconfirm
                title={isActive ? t('确定禁用该团队？') : t('确定启用该团队？')}
                content={
                  isActive
                    ? t('禁用后该团队所有 token 将立即失效')
                    : t('启用后该团队的 token 将恢复可用')
                }
                onConfirm={() => onToggleStatus(!isActive)}
              >
                <Button theme='light' type={isActive ? 'warning' : 'primary'}>
                  {isActive ? t('禁用') : t('启用')}
                </Button>
              </Popconfirm>
              <Button
                icon={<Crown size={14} />}
                theme='light'
                onClick={() => setTransferOpen(true)}
              >
                {t('转让所有者')}
              </Button>
              <Button
                type='danger'
                theme='light'
                icon={<Trash2 size={14} />}
                onClick={() => setDeleteOpen(true)}
              >
                {t('删除团队')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stat strip */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
        <StatCard label={t('成员数')} value={detail.member_count || 0} />
        <StatCard
          label={t('活跃订阅')}
          value={(detail.active_subscriptions || []).length}
        />
        <StatCard
          label={t('今日消费')}
          value={renderQuota(detail.today_quota || 0)}
        />
        <StatCard
          label={t('本月消费')}
          value={renderQuota(detail.month_quota || 0)}
        />
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} type='line'>
        <TabPane tab={t('成员')} itemKey='members'>
          <MembersTab teamId={teamId} ownerId={team.owner_id} t={t} />
        </TabPane>
        <TabPane tab={t('Token')} itemKey='tokens'>
          <TokensTab teamId={teamId} t={t} />
        </TabPane>
        <TabPane tab={t('订阅')} itemKey='subscriptions'>
          <SubscriptionsTab teamId={teamId} t={t} />
        </TabPane>
        <TabPane tab={t('用量')} itemKey='usage'>
          <UsageTab teamId={teamId} t={t} />
        </TabPane>
      </Tabs>

      {/* Rename modal */}
      <Modal
        title={t('修改团队名称')}
        visible={renameOpen}
        onCancel={() => setRenameOpen(false)}
        onOk={onRename}
        confirmLoading={renaming}
        okText={t('保存')}
        cancelText={t('取消')}
        centered
      >
        <Input value={renameVal} onChange={setRenameVal} placeholder={t('团队名称')} />
      </Modal>

      {/* Transfer owner modal */}
      <Modal
        title={t('转让团队所有者')}
        visible={transferOpen}
        onCancel={() => setTransferOpen(false)}
        onOk={onTransfer}
        confirmLoading={transferring}
        okText={t('确认转让')}
        cancelText={t('取消')}
        centered
      >
        <div className='space-y-3 py-2'>
          <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {t('新所有者必须已经是该团队成员；旧所有者将自动降为管理员。')}
          </Text>
          <InputNumber
            value={transferUserId}
            onChange={setTransferUserId}
            min={1}
            placeholder={t('新所有者用户 ID')}
            style={{ width: '100%' }}
          />
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        title={t('删除团队')}
        visible={deleteOpen}
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteConfirm('');
        }}
        footer={
          <div className='flex justify-end gap-2'>
            <Button
              theme='light'
              onClick={() => {
                setDeleteOpen(false);
                setDeleteConfirm('');
              }}
            >
              {t('取消')}
            </Button>
            <Button
              type='danger'
              theme='solid'
              loading={deleting}
              onClick={onDelete}
              disabled={deleteConfirm.trim() !== team.name}
            >
              {t('确认删除')}
            </Button>
          </div>
        }
        centered
      >
        <div className='space-y-3 py-2'>
          <div
            className='rounded-md p-3 text-sm'
            style={{
              background: 'rgba(220, 38, 38, 0.06)',
              color: 'var(--danger, #dc2626)',
              border: '1px solid rgba(220, 38, 38, 0.18)',
            }}
          >
            {t('该操作会软删团队及其成员、令牌，并终止所有活跃订阅（不退款）')}
          </div>
          <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {t('请输入团队名称')} <strong>「{team.name}」</strong>{' '}
            {t('以确认')}
          </Text>
          <Input
            value={deleteConfirm}
            onChange={setDeleteConfirm}
            placeholder={team.name}
          />
        </div>
      </Modal>
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div
    className='rounded-[var(--radius-lg)] p-4'
    style={{
      background: 'var(--surface)',
      border: '1px solid var(--border-default)',
    }}
  >
    <Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
      {label}
    </Text>
    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
      {value}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Members tab
// ─────────────────────────────────────────────────────────────────────────────

const MembersTab = ({ teamId, ownerId, t }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addUserId, setAddUserId] = useState();
  const [addRole, setAddRole] = useState(1);
  const [adding, setAdding] = useState(false);

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
    if (!addUserId || addUserId <= 0) {
      showError(t('请输入用户 ID'));
      return;
    }
    setAdding(true);
    try {
      const res = await API.post(`/api/admin/teams/${teamId}/members`, {
        user_id: addUserId,
        role: addRole,
      });
      if (res.data?.success) {
        showSuccess(t('已添加成员'));
        setAddOpen(false);
        setAddUserId(undefined);
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

  const onRemove = async (userId) => {
    try {
      const res = await API.delete(
        `/api/admin/teams/${teamId}/members/${userId}`,
      );
      if (res.data?.success) {
        showSuccess(t('已移除成员'));
        fetchMembers();
      } else {
        showError(res.data?.message || t('操作失败'));
      }
    } catch {
      showError(t('请求失败'));
    }
  };

  const columns = useMemo(
    () => [
      {
        title: t('用户'),
        render: (_, r) => (
          <div>
            <Text strong style={{ fontSize: 13 }}>
              {r.display_name || r.username || `#${r.user_id}`}
            </Text>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {r.email || `ID: ${r.user_id}`}
            </div>
          </div>
        ),
      },
      {
        title: t('角色'),
        width: 160,
        render: (_, r) => {
          const role = r.member?.role;
          const isOwner = role >= 100 || r.user_id === ownerId;
          if (isOwner) {
            return (
              <Tag color='orange' shape='circle'>
                <Crown size={11} style={{ marginRight: 4 }} />
                {t('创建者')}
              </Tag>
            );
          }
          return (
            <Select
              value={role}
              optionList={ROLE_OPTIONS(t)}
              onChange={(v) => onRoleChange(r.user_id, v)}
              size='small'
              style={{ width: 120 }}
            />
          );
        },
      },
      {
        title: t('加入时间'),
        width: 170,
        render: (_, r) => (
          <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {formatStableTime(r.member?.joined_at)}
          </Text>
        ),
      },
      {
        title: t('操作'),
        width: 110,
        render: (_, r) => {
          const isOwner = (r.member?.role || 0) >= 100 || r.user_id === ownerId;
          if (isOwner) {
            return (
              <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {t('需先转让')}
              </Text>
            );
          }
          return (
            <Popconfirm
              title={t('移除该成员？')}
              onConfirm={() => onRemove(r.user_id)}
            >
              <Button
                size='small'
                type='danger'
                theme='light'
                icon={<UserMinus size={12} />}
              >
                {t('移除')}
              </Button>
            </Popconfirm>
          );
        },
      },
    ],
    [ownerId, t],
  );

  return (
    <div>
      <div className='flex items-center justify-between mb-3'>
        <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {members.length} {t('位成员')}
        </Text>
        <div className='flex items-center gap-2'>
          <Button icon={<IconRefresh />} theme='light' onClick={fetchMembers}>
            {t('刷新')}
          </Button>
          <Button
            icon={<UserPlus size={14} />}
            type='primary'
            theme='light'
            onClick={() => setAddOpen(true)}
          >
            {t('添加成员')}
          </Button>
        </div>
      </div>
      <div
        className='rounded-[var(--radius-lg)]'
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-default)',
          overflow: 'hidden',
        }}
      >
        <Table
          dataSource={members}
          columns={columns}
          loading={loading}
          rowKey='user_id'
          pagination={false}
          empty={
            <div className='py-8 text-center' style={{ color: 'var(--text-muted)' }}>
              {t('暂无成员')}
            </div>
          }
        />
      </div>

      <Modal
        title={t('添加成员')}
        visible={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={onAdd}
        confirmLoading={adding}
        okText={t('添加')}
        cancelText={t('取消')}
        centered
      >
        <div className='space-y-3 py-2'>
          <div>
            <Text style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              {t('用户 ID')}
            </Text>
            <InputNumber
              value={addUserId}
              onChange={setAddUserId}
              min={1}
              placeholder={t('用户 ID')}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <Text style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              {t('角色')}
            </Text>
            <Select
              value={addRole}
              onChange={setAddRole}
              optionList={ROLE_OPTIONS(t)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tokens tab
// ─────────────────────────────────────────────────────────────────────────────

const TokensTab = ({ teamId, t }) => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const onDelete = async (tokenId) => {
    try {
      const res = await API.delete(
        `/api/admin/teams/${teamId}/tokens/${tokenId}`,
      );
      if (res.data?.success) {
        showSuccess(t('已删除令牌'));
        fetchTokens();
      } else {
        showError(res.data?.message || t('操作失败'));
      }
    } catch {
      showError(t('请求失败'));
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: t('名称'),
      dataIndex: 'name',
      render: (n) => <Text strong style={{ fontSize: 13 }}>{n}</Text>,
    },
    {
      title: t('密钥'),
      dataIndex: 'key',
      render: (k) => (
        <Text className='font-mono' style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {k}
        </Text>
      ),
    },
    {
      title: t('已用'),
      dataIndex: 'used_quota',
      width: 110,
      render: (q) => <Text style={{ fontSize: 13 }}>{renderQuota(q || 0)}</Text>,
    },
    {
      title: t('创建时间'),
      dataIndex: 'created_time',
      width: 170,
      render: (ts) => (
        <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {formatStableTime(ts)}
        </Text>
      ),
    },
    {
      title: t('操作'),
      width: 90,
      render: (_, r) => (
        <Popconfirm title={t('确认删除该令牌？')} onConfirm={() => onDelete(r.id)}>
          <Button
            size='small'
            type='danger'
            theme='light'
            icon={<Trash2 size={12} />}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div className='flex items-center justify-between mb-3'>
        <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {tokens.length} {t('个令牌')}
        </Text>
        <Button icon={<IconRefresh />} theme='light' onClick={fetchTokens}>
          {t('刷新')}
        </Button>
      </div>
      <div
        className='rounded-[var(--radius-lg)]'
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-default)',
          overflow: 'hidden',
        }}
      >
        <Table
          dataSource={tokens}
          columns={columns}
          loading={loading}
          rowKey='id'
          pagination={false}
          empty={
            <div className='py-8 text-center' style={{ color: 'var(--text-muted)' }}>
              {t('该团队尚无绑定令牌')}
            </div>
          }
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Subscriptions tab
// ─────────────────────────────────────────────────────────────────────────────

const SubscriptionsTab = ({ teamId, t }) => {
  const [data, setData] = useState({ active: [], all_subscriptions: [] });
  const [loading, setLoading] = useState(false);

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/api/admin/teams/${teamId}/subscriptions`);
      if (res.data?.success) setData(res.data.data || { active: [], all_subscriptions: [] });
      else showError(res.data?.message || t('获取订阅失败'));
    } catch {
      showError(t('请求失败'));
    } finally {
      setLoading(false);
    }
  }, [teamId, t]);

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]);

  const onTerminate = async (subId) => {
    try {
      const res = await API.post(
        `/api/admin/teams/${teamId}/subscriptions/${subId}/terminate`,
        { reason: 'admin_terminate' },
      );
      if (res.data?.success) {
        showSuccess(t('已终止订阅'));
        fetchSubs();
      } else {
        showError(res.data?.message || t('操作失败'));
      }
    } catch {
      showError(t('请求失败'));
    }
  };

  const historyColumns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: t('套餐'), dataIndex: 'plan_name' },
    {
      title: t('状态'),
      dataIndex: 'status',
      width: 100,
      render: (s) => {
        if (s === 'active') return <Tag color='green'>{t('生效中')}</Tag>;
        if (s === 'cancelled') return <Tag color='red'>{t('已取消')}</Tag>;
        return <Tag color='grey'>{s}</Tag>;
      },
    },
    {
      title: t('已用 / 总额'),
      width: 200,
      render: (_, r) => (
        <Text style={{ fontSize: 13 }}>
          {renderQuota(r.amount_used || 0)} / {renderQuota(r.amount_total || 0)}
        </Text>
      ),
    },
    {
      title: t('结束时间'),
      dataIndex: 'end_time',
      width: 170,
      render: (ts) => (
        <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {formatStableTime(ts)}
        </Text>
      ),
    },
    {
      title: t('来源'),
      dataIndex: 'source',
      width: 200,
      render: (s) => (
        <Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s || '—'}</Text>
      ),
    },
  ];

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <Text strong style={{ fontSize: 14 }}>{t('活跃订阅')}</Text>
        <Button icon={<IconRefresh />} theme='light' onClick={fetchSubs}>
          {t('刷新')}
        </Button>
      </div>

      {loading ? (
        <div className='py-8 text-center'><Spin /></div>
      ) : (data.active || []).length === 0 ? (
        <div className='py-8 text-center' style={{ color: 'var(--text-muted)' }}>
          {t('该团队暂无活跃订阅')}
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
          {data.active.map((s) => (
            <div
              key={s.id}
              className='rounded-[var(--radius-lg)] p-4'
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div className='flex items-center justify-between mb-2'>
                <Text strong style={{ fontSize: 14 }}>{s.plan_name}</Text>
                <Popconfirm
                  title={t('确认终止该订阅？')}
                  content={t('终止后立即停止计费，不会退款')}
                  onConfirm={() => onTerminate(s.id)}
                >
                  <Button size='small' type='danger' theme='light'>
                    {t('终止')}
                  </Button>
                </Popconfirm>
              </div>
              <Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>
                {t('已用')} {renderQuota(s.amount_used || 0)} /{' '}
                {renderQuota(s.amount_total || 0)}
              </Text>
              <Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                {t('结束于')} {formatStableTime(s.end_time)}
              </Text>
            </div>
          ))}
        </div>
      )}

      <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>
        {t('订阅历史')}
      </Text>
      <div
        className='rounded-[var(--radius-lg)]'
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-default)',
          overflow: 'hidden',
        }}
      >
        <Table
          dataSource={data.all_subscriptions || []}
          columns={historyColumns}
          loading={loading}
          rowKey='id'
          pagination={false}
          empty={
            <div className='py-8 text-center' style={{ color: 'var(--text-muted)' }}>
              {t('暂无订阅记录')}
            </div>
          }
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Usage tab
// ─────────────────────────────────────────────────────────────────────────────

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

  if (loading || !report) {
    return <div className='py-12 text-center'><Spin size='large' /></div>;
  }

  const summary = report.summary || {};
  const trendSpec = {
    type: 'area',
    data: [{ id: 'usage', values: report.daily || [] }],
    xField: 'date',
    yField: 'quota',
    line: { style: { lineWidth: 2, curveType: 'monotone' } },
    area: { style: { fillOpacity: 0.12, curveType: 'monotone' } },
    point: { visible: false },
    axes: [
      { orient: 'bottom', label: { style: { fontSize: 10 } } },
      {
        orient: 'left',
        label: { style: { fontSize: 10 } },
        grid: { style: { lineDash: [3, 3], stroke: 'rgba(128,128,128,0.15)' } },
      },
    ],
    crosshair: {
      xField: { visible: true, line: { style: { stroke: 'rgba(128,128,128,0.3)', lineDash: [3, 3] } } },
    },
    legends: { visible: false },
    title: { visible: true, text: t('近 30 天消费趋势') },
    tooltip: {
      mark: {
        content: [
          { key: () => t('消费'), value: (datum) => renderQuota(datum.quota || 0) },
          { key: () => t('请求'), value: (datum) => `${datum.requests || 0}` },
        ],
      },
    },
  };

  const memberCols = [
    {
      title: t('用户'),
      render: (_, r) => (
        <Text style={{ fontSize: 13 }}>
          {r.display_name || r.username || `#${r.user_id}`}
        </Text>
      ),
    },
    {
      title: t('请求数'),
      dataIndex: 'requests',
      width: 100,
    },
    {
      title: t('消费'),
      dataIndex: 'quota',
      width: 130,
      render: (q) => renderQuota(q || 0),
    },
  ];

  const tokenCols = [
    {
      title: t('令牌'),
      dataIndex: 'token_name',
      render: (n) => <Text style={{ fontSize: 13 }}>{n || '—'}</Text>,
    },
    {
      title: t('请求数'),
      dataIndex: 'requests',
      width: 100,
    },
    {
      title: t('消费'),
      dataIndex: 'quota',
      width: 130,
      render: (q) => renderQuota(q || 0),
    },
  ];

  return (
    <div>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
        <StatCard label={t('总请求数')} value={summary.total_requests || 0} />
        <StatCard label={t('总消费')} value={renderQuota(summary.total_quota || 0)} />
        <StatCard label={t('今日请求')} value={summary.today_requests || 0} />
        <StatCard label={t('本月消费')} value={renderQuota(summary.month_quota || 0)} />
      </div>

      <div
        className='rounded-[var(--radius-lg)] p-4 mb-6'
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-default)',
          height: 320,
        }}
      >
        <VChart spec={trendSpec} option={CHART_CONFIG} />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div>
          <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>
            {t('按成员')}
          </Text>
          <div
            className='rounded-[var(--radius-lg)]'
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              overflow: 'hidden',
            }}
          >
            <Table
              dataSource={report.by_member || []}
              columns={memberCols}
              rowKey='user_id'
              pagination={false}
              empty={
                <div className='py-6 text-center' style={{ color: 'var(--text-muted)' }}>
                  {t('暂无数据')}
                </div>
              }
            />
          </div>
        </div>
        <div>
          <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>
            {t('按令牌')}
          </Text>
          <div
            className='rounded-[var(--radius-lg)]'
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              overflow: 'hidden',
            }}
          >
            <Table
              dataSource={report.by_token || []}
              columns={tokenCols}
              rowKey='token_id'
              pagination={false}
              empty={
                <div className='py-6 text-center' style={{ color: 'var(--text-muted)' }}>
                  {t('暂无数据')}
                </div>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTeamDetail;
