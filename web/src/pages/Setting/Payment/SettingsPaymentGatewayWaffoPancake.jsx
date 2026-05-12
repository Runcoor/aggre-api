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

import React, { useEffect, useRef, useState } from 'react';
import {
  Banner,
  Button,
  Col,
  Form,
  Row,
} from '@douyinfe/semi-ui';
import { API, showError, showSuccess } from '../../../helpers';
import { useTranslation } from 'react-i18next';
import MacSpinner from '../../../components/common/ui/MacSpinner';

const sectionLabelStyle = {
  fontFamily: 'var(--font-serif)',
  fontWeight: 600,
  fontSize: '14px',
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
};

const DEFAULTS = {
  WaffoPancakeEnabled: false,
  WaffoPancakeSandbox: true,
  WaffoPancakeMerchantId: '',
  WaffoPancakePrivateKey: '',
  WaffoPancakeSandboxPrivateKey: '',
  WaffoPancakeWebhookPublicKey: '',
  WaffoPancakeSandboxWebhookPublicKey: '',
  WaffoPancakeStoreId: '',
  WaffoPancakeSandboxStoreId: '',
  WaffoPancakeProductId: '',
  WaffoPancakeSandboxProductId: '',
  WaffoPancakeCurrency: 'USD',
  WaffoPancakeUnitPrice: 1.0,
  WaffoPancakeMinTopUp: 10,
  WaffoPancakeReturnUrl: '',
};

export default function SettingsPaymentGatewayWaffoPancake(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState(DEFAULTS);
  const formApiRef = useRef(null);

  useEffect(() => {
    if (!props.options || !formApiRef.current) return;
    const next = {
      WaffoPancakeEnabled:
        props.options.WaffoPancakeEnabled === 'true' ||
        props.options.WaffoPancakeEnabled === true,
      WaffoPancakeSandbox:
        props.options.WaffoPancakeSandbox === undefined
          ? true
          : props.options.WaffoPancakeSandbox === 'true' ||
            props.options.WaffoPancakeSandbox === true,
      WaffoPancakeMerchantId: props.options.WaffoPancakeMerchantId || '',
      WaffoPancakePrivateKey: props.options.WaffoPancakePrivateKey || '',
      WaffoPancakeSandboxPrivateKey:
        props.options.WaffoPancakeSandboxPrivateKey || '',
      WaffoPancakeWebhookPublicKey:
        props.options.WaffoPancakeWebhookPublicKey || '',
      WaffoPancakeSandboxWebhookPublicKey:
        props.options.WaffoPancakeSandboxWebhookPublicKey || '',
      WaffoPancakeStoreId: props.options.WaffoPancakeStoreId || '',
      WaffoPancakeSandboxStoreId: props.options.WaffoPancakeSandboxStoreId || '',
      WaffoPancakeProductId: props.options.WaffoPancakeProductId || '',
      WaffoPancakeSandboxProductId:
        props.options.WaffoPancakeSandboxProductId || '',
      WaffoPancakeCurrency: props.options.WaffoPancakeCurrency || 'USD',
      WaffoPancakeUnitPrice:
        parseFloat(props.options.WaffoPancakeUnitPrice) || 1.0,
      WaffoPancakeMinTopUp:
        parseInt(props.options.WaffoPancakeMinTopUp, 10) || 10,
      WaffoPancakeReturnUrl: props.options.WaffoPancakeReturnUrl || '',
    };
    setInputs(next);
    formApiRef.current.setValues(next);
  }, [props.options]);

  const handleFormChange = (values) => setInputs(values);

  const submit = async () => {
    setLoading(true);
    try {
      const options = [
        { key: 'WaffoPancakeEnabled', value: inputs.WaffoPancakeEnabled ? 'true' : 'false' },
        { key: 'WaffoPancakeSandbox', value: inputs.WaffoPancakeSandbox ? 'true' : 'false' },
        { key: 'WaffoPancakeMerchantId', value: inputs.WaffoPancakeMerchantId || '' },
        // Private keys: only push if non-empty so blank inputs don't wipe stored secrets.
        ...(inputs.WaffoPancakePrivateKey ? [{ key: 'WaffoPancakePrivateKey', value: inputs.WaffoPancakePrivateKey }] : []),
        ...(inputs.WaffoPancakeSandboxPrivateKey ? [{ key: 'WaffoPancakeSandboxPrivateKey', value: inputs.WaffoPancakeSandboxPrivateKey }] : []),
        { key: 'WaffoPancakeWebhookPublicKey', value: inputs.WaffoPancakeWebhookPublicKey || '' },
        { key: 'WaffoPancakeSandboxWebhookPublicKey', value: inputs.WaffoPancakeSandboxWebhookPublicKey || '' },
        { key: 'WaffoPancakeStoreId', value: inputs.WaffoPancakeStoreId || '' },
        { key: 'WaffoPancakeSandboxStoreId', value: inputs.WaffoPancakeSandboxStoreId || '' },
        { key: 'WaffoPancakeProductId', value: inputs.WaffoPancakeProductId || '' },
        { key: 'WaffoPancakeSandboxProductId', value: inputs.WaffoPancakeSandboxProductId || '' },
        { key: 'WaffoPancakeCurrency', value: inputs.WaffoPancakeCurrency || 'USD' },
        { key: 'WaffoPancakeUnitPrice', value: String(inputs.WaffoPancakeUnitPrice || 1.0) },
        { key: 'WaffoPancakeMinTopUp', value: String(inputs.WaffoPancakeMinTopUp || 10) },
        { key: 'WaffoPancakeReturnUrl', value: inputs.WaffoPancakeReturnUrl || '' },
      ];

      const results = await Promise.all(
        options.map((opt) => API.put('/api/option/', { key: opt.key, value: opt.value })),
      );
      const errs = results.filter((r) => !r.data.success);
      if (errs.length > 0) {
        errs.forEach((r) => showError(r.data.message));
      } else {
        showSuccess(t('更新成功'));
        props.refresh?.();
      }
    } catch {
      showError(t('更新失败'));
    }
    setLoading(false);
  };

  return (
    <MacSpinner spinning={loading}>
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-light)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <circle cx='12' cy='12' r='9' />
              <path d='M8 12h8M12 8v8' />
            </svg>
          </span>
          <div>
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--font-serif)',
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              {t('Waffo Pancake 设置')}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              {t('Pancake 是 Waffo 的新版结账系统，与旧 Waffo SDK 独立。')}
              {' '}
              <a href='https://pancake.waffo.ai' target='_blank' rel='noreferrer' style={{ color: 'var(--accent)' }}>
                pancake.waffo.ai
              </a>
            </p>
          </div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <Banner
            type='info'
            description={
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>{t('Webhook 地址：')}<code>{location.origin}/api/waffo-pancake/webhook</code></div>
                <div>{t('在 Pancake 后台 Webhooks 设置中添加该地址，格式选择 Raw，仅勾选 order.completed 事件。测试/正式环境需分别配置并填入对应公钥。')}</div>
              </div>
            }
            style={{ marginBottom: 16 }}
          />

          <Form
            initValues={inputs}
            onValueChange={handleFormChange}
            getFormApi={(api) => (formApiRef.current = api)}
          >
            <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
              <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                <Form.Switch
                  field='WaffoPancakeEnabled'
                  label={t('启用 Waffo Pancake')}
                  size='default'
                  checkedText='｜'
                  uncheckedText='〇'
                />
              </Col>
              <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                <Form.Switch
                  field='WaffoPancakeSandbox'
                  label={t('沙盒模式')}
                  size='default'
                  checkedText='｜'
                  uncheckedText='〇'
                  extraText={t('启用后将使用沙盒密钥与商店/产品 ID')}
                />
              </Col>
            </Row>

            <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Input
                  field='WaffoPancakeMerchantId'
                  label={t('商户 ID')}
                  placeholder='MER_xxxxxxxxxx'
                  extraText={t('生产与测试共用同一商户 ID')}
                />
              </Col>
            </Row>

            <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Input
                  field='WaffoPancakeStoreId'
                  label={t('店铺 ID (生产)')}
                  placeholder='STO_xxxxxxxxxx'
                />
              </Col>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Input
                  field='WaffoPancakeSandboxStoreId'
                  label={t('店铺 ID (沙盒)')}
                  placeholder='STO_xxxxxxxxxx'
                />
              </Col>
            </Row>

            <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Input
                  field='WaffoPancakeProductId'
                  label={t('产品 ID (生产)')}
                  placeholder='PROD_xxxxxxxxxx'
                />
              </Col>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Input
                  field='WaffoPancakeSandboxProductId'
                  label={t('产品 ID (沙盒)')}
                  placeholder='PROD_xxxxxxxxxx'
                />
              </Col>
            </Row>

            <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.TextArea
                  field='WaffoPancakePrivateKey'
                  label={t('API 私钥 (生产)')}
                  placeholder='-----BEGIN PRIVATE KEY-----'
                  type='password'
                  autosize={{ minRows: 3, maxRows: 6 }}
                  extraText={t('留空则保留已有值不变')}
                />
              </Col>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.TextArea
                  field='WaffoPancakeSandboxPrivateKey'
                  label={t('API 私钥 (沙盒)')}
                  placeholder='-----BEGIN PRIVATE KEY-----'
                  type='password'
                  autosize={{ minRows: 3, maxRows: 6 }}
                  extraText={t('留空则保留已有值不变')}
                />
              </Col>
            </Row>

            <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.TextArea
                  field='WaffoPancakeWebhookPublicKey'
                  label={t('Webhook 公钥 (生产)')}
                  placeholder='-----BEGIN PUBLIC KEY-----'
                  autosize={{ minRows: 3, maxRows: 6 }}
                />
              </Col>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.TextArea
                  field='WaffoPancakeSandboxWebhookPublicKey'
                  label={t('Webhook 公钥 (沙盒)')}
                  placeholder='-----BEGIN PUBLIC KEY-----'
                  autosize={{ minRows: 3, maxRows: 6 }}
                />
              </Col>
            </Row>

            <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
              <Col xs={24} sm={24} md={6} lg={6} xl={6}>
                <Form.Input field='WaffoPancakeCurrency' label={t('货币')} disabled />
              </Col>
              <Col xs={24} sm={24} md={6} lg={6} xl={6}>
                <Form.InputNumber
                  field='WaffoPancakeUnitPrice'
                  label={t('单价 (USD)')}
                  placeholder='1.0'
                  min={0}
                  step={0.1}
                />
              </Col>
              <Col xs={24} sm={24} md={6} lg={6} xl={6}>
                <Form.InputNumber
                  field='WaffoPancakeMinTopUp'
                  label={t('最低充值数量')}
                  placeholder='10'
                  min={1}
                  step={1}
                />
              </Col>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Input
                  field='WaffoPancakeReturnUrl'
                  label={t('支付返回地址')}
                  placeholder={t('例如 https://example.com/console/topup')}
                  extraText={t('留空则用 服务器地址 + /console/topup?pay=success')}
                />
              </Col>
            </Row>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                theme='solid'
                style={{
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-gradient)',
                  border: 'none',
                }}
                onClick={submit}
              >
                {t('更新 Waffo Pancake 设置')}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </MacSpinner>
  );
}
