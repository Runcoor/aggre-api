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

import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Skeleton } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API, isAdmin, showError, showSuccess } from '../../helpers';
import { TIcon } from './teamIcons';
import { avatarColor, initials } from './teamUiKit';

const APP_PENDING = 0;
const APP_APPROVED = 1;
const APP_REJECTED = 2;
const APP_CANCELED = 3;

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

const AppStatusPill = ({ status, t }) => {
  if (status === APP_PENDING) {
    return <span className='td-pill td-pill-warn'>{t('待审核')}</span>;
  }
  if (status === APP_APPROVED) {
    return (
      <span className='td-pill td-pill-ok'>
        <TIcon.Check size={11} />
        {t('已通过')}
      </span>
    );
  }
  if (status === APP_REJECTED) {
    return (
      <span className='td-pill td-pill-danger'>
        <TIcon.X size={11} />
        {t('已驳回')}
      </span>
    );
  }
  return <span className='td-pill td-pill-muted'>{t('已撤回')}</span>;
};

const MyTeams = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const admin = isAdmin();

  const [teams, setTeams] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [applyVisible, setApplyVisible] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamReason, setTeamReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    } catch {
      // surface via empty state
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
      const url = admin ? '/api/admin/teams' : '/api/team/apply';
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
      } else {
        showError(res.data?.message || t('加入失败'));
      }
    } catch {
      showError(t('请求失败'));
    }
    setJoining(false);
  };

  const renderEmpty = () => (
    <div className='td-empty'>
      <div className='td-empty-icon'>
        <TIcon.Users size={24} />
      </div>
      <div className='td-empty-title'>{t('还没有加入任何团队')}</div>
      <div className='td-empty-sub'>
        {admin
          ? t('创建团队或通过邀请链接加入，与成员共享订阅与 API 令牌额度')
          : t('申请创建或通过邀请链接加入团队，由管理员审核后开通')}
      </div>
      <div className='td-empty-actions'>
        <button
          type='button'
          className='td-btn td-btn-ghost td-btn-lg'
          onClick={() => setJoinVisible(true)}
        >
          <TIcon.UserPlus />
          {t('加入团队')}
        </button>
        <button
          type='button'
          className='td-btn td-btn-primary td-btn-lg'
          onClick={() => setApplyVisible(true)}
          disabled={!admin && !!pendingApp}
        >
          <TIcon.Plus />
          {admin ? t('新建团队') : t('申请创建团队')}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {/* Toolbar */}
      <div className='td-toolbar'>
        <div className='td-toolbar-hint'>
          {admin
            ? t('创建或加入团队，共享 API 额度与订阅')
            : t('申请创建或加入团队，由管理员审核后开通')}
        </div>
        <div className='td-toolbar-right'>
          <button
            type='button'
            className='td-btn td-btn-ghost'
            onClick={() => setJoinVisible(true)}
          >
            <TIcon.UserPlus />
            {t('加入团队')}
          </button>
          <button
            type='button'
            className='td-btn td-btn-primary'
            onClick={() => setApplyVisible(true)}
            disabled={!admin && !!pendingApp}
            title={
              !admin && pendingApp ? t('已有待审核的申请') : undefined
            }
          >
            <TIcon.Plus />
            {admin ? t('新建团队') : t('申请创建团队')}
          </button>
        </div>
      </div>

      {pendingApp && !admin && (
        <div className='td-alert' style={{ marginTop: -2 }}>
          <span className='icon'>
            <TIcon.Clock />
          </span>
          <div style={{ display: 'flex', flex: 1, gap: 12, alignItems: 'center' }}>
            <span style={{ flex: 1 }}>
              {t('您的团队创建申请')}{' '}
              <strong>「{pendingApp.name}」</strong>{' '}
              {t('正在等待管理员审核')}
            </span>
            <button
              type='button'
              className='td-btn td-btn-ghost td-btn-sm'
              onClick={() => handleWithdraw(pendingApp.id)}
            >
              {t('撤回申请')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className='td-team-grid'>
          {[1, 2].map((i) => (
            <div key={i} className='td-team-card' style={{ cursor: 'default' }}>
              <Skeleton.Title active style={{ width: '60%', marginBottom: 12 }} />
              <Skeleton.Paragraph active rows={1} />
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        renderEmpty()
      ) : (
        <div className='td-team-grid'>
          {teams.map((item) => {
            const team = item.team;
            const role = item.role;
            const memberCount = item.member_count;
            return (
              <div
                key={team.id}
                className='td-team-card'
                onClick={() => navigate(`/console/team/${team.id}`)}
              >
                <div className='td-team-card-head'>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <div className={'td-avatar lg ' + avatarColor(team.id)}>
                      {initials(team.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className='td-team-card-name' style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {team.name}
                      </div>
                      <div className='td-team-card-id'>ID #{team.id}</div>
                    </div>
                  </div>
                  <RolePill role={role} t={t} />
                </div>
                <div className='td-team-card-meta'>
                  <span className='td-team-card-meta-item'>
                    <TIcon.Users />
                    <strong>{memberCount}</strong> {t('位成员')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!admin && applications.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div className='td-section-head'>
            <div>
              <div className='title'>{t('我的申请记录')}</div>
              <div className='meta'>{t('查看历史申请的审核结果')}</div>
            </div>
          </div>
          <div className='td-table-card'>
            <div className='td-table-scroll'>
              <table className='td-t'>
                <thead>
                  <tr>
                    <th>{t('团队名称')}</th>
                    <th>{t('状态')}</th>
                    <th>{t('审核意见')}</th>
                    <th>{t('提交时间')}</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <strong>{app.name}</strong>
                      </td>
                      <td>
                        <AppStatusPill status={app.status} t={t} />
                      </td>
                      <td style={{ color: 'var(--td-ink-500)' }}>
                        {app.review_comment || (
                          <span style={{ color: 'var(--td-ink-400)' }}>—</span>
                        )}
                      </td>
                      <td className='td-mono' style={{ color: 'var(--td-ink-500)', fontSize: 12 }}>
                        {app.created_at
                          ? new Date(app.created_at * 1000).toLocaleString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <CreateTeamModal
        visible={applyVisible}
        admin={admin}
        name={teamName}
        reason={teamReason}
        submitting={submitting}
        onName={setTeamName}
        onReason={setTeamReason}
        onClose={() => setApplyVisible(false)}
        onSubmit={handleSubmit}
        t={t}
      />

      <JoinTeamModal
        visible={joinVisible}
        code={inviteCode}
        joining={joining}
        onCode={setInviteCode}
        onClose={() => setJoinVisible(false)}
        onJoin={handleJoin}
        t={t}
      />
    </div>
  );
};

const CreateTeamModal = ({ visible, admin, name, reason, submitting, onName, onReason, onClose, onSubmit, t }) => (
  <Modal
    visible={visible}
    onCancel={onClose}
    header={null}
    footer={null}
    closable={false}
    centered
    width={admin ? 480 : 480}
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
            <h3>{admin ? t('新建团队') : t('申请创建团队')}</h3>
            <p>
              {admin
                ? t('作为管理员，可直接为任意用户创建团队')
                : t('提交后由管理员审核，通过后自动建立团队')}
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
            {t('团队名称')}
            <span className='req'>*</span>
          </label>
          <input
            className='td-form-input'
            placeholder={t('例如：Frontier Research')}
            value={name}
            onChange={(e) => onName(e.target.value)}
            maxLength={24}
          />
          <div className='td-form-hint'>{t('2–24 个字符，团队建立后仍可修改')}</div>
        </div>
        {!admin && (
          <div className='td-form-row'>
            <label className='td-form-label'>
              {t('申请理由')}
              <span className='td-form-label-aside'>{(reason || '').length}/200</span>
            </label>
            <textarea
              className='td-form-textarea'
              maxLength={200}
              placeholder={t('简单描述团队用途、预计成员数和使用场景，便于管理员审核')}
              value={reason}
              onChange={(e) => onReason(e.target.value)}
            />
          </div>
        )}
      </div>
      <div className='td-modal-foot'>
        <button type='button' className='td-btn td-btn-ghost' onClick={onClose}>
          {t('取消')}
        </button>
        <button
          type='button'
          className='td-btn td-btn-primary'
          disabled={!name.trim() || submitting}
          onClick={onSubmit}
        >
          <TIcon.Send />
          {admin ? t('创建') : t('提交申请')}
        </button>
      </div>
    </div>
  </Modal>
);

const JoinTeamModal = ({ visible, code, joining, onCode, onClose, onJoin, t }) => (
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
            <h3>{t('加入团队')}</h3>
            <p>{t('输入邀请码或粘贴邀请链接')}</p>
          </div>
        </div>
        <button type='button' className='td-modal-close' onClick={onClose}>
          <TIcon.X />
        </button>
      </div>
      <div className='td-modal-body'>
        <div className='td-form-row'>
          <label className='td-form-label'>
            {t('邀请码 / 链接')}
            <span className='req'>*</span>
          </label>
          <input
            className='td-form-input mono'
            placeholder='HpUKS7r7  /  https://...'
            value={code}
            onChange={(e) => onCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !joining) onJoin();
            }}
          />
          <div className='td-form-hint'>
            {t('邀请码由团队所有者或管理员分享，加入后将共享团队订阅与令牌额度')}
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
          disabled={!code.trim() || joining}
          onClick={onJoin}
        >
          <TIcon.Check />
          {t('加入')}
        </button>
      </div>
    </div>
  </Modal>
);

export default MyTeams;
