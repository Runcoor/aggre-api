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
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Spin, Empty } from '@douyinfe/semi-ui';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUserDetail } from '../../hooks/users/useUserDetail';
import IdentityCard from './userDetail/IdentityCard';
import FinanceCards from './userDetail/FinanceCards';
import UserDetailTabs from './userDetail/UserDetailTabs';

const UserDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = parseInt(id, 10);
  const { overview, loading, error, refetch } = useUserDetail(userId);

  if (loading && !overview) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
        <Spin size='large' />
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div style={{ padding: 24 }}>
        <Empty title={t('加载失败')} description={error}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <Button onClick={() => navigate('/console/user')}>
              {t('返回用户列表')}
            </Button>
            <Button type='primary' onClick={refetch}>
              {t('重试')}
            </Button>
          </div>
        </Empty>
      </div>
    );
  }

  if (!overview) {
    return null;
  }

  return (
    <div style={{ padding: 16 }}>
      {/* BackBar */}
      <div style={{ marginBottom: 12 }}>
        <Button
          theme='borderless'
          type='tertiary'
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate('/console/user')}
        >
          {t('返回用户列表')}
        </Button>
      </div>
      {/* Top region: identity card + finance metric cards */}
      <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <IdentityCard user={overview.user} />
        <FinanceCards
          finance={overview.finance}
          subsSummary={overview.subscriptions_summary}
        />
      </div>
      {/* Tabs region */}
      <UserDetailTabs
        userId={userId}
        user={overview.user}
        security={overview.security}
        onAdminAction={refetch}
      />
    </div>
  );
};

export default UserDetail;
