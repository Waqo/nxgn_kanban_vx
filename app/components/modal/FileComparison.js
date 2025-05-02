import BaseModal from '../common/BaseModal.js';
import BaseButton from '../common/BaseButton.js';
import { useModalStore } from '../../store/modalStore.js';

const { computed, watch } = Vue;

// --- Re-use helper functions (Consider moving to a shared util file later) ---
function processZohoDirectUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `https://creator.zoho.com${url}`;
  console.warn('Unrecognized Zoho URL format, attempting direct use:', url);
  return url;
}

function isLikelyImage(filename) {
    if (!filename || typeof filename !== 'string') return false;
    const lowerCaseName = filename.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    return imageExtensions.some(ext => lowerCaseName.endsWith(ext));
}

function getInternalFilePath(fileUploadPath) {
    if (!fileUploadPath) return null;
    try {
        const fullUrl = new URL(processZohoDirectUrl(fileUploadPath) || 'https://creator.zoho.com'); 
        return fullUrl.searchParams.get('filepath');
    } catch (e) {
        console.error('Could not parse filepath from File_Upload string:', fileUploadPath, e);
        return null;
    }
}
// --- End Helper Functions ---

export default {
    name: 'FileComparison',
    components: {
        BaseModal,
        BaseButton
    },
    props: {
        allDocuments: { // Receive the full list of documents
            type: Array,
            required: true
        }
    },
    emits: [],
    setup(props) {
        const modalStore = useModalStore();
        const privateKey = 'E1FjUgJFzbAU5Y02f10ADJ6WUCCHwuSOXRsQOSJOkKrrjqAPWQWn2eF65mE4RFnyxO9JMJJ2r8ByQnpvXOaGdTmZTwAHWvxXRxvq';

        const isVisible = computed(() => modalStore.isComparisonVisible);
        const comparisonIds = computed(() => modalStore.comparisonDocIds);

        const doc1 = computed(() => {
            if (comparisonIds.value.length < 1) return null;
            return props.allDocuments.find(d => d.ID === comparisonIds.value[0]);
        });
        const doc2 = computed(() => {
            if (comparisonIds.value.length < 2) return null;
             return props.allDocuments.find(d => d.ID === comparisonIds.value[1]);
        });

        const getPreviewDetails = (doc) => {
            if (!doc) return { url: null, isImage: false, source: 'None' };
            let previewUrl = null;
            let isImage = false;
            let urlSource = 'None';
            const docId = doc.ID;
            const docName = doc.Document_Name;
            const embedLink = doc.Embed_Link?.trim();
            if (embedLink) {
                previewUrl = processZohoDirectUrl(embedLink);
                urlSource = 'Embed Link';
                isImage = isLikelyImage(embedLink);
            }
            if (!previewUrl) {
                const wdLinkVal = doc.WorkDrive_Link;
                const wdLink = wdLinkVal?.url?.trim() || (typeof wdLinkVal === 'string' ? wdLinkVal.trim() : null);
                if (wdLink) {
                    previewUrl = processZohoDirectUrl(wdLink);
                    urlSource = 'WorkDrive Link';
                    isImage = isLikelyImage(wdLink);
                }
            }
            if (!previewUrl) {
                const rawFileUploadPath = doc.File_Upload?.trim();
                if (rawFileUploadPath && docId) {
                    if (isLikelyImage(docName)) {
                        previewUrl = processZohoDirectUrl(rawFileUploadPath);
                        urlSource = 'Direct Image'; 
                        isImage = true;
                    } else {
                        const internalFilePath = getInternalFilePath(rawFileUploadPath);
                        if (internalFilePath) {
                            const zohoPublicDownloadUrl = `https://creatorapp.zohopublic.com/nexgenroofingandsolar/nexgen-portal/report/PM_Kanban_Documents/${docId}/File_Upload/download-file/${privateKey}?filepath=/${internalFilePath}`;
                            previewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(zohoPublicDownloadUrl)}&embedded=true`;
                            urlSource = 'Google Viewer'; 
                            isImage = false; 
                        } else {
                             console.log(`FileComparison: Could not extract internal filepath for doc ${docId}`);
                             urlSource = 'Error: No Path';
                        }
                    }
                }
            }
             console.log(`FileComparison: Preview details for doc ${docId}: Source=${urlSource}, URL=${previewUrl}, IsImage=${isImage}`);
             return { url: previewUrl, isImage, source: urlSource };
        };

        const details1 = computed(() => getPreviewDetails(doc1.value));
        const details2 = computed(() => getPreviewDetails(doc2.value));

        const previewUrl1 = computed(() => details1.value.url);
        const previewUrl2 = computed(() => details2.value.url);
        const isImage1 = computed(() => details1.value.isImage);
        const isImage2 = computed(() => details2.value.isImage);
        const title1 = computed(() => doc1.value?.Document_Name || 'Document 1');
        const title2 = computed(() => doc2.value?.Document_Name || 'Document 2');
        const isGoogleViewer1 = computed(() => details1.value.source === 'Google Viewer');
        const isGoogleViewer2 = computed(() => details2.value.source === 'Google Viewer');

        const close = () => {
            modalStore.closeComparison();
        };
        
        watch(isVisible, (newVal) => {
            console.log('FileComparison: Visibility state changed to', newVal);
        });

        return {
            isVisible,
            previewUrl1,
            previewUrl2,
            isImage1,
            isImage2,
            isGoogleViewer1,
            isGoogleViewer2,
            title1,
            title2,
            close
        };
    },
    template: `
        <base-modal
            :show="isVisible"
            @close="close"
            title="Compare Documents"
            size="full" 
            :z-index="60" 
        >
            <template #default>
                 <!-- Min height ensures content area doesn't collapse -->
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-2" style="min-height: 85vh;"> 
                     <!-- Left Pane -->
                     <div class="border rounded-md flex flex-col bg-gray-100 overflow-hidden">
                         <h4 class="p-2 border-b bg-gray-50 text-sm font-medium truncate text-center flex-shrink-0" :title="title1">{{ title1 }}</h4>
                         <div class="flex-grow relative bg-gray-800 flex items-center justify-center w-full h-full">
                            <span v-if="!previewUrl1" class="text-gray-400 p-4 text-center">Preview not available or failed to load.</span>
                            <img v-else-if="isImage1" :src="previewUrl1" :alt="title1" class="max-h-full max-w-full object-contain w-full h-full"/> 
                            <iframe 
                                v-else
                                :src="previewUrl1" 
                                class="w-full h-full border-0"
                                frameborder="0"
                            ></iframe>
                             <div v-if="isGoogleViewer1" class="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-70 text-white text-xs text-center">
                                Preview may not render correctly. Upload to WorkDrive for best results.
                             </div>
                         </div>
                     </div>
                     
                     <!-- Right Pane -->
                     <div class="border rounded-md flex flex-col bg-gray-100 overflow-hidden">
                          <h4 class="p-2 border-b bg-gray-50 text-sm font-medium truncate text-center flex-shrink-0" :title="title2">{{ title2 }}</h4>
                          <div class="flex-grow relative bg-gray-800 flex items-center justify-center w-full h-full">
                            <span v-if="!previewUrl2" class="text-gray-400 p-4 text-center">Preview not available or failed to load.</span>
                             <img v-else-if="isImage2" :src="previewUrl2" :alt="title2" class="max-h-full max-w-full object-contain w-full h-full"/>
                              <iframe 
                                  v-else
                                  :src="previewUrl2" 
                                  class="w-full h-full border-0"
                                  frameborder="0"
                              ></iframe>
                               <div v-if="isGoogleViewer2" class="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-70 text-white text-xs text-center">
                                  Preview may not render correctly. Upload to WorkDrive for best results.
                               </div>
                          </div>
                     </div>
                 </div>
            </template>
             <template #footer>
                <base-button variant="secondary" @click="close">Close Comparison</base-button>
            </template>
        </base-modal>
    `
}; 