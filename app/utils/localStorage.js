/**
 * Local Storage Utility
 * Provides helper functions for saving and loading settings.
 */

// Define keys in one place
export const LS_KEYS = {
    COLLAPSED_COLUMNS: 'kanbanWidgetCollapsedColumns',
    ACTIVE_MODAL: 'kanbanWidgetActiveModal',
    TOOLBAR_SORT: 'kanbanWidgetToolbarSort',
    BOARD_STAGE_VIEW: 'kanbanWidgetBoardStageView',
    USER_PROFILE: 'currentUserProfile',
    // Add other keys here later, e.g.:
    // TOOLBAR_FILTERS: 'kanbanWidgetToolbarFilters',
    // TOOLBAR_SORT: 'kanbanWidgetToolbarSort',
    // BOARD_VIEW_MODE: 'kanbanWidgetBoardViewMode'
  };
  
  /**
   * Saves a setting to local storage after JSON stringifying it.
   * @param {string} key - The key to save under (use LS_KEYS).
   * @param {*} value - The value to save (will be stringified).
   */
  export function saveSetting(key, value) {
    try {
      let valueToStore;
      // --- Add Expiration Logic for User Profile ---
      if (key === LS_KEYS.USER_PROFILE) {
        const expirationMs = 60 * 60 * 1000; // 1 hour
        valueToStore = {
          data: value,
          expiresAt: Date.now() + expirationMs
        };
      } else {
        // Store other settings directly
        valueToStore = value;
      }
      // --- End Expiration Logic ---
      const stringifiedValue = JSON.stringify(valueToStore);
      localStorage.setItem(key, stringifiedValue);
    } catch (error) {
      console.error(`Error saving setting '${key}' to local storage:`, error);
      // Optionally dispatch a notification?
    }
  }
  
  /**
   * Loads a setting from local storage, parsing it from JSON.
   * @param {string} key - The key to load from (use LS_KEYS).
   * @param {*} defaultValue - The value to return if the key is not found or parsing fails.
   * @returns {*} The loaded and parsed value, or the defaultValue.
   */
  export function loadSetting(key, defaultValue) {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue === null) {
        return defaultValue; // Key not found
      }
      
      const parsedValue = JSON.parse(storedValue);

      // --- Add Expiration Check for User Profile ---
      if (key === LS_KEYS.USER_PROFILE) {
        if (
          parsedValue &&
          typeof parsedValue === 'object' &&
          parsedValue.hasOwnProperty('data') &&
          parsedValue.hasOwnProperty('expiresAt') &&
          typeof parsedValue.expiresAt === 'number' &&
          parsedValue.expiresAt > Date.now()
        ) {
          // Cache is valid and not expired, return the data part
          return parsedValue.data;
        } else {
          // Cache is invalid, expired, or doesn't match expected structure
          console.log(`LocalStorage: Cached user profile for key '${key}' is invalid or expired.`);
          localStorage.removeItem(key); // Clean up invalid/expired cache
          return defaultValue;
        }
      } else {
        // Return parsed value directly for other settings
        return parsedValue;
      }
      // --- End Expiration Check ---

    } catch (error) {
      console.error(`Error loading or parsing setting '${key}' from local storage:`, error);
      return defaultValue; // Return default on error
    }
  }
  
  // Export the functions if using modules, or attach to a global object
  // export default { LS_KEYS, saveSetting, loadSetting }; // If preferred