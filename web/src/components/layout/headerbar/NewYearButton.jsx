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
import { Button, Dropdown } from '@douyinfe/semi-ui';
import fireworks from 'react-fireworks';

const headerIconBtnClass = '!w-8 !h-8 !p-0 flex items-center justify-center';
const headerIconBtnStyle = {
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-secondary)',
  background: 'transparent',
  transition: 'background-color 150ms ease-out, color 150ms ease-out',
};

const NewYearButton = ({ isNewYear }) => {
  if (!isNewYear) {
    return null;
  }

  const handleNewYearClick = () => {
    fireworks.init('root', {});
    fireworks.start();
    setTimeout(() => {
      fireworks.stop();
    }, 3000);
  };

  return (
    <Dropdown
      position='bottomRight'
      render={
        <Dropdown.Menu>
          <Dropdown.Item
            onClick={handleNewYearClick}
            style={{
              color: 'var(--text-primary)',
              fontSize: '13px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Happy New Year!!!
          </Dropdown.Item>
        </Dropdown.Menu>
      }
    >
      <Button
        theme='borderless'
        type='tertiary'
        icon={<span style={{ fontSize: '16px' }}>🎉</span>}
        aria-label='New Year'
        className={headerIconBtnClass}
        style={headerIconBtnStyle}
      />
    </Dropdown>
  );
};

export default NewYearButton;
