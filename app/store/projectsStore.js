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
  DEFAULT_SORT_DIRECTION,
  FIELD_PROJECT_TRANCHE_LOOKUP,
  REPORT_CONTACTS
} from '../config/constants.js';
// Import helper function
// import { formatRelativeTime } from '../utils/helpers.js';
// Import EVENT_TYPES
import { EVENT_TYPES } from '../config/options.js';

// Import other Pinia stores needed for actions/getters
import { useUiStore } from './uiStore.js'; 
import { useLookupsStore } from './lookupsStore.js'; 

// Access Pinia global
const { defineStore } = Pinia;

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

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projectList: [], 
    isLoading: false,
    error: null,
    lastUpdatedTimestamp: null,
    filterModeIsDemosOnly: false,
    filters: { ...defaultFilters },
    sortBy: defaultSort.field,
    sortDirection: defaultSort.direction,
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
            FIELD_PROJECT_HO_CANCELLED_REDBALL_STAGE_ID
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
    },
    _resetFiltersSort() {
        this.filters = { ...defaultFilters };
        this.sortBy = defaultSort.field;
        this.sortDirection = defaultSort.direction;
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
       let finalCriteria = `(${FIELD_PROJECT_STAGE_LOOKUP}.ID != ${FIELD_PROJECT_ARCHIVED_STAGE_ID})`;

      try {
        // ... (while loop for fetching)
        while (hasMoreRecords) {
          const response = await ZohoAPIService.getRecords( reportName, finalCriteria, 1000, recordCursor );
          if (response.code !== 3000) throw new Error(response.message || `API Error Code ${response.code}`);
          if (response.data?.length > 0) allRawProjects = allRawProjects.concat(response.data);
          recordCursor = response.more_records;
          hasMoreRecords = !!response.more_records;
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
           uiStore.removeNotification(loadingNotificationId);
           uiStore.addNotification({ type: 'success', message: `Project moved to ${newStageTitle}` });
        } catch (error) {
           console.error("Projects Store (Pinia): Failed to update project stage:", error);
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
            uiStore.removeNotification(loadingNotificationId);
            uiStore.addNotification({ type: 'success', message: `Project moved to ${newTrancheDisplay}` });
        } catch (error) {
            console.error("Projects Store (Pinia): Failed to update project tranche:", error);
            uiStore.removeNotification(loadingNotificationId);
            uiStore.addNotification({ type: 'error', message: `Failed to move project. Reverting to ${originalTrancheDisplay}.`, title: 'Update Error' });
            // Revert optimistic update
            this._revertProjectTrancheOptimistic({ projectId, originalTrancheLookup });
        }
    },

    async fetchProjectDetails(projectId) {
        const uiStore = useUiStore();
        if (!projectId) throw new Error('Project ID is required.');
        // console.log(`Projects Store (Pinia): Fetching details for project ID: ${projectId}`);
        try {
            const projectDetails = await ZohoAPIService.getRecordById(REPORT_PROJECTS, projectId);
            const contactCriteria = `(Project == ${projectId})`; 
            const contactsResponse = await ZohoAPIService.getRecords(REPORT_CONTACTS, contactCriteria);
            const relatedContacts = contactsResponse.data || [];
            return { ...projectDetails, Contacts: relatedContacts };
        } catch (error) {
            console.error(`Projects Store (Pinia): Error fetching details for ${projectId}:`, error);
            uiStore.addNotification({ type: 'error', title: 'Load Error', message: `Failed to load details for project ${projectId}. ${error.message}` });
            throw error;
        }
    }
  }
}); 