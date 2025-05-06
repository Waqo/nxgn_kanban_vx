// app/views/WidgetView.js

// Imports for components used in the template
import KanbanBoard from '../components/kanban/KanbanBoard.js';
import DevToolbar from '../components/kanban/DevToolbar.js'; // Make sure DevToolbar is imported
import BaseNotification from '../components/common/BaseNotification.js'; // ADD Import
// --- ADD BaseNavbar Import ---
import BaseNavbar from '../components/common/BaseNavbar.js';
// --- ADD NewNotificationAlert Import ---
import NewNotificationAlert from '../components/common/NewNotificationAlert.js';
// Import KanbanToolbar
import KanbanToolbar from '../components/kanban/KanbanToolbar.js';
import KanbanBoardSkeleton from '../components/kanban/KanbanBoardSkeleton.js'; // Import Skeleton
// --- ADD Import for Modal ---
import ProjectDetailModal from '../components/modal/ProjectDetailModal.js';

// --- Pinia Store Imports ---
import { useUiStore } from '../store/uiStore.js';
import { useUserStore } from '../store/userStore.js'; // Import user store
import { useLookupsStore } from '../store/lookupsStore.js'; // Import lookups store
import { useModalStore } from '../store/modalStore.js'; // Import modal store

// --- Pinia Helper Import ---
const { mapState, mapActions } = Pinia;


const WidgetView = {
  name: 'WidgetView',
  components: {
    KanbanBoard,
    DevToolbar, // Register DevToolbar locally
    BaseNotification, // ADD Registration
    BaseNavbar, // <<< ADD Registration
    NewNotificationAlert, // <<< ADD Registration
    KanbanToolbar, // Register KanbanToolbar
    KanbanBoardSkeleton, // Register Skeleton locally
    ProjectDetailModal // Register ProjectDetailModal
  },
  data() {
    return {
      // Initial local state for the view, if any
    };
  },
  computed: {
    // --- Map Pinia State/Getters ---
    ...mapState(useUiStore, ['isGloballyLoading', 'globalError', 'activeNotifications']),
    ...mapState(useUserStore, ['isAdmin']), 
    ...mapState(useLookupsStore, { isLoadingLookups: 'isLoading'}), 
    // Map modal visibility state using object syntax for aliasing
    ...mapState(useModalStore, {
        isModalVisible: 'isVisible' // Map state.isVisible to computed.isModalVisible
    }),
    ...mapState(useUiStore, { activeNewAlertsFromStore: 'activeNewAlerts' }), // Map new getter
    
    // --- Map Remaining Vuex Getters --- (None should be left)
    // Remove the leftover mapping for lookups/isLoading
    // ...(typeof Vuex !== 'undefined' ? Vuex.mapGetters({
    //     isLoadingLookups: 'lookups/isLoading' 
    // }) : {
    //     isLoadingLookups: () => true 
    // }),
    
    // Use the mapped global states
    isLoading() {
      // Uses Pinia mapped states
      return this.isGloballyLoading || this.isLoadingLookups;
    },
    error() {
      // Uses Pinia mapped state
      return this.globalError;
    }
  },
  methods: {
    // --- Map Pinia Actions ---
    ...mapActions(useUiStore, ['removeNotification']),
    ...mapActions(useUiStore, { removeNewAlertAction: 'removeNewNotificationAlert' }), // Map new action

    // Remove the fetchInitialData method as it's now handled in App.js
    // fetchInitialData() {
    //   console.log('WidgetView: fetchInitialData called.');
    //   this.$store.dispatch('fetchInitialData');
    // }
  },
  mounted() {
    // Remove dispatch call from here
    // console.log('WidgetView mounted. Dispatching fetchInitialData...');
    // this.fetchInitialData(); 
    console.log('WidgetView mounted. Initialization called in App.js.');
  },
  // Reference the template defined in widget.html
  // template: '#widget-view-template'
  template: `
      <div class="widget-container w-full h-full flex flex-col">
        <!-- ADD BaseNavbar -->
        <base-navbar variant="light" class="flex-shrink-0" :max-width="'full'">
          <!-- Leave slots empty to use defaults (which includes NotificationBell & UserProfileMenu) -->
        </base-navbar>

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
              <!-- Render modal based on Pinia state -->
              <project-detail-modal v-if="isModalVisible"></project-detail-modal> 
            </div>
        </div>

        <!-- Notification Container -->
        <div class="fixed bottom-5 right-5 z-50 space-y-2 w-full max-w-sm">
            <transition-group name="notification-fade" tag="div">
                 <base-notification
                    v-for="notification in activeNotifications"
                    :key="notification.id"
                    :id="notification.id"
                    :type="notification.type"
                    :title="notification.title"
                    :duration="notification.duration"
                    @dismiss="removeNotification(notification.id)"
                 >
                    {{ notification.message }} 
                 </base-notification>
            </transition-group>
        </div>

        <!-- New Notification Alert Container (Top Right) -->
        <div class="fixed top-16 right-5 z-[60] space-y-3 w-full max-w-sm">
            <transition-group name="notification-fade" tag="div"> 
                 <new-notification-alert
                    v-for="alert in activeNewAlertsFromStore"
                    :key="alert.id"
                    :id="alert.id"
                    :type="alert.type"
                    :title="alert.title"
                    :message="alert.message"
                    :duration="alert.duration"
                    @dismiss="removeNewAlertAction(alert.id)"
                 />
            </transition-group>
        </div>

      </div>
    `
};

// Expose the component definition globally
// window.WidgetView = WidgetView; 
export default WidgetView; 