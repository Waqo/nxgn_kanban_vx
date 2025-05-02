// app/components/modal/ProjectDetailModal.js

// Import Pinia store and helpers
import { useModalStore } from '../../store/modalStore.js';
import { useUserStore } from '../../store/userStore.js';
// --- REMOVE mapState, mapActions ---
// const { mapState, mapActions } = Pinia;
// --- ADD Vue Composition API imports ---
const { computed, watch } = Vue;

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
// *** ADD Import for Skeleton ***
import ProjectDetailModalSkeleton from './ProjectDetailModalSkeleton.js';
import FilePreview from './FilePreview.js';
import FileComparison from './FileComparison.js';
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
    // *** ADD Registration for Skeleton ***
    ProjectDetailModalSkeleton,
    FilePreview,
    FileComparison,
    // ... other tabs
  },
  // --- ADD setup function ---
  setup() {
    // Instantiate stores
    const modalStore = useModalStore();
    const userStore = useUserStore();

    // --- Replicate State/Getters as Computed --- 
    const isVisible = computed(() => modalStore.isVisible);
    const isLoading = computed(() => modalStore.isLoading);
    const error = computed(() => modalStore.error);
    const projectData = computed(() => modalStore.projectData);
    const activeTab = computed(() => modalStore.activeTab);
    const currentUser = computed(() => userStore.currentUser);
    const isPreviewVisible = computed(() => modalStore.isPreviewVisible);

    // --- Replicate Computed: tabs ---
    const tabs = computed(() => [
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
    ]);

    // --- Replicate Computed: activeTabComponent ---
    const activeTabComponent = computed(() => {
        switch(activeTab.value) { // Use .value for computed refs
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
            default: return null;
        }
    });

    // --- Replicate Methods (using store actions) ---
    const closeModal = () => {
        modalStore.closeModal();
    };

    const setActiveTab = (tabId) => {
        modalStore.setActiveTab(tabId);
    };

    const handleRefresh = () => {
        if (modalStore.refreshModalData) {
             modalStore.refreshModalData();
        } else {
             console.warn('refreshModalData action not found in modalStore');
        }
    };

    const handleHelp = () => {
        alert('Help requested! (Functionality not implemented)');
    };

    // *** ADDED: Watcher for Logging Preview Modal Render ***
    watch(isPreviewVisible, (newValue, oldValue) => {
        if (newValue) {
            console.log('ProjectDetailModal: Detected change in isPreviewVisible. Rendering preview modal.'); // LOG 8a
        } else if (oldValue && !newValue) {
             console.log('ProjectDetailModal: Detected change in isPreviewVisible. Hiding preview modal.'); // LOG 8b (for closing)
        }
    });

    // --- Return values needed by template ---
    return {
        // Computed State/Getters
        isVisible,
        isLoading,
        error,
        projectData,
        activeTab,
        currentUser,
        // Other Computed
        tabs,
        activeTabComponent,
        // Methods
        closeModal,
        setActiveTab,
        handleRefresh,
        handleHelp
    };
  },
  // --- REMOVE Options API blocks ---
  // computed: { ... }, 
  // methods: { ... },
  
  // --- Template Remains the Same (bindings now use returned values from setup) ---
  template: `
    <!-- Use fragment to hold both modals -->
    <>
        <!-- Main Project Detail Modal -->
        <base-modal 
            :show="isVisible" 
            @close="closeModal" 
            :size="'6xl'"
            scrollBehavior="outside"
            :hideScrollbar="true"
            :no-header-padding="true"
        >
          <template #header>
            <!-- Pass necessary data down to ModalHeader -->
            <modal-header 
                :project-data="projectData"
                :is-loading="isLoading" 
                :error="error"
                @close="closeModal"
                @refresh-data="handleRefresh"
                @request-help="handleHelp"
            />
          </template>

          <template #default>
            <div v-if="isLoading">
              <project-detail-modal-skeleton />
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
                    class="px-6 border-b border-gray-200"
                />
                
                <!-- Tab Content Area -->
                <div class="p-6 tab-content">
                     <!-- Dynamically render the active tab component -->
                     <!-- Pass projectData down as a prop -->
                     <component 
                         :is="activeTabComponent" 
                         v-if="activeTabComponent"
                         :project="projectData"
                         :currentUser="currentUser"
                     />
                     <div v-else class="mt-4 text-center text-gray-500">
                        Select a tab or component not found for '{{ activeTab }}'.
                     </div>
                </div>
            </div>
          </template>
          
          <!-- *** ADD Empty Footer Template to Remove Default Button *** -->
          <template #footer></template>
        </base-modal>
        
        <!-- *** ADDED: File Preview Component *** -->
        <file-preview />
        
        <!-- *** UPDATED: File Comparison Component Rendering *** -->
        <file-comparison 
            v-if="projectData?.Documents" 
            :all-documents="projectData.Documents"
        />
    </>
  `
};

export default ProjectDetailModal; 