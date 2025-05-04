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
  REPORT_EQUIPMENT,
  REPORT_DOC_TYPES,
  REPORT_EMAIL_TEMPLATES,
  FIELD_USER_ROLE,
} from '../config/constants.js';
// Import Team User Roles option
import { TEAM_USER_ROLES } from '../config/options.js';
// Import UI store for loading states if needed for filter lookups
import { useUiStore } from './uiStore.js';
// --- ADD userStore import ---
import { useUserStore } from './userStore.js';

// Access Pinia global
const { defineStore } = Pinia;

// --- ADD Helper to process equipment data ---
const processEquipmentData = (response) => {
    const equipmentMap = {
        'Module': [],
        'Inverter': [],
        'Battery': [],
        'Other Component': []
    };
    if (response?.data && Array.isArray(response.data)) {
         response.data.forEach(item => {
             const category = item.Equipment_Type || 'Other Component';
             if (equipmentMap[category]) {
                 equipmentMap[category].push({
                     id: item.ID,
                     manufacturer: item.Manufacturer || 'Unknown',
                     model: item.Model || 'Unknown',
                     cost: parseFloat(item.Cost) || 0,
                     // Add other relevant fields if needed
                 });
             }
         });
    }
    console.log('Processed Equipment Data:', equipmentMap);
    return equipmentMap;
};

export const useLookupsStore = defineStore('lookups', {
  state: () => ({
    stages: [],
    tags: new Map(), 
    users: [], 
    salesReps: [], 
    salesOrgs: [], 
    tranches: [], 
    docTypes: [], // Add docTypes state
    equipmentData: {}, // Add equipment data state
    isLoadingCore: false, // Covers Stages, Tranches, Tags, DocTypes from Init
    isLoadingTeamUsers: false,
    isLoadingSalesReps: false,
    isLoadingSalesOrgs: false,
    // Add specific loading for DocTypes fallback?
    isLoadingDocTypes: false, // For fallback fetch
    isLoadingEquipment: false, // Add loading flag
    isLoadingEmailTemplates: false,
    error: null, 
    // --- ADD Email Templates State ---
    emailTemplates: [], // Array of { id, name, description, subject }
    // --- ADD Loading states for filter lookups ---
    isLoadingTags: false,
    isLoadingUsers: false,
    lastUpdatedTimestamp: null
  }),

  getters: {
    // Simple getters can often be accessed directly from state,
    // but we define them explicitly if they perform calculations or formatting.
    
    // Specific Getters for Filters/Dropdowns
    getStageById: (state) => (id) => state.stages.find(s => s.id === id),
    getTagById: (state) => (id) => state.tags.get(id),
    getUserById: (state) => (id) => state.users.find(u => u.ID === id),
    
    // Format Sales Reps for BaseSelectMenu {value, label} - USED BY CommissionsTab
    salesRepsForAssignmentFilter: (state) => { // RENAMED from salesRepsForFilter
        return state.salesReps.map(rep => ({ value: rep.id, label: rep.name })); // Use rep.id for value
    },
    // NEW: Format Sales Reps for Toolbar Filter {value, label}
    salesRepsForToolbarFilter: (state) => {
        return state.salesReps.map(rep => ({ value: rep.name, label: rep.name })); // Use rep.name for value
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
    },
    // --- ADD Getter for users suitable for tagging (excludes current user) ---
    usersForTagging: (state) => {
        const userStore = useUserStore(); // Get userStore instance
        const currentUserId = userStore.currentUser?.id; // Use lowercase 'id'

        if (!Array.isArray(state.users)) {
            return [];
        }

        return state.users
            .filter(user => user && user.ID !== currentUserId) // Filter out current user using their ID
            .map(user => {
                // Format for the combobox
                const displayName = user.Name?.zc_display_value?.trim() || user.Email?.trim();
                const label = displayName || `User ${user.ID}`; // Fallback label
                return {
                    value: user.ID, // Use the Zoho Record ID as the value
                    label: label    // Use the constructed display name as the label
                };
            })
            .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically by label
    },
    // --- ADD Getter for Manual Email Templates ---
    getManualEmailTemplates: (state) => state.emailTemplates,
    // --- Getters for filter options (formatted for dropdowns) ---
    tagOptions: (state) => Array.from(state.tags.values()).map(tag => ({ value: tag.id, label: tag.name, color: tag.color, category: tag.category })),
    salesRepOptions: (state) => state.salesReps.map(rep => ({ value: rep.id, label: rep.name })),
    salesOrgOptions: (state) => state.salesOrgs.map(org => ({ value: org.id, label: org.name })),
    trancheOptions: (state) => state.tranches.map(tranche => ({ value: tranche.id, label: `Tranche ${tranche.number}` })),
    // Getter for all active user names (e.g., for tagging) - Added Feb 27
    activeUserNames: (state) => state.users.map(user => user.name).filter(Boolean),
    activeUserOptions: (state) => state.users.map(user => ({ id: user.id, name: user.name })).filter(u => u.name),
    // Getter for combined loading state
    isLoadingLookups: (state) => state.isLoadingTags || state.isLoadingUsers || state.isLoadingSalesReps || state.isLoadingSalesOrgs || state.isLoadingEquipment || state.isLoadingDocTypes || state.isLoadingEmailTemplates
  },

  actions: {
    /**
     * Fetches core lookup data needed for initial board display and user context.
     * Can optionally accept pre-fetched initData containing Stages, Tranches, Tags, Document_Types.
     * @param {object} [initData] - Optional pre-fetched data from the init record.
     */
    async fetchCoreLookups(initData = null) {
      if (this.isLoadingCore) return; 
      
      this.isLoadingCore = true;
      this.error = null;
      let processedDocTypes = [];
      
      // --- Process pre-fetched initData if available --- 
      if (initData) {
          console.log("Lookups Store (Pinia): Using pre-fetched init data.");
          try {
              if(initData.Stages) {
              this.stages = DataProcessors.processStagesData({ data: initData.Stages, code: 3000 }); 
              } else {
                   console.warn("Lookups Store (Pinia): initData missing Stages.");
              }
              if(initData.Tranches) {
              this.tranches = DataProcessors.processTranchesData({ data: initData.Tranches, code: 3000 });
              } else {
                   console.warn("Lookups Store (Pinia): initData missing Tranches.");
              }
              if(initData.Tags) {
              this.tags = DataProcessors.processTagsData({ data: initData.Tags, code: 3000 });
              } else {
                   console.warn("Lookups Store (Pinia): initData missing Tags.");
              }
              // Process Document Types from initData
              if(initData.Document_Types) {
                   processedDocTypes = DataProcessors.processDocTypesData(initData.Document_Types);
                   this.docTypes = processedDocTypes;
                   console.log(`Lookups Store (Pinia): Document Types (${processedDocTypes.length}) populated from init data.`);
              } else {
                   console.warn("Lookups Store (Pinia): initData missing Document_Types. Will attempt fallback fetch.");
              }
              
              // --- Add Equipment Check/Fetch ---
              let processedEquipment = {}; // Temporary variable
              if (initData?.Equipment) { // Check if Equipment data is in init record
                   try {
                       processedEquipment = processEquipmentData({ data: initData.Equipment, code: 3000 });
                       this.equipmentData = processedEquipment;
                       console.log(`Lookups Store (Pinia): Equipment data populated from init data.`);
                   } catch(processingError) {
                       console.error("Lookups Store (Pinia): Error processing init Equipment data:", processingError);
                       // Fall through to fetch if processing failed
                   }
              }
              
              // --- Process Email Templates from initData using Processor ---
              if (initData?.Email_Templates) { // Check if the key exists
                   try {
                       this.emailTemplates = DataProcessors.processEmailTemplatesData(initData.Email_Templates); // Pass raw array
                       console.log(`Lookups Store (Pinia): Email templates (${this.emailTemplates.length}) processed from init data.`);
                   } catch (processingError) {
                        console.error("Lookups Store (Pinia): Error processing init Email Templates data:", processingError);
                        this.emailTemplates = []; // Ensure empty array on processing error
                   }
              } else {
                  console.warn("Lookups Store (Pinia): No Email_Templates array found in initData.");
                  this.emailTemplates = []; // Ensure it's an empty array if not found
              }
              
              // --- ADD Team Users Processing --- 
              // Check for the correct key 'Users' based on the provided initData log
              if (initData.Users && Array.isArray(initData.Users)) { // Correct key is 'Users'
                   // --- ADD Filter: Exclude 'Sales Rep' --- 
                   const allUsers = initData.Users;
                   const filteredUsers = allUsers.filter(user => user.Role !== 'Sales Rep');
                   this.users = filteredUsers; // Assign the FILTERED list
                   // Update log to show original and filtered counts
                   console.log(`Lookups Store (Pinia): Processed ${allUsers.length} users from init data, stored ${filteredUsers.length} (excluding Sales Reps).`);
              } else {
                   console.warn("Lookups Store (Pinia): initData missing 'Users' array. Will attempt fallback fetch if needed.");
              }
              // --- END Team Users Processing ---
              
              if (initData.Sales_Reps && Array.isArray(initData.Sales_Reps)) {
                  try {
                      // --- REMOVED DEBUG LOG ---
                      // console.log("Lookups Store DEBUG: Attempting to process initData.Sales_Reps:", initData.Sales_Reps);
                      // Use the existing processor, passing the data in the expected format
                      this.salesReps = DataProcessors.processSalesRepsData({ data: initData.Sales_Reps, code: 3000 });
                      console.log(`Lookups Store (Pinia): Sales Reps (${this.salesReps.length}) processed from init data.`);
                  } catch (error) {
                      console.error("Lookups Store (Pinia): Error processing init Sales Reps data:", error);
                      this.error = this.error ? `${this.error}; SalesReps: ${error.message}` : `SalesReps: ${error.message}`;
                      throw error; // Re-throw to signal failure in Promise.all
                  }
              }
          } catch (processingError) {
              console.error("Lookups Store (Pinia): Error processing init data:", processingError);
              this.error = `Failed to process init data: ${processingError.message}`;
              // Let it fall through to attempt fetches if processing failed
          }
      }
      
      // --- Fallback Fetches for missing core data --- 
      const fetchesNeeded = [];
      if (this.stages.length === 0) fetchesNeeded.push(this.fetchStagesFallback());
      if (this.tranches.length === 0) fetchesNeeded.push(this.fetchTranchesFallback());
      if (this.tags.size === 0) fetchesNeeded.push(this.fetchTagsFallback());
      if (this.docTypes.length === 0) fetchesNeeded.push(this.fetchDocTypesFallback()); // Add DocTypes fallback
      if (Object.keys(this.equipmentData).length === 0) { // Fetch if not loaded from init
            fetchesNeeded.push(this.fetchEquipmentFallback()); 
      }
      if (this.emailTemplates.length === 0) fetchesNeeded.push(this.fetchTemplatesFallback());
      // --- ADD Check if users need fallback fetch ---
      if (this.users.length === 0) {
          // Don't *await* this here, let the component trigger fallback if needed
          console.log("Lookups Store (Pinia): Core lookups finished, but Team Users still need fetching (will happen on demand).");
      }

      if (fetchesNeeded.length > 0) {
          console.log(`Lookups Store (Pinia): Performing ${fetchesNeeded.length} fallback fetches for core data (excluding users).`);
          try {
              await Promise.all(fetchesNeeded);
              console.log("Lookups Store (Pinia): Fallback core lookups completed.");
          } catch(fallbackError) {
               console.error("Lookups Store (Pinia): One or more fallback fetches failed.");
          }
      }
      
      this.isLoadingCore = false;
      console.log("Lookups Store (Pinia): Core loading finished.");
    },

    // --- Fallback Fetch Actions (Internal Helpers) --- 
    async fetchStagesFallback() {
        console.log("Lookups Store (Pinia): Fetching Stages (Fallback)..." );
        try {
            const response = await ZohoAPIService.getRecords(REPORT_STAGES);
            this.stages = DataProcessors.processStagesData(response);
        } catch (error) {
            console.error("Lookups Store (Pinia): Error fetching Stages (Fallback):", error);
            this.error = this.error ? `${this.error}; Stages: ${error.message}` : `Stages: ${error.message}`;
            throw error; // Re-throw to signal failure in Promise.all
        }
    },
    async fetchTranchesFallback() {
        console.log("Lookups Store (Pinia): Fetching Tranches (Fallback)..." );
         try {
            const response = await ZohoAPIService.getRecords(REPORT_TRANCHES);
            this.tranches = DataProcessors.processTranchesData(response);
        } catch (error) {
            console.error("Lookups Store (Pinia): Error fetching Tranches (Fallback):", error);
            this.error = this.error ? `${this.error}; Tranches: ${error.message}` : `Tranches: ${error.message}`;
            throw error;
        }
    },
    async fetchTagsFallback() {
         console.log("Lookups Store (Pinia): Fetching Tags (Fallback)..." );
         this.isLoadingTags = true; // Can use separate flag if needed for UI
         try {
            const response = await ZohoAPIService.getRecords(REPORT_TAGS);
            this.tags = DataProcessors.processTagsData(response);
        } catch (error) {
            console.error("Lookups Store (Pinia): Error fetching Tags (Fallback):", error);
            this.error = this.error ? `${this.error}; Tags: ${error.message}` : `Tags: ${error.message}`;
            throw error;
        } finally {
             this.isLoadingTags = false;
        }
    },
    async fetchDocTypesFallback() {
         console.log("Lookups Store (Pinia): Fetching Document Types (Fallback)..." );
         this.isLoadingDocTypes = true; 
          try {
            const response = await ZohoAPIService.getRecords(REPORT_DOC_TYPES);
            this.docTypes = DataProcessors.processDocTypesData(response);
            console.log(`Lookups Store (Pinia): Document Types (${this.docTypes.length}) fetched via fallback.`);
        } catch (error) {
            console.error("Lookups Store (Pinia): Error fetching Document Types (Fallback):", error);
            this.error = this.error ? `${this.error}; DocTypes: ${error.message}` : `DocTypes: ${error.message}`;
            throw error;
        } finally {
             this.isLoadingDocTypes = false;
        }
    },

    // --- ADD Equipment Fallback Fetch --- 
    async fetchEquipmentFallback() {
         console.log("Lookups Store (Pinia): Fetching Equipment (Fallback)..." );
         this.isLoadingEquipment = true; 
         try {
            const response = await ZohoAPIService.getRecords(REPORT_EQUIPMENT);
            this.equipmentData = processEquipmentData(response);
            console.log(`Lookups Store (Pinia): Equipment fetched via fallback.`);
      } catch (error) {
            console.error("Lookups Store (Pinia): Error fetching Equipment (Fallback):", error);
            this.error = this.error ? `${this.error}; Equipment: ${error.message}` : `Equipment: ${error.message}`;
            throw error; // Re-throw to signal failure in Promise.all
      } finally {
             this.isLoadingEquipment = false;
      }
    },

    // --- ADD Email Templates Fallback Fetch ---
    async fetchTemplatesFallback() {
        console.log("Lookups Store (Pinia): Fetching Email Templates (Fallback)..." );
        this.isLoadingEmailTemplates = true; 
         try {
           const response = await ZohoAPIService.getRecords(REPORT_EMAIL_TEMPLATES);
           // Process the response using the processor
           this.emailTemplates = DataProcessors.processEmailTemplatesData(response);
           console.log(`Lookups Store (Pinia): Email Templates (${this.emailTemplates.length}) fetched and processed via fallback.`);
       } catch (error) {
           console.error("Lookups Store (Pinia): Error fetching/processing Email Templates (Fallback):", error);
           this.error = this.error ? `${this.error}; Templates: ${error.message || 'Fetch Error'}` : `Templates: ${error.message || 'Fetch Error'}`;
           this.emailTemplates = []; // Clear on error
           throw error; // Re-throw to signal failure in Promise.all
       } finally {
            this.isLoadingEmailTemplates = false;
       }
    },

    /**
     * Fetches Users with specific roles (e.g., Project Manager, Admin) on demand.
     * NOW PRIMARILY ACTS AS A FALLBACK if init data didn't contain users.
     */
    async fetchTeamUsers() {
        // --- ADD Check: Don't fetch if users are already loaded ---
        if (this.users.length > 0) {
            console.log("Lookups Store (Pinia): Skipping fetchTeamUsers (already loaded).");
            return; 
        }
        // --- END Check ---

        if (this.isLoadingTeamUsers) return; // Prevent concurrent fetches
        console.log("Lookups Store (Pinia): Starting fetchTeamUsers (Fallback)..."); // Indicate it's a fallback
        this.isLoadingTeamUsers = true;
        this.error = null; 
        try {
            // ... rest of the existing fetchTeamUsers logic remains the same ...
            const roleCriteria = TEAM_USER_ROLES.map(role => `(${FIELD_USER_ROLE} == "${role}")`).join(" || ");
            const criteria = `(${roleCriteria})`;
            console.log(`Lookups Store (Pinia): Fetching team users with criteria: ${criteria}`);

            const response = await ZohoAPIService.getRecords(REPORT_USERS, criteria);
            if (response.code !== 3000) {
                throw new Error(response.message || `API Error Code ${response.code}`);
            }
            console.log(`Lookups Store (Pinia): Raw team user data received (Fallback):`, response.data);
            this.users = response.data || []; 
            console.log(`Lookups Store (Pinia): Team Users (${this.users.length}) fetched successfully (Fallback).`);
        } catch (error) {
            console.error("Lookups Store (Pinia): Error fetching Team Users (Fallback):", error);
            this.error = error.message || 'Failed to fetch Team Users.';
            this.users = []; 
        } finally {
            this.isLoadingTeamUsers = false;
        }
    },

    /**
     * Fetches Tags data on demand (now less likely to be needed if init works).
     */
    async fetchTags() {
        if (this.tags.size > 0 || this.isLoadingTags) {
             console.log("Lookups Store (Pinia): Skipping fetchTags (already loaded or loading).");
             return; 
        }
        await this.fetchTagsFallback(); // Use fallback logic
    },

     /**
     * Fetches Sales Reps data on demand.
     */
    async fetchSalesReps() {
        // --- MODIFIED: Check if already loaded or loading ---
        if (this.salesReps.length > 0 || this.isLoadingSalesReps) {
            console.log("Lookups Store (Pinia): Skipping fetchSalesReps (already loaded or loading).");
            return;
        }
        // --- Use the fallback logic for the actual fetch ---
        console.log("Lookups Store (Pinia): Triggering fetchSalesReps (will use fallback)...");
        await this.fetchSalesRepsFallback();
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

    // --- ADD Sales Reps Fallback Fetch ---
    async fetchSalesRepsFallback() {
        console.log("Lookups Store (Pinia): Fetching Sales Reps (Fallback)..." );
        this.isLoadingSalesReps = true;
        try {
            const response = await ZohoAPIService.getRecords(REPORT_SALES_REPS);
            if (response.code !== 3000) {
                throw new Error(response.message || `API Error Code ${response.code}`);
            }
            this.salesReps = DataProcessors.processSalesRepsData(response);
            console.log(`Lookups Store (Pinia): Sales Reps (${this.salesReps.length}) fetched via fallback.`);
        } catch (error) {
            console.error("Lookups Store (Pinia): Error fetching Sales Reps (Fallback):", error);
            this.error = this.error ? `${this.error}; SalesReps: ${error.message}` : `SalesReps: ${error.message}`;
            throw error; // Re-throw to signal failure in Promise.all
        } finally {
            this.isLoadingSalesReps = false;
        }
    },
  }
}); 