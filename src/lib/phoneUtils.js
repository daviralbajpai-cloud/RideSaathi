/**
 * RideSaathi Phone Number Validation and Formatting Utility
 */

export const validatePhoneNumber = (rawPhone) => {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return {
      isValid: false,
      digits: '',
      formatted: '',
      error: 'Phone number is required.'
    };
  }

  const cleaned = rawPhone.trim();
  const digitsOnly = cleaned.replace(/\D/g, '');

  let nationalDigits = '';

  // If exactly 10 digits directly
  if (digitsOnly.length === 10) {
    nationalDigits = digitsOnly;
  }
  // If 11 digits starting with '0' (e.g. 09876543210)
  else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    nationalDigits = digitsOnly.slice(1);
  }
  // If 12 digits starting with '91' (e.g. 919876543210 or +919876543210)
  else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    nationalDigits = digitsOnly.slice(2);
  } else {
    return {
      isValid: false,
      digits: digitsOnly,
      formatted: cleaned,
      error: 'Please enter a valid 10-digit phone number.'
    };
  }

  // Check that the remaining number is exactly 10 numeric digits
  if (nationalDigits.length !== 10) {
    return {
      isValid: false,
      digits: nationalDigits,
      formatted: cleaned,
      error: 'Please enter a valid 10-digit phone number.'
    };
  }

  // Format cleanly as +91 XXXXX XXXXX
  const formatted = `+91 ${nationalDigits.slice(0, 5)} ${nationalDigits.slice(5)}`;

  return {
    isValid: true,
    digits: nationalDigits,
    formatted,
    error: null
  };
};
