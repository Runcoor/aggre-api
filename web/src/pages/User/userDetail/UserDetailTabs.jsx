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

const Pending = ({ name }) => (
  <div style={{ padding: 24, color: 'var(--text-muted)' }}>{name} (pending)</div>
);

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
        <Pending name={t('使用记录')} />
      </TabPane>
      <TabPane tab={t('任务记录')} itemKey='tasks'>
        <Pending name={t('任务记录')} />
      </TabPane>
      <TabPane tab={t('充值记录')} itemKey='topups'>
        <Pending name={t('充值记录')} />
      </TabPane>
      <TabPane tab={t('登录日志')} itemKey='login-logs'>
        <Pending name={t('登录日志')} />
      </TabPane>
      <TabPane tab={t('安全')} itemKey='security'>
        <Pending name={t('安全')} />
      </TabPane>
    </Tabs>
  );
};

export default UserDetailTabs;
