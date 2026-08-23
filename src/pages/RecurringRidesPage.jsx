import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useApp } from '../context/AppContext';
import { LocationAutocomplete } from '../components/LocationAutocomplete';

export const RecurringRidesPage = () => {
  const navigate = useNavigate();
  const { recurringRides, addRecurringRide } = useApp();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departureTime, setDepartureTime] = useState('08:30 AM');
  const [availableSeats, setAvailableSeats] = useState(3);
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) return; // keep at least 1 day
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!from || !to) {
      alert("Please enter starting location and destination.");
      return;
    }

    addRecurringRide({
      from,
      to,
      departureTime,
      availableSeats,
      days: selectedDays
    });

    setFrom('');
    setTo('');
    alert("Recurring ride schedule created!");
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      <TopBar title="Recurring Rides" showBack={true} />

      <div className="px-container-margin py-md flex flex-col gap-lg pb-24">
        {/* Active Schedules */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              Active Recurring Rides
            </h2>
            <span className="text-body-sm text-outline font-medium">
              {recurringRides.length} active
            </span>
          </div>

          {recurringRides.map(rec => (
            <div key={rec.id} className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/30 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
                <span className="font-headline-md text-headline-md font-bold text-on-surface">
                  {rec.from} → {rec.to}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                  {rec.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                <span>Time: {rec.departureTime}</span>
                <span>{rec.availableSeats} seats available</span>
              </div>
              <div className="flex gap-1.5 pt-1">
                {allDays.map(d => {
                  const isActive = rec.days.includes(d);
                  return (
                    <span
                      key={d}
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${
                        isActive
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-high text-outline'
                      }`}
                    >
                      {d[0]}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Create New Form */}
        <form onSubmit={handleCreate} className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/30 shadow-sm flex flex-col gap-md">
          <h3 className="font-headline-md text-headline-md text-on-surface font-bold border-b border-outline-variant/20 pb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-lg">calendar_add_on</span>
            Create Recurring Ride Schedule
          </h3>

          <LocationAutocomplete
            id="starting-location-recurring"
            label="Pickup Location"
            placeholder="e.g. Hazratganj, Lucknow"
            value={from}
            onChange={setFrom}
            onSelect={(loc) => {
              if (loc) setFrom(loc.label);
            }}
            variant="primary"
          />

          <LocationAutocomplete
            id="destination-recurring"
            label="Drop-off Destination"
            placeholder="e.g. Gomti Nagar, Lucknow"
            value={to}
            onChange={setTo}
            onSelect={(loc) => {
              if (loc) setTo(loc.label);
            }}
            variant="secondary"
          />

          {/* Repeat Days Selector */}
          <div>
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
              Repeat On
            </label>
            <div className="flex justify-between gap-1.5">
              {allDays.map(day => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant/40 text-on-surface-variant'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="departure-time-recurring" className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
                Departure Time
              </label>
              <input
                id="departure-time-recurring"
                type="text"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full h-[48px] px-3 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="available-seats-recurring" className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
                Available Seats
              </label>
              <input
                id="available-seats-recurring"
                type="number"
                min="1"
                max="6"
                value={availableSeats}
                onChange={(e) => setAvailableSeats(Number(e.target.value))}
                className="w-full h-[48px] px-3 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] bg-primary text-on-primary rounded-xl font-label-bold text-body-sm flex items-center justify-center gap-2 transition-all shadow-sm hover:bg-primary/90 cursor-pointer active:scale-98 mt-1"
          >
            <span className="material-symbols-outlined text-base">update</span>
            <span>Create Recurring Ride</span>
          </button>
        </form>
      </div>
    </div>
  );
};
