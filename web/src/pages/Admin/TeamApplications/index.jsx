/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Modal,
  Select,
  Spin,
  Table,
  Tag,
  TextArea,
  Typography,
} from '@douyinfe/semi-ui';
import { IconRefresh } from '@douyinfe/semi-icons';
import { Crown, Mail, User as UserIcon, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API, renderQuota, showError, showSuccess } from '../../../helpers';

const { Text } = Typography;

const APP_PENDING = 0;
const APP_APPROVED = 1;
const APP_REJECTED = 2;
const APP_CANCELED = 3;

const STATUS_OPTIONS = (t) => [
  { value: '0', label: t('待审核') },
  { value: '-1', label: t('全部状态') },
  { value: '1', label: t('已通过') },
  { value: '2', label: t('已驳回') },
  { value: '3', label: t('已撤回') },
];

const renderStatus = (status, t) => {
  switch (status) {
    case APP_PENDING:
      return <Tag color='blue'>{t('待审核')}</Tag>;
    case APP_APPROVED:
      return <Tag color='green'>{t('已通过')}</Tag>;
    case APP_REJECTED:
      return <Tag color='red'>{t('已驳回')}</Tag>;
    case APP_CANCELED:
      return <Tag color='grey'>{t('已撤回')}</Tag>;
    default:
      return <Tag>{status}</Tag>;
  }
};

const formatTime = (ts) => (ts ? new Date(ts * 1000).toLocaleString() : '-');

const TeamApplicationsAdmin = () => {
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('0'); // pending by default
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Detail modal state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('p', page);
      params.set('size', pageSize);
      params.set('status', status);
      const res = await API.get(`/api/admin/team-applications?${params.toString()}`);
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
  }, [page, pageSize, status, t]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openDetail = async (appId) => {
    setDetailOpen(true);
    setDetail(null);
    setReviewComment('');
    setDetailLoading(true);
    try {
      const res = await API.get(`/api/admin/team-applications/${appId}`);
      if (res.data?.success) {
        setDetail(res.data.data);
      } else {
        showError(res.data?.message || t('加载详情失败'));
        setDetailOpen(false);
      }
    } catch {
      showError(t('请求失败'));
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!detail?.application?.id) return;
    setReviewing(true);
    try {
      const res = await API.post(
        `/api/admin/team-applications/${detail.application.id}/approve`,
        { comment: reviewComment.trim() },
      );
      if (res.data?.success) {
        showSuccess(t('已通过申请，团队已创建'));
        setDetailOpen(false);
        fetchList();
      } else {
        showError(res.data?.message || t('操作失败'));
      }
    } catch {
      showError(t('请求失败'));
    } finally {
      setReviewing(false);
    }
  };

  const handleReject = async () => {
    if (!detail?.application?.id) return;
    if (!reviewComment.trim()) {
      showError(t('请填写驳回原因'));
      return;
    }
    setReviewing(true);
    try {
      const res = await API.post(
        `/api/admin/team-applications/${detail.application.id}/reject`,
        { comment: reviewComment.trim() },
      );
      if (res.data?.success) {
        showSuccess(t('已驳回申请'));
        setDetailOpen(false);
        fetchList();
      } else {
        showError(res.data?.message || t('操作失败'));
      }
    } catch {
      showError(t('请求失败'));
    } finally {
      setReviewing(false);
    }
  };

  const columns = [
    {
      title: t('申请人'),
      dataIndex: 'username',
      width: 180,
      render: (text, record) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {record.display_name || text || `#${record.application?.user_id}`}
          </Text>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {text || `ID: ${record.application?.user_id}`}
          </div>
        </div>
      ),
    },
    {
      title: t('团队名称'),
      dataIndex: 'application',
      width: 180,
      render: (app) => <Text style={{ fontSize: 13 }}>{app?.name}</Text>,
    },
    {
      title: t('钱包余额'),
      dataIndex: 'user_quota',
      width: 130,
      render: (q) => <Text style={{ fontSize: 13 }}>{renderQuota(q || 0)}</Text>,
    },
    {
      title: t('状态'),
      dataIndex: 'application',
      width: 90,
      render: (app) => renderStatus(app?.status, t),
    },
    {
      title: t('提交时间'),
      dataIndex: 'application',
      width: 170,
      render: (app) => (
        <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {formatTime(app?.created_at)}
        </Text>
      ),
    },
    {
      title: t('操作'),
      dataIndex: 'application',
      width: 100,
      render: (app) => (
        <Button
          size='small'
          theme='light'
          type='primary'
          onClick={() => openDetail(app?.id)}
        >
          {t('查看')}
        </Button>
      ),
    },
  ];

  return (
    <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 py-8'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', margin: 0 }}>
            {t('团队审批')}
          </h1>
          <Text style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            {t('审核用户提交的团队创建申请')}
          </Text>
        </div>
        <div className='flex items-center gap-2'>
          <Select
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            optionList={STATUS_OPTIONS(t)}
            style={{ width: 140 }}
          />
          <Button icon={<IconRefresh />} theme='light' onClick={fetchList}>
            {t('刷新')}
          </Button>
        </div>
      </div>

      <div
        className='rounded-[var(--radius-lg)]'
        style={{ background: 'var(--surface)', border: '1px solid var(--border-default)', overflow: 'hidden' }}
      >
        <Table
          columns={columns}
          dataSource={items}
          loading={loading}
          rowKey={(r) => r.application?.id}
          pagination={{
            currentPage: page,
            pageSize,
            total,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
          empty={
            <div className='text-center py-10' style={{ color: 'var(--text-muted)' }}>
              {t('暂无申请')}
            </div>
          }
        />
      </div>

      {/* Detail / review modal */}
      <Modal
        title={t('申请详情')}
        visible={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        size='large'
        centered
      >
        {detailLoading || !detail ? (
          <div className='py-8 text-center'>
            <Spin />
          </div>
        ) : (
          <DetailBody
            t={t}
            detail={detail}
            reviewComment={reviewComment}
            setReviewComment={setReviewComment}
            onApprove={handleApprove}
            onReject={handleReject}
            reviewing={reviewing}
          />
        )}
      </Modal>
    </div>
  );
};

const DetailBody = ({ t, detail, reviewComment, setReviewComment, onApprove, onReject, reviewing }) => {
  const app = detail.application;
  const u = detail.user || {};
  const isPending = app?.status === APP_PENDING;

  return (
    <div className='space-y-5'>
      {/* Application meta */}
      <div
        className='rounded-[var(--radius-md)] p-4'
        style={{ background: 'var(--surface-active)', border: '1px solid var(--border-default)' }}
      >
        <div className='flex items-center justify-between mb-2'>
          <Text strong style={{ fontSize: 16 }}>{app?.name}</Text>
          {renderStatus(app?.status, t)}
        </div>
        <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {t('提交时间')}: {formatTime(app?.created_at)}
          {app?.reviewed_at ? ` · ${t('审核时间')}: ${formatTime(app.reviewed_at)}` : ''}
        </Text>
        {app?.reason && (
          <div className='mt-3 pt-3' style={{ borderTop: '1px solid var(--border-default)' }}>
            <Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              {t('申请理由')}
            </Text>
            <Text style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
              {app.reason}
            </Text>
          </div>
        )}
        {app?.review_comment && (
          <div className='mt-3 pt-3' style={{ borderTop: '1px solid var(--border-default)' }}>
            <Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              {t('审核意见')}
            </Text>
            <Text style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
              {app.review_comment}
            </Text>
          </div>
        )}
      </div>

      {/* Applicant profile */}
      <div>
        <Text strong style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
          {t('申请人信息')}
        </Text>
        <div className='grid grid-cols-2 gap-3'>
          <InfoCell icon={<UserIcon size={14} />} label={t('用户名')} value={u.username || '-'} />
          <InfoCell icon={<Mail size={14} />} label={t('邮箱')} value={u.email || '-'} />
          <InfoCell label={t('显示名称')} value={u.display_name || '-'} />
          <InfoCell label={t('用户ID')} value={u.id || '-'} />
        </div>
      </div>

      {/* Billing snapshot */}
      <div>
        <Text strong style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
          {t('账户与计费')}
        </Text>
        <div className='grid grid-cols-2 gap-3'>
          <InfoCell
            icon={<Wallet size={14} />}
            label={t('钱包余额')}
            value={renderQuota(u.quota || 0)}
          />
          <InfoCell label={t('累计已用')} value={renderQuota(u.used_quota || 0)} />
          <InfoCell
            label={t('累计充值金额')}
            value={`￥${(detail.topup_total_amount || 0).toFixed(2)}`}
          />
          <InfoCell
            label={t('充值次数')}
            value={`${detail.topup_count || 0} ${t('次')}`}
          />
          <InfoCell label={t('已拥有团队')} value={`${detail.owned_team_count || 0}`} />
          <InfoCell label={t('已加入团队')} value={`${detail.joined_team_count || 0}`} />
        </div>
      </div>

      {/* Active subscriptions */}
      <div>
        <Text strong style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
          <Crown size={13} style={{ display: 'inline', marginRight: 4, color: 'var(--warning, #f59e0b)' }} />
          {t('活跃订阅')}
        </Text>
        {detail.active_subscriptions && detail.active_subscriptions.length > 0 ? (
          <div className='space-y-2'>
            {detail.active_subscriptions.map((s, i) => {
              const sub = s.subscription || s;
              return (
                <div
                  key={i}
                  className='rounded-[var(--radius-md)] p-3 flex justify-between items-center'
                  style={{ background: 'var(--surface-active)', border: '1px solid var(--border-default)' }}
                >
                  <div>
                    <Text strong style={{ fontSize: 13 }}>
                      {sub.plan_title || sub.title || `Plan #${sub.plan_id}`}
                    </Text>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {t('到期')}: {formatTime(sub.end_time)}
                    </div>
                  </div>
                  <Tag color='green'>{t('生效中')}</Tag>
                </div>
              );
            })}
          </div>
        ) : (
          <Text style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('无活跃订阅')}</Text>
        )}
      </div>

      {/* Review actions */}
      {isPending && (
        <div className='pt-4' style={{ borderTop: '1px solid var(--border-default)' }}>
          <Text strong style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
            {t('审核意见')}
          </Text>
          <TextArea
            value={reviewComment}
            onChange={setReviewComment}
            placeholder={t('通过可选填，驳回必须说明原因')}
            rows={3}
            maxLength={2000}
            showCounter
            style={{ borderRadius: 'var(--radius-md)', marginBottom: 12 }}
          />
          <div className='flex justify-end gap-2'>
            <Button onClick={onReject} loading={reviewing} type='danger' theme='light'>
              {t('驳回')}
            </Button>
            <Button
              onClick={onApprove}
              loading={reviewing}
              type='primary'
              theme='solid'
              style={{ background: 'var(--accent-gradient)', border: 'none' }}
            >
              {t('通过并创建团队')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoCell = ({ icon, label, value }) => (
  <div
    className='rounded-[var(--radius-md)] px-3 py-2.5'
    style={{ background: 'var(--surface)', border: '1px solid var(--border-default)' }}
  >
    <div className='flex items-center gap-1.5 mb-1' style={{ color: 'var(--text-muted)' }}>
      {icon}
      <span style={{ fontSize: 11 }}>{label}</span>
    </div>
    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
  </div>
);

export default TeamApplicationsAdmin;
