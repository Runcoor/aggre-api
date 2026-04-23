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
import { Table, Tag } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { API, showError } from '../../../helpers';

function fmtTs(ts) {
  if (!ts) return '-';
  return new Date(ts * 1000).toLocaleString();
}

const statusColor = (s) => {
  if (s === 'success') return 'green';
  if (s === 'pending') return 'orange';
  if (s === 'failed' || s === 'error') return 'red';
  if (s === 'expired') return 'grey';
  return 'grey';
};

const TopupsTab = ({ userId }) => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchPage = useCallback(
    async (p, ps) => {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await API.get(`/api/user/${userId}/topups`, {
          params: { p, page_size: ps },
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
    [userId],
  );

  useEffect(() => {
    fetchPage(page, pageSize);
  }, [fetchPage, page, pageSize]);

  const columns = [
    { title: t('订单号'), dataIndex: 'trade_no', width: 220 },
    {
      title: t('金额(USD)'),
      dataIndex: 'money',
      render: (v) => `$${Number(v || 0).toFixed(2)}`,
      width: 120,
    },
    { title: t('支付方式'), dataIndex: 'payment_method', width: 120 },
    {
      title: t('状态'),
      dataIndex: 'status',
      render: (s) => <Tag color={statusColor(s)}>{s || '-'}</Tag>,
      width: 100,
    },
    { title: t('创建时间'), dataIndex: 'create_time', render: fmtTs, width: 180 },
    { title: t('完成时间'), dataIndex: 'complete_time', render: fmtTs, width: 180 },
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

export default TopupsTab;
