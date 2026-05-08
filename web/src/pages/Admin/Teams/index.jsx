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
  Switch,
  Table,
  Tag,
  Typography,
} from '@douyinfe/semi-ui';
import { IconPlus, IconRefresh, IconSearch } from '@douyinfe/semi-icons';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  API,
  renderQuota,
  showError,
  showSuccess,
} from '../../../helpers';

const { Text } = Typography;

// Format epoch seconds — same shape as elsewhere on the team admin pages.
const formatStableTime = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// AdminTeamsList renders the global team table with inline status toggle,
// keyword search, status filter, and a delete flow that requires the
// admin to type the team name back to confirm.
//
// embedded=true is for rendering inside the team page tabs container
// (no max-width chrome, no own header).
const AdminTeamsList = ({ embedded = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Create-team modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createOwnerId, setCreateOwnerId] = useState();
  const [creating, setCreating] = useState(false);

  // Delete-team confirm modal
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      if (keyword.trim()) params.set('keyword', keyword.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (includeDeleted) params.set('include_deleted', 'true');
      const res = await API.get(`/api/admin/teams?${params.toString()}`);
      if (res.data?.success) {
        setItems(res.data.data?.items || []);
        setTotal(res.data.data?.total || 0);
      } else {
        showError(res.data?.message || t('获取数据失败'));
      }
    } catch {
      showError(t('请求失败'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, statusFilter, includeDeleted, t]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const onSearchSubmit = () => {
    setPage(1);
    fetchList();
  };

  const onToggleStatus = async (row, nextActive) => {
    const teamId = row?.team?.id;
    if (!teamId) return;
    const nextStatus = nextActive ? 1 : 2;
    try {
      const res = await API.put(`/api/admin/teams/${teamId}`, {
        status: nextStatus,
      });
      if (res.data?.success) {
        showSuccess(nextActive ? t('已启用团队') : t('已禁用团队'));
        fetchList();
      } else {
        showError(res.data?.message || t('操作失败'));
      }
    } catch {
      showError(t('请求失败'));
    }
  };

  const onCreate = async () => {
    const name = (createName || '').trim();
    if (!name) {
      showError(t('团队名称不能为空'));
      return;
    }
    setCreating(true);
    try {
      const payload = { name };
      if (createOwnerId && createOwnerId > 0) payload.owner_id = createOwnerId;
      const res = await API.post('/api/admin/teams', payload);
      if (res.data?.success) {
        showSuccess(t('团队创建成功'));
        setCreateOpen(false);
        setCreateName('');
        setCreateOwnerId(undefined);
        fetchList();
      } else {
        showError(res.data?.message || t('创建失败'));
      }
    } catch {
      showError(t('请求失败'));
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    if (deleteConfirmText.trim() !== deleteTarget.name) {
      showError(t('请输入完整的团队名称以确认'));
      return;
    }
    setDeleting(true);
    try {
      const res = await API.delete(`/api/admin/teams/${deleteTarget.id}`);
      if (res.data?.success) {
        showSuccess(t('团队已删除'));
        setDeleteTarget(null);
        setDeleteConfirmText('');
        fetchList();
      } else {
        showError(res.data?.message || t('删除失败'));
      }
    } catch {
      showError(t('请求失败'));
    } finally {
      setDeleting(false);
    }
  };

  const renderStatusPill = (row) => {
    const team = row?.team;
    if (!team) return null;
    if (team?.deleted_at) {
      return <Tag color='grey'>{t('已删除')}</Tag>;
    }
    if (team.status === 2) return <Tag color='red'>{t('已禁用')}</Tag>;
    return <Tag color='green'>{t('正常')}</Tag>;
  };

  const columns = useMemo(
    () => [
      {
        title: 'ID',
        dataIndex: 'team',
        width: 70,
        render: (team) => (
          <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            #{team?.id}
          </Text>
        ),
      },
      {
        title: t('团队名称'),
        dataIndex: 'team',
        width: 180,
        render: (team) => (
          <Text strong style={{ fontSize: 13 }}>
            {team?.name}
          </Text>
        ),
      },
      {
        title: t('Owner'),
        dataIndex: 'owner',
        width: 200,
        render: (owner) =>
          owner ? (
            <div>
              <Text style={{ fontSize: 13 }}>
                {owner.display_name || owner.username || `#${owner.id}`}
              </Text>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {owner.email || `ID: ${owner.id}`}
              </div>
            </div>
          ) : (
            <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</Text>
          ),
      },
      {
        title: t('状态'),
        width: 100,
        render: (_, row) => renderStatusPill(row),
      },
      {
        title: t('成员数'),
        dataIndex: 'member_count',
        width: 80,
        render: (n) => <Text style={{ fontSize: 13 }}>{n || 0}</Text>,
      },
      {
        title: t('活跃订阅'),
        dataIndex: 'active_subscription_count',
        width: 90,
        render: (n) => <Text style={{ fontSize: 13 }}>{n || 0}</Text>,
      },
      {
        title: t('今日消费'),
        dataIndex: 'today_quota',
        width: 110,
        render: (q) => (
          <Text style={{ fontSize: 13 }}>{renderQuota(q || 0)}</Text>
        ),
      },
      {
        title: t('创建时间'),
        dataIndex: 'team',
        width: 160,
        render: (team) => (
          <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {formatStableTime(team?.created_at)}
          </Text>
        ),
      },
      {
        title: t('操作'),
        width: 220,
        render: (_, row) => {
          const team = row?.team;
          const isDeleted = !!team?.deleted_at;
          const isActive = team?.status === 1;
          return (
            <div className='flex items-center gap-2'>
              <Button
                size='small'
                theme='light'
                type='primary'
                onClick={() => navigate(`/console/admin/teams/${team.id}`)}
              >
                {t('查看')}
              </Button>
              {!isDeleted && (
                <Popconfirm
                  title={
                    isActive ? t('确定禁用该团队？') : t('确定启用该团队？')
                  }
                  content={
                    isActive
                      ? t('禁用后该团队所有 token 将立即失效')
                      : t('启用后该团队的 token 将恢复可用')
                  }
                  onConfirm={() => onToggleStatus(row, !isActive)}
                >
                  <Switch
                    checked={isActive}
                    size='small'
                    aria-label={t('启用/禁用')}
                  />
                </Popconfirm>
              )}
              {!isDeleted && (
                <Button
                  size='small'
                  type='danger'
                  theme='light'
                  icon={<Trash2 size={14} />}
                  onClick={() =>
                    setDeleteTarget({ id: team.id, name: team.name })
                  }
                />
              )}
            </div>
          );
        },
      },
    ],
    [t, navigate],
  );

  return (
    <div className={embedded ? '' : 'w-full max-w-7xl mx-auto px-4 sm:px-6 py-8'}>
      {!embedded && (
        <div className='mb-6'>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {t('全局团队管理')}
          </h1>
          <Text
            style={{
              color: 'var(--text-secondary)',
              fontSize: 13,
              marginTop: 4,
            }}
          >
            {t('管理系统中所有团队，包括成员、订阅、用量与启停')}
          </Text>
        </div>
      )}

      {/* Toolbar */}
      <div className='flex items-center justify-between gap-3 mb-4 flex-wrap'>
        <div className='flex items-center gap-2 flex-wrap'>
          <Input
            value={keyword}
            onChange={setKeyword}
            placeholder={t('团队名 / Owner / 邮箱')}
            prefix={<IconSearch />}
            onEnterPress={onSearchSubmit}
            showClear
            style={{ width: 280 }}
          />
          <Select
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            optionList={[
              { value: 'all', label: t('全部状态') },
              { value: 'active', label: t('正常') },
              { value: 'disabled', label: t('已禁用') },
            ]}
            style={{ width: 130 }}
          />
          <div className='flex items-center gap-1'>
            <Switch
              checked={includeDeleted}
              onChange={(v) => {
                setIncludeDeleted(v);
                setPage(1);
              }}
              size='small'
              aria-label={t('包含已删除')}
            />
            <Text style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {t('包含已删除')}
            </Text>
          </div>
          <Button icon={<IconRefresh />} theme='light' onClick={fetchList}>
            {t('刷新')}
          </Button>
        </div>
        <Button
          theme='solid'
          type='primary'
          icon={<IconPlus />}
          onClick={() => setCreateOpen(true)}
          style={{
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-gradient)',
            border: 'none',
            fontWeight: 600,
          }}
        >
          {t('新建团队')}
        </Button>
      </div>

      {/* Table */}
      <div
        className='rounded-[var(--radius-lg)]'
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-default)',
          overflow: 'hidden',
        }}
      >
        <Table
          dataSource={items}
          columns={columns}
          loading={loading}
          rowKey={(r) => r?.team?.id}
          pagination={{
            currentPage: page,
            pageSize,
            total,
            onPageChange: (p) => setPage(p),
          }}
          empty={
            <div
              className='py-12 text-center'
              style={{ color: 'var(--text-muted)' }}
            >
              {t('暂无数据')}
            </div>
          }
        />
      </div>

      {/* Create modal */}
      <Modal
        title={t('新建团队')}
        visible={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={onCreate}
        confirmLoading={creating}
        okText={t('创建')}
        cancelText={t('取消')}
        centered
      >
        <div className='space-y-4 py-2'>
          <div>
            <Text
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 6,
              }}
            >
              {t('团队名称')}
            </Text>
            <Input
              value={createName}
              onChange={setCreateName}
              placeholder={t('输入团队名称')}
              showClear
            />
          </div>
          <div>
            <Text
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 6,
              }}
            >
              {t('Owner 用户 ID（留空则你自己）')}
            </Text>
            <InputNumber
              value={createOwnerId}
              onChange={setCreateOwnerId}
              min={1}
              placeholder={t('用户 ID')}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        title={t('删除团队')}
        visible={!!deleteTarget}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteConfirmText('');
        }}
        footer={
          <div className='flex justify-end gap-2'>
            <Button
              theme='light'
              onClick={() => {
                setDeleteTarget(null);
                setDeleteConfirmText('');
              }}
            >
              {t('取消')}
            </Button>
            <Button
              type='danger'
              theme='solid'
              loading={deleting}
              onClick={onDelete}
              disabled={
                !deleteTarget ||
                deleteConfirmText.trim() !== deleteTarget?.name
              }
            >
              {t('确认删除')}
            </Button>
          </div>
        }
        centered
      >
        {deleteTarget && (
          <div className='space-y-3 py-2'>
            <div
              className='rounded-md p-3 text-sm'
              style={{
                background: 'rgba(220, 38, 38, 0.06)',
                color: 'var(--danger, #dc2626)',
                border: '1px solid rgba(220, 38, 38, 0.18)',
              }}
            >
              {t(
                '该操作会软删团队及其成员、令牌，并终止所有活跃订阅（不退款）',
              )}
            </div>
            <div>
              <Text
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                {t('请输入团队名称')} <strong>「{deleteTarget.name}」</strong>{' '}
                {t('以确认')}
              </Text>
              <Input
                value={deleteConfirmText}
                onChange={setDeleteConfirmText}
                placeholder={deleteTarget.name}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminTeamsList;
