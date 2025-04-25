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
  FIELD_USER_ROLE,
} from '../config/constants.js';
// Import Team User Roles option
import { TEAM_USER_ROLES } from '../config/options.js';

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
    isLoadingCore: false, // Loading state for initial Stages, Tranches, Users
    isLoadingTeamUsers: false,
    isLoadingTags: false,
    isLoadingSalesReps: false,
    isLoadingSalesOrgs: false,
    error: null, // Shared error state for simplicity, or could be split too
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
     * Fetches core lookup data needed for initial board display and user context.
     * Can optionally accept pre-fetched initData containing Stages and Tranches.
     * @param {object} [initData] - Optional pre-fetched data from the init record.
     */
    async fetchCoreLookups(initData = null) {
      if (this.isLoadingCore) return; // Prevent concurrent fetches
      
      this.isLoadingCore = true;
      this.error = null;
      
      // --- OPTIMIZATION: Use pre-fetched initData if available --- 
      if (initData && initData.Stages && initData.Tranches) {
          console.log("Lookups Store (Pinia): Using pre-fetched init data for Stages and Tranches.");
          try {
              this.stages = DataProcessors.processStagesData({ data: initData.Stages, code: 3000 }); // Wrap to match expected processor input
              this.tranches = DataProcessors.processTranchesData({ data: initData.Tranches, code: 3000 }); // Wrap to match expected processor input
              console.log("Lookups Store (Pinia): Stages and Tranches populated from init data.");
          } catch (processingError) {
              console.error("Lookups Store (Pinia): Error processing init data for Stages/Tranches:", processingError);
              this.error = `Failed to process init data: ${processingError.message}`;
              // Allow proceeding, but core lookups will be empty/incorrect
          }
          this.isLoadingCore = false;
          console.log("Lookups Store (Pinia): Core loading finished (using init data).");
          return; // Exit early as we used init data
      }
      // --- END OPTIMIZATION ---
      
      // --- Fallback or Original Logic: Fetch individually if initData wasn't provided/valid ---
      console.warn("Lookups Store (Pinia): initData not provided or invalid. Fetching Stages/Tranches individually (Fallback).");
      const lookupsToFetch = {
        stages: { report: REPORT_STAGES, processor: DataProcessors.processStagesData },
        tranches: { report: REPORT_TRANCHES, processor: DataProcessors.processTranchesData },
      };
      const lookupKeys = Object.keys(lookupsToFetch);

      try {
        const promises = lookupKeys.map(key => {
          const config = lookupsToFetch[key];
          console.log(`Lookups Store (Pinia): Fetching core lookup: ${key}`);
          return ZohoAPIService.getRecords(config.report)
            .catch(err => {
              console.error(`Lookups Store (Pinia): Failed to fetch core ${key}:`, err);
              return { _lookupError: true, key: key, error: err };
            });
        });

        const results = await Promise.all(promises);
        let encounteredError = false;
        let errorMessage = "Failed to load core lookup data: ";

        results.forEach((response, index) => {
          const key = lookupKeys[index];
          if (response._lookupError || response.code !== 3000) {
            encounteredError = true;
            const msg = response._lookupError ? response.error.message : (response?.message || `API Error Code ${response?.code || 'N/A'}`);
            errorMessage += `${key} (${msg}); `;
            console.error(`Lookups Store (Pinia): Error response for core ${key}:`, response);
            return;
          }
          try {
            const processor = lookupsToFetch[key].processor;
            this[key] = processor(response); // Assign processed data directly to state
          } catch (processingError) {
            encounteredError = true;
            errorMessage += `${key} (Processing Error: ${processingError.message}); `;
            console.error(`Lookups Store (Pinia): Error processing core data for ${key}:`, processingError);
          }
        });

        if (encounteredError) {
          throw new Error(errorMessage);
        }
        console.log("Lookups Store (Pinia): fetchCoreLookups completed successfully.");

      } catch (error) {
        console.error("Lookups Store (Pinia): Error in fetchCoreLookups action:", error);
        this.error = error.message || 'An unknown error occurred while fetching core lookups.';
        // Don't re-throw here, let initService handle overall loading state
      } finally {
        this.isLoadingCore = false;
        console.log("Lookups Store (Pinia): Core loading (Stages, Tranches) finished.");
      }
    },

    /**
     * Fetches Users with specific roles (e.g., Project Manager, Admin) on demand.
     */
    async fetchTeamUsers() {
        if (this.users.length > 0 || this.isLoadingTeamUsers) return; // Don't refetch
        console.log("Lookups Store (Pinia): Starting fetchTeamUsers...");
        this.isLoadingTeamUsers = true;
        this.error = null; // Clear previous errors
        try {
            // Construct criteria: (Role == "Project Manager" || Role == "Admin")
            const roleCriteria = TEAM_USER_ROLES.map(role => `(${FIELD_USER_ROLE} == "${role}")`).join(" || ");
            const criteria = `(${roleCriteria})`;
            console.log(`Lookups Store (Pinia): Fetching team users with criteria: ${criteria}`);

            const response = await ZohoAPIService.getRecords(REPORT_USERS, criteria);
            if (response.code !== 3000) {
                throw new Error(response.message || `API Error Code ${response.code}`);
            }
            // Store the raw user data, processing/filtering for dropdowns can happen in getters if needed
            this.users = response.data || []; 
            console.log(`Lookups Store (Pinia): Team Users (${this.users.length}) fetched successfully.`);
        } catch (error) {
            console.error("Lookups Store (Pinia): Error fetching Team Users:", error);
            this.error = error.message || 'Failed to fetch Team Users.';
            this.users = []; // Clear users on error
        } finally {
            this.isLoadingTeamUsers = false;
        }
    },

    /**
     * Fetches Tags data on demand.
     */
    async fetchTags() {
        if (this.tags.size > 0 || this.isLoadingTags) return; // Don't refetch if already loaded or loading
        console.log("Lookups Store (Pinia): Starting fetchTags...");
        this.isLoadingTags = true;
        this.error = null; // Clear previous errors
        try {
            const response = await ZohoAPIService.getRecords(REPORT_TAGS);
            if (response.code !== 3000) {
                throw new Error(response.message || `API Error Code ${response.code}`);
            }
            this.tags = DataProcessors.processTagsData(response);
            console.log("Lookups Store (Pinia): Tags fetched successfully.");
        } catch (error) {
            console.error("Lookups Store (Pinia): Error fetching Tags:", error);
            this.error = error.message || 'Failed to fetch Tags.';
            // Potentially clear tags: this.tags = new Map();
        } finally {
            this.isLoadingTags = false;
        }
    },

     /**
     * Fetches Sales Reps data on demand.
     */
    async fetchSalesReps() {
        if (this.salesReps.length > 0 || this.isLoadingSalesReps) return;
        console.log("Lookups Store (Pinia): Starting fetchSalesReps...");
        this.isLoadingSalesReps = true;
        this.error = null;
        try {
            const response = await ZohoAPIService.getRecords(REPORT_SALES_REPS);
            if (response.code !== 3000) {
                throw new Error(response.message || `API Error Code ${response.code}`);
            }
            this.salesReps = DataProcessors.processSalesRepsData(response);
            console.log("Lookups Store (Pinia): Sales Reps fetched successfully.");
        } catch (error) {
            console.error("Lookups Store (Pinia): Error fetching Sales Reps:", error);
            this.error = error.message || 'Failed to fetch Sales Reps.';
            // Potentially clear: this.salesReps = [];
        } finally {
            this.isLoadingSalesReps = false;
        }
    },

    /**
     * Fetches Sales Orgs data on demand.
     */
    async fetchSalesOrgs() {
        if (this.salesOrgs.length > 0 || this.isLoadingSalesOrgs) return;
        console.log("Lookups Store (Pinia): Starting fetchSalesOrgs...");
        this.isLoadingSalesOrgs = true;
        this.error = null;
        try {
            const response = await ZohoAPIService.getRecords(REPORT_SALES_ORGS);
            if (response.code !== 3000) {
                throw new Error(response.message || `API Error Code ${response.code}`);
            }
            this.salesOrgs = DataProcessors.processSalesOrgsData(response);
            console.log("Lookups Store (Pinia): Sales Orgs fetched successfully.");
        } catch (error) {
            console.error("Lookups Store (Pinia): Error fetching Sales Orgs:", error);
            this.error = error.message || 'Failed to fetch Sales Orgs.';
            // Potentially clear: this.salesOrgs = [];
        } finally {
            this.isLoadingSalesOrgs = false;
        }
    },
  }
}); 