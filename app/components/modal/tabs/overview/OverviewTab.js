// app/components/modal/tabs/overview/OverviewTab.js

// Import necessary Base components later (e.g., BaseCard, BaseFeed, BaseButton)

import BaseCard from '../../../common/BaseCard.js';
import BaseFeed from '../../../common/BaseFeed.js';
import BaseButton from '../../../common/BaseButton.js';
import BaseTextArea from '../../../common/BaseTextArea.js';
import BaseAvatar from '../../../common/BaseAvatar.js';
import BaseBadge from '../../../common/BaseBadge.js';
import BaseCombobox from '../../../common/BaseCombobox.js';

// Import Pinia store and helpers if needed directly (e.g., for user info)
import { useUserStore } from '../../../../store/userStore.js';
import { useProjectsStore } from '../../../../store/projectsStore.js';
import { useLookupsStore } from '../../../../store/lookupsStore.js';
// --- ADD notesStore Import ---
import { useNotesStore } from '../../../../store/notesStore.js';
// const { mapState } = Pinia;

// --- ADD Vue Imports ---
const { computed, ref, onMounted, onBeforeUnmount } = Vue;
// --- ADD Helper Imports ---
const { useDateFormat } = VueUse; 

// --- ADD NoteItem Import ---
import NoteItem from './NoteItem.js';
// --- ADD IssueItem Import ---
import IssueItem from './IssueItem.js';
// --- ADD EventItem Import ---
import EventItem from './EventItem.js';
// --- ADD LatestActivityPreview Import ---
import LatestActivityPreview from './LatestActivityPreview.js';

// --- ADD Pinia Store Import ---
import { useModalStore } from '../../../../store/modalStore.js'; 
// --- ADD UI Store for Notifications ---
import { useUiStore } from '../../../../store/uiStore.js';

const OverviewTab = {
    name: 'OverviewTab',
    components: {
        // Register components like BaseCard, BaseFeed, etc. here when needed
        BaseCard,
        BaseFeed,
        BaseButton,
        BaseTextArea,
        BaseAvatar,
        BaseBadge,
        NoteItem,
        IssueItem,
        EventItem,
        LatestActivityPreview, // --- Register LatestActivityPreview ---
        BaseCombobox // Register BaseCombobox
    },
    // Define the project prop
    props: {
        project: { 
            type: Object, 
            required: true 
        }
    },
    // --- Use setup() instead of computed/methods ---
    setup(props) {
        // --- Get Store Instances --- 
        const modalStore = useModalStore();
        const uiStore = useUiStore(); // Instantiate UI store
        const userStore = useUserStore(); // <-- ADDED
        const projectsStore = useProjectsStore(); // <-- ADDED
        const lookupsStore = useLookupsStore(); // <-- ADDED
        // --- ADD notesStore Instance ---
        const notesStore = useNotesStore();

        // --- Component State Refs ---
        const newNoteContent = ref('');
        const newNoteTeamOnly = ref(false);
        const showAllNotes = ref(false); // State for note limit
        const NOTE_LIMIT = 5; // Define the limit
        // --- ADD Issue Refs ---
        const newIssueContent = ref('');
        const newIssueNotifySales = ref(false);
        const isSubmittingIssue = ref(false); // Loading state for submit
        const newIssueSelectedUsers = ref([]); // --- ADD Ref for tagged users --- 
        const showRaiseIssueForm = ref(false); // State to control form visibility
        // --- ADD Loading State Ref ---
        const isAddingNote = ref(false);
        // --- ADD Ref for Note Tagged Users ---
        const newNoteSelectedUsers = ref([]); 
        // --- ADD Attachment Refs ---
        const attachments = ref([]);
        const isDragging = ref(false);
        const fileInputRef = ref(null);
        // Temporary store for object URLs to revoke later
        const objectUrls = ref(new Map()); 

        // Reactive project prop
        const project = computed(() => props.project);

        // Computed properties for data lists (add nullish check)
        const notes = computed(() => project.value?.General_Notes || []); 
        const unresolvedIssues = computed(() => (project.value?.Issues || []).filter(i => i.Is_Resolved === 'false'));
        const events = computed(() => project.value?.Events || []);

        // Computed for limited notes display
        const displayedNotes = computed(() => {
            return showAllNotes.value ? notes.value : notes.value.slice(0, NOTE_LIMIT);
        });
        const hasMoreNotes = computed(() => notes.value.length > NOTE_LIMIT);

        // --- ADDED: Computed property for button text ---
        const toggleNotesButtonText = computed(() => {
            if (showAllNotes.value) {
                return 'Show Less Notes';
            } else {
                const remainingCount = notes.value.length - NOTE_LIMIT;
                return `Show ${remainingCount} More Notes`;
            }
        });
        // --- END ADDED ---

        // --- ADD Computed for user options for tagging (uses store getter) ---
        const userTaggingOptions = computed(() => {
            // Directly use the getter from the lookupsStore
            return lookupsStore.usersForTagging || []; 
        });
        
        // --- ADD Computed for loading state for users ---
        const isLoadingUsersForTagging = computed(() => lookupsStore.isLoadingTeamUsers);

        // --- ADD Fetch Team Users on Mount ---
        onMounted(() => {
            console.log("OverviewTab: Fetching team users on mount...");
            lookupsStore.fetchTeamUsers();
        });
        // --- END ADD ---

        // Placeholder methods (will be implemented later)
        const addNote = async () => {
            // Get current user - ensure currentUser is available
            const currentUser = userStore.currentUser;
            if (!currentUser?.id || !currentUser?.name) {
                uiStore.addNotification({ type: 'error', message: 'Cannot add note: User information is missing.' });
                return;
            }

            if (!newNoteContent.value.trim() && attachments.value.length === 0) return; // Check attachments here too

            // --- Grab attachments BEFORE async call --- 
            const filesToUpload = [...attachments.value]; // Create a copy
            // ----------------------------------------------------------------

            isAddingNote.value = true;
            try {
                // Extract tagged user IDs
                const taggedUserIds = Array.isArray(newNoteSelectedUsers.value) 
                    ? newNoteSelectedUsers.value.map(user => user.value) // Assuming user object has { label: 'Name', value: 'ID' }
                    : [];

                const success = await notesStore.addNewNote({
                    projectId: project.value.ID,
                    noteContent: newNoteContent.value,
                    userId: currentUser.id,
                    userName: currentUser.name,
                    teamOnly: newNoteTeamOnly.value,
                    attachments: filesToUpload, 
                    taggedUserIds: taggedUserIds // Pass extracted IDs
                });

                if (success) {
                    // Clear form on success
                    newNoteContent.value = '';
                    newNoteTeamOnly.value = false;
                    newNoteSelectedUsers.value = []; // Clear selected users
                }
            } catch (error) {
                // Error notification is handled in the store action
                console.error("OverviewTab: Failed to add note", error);
            } finally {
                // --- Clear local UI state AFTER attempt completes --- 
                attachments.value = []; 
                objectUrls.value.forEach(URL.revokeObjectURL); 
                objectUrls.value.clear(); 
                // --------------------------------------------------
                isAddingNote.value = false;
            }
        };
        // REMOVE old raiseIssue placeholder
        // const raiseIssue = () => {
        //     // Replace alert with notification
        //     uiStore.addNotification({ type: 'info', message: 'Raise Issue functionality not implemented yet.' });
        // };
        
        // --- ADD submitNewIssue method ---
        const submitNewIssue = async () => {
            if (!newIssueContent.value.trim() || isSubmittingIssue.value) return;
            
            isSubmittingIssue.value = true;
            try {
                // Extract IDs from selected user objects
                const taggedUserIds = newIssueSelectedUsers.value.map(user => user.value);
                
                // User tagging deferred for simplicity
                await projectsStore.addProjectIssue({
                    projectId: project.value.ID,
                    issueContent: newIssueContent.value.trim(),
                    notifySales: newIssueNotifySales.value,
                    taggedUserIds: taggedUserIds 
                });
                // Success: Clear form and refresh modal
                newIssueContent.value = '';
                newIssueNotifySales.value = false;
                newIssueSelectedUsers.value = []; // Clear selected users
                showRaiseIssueForm.value = false; // Hide form after success
                await modalStore.refreshModalData(); 
            } catch (error) {
                // Error notification is handled in the store action
                console.error("OverviewTab: Failed to submit issue", error);
            } finally {
                isSubmittingIssue.value = false;
            }
        };

        // --- ADD cancelNewIssue method ---
        const cancelNewIssue = () => {
            newIssueContent.value = '';
            newIssueNotifySales.value = false;
            newIssueSelectedUsers.value = [];
            showRaiseIssueForm.value = false; // Hide form
        };

        // Toggle function for notes
        const toggleShowAllNotes = () => {
            showAllNotes.value = !showAllNotes.value;
        };

        // --- ADD Attachment Handling Methods ---
        const handleFileChange = (event) => {
            addFiles(event.target.files);
            // Clear the input value so the same file can be selected again
            if (event.target) {
                event.target.value = null;
            }
        };

        const handleDragOver = (event) => {
            event.preventDefault(); // Necessary to allow drop
            if (!isDragging.value) {
                isDragging.value = true;
            }
        };

        const handleDragLeave = (event) => {
            // Check if the leave target is outside the drop zone
            if (!event.currentTarget.contains(event.relatedTarget)) {
                isDragging.value = false;
            }
        };

        const handleFileDrop = (event) => {
            event.preventDefault();
            isDragging.value = false;
            addFiles(event.dataTransfer.files);
        };

        const addFiles = (fileList) => {
            if (!fileList) return;
            // Simple validation (can be expanded)
            const newFiles = Array.from(fileList).filter(file => file instanceof File);
            // Generate Object URLs for image previews
            newFiles.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const url = URL.createObjectURL(file);
                    objectUrls.value.set(file, url); // Store URL with file object as key
                }
            });
            attachments.value = [...attachments.value, ...newFiles];
            // Log for debugging
            console.log("Files added:", attachments.value);
            console.log("Object URLs:", objectUrls.value);
        };

        const removeAttachment = (indexToRemove) => {
            const fileToRemove = attachments.value[indexToRemove];
            if (fileToRemove) {
                 // Revoke Object URL if it exists for this file
                 if (objectUrls.value.has(fileToRemove)) {
                     URL.revokeObjectURL(objectUrls.value.get(fileToRemove));
                     objectUrls.value.delete(fileToRemove);
                     console.log("Revoked URL for:", fileToRemove.name);
                 }
                 attachments.value.splice(indexToRemove, 1);
            }
        };

        // --- ADD Lifecycle Hook for Cleanup ---
        onBeforeUnmount(() => {
            console.log("OverviewTab unmounting. Revoking object URLs...");
            // Revoke any remaining object URLs
            objectUrls.value.forEach((url, file) => {
                console.log("Revoking URL for:", file.name);
                URL.revokeObjectURL(url);
            });
            objectUrls.value.clear();
        });

        // Expose necessary refs and functions to the template
        return {
            project,
            notes,
            unresolvedIssues,
            events,
            addNote, 
            // REMOVE raiseIssue
            setActiveTab: modalStore.setActiveTab,
            // --- Expose New Refs ---
            newNoteContent,
            newNoteTeamOnly,
            displayedNotes,
            hasMoreNotes,
            showAllNotes,
            toggleShowAllNotes,
            toggleNotesButtonText, // --- Expose new computed ---
            // --- Expose Issue Refs/Methods ---
            newIssueContent,
            newIssueNotifySales,
            isSubmittingIssue,
            newIssueSelectedUsers,
            submitNewIssue,
            userTaggingOptions,
            isLoadingUsersForTagging,
            showRaiseIssueForm, // Expose new state
            cancelNewIssue, // Expose cancel method
            // --- Expose isAddingNote ---
            isAddingNote, 
            // --- Expose Note Tagged Users State ---
            newNoteSelectedUsers,
            // --- Expose Attachment Refs/Methods ---
            attachments,
            isDragging,
            fileInputRef,
            handleFileChange,
            handleDragOver,
            handleDragLeave,
            handleFileDrop,
            removeAttachment,
            objectUrls // Expose map for template img src binding
        };
    },
    template: `
        <div class="overview-tab-content space-y-6"> <!-- Add spacing for elements outside the grid -->
            <!-- Grid for top sections -->
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <!-- Left Column: Events Only -->
                <div class="lg:col-span-3 space-y-6">
                    <!-- Events Section -->
                    <base-card>
                        <template #header>
                            <h3 class="text-lg font-medium text-gray-900">Events</h3>
                        </template>
                        <template #default>
                            <!-- Events List -->
                            <ul v-if="events?.length > 0" role="list" class="divide-y divide-gray-200">
                                <li v-for="event in events" :key="event.id" class="py-3">
                                    <event-item :event="event" />
                                </li>
                            </ul>
                            <div v-else class="p-4 text-center text-gray-500">
                                No events found.
                            </div>
                        </template>
                    </base-card>
                </div>
    
                <!-- Right Column: SalesRep, Issues & Activity Preview -->
                <div class="lg:col-span-2 space-y-6">
                    <!-- Sales Rep Info Card -->
                    <!-- SalesRepInfoCard removed from here -->
    
                    <!-- Issues Section (Moved Here) -->
                    <base-card>
                        <template #header>
                            <div class="flex justify-between items-center">
                                <h3 class="text-lg font-medium text-gray-900">Issues</h3>
                                <!-- Show "Raise Issue" button only when form is hidden -->
                                <base-button 
                                    v-if="!showRaiseIssueForm"
                                    @click="showRaiseIssueForm = true"
                                    variant="secondary" 
                                    size="sm"
                                    leading-icon="fas fa-plus"
                                >
                                    Raise Issue
                                </base-button>
                            </div>
                        </template>
                        <template #default>
                            <!-- ADD Inline Raise Issue Form (Conditional) -->
                            <div v-if="showRaiseIssueForm" class="add-issue-section border-b border-gray-200 pb-4 mb-4">
                                <base-text-area 
                                    v-model="newIssueContent" 
                                    placeholder="Describe the issue..."
                                    rows="2"
                                    :disabled="isSubmittingIssue"
                                    variant="inline-actions"
                                >
                                    <!-- Actions Slot -->
                                    <template #actions>
                                        <!-- Row 1: Tagging Combobox -->
                                        <div class="w-full mb-2"> 
                                            <base-combobox
                                                :multiple="true"
                                                :options="userTaggingOptions"
                                                v-model="newIssueSelectedUsers"
                                                placeholder="Tag users..."
                                                :disabled="isSubmittingIssue || isLoadingUsersForTagging"
                                                :loading="isLoadingUsersForTagging"
                                                labelKey="label"
                                                valueKey="value"
                                                :clearable="true"
                                                class="w-full" // Use full width
                                            />
                                        </div>
                                        <!-- Row 2: Checkbox and Submit Button -->
                                        <div class="w-full flex items-center justify-between">
                                            <div class="flex items-center">
                                                <input id="issueNotifySalesCheckbox" type="checkbox" v-model="newIssueNotifySales" :disabled="isSubmittingIssue" class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                                                <label for="issueNotifySalesCheckbox" class="ml-2 block text-sm text-gray-700">Notify Sales</label>
                                            </div>
                                            <div class="flex-shrink-0 flex items-center gap-2">
                                                <base-button @click="cancelNewIssue" size="sm" variant="secondary-light">Cancel</base-button>
                                                <base-button @click="submitNewIssue" size="sm" variant="primary" :disabled="!newIssueContent.trim() || isSubmittingIssue" :loading="isSubmittingIssue">Submit Issue</base-button>
                                            </div>
                                        </div>
                                    </template>
                                </base-text-area>
                            </div>

                            <!-- Issues List -->
                            <ul v-if="unresolvedIssues?.length > 0" role="list" class="space-y-4">
                                <li v-for="issue in unresolvedIssues" :key="issue.ID || issue.id" class="col-span-1">
                                    <issue-item :issue="issue" />
                                </li>
                            </ul>
                            <div v-else class="text-center text-gray-500 py-4">
                                No open issues reported.
                            </div>
                        </template>
                    </base-card>

                    <!-- Latest Activity Preview -->
                    <latest-activity-preview 
                        :activities="project?.Activities" 
                        :set-active-tab="setActiveTab"
                    />
                </div>
            </div>
            <!-- End of Grid -->

            <!-- Notes Section (Full Width Below Grid) -->
            <base-card>
                <template #header>
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-medium text-gray-900">Notes</h3>
                        <!-- Placeholder for Read Status Filters/Actions -->
                        <div class="flex items-center gap-2">
                            <base-button size="xs" variant="secondary-light" disabled title="Filter Unread (TBD)">
                                <i class="far fa-envelope mr-1"></i> Filter Unread
                            </base-button>
                            <base-button size="xs" variant="secondary-light" disabled title="Mark All Read (TBD)">
                                <i class="far fa-check-double mr-1"></i> Mark All Read
                            </base-button>
                        </div>
                    </div>
                </template>
                <template #default>
                    <!-- Add Note Section - Styled -->
                    <div 
                        class="add-note-section mb-4 relative transition-all duration-200 ease-in-out border rounded-lg"
                        :class="{
                            'border-blue-500 border-dashed bg-blue-50': isDragging,
                            'border-gray-200': !isDragging
                        }"
                        @dragover.prevent="handleDragOver"
                        @dragenter.prevent="handleDragOver" 
                        @dragleave="handleDragLeave"
                        @drop.prevent="handleFileDrop"
                    >
                        <base-text-area 
                            v-model="newNoteContent" 
                            placeholder="Add a new note... (drag & drop files here)" 
                            rows="3"
                            variant="inline-actions" 
                            class="rounded-t-lg" 
                        >
                            <!-- Actions Slot -->
                            <template #actions>
                                <div class="flex items-center justify-between w-full flex-wrap gap-2">
                                    <!-- Left side actions: Attach, Tag, Team Only -->
                                    <div class="flex items-center space-x-3 flex-wrap gap-y-1">
                                        <!-- Attach Button -->
                                        <button 
                                            type="button" 
                                            @click="() => fileInputRef?.click()" 
                                            class="group -my-2 -ml-2 inline-flex items-center rounded-full px-3 py-2 text-left text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            title="Attach files"
                                        >
                                            <i class="fas fa-paperclip -ml-1 mr-2 h-5 w-5 group-hover:text-gray-500"></i>
                                            <span class="text-sm italic text-gray-500 group-hover:text-gray-600 hidden sm:inline">Attach file</span>
                                        </button>
                                        <!-- Tag Users Button (Placeholder - Combobox will go here) -->
                                        <div class="flex-grow min-w-[150px]"> <!-- Allow combobox to take space -->
                                            <base-combobox
                                                :multiple="true"
                                                :options="userTaggingOptions" 
                                                v-model="newNoteSelectedUsers" 
                                                placeholder="Tag users..."
                                                :disabled="isAddingNote || isLoadingUsersForTagging"
                                                :loading="isLoadingUsersForTagging"
                                                labelKey="label" 
                                                valueKey="value"
                                                :clearable="true"
                                                class="w-full text-sm" 
                                                aria-label="Tag users for note"
                                                :attrs="{ id: 'note-user-tagging-' + project.ID }" 
                                            />
                                        </div>
                                        <!-- Team Only Checkbox -->
                                        <div class="flex items-center pl-2 sm:pl-0">
                                            <input id="teamOnlyCheckbox" type="checkbox" v-model="newNoteTeamOnly" class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                                            <label for="teamOnlyCheckbox" class="ml-2 block text-sm text-gray-700">Team Only</label>
                                        </div>
                                    </div>
                                    <!-- Right side action: Submit Button -->
                                    <div class="flex-shrink-0">
                                        <base-button @click="addNote" size="sm" variant="primary" :disabled="(!newNoteContent.trim() && (!attachments || attachments.value?.length === 0)) || isAddingNote" :loading="isAddingNote">Add Note</base-button>
                                    </div>
                                </div>
                            </template>
                        </base-text-area>

                        <!-- Attachment Previews -->
                        <div v-if="attachments.length > 0" class="px-3 pb-2 border-t border-gray-200">
                            <p class="text-xs font-medium text-gray-500 pt-2 pb-1">Attachments:</p>
                            <div class="flex flex-wrap gap-2">
                                <div 
                                    v-for="(file, index) in attachments" 
                                    :key="file.name + '-' + file.lastModified" 
                                    class="relative group h-16 w-16 border border-gray-300 rounded-md overflow-hidden flex items-center justify-center bg-gray-100"
                                    :title="file.name"
                                >
                                    <!-- Image Preview -->
                                    <img 
                                        v-if="file.type.startsWith('image/') && objectUrls.get(file)"
                                        :src="objectUrls.get(file)" 
                                        :alt="file.name" 
                                        class="h-full w-full object-cover" 
                                        loading="lazy"
                                        @error="(e) => { e.target.style.display='none'; e.target.nextElementSibling.style.display='flex'; }" 
                                    />
                                    <!-- Fallback Icon Container (for images that failed or non-images) -->
                                    <div 
                                        class="absolute inset-0 flex items-center justify-center"
                                        :style="{ display: (file.type.startsWith('image/') && objectUrls.get(file)) ? 'none' : 'flex' }" 
                                    >
                                        <i 
                                            :class="[
                                                'text-2xl', 
                                                file.type.startsWith('image/') ? 'fas fa-image text-gray-400' : 
                                                file.name.toLowerCase().endsWith('.pdf') ? 'fas fa-file-pdf text-red-400' : 
                                                'fas fa-file text-gray-400'
                                            ]"
                                        ></i>
                                    </div>
                                    <!-- Remove Button -->
                                    <button 
                                        @click="removeAttachment(index)" 
                                        class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-600"
                                        title="Remove attachment"
                                    >
                                        &times;
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Hidden File Input -->
                        <input type="file" multiple ref="fileInputRef" @change="handleFileChange" class="hidden" accept="*/*">

                        <!-- Drag Overlay -->
                        <div 
                            v-if="isDragging"
                            class="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center rounded-lg pointer-events-none"
                        >
                            <p class="text-blue-700 font-semibold">Drop files to attach</p>
                        </div>
                    </div>
                    
                    <!-- Notes List (Iterate over displayedNotes) -->
                    <ul v-if="notes?.length > 0" role="list" class="divide-y divide-gray-200">
                        <li v-for="note in displayedNotes" :key="note.id" class="py-4"> 
                            <note-item :note="note" :replies="note.replies || []" :projectId="project?.ID" /> 
                        </li>
                    </ul>
                    <div v-else class="text-center text-gray-500 py-4">
                        No general notes added yet.
                    </div>

                    <!-- Show More/Less Button -->
                    <div v-if="hasMoreNotes" class="mt-4 text-center">
                        <button @click="toggleShowAllNotes" class="text-sm font-medium text-blue-600 hover:text-blue-800">
                            {{ toggleNotesButtonText }}
                        </button>
                    </div>
                </template>
            </base-card>
        </div>
    `
};

export default OverviewTab; 