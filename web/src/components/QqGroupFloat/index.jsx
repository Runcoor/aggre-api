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

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SiTencentqq } from 'react-icons/si';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { UserContext } from '../../context/User';
import { StatusContext } from '../../context/Status';
import { useIsMobile } from '../../hooks/common/useIsMobile';

const QR_IMG = '/aggre-qq-group-qrcode.png';

// Floating premium-only QQ group button rendered fixed at the bottom-right
// of the dashboard. Three states:
//   - expanded: round QQ button + hover shows QR card above
//   - minimized: collapsed to a thin tab on the right edge (click to expand)
//   - closed: hidden until the next page refresh / navigation. We deliberately
//     do NOT persist this to storage — users complained that there was no
//     obvious way to bring the entry back, and "refresh = restored" is a
//     predictable, discoverable affordance. The minimize-to-edge state stays
//     for users who want the button out of the way without losing access.
const QqGroupFloat = () => {
  const { t } = useTranslation();
  const [userState] = useContext(UserContext);
  const [statusState] = useContext(StatusContext);
  const isMobile = useIsMobile();

  const [closed, setClosed] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [hovered, setHovered] = useState(false);

  const eligible = useMemo(() => {
    const raw = statusState?.status?.premium_groups;
    if (!raw) return false;
    const allowed = String(raw)
      .split(',')
      .map((g) => g.trim().toLowerCase())
      .filter(Boolean);
    if (!allowed.length) return false;

    // Preferred: intersect against the active subscription list. A user
    // with multiple plans (e.g. Pro + Ultra running in parallel) is
    // eligible as long as at least one of them grants a premium group,
    // regardless of which one user.group currently mirrors.
    const subGroups = userState?.user?.active_subscription_groups;
    if (Array.isArray(subGroups)) {
      const userGroups = subGroups
        .map((g) => String(g || '').trim().toLowerCase())
        .filter(Boolean);
      return allowed.some((g) => userGroups.includes(g));
    }

    // Fallback for older backends that do not yet expose the array
    // (e.g. during the GH Actions deploy window): treat user.group as
    // a single-element list. Once the backend rolls out, this branch
    // is no longer hit.
    const single = String(userState?.user?.group || '').trim().toLowerCase();
    return single ? allowed.includes(single) : false;
  }, [statusState, userState]);

  // Reset hover when transitioning to minimized so the QR card doesn't
  // momentarily render on top of the slide-out animation.
  useEffect(() => {
    if (minimized) setHovered(false);
  }, [minimized]);

  if (isMobile || closed || !eligible) return null;

  const handleClose = (e) => {
    e?.stopPropagation();
    setClosed(true);
  };

  const handleMinimize = (e) => {
    e?.stopPropagation();
    setMinimized(true);
  };

  const handleRestore = () => setMinimized(false);

  return (
    <div
      className='qq-float-root'
      data-state={minimized ? 'minimized' : 'expanded'}
      onMouseEnter={() => !minimized && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* QR popup card — only when expanded and hovered */}
      <div
        className='qq-float-card'
        data-visible={hovered ? '1' : '0'}
        aria-hidden={!hovered}
      >
        <div className='qq-float-card-header'>
          <span className='qq-float-card-title'>
            {t('Pro 会员 · 专属 QQ 群')}
          </span>
          <div className='qq-float-card-actions'>
            <button
              type='button'
              className='qq-float-icon-btn'
              aria-label={t('收起到右侧')}
              title={t('收起到右侧')}
              onClick={handleMinimize}
            >
              <ChevronRight size={14} />
            </button>
            <button
              type='button'
              className='qq-float-icon-btn'
              aria-label={t('关闭')}
              title={t('关闭')}
              onClick={handleClose}
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <div className='qq-float-qr-wrap'>
          <img
            src={QR_IMG}
            alt={t('Pro 会员 · 专属 QQ 群')}
            className='qq-float-qr'
            draggable={false}
          />
        </div>
        <div className='qq-float-card-foot'>
          {t('扫码加入 · 仅限 Pro 及以上等级')}
        </div>
      </div>

      {/* Expanded round button */}
      <button
        type='button'
        className='qq-float-btn'
        aria-label={t('Pro 会员 · 专属 QQ 群')}
      >
        <SiTencentqq size={24} color='#FFFFFF' />
      </button>

      {/* Minimized edge tab (visible when minimized) */}
      <button
        type='button'
        className='qq-float-tab'
        aria-label={t('展开 QQ 群入口')}
        onClick={handleRestore}
      >
        <SiTencentqq size={18} color='#FFFFFF' />
        <span className='qq-float-tab-chevron'>
          <ChevronLeft size={14} />
        </span>
      </button>
    </div>
  );
};

export default QqGroupFloat;
