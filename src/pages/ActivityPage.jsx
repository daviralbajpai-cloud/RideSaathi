import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useApp } from '../context/AppContext';
import { isRideExpired } from '../lib/timeUtils';

export const ActivityPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activity, user, fetchUserActivity, acceptRequest, declineRequest } = useApp();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'upcoming');
  const [, setTick] = useState(Date.now());

  const refreshActivity = useCallback(() => {
    if (user?.id && fetchUserActivity) {
      fetchUserActivity(user.id);
    }
    setTick(Date.now());
  }, [user?.id, fetchUserActivity]);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state?.tab]);

  // Initial fetch on mount / user change
  useEffect(() => {
    refreshActivity();
  }, [refreshActivity]);

  // Automatic refresh when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshActivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshActivity]);

  // Lightweight periodic refresh every 45 seconds while Activity page is open
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshActivity();
    }, 45000);
    return () => clearInterval(intervalId);
  }, [refreshActivity]);

  const tabs = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'requests', label: 'Ride Requests' },
    { key: 'offered', label: 'Rides I Offered' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  // Display items directly from categorized activity state
  const getDisplayItems = () => {
    return activity[activeTab] || [];
  };

  const upcomingCount = (activity?.upcoming || []).length;
  const requestsCount = (activity?.requests || []).length;
  const offeredCount = (activity?.offered || []).length;
  const completedCount = (activity?.completed || []).length;
  const cancelledCount = (activity?.cancelled || []).length;

  const tabCounts = {
    upcoming: upcomingCount,
    requests: requestsCount,
    offered: offeredCount,
    completed: completedCount,
    cancelled: cancelledCount
  };

  const currentItems = getDisplayItems();

  return (
    <div className="w-full flex-1 flex flex-col">
      <TopBar title="My Activity" showBack={false} />

      {/* Tabs Header Slider */}
      <div className="w-full bg-surface-container-lowest border-b border-outline-variant/30 px-container-margin py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tabCounts[tab.key] || 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-1.5 rounded-full text-body-sm whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-white text-primary'
                      : tab.key === 'requests'
                      ? 'bg-error text-white'
                      : 'bg-primary/20 text-primary'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-container-margin py-md flex flex-col gap-md pb-24">
        {currentItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-xl text-center gap-3 my-auto">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-outline text-3xl">
              <span className="material-symbols-outlined">history</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
              No {tabs.find(t => t.key === activeTab)?.label.toLowerCase()} yet
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs">
              When you book or offer rides, your activity will appear right here.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => navigate('/find-ride')}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-label-bold text-body-sm shadow-sm"
              >
                Find a Ride
              </button>
              <button
                onClick={() => navigate('/offer-ride')}
                className="px-4 py-2 rounded-xl bg-secondary text-on-secondary font-label-bold text-body-sm shadow-sm"
              >
                Offer a Ride
              </button>
            </div>
          </div>
        ) : (
          currentItems.map((item) => {
            const expired = isRideExpired(item.date, item.time);
            return (
              <div
                key={item.id}
                className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/30 shadow-sm flex flex-col gap-md"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2.5">
                    {item.personPhoto && (
                      <img
                        src={item.personPhoto}
                        alt={item.personOffering || item.personRequesting || "User"}
                        className="w-10 h-10 rounded-full object-cover border border-primary/20"
                      />
                    )}
                    <div>
                      <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                        {item.personOffering || item.personRequesting}
                      </h3>
                      <p className="font-body-sm text-[12px] text-on-surface-variant">
                        {item.date} at {item.time}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                      item.status === 'Accepted' || item.status === 'Confirmed' || item.status === 'Completed' || item.status === 'Active Offer'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : item.status === 'Declined' || item.status === 'Cancelled'
                        ? 'bg-error-container text-on-error-container'
                        : 'bg-primary-container/20 text-primary'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Route */}
                <div className="flex items-center justify-between py-1 font-headline-md text-headline-md text-on-surface font-bold">
                  <span className="truncate max-w-[45%]">{item.from}</span>
                  <span className="material-symbols-outlined text-outline shrink-0">arrow_forward</span>
                  <span className="truncate max-w-[45%] text-right">{item.to}</span>
                </div>

                {/* Seats Info */}
                <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                  <span>
                    {item.seatsRequested
                      ? `Seats requested: ${item.seatsRequested}`
                      : `Available seats: ${item.availableSeats}`}
                  </span>
                </div>

                {/* Contact section: Display for accepted/confirmed rides or completed rides with partner phone */}
                {(item.status === 'Accepted' || item.status === 'Confirmed' || (item.personPhone && String(item.personPhone).trim() !== '')) && (
                  <div className="bg-secondary/10 rounded-xl p-3 border border-secondary/20 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
                          Confirmed Ride Partner
                        </span>
                        <span className="font-headline-md text-body-sm font-bold text-on-surface">
                          {item.personOffering || item.personRequesting || 'Ride Partner'}
                        </span>
                      </div>

                      {item.personPhone && String(item.personPhone).trim() !== '' && (
                        <a
                          href={`tel:${String(item.personPhone).trim()}`}
                          className="px-3 py-1.5 rounded-xl bg-secondary text-on-secondary font-label-bold text-xs flex items-center gap-1 shadow-sm hover:bg-secondary/90 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">call</span>
                          <span>Call</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-body-sm pt-1 border-t border-secondary/20">
                      <span className="material-symbols-outlined text-sm text-secondary">call</span>
                      {item.personPhone && String(item.personPhone).trim() !== '' ? (
                        <span className="font-medium text-on-surface">
                          {String(item.personPhone).trim()}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant italic text-xs">
                          Phone number will appear shortly...
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions for Ride Requests tab */}
                {activeTab === 'requests' && item.status.includes('Pending') && !expired && (
                  <div className="flex gap-2 pt-2 border-t border-outline-variant/20">
                    <button
                      onClick={() => acceptRequest(item.id)}
                      className="flex-1 py-2 rounded-xl bg-secondary text-on-secondary font-label-bold text-body-sm flex items-center justify-center gap-1 shadow-sm hover:bg-secondary/90 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">check</span>
                      Accept
                    </button>
                    <button
                      onClick={() => declineRequest(item.id)}
                      className="flex-1 py-2 rounded-xl bg-surface-container-high text-on-surface-variant font-label-bold text-body-sm flex items-center justify-center gap-1 border border-outline-variant/40 hover:bg-surface-container-highest transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                      Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
