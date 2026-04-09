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
import { Checkbox, Empty, Pagination } from '@douyinfe/semi-ui';
import {
  stringToColor,
  calculateModelPrice,
  getLobeHubIcon,
  getModelPriceItems,
} from '../../../../../helpers';
import PricingCardSkeleton from './PricingCardSkeleton';
import { useMinimumLoadingTime } from '../../../../../hooks/common/useMinimumLoadingTime';
import { useIsMobile } from '../../../../../hooks/common/useIsMobile';


const ModelIcon = ({ model, size = 48 }) => {
  const iconKey = model?.icon || model?.vendor_icon;
  if (iconKey) {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: 'var(--semi-color-bg-0, #fff)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}
      >
        {getLobeHubIcon(iconKey, size - 16)}
      </span>
    );
  }
  const text = (model?.model_name || '?').slice(0, 2).toUpperCase();
  const c = stringToColor(model?.model_name || '');
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '12px',
        background: `${c}18`,
        color: c,
        fontSize: size * 0.33,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: `1px solid ${c}28`,
      }}
    >
      {text}
    </span>
  );
};

const SpecLabel = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {label}
    </span>
    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', marginTop: '1px' }}>
      {value}
    </span>
  </div>
);

const PriceBlock = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 0 }}>
    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {label}
    </span>
    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', marginTop: '1px', fontFamily: 'var(--font-mono)' }}>
      {value}
    </span>
  </div>
);

const TagBadge = ({ children, color, bg }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '1px 7px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 600,
      color: color || 'var(--text-secondary)',
      background: bg || 'var(--surface-active)',
      whiteSpace: 'nowrap',
      lineHeight: '18px',
    }}
  >
    {children}
  </span>
);

const CACHE_KEYS = new Set(['cache', 'create-cache', 'cache-ratio', 'create-cache-ratio']);

const ModelRow = ({
  model,
  isSelected,
  priceData,
  rowSelection,
  copyText,
  showRatio,
  openModelDetail,
  handleCheckboxChange,
  t,
}) => {
  const endpoints = model.supported_endpoint_types || [];
  const priceItems = priceData ? getModelPriceItems(priceData, t) : [];

  const inputPrice = priceItems.find((i) => i.key === 'input' || i.key === 'prompt');
  const outputPrice = priceItems.find((i) => i.key === 'output' || i.key === 'completion');
  const cachePrice = priceItems.find((i) => CACHE_KEYS.has(i.key));
  const otherSpecs = priceItems.filter(
    (i) => !['input', 'prompt', 'output', 'completion'].includes(i.key) && !CACHE_KEYS.has(i.key),
  );

  const tags = model.tags || [];

  return (
    <div
      onClick={() => openModelDetail?.(model)}
      className='pricing-row'
      style={{
        borderRadius: 'var(--radius-lg)',
        background: isSelected ? 'var(--accent-light)' : 'var(--surface)',
        border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-default)',
        padding: '14px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}
    >
      {/* ── 左侧图标 ── */}
      <ModelIcon model={model} size={48} />

      {/* ── 中间主体 ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* 模型名 + tags */}
        <div className='flex items-center flex-wrap gap-1.5' style={{ marginBottom: '6px' }}>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {model.model_name}
          </span>
          {model.quota_type === 1 && (
            <TagBadge color='#30B0C7' bg='rgba(48,176,199,0.10)'>{t('按次')}</TagBadge>
          )}
          {tags.slice(0, 3).map((tag) => (
            <TagBadge key={tag}>{tag}</TagBadge>
          ))}
        </div>

        {/* 规格标签行 */}
        <div className='flex items-center flex-wrap gap-3'>
          {endpoints.slice(0, 4).map((ep) => (
            <SpecLabel key={ep} label={ep} value={''} />
          ))}
          {otherSpecs.slice(0, 3).map((item) => (
            <SpecLabel key={item.key} label={item.label} value={`${item.value}${item.suffix || ''}`} />
          ))}
          {model.description && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
              {model.description}
            </span>
          )}
        </div>
      </div>

      {/* ── 右侧价格区 ── */}
      <div className='flex items-center gap-4 flex-shrink-0'>
        {inputPrice && (
          <PriceBlock
            label={t('输入价格')}
            value={`${inputPrice.value}${inputPrice.suffix || ''}`}
          />
        )}
        {outputPrice && (
          <PriceBlock
            label={t('输出价格')}
            value={`${outputPrice.value}${outputPrice.suffix || ''}`}
          />
        )}
        {cachePrice && (
          <PriceBlock
            label={cachePrice.label}
            value={`${cachePrice.value}${cachePrice.suffix || ''}`}
          />
        )}
        {showRatio && model.quota_type === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t('倍率')}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
              ×{model.model_ratio}
            </span>
          </div>
        )}

        {rowSelection && (
          <Checkbox
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              handleCheckboxChange(model, e.target.checked);
            }}
          />
        )}
      </div>
    </div>
  );
};

const PricingCardView = ({
  filteredModels,
  loading,
  rowSelection,
  pageSize,
  setPageSize,
  currentPage,
  setCurrentPage,
  selectedGroup,
  groupRatio,
  copyText,
  setModalImageUrl,
  setIsModalOpenurl,
  currency,
  siteDisplayType,
  tokenUnit,
  displayPrice,
  showRatio,
  t,
  selectedRowKeys = [],
  setSelectedRowKeys,
  openModelDetail,
}) => {
  const showSkeleton = useMinimumLoadingTime(loading);
  const isMobile = useIsMobile();

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedModels = filteredModels.slice(startIndex, startIndex + pageSize);
  const getModelKey = (m) => m.key ?? m.model_name ?? m.id;

  const handleCheckboxChange = (model, checked) => {
    if (!setSelectedRowKeys) return;
    const key = getModelKey(model);
    const newKeys = checked
      ? Array.from(new Set([...selectedRowKeys, key]))
      : selectedRowKeys.filter((k) => k !== key);
    setSelectedRowKeys(newKeys);
    rowSelection?.onChange?.(newKeys, null);
  };

  if (showSkeleton) {
    return <PricingCardSkeleton rowSelection={!!rowSelection} showRatio={showRatio} />;
  }

  if (!filteredModels || filteredModels.length === 0) {
    return (
      <div className='flex justify-center items-center py-16'>
        <Empty
          image={<img src='/NoDataillustration.svg' style={{ width: 120, height: 120 }} />}
          darkModeImage={<img src='/NoDataillustration.svg' style={{ width: 120, height: 120 }} />}
          description={t('搜索无结果')}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {paginatedModels.map((model, index) => {
          const key = getModelKey(model);
          const isSelected = selectedRowKeys.includes(key);
          const priceData = calculateModelPrice({
            record: model,
            selectedGroup,
            groupRatio,
            tokenUnit,
            displayPrice,
            currency,
            quotaDisplayType: siteDisplayType,
          });

          return (
            <ModelRow
              key={key || index}
              model={model}
              isSelected={isSelected}
              priceData={priceData}
              rowSelection={rowSelection}
              copyText={copyText}
              showRatio={showRatio}
              openModelDetail={openModelDetail}
              handleCheckboxChange={handleCheckboxChange}
              t={t}
            />
          );
        })}
      </div>

      {filteredModels.length > 0 && (
        <div
          className='flex justify-center py-3'
          style={{ marginTop: '8px', borderTop: '1px solid var(--border-subtle)' }}
        >
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            total={filteredModels.length}
            showSizeChanger
            pageSizeOptions={[10, 20, 50, 100]}
            size={isMobile ? 'small' : 'default'}
            showQuickJumper={!isMobile}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
};


export default PricingCardView;
