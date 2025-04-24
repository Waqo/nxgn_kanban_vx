import ZohoAPIService from '../services/zohoCreatorAPI.js';
import DataProcessors from '../utils/processors.js';
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
} from '../config/constants.js';

// Access Pinia global
const { defineStore } = Pinia;

export const useLookupsStore = defineStore('lookups', {
  state: () => ({
    stages: [],
    tags: new Map(), 
    users: [], 
    salesReps: [], 
    salesOrgs: [], 
    tranches: [], 
    isLoading: false,
    error: null, 
  }),

  getters: {
    // Simple getters can often be accessed directly from state,
    // but we define them explicitly if they perform calculations or formatting.
    
    // Specific Getters for Filters/Dropdowns
    getStageById: (state) => (id) => state.stages.find(s => s.id === id),
    getTagById: (state) => (id) => state.tags.get(id),
    getUserById: (state) => (id) => state.users.find(u => u.ID === id),
    
    // Format Sales Reps for BaseSelectMenu {value, label}
    salesRepsForFilter: (state) => {
        return state.salesReps.map(rep => ({ value: rep.name, label: rep.name }));
    },
    // Format Sales Orgs for BaseSelectMenu {value, label}
    salesOrgsForFilter: (state) => {
        return state.salesOrgs.map(org => ({ value: org.name, label: org.name }));
    },
    // Format Tags for BaseSelectMenu {value, label}
    tagsForFilter: (state) => {
        return Array.from(state.tags.entries()).map(([id, tag]) => ({ value: id, label: tag.name }));
    },
    // Format Users for Impersonation Dropdown
    usersForImpersonationDropdown: (state) => {
        if (!state.users || state.users.length === 0) {
            return [];
        }
        return state.users
            .map(user => ({ 
                value: user.ID, 
                label: user?.Name?.zc_display_value || user?.Email || `User ID: ${user.ID}`
            }))
            .filter(user => user.value)
            .sort((a, b) => a.label.localeCompare(b.label));
    }
  },

  actions: {
    /**
     * Fetches all required lookup data concurrently.
     * Uses Pinia actions to directly modify state.
     */
    async fetchRequiredLookups() {
      // console.log("Lookups Store (Pinia): Starting fetchRequiredLookups...");
      this.isLoading = true;
      this.error = null;

      const lookupsToFetch = {
        stages: REPORT_STAGES,
        tags: REPORT_TAGS,
        users: REPORT_USERS,
        salesReps: REPORT_SALES_REPS,
        salesOrgs: REPORT_SALES_ORGS,
        tranches: REPORT_TRANCHES,
      };
      const lookupKeys = Object.keys(lookupsToFetch);

      try {
        const promises = lookupKeys.map(key => {
          const reportName = lookupsToFetch[key];
          // console.log(`Lookups Store (Pinia): Fetching ${key} from ${reportName}...`);
          return ZohoAPIService.getRecords(reportName)
            .catch(err => {
              console.error(`Lookups Store (Pinia): Failed to fetch ${key} from ${reportName}:`, err);
              return { _lookupError: true, key: key, error: err };
            });
        });

        const results = await Promise.all(promises);
        // console.log("Lookups Store (Pinia): Raw fetch results:", results);

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
            console.error(`Lookups Store (Pinia): Zoho API error for ${key}:`, response);
            return; 
          }

          try {
            switch (key) {
              case 'stages':
                this.stages = DataProcessors.processStagesData(response);
                break;
              case 'tags':
                 this.tags = DataProcessors.processTagsData(response);
                 break;
              case 'users':
                // Assuming processUsersData isn't ready yet
                this.users = response.data || []; 
                break;
              case 'salesReps': 
                this.salesReps = DataProcessors.processSalesRepsData(response);
                break;
              case 'salesOrgs': 
                this.salesOrgs = DataProcessors.processSalesOrgsData(response);
                break;
              case 'tranches':
                 this.tranches = DataProcessors.processTranchesData(response);
                 break;
              default:
                console.warn(`Lookups Store (Pinia): No processing logic defined for key: ${key}`);
            }
             // console.log(`Lookups Store (Pinia): Successfully processed and committed ${key}.`);
          } catch (processingError) {
              encounteredError = true;
              errorMessage += `${key} (Processing Error: ${processingError.message}); `;
              console.error(`Lookups Store (Pinia): Error processing data for ${key}:`, processingError);
          }
        });

        if (encounteredError) {
          throw new Error(errorMessage);
        }

        // console.log("Lookups Store (Pinia): fetchRequiredLookups completed successfully.");

      } catch (error) {
        console.error("Lookups Store (Pinia): Error in fetchRequiredLookups action:", error);
        this.error = error.message || 'An unknown error occurred while fetching lookups.';
        // Re-throw for the root action to catch
        throw error;
      } finally {
        this.isLoading = false;
        // console.log("Lookups Store (Pinia): Loading finished.");
      }
    },
  }
}); 