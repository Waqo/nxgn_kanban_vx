// app/components/modal/tabs/documents/DocumentsTab.js

// Import necessary Base components (e.g., BaseTable, BaseButton, BaseIcon)
import BaseTable from '../../../common/BaseTable.js';
import BaseButton from '../../../common/BaseButton.js';
import BaseBadge from '../../../common/BaseBadge.js'; // For Doc Type?

const DocumentsTab = {
    name: 'DocumentsTab',
    components: {
        BaseTable,
        BaseButton,
        BaseBadge
    },
    // Define the project prop
    props: {
        project: { 
            type: Object, 
            required: true 
        }
        // Keep other props if they exist (currentUser, users, previewDoc, etc.)
        // Assuming these will be passed down from ProjectDetailModal or sourced differently
    },
    computed: {
        // Get the documents array from the prop
        documents() {
            console.log('DocumentsTab: Documents from prop:', this.project.Documents);
            return this.project?.Documents || [];
        },

        // Define columns for BaseTable
        tableColumns() {
            return [
                { key: 'Document_Name', label: 'Name', class: 'w-1/2' },
                { key: 'Doc_Type', label: 'Type', class: 'w-1/4' },
                { key: 'Added_Time', label: 'Date Added', class: 'w-1/4' },
                { key: 'actions', label: 'Actions', class: 'text-right' },
            ];
        },
        groupedDocuments() { /* ... uses this.documents ... OK */ }, 
    },
    methods: {
        // Placeholder for upload later
        uploadDocument() {
            alert('Upload Document functionality not implemented yet.');
        },
        // Placeholder for viewing/downloading
        viewDocument(doc) {
            if (doc.File_Upload) {
                // Zoho file URLs usually need to be opened in a specific way
                // This might require using ZOHO.CREATOR.API.getRecordById or File API
                // Or constructing a download URL if possible
                console.log('Attempting to open Zoho file URL:', doc.File_Upload);
                alert('Viewing Zoho file needs integration with File API or URL construction.');
                // Potentially use navigateParentUrl if it handles file links
                // this.$api.navigateParentUrl({ action: 'open', url: doc.File_Upload });
                window.open(doc.File_Upload, '_blank'); // Simplest attempt
            } else if (doc.WorkDrive_Link) {
                 const url = typeof doc.WorkDrive_Link === 'object' ? doc.WorkDrive_Link.url : doc.WorkDrive_Link;
                 if (url) {
                     window.open(url, '_blank');
                 } else {
                     alert('WorkDrive link is invalid.');
                 }
            } else {
                alert('No viewable link available for this document.');
            }
        },
        // Helper for formatting date
        formatDate(dateString) {
            if (!dateString) return 'N/A';
            try {
                return new Date(dateString).toLocaleDateString('en-US', { 
                    month: 'short', day: 'numeric', year: 'numeric' 
                });
            } catch (e) {
                return 'Invalid Date';
            }
        }
    },
    template: `
        <div class="documents-tab-content">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900">Documents</h3>
                <base-button @click="uploadDocument" variant="secondary" size="sm">+ Upload Document</base-button>
            </div>

            <base-table 
                v-if="documents.length > 0"
                :headers="tableColumns"
                :items="documents"
                item-key="ID"
            >
                <!-- Custom cell rendering -->
                <template #cell(Document_Name)="{ item }">
                     <span class="font-medium text-gray-900">{{ item.Document_Name || 'Untitled' }}</span>
                     <p v-if="item.File_Tags" class="text-xs text-gray-500">Tags: {{ item.File_Tags }}</p>
                </template>
                
                <template #cell(Doc_Type)="{ item }">
                     <base-badge v-if="item.Doc_Type?.Name" color="blue" size="sm">{{ item.Doc_Type.Name }}</base-badge>
                     <span v-else-if="item.Document_Type" class="text-sm text-gray-500">{{ item.Document_Type }}</span>
                     <span v-else class="text-sm text-gray-400 italic">N/A</span>
                </template>

                <template #cell(Added_Time)="{ item }">
                    {{ formatDate(item.Added_Time) }}
                    <p v-if="item.Added_User" class="text-xs text-gray-500">by {{ item.Added_User }}</p>
                </template>

                <template #cell(actions)="{ item }">
                     <base-button 
                         variant="ghost" 
                         size="xs" 
                         @click="viewDocument(item)" 
                         :disabled="!item.File_Upload && !item.WorkDrive_Link"
                         title="View/Download"
                      >
                         <i class="fas fa-eye"></i>
                     </base-button>
                     <!-- Add delete/edit buttons later -->
                </template>

            </base-table>
            <div v-else class="text-center text-gray-500 py-6 border border-dashed border-gray-300 rounded-md">
                No documents uploaded yet.
            </div>
        </div>
    `
};

export default DocumentsTab; 