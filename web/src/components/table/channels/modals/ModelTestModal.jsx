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
  Modal,
  Button,
  Input,
  Table,
  Tag,
  Typography,
  Select,
  Switch,
  Banner,
} from '@douyinfe/semi-ui';
import { IconSearch, IconInfoCircle } from '@douyinfe/semi-icons';
import { copy, showError, showInfo, showSuccess } from '../../../../helpers';
import { MODEL_TABLE_PAGE_SIZE } from '../../../../constants';

const ModelTestModal = ({
  showModelTestModal,
  currentTestChannel,
  handleCloseModal,
  isBatchTesting,
  batchTestModels,
  modelSearchKeyword,
  setModelSearchKeyword,
  selectedModelKeys,
  setSelectedModelKeys,
  modelTestResults,
  testingModels,
  testChannel,
  modelTablePage,
  setModelTablePage,
  selectedEndpointType,
  setSelectedEndpointType,
  isStreamTest,
  setIsStreamTest,
  allSelectingRef,
  isMobile,
  t,
}) => {
  const hasChannel = Boolean(currentTestChannel);
  const streamToggleDisabled = [
    'embeddings',
    'image-generation',
    'jina-rerank',
    'openai-response-compact',
  ].includes(selectedEndpointType);

  React.useEffect(() => {
    if (streamToggleDisabled && isStreamTest) {
      setIsStreamTest(false);
    }
  }, [streamToggleDisabled, isStreamTest, setIsStreamTest]);

  const filteredModels = hasChannel
    ? currentTestChannel.models
        .split(',')
        .filter((model) =>
          model.toLowerCase().includes(modelSearchKeyword.toLowerCase()),
        )
    : [];

  const endpointTypeOptions = [
    { value: '', label: t('自动检测') },
    { value: 'openai', label: 'OpenAI (/v1/chat/completions)' },
    { value: 'openai-response', label: 'OpenAI Response (/v1/responses)' },
    {
      value: 'openai-response-compact',
      label: 'OpenAI Response Compaction (/v1/responses/compact)',
    },
    { value: 'anthropic', label: 'Anthropic (/v1/messages)' },
    {
      value: 'gemini',
      label: 'Gemini (/v1beta/models/{model}:generateContent)',
    },
    { value: 'jina-rerank', label: 'Jina Rerank (/v1/rerank)' },
    {
      value: 'image-generation',
      label: t('图像生成') + ' (/v1/images/generations)',
    },
    { value: 'embeddings', label: 'Embeddings (/v1/embeddings)' },
  ];

  const handleCopySelected = () => {
    if (selectedModelKeys.length === 0) {
      showError(t('请先选择模型！'));
      return;
    }
    copy(selectedModelKeys.join(',')).then((ok) => {
      if (ok) {
        showSuccess(
          t('已复制 ${count} 个模型').replace(
            '${count}',
            selectedModelKeys.length,
          ),
        );
      } else {
        showError(t('复制失败，请手动复制'));
      }
    });
  };

  const handleSelectSuccess = () => {
    if (!currentTestChannel) return;
    const successKeys = currentTestChannel.models
      .split(',')
      .filter((m) => m.toLowerCase().includes(modelSearchKeyword.toLowerCase()))
      .filter((m) => {
        const result = modelTestResults[`${currentTestChannel.id}-${m}`];
        return result && result.success;
      });
    if (successKeys.length === 0) {
      showInfo(t('暂无成功模型'));
    }
    setSelectedModelKeys(successKeys);
  };

  const columns = [
    {
      title: t('模型名称'),
      dataIndex: 'model',
      render: (text) => (
        <div className='flex items-center'>
          <span
            className='text-sm font-medium'
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
          >
            {text}
          </span>
        </div>
      ),
    },
    {
      title: t('状态'),
      dataIndex: 'status',
      render: (text, record) => {
        const testResult =
          modelTestResults[`${currentTestChannel.id}-${record.model}`];
        const isTesting = testingModels.has(record.model);

        if (isTesting) {
          return (
            <Tag color='blue' shape='circle'>
              {t('测试中')}
            </Tag>
          );
        }

        if (!testResult) {
          return (
            <Tag color='grey' shape='circle'>
              {t('未开始')}
            </Tag>
          );
        }

        return (
          <div className='flex items-center gap-2'>
            <Tag color={testResult.success ? 'green' : 'red'} shape='circle'>
              {testResult.success ? t('成功') : t('失败')}
            </Tag>
            {testResult.success && (
              <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                {t('请求时长: ${time}s').replace(
                  '${time}',
                  testResult.time.toFixed(2),
                )}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: '',
      dataIndex: 'operate',
      render: (text, record) => {
        const isTesting = testingModels.has(record.model);
        return (
          <Button
            type='tertiary'
            onClick={() =>
              testChannel(
                currentTestChannel,
                record.model,
                selectedEndpointType,
                isStreamTest,
              )
            }
            loading={isTesting}
            size='small'
          >
            {t('测试')}
          </Button>
        );
      },
    },
  ];

  const dataSource = (() => {
    if (!hasChannel) return [];
    const start = (modelTablePage - 1) * MODEL_TABLE_PAGE_SIZE;
    const end = start + MODEL_TABLE_PAGE_SIZE;
    return filteredModels.slice(start, end).map((model) => ({
      model,
      key: model,
    }));
  })();

  const totalModels = hasChannel ? currentTestChannel.models.split(',').length : 0;

  return (
    <Modal
      title={
        hasChannel ? (
          <div className='flex flex-col gap-1'>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 600,
                fontSize: '16px',
                color: 'var(--text-primary)',
              }}
            >
              {currentTestChannel.name}
            </span>
            <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
              {t('渠道的模型测试')} · {totalModels} {t('个模型')}
            </span>
          </div>
        ) : null
      }
      visible={showModelTestModal}
      onCancel={handleCloseModal}
      centered
      footer={
        hasChannel ? (
          <div className='flex items-center justify-between'>
            <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
              {filteredModels.length !== totalModels
                ? `${filteredModels.length} / ${totalModels} ${t('个模型')}`
                : ''}
            </span>
            <div className='flex gap-2'>
              {isBatchTesting ? (
                <Button
                  type='danger'
                  theme='solid'
                  onClick={handleCloseModal}
                >
                  {t('停止测试')}
                </Button>
              ) : (
                <Button type='tertiary' onClick={handleCloseModal}>
                  {t('取消')}
                </Button>
              )}
              <Button
                type='primary'
                theme='solid'
                onClick={batchTestModels}
                loading={isBatchTesting}
                disabled={isBatchTesting}
              >
                {isBatchTesting
                  ? t('测试中...')
                  : t('批量测试${count}个模型').replace(
                      '${count}',
                      filteredModels.length,
                    )}
              </Button>
            </div>
          </div>
        ) : null
      }
      maskClosable={!isBatchTesting}
      size={isMobile ? 'full-width' : 'large'}
    >
      {hasChannel && (
        <div className='model-test-scroll'>
          {/* Endpoint config card */}
          <div
            className='p-3 mb-3'
            style={{
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className='flex flex-col sm:flex-row sm:items-center gap-2 w-full'>
              <div className='flex items-center gap-2 flex-1 min-w-0'>
                <span
                  className='text-xs font-medium shrink-0'
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t('端点类型')}
                </span>
                <Select
                  value={selectedEndpointType}
                  onChange={setSelectedEndpointType}
                  optionList={endpointTypeOptions}
                  className='!w-full min-w-0'
                  placeholder={t('选择端点类型')}
                  size='small'
                />
              </div>
              <div className='flex items-center justify-between sm:justify-end gap-2 shrink-0'>
                <span
                  className='text-xs font-medium shrink-0'
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t('流式')}
                </span>
                <Switch
                  checked={isStreamTest}
                  onChange={setIsStreamTest}
                  size='small'
                  disabled={streamToggleDisabled}
                  aria-label={t('流式')}
                />
              </div>
            </div>
          </div>

          <Banner
            type='info'
            closeIcon={null}
            icon={<IconInfoCircle />}
            style={{ borderRadius: 'var(--radius-md)', marginBottom: '8px' }}
            description={t(
              '说明：本页测试为非流式请求；若渠道仅支持流式返回，可能出现测试失败，请以实际使用为准。',
            )}
          />

          {/* Search and action bar */}
          <div className='flex flex-col sm:flex-row sm:items-center gap-2 w-full mb-2'>
            <Input
              placeholder={t('搜索模型...')}
              value={modelSearchKeyword}
              onChange={(v) => {
                setModelSearchKeyword(v);
                setModelTablePage(1);
              }}
              className='!w-full sm:!flex-1'
              prefix={<IconSearch />}
              showClear
              size='small'
            />

            <div className='flex items-center justify-end gap-1'>
              <Button
                size='small'
                type='tertiary'
                theme='light'
                onClick={handleCopySelected}
              >
                {t('复制已选')}
              </Button>
              <Button
                size='small'
                type='tertiary'
                theme='borderless'
                onClick={handleSelectSuccess}
              >
                {t('选择成功')}
              </Button>
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={dataSource}
            rowSelection={{
              selectedRowKeys: selectedModelKeys,
              onChange: (keys) => {
                if (allSelectingRef.current) {
                  allSelectingRef.current = false;
                  return;
                }
                setSelectedModelKeys(keys);
              },
              onSelectAll: (checked) => {
                allSelectingRef.current = true;
                setSelectedModelKeys(checked ? filteredModels : []);
              },
            }}
            pagination={{
              currentPage: modelTablePage,
              pageSize: MODEL_TABLE_PAGE_SIZE,
              total: filteredModels.length,
              showSizeChanger: false,
              onPageChange: (page) => setModelTablePage(page),
            }}
          />
        </div>
      )}
    </Modal>
  );
};

export default ModelTestModal;
