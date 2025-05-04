// app/components/modal/tabs/commissions/CommissionsTab.js

// --- ADD Vue Composition API imports ---
const { computed, ref, watch, watchEffect } = Vue; 

// --- ADD Pinia Store Imports (Corrected Paths) ---
// Assume commissionsStore will be created at this path
import { useCommissionsStore } from '../../../../store/commissionsStore.js'; 
import { useProjectsStore } from '../../../../store/projectsStore.js';
import { useLookupsStore } from '../../../../store/lookupsStore.js';
import { useUserStore } from '../../../../store/userStore.js';
import { useNotesStore } from '../../../../store/notesStore.js';
import { useUiStore } from '../../../../store/uiStore.js';
import { useModalStore } from '../../../../store/modalStore.js';

// --- ADD Helper Import (Corrected Path) ---
import { formatCurrency } from '../../../../utils/helpers.js'; 

// --- ADD Component Import ---
import SalesRepForm from './SalesRepForm.js';
import CommissionNotesSection from './CommissionNotesSection.js';

// Keep original Options API structure commented out or removed

// --- REPLACE Options API with Composition API ---
const CommissionsTab = {
    // name: 'SalesRepTab', // Keep original name for now if needed elsewhere, or update
    name: 'CommissionsTab', // Use the new intended name
    // --- ADD Component Registration ---
    components: { 
        SalesRepForm, 
        CommissionNotesSection
     },
    props: {
        project: { 
            type: Object, 
            required: true 
        }
    },
    // --- ADD setup function ---
    setup(props) {
        // Inject Stores
        // const commissionsStore = useCommissionsStore(); // Inject once created
        const projectsStore = useProjectsStore();
        const lookupsStore = useLookupsStore();
        const userStore = useUserStore();
        const notesStore = useNotesStore();
        const uiStore = useUiStore();
        const modalStore = useModalStore();

        // --- REMOVE Console Log for Sales Rep Data ---
        // watchEffect(() => {
        //     console.log("CommissionsTab: Received project prop data:", props.project);
        // });
        // ------------------------------------------

        // Computed Properties (from Options API computed)
        const salesRep = computed(() => props.project?.Sales_Rep);
        const salesOrg = computed(() => props.project?.Sales_Org);

        // Methods (from Options API methods - keep local or use helpers)
        const formatDateSimple = (dateString) => {
             if (!dateString) return 'N/A';
             try {
                 // Ensure dateString is treated correctly (might need timezone offset adjust if needed)
                 const date = new Date(dateString);
                 // Check for invalid date after parsing
                 if (isNaN(date.getTime())) {
                     console.warn(`formatDateSimple received invalid date string: ${dateString}`);
                     return 'Invalid Date';
                 }
                 // Use UTC methods to avoid timezone shifts IF the input string is potentially ambiguous
                 // For display, toLocaleDateString is generally fine if input is consistent (like ISO)
                 return date.toLocaleDateString('en-US', { 
                     month: 'short', day: 'numeric', year: 'numeric' 
                 });
             } catch (e) {
                 console.error(`Error formatting date: ${dateString}`, e);
                 return 'Invalid Date';
             }
         };

        const getStatusClass = (status) => {
             // Basic status styling
             status = status?.toLowerCase();
             if (status === 'paid') return 'bg-green-100 text-green-800';
             if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
             // Keep 'released' styling in case data contains it, though we aren't editing it
             if (status === 'released') return 'bg-blue-100 text-blue-800'; 
             return 'bg-gray-100 text-gray-700';
         };

        // --- MOVE Milestone Editing State Definition EARLIER --- 
        const milestones = ref([]); // Will be populated by watcher
        const originalMilestonesRef = ref([]); 
        const isMilestonesChanged = ref(false);
        const isMilestonesUpdating = ref(false);
        const isEditingMilestones = ref(false); // <-- Define BEFORE watcher
        // Example: Local state for rep selection
        const selectedSalesRepId = ref(props.project?.Sales_Rep?.ID || null);
        const isRepSaving = ref(false); // For save button loading state
        // Example: Local state for rate selection
        const activeCommissionRate = ref(props.project?.Active_Commission_Rate || '');
        const isRateChanged = ref(false);
        const isRateSaving = ref(false);
        // --- ADD State for Inline Rep Editing ---
        const isEditingRepDetails = ref(false);
        const isSavingRepDetails = ref(false); // Loading state for inline save
        const editedSalesRepData = ref({
            Commercial_Commission_Rate: '',
            Regular_Commission_Rate: '',
            Email: '',
            Name: { first_name: '', last_name: '' },
            Phone: '',
            Shared_Commission_Rate: ''
        });
        
        // Computed prop to get the selected Sales Rep object (for modal)
        const selectedRepObject = computed(() => {
           if (!selectedSalesRepId.value) return null;
           return lookupsStore.salesReps?.find(rep => rep.id === selectedSalesRepId.value) || null;
        });

        // --- Watchers (for syncing local state with props) ---
        watch(() => props.project?.Sales_Rep?.ID, (newVal) => {
            if (selectedSalesRepId.value !== newVal) {
                selectedSalesRepId.value = newVal || null;
            }
        });
         watch(() => props.project?.Active_Commission_Rate, (newVal) => {
             const currentPropRate = newVal || '';
             if (activeCommissionRate.value !== currentPropRate) {
                 activeCommissionRate.value = currentPropRate;
                 isRateChanged.value = false; // Reset changed flag when prop updates externally
             }
         });
         // Watch project milestones/advance fields to update local editable state
         watch(() => [
                props.project?.M1_Amount, props.project?.M1_Status, props.project?.M1_Paid_Date,
                props.project?.M2_Amount, props.project?.M2_Status, props.project?.M2_Paid_Date,
                props.project?.M3_Amount, props.project?.M3_Status, props.project?.M3_Paid_Date,
                props.project?.Total_Commission_Advance, props.project?.Commission_Advance_Status, props.project?.Comm_Advance_Paid_Date
            ], (newValues, oldValues) => { // <-- Add oldValues parameter if needed for direct comparison
                // --- Initialize/Update local milestones ref ---
                const newMilestoneData = [
                    { id: 'advance', amount: props.project?.Total_Commission_Advance || '', status: props.project?.Commission_Advance_Status || 'Pending', paidDate: props.project?.Comm_Advance_Paid_Date || null },
                    { id: 'M1', amount: props.project?.M1_Amount || '', status: props.project?.M1_Status || 'Pending', paidDate: props.project?.M1_Paid_Date || null },
                    { id: 'M2', amount: props.project?.M2_Amount || '', status: props.project?.M2_Status || 'Pending', paidDate: props.project?.M2_Paid_Date || null },
                    { id: 'M3', amount: props.project?.M3_Amount || '', status: props.project?.M3_Status || 'Pending', paidDate: props.project?.M3_Paid_Date || null }
                ];
                
                // Only update if not currently editing to avoid overwriting user input
                if (!isEditingMilestones.value) {
                    milestones.value = newMilestoneData;
                    isMilestonesChanged.value = false; 
                }
                // If editing, the watcher still runs, but we don't overwrite 'milestones.value'
                // 'isMilestonesChanged' might need recalculation if external prop changes while editing
                // For simplicity now, we assume external changes won't happen *while* editing this specific section.
            }, 
            { deep: true, immediate: true } // Immediate: run once on setup to initialize
        );

        // --- ADD Watcher for local milestone changes during edit mode ---
        watch(milestones, (newMilestonesValue) => {
            // Only compare if we are actually in edit mode
            if (isEditingMilestones.value) {
                const changed = JSON.stringify(newMilestonesValue) !== JSON.stringify(originalMilestonesRef.value);
                if (isMilestonesChanged.value !== changed) { // Only update if the flag needs changing
                     isMilestonesChanged.value = changed;
                     console.log(`Milestone change detected via watcher. isMilestonesChanged set to: ${changed}`);
                }
            }
            // Don't compare or set flag if not editing (avoids issues with prop updates)
        }, { deep: true }); // Deep watch needed for array of objects

        // --- Methods for future steps (placeholders matching build plan) ---
        const handleSalesRepChange = (newId) => {
            selectedSalesRepId.value = newId;
            // Save button logic will depend on computed property checking against original project prop
        };
        const saveSalesRepChange = async () => { 
            isRepSaving.value = true;
            try {
                const currentRepId = props.project?.Sales_Rep?.ID || null;
                if (selectedSalesRepId.value !== currentRepId) {
                    const oldRep = lookupsStore.salesReps?.find(r => r.id === currentRepId);
                    const newRep = lookupsStore.salesReps?.find(r => r.id === selectedSalesRepId.value);
                    await projectsStore.updateProjectSalesRep({
                        projectId: props.project.ID,
                        newSalesRepId: selectedSalesRepId.value,
                        oldSalesRepName: oldRep?.name || 'None',
                        newSalesRepName: newRep?.name || 'None'
                    });
                    // Refresh handled by store action
                }
            } catch (error) { /* Error handled by store */ } 
            finally { isRepSaving.value = false; }
        };

        const handleRateChange = (newRate) => {
            activeCommissionRate.value = newRate;
            isRateChanged.value = (newRate !== (props.project?.Active_Commission_Rate || ''));
        };
        const saveRateChange = async () => { 
            isRateSaving.value = true;
            // --- GET commissionsStore instance ---
            const commissionsStore = useCommissionsStore(); 
            try {
                // --- UNCOMMENT and use commissionsStore action ---
                await commissionsStore.updateProjectActiveRate({ 
                    projectId: props.project.ID,
                    newRateType: activeCommissionRate.value,
                    oldRateType: props.project?.Active_Commission_Rate || ''
                });
                // console.warn("Commissions Store Action `updateProjectActiveRate` not yet implemented");
                // uiStore.addNotification({ type: 'warning', message: 'Save Active Rate functionality not implemented yet.' });
                // Manually reset changed flag for now
                isRateChanged.value = false;
                // Refresh handled by store action later
            } catch (error) { /* Error handled by store */ } 
            finally { isRateSaving.value = false; }
         };

        const handleMilestoneAmountChange = (milestoneId, value) => { 
            const index = milestones.value.findIndex(m => m.id === milestoneId);
            if (index !== -1) {
                milestones.value[index].amount = value; 
                // Watcher will now handle setting isMilestonesChanged
                // isMilestonesChanged.value = JSON.stringify(milestones.value) !== JSON.stringify(originalMilestonesRef.value);
            }
         };
         const handleMilestoneStatusChange = (milestoneId, value) => { 
            const index = milestones.value.findIndex(m => m.id === milestoneId);
            if (index !== -1) {
                 const paidDate = value === 'Paid' ? new Date() : null; 
                 milestones.value[index].status = value;
                 milestones.value[index].paidDate = paidDate; 
                 // Watcher will now handle setting isMilestonesChanged
                 // isMilestonesChanged.value = JSON.stringify(milestones.value) !== JSON.stringify(originalMilestonesRef.value);
            }
        };
        const saveMilestoneChanges = async () => { 
            isMilestonesUpdating.value = true;
            // --- Get commissionsStore instance ---
            const commissionsStore = useCommissionsStore(); 
            try {
                // Pass the original data captured when editing started
                await commissionsStore.updateProjectMilestones({ 
                    projectId: props.project.ID,
                    updatedMilestonesData: milestones.value, // Pass local state
                    originalMilestonesData: originalMilestonesRef.value // Pass captured original state
                });
                
                // On successful save, exit edit mode and potentially update original ref?
                // Store action should refresh data, which watcher will pick up.
                isEditingMilestones.value = false; 
                isMilestonesChanged.value = false; // Reset changed flag after successful save

                // No longer need manual warning/reset
                // console.warn("Commissions Store Action `updateProjectMilestones` not yet implemented");
                // uiStore.addNotification({ type: 'warning', message: 'Save Milestones functionality not implemented yet.' });
                // isMilestonesChanged.value = false; // Removed manual reset here

            } catch (error) { 
                /* Error handled by store's notification */ 
                console.error("CommissionsTab: saveMilestoneChanges caught error:", error);
            } 
            finally { isMilestonesUpdating.value = false; }
        };

        // --- ADD Methods for Inline Rep Editing ---
        const startEditingRepDetails = () => {
            // const currentRep = lookupsStore.salesReps?.find(r => r.id === selectedSalesRepId.value);
            // Use data directly from the project prop's Sales_Rep object
            const currentRepData = props.project?.Sales_Rep;
            if (!currentRepData) { // Check if the Sales_Rep object exists on the project
                uiStore.addNotification({ type: 'error', message: 'Could not find current Sales Rep data on project to edit.'});
                return;
            }
            // Populate local form state using direct project prop data
            editedSalesRepData.value = {
                // Read rates directly from the project prop lookup
                Commercial_Commission_Rate: parseFloat(props.project['Sales_Rep.Commercial_Commission_Rate']) || 0,
                Regular_Commission_Rate: parseFloat(props.project['Sales_Rep.Regular_Commission_Rate']) || 0,
                Shared_Commission_Rate: parseFloat(props.project['Sales_Rep.Shared_Commission_Rate']) || 0,
                Email: props.project['Sales_Rep.Email'] || '',
                Name: {
                    // Use bracket notation for flattened field names
                    first_name: currentRepData['Name.first_name'] || '', 
                    last_name: currentRepData['Name.last_name'] || ''  
                },
                Phone: props.project['Sales_Rep.Phone'] || ''
                // Shared_Commission_Rate: currentRep.sharedCommissionRate || '' // Old way
            };
            isEditingRepDetails.value = true;
        };

        const cancelEditingRepDetails = () => {
            isEditingRepDetails.value = false;
            // Optionally reset editedSalesRepData if needed
        };

        const saveRepDetails = async () => {
            const currentRepId = selectedSalesRepId.value;
            if (!currentRepId) {
                uiStore.addNotification({ type: 'error', message: 'Cannot save: Sales Rep ID is missing.' });
                return;
            }
            isSavingRepDetails.value = true;
            const commissionsStore = useCommissionsStore(); // Get store instance
            try {
                 await commissionsStore.updateSalesRepDetails({
                    salesRepId: currentRepId,
                    updatedData: { ...editedSalesRepData.value }, // Send copy of local state
                    originalRepName: lookupsStore.salesReps?.find(r => r.id === currentRepId)?.name || 'Unknown'
                });
                isEditingRepDetails.value = false; // Close edit form on success
            } catch (error) { 
                // Error notification handled by store 
                console.error("CommissionsTab: saveRepDetails failed", error);
            } finally {
                isSavingRepDetails.value = false;
            }
        };

        // --- MOVE selectedRateValue definition earlier ---
        const selectedRateValue = computed(() => {
            // Get rate directly from project prop based on selected type
            if (!activeCommissionRate.value) return null;

            switch(activeCommissionRate.value) {
                case 'Regular Commission Rate':
                    return parseFloat(props.project['Sales_Rep.Regular_Commission_Rate']) || 0;
                case 'Commercial Commission Rate':
                    return parseFloat(props.project['Sales_Rep.Commercial_Commission_Rate']) || 0;
                case 'Shared Commission Rate':
                    return parseFloat(props.project['Sales_Rep.Shared_Commission_Rate']) || 0;
                default:
                    return null;
            }
        });

        // --- Calculated M3 Amount (implementing Step 6 logic) ---
        const calculatedM3Amount = computed(() => {
            try {
                 const systemSize = parseFloat(props.project?.kW_STC) || 0;
                 if (systemSize === 0) return 0;
                 
                 // Use rates directly from project prop
                 const rateType = activeCommissionRate.value; 
                 let ratePercent = 0;
                 if (rateType === 'Regular Commission Rate') ratePercent = parseFloat(props.project['Sales_Rep.Regular_Commission_Rate']) || 0;
                 else if (rateType === 'Commercial Commission Rate') ratePercent = parseFloat(props.project['Sales_Rep.Commercial_Commission_Rate']) || 0;
                 else if (rateType === 'Shared Commission Rate') ratePercent = parseFloat(props.project['Sales_Rep.Shared_Commission_Rate']) || 0;
                 
                 if (ratePercent === 0) return 0; // No applicable rate found

                 const grossCommission = systemSize * 1000 * (ratePercent / 100); // Calculate rate value
                 
                 // Use local milestones ref for deductions, as it reflects pending edits
                 const m1Amount = milestones.value[1]?.status === 'Paid' ? (parseFloat(milestones.value[1]?.amount) || 0) : 0;
                 const m2Amount = milestones.value[2]?.status === 'Paid' ? (parseFloat(milestones.value[2]?.amount) || 0) : 0;
                 const advanceAmount = milestones.value[0]?.status === 'Paid' ? (parseFloat(milestones.value[0]?.amount) || 0) : 0;

                 const finalCommission = grossCommission - m1Amount - m2Amount - advanceAmount;
                 
                 return finalCommission; // Return calculated value
            } catch (e) {
                 console.error("Error calculating M3 amount:", e);
                 return 0; // Fallback on error
            }
        });

        // --- ADD Computed properties for displaying rates in Sales Rep card ---
        const displayRegularRate = computed(() => {
            return parseFloat(props.project?.['Sales_Rep.Regular_Commission_Rate']) || 0;
        });
        const displayCommercialRate = computed(() => {
            return parseFloat(props.project?.['Sales_Rep.Commercial_Commission_Rate']) || 0;
        });
        const displaySharedRate = computed(() => {
            return parseFloat(props.project?.['Sales_Rep.Shared_Commission_Rate']) || 0;
        });
        // --- END ADD ---

        // --- ADD Computed properties for displaying Email and Phone ---
        const displayEmail = computed(() => {
            return props.project?.['Sales_Rep.Email'] || '';
        });
        const displayPhone = computed(() => {
            return props.project?.['Sales_Rep.Phone'] || '';
        });
        // --- END ADD ---

        // Computed flags for button visibility/disabled states
        const showSaveRepButton = computed(() => {
             const currentRepId = props.project?.Sales_Rep?.ID || null;
             return selectedSalesRepId.value !== currentRepId && selectedSalesRepId.value !== null;
        });
         const showSaveRateButton = computed(() => isRateChanged.value);
         const showSaveMilestonesButton = computed(() => isMilestonesChanged.value);

        // --- ADD Computed Properties for Net Totals ---
        const netPendingCommission = computed(() => {
            return milestones.value.reduce((total, m) => {
                return total + (m.status === 'Pending' && m.amount ? parseFloat(m.amount) : 0);
            }, 0);
        });
        const netPaidCommission = computed(() => {
            return milestones.value.reduce((total, m) => {
                return total + (m.status === 'Paid' && m.amount ? parseFloat(m.amount) : 0);
            }, 0);
        });
        // --- END ADD ---

        // --- NEW: Function to start editing ---
        const startEditingMilestonesFunc = () => {
            // Deep copy current milestone state to originalMilestonesRef
            originalMilestonesRef.value = JSON.parse(JSON.stringify(milestones.value));
            isEditingMilestones.value = true;
            isMilestonesChanged.value = false; // Reset changed flag when starting edit
            console.log("Started editing milestones. Original data captured:", originalMilestonesRef.value);
        };

        // --- UPDATED: Function to reset/cancel edits ---
        const resetMilestoneEdits = () => {
             // Reset local milestones back to the captured original state
             milestones.value = JSON.parse(JSON.stringify(originalMilestonesRef.value));
             isMilestonesChanged.value = false;
             isEditingMilestones.value = false; // Exit edit mode on cancel
             console.log('Milestone edits cancelled/reset.');
        };

        // --- ADD Commission Notes Computed for Child ---
        const commissionNotes = computed(() => props.project?.Commission_Notes || []);
        // --- END ADD ---

        // Return everything needed by the template
        return {
            // Props Proxy (can access props.project directly in template too)
            project: props.project,

            // Computed Props
            salesRep,
            salesOrg,
            calculatedM3Amount, 
            selectedRepObject, // For passing to modal

            // Local State Refs 
            milestones, // Use this in the template for display/editing
            isMilestonesChanged,
            isMilestonesUpdating,
            selectedSalesRepId, 
            isRepSaving,
            activeCommissionRate,
            isRateChanged,
            isRateSaving,
            
            // ADD Inline Edit State/Methods
            isEditingRepDetails,
            isSavingRepDetails,
            editedSalesRepData,
            startEditingRepDetails,
            cancelEditingRepDetails,
            saveRepDetails,
            
            // Computed Flags for UI
            showSaveRepButton,
            showSaveRateButton,
            showSaveMilestonesButton,

            // --- ADD Net Total Computeds ---
            netPendingCommission,
            netPaidCommission,
            // --- END ADD ---

            // --- ADD Milestone Editing State/Methods to return block ---
            isEditingMilestones,
            resetMilestoneEdits,
            startEditingMilestonesFunc, // Expose the start editing function

            // Methods
            formatCurrency, // Use helper imported
            formatDateSimple,
            getStatusClass,

            // Methods for interactions
            handleSalesRepChange, // For BaseSelectMenu model update
            saveSalesRepChange,
            handleRateChange, // For BaseSelectMenu model update
            saveRateChange,
            handleMilestoneAmountChange, // For BaseTextInput model update
            handleMilestoneStatusChange, // For BaseSelectMenu model update
            saveMilestoneChanges,
            
            // --- ADD selectedRateValue --- 
            selectedRateValue,
            
            // --- ADD Computed Display Rates ---
            displayRegularRate,
            displayCommercialRate,
            displaySharedRate,
            // --- ADD Computed Display Email/Phone ---
            displayEmail,
            displayPhone,
            
            // Expose stores if directly needed in template (usually prefer computed/methods)
            lookupsStore, // Needed for sales rep options
            userStore, // Expose userStore for passing currentUser to notes

            // --- ADD Commission Notes Computed for Child ---
            commissionNotes,
            // --- END ADD ---

            // --- ADD Helper to return block ---
            // formatDateForInput,
            // handleDateChange,
        };
    },
    // Template remains largely the same, just update bindings
    // to use values returned from setup() and helpers/computed props.
    // Add v-model and @update:modelValue for inputs/selects.
    // Add @click handlers for buttons.
    // Add conditional rendering for save buttons.
    template: `
        <div class="commissions-tab-content grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Column: Sales Rep & Org Info -->
            <div class="lg:col-span-1 space-y-6">
                <!-- Sales Rep Card -->
                <base-card>
                  <template #header>
                      <div class="flex items-center justify-between">
                          <h3 class="text-lg font-medium text-gray-900">Sales Rep</h3>
                          <!-- Edit Rep Button (Only show when NOT editing) -->
                          <base-button v-if="!isEditingRepDetails" @click="startEditingRepDetails" size="xs" variant="secondary">Edit Details</base-button>
                      </div>
                  </template>
                  <template #default>
                      <!-- Read-Only View -->
                      <div v-if="!isEditingRepDetails" class="space-y-3">
                          <base-select-menu
                              label="Assigned Rep"
                              :modelValue="selectedSalesRepId"
                              @update:modelValue="handleSalesRepChange"
                              :options="lookupsStore.salesRepsForAssignmentFilter" 
                              option-value-key="value"
                              option-label-key="label"
                              placeholder="Select Sales Rep"
                              :disabled="isRepSaving" 
                          />
                          <!-- Display contact info based on selectedRepObject or project prop -->
                          <div v-if="selectedRepObject || salesRep" class="text-sm text-gray-600 space-y-1 mt-2 pl-2 border-l-2 border-gray-100">
                              <p v-if="displayEmail"><i class="fas fa-envelope w-4 mr-1 text-gray-400"></i> {{ displayEmail }}</p>
                              <p v-if="displayPhone"><i class="fas fa-phone w-4 mr-1 text-gray-400"></i> {{ displayPhone }}</p>
                               <!-- Display Rates (Read Only) - USE COMPUTED PROPERTIES -->
                               <p class="mt-2 pt-2 border-t text-xs">Reg Rate: <span class="font-medium">{{ displayRegularRate }}%</span></p>
                               <p class="text-xs">Com Rate: <span class="font-medium">{{ displayCommercialRate }}%</span></p>
                               <p class="text-xs">Shr Rate: <span class="font-medium">{{ displaySharedRate }}%</span></p>
                          </div>
                          <div v-else-if="!selectedSalesRepId && !salesRep" class="text-sm text-gray-500 italic">No Sales Rep assigned.</div>
                          
                          <div v-if="showSaveRepButton" class="mt-3 text-right">
                             <base-button @click="saveSalesRepChange" :loading="isRepSaving" size="sm">Save Rep Assignment</base-button>
                            </div>
                      </div>
                      
                      <!-- Inline Edit Form View -->
                       <form v-else @submit.prevent="saveRepDetails" class="space-y-3">
                            <!-- First Name -->
                            <base-text-input 
                                label="First Name" 
                                v-model="editedSalesRepData.Name.first_name" 
                                :attrs="{ id: 'inline-rep-first-name' }"
                                required
                                :disabled="isSavingRepDetails"
                            />
                            <!-- Last Name -->
                            <base-text-input 
                                label="Last Name" 
                                v-model="editedSalesRepData.Name.last_name" 
                                :attrs="{ id: 'inline-rep-last-name' }"
                                required
                                :disabled="isSavingRepDetails"
                            />
                            <!-- Email -->
                             <base-text-input 
                                label="Email" 
                                type="email"
                                v-model="editedSalesRepData.Email" 
                                :attrs="{ id: 'inline-rep-email' }"
                                :disabled="isSavingRepDetails"
                            />
                            <!-- Phone -->
                             <base-text-input 
                                label="Phone" 
                                type="tel"
                                v-model="editedSalesRepData.Phone" 
                                 :attrs="{ id: 'inline-rep-phone' }"
                                 :disabled="isSavingRepDetails"
                            />
                            <!-- Regular Rate -->
                            <base-text-input 
                                label="Regular Rate (%)" 
                                type="number"
                                v-model="editedSalesRepData.Regular_Commission_Rate" 
                                 :attrs="{ id: 'inline-rep-reg-rate', step: '0.01', min: '0' }"
                                 :disabled="isSavingRepDetails"
                            />
                            <!-- Commercial Rate -->
                            <base-text-input 
                                label="Commercial Rate (%)" 
                                type="number"
                                v-model="editedSalesRepData.Commercial_Commission_Rate" 
                                :attrs="{ id: 'inline-rep-com-rate', step: '0.01', min: '0' }"
                                :disabled="isSavingRepDetails"
                            />
                            <!-- Shared Rate -->
                             <base-text-input 
                                label="Shared Rate (%)" 
                                type="number"
                                v-model="editedSalesRepData.Shared_Commission_Rate" 
                                :attrs="{ id: 'inline-rep-shared-rate', step: '0.01', min: '0' }"
                                :disabled="isSavingRepDetails"
                            />
                            <!-- Save/Cancel Buttons -->
                             <div class="flex justify-end space-x-2 pt-3 border-t border-gray-200">
                                <base-button type="button" variant="secondary" @click="cancelEditingRepDetails" :disabled="isSavingRepDetails" size="sm">Cancel</base-button>
                                <base-button type="submit" variant="primary" :loading="isSavingRepDetails" size="sm">Save Details</base-button>
                            </div>
                       </form>
                  </template>
                </base-card>
                
                <!-- Sales Org Card -->
                 <base-card>
                    <template #header>
                        <h3 class="text-lg font-medium text-gray-900">Sales Organization</h3>
                    </template>
                    <template #default>
                         <div v-if="salesOrg">
                             <p class="text-md font-semibold">{{ salesOrg.zc_display_value || 'N/A' }}</p>
                         </div>
                         <div v-else class="text-sm text-gray-500 italic">No Sales Org assigned.</div>
                    </template>
                 </base-card>
            </div>

            <!-- Right Column: Commission Info -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Commission Rate Card -->
                 <base-card>
                    <template #header>
                       <h3 class="text-lg font-medium text-gray-900">Active Commission Rate</h3>
                    </template>
                     <template #default>
                        <div class="flex items-center gap-4 mb-2">
                           <base-select-menu
                                class="flex-grow"
                                :modelValue="activeCommissionRate"
                                @update:modelValue="handleRateChange"
                                :options="['Regular Commission Rate', 'Commercial Commission Rate', 'Shared Commission Rate']"
                                placeholder="Select Rate Type"
                                :disabled="isRateSaving || isSavingRepDetails" 
                           />
                           <base-button v-if="showSaveRateButton" @click="saveRateChange" :loading="isRateSaving" size="sm">Save Rate</base-button>
                        </div>
                        <!-- Add warning/info about the selected rate value here -->
                        <div v-if="activeCommissionRate" class="text-sm pl-1 pt-1 text-gray-600">
                            <span v-if="selectedRateValue !== null">
                                Selected Rate: <strong class="text-gray-800">{{ selectedRateValue }}%</strong>
                            </span>
                            <span v-else class="text-red-600 italic">
                                Warning: Rate value not set for this Sales Rep.
                            </span>
                        </div>
                        <div v-else class="text-sm pl-1 pt-1 text-gray-500 italic">
                            Select a rate type above.
                        </div>
                     </template>
                 </base-card>

                 <!-- Milestones Card -->
                 <base-card>
                    <template #header>
                       <div class="flex justify-between items-center mb-1">
                           <h3 class="text-lg font-medium text-gray-900">Commission Milestones</h3>
                           <!-- Use startEditingMilestonesFunc for Edit button -->
                           <base-button 
                               v-if="!isEditingMilestones" 
                               @click="startEditingMilestonesFunc" 
                               size="xs" 
                               variant="secondary"
                           >Edit</base-button>
                           <!-- Use resetMilestoneEdits for Cancel button -->
                           <base-button 
                               v-if="isEditingMilestones" 
                               @click="resetMilestoneEdits" 
                               size="xs" 
                               variant="secondary"
                               :disabled="isMilestonesUpdating"
                           >Cancel</base-button>
                       </div>
                    </template>
                     <template #default>
                        <div class="space-y-4">
                           <!-- Loop through milestones -->
                           <div v-for="(milestone, index) in milestones" :key="milestone.id">
                               <!-- M3 - SIMPLIFIED ROW -->
                               <div v-if="milestone.id === 'M3'" class="grid grid-cols-3 items-center gap-4 text-sm border-b pb-2">
                                   <!-- M3 Label & Date -->
                                   <div class="flex flex-col">
                                       <span class="font-medium text-gray-700">M3</span>
                                        <!-- ADD M3 Date Editing Logic -->
                                       <div v-if="milestone.status === 'Paid'" class="flex items-center gap-1 mt-0.5">
                                            <template v-if="isEditingMilestones">
                                                <VueDatePicker 
                                                   v-model="milestones[index].paidDate" 
                                                   :enable-time-picker="false" 
                                                   format="MM/dd/yyyy" 
                                                   :clearable="true" 
                                                   :auto-apply="true" 
                                                   placeholder="Select Date" 
                                                   input-class-name="dp-custom-input dp-custom-input-sm" 
                                                   :disabled="isMilestonesUpdating"
                                                   month-name-format="short" 
                                                   :teleport="true"
                                                />
                                            </template>
                                            <template v-else>
                                                <span class="text-[10px] text-gray-500 leading-tight">Paid {{ formatDateSimple(milestone.paidDate) }}</span>
                                            </template>
                                        </div>
                                        <div v-else class="h-5">&nbsp;</div> 
                                   </div>
                                   <!-- M3 Amount Display/Input -->
                                   <div class="flex justify-end">
                                       <div class="relative">
                                           <base-text-input 
                                                :modelValue="milestone.amount" 
                                                @update:modelValue="val => handleMilestoneAmountChange(milestone.id, val)" 
                                                type="number" 
                                                placeholder="0.00" 
                                                :inputClass="['pl-6 pr-2', isEditingMilestones ? '' : 'bg-gray-50 border-gray-100']" 
                                                class="w-24 text-right text-sm" 
                                                :attrs="{ step: '0.01', 'aria-label': 'M3 Amount' }" 
                                                :disabled="!isEditingMilestones || isMilestonesUpdating"/>
                                           <span v-if="isEditingMilestones" class="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-500 pointer-events-none">$</span>
                                           <span v-else class="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-500">$</span>
                                       </div>
                                   </div>
                                   <!-- M3 Status -->
                                   <div class="flex items-center justify-end gap-1">
                                       <base-select-menu 
                                            :modelValue="milestone.status" 
                                            @update:modelValue="val => handleMilestoneStatusChange(milestone.id, val)" 
                                            :options="['Pending', 'Paid']" 
                                            class="w-auto" 
                                            :attrs="{ 'aria-label': 'M3 Status' }" 
                                            :disabled="!isEditingMilestones || isMilestonesUpdating"/>
                                   </div>
                               </div>
                               <!-- Advance -->
                               <div v-else-if="milestone.id === 'advance'" class="grid grid-cols-3 items-center gap-4 text-sm border-b pb-2">
                                   <!-- Advance Label & Date -->
                                   <div class="flex flex-col">
                                       <span class="font-medium text-gray-700">Advance</span>
                                       <div v-if="milestone.status === 'Paid'" class="flex items-center gap-1 mt-0.5">
                                           <template v-if="isEditingMilestones">
                                               <!-- Replace input with VueDatePicker -->
                                               <VueDatePicker 
                                                  v-model="milestones[index].paidDate" 
                                                  :enable-time-picker="false" 
                                                  format="MM/dd/yyyy" 
                                                  :clearable="true" 
                                                  :auto-apply="true" 
                                                  placeholder="Select Date" 
                                                  input-class-name="dp-custom-input dp-custom-input-sm" 
                                                  :disabled="isMilestonesUpdating"
                                                  month-name-format="short" 
                                                  :teleport="true"
                                               />
                                           </template>
                                           <template v-else>
                                               <span class="text-[10px] text-gray-500 leading-tight">Paid {{ formatDateSimple(milestone.paidDate) }}</span>
                                           </template>
                                       </div>
                                       <div v-else class="h-5">&nbsp;</div>
                                   </div>
                                   <!-- Advance Amount Display/Input -->
                                    <div class="flex justify-end">
                                       <div class="relative">
                                            <base-text-input 
                                                :modelValue="milestone.amount" 
                                                @update:modelValue="val => handleMilestoneAmountChange(milestone.id, val)" 
                                                type="number" 
                                                placeholder="0.00" 
                                                :inputClass="['pl-6 pr-2', isEditingMilestones ? '' : 'bg-gray-50 border-gray-100']" 
                                                class="w-24 text-right text-sm" 
                                                :attrs="{ step: '0.01', 'aria-label': milestone.id + ' Amount' }" 
                                                :disabled="!isEditingMilestones || isMilestonesUpdating"/>
                                            <span v-if="isEditingMilestones" class="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-500 pointer-events-none">$</span>
                                            <span v-else class="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-500">$</span>
                                        </div>
                                    </div>
                                   <!-- Advance Status -->
                                    <div class="flex items-center justify-end gap-1">
                                       <base-select-menu 
                                            :modelValue="milestone.status" 
                                            @update:modelValue="val => handleMilestoneStatusChange(milestone.id, val)" 
                                            :options="['Pending', 'Paid']" 
                                            class="w-auto" 
                                            :attrs="{ 'aria-label': milestone.id + ' Status' }" 
                                            :disabled="!isEditingMilestones || isMilestonesUpdating"/>
                                    </div>
                               </div>
                               <!-- M1/M2 -->
                               <div v-else class="grid grid-cols-3 items-center gap-4 text-sm border-b pb-2">
                                   <!-- Label & Date -->
                                   <div class="flex flex-col">
                                       <span class="font-medium text-gray-700">{{ milestone.id }}</span>
                                       <div v-if="milestone.status === 'Paid'" class="flex items-center gap-1 mt-0.5">
                                           <template v-if="isEditingMilestones">
                                                <!-- Replace input with VueDatePicker -->
                                               <VueDatePicker 
                                                  v-model="milestones[index].paidDate" 
                                                  :enable-time-picker="false" 
                                                  format="MM/dd/yyyy" 
                                                  :clearable="true" 
                                                  :auto-apply="true" 
                                                  placeholder="Select Date" 
                                                  input-class-name="dp-custom-input dp-custom-input-sm" 
                                                  :disabled="isMilestonesUpdating"
                                                  month-name-format="short" 
                                                  :teleport="true"
                                               />
                                           </template>
                                           <template v-else>
                                               <span class="text-[10px] text-gray-500 leading-tight">Paid {{ formatDateSimple(milestone.paidDate) }}</span>
                                           </template>
                                       </div>
                                       <div v-else class="h-5">&nbsp;</div> <!-- Placeholder for spacing when not paid -->
                                   </div>
                                   <!-- Amount Display/Input (Apply alignment to PARENT) -->
                                   <div class="flex justify-end">
                                       <div class="relative">
                                            <base-text-input 
                                               :modelValue="milestone.amount"
                                               @update:modelValue="val => handleMilestoneAmountChange(milestone.id, val)"
                                               type="number" 
                                               placeholder="0.00" 
                                               :inputClass="['pl-6 pr-2', isEditingMilestones ? '' : 'bg-gray-50 border-gray-100']"
                                               class="w-24 text-right text-sm"
                                               :attrs="{ step: '0.01', 'aria-label': milestone.id + ' Amount' }"
                                               :disabled="!isEditingMilestones || isMilestonesUpdating"
                                            />
                                            <span v-if="isEditingMilestones" class="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-500 pointer-events-none">$</span>
                                            <span v-else class="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-500">$</span>
                                       </div>
                                   </div>
                                   <!-- Status -->
                                   <div class="flex items-center justify-end gap-1">
                                       <base-select-menu 
                                           :modelValue="milestone.status"
                                           @update:modelValue="val => handleMilestoneStatusChange(milestone.id, val)"
                                           :options="['Pending', 'Paid']" 
                                           class="w-auto"
                                           :attrs="{ 'aria-label': milestone.id + ' Status' }"
                                           :disabled="!isEditingMilestones || isMilestonesUpdating"
                                       />
                                   </div>
                               </div>
                           </div> <!-- End v-for loop -->
                        </div>
                        <!-- Save Button: Condition updated -->
                        <div v-if="isEditingMilestones && showSaveMilestonesButton" class="mt-4 text-right">
                             <base-button @click="saveMilestoneChanges" :loading="isMilestonesUpdating" size="sm">Save Milestones</base-button>
                        </div>
                     </template>
                 </base-card>

                 <!-- Add Custom Styling for Smaller Datepicker -->
                 <style>
                   .dp-custom-input-sm {
                       border-radius: 0.25rem; /* slightly less rounded */
                       border-color: #d1d5db; /* border-gray-300 */
                       box-shadow: none; /* no shadow */
                       font-size: 0.6875rem; /* Smaller text (between xs and sm) */
                       padding: 0.125rem 0.5rem; /* py-0.5 px-2 */
                       line-height: 1rem;
                       height: 1.25rem; /* h-5 */
                       min-width: 90px; /* Adjust width as needed */
                   }
                   .dp-custom-input-sm:focus {
                       border-color: #3b82f6; 
                       box-shadow: 0 0 0 1px #3b82f6;
                   }
                    /* Ensure teleported menu isn't overly large if needed */
                   .dp__menu {
                       font-size: 0.875rem; 
                   }
                 </style>

                 <!-- ADDED: M3 Calculation Breakdown Section -->
                 <div v-if="project?.kW_STC > 0" class="mt-4 p-3 bg-gray-50/50 border border-dashed border-gray-300 rounded-lg text-xs text-gray-600 flex justify-around items-center">
                     <div class="flex flex-col items-center text-center">
                         <span class="font-medium">System Size</span>
                         <span>{{ project?.kW_STC || 0 }} kW</span>
                     </div>
                     <div class="flex flex-col items-center text-center">
                         <span class="font-medium">Rate Used</span>
                         <span>{{ selectedRateValue !== null ? selectedRateValue + '%' : 'N/A' }}</span>
                     </div>
                     <div class="flex flex-col items-center text-center">
                         <span class="font-medium">Gross Calc.</span>
                         <span>{{ formatCurrency(((project?.kW_STC || 0) * 1000 * (selectedRateValue || 0))/100) }}</span>
                     </div>
                     <div class="flex flex-col items-center text-center">
                         <span class="font-medium">Final M3 Calc.</span>
                         <span class="font-semibold">{{ formatCurrency(calculatedM3Amount) }}</span>
                     </div>
                 </div>
                 <!-- END ADDED: M3 Calculation Breakdown Section -->

                 <!-- ADDED: Net Totals Section -->
                 <div class="mt-4 flex items-center justify-around p-4 bg-gray-50 rounded-lg shadow-inner text-center">
                    <div class="flex flex-col items-center">
                        <span class="text-sm text-gray-500">Net Pending Commission</span>
                        <span class="text-lg font-medium text-yellow-700">{{ formatCurrency(netPendingCommission) }}</span>
                    </div>
                     <div class="flex flex-col items-center">
                        <span class="text-sm text-gray-500">Net Paid Commission</span>
                        <span class="text-lg font-medium text-green-700">{{ formatCurrency(netPaidCommission) }}</span>
                    </div>
                 </div>
                 <!-- END ADDED: Net Totals Section -->

                 <!-- Commission Notes Section -->
                 <commission-notes-section 
                    :notes="commissionNotes" 
                    :current-user="userStore.currentUser" 
                    :project-id="project.ID" 
                 />

            </div>
        </div>
    `
};

// --- UPDATE Export Name ---
export default CommissionsTab; 