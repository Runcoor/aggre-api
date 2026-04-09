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
import { Chat, Button } from '@douyinfe/semi-ui';
import { MessageSquare, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CustomInputRender from './CustomInputRender';

const ChatArea = ({
  chatRef,
  message,
  inputs,
  styleState,
  showDebugPanel,
  roleInfo,
  onMessageSend,
  onMessageCopy,
  onMessageReset,
  onMessageDelete,
  onStopGenerator,
  onClearMessages,
  onToggleDebugPanel,
  renderCustomChatContent,
  renderChatBoxAction,
}) => {
  const { t } = useTranslation();

  const renderInputArea = React.useCallback((props) => {
    return <CustomInputRender {...props} />;
  }, []);

  return (
    <div
      className='h-full cy-playground-chat'
      style={{
        padding: 0,
        height: 'calc(100vh - var(--header-height))',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-base)',
        position: 'relative',
      }}
    >
      {/* Slim header — model name + debug toggle */}
      <div
        className='flex items-center justify-between px-4 sm:px-6 py-3 flex-shrink-0'
        style={{
          background: 'transparent',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className='flex items-center gap-2 min-w-0'>
          <div
            className='w-7 h-7 flex items-center justify-center flex-shrink-0'
            style={{
              borderRadius: 'var(--radius-md)',
              background:
                'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
            }}
          >
            <MessageSquare size={14} color='#fff' />
          </div>
          <span
            className='text-sm font-semibold truncate'
            style={{ color: 'var(--text-primary)' }}
          >
            {t('AI 对话')}
          </span>
          <span
            className='text-xs truncate hidden sm:inline'
            style={{ color: 'var(--text-muted)' }}
          >
            · {inputs?.model || t('选择模型开始对话')}
          </span>
        </div>
        <Button
          icon={showDebugPanel ? <EyeOff size={14} /> : <Eye size={14} />}
          onClick={onToggleDebugPanel}
          theme='borderless'
          type='tertiary'
          size='small'
          style={{
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
          }}
        >
          {showDebugPanel ? t('隐藏调试') : t('显示调试')}
        </Button>
      </div>

      {/* Chat content */}
      <div className='flex-1 overflow-hidden'>
        <Chat
          ref={chatRef}
          chatBoxRenderConfig={{
            renderChatBoxContent: renderCustomChatContent,
            renderChatBoxAction: renderChatBoxAction,
            renderChatBoxTitle: () => null,
          }}
          renderInputArea={renderInputArea}
          roleConfig={roleInfo}
          style={{
            height: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
          }}
          chats={message}
          onMessageSend={onMessageSend}
          onMessageCopy={onMessageCopy}
          onMessageReset={onMessageReset}
          onMessageDelete={onMessageDelete}
          showClearContext
          showStopGenerate
          onStopGenerator={onStopGenerator}
          onClear={onClearMessages}
          className='h-full'
          placeholder={t('请输入您的问题...')}
        />
      </div>
    </div>
  );
};

export default ChatArea;
