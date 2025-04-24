// app/store/modules/lookups.js

import ZohoAPIService from '../../services/zohoCreatorAPI.js';
import DataProcessors from '../../utils/processors.js';
// Import constants
import {
  REPORT_STAGES,
  REPORT_TAGS,
  REPORT_USERS,
  REPORT_SALES_REPS,
  REPORT_SALES_ORGS,
  REPORT_TRANCHES,
  // Import other report names if needed
  // REPORT_EQUIPMENT,
  // REPORT_DOC_TYPES,
} from '../../config/constants.js';

// Ensure required globals are loaded
// if (typeof window.ZohoAPIService === 'undefined') {
//   throw new Error('ZohoAPIService is not loaded. Make sure zohoCreatorAPI.js is included before this file.');
// }
// if (typeof window.DataProcessors === 'undefined') {
//   throw new Error('DataProcessors is not loaded. Make sure processors.js is included before this file.');
// }
// if (typeof Vuex === 'undefined') { // Check for Vuex for mapState/mapGetters if used directly in components
//   console.warn('Vuex might not be loaded yet.');
// }


const lookupsModule = {
  namespaced: true,

  state: () => ({
    stages: [],
    tags: new Map(), // Key: Tag ID, Value: { name, color, category, description }
    users: [], // Array of user objects { id, name, email, ... }
    salesReps: [], // Added: Array of { id, name }
    salesOrgs: [], // Added: Array of { id, name }
    tranches: [], // Added for Tranche data
    // Add other lookups as needed based on dataSchema & old code review
    // equipment: {},
    // docTypes: [],
    // tranches: [],
    isLoading: false,
    error: null, // Stores error message if lookup fetching fails
  }),

  mutations: {
    SET_STAGES(state, stages) {
      state.stages = stages;
    },
    SET_TAGS(state, tagsMap) {
      state.tags = tagsMap;
    },
    SET_USERS(state, users) {
      state.users = users;
    },
    SET_SALES_REPS(state, reps) {
      state.salesReps = reps;
    },
    SET_SALES_ORGS(state, orgs) {
      state.salesOrgs = orgs;
    },
    SET_TRANCHES(state, tranches) {
        state.tranches = tranches;
    },
    // Add mutations for other lookups: SET_EQUIPMENT, SET_DOC_TYPES, SET_TRANCHES etc.

    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
  },

  actions: {
    /**
     * Fetches all required lookup data concurrently.
     */
    async fetchRequiredLookups({ commit }) {
      console.log("Lookups Store: Starting fetchRequiredLookups...");
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);

      // Use imported constants for report names
      const lookupsToFetch = {
        stages: REPORT_STAGES,
        tags: REPORT_TAGS,
        users: REPORT_USERS,
        salesReps: REPORT_SALES_REPS,
        salesOrgs: REPORT_SALES_ORGS,
        tranches: REPORT_TRANCHES,
        // Add other constants here:
        // equipment: REPORT_EQUIPMENT,
        // docTypes: REPORT_DOC_TYPES,
      };
      const lookupKeys = Object.keys(lookupsToFetch);

      try {
        const promises = lookupKeys.map(key => {
          const reportName = lookupsToFetch[key];
          console.log(`Lookups Store: Fetching ${key} from ${reportName}...`);
          return ZohoAPIService.getRecords(reportName) // No appName needed if same app
            .catch(err => {
              console.error(`Lookups Store: Failed to fetch ${key} from ${reportName}:`, err);
              return { _lookupError: true, key: key, error: err };
            });
        });

        const results = await Promise.all(promises);
        console.log("Lookups Store: Raw fetch results:", results);

        let encounteredError = false;
        let errorMessage = "Failed to load some lookup data: ";

        results.forEach((response, index) => {
          const key = lookupKeys[index];

          if (response._lookupError) {
            encounteredError = true;
            errorMessage += `${key} (${response.error.message || 'Unknown error'}); `;
            return; 
          }

          if (!response || response.code !== 3000) {
            encounteredError = true;
            const msg = response?.message || `API Error Code ${response?.code || 'N/A'}`;
            errorMessage += `${key} (${msg}); `;
            console.error(`Lookups Store: Zoho API error for ${key}:`, response);
            return; 
          }

          try {
            switch (key) {
              case 'stages':
                commit('SET_STAGES', DataProcessors.processStagesData(response));
                break;
              case 'tags':
                 const tagsMap = DataProcessors.processTagsData(response);
                 commit('SET_TAGS', tagsMap);
                 break;
              case 'users':
                // TODO: Create processUsersData in DataProcessors
                commit('SET_USERS', response.data || []); // Assuming processUsersData isn't ready yet
                break;
              case 'salesReps': 
                commit('SET_SALES_REPS', DataProcessors.processSalesRepsData(response));
                break;
              case 'salesOrgs': 
                commit('SET_SALES_ORGS', DataProcessors.processSalesOrgsData(response));
                break;
              case 'tranches':
                 commit('SET_TRANCHES', DataProcessors.processTranchesData(response));
                 break;
              // Add cases for other lookups (equipment, docTypes, tranches) using DataProcessors
              default:
                console.warn(`Lookups Store: No processing logic defined for key: ${key}`);
            }
             console.log(`Lookups Store: Successfully processed and committed ${key}.`);
          } catch (processingError) {
              encounteredError = true;
              errorMessage += `${key} (Processing Error: ${processingError.message}); `;
              console.error(`Lookups Store: Error processing data for ${key}:`, processingError);
          }
        });

        if (encounteredError) {
          // Throw a consolidated error message
          throw new Error(errorMessage);
        }

        console.log("Lookups Store: fetchRequiredLookups completed successfully.");

      } catch (error) {
        console.error("Lookups Store: Error in fetchRequiredLookups action:", error);
        commit('SET_ERROR', error.message || 'An unknown error occurred while fetching lookups.');
        // Re-throw the error so the calling action (e.g., fetchInitialData) knows about it
        throw error;
      } finally {
        commit('SET_LOADING', false);
        console.log("Lookups Store: Loading finished.");
      }
    },
  },

  getters: {
    // Simple getters for accessing state
    stages: (state) => state.stages,
    tagsMap: (state) => state.tags,
    // tagsList: (state) => Array.from(state.tags.values()), // Keep if needed elsewhere
    users: (state) => state.users, // Raw user list
    salesReps: (state) => state.salesReps, // Processed list: [{id, name}, ...]
    salesOrgs: (state) => state.salesOrgs, // Processed list: [{id, name}, ...]
    tranches: (state) => state.tranches, // Added getter for processed tranches
    isLoading: (state) => state.isLoading,
    error: (state) => state.error,

    // Specific Getters for Filters/Dropdowns
    getStageById: (state) => (id) => state.stages.find(s => s.id === id),
    getTagById: (state) => (id) => state.tags.get(id),
    getUserById: (state) => (id) => state.users.find(u => u.ID === id),
    
    // Format Sales Reps for BaseSelectMenu {value, label}
    salesRepsForFilter: (state) => {
        // Filter requires matching by name, so value should be name
        return state.salesReps.map(rep => ({ value: rep.name, label: rep.name }));
    },
    // Format Sales Orgs for BaseSelectMenu {value, label}
    salesOrgsForFilter: (state) => {
        // Filter requires matching by name, so value should be name
        return state.salesOrgs.map(org => ({ value: org.name, label: org.name }));
    },
    // Format Tags for BaseSelectMenu {value, label}
    tagsForFilter: (state) => {
        return Array.from(state.tags.entries()).map(([id, tag]) => ({ value: id, label: tag.name }));
    },

    // Added: Format Users for Impersonation Dropdown
    usersForImpersonationDropdown: (state) => {
        if (!state.users || state.users.length === 0) {
            return [];
        }
        return state.users
            .map(user => ({ 
                value: user.ID, // Use the actual Zoho Record ID as the value
                // Construct a robust label, falling back to email
                label: user?.Name?.zc_display_value || user?.Email || `User ID: ${user.ID}`
            }))
            // Filter out potential users without an ID (shouldn't happen with Zoho records)
            .filter(user => user.value)
            .sort((a, b) => a.label.localeCompare(b.label));
    }
  }
};

// Expose the module globally for registration in store.js
// window.AppStoreModules = window.AppStoreModules || {};
// window.AppStoreModules.lookups = lookupsModule; 
export default lookupsModule; 