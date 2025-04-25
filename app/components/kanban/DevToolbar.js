// app/components/common/DevToolbar.js

// Import base components used
import BaseButton from '../common/BaseButton.js';
import BaseSelectMenu from '../common/BaseSelectMenu.js'; // Import SelectMenu
import BaseBadge from '../common/BaseBadge.js'; // Import Badge
import BaseToggle from '../common/BaseToggle.js'; // Ensure BaseToggle is imported

// Import Pinia stores and helpers
import { useUserStore } from '../../store/userStore.js'; // Import user store
import { useLookupsStore } from '../../store/lookupsStore.js';
import { useProjectsStore } from '../../store/projectsStore.js'; // Import projects store
const { mapState, mapActions } = Pinia;
const { storeToRefs } = Pinia; // <<< ADD storeToRefs

// Vuex no longer needed here unless modal module is used directly

const DevToolbar = {
  name: 'DevToolbar',
  components: {
    BaseButton,
    // BaseSelectMenu, // Using native select now
    BaseBadge, // Register Badge
    BaseToggle, // Register BaseToggle
  },
  setup() {
    // --- Composition API for direct state access & actions ---
    const lookupsStore = useLookupsStore();

    // Use storeToRefs to get reactive refs for state/getters
    // This is needed for isLoadingTeamUsers reactivity in computed
    const { usersForImpersonationDropdown, isLoadingTeamUsers } = storeToRefs(lookupsStore);
    
    // Action to trigger fetch (can be called from methods)
    const fetchTeamUsers = () => lookupsStore.fetchTeamUsers();

    return {
        // Expose reactive state/getters and actions needed
        usersForImpersonationDropdown,
        isLoadingTeamUsers,
        fetchTeamUsers
    };
  },
  computed: {
    // --- Map Pinia State/Getters ---
    // Map user store state/getters
    ...mapState(useUserStore, ['currentUser', 'isImpersonating', 'originalUser']), 
    // Map projects store state
    ...mapState(useProjectsStore, ['filterModeIsDemosOnly']),

    // --- Map Remaining Vuex State/Getters --- (None needed anymore)
    // ...(typeof Vuex !== 'undefined' ? Vuex.mapGetters({ ... }) : { ... }),

    // Local computed properties
    impersonationTarget: {
        get() {
            // Uses Pinia state
            return this.isImpersonating ? this.currentUser?.id : '';
        },
        set(newUserId) {
            // Calls Pinia actions mapped below
            if (newUserId) {
                this.impersonateUser(newUserId);
            } else {
                this.revertImpersonation();
            }
        }
    },
    impersonationOptions() {
        // Check loading state from setup() ref
        if (this.isLoadingTeamUsers) {
            return [{ value: '', label: 'Loading Users...', disabled: true }];
        }
        
        // Uses Pinia state/getters exposed via setup()
        const options = [
            { value: '', label: 'Select User to Impersonate...' },
            ...(this.usersForImpersonationDropdown || []) // Use ref from setup
        ];
        if (this.isImpersonating && this.originalUser) {
            options.push({
                 value: this.originalUser.id,
                 label: `<- Revert to ${this.originalUser.name}`
            });
        }
        return options.filter(opt => opt.value !== this.currentUser?.id || opt.value === ''); 
    },

    // Computed property to bind v-model for the select menu
    selectedImpersonationId() {
        // Reflects the ID of the currently displayed user (could be original or impersonated)
        return this.currentUser?.id || null;
    },

    // Computed property with getter/setter for the demo toggle checkbox
    filterModeIsDemosOnlyModel: {
        get() {
            // Use Pinia mapped state
            return this.filterModeIsDemosOnly;
        },
        set(value) {
            // When checkbox changes, call the Pinia action directly
            console.log(`DevToolbar: Toggling filter mode (Show ONLY Demos: ${value})`);
            // Get instance and call action
            const projectsStore = useProjectsStore();
            projectsStore.toggleDemoFilterMode(); 
        }
    }
  },
  methods: {
    // --- Map Pinia Actions ---
    // Map user store actions
    ...mapActions(useUserStore, ['impersonateUser', 'revertImpersonation']),
    // We don't need to map toggleDemoFilterMode as the setter calls it directly

    // --- Map Remaining Vuex Actions --- (None needed anymore)
    // ...(typeof Vuex !== 'undefined' ? { ... } : {}),

    // Method to clear local storage
    clearLocalStorage() {
      if (confirm('Are you sure you want to clear all local storage for this widget?')) {
        localStorage.clear();
        alert('Local storage cleared. Please refresh the widget.');
        // Consider adding location.reload(); if appropriate
      }
    },
    // Method to trigger hard refresh
    hardRefresh() {
      location.reload(true); 
    },

    // Method to trigger fetch when dropdown is interacted with
    handleImpersonateFocus() {
        // Call the fetch function exposed from setup()
        this.fetchTeamUsers();
    },
  },
  // Template now defined inline
  template: `
    <div class="dev-toolbar p-2 bg-yellow-100 border-b-2 border-yellow-300 text-xs text-yellow-800 flex items-center gap-4 justify-end">
        <span class="font-bold">DEV TOOLS:</span>
        
        <!-- Demo Filter Toggle -->
        <label class="flex items-center gap-1 cursor-pointer">
            <base-toggle v-model="filterModeIsDemosOnlyModel"></base-toggle>
            <span class="text-xs">Show ONLY Demos</span>
        </label>
        
        <!-- Impersonation Dropdown -->
        <div class="flex items-center gap-1">
            <label for="impersonate-select" class="sr-only">Impersonate User:</label>
            <select 
                id="impersonate-select" 
                v-model="impersonationTarget" 
                @focus="handleImpersonateFocus" 
                @mousedown="handleImpersonateFocus"  
                class="px-2 py-1 border border-yellow-400 rounded bg-white text-xs w-48"
            >
                <option 
                    v-for="option in impersonationOptions" 
                    :key="option.value || 'placeholder'" 
                    :value="option.value"
                    :disabled="option.disabled"
                >
                    {{ option.label }}
                </option>
            </select>
            <span v-if="isImpersonating" class="text-yellow-600 font-medium">(Impersonating: {{ currentUser?.name }})</span>
        </div>

        <!-- Hard Refresh Button -->
        <button @click="hardRefresh" title="Hard Refresh (Ctrl+Shift+R)" class="px-2 py-1 bg-yellow-200 hover:bg-yellow-300 rounded border border-yellow-400">
            <i class="fas fa-sync-alt mr-1"></i> Hard Refresh
        </button>
        
        <!-- Clear Local Storage Button -->
        <button @click="clearLocalStorage" title="Clear Widget Local Storage" class="px-2 py-1 bg-red-200 hover:bg-red-300 rounded border border-red-400 text-red-800">
             <i class="fas fa-trash-alt mr-1"></i> Clear Storage
        </button>
        
    </div>
  `
};

export default DevToolbar;

// Remove global exposure
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.DevToolbar = DevToolbar; 

  