// app/store/modules/user.js

import ZohoAPIService from '../../services/zohoCreatorAPI.js';
// Import constants
import {
  REPORT_USERS,
  FIELD_USER_EMAIL,
  FIELD_USER_NAME,
  FIELD_USER_ROLE,
  // Add other relevant user field constants if needed
} from '../../config/constants.js';

// Ensure required globals are loaded
// if (typeof window.ZohoAPIService === 'undefined') {
//   throw new Error('ZohoAPIService is not loaded. Make sure zohoCreatorAPI.js is included before this file.');
// }
// DataProcessors might be needed if we create a specific user processor later
// if (typeof window.DataProcessors === 'undefined') {
//   throw new Error('DataProcessors is not loaded. Make sure processors.js is included before this file.');
// }

const userModule = {
  namespaced: true,

  state: () => ({
    currentUser: null, // Will store the full user object { id, name, email, role, etc. }
    originalUser: null, // Added: Stores the initially logged-in user
    isImpersonating: false, // Added: Flag for impersonation status
    isLoading: false,
    error: null, // Stores error message if user fetching fails
  }),

  mutations: {
    SET_CURRENT_USER(state, user) {
      state.currentUser = user;
      // If the user being set IS the original user, ensure impersonation is off
      if (state.originalUser && user?.id === state.originalUser.id) {
          state.isImpersonating = false;
      }
    },
    SET_ORIGINAL_USER(state, user) { // Added mutation
        state.originalUser = user;
    },
    SET_IS_IMPERSONATING(state, status) { // Added mutation
        state.isImpersonating = status;
    },
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
  },

  actions: {
    /**
     * Fetches the details of the currently logged-in user.
     * Stores both current and original user on initial load.
     */
    async fetchCurrentUser({ commit, rootState }) {
      console.log("User Store: Starting fetchCurrentUser...");
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      commit('SET_CURRENT_USER', null);
      commit('SET_ORIGINAL_USER', null); // Clear original user initially
      commit('SET_IS_IMPERSONATING', false); // Ensure impersonation is off

      let initialUser = null; // Define outside try block

      try {
        // 1. Get Init Params for email
        const initParams = await ZohoAPIService.getInitParams();
        const userEmail = initParams?.loginUser;

        if (!userEmail) {
          throw new Error("Could not determine logged-in user email from init params.");
        }
        console.log(`User Store: Found user email: ${userEmail}`);

        // 2. Access the users list from the lookups module state
        const allUsers = rootState.lookups?.users || [];
        if (allUsers.length === 0) {
            console.warn("User Store: Lookups.users array is empty when trying to find current user. Lookups might not be ready yet.");
            // Fallback scenario 1: Lookups failed or empty
            throw new Error("User list from lookups module is not available or empty."); // Still treat this as an error for now
        }

        // Find the user by email (case-insensitive comparison is safer)
        const loggedInUserRecord = allUsers.find(
            user => user[FIELD_USER_EMAIL]?.toLowerCase() === userEmail.toLowerCase()
        );

        if (!loggedInUserRecord) {
           // Fallback scenario 2: User email not in the fetched list
           console.warn(`User Store: User record not found in '${REPORT_USERS}' for email ${userEmail}. Creating fallback user object.`);
           initialUser = {
               id: `fallback-${userEmail}`, // Create a somewhat unique fallback ID
               email: userEmail,
               name: userEmail, 
               firstName: '',
               lastName: '',
               phone: '',
               role: 'Unknown', 
               salesRepLookup: '',
               profilePicture: '',
               isFallback: true 
           };
           console.log("User Store: Created fallback user:", initialUser);
        } else {
            // 3. Process user data normally if found
            console.log("User Store: Found user data from lookups:", loggedInUserRecord);
            initialUser = {
                id: loggedInUserRecord.ID, // System field
                email: loggedInUserRecord[FIELD_USER_EMAIL], // Use constant
                name: loggedInUserRecord[FIELD_USER_NAME]?.zc_display_value || '', // Use constant
                firstName: loggedInUserRecord[FIELD_USER_NAME]?.first_name || '',
                lastName: loggedInUserRecord[FIELD_USER_NAME]?.last_name || '',
                phone: loggedInUserRecord.Phone_Number || '', // Add constant if available
                role: loggedInUserRecord[FIELD_USER_ROLE] || '', // Use constant
                salesRepLookup: loggedInUserRecord.Sales_Rep_Lookup?.ID || '', // Add constant if available
                profilePicture: loggedInUserRecord.Profile_Picture || '', // Add constant if available
                isFallback: false
            };
            console.log("User Store: Processed initial user:", initialUser);
        }

        // Commit the initial user to BOTH currentUser and originalUser
        commit('SET_CURRENT_USER', initialUser);
        commit('SET_ORIGINAL_USER', initialUser);
        commit('SET_IS_IMPERSONATING', false); // Explicitly set false
        console.log("User Store: fetchCurrentUser completed.");

      } catch (error) {
        // Catch errors from getInitParams or if lookups were empty
        console.error("User Store: Error in fetchCurrentUser action:", error);
        commit('SET_ERROR', error.message || 'An unknown error occurred while fetching user details.');
        // Re-throw error for the root action to catch - prevents app load if critical error occurs
        throw error; 
      } finally {
        commit('SET_LOADING', false);
        console.log("User Store: Loading finished.");
      }
    },

    /**
     * Sets the currentUser to the user with the given ID for impersonation.
     */
    impersonateUser({ commit, state, rootState, dispatch }, userId) {
        console.log(`User Store: Attempting to impersonate user ID: ${userId}`);
        if (!state.originalUser) {
            console.error("User Store: Cannot impersonate, original user not set.");
            return; // Should not happen if fetchCurrentUser ran
        }

        // Check if reverting
        if (!userId || userId === state.originalUser.id) {
            dispatch('revertImpersonation');
            return;
        }

        const allUsers = rootState.lookups?.users || [];
        const targetUserRecord = allUsers.find(user => user.ID === userId);

        if (!targetUserRecord) {
            console.error(`User Store: Target user ID ${userId} not found in lookups.`);
            // Optionally dispatch a notification
            return;
        }

        // Process the target user data (similar to fetchCurrentUser)
        const targetUser = {
            id: targetUserRecord.ID,
            email: targetUserRecord[FIELD_USER_EMAIL],
            name: targetUserRecord[FIELD_USER_NAME]?.zc_display_value || '',
            firstName: targetUserRecord[FIELD_USER_NAME]?.first_name || '',
            lastName: targetUserRecord[FIELD_USER_NAME]?.last_name || '',
            phone: targetUserRecord.Phone_Number || '',
            role: targetUserRecord[FIELD_USER_ROLE] || '',
            salesRepLookup: targetUserRecord.Sales_Rep_Lookup?.ID || '',
            profilePicture: targetUserRecord.Profile_Picture || '',
            isFallback: false // Impersonated user is always considered 'real'
        };

        console.log("User Store: Impersonating user:", targetUser);
        commit('SET_CURRENT_USER', targetUser);
        commit('SET_IS_IMPERSONATING', true);
    },

    /**
     * Reverts impersonation back to the original user.
     */
    revertImpersonation({ commit, state }) {
        console.log("User Store: Reverting impersonation...");
        if (state.originalUser) {
            commit('SET_CURRENT_USER', state.originalUser);
            commit('SET_IS_IMPERSONATING', false);
            console.log("User Store: Impersonation reverted to:", state.originalUser);
        } else {
            console.error("User Store: Cannot revert impersonation, original user data missing.");
        }
    }
  },

  getters: {
    // Simple getters
    currentUser: (state) => state.currentUser,
    originalUser: (state) => state.originalUser, // Added getter
    isImpersonating: (state) => state.isImpersonating, // Added getter
    isLoading: (state) => state.isLoading,
    error: (state) => state.error,
    userId: (state) => state.currentUser?.id || null,
    userEmail: (state) => state.currentUser?.email || null,
    userName: (state) => state.currentUser?.name || 'Guest',
    userRole: (state) => state.currentUser?.role || 'Unknown',

    // Check if the current user is the admin
    isAdmin: (state) => {
        // Admin check should probably be based on the ORIGINAL user's email
        // to prevent impersonated users gaining admin dev tool access?
        // Or maybe it's fine for dev tools? Let's base it on original for safety.
        return state.originalUser?.email?.toLowerCase() === 'admin@dcnexgen.com';
    },
  }
};

// Expose the module globally for registration in store.js
// window.AppStoreModules = window.AppStoreModules || {};
// window.AppStoreModules.user = userModule; 
export default userModule; 