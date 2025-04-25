// app/store/uiStore.js

// Access Pinia and Vue globals
const { defineStore } = Pinia;
const { ref } = Vue; // We might need ref if we switch to setup store later, good practice to import

// --- ADD localStorage Utils ---
import { LS_KEYS, saveSetting, loadSetting } from '../utils/localStorage.js';
// --- ADD Constants ---
import {
    DEFAULT_KANBAN_STAGE_VIEW,
    DEFAULT_KANBAN_BOARD_MODE
} from '../config/constants.js';

// Default Stage View
// const DEFAULT_STAGE_VIEW = 'all'; // Remove local definition

export const useUiStore = defineStore('ui', {
  // State: Equivalent to Vuex state function
  state: () => ({
    isGloballyLoading: false,
    globalError: null,
    notifications: [], // Array of notification objects { id, type, title?, message, duration? }
    currentStageView: loadSetting(LS_KEYS.BOARD_STAGE_VIEW, DEFAULT_KANBAN_STAGE_VIEW), // Use imported constant
    boardViewMode: DEFAULT_KANBAN_BOARD_MODE, // Use imported constant
    nextNotificationId: 1
  }),

  // Getters: Equivalent to Vuex getters
  getters: {
    // No changes needed for simple getters accessing state
    // isGloballyLoading: (state) => state.isGloballyLoading, // Can be omitted, accessed directly
    // globalError: (state) => state.globalError, // Can be omitted
    // currentStageView: (state) => state.currentStageView, // Can be omitted
    // boardViewMode: (state) => state.boardViewMode, // Can be omitted

    // Getter for notifications (same as state property, but explicit if preferred)
    activeNotifications: (state) => state.notifications,
  },

  // Actions: Equivalent to Vuex actions, but modify state directly
  actions: {
    setGlobalLoading(isLoading) {
      this.isGloballyLoading = isLoading;
    },
    setGlobalError(error) {
      this.globalError = error;
    },
    addNotification(notification) {
      // Use provided ID if it exists, otherwise generate one
      const idToUse = notification.id ?? this.nextNotificationId++;
      this.notifications.push({
        ...notification,
        id: idToUse
      });
      // Ensure nextNotificationId doesn't collide if a high manual ID was passed
      if (typeof notification.id === 'number' && notification.id >= this.nextNotificationId) {
          this.nextNotificationId = notification.id + 1;
      }
    },
    removeNotification(notificationId) {
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
    },
    clearNotifications() {
        this.notifications = [];
    },
    setStageView(view) {
        if (['all', 'sales', 'install'].includes(view)) {
            this.currentStageView = view;
            // --- Save updated stage view to localStorage ---
            saveSetting(LS_KEYS.BOARD_STAGE_VIEW, view);
            // console.log(`UI Store (Pinia): Stage view set to -> ${view}`);
        } else {
            console.warn(`UI Store (Pinia): Invalid stage view provided: ${view}. Keeping ${this.currentStageView}.`);
        }
    },
    setBoardViewMode(mode) {
        if (['stages', 'tranches'].includes(mode)) {
            this.boardViewMode = mode;
            // console.log(`UI Store (Pinia): Board view mode set to -> ${mode}`);
        } else {
            console.warn(`UI Store (Pinia): Invalid board view mode provided: ${mode}. Keeping ${this.boardViewMode}.`);
        }
    }
    // Note: We don't need explicit SET_ mutations anymore.
  }
});

// Optional: Export the store directly if preferred for easier import elsewhere
// export default useUiStore; // uncomment if needed 