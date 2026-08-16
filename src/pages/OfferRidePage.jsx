import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useApp } from '../context/AppContext';

export const OfferRidePage = () => {
  const navigate = useNavigate();
  const { addRide } = useApp();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('08:30 AM');
  const [availableSeats, setAvailableSeats] = useState(3);
  const [note, setNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!from || !to) {
      alert('Please fill starting location and destination.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const res = await addRide({
      from,
      to,
      date,
      departureTime: time,
      availableSeats: Number(availableSeats),
      note,
      preferences: ["AC Required", "No Smoking"]
    });

    setSubmitting(false);

    if (res?.error) {
      console.error('Error creating ride in Supabase:', res.error);
      setErrorMsg(res.error.message || 'Failed to insert ride into Supabase.');
      alert(`Supabase Error: ${res.error.message || 'Failed to insert ride'}`);
      return;
    }

    navigate('/activity');
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      <TopBar title="Offer a Ride" showBack={true} />

      <form onSubmit={handleSubmit} className="px-container-margin py-md flex flex-col gap-lg pb-24">
        <div className="bg-surface-container-lowest rounded-2xl p-md shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col gap-md">
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold border-b border-outline-variant/20 pb-2">
            Trip Details
          </h2>

          {/* Starting Location */}
          <div>
            <label htmlFor="starting-location-offer" className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
              Starting location (Pickup)
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                location_on
              </span>
              <input
                id="starting-location-offer"
                type="text"
                required
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="e.g. Alambagh, Lucknow"
                className="w-full h-[52px] pl-10 pr-4 rounded-xl border border-outline-variant/50 bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/20 font-body-lg text-on-surface outline-none transition-all"
              />
            </div>
          </div>

          {/* Destination */}
          <div>
            <label htmlFor="destination-offer" className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
              Destination (Drop-off)
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
                pin_drop
              </span>
              <input
                id="destination-offer"
                type="text"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="e.g. Hazratganj, Lucknow"
                className="w-full h-[52px] pl-10 pr-4 rounded-xl border border-outline-variant/50 bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/20 font-body-lg text-on-surface outline-none transition-all"
              />
            </div>
          </div>
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
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-[52px] pl-10 pr-3 rounded-xl border border-outline-variant/50 bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/20 font-body-lg text-on-surface outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex-1">
            <label htmlFor="time-offer" className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
              Departure Time
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                schedule
              </span>
              <input
                id="time-offer"
                type="text"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="08:30 AM"
                className="w-full h-[52px] pl-10 pr-3 rounded-xl border border-outline-variant/50 bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/20 font-body-lg text-on-surface outline-none transition-all"
              />
            </div>
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
    </div>
  );
};
