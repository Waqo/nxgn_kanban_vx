// app/components/modal/tabs/salesRep/SalesRepTab.js

// No Pinia needed if project is passed as prop

const SalesRepTab = {
    name: 'SalesRepTab',
    props: {
        project: { 
            type: Object, 
            required: true 
        }
    },
    computed: {
        salesRep() {
            return this.project?.Sales_Rep;
        },
        salesOrg() {
            return this.project?.Sales_Org;
        }
        // Add computed props for commission values if needed
    },
    methods: {
        formatCurrency(amount) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount || 0);
        },
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
        getStatusClass(status) {
            // Basic status styling
            status = status?.toLowerCase();
            if (status === 'paid') return 'bg-green-100 text-green-800';
            if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
            if (status === 'released') return 'bg-blue-100 text-blue-800';
            return 'bg-gray-100 text-gray-700';
        }
    },
    template: `
        <div class="salesrep-tab-content grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Column: Sales Rep & Org Info -->
            <div class="lg:col-span-1 space-y-6">
                <!-- Sales Rep Card -->
                <div class="p-4 border border-gray-200 rounded-md bg-white shadow-sm">
                    <h3 class="text-lg font-medium text-gray-900 mb-3">Sales Rep</h3>
                    <div v-if="salesRep">
                         <p class="text-md font-semibold">{{ salesRep.zc_display_value || 'N/A' }}</p>
                         <p v-if="project['Sales_Rep.Email']" class="text-sm text-gray-600"><i class="fas fa-envelope mr-1 text-gray-400"></i> {{ project['Sales_Rep.Email'] }}</p>
                         <p v-if="project['Sales_Rep.Phone']" class="text-sm text-gray-600"><i class="fas fa-phone mr-1 text-gray-400"></i> {{ project['Sales_Rep.Phone'] }}</p>
                    </div>
                    <div v-else class="text-sm text-gray-500 italic">No Sales Rep assigned.</div>
                </div>
                <!-- Sales Org Card -->
                 <div class="p-4 border border-gray-200 rounded-md bg-white shadow-sm">
                    <h3 class="text-lg font-medium text-gray-900 mb-3">Sales Organization</h3>
                     <div v-if="salesOrg">
                         <p class="text-md font-semibold">{{ salesOrg.zc_display_value || 'N/A' }}</p>
                         <!-- Add Org details later if needed -->
                     </div>
                     <div v-else class="text-sm text-gray-500 italic">No Sales Org assigned.</div>
                </div>
            </div>

            <!-- Right Column: Commission Info -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Commission Rate Card -->
                 <div class="p-4 border border-gray-200 rounded-md bg-white shadow-sm">
                    <h3 class="text-lg font-medium text-gray-900 mb-3">Active Commission Rate</h3>
                     <p class="text-xl font-bold text-blue-600">{{ project.Active_Commission_Rate || 'N/A' }}</p>
                     <!-- Add details on how rate is determined if available -->
                </div>

                 <!-- Milestones Card -->
                 <div class="p-4 border border-gray-200 rounded-md bg-white shadow-sm">
                    <h3 class="text-lg font-medium text-gray-900 mb-3">Commission Milestones</h3>
                    <div class="space-y-4">
                        <!-- M1 -->
                        <div class="grid grid-cols-3 gap-4 text-sm border-b pb-2">
                            <span class="font-medium text-gray-700">M1</span>
                            <span class="text-gray-900">{{ formatCurrency(project.M1_Amount) }}</span>
                            <span :class="['px-2 py-0.5 rounded-full text-xs font-medium text-center w-fit justify-self-end', getStatusClass(project.M1_Status)]">{{ project.M1_Status || 'N/A' }}</span>
                            <span class="text-xs text-gray-500 col-span-3">Paid: {{ formatDateSimple(project.M1_Paid_Date) }} | Released: {{ formatDateSimple(project.M1_Release_Date) }}</span>
                        </div>
                        <!-- M2 -->
                        <div class="grid grid-cols-3 gap-4 text-sm border-b pb-2">
                            <span class="font-medium text-gray-700">M2</span>
                            <span class="text-gray-900">{{ formatCurrency(project.M2_Amount) }}</span>
                            <span :class="['px-2 py-0.5 rounded-full text-xs font-medium text-center w-fit justify-self-end', getStatusClass(project.M2_Status)]">{{ project.M2_Status || 'N/A' }}</span>
                            <span class="text-xs text-gray-500 col-span-3">Paid: {{ formatDateSimple(project.M2_Paid_Date) }} | Released: {{ formatDateSimple(project.M2_Release_Date) }}</span>
                        </div>
                        <!-- M3 -->
                        <div class="grid grid-cols-3 gap-4 text-sm">
                            <span class="font-medium text-gray-700">M3</span>
                            <span class="text-gray-900">{{ formatCurrency(project.M3_Amount) }}</span>
                             <span :class="['px-2 py-0.5 rounded-full text-xs font-medium text-center w-fit justify-self-end', getStatusClass(project.M3_Status)]">{{ project.M3_Status || 'N/A' }}</span>
                             <span class="text-xs text-gray-500 col-span-3">Paid: {{ formatDateSimple(project.M3_Paid_Date) }}</span>
                        </div>
                    </div>
                 </div>

                 <!-- Advance Card -->
                 <div class="p-4 border border-gray-200 rounded-md bg-white shadow-sm">
                    <h3 class="text-lg font-medium text-gray-900 mb-3">Commission Advance</h3>
                     <div class="grid grid-cols-3 gap-4 text-sm">
                        <span class="font-medium text-gray-700">Total Advance</span>
                        <span class="text-gray-900">{{ formatCurrency(project.Total_Commission_Advance) }}</span>
                        <span :class="['px-2 py-0.5 rounded-full text-xs font-medium text-center w-fit justify-self-end', getStatusClass(project.Commission_Advance_Status)]">{{ project.Commission_Advance_Status || 'N/A' }}</span>
                        <span class="text-xs text-gray-500 col-span-3">Paid: {{ formatDateSimple(project.Comm_Advance_Paid_Date) }}</span>
                    </div>
                 </div>
            </div>
        </div>
    `
};

export default SalesRepTab; 