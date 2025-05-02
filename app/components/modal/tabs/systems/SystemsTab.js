// app/components/modal/tabs/systems/SystemsTab.js

// Imports
import BaseCard from '../../../common/BaseCard.js';
import BaseButton from '../../../common/BaseButton.js';
import BaseStats from '../../../common/BaseStats.js';
import BaseTextInput from '../../../common/BaseTextInput.js';
import BaseStackedList from '../../../common/BaseStackedList.js';
import BaseEmptyStates from '../../../common/BaseEmptyStates.js';
import { formatNumber, formatCurrency } from '../../../../utils/helpers.js'; // Assuming these exist
import { useUiStore } from '../../../../store/uiStore.js';
import { useLookupsStore } from '../../../../store/lookupsStore.js';
import { useMaterialStore } from '../../../../store/materialStore.js';
import { useProjectsStore } from '../../../../store/projectsStore.js';
import MaterialForm from './MaterialForm.js';
import MaterialItem from './MaterialItem.js';

const { ref, computed, reactive, watch } = Vue;

// Placeholder for mapping material category to icon
const getMaterialCategoryIcon = (category) => {
    switch (category) {
        case 'Module':           return 'fas fa-solar-panel';
        case 'Inverter':       return 'fas fa-plug';
        case 'Battery':        return 'fas fa-battery-full';
        case 'Other Component': 
        default:              return 'fas fa-box';
    }
};

export default {
    name: 'SystemsTab',
  components: {
      BaseCard,
      BaseButton,
      BaseStats,
      BaseTextInput,
      BaseStackedList,
      BaseEmptyStates,
      MaterialForm,
      MaterialItem
  },
    props: {
        project: { 
            type: Object, 
            required: true 
        }
    },
  setup(props) {
    const uiStore = useUiStore();
    const lookupsStore = useLookupsStore();
    const materialStore = useMaterialStore();
    const projectsStore = useProjectsStore();
    const project = computed(() => props.project);

    // --- State for Material Form (Add/Edit) ---
    const isAddingMaterial = ref(false);
    const editingMaterialId = ref(null);

    // --- State for Delete Confirmation ---
    const confirmingDeleteMaterialId = ref(null);

    // --- State for Inline System Editing ---
    const isEditingSystem = ref(false);
    const isSavingSystemEdit = ref(false);
    const systemEditForm = reactive({ // Keep for inline system edit
        kW_STC: 0,
        Annual_Output_kWh: 0,
        Annual_Usage: 0,
        Is_Approved: false
    });

    // --- System Overview Computed --- 
    const systemSizeKw = computed(() => formatNumber(project.value?.kW_STC, 2));
    const annualOutputKwh = computed(() => formatNumber(project.value?.Annual_Output_kWh));
    const annualUsageKwh = computed(() => formatNumber(project.value?.Annual_Usage));
    const systemYield = computed(() => formatNumber(project.value?.Yield, 0));
    const offsetPercentage = computed(() => `${formatNumber(project.value?.Offset || 0, 1)}%`);
    const isApproved = computed(() => project.value?.Is_Approved === true);

    // --- Computed for BaseStats --- 
    const overviewStats = computed(() => [
        { id: 'size', name: 'Size (kW)', stat: systemSizeKw.value },
        { id: 'output', name: 'Output (kWh)', stat: annualOutputKwh.value },
        { id: 'usage', name: 'Usage (kWh)', stat: annualUsageKwh.value },
        { id: 'yield', name: 'Yield (kWh/kW)', stat: systemYield.value },
        { id: 'offset', name: 'Offset', stat: offsetPercentage.value }
    ]);

    // --- Bill of Materials Computed ---
    const materials = computed(() => project.value?.Bill_of_Materials || []);

    const groupedMaterials = computed(() => {
        if (!materials.value) return {};
        return materials.value.reduce((acc, material) => {
                const category = material.Category || 'Other Component';
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(material);
                return acc;
            }, {});
    });
    
    const orderedCategories = computed(() => {
        const order = ['Module', 'Inverter', 'Battery', 'Other Component'];
        return Object.keys(groupedMaterials.value).sort((a, b) => {
            let indexA = order.indexOf(a);
            let indexB = order.indexOf(b);
            if (indexA === -1) indexA = order.length; // Put unknown categories last
            if (indexB === -1) indexB = order.length;
            return indexA - indexB;
        });
    });

    const totalMaterialCost = computed(() => {
        if (!materials.value) return 0;
        const total = materials.value.reduce((sum, material) => 
                sum + (parseFloat(material.Total_Price) || 0), 0
            );
        return formatCurrency(total);
    });

    // --- Helper to get initial data for MaterialForm ---
    const getMaterialForEditing = computed(() => {
        if (!editingMaterialId.value) return {};
        return materials.value.find(m => m.ID === editingMaterialId.value) || {};
    });

    const equipmentData = computed(() => lookupsStore.equipmentData || {});

    // --- ADD computed to track if any form is open --- 
    const isAnyMaterialFormOpen = computed(() => isAddingMaterial.value || !!editingMaterialId.value);

    // --- Methods ---
    const editSystem = () => {
      startEditingSystem(); // Call the function to show the form
    };
    const addMaterial = () => { // Renamed from toggleAddMaterialForm
      isAddingMaterial.value = true;
      editingMaterialId.value = null;
      confirmingDeleteMaterialId.value = null; // Close delete confirm
    };
    const startEditingMaterial = (material) => {
        if (!material || !material.ID) {
            console.error("SystemsTab: Attempted to edit material without a valid ID:", material);
            // Optionally add UI notification here if uiStore is injected or accessible
            return;
        }
        console.log("SystemsTab: startEditingMaterial called with material ID:", material.ID); 
        isAddingMaterial.value = false; 
        confirmingDeleteMaterialId.value = null; 
        editingMaterialId.value = material.ID; 
        console.log("SystemsTab: editingMaterialId set to:", editingMaterialId.value);
    };
    const cancelMaterialForm = () => {
        isAddingMaterial.value = false;
        editingMaterialId.value = null;
    };
    const handleMaterialFormSubmit = () => {
         console.log("Material form submitted (add/edit successful)");
         cancelMaterialForm(); // Close the form
    };
    const requestDeleteMaterial = (materialId) => {
        isAddingMaterial.value = false; // Close add form
        editingMaterialId.value = null; // Close edit form
        confirmingDeleteMaterialId.value = materialId; 
    };
    const cancelDeleteMaterial = () => {
         confirmingDeleteMaterialId.value = null;
    };
    const confirmDeleteMaterial = async (materialId) => {
        if (confirmingDeleteMaterialId.value !== materialId) return; // Prevent accidental double-click
        
        console.log("Confirming delete for material:", materialId);
        try {
            await materialStore.deleteMaterial({ materialId });
            confirmingDeleteMaterialId.value = null; // Clear confirmation on success
        } catch (error) {
             console.error("SystemsTab: Failed to delete material", error);
        } 
    };

    // --- Method for System Editing ---
    const startEditingSystem = () => {
        if (!project.value) return;
        systemEditForm.kW_STC = project.value.kW_STC || 0;
        systemEditForm.Annual_Output_kWh = project.value.Annual_Output_kWh || 0;
        systemEditForm.Annual_Usage = project.value.Annual_Usage || 0;
        systemEditForm.Is_Approved = project.value.Is_Approved === true; // Ensure boolean
        isEditingSystem.value = true;
    };
    const cancelEditingSystem = () => {
        isEditingSystem.value = false;
    };
    const handleSaveSystemEdit = async () => {
        if (!project.value) return;
        isSavingSystemEdit.value = true;
        console.log("Saving system overview data:", systemEditForm);
        try {
            await projectsStore.updateSystemOverview({
                projectId: project.value.ID,
                systemData: { ...systemEditForm } 
            });
            cancelEditingSystem(); 
        } catch (error) {
            console.error("SystemsTab: Failed to save system overview edit", error);
        } finally {
            isSavingSystemEdit.value = false;
        }
    };

    return {
        // Overview
        isApproved,
        overviewStats,
        editSystem,
        isEditingSystem,
        isSavingSystemEdit,
        systemEditForm,
        cancelEditingSystem,
        handleSaveSystemEdit,
        // Materials
        materials,
        groupedMaterials,
        orderedCategories,
        totalMaterialCost,
        addMaterial,
        startEditingMaterial,
        requestDeleteMaterial,
        formatCurrency,
        getMaterialCategoryIcon,
        // --- Add/Edit Form State & Handlers ---
        isAddingMaterial, 
        editingMaterialId, 
        getMaterialForEditing,
        cancelMaterialForm,
        handleMaterialFormSubmit,
        // --- Delete Confirmation ---
        confirmingDeleteMaterialId,
        cancelDeleteMaterial,
        confirmDeleteMaterial,
        // --- Expose Form Open State ---
        isAnyMaterialFormOpen
    };
    },
    template: `
    <div class="system-tab-content space-y-6 p-1">
            <!-- System Overview Section -->
        <base-card>
             <template #header>
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-medium text-gray-900">System Overview</h3>
                    <div class="flex items-center gap-2">
                        <!-- NEW: Status Pill (only shown when not editing system) -->
                         <span v-if="!isEditingSystem" 
                               :class="[
                                   'px-3 py-1 rounded-full text-xs font-medium',
                                   isApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                               ]">
                             {{ isApproved ? 'Approved' : 'Not Approved' }}
                         </span>
                         
                        <!-- Edit/Cancel button -->
                        <base-button 
                            @click="isEditingSystem ? cancelEditingSystem() : editSystem()" 
                            size="xs" 
                            variant="secondary"
                            :disabled="isSavingSystemEdit"
                        >
                            {{ isEditingSystem ? 'Cancel' : 'Edit' }}
                        </base-button>
                    </div>
                </div>
            </template>
             <template #default>
                <!-- Display Mode: Use BaseStats -->
                 <base-stats 
                    v-if="!isEditingSystem"
                    :stats="overviewStats"
                    variant="shared-borders"
                    :smColumns="3" 
                    :lgColumns="5"
                    :rounded="false" 
                    :withShadow="false"
                    :withDividers="true"
                 />
                 
                 <!-- Edit Mode Form -->
                 <form v-else @submit.prevent="handleSaveSystemEdit" class="space-y-4">
                     <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <base-text-input
                             label="System Size (kW STC)"
                             type="number"
                             step="0.01"
                             v-model.number="systemEditForm.kW_STC"
                             id="system-edit-kw"
                             :attrs="{ min: 0 }"
                             required
                         />
                         <base-text-input
                             label="Annual Output (kWh)"
                             type="number"
                             step="1"
                             v-model.number="systemEditForm.Annual_Output_kWh"
                             id="system-edit-output"
                             :attrs="{ min: 0 }"
                             required
                         />
                         <base-text-input
                             label="Annual Usage (kWh)"
                             type="number"
                             step="1"
                             v-model.number="systemEditForm.Annual_Usage"
                             id="system-edit-usage"
                             :attrs="{ min: 0 }"
                             required
                         />
                    </div>
                    <div class="flex items-center space-x-3">
                         <label for="system-edit-approved" class="text-sm font-medium text-gray-900">System Approved:</label>
                         <input
                             type="checkbox"
                             v-model="systemEditForm.Is_Approved"
                             id="system-edit-approved"
                             class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                          />
                    </div>
                    <div class="flex justify-end border-t pt-4">
                         <base-button 
                             type="submit" 
                             variant="primary" 
                             size="sm" 
                             :disabled="isSavingSystemEdit"
                         >
                             <span v-if="isSavingSystemEdit"><i class="fas fa-spinner fa-spin mr-1"></i>Saving...</span>
                             <span v-else>Save Changes</span>
                         </base-button>
                    </div>
                 </form>
             </template>
        </base-card>

             <!-- Components Section -->
         <div class="space-y-4">
             <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-medium text-gray-900">System Components</h3>
                    <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-700">Total Cost: {{ totalMaterialCost }}</span>
                     <!-- Modify Add Material Button -->
                    <base-button @click="isAddingMaterial ? cancelMaterialForm() : addMaterial()" size="sm" variant="secondary">
                         <i :class="['mr-2', isAddingMaterial ? 'fas fa-times' : 'fas fa-plus']"></i>
                         {{ isAddingMaterial ? 'Cancel Add' : 'Add Material' }}
                    </base-button>
                    </div>
                </div>

                 <!-- ADD Inline Add/Edit Material Form -->
                 <material-form
                     v-if="isAddingMaterial || editingMaterialId"
                     :is-editing="!!editingMaterialId"
                     :initial-data="getMaterialForEditing"
                     :project-id="project.ID"
                     @submit="handleMaterialFormSubmit"
                     @cancel="cancelMaterialForm"
                     class="mb-6" 
                 />

                 <div v-if="materials.length > 0" class="space-y-4">
                     <base-card v-for="category in orderedCategories" :key="category" :no-body-padding="true">
                         <template #header>
                            <div class="flex justify-between items-center">
                                <h4 class="text-md font-medium text-gray-900 flex items-center">
                                    <i :class="[getMaterialCategoryIcon(category), 'mr-2 text-blue-500']"></i>
                                    {{ category }}
                                </h4>
                            </div>
                        </template>
                        <template #default>
                            <!-- Use BaseListContainer for structure, iterate inside default slot -->
                             <base-list-container 
                                v-if="groupedMaterials[category]?.length > 0" 
                                itemKey="ID" 
                                :dividers="true"
                                variant="simple"
                                >
                                <!-- Iterate within the default slot -->
                                <ul> <!-- Add ul wrapper for li elements -->
                                    <li v-for="item in groupedMaterials[category]" :key="item.ID"> 
                                         <material-item 
                                            :material="item"
                                            :is-confirming-delete="confirmingDeleteMaterialId === item.ID"
                                            :is-any-form-open="isAnyMaterialFormOpen"
                                            @edit="startEditingMaterial"
                                            @delete-request="requestDeleteMaterial"
                                            @confirm-delete="confirmDeleteMaterial"
                                            @cancel-delete="cancelDeleteMaterial"
                                         />
                                    </li>
                                </ul>
                             </base-list-container>
                             <p v-else class="text-sm text-gray-500 italic p-4 text-center">No components in this category.</p>
                        </template>
                     </base-card>
                 </div>
                 <!-- Use BaseEmptyStates -->
                 <base-empty-states 
                    v-else-if="!isAnyMaterialFormOpen" 
                    icon="fas fa-box-open"
                    title="No System Components"
                    description="Add materials using the button above."
                    class="py-8"
                 />
            </div>
        </div>
    `
};