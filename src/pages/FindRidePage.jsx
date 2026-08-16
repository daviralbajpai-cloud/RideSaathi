import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useApp } from '../context/AppContext';

export const FindRidePage = () => {
  const navigate = useNavigate();
  const { searchCriteria, setSearchCriteria, performSearch } = useApp();

  const [from, setFrom] = useState(searchCriteria.from || '');
  const [to, setTo] = useState(searchCriteria.to || '');
  const [date, setDate] = useState(searchCriteria.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(searchCriteria.time || '');
  const [selectedSeatOption, setSelectedSeatOption] = useState(searchCriteria.totalSeats || 1);
  const [selectedPreferences, setSelectedPreferences] = useState([]);

  const seatOptions = [
    { label: 'Just me', totalSeats: 1 },
    { label: 'Me + 1', totalSeats: 2 },
    { label: 'Me + 2', totalSeats: 3 },
    { label: 'Me + 3', totalSeats: 4 },
    { label: 'Me + 4', totalSeats: 5 }
  ];

  const togglePreference = (pref) => {
    if (selectedPreferences.includes(pref)) {
      setSelectedPreferences(selectedPreferences.filter(p => p !== pref));
    } else {
      setSelectedPreferences([...selectedPreferences, pref]);
    }
  };

  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);

    const criteria = {
      from,
      to,
      date,
      time,
      totalSeats: selectedSeatOption,
      preferences: selectedPreferences
    };
    
    console.log('FindRidePage submitting search criteria:', criteria);
    const results = await performSearch(criteria);
    setSearching(false);

    if (results && results.length > 0) {
      navigate('/available-rides');
    } else {
      navigate('/no-results');
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      <TopBar title="Find a Ride" showBack={true} />

      <form onSubmit={handleSearch} className="px-container-margin py-md flex flex-col gap-lg pb-24">
        {/* Route Locations Container */}
        <div className="bg-surface-container-lowest rounded-2xl p-md shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col gap-md">
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold border-b border-outline-variant/20 pb-2">
            Route Details
          </h2>

          {/* Starting Location */}
          <div>
            <label htmlFor="starting-location" className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
              Starting location (Pickup)
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                location_on
              </span>
              <input
                id="starting-location"
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="e.g. Hazratganj, Lucknow"
                className="w-full h-[52px] pl-10 pr-4 rounded-xl border border-outline-variant/50 bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-lg text-on-surface outline-none transition-all"
              />
            </div>
          </div>

          {/* Destination */}
          <div>
            <label htmlFor="destination" className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
              Destination (Drop-off)
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
                pin_drop
              </span>
              <input
                id="destination"
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="e.g. Gomti Nagar, Lucknow"
                className="w-full h-[52px] pl-10 pr-4 rounded-xl border border-outline-variant/50 bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-lg text-on-surface outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Date & Time Grid */}
        <div className="flex gap-md">
          {/* Date Picker */}
          <div className="flex-1">
            <label htmlFor="ride-date" className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
              Date
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                calendar_today
              </span>
              <input
                id="ride-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-[52px] pl-10 pr-3 rounded-xl border border-outline-variant/50 bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-lg text-on-surface outline-none transition-all"
              />
            </div>
          </div>

          {/* Time Picker */}
          <div className="flex-1">
            <label htmlFor="ride-time" className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
              Time
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                schedule
              </span>
              <select
                id="ride-time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-[52px] pl-10 pr-3 rounded-xl border border-outline-variant/50 bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-lg text-on-surface outline-none transition-all appearance-none"
              >
                <option value="">Any time</option>
                <option value="Morning">Morning (06:00 - 11:59)</option>
                <option value="Afternoon">Afternoon (12:00 - 16:59)</option>
                <option value="Evening">Evening (17:00 - 20:59)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Who is Travelling / Seat Selector */}
        <div className="bg-surface-container-lowest rounded-2xl p-md shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col gap-md">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Who is travelling?
            </h3>
            <p className="font-body-sm text-body-sm text-outline">
              Select the number of seats you need
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {seatOptions.map((opt) => {
              const isSelected = selectedSeatOption === opt.totalSeats;
              return (
                <button
                  key={opt.totalSeats}
                  type="button"
                  onClick={() => setSelectedSeatOption(opt.totalSeats)}
                  className={`flex items-center justify-center p-md rounded-xl font-medium transition-all min-h-[48px] ${
                    isSelected
                      ? 'border-2 border-primary bg-primary/10 text-primary font-bold shadow-sm'
                      : 'border border-outline-variant/40 bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Seat summary badge */}
          <div className="pt-sm border-t border-outline-variant/20 flex items-center justify-between">
            <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
              Total seats requested:
            </span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold text-body-sm">
              {selectedSeatOption} {selectedSeatOption === 1 ? 'seat' : 'seats'} needed
            </span>
          </div>
        </div>

        {/* Optional Preferences Chips */}
        <div>
          <span className="block font-label-bold text-label-bold text-on-surface-variant mb-2 ml-1">
            Preferences (Optional)
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'AC Required', icon: 'ac_unit' },
              { label: 'No Smoking', icon: 'smoke_free' },
              { label: 'Women Only', icon: 'female' }
            ].map(pref => {
              const isSelected = selectedPreferences.includes(pref.label);
              return (
                <button
                  key={pref.label}
                  type="button"
                  onClick={() => togglePreference(pref.label)}
                  className={`h-9 px-3 rounded-full text-[13px] font-medium transition-colors flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-primary font-bold'
                      : 'bg-surface-container-low border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{pref.icon}</span>
                  {pref.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Find Rides Submit CTA */}
        <button
          type="submit"
          disabled={searching}
          className="w-full min-h-[52px] bg-primary text-on-primary rounded-xl font-headline-md text-headline-md font-bold shadow-[0_8px_16px_rgba(37,99,235,0.2)] hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
        >
          {searching ? (
            <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
          ) : (
            <>
              <span className="material-symbols-outlined text-2xl">search</span>
              Find Rides
            </>
          )}
        </button>
      </form>
    </div>
  );
};
