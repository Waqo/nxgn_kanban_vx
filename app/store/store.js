import lookupsModule from './modules/lookups.js';
import userModule from './modules/user.js';
import projectsModule from './modules/projects.js';
import uiModule from './modules/ui.js';

// Check if Vuex is loaded
if (typeof Vuex === 'undefined') {
  throw new Error('Vuex is not loaded. Make sure to include the Vuex CDN script before this file.');
}

// --- Remove Placeholder Modules --- 
// Placeholder for modal module (keep until created)
const modalModulePlaceholder = {
  namespaced: true,
  state: () => ({ isVisible: false, currentProjectId: null, activeTab: 'overview', isLoading: false }),
  mutations: {},
  actions: {},
  getters: {},
};
// Remove ui module placeholder

// Removed global checks for window.AppStoreModules

// --- Create Vuex Store ---

const store = Vuex.createStore({
  // Root state, mutations, actions, getters
  state: () => ({ 
     appInitialized: false, 
  }),
  mutations: {
    SET_APP_INITIALIZED(state, initialized) {
        state.appInitialized = initialized;
    }
  },
  actions: {
    /**
     * Root action to fetch all essential initial data for the application.
     * Dispatches actions in respective modules.
     * Handles overall loading and error state for initialization.
     * Ensures lookups are fetched before user/projects that might depend on them.
     */
    async fetchInitialData({ commit, dispatch, state }) {
      // Prevent re-fetching if already initialized (optional)
      if (state.appInitialized) {
         console.log("Root Store: Already initialized, skipping fetchInitialData.");
         return;
      }

      console.log("Root Store: Starting fetchInitialData...");
      commit('ui/SET_GLOBAL_LOADING', true, { root: true });
      commit('ui/SET_GLOBAL_ERROR', null, { root: true });
      commit('SET_APP_INITIALIZED', false);

      try {
          // --- Step 1: Fetch Lookups --- 
          // Lookups are often needed by other data processing, so fetch them first.
          console.log("Root Store: Dispatching fetchRequiredLookups...");
          await dispatch('lookups/fetchRequiredLookups', null, { root: true });
          console.log("Root Store: fetchRequiredLookups completed.");

          // --- Step 2: Fetch User and Projects (can run concurrently) ---
          console.log("Root Store: Dispatching fetchCurrentUser and fetchInitialProjects...");
          const actionsToDispatch = [];
          // No need for hasModule checks if modules are imported
          actionsToDispatch.push(dispatch('user/fetchCurrentUser', null, { root: true }));
          actionsToDispatch.push(dispatch('projects/fetchInitialProjects', null, { root: true }));
                  
          await Promise.all(actionsToDispatch);
          console.log("Root Store: fetchCurrentUser and fetchInitialProjects completed.");
          
          commit('SET_APP_INITIALIZED', true);

      } catch (error) {
        // Error could be from lookups or user/projects fetch
        console.error("Root Store: Error during fetchInitialData sequence:", error);
        commit('ui/SET_GLOBAL_ERROR', `Initialization failed: ${error.message || 'Unknown error'}`, { root: true });
        commit('SET_APP_INITIALIZED', false);
      } finally {
        commit('ui/SET_GLOBAL_LOADING', false, { root: true });
        console.log("Root Store: fetchInitialData finished.");
      }
    },
  },
  getters: {},

  // Register Modules
  modules: {
    lookups: lookupsModule,
    user: userModule,
    projects: projectsModule,
    ui: uiModule,
    // Keep placeholder for modal module
    modal: modalModulePlaceholder,
  },

  // Enable strict mode in development for debugging (optional)
  // strict: true, // Vuex 4 doesn't use process.env directly
});

// Expose the store globally for access in App.js and components
// window.store = store;
// console.log("Vuex Store created and exposed globally."); 
export default store; 