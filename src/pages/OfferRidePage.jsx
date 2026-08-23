import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useApp } from '../context/AppContext';
import { validatePhoneNumber } from '../lib/phoneUtils';
import { generateTimeSlotsForDate, getDefaultTimeSlot, getTodayDateIST } from '../lib/timeUtils';
import { TimeSlotPicker } from '../components/TimeSlotPicker';
import { LocationAutocomplete } from '../components/LocationAutocomplete';

export const OfferRidePage = () => {
  const navigate = useNavigate();
  const { addRide, user, updateUserProfile } = useApp();

  const todayDate = getTodayDateIST();

  // Location state (canonical selected object & raw input text)
  const [fromLocation, setFromLocation] = useState(null);
  const [fromInput, setFromInput] = useState('');
  const [fromError, setFromError] = useState('');

  const [toLocation, setToLocation] = useState(null);
  const [toInput, setToInput] = useState('');
  const [toError, setToError] = useState('');

  const [date, setDate] = useState(todayDate);
  const [time, setTime] = useState(() => getDefaultTimeSlot(todayDate));
  const [availableSeats, setAvailableSeats] = useState(3);
  const [note, setNote] = useState('');
  const [selectedPreferences, setSelectedPreferences] = useState(["AC Required", "No Smoking"]);

  const timeSlots = generateTimeSlotsForDate(date);

  const handleDateChange = (newDate) => {
    setDate(newDate);
    const newSlots = generateTimeSlotsForDate(newDate);
    if (!newSlots.some((s) => s.value === time)) {
      setTime(newSlots[0]?.value || '');
    }
  };

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Phone Modal State
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const hasPhone = Boolean(user?.phone && String(user.phone).trim() !== '');

  const executeCreateRide = async () => {
    setSubmitting(true);
    setErrorMsg('');

    const res = await addRide({
      from: fromLocation || fromInput,
      to: toLocation || toInput,
      fromLatitude: fromLocation?.latitude,
      fromLongitude: fromLocation?.longitude,
      toLatitude: toLocation?.latitude,
      toLongitude: toLocation?.longitude,
      fromPlaceId: fromLocation?.placeId,
      toPlaceId: toLocation?.placeId,
      date,
      departureTime: time,
      availableSeats: Number(availableSeats),
      note,
      preferences: selectedPreferences
    });

    setSubmitting(false);

    if (res?.error) {
      console.error('Error creating ride in Supabase:', res.error);
      setErrorMsg(res.error.message || 'Failed to insert ride into Supabase.');
      alert(`Supabase Error: ${res.error.message || 'Failed to insert ride'}`);
      return;
    }

    navigate('/activity', { state: { tab: 'offered' } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFromError('');
    setToError('');

    let hasValidationError = false;

    if (!fromLocation) {
      setFromError('Please select a pickup location from the suggestions.');
      hasValidationError = true;
    }

    if (!toLocation) {
      setToError('Please select a destination from the suggestions.');
      hasValidationError = true;
    }

    if (hasValidationError) {
      return;
    }

    if (!hasPhone) {
      setShowPhoneModal(true);
      return;
    }

    await executeCreateRide();
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
    await executeCreateRide();
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      <TopBar title="Offer a Ride" showBack={true} />

      <form onSubmit={handleSubmit} className="px-container-margin py-md flex flex-col gap-lg pb-24">
        {/* Phone Required Notice Banner */}
        {!hasPhone && (
          <div className="bg-error-container/30 border border-error/40 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-2 text-error font-headline-md font-bold text-sm">
              <span className="material-symbols-outlined text-base">emergency_home</span>
              <span>Phone Number Required</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              A verified phone number is required before offering a ride. Your number is kept private until you accept a ride request.
            </p>
            <button
              type="button"
              onClick={() => setShowPhoneModal(true)}
              className="mt-1 px-4 py-2 bg-secondary text-on-secondary rounded-xl font-label-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-secondary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add_call</span>
              <span>Enter Phone Number</span>
            </button>
          </div>
        )}

        {/* Trip Details */}
        <div className="bg-surface-container-lowest rounded-2xl p-md shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col gap-md">
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold border-b border-outline-variant/20 pb-2">
            Trip Details
          </h2>

          {/* Starting Location */}
          <LocationAutocomplete
            id="starting-location-offer"
            label="Starting location (Pickup)"
            placeholder="e.g. Alambagh, Lucknow"
            required
            value={fromInput}
            onChange={(text) => {
              setFromInput(text);
              if (fromError) setFromError('');
            }}
            onSelect={(loc) => {
              setFromLocation(loc);
              if (loc) {
                setFromInput(loc.label);
                setFromError('');
              }
            }}
            error={fromError}
            icon="location_on"
            variant="primary"
          />

          {/* Destination */}
          <LocationAutocomplete
            id="destination-offer"
            label="Destination (Drop-off)"
            placeholder="e.g. Hazratganj, Lucknow"
            required
            value={toInput}
            onChange={(text) => {
              setToInput(text);
              if (toError) setToError('');
            }}
            onSelect={(loc) => {
              setToLocation(loc);
              if (loc) {
                setToInput(loc.label);
                setToError('');
              }
            }}
            error={toError}
            icon="pin_drop"
            variant="secondary"
          />
        </div>

        {/* Date & Time */}
        <div className="flex gap-md">
          <div className="flex-1">
            <label htmlFor="date-offer" className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
              Date
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                calendar_today
              </span>
              <input
                id="date-offer"
                type="date"
                required
                min={todayDate}
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full h-[52px] pl-10 pr-3 rounded-xl border border-outline-variant/50 bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/20 font-body-lg text-on-surface outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex-1">
            <TimeSlotPicker
              id="time-offer"
              label="Departure Time"
              value={time}
              onChange={setTime}
              slots={timeSlots}
              variant="secondary"
            />
          </div>
        </div>

        {/* Available Seats Selector */}
        <div className="bg-surface-container-lowest rounded-2xl p-md shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col gap-md">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Available Seats
            </h3>
            <p className="font-body-sm text-body-sm text-outline">
              How many empty seats do you have in your car?
            </p>
          </div>

          <div className="flex items-center justify-between bg-surface-container-low p-md rounded-xl">
            <button
              type="button"
              onClick={() => setAvailableSeats(Math.max(1, availableSeats - 1))}
              className="w-12 h-12 rounded-xl bg-surface border border-outline-variant text-on-surface font-bold text-xl flex items-center justify-center hover:bg-surface-container-high"
            >
              -
            </button>
            <div className="text-center">
              <span className="font-headline-md text-2xl font-bold text-secondary block">
                {availableSeats}
              </span>
              <span className="font-body-sm text-[12px] text-on-surface-variant">
                {availableSeats === 1 ? 'seat available' : 'seats available'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAvailableSeats(Math.min(6, availableSeats + 1))}
              className="w-12 h-12 rounded-xl bg-surface border border-outline-variant text-on-surface font-bold text-xl flex items-center justify-center hover:bg-surface-container-high"
            >
              +
            </button>
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label htmlFor="optional-notes-offer" className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
            Optional Notes
          </label>
          <textarea
            id="optional-notes-offer"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Departing sharply at 8:30 AM. Trunk space available for backpacks."
            className="w-full p-md rounded-xl border border-outline-variant/50 bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/20 font-body-lg text-on-surface outline-none transition-all resize-none"
          />
        </div>

        {/* Primary CTA */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[52px] bg-secondary text-on-secondary rounded-xl font-headline-md text-headline-md font-bold shadow-md hover:bg-secondary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
        >
          {submitting ? (
            <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
          ) : (
            <>
              <span className="material-symbols-outlined text-2xl">add_circle</span>
              Offer Ride
            </>
          )}
        </button>
      </form>

      {/* Phone Number Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-sm w-full shadow-xl border border-outline-variant/30 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mx-auto text-2xl">
              <span className="material-symbols-outlined">add_call</span>
            </div>

            <div className="text-center">
              <h3 className="font-headline-md text-lg font-bold text-on-surface">
                Verify Phone Number
              </h3>
              <p className="font-body-sm text-xs text-on-surface-variant mt-1">
                Please enter your 10-digit phone number to complete this ride offer. Your number is kept private until request acceptance.
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
                  className="w-full h-[48px] px-3 rounded-xl border border-outline-variant/50 bg-surface font-body-lg text-on-surface text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
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
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-on-secondary font-label-bold text-xs hover:bg-secondary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {savingPhone ? 'Saving...' : 'Verify & Proceed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
