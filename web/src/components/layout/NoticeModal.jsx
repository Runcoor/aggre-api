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

import React, {
  useEffect,
  useState,
  useContext,
  useMemo,
  useRef,
  useLayoutEffect,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { marked } from 'marked';
import { API, showError, getRelativeTime } from '../../helpers';
import { StatusContext } from '../../context/Status';
import './NoticeModal.css';

const TAB_NOTICE = 'inApp';
const TAB_ANNOUNCE = 'system';

const MegaphoneIcon = ({ size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M3 11l18-5v12L3 14v-3z' />
    <path d='M11.6 16.8a3 3 0 1 1-5.8-1.6' />
  </svg>
);

const BellIcon = ({ size = 13 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2.2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' />
    <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0' />
  </svg>
);

const CloseIcon = () => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2.2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M18 6 6 18' />
    <path d='m6 6 12 12' />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2.4'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M5 12h14' />
    <path d='m13 5 7 7-7 7' />
  </svg>
);

const NoticeModal = ({
  visible,
  onClose,
  isMobile,
  defaultTab = TAB_NOTICE,
  unreadKeys = [],
}) => {
  const { t } = useTranslation();
  const [statusState] = useContext(StatusContext);

  const [noticeContent, setNoticeContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [silenceToday, setSilenceToday] = useState(false);

  const announcements = statusState?.status?.announcements || [];

  const unreadSet = useMemo(() => new Set(unreadKeys), [unreadKeys]);
  const getKeyForItem = (item) =>
    `${item?.publishDate || ''}-${(item?.content || '').slice(0, 30)}`;

  const processedAnnouncements = useMemo(() => {
    return (announcements || []).slice(0, 20).map((item) => {
      const pubDate = item?.publishDate ? new Date(item.publishDate) : null;
      const valid = pubDate && !isNaN(pubDate.getTime());
      const absoluteTime = valid
        ? `${pubDate.getFullYear()}-${String(pubDate.getMonth() + 1).padStart(2, '0')}-${String(pubDate.getDate()).padStart(2, '0')} ${String(pubDate.getHours()).padStart(2, '0')}:${String(pubDate.getMinutes()).padStart(2, '0')}`
        : item?.publishDate || '';
      return {
        key: getKeyForItem(item),
        type: item.type || 'default',
        time: absoluteTime,
        relative: getRelativeTime(item.publishDate),
        content: item.content,
        extra: item.extra,
        isUnread: unreadSet.has(getKeyForItem(item)),
      };
    });
  }, [announcements, unreadSet]);

  const noticeCount = noticeContent ? 1 : 0;
  const announceCount = processedAnnouncements.length;
  const hasAnyUnread =
    noticeCount > 0 || processedAnnouncements.some((a) => a.isUnread);

  const fetchNotice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/notice');
      const { success, message, data } = res.data;
      if (success) {
        setNoticeContent(data && data.trim() !== '' ? marked.parse(data) : '');
      } else {
        showError(message);
      }
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchNotice();
      setSilenceToday(false);
    }
  }, [visible, fetchNotice]);

  useEffect(() => {
    if (visible) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, visible]);

  // Body scroll lock
  useEffect(() => {
    if (!visible) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  // Keyboard: ESC closes
  useEffect(() => {
    if (!visible) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, silenceToday]);

  // Sliding-pill geometry: track tabs ref + measure on tab/active change
  const tabsRef = useRef(null);
  const noticeTabRef = useRef(null);
  const announceTabRef = useRef(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!visible) return;
    const ref =
      activeTab === TAB_NOTICE ? noticeTabRef.current : announceTabRef.current;
    if (!ref) return;
    setPillStyle({ left: ref.offsetLeft, width: ref.offsetWidth });
  }, [activeTab, visible, isMobile]);

  // Re-measure on resize so the pill keeps its alignment.
  useEffect(() => {
    if (!visible) return undefined;
    const onResize = () => {
      const ref =
        activeTab === TAB_NOTICE
          ? noticeTabRef.current
          : announceTabRef.current;
      if (!ref) return;
      setPillStyle({ left: ref.offsetLeft, width: ref.offsetWidth });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [visible, activeTab]);

  const handleClose = () => {
    if (silenceToday) {
      try {
        localStorage.setItem('notice_close_date', new Date().toDateString());
      } catch (_) {
        /* localStorage may be disabled — best-effort */
      }
    }
    onClose && onClose();
  };

  const handleScrimClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  if (!visible) return null;
  if (typeof document === 'undefined') return null;

  const renderEmpty = (text) => (
    <div className='aggre-notice-modal__empty'>
      <div className='aggre-notice-modal__empty-icon'>
        <MegaphoneIcon size={26} />
      </div>
      <div className='aggre-notice-modal__empty-text'>{text}</div>
    </div>
  );

  const renderNoticePanel = () => {
    if (loading) {
      return (
        <div className='aggre-notice-modal__panel-content'>
          {renderEmpty(t('加载中...'))}
        </div>
      );
    }
    if (!noticeContent) {
      return (
        <div className='aggre-notice-modal__panel-content'>
          {renderEmpty(t('暂无公告'))}
        </div>
      );
    }
    return (
      <div className='aggre-notice-modal__panel-content'>
        <div className='aggre-notice-modal__news-card'>
          <div
            className='aggre-notice-modal__content'
            dangerouslySetInnerHTML={{ __html: noticeContent }}
          />
        </div>
      </div>
    );
  };

  const renderAnnouncePanel = () => {
    if (processedAnnouncements.length === 0) {
      return (
        <div className='aggre-notice-modal__panel-content'>
          {renderEmpty(t('暂无系统公告'))}
        </div>
      );
    }
    return (
      <div className='aggre-notice-modal__panel-content'>
        {processedAnnouncements.map((item, idx) => {
          const html = marked.parse(item.content || '');
          const extraHtml = item.extra ? marked.parse(item.extra) : '';
          return (
            <div
              key={item.key || idx}
              className={
                'aggre-notice-modal__news-card' +
                (item.isUnread ? ' is-unread' : '')
              }
              style={{ animationDelay: `${0.05 * idx + 0.05}s` }}
            >
              {(item.relative || item.time || item.isUnread) && (
                <div className='aggre-notice-modal__news-meta'>
                  <span className='aggre-notice-modal__news-time'>
                    {item.relative ? `${item.relative} · ` : ''}
                    {item.time}
                  </span>
                  {item.isUnread && (
                    <span className='aggre-notice-modal__news-flag'>
                      {t('未读')}
                    </span>
                  )}
                </div>
              )}
              <div
                className='aggre-notice-modal__content'
                dangerouslySetInnerHTML={{ __html: html }}
              />
              {extraHtml && (
                <div
                  className='aggre-notice-modal__content'
                  style={{ marginTop: 8, fontSize: 12, opacity: 0.78 }}
                  dangerouslySetInnerHTML={{ __html: extraHtml }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Portal the modal out to document.body so it escapes any ancestor that
  // creates a containing block for fixed-positioned descendants. The
  // app-header-glass element above us applies `backdrop-filter: blur(80px)`,
  // which (per CSS spec, alongside `transform`/`filter`/`perspective`)
  // re-roots `position: fixed` to that ancestor — without this portal, the
  // modal would be clipped to the ~64px-tall header strip.
  return createPortal(
    <div
      className='aggre-notice-modal'
      role='dialog'
      aria-modal='true'
      aria-labelledby='aggre-notice-modal-title'
      onClick={handleScrimClick}
    >
      <div
        className='aggre-notice-modal__panel'
        onClick={(e) => e.stopPropagation()}
      >
        <header className='aggre-notice-modal__hero'>
          <div className='aggre-notice-modal__grid' />
          <span className='aggre-notice-modal__blob' />

          <div className='aggre-notice-modal__hero-row'>
            <div className='aggre-notice-modal__hero-title'>
              <div className='aggre-notice-modal__megaphone'>
                {hasAnyUnread && <span className='aggre-notice-modal__ping' />}
                <MegaphoneIcon size={22} />
              </div>
              <div>
                <h1
                  id='aggre-notice-modal-title'
                  className='aggre-notice-modal__h1'
                >
                  {t('系统公告')}
                </h1>
                <div className='aggre-notice-modal__sub'>
                  <span className='aggre-notice-modal__pill'>
                    <i />
                    {t('最新')}
                  </span>
                </div>
              </div>
            </div>
            <button
              type='button'
              className='aggre-notice-modal__x'
              aria-label={t('关闭')}
              onClick={handleClose}
            >
              <CloseIcon />
            </button>
          </div>

          <div className='aggre-notice-modal__tabs' ref={tabsRef} role='tablist'>
            <span
              className='aggre-notice-modal__tab-pill'
              style={{ left: pillStyle.left, width: pillStyle.width }}
            />
            <button
              type='button'
              ref={noticeTabRef}
              role='tab'
              aria-selected={activeTab === TAB_NOTICE}
              className={
                'aggre-notice-modal__tab' +
                (activeTab === TAB_NOTICE ? ' is-active' : '')
              }
              onClick={() => setActiveTab(TAB_NOTICE)}
            >
              <BellIcon size={13} />
              {t('通知')}
              <span className='aggre-notice-modal__count'>{noticeCount}</span>
            </button>
            <button
              type='button'
              ref={announceTabRef}
              role='tab'
              aria-selected={activeTab === TAB_ANNOUNCE}
              className={
                'aggre-notice-modal__tab' +
                (activeTab === TAB_ANNOUNCE ? ' is-active' : '')
              }
              onClick={() => setActiveTab(TAB_ANNOUNCE)}
            >
              <MegaphoneIcon size={13} />
              {t('公告')}
              <span className='aggre-notice-modal__count'>{announceCount}</span>
            </button>
          </div>
        </header>

        <div className='aggre-notice-modal__body'>
          {activeTab === TAB_NOTICE
            ? renderNoticePanel()
            : renderAnnouncePanel()}
        </div>

        <footer className='aggre-notice-modal__foot'>
          <label className='aggre-notice-modal__check'>
            <input
              type='checkbox'
              checked={silenceToday}
              onChange={(e) => setSilenceToday(e.target.checked)}
            />
            <span className='aggre-notice-modal__check-box' />
            <span>{t('今日不再提醒')}</span>
          </label>
          <div className='aggre-notice-modal__actions'>
            <button
              type='button'
              className='aggre-notice-modal__btn aggre-notice-modal__btn--ghost'
              onClick={handleClose}
            >
              {t('稍后查看')}
            </button>
            <button
              type='button'
              className='aggre-notice-modal__btn aggre-notice-modal__btn--primary'
              onClick={handleClose}
            >
              {t('我知道了')}
              <ArrowRightIcon />
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
};

export default NoticeModal;
