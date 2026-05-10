import { useContext, useEffect } from 'react';
import { StatusContext } from '../../context/Status';
import { UserContext } from '../../context/User';

const CSS_HREF = 'https://wiki.aggretoken.com/widget-bot.css';
const JS_SRC = 'https://wiki.aggretoken.com/widget-bot.js';
const CSS_ID = 'aggre-bot-widget-css';
const JS_ID = 'aggre-bot-widget-js';

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

    const script = document.createElement('script');
    script.id = JS_ID;
    script.src = JS_SRC;
    script.defer = true;
    document.body.appendChild(script);
  }, [shouldShow]);

  return null;
};

export default BotWidget;
