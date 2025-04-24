// app/components/modal/ModalHeader.js

// Import common components used in the header
import BaseSelectMenu from '../common/BaseSelectMenu.js';
import BaseButton from '../common/BaseButton.js';
import BaseBadge from '../common/BaseBadge.js';

// Import Pinia stores and helpers
import { useLookupsStore } from '../../store/lookupsStore.js';
import { useProjectsStore } from '../../store/projectsStore.js';
const { mapState, mapActions } = Pinia;

const ModalHeader = {
    name: 'ModalHeader',
    components: {
        BaseSelectMenu,
        BaseButton,
        BaseBadge
    },
    // Define projectData prop received from parent
    props: {
        projectData: { // Renamed from project to match parent prop name
            type: Object, // Allow null when loading/error
            default: null
        },
        isLoading: Boolean,
        error: [String, Object, null]
    },
    emits: ['close'], // Emit close event to parent
    computed: {
        // Map lookup data from Pinia store
        ...mapState(useLookupsStore, [
            'stages', 
            'tranches'
        ]),
        
        // --- Derived Computed Properties based on prop --- 
        project() {
            // Provide a local computed based on the prop for easier access
            return this.projectData;
        },
        contactName() {
            return this.project?.Owner_Name?.zc_display_value || 'Loading...';
        },
        formattedAddress() {
            if (!this.project?.Site_Address) return 'Loading...';
            const addr = this.project.Site_Address;
            const parts = [addr.address_line_1, addr.district_city, addr.state_province, addr.postal_Code];
            return parts.filter(Boolean).join(', ');
        },
        currentStageId() {
            return this.project?.New_Stage?.ID || null;
        },
        currentTrancheId() {
            return this.project?.Tranche?.ID || null;
        },
        stageOptions() {
            // Uses Pinia mapped stages
            return this.stages.map(s => ({ value: s.id, label: s.title }));
        },
        trancheOptions() {
            // Uses Pinia mapped tranches
            const options = this.tranches.map(t => ({ value: t.id, label: `Tranche ${t.number}` }));
            options.unshift({ value: null, label: 'Unassigned' });
            return options;
        },
        processedTags() {
            // Get store instance directly
            const lookupsStore = useLookupsStore();
            const tagsMap = lookupsStore.tags; // Access state directly

            // Add safety checks
            if (!this.projectData || !this.projectData.Tags || !tagsMap || !(tagsMap instanceof Map)) { 
                 console.warn("ModalHeader: projectData or tagsMap not ready for processedTags");
                 return [];
            }
            
            return this.projectData.Tags
                .map(rawTag => {
                    const mappedTag = tagsMap.get(rawTag.ID); // Use direct map access
                    return mappedTag ? { ...mappedTag, id: rawTag.ID } : null;
                })
                .filter(Boolean);
        }
    },
    methods: {
        // Map actions from Pinia projects store
        ...mapActions(useProjectsStore, [
            'updateProjectStage',
            'updateProjectTranche'
        ]),

        handleStageChange(selectedStage) {
            if (!this.project || !selectedStage || selectedStage.value === this.currentStageId) return;
            console.log(`ModalHeader: Stage change selected: ID=${selectedStage.value}`);
            // Call mapped Pinia action
            this.updateProjectStage({ projectId: this.project.ID, newStageId: selectedStage.value });
        },
        handleTrancheChange(selectedTranche) {
            if (!this.project || selectedTranche.value === this.currentTrancheId) return;
             console.log(`ModalHeader: Tranche change selected: ID=${selectedTranche.value}`);
            // Call mapped Pinia action
            this.updateProjectTranche({ projectId: this.project.ID, newTrancheId: selectedTranche.value });
        },
        // TODO: Tag management methods
        addTag() { alert('Add Tag not implemented yet.'); },
        removeTag(tagId) { alert(`Remove Tag not implemented for tag ID: ${tagId}`); },
        // TODO: Action button methods
        refreshData() { alert('Refresh Data not implemented yet.'); },
        requestHelp() { alert('Request Help not implemented yet.'); },
        openProjectFolder() {
             if(this.project?.Project_Folder_Link?.url) window.open(this.project.Project_Folder_Link.url, '_blank');
             else alert('Project Folder Link not available.');
        },
        openInvestorFolder() {
             if(this.project?.Project_Investor_Folder_Link?.url) window.open(this.project.Project_Investor_Folder_Link.url, '_blank');
             else alert('Investor Folder Link not available.');
        }
    },
    template: `
        <div class="modal-header-content p-4 border-b border-gray-200 bg-gray-50">
            <!-- Add loading/error states based on props -->
            <div v-if="isLoading" class="text-center text-gray-500">Loading header data...</div>
            <div v-else-if="error" class="text-center text-red-600">Error loading project: {{ error }}</div>
            <div v-else-if="!project" class="text-center text-gray-500">Project data unavailable.</div>
            <div v-else>
                <!-- Row 1: Name, Address, Actions -->
                <div class="flex items-start justify-between mb-3">
                    <!-- Left: Name & Address -->
                    <div class="min-w-0 flex-1">
                        <h2 class="text-xl font-bold leading-7 text-gray-900 sm:truncate">
                            {{ contactName }}
                        </h2>
                        <div class="mt-1 flex items-center text-sm text-gray-500">
                            <i class="fas fa-map-marker-alt mr-1.5 text-gray-400 flex-shrink-0"></i>
                            <span :title="formattedAddress">{{ formattedAddress }}</span>
                        </div>
                         <div class="mt-1 flex items-center text-sm text-gray-500">
                             <i class="fas fa-id-badge mr-1.5 text-gray-400 flex-shrink-0"></i>
                             <span>ID: {{ project.ID }}</span>
                              <span v-if="project.OpenSolar_Project_ID" class="ml-3">OS ID: {{ project.OpenSolar_Project_ID }}</span>
                         </div>
                    </div>
                    <!-- Right: Action Buttons -->
                    <div class="ml-4 flex flex-shrink-0 items-center space-x-2">
                        <base-button @click="refreshData" variant="secondary" size="sm" title="Refresh Project Data">
                            <i class="fas fa-sync-alt"></i>
                        </base-button>
                         <base-button @click="openProjectFolder" variant="secondary" size="sm" title="Open Project Folder" :disabled="!project.Project_Folder_Link?.url">
                             <i class="fas fa-folder-open"></i> 
                         </base-button>
                         <base-button @click="openInvestorFolder" variant="secondary" size="sm" title="Open Investor Folder" :disabled="!project.Project_Investor_Folder_Link?.url">
                             <i class="fas fa-dollar-sign"></i>
                         </base-button>
                        <base-button @click="requestHelp" variant="danger" size="sm" title="Request Help">
                            <i class="fas fa-exclamation-circle mr-1"></i> Need Help
                        </base-button>
                        <!-- Add Phone/Email icons later if needed -->
                    </div>
                </div>

                <!-- Row 2: Stage, Tranche, Tags -->
                <div class="flex items-center justify-between flex-wrap gap-4">
                    <!-- Stage Selector -->
                    <div class="flex items-center gap-2">
                        <label for="modal-stage-select" class="text-sm font-medium text-gray-500">Stage:</label>
                        <base-select-menu
                            id="modal-stage-select"
                            :modelValue="currentStageId"
                            @update:modelValue="handleStageChange"
                            :options="stageOptions"
                            placeholder="Select Stage..."
                            class="w-auto min-w-[180px]"
                        />
                    </div>
                    
                    <!-- Tranche Selector -->
                     <div class="flex items-center gap-2">
                        <label for="modal-tranche-select" class="text-sm font-medium text-gray-500">Tranche:</label>
                        <base-select-menu
                            id="modal-tranche-select"
                            :modelValue="currentTrancheId" 
                            @update:modelValue="handleTrancheChange"
                            :options="trancheOptions"
                            placeholder="Select Tranche..."
                            class="w-auto min-w-[180px]"
                        />
                    </div>

                    <!-- Tags Area -->
                    <div class="flex items-center gap-2 flex-wrap flex-1 min-w-[200px]">
                         <label class="text-sm font-medium text-gray-500">Tags:</label>
                         <div class="flex items-center gap-1 flex-wrap">
                             <base-badge 
                                v-for="tag in processedTags" 
                                :key="tag.id" 
                                :color="tag.color" 
                                size="md"
                                :title="tag.description || tag.name"
                                class="cursor-pointer group relative"
                            >
                                {{ tag.name }}
                                <button 
                                    @click.stop="removeTag(tag.id)"
                                    class="absolute -top-1 -right-1 p-0.5 bg-gray-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                                    title="Remove Tag"
                                >
                                     <svg class="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                        <path stroke-linecap="round" stroke-width="1.5" d="M1 1l6 6m0-6L1 7" />
                                      </svg>
                                </button>
                             </base-badge>
                             <base-button @click="addTag" variant="secondary" size="xs" class="rounded-full px-1.5 py-0.5 text-xs" title="Add Tag">
                                <i class="fas fa-plus"></i>
                            </base-button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

export default ModalHeader; 