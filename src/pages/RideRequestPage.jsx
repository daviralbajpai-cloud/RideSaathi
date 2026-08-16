import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useApp } from '../context/AppContext';
import { rideService } from '../services/rideService';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export const RideRequestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRideById, searchCriteria, requestJoinRide } = useApp();

  const [ride, setRide] = useState(() => getRideById(id));
  const [loading, setLoading] = useState(!ride);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
        <p className="font-body-sm text-outline mt-2">Loading ride request...</p>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-xl text-center">
        <span className="material-symbols-outlined text-5xl text-outline mb-2">directions_car_off</span>
        <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Ride Not Found</h2>
        <p className="font-body-sm text-on-surface-variant mt-1 mb-4">The selected ride could not be loaded for requesting.</p>
        <button
          onClick={() => navigate('/home')}
          className="px-4 py-2 bg-primary text-on-primary rounded-xl font-label-bold text-label-bold shadow-sm"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const requestedSeats = searchCriteria.totalSeats || 1;
  const additionalPeople = requestedSeats - 1;

  const handleConfirmRequest = async () => {
    setSubmitting(true);
    setErrorMsg('');

    const res = await requestJoinRide(ride, requestedSeats);
    setSubmitting(false);

    if (res?.error) {
      console.error('Error submitting ride request to Supabase:', res.error);
      setErrorMsg(res.error.message || 'Failed to insert ride request into Supabase.');
      alert(`Supabase Request Error: ${res.error.message || 'Failed to insert ride request'}`);
      return;
    }

    setSubmitted(true);
    setTimeout(() => {
      navigate('/activity');
    }, 1200);
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      <TopBar title="Ride Request" showBack={true} />

      <div className="px-container-margin py-md flex flex-col gap-lg pb-24">
        {submitted ? (
          <div className="bg-surface-container-lowest rounded-2xl p-xl border border-secondary/40 text-center shadow-md flex flex-col items-center gap-md my-auto">
            <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-3xl">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              Request Sent Successfully!
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {ride.personName || 'The user'} has received your request. Redirecting to My Activity...
            </p>
          </div>
        ) : (
          <>
            {/* Summary Box */}
            <div className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/30 shadow-sm flex flex-col gap-md">
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold border-b border-outline-variant/20 pb-2">
                Request Summary
              </h2>

              <div className="flex items-center gap-md">
                <img
                  src={ride.personPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                  alt={ride.personName || 'RideSaathi User'}
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary/20 shadow-sm"
                />
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                    {ride.personName || 'RideSaathi User'}
                  </h3>
                  <p className="font-body-sm text-[12px] text-on-surface-variant">
                    Person offering the ride
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant/20 flex flex-col gap-2">
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-outline">Route:</span>
                  <span className="font-bold text-on-surface">{ride.from} → {ride.to}</span>
                </div>
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-outline">Date & Time:</span>
                  <span className="font-medium text-on-surface">{ride.date} at {ride.departureTime || '08:30 AM'}</span>
                </div>
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-outline">Seats Requested:</span>
                  <span className="font-bold text-primary">
                    {requestedSeats === 1 ? 'Just you (1 seat)' : `You + ${additionalPeople} people (${requestedSeats} seats)`}
                  </span>
                </div>
              </div>
            </div>

            {/* Preview Box: How this appears to person offering the ride */}
            <div className="bg-tertiary-container/10 border border-tertiary-container/30 p-md rounded-2xl flex flex-col gap-sm">
              <span className="font-label-bold text-[12px] text-tertiary font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-base">visibility</span>
                How this appears to {ride.personName || 'the user'}:
              </span>
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30 text-body-sm font-medium text-on-surface">
                "Commuter wants to join with {additionalPeople > 0 ? `${additionalPeople} additional people` : '1 seat'}."
              </div>
            </div>

            {errorMsg && (
              <div className="bg-error/10 border border-error text-error p-md rounded-xl text-body-sm">
                {errorMsg}
              </div>
            )}

            {/* Primary Confirm Action */}
            <button
              onClick={handleConfirmRequest}
              disabled={submitting}
              className="w-full min-h-[52px] bg-primary text-on-primary rounded-xl font-headline-md text-headline-md font-bold shadow-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mt-auto disabled:opacity-50"
            >
              {submitting ? (
                <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
              ) : (
                <>
                  <span>Confirm & Send Request</span>
                  <span className="material-symbols-outlined text-2xl">send</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
