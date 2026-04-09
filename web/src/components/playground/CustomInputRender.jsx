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

Playground bottom input panel — Aetheris-inspired glass vibrancy card.
Embeds model selection, streaming toggle, image picker, clear-context and
send controls directly in the input bar so the sidebar no longer owns them.
*/

import React, { useRef, useEffect, useCallback } from 'react';
import { Toast, Select, Switch, Tooltip } from '@douyinfe/semi-ui';
import { Image as ImageIcon, Zap, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePlayground } from '../../contexts/PlaygroundContext';
import { selectFilter } from '../../helpers';

const CustomInputRender = (props) => {
  const { t } = useTranslation();
  const {
    onPasteImage,
    imageEnabled,
    inputs,
    models,
    onInputChange,
    customRequestMode,
    onToggleSettings,
  } = usePlayground();

  const { detailProps } = props;
  const { clearContextNode, inputNode, sendNode, onClick } = detailProps;
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  const handlePickImage = useCallback(
    (e) => {
      const files = e.target?.files;
      if (!files || files.length === 0) return;
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (onPasteImage) {
            onPasteImage(ev.target.result);
          }
        };
        reader.onerror = () => {
          Toast.error({ content: t('粘贴图片失败'), duration: 2 });
        };
        reader.readAsDataURL(file);
      });
      if (files.length > 0) {
        Toast.success({ content: t('图片已添加'), duration: 2 });
      }
      // Reset so the same file can be re-picked
      e.target.value = '';
    },
    [onPasteImage, t],
  );

  const openImagePicker = useCallback(() => {
    if (customRequestMode) return;
    // Auto-enable image mode when user picks a file
    if (!imageEnabled) onInputChange('imageEnabled', true);
    fileInputRef.current?.click();
  }, [customRequestMode, imageEnabled, onInputChange]);

  const handlePaste = useCallback(
    async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            try {
              if (!imageEnabled) {
                Toast.warning({
                  content: t('请先在设置中启用图片功能'),
                  duration: 3,
                });
                return;
              }
              const reader = new FileReader();
              reader.onload = (event) => {
                const base64 = event.target.result;
                if (onPasteImage) {
                  onPasteImage(base64);
                  Toast.success({ content: t('图片已添加'), duration: 2 });
                } else {
                  Toast.error({ content: t('无法添加图片'), duration: 2 });
                }
              };
              reader.onerror = () => {
                Toast.error({ content: t('粘贴图片失败'), duration: 2 });
              };
              reader.readAsDataURL(file);
            } catch (error) {
              Toast.error({ content: t('粘贴图片失败'), duration: 2 });
            }
          }
          break;
        }
      }
    },
    [onPasteImage, imageEnabled, t],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('paste', handlePaste);
    return () => container.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  // Restyle clear-context button — small icon pill, left
  const styledClearNode = clearContextNode
    ? React.cloneElement(clearContextNode, {
        className: `flex-shrink-0 ${clearContextNode.props.className || ''}`,
        style: {
          ...clearContextNode.props.style,
          width: 36,
          height: 36,
          minWidth: 36,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-md)',
          background: 'transparent',
          color: 'var(--text-muted)',
          border: 'none',
          transition: 'color 150ms, background 150ms',
        },
      })
    : null;

  // Send button — gradient square
  const styledSendNode = React.cloneElement(sendNode, {
    className: `flex-shrink-0 ${sendNode.props.className || ''}`,
    style: {
      ...sendNode.props.style,
      width: 44,
      height: 44,
      minWidth: 44,
      padding: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-lg)',
      background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
      color: '#fff',
      border: 'none',
      boxShadow: '0 6px 20px rgba(0, 114, 255, 0.28)',
      transition: 'transform 150ms, box-shadow 150ms',
    },
  });

  const disabled = customRequestMode;

  const toggleStream = () => {
    if (disabled) return;
    onInputChange('stream', !inputs?.stream);
  };

  return (
    <div
      ref={containerRef}
      className='w-full flex justify-center px-3 sm:px-6 pb-4 sm:pb-6 pt-2'
      style={{
        background:
          'linear-gradient(to top, var(--bg-base) 0%, var(--bg-base) 55%, transparent 100%)',
      }}
    >
      <div
        onClick={onClick}
        title={t('支持 Ctrl+V 粘贴图片')}
        className='w-full max-w-4xl'
        style={{
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 28,
          boxShadow:
            '0 20px 60px rgba(0, 20, 60, 0.08), 0 2px 6px rgba(0, 20, 60, 0.04)',
          padding: '10px 12px 8px 12px',
        }}
      >
        {/* Top row: textarea + send */}
        <div className='flex items-end gap-2'>
          <div className='flex-1 min-w-0 px-2'>{inputNode}</div>
          {styledSendNode}
        </div>

        {/* Bottom control row */}
        <div
          className='flex items-center gap-1 sm:gap-2 mt-1 pt-2 px-1'
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          {/* Clear context */}
          {styledClearNode}

          {/* Image picker */}
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            multiple
            onChange={handlePickImage}
            style={{ display: 'none' }}
          />
          <Tooltip
            content={
              disabled ? t('已在自定义模式中忽略') : t('选择图片')
            }
            position='top'
          >
            <button
              type='button'
              onClick={openImagePicker}
              disabled={disabled}
              className='flex-shrink-0 flex items-center justify-center transition-all'
              style={{
                width: 36,
                height: 36,
                minWidth: 36,
                borderRadius: 'var(--radius-md)',
                background: imageEnabled
                  ? 'var(--accent-light)'
                  : 'transparent',
                color: imageEnabled ? 'var(--accent)' : 'var(--text-muted)',
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
              }}
            >
              <ImageIcon size={16} />
            </button>
          </Tooltip>

          {/* Stream toggle */}
          <Tooltip content={t('流式输出')} position='top'>
            <button
              type='button'
              onClick={toggleStream}
              disabled={disabled}
              className='flex-shrink-0 flex items-center justify-center transition-all'
              style={{
                width: 36,
                height: 36,
                minWidth: 36,
                borderRadius: 'var(--radius-md)',
                background: inputs?.stream
                  ? 'var(--accent-light)'
                  : 'transparent',
                color: inputs?.stream
                  ? 'var(--accent)'
                  : 'var(--text-muted)',
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
              }}
            >
              <Zap size={16} />
            </button>
          </Tooltip>

          {/* Settings shortcut (mobile) */}
          {onToggleSettings && (
            <Tooltip content={t('模型配置')} position='top'>
              <button
                type='button'
                onClick={onToggleSettings}
                className='flex-shrink-0 flex items-center justify-center transition-all md:hidden'
                style={{
                  width: 36,
                  height: 36,
                  minWidth: 36,
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Settings2 size={16} />
              </button>
            </Tooltip>
          )}

          {/* Spacer */}
          <div className='flex-1' />

          {/* Model selector (right-aligned, pill style) */}
          <div className='flex items-center' style={{ minWidth: 0 }}>
            <Select
              value={inputs?.model}
              onChange={(value) => onInputChange('model', value)}
              placeholder={t('请选择模型')}
              filter={selectFilter}
              autoClearSearchValue={false}
              optionList={models}
              disabled={disabled}
              size='small'
              position='top'
              className='cy-playground-model-select'
              style={{
                minWidth: 140,
                maxWidth: 240,
                borderRadius: 999,
              }}
              dropdownStyle={{ maxWidth: 360, maxHeight: 360 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomInputRender;
