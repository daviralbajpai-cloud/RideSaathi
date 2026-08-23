import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const TopBar = ({ title, showBack }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, notifications } = useApp();

  const unreadNotifs = notifications.filter(n => !n.is_read && !n.read).length;

  const topLevelRoutes = ['/', '/welcome', '/home', '/signin'];
  const isTopLevel = topLevelRoutes.includes(location.pathname);
  const shouldShowBack = showBack !== undefined ? showBack : !isTopLevel;

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 px-container-margin py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {shouldShowBack ? (
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md shadow-primary/20">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
          </div>
        )}
        
        <h1 className="font-headline-md text-headline-md text-on-surface font-bold truncate">
          {title || "RideSaathi"}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/notifications')}
          className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface-variant"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined">notifications</span>
          {unreadNotifs > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-error ring-2 ring-surface"></span>
          )}
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant/40 hover:opacity-90 transition-opacity flex items-center justify-center bg-surface-container cursor-pointer"
          aria-label="User Profile"
        >
          {user?.isAuthenticated && user?.photo ? (
            <img src={user.photo} alt={user.name || 'User'} className="w-full h-full object-cover" />
          ) : user?.isAuthenticated && user?.name ? (
            <div className="w-full h-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm">
              {user.name[0]}
            </div>
          ) : (
            <span className="material-symbols-outlined text-xl text-on-surface-variant">person</span>
          )}
        </button>
      </div>
    </header>
  );
};
