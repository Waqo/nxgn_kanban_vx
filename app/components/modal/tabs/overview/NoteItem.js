import BaseAvatar from '../../../common/BaseAvatar.js';
import BaseBadge from '../../../common/BaseBadge.js';
// --- Import Modal Store ---
import { useModalStore } from '../../../../store/modalStore.js';
// --- Import UI Store (for potential errors) ---
import { useUiStore } from '../../../../store/uiStore.js';
// --- Import Notes Store ---
import { useNotesStore } from '../../../../store/notesStore.js';
// --- Import User Store ---
import { useUserStore } from '../../../../store/userStore.js';
// --- Import Base Components for Reply --- 
import BaseTextArea from '../../../common/BaseTextArea.js';
import BaseButton from '../../../common/BaseButton.js';

const { computed, ref } = Vue;
const { useTimeAgo } = VueUse;

// --- Constants ---
const ATTACHMENT_LIMIT = 6; // Show first 6 attachments initially

export default {
  name: 'NoteItem',
  components: {
    BaseAvatar,
    BaseBadge,
    // NoteAttachmentPreview removed
    // --- Add Base Components for Reply ---
    BaseTextArea,
    BaseButton
  },
  props: {
    note: {
      type: Object,
      required: true
    },
    replies: {
        type: Array,
        default: () => []
    },
    projectId: {
        type: String,
        required: true
    }
  },
  setup(props) {
    const note = computed(() => props.note);
    const replies = computed(() => props.replies);
    // --- Get Stores ---
    const modalStore = useModalStore();
    const uiStore = useUiStore();
    const notesStore = useNotesStore();
    const userStore = useUserStore();

    // Log initial replies length
  // console.log(`[NoteItem ${note.value.id}] Initial replies count: ${replies.value?.length || 0}`);

    const authorName = computed(() => note.value.author || 'Unknown User');
    
    const timestampRef = computed(() => note.value.addedTime);
    const timeAgo = useTimeAgo(timestampRef);
    
    const noteContent = computed(() => note.value.content || note.value.Note || '');

    const showTeamOnlyBadge = computed(() => note.value.teamOnly);
    const showSalesNotifiedBadge = computed(() => note.value.notifySales && !note.value.teamOnly);

    // Department (only show if not default or empty)
    const department = computed(() => {
        const dept = note.value.department;
        return (dept && dept !== 'Project Management') ? dept : null;
    });

    // Tagged Users
    const taggedUserNames = computed(() => {
        const users = note.value?.taggedUsers;
        if (!Array.isArray(users)) {
            return [];
        }
        return users.map(user => {
            // Explicitly check user and the property value
            const displayName = user?.zc_display_value;
            return (typeof displayName === 'string' ? displayName.trim() : null) || 'Unknown User';
        });
    });

    const attachments = computed(() => note.value?.attachments || []);

    // Split tagged users for display
    const displayedTaggedUsers = computed(() => taggedUserNames.value.slice(0, 4));
    const remainingTaggedUserCount = computed(() => Math.max(0, taggedUserNames.value.length - 4));

    // --- State for Reply Limit ---
    const showAllReplies = ref(false);
    const REPLY_LIMIT = 1;

    // --- State for Attachment Limit ---
    const showAllAttachments = ref(false);

    // --- State for Reply Input ---
    const isReplying = ref(false);
    const replyContent = ref('');
    const isSubmittingReply = ref(false);

    // Computed for limited replies display
    const displayedReplies = computed(() => {
        const all = replies.value || [];
        const limited = all.slice(0, REPLY_LIMIT);
        const result = showAllReplies.value ? all : limited;
      // console.log(`[NoteItem ${note.value.id}] displayedReplies calculated. showAllReplies: ${showAllReplies.value}, Result length: ${result.length}`); // Log computed
        return result;
    });
    const hasMoreReplies = computed(() => (replies.value?.length || 0) > REPLY_LIMIT);

    // --- ADD Computed for Reply Toggle Button Text ---
    const toggleRepliesButtonText = computed(() => {
        const remainingCount = (replies.value?.length || 0) - REPLY_LIMIT;
        return showAllReplies.value ? 'Show Fewer Replies' : `Show ${remainingCount} More ${remainingCount === 1 ? 'Reply' : 'Replies'}`;
    });

    // --- Computed for limited attachments display ---
    const displayedAttachments = computed(() => {
        const all = attachments.value || [];
        // Always slice, the button will be added separately if needed
        return all.slice(0, showAllAttachments.value ? all.length : ATTACHMENT_LIMIT);
    });

    const hasMoreAttachments = computed(() => (attachments.value?.length || 0) > ATTACHMENT_LIMIT);

    // Computed for the text inside the toggle button
    const attachmentToggleText = computed(() => {
        const remainingCount = (attachments.value?.length || 0) - ATTACHMENT_LIMIT;
        return showAllAttachments.value ? 'Less' : `+${remainingCount}`;
    });

    // Toggle function for replies
    const toggleShowAllReplies = () => {
        const oldState = showAllReplies.value;
        showAllReplies.value = !showAllReplies.value;
      // console.log(`[NoteItem ${note.value.id}] toggleShowAllReplies called. State changed from ${oldState} to ${showAllReplies.value}`); // Log toggle
    };

    // --- Toggle function for attachments ---
    const toggleShowAllAttachments = () => {
        showAllAttachments.value = !showAllAttachments.value;
    };

    // --- Toggle Reply Input ---
    const toggleReply = () => {
        isReplying.value = !isReplying.value;
        replyContent.value = ''; // Clear content when toggling
    };

    // --- Submit Reply ---
    const submitReply = async () => {
        const currentUser = userStore.currentUser;
        const localProjectId = props.projectId;

        if (!currentUser?.id || !currentUser?.name) {
            uiStore.addNotification({ type: 'error', message: 'Cannot add reply: User information is missing.' });
            return;
        }
        if (!localProjectId) {
             uiStore.addNotification({ type: 'error', message: 'Cannot add reply: Project ID is missing from note data.' });
             return;
        }
        if (!replyContent.value.trim() || isSubmittingReply.value) {
            return;
        }

        isSubmittingReply.value = true;
        try {
            const success = await notesStore.addNewNote({
                projectId: localProjectId,
                noteContent: replyContent.value, 
                userId: currentUser.id,        
                userName: currentUser.name,      
                teamOnly: false, // Replies default to not team-only 
                parentNoteId: note.value.id, // Pass the parent note ID
                parentNoteAuthor: note.value.author, // Pass the parent note's author name
                attachments: [], // No attachments for replies in this version
                taggedUserIds: [] // No tagging for replies in this version
            });

            if (success) {
                replyContent.value = '';     // Clear input
                isReplying.value = false;  // Close input area
                // Refresh is handled by the store action
            }
        } catch (error) {
            // Error notification handled by store
            console.error('NoteItem: Failed to submit reply', error);
        } finally {
            isSubmittingReply.value = false;
        }
    };

    // --- ADD Attachment Click Handler ---
    const handleAttachmentClick = async (attachment) => {
        if (!attachment?.url) {
            console.warn('Attachment URL is missing', attachment);
            uiStore.addNotification({ type: 'error', message: 'Cannot open attachment: URL missing.', duration: 3000 });
            return;
        }

        const directUrl = attachment.url; // Already processed absolute URL
        const previewTitle = attachment.name || 'Attachment Preview';
        const isImage = attachment.type === 'image';
        // Use the same URL for download for simplicity
        const downloadUrl = directUrl;
        let finalPreviewUrl = null;

        if (isImage) {
            finalPreviewUrl = directUrl;
          // console.log(`NoteItem: Using direct image URL for preview: ${finalPreviewUrl}`);
        } else {
            // Attempt to use Google Viewer for non-images
            let internalFilePath = null;
          // console.log(`[NoteItem] Direct URL for non-image: ${directUrl}`); // Log the URL being parsed
            try {
                // Extract filepath from the direct URL (assuming /api/.../download?filepath=... format)
                const urlObject = new URL(directUrl);
                internalFilePath = urlObject.searchParams.get('filepath');
            } catch (e) {
                console.error('NoteItem: Could not parse filepath from URL:', directUrl, e);
            }

            if (internalFilePath && attachment.id) {
                // Re-use the private key from DocumentItem.js - ** Verify this key is appropriate **
                const privateKey = 'H1SW2ewxhhdTP6ybT21s9FObtFJkV1vxdz2m14gK4f9PeuOWU6agVYTGK1PdH6AdyZxEmXnr6O2Dx9RfRT1SafMeSaeenMuR61g7'; 
                // Use REPORT_NOTE_ATTACHMENTS constant
                const { REPORT_PUBLISHED_NOTE_ATTACHMENTS, FIELD_NOTE_ATTACHMENT_FIELD } = await import('../../../../config/constants.js');
                const zohoPublicDownloadUrl = `https://creatorapp.zohopublic.com/nexgenroofingandsolar/nexgen-portal/report/${REPORT_PUBLISHED_NOTE_ATTACHMENTS}/${attachment.id}/${FIELD_NOTE_ATTACHMENT_FIELD}/download-file/${privateKey}?filepath=${internalFilePath}`;
                finalPreviewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(zohoPublicDownloadUrl)}&embedded=true`;
              // console.log(`NoteItem: Constructed Google Viewer URL: ${finalPreviewUrl}`);
            } else {
                console.warn(`NoteItem: Could not construct Google Viewer URL for non-image. Falling back to direct URL (might not render). Filepath: ${internalFilePath}, ID: ${attachment.id}`);
                finalPreviewUrl = directUrl; // Fallback to direct URL if viewer construction fails
            }
        }

        if (finalPreviewUrl) {
          // console.log(`NoteItem: Calling modalStore.openPreview for ${previewTitle}`);
            // Call modalStore action to open the central preview modal
            modalStore.openPreview(finalPreviewUrl, previewTitle, isImage, downloadUrl, 'noteAttachment');
        } else {
            // This case should ideally not be reached if directUrl exists
            console.error('NoteItem: Failed to determine a final preview URL.');
            uiStore.addNotification({ type: 'error', message: 'Could not determine preview URL.', duration: 3000 });
        }
    };

    return {
        note,
        replies,
        authorName,
        timeAgo,
        timestampRef,
        noteContent,
        showTeamOnlyBadge,
        showSalesNotifiedBadge,
        department,
        taggedUserNames,
        displayedTaggedUsers,
        remainingTaggedUserCount,
        attachments,
        displayedReplies,
        hasMoreReplies,
        showAllReplies,
        toggleShowAllReplies,
        handleAttachmentClick, // Expose new handler
        // --- Expose Attachment Display Computeds/Methods ---
        displayedAttachments,
        hasMoreAttachments,
        attachmentToggleText, // Use the new computed name
        toggleShowAllAttachments,
        // --- Expose Reply State/Methods ---
        isReplying,
        replyContent,
        isSubmittingReply,
        toggleReply,
        submitReply,
        toggleRepliesButtonText
    };
  },
  template: `
    <div>
        <div class="flex space-x-3">
            <!-- Avatar -->
            <div class="relative flex-shrink-0">
                <base-avatar :initials="authorName" size="sm" variant="gray"></base-avatar>
                <!-- Placeholder: Unread Indicator -->
                <span v-if="false" class="absolute -top-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white" title="Unread"></span>
            </div>
            <!-- Content -->
            <div class="flex-1 space-y-1 min-w-0">
                <!-- Header: Author, Dept, Tagged Users, Time -->
                <div class="flex items-center justify-between flex-wrap gap-x-2 gap-y-1"> 
                    <!-- Left Group: Author, Dept -->
                    <div class="flex items-center gap-2 min-w-0">
                        <h3 class="text-sm font-medium text-gray-900 truncate" :title="authorName">{{ authorName }}</h3>
                        <base-badge v-if="department" color="indigo" size="sm">{{ department }}</base-badge>
                    </div>
                    <!-- Middle Group: Tagged Users Pills (Styled like IssueItem) -->
                    <div class="flex items-center gap-1 flex-wrap">
                        <template v-if="taggedUserNames.length > 0">
                            <span v-for="(userName, index) in displayedTaggedUsers" :key="index" class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                                @{{ userName }}
                            </span>
                            <span v-if="remainingTaggedUserCount > 0" class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                                +{{ remainingTaggedUserCount }} more
                            </span>
                        </template>
                    </div>
                    <!-- Right Group: Time -->
                    <p class="text-sm text-gray-500 flex-shrink-0 ml-auto">{{ timeAgo }}</p>
                </div>
                <!-- Note Body -->
                <p class="text-sm text-gray-700 whitespace-pre-wrap break-words">{{ noteContent }}</p>
                
                <!-- Attachments -->
                <div v-if="attachments && attachments.length > 0" class="mt-2">
                    <!-- Attachment Grid -->
                    <div class="flex flex-wrap gap-2">
                        <div 
                            v-for="attachment in displayedAttachments" 
                            :key="attachment.id"
                            @click.prevent="handleAttachmentClick(attachment)" 
                            class="relative group w-16 h-16 border border-gray-200 rounded-md overflow-hidden flex items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                            :title="attachment.name"
                        >
                            <template v-if="attachment.type === 'image'">
                                <img 
                                    :src="attachment.url" 
                                    :alt="attachment.name" 
                                    class="h-full w-full object-cover" 
                                    loading="lazy"
                                    @error="$event.target.style.display='none'; $event.target.nextElementSibling.style.display='flex'" 
                                />
                                <!-- Fallback icon if image fails -->
                                <div class="absolute inset-0 items-center justify-center bg-gray-100" style="display: none;">
                                    <i class="fas fa-image text-gray-400 text-xl"></i>
                                </div>
                            </template>
                            <template v-else>
                                <!-- File Icon Logic -->
                                <i :class="[
                                    'text-2xl',
                                    (attachment.name || '').toLowerCase().endsWith('.pdf') ? 'fas fa-file-pdf text-red-500' : 
                                    (attachment.name || '').toLowerCase().endsWith('.doc') || (attachment.name || '').toLowerCase().endsWith('.docx') ? 'fas fa-file-word text-blue-500' : 
                                    (attachment.name || '').toLowerCase().endsWith('.xls') || (attachment.name || '').toLowerCase().endsWith('.xlsx') ? 'fas fa-file-excel text-green-500' : 
                                    (attachment.name || '').toLowerCase().endsWith('.ppt') || (attachment.name || '').toLowerCase().endsWith('.pptx') ? 'fas fa-file-powerpoint text-orange-500' : 
                                    (attachment.name || '').toLowerCase().endsWith('.zip') || (attachment.name || '').toLowerCase().endsWith('.rar') ? 'fas fa-file-archive text-yellow-500' : 
                                    'fas fa-file text-gray-500'
                                ]"></i>
                            </template>
                            <!-- Optional: Overlay on hover? -->
                            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity"></div>
                        </div>
                        <!-- Inline Show More/Less Button -->
                        <div 
                            v-if="hasMoreAttachments" 
                            @click.prevent="toggleShowAllAttachments"
                            class="w-16 h-16 border border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-colors text-gray-500 hover:text-blue-600"
                            :title="showAllAttachments ? 'Show fewer attachments' : 'Show more attachments'"
                         >
                             <i :class="['fas', showAllAttachments ? 'fa-minus' : 'fa-plus', 'text-lg']"></i>
                             <span class="text-xs mt-1 font-medium">{{ attachmentToggleText }}</span>
                         </div>
                    </div>
                </div>

                <!-- Footer: Badges & Reply Action -->
                <div class="flex items-center justify-between flex-wrap gap-2 text-xs pt-1">
                    <!-- Left Side: Badges -->
                     <div class="flex items-center flex-wrap gap-2">
                         <base-badge v-if="showTeamOnlyBadge" color="purple" size="sm">
                             <i class="fas fa-lock mr-1"></i> Team Only
                         </base-badge>
                         <base-badge v-if="showSalesNotifiedBadge" color="blue" size="sm">
                            <i class="fas fa-users mr-1"></i> Sales Notified
                         </base-badge>
                     </div>
                    <!-- Right Side: Actions (Reply, Mark Read Placeholders) -->
                     <div class="flex items-center gap-3">
                         <!-- Reply Button (only for top-level notes) -->
                         <button 
                            v-if="!note.isReply" 
                            @click="toggleReply"
                            class="text-gray-500 hover:text-blue-600"
                            :title="isReplying ? 'Cancel Reply' : 'Reply to Note'"
                         >
                            <i :class="['far', isReplying ? 'fa-times-circle' : 'fa-comment-dots']"></i>
                            <span class="ml-1">{{ isReplying ? 'Cancel' : 'Reply' }}</span>
                         </button>
                         <button v-if="false" class="text-gray-500 hover:text-blue-600" title="Mark as Read (TBD)">
                            <i class="far fa-envelope-open"></i>
                         </button>
                     </div>
                </div>
            </div>
        </div>

        <!-- Reply Input Area (conditional) -->
        <div v-if="isReplying" class="ml-12 mt-2 pl-4 border-l-2 border-blue-200 pt-2 pb-1">
            <base-text-area
                v-model="replyContent"
                placeholder="Write your reply..."
                rows="2"
                variant="inline-actions"
                class="text-sm"
                :attrs="{ 'aria-label': 'Reply to note' }"
            >
                <template #actions>
                     <div class="flex justify-end w-full">
                         <base-button 
                             @click="submitReply" 
                             size="sm" 
                             variant="primary"
                             :disabled="!replyContent.trim() || isSubmittingReply"
                             :loading="isSubmittingReply"
                         >
                             Submit Reply
                         </base-button>
                     </div>
                </template>
            </base-text-area>
        </div>

        <!-- Replies Section -->
         <div v-if="replies.length > 0" class="ml-8 mt-3 pl-4 border-l-2 border-gray-200 space-y-3">
             <!-- Render displayed replies recursively -->
             <note-item 
                 v-for="reply in displayedReplies" 
                 :key="reply.id" 
                 :note="reply" 
                 :replies="reply.replies || []"
                 :projectId="projectId" 
             />
             <!-- Show More/Less Replies Button -->
             <div v-if="hasMoreReplies" class="pt-2">
                 <button 
                    @click="toggleShowAllReplies" 
                    class="text-xs font-medium text-blue-600 hover:text-blue-800"
                 >
                     {{ toggleRepliesButtonText }}
                 </button>
             </div>
         </div>
    </div>
  `
}; 