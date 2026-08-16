import React from 'react';
import { useNavigate } from 'react-router-dom';

export const RideCard = ({ ride }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-surface-container-lowest rounded-2xl p-md shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-outline-variant/30 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Header: Person offering the ride */}
      <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <img
            src={ride.personPhoto}
            alt={ride.personName}
            className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 shadow-sm"
          />
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
              {ride.personName}
            </h3>
            <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary">person</span>
              Person offering the ride
            </span>
          </div>
        </div>
        <div className="bg-secondary-container/80 text-on-secondary-container px-3 py-1 rounded-full font-label-bold text-label-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">airline_seat_recline_normal</span>
          <span>{ride.availableSeats} seats left</span>
        </div>
      </div>

      {/* Route Info */}
      <div className="flex items-start gap-3 py-1">
        <div className="flex flex-col items-center pt-1">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-primary bg-primary"></div>
          <div className="w-0.5 h-8 bg-outline-variant/60 my-0.5"></div>
          <div className="w-3.5 h-3.5 rounded-full border-2 border-secondary bg-secondary"></div>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <div>
            <span className="font-label-bold text-[11px] text-outline uppercase tracking-wider">Pickup</span>
            <p className="font-headline-md text-headline-md text-on-surface font-bold leading-tight">
              {ride.from}
            </p>
          </div>
          <div>
            <span className="font-label-bold text-[11px] text-outline uppercase tracking-wider">Drop-off</span>
            <p className="font-headline-md text-headline-md text-on-surface font-bold leading-tight">
              {ride.to}
            </p>
          </div>
        </div>
      </div>

      {/* Time & Date */}
      <div className="flex items-center gap-4 text-on-surface-variant text-body-sm bg-surface-container-low p-2.5 rounded-xl">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[18px]">calendar_today</span>
          <span>{ride.date}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
          <span>{ride.departureTime}</span>
        </div>
      </div>

      {/* Note if available */}
      {ride.note && (
        <p className="font-body-sm text-body-sm text-on-surface-variant italic bg-surface-container-lowest border-l-2 border-primary/40 pl-2 py-0.5">
          "{ride.note}"
        </p>
      )}

      {/* Preferences Chips */}
      {ride.preferences && ride.preferences.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ride.preferences.map((pref, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-[12px] font-medium flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">task_alt</span>
              {pref}
            </span>
          ))}
        </div>
      )}

      {/* Primary Action Button */}
      <button
        onClick={() => navigate(`/ride-details/${ride.id}`)}
        className="w-full min-h-[48px] bg-primary text-on-primary rounded-xl font-label-bold text-label-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm mt-1"
      >
        <span>View Ride</span>
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </button>
    </div>
  );
};
