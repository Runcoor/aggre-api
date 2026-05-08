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
import { Spin } from '@douyinfe/semi-ui';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isAdmin } from '../../helpers';
import MyTeams from './MyTeams';
import './team-design.css';

// Admin tabs are admin-only and bigger payloads — lazy load so common
// users never download them.
const AdminTeamsList = lazy(() => import('../Admin/Teams'));
const TeamApplicationsAdmin = lazy(() => import('../Admin/TeamApplications'));

// Container page for /console/team. Hosts up to three tabs:
//   - "我的团队" (everyone): the user's own teams + apply/join flow
//   - "全局团队" (admin): admin control plane over every team in the system
//   - "审批申请" (admin): review queue for team-creation applications
const TeamPage = () => {
  const { t } = useTranslation();
  const admin = isAdmin();
  const [searchParams, setSearchParams] = useSearchParams();

  const validTabs = useMemo(() => {
    const tabs = ['mine'];
    if (admin) {
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
    <div className='team-design w-full max-w-[1240px] mx-auto px-7 pt-7 pb-20'>
      <div className='td-head'>
        <div>
          <h1 className='td-title'>{t('团队管理')}</h1>
          <div className='td-sub'>
            {admin
              ? t('审核全平台团队申请，管理你加入的团队')
              : t('管理你加入的团队，与成员共享订阅与令牌额度')}
          </div>
        </div>
      </div>

      <div className='td-tab-bar'>
        <button
          type='button'
          className={'td-tab' + (activeTab === 'mine' ? ' active' : '')}
          onClick={() => onTabChange('mine')}
        >
          {t('我的团队')}
        </button>
        {admin && (
          <button
            type='button'
            className={'td-tab' + (activeTab === 'admin-list' ? ' active' : '')}
            onClick={() => onTabChange('admin-list')}
          >
            {t('全局团队')}
          </button>
        )}
        {admin && (
          <button
            type='button'
            className={'td-tab' + (activeTab === 'applications' ? ' active' : '')}
            onClick={() => onTabChange('applications')}
          >
            {t('审批申请')}
          </button>
        )}
      </div>

      {activeTab === 'mine' && <MyTeams />}

      {activeTab === 'admin-list' && admin && (
        <Suspense fallback={<div className='py-12 text-center'><Spin /></div>}>
          <AdminTeamsList embedded />
        </Suspense>
      )}

      {activeTab === 'applications' && admin && (
        <Suspense fallback={<div className='py-12 text-center'><Spin /></div>}>
          <TeamApplicationsAdmin embedded />
        </Suspense>
      )}
    </div>
  );
};

export default TeamPage;
