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

import React, { useEffect, useState } from 'react';
import {
  Modal,
  Table,
  Button,
  Empty,
  Input,
} from '@douyinfe/semi-ui';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import { IconSearch, IconAlertTriangle } from '@douyinfe/semi-icons';
import { API, showError } from '../../../../helpers';
import { MODEL_TABLE_PAGE_SIZE } from '../../../../constants';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import MacSpinner from '../../../common/ui/MacSpinner';

const MissingModelsModal = ({ visible, onClose, onConfigureModel, t }) => {
  const [loading, setLoading] = useState(false);
  const [missingModels, setMissingModels] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();

  const fetchMissing = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/models/missing');
      if (res.data.success) {
        setMissingModels(res.data.data || []);
      } else {
        showError(res.data.message);
      }
    } catch (_) {
      showError(t('获取未配置模型失败'));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (visible) {
      fetchMissing();
      setSearchKeyword('');
      setCurrentPage(1);
    } else {
      setMissingModels([]);
    }
  }, [visible]);

  // 过滤和分页逻辑
  const filteredModels = missingModels.filter((model) =>
    model.toLowerCase().includes(searchKeyword.toLowerCase()),
  );

  const dataSource = (() => {
    const start = (currentPage - 1) * MODEL_TABLE_PAGE_SIZE;
    const end = start + MODEL_TABLE_PAGE_SIZE;
    return filteredModels.slice(start, end).map((model) => ({
      model,
      key: model,
    }));
  })();

  const columns = [
    {
      title: t('模型名称'),
      dataIndex: 'model',
      render: (text) => (
        <div className='flex items-center'>
          <span className='text-sm font-medium' style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{text}</span>
        </div>
      ),
    },
    {
      title: '',
      dataIndex: 'operate',
      fixed: 'right',
      width: 120,
      render: (text, record) => (
        <Button
          type='primary'
          size='small'
          onClick={() => onConfigureModel(record.model)}
        >
          {t('配置')}
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <span className='w-6 h-6 flex items-center justify-center' style={{ borderRadius: 'var(--radius-sm)', background: 'rgba(255, 149, 0, 0.12)', color: 'var(--warning)' }}>
            <IconAlertTriangle size={14} />
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('未配置的模型列表')}
          </span>
          <span className='text-xs px-1.5 py-0.5' style={{ borderRadius: 'var(--radius-sm)', background: 'var(--surface-active)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {missingModels.length}
          </span>
        </div>
      }
      visible={visible}
      onCancel={onClose}
      footer={null}
      size={isMobile ? 'full-width' : 'medium'}
      className='!rounded-lg'
    >
      <MacSpinner spinning={loading}>
        {missingModels.length === 0 && !loading ? (
          <Empty
            image={<IllustrationNoResult style={{ width: 150, height: 150 }} />}
            darkModeImage={
              <IllustrationNoResultDark style={{ width: 150, height: 150 }} />
            }
            description={t('暂无缺失模型')}
            style={{ padding: 30 }}
          />
        ) : (
          <div className='missing-models-content'>
            {/* 搜索框 */}
            <div className='flex items-center justify-end gap-2 w-full mb-4'>
              <Input
                placeholder={t('搜索模型...')}
                value={searchKeyword}
                onChange={(v) => {
                  setSearchKeyword(v);
                  setCurrentPage(1);
                }}
                className='!w-full'
                prefix={<IconSearch />}
                showClear
              />
            </div>

            {/* 表格 */}
            {filteredModels.length > 0 ? (
              <Table
                columns={columns}
                dataSource={dataSource}
                pagination={{
                  currentPage: currentPage,
                  pageSize: MODEL_TABLE_PAGE_SIZE,
                  total: filteredModels.length,
                  showSizeChanger: false,
                  onPageChange: (page) => setCurrentPage(page),
                }}
              />
            ) : (
              <Empty
                image={
                  <IllustrationNoResult style={{ width: 100, height: 100 }} />
                }
                darkModeImage={
                  <IllustrationNoResultDark
                    style={{ width: 100, height: 100 }}
                  />
                }
                description={
                  searchKeyword ? t('未找到匹配的模型') : t('暂无缺失模型')
                }
                style={{ padding: 20 }}
              />
            )}
          </div>
        )}
      </MacSpinner>
    </Modal>
  );
};

export default MissingModelsModal;
