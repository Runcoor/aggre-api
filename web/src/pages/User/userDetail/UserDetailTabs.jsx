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

import React, { useState } from 'react';
import { Tabs, TabPane } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

import SubscriptionsTab from './SubscriptionsTab';
import UsageLogsTab from './UsageLogsTab';
import TopupsTab from './TopupsTab';
import LoginLogsTab from './LoginLogsTab';
import TasksTab from './TasksTab';
import SecurityTab from './SecurityTab';

const UserDetailTabs = ({ userId, user, security, onAdminAction }) => {
  const { t } = useTranslation();
  const [active, setActive] = useState('subscriptions');
  return (
    <Tabs
      type='line'
      activeKey={active}
      onChange={setActive}
      lazyRender
      keepDOM={false}
    >
      <TabPane tab={t('套餐')} itemKey='subscriptions'>
        <SubscriptionsTab userId={userId} user={user} onChanged={onAdminAction} />
      </TabPane>
      <TabPane tab={t('使用记录')} itemKey='logs'>
        <UsageLogsTab user={user} />
      </TabPane>
      <TabPane tab={t('任务记录')} itemKey='tasks'>
        <TasksTab userId={userId} />
      </TabPane>
      <TabPane tab={t('充值记录')} itemKey='topups'>
        <TopupsTab userId={userId} />
      </TabPane>
      <TabPane tab={t('登录日志')} itemKey='login-logs'>
        <LoginLogsTab userId={userId} />
      </TabPane>
      <TabPane tab={t('安全')} itemKey='security'>
        <SecurityTab userId={userId} security={security} onChanged={onAdminAction} />
      </TabPane>
    </Tabs>
  );
};

export default UserDetailTabs;
