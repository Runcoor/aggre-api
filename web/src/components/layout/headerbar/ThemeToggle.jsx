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

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button, Dropdown } from '@douyinfe/semi-ui';
import { SunMedium, MoonStar, MonitorSmartphone } from 'lucide-react';
import { useActualTheme } from '../../../context/Theme';

const headerIconBtnClass = '!w-8 !h-8 !p-0 flex items-center justify-center';
const headerIconBtnStyle = {
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-secondary)',
  background: 'transparent',
  transition: 'background-color 150ms ease-out, color 150ms ease-out',
};

const LONG_PRESS_MS = 500;

/**
 * ThemeToggle — single-button theme switcher.
 *
 *   short click           → flip light ↔ dark with a circular reveal
 *                           (View Transitions API; falls back to instant
 *                           swap on browsers without support)
 *   long press / right-click → opens dropdown with light / dark / auto
 *                              for users who want to follow the system
 */
const ThemeToggle = ({ theme, onThemeToggle, t }) => {
  const actualTheme = useActualTheme();
  const longPressTimerRef = useRef(null);
  const longPressFiredRef = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const themeOptions = useMemo(
    () => [
      {
        key: 'light',
        icon: <SunMedium size={16} />,
        buttonIcon: <SunMedium size={16} />,
        label: t('浅色模式'),
        description: t('始终使用浅色主题'),
      },
      {
        key: 'dark',
        icon: <MoonStar size={16} />,
        buttonIcon: <MoonStar size={16} />,
        label: t('深色模式'),
        description: t('始终使用深色主题'),
      },
      {
        key: 'auto',
        icon: <MonitorSmartphone size={16} />,
        buttonIcon: <MonitorSmartphone size={16} />,
        label: t('自动模式'),
        description: t('跟随系统主题设置'),
      },
    ],
    [t],
  );

  const getItemStyle = (isSelected) => ({
    backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
    fontWeight: isSelected ? 600 : 400,
    borderRadius: 'var(--radius-sm)',
  });

  const currentButtonIcon = useMemo(() => {
    const currentOption = themeOptions.find((option) => option.key === theme);
    return currentOption?.buttonIcon || themeOptions[2].buttonIcon;
  }, [theme, themeOptions]);

  // Run a state update inside View Transition with a circular reveal
  // anchored at (cx, cy). Falls back to a plain update where the API is
  // unavailable. flushSync forces React to commit synchronously so the
  // DOM update lands inside the transition snapshot window.
  const runThemeTransition = useCallback((nextTheme, cx, cy) => {
    const html = document.documentElement;
    if (!document.startViewTransition) {
      onThemeToggle(nextTheme);
      return;
    }

    html.style.setProperty('--theme-toggle-x', `${cx}px`);
    html.style.setProperty('--theme-toggle-y', `${cy}px`);
    html.classList.add('theme-transition-active');

    const transition = document.startViewTransition(() => {
      flushSync(() => onThemeToggle(nextTheme));
    });

    transition.finished.finally(() => {
      html.classList.remove('theme-transition-active');
    });
  }, [onThemeToggle]);

  const handleButtonClick = useCallback((e) => {
    // A long press also fires click on pointerup — swallow that one.
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }

    const target = actualTheme === 'dark' ? 'light' : 'dark';

    // Prefer the actual click coords; fall back to button center for
    // keyboard activation (Enter/Space) where clientX/Y are 0.
    let cx = e.clientX;
    let cy = e.clientY;
    if (!cx || !cy) {
      const rect = e.currentTarget.getBoundingClientRect();
      cx = rect.left + rect.width / 2;
      cy = rect.top + rect.height / 2;
    }

    runThemeTransition(target, cx, cy);
  }, [actualTheme, runThemeTransition]);

  const handlePointerDown = useCallback(() => {
    longPressFiredRef.current = false;
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      setMenuOpen(true);
    }, LONG_PRESS_MS);
  }, []);

  const cancelLongPress = useCallback(() => {
    clearTimeout(longPressTimerRef.current);
  }, []);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setMenuOpen(true);
  }, []);

  const handleMenuSelect = useCallback((key) => {
    setMenuOpen(false);
    // Explicit menu picks (especially `auto`) shouldn't trigger the
    // reveal animation — auto can later flip silently when the system
    // theme changes, so consistency means "menu pick = silent swap".
    onThemeToggle(key);
  }, [onThemeToggle]);

  return (
    <Dropdown
      trigger='custom'
      visible={menuOpen}
      onVisibleChange={setMenuOpen}
      position='bottomRight'
      render={
        <Dropdown.Menu style={{ padding: 4 }}>
          {themeOptions.map((option) => (
            <Dropdown.Item
              key={option.key}
              icon={option.icon}
              onClick={() => handleMenuSelect(option.key)}
              style={getItemStyle(theme === option.key)}
            >
              <div className='flex flex-col'>
                <span className='text-sm' style={{ color: 'var(--text-primary)' }}>
                  {option.label}
                </span>
                <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                  {option.description}
                </span>
              </div>
            </Dropdown.Item>
          ))}

          {theme === 'auto' && (
            <>
              <Dropdown.Divider />
              <div
                className='px-3 py-2 text-xs'
                style={{ color: 'var(--text-muted)' }}
              >
                {t('当前跟随系统')}：
                {actualTheme === 'dark' ? t('深色') : t('浅色')}
              </div>
            </>
          )}
        </Dropdown.Menu>
      }
    >
      <Button
        icon={currentButtonIcon}
        aria-label={t('切换主题')}
        theme='borderless'
        type='tertiary'
        onClick={handleButtonClick}
        onPointerDown={handlePointerDown}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onPointerCancel={cancelLongPress}
        onContextMenu={handleContextMenu}
        className={headerIconBtnClass}
        style={headerIconBtnStyle}
      />
    </Dropdown>
  );
};

export default ThemeToggle;
