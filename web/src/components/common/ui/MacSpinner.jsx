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

const bars = Array.from({ length: 12 });

const sizeClassMap = {
  small: 'mv-loader-small',
  default: 'mv-loader-medium',
  middle: 'mv-loader-medium',
  medium: 'mv-loader-medium',
  large: 'mv-loader-large',
};

/**
 * macOS-style 12-bar radiating activity indicator.
 * Drop-in replacement for Semi Design <Spin> component.
 *
 * Supports the same API surface:
 *   - spinning: boolean (default true) — controls visibility
 *   - size: 'small' | 'default' | 'middle' | 'large'
 *   - tip: string — optional text below spinner
 *   - children: when present, acts as wrapper (overlay spinner on children)
 *   - childContainerProps: additional props for the children container
 */
const MacSpinner = ({
  spinning = true,
  size = 'default',
  tip,
  children,
  style,
  className = '',
  childContainerProps = {},
}) => {
  const sizeClass = sizeClassMap[size] || sizeClassMap.default;

  const spinner = (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${className}`}
      style={style}
    >
      <div className={`mv-loader ${sizeClass}`}>
        {bars.map((_, i) => (
          <span key={i} className='mv-loader-bar' />
        ))}
      </div>
      {tip && (
        <span
          className='text-xs'
          style={{ color: 'var(--text-secondary)' }}
        >
          {tip}
        </span>
      )}
    </div>
  );

  // Standalone mode (no children)
  if (!children) {
    return spinning !== false ? spinner : null;
  }

  // Wrapper mode (with children)
  return (
    <div className='relative' {...childContainerProps}>
      {children}
      {spinning && (
        <div
          className='absolute inset-0 flex items-center justify-center'
          style={{
            background: 'var(--bg-base-alpha, rgba(28, 28, 30, 0.6))',
            borderRadius: 'inherit',
            zIndex: 10,
          }}
        >
          {spinner}
        </div>
      )}
    </div>
  );
};

export default MacSpinner;
