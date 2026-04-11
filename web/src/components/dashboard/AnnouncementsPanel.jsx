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
import { Timeline, Empty } from '@douyinfe/semi-ui';
import { Bell } from 'lucide-react';
import { marked } from 'marked';
import ScrollableContainer from '../common/ui/ScrollableContainer';

const AnnouncementsPanel = ({
  announcementData,
  announcementLegendData,
  CARD_PROPS,
  ILLUSTRATION_SIZE,
  t,
  fullWidth,
}) => {
  return (
    <div
      className={fullWidth ? 'rounded-[var(--radius-lg)] border overflow-hidden' : 'lg:col-span-2 rounded-[var(--radius-lg)] border overflow-hidden'}
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border-subtle)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Panel header — compact vertical layout for narrow width */}
      <div
        className='px-4 py-3 border-b'
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center gap-2'>
            <Bell size={14} style={{ color: 'var(--warning)' }} />
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'var(--font-serif)',
                color: 'var(--text-primary)',
              }}
            >
              {t('系统公告')}
            </span>
          </div>
          <span
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-active)',
              color: 'var(--text-muted)',
            }}
          >
            {t('最新20条')}
          </span>
        </div>
        <div className='flex flex-wrap gap-2' style={{ fontSize: 10 }}>
          {announcementLegendData.map((legend, index) => (
            <div key={index} className='flex items-center gap-1'>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor:
                    legend.color === 'grey'
                      ? 'var(--text-muted)'
                      : legend.color === 'blue'
                        ? 'var(--accent)'
                        : legend.color === 'green'
                          ? 'var(--success)'
                          : legend.color === 'orange'
                            ? 'var(--warning)'
                            : legend.color === 'red'
                              ? 'var(--error)'
                              : 'var(--text-muted)',
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>{legend.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <ScrollableContainer maxHeight='100%' className='flex-1'>
        {announcementData.length > 0 ? (
          <div className='p-4'>
            <Timeline mode='left'>
              {announcementData.map((item, idx) => {
                const htmlExtra = item.extra ? marked.parse(item.extra) : '';
                return (
                  <Timeline.Item
                    key={idx}
                    type={item.type || 'default'}
                    time={`${item.relative ? item.relative + ' ' : ''}${item.time}`}
                    extra={
                      item.extra ? (
                        <div
                          className='text-xs'
                          style={{ color: 'var(--text-muted)' }}
                          dangerouslySetInnerHTML={{ __html: htmlExtra }}
                        />
                      ) : null
                    }
                  >
                    <div>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(item.content || ''),
                        }}
                      />
                    </div>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          </div>
        ) : (
          <div className='flex justify-center items-center py-8'>
            <Empty
              image={<img src="/NoDataillustration.svg" style={ILLUSTRATION_SIZE} />}
              darkModeImage={
                <img src="/NoDataillustration.svg" style={ILLUSTRATION_SIZE} />
              }
              title={t('暂无系统公告')}
              description={t('请联系管理员在系统设置中配置公告信息')}
            />
          </div>
        )}
      </ScrollableContainer>
    </div>
  );
};

export default AnnouncementsPanel;
