// app/views/WidgetView.js

// Imports for components used in the template
import KanbanBoard from '../components/kanban/KanbanBoard.js';
import DevToolbar from '../components/kanban/DevToolbar.js'; // Make sure DevToolbar is imported
import BaseNotification from '../components/common/BaseNotification.js'; // ADD Import
// Import KanbanToolbar
import KanbanToolbar from '../components/kanban/KanbanToolbar.js';
import KanbanBoardSkeleton from '../components/kanban/KanbanBoardSkeleton.js'; // Import Skeleton

// Ensure Vuex is available for mapGetters
if (typeof Vuex === 'undefined') {
  console.warn('Vuex might not be loaded yet for helpers in WidgetView.');
}

const WidgetView = {
  name: 'WidgetView',
  components: {
    KanbanBoard,
    DevToolbar, // Register DevToolbar locally
    BaseNotification, // ADD Registration
    KanbanToolbar, // Register KanbanToolbar
    KanbanBoardSkeleton // Register Skeleton locally
  },
  data() {
    return {
      // Initial local state for the view, if any
    };
  },
  computed: {
    // Use mapGetters to get states needed for view logic
    ...(typeof Vuex !== 'undefined' ? Vuex.mapGetters({
        isAdmin: 'user/isAdmin',
        // Map global loading/error state from UI module
        isGloballyLoading: 'ui/isGloballyLoading',
        globalError: 'ui/globalError',
        activeNotifications: 'ui/activeNotifications', // ADD Fallback
        // Add getter for lookup loading state
        isLoadingLookups: 'lookups/isLoading'
    }) : {
        // Fallbacks
        isAdmin: () => false,
        isGloballyLoading: () => false,
        globalError: () => null,
        activeNotifications: () => [], // ADD Fallback
        isLoadingLookups: () => true // Assume loading if Vuex fails
    }),

    // Use the mapped global states
    isLoading() {
      return this.isGloballyLoading;
    },
    error() {
      return this.globalError;
    }
  },
  methods: {
    // Map removeNotification action
    ...(typeof Vuex !== 'undefined' ? Vuex.mapActions('ui', {
        removeNotification: 'removeNotification' // Map action
    }) : {
        // Fallback method
        removeNotification(id) { console.error('Vuex not available, cannot remove notification', id); }
    }),

    // Methods specific to this view
    // We will likely dispatch actions here or in mounted
    fetchInitialData() {
      console.log('WidgetView: fetchInitialData called (implementation pending).');
      // Example dispatch:
      // this.$store.dispatch('user/fetchCurrentUser');
      // this.$store.dispatch('lookups/fetchAllLookups');
      // this.$store.dispatch('projects/fetchInitialProjects');
    }
  },
  mounted() {
    console.log('WidgetView mounted. Dispatching fetchInitialData...');
    // Dispatch the root action to fetch all essential data
    this.$store.dispatch('fetchInitialData');
  },
  // Reference the template defined in widget.html
  // template: '#widget-view-template'
  template: `
      <div class="widget-container w-full h-full flex flex-col">
        <!-- Dev Toolbar (conditionally rendered first) -->
        <dev-toolbar v-if="isAdmin"></dev-toolbar>

        <!-- Kanban Toolbar (conditionally rendered based on lookup loading) -->
        <!-- Render toolbar immediately; filter options will populate when lookups load -->
        <kanban-toolbar></kanban-toolbar>

        <!-- Main Content Area -->
        <div class="flex-grow overflow-hidden"> 
            <div v-if="isLoading" class="flex-grow flex items-center justify-center h-full">
              <kanban-board-skeleton></kanban-board-skeleton>
            </div>
    
            <div v-else-if="error" class="flex-grow p-4 error-message text-red-600">
              Error loading widget: {{ error }}
            </div>
    
            <!-- Render Kanban Board when not loading and no error -->
            <div v-else class="widget-content h-full"> 
               <kanban-board></kanban-board>
              <!-- Placeholder for Project Details Modal (conditionally rendered) -->
            </div>
        </div>

        <!-- Notification Container -->
        <div class="fixed bottom-5 right-5 z-50 space-y-2 w-full max-w-sm">
            <transition-group name="notification-fade" tag="div">
                 <base-notification
                    v-for="notification in activeNotifications"
                    :key="notification.id"
                    :type="notification.type"
                    :title="notification.title"
                    :message="notification.message"
                    :duration="notification.duration"
                    @close="removeNotification(notification.id)"
                />
            </transition-group>
        </div>

      </div>
    `
};

// Expose the component definition globally
// window.WidgetView = WidgetView; 
export default WidgetView; 