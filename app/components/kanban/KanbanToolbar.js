// app/components/kanban/KanbanToolbar.js

// Imports for Base components would go here if they were also refactored
// import BaseSelectMenu from '../common/BaseSelectMenu.js';
// import BaseButton from '../common/BaseButton.js';
import BaseToggle from '../common/BaseToggle.js'; // Corrected import
// Import options
import {
    FILTER_TYPE_OPTIONS,
    PROJECT_TYPE_OPTIONS,
    WORK_REQUIRED_OPTIONS,
    SORT_BY_OPTIONS,
    STAGE_VIEW_OPTIONS
} from '../../config/options.js';
// --- ADD App Build Info Constant --- 
import { APP_BUILD_INFO } from '../../config/constants.js';

// --- Pinia Store Import ---
import { useUiStore } from '../../store/uiStore.js';
import { useLookupsStore } from '../../store/lookupsStore.js'; // Import lookups store
import { useProjectsStore } from '../../store/projectsStore.js'; // Import projects store
// --- ADD Import for Modal Store ---
import { useModalStore } from '../../store/modalStore.js';

// --- Pinia Helper Import ---
const { mapState, mapActions } = Pinia;

// --- Vue/VueUse Imports (assuming VueUse is global via CDN) ---
const { computed, watch, ref } = Vue;
const { useTimeAgo, useDebounceFn } = VueUse;

// Vuex no longer needed here unless modal module is used directly
// if (typeof Vuex === 'undefined') {
//   console.warn('Vuex might not be loaded yet for helpers in KanbanToolbar.');
// }

const KanbanToolbar = {
  name: 'KanbanToolbar',
  components: { BaseToggle }, // Added BaseToggle
  setup() {
    // --- Composition API Logic ---
    const projectsStore = useProjectsStore();
    const lookupsStore = useLookupsStore(); // ADD Lookups Store instance

    // --- Time Ago --- 
    const lastUpdatedRef = computed(() => projectsStore.lastUpdatedTimestamp);
    const timeAgo = useTimeAgo(lastUpdatedRef);
    
    // --- Search State & Logic ---
    const searchResults = ref([]);
    const showResults = ref(false);
    
    // Define the core search logic as a function within setup
    const updateSearchResultsLogic = (term) => {
        const searchTerm = term.trim().toLowerCase();
        // Access store directly
        const currentProjectsStore = useProjectsStore(); // Get fresh instance inside if needed, or use outer scope one
        
        if (!searchTerm) {
            searchResults.value = [];
            showResults.value = false;
            return;
        }
        
        // Check store loading state FIRST
        if (currentProjectsStore.isLoading) {
            console.warn("KanbanToolbar(setup): updateSearchResults called while projectsStore is still loading.");
            searchResults.value = []; // Clear results if loading
            showResults.value = false;
            return; 
        }
        
        // Get project list directly from store state
        const projects = currentProjectsStore.projectList;
        
        // GUARD CLAUSE: Check if directly accessed list is an array
        if (!Array.isArray(projects)) {
            console.warn("KanbanToolbar(setup): updateSearchResults called but projectsStore.projectList is not an array.");
            searchResults.value = [];
            showResults.value = false;
            return; // Don't proceed if data isn't loaded
        }
        
        // Filter the directly accessed list
        searchResults.value = projects.filter(p => 
            (p.Owner_Name_Display?.toLowerCase().includes(searchTerm) ||
            p.addressLine1?.toLowerCase().includes(searchTerm) ||
            p.address?.toLowerCase().includes(searchTerm) ||
            p.city?.toLowerCase().includes(searchTerm) ||
            p.state?.toLowerCase().includes(searchTerm) ||
            p.zip?.toLowerCase().includes(searchTerm) ||
            p.ID?.toLowerCase().includes(searchTerm) || // Corrected: was p.id
            p.OpenSolar_Project_ID?.toLowerCase().includes(searchTerm))
        ).slice(0, 10);
        showResults.value = searchResults.value.length > 0;
    };
    
    // Create the debounced function using useDebounceFn
    const debouncedUpdateSearchResults = useDebounceFn(updateSearchResultsLogic, 300);

    // Return the refs and debounced function so they are accessible
    return {
      timeAgo,
      searchResults,
      showResults,
      debouncedUpdateSearchResults,
      APP_BUILD_INFO // Expose to template
    };
  },
  data() {
    return {
      // REMOVE currentTime and updateInterval
      // currentTime: Date.now(),
      // updateInterval: null,
      // Local state ONLY for the search input binding
      localSearchTerm: '',
      searchDebounceTimeout: null, // Added for debouncing search
      // Add local state for dropdowns if using complex components later
      // Add state for dynamic filter type
      selectedFilterType: null, // Holds the selected filter type OBJECT (e.g., { value: 'tags', label: 'Tags' })
      // selectedFilterValues: [] // Holds selected values for the dynamic filter (if needed, maybe bind direct to store later)
    };
  },
  computed: {
    // --- Map Pinia State/Getters ---
    ...mapState(useUiStore, [
        'currentStageView',
        'boardViewMode'
    ]),
    ...mapState(useLookupsStore, [
        'tagsForFilter', // Getter
        'salesRepsForFilter', // Getter
        'salesOrgsForFilter', // Getter
        'tranches', // Simple state
        // Map individual loading states
        'isLoadingTags',
        'isLoadingSalesReps',
        'isLoadingSalesOrgs'
    ]),
    // Map projects state/getters
    ...mapState(useProjectsStore, [
        'currentFilters',
        'currentSortBy',
        'currentSortDirection',
        { allProjects: 'projectList' }, // Map state projectList to computed allProjects
        'totalFilteredSystemSizeKw', // Getter
        'filteredProjectCount', // Getter
        'tranchedProjectCount', // Getter
        // REMOVE mapping for lastUpdatedRelative getter
        // 'lastUpdatedRelative' 
        // --- ADD Mapping for lastUpdatedTimestamp state ---
        'lastUpdatedTimestamp',
        // --- ADD Mapping for duplicate filter state ---
        'filterOnlyDuplicates'
    ]),

    // Sync local search term with store on initial load or reset
    storedSearchTerm() {
        return this.currentFilters.searchTerm || '';
    },
    
    // Computed property to check if the current view mode is 'tranches'
    isTrancheView() {
      return this.boardViewMode === 'tranches';
    },
    
    // Computed property to determine which project count to display
    displayProjectCount() {
        return this.isTrancheView ? this.tranchedProjectCount : this.filteredProjectCount;
    },
    
    // Use imported constants for options
    filterTypeOptions() { return FILTER_TYPE_OPTIONS; },
    workRequiredOptions() { return WORK_REQUIRED_OPTIONS; }, // Use for button group
    stageViewOptions() { return STAGE_VIEW_OPTIONS; }, // Use for stage view button group
    
    // Dynamically compute options for the second dropdown
    filterValueOptions() {
        if (!this.selectedFilterType) return [];
        const lookupsStore = useLookupsStore(); // Get store instance
        switch (this.selectedFilterType.value) {
            case 'tags':
                if (lookupsStore.isLoadingTags) return [{ value: '_loading', label: 'Loading Tags...', disabled: true }];
                return this.tagsForFilter;
            case 'salesRep':
                if (lookupsStore.isLoadingSalesReps) {
                    return [{ value: '_loading', label: 'Loading Reps...', disabled: true }];
                }
                const currentLookupsStore = useLookupsStore(); 
                return currentLookupsStore.salesRepsForToolbarFilter;
            case 'salesOrg':
                if (lookupsStore.isLoadingSalesOrgs) return [{ value: '_loading', label: 'Loading Orgs...', disabled: true }];
                return this.salesOrgsForFilter;
            case 'projectType':
                return PROJECT_TYPE_OPTIONS;
            default:
                return [];
        }
    },
    
    // Determine the store key (remove Work Required case)
    currentFilterStoreKey() {
        if (!this.selectedFilterType) return null;
        switch (this.selectedFilterType.value) {
            case 'tags':        return 'tags';
            case 'salesRep':    return 'selectedSalesRepNames';
            case 'salesOrg':    return 'selectedSalesOrgNames';
            case 'projectType': return 'projectType';
            default:            return null;
        }
    },
    
    // Get the currently selected value(s) for the dynamic filter from the store
    currentDynamicFilterValue() {
        const storeKey = this.currentFilterStoreKey;
        if (!storeKey || !this.currentFilters) return null; // Return null if no type selected or filters not ready
        
        const value = this.currentFilters[storeKey];

        // Assuming single select for now via BaseSelectMenu for the value dropdown
        // Return the first item if it's an array, or the value itself
        return Array.isArray(value) ? (value[0] || null) : value;
    },
    // Computed property for the dynamic placeholder
    filterValuePlaceholder() {
        return this.selectedFilterType ? `Select ${this.selectedFilterType.label}...` : 'Select Type First';
    },
    // Format sort options using imported constant
    sortByOptionsFormatted() {
        // Use imported SORT_BY_OPTIONS
        return SORT_BY_OPTIONS.map(opt => ({ ...opt, label: `Sort By ${opt.label}` }));
    }
  },
  watch: {
      // Watch the store's search term and update local state if it changes externally (e.g., reset)
      storedSearchTerm(newValue) {
          if (newValue !== this.localSearchTerm) {
              this.localSearchTerm = newValue;
              // Clear local results if search term is cleared externally
              if (!newValue) {
                  this.searchResults = [];
                  this.showResults = false;
              }
          }
      },
      // Watch local search term for changes to update results (with debounce)
      localSearchTerm(newValue) {
          if (!newValue.trim()) {
              this.searchResults = [];
              this.showResults = false;
              // Optionally, apply the empty search immediately to the store filter
              // this.applySearch(); 
              return;
          }
          // Call the debounced function (defined in setup)
          this.debouncedUpdateSearchResults(newValue);
      },
      // Reset value dropdown when filter type changes
      selectedFilterType(newValue, oldValue) {
          if (oldValue) {
              const oldStoreKey = this.getStoreKeyForFilterType(oldValue.value);
               if (oldStoreKey) {
                   // Call Pinia action directly
                   const projectsStore = useProjectsStore(); 
                   projectsStore.setFilter({ key: oldStoreKey, value: [] }); 
               }
          }
          // --- Trigger On-Demand Fetch ---
          if (newValue) {
              const lookupsStore = useLookupsStore();
              switch (newValue.value) {
                  case 'tags': lookupsStore.fetchTags(); break;
                  case 'salesOrg': lookupsStore.fetchSalesOrgs(); break;
              }
          }
      }
  },
  mounted() {
    // Add listener for clicks outside search results
    document.addEventListener('click', this.handleClickOutsideSearch);
    // REMOVE timer interval logic
    // this.updateInterval = setInterval(() => {
    //     this.currentTime = Date.now();
    // }, 60000); // 60000ms = 1 minute
  },
  beforeUnmount() {
      // Clean up listener and debounce timer
      document.removeEventListener('click', this.handleClickOutsideSearch);
      clearTimeout(this.searchDebounceTimeout); 
      // REMOVE timer interval cleanup
      // clearInterval(this.updateInterval);
  },
  methods: {
    // --- Map Pinia Actions ---
    ...mapActions(useUiStore, [
        'setStageView',
        'setBoardViewMode'
    ]),
    // Map projects actions
    ...mapActions(useProjectsStore, [
        'setSearchTerm',
        'setFilter',
        'setSort',
        'resetFiltersAndSort',
        'fetchInitialProjects', // Map fetch action for refresh button
        'toggleDuplicateFilter' // --- ADDED: Map the new action ---
    ]),

    // --- Local Component Methods ---
    // Search Related
    applySearch() {
      clearTimeout(this.searchDebounceTimeout);
      // --- Call the debounced function directly if needed, or just rely on watch? ---
      // Let's rely on the watcher + debounced function for updates.
      // We might need to trigger it if the user hits Enter *before* debounce finishes.
      // this.debouncedUpdateSearchResults(this.localSearchTerm); // Trigger immediately on Enter
      this.setSearchTerm(this.localSearchTerm);
    },
    clearSearch() {
        clearTimeout(this.searchDebounceTimeout);
        this.localSearchTerm = '';
        this.searchResults = [];
        this.showResults = false;
        this.setSearchTerm('');
    },
    selectSearchResult(project) {
        console.log("Search result selected:", project);
        // --- ADD Get modal store instance ---
        const modalStore = useModalStore();
        this.clearSearch();
        // --- REPLACE Alert with modal opening ---
        // alert(`Project clicked: ${project.contactName} (ID: ${project.id})\nImplement modal opening logic here.`);
        modalStore.openModal(project.ID);
    },
    hideSearchResults() {
       this.showResults = false;
    },
    handleClickOutsideSearch(event) {
        if (this.$refs.searchContainer && !this.$refs.searchContainer.contains(event.target)) {
            this.hideSearchResults();
        }
    },
    handleSearchFocus() {
        // Only show results on focus if there are already results
        // for the current term and the term isn't empty.
        if (this.localSearchTerm && this.searchResults.value.length > 0) {
            this.showResults = true;
        }
    },
    
    // Dynamic Filter Methods
    getStoreKeyForFilterType(typeValue) {
         switch (typeValue) {
            case 'tags':          return 'tags';
            case 'salesRep':      return 'selectedSalesRepNames'; 
            case 'salesOrg':      return 'selectedSalesOrgNames'; 
            case 'projectType': return 'projectType';
            default:              return null;
        }
    },
    handleFilterTypeChange(selectedValue) {
        // Find the full option object corresponding to the selected value
        const selectedTypeObject = this.filterTypeOptions.find(opt => opt.value === selectedValue);
        this.selectedFilterType = selectedTypeObject || null; 
        // Value dropdown will update via computed prop
        // Resetting the old filter value happens in the watcher
    },
    handleFilterValueChange(selectedValue) {
        const storeKey = this.currentFilterStoreKey;
        if (!storeKey) return; 
        
        // Extract the actual value (ID, name, etc.) from the selected object
        let actualValue = null;
        if (selectedValue && typeof selectedValue === 'object') {
            // Use the component's configured value key (default: 'value')
            actualValue = selectedValue[this.optionValueKey || 'value']; 
        } else if (selectedValue !== null && selectedValue !== undefined) {
            // Handle cases where a primitive might be emitted (though BaseSelectMenu shouldn't do this now)
            actualValue = selectedValue;
        }
        
        // Create the array expected by the store filter logic
        let valueToSet = [];
        if (actualValue !== null && actualValue !== '') {
             valueToSet = [actualValue]; // Wrap the extracted value in an array
        }
        
        this.setFilter({ key: storeKey, value: valueToSet });
    },

    // Individual Toggle Filters
    toggleCashDealFilter() {
        const currentVal = this.currentFilters.cashDeal;
        // Change to 2-state toggle: null -> true -> null
        const newVal = currentVal === true ? null : true;
        this.setFilter({ key: 'cashDeal', value: newVal });
    },
    toggleNeedHelpFilter() {
        const currentVal = this.currentFilters.needHelp;
        // Change to 2-state toggle: null -> true -> null
        const newVal = currentVal === true ? null : true; 
        this.setFilter({ key: 'needHelp', value: newVal });
    },

    // --- ADDED: Method to handle duplicate filter toggle ---
    handleToggleDuplicateFilter() {
        this.toggleDuplicateFilter(); // Call the mapped action
    },

    // Sort Methods
    handleSortFieldChange(selectedOption) {
        // Directly use the selectedOption which is the primitive value
        const newSortField = selectedOption; 
        console.log(`KanbanToolbar: Sort field change - Field: ${newSortField}`);
        if (newSortField) { 
            this.setSort({ field: newSortField, direction: this.currentSortDirection });
        }
    },
    toggleSortDirection() {
        const newDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
        this.setSort({ field: this.currentSortBy, direction: newDirection });
    },
    
    // Other Methods
    resetAll() {
        console.log('KanbanToolbar: Resetting filters and sort');
        this.selectedFilterType = null; // Reset dynamic filter type
        this.resetFiltersAndSort(); 
    },

    // Update work required filter (using BaseButtonGroup now)
    updateWorkRequiredFilter(newValue) {
      this.setFilter({ key: 'workRequired', value: newValue });
    },

    // *** ADDED Method for View Mode Toggle ***
    handleViewModeToggle(isTranches) {
        const newMode = isTranches ? 'tranches' : 'stages';
        this.setBoardViewMode(newMode);
    },

    // --- Expose store actions needed directly ---
    // We need fetchCoreLookups for the refresh button
    fetchCoreLookups() {
        const lookupsStore = useLookupsStore();
        return lookupsStore.fetchCoreLookups(); // Return promise if needed
    },
    // Need projects fetch for refresh button
    fetchInitialProjects() {
        const projectsStore = useProjectsStore();
        return projectsStore.fetchInitialProjects();
    },

    // Refresh Method
    async handleRefresh() {
        const uiStore = useUiStore();
        // Use a notification for loading state during refresh
        const loadingNotificationId = `refresh-manual-${Date.now()}`;
        uiStore.addNotification({
            id: loadingNotificationId,
            type: 'info',
            message: 'Refreshing Data...',
            duration: 0 // Persistent
        });
        
        try {
            // Fetch core data again
            await Promise.all([
                this.fetchCoreLookups(), // Call method that accesses store
                this.fetchInitialProjects() // Call method that accesses store
            ]);
            // User data is fetched implicitly via fetchCoreLookups -> initService logic
            // (or could explicitly call fetchCurrentUser if needed after lookups)
            uiStore.addNotification({ type: 'success', message: 'Data Refreshed!' });
        } catch (error) {
            console.error("KanbanToolbar: Error during manual refresh:", error);
            uiStore.addNotification({ type: 'error', message: `Refresh failed: ${error.message || 'Unknown error'}`, title: 'Refresh Error' });
        } finally {
             uiStore.removeNotification(loadingNotificationId);
        }
    },
  },
  // Template defined in widget.html
  // template: '#kanban-toolbar-template'
  template: `
       <div class="toolbar p-3 bg-gray-50 border-b border-gray-200 flex flex-col gap-2">
             <!-- Row 1: Search, Total Size, Stage View Toggle -->
             <div class="flex items-center gap-3 w-full">
                 <!-- Search Input & Results Dropdown -->
                 <div class="relative flex-shrink-0 sm:w-64" ref="searchContainer">
                    <base-text-input
                        v-model="localSearchTerm"
                        @keyup.enter="applySearch"
                        @focus="handleSearchFocus"
                        @blur="hideSearchResults" 
                        placeholder="Search..."
                        class="w-full"
                        input-class="pl-3 pr-10"
                        :attrs="{ name: 'search', id: 'toolbar-search', 'aria-label': 'Search projects', autocomplete: 'off' }"
                        :trailingIconClass="localSearchTerm ? null : 'fas fa-search text-gray-400'"
                    />
                    <!-- Clear Button -->
                    <div v-if="localSearchTerm" class="absolute inset-y-0 right-0 pr-1.5 flex items-center z-10">
                        <base-button @click="clearSearch" variant="secondary" size="xs" class="p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none">
                            <span class="sr-only">Clear search</span>
                            <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
                        </base-button>
                    </div>
                    <!-- Search Results Dropdown -->
                    <div v-if="showResults && searchResults.length > 0" class="absolute z-20 mt-1 w-full max-h-80 overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                       <ul class="divide-y divide-gray-100">
                           <li v-for="result in searchResults" :key="result.ID" @mousedown.prevent="selectSearchResult(result)" class="px-3 py-2 hover:bg-blue-600 hover:text-white cursor-pointer group">
                               <p class="font-medium truncate text-gray-900 group-hover:text-white">{{ result.Owner_Name_Display || 'No Name'}}</p>
                               <p class="text-xs text-gray-500 group-hover:text-blue-200 truncate">
                                   {{ result.addressLine1 || 'No Address' }} - <span class="font-medium">{{ result.New_Stage?.title || 'No Stage' }}</span>
                               </p>
                           </li>
                       </ul>
                    </div>
                    <!-- Empty Search Results -->
                    <div v-if="showResults && localSearchTerm && searchResults.length === 0" class="absolute z-20 mt-1 w-full p-3 rounded-md bg-white text-sm text-gray-500 shadow-lg ring-1 ring-black ring-opacity-5">
                       No results found.
                    </div>
                 </div>
                 <!-- Total System Size Badge -->
                 <div class="flex-shrink-0">
                    <base-badge color="blue" class="py-1 px-2.5 text-sm">
                        Total: {{ totalFilteredSystemSizeKw }} kW
                    </base-badge>
                 </div>
                 <!-- Project Count Badge -->
                 <div class="flex-shrink-0">
                     <base-badge color="gray" class="py-1 px-2.5 text-sm">
                         {{ displayProjectCount }} Projects
                     </base-badge>
                 </div>
                 <!-- Spacer -->
                 <div class="flex-grow"></div> 
                 <!-- Stage View Toggle -->
                 <base-button-group
                     v-if="!isTrancheView" // Only show Stage filter if not in Tranche view
                     :modelValue="currentStageView"
                     @update:modelValue="setStageView"
                     :options="stageViewOptions"
                     button-size="md" 
                     optionValueKey="value" 
                     optionLabelKey="label"
                     baseVariant="secondary" 
                     activeVariant="primary" 
                     rounded="md"
                     shadow="none"
                     class="flex-shrink-0"
                 />
                 <!-- View Mode Toggle (Stages/Tranches) -->
                 <div class="flex items-center gap-2 flex-shrink-0">
                    <span :class="[!isTrancheView ? 'font-semibold text-blue-600' : 'text-gray-500']">Stages</span>
                    <base-toggle
                       :modelValue="isTrancheView"
                       @update:modelValue="handleViewModeToggle"
                       aria-label="Toggle between Stages and Tranches view"
                    />
                    <span :class="[isTrancheView ? 'font-semibold text-blue-600' : 'text-gray-500']">Tranches</span>
                 </div>
            </div>

            <!-- Row 2: Filters, Sort, Refresh/Reset -->
            <div class="flex items-center gap-3 flex-wrap w-full">
                 <!-- Dynamic Filter Type Dropdown -->
                 <base-select-menu
                    :modelValue="selectedFilterType" 
                    @update:modelValue="handleFilterTypeChange" 
                    :options="filterTypeOptions"
                    placeholder="Filter By..."
                    class="w-auto min-w-[130px]"
                    optionValueKey="value" 
                    optionLabelKey="label" 
                    :attrs="{ id: 'filter-type' }"
                 />
                 <!-- Dynamic Filter Value Dropdown -->
                 <base-select-menu
                    :modelValue="currentDynamicFilterValue"
                    @update:modelValue="handleFilterValueChange"
                    :options="filterValueOptions"
                    :disabled="!selectedFilterType"
                    :placeholder="filterValuePlaceholder"
                    class="w-48 min-w-[150px]"  
                    optionValueKey="value"
                    optionLabelKey="label"
                    :attrs="{ id: 'filter-value' }"
                    :show-clear-button="true"
                 />
                 <!-- Cash Deal Toggle Button -->
                <base-button 
                    @click="toggleCashDealFilter" 
                    :variant="currentFilters.cashDeal === true ? 'success' : (currentFilters.cashDeal === false ? 'secondary' : 'secondary')" 
                    size="md"
                    class="px-3 py-1.5 text-sm"
                    :show-focus-ring="false" 
                >
                    Cash Deal
                </base-button>
                <!-- Need Help Toggle Button -->
                <base-button 
                    @click="toggleNeedHelpFilter" 
                    :variant="currentFilters.needHelp === true ? 'danger' : 'secondary'" 
                    size="md"
                    class="px-3 py-1.5 text-sm"
                    :class="{'ring-2 ring-red-500 ring-offset-1': currentFilters.needHelp === true}"
                    :show-focus-ring="false" 
                >
                    Need Help
                </base-button>
                <!-- ADDED: Duplicate Filter Toggle Button -->
                <base-button 
                    @click="handleToggleDuplicateFilter" 
                    :variant="filterOnlyDuplicates ? 'warning' : 'secondary'" 
                    size="md"
                    class="px-3 py-1.5 text-sm"
                    :class="{'ring-2 ring-yellow-500 ring-offset-1': filterOnlyDuplicates}"
                    :show-focus-ring="false" 
                    title="Show only potential duplicates based on Lat/Long"
                >
                    Duplicates
                </base-button>
                 <!-- Work Required Filter (Button Group) -->
                 <base-button-group
                     :modelValue="currentFilters.workRequired"
                     @update:modelValue="updateWorkRequiredFilter"
                     :options="workRequiredOptions"
                     :multiple="true"
                     button-size="sm"
                     optionValueKey="value"
                     optionLabelKey="label"
                     rounded="md"
                     shadow="none"
                 />

                 <!-- Spacer -->
                 <div class="flex-grow"></div>

                 <!-- Sorting Controls -->
                 <div class="flex items-center gap-2 flex-shrink-0">
                     <base-select-menu 
                         :modelValue="currentSortBy" 
                         @update:modelValue="handleSortFieldChange"
                         :options="sortByOptionsFormatted"
                         optionValueKey="value"
                         optionLabelKey="label"
                         class="w-auto min-w-[150px]"
                         :attrs="{ id: 'sort-by' }"
                     />
                     <base-button 
                        @click="toggleSortDirection" 
                        variant="secondary" 
                        size="md" 
                        class="p-1.5" 
                        :title="currentSortDirection === 'asc' ? 'Ascending' : 'Descending'"
                        :show-focus-ring="false" 
                    >
                        <span class="sr-only">Toggle Sort Direction</span>
                        <i :class="['fas', currentSortDirection === 'asc' ? 'fa-sort-amount-up-alt' : 'fa-sort-amount-down-alt','text-gray-600 text-base']" aria-hidden="true"></i>
                    </base-button>
                 </div>
                 
                 <!-- Reset Button -->
                 <base-button 
                     @click="resetAll" 
                     variant="secondary" 
                     size="md" 
                     class="px-3 py-1.5 text-sm flex-shrink-0"
                     :show-focus-ring="false"
                 >
                    Reset
                 </base-button>
                 <!-- Refresh Button -->
                 <base-button 
                     @click="handleRefresh" 
                     variant="secondary" 
                     size="md" 
                     class="px-3 py-1.5 text-sm flex-shrink-0"
                      :show-focus-ring="false"
                 >
                     <i class="fas fa-sync-alt mr-1"></i> Refresh
                 </base-button>
                 <!-- Last Updated -->
                 <div class="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
                     <i class="fas fa-clock text-gray-400"></i>
                     <span v-if="lastUpdatedTimestamp" class="flex-shrink-0" :title="lastUpdatedTimestamp ? new Date(lastUpdatedTimestamp).toLocaleString() : 'Never'">{{ timeAgo }}</span>
                 </div>
                 <!-- Version Info -->
                 <div class="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0" :title="APP_BUILD_INFO">
                     <i class="fas fa-info-circle text-gray-400"></i>
                     <span>{{ APP_BUILD_INFO }}</span>
                 </div>
            </div>
        </div>
    `
};

// Expose the component definition globally within the AppComponents object
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.KanbanToolbar = KanbanToolbar; 
export default KanbanToolbar; 