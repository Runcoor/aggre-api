import { useContext, useEffect } from 'react';
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
    const link = document.createElement('link');
    link.id = CSS_ID;
    link.rel = 'stylesheet';
    link.href = CSS_HREF;
    document.head.appendChild(link);

    // Inject the position override AFTER the third-party stylesheet so it
    // wins on cascade order in addition to !important specificity.
    const positionStyle = document.createElement('style');
    positionStyle.id = POSITION_CSS_ID;
    positionStyle.textContent = POSITION_OVERRIDE_CSS;
    document.head.appendChild(positionStyle);

    const script = document.createElement('script');
    script.id = JS_ID;
    script.src = JS_SRC;
    script.defer = true;
    document.body.appendChild(script);
  }, [shouldShow]);

  return null;
};

export default BotWidget;
