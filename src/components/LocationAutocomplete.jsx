import React, { useState, useEffect, useRef } from 'react';
import { searchLocations } from '../services/locationService';

/**
 * RideSaathi Location Autocomplete Component
 * Uses Photon (OpenStreetMap geocoder) with typo tolerance & Lucknow bias.
 * Clean Material 3 styling matching RideSaathi's original theme.
 */
export const LocationAutocomplete = ({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Search location or landmark...',
  label,
  required = false,
  disabled = false,
  error,
  icon = 'location_on',
  variant = 'primary', // 'primary' (blue) or 'secondary' (green)
  id = 'location-autocomplete'
}) => {
  const [inputValue, setInputValue] = useState(typeof value === 'string' ? value : value?.label || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [apiError, setApiError] = useState(null);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync internal input value if external value prop changes from parent
  useEffect(() => {
    const formatted = typeof value === 'string' ? value : value?.label || '';
    if (formatted !== inputValue) {
      setInputValue(formatted);
    }
  }, [value]);

  // Click outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text);
    if (onChange) onChange(text);

    // Editing the input invalidates previously selected canonical location
    if (onSelect) onSelect(null);

    setApiError(null);
    setActiveIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (text.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    debounceTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const { locations, error: searchErr, aborted } = await searchLocations(text, controller.signal);

      if (!aborted) {
        setLoading(false);
        if (searchErr) {
          setApiError(searchErr);
          setSuggestions([]);
        } else {
          setSuggestions(locations || []);
          setApiError(null);
        }
      }
    }, 350); // 350ms debounce
  };

  const handleSelectSuggestion = (location) => {
    setInputValue(location.label);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setApiError(null);

    if (onChange) onChange(location.label);
    if (onSelect) onSelect(location);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;

      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[activeIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;

      default:
        break;
    }
  };

  const isPrimary = variant === 'primary';
  const iconColor = isPrimary ? 'text-primary' : 'text-secondary';
  const focusBorder = isPrimary ? 'focus:border-primary focus:ring-primary/20' : 'focus:border-secondary focus:ring-secondary/20';
  const activeBg = isPrimary ? 'bg-primary/10 text-primary font-semibold' : 'bg-secondary/15 text-secondary font-semibold';

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}

      {/* Input container */}
      <div className="relative">
        <span className={`material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-xl ${iconColor}`}>
          {icon}
        </span>

        <input
          id={id}
          ref={inputRef}
          type="text"
          autoComplete="off"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 && inputValue.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full h-[52px] pl-11 pr-10 rounded-xl border bg-surface-container-lowest font-body-lg text-on-surface outline-none transition-all shadow-sm ${focusBorder} focus:ring-2 ${
            error ? 'border-error' : 'border-outline-variant/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />

        {/* Right side loading spinner or clear button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {loading ? (
            <span className="material-symbols-outlined text-primary text-lg animate-spin">
              progress_activity
            </span>
          ) : inputValue ? (
            <button
              type="button"
              onClick={() => {
                setInputValue('');
                setSuggestions([]);
                setIsOpen(false);
                if (onChange) onChange('');
                if (onSelect) onSelect(null);
                inputRef.current?.focus();
              }}
              className="text-outline hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-high transition-colors"
              aria-label="Clear location"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Inline Validation / Error Message */}
      {error && (
        <p className="text-error text-xs font-semibold mt-1.5 ml-1 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </p>
      )}

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1.5 bg-surface-container-lowest/98 backdrop-blur-md rounded-2xl border border-outline-variant/40 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {apiError ? (
            <div className="p-4 text-center text-on-surface-variant text-body-sm">
              <span className="material-symbols-outlined text-outline text-2xl block mb-1">wifi_off</span>
              <p className="text-xs">{apiError}</p>
            </div>
          ) : suggestions.length === 0 && !loading ? (
            <div className="p-4 text-center text-on-surface-variant text-body-sm">
              <span className="material-symbols-outlined text-outline text-2xl block mb-1">location_off</span>
              <p className="text-xs font-bold text-on-surface">No locations found</p>
              <p className="text-[11px] text-outline mt-0.5">Try searching with a landmark or area name</p>
            </div>
          ) : (
            <div className="py-1.5 flex flex-col max-h-64 overflow-y-auto custom-scrollbar">
              {suggestions.map((loc, idx) => {
                const isActive = activeIndex === idx;
                return (
                  <button
                    key={loc.placeId || idx}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSelectSuggestion(loc)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full px-3.5 py-2.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                      isActive ? activeBg : 'hover:bg-surface-container-high'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl ${isActive ? 'bg-primary/20 text-primary' : 'bg-surface-container text-outline'} flex items-center justify-center shrink-0 mt-0.5`}>
                      <span className="material-symbols-outlined text-lg">
                        location_on
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-label-bold text-body-md text-on-surface font-bold truncate">
                        {loc.primaryText}
                      </div>
                      <div className="font-body-sm text-xs text-on-surface-variant truncate">
                        {loc.secondaryText}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* OpenStreetMap Attribution Footer */}
          <div className="px-3.5 py-1.5 bg-surface-container-low border-t border-outline-variant/30 flex items-center justify-between text-[10px] font-medium text-outline">
            <span>Location Suggestions</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">public</span>
              Powered by OpenStreetMap
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
