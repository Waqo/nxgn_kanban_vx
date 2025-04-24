// app/components/modal/tabs/SystemsTab.js

// Vuex no longer needed
// if (typeof Vuex === 'undefined') { ... }

const SystemsTab = {
    name: 'SystemsTab',
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

        // Access Bill_of_Materials via prop
        materials() {
            return this.project?.Bill_of_Materials || [];
        },

        // Grouped materials uses this.materials - OK
        groupedMaterials() {
            if (!this.materials) return {};
            return this.materials.reduce((acc, material) => {
                // Use API field name 'Category'
                const category = material.Category || 'Other Component';
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(material);
                return acc;
            }, {});
        },

        // Total cost uses this.materials - OK
        totalMaterialCost() {
            if (!this.materials) return 0;
            // Use API field name 'Total_Price'
            return this.materials.reduce((sum, material) => 
                sum + (parseFloat(material.Total_Price) || 0), 0
            );
        },
        
        // Other overview fields use this.project - OK
        systemSizeKw() { return this.project?.kW_STC || 0; },
        annualOutputKwh() { return this.project?.Annual_Output_kWh || 0; },
        annualUsageKwh() { return this.project?.Annual_Usage || 0; },
        systemYield() { return this.project?.Yield || '0'; },
        offsetPercentage() { return this.project?.Offset || '0%'; },
        isApproved() { return this.project?.Is_Approved; } 
    },
    methods: {
         formatCurrency(amount) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount || 0);
        },
        formatNumber(value, decimals = 0) {
            if (value === null || value === undefined || value === '') return 'N/A';
            const num = Number(value);
            if (isNaN(num)) return 'Invalid';
            // Basic comma formatting for integers
            const fixedNum = num.toFixed(decimals);
             if (decimals === 0) {
                 return fixedNum.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
             } else {
                 // Avoid adding commas to decimals for simplicity for now
                 return fixedNum;
             }
        },
        // Placeholders for later functionality
        addMaterial() {
            alert('Add Material functionality not implemented yet.');
        },
        editSystem() {
            alert('Edit System functionality not implemented yet.');
        }
    },
    template: `
        <div class="system-tab-content space-y-6">
            <!-- System Overview Section -->
            <div class="p-4 border border-gray-200 rounded-md bg-white shadow-sm">
                <div class="flex justify-between items-center mb-4 pb-2 border-b">
                    <h3 class="text-lg font-medium text-gray-900">System Overview</h3>
                    <div class="flex items-center gap-2">
                        <span :class="['px-2 py-0.5 text-xs font-medium rounded-full', isApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800']">
                            {{ isApproved ? 'Approved' : 'Not Approved' }}
                        </span>
                         <button @click="editSystem" class="text-xs text-blue-600 hover:text-blue-800">Edit</button>
                    </div>
                </div>
                <dl class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                    <div class="text-center p-2 bg-gray-50 rounded">
                        <dt class="text-gray-500">Size (kW)</dt>
                        <dd class="text-gray-900 font-semibold text-lg">{{ formatNumber(systemSizeKw, 2) }}</dd>
                    </div>
                    <div class="text-center p-2 bg-gray-50 rounded">
                        <dt class="text-gray-500">Output (kWh)</dt>
                        <dd class="text-gray-900 font-semibold text-lg">{{ formatNumber(annualOutputKwh) }}</dd>
                    </div>
                    <div class="text-center p-2 bg-gray-50 rounded">
                        <dt class="text-gray-500">Usage (kWh)</dt>
                        <dd class="text-gray-900 font-semibold text-lg">{{ formatNumber(annualUsageKwh) }}</dd>
                    </div>
                     <div class="text-center p-2 bg-gray-50 rounded">
                        <dt class="text-gray-500">Yield (kWh/kW)</dt>
                        <dd class="text-gray-900 font-semibold text-lg">{{ formatNumber(systemYield, 0) }}</dd>
                    </div>
                     <div class="text-center p-2 bg-gray-50 rounded">
                        <dt class="text-gray-500">Offset</dt>
                        <dd class="text-gray-900 font-semibold text-lg">{{ offsetPercentage }}</dd> 
                    </div>
                     <!-- Add more overview fields if needed -->
                 </dl>
            </div>

             <!-- Components Section -->
             <div>
                 <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-medium text-gray-900">System Components</h3>
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-medium text-gray-700">Total Cost: {{ formatCurrency(totalMaterialCost) }}</span>
                        <button @click="addMaterial" class="text-xs text-blue-600 hover:text-blue-800">+ Add Material</button>
                    </div>
                </div>

                 <div v-if="materials.length > 0" class="space-y-4">
                    <div v-for="(items, category) in groupedMaterials" :key="category">
                        <h4 v-if="items.length > 0" class="text-md font-semibold text-gray-800 mb-2 p-2 bg-gray-100 rounded-t-md border-b">{{ category }}</h4>
                        <ul v-if="items.length > 0" class="divide-y divide-gray-200 border border-t-0 border-gray-200 rounded-b-md bg-white">
                             <li v-for="material in items" :key="material.ID" class="px-4 py-3 grid grid-cols-4 gap-4 text-sm">
                                 <div class="col-span-2 font-medium text-gray-900">{{ material.Manufacturer }} - {{ material.Model }}</div>
                                 <div class="text-gray-600">Qty: {{ material.Quantity }}</div>
                                 <div class="text-gray-700 text-right font-medium">{{ formatCurrency(material.Total_Price) }}</div>
                             </li>
                        </ul>
                    </div>
                 </div>
                 <div v-else class="text-center text-gray-500 py-6 border border-dashed border-gray-300 rounded-md">
                    No system components added yet.
                 </div>
            </div>
        </div>
    `
};

export default SystemsTab; 