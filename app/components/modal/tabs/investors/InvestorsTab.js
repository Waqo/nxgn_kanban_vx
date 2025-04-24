// app/components/modal/tabs/investors/InvestorsTab.js

// Import Milestones component later if needed
// import MilestonesInvestorsTab from './MilestonesInvestorsTab.js';

const InvestorsTab = {
    name: 'InvestorsTab',
    // components: { MilestonesInvestorsTab },
    props: {
        project: { 
            type: Object, 
            required: true 
        }
    },
    computed: {
        // Add computed properties for easier access if needed
        isPPA() { return this.project?.Is_PPA; }, // Boolean from processor
        isDomesticContent() { return this.project?.Domestic_Content; }, // Boolean from processor
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
        // Placeholder for edit actions
        editInvestorInfo() {
             alert('Edit Investor Info functionality not implemented yet.');
        }
    },
    template: `
        <div class="investors-tab-content space-y-6">
             <div class="flex justify-between items-center">
                 <h3 class="text-lg font-medium text-gray-900">Investor Information</h3>
                 <button @click="editInvestorInfo" class="text-sm text-blue-600 hover:text-blue-800">Edit</button>
             </div>

             <!-- PPA & Funding Info Card -->
             <div class="p-4 border border-gray-200 rounded-md bg-white shadow-sm">
                 <h4 class="text-md font-semibold text-gray-800 mb-3 border-b pb-2">Funding Details</h4>
                 <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                     <div class="flex justify-between">
                        <dt class="text-gray-500">PPA Project:</dt>
                        <dd class="font-medium" :class="[isPPA ? 'text-green-600' : 'text-gray-700']">{{ isPPA ? 'Yes' : 'No' }}</dd>
                    </div>
                     <div class="flex justify-between">
                        <dt class="text-gray-500">PPA Rate:</dt>
                        <dd class="text-gray-900 font-medium">{{ project.PPA_Rate !== null ? formatCurrency(project.PPA_Rate) + '/W' : 'N/A' }}</dd>
                    </div>
                     <div class="flex justify-between">
                        <dt class="text-gray-500">Rate Year:</dt>
                        <dd class="text-gray-900 font-medium">{{ project.Rate_Year || 'N/A' }}</dd>
                    </div>
                     <div class="flex justify-between">
                        <dt class="text-gray-500">Domestic Content:</dt>
                        <dd class="font-medium" :class="[isDomesticContent ? 'text-green-600' : 'text-gray-700']">{{ isDomesticContent ? 'Yes' : 'No' }}</dd>
                    </div>
                     <div class="flex justify-between">
                        <dt class="text-gray-500">Applicable Rate:</dt>
                         <dd class="text-gray-900 font-medium">{{ formatCurrency(project.Applicable_Rate) }}/W</dd>
                    </div>
                     <div class="flex justify-between">
                        <dt class="text-gray-500">Submitted to Redball:</dt>
                         <dd class="text-gray-900 font-medium">{{ formatDateSimple(project.Submitted_to_Redball) }}</dd>
                    </div>
                      <div class="flex justify-between">
                        <dt class="text-gray-500">PTO Funded:</dt>
                        <dd class="font-medium" :class="[project.PTO_Funded ? 'text-green-600' : 'text-gray-700']">{{ project.PTO_Funded ? 'Yes' : 'No' }}</dd>
                    </div>
                    
                 </dl>
             </div>

             <!-- Milestone Payments Card -->
             <div class="p-4 border border-gray-200 rounded-md bg-white shadow-sm">
                 <h4 class="text-md font-semibold text-gray-800 mb-3 border-b pb-2">Investor Milestone Payments</h4>
                  <div class="space-y-3">
                        <!-- M1 -->
                        <div class="grid grid-cols-3 gap-4 text-sm">
                            <span class="font-medium text-gray-700">M1 Payment</span>
                            <span class="text-gray-900">{{ formatCurrency(project.Investor_M1_Payment) }}</span>
                            <span class="text-gray-600 justify-self-end">Date: {{ formatDateSimple(project.Investor_M1_Date) }}</span>
                        </div>
                        <!-- M2 -->
                        <div class="grid grid-cols-3 gap-4 text-sm">
                            <span class="font-medium text-gray-700">M2 Payment</span>
                            <span class="text-gray-900">{{ formatCurrency(project.Investor_M2_Payment) }}</span>
                            <span class="text-gray-600 justify-self-end">Date: {{ formatDateSimple(project.Investor_M2_Date) }}</span>
                        </div>
                        <!-- M3 -->
                        <div class="grid grid-cols-3 gap-4 text-sm">
                            <span class="font-medium text-gray-700">M3 Payment</span>
                            <span class="text-gray-900">{{ formatCurrency(project.Investor_M3_Payment) }}</span>
                            <span class="text-gray-600 justify-self-end">Date: {{ formatDateSimple(project.Investor_M3_Date) }}</span>
                        </div>
                  </div>
                  <!-- Consider adding total/progress bar like old code if needed -->
             </div>

              <!-- Project Cost Card -->
             <div class="p-4 border border-gray-200 rounded-md bg-white shadow-sm">
                 <h4 class="text-md font-semibold text-gray-800 mb-3 border-b pb-2">Project Cost</h4>
                  <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                       <div class="flex justify-between">
                            <dt class="text-gray-500">Calculated Project Cost:</dt>
                            <dd class="text-gray-900 font-medium">{{ formatCurrency(project.Calculated_Project_Cost) }}</dd>
                        </div>
                         <div class="flex justify-between">
                            <dt class="text-gray-500">Actual Project Cost:</dt>
                            <dd class="text-gray-900 font-medium">{{ formatCurrency(project.Project_Cost) }}</dd>
                        </div>
                  </dl>
             </div>

        </div>
    `
};

export default InvestorsTab; 