import BaseModal from '../common/BaseModal.js';
import BaseButton from '../common/BaseButton.js';
import { useModalStore } from '../../store/modalStore.js';

const { computed } = Vue;

export default {
    name: 'FilePreview',
    components: {
        BaseModal,
        BaseButton
    },
    setup() {
        const modalStore = useModalStore();

        // Map state needed for the preview modal
        const isVisible = computed(() => modalStore.isPreviewVisible);
        const url = computed(() => modalStore.previewUrl);
        const title = computed(() => modalStore.previewTitle);
        const isDirectImage = computed(() => modalStore.previewIsDirectImage);
        const downloadUrl = computed(() => modalStore.previewDownloadUrl);
        // --- Get Preview Context ---
        const previewContext = computed(() => modalStore.previewContext);

        // *** ADDED: Check if Google Viewer is used ***
        const isGoogleViewer = computed(() => {
            return typeof url.value === 'string' && url.value.startsWith('https://docs.google.com/viewer');
        });

        // Method to close the preview
        const close = () => {
            modalStore.closePreview();
        };
        
        // Computed class for iframe to handle different aspect ratios if needed
        // For now, fixed height is set via style
        // const iframeContainerClass = computed(() => {
        //     // Basic aspect ratio check (very rudimentary)
        //     // You might need a more robust way if aspect ratios vary widely
        //     if (url.value && url.value.toLowerCase().endsWith('.pdf')) {
        //         return 'aspect-w-4 aspect-h-5'; // Example for PDF
        //     } 
        //     return 'aspect-w-16 aspect-h-9'; // Default for images/other
        // });

        const handleDownload = () => {
            if (downloadUrl.value) {
                console.log('FilePreview: Triggering download for:', downloadUrl.value);
                window.open(downloadUrl.value, '_blank');
            } else {
                console.warn('FilePreview: Download URL not available.');
                // Optionally show a notification
            }
        };

        return {
            isVisible,
            url,
            title,
            isDirectImage,
            downloadUrl,
            previewContext,
            isGoogleViewer,
            close,
            handleDownload,
            // iframeContainerClass
        };
    },
    template: `
        <base-modal
            :show="isVisible"
            @close="close"
            :title="title || 'File Preview'"
            size="6xl" 
            :z-index="60" 
        >
            <template #default>
                 <div class="relative bg-gray-800 flex items-center justify-center" style="height: 80vh;">
                     <!-- Content Area -->
                     <div v-if="url" class="w-full h-full">
                         <img 
                            v-if="isDirectImage"
                            :src="url"
                            :alt="title || 'Preview'"
                            class="max-h-full max-w-full object-contain mx-auto"
                         />
                         <iframe 
                            v-else
                            :src="url"
                            class="w-full h-full border-0"
                            frameborder="0"
                            allowfullscreen
                         ></iframe>
                     </div>
                     <div v-else class="p-6 text-center text-gray-500">
                         Preview URL is missing or invalid.
                     </div>

                     <!-- *** ADDED: Google Viewer Warning Message *** -->
                     <!-- Default Google Viewer Warning -->
                     <div v-if="isGoogleViewer && previewContext !== 'noteAttachment'" class="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-70 text-white text-xs text-center">
                         Preview not rendering correctly? Upload the document to WorkDrive for a better preview experience (You will need to create project folders first using the button at the top of the tab).
                     </div>
                     <!-- Note Attachment Specific Google Viewer Warning -->
                     <div v-if="isGoogleViewer && previewContext === 'noteAttachment'" class="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-70 text-white text-xs text-center">
                         Preview not rendering correctly? View the file from the Documents tab instead (Note attachments are automatically added there).
                     </div>
                 </div>
            </template>
             <template #footer>
                <div class="flex justify-between w-full items-center">
                    <!-- Optional: Add info about preview source? -->
                    <span v-if="isGoogleViewer" class="text-xs text-gray-500 italic">Using Google Docs Viewer</span>
                    <div class="flex gap-3">
                        <base-button v-if="downloadUrl && previewContext !== 'emailTemplate'" variant="primary" @click="handleDownload">
                            <i class="fas fa-download mr-2"></i> Download
                        </base-button>
                        <base-button variant="secondary" @click="close">Close</base-button>
                    </div>
                </div>
            </template>
        </base-modal>
    `
}; 