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
      console.log("User Store (Pinia): Starting fetchCurrentUser...");
      this._setLoading(true);
      this._setError(null);
      this._setUserState(null); // Clear current user
      this._setOriginalUser(null); // Clear original user
      this._setIsImpersonating(false);

      let initialUser = null;

      try {
        const initParams = await ZohoAPIService.getInitParams();
        const userEmail = initParams?.loginUser;

        if (!userEmail) {
          throw new Error("Could not determine logged-in user email from init params.");
        }
        console.log(`User Store (Pinia): Found user email: ${userEmail}`);

        // --- Fetch user record directly via API ---
        let loggedInUserRecord = null;
        try {
            const criteria = `(${FIELD_USER_EMAIL} == "${userEmail}")`;
            console.log(`User Store (Pinia): Fetching user record with criteria: ${criteria}`);
            const response = await ZohoAPIService.getRecords(REPORT_USERS, criteria);
            
            if (response.code !== 3000) {
                throw new Error(response.message || `API Error Code ${response.code}`);
            }
            
            if (response.data && response.data.length === 1) {
                loggedInUserRecord = response.data[0];
            } else if (response.data && response.data.length > 1) {
                console.warn(`User Store (Pinia): Multiple user records found for email ${userEmail}. Using the first one.`);
                loggedInUserRecord = response.data[0];
            } else {
                // No record found, handled below by the fallback mechanism
                console.warn(`User Store (Pinia): No user record found via API for email ${userEmail}.`);
            }
        } catch (apiError) {
            console.error(`User Store (Pinia): API error fetching user record for ${userEmail}:`, apiError);
            // Let the fallback mechanism handle this case
        }
        // --- End API Fetch ---

        if (!loggedInUserRecord) {
           console.warn(`User Store (Pinia): User record not found for email ${userEmail}. Creating fallback.`);
           initialUser = {
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
            initialUser = {
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

        // Use internal actions to set state
        this._setUserState(initialUser);
        this._setOriginalUser(initialUser);
        this._setIsImpersonating(false);
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