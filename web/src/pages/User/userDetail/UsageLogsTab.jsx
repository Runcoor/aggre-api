import React, { useCallback, useEffect, useState } from 'react';
import { Table, Tag, Tooltip } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { API, showError, renderQuota } from '../../../helpers';

function fmtTs(ts) {
  if (!ts) return '-';
  return new Date(ts * 1000).toLocaleString();
}

// Parse the `other` JSON string returned by /api/log/. Returns {} on any
// failure so callers can read fields safely. The backend serializes
// log.Other as a string (model/log.go: Other string `json:"other"`).
function parseOther(other) {
  if (!other) return {};
  if (typeof other === 'object') return other;
  try {
    return JSON.parse(other) || {};
  } catch {
    return {};
  }
}

// Render the hover tooltip body for the billing-source column. Reads
// the rich fields written by service/log_info_generate.go.appendBillingInfo:
// subscription_plan_title, subscription_consumed/total/remain,
// billing_preference, wallet_fallback, etc. Returns null for legacy rows
// or unknown sources.
function renderBillingTooltip(o, t) {
  const src = o.billing_source;
  const prefMap = {
    subscription_first: t('订阅优先'),
    wallet_first: t('钱包优先'),
    subscription_only: t('仅订阅'),
    wallet_only: t('仅钱包'),
  };
  const prefLine = o.billing_preference ? (
    <div style={{ opacity: 0.7, marginTop: 4 }}>
      {t('扣费偏好')}: {prefMap[o.billing_preference] || o.billing_preference}
    </div>
  ) : null;

  if (src === 'subscription') {
    return (
      <div style={{ minWidth: 200, maxWidth: 280, fontSize: 12, lineHeight: 1.7 }}>
        <div>
          <b>{t('套餐')}:</b> {o.subscription_plan_title || '-'}
        </div>
        {o.subscription_consumed != null && (
          <div>
            <b>{t('本次扣费')}:</b> {renderQuota(o.subscription_consumed)}
          </div>
        )}
        {o.subscription_total ? (
          <div>
            <b>{t('套餐余额')}:</b> {renderQuota(o.subscription_remain || 0)}
            {' / '}
            {renderQuota(o.subscription_total)}
          </div>
        ) : null}
        {prefLine}
      </div>
    );
  }
  if (src === 'wallet') {
    return (
      <div style={{ minWidth: 180, maxWidth: 280, fontSize: 12, lineHeight: 1.7 }}>
        <div>{t('从用户钱包余额扣费')}</div>
        {o.wallet_fallback && (
          <div style={{ color: 'var(--accent)', marginTop: 4 }}>
            {t('套餐外回退：本次模型不在套餐内，已自动用钱包付费')}
          </div>
        )}
        {prefLine}
      </div>
    );
  }
  if (src === 'team') {
    return (
      <div style={{ fontSize: 12 }}>{t('从团队额度池扣费')}</div>
    );
  }
  return null;
}

const UsageLogsTab = ({ user }) => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchPage = useCallback(
    async (p, ps) => {
      if (!user?.username) return;
      setLoading(true);
      try {
        const res = await API.get('/api/log/', {
          params: { p, page_size: ps, username: user.username },
        });
        if (res?.data?.success) {
          const payload = res.data.data || {};
          setData(payload.items || []);
          setTotal(payload.total || 0);
        } else {
          showError(res?.data?.message || 'failed');
        }
      } catch (e) {
        showError(e);
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    fetchPage(page, pageSize);
  }, [fetchPage, page, pageSize]);

  const columns = [
    { title: t('时间'), dataIndex: 'created_at', render: fmtTs, width: 170 },
    { title: t('模型'), dataIndex: 'model_name' },
    { title: t('渠道'), dataIndex: 'channel', width: 80 },
    { title: t('提示 token'), dataIndex: 'prompt_tokens', width: 110 },
    { title: t('补全 token'), dataIndex: 'completion_tokens', width: 110 },
    {
      title: t('消耗'),
      dataIndex: 'quota',
      render: (v) => renderQuota(v || 0),
      width: 100,
    },
    {
      // Read billing_source from logs.other (set by service/log_info_generate.go).
      // Possible values: "wallet" / "subscription" / "team" / "" (legacy rows).
      // Hover tooltip surfaces plan title, remaining quota, fallback flag, etc.
      title: t('扣费来源'),
      dataIndex: 'other',
      width: 110,
      render: (other) => {
        const o = parseOther(other);
        const src = o.billing_source;
        let tag;
        if (src === 'wallet') {
          tag = (
            <Tag color='blue'>
              {t('钱包')}
              {o.wallet_fallback ? '*' : ''}
            </Tag>
          );
        } else if (src === 'subscription') {
          tag = <Tag color='green'>{t('套餐')}</Tag>;
        } else if (src === 'team') {
          tag = <Tag color='cyan'>{t('团队')}</Tag>;
        } else {
          return <Tag color='grey'>-</Tag>;
        }
        const tip = renderBillingTooltip(o, t);
        return tip ? (
          <Tooltip content={tip} position='top'>
            <span style={{ cursor: 'help' }}>{tag}</span>
          </Tooltip>
        ) : (
          tag
        );
      },
    },
    { title: t('耗时(ms)'), dataIndex: 'use_time', width: 110 },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey='id'
      loading={loading}
      pagination={{
        currentPage: page,
        pageSize,
        total,
        showSizeChanger: true,
        onChange: (p, ps) => {
          setPage(p);
          setPageSize(ps);
        },
      }}
      scroll={{ x: 'max-content' }}
    />
  );
};

export default UsageLogsTab;
