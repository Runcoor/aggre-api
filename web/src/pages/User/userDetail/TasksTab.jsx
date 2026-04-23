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
import { Table } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { API, renderQuota, showError } from '../../../helpers';

function fmtTs(ts) {
  if (!ts) return '-';
  return new Date(ts * 1000).toLocaleString();
}

const TasksTab = ({ userId }) => {
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
        const res = await API.get('/api/task/', {
          params: { p, page_size: ps, user_id: userId },
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
    { title: t('提交时间'), dataIndex: 'submit_time', render: fmtTs, width: 170 },
    { title: t('完成时间'), dataIndex: 'finish_time', render: fmtTs, width: 170 },
    { title: t('平台'), dataIndex: 'platform', width: 100 },
    { title: t('动作'), dataIndex: 'action', width: 110 },
    { title: t('状态'), dataIndex: 'status', width: 110 },
    {
      title: t('消耗'),
      dataIndex: 'quota',
      render: (v) => renderQuota(v || 0),
      width: 100,
    },
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

export default TasksTab;
