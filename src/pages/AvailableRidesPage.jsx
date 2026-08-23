import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { RideCard } from '../components/RideCard';
import { useApp } from '../context/AppContext';
import { isRideExpired } from '../lib/timeUtils';

export const AvailableRidesPage = () => {
  const navigate = useNavigate();
  const { searchResults, searchCriteria, rides } = useApp();

  // If search results exist, use them. Otherwise fallback to all available rides.
  const displayRides = searchResults.length > 0 ? searchResults : rides;

  return (
    <div className="w-full flex-1 flex flex-col">
      <TopBar title="Available Rides" showBack={true} />

      <div className="px-container-margin py-md flex flex-col gap-md">
        {/* Search Summary Header */}
        <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant/30 flex items-center justify-between">
          <div>
            <h2 className="font-label-bold text-label-bold text-on-surface font-bold">
              {displayRides.length} {displayRides.length === 1 ? 'ride' : 'rides'} available
            </h2>
            <p className="font-body-sm text-[12px] text-on-surface-variant">
              Filter: {searchCriteria.totalSeats} {searchCriteria.totalSeats === 1 ? 'seat' : 'seats'} requested
            </p>
          </div>

          <button
            onClick={() => navigate('/find-ride')}
            className="text-primary font-label-bold text-body-sm flex items-center gap-1 hover:underline"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            Edit
          </button>
        </div>

        {/* Ride Cards List or Empty State */}
        {displayRides.length > 0 ? (
          <div className="flex flex-col gap-md">
            {displayRides.map(ride => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/30 text-center flex flex-col items-center gap-4 shadow-sm my-4">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-outline text-3xl">
              <span className="material-symbols-outlined">directions_car_off</span>
            </div>
            <div>
              <h3 className="font-headline-md text-base font-bold text-on-surface">No Carpools Found</h3>
              <p className="font-body-sm text-xs text-on-surface-variant max-w-xs mt-1">
                No active carpools currently match your route and schedule. You can create your own ride offer or adjust search parameters.
              </p>
            </div>
            <div className="flex gap-2.5 mt-1">
              <button
                onClick={() => navigate('/find-ride')}
                className="px-4 py-2 bg-surface-container-high text-on-surface font-label-bold text-xs rounded-xl hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                Change Filters
              </button>
              <button
                onClick={() => navigate('/offer-ride')}
                className="px-4 py-2 bg-secondary text-on-secondary font-label-bold text-xs rounded-xl shadow-sm hover:bg-secondary/90 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                <span>Offer Ride</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
