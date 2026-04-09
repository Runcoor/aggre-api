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

import React from 'react';
import {
  Button,
  Space,
  Tooltip,
  Progress,
  Popover,
  Typography,
  Dropdown,
} from '@douyinfe/semi-ui';
import { IconMore } from '@douyinfe/semi-icons';
import { renderGroup, renderNumber, renderQuota } from '../../../helpers';

// iOS-style inline badge helper
const InlineBadge = ({ color, bg, mono, children, style: extraStyle }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '1px 8px',
      borderRadius: 'var(--radius-sm)',
      fontSize: '12px',
      fontWeight: 500,
      fontFamily: mono ? 'var(--font-mono)' : undefined,
      color: color || 'var(--text-secondary)',
      background: bg || 'var(--surface-active)',
      lineHeight: '20px',
      whiteSpace: 'nowrap',
      ...extraStyle,
    }}
  >
    {children}
  </span>
);

const roleStyleMap = {
  1: { color: 'var(--accent)', bg: 'var(--accent-light)', label: '普通用户' },
  10: { color: 'var(--warning)', bg: 'rgba(255, 149, 0, 0.12)', label: '管理员' },
  100: { color: 'var(--error)', bg: 'rgba(255, 59, 48, 0.12)', label: '超级管理员' },
};

/**
 * Render user role
 */
const renderRole = (role, t) => {
  const cfg = roleStyleMap[role] || { color: 'var(--text-muted)', bg: 'var(--surface-active)', label: '未知身份' };
  return (
    <InlineBadge color={cfg.color} bg={cfg.bg}>
      {t(cfg.label)}
    </InlineBadge>
  );
};

/**
 * Render username with remark
 */
const renderUsername = (text, record) => {
  const remark = record.remark;
  if (!remark) {
    return <span>{text}</span>;
  }
  const maxLen = 10;
  const displayRemark =
    remark.length > maxLen ? remark.slice(0, maxLen) + '…' : remark;
  return (
    <div className='flex items-center gap-1'>
      <span>{text}</span>
      <Tooltip content={remark} position='top' showArrow>
        <InlineBadge style={{ fontSize: '11px', padding: '0px 6px' }}>
          <div
            className='w-1.5 h-1.5 flex-shrink-0 rounded-full'
            style={{ backgroundColor: 'var(--success)' }}
          />
          {displayRemark}
        </InlineBadge>
      </Tooltip>
    </div>
  );
};

/**
 * Render user statistics
 */
const renderStatistics = (text, record, showEnableDisableModal, t) => {
  const isDeleted = record.DeletedAt !== null;

  // Determine status style using iOS system colors
  let statusColor = 'var(--text-muted)';
  let statusBg = 'var(--surface-active)';
  let tagText = t('未知状态');
  if (isDeleted) {
    statusColor = 'var(--error)';
    statusBg = 'rgba(255, 59, 48, 0.12)';
    tagText = t('已注销');
  } else if (record.status === 1) {
    statusColor = 'var(--success)';
    statusBg = 'rgba(52, 199, 89, 0.12)';
    tagText = t('已启用');
  } else if (record.status === 2) {
    statusColor = 'var(--error)';
    statusBg = 'rgba(255, 59, 48, 0.12)';
    tagText = t('已禁用');
  }

  const content = (
    <InlineBadge color={statusColor} bg={statusBg} style={{ fontSize: '11px', padding: '0px 6px' }}>
      {tagText}
    </InlineBadge>
  );

  const tooltipContent = (
    <div className='text-xs'>
      <div>
        {t('调用次数')}: {renderNumber(record.request_count)}
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent} position='top'>
      {content}
    </Tooltip>
  );
};

// Render separate quota usage column
const renderQuotaUsage = (text, record, t) => {
  const { Paragraph } = Typography;
  const used = parseInt(record.used_quota) || 0;
  const remain = parseInt(record.quota) || 0;
  const total = used + remain;
  const percent = total > 0 ? (remain / total) * 100 : 0;
  const popoverContent = (
    <div className='text-xs p-2'>
      <Paragraph copyable={{ content: renderQuota(used) }}>
        {t('已用额度')}: {renderQuota(used)}
      </Paragraph>
      <Paragraph copyable={{ content: renderQuota(remain) }}>
        {t('剩余额度')}: {renderQuota(remain)} ({percent.toFixed(0)}%)
      </Paragraph>
      <Paragraph copyable={{ content: renderQuota(total) }}>
        {t('总额度')}: {renderQuota(total)}
      </Paragraph>
    </div>
  );
  return (
    <Popover content={popoverContent} position='top'>
      <span
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--surface-active)',
        }}
      >
        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', lineHeight: '16px' }}>
          {`${renderQuota(remain)} / ${renderQuota(total)}`}
        </span>
        <Progress
          percent={percent}
          aria-label='quota usage'
          format={() => `${percent.toFixed(0)}%`}
          style={{ width: '100%', marginTop: '1px', marginBottom: 0 }}
        />
      </span>
    </Popover>
  );
};

/**
 * Render invite information
 */
const renderInviteInfo = (text, record, t) => {
  return (
    <div className='flex flex-wrap gap-1'>
      <InlineBadge mono style={{ fontSize: '11px', padding: '0px 6px' }}>
        {t('邀请')}: {renderNumber(record.aff_count)}
      </InlineBadge>
      <InlineBadge mono style={{ fontSize: '11px', padding: '0px 6px' }}>
        {t('收益')}: {renderQuota(record.aff_history_quota)}
      </InlineBadge>
      <InlineBadge style={{ fontSize: '11px', padding: '0px 6px' }}>
        {record.inviter_id === 0
          ? t('无邀请人')
          : `${t('邀请人')}: ${record.inviter_id}`}
      </InlineBadge>
    </div>
  );
};

/**
 * Render operations column
 */
const renderOperations = (
  text,
  record,
  {
    setEditingUser,
    setShowEditUser,
    showPromoteModal,
    showDemoteModal,
    showEnableDisableModal,
    showDeleteModal,
    showResetPasskeyModal,
    showResetTwoFAModal,
    showUserSubscriptionsModal,
    t,
  },
) => {
  if (record.DeletedAt !== null) {
    return <></>;
  }

  const moreMenu = [
    {
      node: 'item',
      name: t('订阅管理'),
      onClick: () => showUserSubscriptionsModal(record),
    },
    {
      node: 'divider',
    },
    {
      node: 'item',
      name: t('重置 Passkey'),
      onClick: () => showResetPasskeyModal(record),
    },
    {
      node: 'item',
      name: t('重置 2FA'),
      onClick: () => showResetTwoFAModal(record),
    },
    {
      node: 'divider',
    },
    {
      node: 'item',
      name: t('注销'),
      type: 'danger',
      onClick: () => showDeleteModal(record),
    },
  ];

  return (
    <Space>
      {record.status === 1 ? (
        <Button
          type='danger'
          size='small'
          onClick={() => showEnableDisableModal(record, 'disable')}
        >
          {t('禁用')}
        </Button>
      ) : (
        <Button
          size='small'
          onClick={() => showEnableDisableModal(record, 'enable')}
        >
          {t('启用')}
        </Button>
      )}
      <Button
        type='tertiary'
        size='small'
        onClick={() => {
          setEditingUser(record);
          setShowEditUser(true);
        }}
      >
        {t('编辑')}
      </Button>
      <Button
        type='warning'
        size='small'
        onClick={() => showPromoteModal(record)}
      >
        {t('提升')}
      </Button>
      <Button
        type='secondary'
        size='small'
        onClick={() => showDemoteModal(record)}
      >
        {t('降级')}
      </Button>
      <Dropdown menu={moreMenu} trigger='click' position='bottomRight'>
        <Button type='tertiary' size='small' icon={<IconMore />} />
      </Dropdown>
    </Space>
  );
};

/**
 * Get users table column definitions
 */
export const getUsersColumns = ({
  t,
  setEditingUser,
  setShowEditUser,
  showPromoteModal,
  showDemoteModal,
  showEnableDisableModal,
  showDeleteModal,
  showResetPasskeyModal,
  showResetTwoFAModal,
  showUserSubscriptionsModal,
}) => {
  return [
    {
      title: 'ID',
      dataIndex: 'id',
    },
    {
      title: t('用户名'),
      dataIndex: 'username',
      render: (text, record) => renderUsername(text, record),
    },
    {
      title: t('状态'),
      dataIndex: 'info',
      render: (text, record, index) =>
        renderStatistics(text, record, showEnableDisableModal, t),
    },
    {
      title: t('剩余额度/总额度'),
      key: 'quota_usage',
      render: (text, record) => renderQuotaUsage(text, record, t),
    },
    {
      title: t('分组'),
      dataIndex: 'group',
      render: (text, record, index) => {
        return <div>{renderGroup(text)}</div>;
      },
    },
    {
      title: t('角色'),
      dataIndex: 'role',
      render: (text, record, index) => {
        return <div>{renderRole(text, t)}</div>;
      },
    },
    {
      title: t('邀请信息'),
      dataIndex: 'invite',
      render: (text, record, index) => renderInviteInfo(text, record, t),
    },
    {
      title: '',
      dataIndex: 'operate',
      fixed: 'right',
      width: 200,
      render: (text, record, index) =>
        renderOperations(text, record, {
          setEditingUser,
          setShowEditUser,
          showPromoteModal,
          showDemoteModal,
          showEnableDisableModal,
          showDeleteModal,
          showResetPasskeyModal,
          showResetTwoFAModal,
          showUserSubscriptionsModal,
          t,
        }),
    },
  ];
};
