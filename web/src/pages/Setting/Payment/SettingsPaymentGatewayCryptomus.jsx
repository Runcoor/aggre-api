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
import {
  Banner,
  Button,
  Form,
  Row,
  Col,
  Typography,
} from '@douyinfe/semi-ui';
const { Text } = Typography;
import {
  API,
  removeTrailingSlash,
  showError,
  showSuccess,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';
import MacSpinner from '../../../components/common/ui/MacSpinner';

export default function SettingsPaymentGatewayCryptomus(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    CryptomusEnabled: false,
    CryptomusMerchantId: '',
    CryptomusPaymentApiKey: '',
    CryptomusWebhookApiKey: '',
    CryptomusNetwork: '',
    CryptomusCurrency: '',
    CryptomusOrderCurrency: 'USD',
    CryptomusNotifyUrl: '',
    CryptomusReturnUrl: '',
    CryptomusUnitPrice: 1.0,
    CryptomusMinTopUp: 1,
  });
  const [originInputs, setOriginInputs] = useState({});
  const formApiRef = useRef(null);

  useEffect(() => {
    if (props.options && formApiRef.current) {
      const currentInputs = {
        CryptomusEnabled:
          props.options.CryptomusEnabled !== undefined
            ? props.options.CryptomusEnabled === true ||
              props.options.CryptomusEnabled === 'true'
            : false,
        CryptomusMerchantId: props.options.CryptomusMerchantId || '',
        CryptomusPaymentApiKey: props.options.CryptomusPaymentApiKey || '',
        CryptomusWebhookApiKey: props.options.CryptomusWebhookApiKey || '',
        CryptomusNetwork: props.options.CryptomusNetwork || '',
        CryptomusCurrency: props.options.CryptomusCurrency || '',
        CryptomusOrderCurrency: props.options.CryptomusOrderCurrency || 'USD',
        CryptomusNotifyUrl: props.options.CryptomusNotifyUrl || '',
        CryptomusReturnUrl: props.options.CryptomusReturnUrl || '',
        CryptomusUnitPrice:
          props.options.CryptomusUnitPrice !== undefined
            ? parseFloat(props.options.CryptomusUnitPrice)
            : 1.0,
        CryptomusMinTopUp:
          props.options.CryptomusMinTopUp !== undefined
            ? parseFloat(props.options.CryptomusMinTopUp)
            : 1,
      };
      setInputs(currentInputs);
      setOriginInputs({ ...currentInputs });
      formApiRef.current.setValues(currentInputs);
    }
  }, [props.options]);

  const handleFormChange = (values) => {
    setInputs(values);
  };

  const submitCryptomusSetting = async () => {
    if (props.options.ServerAddress === '') {
      showError(t('请先填写服务器地址'));
      return;
    }

    setLoading(true);
    try {
      const options = [];

      if (originInputs.CryptomusEnabled !== inputs.CryptomusEnabled) {
        options.push({
          key: 'CryptomusEnabled',
          value: inputs.CryptomusEnabled ? 'true' : 'false',
        });
      }
      if (inputs.CryptomusMerchantId !== originInputs.CryptomusMerchantId) {
        options.push({
          key: 'CryptomusMerchantId',
          value: inputs.CryptomusMerchantId || '',
        });
      }
      if (
        inputs.CryptomusPaymentApiKey &&
        inputs.CryptomusPaymentApiKey !== ''
      ) {
        options.push({
          key: 'CryptomusPaymentApiKey',
          value: inputs.CryptomusPaymentApiKey,
        });
      }
      if (
        inputs.CryptomusWebhookApiKey &&
        inputs.CryptomusWebhookApiKey !== ''
      ) {
        options.push({
          key: 'CryptomusWebhookApiKey',
          value: inputs.CryptomusWebhookApiKey,
        });
      }
      if (inputs.CryptomusNetwork !== originInputs.CryptomusNetwork) {
        options.push({
          key: 'CryptomusNetwork',
          value: inputs.CryptomusNetwork || '',
        });
      }
      if (inputs.CryptomusCurrency !== originInputs.CryptomusCurrency) {
        options.push({
          key: 'CryptomusCurrency',
          value: inputs.CryptomusCurrency || '',
        });
      }
      if (
        inputs.CryptomusOrderCurrency !== originInputs.CryptomusOrderCurrency
      ) {
        options.push({
          key: 'CryptomusOrderCurrency',
          value: inputs.CryptomusOrderCurrency || 'USD',
        });
      }
      if (inputs.CryptomusNotifyUrl !== originInputs.CryptomusNotifyUrl) {
        options.push({
          key: 'CryptomusNotifyUrl',
          value: removeTrailingSlash(inputs.CryptomusNotifyUrl || ''),
        });
      }
      if (inputs.CryptomusReturnUrl !== originInputs.CryptomusReturnUrl) {
        options.push({
          key: 'CryptomusReturnUrl',
          value: removeTrailingSlash(inputs.CryptomusReturnUrl || ''),
        });
      }
      if (
        inputs.CryptomusUnitPrice !== undefined &&
        inputs.CryptomusUnitPrice !== null
      ) {
        options.push({
          key: 'CryptomusUnitPrice',
          value: inputs.CryptomusUnitPrice.toString(),
        });
      }
      if (
        inputs.CryptomusMinTopUp !== undefined &&
        inputs.CryptomusMinTopUp !== null
      ) {
        options.push({
          key: 'CryptomusMinTopUp',
          value: inputs.CryptomusMinTopUp.toString(),
        });
      }

      const requestQueue = options.map((opt) =>
        API.put('/api/option/', { key: opt.key, value: opt.value }),
      );
      const results = await Promise.all(requestQueue);
      const errorResults = results.filter((res) => !res.data.success);
      if (errorResults.length > 0) {
        errorResults.forEach((res) => showError(res.data.message));
      } else {
        showSuccess(t('更新成功'));
        setOriginInputs({ ...inputs });
        props.refresh?.();
      }
    } catch (error) {
      showError(t('更新失败'));
    }
    setLoading(false);
  };

  const webhookUrl = props.options?.ServerAddress
    ? `${removeTrailingSlash(props.options.ServerAddress)}/api/cryptomus/webhook`
    : t('网站地址') + '/api/cryptomus/webhook';

  return (
    <MacSpinner spinning={loading}>
      <Form
        initValues={inputs}
        onValueChange={handleFormChange}
        getFormApi={(api) => (formApiRef.current = api)}
      >
        <Form.Section text={t('Cryptomus 加密货币支付')}>
          <Text>
            {t(
              'Cryptomus 是一个加密货币支付网关，支持 USDT / USDC / BTC / ETH 等主流币种。',
            )}
            {t('请先到')}
            <a
              href='https://app.cryptomus.com/'
              target='_blank'
              rel='noreferrer'
            >
              Cryptomus 控制台
            </a>
            {t('注册商户并获取 Merchant ID 与 Payment API Key。')}
          </Text>
          <Banner
            type='info'
            description={`${t('Webhook 回调地址（请填到 Cryptomus 商户后台的 Webhook 设置中）')}: ${webhookUrl}`}
            style={{ marginTop: 12 }}
          />
          <Banner
            type='warning'
            description={t(
              '建议在 Cryptomus 后台开启 Auto-Forward，将收款自动转到你自己持有的钱包，避免在平台账户留存余额。',
            )}
            style={{ marginTop: 8 }}
          />
          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Switch
                field='CryptomusEnabled'
                label={t('启用 Cryptomus')}
                size='default'
                checkedText='｜'
                uncheckedText='〇'
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='CryptomusMerchantId'
                label={t('商户 ID (Merchant ID)')}
                placeholder={t('Cryptomus 后台 Merchant 页面获取')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='CryptomusOrderCurrency'
                label={t('报价币种')}
                placeholder={t('默认 USD，也支持 EUR 等')}
              />
            </Col>
          </Row>
          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='CryptomusPaymentApiKey'
                label={t('Payment API Key')}
                placeholder={t('Cryptomus 后台 → API → Payment API Key，敏感信息不显示')}
                type='password'
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='CryptomusWebhookApiKey'
                label={t('Webhook API Key')}
                placeholder={t('不填则默认使用 Payment API Key，敏感信息不显示')}
                type='password'
              />
            </Col>
          </Row>
          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='CryptomusNetwork'
                label={t('默认网络')}
                placeholder={t('例如：tron（留空让用户自选）')}
                extraText={t('常用: tron / eth / bsc / polygon / solana')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='CryptomusCurrency'
                label={t('默认收款币种')}
                placeholder={t('例如：USDT（留空让用户自选）')}
                extraText={t('常用: USDT / USDC / BTC / ETH')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='CryptomusUnitPrice'
                precision={2}
                label={t('充值价格（x USD/单位）')}
                placeholder={t('1 单位 = 多少 USD，默认 1.0')}
              />
            </Col>
          </Row>
          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='CryptomusMinTopUp'
                label={t('最低充值数量')}
                placeholder={t('默认 1')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='CryptomusNotifyUrl'
                label={t('自定义 Webhook 地址（可选）')}
                placeholder={t('留空自动使用服务器地址')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='CryptomusReturnUrl'
                label={t('支付完成跳转地址（可选）')}
                placeholder={t('留空跳转到充值页')}
              />
            </Col>
          </Row>
          <Button onClick={submitCryptomusSetting} style={{ marginTop: 16 }}>
            {t('更新 Cryptomus 设置')}
          </Button>
        </Form.Section>
      </Form>
    </MacSpinner>
  );
}
