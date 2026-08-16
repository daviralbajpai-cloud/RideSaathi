import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useApp } from '../context/AppContext';

export const ActivityPage = () => {
  const navigate = useNavigate();
  const { activity, user, fetchUserActivity, acceptRequest, declineRequest } = useApp();
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    if (user?.id && fetchUserActivity) {
      fetchUserActivity(user.id);
    }
  }, [user?.id, fetchUserActivity]);

  const tabs = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'requests', label: 'Ride Requests' },
    { key: 'offered', label: 'Rides I Offered' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const currentItems = activity[activeTab] || [];

  return (
    <div className="w-full flex-1 flex flex-col">
      <TopBar title="My Activity" showBack={false} />

      {/* Tabs Header Slider */}
      <div className="w-full bg-surface-container-lowest border-b border-outline-variant/30 px-container-margin py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-body-sm font-label-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {tab.label}
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
              No {tabs.find(t => t.key === activeTab)?.label.toLowerCase()} found
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[260px]">
              Find or offer a ride to see your journey history here.
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
          currentItems.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/30 shadow-sm flex flex-col gap-sm"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-3">
                  {item.personPhoto && (
                    <img
                      src={item.personPhoto}
                      alt={item.personOffering || item.personRequesting || "User"}
                      className="w-10 h-10 rounded-full object-cover border border-outline-variant/30"
                    />
                  )}
                  <div>
                    <h3 className="font-headline-md text-body-lg text-on-surface font-bold">
                      {item.personOffering || item.personRequesting}
                    </h3>
                    <p className="font-body-sm text-[12px] text-on-surface-variant">
                      {item.date} at {item.time}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                    item.status === 'Accepted' || item.status === 'Confirmed' || item.status === 'Completed'
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
                <span>{item.from}</span>
                <span className="material-symbols-outlined text-outline">arrow_forward</span>
                <span>{item.to}</span>
              </div>

              {/* Seats Info */}
              <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                <span>
                  {item.seatsRequested
                    ? `Seats requested: ${item.seatsRequested}`
                    : `Available seats: ${item.availableSeats}`}
                </span>
              </div>

              {/* Actions for Ride Requests tab */}
              {activeTab === 'requests' && item.status.includes('Pending') && (
                <div className="flex gap-2 pt-2 border-t border-outline-variant/20">
                  <button
                    onClick={() => acceptRequest(item.id)}
                    className="flex-1 py-2 rounded-xl bg-secondary text-on-secondary font-label-bold text-body-sm flex items-center justify-center gap-1 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-base">check</span>
                    Accept
                  </button>
                  <button
                    onClick={() => declineRequest(item.id)}
                    className="flex-1 py-2 rounded-xl bg-surface-container-high text-on-surface-variant font-label-bold text-body-sm flex items-center justify-center gap-1 border border-outline-variant/40"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
