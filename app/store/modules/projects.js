// app/store/modules/projects.js

import ZohoAPIService from '../../services/zohoCreatorAPI.js';
import DataProcessors from '../../utils/processors.js';
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
  FIELD_PROJECT_TRANCHE_LOOKUP
} from '../../config/constants.js';
// Import helper function
import { formatRelativeTime } from '../../utils/helpers.js';

// Ensure required globals are loaded
// if (typeof window.ZohoAPIService === 'undefined') {
//   throw new Error('ZohoAPIService is not loaded. Make sure zohoCreatorAPI.js is included before this file.');
// }
// if (typeof window.DataProcessors === 'undefined') {
//   throw new Error('DataProcessors is not loaded. Make sure processors.js is included before this file.');
// }

// Use the new field name for default sort
const DEFAULT_SORT_FIELD = 'Owner_Name_Display';
const defaultSort = { field: DEFAULT_SORT_FIELD, direction: DEFAULT_SORT_DIRECTION };

const defaultFilters = {
    searchTerm: '',
    tags: [], // Array of tag IDs
    workRequired: [], // Array of strings: ['tree', 'roof', 'panel']
    selectedSalesRepNames: [], // Renamed from salesRep
    selectedSalesOrgNames: [], // Added
    projectType: [], // commercial / residential
    cashDeal: null, // null = all, true = cash, false = not cash
    needHelp: null, // null = all, true = needs help
};

const projectsModule = {
  namespaced: true,

  state: () => ({
    projectList: [], // Holds the processed list of ALL projects fetched
    isLoading: false,
    error: null,
    lastUpdatedTimestamp: null, // Added state for timestamp
    filterModeIsDemosOnly: false, // Default: show only NON-demos
    // Filters and Sorting state
    filters: { ...defaultFilters },
    sortBy: defaultSort.field,
    sortDirection: defaultSort.direction,
    // recordCursor: null, // Keep for pagination later
  }),

  mutations: {
    SET_PROJECTS(state, projects) {
      state.projectList = projects;
    },
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
    SET_FILTER_MODE_IS_DEMOS_ONLY(state, value) {
        state.filterModeIsDemosOnly = !!value;
    },
    SET_LAST_UPDATED(state, timestamp) { // Added mutation
      state.lastUpdatedTimestamp = timestamp;
    },
    // Mutations for filters and sorting
    SET_SEARCH_TERM(state, term) {
        state.filters.searchTerm = term?.toLowerCase() || '';
    },
    SET_FILTER(state, { key, value }) {
        // Ensure the filter key exists before setting
        if (state.filters.hasOwnProperty(key)) {
            state.filters[key] = value;
        } else {
            console.warn(`Projects Store: Attempted to set unknown filter key: ${key}`);
        }
    },
    SET_SORT(state, { field, direction }) {
        state.sortBy = field || defaultSort.field;
        state.sortDirection = direction || defaultSort.direction;
    },
    RESET_FILTERS_SORT(state) {
        state.filters = { ...defaultFilters };
        state.sortBy = defaultSort.field;
        state.sortDirection = defaultSort.direction;
    },
    // Optimistic UI update
    UPDATE_PROJECT_STAGE(state, { projectId, newStageId, newStageTitle }) {
        const projectIndex = state.projectList.findIndex(p => p.ID === projectId);
        if (projectIndex !== -1) {
            // Store original stage temporarily if needed for revert, although action should handle it
            // state.projectList[projectIndex]._originalStage = { ...state.projectList[projectIndex].stageField };
            state.projectList[projectIndex] = {
                ...state.projectList[projectIndex],
                // Use the new field name New_Stage
                New_Stage: {
                    ID: newStageId,
                    title: newStageTitle,
                    display_value: newStageTitle, // Keep display_value consistent
                }
            };
        } else {
            console.warn(`Projects Store: Project with ID ${projectId} not found for stage update.`);
        }
    },
    // Mutation to revert stage change on API error
    REVERT_PROJECT_STAGE(state, { projectId, originalStageId, originalStageTitle }) {
        const projectIndex = state.projectList.findIndex(p => p.ID === projectId);
        if (projectIndex !== -1) {
            state.projectList[projectIndex] = {
                ...state.projectList[projectIndex],
                // Use the new field name New_Stage
                New_Stage: {
                    ID: originalStageId,
                    title: originalStageTitle,
                    display_value: originalStageTitle, // Keep display_value consistent
                }
            };
        } else {
            console.warn(`Projects Store: Project with ID ${projectId} not found for stage revert.`);
        }
    },
    UPDATE_PROJECT_TRANCHE(state, { projectId, newTrancheId, newTrancheNumber }) {
        const projectIndex = state.projectList.findIndex(p => p.ID === projectId);
        if (projectIndex !== -1) {
            // Clone the project and update the Tranche lookup object
            const updatedProject = {
                ...state.projectList[projectIndex],
                Tranche: newTrancheId ? { 
                    ID: newTrancheId, 
                    // Try to get display_value from number if provided
                    zc_display_value: newTrancheNumber !== undefined ? String(newTrancheNumber) : 'Processing...'
                 } : null // Set to null if newTrancheId is null/undefined (for unassigned)
            };
            // Update the array immutably (Vue 3 reactivity handles this well)
            state.projectList.splice(projectIndex, 1, updatedProject);
        } else {
            console.warn(`Projects Store: Project with ID ${projectId} not found for tranche update.`);
        }
    },
    REVERT_PROJECT_TRANCHE(state, { projectId, originalTrancheLookup }) {
        const projectIndex = state.projectList.findIndex(p => p.ID === projectId);
        if (projectIndex !== -1) {
             // Clone the project and restore the original Tranche lookup object
            const revertedProject = {
                ...state.projectList[projectIndex],
                Tranche: originalTrancheLookup // Restore the original lookup object (or null)
            };
            // Update the array immutably
            state.projectList.splice(projectIndex, 1, revertedProject);
            const originalTrancheDisplay = originalTrancheLookup?.zc_display_value || 'Unassigned';
        } else {
            console.warn(`Projects Store: Project with ID ${projectId} not found for tranche revert.`);
        }
    }
  },

  actions: {
    /**
     * Fetches the list of projects, excluding archived.
     */
    async fetchInitialProjects({ commit, state, dispatch }) {
      // Set loading state immediately
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);

      // Show loading notification
      const loadingNotificationId = `refresh-projects-${Date.now()}`;
      dispatch('ui/addNotification', {
          id: loadingNotificationId,
          type: 'info',
          message: 'Loading Projects...',
          duration: 0 // Persistent
      }, { root: true });

      let allRawProjects = [];
      let recordCursor = null;
      let hasMoreRecords = true;
      const reportName = REPORT_PROJECTS;
      
      // Base criteria: Exclude 'Archived' stage only
      let finalCriteria = `(${FIELD_PROJECT_STAGE_LOOKUP}.ID != ${FIELD_PROJECT_ARCHIVED_STAGE_ID})`;

      try {
        while (hasMoreRecords) {
          const response = await ZohoAPIService.getRecords(
            reportName,
            finalCriteria, 
            1000,
            recordCursor
          );

          if (response.code !== 3000) {
            throw new Error(response.message || `API Error Code ${response.code} fetching projects.`);
          }

          if (response.data && response.data.length > 0) {
             allRawProjects = allRawProjects.concat(response.data);
          } else {
          }

          if (response.more_records) {
            recordCursor = response.more_records;
            hasMoreRecords = true;
          } else {
            hasMoreRecords = false;
          }
        } 
        
        const processedProjects = DataProcessors.processProjectsData(allRawProjects);
        // Clear old projects and set new ones *after* successful fetch & process
        commit('SET_PROJECTS', processedProjects);
        commit('SET_LAST_UPDATED', Date.now());

      } catch (error) {
        console.error("Projects Store: Error in fetchProjects action:", error);
        commit('SET_ERROR', error.message || 'An unknown error occurred while fetching projects.');
        // Optionally clear projects on error? Or keep stale data?
        // commit('SET_PROJECTS', []); // Uncomment to clear on error
      } finally {
        commit('SET_LOADING', false);
        // Remove loading notification
        dispatch('ui/removeNotification', loadingNotificationId, { root: true });
      }
    },

    /**
     * Toggles the client-side demo filter mode.
     */
    toggleDemoFilterMode({ commit, state }) {
        const newValue = !state.filterModeIsDemosOnly;
        commit('SET_FILTER_MODE_IS_DEMOS_ONLY', newValue); 
    },

    // Actions to update filters and sorting
    setSearchTerm({ commit }, term) {
        commit('SET_SEARCH_TERM', term);
    },
    setFilter({ commit }, { key, value }) {
        commit('SET_FILTER', { key, value });
    },
    setSort({ commit }, { field, direction }) {
        commit('SET_SORT', { field, direction });
    },
    resetFiltersAndSort({ commit }) {
        commit('RESET_FILTERS_SORT');
    },

    /**
     * Updates the stage of a project.
     */
    async updateProjectStage({ commit, state, rootState, dispatch }, { projectId, newStageId }) {
        const project = state.projectList.find(p => p.ID === projectId);
        const stages = rootState.lookups.stages || [];
        const newStage = stages.find(s => s.id === newStageId);

        if (!project) {
            console.error(`Projects Store: Project ${projectId} not found locally.`);
            dispatch('ui/addNotification', { type: 'error', message: 'Project not found.' }, { root: true });
            return;
        }
        if (!newStage) {
            console.error(`Projects Store: New Stage ${newStageId} not found in lookups.`);
             dispatch('ui/addNotification', { type: 'error', message: 'Target stage not found.' }, { root: true });
            return;
        }
        
        // Use the new field name New_Stage
        const originalStageId = project.New_Stage?.ID;
        const originalStageTitle = project.New_Stage?.title || 'Unknown Stage';
        const newStageTitle = newStage.title;
        
        if (originalStageId === newStageId) {
             return;
        }

        const loadingNotificationId = `loading-${projectId}-${Date.now()}`;
        dispatch('ui/addNotification', {
            id: loadingNotificationId,
            type: 'info',
            message: `Moving project to ${newStageTitle}...`,
            duration: 0 
        }, { root: true });

        commit('UPDATE_PROJECT_STAGE', { projectId, newStageId, newStageTitle });

        // Use constants for report and field names
        const reportName = REPORT_PROJECTS;
        const updateData = { data: { [FIELD_PROJECT_STAGE_LOOKUP]: newStageId } };

        try {
           await ZohoAPIService.updateRecordById(reportName, projectId, updateData);
           dispatch('ui/removeNotification', loadingNotificationId, { root: true });

           dispatch('ui/addNotification', {
               type: 'success',
               message: `Project moved to ${newStageTitle}`
           }, { root: true });

        } catch (error) {
           console.error("Projects Store: Failed to update project stage via API:", error);
           dispatch('ui/removeNotification', loadingNotificationId, { root: true });
           dispatch('ui/addNotification', {
               type: 'error',
               message: `Failed to move project. Reverting to ${originalStageTitle}.`,
               title: 'Update Error'
           }, { root: true });

           commit('REVERT_PROJECT_STAGE', { projectId, originalStageId, originalStageTitle });
        }
    },
    /**
     * Updates the tranche of a project.
     */
    async updateProjectTranche({ commit, state, rootState, dispatch }, { projectId, newTrancheId }) {
        newTrancheId = newTrancheId === 'unassigned' ? null : newTrancheId; // Handle 'unassigned' case
        const project = state.projectList.find(p => p.ID === projectId);
        const tranches = rootState.lookups.tranches || []; // Get tranches from lookups
        // Find the new tranche object if an ID is provided
        const newTranche = newTrancheId ? tranches.find(t => t.id === newTrancheId) : null;

        if (!project) {
            console.error(`Projects Store: Project ${projectId} not found locally.`);
            dispatch('ui/addNotification', { type: 'error', message: 'Project not found.' }, { root: true });
            return;
        }

        // Store the original Tranche lookup object (or null if it didn't exist)
        const originalTrancheLookup = project.Tranche || null;
        const originalTrancheId = originalTrancheLookup?.ID || null;
        const originalTrancheDisplay = originalTrancheLookup?.zc_display_value || 'Unassigned';
        
        // Determine details for display/optimistic update
        const newTrancheNumber = newTranche?.number;
        const newTrancheDisplay = newTranche ? `Tranche ${newTrancheNumber}` : 'Unassigned';

        // Prevent unnecessary updates if the tranche hasn't actually changed
        if (originalTrancheId === newTrancheId) {
            return;
        }
        
        const loadingNotificationId = `loading-tranche-${projectId}-${Date.now()}`;
        dispatch('ui/addNotification', {
            id: loadingNotificationId,
            type: 'info',
            message: `Moving project to ${newTrancheDisplay}...`,
            duration: 0 
        }, { root: true });

        // Optimistic UI Update - Pass number for potential display value generation
        commit('UPDATE_PROJECT_TRANCHE', { projectId, newTrancheId, newTrancheNumber });

        // API Call - Use FIELD_PROJECT_TRANCHE_LOOKUP
        const reportName = REPORT_PROJECTS;
        // For lookup fields, setting the value to null should clear the lookup in Zoho
        const updateData = { data: { [FIELD_PROJECT_TRANCHE_LOOKUP]: newTrancheId } }; 

        try {
            await ZohoAPIService.updateRecordById(reportName, projectId, updateData);
            dispatch('ui/removeNotification', loadingNotificationId, { root: true });
            dispatch('ui/addNotification', {
                type: 'success',
                message: `Project moved to ${newTrancheDisplay}`
            }, { root: true });

        } catch (error) {
            console.error("Projects Store: Failed to update project tranche via API:", error);
            dispatch('ui/removeNotification', loadingNotificationId, { root: true });
            dispatch('ui/addNotification', {
                type: 'error',
                message: `Failed to move project. Reverting to ${originalTrancheDisplay}.`,
                title: 'Update Error'
            }, { root: true });

            // Revert UI Update using the stored original lookup object
            commit('REVERT_PROJECT_TRANCHE', { projectId, originalTrancheLookup });
        }
    }
  },

  getters: {
    // Simple getters
    projectList: (state) => state.projectList,
    isLoading: (state) => state.isLoading,
    error: (state) => state.error,
    filterModeIsDemosOnly: (state) => state.filterModeIsDemosOnly,
    // Add getters for current filters/sort if needed by Toolbar
    currentFilters: (state) => state.filters,
    currentSortBy: (state) => state.sortBy,
    currentSortDirection: (state) => state.sortDirection,

    /**
     * Calculates the total system size (kW) for the currently filtered projects.
     */
    totalFilteredSystemSizeKw: (state, getters, rootState) => {
        let projectsToSum = getters.filteredSortedProjects || [];

        const excludedStageIds = [
            FIELD_PROJECT_PRE_SALE_STAGE_ID,
            FIELD_PROJECT_CANCELLED_STAGE_ID,
            FIELD_PROJECT_NOT_VIABLE_STAGE_ID,
            FIELD_PROJECT_HO_CANCELLED_REDBALL_STAGE_ID
            // We don't need to exclude Archived here as they are already filtered out during fetch
        ];

        // If in tranche view, filter further to only include projects assigned to a tranche
        if (rootState.ui?.boardViewMode === 'tranches') {
            projectsToSum = projectsToSum.filter(p => p.Tranche?.ID);
        } else {
            // If in stage view, filter out projects in excluded stages
            projectsToSum = projectsToSum.filter(p => 
                !excludedStageIds.includes(p.New_Stage?.ID)
            );
        }

        const total = projectsToSum.reduce((sum, project) => {
            // Parse the raw kW_STC value here
            const size = parseFloat(project?.kW_STC) || 0;
            return sum + size;
        }, 0);
        return total.toFixed(2);
    },

    /**
     * The main getter to provide the filtered and sorted list of projects for the UI.
     */
    filteredSortedProjects: (state, getters, rootState, rootGetters) => {
        let projectsToDisplay = [...state.projectList]; 

        // --- Apply Demo Filter CLIENT-SIDE --- 
        if (state.filterModeIsDemosOnly) { // Toggle ON: Show ONLY Demos
            projectsToDisplay = projectsToDisplay.filter(p => p.Is_Demo === true);
        } else { // Toggle OFF: Show ONLY Non-Demos
            projectsToDisplay = projectsToDisplay.filter(p => !p.Is_Demo);
        }

        // --- Apply Other Client-Side Filters ---
        const filters = state.filters;
        if (filters.searchTerm) {
            projectsToDisplay = projectsToDisplay.filter(p => {
                const term = filters.searchTerm;
                return (
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
            });
        }
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
        
        // Sales Rep Filter 
        if (filters.selectedSalesRepNames?.length > 0) {
             projectsToDisplay = projectsToDisplay.filter(p => 
                 filters.selectedSalesRepNames.includes(p.Sales_Rep_Name)
             );
        }
        
        // Sales Org Filter 
        if (filters.selectedSalesOrgNames?.length > 0) {
             projectsToDisplay = projectsToDisplay.filter(p => 
                 filters.selectedSalesOrgNames.includes(p.Sales_Org_Name)
             );
        }

        // Need Help Filter (use correct field name)
        if (filters.needHelp !== null) {
            projectsToDisplay = projectsToDisplay.filter(p => p.Need_Help === filters.needHelp);
        }

        // Cash Deal Filter (Use correct field name: Is_Cash_Finance)
        if (filters.cashDeal !== null) {
             projectsToDisplay = projectsToDisplay.filter(p => p.Is_Cash_Finance === filters.cashDeal);
        }
        
        // Project Type Filter (Use correct field name: Commercial)
        if (filters.projectType?.length > 0) {
             projectsToDisplay = projectsToDisplay.filter(p => {
                 const isCommercial = p.Commercial;
                 return filters.projectType.some(type => 
                     (type === 'commercial' && isCommercial) || (type === 'residential' && !isCommercial)
                 );
             });
        }
        
        // --- Apply Sorting --- 
        projectsToDisplay.sort((a, b) => {
            const sortByField = state.sortBy;
            let valA = sortByField === 'New_Stage' ? a[sortByField]?.title : a[sortByField];
            let valB = sortByField === 'New_Stage' ? b[sortByField]?.title : b[sortByField];
            let comparison = 0;

            if (sortByField === 'kW_STC' || sortByField === 'Yield') {
                const numA = parseFloat(valA) || 0;
                const numB = parseFloat(valB) || 0;
                comparison = numA - numB;
            } else if (['Date_Sold', 'Added_Time', 'Modified_Time', 'Installation_Date_Time'].includes(sortByField)) {
                const timeA = valA ? new Date(valA).getTime() : 0; 
                const timeB = valB ? new Date(valB).getTime() : 0;
                // Check for invalid dates which result in NaN
                if (isNaN(timeA) || isNaN(timeB)) {
                    comparison = (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB); 
                } else {
                    comparison = timeA - timeB;
                }
            } else if (typeof valA === 'string' && typeof valB === 'string') {
                comparison = valA.toLowerCase().localeCompare(valB.toLowerCase());
            } else if (typeof valA === 'number' && typeof valB === 'number') {
                comparison = valA - valB; // Handles potential raw numbers
            } else {
                // Fallback comparison for mixed types or nulls
                const strA = String(valA ?? '').toLowerCase();
                const strB = String(valB ?? '').toLowerCase();
                comparison = strA.localeCompare(strB);
            }

            return state.sortDirection === 'desc' ? (comparison * -1) : comparison;
        });
        return projectsToDisplay;
    },

    // Getter for the formatted last updated time
    lastUpdatedRelative: (state) => {
      return formatRelativeTime(state.lastUpdatedTimestamp);
    },

    // Getter for the total count of projects currently displayed (after filters)
    filteredProjectCount: (state, getters) => {
        return getters.filteredSortedProjects.length;
    },

    // Getter for the count of projects assigned to a specific tranche (excluding unassigned)
    tranchedProjectCount: (state, getters) => {
        return getters.filteredSortedProjects.filter(p => p.Tranche?.ID).length;
    },

    // Getter to identify IDs of projects with potential duplicate lat/long
    duplicateLatLongProjectIds: (state) => {
        const coordsMap = new Map(); // Map<"lat,long", string[]>
        // Use the full projectList to find duplicates regardless of current filters
        (state.projectList || []).forEach(project => {
            const lat = project.latitude;
            const long = project.longitude;

            // Try parsing to floats and check validity
            const latNum = parseFloat(lat);
            const longNum = parseFloat(long);

            // Only consider valid, non-zero coordinates
            if (!isNaN(latNum) && !isNaN(longNum) && latNum !== 0 && longNum !== 0 && project.ID) {
                // Round to 6 decimal places for key generation
                const roundedLat = latNum.toFixed(6);
                const roundedLong = longNum.toFixed(6);
                const key = `${roundedLat},${roundedLong}`;
                if (coordsMap.has(key)) {
                    coordsMap.get(key).push(project.ID);
                } else {
                    coordsMap.set(key, [project.ID]);
                }
            }
        });

        const duplicateIds = new Set();
        for (const ids of coordsMap.values()) {
            if (ids.length > 1) {
                ids.forEach(id => duplicateIds.add(id));
            }
        }
        return duplicateIds; // Returns a Set of IDs
    }
  }
};

// Expose the module globally for registration in store.js
// window.AppStoreModules = window.AppStoreModules || {};
// window.AppStoreModules.projects = projectsModule; 
export default projectsModule; 