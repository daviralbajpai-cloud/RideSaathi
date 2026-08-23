import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { RideCard } from '../components/RideCard';
import { useApp } from '../context/AppContext';
import { isRideExpired } from '../lib/timeUtils';

export const HomePage = () => {
  const navigate = useNavigate();
  const { user, rides, activity } = useApp();

  const featuredRides = rides.slice(0, 2);
  const upcomingJourneys = activity.upcoming || [];

  return (
    <div className="w-full flex-1 flex flex-col">
      <TopBar title="RideSaathi" showBack={false} />

      <div className="px-container-margin py-md flex flex-col gap-lg">
        {/* Welcome Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">
              {user?.isAuthenticated
                ? `Hello, ${user?.name?.split(' ')[0] || 'Friend'}!`
                : 'Welcome to RideSaathi!'}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {user?.isAuthenticated
                ? 'Where are you heading today?'
                : 'Find or offer carpools with verified commuters.'}
            </p>
          </div>

          {!user?.isAuthenticated && (
            <button
              onClick={() => navigate('/signin')}
              className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-label-bold text-xs shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">login</span>
              <span>Sign In</span>
            </button>
          )}
        </div>

        {/* Primary Action Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Find a Ride Button */}
          <button
            onClick={() => navigate('/find-ride')}
            className="flex flex-col justify-between items-start p-lg min-h-[140px] bg-primary rounded-[20px] text-on-primary shadow-md hover:shadow-lg transition-all relative overflow-hidden group active:scale-[0.98]"
          >
            <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            <span className="material-symbols-outlined text-[36px] z-10" style={{ fontVariationSettings: "'FILL' 1" }}>
              search
            </span>
            <div className="z-10 text-left">
              <span className="font-headline-md text-headline-md font-bold block leading-tight">
                Find a Ride
              </span>
              <span className="font-body-sm text-[12px] text-on-primary/80 mt-0.5 block">
                Search carpools
              </span>
            </div>
          </button>

          {/* Offer a Ride Button */}
          <button
            onClick={() => navigate('/offer-ride')}
            className="flex flex-col justify-between items-start p-lg min-h-[140px] bg-secondary rounded-[20px] text-on-secondary shadow-md hover:shadow-lg transition-all relative overflow-hidden group active:scale-[0.98]"
          >
            <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            <span className="material-symbols-outlined text-[36px] z-10" style={{ fontVariationSettings: "'FILL' 1" }}>
              add_circle
            </span>
            <div className="z-10 text-left">
              <span className="font-headline-md text-headline-md font-bold block leading-tight">
                Offer a Ride
              </span>
              <span className="font-body-sm text-[12px] text-on-secondary/80 mt-0.5 block">
                Share your journey
              </span>
            </div>
          </button>
        </div>

        {/* Available Carpools Feed */}
        <div className="flex flex-col gap-md pt-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
              Available Carpools Nearby
            </h3>
            {featuredRides.length > 0 && (
              <button
                onClick={() => navigate('/available-rides')}
                className="text-primary font-label-bold text-body-sm hover:underline cursor-pointer"
              >
                See all
              </button>
            )}
          </div>

          {featuredRides.length > 0 ? (
            <div className="flex flex-col gap-md">
              {featuredRides.map(ride => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 text-center flex flex-col items-center gap-3 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">directions_car</span>
              </div>
              <div>
                <h4 className="font-headline-md text-base font-bold text-on-surface">No carpools listed yet</h4>
                <p className="font-body-sm text-xs text-on-surface-variant max-w-xs mt-0.5">
                  Be the first commuter to offer a ride and share your commute!
                </p>
              </div>
              <button
                onClick={() => navigate('/offer-ride')}
                className="px-4 py-2 bg-secondary text-on-secondary rounded-xl font-label-bold text-xs shadow-sm hover:bg-secondary/90 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                <span>Offer a Ride</span>
              </button>
            </div>
          )}
        </div>

        {/* Recent Activity Brief */}
        {upcomingJourneys.length > 0 && (
          <div className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/30 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label-bold text-label-bold text-on-surface font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">event</span>
                Upcoming Journey
              </span>
              <button
                onClick={() => navigate('/activity')}
                className="text-primary font-body-sm text-[12px]"
              >
                View Activity
              </button>
            </div>
            {upcomingJourneys.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 border-t border-outline-variant/20">
                <div>
                  <p className="font-label-bold text-body-sm text-on-surface font-semibold">
                    {item.from} → {item.to}
                  </p>
                  <p className="font-body-sm text-[12px] text-on-surface-variant">
                    {item.date} at {item.time} ({item.personOffering})
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-medium">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
