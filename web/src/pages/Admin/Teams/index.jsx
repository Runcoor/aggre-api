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

import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Spin } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router-dom';
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

// AdminTeamsList renders the global team table with inline status toggle,
// keyword search, status filter, and a delete flow that requires the admin
// to type the team name back to confirm.
//
// embedded=true is for rendering inside the team page tabs container —
// the outer wrapper supplies max-width chrome and design class.
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

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createOwnerId, setCreateOwnerId] = useState('');
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [statusToggleTarget, setStatusToggleTarget] = useState(null);

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

  const onConfirmStatusToggle = async () => {
    const target = statusToggleTarget;
    if (!target) return;
    try {
      const res = await API.put(`/api/admin/teams/${target.id}`, {
        status: target.nextActive ? 1 : 2,
      });
      if (res.data?.success) {
        showSuccess(target.nextActive ? t('已启用团队') : t('已禁用团队'));
        fetchList();
      } else {
        showError(res.data?.message || t('操作失败'));
      }
    } catch {
      showError(t('请求失败'));
    } finally {
      setStatusToggleTarget(null);
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
      const ownerId = parseInt(createOwnerId, 10);
      if (Number.isFinite(ownerId) && ownerId > 0) {
        payload.owner_id = ownerId;
      }
      const res = await API.post('/api/admin/teams', payload);
      if (res.data?.success) {
        showSuccess(t('团队创建成功'));
        setCreateOpen(false);
        setCreateName('');
        setCreateOwnerId('');
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
    if (team.deleted_at) {
      return <span className='td-pill td-pill-muted'>● {t('已删除')}</span>;
    }
    if (team.status === 2) {
      return <span className='td-pill td-pill-muted'>● {t('已禁用')}</span>;
    }
    return <span className='td-pill td-pill-ok'>● {t('正常')}</span>;
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(total, page * pageSize);

  const body = (
    <>
      <div className='td-toolbar'>
        <div className='td-search'>
          <TIcon.Search />
          <input
            placeholder={t('搜索 团队名 / Owner / 邮箱')}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearchSubmit();
            }}
          />
        </div>
        <select
          className='td-select'
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value='all'>{t('全部状态')}</option>
          <option value='active'>{t('正常')}</option>
          <option value='disabled'>{t('已禁用')}</option>
        </select>
        <label className='td-toggle-row'>
          <button
            type='button'
            className={'td-switch' + (includeDeleted ? ' on' : '')}
            onClick={() => {
              setIncludeDeleted((v) => !v);
              setPage(1);
            }}
            aria-label={t('包含已删除')}
          />
          {t('包含已删除')}
        </label>
        <button
          type='button'
          className='td-btn td-btn-ghost'
          onClick={fetchList}
        >
          <TIcon.Refresh />
          {t('刷新')}
        </button>
        <div className='td-toolbar-right'>
          <button
            type='button'
            className='td-btn td-btn-primary'
            onClick={() => setCreateOpen(true)}
          >
            <TIcon.Plus />
            {t('新建团队')}
          </button>
        </div>
      </div>

      <div className='td-table-card'>
        <div className='td-table-scroll'>
          <table className='td-t'>
            <thead>
              <tr>
                <th style={{ width: 70 }}>ID</th>
                <th>{t('团队')}</th>
                <th>{t('Owner')}</th>
                <th>{t('状态')}</th>
                <th className='num'>{t('成员')}</th>
                <th className='num'>{t('活跃订阅')}</th>
                <th className='num'>{t('今日消费')}</th>
                <th>{t('创建时间')}</th>
                <th className='actions'>{t('操作')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px 16px' }}>
                    <Spin />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--td-ink-400)' }}>
                    {t('暂无数据')}
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const team = row?.team || {};
                  const owner = row?.owner;
                  const isDeleted = !!team.deleted_at;
                  const isActive = team.status === 1;
                  return (
                    <tr key={team.id}>
                      <td className='id-cell'>#{team.id}</td>
                      <td>
                        <div className='td-user-cell'>
                          <div className={'td-avatar ' + avatarColor(team.id)}>
                            {initials(team.name)}
                          </div>
                          <div className='info'>
                            <div className='name'>{team.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {owner ? (
                          <div style={{ lineHeight: 1.35 }}>
                            <div style={{ fontWeight: 500 }}>
                              {owner.display_name || owner.username || `#${owner.id}`}
                            </div>
                            <div
                              style={{ fontSize: 11.5, color: 'var(--td-ink-400)' }}
                              className={owner.email ? '' : 'td-mono'}
                            >
                              {owner.email || `ID: ${owner.id}`}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--td-ink-400)' }}>—</span>
                        )}
                      </td>
                      <td>{renderStatusPill(row)}</td>
                      <td className='num'>{row.member_count || 0}</td>
                      <td className='num'>{row.active_subscription_count || 0}</td>
                      <td className='num'>{renderQuota(row.today_quota || 0)}</td>
                      <td className='td-mono' style={{ color: 'var(--td-ink-500)', fontSize: 12 }}>
                        {formatStableTime(team.created_at)}
                      </td>
                      <td className='actions'>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type='button'
                            className='td-btn td-btn-ghost td-btn-sm'
                            onClick={() => navigate(`/console/admin/teams/${team.id}`)}
                          >
                            <TIcon.Eye />
                            {t('查看')}
                          </button>
                          {!isDeleted && (
                            <button
                              type='button'
                              className='td-icon-btn'
                              title={isActive ? t('禁用') : t('启用')}
                              onClick={() =>
                                setStatusToggleTarget({
                                  id: team.id,
                                  name: team.name,
                                  isActive,
                                  nextActive: !isActive,
                                })
                              }
                            >
                              <TIcon.Power />
                            </button>
                          )}
                          {!isDeleted && (
                            <button
                              type='button'
                              className='td-icon-btn danger'
                              title={t('删除')}
                              onClick={() =>
                                setDeleteTarget({ id: team.id, name: team.name })
                              }
                            >
                              <TIcon.Trash />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className='td-table-foot'>
          <div>
            {t('显示第')} {rangeStart} {t('条 - 第')} {rangeEnd} {t('条，共')} {total} {t('条')}
          </div>
          <div className='td-pager'>
            <button
              type='button'
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <TIcon.ChevronLeft />
            </button>
            <button type='button' className='active'>
              {page}
            </button>
            <button
              type='button'
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <TIcon.ChevronRight />
            </button>
          </div>
        </div>
      </div>

      <CreateTeamModal
        visible={createOpen}
        name={createName}
        ownerId={createOwnerId}
        creating={creating}
        onName={setCreateName}
        onOwnerId={setCreateOwnerId}
        onClose={() => setCreateOpen(false)}
        onCreate={onCreate}
        t={t}
      />

      <DeleteTeamModal
        target={deleteTarget}
        confirm={deleteConfirmText}
        deleting={deleting}
        onConfirm={setDeleteConfirmText}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteConfirmText('');
        }}
        onDelete={onDelete}
        t={t}
      />

      <StatusToggleModal
        target={statusToggleTarget}
        onClose={() => setStatusToggleTarget(null)}
        onConfirm={onConfirmStatusToggle}
        t={t}
      />
    </>
  );

  if (embedded) return body;
  return (
    <div className='team-design w-full max-w-[1240px] mx-auto px-7 pt-7 pb-20'>
      <div className='td-head'>
        <div>
          <h1 className='td-title'>{t('全局团队管理')}</h1>
          <div className='td-sub'>
            {t('管理系统中所有团队，包括成员、订阅、用量与启停')}
          </div>
        </div>
      </div>
      {body}
    </div>
  );
};

const CreateTeamModal = ({ visible, name, ownerId, creating, onName, onOwnerId, onClose, onCreate, t }) => (
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
            <TIcon.Plus size={18} />
          </div>
          <div>
            <h3>{t('新建团队')}</h3>
            <p>{t('作为管理员，可直接为任意用户创建团队')}</p>
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
            placeholder={t('输入团队名称')}
            value={name}
            onChange={(e) => onName(e.target.value)}
            maxLength={24}
          />
        </div>
        <div className='td-form-row'>
          <label className='td-form-label'>
            {t('Owner 用户 ID')}
            <span className='td-form-label-aside'>{t('留空则为你自己')}</span>
          </label>
          <input
            className='td-form-input mono'
            type='number'
            placeholder={t('用户 ID')}
            value={ownerId}
            onChange={(e) => onOwnerId(e.target.value)}
            min={1}
          />
          <div className='td-form-hint'>
            {t('指定后该团队将归属此用户，可在创建后再次转让')}
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
          disabled={!name.trim() || creating}
          onClick={onCreate}
        >
          <TIcon.Check />
          {t('创建')}
        </button>
      </div>
    </div>
  </Modal>
);

const DeleteTeamModal = ({ target, confirm, deleting, onConfirm, onClose, onDelete, t }) => (
  <Modal
    visible={!!target}
    onCancel={onClose}
    header={null}
    footer={null}
    closable={false}
    centered
    width={480}
    className='td-modal-host'
    bodyStyle={{ padding: 0 }}
  >
    {target && (
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
          <div className='td-form-row'>
            <label className='td-form-label'>
              {t('输入团队名称以确认')}
              <span className='td-form-label-aside'>{t('不可恢复')}</span>
            </label>
            <input
              className='td-form-input mono'
              placeholder={target.name}
              value={confirm}
              onChange={(e) => onConfirm(e.target.value)}
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
            disabled={confirm.trim() !== target.name || deleting}
            onClick={onDelete}
          >
            <TIcon.Trash />
            {t('永久删除')}
          </button>
        </div>
      </div>
    )}
  </Modal>
);

const StatusToggleModal = ({ target, onClose, onConfirm, t }) => (
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
            <div className={'ic-wrap' + (target.isActive ? ' warn' : '')}>
              <TIcon.Power size={18} />
            </div>
            <div>
              <h3>
                {target.isActive ? t('禁用团队？') : t('启用团队？')}
              </h3>
              <p>
                {target.isActive
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
            className={
              target.isActive ? 'td-btn td-btn-warn-ghost' : 'td-btn td-btn-primary'
            }
            onClick={onConfirm}
          >
            {target.isActive ? t('确认禁用') : t('确认启用')}
          </button>
        </div>
      </div>
    )}
  </Modal>
);

export default AdminTeamsList;
