// app/components/modal/tabs/survey/SurveyTab.js

// Imports
import BaseBadge from '../../../common/BaseBadge.js';
import BaseButton from '../../../common/BaseButton.js';
import BaseCard from '../../../common/BaseCard.js';
import BaseTextArea from '../../../common/BaseTextArea.js';
import BaseDescriptionList from '../../../common/BaseDescriptionList.js';
import { useUiStore } from '../../../../store/uiStore.js'; // For notifications

// Import VueUse and Vue
const { computed, ref, reactive, watch } = Vue;
const { useDateFormat } = VueUse;

export default {
    name: 'SurveyTab',
  components: {
      BaseBadge,
      BaseButton,
      BaseCard,
      BaseTextArea,
      BaseDescriptionList
  },
    props: {
        project: { 
            type: Object, 
            required: true 
        }
    },
  setup(props) {
    const uiStore = useUiStore();
    const project = computed(() => props.project);
    const survey = computed(() => project.value?.Survey_Results?.[0] || null);

    // --- Add State for Editing ---
    const isEditing = ref(false);
    const isSaving = ref(false);
    const defaultFormData = {
        // reportPdfId: '', // Not editable in UI for now
        // reportUrl: '', // Not editable in UI for now
        // summarySent: null, // Handled by isSent computed
        assessmentDate: '',
        roofType: '',
        roofCondition: '',
        // treeTrimmingRequired: 'No', // Use boolean from project data
        mainServicePanelSize: '',
        treeWorkRequired: 'No', // Keep as string for select options
        roofWorkRequired: 'No', // Keep as string for select options
        panelUpgradeRequired: 'No', // Keep as string for select options
        summaryNotes: '',
        sendFinalSummary: false
    };
    const formData = reactive({ ...defaultFormData });

    // --- Helper to format date for YYYY-MM-DD input ---
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
             // Assuming input dateString might be MM/DD/YY or other formats
             const date = new Date(dateString);
             if (isNaN(date.getTime())) throw new Error('Invalid date');
             const year = date.getFullYear();
             const month = (date.getMonth() + 1).toString().padStart(2, '0');
             const day = date.getDate().toString().padStart(2, '0');
             return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Error formatting date for input:', error);
            return '';
        }
    };
    
    // --- Helper to format date back to MM/DD/YY for Zoho --- 
     const formatDateForZoho = (dateString) => {
        if (!dateString) return ''; // Return empty string if date is cleared
        try {
            // Input is YYYY-MM-DD
            const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
            if (isNaN(date.getTime())) throw new Error('Invalid date');
             const month = (date.getMonth() + 1).toString().padStart(2, '0');
             const day = date.getDate().toString().padStart(2, '0');
             const year = date.getFullYear().toString().slice(-2);
             return `${month}/${day}/${year}`;
        } catch (error) {
            console.error('Error formatting date for Zoho:', error);
            return ''; // Return empty on error
        }
    };

    // --- Watch survey prop to populate form data ---
    watch(survey, (newSurvey) => {
        if (newSurvey) {
            formData.assessmentDate = formatDateForInput(newSurvey.Assessment_Date);
            formData.roofType = newSurvey.Roof_Type || '';
            formData.roofCondition = newSurvey.Roof_Condition || '';
            formData.mainServicePanelSize = newSurvey.Main_Service_Panel_Size || '';
            // Use the Picklist Yes/No values for state
            formData.treeWorkRequired = newSurvey.Tree_Work_Required || 'No'; 
            formData.roofWorkRequired = newSurvey.Roof_Work_Required || 'No';
            formData.panelUpgradeRequired = newSurvey.Panel_Upgrade_Required || 'No';
            formData.summaryNotes = newSurvey.Summary_Notes || '';
            formData.sendFinalSummary = !!newSurvey.Summary_Sent; // If Summary_Sent has a date, checkbox is implicitly true and disabled
            // Keep treeTrimmingRequired display logic separate
        } else {
            Object.assign(formData, defaultFormData);
        }
    }, { immediate: true });

    // --- Computed properties for display ---
    const assessmentDateRef = computed(() => survey.value?.Assessment_Date);
    const assessmentDateDisplay = useDateFormat(assessmentDateRef, 'MMM D, YYYY');
    
    const lastUpdatedRef = computed(() => survey.value?.Modified_Time);
    const lastUpdated = useDateFormat(lastUpdatedRef, 'MMM D, YYYY h:mm A');
    
    const reportUrl = computed(() => survey.value?.Report_URL);
    const roofTypeDisplay = computed(() => survey.value?.Roof_Type || 'N/A');
    const roofConditionDisplay = computed(() => survey.value?.Roof_Condition || 'N/A');
    const mainPanelSizeDisplay = computed(() => survey.value?.Main_Service_Panel_Size || 'N/A');
    const treeTrimmingRequired = computed(() => survey.value?.Tree_Trimming_Required === 'Yes');
    const treeWorkRequiredDisplay = computed(() => survey.value?.Tree_Work_Required || 'No');
    const roofWorkRequiredDisplay = computed(() => survey.value?.Roof_Work_Required || 'No');
    const panelUpgradeRequiredDisplay = computed(() => survey.value?.Panel_Upgrade_Required || 'No');
    const summaryNotesDisplay = computed(() => survey.value?.Summary_Notes || null);
    const summarySent = computed(() => !!survey.value?.Summary_Sent);

    const displayYesNo = (value) => value ? 'Yes' : 'No'; // For boolean display
    const getStatusBadgeColor = (value) => value === 'Yes' ? 'red' : 'green'; // For Yes/No picklist display

    // --- ADD Computed properties for BaseDescriptionList items ---
    const surveyDetailsItems = computed(() => {
        const items = [];
        if (!survey.value) return items;

        items.push({ term: 'Assessment Date', description: assessmentDateDisplay.value });
        // Placeholder for Report Link - handled separately below
        return items;
    });

    const surveyFindingsItems = computed(() => {
         const items = [];
         if (!survey.value) return items;

         items.push({ term: 'Roof Type', description: roofTypeDisplay.value });
         items.push({ term: 'Roof Condition', description: roofConditionDisplay.value });
         items.push({ term: 'Main Panel Size', description: mainPanelSizeDisplay.value });
         items.push({ term: 'Tree Trimming Required', description: displayYesNo(treeTrimmingRequired.value) });
         return items;
    });
    // --- END Computed properties for BaseDescriptionList items ---

    // --- Event Handlers ---
    const toggleEdit = () => {
        if (isEditing.value) {
            // If cancelling, reset form to initial survey state
            if (survey.value) {
                 formData.assessmentDate = formatDateForInput(survey.value.Assessment_Date);
                 formData.roofType = survey.value.Roof_Type || '';
                 formData.roofCondition = survey.value.Roof_Condition || '';
                 formData.mainServicePanelSize = survey.value.Main_Service_Panel_Size || '';
                 formData.treeWorkRequired = survey.value.Tree_Work_Required || 'No';
                 formData.roofWorkRequired = survey.value.Roof_Work_Required || 'No';
                 formData.panelUpgradeRequired = survey.value.Panel_Upgrade_Required || 'No';
                 formData.summaryNotes = survey.value.Summary_Notes || '';
                 formData.sendFinalSummary = !!survey.value.Summary_Sent;
            } else {
                 Object.assign(formData, defaultFormData);
            }
        }
        isEditing.value = !isEditing.value;
    };

    const handleSave = async () => {
        isSaving.value = true; // Changed from setIsSaving(true)
        const payload = {
            // Don't send Report_URL or Report_PDF_ID if they aren't editable
            Assessment_Date: formatDateForZoho(formData.assessmentDate),
            Roof_Type: formData.roofType,
            Roof_Condition: formData.roofCondition,
            Main_Service_Panel_Size: formData.mainServicePanelSize,
            Tree_Work_Required: formData.treeWorkRequired,
            Roof_Work_Required: formData.roofWorkRequired,
            Panel_Upgrade_Required: formData.panelUpgradeRequired,
            Summary_Notes: formData.summaryNotes,
            // Only send Send_Final_Summary if it's being set to true
            ...(formData.sendFinalSummary && !summarySent.value && { Send_Final_Summary: true })
        };
        
        try {
            if (survey.value) {
                // TODO: Implement updateRecord API call
                console.log("UPDATE Survey: ", survey.value.ID, payload);
                uiStore.addNotification({ type: 'info', message: 'Survey Update API call not implemented yet.' });
                // await updateRecord("PM_Kanban_Surveys", survey.value.ID, { data: payload });
            } else {
                // TODO: Implement createRecord API call
                payload.Project = project.value.ID; // Add project link
                console.log("CREATE Survey: ", payload);
                 uiStore.addNotification({ type: 'info', message: 'Survey Create API call not implemented yet.' });
                // await createRecord("Add_Survey_Result", { data: payload });
            }
             // TODO: Refresh data via modalStore.refreshModalData() on success
            isEditing.value = false;
        } catch (error) {
            console.error("Error saving survey data:", error);
            uiStore.addNotification({ type: 'error', message: `Failed to save survey: ${error.message}` });
        } finally {
            isSaving.value = false; // Changed from setIsSaving(false)
        }
    };

    const viewReport = () => {
        if (reportUrl.value) {
            window.open(reportUrl.value, '_blank');
        } else {
             uiStore.addNotification({ type: 'error', message: 'Survey Report URL not available.' });
        }
    };

    return {
        survey,
        isEditing,
        isSaving,
        formData, // Expose form data for v-model
        assessmentDateDisplay, // Use the formatted ref
        lastUpdated, // Use the formatted ref
        reportUrl,
        roofTypeDisplay,
        roofConditionDisplay,
        mainPanelSizeDisplay,
        treeTrimmingRequired, // Keep boolean for display
        treeWorkRequiredDisplay,
        roofWorkRequiredDisplay,
        panelUpgradeRequiredDisplay,
        summaryNotesDisplay,
        summarySent,
        displayYesNo,
        getStatusBadgeColor,
        toggleEdit, // Use this instead of editSurvey
        handleSave, // New save handler
        viewReport,
        // --- Expose computed lists for BaseDescriptionList ---
        surveyDetailsItems,
        surveyFindingsItems
    };
    },
    template: `
    <div class="survey-tab-content space-y-6 p-1">
        <!-- Header -->
        <div class="flex justify-between items-center mb-4 pb-2">
             <div class="space-y-1">
                 <p v-if="lastUpdated" class="text-sm text-gray-500">Last updated {{ lastUpdated }}</p>
             </div>
            <base-button v-if="survey || !isEditing" @click="toggleEdit" :variant="isEditing ? 'danger' : 'secondary'" size="sm" :disabled="isSaving">
                 <i :class="['fas', isEditing ? 'fa-times' : 'fa-edit', 'mr-2']"></i>
                 {{ isEditing ? 'Cancel' : 'Edit Survey' }}
             </base-button>
             <base-button v-if="isEditing" @click="handleSave" variant="primary" size="sm" :disabled="isSaving">
                 <i :class="['fas', isSaving ? 'fa-spinner fa-spin' : 'fa-save', 'mr-2']"></i>
                 {{ isSaving ? 'Saving...' : 'Save Changes' }}
             </base-button>
        </div>

        <!-- No Survey Data Placeholder -->
        <div v-if="!survey && !isEditing" class="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <div class="text-gray-400 text-4xl mb-3"><i class="fas fa-clipboard-list"></i></div>
            <h3 class="text-gray-500 font-medium">No Survey Data Available</h3>
            <p class="text-sm text-gray-400 mt-1">Survey data will appear here when available</p>
        </div>

        <!-- Survey Details Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Left Column: Survey Details Card -->
            <base-card>
                <template #header>
                     <h4 class="text-lg font-medium text-gray-900">Survey Details</h4>
                </template>
                <template #default>
                     <!-- Edit Mode: Assessment Date Input -->
                     <div v-if="isEditing" class="mb-4">
                         <label class="block text-sm font-medium text-gray-700 mb-1">Assessment Date</label>
                         <input type="date" v-model="formData.assessmentDate" class="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                     </div>

                     <!-- Display Mode: Use BaseDescriptionList -->
                     <base-description-list v-if="!isEditing" :items="surveyDetailsItems" variant="simple" :dividers="false" paddingX="0" paddingY="1" />

                    <!-- View Report Button (Show in both modes if URL exists) -->
                    <div v-if="reportUrl" :class="isEditing ? 'mt-4' : 'pt-3'">
                         <base-button @click="viewReport" variant="primary" size="sm">
                              <i class="fas fa-file-pdf mr-2"></i>View Report PDF
                         </base-button>
                     </div>
                 </template>
            </base-card>

            <!-- Right Column: Survey Findings Card -->
            <base-card>
                 <template #header>
                     <h4 class="text-lg font-medium text-gray-900">Survey Findings</h4>
                 </template>
                 <template #default>
                      <!-- Edit Mode: Inputs -->
                      <div v-if="isEditing" class="space-y-4">
                         <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Roof Type</label>
                            <input type="text" v-model="formData.roofType" placeholder="e.g., Comp Shingle" class="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Roof Condition</label>
                            <input type="text" v-model="formData.roofCondition" placeholder="e.g., Good, Fair" class="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Main Panel Size</label>
                            <input type="text" v-model="formData.mainPanelSize" placeholder="e.g., 200A" class="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <!-- Tree Trimming Required (No input, display only) -->
                        <div class="mb-4">
                           <dt class="block text-sm font-medium text-gray-700 mb-1">Tree Trimming Required:</dt>
                           <dd :class="['font-medium', treeTrimmingRequired ? 'text-red-600' : 'text-gray-700']">
                               {{ displayYesNo(treeTrimmingRequired) }}
                           </dd>
                       </div>
                     </div>

                     <!-- Display Mode: Use BaseDescriptionList -->
                      <base-description-list v-else :items="surveyFindingsItems" variant="simple" :dividers="false" paddingX="0" paddingY="1" />
                 </template>
            </base-card>

            <!-- Combined Required Work & Summary Section Card -->
            <base-card class="md:col-span-2">
                 <template #header>
                     <h4 class="text-lg font-medium text-gray-900">Summary Fields</h4>
                     <p class="text-sm text-gray-500 -mt-1">(Homeowner will receive a report based on these fields)</p>
                 </template>
                 <template #default>
                     <!-- Required Work Assessment -->
                     <dl class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <!-- Tree Work Required -->
                        <div class="p-3 bg-gray-50 rounded-md border">
                             <label class="block text-sm font-medium text-gray-700 mb-1">Tree Work Required</label>
                             <select v-if="isEditing" v-model="formData.treeWorkRequired" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                 <option>No</option>
                                 <option>Yes</option>
                             </select>
                             <dd v-else>
                                <base-badge :color="getStatusBadgeColor(treeWorkRequiredDisplay)">{{ treeWorkRequiredDisplay }}</base-badge>
                             </dd>
                         </div>
                         <!-- Roof Work Required -->
                         <div class="p-3 bg-gray-50 rounded-md border">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Roof Work Required</label>
                             <select v-if="isEditing" v-model="formData.roofWorkRequired" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                 <option>No</option>
                                 <option>Yes</option>
                             </select>
                            <dd v-else>
                                 <base-badge :color="getStatusBadgeColor(roofWorkRequiredDisplay)">{{ roofWorkRequiredDisplay }}</base-badge>
                            </dd>
                        </div>
                        <!-- Panel Upgrade Required -->
                        <div class="p-3 bg-gray-50 rounded-md border">
                             <label class="block text-sm font-medium text-gray-700 mb-1">Panel Upgrade Required</label>
                              <select v-if="isEditing" v-model="formData.panelUpgradeRequired" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                 <option>No</option>
                                 <option>Yes</option>
                             </select>
                            <dd v-else>
                                 <base-badge :color="getStatusBadgeColor(panelUpgradeRequiredDisplay)">{{ panelUpgradeRequiredDisplay }}</base-badge>
                            </dd>
                        </div>
                    </dl>

                    <!-- Summary Notes Section -->
                    <div class="pt-4 mt-4">
                        <label for="summaryNotes" class="block text-sm font-medium text-gray-700 mb-1">Summary Notes</label>
                        <base-text-area v-if="isEditing" id="summaryNotes" v-model="formData.summaryNotes" :rows="4" />
                        <p v-else class="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-2 rounded border border-gray-200">{{ summaryNotesDisplay || 'No notes entered.' }}</p>
                    </div>

                     <!-- Send Final Summary Section -->
                     <div :class="['mt-4 p-3 rounded-lg border', summarySent ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200']">
                         <div v-if="summarySent" class="flex items-center gap-3">
                             <i class="fas fa-check-circle text-green-600 text-lg"></i>
                             <p class="text-sm text-green-800 font-medium">Final Summary Sent to Homeowner</p>
                         </div>
                         <div v-else class="flex items-start space-x-3">
                             <input
                                v-if="isEditing"
                                id="sendFinalSummaryCheckbox"
                                type="checkbox"
                                v-model="formData.sendFinalSummary"
                                class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                             />
                             <div class="flex-1">
                                 <label :for="isEditing ? 'sendFinalSummaryCheckbox' : null" :class="['block text-sm font-medium', isEditing ? 'cursor-pointer' : '']">
                                     {{ isEditing ? 'Send Final Summary to Homeowner?' : 'Final Summary NOT Sent' }}
                                 </label>
                                 <p class="mt-1 text-sm text-gray-600">
                                     {{ isEditing ? 'Checking this box and saving will trigger an automated email to the homeowner with the Required Work assessment and Summary Notes.' : 'The homeowner has not yet been sent the final survey summary.' }}
                                 </p>
                </div>
            </div>
                     </div>
                </template>
            </base-card>

            </div>
        </div>
    `
};