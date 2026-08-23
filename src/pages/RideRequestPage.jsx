import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useApp } from '../context/AppContext';
import { rideService } from '../services/rideService';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { validatePhoneNumber } from '../lib/phoneUtils';

export const RideRequestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRideById, searchCriteria, requestJoinRide, user, updateUserProfile } = useApp();

  const [ride, setRide] = useState(() => getRideById(id));
  const [loading, setLoading] = useState(!ride);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Phone Modal State
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const hasPhone = Boolean(user?.phone && String(user.phone).trim() !== '');

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

  const isOwnRide = Boolean(
    user?.isAuthenticated && (
      (user?.id && (ride?.offeredBy === user.id || ride?.offered_by === user.id || ride?.offeredByProfile?.id === user.id)) ||
      (user?.name && user.name.trim() !== '' && ride?.personName === user.name)
    )
  );

  if (isOwnRide) {
    return (
      <div className="w-full flex-1 flex flex-col">
        <TopBar title="Ride Request" showBack={true} />
        <div className="flex-1 flex flex-col items-center justify-center p-xl text-center gap-3 my-auto">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">directions_car</span>
          </div>
          <h2 className="font-headline-md text-lg font-bold text-on-surface">You Offered This Ride</h2>
          <p className="font-body-sm text-xs text-on-surface-variant max-w-xs">
            You cannot request seats on a ride that you created. Passenger requests for your ride will appear in your Activity tab.
          </p>
          <button
            onClick={() => navigate('/activity')}
            className="mt-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-label-bold text-xs shadow-sm hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Manage in Activity
          </button>
        </div>
      </div>
    );
  }

  const requestedSeats = searchCriteria.totalSeats || 1;
  const additionalPeople = requestedSeats - 1;

  const executeSendRequest = async () => {
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

  const handleConfirmRequest = async () => {
    if (!hasPhone) {
      setShowPhoneModal(true);
      return;
    }

    await executeSendRequest();
  };

  const handleSavePhoneAndSubmit = async (e) => {
    e.preventDefault();
    setPhoneError('');

    const validation = validatePhoneNumber(phoneInput);
    if (!validation.isValid) {
      setPhoneError(validation.error || 'Please enter a valid 10-digit phone number.');
      return;
    }

    setSavingPhone(true);

    const { error: profileErr } = await updateUserProfile({
      phone: validation.formatted
    });

    setSavingPhone(false);

    if (profileErr) {
      setPhoneError(profileErr.message || 'Failed to save phone number.');
      return;
    }

    setShowPhoneModal(false);
    await executeSendRequest();
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
            {/* Phone Required Notice */}
            {!hasPhone && (
              <div className="bg-error-container/30 border border-error/40 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                <div className="flex items-center gap-2 text-error font-headline-md font-bold text-sm">
                  <span className="material-symbols-outlined text-base">emergency_home</span>
                  <span>Phone Number Required</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Please enter your 10-digit phone number before requesting to join. Your number remains private until accepted.
                </p>
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(true)}
                  className="mt-1 px-4 py-2 bg-primary text-on-primary rounded-xl font-label-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">add_call</span>
                  <span>Enter Phone Number</span>
                </button>
              </div>
            )}

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

      {/* Phone Number Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-sm w-full shadow-xl border border-outline-variant/30 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mx-auto text-2xl">
              <span className="material-symbols-outlined">add_call</span>
            </div>

            <div className="text-center">
              <h3 className="font-headline-md text-lg font-bold text-on-surface">
                Enter Phone Number
              </h3>
              <p className="font-body-sm text-xs text-on-surface-variant mt-1">
                A valid 10-digit phone number is required before joining a ride.
              </p>
            </div>

            <form onSubmit={handleSavePhoneAndSubmit} className="flex flex-col gap-3">
              <div>
                <input
                  type="tel"
                  required
                  autoFocus
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    if (phoneError) setPhoneError('');
                  }}
                  placeholder="+91 98765 43210"
                  className="w-full h-[48px] px-3 rounded-xl border border-outline-variant/50 bg-surface font-body-lg text-on-surface text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {phoneError && (
                  <p className="text-error text-xs font-semibold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {phoneError}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-container-high text-on-surface-variant font-label-bold text-xs hover:bg-surface-container-highest transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPhone}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-label-bold text-xs hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {savingPhone ? 'Saving...' : 'Save & Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
