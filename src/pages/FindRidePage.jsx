import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useApp } from '../context/AppContext';
import { generateTimeSlotsForDate, getTodayDateIST } from '../lib/timeUtils';
import { TimeSlotPicker } from '../components/TimeSlotPicker';
import { LocationAutocomplete } from '../components/LocationAutocomplete';

export const FindRidePage = () => {
  const navigate = useNavigate();
  const { searchCriteria, setSearchCriteria, performSearch } = useApp();

  const todayDate = getTodayDateIST();

  const initialFrom = searchCriteria.from || '';
  const initialTo = searchCriteria.to || '';

  const [fromLocation, setFromLocation] = useState(typeof initialFrom === 'object' ? initialFrom : null);
  const [fromInput, setFromInput] = useState(typeof initialFrom === 'object' ? initialFrom.label : initialFrom);

  const [toLocation, setToLocation] = useState(typeof initialTo === 'object' ? initialTo : null);
  const [toInput, setToInput] = useState(typeof initialTo === 'object' ? initialTo.label : initialTo);

  const [date, setDate] = useState(searchCriteria.date || todayDate);
  const [time, setTime] = useState(searchCriteria.time || '');
  const [selectedSeatOption, setSelectedSeatOption] = useState(searchCriteria.totalSeats || 1);
  const [selectedPreferences, setSelectedPreferences] = useState([]);

  const timeSlots = generateTimeSlotsForDate(date);

  const handleDateChange = (newDate) => {
    setDate(newDate);
    const newSlots = generateTimeSlotsForDate(newDate);
    if (time && !newSlots.some((s) => s.value === time)) {
      setTime('');
    }
  };

  const seatOptions = [
    { label: 'Just me (1)', totalSeats: 1 },
    { label: 'Me + 1 (2)', totalSeats: 2 },
    { label: 'Me + 2 (3)', totalSeats: 3 },
    { label: 'Me + 3 (4)', totalSeats: 4 },
    { label: 'Me + 4 (5)', totalSeats: 5 }
  ];

  const travelPreferences = [
    { label: 'AC Required', icon: 'ac_unit' },
    { label: 'No Smoking', icon: 'smoke_free' },
    { label: 'Women Only', icon: 'female' }
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
      from: fromLocation || fromInput,
      to: toLocation || toInput,
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
        {/* Route Details */}
        <div className="bg-surface-container-lowest rounded-2xl p-md shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col gap-md">
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold border-b border-outline-variant/20 pb-2">
            Route Details
          </h2>

          {/* Starting Location */}
          <LocationAutocomplete
            id="starting-location"
            label="Starting location (Pickup)"
            placeholder="e.g. Hazratganj, Lucknow"
            value={fromInput}
            onChange={(text) => setFromInput(text)}
            onSelect={(loc) => {
              setFromLocation(loc);
              if (loc) setFromInput(loc.label);
            }}
            icon="location_on"
            variant="primary"
          />

          {/* Destination */}
          <LocationAutocomplete
            id="destination"
            label="Destination (Drop-off)"
            placeholder="e.g. Gomti Nagar, Lucknow"
            value={toInput}
            onChange={(text) => setToInput(text)}
            onSelect={(loc) => {
              setToLocation(loc);
              if (loc) setToInput(loc.label);
            }}
            icon="pin_drop"
            variant="secondary"
          />
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
                min={todayDate}
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full h-[52px] pl-10 pr-3 rounded-xl border border-outline-variant/50 bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-lg text-on-surface outline-none transition-all"
              />
            </div>
          </div>

          {/* Time Picker */}
          <div className="flex-1">
            <TimeSlotPicker
              id="ride-time"
              label="Time"
              value={time}
              onChange={setTime}
              slots={timeSlots}
              allowAny={true}
              anyLabel="Any time"
              variant="primary"
            />
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
            {travelPreferences.map(pref => {
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
