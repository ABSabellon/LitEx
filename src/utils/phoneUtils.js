/**
 * Format Philippines phone number to international format
 * Converts input formats like 09XXXXXXXXX or 9XXXXXXXXX to +639XXXXXXXXX
 * 
 * @param {string} phone - The phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhilippinesNumber = (phone) => {
  // Return if empty
  if (!phone) return phone;

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check if it starts with '09' (Philippines format)
  if (digitsOnly.startsWith('09') && digitsOnly.length >= 11) {
    // Convert 09xxxxxxxxx to +639xxxxxxxxx
    return '+63' + digitsOnly.substring(1);
  }
  // Check if it starts with '9' (abbreviated Philippines format)
  else if (digitsOnly.startsWith('9') && digitsOnly.length >= 10) {
    // Convert 9xxxxxxxxx to +639xxxxxxxxx
    return '+639' + digitsOnly.substring(1);
  }
  // Already has country code or other format
  return phone;
};

/**
 * Validate a Philippines mobile number
 * Accepts formats: 09XXXXXXXXX, 9XXXXXXXXX, +639XXXXXXXXX, 639XXXXXXXXX
 * 
 * @param {string} phone - The phone number to validate
 * @returns {boolean} Whether the phone number is a valid Philippines number
 */
export const isValidPhilippinesNumber = (phone) => {
  if (!phone) return false;
  
  const digitsOnly = phone.replace(/\D/g, '');
  
  return (
    (digitsOnly.startsWith('09') && digitsOnly.length === 11) || 
    (digitsOnly.startsWith('9') && digitsOnly.length === 10) ||
    (digitsOnly.startsWith('639') && digitsOnly.length === 12) ||
    (phone.startsWith('+639') && digitsOnly.length === 12)
  );
};