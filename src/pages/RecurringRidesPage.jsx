import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useApp } from '../context/AppContext';

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
        <div className="flex flex-col gap-md">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
            Your Active Recurring Schedules
          </h2>

          {recurringRides.map(rec => (
            <div key={rec.id} className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/30 shadow-sm flex flex-col gap-sm">
              <div className="flex items-center justify-between">
                <span className="font-headline-md text-headline-md font-bold text-on-surface">
                  {rec.from} → {rec.to}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
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
                      className={`w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center ${
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
          <h3 className="font-headline-md text-headline-md text-on-surface font-semibold border-b border-outline-variant/20 pb-2">
            Create Recurring Ride
          </h3>

          <div>
            <label htmlFor="starting-location-recurring" className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
              Starting location (Pickup)
            </label>
            <input
              id="starting-location-recurring"
              type="text"
              required
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="e.g. Hazratganj"
              className="w-full h-[52px] px-4 rounded-xl border border-outline-variant/50 bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-lg text-on-surface outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="destination-recurring" className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
              Destination (Drop-off)
            </label>
            <input
              id="destination-recurring"
              type="text"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="e.g. Gomti Nagar IT Park"
              className="w-full h-[52px] px-4 rounded-xl border border-outline-variant/50 bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-lg text-on-surface outline-none transition-all"
            />
          </div>

          {/* Repeat Days Selector */}
          <div>
            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-2 ml-1">
              Repeat Days
            </label>
            <div className="flex justify-between gap-1">
              {allDays.map(day => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`flex-1 h-10 rounded-xl text-body-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container-low border border-outline-variant/30 text-on-surface-variant'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-md">
            <div className="flex-1">
              <label htmlFor="departure-time-recurring" className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
                Departure Time
              </label>
              <input
                id="departure-time-recurring"
                type="text"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full h-[52px] px-3 rounded-xl border border-outline-variant/50 bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-lg text-on-surface outline-none"
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
                className="w-full h-[52px] px-3 rounded-xl border border-outline-variant/50 bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-lg text-on-surface outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full min-h-[52px] bg-primary text-on-primary rounded-xl font-label-bold text-label-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm mt-2"
          >
            <span className="material-symbols-outlined text-xl">update</span>
            Save Recurring Schedule
          </button>
        </form>
      </div>
    </div>
  );
};
