import BaseButton from '../../../common/BaseButton.js';
import BaseSelectMenu from '../../../common/BaseSelectMenu.js';
import BaseToggle from '../../../common/BaseToggle.js';
import { useUiStore } from '../../../../store/uiStore.js';
import { useDocumentsStore } from '../../../../store/documentsStore.js'; // Needed for isUploading state

const { ref, computed, watch, nextTick } = Vue;

// Placeholder - replace with actual utility if it exists elsewhere
const processFile = (file) => {
  if (!file) return { fileName: 'Unknown File', fileSize: '0 B', fileType: 'unknown' };
  return {
    fileName: file.name,
    fileSize: file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
        : `${(file.size / 1024).toFixed(1)} KB`,
    fileType: file.type || 'unknown'
  };
};

export default {
  name: 'MultipleFileUploadForm',
  components: {
    BaseButton,
    BaseSelectMenu,
    BaseToggle,
  },
  props: {
    files: { // Array of File objects passed when opening
      type: Array,
      default: () => []
    },
    docTypes: { // Document types lookup from lookupsStore
      type: Array,
      default: () => []
    }
    // We might need projectId later if we call upload directly from here
    // projectId: { type: String, required: true }
  },
  emits: ['cancel', 'upload'],
  setup(props, { emit }) {
    const uiStore = useUiStore();
    const documentsStore = useDocumentsStore();

    const fileConfigs = ref([]);
    const dragActive = ref(false);
    const fileInputRef = ref(null);

    // Initialize fileConfigs when props.files changes
    watch(() => props.files, (newFiles) => {
      fileConfigs.value = newFiles.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`, // Create a temporary unique ID
        file: file,
        processedFile: processFile(file),
        documentTypeId: '', // Default to empty
        isRevision: false,
        status: 'pending', // Add status: pending, uploading, success, error
        error: null
      }));
    }, { immediate: true, deep: true }); // Deep watch might be needed if files array itself is modified

    const isUploading = computed(() => documentsStore.isUploading); // Get from store

    // Methods
    const handleTypeChange = (id, typeId) => {
      const index = fileConfigs.value.findIndex(fc => fc.id === id);
      if (index !== -1) {
        fileConfigs.value[index].documentTypeId = typeId;
      }
    };

    const handleRevisionChange = (id, isChecked) => {
      const index = fileConfigs.value.findIndex(fc => fc.id === id);
       if (index !== -1) {
        fileConfigs.value[index].isRevision = isChecked;
      }
    };

    const handleRemoveFile = (id) => {
      fileConfigs.value = fileConfigs.value.filter(fc => fc.id !== id);
      // If removing the last file, maybe emit cancel?
      if (fileConfigs.value.length === 0) {
          emit('cancel');
      }
    };

    const setBulkType = (typeId) => {
      fileConfigs.value = fileConfigs.value.map(config => ({
        ...config,
        documentTypeId: typeId
      }));
    };

    const setBulkRevision = (isRevision) => {
      fileConfigs.value = fileConfigs.value.map(config => ({
        ...config,
        isRevision
      }));
    };

    const handleUploadAll = () => {
      // Validate: ensure all files have a name (should always be true) 
      // Optionally validate if a type is required?
      const validConfigs = fileConfigs.value.filter(fc => fc.processedFile.fileName);
      if (validConfigs.length !== fileConfigs.value.length) {
           uiStore.addNotification({ type: 'error', message: 'Some files seem invalid.' });
           return;
      }
      // Emit the configs for the parent component to handle looping/calling store action
      emit('upload', validConfigs); 
      // Parent will handle closing the modal on completion/error
    };

    // --- Drag & Drop --- 
    const handleDrag = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        dragActive.value = true;
      } else if (e.type === "dragleave") {
        dragActive.value = false;
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragActive.value = false;
      const newFiles = Array.from(e.dataTransfer.files);
      addFiles(newFiles);
    };

    const handleFileInputChange = (event) => {
        const newFiles = Array.from(event.target.files);
        addFiles(newFiles);
        event.target.value = ''; // Clear input
    };

    const triggerFileInput = () => {
        fileInputRef.value?.click();
    };
    
    const addFiles = (newFiles) => {
        if (newFiles.length === 0) return;
        const newConfigs = newFiles.map((file, index) => ({
            id: `${file.name}-${file.lastModified}-new-${index}`, // Unique ID for new files
            file: file,
            processedFile: processFile(file),
            documentTypeId: '',
            isRevision: false,
            status: 'pending', 
            error: null
        }));
        fileConfigs.value = [...fileConfigs.value, ...newConfigs];
    };
    
    // --- Doc Type Options for Select --- 
    const docTypeOptions = computed(() => {
        return (props.docTypes || []).map(type => ({
            value: type.ID, 
            label: type.Name
        }));
    });

    return {
      fileConfigs,
      dragActive,
      fileInputRef,
      isUploading,
      docTypeOptions,
      handleTypeChange,
      handleRevisionChange,
      handleRemoveFile,
      setBulkType,
      setBulkRevision,
      handleUploadAll,
      handleDrag,
      handleDrop,
      handleFileInputChange,
      triggerFileInput,
      cancelForm: () => emit('cancel')
    };
  },
  template: `
    <div class="border border-blue-300 bg-blue-50 rounded-lg shadow-md mb-6">
        <!-- Header Area -->
        <div class="p-4 border-b border-blue-200">
            <h3 class="text-md font-semibold text-gray-800">Upload New Documents</h3>
        </div>
        
        <!-- Content Area -->
        <div class="p-4 space-y-4">
             <!-- Bulk Actions & Drop Zone -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 bg-white rounded-md">
                <!-- Bulk Actions -->
                <div class="space-y-2">
                    <p class="text-sm font-medium text-gray-700">Bulk Actions:</p>
                    <div class="flex flex-wrap gap-2">
                        <base-select-menu
                            @update:modelValue="setBulkType"
                            :options="docTypeOptions"
                            placeholder="Set All Types..."
                            class="flex-grow"
                            :attrs="{ 'aria-label': 'Set all document types' }"
                         />
                         <base-button @click="setBulkRevision(true)" variant="secondary" size="sm">Mark All Revision</base-button>
                         <base-button @click="setBulkRevision(false)" variant="secondary" size="sm">Clear All Revision</base-button>
                    </div>
                </div>
                <!-- Drop Zone -->
                <div 
                    @dragenter="handleDrag" 
                    @dragleave="handleDrag" 
                    @dragover="handleDrag" 
                    @drop="handleDrop"
                    @click="triggerFileInput"
                    :class="[
                        'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer',
                        dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    ]"
                 >
                     <i class="fas fa-cloud-upload-alt text-xl text-gray-400"></i>
                     <p class="text-sm text-gray-600 mt-1">Drop more files or click to add</p>
                     <input ref="fileInputRef" type="file" multiple class="hidden" @change="handleFileInputChange" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt,.heic,.heif"> 
                 </div>
            </div>

             <!-- File List (Scrollable) -->
            <div class="overflow-y-auto border rounded-md bg-white" style="max-height: 40vh;"> 
                <div v-if="fileConfigs.length === 0" class="p-6 text-center text-gray-500">
                    No files selected for upload.
                </div>
                <ul v-else class="divide-y divide-gray-200">
                    <li v-for="(config) in fileConfigs" :key="config.id" class="p-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <!-- File Info -->
                        <div class="md:col-span-4 flex items-center gap-2 min-w-0">
                             <i class="fas fa-file-alt text-gray-400 flex-shrink-0"></i>
                             <div class="min-w-0">
                                 <p class="text-sm font-medium text-gray-900 truncate" :title="config.processedFile.fileName">{{ config.processedFile.fileName }}</p>
                                 <p class="text-xs text-gray-500">{{ config.processedFile.fileSize }}</p>
                             </div>
                        </div>
                        <!-- Type Select -->
                        <div class="md:col-span-3">
                             <base-select-menu
                                :modelValue="config.documentTypeId"
                                @update:modelValue="handleTypeChange(config.id, $event)"
                                :options="docTypeOptions"
                                placeholder="Select Type"
                                class="w-full"
                                :attrs="{ 'aria-label': 'Document type for ' + config.processedFile.fileName }"
                                :disabled="isUploading"
                             />
                        </div>
                        <!-- Revision Toggle -->
                        <div class="md:col-span-3 flex items-center justify-start md:justify-center">
                             <base-toggle 
                                :modelValue="config.isRevision"
                                @update:modelValue="handleRevisionChange(config.id, $event)"
                                :ariaLabel="'Mark as revision for ' + config.processedFile.fileName"
                                :disabled="isUploading"
                              />
                             <span class="ml-2 text-sm text-gray-600">Revision</span>
                        </div>
                        <!-- Remove Button -->
                         <div class="md:col-span-2 flex justify-end md:justify-center">
                            <base-button 
                                variant="icon-ghost" 
                                size="sm" 
                                color="red" 
                                @click="handleRemoveFile(config.id)" 
                                :disabled="isUploading"
                                :attrs="{ 'aria-label': 'Remove ' + config.processedFile.fileName }"
                             >
                                <i class="fas fa-trash"></i>
                            </base-button>
                         </div>
                        <!-- Progress/Status Placeholder -->
                        <div v-if="config.status !== 'pending'" class="col-span-full mt-1 text-xs">
                            <!-- TODO: Add progress bar or status message based on config.status/error -->
                            <span v-if="config.status === 'uploading'" class="text-blue-600">Uploading...</span>
                            <span v-if="config.status === 'success'" class="text-green-600">Success!</span>
                            <span v-if="config.status === 'error'" class="text-red-600">Error: {{ config.error }}</span>
                        </div>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Footer Area -->
        <div class="p-4 border-t border-blue-200 bg-blue-50/50 rounded-b-lg">
             <div class="flex justify-end gap-3">
                <base-button variant="secondary" @click="cancelForm" :disabled="isUploading">
                    Cancel
                </base-button>
                <base-button 
                    variant="primary" 
                    @click="handleUploadAll" 
                    :disabled="isUploading || fileConfigs.length === 0"
                    :loading="isUploading"
                >
                    Upload All ({{ fileConfigs.length }})
                </base-button>
            </div>
        </div>
    </div>
  `
}; 