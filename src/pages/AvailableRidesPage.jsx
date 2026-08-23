import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { RideCard } from '../components/RideCard';
import { useApp } from '../context/AppContext';
import { isRideExpired } from '../lib/timeUtils';

export const AvailableRidesPage = () => {
  const navigate = useNavigate();
  const { searchResults, searchCriteria, rides } = useApp();

  // If search results exist, use them. Otherwise fallback to all initial rides.
  // Defense-in-depth: filter out any expired rides from active search results.
  const rawRides = searchResults.length > 0 ? searchResults : rides;
  const displayRides = rawRides.filter(r => !isRideExpired(r.date, r.departureTime));

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

        {/* Ride Cards List */}
        <div className="flex flex-col gap-md">
          {displayRides.map(ride => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </div>
      </div>
    </div>
  );
};
