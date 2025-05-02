import BaseBadge from '../../../common/BaseBadge.js';
import DocumentItem from './DocumentItem.js';

const { ref, computed } = Vue;

export default {
  name: 'DocumentTypeGroup',
  components: {
      BaseBadge,
      DocumentItem
  },
  props: {
    docTypeName: {
        type: String,
        required: true
    },
    documents: {
        type: Array,
        default: () => []
    },
    docTypes: {
      type: Array,
      default: () => []
    },
    isCompareMode: {
        type: Boolean,
        default: false
    },
    isSelectedForCompare: {
        type: Function,
        required: true
    }
  },
  emits: ['save-edit', 'request-preview', 'trigger-workdrive-upload', 'trigger-send-investor', 'delete', 'compare-toggle'],
  setup(props, { emit }) {
    const isExpanded = ref(true); // Default to expanded

    const toggleExpansion = () => {
        isExpanded.value = !isExpanded.value;
    };

    const documentCount = computed(() => props.documents.length);

    const onSaveEdit = (eventData) => {
        emit('save-edit', eventData);
    };

    const onRequestPreview = (eventData) => {
        console.log(`DocumentTypeGroup [${props.docTypeName}]: Received request-preview event. Bubbling up.`);
        emit('request-preview', eventData);
    };

    const onTriggerWorkDriveUpload = (eventData) => {
        emit('trigger-workdrive-upload', eventData);
    };

    const onTriggerSendInvestor = (eventData) => {
        emit('trigger-send-investor', eventData);
    };

    const onDelete = (eventData) => {
        emit('delete', eventData);
    };

    const onCompareToggle = (docId) => {
        emit('compare-toggle', docId);
    };

    return {
        isExpanded,
        toggleExpansion,
        documentCount,
        onSaveEdit,
        onRequestPreview,
        onTriggerWorkDriveUpload,
        onTriggerSendInvestor,
        onDelete,
        onCompareToggle
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
                 <h3 class="text-lg font-semibold text-gray-900">{{ docTypeName }}</h3>
                 <base-badge v-if="documentCount > 0" color="gray">{{ documentCount }}</base-badge>
            </div>
            <!-- Right: Expand/collapse icon -->
            <i :class="['fas', isExpanded ? 'fa-chevron-up' : 'fa-chevron-down', 'text-gray-400']"></i>
        </div>

        <!-- Document List (Collapsible) -->
        <div v-if="isExpanded" class="divide-y divide-gray-100">
            <document-item 
                v-for="doc in documents" 
                :key="doc.ID" 
                :document="doc"
                :doc-types="docTypes" 
                :is-compare-mode="isCompareMode" 
                :is-selected-for-compare="isSelectedForCompare(doc.ID)" 
                @save="onSaveEdit" 
                @request-preview="onRequestPreview"
                @trigger-workdrive-upload="onTriggerWorkDriveUpload"
                @trigger-send-investor="onTriggerSendInvestor"
                @delete="onDelete"
                @compare-toggle="onCompareToggle"
            />
             <div v-if="documentCount === 0" class="p-4 text-center text-sm text-gray-500 italic">
                No documents of this type.
             </div>
        </div>
    </div>
  `
}; 