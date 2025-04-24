// app/components/modal/tabs/permitting/PermittingTab.js

// No Pinia store access needed here if data is passed via props
// No Base components imported currently

const PermittingTab = {
    name: 'PermittingTab',
    props: {
        project: { 
            type: Object, 
            required: true 
        }
    },
    computed: {
        // Get the permitting array from the prop
        permits() {
            // Processor ensures this is an array
            return this.project?.Permitting || []; 
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
        // TODO: Add Edit button functionality later
        editPermitting() {
            alert('Editing Permitting/Interconnection is not implemented yet.');
        }
    },
    template: `
        <div class="permitting-tab-content">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900">Permitting & Interconnection</h3>
                <button @click="editPermitting" class="text-sm text-blue-600 hover:text-blue-800">Edit</button>
            </div>

            <div v-if="permits.length > 0" class="space-y-4">
                <!-- Assuming usually only one permit record per project -->
                <div v-for="(permit, index) in permits" :key="permit.ID || index" class="p-4 border border-gray-200 rounded-md bg-white shadow-sm">
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <!-- Permitting Column -->
                        <div>
                             <dt class="font-semibold text-gray-600 mb-1 border-b pb-1">Permitting</dt>
                             <div class="mt-2 space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Status:</span>
                                    <span class="text-gray-900 font-medium">{{ permit.Permit_Status || 'N/A' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Number:</span>
                                    <span class="text-gray-900 font-medium">{{ permit.Permit_Number || 'N/A' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Submitted:</span>
                                    <span class="text-gray-900 font-medium">{{ formatDateSimple(permit.Permit_Submission_Date) }}</span>
                                </div>
                                 <div class="flex justify-between">
                                    <span class="text-gray-500">Approved:</span>
                                    <span class="text-gray-900 font-medium">{{ formatDateSimple(permit.Permit_Approval_Date) }}</span>
                                </div>
                                 <div class="flex justify-between">
                                    <span class="text-gray-500">Last Update:</span>
                                    <span class="text-gray-900 font-medium">{{ formatDateSimple(permit.Permit_Last_Updated) }}</span>
                                </div>
                             </div>
                        </div>
                         <!-- Interconnection Column -->
                        <div>
                            <dt class="font-semibold text-gray-600 mb-1 border-b pb-1">Interconnection</dt>
                             <div class="mt-2 space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Status:</span>
                                    <span class="text-gray-900 font-medium">{{ permit.Interconnection_Status || 'N/A' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Number:</span>
                                    <span class="text-gray-900 font-medium">{{ permit.Interconnection_Number || 'N/A' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Submitted:</span>
                                    <span class="text-gray-900 font-medium">{{ formatDateSimple(permit.Interconnection_Submission_Date) }}</span>
                                </div>
                                 <div class="flex justify-between">
                                    <span class="text-gray-500">Approved:</span>
                                    <span class="text-gray-900 font-medium">{{ formatDateSimple(permit.Interconnection_Approval_Date) }}</span>
                                </div>
                                  <div class="flex justify-between">
                                    <span class="text-gray-500">Last Update:</span>
                                    <span class="text-gray-900 font-medium">{{ formatDateSimple(permit.IC_Last_Updated) }}</span>
                                </div>
                             </div>
                        </div>
                    </dl>
                </div>
            </div>
            <div v-else class="text-center text-gray-500 py-6 border border-dashed border-gray-300 rounded-md">
                No Permitting or Interconnection information found.
            </div>
        </div>
    `
};

export default PermittingTab; 