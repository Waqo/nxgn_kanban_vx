const uiModule = {
  namespaced: true,

  state: () => ({
    isGloballyLoading: false, // Tracks major loading states like initial app load
    globalError: null, // Holds critical app-level error messages
    notifications: [], // Array to hold active notifications
    currentStageView: 'all', // Added state for stage view ('all', 'sales', 'install')
    boardViewMode: 'stages', // Added: 'stages' or 'tranches'
    nextNotificationId: 1 // Simple ID generator
  }),

  mutations: {
    SET_GLOBAL_LOADING(state, isLoading) {
      state.isGloballyLoading = isLoading;
    },
    SET_GLOBAL_ERROR(state, error) {
      // Can store error message string or an error object
      state.globalError = error;
    },
    ADD_NOTIFICATION(state, notification) {
      // Use provided ID if it exists, otherwise generate one
      const idToUse = notification.id ?? state.nextNotificationId++;
      state.notifications.push({
        ...notification,
        id: idToUse // Use the determined ID
      });
      // Ensure nextNotificationId doesn't collide if a high manual ID was passed (edge case)
      if (typeof notification.id === 'number' && notification.id >= state.nextNotificationId) {
          state.nextNotificationId = notification.id + 1;
      }
    },
    REMOVE_NOTIFICATION(state, notificationId) {
      state.notifications = state.notifications.filter(n => n.id !== notificationId);
    },
    CLEAR_NOTIFICATIONS(state) {
        state.notifications = [];
    },
    SET_STAGE_VIEW(state, view) { // Added mutation
        if (['all', 'sales', 'install'].includes(view)) {
            state.currentStageView = view;
            console.log(`UI Store: Stage view set to -> ${view}`);
        } else {
            console.warn(`UI Store: Invalid stage view provided: ${view}. Keeping ${state.currentStageView}.`);
        }
    },
    SET_BOARD_VIEW_MODE(state, mode) { // Added mutation
        if (['stages', 'tranches'].includes(mode)) {
            state.boardViewMode = mode;
            console.log(`UI Store: Board view mode set to -> ${mode}`);
        } else {
            console.warn(`UI Store: Invalid board view mode provided: ${mode}. Keeping ${state.boardViewMode}.`);
        }
    }
  },

  actions: {
    /**
     * Adds a notification to the global list.
     * @param {object} notification - Notification object
     * @param {string} notification.type - success, error, warning, info
     * @param {string} [notification.title] - Optional title
     * @param {string} notification.message - Main notification message
     * @param {number} [notification.duration=5000] - Duration in ms (0 for persistent)
     */
    addNotification({ commit }, notification) {
      commit('ADD_NOTIFICATION', notification);
    },
    /**
     * Removes a notification by its ID.
     * @param {number} notificationId - The ID of the notification to remove.
     */
    removeNotification({ commit }, notificationId) {
      commit('REMOVE_NOTIFICATION', notificationId);
    },
    setStageView({ commit }, view) { // Added action
        commit('SET_STAGE_VIEW', view);
    },
    setBoardViewMode({ commit }, mode) { // Added action
        commit('SET_BOARD_VIEW_MODE', mode);
    }
    // Could add actions like clearGlobalError, etc.
  },

  getters: {
    isGloballyLoading: (state) => state.isGloballyLoading,
    globalError: (state) => state.globalError,
    notifications: (state) => state.notifications,
    currentStageView: (state) => state.currentStageView, // Added getter
    boardViewMode: (state) => state.boardViewMode, // Added getter
    activeNotifications: (state) => state.notifications
  }
};

export default uiModule; 