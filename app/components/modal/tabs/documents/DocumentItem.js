import BaseBadge from '../../../common/BaseBadge.js';
import BaseButton from '../../../common/BaseButton.js';
import BaseTextInput from '../../../common/BaseTextInput.js';
import BaseSelectMenu from '../../../common/BaseSelectMenu.js';
import BaseToggle from '../../../common/BaseToggle.js';
import BaseDropdown from '../../../common/BaseDropdown.js';
import { useUiStore } from '../../../../store/uiStore.js';
import { useDocumentsStore } from '../../../../store/documentsStore.js';
import { useModalStore } from '../../../../store/modalStore.js';
import { REPORT_PUBLISHED_DOCUMENTS, FIELD_DOC_FILE_UPLOAD } from '../../../../config/constants.js';
const { computed, ref, watch } = Vue;
const { useDateFormat } = VueUse;

// Helper function to process Zoho file paths for direct access/download
function processZohoDirectUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `https://creator.zoho.com${url}`;
  console.warn('Unrecognized Zoho URL format, attempting direct use:', url);
  return url; // Fallback
}

// Helper function to check if filename indicates an image
function isLikelyImage(filenameOrUrl) {
    if (!filenameOrUrl || typeof filenameOrUrl !== 'string') return false;
    const lowerCaseName = filenameOrUrl.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    return imageExtensions.some(ext => lowerCaseName.includes(ext));
}

export default {
  name: 'DocumentItem',
  components: {
    BaseBadge,
    BaseButton,
    BaseTextInput,
    BaseSelectMenu,
    BaseToggle,
    BaseDropdown,
  },
  props: {
    document: {
      type: Object,
      required: true
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
        type: Boolean,
        default: false
    }
  },
  emits: ['save', 'editToggled', 'trigger-workdrive-upload', 'trigger-send-investor', 'delete', 'compare-toggle'],
  setup(props, { emit }) {
    const uiStore = useUiStore();
    const documentsStore = useDocumentsStore();
    const modalStore = useModalStore();
    const doc = computed(() => props.document);
    const projectId = computed(() => props.document?.Project?.ID);
    const docId = computed(() => props.document?.ID);

    const isEditing = ref(false);
    const editFormData = ref({});
    const isPreviewLoading = ref(false);

    const docTypeOptions = computed(() => {
        return (props.docTypes || []).map(type => ({
            value: type.ID,
            label: type.Name
        }));
    });

    const startEditing = () => {
        editFormData.value = {
            name: doc.value?.Document_Name || '',
            typeId: doc.value?.Doc_Type?.ID || '',
            isRevision: doc.value?.Is_Revision === 'true'
        };
        isEditing.value = true;
        emit('editToggled', true);
    };

    const cancelEditing = () => {
        isEditing.value = false;
        emit('editToggled', false);
    };

    const saveEdit = () => {
        if (!editFormData.value.name?.trim()) {
            uiStore.addNotification({ type: 'error', message: 'Document name cannot be empty.' });
            return;
        }
        emit('save', {
            documentId: doc.value.ID,
            updateData: {
                Document_Name: editFormData.value.name.trim(),
                Doc_Type: editFormData.value.typeId || null,
                Is_Revision: editFormData.value.isRevision
            }
        });
        isEditing.value = false;
        emit('editToggled', false);
    };

    watch(() => props.document, () => {
        if (isEditing.value && editFormData.value.id !== props.document.ID) {
             cancelEditing();
        }
    }, { deep: true });

    const docName = computed(() => doc.value?.Document_Name || 'Untitled Document');
    const docTypeName = computed(() => doc.value?.Doc_Type?.Name || null);
    const addedUser = computed(() => doc.value?.User_Lookup?.zc_display_value?.trim() || doc.value?.Added_User || 'System');

    const addedTimeRef = computed(() => doc.value?.Added_Time);
    const addedTime = useDateFormat(addedTimeRef, 'MMM D, YYYY', { locales: 'en-US' });
    
    const fileUploadPath = computed(() => doc.value?.File_Upload?.trim());
    const isImage = computed(() => isLikelyImage(docName.value));
    const hasWorkDriveObjectLink = computed(() => !!(doc.value?.WorkDrive_Link?.url?.trim()));
    const hasWDLinkString = computed(() => !!(typeof doc.value?.WD_Link === 'string' && doc.value?.WD_Link?.trim()));
    
    const hasAnyViewableLink = computed(() => {
        return !!(
            doc.value?.Embed_Link?.trim() || 
            hasWDLinkString.value ||
            hasWorkDriveObjectLink.value || 
            fileUploadPath.value
        );
    });
    const downloadUrl = computed(() => processZohoDirectUrl(doc.value?.File_Upload));

    const isRevision = computed(() => doc.value?.Is_Revision === 'true');
    const revisionNumber = computed(() => doc.value?.Revision_Number);
    const isSentToInvestor = computed(() => doc.value?.Sent_To_Investor_Portal === 'true');
    const isSendingToInvestor = computed(() => doc.value?.Trigger_Send_to_Inv === 'true');
    const hasWorkDriveLink = computed(() => !!(doc.value?.WorkDrive_Link?.url?.trim() || typeof doc.value?.WorkDrive_Link === 'string' && doc.value?.WorkDrive_Link?.trim()));

    const handleDownloadDocument = () => {
        if (downloadUrl.value) {
            window.open(downloadUrl.value, '_blank');
        } else {
             uiStore.addNotification({ type: 'error', message: 'No download link available for this document.' });
        }
    };

    const handleRequestPreview = async () => {
        console.log(`DocumentItem: handleRequestPreview called for document ID ${docId.value}`); 
        
        let finalPreviewUrl = null;
        let urlSource = null;
        let isDirectImagePreview = false;
        const finalDownloadUrl = downloadUrl.value; 

        // Helper to add WD params
        const addWorkDriveParams = (baseUrl) => {
            if (!baseUrl) return null;
            try {
                const urlObj = new URL(baseUrl);
                urlObj.searchParams.set('toolbar', 'false');
                urlObj.searchParams.set('appearance', 'light');
                urlObj.searchParams.set('themecolor', 'blue');
                return urlObj.toString();
            } catch (e) {
                console.error('Error adding WorkDrive params to URL:', baseUrl, e);
                return baseUrl; // Return original URL on error
            }
        };

        // Priority 1: Embed Link (No WD Params needed)
        const embedLink = doc.value?.Embed_Link?.trim();
        if (embedLink) {
            finalPreviewUrl = processZohoDirectUrl(embedLink);
            urlSource = 'Embed Link';
            isDirectImagePreview = isLikelyImage(embedLink);
            console.log(`DocumentItem: Found Embed Link.`);
        }
        
        // Priority 2: WD_Link (String field) - Add WD Params
        if (!finalPreviewUrl) {
            const wdLinkString = doc.value?.WD_Link?.trim();
            if (wdLinkString) {
                 const processedUrl = processZohoDirectUrl(wdLinkString);
                 finalPreviewUrl = addWorkDriveParams(processedUrl); // Add params
                 urlSource = 'WD_Link (String)';
                 isDirectImagePreview = isLikelyImage(wdLinkString); // Check original link for image type
                 console.log(`DocumentItem: Found WD_Link (String). Added params.`);
            }
        }

        // Priority 3: WorkDrive_Link (Object) - Add WD Params
        if (!finalPreviewUrl) {
            const wdLinkVal = doc.value?.WorkDrive_Link;
            const wdLink = wdLinkVal?.url?.trim();
            if (wdLink) {
                const processedUrl = processZohoDirectUrl(wdLink);
                finalPreviewUrl = addWorkDriveParams(processedUrl); // Add params
                urlSource = 'WorkDrive_Link (Object)';
                 isDirectImagePreview = isLikelyImage(wdLink); // Check original link for image type
                 console.log(`DocumentItem: Found WorkDrive_Link (Object). Added params.`);
            }
        }

        // Priority 4: File Upload Path (Direct Image or Google Viewer - No WD Params needed here)
        if (!finalPreviewUrl) {
            const rawFileUploadPath = fileUploadPath.value;
            if (rawFileUploadPath && docId.value) {
                if (isImage.value) {
                    finalPreviewUrl = downloadUrl.value; 
                    urlSource = 'Direct Image (File_Upload)';
                    isDirectImagePreview = true;
                    console.log(`DocumentItem: Using direct image URL for preview.`);
                } else {
                    let internalFilePath = null;
                    try {
                        const tempUrl = new URL(processZohoDirectUrl(rawFileUploadPath) || 'https://creator.zoho.com'); 
                        internalFilePath = tempUrl.searchParams.get('filepath');
                    } catch (e) {
                         console.error('DocumentItem: Could not parse filepath:', rawFileUploadPath, e);
                    }
                    if (internalFilePath) {
                        // Use the correct private key for Published_Documents report
                        const privateKey = 'UhfmSC2BxOYMZz8w9jJjPaxFwEpKPuJkg8UZT77YvKzE9ryr2dMABhPG6bVH1SnVtaUbkqxdQsaHyRpQpRB394UAjdg22JmYheVR'; 
                        // Use imported constants for report and field name
                        const zohoPublicDownloadUrl = `https://creatorapp.zohopublic.com/nexgenroofingandsolar/nexgen-portal/report/${REPORT_PUBLISHED_DOCUMENTS}/${docId.value}/${FIELD_DOC_FILE_UPLOAD}/download-file/${privateKey}?filepath=${internalFilePath}`;
                        finalPreviewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(zohoPublicDownloadUrl)}&embedded=true`;
                        urlSource = 'Google Viewer (Public Download URL)';
                        isDirectImagePreview = false;
                        console.log(`DocumentItem: Constructed Google Viewer URL.`);
                    } else {
                        console.log(`DocumentItem: Could not extract internal filepath from: ${rawFileUploadPath}`);
                    }
                }
            }
        }

        // Open preview if we found a URL
        if (finalPreviewUrl) {
             console.log(`DocumentItem: Opening preview using ${urlSource}: ${finalPreviewUrl}`);
             // Pass the correct download URL (which doesn't have WD params)
             modalStore.openPreview(finalPreviewUrl, docName.value, isDirectImagePreview, downloadUrl.value);
        } else {
            console.log(`DocumentItem: No viewable link found for ${docId.value}. Cannot preview.`);
            uiStore.addNotification({ type: 'info', message: 'Preview not available for this document.' });
        }
    };

    const handleWorkDriveUpload = () => {
        if (!docId.value) return;
        emit('trigger-workdrive-upload', { documentId: docId.value });
    };
    
    const handleSendToInvestor = () => {
        if (!docId.value) return;
        emit('trigger-send-investor', { documentId: docId.value });
    };

    const handleViewInWorkDrive = () => {
         const wdLink = doc.value?.WorkDrive_Link?.url?.trim() || (typeof doc.value?.WorkDrive_Link === 'string' ? doc.value.WorkDrive_Link.trim() : null);
         if (wdLink) {
             window.open(processZohoDirectUrl(wdLink), '_blank');
         } else {
              uiStore.addNotification({ type: 'warning', message: 'WorkDrive link not found.' });
         }
    };
    
    const handleDelete = () => {
        if (!docId.value) return;
        emit('delete', { documentId: docId.value, documentName: docName.value });
    };

    const toggleCompareSelection = () => {
        if (!docId.value) return;
        emit('compare-toggle', docId.value);
    };

    const dropdownItems = computed(() => {
        const items = [];
        const wdGroup = { items: [] };
        if (!hasWorkDriveLink.value) {
            wdGroup.items.push({ 
                text: 'Upload to WorkDrive', 
                icon: 'fa-cloud-upload-alt', 
                onClick: handleWorkDriveUpload,
            });
        } else {
            wdGroup.items.push({ text: 'View in WorkDrive', icon: 'fa-folder-open', onClick: handleViewInWorkDrive });
            if (!isSentToInvestor.value && !isSendingToInvestor.value) {
                 wdGroup.items.push({ 
                    text: 'Send to Investor Portal', 
                    icon: 'fa-paper-plane', 
                    onClick: handleSendToInvestor,
                });
            }
        }
        if (wdGroup.items.length > 0) items.push(wdGroup);
        
        const deleteGroup = { items: [] };
        deleteGroup.items.push({ text: 'Delete Document', icon: 'fa-trash-alt text-red-500', onClick: handleDelete });
        items.push(deleteGroup);

        return items;
    });

    return {
        doc,
        docName,
        docTypeName,
        addedTime,
        addedUser,
        hasAnyViewableLink,
        downloadUrl,
        isRevision,
        revisionNumber,
        isSentToInvestor,
        isSendingToInvestor,
        hasWorkDriveLink,
        isImage,
        handleDownloadDocument,
        handleRequestPreview,
        isPreviewLoading,
        isEditing,
        editFormData,
        docTypeOptions,
        startEditing,
        cancelEditing,
        saveEdit,
        dropdownItems,
        handleDelete,
        toggleCompareSelection
    };
  },
  template: `
    <div 
        class="bg-white border-b border-gray-100 flex items-stretch" 
        :class="{ 
            'border-l-4 border-blue-500': isEditing, 
            'ring-2 ring-inset ring-indigo-500': isSelectedForCompare && !isEditing, 
            'hover:bg-gray-50': !isEditing 
        }" 
    >
        <!-- Checkbox Column (Visible in Compare Mode) -->
        <div v-if="isCompareMode && !isEditing" class="pl-4 pr-2 py-4 flex items-center border-r border-gray-100 bg-gray-50">
            <input 
                type="checkbox" 
                :checked="isSelectedForCompare"
                @change="toggleCompareSelection" 
                class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                :aria-label="'Select ' + docName + ' for comparison'"
            />
        </div>
        
        <!-- Display View -->
        <div v-if="!isEditing" class="p-4 flex items-start sm:items-center justify-between gap-4 flex-grow">
            <!-- Left Side: Icon, Name, Status Badges -->
            <div class="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                <div class="flex-shrink-0 w-6 text-center mt-1 sm:mt-0">
                    <button 
                        @click.stop="handleRequestPreview"
                        :disabled="!hasAnyViewableLink || isPreviewLoading"
                        :class="[
                            'text-gray-400 hover:text-blue-600 transition-colors',
                            isPreviewLoading ? 'cursor-wait opacity-50' : 'disabled:opacity-50 disabled:cursor-not-allowed'
                        ]"
                        title="Preview Document"
                    >
                         <i :class="['text-lg', isPreviewLoading ? 'fas fa-spinner fa-spin' : (isImage ? 'fas fa-image' : 'fas fa-eye')]"></i>
                     </button>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate leading-snug" :title="docName">
                        {{ docName }}
                    </p>
                    <!-- Status Badges (Type Badge Removed) -->
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                        <base-badge v-if="isRevision" color="purple" size="xs">
                            Rev {{ revisionNumber }}
                        </base-badge>
                        <base-badge v-if="hasWorkDriveLink" color="green" size="xs">
                             <i class="fas fa-cloud text-xs mr-1"></i> Synced
                         </base-badge>
                        <base-badge v-if="isSentToInvestor" color="indigo" size="xs">
                             <i class="fas fa-paper-plane text-xs mr-1"></i> Sent
                         </base-badge>
                        <base-badge v-if="isSendingToInvestor" color="yellow" size="xs">
                             <i class="fas fa-sync fa-spin text-xs mr-1"></i> Sending...
                         </base-badge>
                    </div>
                </div>
            </div>

            <!-- Right Side: Added Info & Actions -->
            <div class="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 flex-shrink-0">
                <div class="text-right hidden md:block"> 
                    <p class="text-sm text-gray-700">{{ addedTime }}</p>
                    <p class="text-xs text-gray-500">by {{ addedUser }}</p>
                </div>
                <div class="flex items-center gap-1">
                    <base-button 
                        variant="icon-ghost" 
                        size="sm" 
                        @click.stop="handleDownloadDocument" 
                        :disabled="!downloadUrl"
                        title="Download Document"
                        :show-focus-ring="false" 
                     >
                        <i class="fas fa-download"></i> 
                    </base-button>
                    <base-button 
                        variant="icon-ghost" 
                        size="sm" 
                        @click.stop="startEditing" 
                        title="Edit Document"
                        :show-focus-ring="false" 
                     >
                        <i class="fas fa-pencil-alt"></i>
                    </base-button>
                    <!-- More Actions Dropdown -->
                    <base-dropdown 
                        buttonVariant="minimal"
                        placement="right"
                        width="56" 
                        :itemGroups="dropdownItems"
                    />
                 </div>
            </div>
        </div>
        
        <!-- Edit Form View -->
        <div v-else class="p-4 bg-blue-50 border-blue-200 flex-grow">
            <div class="grid grid-cols-1 sm:grid-cols-6 gap-4" @click.stop> 
                <!-- Name -->
                <div class="sm:col-span-6">
                     <base-text-input 
                        label="Document Name"
                        v-model="editFormData.name"
                        placeholder="Enter document name"
                        :required="true"
                        :attrs="{ id: 'doc-name-' + doc.ID }"
                     />
                </div>
                <!-- Type -->
                 <div class="sm:col-span-3">
                    <base-select-menu
                        label="Document Type"
                        v-model="editFormData.typeId"
                        :options="docTypeOptions"
                        placeholder="Select Type (Optional)"
                        :attrs="{ id: 'doc-type-' + doc.ID }"
                        showClearButton
                    />
                </div>
                <!-- Revision Toggle -->
                <div class="sm:col-span-3 flex items-end pb-1">
                     <base-toggle 
                        :modelValue="editFormData.isRevision"
                        @update:modelValue="editFormData.isRevision = $event"
                        :ariaLabel="'Mark as revision'"
                      />
                     <span class="ml-2 text-sm text-gray-700">Is Revision</span>
                 </div>
            </div>
            <!-- Actions -->
             <div class="flex justify-end gap-3 mt-4">
                <base-button variant="secondary" size="sm" @click.stop="cancelEditing" :show-focus-ring="false">Cancel</base-button>
                <base-button variant="primary" size="sm" @click.stop="saveEdit" :loading="documentsStore.isUpdating" :show-focus-ring="false">Save Changes</base-button>
             </div>
        </div>
    </div>
  `
}; 