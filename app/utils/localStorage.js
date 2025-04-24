/**
 * Local Storage Utility
 * Provides helper functions for saving and loading settings.
 */

// Define keys in one place
export const LS_KEYS = {
    COLLAPSED_COLUMNS: 'kanbanWidgetCollapsedColumns',
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
      const stringifiedValue = JSON.stringify(value);
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
      return JSON.parse(storedValue);
    } catch (error) {
      console.error(`Error loading or parsing setting '${key}' from local storage:`, error);
      return defaultValue; // Return default on error
    }
  }
  
  // Export the functions if using modules, or attach to a global object
  // export default { LS_KEYS, saveSetting, loadSetting }; // If preferred