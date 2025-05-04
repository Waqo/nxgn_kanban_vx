const { ref, watch, computed } = Vue;

// Import Stores
import { useCommissionsStore } from '../../../../store/commissionsStore.js';
import { useUiStore } from '../../../../store/uiStore.js';

// Import Base Components (Globally registered, but good for reference)
// import BaseModal from '../../../common/BaseModal.js';
// import BaseTextInput from '../../../common/BaseTextInput.js';
// import BaseButton from '../../../common/BaseButton.js';

const SalesRepForm = {
    name: 'SalesRepForm',
    props: {
        isOpen: { type: Boolean, default: false },
        salesRep: { type: Object, default: () => null } // Pass the full Sales Rep object
    },
    emits: ['close', 'save'], // 'save' might not be needed if refresh handles it
    setup(props, { emit }) {
        const commissionsStore = useCommissionsStore();
        const uiStore = useUiStore();

        const isSaving = ref(false);
        
        // Local reactive state for form data
        const editedSalesRep = ref({
            // Initialize with structure expected by API/update action
            Commercial_Commission_Rate: '',
            Regular_Commission_Rate: '',
            Email: '',
            Name: { first_name: '', last_name: '' }, // Nested Name object
            Phone: '',
            Shared_Commission_Rate: ''
        });
        
        // Watch the prop to update local state when modal opens or rep changes
        watch(() => props.salesRep, (newRep) => {
            if (newRep) {
                // Populate local state from prop
                editedSalesRep.value = {
                    Commercial_Commission_Rate: newRep.commercialCommissionRate || '',
                    Regular_Commission_Rate: newRep.regularCommissionRate || '',
                    Email: newRep.email || '',
                    Name: {
                        first_name: newRep.firstName || '',
                        last_name: newRep.lastName || ''
                    },
                    Phone: newRep.phone || '',
                    Shared_Commission_Rate: newRep.sharedCommissionRate || ''
                };
            } else {
                // Reset if no rep is passed (though should always have one when open)
                 editedSalesRep.value = {
                    Commercial_Commission_Rate: '', Regular_Commission_Rate: '', Email: '',
                    Name: { first_name: '', last_name: '' }, Phone: '', Shared_Commission_Rate: ''
                 };
            }
        }, { immediate: true }); // Immediate to populate on initial load

        const handleClose = () => {
            if (!isSaving.value) { // Prevent closing while saving
                emit('close');
            }
        };

        const handleSave = async () => {
            if (!props.salesRep?.id) {
                uiStore.addNotification({ type: 'error', message: 'Cannot save: Sales Rep ID is missing.' });
                return;
            }
            
            isSaving.value = true;
            try {
                // Prepare data specifically for the store action
                const updatePayload = {
                    Commercial_Commission_Rate: editedSalesRep.value.Commercial_Commission_Rate,
                    Regular_Commission_Rate: editedSalesRep.value.Regular_Commission_Rate,
                    Email: editedSalesRep.value.Email,
                    Name: { 
                        first_name: editedSalesRep.value.Name.first_name,
                        last_name: editedSalesRep.value.Name.last_name
                    },
                    Phone: editedSalesRep.value.Phone,
                    Shared_Commission_Rate: editedSalesRep.value.Shared_Commission_Rate
                };
                
                await commissionsStore.updateSalesRepDetails({
                    salesRepId: props.salesRep.id,
                    updatedData: updatePayload,
                    originalRepName: props.salesRep.name // Pass original name for logging
                });
                // Success notification and refresh are handled by the store action
                emit('close'); // Close modal on successful save
            } catch (error) {
                // Error notification handled by the store action
                console.error("SalesRepForm: Save failed", error); 
            } finally {
                isSaving.value = false;
            }
        };

        return {
            editedSalesRep,
            isSaving,
            handleClose,
            handleSave
        };
    },
    template: `
        <base-modal :show="isOpen" @close="handleClose" size="2xl">
            <template #header>
                <h2 class="text-xl font-semibold text-gray-900">Edit Sales Representative</h2>
            </template>
            
            <template #default>
                <div v-if="!salesRep" class="p-6 text-center text-gray-500">Loading rep data...</div>
                <div v-else class="p-6">
                    <div class="grid grid-cols-2 gap-x-6 gap-y-4">
                        <!-- First Name -->
                        <base-text-input 
                            label="First Name" 
                            v-model="editedSalesRep.Name.first_name" 
                            :attrs="{ id: 'edit-rep-first-name' }"
                            required
                        />
                        <!-- Last Name -->
                        <base-text-input 
                            label="Last Name" 
                            v-model="editedSalesRep.Name.last_name" 
                            :attrs="{ id: 'edit-rep-last-name' }"
                            required
                        />
                        <!-- Email -->
                         <base-text-input 
                            label="Email" 
                            type="email"
                            v-model="editedSalesRep.Email" 
                            :attrs="{ id: 'edit-rep-email' }"
                        />
                        <!-- Phone -->
                         <base-text-input 
                            label="Phone" 
                            type="tel"
                            v-model="editedSalesRep.Phone" 
                             :attrs="{ id: 'edit-rep-phone' }"
                        />
                        <!-- Regular Rate -->
                        <base-text-input 
                            label="Regular Rate (%)" 
                            type="number"
                            v-model="editedSalesRep.Regular_Commission_Rate" 
                             :attrs="{ id: 'edit-rep-reg-rate', step: '0.01' }"
                        />
                        <!-- Commercial Rate -->
                        <base-text-input 
                            label="Commercial Rate (%)" 
                            type="number"
                            v-model="editedSalesRep.Commercial_Commission_Rate" 
                            :attrs="{ id: 'edit-rep-com-rate', step: '0.01' }"
                        />
                        <!-- Shared Rate -->
                         <base-text-input 
                            label="Shared Rate (%)" 
                            type="number"
                            v-model="editedSalesRep.Shared_Commission_Rate" 
                            :attrs="{ id: 'edit-rep-shared-rate', step: '0.01' }"
                        />
                    </div>
                </div>
            </template>
            
            <template #footer>
                <div class="flex justify-end space-x-3">
                    <base-button variant="secondary" @click="handleClose" :disabled="isSaving">Cancel</base-button>
                    <base-button variant="primary" @click="handleSave" :loading="isSaving">Save Changes</base-button>
                </div>
            </template>
        </base-modal>
    `
};

export default SalesRepForm; 