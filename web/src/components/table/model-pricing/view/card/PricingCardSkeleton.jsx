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
import { Skeleton } from '@douyinfe/semi-ui';

const PricingCardSkeleton = ({ skeletonCount = 10 }) => {
  const placeholder = (
    <div style={{ padding: '8px 12px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            style={{
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)',
              background: 'var(--surface)',
              padding: '12px 16px',
            }}
          >
            {/* Row 1 */}
            <div className='flex items-center gap-2.5'>
              <Skeleton.Avatar style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className='flex items-center gap-1.5 mb-1'>
                  <Skeleton.Title style={{ width: `${90 + (i % 4) * 25}px`, height: 14, marginBottom: 0 }} />
                  <Skeleton.Button size='small' style={{ width: 32, height: 16, borderRadius: 4 }} />
                </div>
                <Skeleton.Title style={{ width: `${120 + (i % 3) * 20}px`, height: 11, marginBottom: 0 }} />
              </div>
              <Skeleton.Avatar style={{ width: 26, height: 26, borderRadius: 6, opacity: 0.4 }} />
            </div>

            {/* Row 2: chips */}
            <div className='flex items-center flex-wrap gap-1' style={{ marginTop: 8 }}>
              {Array.from({ length: 3 + (i % 3) }).map((_, j) => (
                <Skeleton.Button key={j} size='small' style={{ width: 60 + j * 12, height: 22, borderRadius: 4 }} />
              ))}
            </div>

            {/* Row 3: endpoints */}
            <div className='flex items-center flex-wrap gap-1' style={{ marginTop: 7 }}>
              {Array.from({ length: 2 + (i % 3) }).map((_, j) => (
                <Skeleton.Button key={j} size='small' style={{ width: 38 + j * 8, height: 18, borderRadius: 4 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return <Skeleton loading active placeholder={placeholder} />;
};

export default PricingCardSkeleton;
