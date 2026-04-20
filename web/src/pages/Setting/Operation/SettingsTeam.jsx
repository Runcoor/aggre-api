/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/

import React, { useEffect, useState, useRef } from 'react';
import { Button, Col, Form, Row, Select, Skeleton, Banner } from '@douyinfe/semi-ui';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';
import MacSpinner from '../../../components/common/ui/MacSpinner';

export default function SettingsTeam(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [inputs, setInputs] = useState({
    TeamRequiredPlanId: '0',
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  useEffect(() => {
    // Load subscription plans for the selector
    (async () => {
      setPlansLoading(true);
      try {
        const res = await API.get('/api/subscription/admin/plans');
        if (res.data?.success) {
          setPlans((res.data.data || []).map((p) => p.plan).filter(Boolean));
        }
      } catch {}
      setPlansLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (props.options) {
      const newInputs = { ...inputs };
      if (props.options.TeamRequiredPlanId !== undefined) {
        newInputs.TeamRequiredPlanId = String(props.options.TeamRequiredPlanId || '0');
      }
      setInputs(newInputs);
      setInputsRow(newInputs);
    }
  }, [props.options]);

  function onSubmit() {
    const updateArray = compareObjects(inputs, inputsRow);
    if (!updateArray.length) return showWarning(t('你似乎并没有修改什么'));
    const requestQueue = updateArray.map((item) =>
      API.put('/api/option/', { key: item.key, value: String(inputs[item.key]) }),
    );
    setLoading(true);
    Promise.all(requestQueue)
      .then((res) => {
        if (res.includes(undefined)) return showError(t('部分保存失败，请重试'));
        showSuccess(t('保存成功'));
        props.refresh();
      })
      .catch(() => showError(t('保存失败，请重试')))
      .finally(() => setLoading(false));
  }

  const planOptions = [
    { value: '0', label: t('关闭团队功能') },
    { value: '-1', label: t('所有用户开放') },
    ...plans.map((p) => ({
      value: String(p.id),
      label: `${p.title}${p.subtitle ? ` — ${p.subtitle}` : ''}`,
    })),
  ];

  return (
    <MacSpinner spinning={loading}>
      <Form
        ref={refForm}
        labelPosition='left'
        labelWidth='250px'
        style={{ padding: '20px' }}
      >
        <Form.Section text={t('团队设置')}>
          <Banner
            type='info'
            closeIcon={null}
            description={t('控制哪些用户可以创建和管理团队。选择一个订阅套餐，只有订阅了该套餐的用户才能创建团队；其他用户只能被邀请为成员。')}
            style={{ marginBottom: 16, borderRadius: 'var(--radius-md)' }}
          />
          <Row>
            <Col span={24}>
              <Form.Slot label={t('团队功能权限')}>
                {plansLoading ? (
                  <Skeleton.Button active style={{ width: 300, height: 32 }} />
                ) : (
                  <Select
                    value={inputs.TeamRequiredPlanId}
                    onChange={(value) => setInputs({ ...inputs, TeamRequiredPlanId: value })}
                    style={{ width: '100%', maxWidth: 400 }}
                    optionList={planOptions}
                  />
                )}
              </Form.Slot>
            </Col>
          </Row>
        </Form.Section>
        <Row>
          <Button onClick={onSubmit} loading={loading} type='primary' theme='solid'
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            {t('保存团队设置')}
          </Button>
        </Row>
      </Form>
    </MacSpinner>
  );
}
