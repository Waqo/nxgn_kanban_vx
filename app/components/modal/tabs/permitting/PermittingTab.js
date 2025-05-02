// app/components/modal/tabs/permitting/PermittingTab.js

import { useUiStore } from '../../../../store/uiStore.js';
import { usePermittingStore } from '../../../../store/permittingStore.js';
// --- Import Base Components ---
import BaseCard from '../../../common/BaseCard.js';
import BaseButton from '../../../common/BaseButton.js';
import BaseBadge from '../../../common/BaseBadge.js';
// --- ADD BaseDescriptionList Import ---
import BaseDescriptionList from '../../../common/BaseDescriptionList.js';
// --- Import Input Components ---
import BaseTextInput from '../../../common/BaseTextInput.js';
import BaseSelectMenu from '../../../common/BaseSelectMenu.js';
// --- Import Helpers ---
import { formatDateForInput } from '../../../../utils/helpers.js';

// --- Import Composition API functions ---
const { computed, ref, reactive, watch } = Vue;

const PermittingTab = {
    name: 'PermittingTab',
    // --- Register Base Components ---
    components: {
        BaseCard,
        BaseButton,
        BaseBadge,
        // --- ADD BaseDescriptionList ---
        BaseDescriptionList,
        BaseTextInput, // Register
        BaseSelectMenu // Register
    },
    props: {
        project: { 
            type: Object, 
            required: true 
        }
    },
    // --- Use setup function ---
    setup(props) {
        // --- Get uiStore for notifications (General Rule 9) ---
        const uiStore = useUiStore();
        // --- Get Permitting Store instance ---
        const permittingStore = usePermittingStore();

        // --- State for Editing ---
        const isEditing = ref(false);
        const isSaving = ref(false); // For loading state on save
        const formData = reactive({}); // Initialize empty, populated by watcher/edit
        
        // Use a single computed property for the primary permit record
        const permit = computed(() => props.project?.Permitting?.[0] || null);

        // --- Define Dropdown Options (Remove submissionOptions) ---
        // const submissionOptions = [ ... ]; 
         const permitStatusOptions = [
            { value: 'Not Submitted', label: 'Not Submitted' }, 
            { value: 'Projectdox Accepted', label: 'Projectdox Accepted' }, 
            { value: 'In Review', label: 'In Review' }, 
            { value: 'Approved', label: 'Approved' }, 
            { value: 'Problem', label: 'Problem' }
        ];
        const interconnectionStatusOptions = [
             { value: 'Not Submitted', label: 'Not Submitted' }, 
             { value: 'Submitted', label: 'Submitted' }, 
             { value: 'Resubmitted', label: 'Resubmitted' }, 
             { value: 'Approval to Install', label: 'Approval to Install' },
             { value: 'Field Verification', label: 'Field Verification' }, 
             { value: 'Technical Review', label: 'Technical Review' }, 
             { value: 'Upgrades Rqd: Approval', label: 'Upgrades Rqd: Approval' },
             { value: 'Technical Review Completed', label: 'Technical Review Completed' }, 
             { value: 'More Info Rqd', label: 'More Info Rqd' }, 
             { value: 'Incomplete', label: 'Incomplete' }, 
             { value: 'Moved to Revised', label: 'Moved to Revised' }
        ];
         const problemStatusOptions = [
            { value: 'Proceed to Submit', label: 'Proceed to Submit' }, 
            { value: 'Cancelled', label: 'Cancelled' }, 
            { value: 'No Site Survey', label: 'No Site Survey' }, 
            { value: 'No Designs', label: 'No Designs' },
            { value: 'No Bill', label: 'No Bill' }, 
            { value: 'No Relationship Letter', label: 'No Relationship Letter' }, 
            { value: 'Reqd Load Calculator', label: 'Reqd Load Calculator' },
            { value: 'Waiting on Signature', label: 'Waiting on Signature' }, 
            { value: 'Missing Proposal', label: 'Missing Proposal' }, 
            { value: 'Unknown', label: 'Unknown' }
        ];
        const availableTags = [ // Based on old code's select options
            'Canceled Permit', 
            'Waiting for Bill or Relationship Letter', 
            'Completed Contract W/ Updates'
        ];

        // --- Initialize or Reset Form Data (Adjust fields) --- 
        const initializeFormData = () => {
            console.log('PermittingTab: Initializing formData. Current permit.value:', JSON.parse(JSON.stringify(permit.value))); 
            const p = permit.value;
            Object.assign(formData, {
                // Permit_Submitted: p?.Permit_Submitted || 'No', // REMOVE
                Permit_Status: p?.Permit_Status || 'Not Submitted', // ADD BACK
                Permit_Number: p?.Permit_Number || '',
                Permit_Submission_Date: formatDateForInput(p?.Permit_Submission_Date),
                Permit_Approval_Date: formatDateForInput(p?.Permit_Approval_Date),
                // Interconnection_Submitted: p?.Interconnection_Submitted || 'No', // REMOVE
                Interconnection_Status: p?.Interconnection_Status || 'Not Submitted', // ADD BACK
                Interconnection_Number: p?.Interconnection_Number || '',
                Interconnection_Submission_Date: formatDateForInput(p?.Interconnection_Submission_Date),
                Interconnection_Approval_Date: formatDateForInput(p?.Interconnection_Approval_Date),
                Tags: p?.Tags || [],
                Problem: p?.Problem || 'Unknown'
            });
            console.log('PermittingTab: formData initialized:', JSON.parse(JSON.stringify(formData))); 
        };

        // Watch the permit prop and initialize form when it changes (or on initial load)
        watch(permit, initializeFormData, { immediate: true });
        
        // --- Method to format date for display ---
        const formatDateSimple = (dateString) => {
            if (!dateString) return 'N/A';
            try {
                // Attempt to parse date, Zoho might send MM/DD/YYYY or YYYY-MM-DD
                const date = new Date(dateString);
                if (isNaN(date.getTime())) {
                    // Handle potential MM/DD/YYYY format from Zoho
                    const parts = dateString.split('/');
                    if (parts.length === 3) {
                       const year = parseInt(parts[2], 10);
                       const fullYear = year < 70 ? 2000 + year : 1900 + year;
                       const month = parseInt(parts[0], 10) - 1; // Month is 0-indexed
                       const day = parseInt(parts[1], 10);
                       const parsedDate = new Date(fullYear, month, day);
                       if (!isNaN(parsedDate.getTime())) {
                           return parsedDate.toLocaleDateString('en-US', { 
                               month: 'short', day: 'numeric', year: 'numeric' 
                           });
                       } 
                    }
                    throw new Error('Invalid date format'); // Throw if MM/DD/YYYY parsing also failed
                }
                // If parsing was successful initially (e.g., ISO format)
                return date.toLocaleDateString('en-US', { 
                    month: 'short', day: 'numeric', year: 'numeric' 
                });
            } catch (e) {
                console.error("Error formatting date:", dateString, e);
                return 'Invalid Date';
            }
        };

        // --- Status Badge Logic ---
        const getStatusBadgeColor = (status) => {
             // Based on old PermittingTabjs.txt logic
            const statusColors = {
                // Permit Status Colors
                'Not Submitted': 'gray',
                'Projectdox Accepted': 'blue',
                'In Review': 'yellow',
                'Approved': 'green',
                'Problem': 'red',
                
                // Interconnection Status Colors
                'Submitted': 'blue',
                'Resubmitted': 'purple',
                'Approval to Install': 'green',
                'Field Verification': 'yellow',
                'Technical Review': 'indigo',
                'Upgrades Rqd: Approval': 'orange',
                'Technical Review Completed': 'teal',
                'More Info Rqd': 'red',
                'Incomplete': 'red',
                'Moved to Revised': 'gray',
                
                // Submission Status Colors (Yes/No/Unknown)
                'Yes': 'green',
                'No': 'red',
                'I Don\'t Know': 'yellow',
                
                // Problem Status Colors
                'Proceed to Submit': 'green',
                'Cancelled': 'red',
                'No Site Survey': 'yellow',
                'No Designs': 'orange',
                'No Bill': 'red',
                'No Relationship Letter': 'red',
                'Reqd Load Calculator': 'yellow',
                'Waiting on Signature': 'yellow',
                'Missing Proposal': 'red',
                'Unknown': 'gray',
                
                // Fallback
                default: 'gray'
            };
            return statusColors[status] || statusColors.default;
        };
        
        // --- Last Updated Logic (Use Modified_Time) ---
        const lastUpdated = computed(() => permit.value?.Modified_Time);
        // const lastUpdatedPermit = computed(() => permit.value?.Permit_Last_Updated);
        // const lastUpdatedIC = computed(() => permit.value?.IC_Last_Updated);
        
        // --- ADD Computed properties for BaseDescriptionList items ---
        const permitDetailsItems = computed(() => {
            const items = [];
            if (!permit.value) return items;
            items.push({ term: 'Status', description: permit.value.Permit_Status || 'N/A', type: 'badge', color: getStatusBadgeColor(permit.value.Permit_Status) });
            items.push({ term: 'Number', description: permit.value.Permit_Number || 'N/A' });
            items.push({ term: 'Submission Date', description: formatDateSimple(permit.value.Permit_Submission_Date) });
            items.push({ term: 'Approval Date', description: formatDateSimple(permit.value.Permit_Approval_Date) });
            items.push({ term: 'Last Updated', description: formatDateSimple(lastUpdated.value) });
            return items;
        });

        const interconnectionDetailsItems = computed(() => {
            const items = [];
            if (!permit.value) return items;
            items.push({ term: 'Status', description: permit.value.Interconnection_Status || 'N/A', type: 'badge', color: getStatusBadgeColor(permit.value.Interconnection_Status) });
            items.push({ term: 'Number', description: permit.value.Interconnection_Number || 'N/A' });
            items.push({ term: 'Submission Date', description: formatDateSimple(permit.value.Interconnection_Submission_Date) });
            items.push({ term: 'Approval Date', description: formatDateSimple(permit.value.Interconnection_Approval_Date) });
             items.push({ term: 'Last Updated', description: formatDateSimple(lastUpdated.value) }); // Use unified last updated
            return items;
        });

         const additionalInfoItems = computed(() => {
             const items = [];
             if (!permit.value) return items;
             items.push({ term: 'Problem Status', description: permit.value.Problem || 'N/A', type: 'badge', color: getStatusBadgeColor(permit.value.Problem) });
             items.push({ term: 'Tags', description: permit.value.Tags && permit.value.Tags.length > 0 ? permit.value.Tags : ['N/A'], type: 'tags' }); // Pass array for tags
             return items;
         });
        // --- END Computed properties for BaseDescriptionList items ---

        // --- Edit/Save/Cancel Methods ---
        const startEditing = () => {
            console.log('PermittingTab: startEditing called. Current permit.value:', JSON.parse(JSON.stringify(permit.value))); // Log before init
            initializeFormData(); // Ensure form has latest data before editing
            console.log('PermittingTab: startEditing - after initializeFormData. formData:', JSON.parse(JSON.stringify(formData))); // Log after init
            isEditing.value = true;
            console.log('PermittingTab: isEditing set to true'); // Log state change
        };

        const cancelEditing = () => {
            isEditing.value = false;
            // Optionally reset formData if needed, but initializeFormData on edit start handles it
            // initializeFormData(); 
        };
        
        const handleSave = async () => {
            isSaving.value = true;
            // TODO: Call store action (addPermitRecord or updatePermitRecord)
            // Determine if adding or updating
            const existingPermitId = permit.value?.ID;
            const dataToSend = { ...formData }; // Send copy of reactive data

            // Note: Assuming YYYY-MM-DD format is okay for API Date fields
            // If API expects MM/DD/YY, uncomment and use formatDateForAPI
            // const dataToSend = {
            //    ...formData,
            //    Permit_Submission_Date: formatDateForAPI(formData.Permit_Submission_Date),
            //    Permit_Approval_Date: formatDateForAPI(formData.Permit_Approval_Date),
            //    Interconnection_Submission_Date: formatDateForAPI(formData.Interconnection_Submission_Date),
            //    Interconnection_Approval_Date: formatDateForAPI(formData.Interconnection_Approval_Date),
            // };

            console.log(`PermittingTab: Saving data. ${existingPermitId ? 'Updating' : 'Adding'}. Payload basis:`, JSON.parse(JSON.stringify(dataToSend)));
            
            try {
                if (existingPermitId) {
                    await permittingStore.updatePermitRecord({
                        permitId: existingPermitId,
                        permitData: dataToSend
                    });
                } else {
                    await permittingStore.addPermitRecord({
                        projectId: props.project.ID,
                        permitData: dataToSend
                    });
                }
                isEditing.value = false; // Close edit mode on success
            } catch (error) {
                // Error is handled and notified by the store action
                console.error("PermittingTab: Save failed", error);
            }
            isSaving.value = false;
        };
        
        // --- Return values for the template (Adjust options) ---
        return {
            permit,
            isEditing,
            isSaving,
            formData,
            formatDateSimple,
            getStatusBadgeColor,
            lastUpdated,
            startEditing,
            cancelEditing,
            handleSave,
            // --- Expose Options for Dropdowns (Remove submissionOptions) ---
            // submissionOptions,
            permitStatusOptions,
            interconnectionStatusOptions,
            problemStatusOptions,
            availableTags,
            // --- Expose computed lists ---
            permitDetailsItems,
            interconnectionDetailsItems,
            additionalInfoItems
        };
    },
    // --- Update Template with Inputs ---
    template: `
        <div class="space-y-6">
             <!-- Header with Edit/Save/Cancel Buttons -->
             <div class="flex justify-end items-center"><!-- Keep header outside cards -->
                   <!-- Add ml-auto to push button right -->
                   <div class="flex gap-2">
                     <template v-if="isEditing">
                         <base-button @click="cancelEditing" variant="secondary" size="sm" :disabled="isSaving">
                             Cancel
                         </base-button>
                          <base-button @click="handleSave" variant="primary" size="sm" :disabled="isSaving">
                              <span v-if="isSaving"><i class="fas fa-spinner fa-spin mr-1"></i>Saving...</span>
                              <span v-else>Save Changes</span>
                         </base-button>
                     </template>
                     <template v-else>
                        <!-- Show Add or Edit based on permit existence -->
                        <base-button @click="startEditing" variant="secondary" size="sm">
                            <i :class="['mr-2', permit ? 'fas fa-edit' : 'fas fa-plus']"></i>
                            {{ permit ? 'Edit' : 'Add' }}
                        </base-button>
                     </template>
                   </div>
             </div>

            <div v-if="permit || isEditing" class="grid grid-cols-1 md:grid-cols-2 gap-6"><!-- Show grid if editing even if no permit exists -->
                 <!-- Permit Card -->
                 <base-card>
                     <template #header>
                        <h4 class="text-md font-semibold text-gray-900">Permitting</h4>
                     </template>
                      <template #default>
                         <!-- Display Mode: Use BaseDescriptionList -->
                         <base-description-list 
                            v-if="!isEditing"
                            :items="permitDetailsItems"
                            variant="simple"
                            :dividers="false"
                            paddingX="0" 
                            paddingY="1.5"
                         >
                             <template #description="{ item }">
                                 <base-badge v-if="item.type === 'badge'" :color="item.color" size="md">{{ item.description }}</base-badge>
                                 <span v-else class="text-gray-900 font-medium">{{ item.description }}</span>
                            </template>
                          </base-description-list>
                         <!-- Edit Mode -->
                            <div v-else class="space-y-4">
                                 <div>
                                     <base-select-menu 
                                         label="Status"
                                         v-model="formData.Permit_Status"
                                         :options="permitStatusOptions"
                                         placeholder="Select Status..."
                                     />
                                 </div>
                                 <div>
                                     <base-text-input 
                                         label="Number"
                                         v-model="formData.Permit_Number"
                                     />
                                 </div>
                                 <div>
                                     <label class="block text-sm font-medium text-gray-700 mb-1">Submission Date</label>
                                     <input type="date" v-model="formData.Permit_Submission_Date" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"/>
                                 </div>
                                 <div>
                                     <label class="block text-sm font-medium text-gray-700 mb-1">Approval Date</label>
                                     <input type="date" v-model="formData.Permit_Approval_Date" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"/>
                                 </div>
                            </div>
                     </template>
                 </base-card>

                 <!-- Interconnection Card -->
                 <base-card>
                     <template #header>
                         <h4 class="text-md font-semibold text-gray-900">Interconnection</h4>
                     </template>
                      <template #default>
                           <!-- Display Mode: Use BaseDescriptionList -->
                           <base-description-list
                               v-if="!isEditing"
                               :items="interconnectionDetailsItems"
                               variant="simple"
                               :dividers="false"
                               paddingX="0"
                               paddingY="1.5"
                           >
                               <template #description="{ item }">
                                   <base-badge v-if="item.type === 'badge'" :color="item.color" size="md">{{ item.description }}</base-badge>
                                   <span v-else class="text-gray-900 font-medium">{{ item.description }}</span>
                               </template>
                           </base-description-list>
                            <!-- Edit Mode -->
                             <div v-else class="space-y-4">
                                  <div>
                                     <base-select-menu 
                                         label="Status"
                                         v-model="formData.Interconnection_Status"
                                         :options="interconnectionStatusOptions"
                                         placeholder="Select Status..."
                                     />
                                 </div>
                                 <div>
                                     <base-text-input 
                                         label="Number"
                                         v-model="formData.Interconnection_Number"
                                     />
                                 </div>
                                 <div>
                                     <label class="block text-sm font-medium text-gray-700 mb-1">Submission Date</label>
                                     <input type="date" v-model="formData.Interconnection_Submission_Date" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"/>
                                 </div>
                                 <div>
                                     <label class="block text-sm font-medium text-gray-700 mb-1">Approval Date</label>
                                     <input type="date" v-model="formData.Interconnection_Approval_Date" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"/>
                                 </div>
                             </div>
                     </template>
                 </base-card>

                <!-- Additional Info Card -->
                 <base-card class="md:col-span-2">
                    <template #header>
                         <h4 class="text-md font-semibold text-gray-900">Additional Information</h4>
                     </template>
                      <template #default>
                           <!-- Display Mode: Use BaseDescriptionList -->
                           <base-description-list
                                v-if="!isEditing"
                                :items="additionalInfoItems"
                                variant="simple"
                                :dividers="false"
                                paddingX="0"
                                paddingY="1.5"
                           >
                               <template #description="{ item }">
                                   <base-badge v-if="item.type === 'badge'" :color="item.color" size="md">{{ item.description }}</base-badge>
                                   <span v-else-if="item.type === 'tags'" class="flex flex-wrap gap-1">
                                       <base-badge v-for="tag in item.description" :key="tag" color="blue" size="md">{{ tag }}</base-badge>
                                   </span>
                                   <span v-else class="text-gray-900 font-medium">{{ item.description }}</span>
                               </template>
                           </base-description-list>
                           <!-- Edit Mode -->
                            <div v-else class="space-y-4">
                                <div>
                                    <base-select-menu 
                                         label="Problem Status"
                                         v-model="formData.Problem"
                                         :options="problemStatusOptions"
                                         placeholder="Select Status..."
                                     />
                                 </div>
                                 <!-- Tag Editing (Using Checkboxes) -->
                                 <div>
                                     <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                                      <div class="space-y-2"><!-- flex flex-wrap gap-x-4 gap-y-2? -->
                                          <div v-for="tagOption in availableTags" :key="tagOption" class="flex items-center">
                                              <input 
                                                  :id="'tag-' + tagOption.replace(/\s+/g, '')"
                                                  type="checkbox" 
                                                  :value="tagOption" 
                                                  v-model="formData.Tags" 
                                                  class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                               />
                                              <label :for="'tag-' + tagOption.replace(/\s+/g, '')" class="ml-2 block text-sm text-gray-900">{{ tagOption }}</label>
                                          </div>
                                      </div>
                                 </div>
                             </div>
                     </template>
                 </base-card>
            </div>
             <div v-else class="text-center text-gray-500 py-6 border border-dashed border-gray-300 rounded-md">
                 No Permitting or Interconnection information found. Click Edit to add.
             </div>
         </div>
    `
};

export default PermittingTab; 