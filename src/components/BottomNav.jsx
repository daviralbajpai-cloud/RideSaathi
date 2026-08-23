import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { isRideExpired } from '../lib/timeUtils';

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activity, notifications } = useApp();

  // Hide bottom nav on welcome, sign-in, profile-setup, admin
  const hiddenRoutes = ['/welcome', '/signin', '/profile-setup', '/admin'];
  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }

  // Count active requests (pending requests received or accepted requests needing attention)
  const pendingRequestsCount = (activity?.requests || []).filter(
    r => r.status?.toLowerCase().includes('pending')
  ).length;

  const upcomingAcceptedCount = (activity?.upcoming || []).filter(
    r => r.status?.toLowerCase().includes('accept') || r.status?.toLowerCase().includes('confirm')
  ).length;

  // Total active request/acceptance count for Activity badge
  const activityBadgeCount = pendingRequestsCount > 0 ? pendingRequestsCount : (upcomingAcceptedCount > 0 ? upcomingAcceptedCount : 0);

  const tabs = [
    { path: '/home', label: 'Home', icon: 'home' },
    { path: '/find-ride', label: 'Find', icon: 'search' },
    { path: '/offer-ride', label: 'Offer', icon: 'add_circle' },
    { path: '/activity', label: 'Activity', icon: 'history', badge: activityBadgeCount },
    { path: '/profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-[600px] mx-auto z-50 bg-surface-container-lowest border-t border-outline-variant/30 px-3 py-2 flex justify-around items-center shadow-[0_-4px_12px_rgba(0,0,0,0.06)] rounded-t-2xl">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path || (tab.path === '/home' && location.pathname === '/');
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition-all group relative ${
              isActive
                ? 'text-primary bg-primary/10 font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <span
                className={`material-symbols-outlined mb-0.5 text-2xl transition-transform group-active:scale-95`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {tab.icon}
              </span>
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute -top-1 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-error text-white font-bold text-[10px] flex items-center justify-center shadow-sm ring-2 ring-surface animate-in zoom-in-50 duration-150">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              ) : null}
            </div>
            <span className="font-label-bold text-[11px] leading-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
