import React from 'react';
import { VChart } from '@visactor/react-vchart';
import { RefreshCw, Search } from 'lucide-react';

const ChartsPanel = ({
  activeChartTab,
  setActiveChartTab,
  spec_line,
  spec_model_line,
  spec_pie,
  spec_rank_bar,
  CARD_PROPS,
  CHART_CONFIG,
  FLEX_CENTER_GAP2,
  hasApiInfoPanel,
  t,
  onRefresh,
  onFilter,
  loading,
}) => {
  const tabs = [
    { key: '1', label: t('消耗分布') },
    { key: '2', label: t('消耗趋势') },
    { key: '3', label: t('调用次数分布') },
    { key: '4', label: t('调用次数排行') },
  ];

  return (
    <div
      className={hasApiInfoPanel ? 'lg:col-span-3' : ''}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Compact header: title left, tabs + buttons right, single row */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Left: title */}
        <div>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-serif)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {t('模型消耗分析')}
          </h3>
        </div>

        {/* Right: tab pills + action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Tab pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              padding: 2,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-base)',
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeChartTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveChartTab(tab.key)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                    background: isActive ? 'var(--surface)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    whiteSpace: 'nowrap',
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          {(onRefresh || onFilter) && (
            <div style={{ display: 'flex', gap: 4 }}>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-base)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <RefreshCw
                    size={10}
                    style={loading ? { animation: 'spin 1s linear infinite' } : undefined}
                  />
                  {t('刷新')}
                </button>
              )}
              {onFilter && (
                <button
                  onClick={onFilter}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-base)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Search size={10} />
                  {t('筛选')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chart body — fills remaining space */}
      <div style={{ flex: 1, minHeight: 280, padding: '0 16px 16px' }}>
        {activeChartTab === '1' && <VChart spec={spec_line} option={CHART_CONFIG} />}
        {activeChartTab === '2' && <VChart spec={spec_model_line} option={CHART_CONFIG} />}
        {activeChartTab === '3' && <VChart spec={spec_pie} option={CHART_CONFIG} />}
        {activeChartTab === '4' && <VChart spec={spec_rank_bar} option={CHART_CONFIG} />}
      </div>
    </div>
  );
};

export default ChartsPanel;
