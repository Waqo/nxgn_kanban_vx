import BaseBadge from '../../../common/BaseBadge.js';

const { ref, computed } = Vue;

export default {
  name: 'DocumentChecklist',
  components: {
      BaseBadge
  },
  props: {
    project: {
      type: Object,
      required: true
    },
    docTypes: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const isExpanded = ref(false);

    const projectDocuments = computed(() => props.project?.Documents || []);

    const checklistItems = computed(() => {
        return (props.docTypes || [])
            .filter(docType => docType.Include_In_Checklist === true)
            .sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
    });

    const getIsCompleted = (docTypeId) => {
        return projectDocuments.value.some(doc => doc.Doc_Type?.ID === docTypeId);
    };

    const completedCount = computed(() => {
        return checklistItems.value.filter(item => getIsCompleted(item.ID)).length;
    });

    const toggleExpansion = () => {
        isExpanded.value = !isExpanded.value;
    };

    return {
        isExpanded,
        checklistItems,
        completedCount,
        getIsCompleted,
        toggleExpansion
    };
  },
  template: `
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <!-- Header -->
        <div 
          class="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
          @click="toggleExpansion"
        >
            <!-- Left: Title & Count -->
            <div class="flex items-center gap-3">
                 <h3 class="text-lg font-semibold text-gray-900">Document Checklist</h3>
                 <base-badge v-if="checklistItems.length > 0" color="blue">
                     {{ completedCount }}/{{ checklistItems.length }} Complete
                 </base-badge>
            </div>
            <!-- Right: Expand/collapse icon -->
            <i :class="['fas', isExpanded ? 'fa-chevron-up' : 'fa-chevron-down', 'text-gray-400']"></i>
        </div>

        <!-- Checklist Grid (Collapsible) -->
        <div v-if="isExpanded" class="p-4">
             <div v-if="checklistItems.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                <div 
                    v-for="item in checklistItems" 
                    :key="item.ID"
                    class="flex items-center gap-2"
                >
                    <!-- Checkbox icon -->
                    <div 
                        :class="[
                            'w-5 h-5 flex items-center justify-center rounded border flex-shrink-0',
                            getIsCompleted(item.ID) 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-gray-300 bg-gray-50'
                        ]"
                    >
                        <i v-if="getIsCompleted(item.ID)" class="fas fa-check text-xs"></i>
                    </div>
                    <!-- Label -->
                    <span class="text-sm text-gray-700">{{ item.Name }}</span>
                </div>
            </div>
            <div v-else class="text-sm text-center text-gray-500 py-4">
                No checklist items defined.
            </div>
        </div>
    </div>
  `
}; 