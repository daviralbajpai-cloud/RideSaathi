import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useApp } from '../context/AppContext';
import { rideService } from '../services/rideService';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export const RideDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRideById, searchCriteria, user } = useApp();

  const [ride, setRide] = useState(() => getRideById(id));
  const [loading, setLoading] = useState(!ride);

  const isOwnRide = Boolean(
    user?.isAuthenticated && (
      (user?.id && (ride?.offeredBy === user.id || ride?.offered_by === user.id || ride?.offeredByProfile?.id === user.id)) ||
      (user?.name && user.name.trim() !== '' && ride?.personName === user.name)
    )
  );

  useEffect(() => {
    let isMounted = true;
    const existing = getRideById(id);
    if (existing) {
      setRide(existing);
      setLoading(false);
    } else if (isSupabaseConfigured() && id) {
      setLoading(true);
      rideService.getRideDetails(id).then(({ data }) => {
        if (isMounted) {
          if (data) setRide(data);
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }
    return () => { isMounted = false; };
  }, [id, getRideById]);

  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-xl">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
        <p className="font-body-sm text-outline mt-2">Loading ride details...</p>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-xl text-center">
        <span className="material-symbols-outlined text-5xl text-outline mb-2">directions_car_off</span>
        <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Ride Not Found</h2>
        <p className="font-body-sm text-on-surface-variant mt-1 mb-4">The requested ride could not be loaded.</p>
        <button
          onClick={() => navigate('/home')}
          className="px-4 py-2 bg-primary text-on-primary rounded-xl font-label-bold text-label-bold shadow-sm"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const totalSeatsNeeded = searchCriteria.totalSeats || 1;
  const seatDescription = totalSeatsNeeded === 1 ? "Just you" : `You + ${totalSeatsNeeded - 1}`;

  return (
    <div className="w-full flex-1 flex flex-col">
      <TopBar title="Ride Details" showBack={true} />

      <div className="px-container-margin py-md flex flex-col gap-lg pb-28">
        {/* Person offering the ride card */}
        <div className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/30 shadow-sm flex items-center gap-md">
          <img
            src={ride.personPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
            alt={ride.personName || 'RideSaathi User'}
            className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shadow-md"
          />
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              {ride.personName || 'RideSaathi User'}
            </h2>
            <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-primary text-base">person</span>
              Person offering the ride
            </span>
          </div>
        </div>

        {/* Route Details Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/30 shadow-sm flex flex-col gap-md">
          <h3 className="font-headline-md text-headline-md text-on-surface font-semibold border-b border-outline-variant/20 pb-2">
            Route Itinerary
          </h3>

          <div className="flex items-start gap-3 py-1">
            <div className="flex flex-col items-center pt-1">
              <div className="w-4 h-4 rounded-full border-2 border-primary bg-primary"></div>
              <div className="w-0.5 h-10 bg-outline-variant/60 my-0.5"></div>
              <div className="w-4 h-4 rounded-full border-2 border-secondary bg-secondary"></div>
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <div>
                <span className="font-label-bold text-[11px] text-outline uppercase tracking-wider">Pickup Location</span>
                <p className="font-headline-md text-headline-md text-on-surface font-bold">
                  {ride.from}
                </p>
              </div>
              <div>
                <span className="font-label-bold text-[11px] text-outline uppercase tracking-wider">Drop-off Location</span>
                <p className="font-headline-md text-headline-md text-on-surface font-bold">
                  {ride.to}
                </p>
              </div>
            </div>
          </div>

          {/* Map Preview Graphic */}
          <div className="w-full h-32 rounded-xl bg-surface-container-high relative overflow-hidden border border-outline-variant/20 flex items-center justify-center">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#004ac6_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="z-10 bg-surface/90 backdrop-blur-md px-4 py-2 rounded-full border border-outline-variant/30 flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-primary text-base">near_me</span>
              <span className="font-label-bold text-label-bold text-on-surface">Direct Commute Route</span>
            </div>
          </div>
        </div>

        {/* Schedule & Seat Availability */}
        <div className="grid grid-cols-2 gap-md">
          <div className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col gap-1">
            <span className="font-label-bold text-[11px] text-outline uppercase">Date & Time</span>
            <p className="font-headline-md text-headline-md text-on-surface font-bold">
              {ride.departureTime || '08:30 AM'}
            </p>
            <p className="font-body-sm text-[12px] text-on-surface-variant">
              {ride.date}
            </p>
          </div>

          <div className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col gap-1">
            <span className="font-label-bold text-[11px] text-outline uppercase">Seats Available</span>
            <p className="font-headline-md text-headline-md text-secondary font-bold">
              {ride.availableSeats} seats
            </p>
            <p className="font-body-sm text-[12px] text-on-surface-variant">
              Total car capacity
            </p>
          </div>
        </div>

        {/* Booking Seat Request Summary or Own Ride Notice */}
        {isOwnRide ? (
          <div className="bg-primary/10 border border-primary/30 p-md rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <span className="font-label-bold text-label-bold text-primary font-bold block flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">verified</span>
                You Offered This Ride
              </span>
              <span className="font-body-sm text-[12px] text-on-surface-variant mt-0.5 block">
                You cannot book your own ride offer. Passenger requests will appear in your Activity tab.
              </span>
            </div>
            <span className="material-symbols-outlined text-primary text-2xl">directions_car</span>
          </div>
        ) : (
          <div className="bg-primary/10 border border-primary/30 p-md rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <span className="font-label-bold text-label-bold text-primary font-bold block">
                Booking for: {seatDescription}
              </span>
              <span className="font-body-sm text-[12px] text-on-surface-variant">
                {totalSeatsNeeded} {totalSeatsNeeded === 1 ? 'seat' : 'seats'} needed
              </span>
            </div>
            <span className="material-symbols-outlined text-primary text-2xl">event_seat</span>
          </div>
        )}

        {/* Optional Note & Preferences */}
        {ride.note && (
          <div className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col gap-1">
            <span className="font-label-bold text-label-bold text-on-surface font-semibold">
              Note from {ride.personName || 'RideSaathi User'}
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              "{ride.note}"
            </p>
          </div>
        )}
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 w-full max-w-[600px] mx-auto px-container-margin py-3 z-40 bg-surface/90 backdrop-blur-md border-t border-outline-variant/30">
        {isOwnRide ? (
          <button
            onClick={() => navigate('/activity')}
            className="w-full min-h-[52px] bg-secondary text-on-secondary rounded-xl font-headline-md text-headline-md font-bold shadow-md hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span className="material-symbols-outlined text-2xl">history</span>
            <span>Manage in Activity</span>
          </button>
        ) : (
          <button
            onClick={() => navigate(`/ride-request/${ride.id}`)}
            className="w-full min-h-[52px] bg-primary text-on-primary rounded-xl font-headline-md text-headline-md font-bold shadow-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Request to Join</span>
            <span className="material-symbols-outlined text-2xl">arrow_forward</span>
          </button>
        )}
      </div>
    </div>
  );
};
