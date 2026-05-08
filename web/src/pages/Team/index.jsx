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

import React, { lazy, Suspense, useMemo } from 'react';
import { Spin, Tabs, TabPane, Typography } from '@douyinfe/semi-ui';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isAdmin } from '../../helpers';
import MyTeams from './MyTeams';

// Admin tabs are admin-only and bigger payloads — lazy load so common
// users never download them.
const AdminTeamsList = lazy(() => import('../Admin/Teams'));
const TeamApplicationsAdmin = lazy(() => import('../Admin/TeamApplications'));

const { Text } = Typography;

// Container page for /console/team. Hosts up to three tabs:
//   - "我的团队" (everyone): the user's own teams + apply/join flow
//   - "全局团队" (admin): admin control plane over every team in the system
//   - "审批申请" (admin): review queue for team-creation applications
//
// Tab is synced to ?tab= so deep-links keep working — that's also how the
// legacy /console/team-applications redirect lands here.
const TeamPage = () => {
  const { t } = useTranslation();
  const admin = isAdmin();
  const [searchParams, setSearchParams] = useSearchParams();

  const validTabs = useMemo(() => {
    const tabs = ['mine'];
    if (admin) {
      // 'admin-list' will be enabled in the next commit — keep the key
      // recognized so deep-links don't bounce when it ships.
      tabs.push('admin-list');
      tabs.push('applications');
    }
    return tabs;
  }, [admin]);

  const requested = searchParams.get('tab') || '';
  const defaultTab = admin ? 'admin-list' : 'mine';
  const activeTab = validTabs.includes(requested) ? requested : defaultTab;

  const onTabChange = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 py-8'>
      <div className='mb-6'>
        <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', margin: 0 }}>
          {t('团队管理')}
        </h1>
        <Text style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          {admin
            ? t('管理你加入的团队，并审核所有团队申请')
            : t('管理你加入的团队，或申请创建新团队')}
        </Text>
      </div>

      <Tabs
        type='line'
        activeKey={activeTab}
        onChange={onTabChange}
        size='large'
      >
        <TabPane tab={t('我的团队')} itemKey='mine'>
          <MyTeams />
        </TabPane>
        {admin && (
          <TabPane tab={t('全局团队')} itemKey='admin-list'>
            <Suspense fallback={<div className='py-12 text-center'><Spin /></div>}>
              <AdminTeamsList embedded />
            </Suspense>
          </TabPane>
        )}
        {admin && (
          <TabPane tab={t('审批申请')} itemKey='applications'>
            <Suspense fallback={<div className='py-12 text-center'><Spin /></div>}>
              <TeamApplicationsAdmin embedded />
            </Suspense>
          </TabPane>
        )}
      </Tabs>
    </div>
  );
};

export default TeamPage;
