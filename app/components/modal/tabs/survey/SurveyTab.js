// app/components/modal/tabs/SurveyTab.js

// Vuex no longer needed
// if (typeof Vuex === 'undefined') { ... }

const SurveyTab = {
    name: 'SurveyTab',
    components: {},
    // Define the project prop
    props: {
        project: { 
            type: Object, 
            required: true 
        }
    },
    computed: {
        // Remove Vuex mapState
        // ...(typeof Vuex !== 'undefined' ? Vuex.mapState('modal', { ... }) : { ... }),

        // Get the surveys array from the prop
        surveys() {
            return this.project?.Survey_Results || [];
        },
    },
    methods: {
        // Helper to format date
        formatDateSimple(dateString) {
            if (!dateString) return 'N/A';
            try {
                return new Date(dateString).toLocaleDateString('en-US', { 
                    month: 'short', day: 'numeric', year: 'numeric' 
                });
            } catch (e) {
                return 'Invalid Date';
            }
        },
         // Helper to display Yes/No based on value
        displayYesNo(value) {
             // Processor sets these to Yes/No strings
             return value || 'No'; 
        }
    },
    template: `
        <div class="survey-tab-content">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Survey Results</h3>

            <div v-if="surveys.length > 0" class="space-y-4">
                <div v-for="(survey, index) in surveys" :key="survey.ID || index" class="p-4 border border-gray-200 rounded-md bg-white shadow-sm">
                    <h4 class="text-md font-semibold text-gray-800 mb-2">Survey #{{ index + 1 }}</h4> 
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div class="flex justify-between">
                            <dt class="text-gray-500">Assessment Date:</dt>
                            <dd class="text-gray-900 font-medium">{{ formatDateSimple(survey.Assessment_Date) }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-gray-500">Added Time:</dt>
                            <dd class="text-gray-900 font-medium">{{ formatDateSimple(survey.Added_Time) }}</dd>
                        </div>
                         <div class="flex justify-between">
                            <dt class="text-gray-500">Main Panel Size:</dt>
                            <dd class="text-gray-900">{{ survey.Main_Service_Panel_Size || 'N/A' }}</dd>
                        </div>
                         <div class="flex justify-between">
                            <dt class="text-gray-500">Roof Type:</dt>
                            <dd class="text-gray-900">{{ survey.Roof_Type || 'N/A' }}</dd>
                        </div>
                         <div class="flex justify-between">
                            <dt class="text-gray-500">Roof Condition:</dt>
                            <dd class="text-gray-900">{{ survey.Roof_Condition || 'N/A' }}</dd>
                        </div>
                        
                        <div class="md:col-span-2 border-t pt-2 mt-2"></div> 
                        
                        <div class="flex justify-between items-center">
                            <dt class="text-gray-500">Panel Upgrade Required:</dt>
                            <dd :class="[survey.Panel_Upgrade_Required === 'Yes' ? 'text-red-600 font-semibold' : 'text-gray-700']">
                                {{ displayYesNo(survey.Panel_Upgrade_Required) }}
                            </dd>
                        </div>
                        <div class="flex justify-between items-center">
                            <dt class="text-gray-500">Roof Work Required:</dt>
                             <dd :class="[survey.Roof_Work_Required === 'Yes' ? 'text-red-600 font-semibold' : 'text-gray-700']">
                                {{ displayYesNo(survey.Roof_Work_Required) }}
                            </dd>
                        </div>
                         <div class="flex justify-between items-center">
                            <dt class="text-gray-500">Tree Work Required:</dt>
                             <dd :class="[survey.Tree_Work_Required === 'Yes' ? 'text-red-600 font-semibold' : 'text-gray-700']">
                                {{ displayYesNo(survey.Tree_Work_Required) }}
                            </dd>
                        </div>

                        <div v-if="survey.Summary_Notes" class="md:col-span-2 mt-2">
                            <dt class="text-gray-500 font-medium mb-1">Summary Notes:</dt>
                            <dd class="text-gray-800 whitespace-pre-wrap bg-gray-50 p-2 rounded border">{{ survey.Summary_Notes }}</dd>
                        </div>
                        
                         <!-- TODO: Add Report Link/Button -->
                    </dl>
                </div>
            </div>
            <div v-else class="text-center text-gray-500 py-6 border border-dashed border-gray-300 rounded-md">
                No survey results found for this project.
            </div>
        </div>
    `
};

export default SurveyTab; 