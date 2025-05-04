import ZohoAPIService from '../services/zohoCreatorAPI.js';
import DataProcessors from '../utils/processors.js';
// Import constants
import {
  REPORT_PROJECTS,
  FIELD_PROJECT_STAGE_LOOKUP,
  FIELD_PROJECT_IS_DEMO,
  FIELD_PROJECT_ARCHIVED_STAGE_ID,
  FIELD_PROJECT_PRE_SALE_STAGE_ID,
  FIELD_PROJECT_CANCELLED_STAGE_ID,
  FIELD_PROJECT_NOT_VIABLE_STAGE_ID,
  FIELD_PROJECT_HO_CANCELLED_REDBALL_STAGE_ID,
  FIELD_PROJECT_DUPLICATE_JOBS_STAGE_ID,
  DEFAULT_SORT_DIRECTION,
  FIELD_PROJECT_TRANCHE_LOOKUP,
  ACTIVITY_SOURCE_PORTAL,
  START_IN_DEMO_MODE,
  FIELD_PROJECT_CONTACT_NAME_LOOKUP,
  FIELD_PROJECT_TAGS,
  FIELD_PROJECT_FUNDED_REDBALL,
  FIELD_PROJECT_TRIG_CREATE_FOLDERS,
  REPORT_PROJECT_DETAILS,
  FORM_ISSUES,
  FIELD_ISSUE_CONTENT,
  FIELD_ISSUE_PROJECT_LOOKUP,
  FIELD_ISSUE_AUTHOR_TEXT,
  FIELD_ISSUE_USER_LOOKUP,
  FIELD_ISSUE_NOTIFY_SALES,
  FIELD_ISSUE_TAGGED_USERS,
  FORM_TASKS,
  FIELD_TASK_PROJECT_LOOKUP,
  FIELD_TASK_DESCRIPTION,
  FIELD_TASK_ASSIGNEE_LOOKUP,
  FIELD_TASK_ASSIGNED_BY_LOOKUP,
  FIELD_TASK_PRIORITY,
  FIELD_TASK_DUE_DATE,
  FIELD_TASK_STATUS
} from '../config/constants.js';
// Import EVENT_TYPES
import { EVENT_TYPES } from '../config/options.js';

// Import other Pinia stores needed for actions/getters
import { useUiStore } from './uiStore.js'; 
import { useLookupsStore } from './lookupsStore.js'; 
import { useModalStore } from './modalStore.js';

// Import Activity Log Service
import { logActivity } from '../services/activityLogService.js';

// Import localStorage utils
import { LS_KEYS, saveSetting, loadSetting } from '../utils/localStorage.js';
// --- ADD Error Log Service Import ---
import { logErrorToZoho } from '../services/errorLogService.js';

// Import Formatting Helper
import { formatDateTimeForZohoAPI } from '../utils/helpers.js';

// Access Pinia global
const { defineStore } = Pinia;

// --- ADD Configuration Flag ---
// const START_IN_DEMO_MODE = true; // Remove this local definition

const DEFAULT_SORT_FIELD = 'Owner_Name_Display';
const defaultSort = { field: DEFAULT_SORT_FIELD, direction: DEFAULT_SORT_DIRECTION };

const defaultFilters = {
    searchTerm: '',
    tags: [],
    workRequired: [], 
    selectedSalesRepNames: [],
    selectedSalesOrgNames: [], 
    projectType: [], 
    cashDeal: null, 
    needHelp: null, 
};

// --- REMOVE Project lookup field name constant --- 
// const FIELD_CONTACT_PROJECT_LOOKUP = 'Project';

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projectList: [], 
    isLoading: false,
    error: null,
    lastUpdatedTimestamp: null,
    filterModeIsDemosOnly: START_IN_DEMO_MODE,
    filters: { ...defaultFilters },
    filterOnlyDuplicates: false,
    sortBy: loadSetting(LS_KEYS.TOOLBAR_SORT, defaultSort).field,
    sortDirection: loadSetting(LS_KEYS.TOOLBAR_SORT, defaultSort).direction,
  }),

  getters: {
    // Simple getters remain similar or access state directly
    // Getters for filters/sort state
    currentFilters: (state) => state.filters,
    currentSortBy: (state) => state.sortBy,
    currentSortDirection: (state) => state.sortDirection,

    /**
     * The main getter to provide the filtered and sorted list of projects for the UI.
     */
    filteredSortedProjects(state) {
        // Note: Accessing other stores in getters requires instantiating them
        // This isn't ideal performance-wise if done frequently. Consider moving 
        // complex cross-store logic to actions or components if it becomes an issue.
        
        let projectsToDisplay = [...state.projectList]; 

        // Apply Demo Filter
        if (state.filterModeIsDemosOnly) {
            projectsToDisplay = projectsToDisplay.filter(p => p.Is_Demo === true);
        } else {
            projectsToDisplay = projectsToDisplay.filter(p => !p.Is_Demo);
        }

        // Apply Other Filters
        const filters = state.filters;
        if (filters.searchTerm) {
             const term = filters.searchTerm;
             projectsToDisplay = projectsToDisplay.filter(p => 
                p.ID?.toLowerCase().includes(term) ||
                p.Owner_Name_Display?.toLowerCase().includes(term) ||
                p.addressLine1?.toLowerCase().includes(term) ||
                p.address?.toLowerCase().includes(term) ||
                p.city?.toLowerCase().includes(term) ||
                p.state?.toLowerCase().includes(term) ||
                p.zip?.toLowerCase().includes(term) ||
                p.Sales_Rep_Name?.toLowerCase().includes(term) ||
                p.OpenSolar_Project_ID?.toLowerCase().includes(term)
             );
        }
        // ... (Implement filtering for tags, workRequired, salesRep, salesOrg, needHelp, cashDeal, projectType based on state.filters)
        if (filters.tags?.length > 0) {
            projectsToDisplay = projectsToDisplay.filter(p => 
                 p.Tags?.some(projectTag => filters.tags.includes(projectTag.ID))
            );
        }
        if (filters.workRequired?.length > 0) {
            projectsToDisplay = projectsToDisplay.filter(p => 
                 filters.workRequired.some(work => {
                     if (work === 'tree') return p.Tree_Work_Required;
                     if (work === 'roof') return p.Roof_Work_Required;
                     if (work === 'panel') return p.Panel_Upgrade_Required;
                     return false;
                 })
            );
        }
        if (filters.selectedSalesRepNames?.length > 0) {
             projectsToDisplay = projectsToDisplay.filter(p => 
                 filters.selectedSalesRepNames.includes(p.Sales_Rep_Name)
             );
        }
        if (filters.selectedSalesOrgNames?.length > 0) {
             projectsToDisplay = projectsToDisplay.filter(p => 
                 filters.selectedSalesOrgNames.includes(p.Sales_Org_Name)
             );
        }
        if (filters.needHelp !== null) {
            projectsToDisplay = projectsToDisplay.filter(p => p.Need_Help === filters.needHelp);
        }
        if (filters.cashDeal !== null) {
             projectsToDisplay = projectsToDisplay.filter(p => p.Is_Cash_Finance === filters.cashDeal);
        }
        if (filters.projectType?.length > 0) {
             projectsToDisplay = projectsToDisplay.filter(p => {
                 const isCommercial = p.Commercial;
                 return filters.projectType.some(type => 
                     (type === 'commercial' && isCommercial) || (type === 'residential' && !isCommercial)
                 );
             });
        }

        // --- ADDED: Apply Duplicate Filter ---
        if (state.filterOnlyDuplicates) {
            const duplicateIds = state.duplicateLatLongProjectIds; // Access via state directly in getter
            if (duplicateIds instanceof Set) { // Ensure it's a Set
                projectsToDisplay = projectsToDisplay.filter(p => duplicateIds.has(p.ID));
            }
        }

        // Apply Sorting
        projectsToDisplay.sort((a, b) => {
            const sortByField = state.sortBy;
            let valA = sortByField === 'New_Stage' ? a[sortByField]?.title : a[sortByField];
            let valB = sortByField === 'New_Stage' ? b[sortByField]?.title : b[sortByField];
            let comparison = 0;

            if (sortByField === 'kW_STC' || sortByField === 'Yield') {
                comparison = (parseFloat(valA) || 0) - (parseFloat(valB) || 0);
            } else if (['Date_Sold', 'Added_Time', 'Modified_Time', 'Installation_Date_Time'].includes(sortByField)) {
                const timeA = valA ? new Date(valA).getTime() : 0;
                const timeB = valB ? new Date(valB).getTime() : 0;
                comparison = (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
            } else if (typeof valA === 'string' && typeof valB === 'string') {
                comparison = valA.toLowerCase().localeCompare(valB.toLowerCase());
            } else if (typeof valA === 'number' && typeof valB === 'number') {
                comparison = valA - valB;
            } else {
                comparison = String(valA ?? '').toLowerCase().localeCompare(String(valB ?? '').toLowerCase());
            }

            return state.sortDirection === 'desc' ? (comparison * -1) : comparison;
        });

        return projectsToDisplay;
    },

    /**
     * Calculates the total system size (kW) for the currently filtered projects.
     */
    totalFilteredSystemSizeKw() {
        // Instantiate other stores needed inside the getter
        const uiStore = useUiStore(); 
        // `this` refers to the projects store state/getters
        let projectsToSum = this.filteredSortedProjects || [];

        const excludedStageIds = [
            FIELD_PROJECT_PRE_SALE_STAGE_ID,
            FIELD_PROJECT_CANCELLED_STAGE_ID,
            FIELD_PROJECT_NOT_VIABLE_STAGE_ID,
            FIELD_PROJECT_HO_CANCELLED_REDBALL_STAGE_ID,
            FIELD_PROJECT_DUPLICATE_JOBS_STAGE_ID
        ];

        // Access uiStore state directly
        if (uiStore.boardViewMode === 'tranches') { 
            projectsToSum = projectsToSum.filter(p => p.Tranche?.ID);
        } else {
            projectsToSum = projectsToSum.filter(p => 
                !excludedStageIds.includes(p.New_Stage?.ID)
            );
        }

        const total = projectsToSum.reduce((sum, project) => {
            const size = parseFloat(project?.kW_STC) || 0;
            return sum + size;
        }, 0);
        return total.toFixed(2);
    },

    // Getter for the total count of projects currently displayed (after filters)
    filteredProjectCount() {
        return this.filteredSortedProjects.length;
    },

    // Getter for the count of projects assigned to a specific tranche (excluding unassigned)
    tranchedProjectCount() {
        return this.filteredSortedProjects.filter(p => p.Tranche?.ID).length;
    },

    // Getter to identify IDs of projects with potential duplicate lat/long
    duplicateLatLongProjectIds: (state) => {
        const coordsMap = new Map();
        (state.projectList || []).forEach(project => {
            const lat = project.latitude;
            const long = project.longitude;
            const latNum = parseFloat(lat);
            const longNum = parseFloat(long);
            if (!isNaN(latNum) && !isNaN(longNum) && latNum !== 0 && longNum !== 0 && project.ID) {
                const key = `${latNum.toFixed(6)},${longNum.toFixed(6)}`;
                if (!coordsMap.has(key)) coordsMap.set(key, []);
                coordsMap.get(key).push(project.ID);
            }
        });
        const duplicateIds = new Set();
        for (const ids of coordsMap.values()) {
            if (ids.length > 1) ids.forEach(id => duplicateIds.add(id));
        }
        return duplicateIds;
    }
  },

  actions: {
    // Internal helper actions (optional, replace mutations)
    _setProjects(projects) {
        this.projectList = projects;
    },
    _setLoading(isLoading) {
        this.isLoading = isLoading;
    },
    _setError(error) {
        this.error = error;
    },
    _setLastUpdated(timestamp) {
        this.lastUpdatedTimestamp = timestamp;
    },
    // Actions replacing mutations for filters/sort
    _setFilterMode(value) {
        this.filterModeIsDemosOnly = !!value;
    },
    _setSearchTerm(term) {
        this.filters.searchTerm = term?.toLowerCase() || '';
    },
    _setFilter({ key, value }) {
        if (this.filters.hasOwnProperty(key)) {
            this.filters[key] = value;
        } else {
            console.warn(`Projects Store (Pinia): Attempted to set unknown filter key: ${key}`);
        }
    },
    _setSort({ field, direction }) {
        this.sortBy = field || defaultSort.field;
        this.sortDirection = direction || defaultSort.direction;
        // --- Save updated sort settings to localStorage ---
        saveSetting(LS_KEYS.TOOLBAR_SORT, { field: this.sortBy, direction: this.sortDirection });
    },
    _resetFiltersSort() {
        this.filters = { ...defaultFilters };
        this.sortBy = defaultSort.field;
        this.sortDirection = defaultSort.direction;
        this.filterOnlyDuplicates = false;
        // --- Save default sort settings to localStorage ---
        saveSetting(LS_KEYS.TOOLBAR_SORT, { field: this.sortBy, direction: this.sortDirection });
    },
    // Actions replacing mutations for optimistic updates
    _updateProjectStageOptimistic({ projectId, newStageId, newStageTitle }) {
         const projectIndex = this.projectList.findIndex(p => p.ID === projectId);
         if (projectIndex !== -1) {
             this.projectList[projectIndex] = {
                 ...this.projectList[projectIndex],
                 New_Stage: {
                     ID: newStageId,
                     title: newStageTitle,
                     display_value: newStageTitle,
                 }
             };
         }
    },
    _revertProjectStageOptimistic({ projectId, originalStageId, originalStageTitle }) {
         const projectIndex = this.projectList.findIndex(p => p.ID === projectId);
         if (projectIndex !== -1) {
             this.projectList[projectIndex] = {
                 ...this.projectList[projectIndex],
                 New_Stage: {
                     ID: originalStageId,
                     title: originalStageTitle,
                     display_value: originalStageTitle,
                 }
             };
         }
    },
    _updateProjectTrancheOptimistic({ projectId, newTrancheId, newTrancheNumber }) {
         const projectIndex = this.projectList.findIndex(p => p.ID === projectId);
         if (projectIndex !== -1) {
             const updatedProject = {
                 ...this.projectList[projectIndex],
                 Tranche: newTrancheId ? { 
                     ID: newTrancheId, 
                     zc_display_value: newTrancheNumber !== undefined ? String(newTrancheNumber) : 'Processing...'
                  } : null
             };
             this.projectList.splice(projectIndex, 1, updatedProject);
         }
    },
    _revertProjectTrancheOptimistic({ projectId, originalTrancheLookup }) {
         const projectIndex = this.projectList.findIndex(p => p.ID === projectId);
         if (projectIndex !== -1) {
             const revertedProject = {
                 ...this.projectList[projectIndex],
                 Tranche: originalTrancheLookup
             };
             this.projectList.splice(projectIndex, 1, revertedProject);
         }
    },
    
    // Public actions corresponding to old Vuex actions
    async fetchInitialProjects() {
      const uiStore = useUiStore();
      this._setLoading(true);
      this._setError(null);

      const loadingNotificationId = `refresh-projects-${Date.now()}`;
      uiStore.addNotification({
          id: loadingNotificationId,
          type: 'info',
          message: 'Loading Projects...',
          duration: 0 // Persistent
      });

      // ... (API fetch logic - same as before)
       let allRawProjects = [];
       let recordCursor = null;
       let hasMoreRecords = true;
       const reportName = REPORT_PROJECTS;
       // Define criteria based on START_IN_DEMO_MODE
       let finalCriteria = null; // Initialize to null (no filter)
       if (START_IN_DEMO_MODE) { 
           // If in demo mode, apply the standard filters
           finalCriteria = `(${FIELD_PROJECT_STAGE_LOOKUP}.ID != ${FIELD_PROJECT_PRE_SALE_STAGE_ID}) && (${FIELD_PROJECT_IS_DEMO} == true)`;
       } 
       // If START_IN_DEMO_MODE is false, finalCriteria remains null (no filters applied)
       
       console.log(`Projects Store (Pinia): Fetching projects with criteria: ${finalCriteria}`);

      try {
        // ... (while loop for fetching)
        while (hasMoreRecords) {
          const response = await ZohoAPIService.getRecords( reportName, finalCriteria, 1000, recordCursor );
          if (response.code !== 3000) throw new Error(response.message || `API Error Code ${response.code}`);
          if (response.data?.length > 0) allRawProjects = allRawProjects.concat(response.data);
          recordCursor = response.record_cursor;
          hasMoreRecords = !!response.record_cursor;
        }
        
        const processedProjects = DataProcessors.processProjectsData(allRawProjects);
        this._setProjects(processedProjects);
        this._setLastUpdated(Date.now());

      } catch (error) {
        console.error("Projects Store (Pinia): Error fetching projects:", error);
        this._setError(error.message || 'Unknown error fetching projects.');
      } finally {
        this._setLoading(false);
        uiStore.removeNotification(loadingNotificationId);
      }
    },

    toggleDemoFilterMode() {
        this._setFilterMode(!this.filterModeIsDemosOnly);
    },
    setSearchTerm(term) {
        this._setSearchTerm(term);
    },
    setFilter({ key, value }) {
        this._setFilter({ key, value });
    },
    setSort({ field, direction }) {
        this._setSort({ field, direction });
    },
    resetFiltersAndSort() {
        this._resetFiltersSort();
    },

    async updateProjectStage({ projectId, newStageId }) {
        const uiStore = useUiStore();
        const lookupsStore = useLookupsStore(); 
        
        const project = this.projectList.find(p => p.ID === projectId);
        const stages = lookupsStore.stages || []; 
        const newStage = stages.find(s => s.id === newStageId);

        if (!project) {
            uiStore.addNotification({ type: 'error', message: 'Project not found.' });
            return;
        }
        if (!newStage) {
             uiStore.addNotification({ type: 'error', message: 'Target stage not found.' });
            return;
        }
        
        const originalStageId = project.New_Stage?.ID;
        const originalStageTitle = project.New_Stage?.title || 'Unknown Stage';
        const newStageTitle = newStage.title;
        
        if (originalStageId === newStageId) return;

        const loadingNotificationId = `loading-${projectId}-${Date.now()}`;
        uiStore.addNotification({ id: loadingNotificationId, type: 'info', message: `Moving project to ${newStageTitle}...`, duration: 0 });

        // Optimistic update
        this._updateProjectStageOptimistic({ projectId, newStageId, newStageTitle });

        try {
           await ZohoAPIService.updateRecordById(REPORT_PROJECTS, projectId, { data: { [FIELD_PROJECT_STAGE_LOOKUP]: newStageId } });
           // --- Log Activity (Fire and Forget) ---
           logActivity(projectId, `Stage updated to '${newStageTitle}'`); 
           
           uiStore.removeNotification(loadingNotificationId);
           uiStore.addNotification({ type: 'success', message: `Project moved to ${newStageTitle}` });
        } catch (error) {
           console.error("Projects Store (Pinia): Failed to update project stage:", error);
           // --- ADD Log error to Zoho --- 
           logErrorToZoho(error, { 
             operation: 'updateProjectStage',
             projectId: projectId,
             newStageId: newStageId,
             details: 'API call failed during stage update.'
           });
           // --- END Log error ---
           uiStore.removeNotification(loadingNotificationId);
           uiStore.addNotification({ type: 'error', message: `Failed to move project. Reverting to ${originalStageTitle}.`, title: 'Update Error' });
           // Revert optimistic update
           this._revertProjectStageOptimistic({ projectId, originalStageId, originalStageTitle });
        }
    },

    async updateProjectTranche({ projectId, newTrancheId }) {
        const uiStore = useUiStore();
        const lookupsStore = useLookupsStore(); 
        
        newTrancheId = newTrancheId === 'unassigned' ? null : newTrancheId; 
        const project = this.projectList.find(p => p.ID === projectId);
        const tranches = lookupsStore.tranches || []; 
        const newTranche = newTrancheId ? tranches.find(t => t.id === newTrancheId) : null;

        if (!project) {
            uiStore.addNotification({ type: 'error', message: 'Project not found.' });
            return;
        }

        const originalTrancheLookup = project.Tranche || null;
        const originalTrancheId = originalTrancheLookup?.ID || null;
        if (originalTrancheId === newTrancheId) return;
        
        const newTrancheNumber = newTranche?.number;
        const newTrancheDisplay = newTranche ? `Tranche ${newTrancheNumber}` : 'Unassigned';
        const originalTrancheDisplay = originalTrancheLookup?.zc_display_value || 'Unassigned';
        
        const loadingNotificationId = `loading-tranche-${projectId}-${Date.now()}`;
        uiStore.addNotification({ id: loadingNotificationId, type: 'info', message: `Moving project to ${newTrancheDisplay}...`, duration: 0 });

        // Optimistic update
        this._updateProjectTrancheOptimistic({ projectId, newTrancheId, newTrancheNumber });

        try {
            await ZohoAPIService.updateRecordById(REPORT_PROJECTS, projectId, { data: { [FIELD_PROJECT_TRANCHE_LOOKUP]: newTrancheId } }); 
            // --- Log Activity (Fire and Forget) ---
            logActivity(projectId, `Tranche updated to '${newTrancheDisplay}'`);
            
            uiStore.removeNotification(loadingNotificationId);
            uiStore.addNotification({ type: 'success', message: `Project moved to ${newTrancheDisplay}` });
        } catch (error) {
            console.error("Projects Store (Pinia): Failed to update project tranche:", error);
            // --- ADD Log error to Zoho --- 
            logErrorToZoho(error, { 
              operation: 'updateProjectTranche',
              projectId: projectId,
              newTrancheId: newTrancheId, // Log the target ID (could be null)
              details: 'API call failed during tranche update.'
            });
            // --- END Log error --- 
            uiStore.removeNotification(loadingNotificationId);
            uiStore.addNotification({ type: 'error', message: `Failed to move project. Reverting to ${originalTrancheDisplay}.`, title: 'Update Error' });
            // Revert optimistic update
            this._revertProjectTrancheOptimistic({ projectId, originalTrancheLookup });
        }
    },

    // Fetch Details still needed here as it fetches PROJECT details
    async fetchProjectDetails(projectId) {
        const uiStore = useUiStore();
        if (!projectId) throw new Error('Project ID is required.');
        try {
            const projectDetails = await ZohoAPIService.getRecordById(REPORT_PROJECT_DETAILS, projectId);
            // *** Need REPORT_CONTACTS constant back or passed in? For now, hardcode report name ***
            // *** Or make fetchProjectDetails only fetch project, and contacts are fetched separately? ***
            // *** Let's keep it simple for now: fetch contacts here but use constant defined below ***
            const REPORT_CONTACTS_LOCAL = "PM_Kanban_Contacts"; // Define locally for now
            const FIELD_CONTACT_PROJECT_LOOKUP_LOCAL = "Project"; // Define locally for now

            const contactCriteria = `(${FIELD_CONTACT_PROJECT_LOOKUP_LOCAL} == ${projectId})`; 
            const contactsResponse = await ZohoAPIService.getRecords(REPORT_CONTACTS_LOCAL, contactCriteria);
            
            // Check the response code for contacts
            let relatedContacts = [];
            if (contactsResponse.code === 3000) {
                relatedContacts = contactsResponse.data || [];
                console.log(`Projects Store (Pinia): Found ${relatedContacts.length} contacts for ${projectId}.`);
            } else if (contactsResponse.code === 9280) {
                console.warn(`Projects Store (Pinia): No contacts found for project ${projectId} (Code 9280). Proceeding without contacts.`);
                relatedContacts = []; // Ensure it's an empty array
            } else {
                // Handle unexpected non-3000/9280 codes as an error
                console.error(`Projects Store (Pinia): Unexpected API response fetching contacts for ${projectId}:`, contactsResponse);
                throw new Error(contactsResponse.message || `API Error Code ${contactsResponse.code} fetching contacts`);
            }

            // Combine project details with the (potentially empty) contacts list
            return { ...projectDetails, Contacts: relatedContacts };
        } catch (error) {
            console.error(`Projects Store (Pinia): Error fetching details for ${projectId}:`, error);
            uiStore.addNotification({ type: 'error', title: 'Load Error', message: `Failed to load details for project ${projectId}. ${error.message}` });
            throw error;
        }
    },

    // *** ADD Action to update project tags ***
    async updateProjectTags({ projectId, tagIds }) {
        const modalStore = useModalStore();
        const uiStore = useUiStore();

        if (!projectId) {
            throw new Error('Project ID is required to update tags.');
        }
        // Ensure tagIds is an array, even if empty
        const payloadTagIds = Array.isArray(tagIds) ? tagIds : [];
        
        const payload = {
            data: {
                [FIELD_PROJECT_TAGS]: payloadTagIds
            }
        };

        console.log(`Projects Store (Pinia): Updating Tags for Project ${projectId} Payload:`, payload);
        const notificationId = `update-tags-${projectId}-${Date.now()}`;
        uiStore.addNotification({ id: notificationId, type: 'info', message: 'Updating tags...', duration: 0 });

        try {
            const response = await ZohoAPIService.updateRecordById(REPORT_PROJECTS, projectId, payload);
            uiStore.removeNotification(notificationId); // Remove loading
            uiStore.addNotification({ type: 'success', message: 'Tags updated successfully!' });
            
            // Log activity for adding/removing might be complex here, 
            // Log is now handled by the component for specificity
            // logActivity(projectId, `Project tags updated.`);

            return response.data; // Return updated project data slice if needed
        } catch (error) {
            uiStore.removeNotification(notificationId); // Remove loading on error
            console.error(`Projects Store (Pinia): Error updating tags for project ${projectId}:`, error);
            // --- ADD Log error to Zoho --- 
            logErrorToZoho(error, { 
              operation: 'updateProjectTags',
              projectId: projectId,
              tagIds: tagIds, // Log the attempted tag IDs
              details: 'API call failed during tag update.'
            });
            // --- END Log error --- 
            uiStore.addNotification({ type: 'error', title: 'Error', message: `Failed to update tags: ${error.message}` });
            throw error;
        }
    },

    // *** ADD Action to update Funded By Redball status ***
    async updateProjectFundedStatus({ projectId, isFunded }) {
        const uiStore = useUiStore();
        
        if (!projectId) {
            throw new Error('Project ID is required to update funded status.');
        }
        
        const payload = {
            data: {
                [FIELD_PROJECT_FUNDED_REDBALL]: isFunded ? 'true' : 'false' // Zoho expects string boolean
            }
        };
        
        const statusText = isFunded ? 'Funded By Redball' : 'NOT Funded By Redball';
        const notificationId = `update-funded-${projectId}-${Date.now()}`;
        uiStore.addNotification({ id: notificationId, type: 'info', message: `Updating status to ${statusText}...`, duration: 0 });

        try {
            const response = await ZohoAPIService.updateRecordById(REPORT_PROJECTS, projectId, payload);
            uiStore.removeNotification(notificationId); // Remove loading
            uiStore.addNotification({ type: 'success', message: `Status updated: ${statusText}` });

            // Log Activity (Fire and Forget)
            logActivity(projectId, `Funding status updated: ${statusText}`);

            // Refresh modal data to reflect change (important if other computed props depend on it)
            const modalStore = useModalStore();
            await modalStore.refreshModalData(); 

            return response.data;
        } catch (error) {
            uiStore.removeNotification(notificationId); // Remove loading on error
            console.error(`Projects Store (Pinia): Error updating funded status for project ${projectId}:`, error);
             // --- ADD Log error to Zoho --- 
            logErrorToZoho(error, { 
              operation: 'updateProjectFundedStatus',
              projectId: projectId,
              isFunded: isFunded, 
              details: 'API call failed during funded status update.'
            });
            // --- END Log error --- 
            uiStore.addNotification({ type: 'error', title: 'Error', message: `Failed to update funding status: ${error.message}` });
            throw error;
        }
    },

    // --- ADD Action for Weekly Email Opt-In ---
    async updateWeeklyEmailOptIn({ projectId, optInStatus }) {
        const uiStore = useUiStore();
        const modalStore = useModalStore();

        if (!projectId) {
            throw new Error('Project ID is required to update weekly email opt-in status.');
        }

        const payload = {
            data: {
                // Assuming the field API name is exactly this
                Weekly_Email_Opt_In: optInStatus ? 'true' : 'false' // Send string boolean
            }
        };

        const statusText = optInStatus ? 'Opted In' : 'Opted Out';
        const notificationId = `update-optin-${projectId}-${Date.now()}`;
        uiStore.addNotification({ id: notificationId, type: 'info', message: `Updating weekly email status to ${statusText}...`, duration: 0 });

        try {
            const response = await ZohoAPIService.updateRecordById(REPORT_PROJECTS, projectId, payload);
            
            if (response.code !== 3000) {
                 throw new Error(response.message || 'Failed to update weekly email opt-in status.');
            }

            uiStore.removeNotification(notificationId); // Remove loading
            uiStore.addNotification({ type: 'success', message: `Weekly email status updated: ${statusText}` });

            // Log Activity (Fire and Forget)
            logActivity(projectId, `Weekly email status updated to: ${statusText}`);

            // Refresh modal data to reflect changes
            // No await needed if we don't need to wait for refresh before proceeding
            modalStore.refreshModalData(); 

            return response.data; // Return updated slice if needed
        } catch (error) {
            uiStore.removeNotification(notificationId); // Remove loading on error
            console.error(`Projects Store (Pinia): Error updating weekly email opt-in for project ${projectId}:`, error);
             // --- ADD Log error to Zoho --- 
            logErrorToZoho(error, { 
              operation: 'updateWeeklyEmailOptIn',
              projectId: projectId,
              optInStatus: optInStatus, 
              details: 'API call failed during weekly email opt-in update.'
            });
            // --- END Log error --- 
            uiStore.addNotification({ type: 'error', title: 'Error', message: `Failed to update weekly email status: ${error.message}` });
            throw error; // Re-throw so the component can potentially handle it
        }
    },

    // --- REMOVE Contact Management Actions --- 
    // async addProjectContact(...) { ... },
    // async updateProjectContact(...) { ... },
    // async deleteProjectContact(...) { ... },
    // async setProjectMainOwner(...) { ... }
    
    // --- ADD Action to update System Overview --- 
    async updateSystemOverview({ projectId, systemData }) {
        const uiStore = useUiStore();
        const modalStore = useModalStore(); // Need modalStore to refresh

        if (!projectId || !systemData) {
            throw new Error('Project ID and system data are required.');
        }

        // Validate/sanitize numeric inputs (ensure they are numbers, not NaN)
        const kW_STC = Number(systemData.kW_STC);
        const Annual_Output_kWh = Number(systemData.Annual_Output_kWh);
        const Annual_Usage = Number(systemData.Annual_Usage);

        if (isNaN(kW_STC) || isNaN(Annual_Output_kWh) || isNaN(Annual_Usage)) {
             uiStore.addNotification({ type: 'error', message: 'System size, output, and usage must be valid numbers.', duration: 4000 });
             throw new Error('Invalid numeric system data.');
        }
        if (kW_STC < 0 || Annual_Output_kWh < 0 || Annual_Usage < 0) {
             uiStore.addNotification({ type: 'error', message: 'System size, output, and usage cannot be negative.', duration: 4000 });
             throw new Error('Negative numeric system data.');
        }
        
        const payload = {
            data: {
                kW_STC: kW_STC, 
                Annual_Output_kWh: Annual_Output_kWh,
                Annual_Usage: Annual_Usage,
                // Confirmed API field name
                Is_Approved: systemData.Is_Approved ? 'true' : 'false' // Convert boolean to Zoho string
            }
        };
        
        console.log(`Projects Store (Pinia): Updating System Overview for Project ${projectId} Payload:`, payload);
        const notificationId = `update-system-${projectId}-${Date.now()}`;
        uiStore.addNotification({ id: notificationId, type: 'info', message: 'Updating system overview...', duration: 0 });

        try {
            const response = await ZohoAPIService.updateRecordById(REPORT_PROJECTS, projectId, payload);
            
            if (response.code !== 3000) {
                 throw new Error(response.message || 'Failed to update system overview.');
            }

            uiStore.removeNotification(notificationId); // Remove loading
            uiStore.addNotification({ type: 'success', message: 'System overview updated successfully!' });

            // Log Activity (Fire and Forget)
            const statusText = systemData.Is_Approved ? 'Approved' : 'Not Approved';
            logActivity(projectId, `System overview updated: Size=${kW_STC}kW, Output=${Annual_Output_kWh}kWh, Usage=${Annual_Usage}kWh, Status=${statusText}`);

            // Refresh modal data to reflect changes
            await modalStore.refreshModalData(); 

            return response.data;
        } catch (error) {
            uiStore.removeNotification(notificationId); // Remove loading on error
            console.error(`Projects Store (Pinia): Error updating system overview for project ${projectId}:`, error);
             // --- ADD Log error to Zoho --- 
            logErrorToZoho(error, { 
              operation: 'updateSystemOverview',
              projectId: projectId,
              systemData: systemData, // Log the data attempted
              details: 'API call failed during system overview update.'
            });
            // --- END Log error --- 
            uiStore.addNotification({ type: 'error', title: 'Error', message: `Failed to update system overview: ${error.message}` });
            throw error;
        }
    },

    // *** ADDED: Trigger Folder Creation Action ***
    async triggerFolderCreation({ projectId }) {
        const uiStore = useUiStore();
        const modalStore = useModalStore();

        if (!projectId) {
            uiStore.addNotification({ type: 'error', message: 'Project ID is required to create folders.'});
            return { success: false, error: 'Missing Project ID' };
        }

        const loadingNotificationId = `create-folders-${projectId}-${Date.now()}`;
        uiStore.addNotification({ id: loadingNotificationId, type: 'info', message: 'Initiating folder creation...', duration: 0 });

        try {
            const payload = { data: { [FIELD_PROJECT_TRIG_CREATE_FOLDERS]: "true" } };
            console.log(`Projects Store: Triggering folder creation for Project ${projectId}`);
            const response = await ZohoAPIService.updateRecordById(REPORT_PROJECTS, projectId, payload);

            if (response.code !== 3000) {
                console.error('Zoho API Error (triggerFolderCreation):', response);
                throw new Error(response.message || 'Failed to trigger folder creation.');
            }

            uiStore.removeNotification(loadingNotificationId);
            // Use a slightly different message, as creation happens in the backend
            uiStore.addNotification({ type: 'success', message: 'Folder creation initiated. Links will appear shortly after refresh.', duration: 6000 }); 
            logActivity(projectId, 'Triggered WorkDrive folder creation');

            // Refresh modal data - links might not be there yet, but good to refresh state
            await modalStore.refreshModalData(); 
            return { success: true };

        } catch (error) {
             console.error(`Error triggering folder creation for project ${projectId}:`, error);
             // --- ADD Log error to Zoho --- 
            logErrorToZoho(error, { 
              operation: 'triggerFolderCreation',
              projectId: projectId, 
              details: 'API call failed when triggering folder creation.'
            });
            // --- END Log error --- 
             uiStore.removeNotification(loadingNotificationId);
             uiStore.addNotification({ type: 'error', title: 'Action Failed', message: `Folder creation trigger failed: ${error.message || 'Unknown error'}` });
             return { success: false, error: error.message || 'Unknown error' };
        }
    },

    // *** ADDED: Add Project Issue Action ***
    async addProjectIssue({ projectId, issueContent, notifySales, taggedUserIds = [] }) {
        const uiStore = useUiStore();
        const { useUserStore } = await import('./userStore.js'); // Dynamic import for userStore
        const userStore = useUserStore();
        
        if (!projectId || !issueContent) {
            uiStore.addNotification({ type: 'error', message: 'Project ID and issue description are required.'});
            throw new Error('Missing required fields for adding issue.');
        }

        const currentUser = userStore.currentUser;
        if (!currentUser?.id) {
             uiStore.addNotification({ type: 'error', message: 'Could not identify current user to add issue.'});
             throw new Error('Current user not found.');
        }
        
        const payload = {
            data: {
                [FIELD_ISSUE_CONTENT]: issueContent,
                [FIELD_ISSUE_PROJECT_LOOKUP]: projectId,
                // Set both Author text and User lookup for redundancy/compatibility
                [FIELD_ISSUE_AUTHOR_TEXT]: currentUser.name || 'Unknown Portal User',
                [FIELD_ISSUE_USER_LOOKUP]: currentUser.id,
                [FIELD_ISSUE_NOTIFY_SALES]: notifySales ? 'true' : 'false',
                // Tagged_Users expects an array of User IDs
                [FIELD_ISSUE_TAGGED_USERS]: taggedUserIds 
            }
        };

        const loadingNotificationId = `add-issue-${projectId}-${Date.now()}`;
        uiStore.addNotification({ id: loadingNotificationId, type: 'info', message: 'Adding issue...', duration: 0 });

        try {
            const response = await ZohoAPIService.addRecord(FORM_ISSUES, payload);
            if (response.code !== 3000) {
                 console.error('Zoho API Error (addProjectIssue):', response);
                 throw new Error(response.message || 'Failed to add issue.');
            }
            uiStore.removeNotification(loadingNotificationId);
            uiStore.addNotification({ type: 'success', message: 'Issue added successfully!' });
            logActivity(projectId, `Issue raised: "${issueContent.substring(0, 50)}..."`);
            return response.data; // Return the ID of the newly created issue record
        } catch (error) {
             console.error(`Error adding issue for project ${projectId}:`, error);
              // --- ADD Log error to Zoho --- 
            logErrorToZoho(error, { 
              operation: 'addProjectIssue',
              projectId: projectId, 
              issueContent: issueContent, // Log the content
              notifySales: notifySales,
              taggedUserIds: taggedUserIds,
              details: 'API call failed when adding project issue.'
            });
            // --- END Log error --- 
             uiStore.removeNotification(loadingNotificationId);
             uiStore.addNotification({ type: 'error', title: 'Action Failed', message: `Failed to add issue: ${error.message || 'Unknown error'}` });
             throw error; // Re-throw error so component can handle it
        }
    },

    // *** ADDED: Resolve Project Issue Action ***
    async resolveProjectIssue({ issueId }) {
        const uiStore = useUiStore();
        const { useUserStore } = await import('./userStore.js'); // Dynamic import for userStore
        const userStore = useUserStore();

        if (!issueId) {
            uiStore.addNotification({ type: 'error', message: 'Issue ID is required to resolve.'});
            throw new Error('Missing required fields for resolving issue.');
        }

        const currentUser = userStore.currentUser;
        if (!currentUser?.id) {
             uiStore.addNotification({ type: 'error', message: 'Could not identify current user to resolve issue.'});
             throw new Error('Current user not found.');
        }
        
        const { REPORT_ISSUES, FIELD_ISSUE_IS_RESOLVED, FIELD_ISSUE_RESOLVED_BY } = await import('../config/constants.js');

        const payload = {
            data: {
                [FIELD_ISSUE_IS_RESOLVED]: 'true',
                [FIELD_ISSUE_RESOLVED_BY]: currentUser.id // Assuming Resolved_By is a lookup field
            }
        };
        
        const loadingNotificationId = `resolve-issue-${issueId}-${Date.now()}`;
        uiStore.addNotification({ id: loadingNotificationId, type: 'info', message: 'Marking issue as resolved...', duration: 0 });
        
        try {
            // Use REPORT_ISSUES for updating
            const response = await ZohoAPIService.updateRecordById(REPORT_ISSUES, issueId, payload);
            if (response.code !== 3000) {
                 console.error('Zoho API Error (resolveProjectIssue):', response);
                 // Handle nested error structure if necessary (based on API behavior)
                 const nestedResult = response.result?.[0];
                 if (nestedResult && nestedResult.code !== 3000) {
                     throw new Error(nestedResult.message || `Nested API Error Code ${nestedResult.code}`);
                 }
                 throw new Error(response.message || 'Failed to resolve issue.');
            }
            uiStore.removeNotification(loadingNotificationId);
            uiStore.addNotification({ type: 'success', message: 'Issue marked as resolved!' });
            // Log activity? Might be redundant if the UI just hides it.
            // logActivity(projectId, `Issue resolved (ID: ${issueId})`); // Need projectId here if logging
            return response.data; // Return updated data slice if needed
        } catch (error) {
             console.error(`Error resolving issue ${issueId}:`, error);
              // --- ADD Log error to Zoho --- 
            logErrorToZoho(error, { 
              operation: 'resolveProjectIssue',
              issueId: issueId, 
              details: 'API call failed when resolving project issue.'
            });
            // --- END Log error --- 
             uiStore.removeNotification(loadingNotificationId);
             uiStore.addNotification({ type: 'error', title: 'Action Failed', message: `Failed to resolve issue: ${error.message || 'Unknown error'}` });
             throw error; // Re-throw error so component can handle it
        }
    },

    // *** ADDED: Toggle Duplicate Filter Action ***
    toggleDuplicateFilter() {
        this.filterOnlyDuplicates = !this.filterOnlyDuplicates;
    },

    // *** ADDED: Update Assigned Sales Rep Action ***
    async updateProjectSalesRep({ projectId, newSalesRepId, oldSalesRepName, newSalesRepName }) {
        const uiStore = useUiStore();
        const modalStore = useModalStore(); // Needed to refresh modal

        if (!projectId) {
            uiStore.addNotification({ type: 'error', message: 'Project ID is required.'});
            throw new Error('Project ID missing');
        }

        // If newSalesRepId is null/undefined, Zoho expects an empty string to clear a lookup
        const payload = { data: { Sales_Rep: newSalesRepId || "" } }; 

        const loadingNotificationId = `update-rep-${projectId}-${Date.now()}`;
        uiStore.addNotification({ id: loadingNotificationId, type: 'info', message: `Assigning Sales Rep to ${newSalesRepName || 'None'}...`, duration: 0 });

        try {
            const response = await ZohoAPIService.updateRecordById(REPORT_PROJECTS, projectId, payload);

            if (response.code !== 3000) {
                console.error('Zoho API Error (updateProjectSalesRep):', response);
                throw new Error(response.message || 'Failed to update Sales Rep.');
            }

            uiStore.removeNotification(loadingNotificationId);
            uiStore.addNotification({ type: 'success', message: `Sales Rep assigned to ${newSalesRepName || 'None'}!` });

            // Log Granular Activity
            const logMsg = `Changed Sales Rep from '${oldSalesRepName || 'None'}' to '${newSalesRepName || 'None'}'`;
            logActivity(projectId, logMsg);

            // Refresh modal data
            await modalStore.refreshModalData();

            return response.data;

        } catch (error) {
            console.error(`Error updating Sales Rep for project ${projectId}:`, error);
            logErrorToZoho(error, {
              operation: 'updateProjectSalesRep',
              projectId: projectId,
              newSalesRepId: newSalesRepId,
              details: 'API call failed during Sales Rep update.'
            });
            uiStore.removeNotification(loadingNotificationId);
            uiStore.addNotification({ type: 'error', title: 'Update Failed', message: `Failed to assign Sales Rep: ${error.message}` });
            throw error; // Re-throw
        }
        // No finally needed here as loading state is managed in the component
    },

    // *** ADD Action to update a specific Event's Date/Status ***
    async updateProjectEvent({ projectId, eventType, apiBookingField, apiStatusField, newDateValue, newStatusValue }) {
         const uiStore = useUiStore();
         const modalStore = useModalStore();

         if (!projectId || !apiBookingField || !apiStatusField) {
             throw new Error('Project ID and API field names are required to update event.');
         }

         const payload = { data: {} };
         let logParts = [];

         // Format date ONLY if a new value is provided (null or empty string means clear the date)
         const formattedDate = newDateValue ? formatDateTimeForZohoAPI(newDateValue) : ""; // Use helper, empty string to clear in Zoho?
         payload.data[apiBookingField] = formattedDate;
         logParts.push(`Date set to ${formattedDate || 'empty'}`);


         // Include status ONLY if provided and not null/undefined AND NOT 'TBD'
         if (newStatusValue !== null && newStatusValue !== undefined && newStatusValue !== 'TBD') {
              payload.data[apiStatusField] = newStatusValue;
              logParts.push(`Status set to ${newStatusValue}`);
         }

         if (Object.keys(payload.data).length === 0) {
              console.warn('No changes detected for project event update.');
              return; // Nothing to update
         }

         console.log(`Projects Store: Updating Event ${eventType} for Project ${projectId} Payload:`, payload);
         const notificationId = `update-event-${eventType}-${projectId}-${Date.now()}`;
         uiStore.addNotification({ id: notificationId, type: 'info', message: `Updating ${eventType}...`, duration: 0 });

         try {
             // Use REPORT_PROJECTS for update, as most fields reside there
             const response = await ZohoAPIService.updateRecordById(REPORT_PROJECTS, projectId, payload);

             if (response.code !== 3000) {
                 console.error('Zoho API Error (updateProjectEvent): ', response);
                 throw new Error(response.message || 'Failed to update project event.');
             }

             uiStore.removeNotification(notificationId); // Remove loading
             uiStore.addNotification({ type: 'success', message: `${eventType} updated successfully!` });

             // Log Activity (Fire and Forget)
             logActivity(projectId, `${eventType} updated: ${logParts.join(', ')}`);

             // Refresh modal data to reflect changes
             await modalStore.refreshModalData();

             return response.data; // Return updated slice if needed
         } catch (error) {
             uiStore.removeNotification(notificationId);
             console.error(`Error updating ${eventType} for project ${projectId}:`, error);
             logErrorToZoho(error, {
               operation: 'updateProjectEvent',
               projectId: projectId,
               eventType: eventType,
               payloadAttempted: payload, // Log the payload we tried to send
               details: 'API call failed during project event update.'
             });
             uiStore.addNotification({ type: 'error', title: 'Update Error', message: `Failed to update ${eventType}: ${error.message}` });
             throw error; // Re-throw so the component knows it failed
         }
     },

    // *** ADDED: Add Project Task Action ***
    async addTask({ projectId, description, assigneeIds, priority, dueDate }) {
        const uiStore = useUiStore();
        const modalStore = useModalStore();
        // Instantiate userStore inside the action
        const { useUserStore } = await import('./userStore.js'); // Import dynamically or ensure top-level works
        const userStore = useUserStore();

        if (!projectId || !description || !assigneeIds || assigneeIds.length === 0) {
            uiStore.addNotification({ type: 'error', message: 'Project, description, and at least one assignee are required.' });
            throw new Error('Missing required fields for adding task.');
        }
        
        const assignedById = userStore.currentUser?.id;
        if (!assignedById) {
             uiStore.addNotification({ type: 'error', message: 'Could not determine assigning user.' });
             throw new Error('Assigning user ID not found.');
        }

        // Import constants within the action or at the top if preferred
        const { 
            FORM_TASKS,
            FIELD_TASK_PROJECT_LOOKUP,
            FIELD_TASK_DESCRIPTION,
            FIELD_TASK_ASSIGNEE_LOOKUP,
            FIELD_TASK_ASSIGNED_BY_LOOKUP,
            FIELD_TASK_PRIORITY,
            FIELD_TASK_DUE_DATE,
            FIELD_TASK_STATUS // Need status for default
         } = await import('../config/constants.js');
         const { formatDateTimeForZohoAPI } = await import('../utils/helpers.js'); // For date formatting

        // Ensure assigneeIds contains only the primitive IDs
        const finalAssigneeIds = Array.isArray(assigneeIds) 
            ? assigneeIds.map(assignee => (typeof assignee === 'object' && assignee !== null) ? assignee.value : assignee).filter(Boolean)
            : [];

        const payload = {
            data: {
                [FIELD_TASK_PROJECT_LOOKUP]: projectId,
                [FIELD_TASK_DESCRIPTION]: description,
                [FIELD_TASK_ASSIGNEE_LOOKUP]: finalAssigneeIds, // Use the processed array of IDs
                [FIELD_TASK_ASSIGNED_BY_LOOKUP]: assignedById,
                [FIELD_TASK_STATUS]: 'To Do', // Default status
                // Optional fields:
                ...(priority && { [FIELD_TASK_PRIORITY]: priority }),
                ...(dueDate && { [FIELD_TASK_DUE_DATE]: formatDateTimeForZohoAPI(dueDate, true) }) // Format as Date only
            }
        };

        console.log(`Projects Store: Adding Task for Project ${projectId} Payload:`, payload);
        const loadingNotificationId = `add-task-${projectId}-${Date.now()}`;
        uiStore.addNotification({ id: loadingNotificationId, type: 'info', message: 'Adding task...', duration: 0 });

        try {
            const response = await ZohoAPIService.addRecord(FORM_TASKS, payload);
            if (response.code !== 3000) {
                console.error('Zoho API Error (addTask):', response);
                throw new Error(response.message || 'Failed to add task.');
            }
            uiStore.removeNotification(loadingNotificationId);
            uiStore.addNotification({ type: 'success', message: 'Task added successfully!' });
            logActivity(projectId, `Task added: "${description.substring(0, 50)}..."`);
            
            // Refresh modal data to show the new task
            await modalStore.refreshModalData();

            return response.data; // Return the ID of the newly created task record
        } catch (error) {
             console.error(`Error adding task for project ${projectId}:`, error);
            logErrorToZoho(error, {
              operation: 'addTask',
              projectId: projectId,
              payloadAttempted: payload, 
              details: 'API call failed when adding project task.'
            });
             uiStore.removeNotification(loadingNotificationId);
             uiStore.addNotification({ type: 'error', title: 'Action Failed', message: `Failed to add task: ${error.message || 'Unknown error'}` });
             throw error; // Re-throw error so component can handle it
        }
    },

    // *** ADDED: Update Task Status Action ***
    async updateTaskStatus({ taskId, newStatus }) {
        const uiStore = useUiStore();
        const modalStore = useModalStore(); // To refresh data after update

        if (!taskId || !newStatus) {
            uiStore.addNotification({ type: 'error', message: 'Task ID and new status are required.'});
            throw new Error('Missing required fields for updating task status.');
        }
        
        // Import constants dynamically or ensure they are available
        const { FORM_TASKS, FIELD_TASK_STATUS } = await import('../config/constants.js');

        const payload = {
            data: {
                [FIELD_TASK_STATUS]: newStatus
            }
        };

        console.log(`Projects Store: Updating Task ${taskId} status to ${newStatus} Payload:`, payload);
        const loadingNotificationId = `update-task-status-${taskId}-${Date.now()}`;
        uiStore.addNotification({ id: loadingNotificationId, type: 'info', message: `Updating task status to ${newStatus}...`, duration: 0 });

        try {
            // Use REPORT_TASKS (Corrected) to update the task record directly
            const { REPORT_TASKS } = await import('../config/constants.js'); // Ensure REPORT_TASKS is imported
            const response = await ZohoAPIService.updateRecordById(REPORT_TASKS, taskId, payload);
            
            if (response.code !== 3000) {
                console.error('Zoho API Error (updateTaskStatus):', response);
                // Handle potential nested error structure if API returns it
                 const nestedResult = response.result?.[0];
                 if (nestedResult && nestedResult.code !== 3000) {
                     throw new Error(nestedResult.message || `Nested API Error Code ${nestedResult.code}`);
                 }
                throw new Error(response.message || 'Failed to update task status.');
            }
            
            uiStore.removeNotification(loadingNotificationId);
            uiStore.addNotification({ type: 'success', message: `Task status updated to ${newStatus}!` });
            
            // Refresh modal data to reflect the change
            // No need to log activity for simple status change? Or maybe log it?
            // logActivity(projectId, `Task ${taskId} status changed to ${newStatus}`); // Need project ID for this
            await modalStore.refreshModalData();

            return response.data; // Return updated data slice if needed
        } catch (error) {
            console.error(`Error updating status for task ${taskId}:`, error);
            logErrorToZoho(error, {
              operation: 'updateTaskStatus',
              taskId: taskId,
              newStatus: newStatus,
              details: 'API call failed when updating task status.'
            });
            uiStore.removeNotification(loadingNotificationId);
            uiStore.addNotification({ type: 'error', title: 'Action Failed', message: `Failed to update task status: ${error.message || 'Unknown error'}` });
            throw error; // Re-throw error so component can handle it
        }
    }
  }
}); 