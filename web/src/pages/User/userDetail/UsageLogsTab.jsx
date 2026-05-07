import React, { useCallback, useEffect, useState } from 'react';
import { Table, Tag } from '@douyinfe/semi-ui';
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
      title: t('扣费来源'),
      dataIndex: 'other',
      width: 100,
      render: (other) => {
        const src = parseOther(other).billing_source;
        if (src === 'wallet') return <Tag color='blue'>{t('钱包')}</Tag>;
        if (src === 'subscription') return <Tag color='green'>{t('套餐')}</Tag>;
        if (src === 'team') return <Tag color='cyan'>{t('团队')}</Tag>;
        return <Tag color='grey'>-</Tag>;
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
