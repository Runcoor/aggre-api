import { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { StatusContext } from '../../context/Status';
import { UserContext } from '../../context/User';

const CSS_HREF = 'https://wiki.aggretoken.com/widget-bot.css';
const JS_SRC = 'https://wiki.aggretoken.com/widget-bot.js';
const CSS_ID = 'aggre-bot-widget-css';
const JS_ID = 'aggre-bot-widget-js';
const POSITION_CSS_ID = 'aggre-bot-widget-position';

// Pin the FAB to the bottom-right regardless of whatever btn_position
// the PandaWiki backend hands down. The widget JS writes top/right/etc.
// as inline styles, so we need !important to outrank that. 24px is a
// standard corner offset that matches the third-party widget's own
// defaults closely enough that users won't notice the swap.
const POSITION_OVERRIDE_CSS = `
.widget-bot-button {
  top: auto !important;
  left: auto !important;
  right: 24px !important;
  bottom: 24px !important;
}
`;

// BotWidget injects the PandaWiki AI customer-service script tags
// (wiki.aggretoken.com) into the document head/body when the admin's
// `BotWidgetVisibility` option allows it.
//
// Visibility modes (read from /api/status `bot_widget_visibility`):
//   - "all"   : everyone, default
//   - "admin" : admins / root only (user.role >= 10)
//   - "none"  : hidden
//
// The third-party script attaches its own DOM nodes once loaded. We do
// NOT attempt to remove them on visibility change — toggling off requires
// a page refresh to fully clear the floating button. This matches how
// most analytics/widget scripts behave.
const BotWidget = () => {
  const [statusState] = useContext(StatusContext);
  const [userState] = useContext(UserContext);

  // CRITICAL: only proceed once /api/status has actually populated the
  // visibility field. Defaulting to "all" while the request is in flight
  // would race the third-party script onto the page for non-eligible
  // users — and because the script attaches its own DOM nodes that we
  // can't reliably tear down, that mistake would persist for the entire
  // session even after the real value comes back.
  const rawVisibility = statusState?.status?.bot_widget_visibility;

  let shouldShow = false;
  if (typeof rawVisibility === 'string' && rawVisibility) {
    const visibility = rawVisibility.toLowerCase();
    const role = Number(userState?.user?.role || 0);
    if (visibility === 'all') shouldShow = true;
    else if (visibility === 'admin') shouldShow = role >= 10;
    // 'none' or unknown → false
  }

  useEffect(() => {
    if (!shouldShow) return;
    if (document.getElementById(CSS_ID) || document.getElementById(JS_ID)) {
      return;
    }

    // We must load CSS BEFORE the JS runs. The widget script appends its
    // modal + FAB DOM into <body> as soon as it executes, and the CSS is
    // what hides the modal (display:none) and pins the FAB (position:
    // fixed; opacity: 0). If JS wins the race, those nodes briefly
    // render as un-styled block elements at the bottom of the page —
    // exactly the FOUC users have been reporting.
    const link = document.createElement('link');
    link.id = CSS_ID;
    link.rel = 'stylesheet';
    link.href = CSS_HREF;

    const positionStyle = document.createElement('style');
    positionStyle.id = POSITION_CSS_ID;
    positionStyle.textContent = POSITION_OVERRIDE_CSS;

    const injectScript = () => {
      if (document.getElementById(JS_ID)) return;
      // Position override must outrank the third-party CSS, so append it
      // AFTER the link has resolved.
      if (!document.getElementById(POSITION_CSS_ID)) {
        document.head.appendChild(positionStyle);
      }
      const script = document.createElement('script');
      script.id = JS_ID;
      script.src = JS_SRC;
      script.defer = true;
      document.body.appendChild(script);
    };

    link.onload = injectScript;
    // Even if the stylesheet 404s or the user is blocking the CDN, still
    // try to load the JS — better a positionally-broken FAB than no FAB.
    link.onerror = injectScript;
    document.head.appendChild(link);

    // Safety net: some browsers / proxies / ad-blockers can swallow the
    // onload event. After 5 s, force the script in regardless.
    const fallback = setTimeout(injectScript, 5000);
    return () => clearTimeout(fallback);
  }, [shouldShow]);

  // Mobile fallback close button.
  //
  // The chat UI's close button lives inside an iframe served from
  // wiki.aggretoken.com — we cannot touch it. The widget's own escape
  // hatches are (1) the Esc key and (2) a postMessage from the iframe;
  // mobile has no Esc key, and the in-iframe React close has been
  // unreliable on touch devices. The widget script does expose
  // `window.hideWidgetModal`, and toggles `body.widget-bot-modal-open`,
  // so we mount a host-side ✕ button that piggybacks on both.
  const [modalOpen, setModalOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    if (!shouldShow) return undefined;
    const OPEN_CLASS = 'widget-bot-modal-open';
    const sync = () =>
      setModalOpen(document.body.classList.contains(OPEN_CLASS));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, [shouldShow]);

  // Match widget-bot.js's `isMobileViewport()` (<= 640) — only at that
  // width does the chat panel go full-screen, putting top-right of the
  // viewport over the modal's corner. Wider viewports use the bottom-
  // right-anchored desktop panel where a top-right button would dangle.
  useEffect(() => {
    if (!shouldShow) return undefined;
    const mql = window.matchMedia('(max-width: 640px)');
    const sync = () => setIsNarrow(mql.matches);
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, [shouldShow]);

  if (!shouldShow || !modalOpen || !isNarrow) return null;

  const handleClose = () => {
    if (typeof window.hideWidgetModal === 'function') {
      window.hideWidgetModal();
    } else {
      document.body.classList.remove('widget-bot-modal-open');
    }
  };

  return createPortal(
    <button
      type='button'
      aria-label='关闭客服'
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 20px)',
        right: 20,
        zIndex: 10002,
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: '1px solid rgba(11, 21, 48, 0.12)',
        background: 'rgba(255, 255, 255, 0.95)',
        color: '#0b1530',
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center',
        boxShadow:
          '0 4px 16px -4px rgba(11, 21, 48, 0.18), 0 1px 0 rgba(255, 255, 255, 0.6) inset',
        WebkitTapHighlightColor: 'transparent',
        padding: 0,
      }}
    >
      <svg
        width='16'
        height='16'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2.4'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <path d='M18 6 6 18' />
        <path d='m6 6 12 12' />
      </svg>
    </button>,
    document.body,
  );
};

export default BotWidget;
