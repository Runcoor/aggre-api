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
import React, { useEffect, useState, useRef } from 'react';
import { Banner, Button, Form, Row, Col, Typography } from '@douyinfe/semi-ui';
const { Text } = Typography;
import { API, showError, showSuccess } from '../../../helpers';
import { useTranslation } from 'react-i18next';
import MacSpinner from '../../../components/common/ui/MacSpinner';

export default function SettingsPaymentGatewayWallet(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    WalletPayEnabled: false,
  });
  const formApiRef = useRef(null);

  useEffect(() => {
    if (props.options && formApiRef.current) {
      // payment_setting.wallet_pay_enabled is surfaced as the bare value string
      // from the options endpoint (ExportAllConfigs flattens it). When loaded
      // through PaymentSetting.jsx the key has already been parsed into the
      // inputs map; we accept both the prefixed and bare forms.
      const raw =
        props.options['payment_setting.wallet_pay_enabled'] ??
        props.options.WalletPayEnabled ??
        'false';
      const enabled = raw === true || raw === 'true';
      const next = { WalletPayEnabled: enabled };
      setInputs(next);
      formApiRef.current.setValues(next);
    }
  }, [props.options]);

  const handleFormChange = (values) => {
    setInputs(values);
  };

  const submitWalletSetting = async () => {
    setLoading(true);
    try {
      const res = await API.put('/api/option/', {
        key: 'payment_setting.wallet_pay_enabled',
        value: inputs.WalletPayEnabled ? 'true' : 'false',
      });
      if (res.data.success) {
        showSuccess(t('更新成功'));
        props.refresh?.();
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(t('更新失败'));
    }
    setLoading(false);
  };

  return (
    <MacSpinner spinning={loading}>
      <Form
        initValues={inputs}
        onValueChange={handleFormChange}
        getFormApi={(api) => (formApiRef.current = api)}
      >
        <Form.Section text={t('钱包余额支付订阅')}>
          <Banner
            type='info'
            description={t(
              '启用后，用户可使用钱包余额直接购买订阅套餐（按 1 USD = $1 美金 等额扣减 quota）。仅作用于个人订阅，团队订阅仍需走外部支付通道。',
            )}
          />
          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Switch
                field='WalletPayEnabled'
                label={t('启用钱包余额支付')}
                extraText={t('关闭后订阅支付方式列表不再显示该选项')}
              />
            </Col>
          </Row>
          <Button onClick={submitWalletSetting} style={{ marginTop: 16 }}>
            {t('更新钱包支付设置')}
          </Button>
        </Form.Section>
      </Form>
    </MacSpinner>
  );
}
