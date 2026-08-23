/**
 * Current date in Indian Standard Time (Asia/Kolkata, UTC+05:30) in YYYY-MM-DD format.
 */
export const getTodayDateIST = (referenceDate = new Date()) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(referenceDate);
  } catch (err) {
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(referenceDate.getTime() + istOffset);
    return istDate.toISOString().split('T')[0];
  }
};

/**
 * Returns current hours (0-23) and minutes (0-59) in Asia/Kolkata timezone.
 */
export const getCurrentTimeIST = (referenceDate = new Date()) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(referenceDate);
    const hourPart = parts.find(p => p.type === 'hour')?.value || '0';
    const minutePart = parts.find(p => p.type === 'minute')?.value || '0';
    let hour = parseInt(hourPart, 10);
    if (hour === 24) hour = 0; // Some engines output 24 for midnight
    const minute = parseInt(minutePart, 10);
    return { hour, minute };
  } catch (err) {
    return {
      hour: referenceDate.getHours(),
      minute: referenceDate.getMinutes()
    };
  }
};

/**
 * Generates 30-minute interval time slots.
 * If selectedDate is today, the list strictly starts from the CURRENT time slot onward (in IST).
 * If selectedDate is a future date, it lists all slots for the full 24-hour day.
 */
export const generateTimeSlotsForDate = (selectedDateStr) => {
  const slots = [];
  const todayStr = getTodayDateIST();
  const isToday = !selectedDateStr || selectedDateStr === todayStr;

  const { hour: currentHour, minute: currentMinute } = getCurrentTimeIST();

  // For today, enforce a minimum 15-minute lead time so offered slots are strictly upcoming:
  // e.g. at 3:10 AM -> first slot is 03:30 AM - 04:00 AM
  // e.g. at 3:31 AM -> first slot is 04:00 AM - 04:30 AM
  let startFromHour = isToday ? currentHour : 0;
  let startFromMinute = 0;

  if (isToday) {
    if (currentMinute < 15) {
      startFromMinute = 30;
    } else if (currentMinute < 45) {
      startFromHour = (currentHour + 1) % 24;
      startFromMinute = 0;
    } else {
      startFromHour = (currentHour + 1) % 24;
      startFromMinute = 30;
    }
  }

  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      // If today, skip all past slots
      if (isToday) {
        if (hour < startFromHour || (hour === startFromHour && minute < startFromMinute)) {
          continue;
        }
      }

      const startPeriod = hour >= 12 ? 'PM' : 'AM';
      const displayStartHour = hour % 12 === 0 ? 12 : hour % 12;
      const startTime = `${String(displayStartHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${startPeriod}`;

      // Calculate 30-minute end time
      let endHour = hour;
      let endMinute = minute + 30;
      if (endMinute >= 60) {
        endMinute = 0;
        endHour = (endHour + 1) % 24;
      }
      const endPeriod = endHour >= 12 ? 'PM' : 'AM';
      const displayEndHour = endHour % 12 === 0 ? 12 : endHour % 12;
      const endTime = `${String(displayEndHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')} ${endPeriod}`;

      const slotString = `${startTime} - ${endTime}`;
      slots.push({
        value: slotString,
        label: slotString,
        hour,
        minute
      });
    }
  }

  // Fallback if late at night
  if (slots.length === 0) {
    slots.push({
      value: '11:30 PM - 12:00 AM',
      label: '11:30 PM - 12:00 AM',
      hour: 23,
      minute: 30
    });
  }

  return slots;
};

/**
 * Returns the default starting slot for a given date.
 */
export const getDefaultTimeSlot = (selectedDateStr) => {
  const slots = generateTimeSlotsForDate(selectedDateStr);
  return slots[0]?.value || '09:00 AM - 09:30 AM';
};

/**
 * Parses ride_date and departure_time into a Date object representing the exact scheduled departure time.
 * Standardized on Asia/Kolkata (UTC+05:30) timezone.
 */
export const parseRideDateTime = (dateStr, timeStr) => {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }

  // Extract YYYY-MM-DD
  const dateMatch = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dateMatch) {
    console.warn(`[timeUtils] Invalid date format for ride: "${dateStr}"`);
    return null;
  }

  const [_, year, month, day] = dateMatch;

  if (!timeStr || typeof timeStr !== 'string' || !timeStr.trim()) {
    return null;
  }

  let timeToCheck = timeStr.trim();
  // If time interval (e.g. "02:30 AM - 03:00 AM"), use the END time of the interval for expiration
  if (timeToCheck.includes('-')) {
    const parts = timeToCheck.split('-');
    timeToCheck = parts[parts.length - 1].trim();
  }

  let hours = null;
  let minutes = 0;

  // 12-hour format: "08:30 AM", "8:30 PM", "8:30PM", "10:00 AM", "8:30 am"
  const match12 = timeToCheck.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (match12) {
    hours = parseInt(match12[1], 10);
    minutes = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
      console.warn(`[timeUtils] Invalid 12-hour time components: "${timeStr}"`);
      return null;
    }

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  } else {
    // 24-hour format: "14:30", "08:30", "14:30:00"
    const match24 = timeToCheck.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (match24) {
      hours = parseInt(match24[1], 10);
      minutes = parseInt(match24[2], 10);

      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.warn(`[timeUtils] Invalid 24-hour time components: "${timeStr}"`);
        return null;
      }
    }
  }

  if (hours === null) {
    console.warn(`[timeUtils] Could not parse departure time format: "${timeStr}"`);
    return null;
  }

  const pad = (n) => String(n).padStart(2, '0');
  const isoString = `${year}-${month}-${day}T${pad(hours)}:${pad(minutes)}:00+05:30`;
  const rideDate = new Date(isoString);

  if (isNaN(rideDate.getTime())) {
    console.warn(`[timeUtils] Invalid parsed Date object from: "${isoString}"`);
    return null;
  }

  return rideDate;
};

/**
 * Checks whether a ride's scheduled date AND departure time have passed.
 * Returns true if expired, false otherwise.
 * Includes a 45-minute grace period after the departure window before expiring.
 */
export const isRideExpired = (dateStr, timeStr) => {
  if (!dateStr) return false;

  try {
    const todayIST = getTodayDateIST();
    const cleanDate = typeof dateStr === 'string' ? dateStr.trim().split('T')[0] : '';

    // If date is before today in IST, it is expired regardless of time
    if (cleanDate && cleanDate < todayIST) {
      return true;
    }

    // If date is after today in IST, it is strictly in the future
    if (cleanDate && cleanDate > todayIST) {
      return false;
    }

    // If date is today, parse the departure time (end of interval window)
    const rideDateTime = parseRideDateTime(dateStr, timeStr);
    if (!rideDateTime) {
      // If time could not be parsed but date is today, keep active
      return false;
    }

    // 2-hour grace period after departure window before considering the ride completed
    const GRACE_PERIOD_MS = 2 * 60 * 60 * 1000;
    return Date.now() > (rideDateTime.getTime() + GRACE_PERIOD_MS);
  } catch (err) {
    console.error('[timeUtils] Error checking ride expiration:', err);
    return false;
  }
};

