/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Banner } from '@douyinfe/semi-ui';
import { Users, CheckCircle, XCircle } from 'lucide-react';
import { API, showError, showSuccess } from '../../helpers';
import MacSpinner from '../../components/common/ui/MacSpinner';

const JoinTeam = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { code } = useParams();

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [result, setResult] = useState(null); // { success, message, teamId }

  useEffect(() => {
    if (!code) {
      setResult({ success: false, message: t('邀请码无效') });
      setLoading(false);
      return;
    }
    handleJoin();
  }, [code]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await API.post(`/api/team/join/${code}`);
      if (res.data?.success) {
        const team = res.data.data;
        setResult({ success: true, message: t('成功加入团队'), teamId: team?.id });
        showSuccess(t('成功加入团队'));
      } else {
        setResult({ success: false, message: res.data?.message || t('加入失败') });
      }
    } catch {
      setResult({ success: false, message: t('请求失败') });
    }
    setJoining(false);
    setLoading(false);
  };

  return (
    <div className='w-full max-w-md mx-auto px-4 py-16'>
      <MacSpinner spinning={loading || joining}>
        <div className='rounded-[var(--radius-lg)] p-8 text-center'
          style={{ background: 'var(--surface)', border: '1px solid var(--border-default)' }}>
          {result?.success ? (
            <>
              <CheckCircle size={48} style={{ color: 'var(--semi-color-success)', margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', marginBottom: 8 }}>
                {t('成功加入团队')}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
                {t('你已成功加入团队，可以开始使用团队资源')}
              </p>
              <div className='flex gap-3 justify-center'>
                {result.teamId && (
                  <Button theme='solid' type='primary'
                    onClick={() => navigate(`/console/team/${result.teamId}`)}
                    style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', border: 'none', fontWeight: 600 }}>
                    {t('查看团队')}
                  </Button>
                )}
                <Button theme='light' type='tertiary'
                  onClick={() => navigate('/console/team')}
                  style={{ borderRadius: 'var(--radius-md)' }}>
                  {t('团队列表')}
                </Button>
              </div>
            </>
          ) : result ? (
            <>
              <XCircle size={48} style={{ color: 'var(--semi-color-danger)', margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', marginBottom: 8 }}>
                {t('加入失败')}
              </h2>
              <Banner type='warning' closeIcon={null}
                description={result.message}
                style={{ borderRadius: 'var(--radius-md)', marginBottom: 24, textAlign: 'left' }} />
              <Button theme='light' type='primary'
                onClick={() => navigate('/')}
                style={{ borderRadius: 'var(--radius-md)' }}>
                {t('返回首页')}
              </Button>
            </>
          ) : (
            <>
              <Users size={48} style={{ color: 'var(--accent)', margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                {t('正在加入团队...')}
              </p>
            </>
          )}
        </div>
      </MacSpinner>
    </div>
  );
};

export default JoinTeam;
