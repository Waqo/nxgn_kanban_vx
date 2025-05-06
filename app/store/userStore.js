import ZohoAPIService from '../services/zohoCreatorAPI.js';
// Import constants
import {
  FIELD_USER_EMAIL,
  FIELD_USER_NAME,
  FIELD_USER_ROLE,
  REPORT_USERS,
  ADMIN_USER_EMAIL, // Import admin email constant
  // Add other relevant user field constants if needed
} from '../config/constants.js';

// Import Pinia lookups store (needed for impersonation)
import { useLookupsStore } from './lookupsStore.js';

// Access Pinia global
const { defineStore } = Pinia;
// --- ADD localStorage Utils ---
import { LS_KEYS, loadSetting, saveSetting } from '../utils/localStorage.js';

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null, 
    originalUser: null, 
    isImpersonating: false, 
    isLoading: false,
    error: null, 
  }),

  getters: {
    // Simple getters can often be accessed directly from state
    userId: (state) => state.currentUser?.id || null,
    userEmail: (state) => state.currentUser?.email || null,
    userName: (state) => state.currentUser?.name || 'Guest',
    userRole: (state) => state.currentUser?.role || 'Unknown',

    // isAdmin needs access to originalUser state
    isAdmin: (state) => {
        return state.originalUser?.email?.toLowerCase() === ADMIN_USER_EMAIL.toLowerCase(); // Use imported constant
    },
  },

  actions: {
    // Internal helper action to set user state (replaces mutations)
    _setUserState(user) {
      this.currentUser = user;
      // If the user being set IS the original user, ensure impersonation is off
      if (this.originalUser && user?.id === this.originalUser.id) {
          this.isImpersonating = false;
      }
    },
    _setOriginalUser(user) {
        this.originalUser = user;
    },
    _setIsImpersonating(status) {
        this.isImpersonating = status;
    },
    _setLoading(isLoading) {
        this.isLoading = isLoading;
    },
    _setError(error) {
        this.error = error;
    },
    
    // Main public actions
    async fetchCurrentUser() {
      // console.log("User Store (Pinia): Starting fetchCurrentUser...");
      
      // --- Load from Cache First ---
      const cachedUser = loadSetting(LS_KEYS.USER_PROFILE, null);
      if (cachedUser) {
        console.log("User Store (Pinia): Found cached user profile, loading initial state.", cachedUser);
        this._setUserState(cachedUser);
        this._setOriginalUser(cachedUser); // Assume cached user is the original until proven otherwise
        this._setIsImpersonating(false); // Should not be impersonating on initial load
        // Keep isLoading false for now, only set true for actual fetch
      } else {
        console.log("User Store (Pinia): No valid cached user profile found.");
        // Ensure state is cleared if no cache
        this._setUserState(null);
        this._setOriginalUser(null);
        this._setIsImpersonating(false);
      }
      // --- End Load from Cache ---
      
      this._setLoading(true); // Set loading TRUE only before the actual API calls
      this._setError(null); // Clear previous errors before fetching
      // DO NOT clear user state here, keep cached version if available

      let fetchedUser = null;
      const lookupsStore = useLookupsStore();

      try {
        const initParams = await ZohoAPIService.getInitParams();
        const userEmail = initParams?.loginUser;

        if (!userEmail) {
          throw new Error("Could not determine logged-in user email from init params.");
        }
       // console.log(`User Store (Pinia): Found user email: ${userEmail}`);

        let loggedInUserRecord = null;
        if (lookupsStore.users && lookupsStore.users.length > 0) {
             loggedInUserRecord = lookupsStore.users.find(user => user.Email?.toLowerCase() === userEmail.toLowerCase());
             if (loggedInUserRecord) {
                // console.log(`User Store (Pinia): Found user record for ${userEmail} in lookupsStore.`);
             } else {
                 console.warn(`User Store (Pinia): User record for ${userEmail} NOT found in lookupsStore. Will create fallback.`);
             }
        } else {
            console.warn(`User Store (Pinia): lookupsStore.users is empty or not yet populated. Cannot find user ${userEmail}. Will create fallback.`);
            // This case should ideally not happen if initService runs correctly, but good to handle.
        }

        if (!loggedInUserRecord) {
           console.warn(`User Store (Pinia): User record not found for email ${userEmail}. Creating fallback.`);
           fetchedUser = {
               id: `fallback-${userEmail}`,
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
        } else {
            // console.log("User Store (Pinia): Found user data from lookups:", loggedInUserRecord);
            fetchedUser = {
                id: loggedInUserRecord.ID, 
                email: loggedInUserRecord[FIELD_USER_EMAIL],
                name: loggedInUserRecord[FIELD_USER_NAME]?.zc_display_value || '',
                firstName: loggedInUserRecord[FIELD_USER_NAME]?.first_name || '',
                lastName: loggedInUserRecord[FIELD_USER_NAME]?.last_name || '',
                phone: loggedInUserRecord.Phone_Number || '', 
                role: loggedInUserRecord[FIELD_USER_ROLE] || '', 
                salesRepLookup: loggedInUserRecord.Sales_Rep_Lookup?.ID || '', 
                profilePicture: loggedInUserRecord.Profile_Picture || '',
                isFallback: false
            };
        }

        // Use internal actions to set state with FRESH data
        this._setUserState(fetchedUser); // Update with fetched data
        this._setOriginalUser(fetchedUser); // Set original user based on fetched data
        this._setIsImpersonating(false); // Reset impersonation on fresh fetch
        
        // --- Save Fetched User to Cache ---
        if (fetchedUser && !fetchedUser.isFallback) { // Only cache real user data
           console.log("User Store (Pinia): Saving fetched user profile to cache.");
           saveSetting(LS_KEYS.USER_PROFILE, fetchedUser);
        } else if (fetchedUser?.isFallback) {
           console.log("User Store (Pinia): Not caching fallback user profile.");
           // Optionally clear cache if fetch resulted in fallback?
           // localStorage.removeItem(LS_KEYS.USER_PROFILE);
        }
        // --- End Save to Cache ---
        
        // console.log("User Store (Pinia): fetchCurrentUser completed.");

      } catch (error) {
        console.error("User Store (Pinia): Error in fetchCurrentUser action:", error);
        this._setError(error.message || 'An unknown error occurred while fetching user details.');
        throw error; // Re-throw for root action
      } finally {
        this._setLoading(false);
        // console.log("User Store (Pinia): Loading finished.");
      }
    },

    impersonateUser(userId) {
        const lookupsStore = useLookupsStore();

        // console.log(`User Store (Pinia): Attempting to impersonate user ID: ${userId}`);
        if (!this.originalUser) {
            console.error("User Store (Pinia): Cannot impersonate, original user not set.");
            return;
        }

        // Handle revert case
        if (!userId || userId === this.originalUser.id) {
            this.revertImpersonation(); // Call the revert action
            return;
        }

        const allUsers = lookupsStore.users || [];
        const targetUserRecord = allUsers.find(user => user.ID === userId);

        if (!targetUserRecord) {
            console.error(`User Store (Pinia): Target user ID ${userId} not found in lookups.`);
            // Maybe add a UI store notification here?
            // const uiStore = useUiStore(); 
            // uiStore.addNotification({ type: 'error', message: 'Impersonation target user not found.' });
            return;
        }

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
            isFallback: false
        };

        // console.log("User Store (Pinia): Impersonating user:", targetUser);
        // Use internal actions
        this._setUserState(targetUser);
        this._setIsImpersonating(true);
    },

    revertImpersonation() {
        // console.log("User Store (Pinia): Reverting impersonation...");
        if (this.originalUser) {
            // Use internal actions
            this._setUserState(this.originalUser);
            // _setUserState automatically handles setting isImpersonating to false here
            // console.log("User Store (Pinia): Impersonation reverted to:", this.originalUser);
        } else {
            console.error("User Store (Pinia): Cannot revert impersonation, original user data missing.");
        }
    }
  }
}); 