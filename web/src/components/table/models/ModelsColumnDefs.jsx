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
  Typography,
  Modal,
  Tooltip,
} from '@douyinfe/semi-ui';
import {
  timestamp2string,
  getLobeHubIcon,
} from '../../../helpers';
import {
  renderLimitedItems,
  renderDescription,
} from '../../common/ui/RenderUtils';

const { Text } = Typography;

// Render timestamp
function renderTimestamp(timestamp) {
  return <>{timestamp2string(timestamp)}</>;
}

// Render model icon column: prefer model.icon, then fallback to vendor icon
const renderModelIconCol = (record, vendorMap) => {
  const iconKey = record?.icon || vendorMap[record?.vendor_id]?.icon;
  if (!iconKey) return '-';
  return (
    <div className='flex items-center justify-center'>
      {getLobeHubIcon(iconKey, 20)}
    </div>
  );
};

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

// Render vendor column with icon
const renderVendorTag = (vendorId, vendorMap, t) => {
  if (!vendorId || !vendorMap[vendorId]) return '-';
  const v = vendorMap[vendorId];
  return (
    <InlineBadge>
      {getLobeHubIcon(v.icon || 'Layers', 14)}
      {v.name}
    </InlineBadge>
  );
};

// Render groups (enable_groups)
const renderGroups = (groups) => {
  if (!groups || groups.length === 0) return '-';
  return renderLimitedItems({
    items: groups,
    renderItem: (g, idx) => (
      <InlineBadge key={idx} style={{ fontSize: '11px', padding: '0px 6px' }}>
        {g}
      </InlineBadge>
    ),
  });
};

// Render tags
const renderTags = (text) => {
  if (!text) return '-';
  const tagsArr = text.split(',').filter(Boolean);
  return renderLimitedItems({
    items: tagsArr,
    renderItem: (tag, idx) => (
      <InlineBadge key={idx} style={{ fontSize: '11px', padding: '0px 6px' }}>
        {tag}
      </InlineBadge>
    ),
  });
};

// Render endpoints (supports object map or legacy array)
const renderEndpoints = (value) => {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const keys = Object.keys(parsed || {});
      if (keys.length === 0) return '-';
      return renderLimitedItems({
        items: keys,
        renderItem: (key, idx) => (
          <InlineBadge key={idx} mono style={{ fontSize: '11px', padding: '0px 6px' }}>
            {key}
          </InlineBadge>
        ),
        maxDisplay: 3,
      });
    }
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return '-';
      return renderLimitedItems({
        items: parsed,
        renderItem: (ep, idx) => (
          <InlineBadge key={idx} mono style={{ fontSize: '11px', padding: '0px 6px' }}>
            {ep}
          </InlineBadge>
        ),
        maxDisplay: 3,
      });
    }
    return value || '-';
  } catch (_) {
    return value || '-';
  }
};

// Render quota types (array) using common limited items renderer
const renderQuotaTypes = (arr, t) => {
  if (!Array.isArray(arr) || arr.length === 0) return '-';
  return renderLimitedItems({
    items: arr,
    renderItem: (qt, idx) => {
      if (qt === 1) {
        return (
          <InlineBadge key={`${qt}-${idx}`} color='var(--success)' bg='rgba(52, 199, 89, 0.12)' style={{ fontSize: '11px', padding: '0px 6px' }}>
            {t('按次计费')}
          </InlineBadge>
        );
      }
      if (qt === 0) {
        return (
          <InlineBadge key={`${qt}-${idx}`} color='var(--info, #5856D6)' bg='rgba(88, 86, 214, 0.12)' style={{ fontSize: '11px', padding: '0px 6px' }}>
            {t('按量计费')}
          </InlineBadge>
        );
      }
      return (
        <InlineBadge key={`${qt}-${idx}`} style={{ fontSize: '11px', padding: '0px 6px' }}>
          {qt}
        </InlineBadge>
      );
    },
    maxDisplay: 3,
  });
};

// Render bound channels
const renderBoundChannels = (channels) => {
  if (!channels || channels.length === 0) return '-';
  return renderLimitedItems({
    items: channels,
    renderItem: (c, idx) => (
      <InlineBadge key={idx} style={{ fontSize: '11px', padding: '0px 6px' }}>
        {c.name}({c.type})
      </InlineBadge>
    ),
  });
};

// Render operations column
const renderOperations = (
  text,
  record,
  setEditingModel,
  setShowEdit,
  manageModel,
  refresh,
  t,
) => {
  return (
    <Space wrap>
      {record.status === 1 ? (
        <Button
          type='danger'
          size='small'
          onClick={() => manageModel(record.id, 'disable', record)}
        >
          {t('禁用')}
        </Button>
      ) : (
        <Button
          size='small'
          onClick={() => manageModel(record.id, 'enable', record)}
        >
          {t('启用')}
        </Button>
      )}

      <Button
        type='tertiary'
        size='small'
        onClick={() => {
          setEditingModel(record);
          setShowEdit(true);
        }}
      >
        {t('编辑')}
      </Button>

      <Button
        type='danger'
        size='small'
        onClick={() => {
          Modal.confirm({
            title: t('确定是否要删除此模型？'),
            content: t('此修改将不可逆'),
            onOk: () => {
              (async () => {
                await manageModel(record.id, 'delete', record);
                await refresh();
              })();
            },
          });
        }}
      >
        {t('删除')}
      </Button>
    </Space>
  );
};

// 名称匹配类型渲染（带匹配数量 Tooltip）— iOS system colors
const nameRuleStyleMap = {
  0: { color: 'var(--success)', bg: 'rgba(52, 199, 89, 0.12)' },
  1: { color: 'var(--accent)', bg: 'var(--accent-light)' },
  2: { color: 'var(--warning)', bg: 'rgba(255, 149, 0, 0.12)' },
  3: { color: 'var(--info, #5856D6)', bg: 'rgba(88, 86, 214, 0.12)' },
};

const nameRuleLabelMap = {
  0: '精确',
  1: '前缀',
  2: '包含',
  3: '后缀',
};

const renderNameRule = (rule, record, t) => {
  const style = nameRuleStyleMap[rule];
  if (!style) return '-';

  let label = t(nameRuleLabelMap[rule]);
  if (rule !== 0 && record.matched_count) {
    label = `${label} ${record.matched_count}${t('个模型')}`;
  }

  const badgeElement = (
    <InlineBadge color={style.color} bg={style.bg} style={{ fontSize: '11px', padding: '0px 6px' }}>
      {label}
    </InlineBadge>
  );

  if (
    rule === 0 ||
    !record.matched_models ||
    record.matched_models.length === 0
  ) {
    return badgeElement;
  }

  return (
    <Tooltip content={record.matched_models.join(', ')} showArrow>
      {badgeElement}
    </Tooltip>
  );
};

export const getModelsColumns = ({
  t,
  manageModel,
  setEditingModel,
  setShowEdit,
  refresh,
  vendorMap,
}) => {
  return [
    {
      title: t('图标'),
      dataIndex: 'icon',
      width: 70,
      align: 'center',
      render: (text, record) => renderModelIconCol(record, vendorMap),
    },
    {
      title: t('模型名称'),
      dataIndex: 'model_name',
      render: (text) => (
        <Text copyable onClick={(e) => e.stopPropagation()}>
          {text}
        </Text>
      ),
    },
    {
      title: t('匹配类型'),
      dataIndex: 'name_rule',
      render: (val, record) => renderNameRule(val, record, t),
    },
    {
      title: t('参与官方同步'),
      dataIndex: 'sync_official',
      render: (val) => (
        <InlineBadge
          color={val === 1 ? 'var(--success)' : 'var(--warning)'}
          bg={val === 1 ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 149, 0, 0.12)'}
          style={{ fontSize: '11px', padding: '0px 6px' }}
        >
          {val === 1 ? t('是') : t('否')}
        </InlineBadge>
      ),
    },
    {
      title: t('描述'),
      dataIndex: 'description',
      render: (text) => renderDescription(text, 200),
    },
    {
      title: t('供应商'),
      dataIndex: 'vendor_id',
      render: (vendorId, record) => renderVendorTag(vendorId, vendorMap, t),
    },
    {
      title: t('标签'),
      dataIndex: 'tags',
      render: renderTags,
    },
    {
      title: t('端点'),
      dataIndex: 'endpoints',
      render: renderEndpoints,
    },
    {
      title: t('已绑定渠道'),
      dataIndex: 'bound_channels',
      render: renderBoundChannels,
    },
    {
      title: t('可用分组'),
      dataIndex: 'enable_groups',
      render: renderGroups,
    },
    {
      title: t('计费类型'),
      dataIndex: 'quota_types',
      render: (qts) => renderQuotaTypes(qts, t),
    },
    {
      title: t('创建时间'),
      dataIndex: 'created_time',
      render: (text, record, index) => {
        return <div>{renderTimestamp(text)}</div>;
      },
    },
    {
      title: t('更新时间'),
      dataIndex: 'updated_time',
      render: (text, record, index) => {
        return <div>{renderTimestamp(text)}</div>;
      },
    },
    {
      title: '',
      dataIndex: 'operate',
      fixed: 'right',
      render: (text, record, index) =>
        renderOperations(
          text,
          record,
          setEditingModel,
          setShowEdit,
          manageModel,
          refresh,
          t,
        ),
    },
  ];
};
