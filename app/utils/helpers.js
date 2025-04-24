/**
 * General utility and formatting helper functions.
 */

/**
 * Formats a timestamp into a relative time string (e.g., "Just now", "5m ago", "Yesterday").
 * @param {string | number | Date | null} timestamp - The timestamp to format.
 * @returns {string} The formatted relative time string, or 'Never' if timestamp is invalid/null.
 */
// REMOVE formatRelativeTime function
// export function formatRelativeTime(timestamp) {
//     if (!timestamp) return 'Never';
//     try {
//         const now = new Date();
//         const past = new Date(timestamp);
//         // Check if date is valid
//         if (isNaN(past.getTime())) {
//             throw new Error('Invalid date provided to formatRelativeTime');
//         }
//         const diffInSeconds = Math.floor((now - past) / 1000);
//         const diffInMinutes = Math.floor(diffInSeconds / 60);
//         const diffInHours = Math.floor(diffInMinutes / 60);
//         const diffInDays = Math.floor(diffInHours / 24);
// 
//         if (diffInSeconds < 0) {
//              return 'In the future'; // Or handle future dates as needed
//         } else if (diffInSeconds < 60) {
//             return 'Just now';
//         } else if (diffInMinutes < 60) {
//             return `${diffInMinutes}m ago`;
//         } else if (diffInHours < 24) {
//             return `${diffInHours}h ago`;
//         } else if (diffInDays === 1) {
//             return 'Yesterday';
//         } else if (diffInDays < 7) {
//             return `${diffInDays}d ago`;
//         } else {
//             // Fallback to simple date format for older dates
//             return past.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }); 
//         }
//     } catch (e) {
//         console.error("Error in formatRelativeTime:", e, "Timestamp:", timestamp);
//         return 'Invalid Date'; // Return an error indicator
//     }
// }

/**
 * Formats a date string into MM/DD/YY format.
 * @param {string | number | Date | null} dateString - The date input to format.
 * @returns {string | null} The formatted date string (MM/DD/YY), or null if the input is invalid.
 */
export function formatDateMMDDYY(dateString) {
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date provided to formatDateMMDDYY');
        }
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        return `${month}/${day}/${year}`;
    } catch (e) {
        console.error(`Error formatting date '${dateString}' in formatDateMMDDYY:`, e);
        return null; // Return null on error
    }
}

// Add other general helper functions here as needed 