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

import React, { useEffect, useState } from 'react';
import { API, showError } from '../../helpers';
import { marked } from 'marked';
import { Empty } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

const linkStyle = {
  color: 'var(--accent)',
  textDecoration: 'none',
  transition: 'opacity 150ms ease-out',
};

const About = () => {
  const { t } = useTranslation();
  const [about, setAbout] = useState('');
  const [aboutLoaded, setAboutLoaded] = useState(false);
  const currentYear = new Date().getFullYear();

  const displayAbout = async () => {
    setAbout(localStorage.getItem('about') || '');
    const res = await API.get('/api/about');
    const { success, message, data } = res.data;
    if (success) {
      let aboutContent = data;
      if (!data.startsWith('https://')) {
        aboutContent = marked.parse(data);
      }
      setAbout(aboutContent);
      localStorage.setItem('about', aboutContent);
    } else {
      showError(message);
      setAbout(t('加载关于内容失败...'));
    }
    setAboutLoaded(true);
  };

  useEffect(() => {
    displayAbout().then();
  }, []);

  const customDescription = (
    <div className='text-center text-sm' style={{ color: 'var(--text-secondary)' }}>
      <p>{t('可在设置页面设置关于内容，支持 HTML & Markdown')}</p>
      <p className='mt-2'>
        {t('New API项目仓库地址：')}
        <a
          href='https://github.com/QuantumNous/new-api'
          target='_blank'
          rel='noopener noreferrer'
          style={linkStyle}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          https://github.com/QuantumNous/new-api
        </a>
      </p>
      <p className='mt-3' style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
        <a
          href='https://github.com/QuantumNous/new-api'
          target='_blank'
          rel='noopener noreferrer'
          style={linkStyle}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          NewAPI
        </a>{' '}
        {t('© {{currentYear}}', { currentYear })}{' '}
        <a
          href='https://github.com/QuantumNous'
          target='_blank'
          rel='noopener noreferrer'
          style={linkStyle}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          QuantumNous
        </a>{' '}
        {t('| 基于')}{' '}
        <a
          href='https://github.com/songquanpeng/one-api/releases/tag/v0.5.4'
          target='_blank'
          rel='noopener noreferrer'
          style={linkStyle}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          One API v0.5.4
        </a>{' '}
        © 2023{' '}
        <a
          href='https://github.com/songquanpeng'
          target='_blank'
          rel='noopener noreferrer'
          style={linkStyle}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          JustSong
        </a>
      </p>
      <p className='mt-2' style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
        {t('本项目根据')}
        <a
          href='https://github.com/songquanpeng/one-api/blob/v0.5.4/LICENSE'
          target='_blank'
          rel='noopener noreferrer'
          style={linkStyle}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {t('MIT许可证')}
        </a>
        {t('授权，需在遵守')}
        <a
          href='https://www.gnu.org/licenses/agpl-3.0.html'
          target='_blank'
          rel='noopener noreferrer'
          style={linkStyle}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {t('AGPL v3.0协议')}
        </a>
        {t('的前提下使用。')}
      </p>
    </div>
  );

  return (
    <div
      className='min-h-screen'
      style={{ background: 'var(--bg-base)' }}
    >
      {aboutLoaded && about === '' ? (
        <div className='flex justify-center items-center min-h-screen px-4'>
          <div
            className='text-center max-w-lg w-full px-8 py-12'
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Empty
              image={
                <img src="/NoDataillustration.svg" style={{ width: 120, height: 120 }} />
              }
              darkModeImage={
                <img src="/NoDataillustration.svg"
                  style={{ width: 120, height: 120 }}
                />
              }
              description={
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {t('管理员暂时未设置任何关��内容')}
                </span>
              }
            >
              <div className='mt-4'>
                {customDescription}
              </div>
            </Empty>
          </div>
        </div>
      ) : (
        <>
          {about.startsWith('https://') ? (
            <iframe
              src={about}
              style={{ width: '100%', height: '100vh', border: 'none' }}
            />
          ) : (
            <div className='max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8'>
              <div
                className='p-8'
                style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  className='prose prose-lg max-w-none'
                  style={{ color: 'var(--text-primary)', fontSize: '14px' }}
                  dangerouslySetInnerHTML={{ __html: about }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default About;
