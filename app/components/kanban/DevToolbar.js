// app/components/common/DevToolbar.js

// Import base components used
import BaseButton from '../common/BaseButton.js';
import BaseSelectMenu from '../common/BaseSelectMenu.js'; // Import SelectMenu
import BaseBadge from '../common/BaseBadge.js'; // Import Badge
import BaseToggle from '../common/BaseToggle.js'; // Ensure BaseToggle is imported

// Ensure Vuex is available for mapState/mapGetters
if (typeof Vuex === 'undefined') {
  console.warn('Vuex might not be loaded yet for mapState/mapGetters helper in DevToolbar.');
}

const DevToolbar = {
  name: 'DevToolbar',
  components: {
    BaseButton,
    BaseSelectMenu, // Register SelectMenu
    BaseBadge, // Register Badge
    BaseToggle, // Register BaseToggle
  },
  computed: {
    ...(typeof Vuex !== 'undefined' ? Vuex.mapGetters({
      // Lookups for dropdown
      _usersForDropdown: 'lookups/usersForImpersonationDropdown',
      // User state for impersonation
      currentUser: 'user/currentUser',
      originalUser: 'user/originalUser',
      isImpersonating: 'user/isImpersonating',
      // Keep existing getters if any
      isAdmin: 'user/isAdmin', // Should still check original user
      filterModeIsDemosOnly: 'projects/filterModeIsDemosOnly' // Map the RENAMED getter
    }) : {
        // Fallbacks
        _usersForDropdown: () => [],
        currentUser: () => null,
        originalUser: () => null,
        isImpersonating: () => false,
        isAdmin: () => false,
        filterModeIsDemosOnly: () => false, // Fallback should match new default
    }),

    // Computed property for the dropdown options
    impersonationOptions() {
        if (!this.originalUser) return []; // Wait for original user
        // Add the 'Default User' option using the original user's ID
        const options = [
            {
                value: this.originalUser.id, // Use original user ID to trigger revert
                label: `Default User (${this.originalUser.name || this.originalUser.email})`
            },
            ...this._usersForDropdown // Spread the rest of the users
        ];
        // Filter out the current original user from the main list to avoid duplication
        return options.filter(opt => opt.value !== this.originalUser.id || opt.label.startsWith('Default User'));
    },

    // Computed property to bind v-model for the select menu
    selectedImpersonationId() {
        // Reflects the ID of the currently displayed user (could be original or impersonated)
        return this.currentUser?.id || null;
    },

    // Computed property with getter/setter for the checkbox
    filterModeIsDemosOnlyModel: {
        get() {
            return this.filterModeIsDemosOnly;
        },
        set(value) {
            // When checkbox changes, dispatch the action to toggle and refetch
            console.log(`DevToolbar: Toggling filter mode (Show ONLY Demos: ${value})`);
            this.$store.dispatch('projects/toggleDemoFilterMode'); // Dispatch RENAMED action
        }
    }
  },
  methods: {
    // Use mapActions for dispatching
    ...(typeof Vuex !== 'undefined' ? Vuex.mapActions({
        _impersonateUser: 'user/impersonateUser', // Map action
        _revertImpersonation: 'user/revertImpersonation' // Map action (optional, handled by impersonateUser)
    }) : {
        // Fallback methods
        _impersonateUser(userId) { console.error('Vuex not available, cannot impersonate user', userId); },
        _revertImpersonation() { console.error('Vuex not available, cannot revert impersonation'); }
    }),

    // Handler for when the select menu value changes
    handleImpersonationChange(selectedOption) {
        // Check if selectedOption is the object { value, label } or just the value
        const selectedUserId = (typeof selectedOption === 'object' && selectedOption !== null) 
                                ? selectedOption.value 
                                : selectedOption;
                                
        console.log("DevToolbar: Impersonation selection changed. Extracted ID:", selectedUserId);
        
        if (selectedUserId !== undefined && selectedUserId !== null) {
            this._impersonateUser(selectedUserId); // Dispatch action with the extracted ID
        } else {
            console.error("DevToolbar: Invalid selected user ID from dropdown:", selectedOption);
        }
    },

    // Example method for other dev actions
    refreshData() {
      console.log('DevToolbar: Refresh Data button clicked.');
      // Dispatch the root action to refetch everything
      // Add confirmation later if needed
      this.$store.dispatch('fetchInitialData');
    }
  },
  // Template now defined inline
  template: `
    <div class="dev-toolbar bg-yellow-100 text-yellow-800 p-2 text-xs flex items-center space-x-4 border-b border-yellow-300">
      <span class="font-bold">DEV TOOLS</span>
      
      <!-- REMOVED Refresh Data Button -->
      <!-- <base-button @click="refreshData" size="xs" variant="warning">Refresh Data</base-button> -->
      
      <!-- Re-add Demo Filter Toggle -->
      <label class="flex items-center space-x-1 cursor-pointer">
          <base-toggle v-model="filterModeIsDemosOnlyModel"></base-toggle>
          <span>Show ONLY Demos</span>
      </label>

      <!-- Impersonation Section -->
      <div class="flex items-center space-x-1">
          <label for="impersonate-select" class="font-medium">Impersonate:</label>
          <base-select-menu 
              id="impersonate-select"
              :options="impersonationOptions"
              :modelValue="selectedImpersonationId" 
              @update:modelValue="handleImpersonationChange"
              class="w-48" 
          />
      </div>

      <!-- Impersonation Status Indicator -->
      <div v-if="isImpersonating && originalUser" class="flex items-center space-x-1">
          <base-badge color="warning">Impersonating: {{ currentUser?.name || currentUser?.email }}</base-badge>
          <span>(Original: {{ originalUser.name || originalUser.email }})</span>
          <!-- Revert button is implicit by selecting 'Default User' -->
      </div>

      <!-- Add other dev buttons/info here -->
      <!-- Example: <span class="ml-auto">Current User ID: {{ currentUser?.id }}</span> -->
      
    </div>
  `
};

export default DevToolbar;

// Remove global exposure
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.DevToolbar = DevToolbar; 

  