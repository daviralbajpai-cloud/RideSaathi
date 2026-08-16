import React, { useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import { useApp } from '../context/AppContext';
import { notificationService } from '../services/notificationService';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export const NotificationsPage = () => {
  const { notifications, setNotifications, user, markNotificationRead } = useApp();

  useEffect(() => {
    if (isSupabaseConfigured() && user?.id) {
      notificationService.getUserNotifications(user.id).then(({ data, error }) => {
        console.log("NOTIFICATION CURRENT USER:", user.id);
        console.log("NOTIFICATIONS DATA:", data);
        console.log("NOTIFICATIONS ERROR:", error);
        if (data) setNotifications(data);
      });
    }
  }, [user?.id]);

  const getNotifIcon = (type) => {
    switch (type) {
      case 'success':
        return { icon: 'check_circle', color: 'bg-secondary-container text-on-secondary-container' };
      case 'info':
        return { icon: 'alt_route', color: 'bg-tertiary-container text-on-tertiary-container' };
      case 'reminder':
        return { icon: 'alarm', color: 'bg-primary-container text-on-primary-container' };
      case 'request':
        return { icon: 'person_add', color: 'bg-primary-container text-on-primary-container' };
      case 'warning':
        return { icon: 'cancel', color: 'bg-error-container text-on-error-container' };
      default:
        return { icon: 'notifications', color: 'bg-surface-container-high text-on-surface' };
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      <TopBar title="Notifications" showBack={true} />

      <div className="px-container-margin py-md flex flex-col gap-md pb-24">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-xl text-center gap-3 my-auto">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-outline text-3xl">
              <span className="material-symbols-outlined">notifications_off</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
              No notifications yet
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              You'll get updates here when ride requests or reminders arrive.
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const style = getNotifIcon(n.type);
            const isRead = Boolean(n.is_read || n.read);
            return (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`p-md rounded-2xl border transition-all flex items-start gap-md cursor-pointer ${
                  isRead
                    ? 'bg-surface-container-lowest border-outline-variant/30 opacity-80'
                    : 'bg-surface-container-lowest border-primary/40 shadow-sm ring-1 ring-primary/20'
                }`}
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold ${style.color}`}>
                  <span className="material-symbols-outlined text-2xl">{style.icon}</span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline-md text-body-lg text-on-surface font-bold">
                      {n.title}
                    </h3>
                    <span className="font-body-sm text-[11px] text-outline">
                      {n.time}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    {n.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
