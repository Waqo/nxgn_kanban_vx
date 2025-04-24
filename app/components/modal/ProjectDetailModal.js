// app/components/modal/ProjectDetailModal.js

// Import Pinia store and helpers
import { useModalStore } from '../../store/modalStore.js';
const { mapState, mapActions } = Pinia;

// Component Imports (Assumed needed based on old code)
import ModalHeader from './ModalHeader.js';
import OverviewTab from './tabs/overview/OverviewTab.js';
import ContactsTab from './tabs/contacts/ContactsTab.js';
import DocumentsTab from './tabs/documents/DocumentsTab.js';
import SurveyTab from './tabs/survey/SurveyTab.js';
import SystemsTab from './tabs/systems/SystemsTab.js';
import TasksTab from './tabs/tasks/TasksTab.js';
import PermittingTab from './tabs/permitting/PermittingTab.js';
import CommissionsTab from './tabs/commissions/CommissionsTab.js';
import PropertyInfoTab from './tabs/propertyInfo/PropertyInfoTab.js';
import ActivityTab from './tabs/activity/ActivityTab.js';
import CommunicationsTab from './tabs/communications/CommunicationsTab.js';
import InvestorsTab from './tabs/investors/InvestorsTab.js';
// Add other tab component imports as needed...

const ProjectDetailModal = {
  name: 'ProjectDetailModal',
  // No props needed as data comes from store
  components: {
    // Register imported components
    ModalHeader,
    OverviewTab,
    ContactsTab,
    DocumentsTab,
    SurveyTab,
    SystemsTab,
    TasksTab,
    PermittingTab,
    CommissionsTab,
    PropertyInfoTab,
    ActivityTab,
    CommunicationsTab,
    InvestorsTab,
    // ... other tabs
  },
  computed: {
    // Map required state/getters from the modal store
    ...mapState(useModalStore, [
        'isVisible', // Though visibility is controlled by v-if in WidgetView
        'isLoading', 
        'error', 
        'projectData', 
        'activeTab'
    ]),
    
    // Define tabs based on modal plan (or dynamically later)
    tabs() {
      return [
        { id: 'overview', name: 'Overview' },
        { id: 'contacts', name: 'Contacts' },
        { id: 'documents', name: 'Documents' },
        { id: 'survey', name: 'Survey' },
        { id: 'systems', name: 'System' },
        { id: 'tasks', name: 'Tasks' },
        { id: 'permitting', name: 'Permitting' },
        { id: 'commissions', name: 'Commissions' },
        { id: 'propertyInfo', name: 'Property Info' },
        { id: 'activity', name: 'Activity' },
        { id: 'communications', name: 'Communications' },
        { id: 'investors', name: 'Investors' },
        // Add other tabs from plan...
        // { id: 'permitting', name: 'Permitting' },
        // { id: 'salesRep', name: 'Sales Rep' },
        // { id: 'propertyInfo', name: 'Property Info' },
        // { id: 'activity', name: 'Activity' },
        // { id: 'communications', name: 'Communications' },
        // { id: 'investors', name: 'Investors' },
      ];
    },
    
    // Determine the component to render based on activeTab
    activeTabComponent() {
        switch(this.activeTab) {
            case 'overview': return 'OverviewTab';
            case 'contacts': return 'ContactsTab';
            case 'documents': return 'DocumentsTab';
            case 'survey': return 'SurveyTab';
            case 'systems': return 'SystemsTab';
            case 'tasks': return 'TasksTab';
            case 'permitting': return 'PermittingTab';
            case 'commissions': return 'CommissionsTab';
            case 'propertyInfo': return 'PropertyInfoTab';
            case 'activity': return 'ActivityTab';
            case 'communications': return 'CommunicationsTab';
            case 'investors': return 'InvestorsTab';
            default: return null; // Or a default tab component
        }
    }
  },
  methods: {
    // Map actions needed from the modal store
    ...mapActions(useModalStore, [
        'closeModal',
        'setActiveTab'
    ]),
  },
  template: `
    <base-modal 
        :show="isVisible" 
        @close="closeModal" 
        :size="'6xl'"
    >
      <template #header>
        <!-- Pass necessary data down to ModalHeader -->
        <modal-header 
            :project-data="projectData"
            :is-loading="isLoading" 
            :error="error"
            @close="closeModal"
        />
      </template>

      <template #default>
        <div v-if="isLoading" class="p-6 text-center">
          Loading project details...
          <!-- Add a spinner or more elaborate loading indicator -->
        </div>
        <div v-else-if="error" class="p-6 bg-red-100 text-red-700 rounded-md">
           Error loading details: {{ error }}
        </div>
        <div v-else-if="!projectData" class="p-6 text-center text-gray-500">
            No project data available.
        </div>
        <div v-else class="modal-content-area">
            <!-- Tab Navigation -->
            <base-tabs 
                :tabs="tabs" 
                :modelValue="activeTab"
                @update:modelValue="setActiveTab"
                class="px-6 pt-2 border-b border-gray-200"
            />
            
            <!-- Tab Content Area -->
            <div class="p-6 tab-content">
                 <!-- Dynamically render the active tab component -->
                 <!-- Pass projectData down as a prop -->
                 <component 
                     :is="activeTabComponent" 
                     v-if="activeTabComponent"
                     :project="projectData"
                 />
                 <div v-else-if="activeTab === 'tasks'" class="mt-4">
                    <tasks-tab :project="projectData"></tasks-tab>
                 </div>
                 <div v-else-if="activeTab === 'permitting'" class="mt-4">
                     <permitting-tab :project="projectData"></permitting-tab>
                 </div>
                 <!-- Add other v-else-if blocks for other tabs -->
                 <div v-else class="mt-4">
                    Select a tab.
                 </div>
            </div>
        </div>
      </template>
      
      <!-- Footer (Optional) -->
      <!-- 
      <template #footer>
        <div class="flex justify-end px-4 py-3 bg-gray-50">
            <base-button @click="closeModal" variant="secondary">Close</base-button>
        </div>
      </template> 
      -->
    </base-modal>
  `
};

export default ProjectDetailModal; 