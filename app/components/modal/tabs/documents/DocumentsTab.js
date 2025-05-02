// app/components/modal/tabs/documents/DocumentsTab.js

// Imports
import BaseButton from '../../../common/BaseButton.js';
import BaseBadge from '../../../common/BaseBadge.js';
import BaseTextInput from '../../../common/BaseTextInput.js';
import BaseDialog from '../../../common/BaseDialog.js';
import DocumentChecklist from './DocumentChecklist.js'; 
import DocumentItem from './DocumentItem.js';
import DocumentTypeGroup from './DocumentTypeGroup.js';
import MultipleFileUploadForm from './MultipleFileUploadForm.js'; 
import { useLookupsStore } from '../../../../store/lookupsStore.js';
import { useUiStore } from '../../../../store/uiStore.js';
import { useDocumentsStore } from '../../../../store/documentsStore.js';
import { useModalStore } from '../../../../store/modalStore.js';
import { useProjectsStore } from '../../../../store/projectsStore.js';

const { ref, computed } = Vue;

const DocumentsTab = {
    name: 'DocumentsTab',
    components: {
        BaseButton,
        BaseBadge,
        BaseTextInput,
        BaseDialog,
        DocumentChecklist,
        DocumentItem, 
        DocumentTypeGroup,
        MultipleFileUploadForm, 
    },
    props: {
        project: { 
            type: Object, 
            required: true 
        }
    },
    setup(props) {
        const lookupsStore = useLookupsStore();
        const uiStore = useUiStore();
        const documentsStore = useDocumentsStore(); 
        const modalStore = useModalStore(); 
        const projectsStore = useProjectsStore();
        const project = computed(() => props.project);
        const projectId = computed(() => props.project?.ID);

        // State
        const searchQuery = ref('');
        const showMultipleUploadForm = ref(false); // Controls inline form visibility
        const selectedFilesForUpload = ref([]);  // Holds files to pass to form
        const dragActive = ref(false); 
        const fileInputRef = ref(null); 
        const showDeleteConfirm = ref(false); 
        const docToDelete = ref(null);      
        const isCompareMode = ref(false);

        // Computed Properties
        const allDocuments = computed(() => {
            const rawDocs = props.project?.Documents || [];
            return rawDocs.filter(doc => doc.File_Upload && String(doc.File_Upload).trim() !== '');
        }); 
        const docTypes = computed(() => lookupsStore.docTypes || []);
        const filteredDocuments = computed(() => {
            const query = searchQuery.value.toLowerCase().trim();
            if (!query) return allDocuments.value; 
            return allDocuments.value.filter(doc => {
                const name = (doc.Document_Name || '').toLowerCase();
                const type = (doc.Doc_Type?.Name || '').toLowerCase();
                return name.includes(query) || type.includes(query);
            });
        });
        const documentGroups = computed(() => {
            const typed = {};
            const untyped = [];
            filteredDocuments.value.forEach(doc => {
                let sortTime = 0;
                try {
                    const date = new Date(doc.Added_Time);
                    if (!isNaN(date.getTime())) {
                        sortTime = date.getTime();
                    }
                } catch (e) { /* ignore invalid dates */ }
                doc.Added_Time_Sort = sortTime;
                if (doc.Doc_Type?.ID && doc.Doc_Type?.Name) {
                    const typeId = doc.Doc_Type.ID;
                    if (!typed[typeId]) {
                        typed[typeId] = {
                            id: typeId,
                            name: doc.Doc_Type.Name,
                            docs: []
                        };
                    }
                    typed[typeId].docs.push(doc);
                } else {
                    untyped.push(doc);
                }
            });
            Object.values(typed).forEach(group => {
                group.docs.sort((a, b) => b.Added_Time_Sort - a.Added_Time_Sort);
            });
            let allGroups = Object.values(typed).sort((a, b) => 
                a.name.localeCompare(b.name)
            );
            if (untyped.length > 0) {
                untyped.sort((a, b) => b.Added_Time_Sort - a.Added_Time_Sort);
                allGroups.push({
                    id: '__untyped__',
                    name: 'Other Documents',
                    docs: untyped
                });
            }
            return allGroups; 
        });
        const hasProjectFolder = computed(() => !!project.value?.Project_Folder_ID);
        const hasInvestorFolder = computed(() => !!project.value?.Project_Investor_Folder_Id);
        const totalDocumentCount = computed(() => allDocuments.value.length);
        const comparedDocIds = computed(() => modalStore.comparisonDocIds);

        // --- Action Handlers --- 
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
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                selectedFilesForUpload.value = files; 
                showMultipleUploadForm.value = true; // Show inline form
            }
        };
        const handleFileInputChange = (event) => {
            const files = Array.from(event.target.files);
            if (files.length > 0) {
                selectedFilesForUpload.value = files; 
                showMultipleUploadForm.value = true; // Show inline form
            }
            event.target.value = '';
        };
        const openUploadFormOnClick = () => {
            fileInputRef.value?.click();
        };
        const handleUploadClick = () => {
            openUploadFormOnClick(); 
        };
        const handleMultipleUploadSubmit = async (fileConfigs) => {
            if (!projectId.value) { uiStore.addNotification({ type: 'error', message: 'Project ID is missing.'}); return; }
            let successCount = 0, errorCount = 0;
            for (const config of fileConfigs) {
                const result = await documentsStore.uploadDocument({ /* ... pass data ... */ projectId: projectId.value, file: config.file, documentName: config.processedFile.fileName, documentTypeId: config.documentTypeId, isRevision: config.isRevision });
                if (result.success) successCount++; else errorCount++;
            }
            if (errorCount > 0) { uiStore.addNotification({ type: 'warning', title: 'Upload Complete with Errors', message: `Uploaded ${successCount} docs, ${errorCount} failed.`, duration: 0 }); }
            showMultipleUploadForm.value = false; // Hide form after submit
            selectedFilesForUpload.value = []; // Clear selection
        };
        // *** ADDED: Handler for form cancel event ***
        const handleUploadFormCancel = () => {
            console.log('Upload form cancelled');
            showMultipleUploadForm.value = false;
            selectedFilesForUpload.value = []; // Clear selection
        };
        const handleSaveEdit = async (eventData) => {
            const { documentId, updateData } = eventData;
            console.log("Handling save edit in DocumentsTab:", documentId, updateData);
             if (!projectId.value) {
                uiStore.addNotification({ type: 'error', message: 'Project ID is missing. Cannot update document.'});
                return;
            }
            await documentsStore.updateDocument({ 
                documentId,
                updateData,
                projectId: projectId.value 
            });
        };
        const handleTriggerWorkDriveUpload = ({ documentId }) => {
             if (!projectId.value) return;
             documentsStore.triggerWorkDriveUpload({ documentId, projectId: projectId.value });
        };
        const handleTriggerSendToInvestor = ({ documentId }) => {
             if (!projectId.value) return;
             documentsStore.triggerSendToInvestor({ documentId, projectId: projectId.value });
        };
        const handleDeleteRequest = ({ documentId, documentName }) => {
            docToDelete.value = { documentId, documentName };
            showDeleteConfirm.value = true;
        };
        const confirmDeleteDocument = async () => {
            if (!docToDelete.value || !projectId.value) return;
            await documentsStore.deleteDocument({ 
                documentId: docToDelete.value.documentId, 
                projectId: projectId.value, 
                documentName: docToDelete.value.documentName 
            });
            docToDelete.value = null;
            showDeleteConfirm.value = false; 
        };
        const cancelDeleteDocument = () => {
             docToDelete.value = null;
             showDeleteConfirm.value = false;
        };
        const handleRequestPreview = ({ url, title }) => {
            console.log(`DocumentsTab: Received request-preview event. Calling handler.`);
            console.log(`DocumentsTab: Calling modalStore.openPreview with url: ${url}, title: ${title}`);
            modalStore.openPreview(url, title);
        };
        const handleCreateFoldersClick = () => {
            if (!projectId.value) {
                uiStore.addNotification({ type: 'error', message: 'Cannot create folders: Project ID is missing.' });
                return;
            }
            projectsStore.triggerFolderCreation({ projectId: projectId.value });
        };
        const openProjectFolder = () => {
            if (project.value?.Project_Folder_ID) {
                const url = `https://workdrive.zoho.com/folder/${project.value.Project_Folder_ID}`;
                window.open(url, '_blank');
            } else {
                uiStore.addNotification({ type: 'warning', message: 'Project Folder ID not found.' });
            }
        };
        const openInvestorFolder = () => {
            if (project.value?.Project_Investor_Folder_Id) {
                 const url = `https://workdrive.zoho.com/folder/${project.value.Project_Investor_Folder_Id}`;
                window.open(url, '_blank');
            } else {
                 uiStore.addNotification({ type: 'warning', message: 'Investor Folder ID not found.' });
            }
        };
        
        const toggleCompareMode = () => {
            isCompareMode.value = !isCompareMode.value;
            if (!isCompareMode.value) {
                modalStore.clearComparisonDocs();
            }
            console.log("Compare mode toggled:", isCompareMode.value);
        };

        const handleCompareToggle = (docId) => {
            if (!isCompareMode.value) return;
            
            const currentSelection = [...comparedDocIds.value];
            const index = currentSelection.indexOf(docId);
            let newSelection = [];

            if (index > -1) {
                newSelection = currentSelection.filter(id => id !== docId);
            } else {
                if (currentSelection.length < 2) {
                    newSelection = [...currentSelection, docId];
                } else {
                    uiStore.addNotification({ type: 'warning', message: 'You can only select up to two documents to compare.', duration: 3000 });
                    newSelection = currentSelection;
                }
            }
            modalStore.setComparisonDocs(newSelection);
            
            if (newSelection.length === 2) {
                 modalStore.openComparison(); 
            }
            console.log("Compared Docs (Store):", newSelection);
        };
        
        const isSelectedForCompare = (docId) => {
            return comparedDocIds.value.includes(docId);
        };

        return {
            project,
            searchQuery,
            allDocuments,
            docTypes,
            documentGroups,
            hasProjectFolder,
            hasInvestorFolder,
            totalDocumentCount,
            handleCreateFoldersClick,
            openProjectFolder,
            openInvestorFolder,
            showMultipleUploadForm,
            selectedFilesForUpload,
            dragActive,
            fileInputRef,
            handleUploadClick, 
            handleDrag,        
            handleDrop,
            handleFileInputChange,
            handleMultipleUploadSubmit,
            handleSaveEdit, 
            handleTriggerWorkDriveUpload,
            handleTriggerSendToInvestor,
            handleDeleteRequest,
            confirmDeleteDocument,
            cancelDeleteDocument,
            showDeleteConfirm,
            docToDelete,
            handleRequestPreview,
            isCompareMode,
            comparedDocIds,
            toggleCompareMode,
            handleCompareToggle,
            isSelectedForCompare,
            handleUploadFormCancel,
        };
    },
    template: `
        <div class="documents-tab-content space-y-6 p-1"> 
            <!-- Header -->
            <div class="flex flex-wrap items-center justify-between gap-4 mb-4 border-b pb-4">
                 <!-- Left Side: Count & Search -->
                 <div class="flex items-center gap-3 flex-wrap">
                     <base-badge color="blue">{{ totalDocumentCount }} Documents</base-badge> 
                      <base-text-input 
                         v-model="searchQuery"
                         placeholder="Search documents..."
                         class="w-full sm:w-48"
                         :attrs="{ name: 'doc-search', 'aria-label': 'Search documents' }"
                         :trailingIconClass="searchQuery ? null : 'fas fa-search'"
                         clearable 
                     />
                 </div>
                  <!-- Right Side: Folder, Compare & Upload Actions -->
                 <div class="flex items-center gap-2 flex-wrap justify-end">
                     <base-button v-if="hasProjectFolder" @click="openProjectFolder" variant="secondary" size="sm" :show-focus-ring="false">
                         <i class="far fa-folder-open mr-2"></i>Project Folder
                     </base-button>
                     <base-button v-if="hasInvestorFolder" @click="openInvestorFolder" variant="secondary" size="sm" :show-focus-ring="false">
                         <i class="fas fa-file-invoice-dollar mr-2"></i>Investor Folder
                     </base-button>
                     <base-button 
                         v-if="!hasProjectFolder && !hasInvestorFolder" 
                         @click="handleCreateFoldersClick" 
                         variant="secondary" 
                         size="sm"
                         :show-focus-ring="false"
                     >
                          <i class="fas fa-folder-plus mr-2"></i>Create Folders
                     </base-button>
                     <base-button 
                        @click="toggleCompareMode"
                        :variant="isCompareMode ? 'primary' : 'secondary'" 
                        size="sm"
                        :aria-pressed="isCompareMode"
                        title="Toggle document comparison mode"
                        :show-focus-ring="false"
                     >
                         <i :class="['mr-2', isCompareMode ? 'fas fa-check-square' : 'far fa-square']"></i> Compare
                     </base-button>
                 </div>
             </div>

            <!-- Checklist -->
            <document-checklist :project="project" :doc-types="docTypes" />

            <!-- *** UPDATED: Inline Upload Form *** -->
            <div v-if="showMultipleUploadForm" class="mt-4">
                 <multiple-file-upload-form
                    :files="selectedFilesForUpload"
                    :doc-types="docTypes"
                    @cancel="handleUploadFormCancel" 
                    @upload="handleMultipleUploadSubmit"
                 />
            </div>

            <!-- Drag & Drop Upload Area -->
            <div 
                v-if="!showMultipleUploadForm" 
                @dragenter.prevent="handleDrag" 
                @dragleave.prevent="handleDrag" 
                @dragover.prevent="handleDrag" 
                @drop.prevent="handleDrop"
                @click="handleUploadClick" 
                :class="[
                    'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 ease-in-out',
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                ]"
             >
                 <i class="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                 <p class="text-gray-600">Drag & drop files here or click to upload</p>
                 <input 
                     ref="fileInputRef" 
                     type="file" 
                     multiple 
                     class="hidden" 
                     @change="handleFileInputChange" 
                     accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt,.heic,.heif"
                 > 
             </div>
             
            <!-- Document Groups & Comparison Indicator -->
            <div class="relative">
                <div v-if="isCompareMode" class="absolute -top-3 left-0 right-0 z-10 pointer-events-none">
                    <div class="max-w-max mx-auto"><span class="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800 border border-blue-300 shadow-sm"><i class="fas fa-check-square mr-1.5"></i> Compare Mode Active ({{ comparedDocIds.length }}/2 selected)</span></div>
                </div>
                <div :class="[ 'transition-all duration-200 ease-in-out', isCompareMode ? 'border-2 border-dashed border-blue-400 rounded-lg p-4 pt-6' : 'pt-0' ]">
                    <!-- Document Groups -->
                    <div v-if="documentGroups.length > 0" class="space-y-4">
                        <document-type-group
                            v-for="group in documentGroups" :key="group.id" :doc-type-name="group.name"
                            :documents="group.docs" :doc-types="docTypes" :is-compare-mode="isCompareMode" 
                            :is-selected-for-compare="isSelectedForCompare" 
                            @save-edit="handleSaveEdit" @request-preview="handleRequestPreview" 
                            @trigger-workdrive-upload="handleTriggerWorkDriveUpload" @trigger-send-investor="handleTriggerSendToInvestor" 
                            @delete="handleDeleteRequest" @compare-toggle="handleCompareToggle" />
                    </div>
                    <!-- Empty States -->
                    <div v-else-if="totalDocumentCount === 0" class="text-center text-gray-500 py-6 border border-dashed border-gray-300 rounded-md"> <i class="fas fa-file-alt text-3xl text-gray-400 mb-2"></i> <p>No documents uploaded yet.</p> </div>
                    <div v-else class="text-center text-gray-500 py-6 border border-dashed border-gray-300 rounded-md"> <i class="fas fa-search text-3xl text-gray-400 mb-2"></i> <p>No documents match your search criteria.</p> </div>
                </div>
            </div>

            <!-- Delete Dialog -->
             <base-dialog
                v-model:show="showDeleteConfirm"
                title="Delete Document?"
                iconType="warning"
                confirmButtonText="Delete"
                @confirm="confirmDeleteDocument"
                @cancel="cancelDeleteDocument"
             >
                 Are you sure you want to delete the document 
                 <strong class="font-medium">"{{ docToDelete?.documentName }}"</strong>?
                 This action cannot be undone.
             </base-dialog>
        </div>
    `
};

export default DocumentsTab; 