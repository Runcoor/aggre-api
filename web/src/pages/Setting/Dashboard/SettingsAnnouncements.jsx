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

import React, { useEffect, useState, useRef } from 'react';
import {
  Button,
  Table,
  Form,
  Empty,
  Modal,
  Switch,
  TextArea,
  Tooltip,
} from '@douyinfe/semi-ui';
import { Plus, Edit, Trash2, Save, Bell, Maximize2 } from 'lucide-react';
import {
  API,
  showError,
  showSuccess,
  getRelativeTime,
  formatDateTimeString,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

const SettingsAnnouncements = ({ options, refresh }) => {
  const { t } = useTranslation();

  const [announcementsList, setAnnouncementsList] = useState([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    content: '',
    publishDate: new Date(),
    type: 'default',
    extra: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // 面板启用状态
  const [panelEnabled, setPanelEnabled] = useState(true);

  const formApiRef = useRef(null);

  const typeOptions = [
    { value: 'default', label: t('默认') },
    { value: 'ongoing', label: t('进行中') },
    { value: 'success', label: t('成功') },
    { value: 'warning', label: t('警告') },
    { value: 'error', label: t('错误') },
  ];

  const getTypeStyle = (type) => {
    const styleMap = {
      default: { color: 'var(--text-muted)', bg: 'var(--surface-active)' },
      ongoing: { color: 'var(--accent)', bg: 'var(--accent-light)' },
      success: { color: 'var(--success)', bg: 'rgba(52, 199, 89, 0.12)' },
      warning: { color: 'var(--warning)', bg: 'rgba(255, 149, 0, 0.12)' },
      error: { color: 'var(--error)', bg: 'rgba(255, 59, 48, 0.12)' },
    };
    return styleMap[type] || styleMap.default;
  };

  const columns = [
    {
      title: t('内容'),
      dataIndex: 'content',
      key: 'content',
      render: (text) => (
        <Tooltip content={text} position='topLeft' showArrow>
          <div
            style={{
              maxWidth: '300px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {text}
          </div>
        </Tooltip>
      ),
    },
    {
      title: t('发布时间'),
      dataIndex: 'publishDate',
      key: 'publishDate',
      width: 180,
      render: (publishDate) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {getRelativeTime(publishDate)}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '2px',
            }}
          >
            {publishDate ? formatDateTimeString(new Date(publishDate)) : '-'}
          </div>
        </div>
      ),
    },
    {
      title: t('类型'),
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        const s = getTypeStyle(type);
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', padding: '1px 8px',
            borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 500,
            color: s.color, background: s.bg, lineHeight: '20px',
          }}>
            {typeOptions.find((opt) => opt.value === type)?.label || type}
          </span>
        );
      },
    },
    {
      title: t('说明'),
      dataIndex: 'extra',
      key: 'extra',
      render: (text) => (
        <Tooltip content={text || '-'} showArrow>
          <div
            style={{
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'var(--text-muted)',
            }}
          >
            {text || '-'}
          </div>
        </Tooltip>
      ),
    },
    {
      title: t('操作'),
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (text, record) => (
        <div className='flex items-center gap-1'>
          <Button
            icon={<Edit size={14} />}
            theme='light'
            type='tertiary'
            size='small'
            onClick={() => handleEditAnnouncement(record)}
          >
            {t('编辑')}
          </Button>
          <Button
            icon={<Trash2 size={14} />}
            type='danger'
            theme='light'
            size='small'
            onClick={() => handleDeleteAnnouncement(record)}
          >
            {t('删除')}
          </Button>
        </div>
      ),
    },
  ];

  const updateOption = async (key, value) => {
    const res = await API.put('/api/option/', {
      key,
      value,
    });
    const { success, message } = res.data;
    if (success) {
      showSuccess('系统公告已更新');
      if (refresh) refresh();
    } else {
      showError(message);
    }
  };

  const submitAnnouncements = async () => {
    try {
      setLoading(true);
      const announcementsJson = JSON.stringify(announcementsList);
      await updateOption('console_setting.announcements', announcementsJson);
      setHasChanges(false);
    } catch (error) {
      console.error('系统公告更新失败', error);
      showError('系统公告更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnnouncement = () => {
    setEditingAnnouncement(null);
    setAnnouncementForm({
      content: '',
      publishDate: new Date(),
      type: 'default',
      extra: '',
    });
    setShowAnnouncementModal(true);
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      content: announcement.content,
      publishDate: announcement.publishDate
        ? new Date(announcement.publishDate)
        : new Date(),
      type: announcement.type || 'default',
      extra: announcement.extra || '',
    });
    setShowAnnouncementModal(true);
  };

  const handleDeleteAnnouncement = (announcement) => {
    setDeletingAnnouncement(announcement);
    setShowDeleteModal(true);
  };

  const confirmDeleteAnnouncement = () => {
    if (deletingAnnouncement) {
      const newList = announcementsList.filter(
        (item) => item.id !== deletingAnnouncement.id,
      );
      setAnnouncementsList(newList);
      setHasChanges(true);
      showSuccess('公告已删除，请及时点击"保存设置"进行保存');
    }
    setShowDeleteModal(false);
    setDeletingAnnouncement(null);
  };

  const handleSaveAnnouncement = async () => {
    if (!announcementForm.content || !announcementForm.publishDate) {
      showError('请填写完整的公告信息');
      return;
    }

    try {
      setModalLoading(true);

      // 将publishDate转换为ISO字符串保存
      const formData = {
        ...announcementForm,
        publishDate: announcementForm.publishDate.toISOString(),
      };

      let newList;
      if (editingAnnouncement) {
        newList = announcementsList.map((item) =>
          item.id === editingAnnouncement.id ? { ...item, ...formData } : item,
        );
      } else {
        const newId =
          Math.max(...announcementsList.map((item) => item.id), 0) + 1;
        const newAnnouncement = {
          id: newId,
          ...formData,
        };
        newList = [...announcementsList, newAnnouncement];
      }

      setAnnouncementsList(newList);
      setHasChanges(true);
      setShowAnnouncementModal(false);
      showSuccess(
        editingAnnouncement
          ? '公告已更新，请及时点击"保存设置"进行保存'
          : '公告已添加，请及时点击"保存设置"进行保存',
      );
    } catch (error) {
      showError('操作失败: ' + error.message);
    } finally {
      setModalLoading(false);
    }
  };

  const parseAnnouncements = (announcementsStr) => {
    if (!announcementsStr) {
      setAnnouncementsList([]);
      return;
    }

    try {
      const parsed = JSON.parse(announcementsStr);
      const list = Array.isArray(parsed) ? parsed : [];
      // 确保每个项目都有id
      const listWithIds = list.map((item, index) => ({
        ...item,
        id: item.id || index + 1,
      }));
      setAnnouncementsList(listWithIds);
    } catch (error) {
      console.error('解析系统公告失败:', error);
      setAnnouncementsList([]);
    }
  };

  useEffect(() => {
    const annStr =
      options['console_setting.announcements'] ?? options.Announcements;
    if (annStr !== undefined) {
      parseAnnouncements(annStr);
    }
  }, [options['console_setting.announcements'], options.Announcements]);

  useEffect(() => {
    const enabledStr = options['console_setting.announcements_enabled'];
    setPanelEnabled(
      enabledStr === undefined
        ? true
        : enabledStr === 'true' || enabledStr === true,
    );
  }, [options['console_setting.announcements_enabled']]);

  const handleToggleEnabled = async (checked) => {
    const newValue = checked ? 'true' : 'false';
    try {
      const res = await API.put('/api/option/', {
        key: 'console_setting.announcements_enabled',
        value: newValue,
      });
      if (res.data.success) {
        setPanelEnabled(checked);
        showSuccess(t('设置已保存'));
        refresh?.();
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError(err.message);
    }
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      showError('请先选择要删除的系统公告');
      return;
    }

    const newList = announcementsList.filter(
      (item) => !selectedRowKeys.includes(item.id),
    );
    setAnnouncementsList(newList);
    setSelectedRowKeys([]);
    setHasChanges(true);
    showSuccess(
      `已删除 ${selectedRowKeys.length} 个系统公告，请及时点击"保存设置"进行保存`,
    );
  };

  // 计算当前页显示的数据（按发布时间倒序排序，最新优先显示）
  const getCurrentPageData = () => {
    const sortedList = [...announcementsList].sort((a, b) => {
      const dateA = new Date(a.publishDate).getTime();
      const dateB = new Date(b.publishDate).getTime();
      return dateB - dateA; // 倒序，最新的排在前面
    });

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedList.slice(startIndex, endIndex);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRowKeys(selectedRowKeys);
    },
    onSelect: (record, selected, selectedRows) => {
      console.log(`选择行: ${selected}`, record);
    },
    onSelectAll: (selected, selectedRows) => {
      console.log(`全选: ${selected}`, selectedRows);
    },
    getCheckboxProps: (record) => ({
      disabled: false,
      name: record.id,
    }),
  };

  return (
    <>
      {/* Section Header — macOS panel style */}
      <div
        className='px-4 py-3 flex items-center justify-between'
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className='flex items-center gap-2.5'>
          <div
            className='flex items-center justify-center'
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 149, 0, 0.12)',
              color: 'var(--warning)',
            }}
          >
            <Bell size={16} />
          </div>
          <div>
            <h3
              className='text-sm font-semibold'
              style={{
                fontFamily: 'var(--font-serif)',
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {t('系统公告管理')}
            </h3>
            <p
              className='text-xs mt-0.5'
              style={{ color: 'var(--text-muted)', margin: 0 }}
            >
              {t('系统公告管理，可以发布系统通知和重要消息（最多100个，前端显示最新20条）')}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
            {panelEnabled ? t('已启用') : t('已禁用')}
          </span>
          <Switch checked={panelEnabled} onChange={handleToggleEnabled} size='small' />
        </div>
      </div>

      {/* Toolbar */}
      <div className='px-4 py-2.5 flex flex-col md:flex-row items-center gap-2'>
        <div className='flex gap-1.5 w-full md:w-auto'>
          <Button
            theme='light'
            type='primary'
            icon={<Plus size={14} />}
            size='small'
            className='w-full md:w-auto'
            onClick={handleAddAnnouncement}
          >
            {t('添加公告')}
          </Button>
          <Button
            icon={<Trash2 size={14} />}
            type='danger'
            theme='light'
            size='small'
            onClick={handleBatchDelete}
            disabled={selectedRowKeys.length === 0}
            className='w-full md:w-auto'
          >
            {t('批量删除')}{' '}
            {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
          </Button>
          <Button
            icon={<Save size={14} />}
            onClick={submitAnnouncements}
            loading={loading}
            disabled={!hasChanges}
            type='secondary'
            size='small'
            className='w-full md:w-auto'
          >
            {t('保存设置')}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className='px-4 pb-4'>
        <Table
          columns={columns}
          dataSource={getCurrentPageData()}
          rowSelection={rowSelection}
          rowKey='id'
          scroll={{ x: 'max-content' }}
          pagination={{
            currentPage: currentPage,
            pageSize: pageSize,
            total: announcementsList.length,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['5', '10', '20', '50'],
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            onShowSizeChange: (current, size) => {
              setCurrentPage(1);
              setPageSize(size);
            },
          }}
          size='middle'
          loading={loading}
          empty={
            <Empty
              image={
                <img src="/NoDataillustration.svg" style={{ width: 150, height: 150 }} />
              }
              darkModeImage={
                <img src="/NoDataillustration.svg" style={{ width: 150, height: 150 }} />
              }
              description={t('暂无系统公告')}
              style={{ padding: 30 }}
            />
          }
          className='overflow-hidden'
        />
      </div>

      <Modal
        title={editingAnnouncement ? t('编辑公告') : t('添加公告')}
        visible={showAnnouncementModal}
        onOk={handleSaveAnnouncement}
        onCancel={() => setShowAnnouncementModal(false)}
        okText={t('保存')}
        cancelText={t('取消')}
        confirmLoading={modalLoading}
      >
        <Form
          layout='vertical'
          initValues={announcementForm}
          key={editingAnnouncement ? editingAnnouncement.id : 'new'}
          getFormApi={(api) => (formApiRef.current = api)}
        >
          <Form.TextArea
            field='content'
            label={t('公告内容')}
            placeholder={t('请输入公告内容（支持 Markdown/HTML）')}
            maxCount={500}
            rows={3}
            rules={[{ required: true, message: t('请输入公告内容') }]}
            onChange={(value) =>
              setAnnouncementForm({ ...announcementForm, content: value })
            }
          />
          <Button
            theme='light'
            type='tertiary'
            size='small'
            icon={<Maximize2 size={14} />}
            style={{ marginBottom: 16 }}
            onClick={() => setShowContentModal(true)}
          >
            {t('放大编辑')}
          </Button>
          <Form.DatePicker
            field='publishDate'
            label={t('发布日期')}
            type='dateTime'
            rules={[{ required: true, message: t('请选择发布日期') }]}
            onChange={(value) =>
              setAnnouncementForm({ ...announcementForm, publishDate: value })
            }
          />
          <Form.Select
            field='type'
            label={t('公告类型')}
            optionList={typeOptions}
            onChange={(value) =>
              setAnnouncementForm({ ...announcementForm, type: value })
            }
          />
          <Form.Input
            field='extra'
            label={t('说明信息')}
            placeholder={t('可选，公告的补充说明')}
            onChange={(value) =>
              setAnnouncementForm({ ...announcementForm, extra: value })
            }
          />
        </Form>
      </Modal>

      <Modal
        title={t('确认删除')}
        visible={showDeleteModal}
        onOk={confirmDeleteAnnouncement}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeletingAnnouncement(null);
        }}
        okText={t('确认删除')}
        cancelText={t('取消')}
        type='warning'
        okButtonProps={{
          type: 'danger',
          theme: 'solid',
        }}
      >
        <span style={{ color: 'var(--text-primary)' }}>{t('确定要删除此公告吗？')}</span>
      </Modal>

      {/* 公告内容放大编辑 Modal */}
      <Modal
        title={t('编辑公告内容')}
        visible={showContentModal}
        onOk={() => {
          // 将内容同步到表单
          if (formApiRef.current) {
            formApiRef.current.setValue('content', announcementForm.content);
          }
          setShowContentModal(false);
        }}
        onCancel={() => setShowContentModal(false)}
        okText={t('确定')}
        cancelText={t('取消')}
        width={800}
      >
        <TextArea
          value={announcementForm.content}
          placeholder={t('请输入公告内容（支持 Markdown/HTML）')}
          maxCount={500}
          rows={15}
          style={{ width: '100%' }}
          onChange={(value) =>
            setAnnouncementForm({ ...announcementForm, content: value })
          }
        />
      </Modal>
    </>
  );
};

export default SettingsAnnouncements;
