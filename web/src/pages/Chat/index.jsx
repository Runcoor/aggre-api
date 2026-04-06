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
import { useTokenKeys } from '../../hooks/chat/useTokenKeys';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const bars = Array.from({ length: 12 });

const ChatPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { keys, serverAddress, isLoading } = useTokenKeys(id);

  const comLink = (key) => {
    if (!serverAddress || !key) return '';
    let link = '';
    if (id) {
      let chats = localStorage.getItem('chats');
      if (chats) {
        chats = JSON.parse(chats);
        if (Array.isArray(chats) && chats.length > 0) {
          for (let k in chats[id]) {
            link = chats[id][k];
            link = link.replaceAll(
              '{address}',
              encodeURIComponent(serverAddress),
            );
            link = link.replaceAll('{key}', 'sk-' + key);
          }
        }
      }
    }
    return link;
  };

  const iframeSrc = keys.length > 0 ? comLink(keys[0]) : '';

  return !isLoading && iframeSrc ? (
    <iframe
      src={iframeSrc}
      style={{
        width: '100%',
        height: 'calc(100vh - 64px)',
        border: 'none',
        marginTop: '64px',
      }}
      title='Token Frame'
      allow='camera;microphone'
    />
  ) : (
    <div
      className='fixed inset-0 w-screen h-screen flex items-center justify-center z-[1000]'
      style={{ background: 'var(--bg-base)' }}
    >
      <div className='flex flex-col items-center gap-4'>
        {/* macOS activity indicator */}
        <div className='mv-loader mv-loader-large'>
          {bars.map((_, i) => (
            <span key={i} className='mv-loader-bar' />
          ))}
        </div>
        <span
          className='text-sm whitespace-nowrap'
          style={{ color: 'var(--text-secondary)' }}
        >
          {t('正在跳转...')}
        </span>
      </div>
    </div>
  );
};

export default ChatPage;
