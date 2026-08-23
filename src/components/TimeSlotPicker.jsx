import React, { useState, useRef, useEffect } from 'react';

/**
 * Premium Custom Time Slot Picker Dropdown
 */
export const TimeSlotPicker = ({
  value,
  onChange,
  slots = [],
  allowAny = false,
  anyLabel = 'Any time',
  variant = 'secondary', // 'secondary' for Offer (green tone), 'primary' for Find (blue tone)
  label = 'Departure Time Slot',
  id = 'time-slot-picker'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Scroll active item into view on open
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const isPrimary = variant === 'primary';
  const accentColor = isPrimary ? 'text-primary' : 'text-secondary';
  const accentBg = isPrimary ? 'bg-primary/10' : 'bg-secondary/10';
  const accentBorder = isPrimary ? 'border-primary' : 'border-secondary';
  const ringColor = isPrimary ? 'focus:ring-primary/20' : 'focus:ring-secondary/20';
  const activeOptionBg = isPrimary ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary';

  const displayLabel = !value || value === '' ? (allowAny ? anyLabel : 'Select time slot') : value;

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full h-[52px] px-3.5 rounded-xl border bg-surface-container-lowest flex items-center justify-between gap-2 text-left transition-all cursor-pointer shadow-sm ${
          isOpen
            ? `${accentBorder} ring-2 ${ringColor} shadow-md`
            : 'border-outline-variant/50 hover:border-outline-variant/80 hover:bg-surface-container-low'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg ${accentBg} ${accentColor} flex items-center justify-center shrink-0`}>
            <span className="material-symbols-outlined text-lg">schedule</span>
          </div>
          <span className={`font-body-lg text-[14.5px] truncate ${value ? 'text-on-surface font-semibold' : 'text-outline font-medium'}`}>
            {displayLabel}
          </span>
        </div>

        <span
          className={`material-symbols-outlined text-outline transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-on-surface' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-2 max-h-64 overflow-y-auto bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl border border-outline-variant/40 shadow-2xl p-1.5 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150 custom-scrollbar"
        >
          {/* Header indicator */}
          <div className="px-3 py-1.5 text-[11px] font-bold text-outline uppercase tracking-wider flex items-center justify-between border-b border-outline-variant/20 mb-1">
            <span>Select 30-Min Window</span>
            <span className="text-[10px] font-normal text-on-surface-variant">Time range</span>
          </div>

          {/* Optional Any Time button */}
          {allowAny && (
            <button
              type="button"
              role="option"
              aria-selected={!value || value === ''}
              data-active={!value || value === ''}
              onClick={() => handleSelect('')}
              className={`w-full px-3 py-2.5 rounded-xl text-left font-body-lg text-[14px] flex items-center justify-between transition-colors ${
                !value || value === ''
                  ? `${activeOptionBg} font-bold shadow-xs`
                  : 'text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg opacity-70">all_inclusive</span>
                <span>{anyLabel}</span>
              </div>
              {(!value || value === '') && (
                <span className="material-symbols-outlined text-base">check</span>
              )}
            </button>
          )}

          {/* Slot options */}
          {slots.map((slot) => {
            const isSelected = value === slot.value;
            return (
              <button
                key={slot.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-active={isSelected}
                onClick={() => handleSelect(slot.value)}
                className={`w-full px-3 py-2.5 rounded-xl text-left font-body-lg text-[14px] flex items-center justify-between transition-colors ${
                  isSelected
                    ? `${activeOptionBg} font-bold shadow-xs`
                    : 'text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? (isPrimary ? 'bg-primary' : 'bg-secondary') : 'bg-outline-variant'}`} />
                  <span className="truncate">{slot.label}</span>
                </div>
                {isSelected && (
                  <span className="material-symbols-outlined text-base shrink-0">check</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
