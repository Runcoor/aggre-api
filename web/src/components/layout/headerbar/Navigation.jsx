/*
Copyright (C) 2025 QuantumNous

Top navigation — renders GooeyNav (React Bits adaptation) on desktop.
Mobile uses MobileNavDrawer (rendered elsewhere in headerbar/index.jsx).
*/

import React from 'react';
import SkeletonWrapper from '../components/SkeletonWrapper';
import GooeyNav from './GooeyNav';

// Resolve final navigation target — `console` and `pricing` may need to send
// unauthenticated visitors to /login instead of the protected page.
const resolveTarget = (link, userState, pricingRequireAuth) => {
  if (link.itemKey === 'console' && !userState?.user) return '/login';
  if (link.itemKey === 'pricing' && pricingRequireAuth && !userState?.user) {
    return '/login';
  }
  return link.to;
};

const Navigation = ({
  mainNavLinks,
  isMobile,
  isLoading,
  userState,
  pricingRequireAuth,
}) => {
  // On mobile, the inline nav links overflow and overlap the action buttons
  // (notifications / theme / language / user). They are surfaced via a
  // dedicated mobile nav drawer instead — see headerbar/index.jsx.
  if (isMobile) return null;

  return (
    <nav
      className='flex flex-1 items-center mx-3 md:mx-6 whitespace-nowrap'
      style={{ overflow: 'visible', position: 'relative' }}
    >
      <SkeletonWrapper
        loading={isLoading}
        type='navigation'
        count={4}
        width={60}
        height={16}
        isMobile={isMobile}
      >
        <GooeyNav
          items={mainNavLinks}
          onItemNavigate={(link) =>
            resolveTarget(link, userState, pricingRequireAuth)
          }
        />
      </SkeletonWrapper>
    </nav>
  );
};

export default Navigation;
