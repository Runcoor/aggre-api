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
import { useTranslation } from 'react-i18next';
import { renderQuota } from '../../../helpers';

const Card = ({ label, value }) => (
  <div
    style={{
      flex: 1,
      minWidth: 140,
      padding: 16,
      background: 'var(--surface)',
      borderRadius: 'var(--radius-lg)',
    }}
  >
    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{value}</div>
  </div>
);

const FinanceCards = ({ finance, subsSummary }) => {
  const { t } = useTranslation();
  if (!finance) return null;
  // Backend returns topup_total_cents derived from TopUp.Money (USD float * 100).
  const topupUsd = ((finance.topup_total_cents || 0) / 100).toFixed(2);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <Card label={t('钱包余额')} value={renderQuota(finance.wallet_quota || 0)} />
      <Card label={t('累计已用')} value={renderQuota(finance.used_quota || 0)} />
      <Card label={t('累计充值')} value={`$${topupUsd}`} />
      <Card label={t('累计请求')} value={(finance.request_count || 0).toLocaleString()} />
      <Card
        label={t('套餐剩余额度')}
        value={renderQuota(subsSummary?.total_remaining_quota || 0)}
      />
    </div>
  );
};

export default FinanceCards;
