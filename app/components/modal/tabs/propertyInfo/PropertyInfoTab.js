const PropertyInfoTab = {
    name: 'PropertyInfoTab',
    props: {
        project: { 
            type: Object, 
            required: true 
        }
    },
    computed: {
        propertyInfoText() {
            return this.project?.Property_Database_Ownership_Info || '';
        }
    },
    template: `
        <div class="property-info-tab-content">
             <h3 class="text-lg font-medium text-gray-900 mb-4">Property Information</h3>
             
             <div v-if="propertyInfoText" class="p-4 border border-gray-200 rounded-md bg-white shadow-sm">
                 <pre class="whitespace-pre-wrap text-sm text-gray-700 font-mono" style="max-width: 100%; overflow-x: auto;">
                    {{ propertyInfoText }}
                 </pre>
             </div>
             <div v-else class="text-center text-gray-500 py-6 border border-dashed border-gray-300 rounded-md">
                No property information available.
             </div>
        </div>
    `
};

export default PropertyInfoTab; 