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
import { Button, Badge } from '@douyinfe/semi-ui';
import { Bell } from 'lucide-react';

const headerIconBtnClass = '!w-8 !h-8 !p-0 flex items-center justify-center';
const headerIconBtnStyle = {
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-secondary)',
  background: 'transparent',
  transition: 'background-color 150ms ease-out, color 150ms ease-out',
};

const NotificationButton = ({ unreadCount, onNoticeOpen, t }) => {
  const buttonProps = {
    icon: <Bell size={16} />,
    'aria-label': t('系统公告'),
    onClick: onNoticeOpen,
    theme: 'borderless',
    type: 'tertiary',
    className: headerIconBtnClass,
    style: headerIconBtnStyle,
  };

  if (unreadCount > 0) {
    return (
      <Badge count={unreadCount} type='danger' overflowCount={99}>
        <Button {...buttonProps} />
      </Badge>
    );
  }

  return <Button {...buttonProps} />;
};

export default NotificationButton;
