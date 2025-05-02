/**
 * General utility and formatting helper functions.
 */

/**
 * Calculates an approximate install date (e.g., 2 months after sold date).
 * Keep this for now as VueUse doesn't have a direct equivalent.
 * @param {string | number | Date | null} soldDateString - The sold date.
 * @returns {Date | null} The calculated Date object, or null if input is invalid.
 */
export function calculateApproxInstallDate(soldDateString) {
    if (!soldDateString) return null;
    try {
        const date = new Date(soldDateString);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date provided to calculateApproxInstallDate');
        }
        date.setMonth(date.getMonth() + 2); // Add 2 months
        return date;
    } catch (e) {
        console.error(`Error calculating approx install date for '${soldDateString}':`, e);
        return null;
    }
}

/**
 * Calculates the number of days between a given date string and now.
 * @param {string | number | Date | null} dateString - The date input.
 * @returns {number | null} The number of days, or null if the input is invalid.
 */
export function calculateDaysSince(dateString) {
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date provided');
        }
        const now = new Date();
        // Reset time part for accurate day difference, consider timezone?
        date.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        const diffTime = now - date; // Get difference in milliseconds
        if (diffTime < 0) return 0; // If date is in the future, return 0 days since
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    } catch (e) {
        console.error(`Error calculating days since for '${dateString}':`, e);
        return null;
    }
}

/**
 * Validates and formats a phone number string, aiming for +1XXXXXXXXXX format.
 * @param {string | null | undefined} rawPhoneNumber - The raw input.
 * @returns {object} Object with `{ valid: boolean, formatted: string | null, error?: string }`.
 */
export function formatAndValidatePhoneNumber(rawPhoneNumber) {
    if (!rawPhoneNumber) {
        return { valid: true, formatted: null }; // Empty is valid, format as null
    }
    
    let cleaned = String(rawPhoneNumber).replace(/[^+0-9]/g, ''); // Remove non-digits except '+'

    if (!cleaned) {
            return { valid: true, formatted: null }; // Only non-digits provided, treat as empty
    }

    // Check for invalid '+' placement
    if (cleaned.lastIndexOf('+') > 0) {
        return { valid: false, error: 'Invalid characters.' };
    }
    
    let digits = cleaned.replace('+', ''); // Remove plus for length checks
    let hasPlus = cleaned.startsWith('+');

    if (hasPlus) {
        if (digits.startsWith('1') && digits.length === 11) {
                // Already formatted correctly (+1xxxxxxxxxx)
                return { valid: true, formatted: `+${digits}` };
        } else if (digits.length === 10) {
            // Allow + followed by 10 digits, assume +1 was intended?
            console.warn("Assuming +1 for number starting with +");
            return { valid: true, formatted: `+1${digits}` };
        } else {
                // Other + formats are invalid for this simple validation
                return { valid: false, error: 'Invalid format/length after +.' };
        }
    } else { // No plus provided
        if (digits.length === 10) {
                // Assume US/Canada, prepend +1
                return { valid: true, formatted: `+1${digits}` };
        } else if (digits.length === 11 && digits.startsWith('1')) {
                // Missing the plus
                return { valid: true, formatted: `+${digits}` };
        } else {
                // Incorrect length
                return { valid: false, error: 'Must be 10 digits (or 11 if starting with 1).' };
        }
    }
}

/**
 * Generates initials from a name string.
 * @param {string | null | undefined} name - The name to get initials from.
 * @returns {string} A 1 or 2 character string of initials, or '??' if name is invalid.
 */
export function getInitials(name) {
    if (!name) return '??';
    const nameParts = name.trim().split(' ');
    if (nameParts.length >= 2) {
        // Take first letter of first and last part
        const firstInitial = nameParts[0][0] || '';
        const lastInitial = nameParts[nameParts.length - 1][0] || '';
        return (firstInitial + lastInitial).toUpperCase();
    } else if (name.length > 0) {
        // Take first two letters if only one part
        return name.substring(0, 2).toUpperCase();
    }
    return '??'; // Fallback
}

/**
 * Formats a number as a USD currency string.
 * @param {number | string | null | undefined} amount - The numeric value to format.
 * @returns {string} The formatted currency string (e.g., "$1,234.50"), or "$0.00" if input is invalid.
 */
export function formatCurrency(amount) {
    const number = Number(amount);
    if (isNaN(number)) {
        console.warn(`Invalid input provided to formatCurrency: ${amount}`);
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(0);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(number);
}

/**
 * Formats a number with commas and optional decimal places.
 * @param {number | string | null | undefined} value - The value to format.
 * @param {number} [decimals=0] - Number of decimal places.
 * @returns {string} Formatted number string or 'N/A'/'Invalid'.
 */
export function formatNumber(value, decimals = 0) {
    if (value === null || value === undefined || value === '') return 'N/A';
    const num = Number(value);
    if (isNaN(num)) return 'Invalid';
    return num.toLocaleString('en-US', { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
    });
}

/**
 * Formats a potential date string (MM/DD/YY or YYYY-MM-DD or ISO) into YYYY-MM-DD for HTML date inputs.
 * @param {string | null | undefined} dateString - The input date string.
 * @returns {string} Date in YYYY-MM-DD format, or empty string if invalid.
 */
export function formatDateForInput(dateString) {
    if (!dateString) return '';
    try {
        // First, try parsing assuming MM/DD/YY
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const year = parseInt(parts[2], 10);
            const fullYear = year < 70 ? 2000 + year : 1900 + year;
            const month = parts[0].padStart(2, '0');
            const day = parts[1].padStart(2, '0');
            const date = new Date(`${fullYear}-${month}-${day}T00:00:00`); // Avoid timezone issues
            if (!isNaN(date.getTime())) {
                return `${fullYear}-${month}-${day}`;
            }
        }
        // If MM/DD/YY failed, try general parsing (handles YYYY-MM-DD, ISO)
        const generalDate = new Date(dateString);
        if (!isNaN(generalDate.getTime())) {
            return generalDate.toISOString().split('T')[0];
        }
        console.warn('Could not parse date string for input:', dateString);
        return ''; // Return empty if all parsing fails
    } catch (error) { 
        console.error('Error in formatDateForInput:', error);
        return ''; 
    }
}

/**
 * Formats a date value (Date object, ISO string, YYYY-MM-DD) into MM/dd/yy HH:mm:ss format for Zoho API.
 * @param {string | Date | null | undefined} dateValue - The input date value.
 * @returns {string | null} Date string in MM/dd/yy HH:mm:ss format, or null if input is invalid.
 */
export function formatDateTimeForAPI(dateValue) {
    if (!dateValue) return null;
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
             console.warn('Invalid dateValue passed to formatDateTimeForAPI:', dateValue);
            return null;
        }
        
        // Get components
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const day = String(date.getDate()).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2); // Get last two digits of year
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
        console.error('Error in formatDateTimeForAPI:', error);
        return null;
    }
}

/**
 * Formats a phone number string for display (e.g., (XXX) XXX-XXXX).
 * Handles common formats like +1XXXXXXXXXX, XXXXXXXXXX.
 * @param {string | null | undefined} phoneNumber - The raw phone number string.
 * @returns {string} The formatted phone number, or the original string if formatting fails.
 */
export function formatDisplayPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    const cleaned = String(phoneNumber).replace(/\D/g, ''); // Remove non-digits
    
    // Handle +1 format
    if (cleaned.startsWith('1') && cleaned.length === 11) {
        const match = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
    }
    // Handle 10-digit format
    else if (cleaned.length === 10) {
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
    }
    
    // Fallback to original string if formatting fails
    console.warn(`Could not format phone number for display: ${phoneNumber}`);
    return phoneNumber; 
}

// Add other general helper functions here as needed 