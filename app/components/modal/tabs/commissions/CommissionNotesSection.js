const { computed, ref, watchEffect, watch } = Vue;
const { useTimeAgo } = VueUse;

// Import Stores
import { useNotesStore } from '../../../../store/notesStore.js';
import { useUiStore } from '../../../../store/uiStore.js';

// Import Base Components
// Assuming BaseListContainer, BaseTextArea, BaseButton, BaseAvatar are globally registered
// import BaseListContainer from '../../../common/BaseListContainer.js'; 
// import BaseTextArea from '../../../common/BaseTextArea.js';
// import BaseButton from '../../../common/BaseButton.js';
// import BaseAvatar from '../../../common/BaseAvatar.js';

// Import Helpers
import { getInitials } from '../../../../utils/helpers.js';

// --- ADD BaseBadge Import ---
import BaseBadge from '../../../common/BaseBadge.js';

const CommissionNotesSection = {
    name: 'CommissionNotesSection',
    // --- ADD BaseBadge Registration ---
    components: { BaseBadge },
    props: {
        notes: { type: Array, required: true },
        currentUser: { type: Object, required: true },
        projectId: { type: String, required: true }
    },
    setup(props) {
        const notesStore = useNotesStore();
        const uiStore = useUiStore();

        const noteInput = ref('');
        const isAddingNote = ref(false);

        // Original notes from prop - REMOVED
        // const commissionNotesRaw = computed(() => {
        //     // Ensure it always returns an array, even if prop is null/undefined initially
        //     return props.project?.Commission_Notes || []; 
        // });

        // --- REMOVE OLD WATCH EFFECT ---
        // watchEffect(() => {
        //     const notesArray = commissionNotesRaw.value;
        //     console.log(`[CommissionNotesSection Watcher] commissionNotesRaw updated. Count: ${notesArray.length}`, notesArray);
        // });
        // --- END REMOVE OLD WATCH EFFECT ---

        // Helper function for relative time (remains in setup)
        const formatRelativeTime = (dateString) => {
            if (!dateString) return '';
            // useTimeAgo needs a ref, but for a list, we compute it directly
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return 'Invalid Date';
                // Use VueUse directly inside the map isn't ideal for reactivity in computed
                // Calculate difference manually or use a simpler relative time logic if needed
                // For now, stick to the useTimeAgo pattern applied during processing
                const timeAgoInstance = useTimeAgo(ref(date)); // Create instance for calculation
                return timeAgoInstance.value; 
            } catch(e) {
                console.error("Error formatting relative time:", e);
                return 'Error';
            }
        };

        // --- COMBINED Processed notes for the template ---
        const processedCommissionNotes = computed(() => {
            const rawNotes = props.notes || [];
            return rawNotes.map(note => {
                const authorName = note.Author || note.author || 'Unknown User';
                return {
                    ...note, // Spread original note properties
                    // Add pre-calculated fields for the template
                    id: note.ID || note.id, // Ensure consistent ID access
                    authorName: authorName,
                    initials: getInitials(authorName),
                    noteText: note.Note || note.content || '',
                    addedTimeRaw: note.Added_Time || note.addedTime, // Keep raw time if needed for title
                    relativeTimeDisplay: formatRelativeTime(note.Added_Time || note.addedTime)
                };
            });
        });

        // --- REMOVE WATCH EFFECT on computed property ---
        // watchEffect(() => {
        //     const notesArray = processedCommissionNotes.value;
        //     console.log(`[CommissionNotesSection Watcher] processedCommissionNotes updated. Count: ${notesArray.length}`, notesArray);
        // });
        // --- END WATCH EFFECT ---

        // --- REMOVE Direct Watch on props.project.Commission_Notes ---
        // watch(() => props.project?.Commission_Notes, (newNotesArray, oldNotesArray) => {
        //     const count = newNotesArray?.length || 0;
        //     console.log(`[CommissionNotesSection Direct Watcher] props.project.Commission_Notes changed. Count: ${count}`, newNotesArray);
        // }, { deep: true }); 
        // --- END REMOVE DIRECT WATCH ---

        // --- REMOVE Watch on the LENGTH of the array ---
        // watch(() => props.project?.Commission_Notes?.length, (newLength, oldLength) => {
        //     console.log(`[CommissionNotesSection LENGTH Watcher] props.project.Commission_Notes.length changed from ${oldLength} to ${newLength}`);
        // });
        // --- END REMOVE LENGTH WATCH ---

        const handleNoteSubmit = async () => {
            if (!noteInput.value.trim() || isAddingNote.value) return;
            
            if (!props.currentUser?.id || !props.currentUser?.name) {
                uiStore.addNotification({ type: 'error', message: 'Cannot add note: User information missing.'});
                return;
            }
            if (!props.projectId) {
                 uiStore.addNotification({ type: 'error', message: 'Cannot add note: Project ID missing.'});
                 return;
            }

            isAddingNote.value = true;
            try {
                const success = await notesStore.addNewNote({
                    projectId: props.projectId,
                    noteContent: noteInput.value,
                    userId: props.currentUser.id,
                    userName: props.currentUser.name,
                    context: 'Commissions', // Set context explicitly
                    // Omit teamOnly, parentNoteId, attachments, taggedUserIds
                    teamOnly: false // Default to false if backend requires it
                });
                if (success) {
                    noteInput.value = ''; // Clear input on success
                    // Refresh is handled by notesStore action
                }
            } catch (error) {
                // Error notification handled by store
                console.error("CommissionNotesSection: Failed to add note", error);
            } finally {
                isAddingNote.value = false;
            }
        };
        
        return {
            noteInput,
            isAddingNote,
            processedCommissionNotes, // Use processed notes in template
            handleNoteSubmit,
            // getInitials, // Keep if BaseAvatar doesn't handle it
        };
    },
    template: `
        <base-card>
            <template #header>
                 <div class="flex justify-between items-center">
                     <h3 class="text-lg font-medium text-gray-900">Commission Notes</h3>
                     <!-- Replace span with BaseBadge -->
                     <base-badge 
                        v-if="processedCommissionNotes.length > 0" 
                        color="blue"
                        class="font-medium" 
                     >
                         {{ processedCommissionNotes.length }} Note{{ processedCommissionNotes.length !== 1 ? 's' : '' }}
                     </base-badge>
                 </div>
            </template>
            <template #default>
                <!-- Add Note Form -->
                <div class="add-note-section pb-4 mb-4 border-b border-gray-200">
                    <base-text-area
                        v-model="noteInput"
                        placeholder="Add a commission note..."
                        rows="3"
                        variant="inline-actions" 
                        class="text-sm"
                        :disabled="isAddingNote"
                        :attrs="{ 'aria-label': 'New Commission Note' }"
                    >
                        <template #actions>
                            <div class="flex justify-end w-full">
                                <base-button 
                                    @click="handleNoteSubmit" 
                                    size="sm" 
                                    variant="primary"
                                    :disabled="!noteInput.trim() || isAddingNote"
                                    :loading="isAddingNote"
                                >
                                    Add Note
                                </base-button>
                            </div>
                        </template>
                    </base-text-area>
                </div>

                <!-- Notes List -->
                 <base-list-container 
                    v-if="processedCommissionNotes.length > 0" 
                    :items="processedCommissionNotes" // Iterate over processed notes
                    itemKey="id" 
                    :dividers="true"
                    variant="simple"
                    class="max-h-96 overflow-y-auto" 
                 >
                     <template #item="{ item: note }">
                        <div class="flex space-x-3 py-3">
                            <base-avatar :initials="note.initials" size="xs" variant="gray"></base-avatar>
                            <div class="flex-1 space-y-1 min-w-0">
                                <div class="flex items-center justify-between">
                                    <h4 class="text-sm font-medium text-gray-900 truncate">{{ note.authorName }}</h4>
                                    <p class="text-xs text-gray-500 flex-shrink-0 ml-2" :title="note.addedTimeRaw ? new Date(note.addedTimeRaw).toLocaleString() : ''">
                                        {{ note.relativeTimeDisplay }}
                                    </p>
                                </div>
                                <p class="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                    {{ note.noteText }}
                                </p>
                            </div>
                        </div>
                     </template>
                 </base-list-container>
                 <base-empty-states v-else
                    icon="fas fa-dollar-sign"
                    title="No Commission Notes Yet"
                    description="Add notes above to track commission details."
                    class="py-6"
                 />
            </template>
        </base-card>
    `
};

export default CommissionNotesSection; 